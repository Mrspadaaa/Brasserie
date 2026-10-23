# Suggérer — q2b, « Quel houblon ajouter à ma bière ? » (voie p2-suggerer ; reprise D105, 23.10 soir)

## Base

- **q2b**, son choix : q2 (« cella là », 19.10, 14 h 34), puis q2b (« C'est effectivement qb2 reprise le mieux », 19.10,
  soir), redit le 23.10 sur sa capture : « Ça oui, c'est effectivement l'un de mes choix ». Telle qu'intégrée dans la
  **base v4.10** (`work/refonte-frontend/v4/ecran-1/base/consolide/`).
- Captures regardées, côte à côte avec la mienne : `fils15-s5-complexe/captures/q2b-b-390.png`,
  `base/captures/consolide-b-390.png`, `base/captures/consolide-suggestions-radar-390.png`,
  `fils18-baseline/captures/l8b-haut-390.png` (disposition l8).
- D105 : la première version partait de la carte (`fils22-carte/suggerer`) et de la règle « un facteur libre ». C'était
  une faute : la carte ne donne que les ponts. Cette reprise revient à q2b.
- Socle p0 : `CadreOutil`, `Onglets`, `LigneContexte`, `Legende`, `Feuille`, `Picto`, `Pont` ; `SegmentedControl` de
  l'app. Moteur en direct : `proposer(recette, direction)` (proposeVoies) et `suggerer` (dry hop du stock). Liste de
  comparaison du socle : `useComparaison`, `basculerComparaison`, `fixerComparaison`.
- Fiche : `Fiche` (défaut) et **`useGestesFiche` importés de la voie p1** (`src/ecrans/fiche`), sans rien recopier :
  appui long sur toute la voie, survol long du nom à l'ordinateur.

## Reprise

