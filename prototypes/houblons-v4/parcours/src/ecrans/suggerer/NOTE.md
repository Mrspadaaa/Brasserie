# Suggérer — q2b, « Quel houblon ajouter à ma bière ? » (voie p2-suggerer ; reprise D105, 23.10 soir)

## Reprise D124 (24.10, voie r4) : tous les états de q2b

« Ça a bien avancé mais […] certaines de mes choix ont été perdue » (D124). Relevé : `work/refonte-frontend/v4/choix/etats/suggerer.json`
(18 états) ; chaque déclencheur porte `data-etat` (controle-etats.mjs).
- **Trois cartes** comme q2b : Moins résineux · Plus floral · Plus agrumes. Sans visée, la demande de q2b (`DEMANDE_Q2B`,
  voies.ts : + floral, + agrumes, − résineux) ; le moteur rend alors exactement les voies de q2b (Motueka… Citra cryo, puis
  Nelson Sauvin, Galaxy, Hallertau Blanc ; Assembler Motueka + Nelson Sauvin ; Remplacer Nugget par Motueka 74 g,
  Hallertau Blanc 63 g, Nelson Sauvin 62 g ; dry hop actif Motueka 20 g) et ses IBU (62,7 ; 61,4…). Verdict de q2b : la
  meilleure voie **qui reste au style** (Plus floral : Approche ; Plus agrumes : Atteint ; Moins résineux : Aucune).
- **Barres divergentes l5b** (divergent.tsx) : l'axe central noir sur toute la liste, la visée en tirets ; à droite ce qui
  monte, à gauche ce qui baisse ; un couloir par objectif ; plein (marqué), pâle (cité), blanc (baisse ou sans fiche),
  orangé hors style, hachures (non établi). Une fois par groupe au même effet (« +1 cran », « +2 crans »), puis une
  rangée sous chaque voie hors cadre (Assembler, Remplacer, Dry hop). Plus de chiffre « ~+0,4 » à la place des barres.
- **Deux groupes « = même effet »**, chacun dans son cadre à bord noir.
- **Dry hop · actif** : le levier « houblonner à froid en fermentation active » du moteur (proposeVoies, leviersLevure),
  avec les pastilles de biotransformation de q2b (floral → agrumes, tropical et baies, « creep », yeastSignals). Le dry
  hop « 4 g/L après 3 j » du simulateur (Idaho 7), ajouté par 5345f6ad, est retiré : il n'est pas dans q2b et touche
  Dryhopper (choix ouvert).
- **IBU après chaque voie (ma bière 59,7 ; style 50–70)** : le repli de q2b, l'IBU de chaque voie lu du moteur.
- **♡ → aimer · neutre · exclure** (base v4.10) ; exclure retire ses voies, « Exclus : … × » les rend.
- **Mode Radar** de la base v4.10 (vue-radar.tsx) : objectifs en rangées, radar à 12 axes (ma bière, la voie montrée en
  plein), trois voies avec « ‹ 10′ › » (par 5′, de premier moût au whirlpool), dérive d'IBU, « Montrer sur le radar »,
  « Appliquer à la recette » (Annuler) et « +11 ».
- Retraits : la bande « ‹ visée | visée › » (D91) ; le groupe « Changer de levure » (D35, Levure au choix ouvert).

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

