# r6n1 · Tout au premier écran

Comparer, lot 22 bis : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Reprise de r6a avec tout
l'inventaire (`../donnees/elements-notes.json`, 37 éléments), y1b d'abord. Page `etat.html`, générée par
`generer.mjs` depuis `../donnees/comparer-stout.json` ; captures par `captures.mjs`. Passe 2 du 23.10 : voir en
bas.

## Choix portés

- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A : « groseille à maquereau » est rangée dans Petits fruits sur la fiche. Seul Nelson Sauvin a ce mot.
Sans porte, il n'apparaît que si on l'ajoute par le « + » (quatrième colonne), et A se voit alors sur sa fiche.

## Ce que j'ai fait de l'angle

d1 « tout ouvert », mais rangé. Les 37 éléments sont tous au repos dans les 844 premiers pixels, en 78 mots.
Le texte est remplacé par des formes, des couleurs et des positions, avec un mot court quand un signe serait muet.
L'ordre vient de l8 : la réponse et les objectifs en tête, puis les houblons en colonnes dont les barres tombent dans
des rangées de familles communes.

De haut en bas :
1. le titre-question, le « ? » de la légende, puis la ligne de contexte sans contrôle : 16D, = 4 g/L, après 3 j,
   US-05 ;
2. la réponse de y1b, recalculée à chaque toucher : « Idaho 7 face à ta stout, floral ~+1,3, baies ~+2,3, dans
   16D ». « Pourquoi ? » est à un toucher. Dessous, la pastille « par [floral ⌄] » range les colonnes. À côté,
   l'amertume de ta stout : « Nugget 60′ 46 g +? à cru » ;
3. tes deux objectifs en pistes l5b, sur la règle commune de w2 : un trait par houblon à sa couleur, ta stout en
   noir, la visée en pointillé, et le verdict en mot (« Atteint », « Aucune »). Résineux : « Aucune », et le pont
   « Suggérer » est posé là (pistes hors houblon, s5) ;
4. le radar r2 et, à côté, le panel OSU en vignette, puis le linalol mesuré en bière ;
5. le tableau de r6a, avec sa colonne « Ta stout » (trop, plus, et le « + ») : têtes de colonne dans l'ordre du
   brasseur, une rangée par famille. Trois ajouts dans les rangées :
   - **un trait fin mesuré**, nommé à gauche, sous la barre simulée : humulène sous herbacé, 4MMP sous tropicaux,
     caryophyllène sous épicé. Celui qui en a le plus prend sa couleur ;
   - **« égaler »** sous agrumes et tropicaux : ~7,5 g/L d'Idaho 7 pour l'agrume de Cascade à 4 g/L ; « > 8 g/L »
     quand la grille n'y arrive jamais (inconnu, jamais 0) ;
   - **les vingt bières tirées** (« Tire 20 ») sous les barres du houblon en avant, avec leur compte (« 4 sur 20 »)
     hors de ta 16D ;
6. les actions « Défi 2/4 », « Tire 20 » et « Preuve ». Preuve ouvre toute la chimie et les vraies valeurs,
   sourcées, et ce que chaque houblon donnerait « si tu le passais à 10′ » ;
7. les ponts vers Dryhopper et Levure. Dryhopper montre la frise du brassin en miniature : le jeton du houblon en
   avant sur « après », un second jeton en pointillé sur « puis ». Levure montre ce que Pomona change, en chiffre :
   « Pomona, agrumes ~+1,3 » pour Idaho 7, au dry hop actif.

Seul facteur libre : la variété. On la change par les têtes de colonne, par le « + » qui ajoute Nelson Sauvin et
par le × qui le retire ; ⓘ ouvre la fiche. Le critère de classement ne change que la lecture : il range les
colonnes et met le premier en avant.

## Le radar (D103)

Règle d'affichage : la bande ne pousse plus vers le bord, et il n'y a plus de surface d'intervalle.
- L'intervalle du houblon touché se lit en **trait fin sur chaque axe**, du bas au haut.
- Un haut au-delà du domaine de la famille s'arrête à 90 % du rayon. Le trait est alors **coupé : « // »** au bout
  de l'axe (passe 2 ; c'était un chevron).
- La surface pleine est le seul centre simulé ; les autres houblons sont en contour.
- Seules les flèches de ta demande (h4) ont une forme de flèche : **verte** vers l'extérieur sur Floral, orangée
  vers le centre sur Résineux.

Résultat : plus d'« étoile pâle ». En revanche, Idaho 7 montre des traits qui partent presque du centre sur neuf
axes : le moteur ne sait pas grand-chose, et ça se voit.

## Reprise

