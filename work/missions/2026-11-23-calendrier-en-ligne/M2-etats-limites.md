# M2 — Frise du temps du Calendrier : modèle d'états, partitions et valeurs limites

Date : 22.11 (soir). Testeur : agent M2 (Opus). App en ligne https://brasserie-l-affinee.web.app/.
Méthode : ISTQB, test par transitions d'états (couverture 0-switch, puis paires 1-switch sensibles), partitions
d'équivalence et analyse des valeurs limites (juste avant / sur / juste après). Chaque cas a été joué avec une capture
regardée (zoom de l'en-tête 390 px de large), avec des mesures DOM en appui.

## 0. Conditions du test (à lire avant les défauts)

1. **Version servie** : le service worker de l'origine sert l'ancien paquet `index-B8Mp3grp.js`. Le serveur sert, lui,
   le tour 10 `index-Bt0rkeZN.js` (`fetch('/index.html',{cache:'no-store'})`). Un worker en attente existe (`waiting: true`).
   Les 9 premiers cas ont été joués sur l'ancien paquet. Tous les autres l'ont été sur le tour 10, après Ctrl+Maj+R
   (page non contrôlée, `controller: false`, `index-Bt0rkeZN.js`). Voir T10-M2-1.
2. **Taille** : la fenêtre Chrome partagée est réduite en icône (outer 160 × 28) et la page rend en 628 × 1297. Je n'ai
   pas touché à la fenêtre. Le 390 est émulé dans mon onglet : `body{width:390px;height:844px;overflow:auto;transform}`,
   puis un événement `resize`. L'en-tête de la frise lit la largeur de son conteneur (ResizeObserver) ; ses seules
   requêtes média (max 699 px, `innerWidth < 700`) sont vraies en 390 comme en 628. L'émulation vaut donc pour la frise.
   Elle ne vaut pas pour les règles CSS globales entre 390 et 628 px (bas d'écran, liste).
3. **Outils** : souris = `left_click_drag` (instantané). Tactile = `PointerEvent` `pointerType:'touch'` envoyés à
   l'élément réel (`elementFromPoint`), un pas toutes les 16 ms, doigt tenu immobile ou tremblant de ±1 px. Pas de
   `TouchEvent` : `useGlisse` n'écoute que les Pointer Events (hors curseur natif). Chaque défaut nomme son outil.
4. **État partagé entre agents** : la période de l'app (serveur), la fenêtre locale (`laffinee.calendrier.fenetre-locale`,
   localStorage), la courbe cachée et ± sont communs à tous les onglets. Chaque oracle « période de l'app inchangée » a
   donc été lu juste avant et juste après le geste, dans le même script.
5. **Onglets** : mes onglets 789 puis 797 sont sortis du groupe MCP en cours de route, ce qui ne venait pas de moi.
   Un script (cas C0 à C9b) a tourné dans l'onglet 795, que le groupe m'avait rendu vide et qui s'est révélé être celui
   de M4 (titre « M4 390 » apparu ensuite). Ce script a changé la fenêtre de cet onglet (6 sem., gestes du cadre), sans
   aucune écriture de données. Je n'ai fermé que mon dernier onglet (800).
6. **Données** : aucune donnée ZZ TEST créée, rien à supprimer. Aucune chose du brasseur n'a été touchée. État final
   rendu à celui du début : période de l'app 9 nov. → 6 déc., 4 sem., S46 – S49, courbe montrée (un autre agent l'avait
   cachée entre-temps). Clé de travail `zz-m2h` retirée du localStorage.

## 1. Modèle d'états

