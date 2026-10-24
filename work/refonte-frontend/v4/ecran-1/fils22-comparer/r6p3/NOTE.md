# r6p3 · Ton défi au premier écran

Comparer, variante de r6n2 (choisie le 23.10) : « Cascade, Idaho 7 ou Galaxy pour ma stout ? ». Page `etat.html`,
générée par `generer.mjs` (copie de `r6n2/generer.mjs`, classes renommées `r6p3-…`, r6n2 intact) depuis
`../donnees/comparer-stout.json` ; captures par `captures.mjs` ; section Reprise par `note-reprise.mjs`.
Chaleur tiède : la forme de l'angle, posée sur la baseline r6n2, sans rien en retirer.

## Choix portés

- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A : « groseille à maquereau » et « gooseberry » rangés dans Petits fruits (seul Nelson Sauvin, derrière le « + »).

## L'angle : sa demande est la raison de l'écran

« ma stout est trop résineuses, je la veux plus floral » : r6n2 range ce défi derrière le dock. Ici, il monte en un
**bandeau de deux rangées sous la réponse**, sur la même grille que le tableau (libellé de 76 px, puis la largeur des
trois colonnes) :

- à gauche, ta demande (flèche, picto, mot) et le verdict en mot du houblon mis en avant (✓ Atteint, →| Approche, ⊘ Aucune) ;
- à droite, la piste commune de w2 dans la forme de l5b : zone de ta 16D pâle, trait noir de ta stout, visée en
  pointillé (un cran), barre du houblon mis en avant, et un rond lettré par houblon.

En trois secondes : Idaho 7 passe la visée du floral, Cascade et Galaxy s'arrêtent juste avant ; sur le résineux, les
trois partent du même côté, loin de la visée. C'est l'enseignement de l'écran : la variété règle le floral, pas le
résineux. Toucher une tête de colonne (le seul facteur libre) change le verdict, la barre et le rond cerclé ; un
toucher sur le bandeau ouvre la feuille Défi (score par houblon, amertume tenue, 16D, Suggérer).

Les ronds trop proches (moins de 5,5 % de la piste) passent sur un couloir au-dessous puis au-dessus, **jamais décalés
en largeur** : la position reste la vraie valeur simulée (Cascade 18, Galaxy 17, visée 20 sur 100 au floral). Moins
résineux se lit en absolu (0–125), comme dans la feuille de r6n2 : les trois dépassent l'échelle du style (domaine 45).

## Ce que j'ai retiré du premier écran (79 mots, comme r6n2)

Le bandeau coûte 10 mots (Floral, Résineux, six lettres, deux verdicts). Payés par :
1. Les écarts chiffrés des rangées Floral et Résineux (six nombres) : le bandeau montre les mêmes positions sur une
   règle commune ; les nombres restent dans la feuille Défi et dans « pourquoi ? ». Ces deux rangées perdent 12 px chacune.
2. « trop » et « plus » de la colonne Ta stout : devenus ♣ ↓ et ❀ ↑ (signes, aucun mot), la demande étant écrite au bandeau.
3. Les deux « ? » écrits du radar : le secteur hachuré et le picto pâle disent l'inconnu (comme r6n1 après sa passe 2).
4. Le radar passe d'un rayon de 84 à 72 px (28 px de moins) ; le tableau finit toujours au-dessus du dock, sans vide.

Rien d'autre ne bouge : titre, contexte, réponse, pastille, pont Dryhopper, têtes de colonne, rangées l5b, dock.

## Idées reprises

- **Pistes d'objectif de l5b** (« Les bar de ce type sont plus informative », l5b) : r6n1 au premier écran, r6n2 dans
  la feuille Défi ; ici au premier écran, dans le bandeau.
- **Piste commune lettrée de w2** (« pas trop mal dans la manière de comparé ») : bandeau, une règle pour les trois.
- **Verdicts en signe et en mot de l8b** : bandeau, colonne de gauche.
- **Défi de y1b** : bandeau (un toucher) et dock « Défi 2/4 » (comme r6n2).
- **Critique r6nc2, « radar encore très rose »** : la moustache et le signe « coupé » (//) passent à l'encre (gris
  transparent), le remplissage du houblon mis en avant de 0,20 à 0,14 d'opacité. Le contour garde sa couleur.