- y1b-face-a-ta-stout : repris — la réponse en tête, recalculée au toucher d'une colonne ou du critère ; « pourquoi ? » à un toucher
- y1b-pastille-critere : repris — « par [floral ⌄] » sous la réponse ; floral, agrumes ou tropicaux ; les colonnes se rangent (dans ta 16D d'abord) et la première passe en avant
- y1b-jauge-amertume : repris — l'amertume de ta stout à côté de la pastille : « Nugget 60′ 46 g +? à cru » (le dry hop à cru n'est pas modélisé, inconnu, jamais 0) ; l'IBU « si tu le passais à 10′ » sous Preuve
- y1b-dock-pouce : en pont — Dryhopper : la puce porte la frise du brassin en miniature, avec le jeton du houblon en avant posé sur « après »
- y1b-plan-d-avant : repris — le trait noir de ta stout dans chaque barre et chaque piste ; la réponse compte ses crans depuis lui
- y1b-bandes-style : repris — barres au style de chaque rangée : zone pâle de ta 16D, orangé au-dessus, hachuré inconnu, flèche au-delà ; le résineux de ta dégustation lu une seule fois, dans sa piste
- y1b-ligne-contexte : en contexte — la ligne sous le titre : 16D, = 4 g/L, après 3 j, US-05
- y1b-defi : repris — bouton « Défi 2/4 » ; un toucher ouvre les quatre cases du houblon en avant
- y1b-tirage-preuve : repris — « Tire 20 » (points sous les barres du houblon en avant, « 4 sur 20 » hors de ta 16D) et « Preuve » (chimie et vraies valeurs, sources), côte à côte avec Défi
- y1b-levure-pastilles : en pont — Levure : la puce dit « Pomona », la famille qui bouge le plus et son écart (~+1,3 pour Idaho 7, au dry hop actif)
- y1b-second-houblon-puis : en pont — Dryhopper : la frise miniature porte un second jeton en pointillé sur « puis »
- y3-panel-osu : repris — vignette à droite du radar : trois courbes mesurées, zone 4–8 g/L, trait à ta dose ; Idaho 7 et Galaxy hachurés, sans panel
- y3-pour-egaler : repris — « égaler » sous agrumes et tropicaux : la dose de chacun pour le même effet que la référence ; « > 8 g/L » : jamais dans la grille
- v1-vraies-valeurs : repris — un trait fin mesuré, nommé à gauche, sous la barre simulée (humulène, 4MMP, caryophyllène) ; les nombres et sources sous « Preuve »
- v1-en-a-plus : repris — dans chaque trait mesuré, celui qui en a le plus prend sa couleur, les autres restent gris
- v1-linalol-en-biere : repris — vignette sous l'OSU : échelle log 10–1000 µg/L, Cascade et Idaho 7 (cerclé : à vérifier), Galaxy hachuré, ≠ pas comparables
- w2-piste-commune : repris — les deux pistes d'objectif : une seule règle, un trait par houblon à sa couleur, ta stout et ta 16D dessus
- w2-cartes-verdict : repris — chaque tête de colonne porte son verdict face à ta 16D (✓ dans, ⚠ sort) avant ses familles
- x3b-cuve-jour-apres-jour : en pont — Dryhopper : ta bière contre +1 ou +2 dry hop, jour après jour ; nommé dans le lien
- a2b-ce-que-la-levure-change : en pont — Levure : l'aperçu chiffre ce que Pomona change pour le houblon en avant
- d1-tout-ouvert : repris — la chimie ouverte d'un coup mais rangée : un trait mesuré, nommé, dans sa rangée de famille, au repos
- l5b-barres-voie : repris — la barre de chaque cellule, depuis le trait de ta stout (plancher r6a)
- l5b-pistes-objectif : repris — Floral ↑ et Résineux ↓ en tête : piste à la couleur de la famille, visée en pointillé, verdict en mot
- l8-disposition : repris — objectifs en tête, houblons en colonnes dont les barres tombent dans des rangées de familles communes, pictos en tête de rangée, actions en bas
- l8b-verdicts-pictos-trait : repris — signes ✓, →| et ∅ des verdicts, pictos au trait sans halo
- l8b-legende-cachee : repris — « ? » discret en haut à droite ; la légende ne se montre qu'au toucher
- l5f-carte-role-alpha : repris — tête de colonne : nom, α, rôle en mot, familles en couleur, stock en icône
- m4-radar-degustation : repris — la colonne « Ta stout » de r6a : « trop » résineux, « plus » floral ; le trait noir du radar est ta stout
- h4-radar-demande : repris — au bout des axes du radar, flèche verte vers l'extérieur sur Floral et flèche orangée vers le centre sur Résineux ; ↑ ↓ sur les pistes
- p03-plages-sources : repris — l'α en tête de colonne (lot, ou plage des fiches) ; la plage par source sous « Preuve »
- p03-radar-superpose : repris — radar r2 : un polygone par houblon à sa couleur, superposés
- p06-grille-familles : repris — familles marquées (grandes) et citées (petites) en tête de colonne, rangées par famille dessous
- p02-radar-intervalle : repris — l'intervalle de chaque axe en trait, coupé « // » s'il dépasse (D103)
- s5-deux-objectifs : en pont — Suggérer, dans la piste Résineux, où aucune voie houblon n'atteint la visée
- p4-plus-comparaison : repris — « + » sous « Ta stout » : ajoute Nelson Sauvin en quatrième colonne ; × le retire
- g1-fiche : en pont — fiche : le bouton ⓘ de chaque colonne, ou l'appui long sur le nom
- fiche-citra-cryo : en pont — fiche : le même bouton ⓘ ; la fiche courte avec ses « ? »