Base : `base/captures/consolide-b-390.png` (base v4.10, onglet Suggestions) et `fils15-s5-complexe/captures/q2b-b-390.png`,
côte à côte avec la mienne (reprise D117, 23.10, nuit : « J'ai l'impression que cette vue suggestions et pas la bonne que
j'ai vraiment choisir ?? »). Inventaire : `fils15-s5-complexe/donnees/inventaire-q2b.json` (16 éléments).

- q2b-onglets : repris — la tête des trois onglets dans l'en-tête (`Onglets` du socle, posé par `CadreOutil` en `mobileHeader`), la croix à la place du « ‹ » (D109) ; plus de question en titre ni de ligne « fixé » (D117)
- q2b-reglages : repris — « Au style / Absolu » et « Barres / Radar » sous le bandeau, en lecture seule (data-lecture)
- q2b-bandeau-ibu : repris — le `Bandeau` de Ma bière (importé de `ecrans/ma-biere/Base`), IBU et sa jauge face au style, OG, EBC ; collé sous la tête quand la liste défile, comme la base
- q2b-cartes-objectifs : repris — une carte par objectif, la visée « plus » d'abord comme la base, teintée de sa famille, picto, pastille orangée si hors style, verdict en un mot
- q2b-hors-houblon : repris — « Aucune voie houblon » et « Hors houblon › », qui déplie « Hors houblon · résineux (n pistes) » en bas, comme la base (offModelLeads)
- q2b-piste-objectif : repris — sous les cartes, la piste l5b de chaque objectif (D92 : « Les bar de ce type sont plus informative donc meilleur »)
- q2b-groupes-effet : repris — « = même effet sur tes objectifs · 10 g · 10′ », et l'effet du groupe dessiné une fois (« ~+0,9 » cran)
- q2b-cadre-liste : repris — les voies d'un même effet dans un cadre blanc arrondi (8 px, D83) à bord gauche noir de 6 px
- q2b-ligne-voie : repris — une voie en deux lignes : usage en mot (D90), nom souligné en pointillé (appui long : la fiche), α, stock en icône ; puis les familles
- q2b-cercle-objectif : repris — les familles des objectifs d'abord, chacune dans son cercle (à l'encre si les fiches la marquent), un trait vertical, puis les autres ; picto pâle si les fiches ne font que citer
- q2b-coeur : repris — ♡ à gauche du « + » : j'aime ce houblon (en mémoire ; au portage, la table des goûts de la fiche)
- q2b-plus-coche : repris — « + » / ✓ à droite de chaque voie, branché sur la liste de comparaison du socle
- q2b-assembler : repris — « Assembler 5 + 5 g · 10′ · estimé » (Motueka + Nelson Sauvin, du moteur)
- q2b-remplacer : repris — « Remplacer Nugget · 60′ », une ligne par remplaçant à IBU égal avec sa dose
- q2b-comparer-n : repris — la barre noire « Comparer (n) » pleine largeur, posée sur la liste sous le pouce
- q2b-bande-visee : écarté — le brasseur l'a jugée « Ça c'est inutile » (D91) ; la visée se lit sur les pistes

## D110 : les traits lisibles au toucher

