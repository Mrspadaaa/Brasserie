# e3a — Carnet et Dossier remis d aplomb

Chaleur : froide
Idée : Carnet et Dossier remis d aplomb

Les trois rubriques gardées (Mesures, Carnet, Dossier). Carnet : la dernière note en titre, les trois notes en cartes à éditer sur place, « Prédit et dégusté » en bandeau noir, notes de cuve datées, dock Dicter / Écrire. Geste : note dictée, classée par segment, densité jointe par bascule. Dossier : frise d étapes, « Passer en garde froide » avec pastille « pas encore stable », recette figée cochée (sortis / réservés).

Boosters : edition-sur-place (✎ par carte), segment (classement de la note), bascule (densité jointe), frise (étapes), cases (sortis/réservés), dicter.

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

Écarts : dossier à 858 px de haut (14 px sous l écran).
Skills : boosters-ux chargé ; impeccable et ui-design-system non chargés (budget de contexte).

## Corrections f3a3 (14.11, verdict c5a)
- Houblon d'amérisation ajouté à la recette figée (verdict c5a) : Citra 10 g à 60′, **fictif**, repris de e10c/NOTE.md ; α 10–16 % (src/data/hopDatabaseBootstrap.json). Il fait le compte de 5 sortis.
- Geste : « Joindre la densité du jour » grisé, « pas relevée » (aucune densité le 14.11).
