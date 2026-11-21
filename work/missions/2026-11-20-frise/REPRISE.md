# Session 5 — CAL-LENT (21.11)

## État de l'art (L29) : invalidation de style
- Problème type : **invalidation de style** du navigateur (Blink). Une mutation du DOM (insertion d'un enfant, attribut, classe) marque des
  éléments « à recalculer » ; la lecture suivante de la géométrie (getBoundingClientRect, offsetHeight, focus) force le recalcul
  (UpdateStyleAndLayoutTree) avant de répondre. Coût ≈ nombre d'éléments marqués × règles candidates.
- Mécanisme Blink (Rune Lillesveen, « Style Invalidation in Blink » ; web.dev « Reduce the scope and complexity of style calculations ») :
  1. Classe, id, attribut changés : ensembles d'invalidation par trait (`.a .b` ne marque que les `.b` sous l'élément) ; un sélecteur
     dont le sujet n'a aucun trait (`[x] :focus-visible`, `.a *`) marque **tout le sous-arbre**.
  2. Insertion ou retrait d'un enfant : si le parent porte un drapeau « structurel » (posé pendant le filtrage par tout sélecteur
     `:nth-*`, `~`, `+`, `:last-child`, `:only-child`, `*-of-type` dont le sujet est universel, p. ex. `.space-y-2 > :not([hidden]) ~
     :not([hidden])`, testé sur **chaque** élément de la page), Chrome applique l'ensemble global « nth » ou « frère universel » ; si une
     seule règle de l'app y met une descendance universelle, c'est **tout le sous-arbre du parent** (« allDescendantsMightBeInvalid »).
  3. `:has()` : invalidation vers le haut, chère si l'argument est large.
- Remèdes connus, du plus sûr au plus large :
  a. Sélecteurs structurels universels → classes posées par le code (`cal-pile` au lieu de `space-y`), ou sujet qualifié par une classe.
  b. Sortir les insertions des parents chargés : surcouches (toast, feuille, menu, panneau) dans un **portail** (`createPortal` vers
     `document.body`), calques toujours montés (vides ou `hidden` au repos) au lieu d'insérés.
  c. `contain: layout style` / `content-visibility: auto` : borne la mise en page et les compteurs ; **ne borne pas** l'invalidation de
     style (Chrome recalcule quand même le sous-arbre marqué) ; `content-visibility: auto` saute le style des parties hors écran.
  d. Moins d'éléments par semaine (moins d'éléments marqués).
  e. Glisser : `transform` dans `requestAnimationFrame`, sans rendu React par mouvement ; aucune lecture de géométrie après écriture
     (pas de mise en page forcée) ; mesurer une fois au début du geste.
- Décision : mesurer, puis a et b d'abord (cause mesurée) ; c et d seulement si la mesure le demande ; e pour frise et barre.
  Chaque remède : build de production, `lenteur.mjs` ×3 (médiane) + sonde ; gardé seulement s'il fait gagner.

## Mesures (build de production, 390 tactile, CPU ×4, médiane de 3 ; script `mesure.mjs` du scratchpad session 5)
| action | base `062b6375f` | + PostCSS `ed6afbc20` | + masque en un chemin (REJETÉ : plus lent) |
|---|---|---|---|
| semaine | 296 (tâche 252) | 160 (120) | 392 (284) |
| frise (glisser) | 456 (356) | 224 (158) | 264 (223) |
| barre (glisser) | 368 (380) | 152 (116) | 240 (203) |
| courbe-lecture | 24 | 0 | |
| courbe-cacher | 112 | 128 | |
| événement ouvrir | 152 | 104 | |
| Modifier | 376 (285) | 288 (204) | 296 (210) |
| semaine (feuille) | 64 | 48 | |
| Enregistrer | 416 (389) | 200 (165) | 328 (292) |
Verdicts : base ECHEC (8/7/7) ; PostCSS ECHEC (4/6/5) ; masque ECHEC (7/5/7). Le chemin unique est plus lent (rastérisation du masque ?) : remède rejeté, fichiers remis à ed6afbc20 ; copie dans le scratchpad session 5 « masque-rejete/ ».