Aucun élément écarté.

## Ce qui tient

- Les quatre acquis : le radar r2 et le panel OSU au repos ; la chimie et les vraies valeurs à un toucher
  (« Preuve »). La chimie se voit aussi au repos, en traits mesurés dans trois rangées, et le linalol en bière à
  côté du radar.
- Honnêteté :
  - le profil est marqué « ~ simulé » ;
  - l'inconnu est hachuré, jamais 0 (pépins, melon, Galaxy herbacé et terreux, Cascade noyau) ;
  - l'IBU à cru est « +? » ;
  - « > 8 g/L » quand l'effet égal sort de la grille ;
  - les plages ouvertes sont en dégradé ;
  - le 4MMP d'Idaho 7 et le linalol E03 sont cerclés « à vérifier ».
- Au style par défaut. En absolu, le résineux et les pistes se lisent sur 0–125.
- Appui long sur un nom, ou ⓘ : la fiche g1 de la baseline, avec la demande « + Floral − Résineux ». Le picto
  « épicé » est celui qu'il a choisi (cannelle et clou croisés), lu dans la planche standard.

## Ce qui casse ou reste douteux

- **La visée est de moi** : « un cran du style » au-dessus (floral) ou au-dessous (résineux) de ta stout. Ce
  n'est pas une donnée ; la légende le dit, à corriger par le brasseur. Elle donne « Atteint » pour Idaho 7
  (~+1,25 cran) et « Approche » pour les autres.
- L'IBU de ta stout (≈ 60 dans y1b) n'est pas dans les données du lot. La jauge dit donc d'où vient l'amertume
  (Nugget 60′, 46 g, lu dans la recette) et « +? » à cru, sans total.
- Densité : le premier écran est plein, 78 mots pour 80. Il ne reste plus de marge pour un mot de plus.
- Le tirage de 20 bières est uniforme dans la bande du moteur : c'est une convention de lecture, pas une
  distribution mesurée. La légende le dit.
- Levure : après fermentation, Pomona ne change rien (la levure est au repos). L'aperçu prend donc le dry hop actif
  (le moment de l'outil Levure). Galaxy y affiche « ≈0 ».
- Nelson Sauvin prend un bleu (#1a5e8a), pris pour cette page ; sa couleur n'est fixée nulle part ailleurs.
- Les titres des références (H2…) sont lus dans `composes-houblon.json`, la source que le JSON du lot cite.

## Passe 2

Les cinq défauts relevés par le critique (`voies/r6nc-critique/RESULTAT.md`), avant → après :
1. **Un « 10′ » sorti de nulle part** : « IBU ? ▨ 10′ ≈37 » au premier écran → la jauge de ta stout, « Nugget 60′
   46 g +? à cru ». L'IBU à 10′ reste seulement sous Preuve, nommé « IBU, si tu le passais à 10′ ».
2. **Le radar** : neuf chevrons roses, de la forme des flèches de ta demande → le trait coupé « // » au bout de
   l'axe. La flèche est réservée à ta demande : verte vers l'extérieur pour Floral (comme h4), orangée vers le
   centre pour Résineux. Les « ? » écrits du radar sont partis ; les secteurs inconnus restent hachurés.
3. **Tire 20** : vingt points de 6 px posés sur la barre d'Idaho 7 → des points de 4 px sur une ligne sous la
   barre, avec le compte en mot (« 4 sur 20 », en orangé s'il y en a hors de ta 16D).
4. **Pont Levure muet** (deux barres jaunes) → « Pomona », le picto de la famille qui bouge et son écart (« ~+1,3 »
   pour Idaho 7, « ≈0 » pour Galaxy), recalculés au toucher d'une colonne.
5. **Signes neufs sans mot** → la fiole et le « = » de tête de rangée remplacés par le nom du composé (humulène,
   4MMP, caryophyllène) et par « égaler ». La colonne « Ta stout » de r6a revient : trop, plus, et le « + » dessous
   (la dégustation quitte la ligne de contexte). La légende ajoute « en stock » et « à acheter » (le chariot).

Aussi :
- le picto « épicé » de la planche standard, cannelle et clou croisés ;
- le halo du « ? » de la légende, qui se posait au milieu de l'écran (la capture `r6n1-legende-390.png`), est
  rattaché à son bouton ;
- `r6n1-ta` servait à la fois à la ligne α et à la colonne « Ta stout » : la colonne s'appelle `r6n1-st` ;
- le pied « ~ simulé » passe sous le premier écran.

m4-radar-degustation passe de « en contexte » à « repris », dans la colonne « Ta stout ».

## Contrôles (depuis la racine)

COMMUN OK (sans MOTS), MOTS OK (78 au premier écran), UNE-QUESTION OK (1 groupe libre : houblon), ACQUIS OK (4/4),
ALPHA OK, REPRISE OK --premier-ecran (28 repris, 1 en contexte, 8 en pont, 0 écarté), PAGE OK. Pire contraste :
l'Idaho 7 #e80030 sur blanc, environ 4,7:1, dans le contrôle CONTRASTE vert (le même que dans r6a).
