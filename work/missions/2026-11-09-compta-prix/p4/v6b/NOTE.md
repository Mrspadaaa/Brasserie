# v6b — v5a telle quelle, lignes serrées : le geste à côté du montant

**Chaleur** : froide. **Ses mots** (09.11) : « v5a … Beaucoup mieux mais plus compact les lignes, mais quasiment parfait ».
**Idée** : les deux étages de v5a resserrés au plus près (15 + 14 px) ; pour y tenir, le geste (✓ Payé, + pièce) passe à gauche
du montant, centré sur les deux étages, au lieu de s'empiler dessous. Seul déplacement ; mots, couleurs, piles : ceux de v5a.

## Hauteurs mesurées (Chrome, 390 px, px CSS, filet compris)
| | v5a | v6b |
|---|---|---|
| Opération sans geste | 50 | **36** |
| Opération avec + pièce / ✓ Payé | 52 / 56 | **36 / 36** |
| En-tête de catégorie | 32 | **24** |
| Liste (1er en-tête → dernière opération) | 559 | **401 (−28 %)** |

Toutes les opérations ont la même hauteur, avec ou sans geste. « ✓ Payé » garde ses 28 px, « + pièce » 24 px (B12).

## Ce qui change (et rien d'autre)
Marges de ligne 3/3 px ; nom 14 px sur 15 ; étage d'état 12 px sur 14, pastilles de 14 px de haut ; icônes de pièce 14 px (trait 2,6
pour garder 1,5 px rendu, S4) ; pastille de catégorie 22 → 20 px ; état et pièce sans retour à la ligne. Dans l'état dessiné, la
ligne payée prend toute la largeur (encadrée, elle repliait « sans pièce »).

## Baseline, données, état
Inchangés de v5a (voir `p3/v5a/NOTE.md`) : mois ‹ ›, recherche, Par date, Filtres, Doublons, Apport ou prélèvement privé, Archives,
IA au toucher ; payé 325,40 · à payer 400,00 · dépensé 696,80 ; retard 2025 60,00 à part ; « Pièces jointes : exemple ».
État `v6b-etat.png` : après « ✓ Payé » sur le loyer (payé 725,40, à payer 0,00, « Annuler »).

## Contrôles
PAGE OK · MOTS 24 OK · COMMUN : survol, blocs, contraste, standard, parlant, brutes OK. PANEL (avec v6a) : ressemblance 0,95,
attendu (deux fois v5a, demandé ainsi).

## Ce qui casse
Le geste n'est plus sous le montant : l'œil qui cherche le montant passe d'abord sur le bouton noir du loyer. Un nom long (« Malt
et houblons · Pale Ale · Comptoir du brasseur ») est coupé plus tôt sur une ligne qui porte un geste.
