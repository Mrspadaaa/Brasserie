# PLAN — voie an (outil d'analyse a2a)

Ouvert : les six captures de `p7/a2a/` (a2a-v1 à v5, a2a-1280) et `etat.html`. Entrée : Synthèse › « Revoir le mois ». Un outil à part, rendu à la place de la Synthèse, avec « ‹ Synthèse » pour revenir.

## Inventaire des cinq figures (élément, état, source du nombre, fichier)
| Fig. | Élément | État aujourd'hui | Source du nombre | Fichier |
|---|---|---|---|---|
| 1 Caisse | titre « 11.10 → 10.11 » + segment 30 j / 90 j / 12 mois | absent | `fenetreDe` | `Analyse.tsx` |
| 1 | vues Caisse · Sources · Budget · Filtrer (segment sous le titre) | absent | — | `Analyse.tsx` |
| 1 | phrase-réponse (+400 · ┄ +280 · ① pire baisse · ② pas prévu) | absent | `escalierCaisse` (écart, prévu, pireBaisse, pasPrevu) | `phrases.ts` |
| 1 | trois cases En caisse / ┄ Prévu / 2025 | absent | `soldeAvant/FinJour`, `prevu.finCents`, `anDernier.finCents` | `Caisse.tsx` |
| 1 | escalier SVG, marches teintées par source, prévu en pointillé, trait gris 2025, étiquettes accrochées, « pas prévu » orange | absent | `escalierCaisse` (`FinancialPayment`, `FinancialPlan`, brassins dérivés) ; `placerEtiquettes`, `graduations` | `Escalier.tsx` |
| 1 | légende d'une ligne, ✦ Pourquoi ?, « n opérations › » (journal filtré) | absent | `marches.length`, `onJournal` | `Caisse.tsx` |
| 2 Sources | cascade couchée : caisse début → ventes → sources → caisse fin, cadre pointillé prévu, encoche 2025, hachuré dépassé, matériel à part | absent | `cascade` (= `periodeSynthese` + soldes) | `Sources.tsx` |
| 2 | ✦ Pourquoi le brassage dépasse ? (ouverte) | absent | `pourquoiDepasse` (gabarit sourcé, sans IA) | `Pourquoi.tsx` |
| 3 Budget | « 8 092,00 dépensé sur 8 100,00 prévus · 6 mois sur 10 au-delà », une règle par source, brassins prévu → réel | absent | `budgetAnalyse` | `Budget.tsx` |
| 4 Filtrer | tuiles de 12 mois (gagné/perdu, règle du budget, 2025) ; Mois · Du…au · Année ; pastilles source / fournisseur / brassin ; escalier cumulé | absent | `tuilesAnnee`, `serieFiltre`, `fournisseursDe` ; `PlageMois` pour Du…au | `Filtrer.tsx` |
| 5 Ses données | « ≤ … gagné », « rien noté » hachuré, départ « à confirmer », « 5 achats ≥ … à compléter », matériel à part, « Budget, Sources : rien de prévu » | absent | `escalierCaisse.connu/incertains`, `prevu === null` | tous |
| Entrée | ligne « Revoir le mois › » en Synthèse | absente | — | `FinanceOverview.tsx` |

## Décisions (écrites)
1. **Pourquoi ?** : un gabarit sourcé (« Calcul fait ici, sans IA »), comme `synthese/Pourquoi.tsx` : aucun chemin IA n'existe en Synthèse (grep). Aucun Gemini. Si le brasseur veut une vraie IA, c'est un lot à part.
2. **Mois entiers** pour Sources, Budget et Filtrer (`periodeSynthese` compte par mois) ; seule la Caisse est au jour. Le titre dit la vraie fenêtre.
3. **Pas prévu** : une opération payée sans plan, seulement s'il y a un prévu dans la fenêtre (sinon « rien de prévu », jamais tout en orange).
4. **2025** : même fenêtre un an plus tôt ; « rien noté » sans pièce, jamais 0.
5. **Brassin prévu → réel** : prévu = plan « brew » du brassin ; réel = pièces rattachées (`finance.batchId`). Le coût du litre reste dans Prix.
6. État de l'art : graduations de Heckbert en 15 lignes (`d3-scale` non déclaré) ; étiquettes par `placerEtiquettes` (glouton, rectangles), testé sur 25 sorties.

## Fichiers
`src/domain/finance/analyse.ts`, `src/ui/finance/analyse/{Analyse,Caisse,Escalier,Sources,Budget,Filtrer,Pourquoi,phrases,format}.tsx|ts`, `src/ui/finance/analyse.css` (préfixe `ana-`), entrée dans `FinanceOverview.tsx`, props dans `FinancesTab.tsx`, tests `tests/unit/analyse*.test.ts`, `tests/integration/analyse.test.tsx`, bloc dans `renvoisPartout.test.tsx`.

## Tests d'abord (rouges sur HEAD : le module n'existe pas)
`analyse.test.ts` : soldeAvant, escalierCaisse (connu / écart / depuis / prévu / pas prévu / 2025 / pire baisse), cascade (conciliation, matériel à part, null), budgetAnalyse (dépassé, rien de prévu, brassin), tuilesAnnee, serieFiltre, graduations (−892,66 → 4 181,60 : pas de 1 000), placerEtiquettes (aucun recouvrement, `+N`).

## Hors périmètre
Écriture de données, IA réelle, ancien bloc Synthèse (reste ; l'outil est à part, NOTE a2a).
