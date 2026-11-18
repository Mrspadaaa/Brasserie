# l5a — l2 + la conduite de l4b ; effets en pastilles de famille ; palier fantôme « + » au bout (passe 3, 09.11)

Ses mots : « ça donne pas assez d'infos sur la levure … tiole, banane, cou de girofle, ether, épicé » ; « la plage de la levure sur
ta conduite : ça c'est parfait … Je veux pouvoir facilement en ajouter ou enlever ».
Base : la ligne et la bande de l2, puis la station Conduite de l4b (plage de la levure en aplat 8 % derrière les paliers). La plage
est maintenant nommée dans la ligne sous le titre (« US-05 · 18–26 °C » avec sa pastille tiretée), plus sur le dessin, où son
étiquette couvrait les « 19 °C ».

## Effets de fermentation (sous la bande, dans le même cadre)
Pastilles colorées par famille, comme les arômes des houblons : esters (orange), phénols (brun), thiols (vert), terpènes (vert
olive), sucres restants (brun clair). Inconnu : pastille tiretée ambre « ⌕ … · non documenté » (toucher = recherche IA, l2).
Valeurs de `savoir/TROUS-COMBLES.md`, rien d'autre :
- US-05 : fruité · faible [1][2] ; épicé, girofle · non documenté (Fermentis ne déclare rien) ; thiols, terpènes · non documentés ;
  sucres restants 11 g/L · mesure fabricant (TDS 2018, essai labo).
- LalBrew Abbaye : tropical, banane à chaud [21] ; épicé · présent (POF+ déclaré, sans niveau) ; thiols · faible, terpènes · moyen
  (tableau Lallemand [22]) ; sucres restants · non documenté. Fiche : 17–25 °C, 77–83 %, floculation moyenne, 50–100 g/hL.
- LalBrew Verdant IPA : abricot, tropical [17] ; épicé · aucun (POF− déclaré, pastille creuse) ; thiols · élevé, terpènes · moyen
  [22] ; plus de corps (« un peu plus de corps qu'une IPA US » [17]). Fiche : 18–25 °C, 75–82 %, floculation moyenne, 50–100 g/hL.
- Calculs de démonstration (OG 1,066, 30 L) : Abbaye FG 1,011–1,015, Verdant 1,012–1,017 ; 15–30 g → 2–3 sachets de 11 g.
- Couleurs de famille choisies ici : à aligner au port sur les familles des houblons. Le mot « girofle » ne figure que pour US-05,
  et comme inconnu ; pour Abbaye, la source dit « épicé », pas « girofle ».

## Paliers (geste : le palier fantôme)
- Un palier fantôme tireté avec un « + » au bout du graphe ajoute un palier après le dernier ; le palier touché porte un × dans son coin.
- Cadres : 4 paliers, palier 2 touché (× visible) → × touché : 3 paliers, fin J9 (les suivants gardent leur durée, comme l'app) →
  « + » au bout : 5 paliers, le neuf « ? °C · ? j », « fin ? » (l'app : « température et durée à renseigner ») → 1 palier seul, sans ×.
- La bande de la levure couvre les paliers de fermentation contigus depuis J0 (≥ 10 °C), pas la garde à froid.

## Boosters UX
`ligne-levure`, `dose-sachets`, `bande-reperes`, `effets-pastilles`, `chercher`, `champ-levure`, `conduite-plage`,
`retirer-palier` (×), `ajouter-palier` (fantôme). B8 OK (inconnu tireté, jamais zéro ; palier neuf « ? ») · B9 s.o. (statique) ·
B13 ~ (× et + de 22 à 26 px).

## Contrôles
PAGE OK. Mots au premier écran : 104 (70 hors données) : au-dessus de 72, les effets ajoutent une vingtaine de mots demandés.
Captures : `l5a-cadres.png`, `l5a-c1.png` à `l5a-c7.png`, `l5a-haut.png`.