État = (échelle E × position P de la fenêtre × état du cadre C × période de l'app A).
- E ∈ {1 sem. (minimum), 2 à 51 sem. (libre), 2 sem., 6 sem., 3 mois, 6 mois (menu), An = 52 (maximum)} ; Jour, Semaine
  et Mois servent de grain (ils posent 2 sem., 6 sem. et 6 mois).
- P ∈ {passé au bord des données (S47 2025), passé, contient aujourd'hui (S47 2026), futur, à cheval sur l'année
  (S53 2026 → S1 2027), horizon maximum (S45 2027)}.
- C ∈ {repos, tirage (corps, début, fin), tenu au bord, appui long (lecture), annulé}.
- A ∈ {période P0, période P0 + 1 cran}.

| Transition | De → vers | Joué | Outil | Verdict |
|---|---|---|---|---|
| Menu : 2 sem., 6 sem., 3 mois, 6 mois, An | E → E' (même début) | oui, tour 10 et ancien paquet | clic JS | tour 10 OK pour A ; ancien paquet KO (T10-M2-1) ; dessin KO (T10-M2-2) |
| Menu : Jour, Semaine, Mois | E → 2 sem., 6 sem., 6 mois | Mois et Semaine sur le tour 10, Jour sur l'ancien | clic JS | OK ; libellé de mois incomplet (T10-M2-9) |
| Annuler (bandeau) | E' → E | oui, 2 essais | souris | OK si touché à temps ; bandeau de 1,5 s (T10-M2-4) |
| Glisser le corps | P → P ± n | oui | souris et tactile | OK, A inchangée |
| Tirer la fin | E → E ± n | oui | souris (réduire) et tactile (réduire, élargir) | OK |
| Tirer le début | E → E ± n | oui | tactile | OK |
| Tenir au bord 2 à 20 s (corps à gauche et à droite, fin à droite, début à gauche) | défilement, élargissement | oui | tactile immobile et ±1 px | lent (T10-M2-3) |
| Échap pendant un glisser | tirage → repos d'avant | oui | tactile et clavier | OK |
| pointercancel pendant un tirage de la fin | tirage → repos d'avant | oui | tactile | OK |
| Appui long sur le corps (700 ms) | repos → lecture | oui | tactile | OK : « S51, 14 – 20 déc. », la lecture suit le doigt, fenêtre inchangée |
| Toucher la courbe hors du cadre | lecture de la semaine | oui | tactile | OK : lecture S52, fenêtre inchangée |
| Toucher une semaine de la liste | — | non | — | hors du temps imparti (focus 2) |
| ‹ › de l'app | A → A ± 1 | oui | souris | OK seul ; KO après un geste local (T10-M2-6) |
| Rechargement | état → même état | oui, rechargement complet (Ctrl+Maj+R), et dans un autre onglet | clavier | OK : S52 – S4 2027 retrouvée, puis S1 2027 |
| Poignée au clavier (Entrée : l'An) | — | non | — | pas joué |

Couverture 0-switch : 18 transitions sur 21 jouées (86 %). Restent non jouées : début à la souris, toucher une semaine
de la liste, poignée au clavier.

Paires 1-switch sensibles jouées (10 sur 13) : menu → Annuler ; menu → Annuler après le bandeau (rien) ; An → corps (sort
de l'An et y revient au bord) ; An → fin + ; An → fin − ; geste local → › → ‹ (suit) ; › → geste local → ‹ (ne suit pas,
T10-M2-6) ; geste → rechargement ; tirage → Échap ; menu → même valeur (rien ne bouge).
Non jouées : rechargement ordinaire (sert l'ancien paquet, T10-M2-1) ; An → Entrée ; tenu au bord → Annuler.

## 2. Valeurs limites

| Limite | Juste avant | Sur | Juste après | Verdict |
|---|---|---|---|---|
| 1 semaine | 2 sem. (menu) | fin tirée à fond : « S47 », 1 sem. | tirer encore : reste 1 sem. | OK ; « S47 » écrit deux fois et sans jours (T10-M2-5, connu) |
| 52 semaines (An) | fin −6 px : 51 sem. « S47 – S44 2027 » | menu An « nov. 2026 – nov. 2027 » | fin +50 px : reste An | OK |
| Année S52 → S53 → S1 | 6 sem. « S49 – S1 2027 », graduations S52 S53 S1 | 1 sem. « S53 » | 1 sem. « S1 2027 » | OK (2026 a bien 53 semaines ISO) |
| Année 2025 → 2026 | — | « S47 2025 – S20 2026 » | — | OK, année sur les deux bouts |
| Début des données | S48 2025 atteint en tenant au bord | S47 2025 | tenir encore 6 s (corps) et 4 s (début) : reste S47 2025 | OK, mais aucun signe de butée (T10-M2-8) |
| Horizon futur | 51 sem. jusqu'à S44 2027 | An poussée à droite : S47 – S45 2027 | tenir 20 s : reste | OK |
| Bord exact (bande de 40 px) | doigt à 319 px sur 360 | 321 px | 340 px, puis 365 px (hors cadre) | l'effet de la profondeur ne se mesure pas (T10-M2-3) |
| Plus petite et plus grande échelle | — | 1 sem. et An | — | OK |
| Seuil du geste (6 px, R1) | — | à l'An, −6 px fait −1 sem. | — | OK |

## 3. Oracles

- **Période de l'app fixe (CAL-PERIODE-APP-FIXE)** : sur le tour 10, elle reste fixe après chaque menu, glisser, tirage,
  tenue au bord, Échap, annulation et lecture (≈ 40 gestes). Sur l'ancien paquet servi par le worker, elle bouge à chaque
  menu (T10-M2-1).
- **Étiquette du cadre = fenêtre** : l'étiquette dit juste en semaines et en années, et elle suit le geste. Le **dessin**,
  lui, ne correspond pas (T10-M2-2).
- **Aucune étiquette rognée ni chevauchée** (boîtes mesurées à chaque état, puis vues sur la capture) : aucune
  intersection au tour 10. Une fois, sur l'An au bord droit, la mesure a donné « Achats ✕ Achats », « Achats ✕ −13 » et
  « Achats ✕ ZZ TEST — M3 — achat ». Rejoué dans le même état : 0 chevauchement. Non reproduit, et pas de capture du
  premier cas (l'onglet a quitté le groupe). Les mois de l'An tiennent à 2,6 à 3,2 px les uns des autres (« févr. mars »,
  « août sept. »), lisibles mais serrés.
- **Rechargement** : il garde la fenêtre (OK). **Annuler** rend l'état d'avant (OK).

## 4. Défauts

**T10-M2-1 — B — Le service worker sert l'ancienne version ; le tour 10 ne tourne pas sans rechargement forcé**
- Écran : toute l'app. Outil : lecture du DOM et du réseau.
- Geste : ouvrir l'app (rechargement ordinaire), puis comparer `script[src]` (`index-B8Mp3grp.js`) avec ce que sert
  `/index.html` sans cache (`index-Bt0rkeZN.js`). `registration.waiting` vaut vrai.
- Attendu : le tour 10 en ligne. Observé : l'ancien paquet. Son `CalendrierTab-DaosYeXR.js` n'a pas `fenetre-locale` et
  contient « Finances aussi ». Sur cet ancien paquet, chaque choix du menu change la période de l'app (9 nov. → 6 déc.
  devient 16 → 29 nov., puis 16 nov. → 27 déc., etc.), Finances comprise, avec le bandeau « Échelle Mois : période An →
  6 mois, Finances aussi · Annuler ». Le tour 10 corrige ce point (vérifié).
- Cause probable : D413, la nouvelle version attend que tous les onglets soient fermés. Tant qu'un onglet reste ouvert
  (son Chrome, les onglets des agents), personne n'a le tour 10. Les autres agents testent probablement l'ancien paquet.
- Captures : `captures-M2/1795378223728-ndbugn.png` (2 sem., période de l'app changée),
  `captures-M2/1795378288634-zucoio.png` (An).
- Régression de la règle : CAL-PERIODE-APP-FIXE, telle qu'il la voit.

**T10-M2-2 — G — Le cadre n'est pas dessiné sur les semaines qu'il annonce (même place à toutes les échelles)**
- Écran : en-tête du Calendrier, courbe et graduations. Outil : souris et tactile, toutes échelles.
- Geste : menu 6 sem. (ou 2 sem., 3 mois, 6 mois, An).
- Attendu : étiquette = dessin = graduations. Observé : le cadre est toujours dessiné de x 68 à x 316 (sur 390), alors que
  les graduations étalent la même fenêtre sur toute la largeur (x 12 à x 372). À 6 sem., « S47 – S52 » est dessiné de la
  fin de S47 au début de S52. À l'An, « nov. 2026 – nov. 2027 » est dessiné de déc. à sept. À 4 sem., « S46 – S49 »
  commence après la graduation S46 et finit avant S49.
- Captures : `captures-M2/1795378442001-vyag01.png` (6 sem.), `captures-M2/1795378465362-j8l9mh.png` (An),
  `captures-M2/1795378994773-gd4po2.png` (An à l'horizon).
- Régression de la règle : CAL-ECHELLE-COHERENTE. Le bouton « Aligner la courbe sur la frise » est resté éteint, comme
  par défaut.

**T10-M2-3 — G — Doigt tenu au bord : défilement et élargissement environ 10 fois plus lents que prévu**
- Écran : frise. Outil : tactile (doigt immobile, et ±1 px : même résultat).
- Gestes et mesures :
  - fin tirée au bord droit puis tenue 9 s : +1 sem. par seconde (S4 → S12 2027) ;
  - corps tenu au bord gauche à 6 sem. : 6 semaines en 10 s (S43 → S37) ;
  - à 6 mois : environ 2,5 sem. par seconde ;
  - à 6 sem., doigt tenu 2 s à 20 px dans la bande ou au-delà du bord : +0 à +0,5 sem.
- Attendu (R7, `VITESSE_MIN` 0,15 et `VITESSE_MAX` 1,35 largeurs d'échelle par seconde) : à 6 sem., de 1 à 8 semaines
  par seconde selon la profondeur. Observé : environ 0,6 sem. par seconde, quelle que soit la profondeur. Reculer de
  26 semaines depuis 6 sem. prend environ 40 s ; atteindre l'An par la fin, environ 40 s aussi.
- Captures : `captures-M2/1795378588740-4fmvn5.png` (5 → 7 sem. après 3 s), `captures-M2/1795378707987-27cbne.png`
  (S37 – S42 après 10 s).
- Réserve : pointeurs synthétiques, à rejouer au vrai doigt. Touche CAL-RETOUR-PASSE : le recul marche, mais trop lentement.

**T10-M2-4 — m — Le bandeau « Annuler » du menu d'échelle disparaît après environ 1,5 s**
- Geste : menu → 3 mois, puis attendre. Outil : souris et mesure du DOM.
- Mesures : 1,46 s et 1,6 s. Au premier essai, le temps de lire le bandeau, Annuler n'était plus là et le toucher n'a
  rien fait. Touché à temps, Annuler rend bien 6 sem.
- Attendu : le temps de lire puis de toucher (au moins 4 s). Captures : `captures-M2/1795378481901-3cjt2h.jpg` (bandeau),
  `captures-M2/1795378491736-15nwgn.png` (toucher trop tard, rien), `captures-M2/1795378504907-h6fzcs.png` (Annuler à temps).

**T10-M2-5 — m (connu, corrigé non déployé, f9cd2cf84) — Fenêtre d'une semaine : « S47 » écrit deux fois, sans les jours**
- Geste : tirer la fin à fond à gauche (souris). Même chose pour S53 et « S1 2027 » (tactile).
- Captures : `captures-M2/1795378536877-xx8x0a.png`, `captures-M2/1795379092878-trjyet.png`.
- Règle : CAL-FRISE-ETIQUETTES. À 4 et 6 sem., l'étiquette « S46 – S49 » répète aussi les graduations S46 et S49.

**T10-M2-6 — G — Après › puis un geste local, ‹ de l'app ne ramène pas la fenêtre**
- Gestes : (a) ‹ › seuls, ou geste local → › → ‹ : la fenêtre suit la période de l'app (S46 – S49), OK. (b) › (fenêtre
  S50 – S53), début tiré à droite (1 sem. « S53 »), puis ‹ : l'app revient à 9 nov. → 6 déc., mais la fenêtre reste
  « S53 », 1 sem. La fenêtre locale est alors rangée sous la clé de la nouvelle période. Reproduit deux fois (onglets
  797 et 800). Au rechargement suivant, « S1 2027 » revient sous 9 nov. → 6 déc.
- Outil : souris (‹ ›) et tactile (geste).
- Attendu : « celle-ci ne change que par ses propres ‹ ›, et la fenêtre la suit alors », sans dépendre du chemin.
- Captures : `captures-M2/1795379220937-wd0jgt.png` (b), `captures-M2/1795379018117-7yo5ls.png` (a).
- Règle : CAL-PERIODE-APP-FIXE, son second sens.

**T10-M2-7 — d — À une semaine, le cadre ne suit pas le doigt avant la moitié de sa largeur**
- Geste : à 1 sem., glisser le corps de 110 px (tactile). Rien ne bouge : il faut plus de 124 px, la moitié du cadre.
- Attendu : le cadre accompagne le doigt et se pose à la semaine au lâcher.

**T10-M2-8 — d — Butée du passé (S47 2025) sans aucun signe**
- Geste : tenir le corps au bord gauche (tactile). Le cadre s'arrête net sur une courbe vide, sans repère de début des
  données ni du solde d'ouverture.
- Capture : `captures-M2/1795378707987-sl2h5d.png`.

**T10-M2-9 — d — Échelle Mois : le dernier mois de la fenêtre n'est pas gradué**
- Geste : menu → Mois (6 mois, du 16 nov. au 16 mai). Les graduations vont de « nov. » à « avr. » : « mai » manque,
  alors que « nov. », tout aussi partiel, est gradué.
- Capture : `captures-M2/1795378465362-lnfdsg.png`.

## 5. Non reproduit, et observations hors focus

- Chevauchement d'étiquettes de courbe à l'An (voir les oracles) : non reproduit au second essai.
- Même An, deux rendus différents : après un chargement, « S47 – S45 2027 » avec les mois en toutes lettres ; par le
  menu, « nov. 2026 – nov. 2027 » avec les initiales (captures `1795378402756-epq87s.png` et `1795378465362-j8l9mh.png`).
  Non retenu : le premier rendu a pu être choisi à 628 px, avant mon émulation.
- Liste (focus 2), vue en passant : rangées « neipa v3 » vides et « Vente 10 × Bière » qui chevauche « Vente 1 × ZZ
  TEST » sur l'ancien paquet (`captures-M2/1795378145917-x2elbn.png`). Hors de ce rapport.
