OK — Suggérer repris de q2b (D105) : voies du moteur groupées, Comparer (n), G1–G17 verts

## Reprise D105

Suggérer redevient q2b, tel que le brasseur l'a choisi. Il est calculé en direct ; la carte (fils22) ne donne plus que
les ponts.

### En tête

- Les onglets du socle « Ma bière · Suggestions · Comparer (n) », dans un `nav`. Un seul « ‹ », celui de l'en-tête.
- « ? » (légende), « Au style / Absolu » et « Barres / Radar ». La vue Radar est un vrai radar : ma bière, la zone du
  style, les voies retenues, les familles inconnues marquées « ? ».
- Les cartes d'objectif de la dégustation, teintées de leur famille, avec le verdict en un mot :
  - « Moins résineux » : « Aucune voie houblon » et « Hors houblon › », qui ouvre les quatre pistes hors modèle du
    moteur (`offModelLeads`) ;
  - « Plus floral » : « Atteint », et le nom de la meilleure voie (Idaho 7).
- Sous les cartes, la piste l5b de chaque objectif (D92). Le résineux passe à l'orangé au-delà du style.

### Les voies

Elles viennent de `proposer(recette, direction)` (14 voies, dont 13 montrées) et du dry hop de `suggerer`. Elles sont
rangées comme dans q2b (`voies.ts`) :
- « = même effet sur tes objectifs · 10 g · 10′ » : Golding, Motueka, Aurum, East Kent Goldings, Columbus,
  Motueka + Citra cryo, Citra cryo. L'effet du groupe est dessiné une fois (~+0,9 cran).
- « Assembler 5 + 5 g · 10′ · estimé » : Motueka + Nelson Sauvin.
- « Remplacer Nugget · 60′ » : 5 remplaçants à IBU égal, avec leur dose (74 g, 24 g…).
- « Dry hop · 4 g/L · après 3 j · estimé » : Idaho 7, Target, Cascade, Galaxy.

Chaque ligne montre :
- l'usage en mot court (amer, arôme, mixte) ;
- le nom, l'α du lot (« ≠ » s'il sort des fiches), la dose ;
- le stock en icône (coche, moins, chariot) ;
- les familles en pictos, alignées, avec un trait par cran, orangées hors style ;
- un « + » ou un ✓ à droite.

Le « + » / ✓ est branché sur `useComparaison` / `basculerComparaison` ; un assemblage ajoute ses deux houblons. La
barre « Comparer (n) » ouvre Comparer avec la liste.

Deux voies sont proposées au départ, comme q2b avait une voie cochée : Motueka (meilleure du stock à 10′) et Idaho 7
(meilleur dry hop).

Gardés de la version précédente : l'appui long et le survol ouvrent la fiche (`useGestesFiche` de p1), et le retour la
ferme.

### Fichiers