- **Critique r6nc2, « Citra sorti de nulle part » dans la Frise** : « enchaîner Idaho 7 puis Galaxy », calculé (le
  houblon mis en avant au départ, puis le plus tropical des autres).
- **Critique r6nc2, Pomona en forme de bouton dans Souche** : « US-05 ; Pomona en aperçu », en texte.
- **Greffe de Dryhopper, la teneur du lot (CoA)** (b4, d8) : feuille Valeurs, un losange noir par lot réel sur les
  barres de l'huile et de la chimie (myrcène, linalol, géraniol, humulène, caryophyllène), et « lot 0,4 » ou
  « 4 lots 0,02–0,3 » sous la barre : Idaho 7 ID7-2573 (2025), Cascade CAS-2400, 2401, 2519, 2520. Nelson Sauvin : son
  certificat ne dit pas le dénominateur, non utilisé. Le losange est un trait neuf : ni hachure (inconnu), ni orangé
  (hors style), ni le trait noir de ton lot d'α.
- Greffes non transposées, et pourquoi : la loupe à mini-barres et la ligne du doigt « contre ★ » vivent sur un rail
  de moments (facteur fixé ici) ; « emporté » en contour n'a pas d'objet sans moment ; la barre orangée « trop amer »
  demande une cible d'IBU de la 16D que les données ne donnent pas (je ne l'invente pas).

## D103 : la règle du radar

