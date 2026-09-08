# Catalogue des recettes et des brassins

## Périmètre

Cette évolution porte sur les vues, les critères de sélection et les analyses.
Les versions affichées sont les versions déjà enregistrées ; les mécanismes de
versionnement et les règles serveur de suppression ne sont pas modifiés ici.

## Organisation visuelle

Le carnet garde la palette et la typographie de L’Affinée : cave `#12100E`,
surfaces `#1A1613`, texte `#F5F0EA`, paille `#F2C14E`, houblon `#6E9B5B` et
eau `#5B8AA6`. Source Sans 3 porte le contenu ; les mesures utilisent les
chiffres tabulaires existants. La couleur d’une recette vient de son EBC,
calculé depuis les grains renseignés ou repris de la cible enregistrée.

Sur téléphone, la liste occupe une colonne. Le nom ouvre la fiche et le
crayon ouvre directement l’éditeur. La version, les brassins associés et
les premiers houblons aident à reconnaître une recette. Sur grand écran,
les listes passent à deux colonnes. Les mesures détaillées et les notes
restent sur les fiches ; la courbe individuelle se trouve dans la fiche lot.

Les filtres rapides restent accessibles horizontalement. Les critères plus
précis s’ouvrent dans une feuille mobile avec un bouton de résultat fixe.
Les champs font au moins 44 px de haut et leur texte 16 px. Les graphiques
sont regroupés dans une vue Analyse, avec des valeurs accessibles en texte.

## Critères et tri

- Recherche par nom, identifiant, style et ingrédients, sans distinction
  d’accents ou de majuscules ; plusieurs mots se combinent.
- Style, houblon, malt et levure se combinent entre eux.
- Plages de volume prévu, alcool, IBU cible et EBC prévu, avec décimales à virgule.
- Période globale, dates libres, 30 ou 90 derniers jours, année en cours.
- Recettes avec ou sans brassin associé, ou favorites ; toutes les versions ou la
  dernière version de chaque famille.
- Lots par avancement : planifiés, en cuve, conditionnés, terminés, annulés.
- Tri par date, nom, volume, alcool, IBU, couleur ou activité.

Une période sans résultat reste vide. Une valeur absente est exclue si un
critère porte dessus ; elle reste en fin de tri. Les filtres et la présentation
sont conservés séparément pour recettes et brassins sur chaque appareil.

## Données des analyses

Toutes les analyses utilisent exactement les fiches retenues par les filtres.
Une barre de style ou de houblon permet de revenir à la liste correspondante.
Un houblon compte une fois par fiche, même s’il intervient à plusieurs étapes.
Les ingrédients d’un lot proviennent de son snapshot, jamais d’une recette
modifiée après le brassage.

Les volumes de production viennent exclusivement de `volumeBrewedL` et
`volumePackagedL`. Les volumes prévus et les lots annulés ne sont pas ajoutés.
Les totaux précisent le nombre de lots renseignés. Le graphique mensuel groupe
par mois de brassage ; un lot sans date est inclus dans les totaux mais signalé
comme absent de ce graphique. Ce graphique n’est pas un historique de ventes.

Le nuage alcool/amertume utilise les cibles des recettes. Pour les lots,
l’alcool vient de l’ABV enregistré ou des OG/FG mesurées, et les IBU de la cible
figée. Une donnée inconnue n’est pas remplacée par zéro.

La courbe de fermentation contient les seules mesures enregistrées. La FG
cible vient du snapshot et est une ligne de référence séparée. Les anciens
OG, FG, dates, températures et pourcentages d’atténuation de démonstration
ont été retirés.

## Modules et vérification

- `domain/productionCatalog.ts` : projection, recherche, filtrage, tri et agrégats.
- `domain/fermentationReadings.ts` : lectures de densité sans valeurs fictives.
- `ui/production/ProductionCatalog.tsx` : cartes et préférences de présentation.
- `ui/production/CatalogToolbar.tsx` : recherche, feuille de filtres et tri.
- `ui/production/CatalogAnalysis.tsx` : graphiques et exploration par critère.
- `ProductionTab.tsx` : navigation et branchement des actions de l’application.

Les tests unitaires vérifient les sélections, les données manquantes, les
dates, les snapshots, les versions et les agrégats. Les tests d’intégration
vérifient l’édition directe, les critères combinés, leur persistance et les
passages liste/analyses. `node scripts/check-production-catalog.mjs` vérifie
les deux vues dans Chrome à 320, 390, 768 et 1 280 px, les champs tactiles,
le filtrage depuis un graphique et l’absence de débordement.
