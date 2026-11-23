# r6p4 · On gagne, on paie (variante de r6n2, chaude)

Comparer, dernière ronde : « Lequel pour ma stout ? » (Idaho 7, Cascade, Galaxy). Page `etat.html`, générée par
`generer.mjs` depuis `../donnees/comparer-stout.json` ; captures par `captures.mjs`. Plancher : r6n2 (copie de
`r6n2/generer.mjs`, classes renommées `r6p4-…`, r6n2 intacte). Chaleur chaude : forme libre pour le bloc
« on gagne / on paie » ; le reste de r6n2 est gardé tel quel (même disposition, même densité).

## Choix portés

- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A : « groseille à maquereau » rangée dans Petits fruits (fiche à l'appui long) ; seul Nelson Sauvin a ce
mot, visible si on l'ajoute par le « + » (67 % de mots hors familles avec A).

## L'angle : on gagne, on paie

e5 de Dryhopper (« Très bien celui-là, je vois ce que je gagne et ce que je paie »), transposé aux houblons. Sous la
tête de chaque colonne, une rangée neuve : le **trait noir de ta stout** traverse les trois colonnes ; au-dessus, une
mini-barre par famille, ce que le houblon **apporte** et qui reste dans ta 16D ; en dessous, ce qu'il **coûte**. En
crans du style, 7 px par cran, même échelle pour les trois : la comparaison se lit en travers.

Règle (écrite aussi dans la légende) :
- **on gagne** : chaque famille qui monte et reste dans ta 16D, sauf résineux et végétal ;
- **on paie** : le résineux (ta dégustation : trop), le végétal, **en orangé la part d'une famille au-dessus de ta 16D**
  (Galaxy : tropicaux ~+2,9 gagnés, puis ~+0,9 payés hors style), et l'**amertume à cru**, hachurée (non modélisée,
  jamais 0) ;
- une famille inconnue pour ce houblon reste un petit hachuré sur le trait, jamais une barre nulle.

Deux chiffres au repos par colonne : en haut, le gain sur le critère de la pastille (❀ ~+1,3 pour Idaho 7 par floral ;
par « moins résineux », le plus grand gain) ; en bas, en orangé, le résineux payé (♣ ~+2, ~+1,9, ~+2). Ce que ça
apprend en trois secondes : les trois paient le même résineux (~+2) ; la différence est dans ce qu'on gagne. Galaxy
gagne le plus de fruit mais paie en plus du hors-style et du végétal ; Idaho 7 gagne le floral.

**La loupe à mini-barres chiffrées** (greffe e5) : poser le doigt sur la rangée d'une colonne la met en avant et ouvre,
au-dessus du doigt, cinq familles voisines, chacune chiffrée, la famille sous le doigt nommée. Glisser fait défiler.
Largeur des barres ×4,6 (28 px contre 6,1 px, mesuré au geste), hauteur ×2. En tête, la **ligne du doigt rangée à son
solde** (greffe b4) : « contre ★ Galaxy ~−1,2 » (Idaho 7, tropicaux), « ★ le plus », « ★ paie le moins » (Cascade,
résineux ~+1,9 contre ~+2). Elle reste ouverte au relâché ; un toucher ailleurs ou la perte du focus la ferme. Au
clavier : flèches gauche et droite sur la rangée.

## Ce que j'ai retiré du premier écran pour rester sous 80 mots

r6n2 : 79 mots. r6p4 : 79 mots.
- Le titre devient « Lequel pour ma stout ? » (−5 mots). Il règle aussi le reste du critique : le titre nommait les
  houblons dans un autre ordre que les colonnes.
- Les six chiffres sous les barres Floral et Résineux (~+1,3, ~+2…) quittent les rangées (−6) : ils sont dans
  « on gagne / on paie », sous la tête, avec leur picto.
- Ajouts : « on gagne », « on paie » (+4), six chiffres (+6).

Hauteur : la rangée neuve prend 76 px. Payés par le titre sur une ligne, les deux rangées Floral et Résineux revenues
à 22 px (sans chiffres) et le radar à un rayon de 77 au lieu de 84 (−18 px). La rangée « inconnus » reste au-dessus du
dock à 390 × 844, comme dans r6n2. Aucun vide nouveau : comparé à `captures/r6n2-premier-ecran.png`, même suite de
blocs, tableau entier visible.

## Idées reprises

