# Ensemencement et starter — vérification ciblée du 24 septembre 2026

Audit en lecture seule par Luna, complété par ouverture des sources primaires
indiquées ci-dessous. Ce document prépare le modèle de la future refonte ;
aucune formule de viabilité ou de croissance universelle n'est validée ici.

## Ce que fait le code actuel

| Point | Comportement observé | Décision pour la refonte |
| --- | --- | --- |
| `src/domain/yeastRecipeDesign.ts` (`calculateYeastCellRequirement`, vers 590) | Besoin cellulaire à partir de volume L, OG convertie en °P et taux M cellules/mL/°P ; bilan avec cellules disponibles déclarées. Ni viabilité, ni sachets, ni croissance de starter. | Garder la conversion dimensionnelle si ses tests la confirment ; choisir et sourcer le **taux** selon produit/procédé, au lieu d'un nombre universel. |
| `src/domain/yeastRecipeDesign.ts` (dose sèche, vers 175) | Masse selon fait fabricant `g/hL × L / 100`, sans masse de sachet présumée. | Relier au conditionnement exact seulement quand connu ; afficher masse théorique et nombre entier séparément. |
| `src/ui/YeastRecipePlan.tsx` (vers 193) | Masse sèche saisie manuellement ; pour liquide/levain, taux et cellules viables saisies. | Construire le calcul de packs et le plan enregistré autour d'entrées explicites, sans convertir arbitrairement g en cellules. |
| `src/services/brewingMath.ts` (`pitchRate`, vers 345) | Ancienne règle fixe 0,75 M ale / 1,5 M lager / 1,0 M si OG élevée, 150 Md par sachet 11,5 g, arrondi au plus proche et starter après trois sachets. Luna n'a trouvé que des appels de test, aucun appel de production. | Ne pas reprendre comme référence. L'arrondi au plus proche pourrait sous-estimer le nombre de packs. |
| `src/domain/yeastBrewDay.ts`, `src/types/index.ts`, `src/domain/recipeSnapshot.ts` | Jour J : rappel « préparer la levure », quantité, notice, heure et température d'ensemencement ; pas de starter planifié lié. Le snapshot clone la recette normalisée. | Enregistrer plan/étapes avant J dans la recette, les figer au lancement, puis enregistrer séparément le réalisé dans le brassin. |

## Formules à conserver distinctes et à valider dans les tests

