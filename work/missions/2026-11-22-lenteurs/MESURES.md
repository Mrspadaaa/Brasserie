# Lenteurs — mesures du 22.11 (build de production du tag `en-ligne/2026-11-22-tour9`)

Aucun code de l'app touché. Builds extraits par `git archive` dans `%TEMP%/lenteurs-22-11-b/` (tour9 et tour7 `en-ligne/2026-11-21-tour7`), minifiés,
config `scripts/parcours/vite.parcours.config.mjs` (fixtures, jamais seedData). 390×844 tactile, CPU ×4, Chrome headless, fixtures ZZ TEST.
Poste partagé : charge CPU 11 à 47 % avant les tours. A/B alterné (ordre inversé un tour sur deux), 5 tours, médiane (min–max).
Outils : `outils/` ; chiffres bruts : `donnees/`.

## État de l'art (L29)
- Problème type : mesurer la réactivité d'une interface (INP) et trouver la cause d'une tâche longue (« long task », forced reflow / layout thrashing,
  recalcul de style).
- Examiné : Event Timing (INP, `interactionId`), Long Tasks et Long Animation Frames (LoAF, appelants de script), profil CPU V8 par CDP
  (`Profiler.start`), trace DevTools (`devtools.timeline`), Lighthouse/web-vitals (mesure de terrain, pas un geste rejoué), React Profiler
  (indisponible sur un build de production sans `profiling` ; le profil V8 sur build non minifié donne les mêmes noms de composants).
- Décision : INP + longtask + LoAF (déjà dans `scripts/parcours/lenteur.mjs`, reprise telle quelle) ; profil V8 sur un build non minifié de tour9
  (`--minify false`) pour nommer la fonction ; aucune mesure maison du « temps au calme » comme critère (le banc WF* l'utilisait : conservé en
  information seulement). Pas de rustine : une mesure, un remède standard par cause.

## 1. CAL-LENT — ROUGE sur tour9 (9 échecs sur 9 actions rejouées)
`node scripts/parcours/lenteur.mjs … --build <tour9> --sans-trace`, 5 tours alternés avec tour7 (`donnees/agg-lenteur.txt`).
Règle : INP ≤ 200 ms ; aucune tâche > 100 ms pendant un glisser.

| action | tour7 INP | tour9 INP | tour9 tâche max | verdict tour9 |
|---|---|---|---|---|
| toucher une semaine | 880 (752–1008) | **752** (720–832) | 636 | ROUGE (−15 %) |
| glisser la frise | 1136 (1112–1328) | **688** (448–824) | 463 | ROUGE (−40 %) |
| glisser une barre | 904 (664–1072) | **408** (112–424) | 338 | ROUGE (−55 %) |
| lire la courbe au doigt | 24 (16–32) | **336** (256–392) | 277 | ROUGE, **régression** (tour7 ne lisait pas ?) |
| cacher la courbe | 184 | 104 (32–120) | 58 | vert |
| ouvrir / Modifier / Enregistrer un événement | non rejouable : « Marché de Noël » absent de la fenêtre (le glisser de la frise la réduit à 3 sem.) 3 à 4 tours sur 5 | 1er tour valide : 104 · 440 · 616 | 361 · 579 | ROUGE (Modifier, Enregistrer) |

Le contrôle lui-même est fragile sur tour9 : après le glisser de la frise la période reste à « 3 sem. » et les 3 dernières actions cherchent un
événement hors fenêtre. À corriger côté parcours (`menuDuree('3 mois')` avant « evenement-ouvrir »), sans quoi il échoue pour une autre cause.

## 2. Gestes WF* remesurés (CPU ×4, fixture de la passe 2, `outils/pas/*.txt`, `donnees/agg-pas.txt`)
INP médian tour9 (tour7 entre parenthèses ; « — » = le geste n'existe pas ou échoue dans tour7).
- WFP-9 Calendrier : déplier S49 **160**, Poser un brassin **560**, Ajouter en **664**, Noter une idée **488**, Noter **472**, Recette **624** (tour7 168),
  Bord→Calendrier 40, Atelier (libellé non retrouvé). Les anciens 829 à 1 141 ms mesuraient « du toucher au calme » ; l'INP est plus court.
- WFA-16 / WFA-11 onglets : Stocks (1re ouverture) 132 (48–400), Calendrier 40, Finances 80, Brassins 64, Clients 48 : **tous sous 200 ms** ; les
  1,0 à 1,4 s relevés étaient « jusqu'au calme » (pas l'INP). Reste : la 1re ouverture de Stocks peut monter à 400 ms (morceau chargé à la demande).
