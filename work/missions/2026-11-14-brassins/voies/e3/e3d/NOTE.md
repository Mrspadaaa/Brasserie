# e3d — Le verre annoté de la Stout

Chaleur : chaude
Idée : Le verre annoté de la Stout

Un genre neuf : la Stout LOT-015 en grand verre dessiné (mousse, robe, nez, bouche) ; chaque zone est une étiquette qu on touche pour noter ; titre-verdict « À refaire, un peu moins âcre en finale ». Sous le verre : alcool, bouteilles, fût, et la bouche en échelles « trop peu → juste → trop ». Geste : feuille Bouche, 4 échelles à 5 cases (méthode sensorielle « just about right »), puce « Prochain : moins d orge torréfiée ». Dossier : 30 bouteilles et le fût F-01 dessinés, frise d étapes, « Passer en « Terminé » », recette figée en pastilles de couleur EBC.

Boosters : verre (zones à toucher), plage (échelles JAR), jauge (bouteilles), frise, dicter.

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
Notes du carnet (textes), malts et quantités de la recette (Pilsner 4,6 kg, avoine 1,2 kg, froment 0,8 kg), empâtage 66 °C, 1 sachet de levure : plausibles, fictifs. Stout : notes de dégustation, malts (pale ale 5,0 kg, chocolat 0,4 kg, orge torréfiée 0,3 kg), mousse 3 min ; seuls 06.11, 30 × 33 cl, fût 20 L F-01 et 5,9 % viennent du brief.

Écarts : « Prédit et dégusté » aromatique (houblons) non montré, la Stout n a pas de houblon d arôme connu ; dossier : bas d écran peu rempli.
Skills : boosters-ux chargé ; impeccable et ui-design-system non chargés (budget de contexte).

## Corrections f3a3 (14.11, verdict c5a)
- Carnet au repos : le fil des notes revient sous les échelles (3 dégustations datées, Jour de brassage et Inspiration à un toucher) ; le verre passe de 378 à 240 px pour le loger. Dates : 14.11 et 06.11 (conditionnement) ; la 1re dégustation est datée « garde » (date inconnue). Textes des notes **fictifs**.
- Échelles : même ordre au repos et dans la feuille (Corps, Amertume, Âcreté, Carbo.) ; extrémités nommées sous l'en-tête ; « un peu + » en ocre. « 3 min » insécable. Feuille : « voir les 2 avant › ».
- Volumes (DONNEES-COMMUNES.md) : fût F-01 de 20 L rempli à 12 L ; brassé 24 L, conditionné 21,9 L, pertes 2,1 L.
- Recette figée : houblon (α —, amérisation, ébullition, dose —) et levure « — » : inconnus, aucun chiffre inventé.
