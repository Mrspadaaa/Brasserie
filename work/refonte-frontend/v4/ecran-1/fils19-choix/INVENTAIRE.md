# Dry hop, biotransformation, levure : ce qui existe déjà (19.10, soir)

Le brasseur : « Confirmé : il manque encore un véritable outil de dry hop, biotransformation et levure. Regarde ce qui a été commencé, déjà mis en place ect.. ».

L'inventaire a été fait en lecture seule, sur l'app réelle (`src/`), `functions/`, le prototype, les maquettes, `docs/` et les issues. Aucun test n'a été relancé : « testé » veut dire qu'un test existe.

**Verdict** : il y a beaucoup de briques, mais aucune ne forme un outil de décision de bout en bout.
- La meilleure brique, `src/domain/hopDecision/biotransformation.ts`, est finie et testée, mais aucun écran ne l'alimente.
- Le dry hop a une vraie saisie (phase, contact, température), mais le modèle donne la même valeur à Citra et à Cascade.
- La levure a un catalogue de 1 733 fiches, mais aucune β-lyase connue dans le modèle houblon.

## Les pièces, et leur état

Légende : AR = app réelle ; F = `functions/` ; P = prototype ; M = maquette.

| Pièce | Où | État | Ce qui manque |
|---|---|---|---|
| Saisie phase (active, après), contact (h), température | AR (`src/ui/hopIndex/HopRecipeGuide.tsx`, `src/pages/BrewWizard.tsx`) | **fini** | aucune donnée de référence derrière |
| Avertissements procédé à cru (densité, diacétyle) | AR (`src/domain/hopRecipeDesign.ts`) | **fini** | — |
| Programme NEIPA (deux dry hops à 19 °C, « biotransformation ») | AR (`src/domain/brewPrograms.ts`) | **fini**, éditorial | — |
| Amertume à cru en mg/L iso-α (Maye 2016) | F + AR (`functions/src/hopBitternessCore.ts`, `HopBitternessPanel.tsx`) | **fini** | unité à unifier avec la suivante |
| Amertume à cru en BU (Lafontaine 2018, table 5) | AR (`src/domain/hopDecision/coldIbu*.ts`, `coldContactEvidence.ts`) | **fini**, étroit | une calibration, Cascade 2015 seulement |
| Courbe de dose de dry hop (Lafontaine 2018, 0–16 g/L) | AR (`src/data/hopDoseStudyBootstrap.json`) | **fini**, une étude | autres variétés |
| Modèle V5.5, temps de fermentation et post-fermentation | AR + F (`hopExtrapolationBootstrap.json`, `hopExtrapolationCore.ts`) | **fini**, exploratoire, non validé | la variété n'entre que par « cité ou non » |
| Risque de hop creep | F (`hopPredictionCore.ts`) | **fini** | ampleur non quantifiée |
| Risques 4-MMP et précurseurs | F | **inachevé** | seuils à sourcer, d'où « inconnu » permanent |
| Évaluation de la biotransformation (thiols, géraniol → citronellol, contribution fermentaire, hop creep ; sources, statuts) | AR (`src/domain/hopDecision/biotransformation.ts`, 467 lignes, 11 tests) | **inachevé récupérable** | aucun écran n'envoie `biologicalContext` ; le composant `Biology` reste muet |
| Réponse documentaire sur la biotransformation | AR (`src/services/hopV55/decision.ts`, `advice.ts`, `documentaryAnswer.ts`) | **fini** côté texte | rendu non joué en parcours (Q11) |
| Saisie de contributions biologiques (min, max, source) | AR (`BiologicalInputsEditor.tsx`, `scenarioBiologicalInputs.ts`) | **fini**, saisie libre | aucune valeur de référence |
| Schéma des analytes (4-MMP, 3-MH, 3S4MP, 3-MHA, géraniol, citronellol, linalol, HSI) | F (`hopIndexSchema.ts`) | **fini** | données presque vides ; 4-MSP absent |
| Solveur chimique (thiols, β-lyase) | AR, interface orpheline (`HopSolverPanel` → `HopWorkshop` → `HopSearchPanel`, importé par personne) | **inachevé récupérable** | à monter ou à retirer |
| Catalogue levures, 170 faits de biotransformation (127 levures) | AR (`yeastCatalogueBootstrap.json`, `YeastCataloguePanel.tsx`) | **fini**, documentaire | qualitatif (Escarpment, Omega) |
| β-lyase dans le modèle houblon | AR (`hopYeastBootstrap.json`) | **inachevé** | 6 souches sur 6 « unknown » |
| Double impact de la levure (V5.5, trois souches) | AR + F | **fini**, faible | expression du houblon identique pour les trois |
| Affinités levure-recette, compagnon | AR (`yeastRecipeProfiles.ts`, `yeastCompanion.ts`) | **fini**, éditorial | sans chiffre |
| Dose de levure en g et en sachets (#132) | — | **absent** | tout |
| Signaux de levure et leviers | P (`prototypes/houblons-v4/src/engine/yeast.ts`, `voies.ts`) | **inachevé** | absents de l'écran du prototype |
| Signaux de biotransformation dans q2b et la base v4.10 | M | **maquette** | pas dans l'app |

## Les données qui existent

- **Thiols mesurés** : un seul jeu, Cascade T90 (Samia 2026), base inconnue. Classes « thiol impact » de Hopsteiner : 70 variétés (faible 42, moyenne 14, forte 14).
- **Géraniol** : 11 mesures, d'unités hétérogènes. **Linalol** : 86 occurrences. **HSI** : 9.
- **Études citées** : Samia 2024 (cinq levures, Cascade, sans dry hop, panel CATA), Samia 2025 (IRC7), Michel 2019 (148 souches), Takoi 2017 (42 variétés, géraniol → citronellol), Lafontaine 2018 (dose de dry hop, Cascade), Maye 2016 (humulinones), Reglitz et Steinhaus 2017 (4-MSP), Chenot 2026, Willemart 2025 (hop creep) ; 34 entrées dans `hopResearchBootstrap.json`.
- **Levures du modèle houblon** : US-05, Verdant IPA, Pomona caractérisées (arôme propre, jugement de L'Affinée) ; Diamond, Nottingham, London, BRY-97 inconnues.

## Ce que le brasseur a déjà demandé (extraits, avec leur source)

- 08.09, C079 : « Je veux aussi une Integration pour la levure… donne moi la ou les levures parfait ».
- 09.09, C019 : « Et le calcul d'ibu en dryhop ne fonctionne juste pas ».
- 12.09, C074 : « … le brasseur choix et l'interface l'aide à comprendre, anticipé, donner les instructions, simuler ».
- 29.09 :
  - C053 : « Est-ce que dans ma blanche je peux faire du dryhopping ai j'ajoute 20g de moins dans le moût ? » ;
  - C058 : « Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa » ;
  - C060 : « … Est-ce que la bio transformation peut m'aider là dedans ».
- 01.10, R43 : « la biotransformation et le double impact des levures sont trop écartés, alors qu'ils sont essentiels ».
- 18.10 : « … c'est pas pour tout de suite » ; puis « … comment ça d'intégre ? Ça a été oublié ? ».
- 19.10 :
  - « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure, ça a été demandé, c'est toujours pas là » ;
  - les cas : « dryhop de citra, Galaxy, idao7… 3j Citra, 7j Galaxy ; 3j citra - 5j idao7 ».

Les citations complètes sont dans `docs/besoins/corpus-demandes.md`, `exigences-retrouvees.md`, `work/refonte-frontend/v4/SPEC-BRASSEUR.md` et le registre.

## Ce qui manque pour un vrai outil, du plus court au plus long

1. **Un point d'entrée « ajout à cru »** qui remplit `biologicalContext` depuis la recette (levure réelle, phase, contact, température, dose, forme) et appelle `biotransformation.ts`. C'est le manque le plus court.
2. **Les constats sur la ligne d'ajout**, dans le parcours, et pas seulement dans une réponse texte.
3. **La β-lyase par souche**, d'après les sources existantes (Samia 2024 et 2025, Michel 2019), avec son niveau de preuve.
4. **La variété dans le modèle** : huile introduite, linalol, géraniol, thiols par variété, à plusieurs sources (#131). C'est le pouvoir aromatique demandé.
5. **Séparer la levure du houblon** : aujourd'hui, l'expression du houblon est la même pour toutes les souches.
6. **Les seuils des risques 4-MMP et précurseurs.**
7. **Une seule amertume à cru** (Maye et Lafontaine), comme demandé en C019 et C049.
8. **La dose de levure** (#132).
9. **Le solveur chimique orphelin** : à monter ou à retirer.
10. **Un test de parcours** qui fait apparaître un constat de biotransformation dans l'interface.

Réserve : l'agent d'inventaire a écrit, par erreur, une copie de commentaires GitHub hors du dépôt (`%TEMP%\c119.txt`, 18 Ko). Rien n'a été modifié dans le dépôt.
