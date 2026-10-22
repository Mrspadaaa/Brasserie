---
name: import-recette
description: Import de recette L'Affinée — le procédé vit dans le déroulé, pas dans la liste d'ingrédients ; fiche de brassage éditable.
type: produit
maj: 2026-10-22
sources: mémoire locale affinee-import-recette.md ; tests/unit/recipeParser.test.ts ; functions/src/prompts.ts ; src/ui/BrewSheet.tsx
---

Refonte de l'import de recette et du récapitulatif, 04.09.2026, après que Gaëtan a collé la NEIPA de Brew Your Own : « j'ai vraiment l'impression qu'il manque des info ». Il avait raison. Mesuré au parseur, pas supposé.

**Le constat : la lecture rendait bien les INGRÉDIENTS et perdait le PROCÉDÉ.** Tout ce qui compte pour brasser est écrit dans le déroulé, jamais dans la liste d'ingrédients, et rien ne l'y cherchait.

Corrigé, chaque point couvert par un test sur la NEIPA (`tests/unit/recipeParser.test.ts`, bloc « NEIPA de BYO ») :
- **Le hop stand** : température et durée (82 °C / 20 min) vivent dans le déroulé. Sans elles, l'IBU du whirlpool ne se calcule pas ; sur une NEIPA c'est la moitié de l'arôme.
- **L'alpha se reporte d'un ajout à l'autre pour un MÊME houblon** : l'Amarillo de premier moût donne 8,6 % ; le second ajout repartait à zéro. L'avertissement d'alpha manquant est émis APRÈS le report, une fois par houblon.
- **Le ™ aplati en « TM »** : « GalaxyTM » ne se rapprochait jamais du « Galaxy » du stock.
- **Les doses en cuillères et en tasses** (« 3⁄4 cup corn sugar ») étaient abandonnées EN SILENCE. Gardées dans leur unité d'origine : convertir une tasse en grammes suppose une densité de tassement inconnue.
- **Nouveaux champs** `mashWaterL`, `preBoilL`, `carboVolumes`, `waterNote`, `dryHopNote`. Trois volumes DIFFÉRENTS coexistent (brassin, empâtage, moût d'avant-ébullition) ; les confondre fausse le rendement.
- **Le mashout n'invente plus 10 minutes** quand la recette n'en donne pas.
- **`splitSentences`** : le point de « tsp. » n'est pas une fin de phrase ; il amputait la note d'eau de sa dose de chlorure de calcium.

Le prompt serveur (`functions/src/prompts.ts`, `importRecipe`) réclame les mêmes champs et interdit explicitement la conversion des cuillères en grammes.

**Fiche de brassage** (`src/ui/BrewSheet.tsx`) : le récapitulatif était une liste en lecture seule. Gaëtan : « je veux pas aller dans chaque sous-menu pour adapter ». Tout s'y modifie là où ça se lit ; les houblons sont rangés dans l'ordre de la JOURNÉE (premier moût → cru), pas de saisie. Ce qui est calculé (IBU d'un ajout, % du grain, OG/EBC du bandeau) reste en lecture.

Vérifié dans le navigateur : passer l'Amarillo de 43 à 86 g depuis la fiche fait 62 → 105 IBU en direct.

Voir [[saisie-mobile]] et [[modele-brassage]].