- **On gagne, on paie** (e5, Dryhopper) → rangée sous les têtes de colonne, barres divergentes chiffrées.
- **Loupe à mini-barres chiffrées** (e5 passe 2, greffe r7-verdict) → au doigt sur la rangée, cinq familles ×4,6.
- **Ligne du doigt rangée à son solde, « contre ★ »** (b4, greffe r7-verdict) → en tête de la loupe.
- **Pictos au bout des courbes, sans clé** (g1, greffe) → chaque chiffre de la rangée porte le picto de sa famille ;
  la famille sous le doigt est nommée dans la loupe.
- **La hachure réservée à l'inconnu** (retouche commune r7) → amertume à cru et familles inconnues seulement ; le
  hors-style est en orangé, jamais hachuré.
- **Pistes d'objectif Floral ↑ / Résineux ↓ au premier écran** (r6n1) → leur chiffre par houblon est au repos dans
  « on gagne / on paie » ; les pistes complètes restent dans Défi.
- **Radar moins rose** (reste du critique r6nc2) → moustache, fins de moustache et « // » en gris neutre ; la couleur
  du houblon reste au seul polygone.
- **Pont de la Frise nommé depuis les données** (reste du critique, LEÇON proposée) → « enchaîner Idaho 7 puis
  Galaxy » (le houblon en avant, puis celui qui sort du style), plus de Citra.
- **Souche sans fausse puce** (reste du critique) → « Ici, la souche est fixée : US-05 ; Pomona en aperçu. »
- **Ordre titre/colonnes** (reste du critique) → titre sans noms.
- Non repris, et pourquoi : la teneur du lot (CoA) dans la fiche — absente de `comparer-stout.json`, rien à montrer
  sans inventer ; la table d'IBU « trop amer » — à dose égale après fermentation, l'IBU est à cru, non modélisé
  (hachuré), il n'y a pas de « trop amer » calculable ici.

## D103 : la règle du radar

