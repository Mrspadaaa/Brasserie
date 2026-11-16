# e3c — La prochaine version, d après tes notes

Chaleur : tiède
Idée : La prochaine version, d après tes notes

Le carnet sert à décider le prochain essai : la recette figée face à la prochaine, chaque changement surligné ocre et relié à la note qui le justifie ; titre « 3 changements pour la prochaine NEIPA ». Geste : curseur m2 (−/+, piste, figé marqué, écart en bande ocre, valeur à taper à un toucher) sur l avoine. Dossier : « 5 sur 7 sortis du stock », jauge à 7 segments, « Dry hop ajouté aujourd hui · déstocker 180 g » (date + déstockage en un geste), frise de conduite figée 19 / 21 / 2 °C avec le jour, volumes. Cave et 1280 rendus.

Boosters : curseur (m2), edition-sur-place, jauge, frise, onglet, dicter.

## Baseline (plancher à enrichir, L07)
- [x] chiffres à la virgule, inconnu = « — », jamais type="number" (aucun champ numérique)
- [x] en-tête de lot (grammaire z1), jetons DESIGN.md, clair (cave pour e3c)
- [x] J+n depuis le levurage (J+5 · levuré le 09.11)
- [x] dry hop par nom, dose, jour (Citra 100 g, Mosaic 80 g, J+6) ; α Citra 10–16 %, Mosaic 10–15 % (src/data/hopDatabaseBootstrap.json, comme s5a) ; familles en pictos (descripteurs du même fichier, sans intensité)
- [x] cibles ≥ 44 px ; pas de bandeau d alerte en tête, pas de code interne, pas de paragraphe
- [ ] geste m2 au curseur : seul e3c le montre (les autres gestes sont une note, pas une mesure)

## Fonctions de l écran actuel (BatchDetailSheet.tsx)
- Carnet : 3 notes (dégustation et prochain essai, jour de brassage, inspiration) ; « Prédit et dégusté » (HopTastingsPanel, Noter une dégustation).
- Dossier : étape et « Passer en … » ; retour arrière et abandon (select → bouton « Revenir · abandon ▾ ») ; budget (« — CHF », non estimé) ; Compagnon ; Supprimer (ConfirmSheet inchangée, non dessinée).
- Déplacé : le rappel « Ajouts réservés à confirmer » quitte la tête de page et devient les lignes réservées de la recette figée.
- Ajout (enrichissement) : recette figée et ingrédients sortis du stock, absents de l écran actuel.

## Causes c3 évitées
1 composition propre (voir les 4 idées) ; 2 le héros n est pas un relevé ; 3 aplats pleins ; 4 phrase-réponse en gros en tête ; 5 houblons avec α et familles ; 6 pas de graphe vide ; 7 aucune phrase grise d aide au repos.

## Données fictives
Notes du carnet (textes), malts et quantités de la recette (Pilsner 4,6 kg, avoine 1,2 kg, froment 0,8 kg), empâtage 66 °C, 1 sachet de levure : plausibles, fictifs. Le reste vient de BRIEF-AUTEUR.md (dates, OG 1,062, FG visée 1,010–1,014, densités, dry hop).

Écarts : 1280 laisse un tiers bas vide (à remplir en passe 2 : dossier en 3e colonne) ; la bande ocre du curseur est l écart au figé, pas une cible métier (aucune plage d avoine sourcée).
Skills : boosters-ux chargé ; impeccable et ui-design-system non chargés (budget de contexte).

## Corrections f3a3 (14.11, verdict c5a)
- Houblon d'amérisation ajouté à la recette figée (verdict c5a) : Citra 10 g à 60′, **fictif**, repris de e10c/NOTE.md ; α 10–16 % (src/data/hopDatabaseBootstrap.json). Il fait le compte de 5 sortis.
- Dossier : « Demain · Citra 100 g + Mosaic 80 g » à J+5 (plus de bouton « ajouté aujourd'hui ») ; α au dossier. 1280 : le Dossier en 3e colonne (écart « tiers bas vide » levé à droite ; les deux colonnes de gauche finissent vers 600 px).
- Non traité : « Dry hop plus tôt » n'avance que Mosaic (il faudrait un 4e changement).
