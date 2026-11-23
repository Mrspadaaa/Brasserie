ECHEC — G3 : controle-etats.mjs refuse --ecran=substituer (FICHIERS, hors Possède) ; copie corrigée : ETATS OK 14/14

Voie r6-substituer, 24.10. Substituer de la maquette jouable = u4, son choix du 19.10, tous ses états, moteur en direct.
Seul G3 échoue, et pas à cause de l'écran : le contrôle des états ne connaît que six fichiers (`FICHIERS = ['etape',
'biere', 'fiche', 'suggerer', 'comparer', 'acquis']`, ligne 46). Il faut y ajouter `'substituer'` (une ligne, hors de
mon « Possède »). Rejoué avec une copie identique où seule cette liste change (`%TEMP%\r6s\controle-etats-subst.mjs`) :
ETATS OK (14/14) sur ma construction, 14/14 sur u4 (`--choisie`), et ECHEC 14/14 sur 5345f6ad, même en `--repli`.

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/index.tsx` : l'écran u4, réécrit à partir de la « porte ».
- `.../substituer/donnees.ts` (nouveau) : appelle `substitutes()` du moteur au moment de l'ajout et au style de la
  recette. Il en tire les 8 remplaçants (les 5 premiers du catalogue, les 3 premiers du stock, dont toujours le premier
  du stock qui suffit), la plage de u4 (une composante inconnue va de 0 à 100, aux poids du moteur), puis α, β, huiles,
  mots et styles d'emploi par source.
- `.../substituer/Radar.tsx` (nouveau) : le radar D3 de u4 en SVG (12 axes, Nugget en contour seul, inconnu hachuré « ? »).
- `.../substituer/substituer.css` (classes `pq-substituer-`), `jeu.mjs` (gestes adaptés : pire cas, plage, IBU égal,
  perd et gagne, toucher, ✕, Annuler, Remplacer), `NOTE.md`.
- `work/refonte-frontend/v4/choix/etats/substituer.json` (15 états) et `work/refonte-frontend/v4/choix/etats/captures/etat-subst-*`
  (`-choisie`, `-5345f6ad`, `-apres`). Scripts de travail : `%TEMP%\r6s\`.

## Inventaire de u4 (joué dans Chrome, 390 × 844 tactile) et verdict sur 5345f6ad
u4 est une page statique. Ses états sont donc ses blocs au repos, le toucher d'une rangée, et « Lire ces scores »
(ouvert, puis refermé).

| état | u4 | 5345f6ad |
|---|---|---|
| etat-subst-repos | « ‹ Nugget », « remplaçants / à 60′ », réponse « Magnat et Yeoman, 99 sans inconnue. » | different (question, aucune réponse) |
| etat-subst-echelle | échelle 50–100, paliers, 8 remplaçants rangés par le pire cas, stock en icône | absent (colonnes) |
| etat-subst-plage | Altus, Trident 79–99, Zenia 78–98, hachurés ; clé « tout connu / plage » | absent |
| etat-subst-toucher-rang | toucher Yeoman : la rangée se marque | different |
| etat-subst-face | bandes Nugget 46 g, Magnat 37–54 g, Nelson Sauvin 62 g | different |
| etat-subst-alpha | α par source, « lot 13 », « article 9,6 » | different (texte seul) |
| etat-subst-aromes | barres face au 16D, « Hors 16D », « ce n'est pas zéro », fiches lues | different (pictos) |
| etat-subst-radar | radar des trois, légende, « gras : attendu en 16D » | absent |
| etat-subst-beta | β 3–6, 2,8–7, 4,5–8 | absent |
| etat-subst-huiles | myrcène, humulène, caryophyllène, linalol, « non renseigné » | absent |
| etat-subst-style | « 16D Foreign Extra Stout attend floral, herbacé, terreux… », mots, styles d'emploi | different |
| etat-subst-actions | « Ajouter Magnat aux achats », « Remplacer par Nelson Sauvin » | different |
| etat-subst-lire | « Lire ces scores » ouvert au repos | absent |
| etat-subst-lire-fermer | toucher le résumé le referme | absent |
| etat-subst-croix | ‹ statique | present (voulu D109) |

## États rendus (capture « après » à côté de `capture_choisie`, toutes ouvertes en image)
Chaque déclencheur porte son `data-etat`. Les captures sont dans `work/refonte-frontend/v4/choix/etats/captures/`.
- repos : `etat-subst-repos-apres.png` (à côté de `etat-subst-repos-choisie.png`)
- echelle : `etat-subst-echelle-apres.png`
- plage : `etat-subst-plage-apres.png`
- toucher-rang : `etat-subst-toucher-rang-apres.png` (Yeoman passe au face à face et devient le remplaçant)
- face : `etat-subst-face-apres.png`
- alpha : `etat-subst-alpha-apres.png`
- aromes : `etat-subst-aromes-apres.png`
- radar : `etat-subst-radar-apres.png`
- beta : `etat-subst-beta-apres.png`
- huiles : `etat-subst-huiles-apres.png`
- style : `etat-subst-style-apres.png`
- actions : `etat-subst-actions-apres.png`
- lire : `etat-subst-lire-apres.png`
- lire-fermer : `etat-subst-lire-fermer-apres.png`
- croix (voulu) : `etat-subst-croix-apres.png` (✕ vers l'étape Houblons, où « Sans Nugget › » est en place)

## Sorties décisives
- G1 : `SUBST-BIEN-15`.
- G2 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-substituer/`.
- G3 : `ETATS ECHEC : --ecran=substituer inconnu (etape, biere, fiche, suggerer, comparer, acquis)`. Avec la copie
  corrigée : `ETATS OK (14/14) ; 1 voulu(s) non rejoué(s)`. Témoins : `--choisie` donne 14/14 ; 5345f6ad donne ECHEC 14/14.
