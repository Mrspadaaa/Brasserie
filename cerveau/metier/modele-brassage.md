---
name: modele-brassage
description: Modèle de données du brassage L'Affinée — moments de houblon typés, levure structurée, recette figée dans le brassin.
type: metier
maj: 2026-10-22
sources: mémoire locale affinee-brassage-modele.md ; src/domain/water.ts (devenu le dossier src/domain/water/ dans ce worktree)
---

Refonte du brassage livrée le 03.09.2026. Décisions structurantes prises avec Gaëtan, qui ne se relisent pas dans le code seul :
- **Le brassin FIGE la recette** (`Batch.recipeSnapshot`) au lancement : modifier une recette ne réécrit jamais l'histoire d'un brassin passé. `recipeRef` ne reste que comme provenance.
- **Alarmes du jour de brassage : son + `wakeLock` seulement.** Pas de PWA, pas de notifications système : arbitrage explicite de Gaëtan, à ne pas « améliorer » sans le lui redemander.
- **Le stock ne bouge que par achat (+) et brassage (−).** La retouche manuelle est une *correction d'inventaire* : on saisit le stock COMPTÉ et un motif obligatoire, l'écart part au journal. Les `+/−` sur les lignes de liste ont été retirés pour cette raison.
- **Amertume du premier moût : convention pleine ébullition + 10 %**, celle de Brewer's Friend que Gaëtan cite comme référence, et non « équivalent 20 min ». L'IBU calculé peut dépasser celui d'une recette importée ; les deux sont affichés côte à côte.
- **Couleur et densité prédite ne sont calculées que si CHAQUE malt porte `colorEbc` / `potentialPpg`.** Sinon la fiche affiche « incalculable ». Jamais de valeur plausible : on brasserait dessus.

Deuxième passe (03.09.2026), penser en brasseur :
- **`Fermentable` remplace `MaltIngredient`** : `kind` (grain / sucre / lactose / fruit / extrait) + `fermentabilityPct`. Il répare la densité finale d'une milk stout, où le lactose était compté comme sucre fermentescible. Le rendement d'empâtage ne s'applique QU'AU grain.
- **Ensemencement calé sur 150 milliards de cellules par sachet** (~13×10⁹/g), arrondi au PLUS PROCHE. Le minimum des fabricants (6×10⁹/g) faisait réclamer deux sachets pour une pale ale de 20 L, contre la table de dosage de Fermentis.
- **Le solveur de sels traite le magnésium AVANT le sulfate** : l'Epsom apporte les deux, et l'ordre inverse faisait dépasser le sulfate de plus de 100 ppm.
- **L'alcalinité ne se recopie jamais du profil cible.** Burton titre 270 ppm de HCO₃, mais une IPA ne se remonte pas : l'alcalinité suit la couleur (`targetRaForColor`) et se traite à l'acide.
- **Gemini 3 accepte l'ancrage Google ET `responseSchema` dans le même appel** (la restriction ne concernait que 1.5 et 2.0). La métadonnée d'ancrage revient vide : chaque schéma porte donc son champ `source`, obligatoire.
- **Aucune API suisse d'analyse d'eau potable n'existe.** Hub'Eau est français ; Fribourg ne publie que la dureté. Les profils d'eau sont saisis à la main.

Troisième passe (04.09.2026), le champ hérité qui casse en silence :
- Renommer `malts` en `fermentables` a laissé quatre lecteurs du champ hérité, trouvés par les tests et jamais par la compilation (`strict: false` + `malts?:` optionnel) : `stockLevel.usageInBatch`, `brewingMath.scaleRecipe`, `storage.brewRecipeAndDeductStocks`, `ProductionTab`.
- **Règle** : un champ déprécié se lit UNIQUEMENT via `ingredientsOf()` / `normalizeRecipe()` / `normalizeBatch()`.
- Vérification : `npm test` (288 tests, seuils 80/75/80/80 sur `src/domain` et `src/services`). Le second modèle d'eau de `brewingMath` (`calculateWaterSalts` & co, 145 lignes) a été supprimé ; `domain/water.ts` le remplace.

Quatrième passe (04.09.2026), le procédé réel de Gaëtan :
- Corrections décidées après « le sparge water me semble très haut, je mets normal entre 10 et 15 L ». Il brasse sur un MONOCUVE (AIO) et rince le moût au-dessus de la cuve, panier soulevé. Il empâte donc MINCE : 4.2 L/kg, retenu parmi trois options chiffrées. `bh-30` et `bh-50` passent de 3.0 à 4.2 L/kg ; la 300 L reste à 3.2 (trois cuves séparées).
- L'épaisseur de maische est un curseur de l'atelier de l'eau. À 4.2 L/kg le rinçage tombe à 13.4 L sur son brassin type (7.1 kg pour 30 L) mais remonte à 17 L sur une bière légère de 6 kg : le curseur est le rattrapage, voulu.
- Le pH d'empâtage est estimé depuis la facture de grain. Garantie codée et testée : `targetRaForGrist` ne peut que RELÂCHER la fenêtre d'AR, jamais la durcir. Marge à l'écran : ±0.15 pH. Contrainte de Gaëtan : « si on n'est pas à 100 % pas grave, je ne veux pas sur-acidifier ».
- Le houblonnage oriente la balance SO₄ ⇄ Cl, mais DANS la fourchette du style seulement. Deux signaux : le BU:GU, et la part de masse versée pour amériser (premier moût + ébullition ≥ 15 min) face à celle de l'arôme. Le BU:GU seul envoyait une milk stout au sulfate.

Voir [[socle-v01]] et [[design-system-historique]].
