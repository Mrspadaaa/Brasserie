# s4a — Le tableau de cuverie, genre pur
Chaleur : **froide** (le genre G1 pur, tel que c3 le décrit).
Idée : la fiche est la rangée F1 du tableau cuve × jour, dépliée ; les autres cuves suivent sur les mêmes colonnes, le jour encadré en noir les traverse toutes.
Composition : réponse sur dalle noire, grille J+1…J+10 (phases fusionnées, couloir de densité aligné, °C cuve en cases pleines, rangée d'ajouts), table « Ajouts » z1, puis F2 en retard (barre rouge jusqu'au jour) et Pils en garde. À 1280 (poste de cave) : J+0…J+12 avec l'OG, colonne droite Ajouts + panneau « Relever » ouvert.
Geste : densité au curseur m2 (feuille).
Images : s4a-repos-390-clair, s4a-geste-390-clair, s4a-repos-390-cave, s4a-repos-1280-clair (toutes ouvertes).
## Baseline (plancher à enrichir)
- [x] geste m2 : toucher, piste avec cible verte, −/+ (±0,001 ; ±0,1), « Taper » à un toucher, jamais type="number", virgule
- [x] grammaire z1 : en-tête de lot, cases à cocher pleines, rangée du prochain événement, jetons DESIGN.md (clair + cave)
- [x] J+5 · levuré le 09.11 (jours civils)
- [x] deux températures : °C cuve (rangée, consigne 19 → 21 → 2) ; °C échantillon liée au relevé de densité
- [x] FG en bande 1,010–1,014 ; inconnu « — » ; alcool 5,8 % et atténuation 71 % « provisoires »
- [x] dry hop nommé, dosé, daté (Citra 100 g + Mosaic 80 g · J+6) ; « Ajouté aujourd'hui » date et déstocke en un geste
- [x] pas de cockpit, pas de bandeau d'alerte, pas de code interne, pas de secondes
## Honnêteté
- Chiffres du BRIEF-AUTEUR seulement. α et rôle : `hopAlpha`/`hopRole` de `src/domain/hopIndex/v4/roles.ts` (clé beermaverick-citra : α 10–15 %, aromatique ; beermaverick-mosaic : α 11,5–13,5 %, aromatique, plages Beer Maverick). Familles : tags Beer Maverick (`src/data/hopBeerMaverickBootstrap.json`) — Citra : citrus, grapefruit, peach, melon, passion fruit → agrumes, tropicaux, noyau ; Mosaic : blueberry, tropical, citrus, pine → baies, tropicaux, agrumes, résineux. Aucune valeur d'arôme ni d'IBU.
- Le curseur m2 part du dernier relevé (« hier »), rien d'inventé pour le 14.11. Cuve de la Pils inconnue : « — ».
## Causes c3 évitées
1 squelette : pas de puces de phase ni de pied Stock/Carnet/Dossier ni de carte dry hop grise ; 2 héros = la décision, °C cuve à un toucher ; 3 aplats pleins, barres noires, pictos de familles ; 4 phrase-réponse en tête + critère « stable » dessiné (deux relevés égaux dans la bande → garde) ; 5 houblons : nom, α, rôle, familles ; 6 axe cadré 1,009–1,036, 1,058 hors cadre fléché ; 7 aucune phrase grise d'aide au repos.
## Boosters (boosters-ux)
- tableau (suivre), releve-densite / releve-cuve (ajuster : case du jour), mesure-m2 (piste + bande), ajouts (déclencher : cases), autres-cuves (suivre), relever-poste (1280).
- Mesures B2–B13 non jouées en v0 (permis par l'entonnoir) ; cibles ≥ 44 px sauf cellules d'en-tête non actives.
## Écarts assumés
- La phrase « dès 2 relevés égaux dans la bande » (Garde) est une étiquette de critère, pas une aide ; à 390 les colonnes font 37 px : chiffres de densité portés par la courbe, pas par les cases.
