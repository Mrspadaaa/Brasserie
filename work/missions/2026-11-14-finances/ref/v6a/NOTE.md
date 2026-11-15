# v6a — v5a telle quelle, lignes serrées (deux étages gardés)

**Chaleur** : froide. **Ses mots** (09.11) : « v5a … Beaucoup mieux mais plus compact les lignes, mais quasiment parfait ».
**Idée** : seulement l'air des lignes retiré ; disposition, mots, couleurs, piles, gestes : ceux de v5a.

## Hauteurs mesurées (Chrome, 390 px, px CSS, filet compris)
| | v5a | v6a |
|---|---|---|
| Opération sans geste | 50 | **44** |
| Opération avec + pièce / ✓ Payé | 52 / 56 | **47 / 47** |
| En-tête de catégorie | 32 | **28** |
| Liste (1er en-tête → dernière opération) | 559 | **493 (−12 %)** |

## Ce qui change (et rien d'autre)
Marges de ligne 4/5 → 2/5 px ; interligne du nom 17 → 16 ; étage d'état 22 → 18 px ; pastilles d'état 18 → 16 px de haut ;
« ✓ Payé » 28 → 24 px de haut (cible 24 px, B12) ; en-tête de catégorie 7/3 → 5/1 px. Le geste reste sous le montant.

## Baseline, données, état
Inchangés de v5a (voir `p3/v5a/NOTE.md`) : mois ‹ ›, recherche, Par date, Filtres, Doublons, Apport ou prélèvement privé, Archives,
IA au toucher ; payé 325,40 · à payer 400,00 · dépensé 696,80 ; retard 2025 60,00 à part ; « Pièces jointes : exemple ».
État `v6a-etat.png` : après « ✓ Payé » sur le loyer (payé 725,40, à payer 0,00, « Annuler »).

## Contrôles
PAGE OK · MOTS 24 OK · COMMUN : survol, blocs, standard, parlant, brutes OK ; **contraste ECHEC 1, artefact** : « à payer depuis le
20 déc » est mesuré sous la barre de navigation fixe (pli à 844 px, liseré bleu de « Finances ») ; même page, barre rendue statique :
CONTRASTE OK (pire 5,36:1). PANEL (avec v6b) : ressemblance 0,95, attendu (deux fois v5a, demandé ainsi).

## Ce qui casse
Gain modeste (−12 %) : c'est le prix de « rien d'autre ne change ». Pour plus serré : v6b.