Celle de r6n2, inchangée sur le fond : pas de bande remplie. L'intervalle du houblon mis en avant est une moustache
fine sur chaque axe, de son bas à son haut, coupée au bord du domaine ; un haut hors domaine finit par « // » au bout
de l'axe, un haut dans le domaine par un petit trait. Changement r6p4 : moustache, petit trait et « // » sont gris
(#5b5b66) et non plus à la couleur du houblon, pour que le radar ne soit plus « très rose ». Les autres houblons en
contour ; une seule surface pleine ; pas de tirets (D39).

## Reprise

- y1b-face-a-ta-stout : repris — la ligne de réponse sous le contexte ; son chiffre se lit aussi dans « on gagne » de chaque colonne
- y1b-pastille-critere : repris — la pastille « par [floral ⌄] » ; un choix reclasse les colonnes et change le chiffre « on gagne »
- y1b-jauge-amertume : repris — feuille Défi, carte « Amertume tenue » ; au premier écran, le hachuré de l'amertume à cru au bout de « on paie »
- y1b-dock-pouce : en pont — Dryhopper ; la forme du dock range les touchers ; sa frise dans la feuille Frise
- y1b-plan-d-avant : repris — le trait noir de ta stout dans chaque barre, comme zéro de « on gagne / on paie », son polygone au radar
- y1b-bandes-style : repris — les rangées : zone 16D pâle, orangé au-dessus, inconnu hachuré, moustache de la plage
- y1b-ligne-contexte : en contexte — Stout 16D, 4 g/L chacun, après 3 j, US-05
- y1b-defi : repris — dock « Défi 2/4 » : ta dégustation, score par houblon, quatre critères
- y1b-tirage-preuve : repris — feuille Preuve : 20 bières tirées par houblon et par famille, « 20 autres »
- y1b-levure-pastilles : en pont — Levure ; feuille Souche : US-05, Pomona en aperçu (texte, plus de fausse puce), lien vers Levure
- y1b-second-houblon-puis : en pont — Dryhopper ; feuille Frise : la case « puis », « enchaîner Idaho 7 puis Galaxy »
- y3-panel-osu : repris — feuille Preuve, sans molette
- y3-pour-egaler : repris — feuille Égaler : agrumes de Cascade 4 g/L, tropicaux de Galaxy 4 g/L, même amertume
- v1-vraies-valeurs : repris — feuille Valeurs : α, β, huile, dans les colonnes des houblons, sourcés
- v1-en-a-plus : repris — feuille Valeurs, en tête : « X en a plus | Y en a plus », ⇄ change le houblon d'en face
- v1-linalol-en-biere : repris — feuille Valeurs, linalol mesuré en bière, « pas comparables entre eux »
- w2-piste-commune : repris — feuille Défi : une piste par objectif, un rond lettré par houblon sur la même règle
- w2-cartes-verdict : repris — têtes de colonne (verdict en signe) et, dessous, « on gagne / on paie », le verdict chiffré famille par famille
- x3b-cuve-jour-apres-jour : en pont — Dryhopper ; feuille Frise : jour après jour (1 à 7 j) par houblon
- a2b-ce-que-la-levure-change : en pont — Levure ; feuille Souche : « la cuve apporte » et « Pomona change », par famille
- d1-tout-ouvert : repris — feuille Valeurs : la chimie rangée par famille, rien d'ouvert d'office
- l5b-barres-voie : repris — les barres des rangées, depuis le trait de ta stout
- l5b-pistes-objectif : repris — feuille Défi (pistes complètes) ; au repos, leur chiffre par houblon dans « on gagne / on paie »
- l8-disposition : repris — tournée : familles communes en rangées, houblons en colonnes, la réponse en tête, le bilan sous chaque tête
- l8b-verdicts-pictos-trait : repris — feuille Défi : signes Aucune, Approche, Atteint ; pictos au trait partout
- l8b-legende-cachee : repris — le « ? » en haut à droite ; la légende dit le dock et la règle « on gagne / on paie »
- l5f-carte-role-alpha : repris — les têtes de colonne (nom, α, rôle, familles, stock) et la carte de Nelson Sauvin derrière le « + »
- m4-radar-degustation : en contexte — « Ta stout : trop ♣, plus ❀ », ta dégustation du 18.10
- h4-radar-demande : repris — au radar : flèche verte vers l'extérieur (floral), orangée vers le centre (résineux)
- p03-plages-sources : repris — feuille Valeurs : α et β, l'enveloppe puis une fine barre par source (BM, HS)
- p03-radar-superpose : repris — le radar r2, un polygone par houblon à sa couleur
- p06-grille-familles : repris — feuille Valeurs : « Ce que disent les fiches », marqué, cité, non décrit, n/N
- p02-radar-intervalle : repris — la moustache du houblon mis en avant (règle D103), en gris
- s5-deux-objectifs : en pont — Suggérer ; feuille Défi : les deux panneaux (Moins résineux : Aucune voie houblon ; Plus floral : Idaho 7)
- p4-plus-comparaison : repris — le « + » sous Ta stout : la carte de Nelson Sauvin, puis une quatrième colonne, avec sa rangée « on gagne / on paie »
- g1-fiche : en pont — fiche ; appui long sur un nom de houblon
- fiche-citra-cryo : en pont — fiche ; la même fiche courte, à l'appui long (« 1 seule fiche : Beer Maverick »)

## Ce qui tient

- Un seul facteur libre : la variété. La rangée « on gagne / on paie » n'est pas un sélecteur (role="img") : la toucher
  met la colonne en avant, comme sa tête, et ouvre la loupe, une lecture.
- Honnêteté : tout le simulé marqué « ~ » ; l'amertume à cru et les familles inconnues hachurées, jamais 0 ; la part
  hors style en orangé ; le chiffre affiché est celui du moteur, la barre seule est plafonnée à 3,2 crans en haut et
  2,2 en bas (aucune valeur actuelle ne les atteint : Galaxy tropicaux ~+2,9 dans la 16D).
- Les quatre acquis : radar au repos ; chimie et vraies valeurs dans Valeurs, panel OSU dans Preuve.

## Ce qui casse ou reste douteux

- La frontière gain/coût est une règle de la variante : végétal et résineux sont des coûts, herbacé et terreux des
  gains (attendus par la 16D), épicé et les fruits des gains tant qu'ils restent dans la 16D. Un brasseur peut juger
  autrement l'épicé dans une stout.
- Les écarts de résineux payés (~+1,9 à ~+2) sont sous l'incertitude : la rangée le montre égal, c'est voulu.
- À quatre colonnes, « on gagne / on paie » passe sur deux lignes dans la colonne de 34 px ; lisible, moins net.
- La loupe recouvre le bas du radar et les têtes le temps du geste.

## Contrôles (depuis la racine)

COMMUN OK (sans MOTS), MOTS OK (79), UNE-QUESTION OK (1 groupe libre : houblon), ACQUIS OK (4/4), ALPHA OK, REPRISE,
PAGE OK : sorties dans le RESULTAT.md de la voie.