Comme r6n2 : l'intervalle du houblon mis en avant n'est pas une bande remplie mais une **moustache** fine sur chaque
axe, de son bas à son haut, **coupée au bord** du domaine de la famille ; un haut hors domaine finit par le signe
« coupé » (//) au bout de l'axe. Nouveau : moustache et « // » à l'encre (gris), plus à la couleur du houblon, pour que
le radar ne soit plus rose de partout. Pas de tirets (D39). Les autres houblons en contour, sans moustache.

## Reprise

- y1b-face-a-ta-stout : repris — la ligne de réponse sous le contexte, recalculée à chaque critère et à l'ajout d'un houblon
- y1b-pastille-critere : repris — la pastille « par [floral ⌄] » ; un toucher ouvre la liste, un choix reclasse les colonnes
- y1b-jauge-amertume : repris — feuille Défi, carte « Amertume tenue » : Nugget 60′ 46 g, « + ? » à cru hachuré, doses pour 10 IBU à 10′
- y1b-dock-pouce : en pont — Dryhopper ; la forme du dock range les touchers ; sa frise est dans la feuille Frise, lien vers Dryhopper
- y1b-plan-d-avant : repris — le trait noir de ta stout dans chaque barre, son polygone au radar, la colonne Ta stout
- y1b-bandes-style : repris — les rangées : zone 16D pâle, orangé au-dessus, inconnu hachuré, moustache de la plage
- y1b-ligne-contexte : en contexte — Stout 16D, 4 g/L chacun, après 3 j, US-05
- y1b-defi : repris — au premier écran, le bandeau « ton défi » sous la réponse (un toucher ouvre la feuille Défi) ; le dock « Défi 2/4 » y mène aussi : score par houblon, amertume, 16D
- y1b-tirage-preuve : repris — feuille Preuve : 20 bières tirées par houblon et par famille, « 20 autres »
- y1b-levure-pastilles : en pont — Levure ; feuille Souche : US-05 | Pomona, ce que Pomona change, lien vers Levure
- y1b-second-houblon-puis : en pont — Dryhopper ; feuille Frise : la case « puis » et son « + », lien « enchaîner Idaho 7 puis Galaxy », noms pris dans les données du cas
- y3-panel-osu : repris — feuille Preuve, sans molette
- y3-pour-egaler : repris — feuille Égaler : agrumes de Cascade 4 g/L, tropicaux de Galaxy 4 g/L, même amertume
- v1-vraies-valeurs : repris — feuille Valeurs : α, β, huile, dans les colonnes des houblons, sourcés ; un losange par lot réel (CoA) sur l’huile et la chimie
- v1-en-a-plus : repris — feuille Valeurs, en tête : « X en a plus | Y en a plus », ⇄ change le houblon d'en face
- v1-linalol-en-biere : repris — feuille Valeurs, linalol mesuré en bière, « pas comparables entre eux »
- w2-piste-commune : repris — au premier écran, le bandeau : un rond lettré par houblon (I, C, G, N) sur la même piste ; deux ronds proches passent l’un sous l’autre, jamais décalés en largeur
- w2-cartes-verdict : repris — les têtes de colonne : verdict face à la 16D en signe, familles qui sortent
- x3b-cuve-jour-apres-jour : en pont — Dryhopper ; feuille Frise : jour après jour (1 à 7 j) par houblon, lien vers Dryhopper
- a2b-ce-que-la-levure-change : en pont — Levure ; feuille Souche : « la cuve apporte » et « Pomona change », par famille
- d1-tout-ouvert : repris — feuille Valeurs : la chimie rangée par famille, une ligne par composé, rien d'ouvert d'office
- l5b-barres-voie : repris — les barres des rangées, depuis le trait de ta stout
- l5b-pistes-objectif : repris — au premier écran, le bandeau : une piste par objectif (Floral ↑, Résineux ↓), zone de ta 16D pâle, trait de ta stout, visée en pointillé, barre du houblon mis en avant, verdict en mot ; en grand dans la feuille Défi
- l8-disposition : repris — tournée : familles communes en rangées, houblons en colonnes, la réponse en tête
- l8b-verdicts-pictos-trait : repris — bandeau : signe et mot du verdict du houblon mis en avant (Atteint, Approche, Aucune) ; feuille Défi : les trois ; pictos au trait partout
- l8b-legende-cachee : repris — le « ? » en haut à droite ; la légende dit aussi le bandeau du défi et le dock
- l5f-carte-role-alpha : repris — les têtes de colonne (nom, α, rôle, familles, stock) et la carte de Nelson Sauvin derrière le « + »
- m4-radar-degustation : en contexte — colonne « Ta stout » : ♣ ↓ et ❀ ↑, ta dégustation du 18.10, en signes (les mots « trop » et « plus » sont passés au bandeau)
- h4-radar-demande : repris — au radar : flèche verte vers l’extérieur (floral), orangée vers le centre (résineux) ; les mêmes flèches ouvrent les deux pistes du bandeau
- p03-plages-sources : repris — feuille Valeurs : α et β, l'enveloppe puis une fine barre par source (BM, HS)
- p03-radar-superpose : repris — le radar r2, un polygone par houblon à sa couleur
- p06-grille-familles : repris — feuille Valeurs : « Ce que disent les fiches », marqué, cité, non décrit, n/N
- p02-radar-intervalle : repris — la moustache du houblon mis en avant (règle D103)
- s5-deux-objectifs : en pont — Suggérer ; feuille Défi : les deux panneaux (Moins résineux : Aucune voie houblon ; Plus floral : Idaho 7), lien vers Suggérer
- p4-plus-comparaison : repris — le « + » sous Ta stout : la carte de Nelson Sauvin, puis une quatrième colonne
- g1-fiche : en pont — fiche ; appui long sur un nom de houblon
- fiche-citra-cryo : en pont — fiche ; la même fiche courte, à l'appui long

## Ce qui tient

- Les quatre acquis : radar au repos ; chimie et vraies valeurs dans Valeurs, panel OSU dans Preuve (un toucher).
- Un seul facteur libre, la variété : le bandeau est un bouton de détail (aria-expanded), sans nom de houblon.
- Honnêteté : simulé « ~ » ; inconnu hachuré, jamais 0 ; IBU à cru « non modélisé » ; CoA sourcé par lot.

## Ce qui casse ou reste douteux

- Floral : la visée (20 sur 100) touche presque Cascade (18) et Galaxy (17) ; le pointillé passe au-dessus des ronds
  pour rester visible. C'est la vérité du modèle : « Approche ».
- Les trois ronds du résineux s'empilent (~102 sur 100 chacun) : le bandeau prend trois couloirs.
- Sans nombre au premier plan pour l'écart, il lit des positions ; les nombres sont à un toucher (feuille Défi).
- Le titre cite Cascade, Idaho 7, Galaxy ; les colonnes se rangent selon la pastille (reste du critique, non changé).

## Contrôles (depuis la racine)

Sorties dans `work/missions/2026-10-22-reprise-lot21/voies/r6p3-defi/RESULTAT.md`.
