OK — série r : 4 concepts Malts/sucres (liste, curseurs, colonne, balance) ; PANEL ECHEC, r1 trop vide

## Fichiers écrits
- `v0/r1/` à `v0/r4/` : `etat.html`, `NOTE.md`, captures (`rN-haut`, `-page`, `-couleurs`, `-sucre`, `-vide`, `-huit`, `-geste-teinte`, `-geste-saisie`, `-geste-ajout`, `-ordinateur`).
- `v0/r-serie/capturer.mjs` : états `#couleurs`, `#sucre`, `#vide`, `#huit`, deux gestes joués (pastille « ? » → 3,5 ; « Cara », Entrée, 0,3, Entrée), 1280 px, hauteur à 8 grains.

| id | chaleur | idée |
|---|---|---|
| r1 | froide | la liste nette : − masse +, barre de part, rayon d'habituels ouvert sous la liste |
| r2 | tiède | une règle pour tous : chaque masse est un curseur r4-a, la barre compose le grain en teintes |
| r3 | chaude | la colonne se remplit : une couche par ingrédient, verre teinté au sommet, ajout dans le vide |
| r4 | chaude | la balance : ticket de pesée, plateau sous le pouce, règle qui défile, l'ajout arrive à 0 |

## Sorties décisives (31.10)
- `verifier-page.mjs` ×4 : PAGE OK.
- `mots-premier-ecran --profil=sans-houblons --max=80` : r1 68, r2 65, r3 64, r4 69 → MOTS OK.
- `controle-commun --profil=sans-houblons` : COMMUN ECHEC 1 contrôle, **couleurs** (1 teinte franche sur 3 au moins). Écart voulu, écrit dans chaque NOTE : sa recette n'a aucune couleur connue (J7), les teintes arrivent avec les données. Les autres : mots, survol, blocs, contraste, standard, parlant, brutes OK.
- `controle-contraste --profil=sans-houblons` : CONTRASTE OK (pire 4,82:1).
- `capturer.mjs` : CAPTURES OK ; 8 grains à 1,03 · 1,03 · 0,96 · 1,01 écran ; aucun « NaN », « null », « undefined ».
- `controle-panel` (4 premiers écrans) : **PANEL ECHEC** ; remplissage médian 0,53, r1 à 0,45 ; une paire à 0,95 (r1 ~ r3). Le manque est r1 : trois grains ne remplissent pas l'écran sans gonfler la liste. Les trois autres passent 0,5.
- `type="number"` : 0. `controle-choix` : s.o. (écran ouvert, aucun choix au registre).

## Captures
`work/missions/2026-10-31-ecran-fermentescibles/v0/rN/rN-haut.png` (premier écran), `rN-page.png`, `rN-sucre.png`, `rN-ordinateur.png` ; toutes ouvertes.

## Prédiction
Il s'arrêtera sur r4 (« je pèse ») et r2 (sa langue r4-a) ; r1 lui paraîtra correct mais quelconque, et r3 lui plaira à l'œil, mais les étiquettes qui s'écartent le gêneront.

DÉCISION À PRENDRE : le contrôle `couleurs` (3 teintes franches au moins) échoue par construction sur sa vraie recette, où aucune couleur n'est connue. Faut-il le juger sur `#couleurs` pour cet écran ?

CONNAISSANCE : `controle-panel` ne compte pas un fond de panneau #F5F5F5 ni #EBEBEB (écart de 60 au plus) : seuls le texte, les traits et les teintes remplissent. Un écran à trois lignes plafonne vers 0,45 sans contenu ajouté.

LEÇON PROPOSÉE : aucune
