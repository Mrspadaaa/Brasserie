# r6p2 · La réponse d'abord

Comparer, lot 22 ter : « Lequel pour ma stout ? ». Page `etat.html`, générée par `generer.mjs` depuis
`../donnees/comparer-stout.json` ; captures par `captures.mjs`. Plancher : r6n2 (copie de `r6n2/generer.mjs`,
classes renommées `r6p2-…`, r6n2 intact). Chaleur tiède : la forme de l'angle, sur r6n2 inchangée ailleurs.

## Choix portés

- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A : « groseille à maquereau » et « gooseberry » rangés dans Petits fruits (fiche à l'appui long) ; seul
Nelson Sauvin a ces mots (67 % de mots hors familles avec A, contre 83 % sans).

## L'angle : la réponse d'abord (b4 de Dryhopper)

Ses mots sur b4 : « pas mal, la réponse direct et pourquoi ». Dans r6n2, la réponse était une phrase de 14 px
(« Idaho 7 devant Cascade ~0,4 cran »). Ici, elle est la chose la plus grosse de l'écran, dans un cadre à filet noir
comme celui de b4 :

1. **La réponse** : « ★ ● Idaho 7 ✓ par [❀ floral ⌄] … ❀ ~+1,3 ». Le nom en 20 px, le ✓ (reste dans ta 16D) ou ⚠
   et le picto de la famille qui sort, la pastille de critère de y1b juste après, et à droite ce que ★ gagne face à
   ta stout (le même nombre que sous sa barre).
2. **Le pourquoi, deux ou trois signes par houblon** : « contre ★ · ● Cascade ❀ ≈−0,4 · ● Galaxy ❀ ≈−0,4 ⚠🍍 › ».
   Chaque autre houblon, sa perte sur le critère contre ★, et ⚠ avec le picto s'il sort de ta 16D. « = » sous
   0,15 cran (sous l'incertitude). En vert, un écart qui va dans le sens de ta demande (moins de résineux, plus du
   reste). Toute la ligne s'ouvre au doigt : « Pourquoi ce classement », les chiffres et la phrase « les bandes se
   recouvrent : un indice, pas une preuve ».
3. **Toucher une autre colonne écrit sa perte chiffrée contre ★** (la ligne du doigt de b4, « à 35′ contre ★ :
   floral ≈−14 ») : « ● Cascade contre ★ ❀ ≈−0,4 🌲 = » ; Galaxy : « ❀ ≈−0,4 🌲 = ⚠ sort 🍍 » ; Nelson Sauvin (à
   quatre) : « ❀ ≈−1 🌲 ≈−1,1 » (vert : moins résineux). La ligne prend le liseré et le fond de la colonne touchée.
   Familles en picto seul dans cette ligne : à 390 px, les mots ne tenaient pas avec Galaxy.
4. **★ suit dans la tête de colonne** (à la place du point de couleur) : on voit d'où vient la réponse.
5. **« moins résineux »** donne la leçon de ta demande d'un coup d'œil : « ★ Cascade … contre ★ Idaho 7 🌲 = ·
   Galaxy 🌲 = » ; aucun houblon ne baisse le résineux (Défi le redit : aucune voie houblon, pont Suggérer).
6. **À quatre colonnes**, les noms de « contre ★ » deviennent les ronds lettrés de w2 (C, G, N), à la couleur du
   houblon, sinon la ligne débordait.

## Ce que j'ai payé (80 mots au plus ; r6n2 : 79, r6p2 : 71)

- Le titre : « Cascade, Idaho 7 ou Galaxy pour ma stout ? » devient « Lequel pour ma stout ? », en 14 px gris : la
  question devient l'amorce, la réponse le titre. Les noms restent dans la réponse et les colonnes, et l'écart
  d'ordre titre / colonnes relevé par le critique disparaît.
- « Face à ta stout, par » devient « par » (le titre dit déjà « ma stout »), et « pourquoi ? » écrit devient le
  chevron de la ligne du pourquoi (aria-label « Pourquoi ce classement… »).
- Le pont « Dryhopper → » monte dans l'en-tête, à la place libérée par le titre court : sans lui, la pastille
  « moins résineux » et le nom « Cascade » ne tenaient pas sur la ligne de la réponse (chevauchement vu sur capture).
- Trois tailles de texte au premier écran : 20 (la réponse), 14, 12. Le titre passe de 17 à 14 pour ne pas en
  ajouter une quatrième (D2).
- Hauteur : le tableau finit 4 px plus bas que dans r6n2 (Végétal à y 719 contre 715 sur 844) ; rien d'autre ne
  bouge, aucun vide nouveau (comparé à `captures/r6n2-premier-ecran.png`).

## Idées reprises

- La réponse directe et son pourquoi — b4 de Dryhopper (`fils23-dryhopper/serie-b/passe2/b4`), ses mots « la réponse
  direct et pourquoi » → le cadre de réponse sous le contexte.
- La ligne du doigt rangée à son solde, « contre ★ » — greffe b4 de `voies/r7-verdict/RESULTAT.md` → la seconde ligne
  du cadre, réécrite au toucher d'une colonne.
- Le rond lettré de w2 → « contre ★ » à quatre colonnes.
- Radar moins rose — reste du critique (`voies/r6nc2-critique/RESULTAT.md`) → moustache et « // » à l'encre
  (opacité ,38 et ,6) au lieu de la couleur du houblon ; surface pleine à 16 % au lieu de 20 %.
- Pont de la Frise nommé depuis le cas — reste du critique et sa leçon proposée → « enchaîner Idaho 7 puis Galaxy »,
  construit depuis les données (★ de départ, puis le houblon qui sort de ta 16D), plus Citra.
- Pomona sans forme de bouton dans Souche — reste du critique → « US-05 ; Pomona en aperçu », sans puce.
- « 1 seule fiche » sans source (D71) : déjà corrigé dans le noyau partagé (« 1 seule fiche : Beer Maverick »), vu
  sur `r6p2-fiche-390.png`.
- Non repris, et pourquoi : les pistes Floral ↑ / Résineux ↓ et le défi au premier écran de r6n1 (l'angle d'une autre
  variante, et pas de place sans perdre la densité de r6n2) ; la teneur du lot (CoA d'Idaho 7) absente des données
  du cas ; la table d'IBU « trop amer » (Défi garde « même amertume en ébullition »). La grille des 20 bières reste
  telle quelle derrière Preuve.

## Reprise

- y1b-face-a-ta-stout : repris et grandi — la réponse elle-même : ★ et le houblon en tête, en grand, ce qu’il gagne à droite (~+1,3), puis la ligne « contre ★ » (deux ou trois signes par autre houblon) ; toucher une colonne y écrit sa perte chiffrée contre ★
- y1b-pastille-critere : repris — la pastille « par [floral ⌄] » dans la réponse, juste après le nom ; un choix reclasse les colonnes, change ★ et la ligne « contre ★ »
- y1b-jauge-amertume : repris — feuille Défi, carte « Amertume tenue » : Nugget 60′ 46 g, « + ? » à cru hachuré, doses pour 10 IBU à 10′
- y1b-dock-pouce : en pont — Dryhopper ; la forme du dock range les touchers ; sa frise est dans la feuille Frise, lien vers Dryhopper
- y1b-plan-d-avant : repris — le trait noir de ta stout dans chaque barre, son polygone au radar, la colonne Ta stout
- y1b-bandes-style : repris — les rangées : zone 16D pâle, orangé au-dessus, inconnu hachuré, moustache de la plage
- y1b-ligne-contexte : en contexte — Stout 16D, 4 g/L chacun, après 3 j, US-05
- y1b-defi : repris — dock « Défi 2/4 » : ta dégustation, score par houblon, quatre critères
- y1b-tirage-preuve : repris — feuille Preuve : 20 bières tirées par houblon et par famille, « 20 autres »
- y1b-levure-pastilles : en pont — Levure ; feuille Souche : US-05 | Pomona, ce que Pomona change, lien vers Levure
- y1b-second-houblon-puis : en pont — Dryhopper ; feuille Frise : la case « puis » et son « + », lien vers Dryhopper
- y3-panel-osu : repris — feuille Preuve, sans molette
- y3-pour-egaler : repris — feuille Égaler : agrumes de Cascade 4 g/L, tropicaux de Galaxy 4 g/L, même amertume
- v1-vraies-valeurs : repris — feuille Valeurs : α, β, huile, dans les colonnes des houblons, sourcés
- v1-en-a-plus : repris — feuille Valeurs, en tête : « X en a plus | Y en a plus », ⇄ change le houblon d'en face
- v1-linalol-en-biere : repris — feuille Valeurs, linalol mesuré en bière, « pas comparables entre eux »
- w2-piste-commune : repris — feuille Défi : une piste par objectif, un rond lettré par houblon sur la même règle ; le rond lettré revient dans « contre ★ » à quatre colonnes
- w2-cartes-verdict : repris — les têtes de colonne : verdict face à la 16D en signe, familles qui sortent
- x3b-cuve-jour-apres-jour : en pont — Dryhopper ; feuille Frise : jour après jour (1 à 7 j) par houblon, lien vers Dryhopper
- a2b-ce-que-la-levure-change : en pont — Levure ; feuille Souche : « la cuve apporte » et « Pomona change », par famille
- d1-tout-ouvert : repris — feuille Valeurs : la chimie rangée par famille, une ligne par composé, rien d'ouvert d'office
- l5b-barres-voie : repris — les barres des rangées, depuis le trait de ta stout
- l5b-pistes-objectif : repris — feuille Défi : piste à la couleur de la famille, visée en pointillé, barre du houblon mis en avant, verdict en mot
- l8-disposition : repris — tournée : familles communes en rangées, houblons en colonnes, la réponse en tête
- l8b-verdicts-pictos-trait : repris — feuille Défi : signes Aucune, Approche, Atteint ; pictos au trait partout
- l8b-legende-cachee : repris — le « ? » en haut à droite ; la légende dit la réponse (★, « contre ★ », =, vert) et le dock
- l5f-carte-role-alpha : repris — les têtes de colonne (nom, α, rôle, familles, stock) et la carte de Nelson Sauvin derrière le « + »
- m4-radar-degustation : en contexte — « Ta stout : trop ♣, plus ❀ », ta dégustation du 18.10
- h4-radar-demande : repris — au radar : flèche verte vers l'extérieur (floral), orangée vers le centre (résineux)
- p03-plages-sources : repris — feuille Valeurs : α et β, l'enveloppe puis une fine barre par source (BM, HS)
- p03-radar-superpose : repris — le radar r2, un polygone par houblon à sa couleur
- p06-grille-familles : repris — feuille Valeurs : « Ce que disent les fiches », marqué, cité, non décrit, n/N
- p02-radar-intervalle : repris — la moustache du houblon mis en avant (règle D103)
- s5-deux-objectifs : en pont — Suggérer ; feuille Défi : les deux panneaux (Moins résineux : Aucune voie houblon ; Plus floral : Idaho 7), lien vers Suggérer
- p4-plus-comparaison : repris — le « + » sous Ta stout : la carte de Nelson Sauvin, puis une quatrième colonne
- g1-fiche : en pont — fiche ; appui long sur un nom de houblon
- fiche-citra-cryo : en pont — fiche ; la même fiche courte, à l'appui long

## Passe après le critique (D56)

Par « moins résineux », le ✓ passait sous « par ». Le bloc du nom est maintenant `flex: none`. À trois colonnes, un libellé de plus de huit caractères envoie le gain de ★ en bout de ligne « contre ★ ». À quatre colonnes, la pastille passe sous le nom. Rejoué : resineux, resineux-galaxy, resineux-quatre, agrumes, tropicaux, floral.

## D103 : la règle du radar

Celle de r6n2 : l'intervalle du houblon mis en avant est une **moustache** fine sur chaque axe, de son bas à son haut,
**coupée au bord** du domaine de la famille ; un haut hors domaine finit par le signe **« coupé » (//)** au bout de
l'axe, un haut dans le domaine par un petit trait. Pas de bande remplie. Changement r6p2 : moustache et « // » à
l'encre (plus à la couleur du houblon), pour que dix « // » ne fassent plus un radar rose ; le houblon reste plein à sa
couleur, les autres en contour. Pas de tirets (D39) : le « // » est deux traits pleins.

## Ce qui tient

- Les quatre acquis : radar au repos ; chimie et vraies valeurs dans Valeurs, panel OSU dans Preuve (un toucher).
- Un seul facteur libre : la variété (têtes de colonne, « + » Nelson Sauvin). La pastille est un critère de
  classement, « Au style / Absolu » une lentille, la ligne du pourquoi une ouverture de feuille.
- Honnêteté : « ~ » et « ≈ » sur tout le simulé ; « = » sous 0,15 cran ; inconnu hachuré, jamais 0 ; la feuille du
  pourquoi dit que les bandes se recouvrent.

## Ce qui casse ou reste douteux

- La réponse en grand donne du poids à un écart de ~0,4 cran, sous l'incertitude. Le « ≈ » et la feuille du
  pourquoi le disent ; le cadre, non. Une étoile creuse sous un cran d'avance serait plus honnête, mais un signe de
  plus à apprendre : à lui de dire.
- Le titre en 14 px gris peut lui paraître faible : c'est le prix de la réponse en premier.
- « contre ★ » en picto seul quand une colonne est touchée : il faut lire le code couleur des familles (acquis).
- Le pont Dryhopper quitte la réponse pour l'en-tête : son aria-label suit toujours ★ (« Doser Idaho 7… »).

## Captures (dans `../captures/`)

Ouvertes en image : `r6p2-premier-ecran.png` (comparée à `r6n2-premier-ecran.png`), `r6p2-toucher-390.png` (Cascade touché),
`r6p2-galaxy-390.png`, `r6p2-resineux-390.png`, `r6p2-tropicaux-390.png`, `r6p2-quatre-390.png`, `r6p2-quatre-nelson-390.png`,
`r6p2-pourquoi-390.png`, `r6p2-fiche-390.png`, `r6p2-frise-390.png`, `r6p2-souche-390.png`, `r6p2-defi-390.png`, `r6p2-legende-390.png`, `r6p2-critere-390.png`.
Régénérées sans être rouvertes (feuilles identiques à r6n2, seul le cadre de réponse change au-dessus) : `r6p2-390.png`,
`r6p2-valeurs-390.png`, `r6p2-preuve-390.png`, `r6p2-egaler-390.png`, `r6p2-ajout-390.png`,
`r6p2-absolu-galaxy-390.png`, `r6p2-agrumes-idaho-390.png`.
