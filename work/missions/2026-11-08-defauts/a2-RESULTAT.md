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
