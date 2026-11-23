OK — huit concepts chauds de Dryhopper, série G, un seul facteur libre : le moment

## Concepts (détail dans `serie-g/NOTE.md`)

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| g1 La courbe du compromis | chaude | courbes floral, baies, résineux sur tout le brassin, IBU dessous face à la 16D | doigt sur le graphique | E08 Schmidt 2019 | pont outil |
| g2 La bascule | chaude | planche nez / bouche, 12 barres l5b | dock y1b + loupe | E07 Sharp 2014 | dernière étape |
| g3 L'arc du pouce | chaude | orgue des 12 familles, réponse au centre de l'arc | pouce sur un demi-cercle | E05 Wolfe 2012 | pont outil |
| g4 La phrase qui se règle | chaude | « J'ajoute Idaho 7 [à 10′] : … trop amer : IBU ~97 », 6 barres, jauge | frotter le mot du moment | E07 Sharp 2014 | dernière étape |
| g5 La carte de chaleur | chaude | 12 familles × 22 moments, ligne IBU, colonne du meilleur | balayer les colonnes | E05 Wolfe 2012 | pont outil |
| g6 Sur la courbe de densité | chaude | le jeton sur l'allure de densité (DI 1,066, DF ?), 6 barres | rouler sur la courbe | E03 McCabe 2023 (Idaho-7, à vérifier) | dernière étape |
| g7 Le radar qui respire | chaude | radar m4/h4 au style, zone 16D, stout grise contre Idaho 7 violet | ascenseur vertical | E10 Titus 2021 | pont outil |
| g8 Le ruban | chaude | barres divergentes contre « après 3 j », piste face à la 16D | ruban sous une aiguille | E10 Titus 2021 | dernière étape |

Descripteurs A (Idaho 7 : 0 mot sans famille). Réponse commune des données : meilleur = actif · 2 j
(floral ~+22, résineux ~+14, IBU ~60 + ?) ; ébullition et WP trop amers ; après : résineux ~+6 et végétal
~+5 de plus ; rien ne bouge au-delà de 2 j ; Pomona n'ajoute (agrumes ~+13) qu'en actif.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/socle-g.mjs`, `generer.mjs`, `NOTE.md`
- `serie-g/g1/etat.html` … `serie-g/g8/etat.html`
- `serie-g/captures/g1-390.png` … `g8-390.png`, `gN-apres-geste-390.png` ; `captures/travail/` (pendant, absolu, sorties brutes, sonde)

## Critères
- G1 : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes ; premier essai : STANDARD rayon 17 px du pont, corrigé en pilule).
- G2 : `UNE-QUESTION OK (1 groupe libre : moment)` ; contexte houblon, dose, levure, base sur les huit.
- G3 : pages, NOTE et captures écrites (`EXISTENT` rejoué ci-dessous).
- G4, G5 : NOTE et ce rapport.
- Joués une fois : D99 `ACQUIS ECHEC 31` (contrôle de Comparer ; g7 porte le radar au repos) ; MOTS `--max=80` : 6/8 au-dessus (g8 120) ; hors données ≤ 55, MOTS OK.

## Captures ouvertes
g1-390.png, g2-390.png, g3-390.png, g4-390.png, g5-390.png, g6-390.png, g7-390.png, g8-390.png ;
travail/g2-pendant.png (loupe), travail/g8-pendant.png (ruban), travail/g7-absolu.png.

Prédiction : « g5 et g1 je comprends direct où est le bon moment, vachement bien ; g4 la phrase c'est
malin mais trop de texte ; la bascule c'est gadget. »

CONNAISSANCE : Idaho 7 à 4 g/L dans la stout 16D (grille simulée) : le dry hop actif 2 j est le meilleur
compromis floral / résineux ; le whirlpool donne déjà IBU ~75 (> 16D) ; la grille sature à 2 j de contact ;
Pomona = US-05 hors de l'actif. La grille n'a que 60′ et 10′ en ébullition : 55′ … 15′ sont interpolés.

LEÇON PROPOSÉE : Le poste n'a pas Python ; une retouche en série s'écrit en Node (split/join), jamais
par `eval` d'un script d'un autre langage. Le 22.10 (r7g), des tuples Python évalués en JS ont rendu des
caractères seuls et remplacé partout : `generer.mjs`, non versionné, a dû être réécrit. Garder une copie
(`cp`) d'un générateur non suivi avant une retouche scriptée.