- WFV-16 Vente : ouvrir Vente 168, 2e fût 128, Facturer 208 (216 en tour7) ; « OK » après facture : bouton non retrouvé (banc), non remesuré.
  568 et 408 ms non reproduits sur cette fixture.
- WF2-3 : ouvrir la fiche brassin 40, Commencer le brassage **500** (456–544, 2 essais valides sur 5 ; tour7 324). Dossier/Budget/étalonnage : libellés
  de la fixture absents, non remesurés.
- WF2-4 Recherche : 7 frappes de « Cigogne », INP max 96–128 ms (5 tours) : 552 ms non reproduit (fixture petite).
- WFR-8 (Eau→Récap, Enregistrer et préparer) et T2B-3 (retour Levure) : non rejoués (parcours d'éditeur, fixture à bâtir). Voir REPRISE.md.

## 3. Les 5 pires gestes, cause mesurée et remède
Profil V8 (200 µs) sur build non minifié de tour9 : `donnees/profil-*.txt` (un profil par fichier de pas, donc **agrégé sur la séquence**, pas par geste).

1. **Toucher une semaine (INP 752)** et 2. **glisser la frise (688)** (et la barre 408, la lecture de courbe 336) : `mesurerTraits` de
   `src/ui/calendrier/frise/Frise.tsx` (l. 253, `useLayoutEffect(() => { mesurerTraits(); })` sans dépendances, donc à chaque rendu) lit
   `getBoundingClientRect` de toutes les rangées dans le commit : 510 ms de 832 pour « semaine » (61 %, profil minifié du 1er tour),
   `getBoundingClientRect` 279 ms + fonctions `yt`/`Sd` 660 ms pour la frise. C'est une mise en page forcée (layout thrashing), pas du rendu React.
   Remède standard : lire les rectangles hors du commit (ResizeObserver + rAF, déjà là l. 263), n'exécuter l'effet que si l'une de ses entrées
   change, `React.memo` du `<svg.cal-traits>`, lire puis écrire en deux lots. Gain estimé −50 % (la tâche max passe sous 300 ms ; sous 100 ms
   demande aussi de ne pas recalculer pendant le glisser). Risque : traits décalés d'une image (contrôles de captures du Calendrier).
3. **Ajouter en (664)**, **Recette (624)**, **Poser un brassin (560)**, **Noter une idée (488)** : ouvertures et validations de feuilles. Profil Calendrier,
   26 % du temps actif : `ancestorsShown` (PageShell `pageVisibilityCheck`, `getComputedStyle` sur chaque ancêtre ; la Map est recréée à chaque appel,
   donc aucun cache entre deux éléments) 10 %, `focus()` de `focusPage` (PageShell) 8 %, `focus()` de Radix FocusScope 8 %, plus `measure` du hook
   visualViewport 4 %. Les `focus()` forcent un recalcul de style du document (cause déjà tracée par la session 6 : `pointer-events` posé sur le
   `body` par Radix, héritée). Remèdes standards : cache de visibilité hissé hors de `pageVisibilityCheck` (une Map par ouverture, invalidée à la
   fermeture) et sortie dès le premier focusable valide ; `focus` après la peinture (rAF) ; `.cal-tab { pointer-events: auto }` pour borner l'héritage ;
   charger la feuille à l'avance (`import()` au survol/idle). Gain estimé −150 à −250 ms par feuille. Risque : piège de focus (accessibilité),
   retesté par les parcours.
4. **Recette (624, tour7 168, ×3,7)** : régression entre tour7 et tour9, la feuille « Recette » charge un morceau (`yeastReferences`, vu en LoAF
   du « Enregistrer ») ; à profiler seul (geste isolé), remède probable : chargement anticipé et calcul hors rendu.
5. **Commencer le brassage (500)** : `mesurer` de `BrewDayPage` (`getBoundingClientRect`, 9 %) + `onScroll` (8 %) + démontages React
   (`commitDeletionEffects` 5 %) ; remède : mesurer au ResizeObserver, `scroll` passif et throttlé, ne pas démonter la page quittée.
- Facturer (208) : `convertNamedNodeMapToObject` (PDF/HTML, 11 % du profil Vente) : tâche rare, hors seuil ; calcul à différer après l'image.

## Limites
Poste bruité (min–max larges) ; fixture de la passe 2 (petite, libellés différents du parcours Calendrier) ; INP et non « temps au calme » ;
profil agrégé par séquence ; 2 pas sur 5 sans valeur en tour7 (geste absent) : le A/B ne vaut que pour semaine, frise, barre, courbe, Recette,
Commencer, onglets, Vente, Recherche.
