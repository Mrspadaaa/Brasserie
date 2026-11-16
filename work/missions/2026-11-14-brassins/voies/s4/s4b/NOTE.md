# s4b — Le tableau de cave debout
Chaleur : **tiède** (la forme du genre, tournée pour le téléphone).
Idée : le tableau blanc de cave tourné d'un quart : un jour par rangée, une cuve par colonne ; la fiche = la colonne F1 élargie, la liste = les colonnes à parts égales.
Composition : grille à gros traits noirs ; tête de F1 = la réponse « Dry hop demain » ; couloir de densité qui descend les jours vers la colonne verte FG ; pastilles d'action posées dans leur rangée (dry hop noir, 21 °C ocre, garde bleue verrouillée) ; F2 rouge jusqu'au jour, Pils bleue.
Geste : °C cuve relevée sur place — la rangée du jour s'ouvre (m2 : 19,1 hier, consigne 19 en vert).
Liste : tête de chaque cuve titrée par sa décision (Dry hop demain / Brasser ou replanifier / Confirmer la FG), clos repliés dessous (Stout 30 × 33 cl + fût 20 L, 5,9 % ; Saison écoulée, 6,1 %).
Images : s4b-repos-390-clair, s4b-geste-390-clair, s4b-liste-390-clair.
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
- tableau-debout (suivre), releve-cuve (édition sur place), releve-densite, dry-hop (case dans la pastille), mesure-m2.
## Écarts assumés
- Colonnes F2/Pils étroites (54 px) en fiche : nom en vertical, statut par la couleur.

## Corrections g3 (15.11, verdict k3)
- n° 1 (bloquant) : étiquettes de la courbe de densité hors du trait. « 1,058 » sous la flèche de départ, assez bas pour que le trait
  passe à sa droite ; « 1,018 » sous son point, à gauche ; les trois étiquettes sur un halo de la couleur de la page. Vérifié à 390 et
  à 1280.
- Non faits : n° 2 (refaire le 1280 en poste de cave change la composition, passe 2), n° 3 (écart assumé), n° 4 à n° 6 (à reprendre en passe 2).
