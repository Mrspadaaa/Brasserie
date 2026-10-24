# Dryhopper — Quand ajouter Idaho 7 ?

Écran jouable, en React dans le socle, calculé en direct à chaque geste. Fichiers : `index.tsx` (écran), `frise.ts` (la
frise en direct, ★ parmi les crans calculés), `mesures.ts` (la vraie valeur du houblon en brouillon, la durée de contact
d'E10), `fiche-sur-outil.tsx` (la fiche de p1 posée sur l'outil), `dryhopper.css` (classes `pq-dry-`), `jeu.mjs`.

## Reprise D43 (voie r13-dryhopper, 24.10, soir)

Son choix, mot pour mot, sur p4b2f (« L'aire du floral », passe 5 de p4b2) : « Partir sur cette version ». Sur p4b2 : « Ça
j'aime beaucoup mais c'est encore assez peu lisible ». Règle n° 1 : p4b2f est la base de l'écran, reprise telle quelle,
tous ses états compris. a1 (provisoire depuis le 23.10) est remplacé.

### Ses états, relevés puis rendus
Relevé sur sa page (`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4b2f/etat.html`) :
`work/refonte-frontend/v4/choix/etats/dryhopper.json`, 24 états (21 rejoués, 3 voulus), chaque mot d'un « attendu » lu sur sa
page puis retrouvé ici. Captures côte à côte : `choix/etats/captures/etat-dryh-<état>-choisie.png` et `-construite.png`.
Témoin `controle-etats --choisie --ecran=dryhopper` : ETATS OK 21/21 ; maquette : ETATS OK 21/21.

Ce qui est rendu tel quel, sur le moteur en direct (`calculerFrise` → `simulerMoment` → `simulerCas`, 24 crans) :
- « Face à ta stout ✿ ~+22 », la pastille « ★ actif · 2 j » (vert pâle quand le moment tenu est ★), la ligne « contre ★ :
  floral … · résineux … · trop amer » ailleurs qu'à ★ ;
- les quatre étapes en tête de figure (ébullition, WP, actif, après ; soulignées d'orangé quand le saut est trop amer) ;
- le bandeau des quatre chiffres du moment en 16 px (floral, baies, résineux, IBU ; orangé hors du style, « 60+? » à cru) ;
- le dessin de p4b2f, même géométrie (viewBox 366 de large) : l'aire du floral, baies et résineux en traits nommés au bout,
  points pleins aux moments calculés, pointillés interpolés (≈), +10 / +20, zones grises du whirlpool et de l'après, la
  bande de 24 cases d'IBU (orangée au-delà du style, grise dedans, hachurée à cru), la bosse de levure « levure active /
  possible, non chiffrée », « levure finie », les moments mesurés sur l'axe (● 38 µg/L, ● 1 h ≈ 96 h), ★, le trait du doigt
  et ses trois anneaux ;
- le rail sous l'axe (quatre zones, points des crans calculés, pouce et sa pastille « ● 2 j » au point d'Idaho 7), la loupe
  sous le rail pendant le geste (cinq cases à 66 px : moment, barre de floral, valeur ou « sans gain »), les crans de la
  seule étape sous le doigt ;
- les jours 1, 2, 3, 7 j (pointillés « sans gain ») ; les 12 barres l5b de p4b2f (16 px, zone du style, rond d'avant, « ?→~+21 »
  quand ma bière avant n'est pas décrite, hachuré « ? » quand la famille est inconnue) ; au style / absolu ; la légende ;
- la vraie valeur du moment (« mesuré linalol 38 µg/L (McCabe 2023) », « jamais mesuré à ce moment ») et le pont
  « Levure Pomona ~+13 agrumes › » ; l'écran s'ouvre sur ★, comme le rail de p4b2f (un ajout neuf seulement, une fois, dans
  le brouillon ; un ajout déjà dans ma bière garde son moment).

### Écarts, chacun avec sa raison
- **Continuité (D129)** : la tête des outils (croix ronde de 44 px, D109 ; titre à 18 px) ; le pied « Annuler · Levure › »
  en bas de l'écran (D120), l'action en aplat noir comme Substituer et Levure ; la vraie valeur passe juste au-dessus du
  pied (dans p4b2f, elle se tenait à côté du pont, au bas de la page). Le rail reste sous l'axe, au-dessus du pied (lecture
  la plus proche de sa capture : sous les courbes, le trait du doigt les traverse).
- **Tenir dans l'écran** : avec la tête et le pied de l'app, sa page aurait débordé de 70 px. « ? » et la lecture montent sur
  la fin de la ligne de contexte (p4b2f leur donnait une ligne), les blocs sont à 2 px (5), les barres à 17 px (18), les
  jours à 22 px du rail (26). Tout l'écran tient au-dessus du pied, comme sa page de 844 px (701/701 px de défilement).
- **D35 (rail)** : « possible, non chiffrée » passe à 16 d'écart de « levure active » (12) et « levure finie » commence à
  l'après sur la première ligne (calée à droite sur p4b2f) : sur sa page, les trois textes se chevauchaient.
- **D46** : le pouce suit le doigt en continu, la valeur s'accroche au cran (sur p4b2f, il sautait de cran en cran).
- **D106 (teinte)** : l'aire du floral à 18 % (22 %) : sur la page blanche des outils, elle est l'un des quatre grands
  aplats clairs et sortait de la neutralité de ses aplats (teinte 16 contre 8 ; TEINTE OK à 12).
- **S4** : le chevron du pont à 12 px au trait de 2,5 (10 px et 3,6) : une seule épaisseur d'icône sur l'écran.
- **Données (REPRISE § 8)** : Végétal « ? » (p4b2f « ~+5 ») : aucune source d'Idaho 7 ne le décrit dans le moteur ; l'IBU
  est calculée à la minute (« ~161 » à 60′ contre « ~162 » sur sa grille, « ~121 » à 20′ contre « ≈119 »).
- **L14** : après fermentation, sa page dit « mesuré 1 h ≈ 96 h au nez (Titus 2021) » ; l'étude (E10) porte sur Cascade. La
  ligne dit « (Titus 2021, sur Cascade) », lue dans `comparatifs-dryhop.json` (`dureeDeContact`).
- La légende réécrit sa deuxième phrase (« Colonnes grises … Bande 50–70 », celles de p4b2, que p4b2f ne dessine plus).
- L'appui long sur Idaho 7 ouvre la vraie fiche (D25, acquis fiche g1), pas la fiche courte de sa page.

### Acquis y1b
`etat-acquis-y1b-brassin-au-doigt` (acquis.json) se rejoue sur p4b2f, son héritier : « Quand ajouter », « Face à ta stout »,
US-05, Pomona, ébullition, WP, actif, après, au style / absolu ; `attend_choix` retiré. « Tire 20 bières », « Défi 2 sur
4 », « Preuve », « second houblon » et la dose réglable ne sont pas sur p4b2f : non inventés (décision au pilote).

### Mesures
- Premier écran, 390 × 844 : 106 mots (sa page : 106), au-dessus du seuil modéré de 98 (D41) : ses mots sont gardés.
- Loupe : 66 px entre deux cases contre ≈ 15 px entre deux crans du rail (×4,3). Ouverture : 24 crans, 15 ms (390) ;
  un geste : 1,5 à 2 ms (`parcours-complet`).

## Pour l'app
- `index.tsx` → `src/ui/hops/HopTiming.tsx` ; route `{ view: 'hopTiming', recipeId, additionId }`.
- `frise.ts` → `src/ui/hops/hopTiming.ts` ; le calcul de la frise dans un Web Worker, le cran courant sur le fil principal.
- `fiche-sur-outil.tsx` : un crochet commun `useHopSheet()`.
- À brancher : l'α du lot réel (Dexie), le stock réel, la persistance (Dexie puis Firestore), une table de mesures sourcées
  (E03, E10) servie par l'adaptateur. Le type `Quand` et les minutes libres sont à créer dans `src/types/`.