## Session 5 : fait
- `062b6375f` : data-doigt + cal-pile (calendrierTour3 + calendrierEntete 123/123).
- `ed6afbc20` : **cause principale**. Sonde 2 (retirer les 86 règles structurelles, puis les remettre une à une) : 26 coupables, chacune
  SEULE suffit : tous les `space-x/y-*` et `divide-*` de Tailwind v3 (`> :not([hidden]) ~ :not([hidden])`) + `.fe-gt>span+span`,
  `.fe-tk>p>span+span`. Sonde 3 : insérer un enfant ailleurs qu'en dernier coûte tout le sous-arbre du parent (7,8 ms .cal-tab,
  5,8 ms .cal-frise sans ralenti) ; en dernier ou dans body, 0,03 ms. Remède : plugin PostCSS (`postcss.config.js`) qui réécrit
  ` > :not([hidden]) ~ :not([hidden])` en ` > :not([hidden]):not(:first-child)` (même marge, même élément ; écart seulement si le 1er
  enfant porte l'attribut `hidden` : aucun cas sur Production, Stocks, Finances, Calendrier à 390 et 1280, scan). Après : 0,03 ms partout.
  Captures 390 et 1280 (repos, + volant) : **0 pixel de différence** (comparaison canvas), ouvertes. Calendrier vitest 518/518.
  Remède « portail » donc inutile (l'insertion ne coûte plus rien) ; `:has()` sondé : négligeable (0,08 ms).
- Masque (ESSAYÉ PUIS REJETÉ, non commité) : trace avec `--invalidations` : 400 à 750 « StyleRecalc Attribute rect » par geste = les
  `<rect data-trou>` du masque des fils (deux masques, un rect par trou, re-rendus à chaque mesure). `Frise.tsx` : trous en UN
  `<path data-trou>` (`cheminTrous`, `boitesDuChemin` exportés) ; lecteurs mis à jour : `calendrierJalonsLies.test.tsx`,
  `calendrierLotC.test.tsx`, `scripts/agents/vision-calendrier.mjs` (node --check OK). Calendrier vitest 515/515 (30 fichiers).
- Restant mesuré (trace) : Modifier = `focus` de Radix (FocusScope → focusFirst) force le style de 3 720 éléments : la feuille rend
  97 puces de semaine × 5 éléments (`cal-f-sem`, FeuilleAjout.tsx l. 262) ; Enregistrer = leur retrait (2 790). Remède suivant :
  moins d'éléments par puce, ou `content-visibility: auto` sur les puces hors écran (rangée qui défile), mesurer. Frise : `juger`
  (CalendrierTab, pur JS, 146 ms non minifié, au lâcher) ; `mesurerTraits` (useLayoutEffect sans dépendances, chaque rendu).

## Session 6 : prochaine action, dans l'ordre
1. Masque : rejeté (mesuré). Piste à mesurer : ne re-rendre les trous que si les fils existent ET ont changé (aujourd'hui mesurerTraits les
   recalcule à chaque rendu, useLayoutEffect sans dépendances), plutôt que changer leur forme.
2. Puces de la feuille (Modifier, Enregistrer), puis `juger` au lâcher de la frise ; `lenteur.mjs` jusqu'à LENTEUR CALENDRIER OK ×2.
3. Rejouer `calendrier.mjs` (PARCOURS CALENDRIER OK), `geste.mjs`, vitest Calendrier, `npm run build`.
4. **Bugs du coordinateur (après CAL-LENT)** — Brasserie `work/missions/2026-11-21-workflows-app/SYNTHESE.md` § 1 ; pour chacun, une
   étape de `calendrier.mjs` ROUGE sur tour7 d'abord, fixture ZZ TEST seulement (jamais seedData.ts), un commit par correctif :
   - B3 / WFR-11 (BUGS-produire.md l. 116) : « Impossible de charger cet écran » sans brassin démarré ; attendu : s'ouvre sur tout état.
   - B8 / WFP-3, WFP-4 (BUGS-projets.md) : barre lâchée en S46 dessinée en S47 ; la période change seule après un glisser hors fenêtre
     (et reste après rechargement) ; attendu : la barre va où le doigt la lâche, la période ne bouge que par lui (R9).
   - B9 / WFP-2 : glisser sur la courbe (vue 6 sem., S47–S52) lit « S31 · 2 août » ; attendu : la lecture reste dans la fenêtre (R4).
   - B11 / WFV-3 (BUGS-vendre.md) : la vente encaissée du jour absente de la rangée Ventes ; attendu : une chose de sa rangée.

# REPRISE — session 4 (21.11, agent arrêté à ~170 k)

## Session 4 : fait
- Étape 1 CAL-ENTETE : commit `d5a2f056c` (7 fichiers par chemins). Test n° 15 réécrit selon D392 (panneau 50 px, absolute, top:100 %,
  overflow hidden, une ligne). calendrierEntete **110/110** (B9 vert) ; `calendrier.mjs` : **PARCOURS CALENDRIER OK**.
- Étape 2 CAL-LENT, contrôle : `scripts/parcours/lenteur.mjs` (commit `3ce0c724a`). Build minifié (config parcours, React prod), 390 tactile,
  CPU ×4, trace + profil par action ; options `--ref`, `--build`, `--non-minifie`, `--sans-trace`, `--selecteurs`, `--invalidations`.
  **Rouge sur tour7 : ECHEC (8)** — INP semaine 1200, frise 1768 (tâche 1156), barre 1184 (tâche 900), courbe-lecture 32, courbe-cacher 184,
  événement ouvrir 432, Modifier 1160, semaine 112, Enregistrer 1392 ms.
- Cause mesurée (traces) : ni le JS ni la mise en page (Layout ≤ 52 ms), mais le **recalcul de style** (UpdateLayoutTree 300 à 476 ms pour
  1 700 à 3 700 éléments), forcé par les getBoundingClientRect des effets (p. ex. `mesurerTraits` de Frise.tsx, useLayoutEffect à chaque
  rendu). Il touche TOUT le sous-arbre à chaque insertion ou attribut :
  1. `.cal-frise` : `setAttribute('data-doigt')` à chaque pointerdown + règle `.cal-frise[data-doigt] :focus-visible` → sous-arbre entier.
     CORRIGÉ (non commité) : posé une fois ; règle bornée à `:is(button, a, [tabindex]):focus-visible`.
  2. `.cal-tab` : `space-y-2` (Tailwind « ~ ») remplacé par `cal-pile` / `cal-pile-serre` (frise.css, mêmes marges, même spécificité) ;
     test calendrierTour3 adapté (123/123 avec calendrierEntete). NON COMMITÉ.
  3. RESTE : insérer un enfant dans `.cal-tab` (message `cal-msg`, feuille, menu) ou `.cal-frise` (`svg.cal-traits`) invalide encore tout le
     sous-arbre (« allDescendantsMightBeInvalid »). Sonde `work/missions/2026-11-20-frise/sonde-invalidation.mjs <racine> <build>` (ignorée
     par git : copie aussi dans le scratchpad) : retirer les 86 règles structurelles (nth-, ~, +, last/only-child, of-type, :has, first-child,
     :empty) fait passer l'insertion de 8 ms à 0,07 ms (sans ralenti) ; aucune règle seule ne suffit → probablement l'ensemble global « nth »
     de Chrome (union de tous les :nth-*/:last-child de l'app). Prochaine action : sonde par catégorie, puis sortir les insertions des parents
     « positionnels » (portail `document.body` pour message, menu, feuille ; calque `cal-traits` toujours monté, vide au repos) et/ou retirer
     la règle globale fautive. Aussi : Modifier = `focus` de Radix 486 ms (FocusScope, même recalcul) ; `mesurerTraits` à chaque rendu.
- Après corrections 1 et 2 (arbre de travail, une mesure, bruitée) : semaine 776, frise 472, barre 760, cacher 144, ouvrir 272, Modifier 1120,
  Enregistrer 824 ms → toujours ECHEC (8). La ligne CAL-LENT est déjà dans DEFAUTS-RECURRENTS (Brasserie).

## Session 5 : prochaine action, dans l'ordre
1. Finir CAL-LENT (point 3), `node scripts/parcours/lenteur.mjs <dossier>` jusqu'à LENTEUR CALENDRIER OK (deux fois, bruit), puis
   calendrier.mjs OK, vitest Calendrier ; commit par chemins : CalendrierTab.tsx, Frise.tsx, frise.css, calendrierTour3.test.tsx (+ suite).
2. Le geste (liste « Reste » de la session 2 ci-dessous, points 1, 3, 4), puis contrôle final (vitest entière, build).

# (session 3) (21.11, agent arrêté à ~185 k)

## Session 3 : fait
- Commits : `6246452a4` (geste.mjs), `e1c67b257` (INVENTAIRE, REPRISE), `2bc7cd7af` (contrôle CAL-ENTETE dans `scripts/parcours/calendrier.mjs`,
  étape 10). Sur `en-ligne/2026-11-21-tour7` : **PARCOURS CALENDRIER ECHEC (31)**, tous CAL-ENTETE (rond pointillé et rond au repère ; Brassins
  saute de 53 px en An, 93 px en 3 mois ; en-tête 287 px An ; 252 px courbe cachée ; « −6 552 » sous les mois ; barre du haut 81 px, avatars
  sur 2e ligne, 6 onglets). Captures avant : scratchpad session 3 `cal-avant/`.
- Corrections CAL-ENTETE, NON COMMITÉES (arbre de travail) :
  1. `entete/Courbe.tsx` : anneau et point du curseur retirés ; repère = colonne teintée (`ent-cur-col`, `data-curseur-colonne`, masquée sous
     les noms) + marche épaissie (`ent-cur-marche`). `GrandeCourbe.tsx` garde son point (non touché, à décider).
  2. `entete.css` `.ent-lu` : panneau en absolu sous l'en-tête (top:100 %), hauteur fixe 50 px, mouvements sur une ligne. Revient sur
     CRITIQUE-5 n° 15 (« dans le flux ») : DÉCISION signalée au pilote (le panneau couvre la ligne « + Brassins » pendant la lecture).
     `EnTete.tsx` : courbe cachée → lecture fermée (useEffect).
  3. `BandeAnnee.tsx` + css : rangée `ent-an-z` (barres et montant du creux) retirée ; le creux reste dans `title` et aria-label.
  4. `Header.tsx` : compactLayout `flex-wrap` → `flex-nowrap` ; `periode.css` : flèches de la pastille 34 px dans `header` à ≤ 429 px.
  5. Tests `calendrierEntete.test.tsx` : `.ent-an-v` → title ; test de l'anneau → colonne sans rond.
- Après (arbre de travail) : **PARCOURS CALENDRIER OK** ; écart 0 px sur 7 états (An et 3 mois), en-tête 207 px An / 212 px 3 mois (≤ 253),
  courbe cachée 119 / 124 px (≤ 169), barre 41 px une ligne sur les 6 onglets. Captures regardées : 390 clair et cave, 1280 clair, lecture An.
- vitest `calendrierEntete` : 108/110 ; B9 (couleur en dur : ombre `rgb(0 0 0…)` du panneau) corrigée depuis (ombre retirée, NON rejoué) ;
  « n° 15 : le détail vit dans l'en-tête (dans le flux) » à réécrire selon la nouvelle règle (hauteur fixe, en absolu, l'en-tête ne s'étire pas).

## Session 4 : prochaine action, dans l'ordre
1. Réécrire le test n° 15, rejouer `calendrierEntete`, B9 compris ; commit CAL-ENTETE par chemins (Courbe.tsx, EnTete.tsx, BandeAnnee.tsx,
   entete.css, Header.tsx, periode.css, le test). Ne pas toucher aux autres fichiers modifiés de l'arbre (autre session).
2. **CAL-LENT** (message du coordinateur, avant le geste) : ligne dans DEFAUTS-RECURRENTS ; « Il y a beaucoup de lenteur sur les actions du
   calendrier... ». Mesurer d'abord : build de PRODUCTION, 390, CPU ×4 (`Emulation.setCPUThrottlingRate`), trace ; pour chaque action (semaine,
   frise, barre, courbe, événement) INP et tâches longues ; contrôle rouge sur tour7 ; corriger la cause mesurée ; chiffres avant/après.
3. Puis le geste (ancienne liste ci-dessous, points 1, 3, 4, 5).

# (session 2) port du comportement de la frise B partout

Objectif : porter le COMPORTEMENT de la frise B (R1 à R14, dépôt Brasserie `work/missions/2026-11-20-frise/frise-interactive.html`)
dans toutes les frises et tous les curseurs ; dessin inchangé. Branche `claude/port-carnet-1711`, worktree `port-carnet`.
Interdits : `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx` ; `git add -A`, stash, push, déploiement, donnée réelle.
Commit par chemins, un par endroit, « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Fait
- Session 1 : module `src/ui/geste/` ; 25 endroits (tous les `<input type="range">`, malt `Ligne.tsx`, `RatioSlider.tsx`). Voir INVENTAIRE.md.
- Session 2 (commits `8e700a7b6`, `9d6f1ddf8`, `ff5a6fafe`, `e97e51993`, `c7d79362b`, + geste.mjs) :
  - R1 sur curseur vide : mesure du jour (`BrewDayMeasurements`), appel de mesure (`AppelMesure`), prix (`CurseurPrix`) : un toucher
    ne pose plus rien ; glisser ou Entrée posent ; le clic d'un lecteur d'écran (`detail === 0`) pose encore. Textes « un toucher pose »
    devenus « glisser ou Entrée pose » / « glisser le pouce part de ». 5 tests réécrits (R1).
  - Finances `operations/Frise.tsx` : réécrit sur `useGlisse` + `poserPlage` + `roleSous` + `cadrerDeuxBouts` (R1 R2 R3 R4 R5 R7 R10 R12
    R13 ; `.ops-tr` en `touch-action:none`). Le palier « un mois par 0,6 s » (FIN-FRISE-AGRANDIR) est remplacé par R7 ; tests réécrits
    (finTour2 : R1, R2, R10, R7 ; financesLot2). Piège : la ref de la piste doit être STABLE (`useCallback`), sinon chaque rendu détache
    le geste et l'annule.
  - Calendrier `entete/Fenetre.tsx` (cadre) : R1 (6 px, `aBouge`) et R10 (Échap). 209 tests du Calendrier et de l'en-tête verts.
  - `scripts/parcours/geste.mjs` : les 4 sélecteurs corrigés (ébullition : `repli` retiré ; « 2. Sels » touché par préfixe `^` ; une
    ligne de SUCRE créée — la barre d'un grain règle sa part et ne bouge pas seul ; levure Pomona choisie puis rangée Levure du Récap.
    ouverte) ; Identité touchée (le brouillon reprend à sa dernière étape) ; « Écran indisponible » (chunk non chargé, vu une fois à 1280)
    rechargé une fois.

## Preuves
- Vitest ciblé : mesures 129/129, Finances frise 52/52, Calendrier 209/209. Suite entière et build : voir la fin de ce fichier.
- geste.mjs : voir la fin de ce fichier.

## Reste (prochaine action, par ordre)
1. Ajouter à `geste.mjs` la frise de Finances (Finances › opérations, `.ops-tr`, `role=slider` « Début »/« Fin » : toucher, sans saut,
   étirer, Échap à 1280, deux bouts à 56 px au repos) et le cadre du Calendrier (`[data-poignee=fin]`, toucher sans effet, Échap).
2. CAL-ENTETE (demande du pilote, 21.11 ; ligne dans Brasserie `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, captures
   `work/missions/2026-11-21-calendrier-entete/`, dont capture-6) : écrire D'ABORD le contrôle, rouge sur `en-ligne/2026-11-21-tour7`,
   l'ajouter à `calendrier.mjs` (ou geste.mjs), puis corriger ; captures 390 avant/après :
   1) retirer le rond pointillé de la courbe (2e refus) ; 2) panneau de semaine à hauteur fixe (le haut de « Brassins » ne bouge pas de
   plus de 1 px) ; 3) en-tête ≤ 30 % de 844 px, ≤ 20 % courbe cachée ; 4) retirer la rangée « −683 » sous les mois (redit la courbe) ;
   5) barre du haut sur UNE ligne (nom, période, recherche, avatars G A) — commune à toute l'app : vérifier les autres onglets à 390.
   Non commencé.
3. Calendrier, échelle : R4/R7 sur la courbe (52 semaines fixes) avec `cadrerDeuxBouts` ; barres glissées `frise/usePointeur.ts:182`
   (seuil, Échap, bord) et `usePincement.ts` (R14). `usePointeurCourbe.ts` est une LECTURE (appui long, lire la semaine), pas un réglage :
   seulement le seuil (8 px aujourd'hui, R1 dit 6) si on veut l'aligner.
4. Curseurs dessinés restants (INVENTAIRE « Non portés ») : `fermentescibles/Plateau.tsx:91` (le grand curseur 0…2 kg de la carte
   choisie : position absolue), houblons (`maBiere/rail.ts:233`, `maBiere/Frise.tsx:163`, `dryhopper/index.tsx:403`), paliers
   (`paliers/CourbeEmpatage.tsx:113`, `production/fiche/StageLadder.tsx:59`), `FermentationTemperatureChart.tsx:262` (poignées
   `yc-chart-handle` vues à l'étape Levure), `stock/ChiffreACommander.tsx:152`, `atelier/TodoTimeline.tsx:122`, `FriseArchives.tsx:61`.
5. Rejouer : geste.mjs (4 combinaisons), `node scripts/parcours/calendrier.mjs`, vitest entière (`npx vitest run --maxWorkers=3`), build.

Build de test : `PARCOURS_RACINE=<worktree> npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <tmp> --emptyOutDir`
(sans `PARCOURS_RACINE` le build échoue), puis `node scripts/parcours/geste.mjs <captures> --build <tmp>`.

## Résultats des rejeux (session 2)
- geste.mjs : **PARCOURS GESTE OK**, 132 contrôles, 390 tactile et 1280 souris, clair et cave, Échap à 1280 (build fait AVANT les commits
  R1/Finances/Fenetre de la session 2 ; ces endroits ne sont pas encore dans geste.mjs). Captures regardées : malt 390 cave (Dextrose
  0,75 kg), SO₄/Cl 1280 clair : dessin intact.
- NON COMMITÉS à la coupure (agent arrêté à 200 k) : `scripts/parcours/geste.mjs` (les 4 sélecteurs, prêt), `INVENTAIRE.md`, ce fichier.
  Commit par chemins : `git commit -- scripts/parcours/geste.mjs`, puis `-- work/missions/2026-11-20-frise/INVENTAIRE.md work/missions/2026-11-20-frise/REPRISE.md`.
- Lancés en arrière-plan, résultat NON LU : `node scripts/parcours/calendrier.mjs`, `npx vitest run --maxWorkers=3`, `npm run build` ;
  journaux dans le scratchpad de la session 2 (`…/scratchpad/cal.log`, `vitest.log`, `build.log`, chacun finit par « exit N ») —
  s'ils sont perdus, relancer les trois.
