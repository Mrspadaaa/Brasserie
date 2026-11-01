OK — série v : 6 concepts « vraies valeurs d'abord », plages du style et recette dessus

## Fichiers écrits (tous sous `v0/v*/`)
- `v1/` à `v6/` : `etat.html`, `NOTE.md`, `fabrique.mjs`, captures `vN-haut.png` (premier écran), `vN-page.png` (page et autres états), `vN-apres.png` (après le toucher d'un booster).
- `v1/commun.mjs` : en-tête, fil, bandeau, lanceur + et pied, tels qu'à l'écran (BrewWizard.tsx), plus la légende « ? » et les puces « Du style ». `v1/commun-sortie.txt` : sortie de controle-commun.
- Rien dans `src/`. `git status` : seul `work/missions/2026-10-31-ecran-identite/v0/` est nouveau.

## Les six
| id | chaleur | idée |
|---|---|---|
| v1 | froide | Les repères du style, ouverts en cinq pistes « au style » sous le style, dans une carte couleur de la bière |
| v2 | froide | Chiffre contre chiffre : chaque valeur tombe dans sa colonne (sous, dans, au-dessus du style), entre les vraies bornes |
| v3 | tiède | Le profil au style : cinq axes, la recette en une ligne tiretée sur l'inconnu, bascule Au style ou Absolu |
| v4 | tiède | Le style se choisit sur tes chiffres : six styles en bandes, la recette en fil doré qui les traverse |
| v5 | chaude | La carte des styles OG × IBU, la recette en point couleur EBC ; toucher un rectangle choisit le style |
| v6 | chaude | Les instruments : densimètre (OG, FG à venir, alcool ~), cadran d'IBU, pastille de couleur |

## Sorties décisives
- `verifier-page.mjs --min-images 0` : PAGE OK ×6.
- `mots-premier-ecran.mjs --max=80` : 75, 80, 76, 69, 73, 77 → MOTS OK.
- `controle-panel.mjs` (6 premiers écrans) : médiane 0,66, 0 sous 0,50, ressemblance 0,76, 0/15 paires → PANEL OK.
- `controle-commun.mjs --sans=mots` : couleurs, survol, blocs, contraste, legende, parlant, brutes OK. En ECHEC : au-style, fiche, trait (propres aux houblons) et standard (rayons 10/16 de DESIGN.md contre 2/4/8). Ce sont les défauts connus du contrôle (D202).
- `controle-choix.mjs --registre` : REGISTRE OK (8 écrans). Identité n'est pas au registre : rien à reprendre.
- `type="number"` : 0. Le toucher d'un booster change l'écran sur les 6 pages.
- Captures ouvertes : les 6 `-haut`, `v3-apres`, `v5-apres` et `v2-page`.

## Prédiction
« v5 et v4, une sacrée lecture du style, je vois où est ma bière ; v6 pas mal mais l'alcool d'où il sort ? ; v1 et v2 propres, mais OG et IBU écrits deux fois. »

DÉCISION À PRENDRE :
- v6 affiche un alcool attendu, « ~8,1–9,5 % », calculé à l'affichage par (OG − FG) × 131,25 sur la plage FG du style. C'est un calcul nouveau, marqué « ~ ». J7 dit qu'aucun calcul ne change : à garder comme estimation d'affichage, ou à retirer.
- v1, v2 et v3 répètent OG, IBU et EBC, déjà dans le bandeau commun (J4). La question va avec celle du bandeau, qui est transversale.

CONNAISSANCE : la recette neipa v3 (EBC 9,5, soit environ 4,8 SRM) est plus pâle que la plage 22A (6–14 SRM, soit 12–28 EBC), mais dans celle de la Hazy IPA 21C. Son IBU de ~93 sort de la Hazy IPA (25–60) et tient dans la Double IPA.

LEÇON PROPOSÉE :
- `controle-panel.mjs` indexe les captures par leur nom de fichier. Des captures toutes nommées `capture-haut.png` s'écrasent entre elles, et l'outil rend une ressemblance de 1,00. Nommer les captures `<id>-haut.png`, ou faire refuser les noms en double par l'outil.
- Le remplissage ne compte pas les panneaux gris `#F5F5F5` (écart de 30 < 60) : seules les marques comptent.
