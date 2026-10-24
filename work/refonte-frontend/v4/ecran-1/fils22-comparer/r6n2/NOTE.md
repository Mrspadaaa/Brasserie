# r6n2 · Le premier écran de r6a, le reste à un toucher

Comparer, lot 22 bis : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Page `etat.html`, générée par
`generer.mjs` depuis `../donnees/comparer-stout.json` ; captures par `captures.mjs`. Plancher : r6a (copie de
`r6a/generer.mjs`, classes renommées `r6n2-…`, r6a intact).

## Choix portés

- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A : « groseille à maquereau » et « gooseberry » rangés dans Petits fruits (fiche à l'appui long).
Seul Nelson Sauvin a ces mots. Il n'est pas sur la page au repos ; on le voit si on l'ajoute par le « + » : sa
carte dit alors 67 % de mots hors des 12 familles (option A), contre 83 % sans A.

## Premier écran

Le premier écran reste celui de r6a : titre en question, ligne de contexte, radar r2, trois colonnes de la tête
au pied (nom, α, rôle en mot, verdict, familles en couleur, stock en icône), une rangée par famille avec les
barres de l5b face à ta 16D, la colonne « Ta stout ». Retouches, et pourquoi :

1. **La réponse de y1b, sous le contexte** : « Face à ta stout, par [floral ⌄] », puis « Idaho 7 devant
   Cascade ~0,4 cran ». La pastille reclasse les colonnes (floral, agrumes, tropicaux, moins résineux) : l'ordre
   des colonnes est la réponse. C'est l'élément de y1b qu'il manquait le plus à r6a.
2. **Le pont vers Dryhopper monte dans la réponse** (pastille « Dryhopper → », qui dose le houblon mis en
   avant). En bas de page, il comptait 5 mots ; ici, 1.
3. **Le verdict des têtes passe en signe** (✓ dans la 16D ; ⚠ et le picto de la famille qui sort). Le mot
   est dans la légende et l'aria-label. Il libère 6 mots pour la réponse.
4. **Le contexte tient sur une ligne** : « 4 g/L chacun », « après, 3 j ». Le pied de page (moteur, version)
   passe dans la légende et dans « pourquoi ? ».
5. **Le radar perd 22 px** (rayon 84 au lieu de 100) pour garder tout le tableau au-dessus du dock. Il gagne
   les flèches de ta demande (h4) : verte vers l'extérieur sur Floral, orangée vers le centre sur Résineux.
6. **D103** : plus de bande remplie, voir plus bas.
7. **Le « + » de p4** sous « Ta stout » ; « inconnus » seul sur la rangée des inconnus (« pas zéro » est dans
   la légende).
8. **Le dock sous le pouce**, en bas, fixe : Défi 2/4, Égaler, Valeurs, Preuve, Frise, Souche. Il reprend la
   forme du dock de y1b (sous le pouce, toujours là) pour ranger les touchers ; chacun ouvre UNE feuille basse.
   Rien ne s'ouvre seul (d1 « trop bordélique »). Un second toucher, la croix, le voile ou Échap referment.

79 mots au premier écran (r6a : 79).

## D103 : la règle du radar

L'intervalle du houblon mis en avant n'est plus une bande remplie (la « grande étoile pâle » d'Idaho 7). C'est
une **moustache** fine sur chaque axe, de son bas à son haut, **coupée au bord** du domaine de la famille. Un
haut hors domaine (presque tous ici : 55 à 63 sur un domaine de 45) finit par le signe **« coupé » (//)** au bout
de l'axe : la bande continue au-delà de l'échelle, elle ne pousse plus rien au bord. Un haut dans le domaine
finit par un petit trait. Les autres houblons restent en contour, sans moustache. Le résineux, au-dessus du bord,
garde son point orangé. Pas de tirets dans le radar (D39) : le « // » est deux traits pleins.

## Reprise

- y1b-face-a-ta-stout : repris — la ligne de réponse sous le contexte, recalculée à chaque critère et à l'ajout d'un houblon
- y1b-pastille-critere : repris — la pastille « par [floral ⌄] » ; un toucher ouvre la liste, un choix reclasse les colonnes
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
- w2-piste-commune : repris — feuille Défi : une piste par objectif, un rond lettré par houblon sur la même règle
- w2-cartes-verdict : repris — les têtes de colonne : verdict face à la 16D en signe, familles qui sortent
- x3b-cuve-jour-apres-jour : en pont — Dryhopper ; feuille Frise : jour après jour (1 à 7 j) par houblon, lien vers Dryhopper
- a2b-ce-que-la-levure-change : en pont — Levure ; feuille Souche : « la cuve apporte » et « Pomona change », par famille
- d1-tout-ouvert : repris — feuille Valeurs : la chimie rangée par famille, une ligne par composé, rien d'ouvert d'office
- l5b-barres-voie : repris — les barres des rangées, depuis le trait de ta stout
- l5b-pistes-objectif : repris — feuille Défi : piste à la couleur de la famille, visée en pointillé, barre du houblon mis en avant, verdict en mot
- l8-disposition : repris — tournée : familles communes en rangées, houblons en colonnes, la réponse en tête
- l8b-verdicts-pictos-trait : repris — feuille Défi : signes Aucune, Approche, Atteint ; pictos au trait partout
- l8b-legende-cachee : repris — le « ? » en haut à droite ; la légende dit aussi le dock
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

## Ce que j'ai fait de l'angle

Un seul geste pour tout. Le premier écran ne bouge presque pas ; tout le reste de l'inventaire est rangé dans six
touchers, sous le pouce, comme le dock de y1b. Un toucher ouvre une feuille basse, jamais deux. On les trouve
sans légende : une icône et un mot chacun, et la légende les redit. Le « Défi » porte son score (2/4), qui suit
le houblon mis en avant. Seul facteur libre : la variété (mettre en avant, ajouter Nelson Sauvin). La levure et
le moment sont fixés, montrés dans Souche et Frise, réglables ailleurs (ponts).

Ce que les feuilles apprennent : les trois ajoutent ~+2 crans de résineux (aucune voie houblon, d'où le pont vers
Suggérer) ; à cru, l'amertume n'est pas modélisée ; pour égaler les agrumes de Cascade 4 g/L, il faut ~7,5 g/L
d'Idaho 7 mais ~2,5 g/L de Galaxy ; les tropicaux de Galaxy, les deux autres ne les atteignent jamais à 8 g/L ;
après fermentation, Pomona ne change rien au simulé ; en dry hop actif, elle réveille les agrumes d'Idaho 7.

## Ce qui tient

- Les quatre acquis : radar au repos ; chimie et vraies valeurs dans Valeurs, panel OSU dans Preuve (un toucher).
- Honnêteté : simulé marqué « ~ » ; inconnu hachuré, jamais 0 ; « à confirmer » en orangé ; IBU à cru « non
  modélisé » ; une borne seule (« < 10 » de 4MMP pour Idaho 7) n'entre pas dans le duel (« ? borne haute seule »).
- Au style par défaut ; appui long sur un nom : la fiche g1, avec la demande « + Floral − Résineux ».

## Ce qui casse ou reste douteux

- L'écart de la réponse (~0,4 cran) est sous l'incertitude : toutes les bandes se recouvrent. « pourquoi ? » le
  dit ; la réponse ne le dit pas au premier plan.
- Les 20 bières sont tirées uniformément dans la bande du moteur : une hypothèse, marquée « ~ ». Presque toutes les
  familles sortent souvent : la bande est large, c'est ce qu'elle enseigne.
- L'α de Galaxy (17,2 %) est au-dessus de ses fiches (≠) ; le rôle « mixte » d'Idaho 7, de Galaxy et de Nelson
  Sauvin est déduit de l'α (pâle).
- À quatre colonnes, les rangées n'ont plus que leur picto : il faut connaître le code couleur (la légende le donne).
- Le dock cache 56 px du bas de l'écran ; le tableau finit juste au-dessus à 390 × 844.

## Passe 2

Défauts relevés par le critique (r6nc), corrigés le 23.10 :
1. **Quatre colonnes** : « Casca », « Galax », « Tropicau » coupés ; la plage d'α débordait. Après : les libellés
   de famille passent en picto seul (colonne de 34 px) ; « Ta stout » garde le trait, ses deux pictos et le « + » ;
   les noms passent à la ligne entre les mots, jamais au milieu, et sans point de couleur (le liseré du haut le
   porte) ; l'α des fiches s'écrit « 9,5–15% ». À trois colonnes, rien ne change.
2. **Souche** : « Pomona change ≈ 0 » partout. Calculé avant de dessiner (M07) : après fermentation, Pomona −
   US-05 = 0 exactement, pour les quatre houblons ; en dry hop actif, Idaho 7 agrumes ~+1,3 cran, Cascade ~+0,4,
   Galaxy et Nelson Sauvin rien. La feuille le dit en une phrase, puis montre l'aperçu en actif houblon par
   houblon ; le tableau de la souche compare « la cuve apporte, ici » à « Pomona, en actif ». Le générateur
   échoue si les données cessent de dire « surtout Idaho 7 ».
3. **Frise** : la courbe « jour après jour » était plate. Après : « à 4 g/L, le moteur ne distingue que le premier
   jour ; de 2 à 7 j, même profil », avec le floral à 1 j puis de 2 à 7 j. Le générateur échoue si le floral bouge
   entre 2 et 7 j. Ce qui bouge vraiment dans Dryhopper passe en tête : le même ajout en actif, où le résineux
   baisse de ~0,5 à ~0,8 cran (ta demande).
4. **Le cadre suit la réponse** : choisir un critère met en avant le premier du classement (par tropicaux, le
   cadre passe sur Galaxy). Toucher ensuite une autre colonne reste possible.

Aussi : « ~2,2 crans » au pluriel ; la page est régénérée avec la planche à jour (« épicé » : cannelle et clou
croisés, `p-spice`), sur le radar, les rangées, les cartes et la fiche.

## Contrôles (depuis la racine)

Voir RESULTAT.md de la voie pour les sorties : COMMUN (sans MOTS), MOTS, UNE-QUESTION, ACQUIS, ALPHA, REPRISE,
PAGE.
