# Suggérer — « Quel houblon ajouter à ma bière ? » (voie p2-suggerer, 23.10)

## Base

- **q2b**, son choix : q2 (« cella là », 19.10, 14 h 34), puis q2b (« C'est effectivement qb2 reprise le mieux », 19.10,
  soir), tel qu'intégré dans la **base v4.10** (`work/refonte-frontend/v4/ecran-1/base/consolide/`).
- Captures regardées avant de dessiner : `fils15-s5-complexe/captures/q2b-b-390.png`, `base/captures/consolide-b-390.png`,
  `base/captures/consolide-suggestions-radar-390.png`, `fils22-carte/captures/suggerer-390.png` (sa place dans la carte).
- Socle p0 : `CadreOutil`, `LigneContexte`, `Legende`, `Picto`, `Pont`, `COULEURS`, `ROUE` ; `SegmentedControl` de l'app ;
  moteur `suggerer` (9 houblons du stock, 4 g/L, après 3 j, US-05), calculé en direct.
- Fiche : `Fiche` (défaut) et **`useGestesFiche` importés de la voie p1** (`src/ecrans/fiche`) : appui long sur toute la
  voie, survol long du nom à l'ordinateur, mêmes gestes que Ma bière. Rien n'est recopié.

## Idées reprises

- De q2b : une voie par houblon, dense (74 px, 8 voies au premier écran) ; le « + » qui ajoute à la comparaison et
  devient « ✓ » (D78) ; la ligne pointillée de la visée qui traverse toute la liste ; les **cases alignées par famille**
  (même place d'une voie à l'autre), une jauge d'un trait par cran du style, en contour si la famille baisse, orangée
  hors style (D80) ; les objectifs en tête (« Plus floral », « Moins résineux ») ; pas d'en-tête « ma bière » (D79) ;
  pas de gros fonds (D82).
- De l5b (D92) : la piste sous chaque objectif et sous chaque voie, zone du style pâle, rond « ma bière », barre
  « après », visée ; crans marqués par-dessus la barre.
- De la carte (fils22) : la question en titre, un seul facteur libre (le houblon), les autres fixés sur la ligne de
  contexte (L10, D98).
- Enrichi (plancher, L07) : les houblons choisis se marquent en direct sur la piste de l'objectif ; verdict
  « atteinte par Idaho 7 » ; au-delà du style, la barre passe à l'orangé (« trop résineuse » se voit) ; lentille au
  style (écart en crans) ou absolu (en points 0–100) ; familles inconnues pour cette bière dites une fois ; houblon
  « muet » (Citra cryo) montré inconnu, jamais « +0 ».

## Écarts

- Conditions : q2b comparait des voies de 10 g à 10′ (cas c1) ; ici 4 g/L après 3 j (carte), donc d'autres nombres et
  un autre ordre : Idaho 7 (+23 points, +1,3 cran), Target, Cascade, Galaxy (+16), Motueka (+13), Nelson Sauvin (+5).
- Plus de groupes « même effet », d'assemblages ni de « Remplacer Nugget » : Suggérer ne fait varier que le houblon (L10).
  Remplacer passe par Substituer, le dry hop et la levure par Dryhopper et l'étape Levure (D78, D52 bis).
- L'usage s'écrit en mot (D90), sans les pictos goutte/vague de q2b (« pas parlant du tout ») ; souligné en pointillé
  quand il est déduit de l'α (règle).
- « α » et « ≠ » posés par la feuille de style (signes) : « 12,7% » reste un nombre, le premier écran tient à 77 mots.
- Rayons de la lentille ramenés à 8 px (D83 ; `rounded-control` de l'app vaut 10 px).
- Ma bière, montée sous l'outil, est retirée du rendu (`display: none`) tant que Suggérer est ouvert : les contrôles du
  dépôt lisent la boîte et pas `inert`. À faire une fois dans le socle (`CadreOutil` ou la coquille).
- Citra cryo : le moteur rend un écart exactement nul partout (« huile du cryo non relevée ») ; l'écran le montre
  inconnu (hachuré, « ? »). Écart à corriger dans l'adaptateur (null plutôt que 0).

### Contrôles écartés, et pourquoi

- `controle-moments` : lié aux cas figés du lot 15 (`data-cas`, `donnees/<cas>.json`) ; le moteur calcule ici en
  direct, et Suggérer n'a pas de moments à régler (moment fixé en contexte). Le « + » vers Comparer est vérifié par
  `jeu.mjs`.
- `controle-usage-intensite` : idem ; D80 (intensité en crans à 0,6 près, usage comme hopRole) est vérifié en direct
  par `jeu.mjs`. Il passe aussi sur l'instantané (`USAGE-INTENSITE OK`).
- `controle-cumul-levure` : Suggérer ne fait varier que le houblon (L10) ; la levure est contrôlée dans son étape (p4).
- `controle-autres-ajouts` (gardé, G6) se joue sur `cas-direct.json`, instantané du moteur à l'état de départ, écrit par
  `outils/instantane.mjs` et désigné par `<body data-cas>` (chemin relatif depuis le dossier de cas du lot 15).
  `jeu.mjs` vérifie la même règle en direct (extras = familles hors objectifs qui bougent d'au moins 0,5 point).

## Pour l'app

- `index.tsx` → `src/ui/hops/HopSuggest.tsx` (route `{ view: 'hopSuggest', recipeId }`) ; `briques.tsx` (Piste, Traits,
  Usage, AlphaCourt, Stock, Lentille) → `src/ui/hops/` ; à fusionner avec les briques de la fiche (p1 : `AlphaLu`,
  `Usage`, `Intensite`) pour une seule écriture de l'α, de l'usage et de l'intensité.
- Les choix (« + ») restent un état local, passés à Comparer par la route (`hops: string[]`) ; Suggérer n'écrit rien.
- `suggerer` sur le catalogue entier (318 variétés, ~0,4 s estimées) ira dans un Web Worker ; les 9 du stock tiennent sur
  le fil principal (geste médian 8,7 ms, 21,9 ms au plus, `--ponts`).
- Le stock réel (Dexie) remplace `STOCK` ; « assez pour 4 g/L » se calcule sur le volume de la recette.
- L'adaptateur doit rendre `null` (inconnu) quand le simulateur n'a pas de données d'huile (cryo), au lieu de 0.
- `jeu.mjs` et `outils/instantane.mjs` → `scripts/` (contrôles de parcours).
