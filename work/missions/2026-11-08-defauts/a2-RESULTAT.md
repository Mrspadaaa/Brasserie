# a2 — recette hors Malts/sucres et Houblons : bilan (tenu à jour)

Format : `id | statut (preuve)`. Les doublons BE-* suivent leur BR-* (même texte au registre).

## Règles posées
- `src/domain/bornesProcede.ts` : une table de bornes du procédé (paliers, phases, levure, rendement, eau, sels, acide, pH, additifs), lue par `recipeSaveIssues` ; hors bornes = erreur `live` dite dès la frappe (bandeau « valeur à corriger »), jamais un calcul silencieux. Les conseils (ordre des paliers, mash-out, ordre des phases) ne bloquent pas (`recipeAdvice`).
- `src/domain/water/volumeBalance.ts` : le moût collecté suit l'eau préparée.
- `numericInput.ts` : un parent qui borne la frappe ne réécrit plus le champ ; relecture à la sortie.
- `SliderField.tsx` : une grandeur bornée ne sort jamais de ses bornes vers le calcul, et le dit.
- Tests : `tests/unit/bornesProcede.test.ts`, `tests/integration/{waterVolumesBilan,numberInputBorneFrappe,sliderFieldBornes}.test.tsx`.

## Lignes
MV-31 | corrigé (waterVolumesBilan : « Il manque 13,4 L d'eau », moût collecté 21 L, plus de « Rinçage à chaud : 0 L »)
AM-29 | corrigé (bornesProcede.test « eau d'empâtage 0 L », « 0,63 L/kg », « 13 L/kg », eau totale par litre) ; 0 L + 0 L = plan d'eau non posé, un manque et non une erreur
BR-23 | déjà corrigé en partie (règle `number(mashWaterL, 0)` existante refuse −1 à l'enregistrement) ; dit maintenant dès la frappe (bornesProcede.test)
AM-21 | corrigé (pitchTempC 2–40 °C à l'enregistrement ; l'atelier de levure refusait déjà hors 0–60)
AM-22 | corrigé (dose rapportée au volume, par unité : g, kg, mL, L, sachet) ; kg et L restent proposés : ils existent à l'échelle brasserie (crème, levain), seule la dose absurde est refusée
AM-23 | corrigé (atténuation 1–99 %)
AM-24 | corrigé à l'enregistrement (rendement 30–95 %) ; maxima des Réglages (100) : reste, voir plus bas
AM-25 | corrigé (paliers 35–80 °C, durée ≤ 240 min ; ordre et « mash-out » < 70 °C en conseil)
AM-26 | corrigé (recette sans palier, sans phase ou sans plan d'eau : « à compléter », plus « prête »)
AM-27 | corrigé (phases −2 à 40 °C, ≤ 365 j)
AM-28 | corrigé (conseil d'ordre primaire, repos diacétyle, garde)
AM-30 | corrigé (plafond par ion apporté par les sels, par litre de l'eau où ils se dissolvent ; acide ≤ 3 mL/L)
AM-31 | corrigé (pH d'empâtage visé 4,5–6,5 à l'enregistrement)
AM-32 | corrigé en partie : quantité négative ou NaN refusée, unité et moment ramenés aux valeurs connues par `normaliserAdditif` (fonction prête, branchement à l'import : reste) ; l'éditeur d'additifs : goût (nouvel écran : liste dans le récapitulatif, ou étape propre, ou fiche à part)
BR-33 | corrigé (durées de phase ≤ 365 j, paliers ≤ 240 min, négatives refusées par la règle existante)
BR-32 | corrigé (températures de fermentation −2 à 40 °C)
BR-26 | corrigé en partie : dose et durée absurdes refusées ; l'étiquette du champ de quantité au récap : reste
BR-83 / BE-7 | corrigé (eau totale ≤ 3 L par litre de bière + 1,5 L/kg de grain ; alerte « 24 L exceptionnels » déjà là)
BR-78 / BE-2 | corrigé (sliderFieldBornes : 99999 % et −1 % jamais transmis au calcul, message « hors bornes… retenu »)
BR-80 / BE-4 | corrigé (numberInputBorneFrappe, rouge sur HEAD : « 10009 » ; sliderFieldBornes pour les litres d'osmosée)
TL-16 | goût : l'alerte est vraie ; options : (a) la garder, (b) recalculer à l'ouverture avec « Annuler », (c) la rendre ambre « à recaler » avec le bouton recaler en tête
TE-15 | goût (NOLO au premier plan : voir TL-7, disposition)

## Suite (commits 5b5132a0 et suivant)
BR-111 / BE-100 | corrigé (productionVolumeBornes : 99 999 L refusé avec « au plus 2 000 L », plus de calcul de 18 000 kg)
BE-101 / BR-102 / BE-55 | corrigé (QuantityStepper dit « 0 L est hors bornes : au moins 0,5 L. 0,5 L retenu » ; test productionVolumeBornes). Les NumberInput génériques avec min/max (espace libre, capacité du fermenteur, volume en fermenteur) gardent leur rappel silencieux : voir BR-64, BR-65
BR-97 / BE-50 | corrigé (brewBudgetSheet.test, cas 99999 : « Volume à brasser … au plus 2 000 L », budget non calculé)
BR-113 / BE-102 | corrigé (« Hazy · 19,75 L » à la virgule, test productionVolumeBornes)
BR-34 | corrigé (recipeThermalPlanVirgule : « 68,5 °C », « 68,5 → 76 °C »)
BR-35 | corrigé (CSS : le nom de palier se coupe partout, `overflow-wrap:anywhere`) ; sans test (pas de rendu de mise en page en jsdom), à voir au 390 en Chrome
BR-63 / BE-17 | corrigé en partie : « Remplissage conseillé » à la virgule (RecipeInstallationChoice) ; sans test dédié
BR-87 / BE-11 | corrigé (aide TAC : « 12,2 ppm », « 4,0 », « 2,4 ») ; sans test dédié
BR-88 / BE-12 | corrigé (« 13,7 L osmosée · 16,8 L réseau » au dixième) ; sans test dédié
BR-116 / BE-87 | corrigé (Bilan : « Cible 1,065 → 1,065 mesuré », trois décimales partout) ; sans test dédié
AM-51 | corrigé (simulateur NOLO : fermentation ≤ 40 °C et 365 j, palier ≤ 80 °C et 240 min, eau ≤ 12 L/kg, rendement ≤ 95 %)
AM-24 | complété : les Réglages et le simulateur NOLO plafonnent le rendement à 95 %
AM-32 | complété : `normaliserAdditif` branché à l'import (recipeImport) ; tests bornesProcede + recipeImportRoundTrip verts
Recettes NOLO | les bornes d'empâtage, de rendement et d'eau ne s'appliquent pas (extraction froide 10 °C, 24 h, rendement 25 % : noloRecipeSolver rouge sinon)
BR-114 / BE-85 | déjà corrigé (e8165302 RJ-2 : une OG > 1,200 ne s'enregistre jamais ; 7632c3a7 : alcool calculé après OG confirmée ; tests/integration/batchAbvOgConfirmee.test.tsx)
BR-115 / BE-86 | déjà corrigé (2498e4eb AM n° 6 : conditionné 0 < volume ≤ volume en fermenteur ; tests/integration/batchPackagingVolume.test.tsx)
TE-39 | non reproduit (lecture de brewingMath.waterVolumes : l'empâtage est plafonné par la cuve utile moins le déplacement du grain ; plus de grain laisse moins d'eau à l'empâtage, le reste passe au rinçage. Voulu, physique ; pas de test)
AM-20 | non reproduit (le volume à 2 000 L est borné ; « +969 L de trop » et l'alerte de fermenteur existent déjà, MV-15)
AM-47 | reste (contrôle du matériel actuel à la reprise d'un volume de recette : demande une règle de choix, adapter ou refuser)
TL-16 | goût (l'alerte est vraie) : (a) la garder, (b) recalculer à l'ouverture avec « Annuler », (c) ambre « à recaler » avec le bouton en tête
TE-15 | goût (NOLO au premier plan, voir TL-7 : disposition)
BT-2 | goût (le Planning n'a aucun écran : à confirmer par le brasseur)
BR-66 / BE-20 / TE-14 | goût : densités NOLO à 4 décimales (« 1,0346 », voulu par un test du solveur) contre 3 ailleurs (RJ-5 à 7) ; options : 3 partout, 4 pour NOLO seul
BR-106 / BE-59 / BR-91 / BE-15 / BR-24 | goût (un seul nom d'écran ; bloc JSON de réimport à l'écran : mot et disposition)
TE-29 | goût (nom proposé d'un palier ajouté ; ligne mash-out éditable : disposition)
BR-100 / BE-53 | goût (marque du bouton choisi : forme)
TL-18 | reste : les deux « Fermer » sont les deux en-têtes de PageShell (`sm:hidden` / `hidden sm:block`), tous deux dans le DOM ; une seule en-tête rendue demande `matchMedia` simulé dans les tests et touche PageShell (hors de ma liste)
Reste, non traité faute de tours : TE-32, BR-5, BR-7, BR-25, BR-26 (étiquette), BR-28, BR-89, BR-103, BE-13, BE-56 (le « + » flottant couvre : marge de fin de défilement), BR-64, BE-18, MV-16, BR-65, BE-19 (NumberInput générique : message de borne), BR-67, BE-21, BR-82, BE-6, BR-86, BE-10, BR-90, BE-14, BR-104, BE-57, BR-105, BE-58, BR-117, BE-88, MV-17, TL-23, TL-30, TE-12, TE-31, TE-62, RJ-14, PD-5, PD-13, AM-28 (fait), BE-23 à BE-28, BE-42, BE-84, LO-4, LO-5, BR-33 (négatif : règle existante), notes (BA-NOTE-2, TL-NOTE-1/4/5, TR-NOTE-2/4, GE-NOTE-5, SU-NOTE-4, AM-NOTE-1, BT-NOTE-1) : notes de suivi, rien à corriger dans le code