- Les traits de q2b restent (un trait par cran du style, demi-trait, contour si la famille baisse, orangé hors style,
  hachures pour l'inconnu, point pour une famille qui ne bouge pas). Rien de plus au repos.
- Toucher une case (`bulle.tsx`) montre au-dessus d'elle une bulle à l'encre : « Floral +0,9 cran », puis la clé du
  signe touché (« 1 trait = 1 cran du style », « · creux : baisse », « · hors style » ; « ? non établi » et « rien de
  simulé, jamais 0 » ; « ne bouge pas » et « moins d'un demi-point »). Un toucher ailleurs ou Échap la ferme ; elle suit
  sa case au défilement. Ni route, ni comparaison, ni fiche. À l'ordinateur : survol, clic pour la fixer.

## Retouches D106 et visée commune (23.10, soir)

- D106 : thème des maquettes (page blanche, gris neutres, action noire). Les cartes d'objectif sont ramenées à la
  hauteur de q2b, trois par rang au plus, verdict sur une ligne. Leur teinte de famille est adoucie vers la page
  (`color-mix` à 45 %) ; controle-teinte : teinte 4, comme q2b. L'onglet inactif du socle est foncé à 4,5:1 dans ma
  feuille.
- Visée commune : les objectifs et la direction de `proposer` viennent de `useVisee()` (sans visée, la demande dégustée :
  + floral, − résineux), réglée dans l'onglet Ma bière. Depuis D108 (voie p1), bannir est une visée à 0 : une carte
  « Sans épicé » et une direction en baisse, sans exclure de houblon. L'écran écrit sa direction (`data-direction`) ;
  `jeu.mjs` la relit et vérifie les voies du moteur pour elle, au départ puis après « bannir l'épicé ».

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

- ~~Deux cartes, pas trois~~ : remplacé par la reprise D124 (trois cartes, comme q2b).
- **Pas de question en titre, pas de ligne de contexte** (D117, sa base) : `controle-une-question` (G5) les exige ; il échoue
  sur ces deux points. Conflit signalé au pilote (RESULTAT.md) ; son choix prime (règle n° 1).
- **Le « ? » de la légende reste**, discret, entre les deux lentilles : ses mots D89 (« il faut un bouton légende un peu
  caché pour pas que ça gêne ») et `controle-legende` (G3). L'inventaire D117 le dit « en plus » : à trancher par le pilote.
- « IBU après chaque voie » : rendu (D124), lu de `voie.ibu.after`.
- Groupe « Dry hop · actif » (D124) : le levier du moteur, comme q2b ; le dry hop du simulateur (Idaho 7) est retiré. Les verdicts comparent l'effet de la meilleure
  voie au cran voulu : Atteint, le cran entier ; Approche, la moitié au moins.
- « Diminuer Nugget » (voie du moteur) n'a pas de ligne : il n'y a pas de houblon à comparer. Les leviers levure de
  q2b passent par l'étape Levure (p4).
- Usage en mot court (amer, arôme, mixte) au lieu des pictos goutte/vague de q2b (D90 : « pas parlant du tout »).
- « α », « ≠ », « ≈ » et « › » sont posés par la feuille de style (signes) : le premier écran tient à 80 mots.
- Rayons ramenés à 8 px (D83) : cartes et lentilles (`rounded-control` de l'app vaut 10 px).
- Ma bière, montée sous l'outil, est retirée du rendu tant que Suggérer est ouvert (les contrôles lisent la boîte).
- Les verdicts viennent du moteur en direct : « Plus floral : Atteint » (la base disait « Approche » sur ses nombres figés).
- Cartes : rayons de 8 px (D83), non 16 ; pictos au trait du socle (D88, D93), sans disque : le cercle d'objectif est une
  bordure sur fond blanc neutre.

### Contrôles écartés, et pourquoi

- `controle-moments` : lié aux cas figés du lot 15 (`data-cas`, `donnees/<cas>.json`). Le moteur calcule ici en direct ;
  les moments sont ceux des voies proposées, écrits dans l'en-tête de chaque groupe. Le « + » vers Comparer est vérifié
  par `jeu.mjs`.
- `controle-usage-intensite` : même raison ; D80 est vérifié en direct par `jeu.mjs` (témoin : échoue sur data-crans,
  extra ou usage faussés).
- `controle-cumul-levure` : Suggérer ne règle pas la levure (L10) ; elle est contrôlée dans son étape (p4).
- `controle-autres-ajouts` (gardé, G6) se joue sur `cas-direct.json`. C'est l'instantané des voies de l'écran à l'état
  de départ, écrit par `outils/instantane.mjs` : les voies dans l'ordre de l'écran (`data-voie`, `data-id`), leurs effets lus du
  moteur (`proposer`, `suggerer`).
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
- **Tête et croix (D109, D118, D119)** : `CadreOutil` passe `Onglets` (Suggérer, Comparer) ou `TeteOutil` (les autres) en
  `mobileHeader` de PageShell, et `commun/retour.css` la montre à toutes les largeurs en masquant le titre par défaut. Dans
  l'app : une prop `header` de PageShell (au lieu de `mobileHeader` + CSS), et la croix 44 × 44 px, icône de 22 px à
  l'encre, qui appelle `closeTo(r => r.view === 'recipe')` (étape Houblons) ; le retour du téléphone garde `close`.
  `aria-label="Fermer"` reste pour les scripts du parcours.
- Bulle des traits (`bulle.tsx`) → `src/ui/hops/TraitBubble.tsx`, réutilisable dans Comparer et la fiche.
