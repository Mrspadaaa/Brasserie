# Catalogue des recettes et des brassins

## Seconde passe : un carnet utile au brasseur

La première passe rendait les fiches filtrables mais donnait le même poids aux
statistiques de catalogue et aux décisions de brassage. La seconde commence par
le travail : retrouver les lots en cuve, lire les mesures face aux cibles figées,
consulter les dégustations, comparer deux recettes indépendamment de leur volume.

Direction conservée : cave `#12100E`, surface `#1A1613`, texte `#F5F0EA`, paille
`#F2C14E`, houblon `#6E9B5B`, eau `#5B8AA6`. Source Sans 3 pour les noms et les
actions, IBM Plex Mono pour les mesures. Alignement à gauche ; noms dominants,
mesures en colonnes, actions explicites. Pas de jauge de fermentation inventée,
de feu vert automatique de conditionnement, ni de date de fin déduite d'un délai.

Disposition retenue sur mobile :

```
[Carnet                  | Bilan]
[Rechercher...           ][Filtres]
[Tous] [En cuve] [À brasser] ...
Nombre de fiches          Tri / Comparer
Nom du brassin           Phase
OG mesurée      Relevé       Volume
cible           cible FG    prévu
Contexte utile           Voir les mesures
```

Les graphiques d'écarts cible/mesure précèdent les distributions. La comparaison
des recettes se fait dans une feuille à deux colonnes : pourcentages de grain,
g/L de houblon par étape, levure, cibles et procédé. Les critères de catalogue
restent disponibles, sans imposer une grille de statistiques en tête de liste.

Le tri « À suivre d'abord » met le brassage démarré, les lots en cuve puis les
brassins à venir avant l'historique. Les raccourcis portent des nombres calculés
sur les autres critères sélectionnés. Les mesures manquantes concernent l'OG
des lots produits et la FG des lots conditionnés ou terminés, jamais la FG d'une
fermentation en cours. Aucune durée ne déclenche une déclaration « prêt ».

Les boutons des lots ouvrent la rubrique Mesures, Carnet ou Dossier selon le
besoin. La fiche reçoit les relevés intermédiaires, en conservant OG et FG ; une
température absente reste absente. Les densités acceptent la virgule française.
Les dates futures ou antérieures au brassage sont refusées pour ces relevés.

Les écarts OG/FG sont exprimés en points de densité (écart de SG × 1000) et les
valeurs exactes affichées permettent de les relire. La part conditionnée est
pondérée par les litres et calculée uniquement sur les mêmes lots conditionnés
ou terminés ayant les deux volumes : le volume encore en cuve n'est pas une perte.

La comparaison accepte deux recettes, reste consultable à 320 px sans tableau
horizontal, et conserve le grain en %, les autres fermentescibles en g/L,
les houblons en g/L par moment d'ajout, les levures, les paliers et les cibles.
La température, la durée et le jour d'un houblonnage ne sont pas confondus.

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
- `domain/productionInsights.ts` : écarts, complétude des mesures et doses comparables.
- `ui/production/ProductionCatalog.tsx` : préférences, sélection et navigation.
- `ui/production/CatalogCards.tsx` : cartes adaptées aux recettes et à la phase des lots.
- `ui/production/RecipeComparison.tsx` : comparaison de deux recettes.
- `ui/production/BatchOutcomeAnalysis.tsx` : écarts cible/résultat et volumes appariés.
- `ui/production/BatchGravityEntry.tsx` : saisie de relevés intermédiaires.
- `ui/production/CatalogToolbar.tsx` : recherche, feuille de filtres et tri.
- `ui/production/CatalogAnalysis.tsx` : graphiques et exploration par critère.
- `ProductionTab.tsx` : navigation et branchement des actions de l’application.

Les tests unitaires vérifient les sélections, les données manquantes, les
dates, les snapshots, les versions et les agrégats. Les tests d’intégration
vérifient l’édition directe, les critères combinés, leur persistance et les
passages liste/analyses. `node scripts/check-production-catalog.mjs` vérifie
les deux vues dans Chrome à 320, 390, 768 et 1 280 px, les champs tactiles,
le filtrage depuis un graphique et l’absence de débordement.