- q2b-onglets : repris — onglets du socle « Ma bière · Suggestions · Comparer (n) », Suggestions active, dans un `nav` ; un seul « ‹ » (celui de l'en-tête)
- q2b-reglages : repris — « Au style / Absolu » (data-e) et « Barres / Radar » sous les onglets, en lecture seule (data-lecture)
- q2b-cartes-objectifs : repris — une carte par objectif de la dégustation, teintée de sa famille, picto, pastille orangée si hors style, verdict en un mot
- q2b-hors-houblon : repris — « Aucune voie houblon » et « Hors houblon › », qui ouvre les pistes hors modèle (offModelLeads)
- q2b-piste-objectif : repris — sous les cartes, la piste l5b de chaque objectif : zone du style, ma bière, meilleure voie, visée, houblons retenus
- q2b-groupes-effet : repris — « = même effet sur tes objectifs · 10 g · 10′ », et l'effet du groupe dessiné une fois (« ~+0,9 » cran)
- q2b-ligne-voie : repris — une ligne par voie : usage en mot, nom, α, dose, stock en icône, familles en pictos avec traits par cran
- q2b-plus-coche : repris — « + » / ✓ à droite de chaque voie, branché sur la liste de comparaison du socle
- q2b-assembler : repris — « Assembler 5 + 5 g · 10′ · estimé » (Motueka + Nelson Sauvin, du moteur)
- q2b-remplacer : repris — « Remplacer Nugget · 60′ », une ligne par remplaçant à IBU égal avec sa dose (74 g…)
- q2b-comparer-n : repris — la barre « Comparer (n) » en bas, qui ouvre Comparer avec la liste
- q2b-bande-visee : écarté — le brasseur l'a jugée « Ça c'est inutile » (D91) ; la visée se lit sur les pistes

## Idées reprises

- Les voies viennent du moteur, groupées comme dans q2b :
  - même effet sur les objectifs, à même moment et même dose ;
  - Assembler ;
  - Remplacer ;
  - Dry hop, qui est un geste de q2b.
  Les cases sont alignées par famille dans un groupe, et la jauge compte un trait par cran (orangée hors du style).
- De l5b : la piste sous chaque objectif (D92).
- Enrichi :
  - deux voies proposées au départ (la meilleure du stock à 10′ et le meilleur dry hop) ;
  - les houblons retenus marqués sur les pistes ;
  - le nom de la meilleure voie sous « Atteint » ;
  - le radar réel (ma bière, la zone du style, les voies retenues) ;
  - l'effet d'un houblon « muet » (cryo, simulateur) rendu inconnu, jamais 0.

## Écarts

- **Deux cartes, pas trois.** q2b (cas c1 du lot 15) avait « Plus agrumes ». La stout S1 du parcours n'a que deux
  objectifs dans sa dégustation du 18.10 (plus floral, moins résineux), comme la base v4.10.
- Titre en question en tête (en-tête de `CadreOutil`) et ligne de contexte « fixé Stout 16D · US-05 » : demandés par
  `controle-une-question` (D98). q2b n'en avait pas.
- Groupe « Dry hop · 4 g/L · après 3 j » : il vient de `suggerer` (simulateur, dégustation comprise), pas de
  `proposer`, qui ne propose pas de dry hop ici. Idaho 7 n'est que là. Les verdicts comparent l'effet de la meilleure
  voie au cran voulu : Atteint, le cran entier ; Approche, la moitié au moins.
- « Diminuer Nugget » (voie du moteur) n'a pas de ligne : il n'y a pas de houblon à comparer. Les leviers levure de
  q2b passent par l'étape Levure (p4).
- Usage en mot court (amer, arôme, mixte) au lieu des pictos goutte/vague de q2b (D90 : « pas parlant du tout »).
- « α », « ≠ », « ≈ » et « › » sont posés par la feuille de style (signes) : le premier écran tient à 80 mots.
- Rayons ramenés à 8 px (D83) : cartes et lentilles (`rounded-control` de l'app vaut 10 px).
- Ma bière, montée sous l'outil, est retirée du rendu tant que Suggérer est ouvert (les contrôles lisent la boîte).

### Contrôles écartés, et pourquoi

- `controle-moments` : lié aux cas figés du lot 15 (`data-cas`, `donnees/<cas>.json`). Le moteur calcule ici en direct ;
  les moments sont ceux des voies proposées, écrits dans l'en-tête de chaque groupe. Le « + » vers Comparer est vérifié
  par `jeu.mjs`.
- `controle-usage-intensite` : même raison ; D80 est vérifié en direct par `jeu.mjs` (témoin : échoue sur data-crans,
  extra ou usage faussés).
- `controle-cumul-levure` : Suggérer ne règle pas la levure (L10) ; elle est contrôlée dans son étape (p4).
- `controle-autres-ajouts` (gardé, G6) se joue sur `cas-direct.json`. C'est l'instantané des voies de l'écran à l'état
  de départ, écrit par `outils/instantane.mjs` depuis `window.__suggerer` (calculé par `voies.ts` depuis le moteur).
  `jeu.mjs` vérifie la même règle en direct, contre `proposer` et `suggerer`.

## Pour l'app

- `index.tsx` → `src/ui/hops/HopSuggest.tsx` (route `hopSuggest`) ; `voies.ts` → `src/domain/hopTools/suggest.ts` (pur) ;
  `briques.tsx` et `radar.tsx` → `src/ui/hops/`, à fusionner avec les briques de la fiche (p1) : une seule écriture de
  l'α, de l'usage et de l'intensité.
- Il faut une **direction** dans l'app, tirée de la dégustation (« trop résineuse ») et de la visée du brasseur
  (« plus florale »), et un geste dry hop dans `proposeVoies`, pour ne plus mêler deux sources.
- `proposer` coûte environ 90 à 130 ms à froid (mémoïsé) : il ira dans le Web Worker avec `suggerer` sur le catalogue.
- La liste de comparaison (`aComparer`) vit dans le brouillon d'outil, en mémoire, et ne s'écrit pas dans Dexie.
- Pistes hors houblon : `offModelLeads` est importé du moteur. L'adaptateur devrait l'exposer.
- `jeu.mjs` et `outils/instantane.mjs` → `scripts/` (contrôles de parcours).