- **Méthode dose fabricant** (pour le produit et les conditions auxquels la
  notice s'applique) : `masse requise (g) = dose (g/hL) × volume au fermenteur (L) / 100`.
  Si la dose est une plage, conserver la plage et sa condition, choisir et
  justifier une cible avant de calculer les packs. [Lallemand Essential Ale &
  Lager](https://connect.lallemandbrewing.com/wp-content/uploads/2024/09/Lallemand_-_Essential_Series_-_Tech_Data_Sheet_-_01_-_Ale_and_Lager.pdf)
  indique 50–100 g/hL et demande d'adapter au style, à la densité et à la
  température ; ce chiffre ne vaut pas pour toutes les levures.
- **Méthode cellulaire** : si le taux applicable est en **millions de cellules
  viables/mL/°P**, `besoin (milliards de cellules viables) = taux × volume
  d'ensemencement (L) × extrait (°P)`. Justification d'unités :
  `10^6 cellules/mL × 10^3 mL/L ÷ 10^9 cellules/milliard = 1`. La conversion
  OG SG → °P et son domaine de précision doivent être documentés. Un taux
  choisi n'est pas une mesure de viabilité. [Escarpment Labs](https://knowledge.escarpmentlabs.com/article/70-standard-pitch-rate)
  publie des taux différents selon souche/catégorie, et renvoie au TDS de chaque
  produit sec : pas de taux ale/lager unique. La [thèse de Nottingham](https://eprints.nottingham.ac.uk/27767/1/T_entire%20thesis-post%20viva.pdf)
  cite une règle de pouce de littérature, sans valider une consigne universelle
  pour les produits domestiques.
- **Packs** : `ceil(quantité théorique / quantité utilisable d'un pack)` si le
  conditionnement et la quantité utilisable sont connus pour le produit, lot,
  date et conservation considérés. Garder la fraction théorique, le nombre
  entier et l'excédent visibles. Selon le cas, la quantité utilisable est en g
  ou en cellules **viables**. Aucun nombre de mL seul ni masse sèche générique
  ne donne des cellules viables.

Ces méthodes peuvent coexister comme informations **différentes**. La notice
Lallemand Essential indique au moins 1 milliard de cellules vivantes/g pour
**ce produit** ; elle avertit qu'un calculateur prévu pour la levure liquide
peut mener à un surensemencement du sec. Ne pas convertir cette borne en
équivalence universelle ou forcer l'accord entre dose fabricant et modèle
cellulaire. Toujours nommer source, version/date, produit, forme et conditions.

## Préparer et suivre un starter

[Wyeast](https://wyeastlab.com/resource/home-enthusiast-making-a-yeast-starter/)
décrit son Activator 125 mL à environ 100 milliards de cellules et le destine
directement à 19 L d'ale standard sous 1.065 SG à 18–22 °C ; densité plus
haute ou fermentation froide demandent plus de packs ou un starter. Sa méthode
de starter emploie un milieu autour de 1.040 SG, une préparation stérile, une
agitation 24–36 h et une vérification de densité ; utilisation immédiate ou
réfrigération jusqu'à une semaine. Ces chiffres décrivent **son cas**, pas une
recette universelle. [Escarpment Labs](https://knowledge.escarpmentlabs.com/article/70-standard-pitch-rate)
donne ses propres cellules par sachet et recommande un starter à l'approche de
la péremption. [Lallemand Essential](https://connect.lallemandbrewing.com/wp-content/uploads/2024/09/Lallemand_-_Essential_Series_-_Tech_Data_Sheet_-_01_-_Ale_and_Lager.pdf)
privilégie le direct pitch pour son sec ; la [notice Nottingham](https://www.lallemandbrewing.com/docs/products/tds/TDS_LALBREW_PREM_NOTTINGHAM_ENGLISH_DIGITAL.pdf)
dit qu'un starter est inutile à la dose recommandée. Aucune règle « tout sec
doit faire un starter » n'en découle.

Pour rendre un **gain cellulaire chiffré**, établir d'abord un modèle avec
domaine explicite : cellules viables initiales et leur source, produit/lot,
date et conservation, volume et densité du starter, méthode d'agitation et
d'aération, souche/forme, durée et conditions. Si la viabilité ou le modèle
manque, fournir une aide procédurale et une saisie vérifiée du réalisé, pas un
rendement supposé. Programmer l'échéance de préparation par rapport au
brassage, y compris plusieurs jours avant, puis suivre prévu/en cours/fait,
horodatages et quantité réellement ensemencée. Un plan figé dans le snapshot
du brassin reste distinct de la mesure ou déclaration de réalisation au jour J.

À recontrôler dans la future session : notices du **produit et conditionnement
retenus**, modèle SG→°P, modèle de viabilité/croissance si un chiffre est voulu,
sens du champ « cellules disponibles » actuel et migrations/snapshots. Cette
recherche ciblée ne remplace pas ces validations d'implémentation.

## Quantité prévue et composition du moût

Précision utilisateur du 24 septembre : sélectionner une levure en sachets
doit permettre de prévoir un sachet, voir le nombre conseillé pour la recette
et appliquer ce conseil explicitement. Un conseil de trois sachets pour une
imperial stout est un scénario à établir avec volume, densité, conditionnement
et dose documentés ; 12 kg de grains ne suffisent pas à le déduire.

La maltodextrine ne doit pas être assimilée automatiquement à un sucre
entièrement fermentescible : [Coopers distingue la maltodextrine de son dextrose
et de son extrait de malt](https://www.diybeer.com/products/brew-enhancer-2)
dans la fiche de ce produit. Cette fiche ne valide pas un coefficient universel
pour tous les produits et toutes les souches. Conserver la contribution à la
densité séparément de la fermentescibilité documentée, sans soustraire
arbitrairement les dextrines d'une formule fondée sur la densité du moût.
Le milieu d'un starter doit suivre la notice applicable, par exemple celle de
Wyeast citée plus haut ; ne pas confondre extrait de malt et maltodextrine.
