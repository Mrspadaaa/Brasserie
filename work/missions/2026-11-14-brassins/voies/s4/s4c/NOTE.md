# s4c — Les couloirs du dry hop
Chaleur : **chaude** (G1 mêlé à G4, « Le dry hop en question, à la Dryhopper »).
Idée : le tableau de cuverie où chaque houblon a son couloir sur les jours, sous le couloir de densité qui dit « levure active » jusqu'à la bande ; dessous, les deux houblons en colonnes comme cmc2k, chacun avec « Ajouté aujourd'hui ».
Composition : titre-réponse + raison chiffrée (1,018, bande à 1,014), segment de moments p4b2f (actif), couloirs Citra jaune / Mosaic baies pleins, °C cuve en pied de tableau, colonnes houblons (α, rôle, familles nommées), « Quand ajouter ? » vers Dryhopper.
Geste : « Ajouté aujourd'hui » sur Citra : bloc vert coché déplacé au J+5, stock −100 g confirmé dans la même bande, titre devenu « Mosaic demain ».
Images : s4c-repos-390-clair, s4c-geste-390-clair.
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
- couloirs (suivre), moment (choisir, segment), ajoute-aujourdhui (déclencher + déstocker), ajoute (annuler).
## Écarts assumés
- La fin de la fenêtre « actif » n'est pas datée (aucune prévision dans le brief) : fondu « jusqu'à la bande » au lieu d'une date.