- G4 : `ANNULER OK (3 routes × 2 largeurs)`. G5 : `COMMUN OK`. G6 : `TEINTE OK 6/6`. G7 : `TYPES OK`.
- G8 : ce fichier. En plus : `jouer-parcours.mjs --etape=substituer` donne `ETAPE OK (substituer)`.
- `controle-choix.mjs --ecran=substituer` donne `CHOIX ECHEC`, pour la même seule cause (sa ligne `controle-etats … --ecran=substituer`).
- Essais : commun 2 (couleurs, contraste, fiche et standard corrigés), G1 à G4, G6 et G7 au premier essai.

## Décisions
- DÉCISION : les ponts sont gardés (route `substituer/<houblon>`, « Sans Nugget › » à l'étape, « Substituts › » dans
  la fiche, non modifiés).
- DÉCISION : « Remplacer par Nelson Sauvin » de u4 devient le pied D120 : « Annuler » à côté de « Remplacer › », et le
  nom passe au résumé (« 46 g de Nugget → 62,5 g de Nelson Sauvin »). « Ajouter Magnat aux achats » reste à sa place
  dans u4. Dans la maquette, il note seulement (« Magnat noté aux achats ✓ ») : la liste d'achats n'existe pas encore.
- DÉCISION : l'usage s'écrit « double usage », le mot de l'app et de l'étape Houblons (D90). u4 écrivait « double ».
- DÉCISION : la dose se pose au demi-gramme à IBU égal, comme dans la porte : 62,5 g, contre 62 g dans u4 et le
  moteur, qui arrondit au gramme (jusqu'à 0,65 IBU d'écart).
- DÉCISION : pour un houblon à acheter, la bande garde la plage de u4 (37–54 g). Quand il est choisi, elle ajoute ce
  qui sera écrit (« 44 g à α 13,5 »).
- Données : le stock de la fixture place maintenant Idaho 7 (20 g, ne suffit pas) devant Galaxy, qui sort des 3 du
  stock. Galaxy n'entre dans aucun « attendu ». Tous les nombres viennent du moteur en direct.
- Retrait : la ligne « u4 · Chaud : … » (une annotation d'auteur, pas un élément d'écran). Aucun élément de u4 n'est visé
  par un défaut postérieur de DEFAUTS-COURT. « Lire ces scores » reste ouvert, en bas, comme dans u4 ; la légende des gestes
  va derrière « ? » (D89).
- Ce que le conseil a vu sur la porte :
  - « arôme 100 » n'est plus affiché, comme dans u4. À 60′, cette composante ne mesure que l'arôme étranger ;
    « Lire ces scores » le dit.
  - Plus de colonne coupée : l'échelle tient dans 390 px, sans défilement horizontal.
  - Sous les arômes : « À 60′, surtout l'amertume : ces arômes partent en grande partie à l'ébullition. »
- Enrichi (L07) :
  - toucher un remplaçant le met au face à face et en fait le remplaçant (u4 : « choix des deux comparés statique ») ;
  - pictos des familles citées dans chaque bande (L04, D74) ;
  - ligne « sans famille » (L14 : Nelson Sauvin 83 %) ;
  - « Ma bière avec chacun », au style ou en absolu (D75).
- Greffe « remplacer par un mélange » : u4 ne la porte pas, donc non construite. Proposition : une quatrième bande
  « Magnat + Nelson Sauvin », moitié de chaque à IBU égal, avec ses arômes cumulés au tableau. Le moteur sait déjà
  assembler deux houblons du stock (`proposeVoies`, assemblages).
- Pour passer `controle-fiche`, le nom affiché dans l'échelle porte `data-houblon-nom`, et non plus `data-houblon`. La
  fiche s'ouvre toujours par appui long sur la rangée. La cause est ailleurs : le contrôle lit « N/M » dans
  `fiche-arome`, alors que la fiche de r3 écrit « 1 seule fiche » hors de cette zone pour Magnat. Il échouait donc sur
  le premier nom, Magnat.
- Pour que `controle-couleurs` voie la couleur de leur trait, les pictos des bandes sont tracés en ligne (planche
  `data/pictos-familles.svg`) plutôt que par `<use>`. Le dessin est le même.

DÉCISION À PRENDRE : ajouter `'substituer'` à `FICHIERS` dans `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`
(ligne 46), puis rejouer G3 et `controle-choix`. Sans cela, le registre (`--ecran=substituer`) échoue pour tout dossier.

Prédiction : « Là c'est mon u4, et ça bouge » ; il relèvera peut-être « lilac », un mot anglais dans les tags français
de Magnat (donnée, pas écran).

CONNAISSANCE : à 60′, la composante arôme de la substitution (contexte amertume) ne mesure que la part étrangère du
remplaçant : Nelson Sauvin y vaut 100 tout en perdant six familles. Elle ne doit jamais s'afficher seule comme une
ressemblance d'arôme.

LEÇON PROPOSÉE : un contrôle à liste fermée d'écrans (`FICHIERS`, `--ecran=`) s'étend dans la même voie que le
nouvel inventaire, ou le brief le donne au pilote avant la voie. Sinon le critère ne peut pas passer.
