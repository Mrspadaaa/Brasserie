# Audit des filtres de Chercher (levures) — 09.11

Ses mots : « Chercher : c4 + filtres  Oui mais pas assez de filtre, fait un audit la dessus, quels filtre à ajouter » ;
« houblons, banane ECT était juste des exemples c'est pas assez générique DU TOUT !!!! ».

## Principe : une seule liste d'axes, tirée de la fiche
Un filtre n'est pas une liste choisie à la main : chaque champ de la fiche levure devient un axe. Le même axe sert
quatre fois : un **filtre** dans Chercher, une **rangée** dans Comparer (s5a), un **+ / −** dans Suggérer (s6a), une **jauge**
dans l'étape (l5b). Un axe ajouté au catalogue apparaît partout, sans liste à tenir à jour.
Chaque filtre dit son compte et ses « non documentées » ; toucher ce nombre lance la recherche IA (sa règle du 09.11).

## Mesure (`yeastCatalogueBootstrap.json`, 1 733 fiches, une valeur par fiche)
| Axe | Fiches documentées | Dans c5a | Verdict |
|---|---|---|---|
| Disponibilité (vendue CH · FR · DE, fabricant présent en Europe, rare) | 8 offres relevées | oui | garder ; le relevé des boutiques est à faire au port |
| **Boisson : bière / vin / cidre / distillerie** | ≈ 350 fiches de vin, 58 de distillerie (mots et fabricant : Lallemand Wine, AEB… ; estimé) | non | **ajouter**, réglé sur « bière » par défaut : aujourd'hui une levure de vin sort dans la liste |
| **Famille : ale, lager, blé, belge, saison, anglaise, kveik, Brett, bactéries, mélange** | lager ≈ 188, Brett ≈ 133, bactéries ≈ 124, kveik ≈ 118 (espèce, usage, catégorie ; estimé) | non | **ajouter** : c'est la première question du brasseur |
| Style (12 familles de l'app) | 321 (18 %) | oui | garder, avec « 1 412 sans style documenté » |
| Température (plage) | 877 | oui | garder |
| Atténuation (plage) | 888 | oui | garder |
| **Tolérance à l'alcool** | 799 (456 à 12 % ou plus) | non | **ajouter** : triple, imperial stout, barley wine |
| Floculation (clarté) | 979 | oui | garder |
| Forme (sèche, liquide) | 316 (forme ou texte de forme) | oui | garder, « 1 417 forme inconnue » |
| Effets : esters, phénols (POF), thiols, terpènes, arômes | POF 292, arômes 756, biotransformation 127, esters 45 | en pastilles nommées | **rendre générique** : chaque effet de la fiche, avec son niveau (faible, moyen, élevé) |
| **STA1 / diastaticus (risque de surcarbonatation)** | 566 documentées, 101 positives | non | **ajouter** : « sans STA1 » ; c'est un risque de bouteilles qui sautent |
| **Laboratoire, fabricant** | 1 733 (25 fabricants) | non (l'app actuelle l'a) | **ajouter** : il est déjà dans l'app ; ne pas le perdre |
| **En stock chez moi** | inventaire de l'app | non | **ajouter** : « j'en ai déjà » avant d'acheter |
| Vitesse de fermentation | 262 | non | ajouter, en second rang |
| Rondeur (glycérol, sucres restants) | 62 + 15 | non | ajouter, en second rang, avec la part non documentée |
| Soufre (H₂S, SO₂) | 26 + 13 | non | second rang ; peu documenté, rendu honnête |
| Besoin en nutriments | 106 | non | second rang |
| Sans alcool, maltose négative | 13 | non | second rang (lien avec `noloProcessYeasts.json`) |
| Mousse, pH, acidité volatile, malolactique | 26 et moins | non | ne pas en faire des filtres : vin ou trop peu de fiches |
| Édition limitée, saisonnière | 67 | non | non : sa disponibilité se lit dans les offres |

## Dans le tiroir
- **Premier rang**, toujours visible : Boisson (bière par défaut), Famille, Style, °C, Atténuation, Tolérance à l'alcool,
  Effets, Floculation, Forme, Disponibilité, En stock.
- **« Plus de filtres »** : Sans STA1, Labo, Vitesse, Rondeur, Soufre, Nutriments, Sans alcool.
- **Trier par** : proche de la levure tapée (défaut c4), prix, atténuation, °C, tolérance.
- **Lié à la recette** : la tolérance et le °C se pré-règlent depuis l'OG et la conduite, en repère et jamais en filtre
  imposé (règle du pilote sur c5b).

## Ce que la donnée ne permet pas
- La β-lyase n'est connue pour aucune fiche ; un filtre « thiols » s'appuie sur la biotransformation déclarée (127).
- Le style n'est documenté que pour 18 % des fiches ; la famille, déduite de l'espèce et de l'usage, en couvre davantage.
- Les comptes « estimé » viennent d'une recherche de mots, à remplacer au port par un champ normalisé.

## Suite
Passe 4 de Chercher : c5a avec ces filtres (premier rang, plus de filtres, trier).
Suggérer : s6a avec les axes de cette liste, chacun avec + et − (DEFAUTS LV-1).