Dans `prototypes/houblons-v4/parcours/src/ecrans/suggerer/` :
- `index.tsx` (réécrit) ;
- `voies.ts` (nouveau, pur) ;
- `radar.tsx` (nouveau) ;
- `briques.tsx`, `suggerer.css`, `jeu.mjs` (réécrit), `NOTE.md` (avec « ## Reprise ») ;
- `cas-direct.json` et `outils/instantane.mjs`.

### Critères (rejoués après la dernière retouche)

| Critère | Sortie |
|---|---|
| G1 | CONSTRUIT OK (9 pages) |
| G2 | TYPES OK |
| G3 | COMMUN OK |
| G4 | suggerer 78 mots, MOTS OK |
| G5 | UNE-QUESTION OK (1 groupe libre : houblon) |
| G6 | AUTRES OK (17 voies) |
| G7 | PISTE OK (2 objectifs, pistes de 354 px) |
| G8 | PLACE OK (6 voies au premier écran, médiane 81 px) |
| G9 | MA-BIERE OK |
| G10 | ALPHA OK (17 voies sur 17) |
| G11 | ETAPE OK (suggerer) : 13 gestes |
| G12 | PONTS OK (19 gestes, recalcul médian 1,1 ms) |
| G13 | Test Files 1 passed |
| G14 | APP INTACTE OK |
| G15 | NOTE OK |
| G16 | NOTE OK |
| G17 | REPRISE OK (11 repris, 0 en contexte, 0 en pont, 1 écarté) |

- Les 13 gestes de G11 sont : D80 et D76 contre le moteur, « + », ✓, assemblage, Hors houblon, Absolu, Radar, fiche,
  retour, Comparer.
- Hors critères : USAGE-INTENSITE OK sur l'instantané.
- Témoin (L13) pour la vérification D80/D76 de `jeu.mjs` : intacte, elle rend true. Elle échoue sur un data-crans
  faussé, un extra retiré et un usage faussé.

### Captures ouvertes, côte à côte avec q2b-b-390.png

Dans `prototypes/houblons-v4/maquettes/parcours-p2/captures-suggerer/` :
- `suggerer-d105-390.png` : premier écran ;
- `suggerer-d105-390-legende.png` ;
- `suggerer-d105-390-assembler-remplacer.png` ;
- `suggerer-d105-390-dryhop.png` ;
- `suggerer-d105-390-radar.png` ;
- `suggerer-d105-390-hors-houblon.png` ;
- `suggerer-d105-fiche-390.png` ;
- `suggerer-d105-1280.png`.

Comparées à `fils15-s5-complexe/captures/q2b-b-390.png` et `base/captures/consolide-b-390.png` : la même suite (onglets,
réglages, cartes à verdict, groupe « = même effet », lignes à « + », Comparer (n)) et les mêmes voies de tête.

### Écarts aux nombres et à la forme de q2b

| | q2b (cas c1, lot 15) | Ici (stout S1, moteur en direct) |
|---|---|---|
| Objectifs | trois | deux (dégustation du 18.10, comme la base v4.10) ; « Plus agrumes » était un objectif du seul cas c1 |
| Groupe 10′ | Motueka, Aurum, East Kent Goldings, Columbus, Celeia… | Golding en tête (à acheter), Celeia absent : classement de `proposeVoies` |
| Floral | « Approche » | « Atteint » : le dry hop d'Idaho 7 (+23 points, +1,3 cran) dépasse le cran voulu ; les voies à 10′ font ~+0,9 cran |
| Résineux | « Aucune voie houblon » | pareil : le meilleur fait −2,6 points (remplacer Nugget), pour −10 voulus |

Autres écarts, écrits dans la NOTE :
- en plus de q2b : un titre en question et la ligne « fixé Stout 16D · US-05 », demandés par D98 ;
- l'usage en mot, pas en picto (D90) ;
- pas de ligne « Diminuer Nugget » (aucun houblon à comparer) ;
- la levure passe par l'étape Levure ;
- la bande « ‹ visée | visée » est écartée (« Ça c'est inutile », D91).

### Besoins dans le socle (pilote)

1. Ma bière, montée sous l'outil, reste lue par les contrôles du dépôt. Je la retire du rendu dans ma feuille
   (`display: none` tant que `.pq-outil-suggerer` est là). Il faudrait le faire une fois dans `CadreOutil` ou la
   coquille.
2. Le dry hop vient de `suggerer` (simulateur, dégustation comprise), pas de `proposer`. Un levier dry hop dans
   `proposeVoies` donnerait une seule source.
3. Les pistes hors houblon sont importées du moteur (`offModelLeads`). L'adaptateur devrait les exposer.
4. L'adaptateur rend 0 au lieu de `null` quand le simulateur n'a pas de données d'huile (cryo). L'écran l'écarte du dry
   hop (règle « muet »).
5. `controle-autres-ajouts` lit encore un instantané (`cas-direct.json`, `data-cas` relatif). Un mode `--direct` serait
   plus propre.

DÉCISION À PRENDRE (brasseur) : deux cartes d'objectif (la dégustation de la stout) ou trois comme dans q2b (ajouter
« Plus agrumes » serait inventer une visée).

Prédiction : « Oui, c'est mon q2b, avec les vraies voies ». Le risque : la liste est longue (17 voies) et les traits sont
petits.

CONNAISSANCE : sur la stout S1, `proposeVoies` ({ floral: +1, resin: −1 }) prend 90 à 130 ms à froid. Il rend 7 ajouts
ou assemblages au même effet floral (+15,9 points à 10′ pour 10 g) ; aucun ne baisse le résineux au-delà de −2,6
points.

LEÇON PROPOSÉE : avant de bâtir un écran de reprise, ouvrir la capture choisie et la poser à côté de la sienne dès le
premier rendu. Un contrat qui cite une carte ou une règle ne remplace pas la capture qu'il a choisie (D105).

## Version précédente (remplacée)

La première version suivait la carte (`fils22-carte/suggerer`) : candidats en dry hop, un facteur libre. Le brasseur l'a
refusée : « Je confirme que "Bière" et "Suggérer" divergent nettement du design choisi. Oui c'est quoi ce bordel ??? ».
Ce qui en reste : la fiche à l'appui long (p1), la piste l5b, les traits par cran, la règle « muet » et le témoin D80.
