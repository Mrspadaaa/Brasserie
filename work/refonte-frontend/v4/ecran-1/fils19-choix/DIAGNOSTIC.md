# Pourquoi nos outils voient Citra ≈ Cascade (19.10, soir)

Le brasseur : « Comment choisir deux houblons ? La chose a été sur simplifier. Regarde l'état de l'art à ce sujet. Je sais que par exemple citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant d'après Nos outils ils sont assez similaire. On a fait une base mais l'outil principal, les données qui permettent à faire un vrai choix éclairé semble manquantes » ; « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure, ça a été demandé, c'est toujours pas là ».

## Mesure (moteur prototype, `predictTriplet`, recette S1 sans autre ajout, US-05)

Valeurs centrales V5.5 (échelle 0–100) des agrumes :

| Agrumes (central) | Citra | Cascade |
|---|---|---|
| 10′, 2 g/L | 39 | 39 |
| 10′, 8 g/L | 54 | 54 |
| Dry hop après fermentation, 2 g/L | 55 | 55 |
| Dry hop après fermentation, 8 g/L | 78 | 78 |

À dose et moment égaux, une famille citée par une fiche reçoit **la même valeur pour toutes les variétés**. Une famille non citée reçoit une valeur plus basse, la même pour toutes les variétés aussi (30 ou 22 à 10′ et 2 g/L). Dans V5.5, la variété n'entre que par « cité ou non cité ».

## Ce que nos données savent de ces deux houblons

| | Citra | Cascade |
|---|---|---|
| Fiches lues | 1 (Beer Maverick) | 3 |
| Familles | agrumes marqué ; tropical, noyau, melon et floral cités (1/1) | agrumes marqué (2/2) ; petits fruits, floral, herbacé, résineux et épicé cités (1/2) |
| Huile totale (mL/100 g) | 1,5–3 | 0,7–2,5 |
| Myrcène / humulène / caryophyllène (% de l'huile) | 60–70 / 7–13 / 5–8 | 45–60 / 8–20 / 3–9 |
| Linalol | inconnu | 0,4–0,6 % (Hopsteiner, 2025) |
| Thiols | inconnus | classe « forte » (Hopsteiner) |
| Géraniol, précurseurs de thiols, glycosides | inconnus | inconnus |

## Conclusion

L'outil ne peut pas distinguer Citra de Cascade en dry hop, et ce n'est pas un défaut d'affichage :
- **Le modèle** ne transforme ni l'huile, ni le linalol, ni les thiols en intensité. Le rapport E (18.10) le recommandait déjà : une charge par moment et une table de survie, jamais branchées.
- **Le dry hop** a le même effet pour toutes les variétés : un « caractère en dry hop » distinct du « caractère à l'ébullition » n'existe pas dans le modèle.
- **Les données** manquent pour Citra : une seule fiche, ni linalol ni thiols.

Il n'y a aucun outil de dry hop, de biotransformation ou de levure. Les seules briques sont `yeastSignals` (drapeaux non chiffrés), `yeastDoubleImpact` et les moments `dryActive` et `dryPost`.

Suite : l'état de l'art, dans `work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md` (en cours), puis la synthèse et le plan.
