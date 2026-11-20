# Règle de l'app : chaque geste décompte ce qu'il use (L9, pe3, pe4)

Priorité 1 de la mission. Ses mots :
- « super important!! À bien mettre et généralisé partout » (16.11, sur L9).
- « ça a des conséquences sur tout » (15.11).
- « C'est juste des exemples, être générique et général » (15.11).

Ses choix : pe3 (la trace sur place), pe4 (la dose demandée une fois, jamais inventée) et pe1 (l'onglet du bas).
Ce n'est pas un écran. C'est une règle de l'app : tout geste qui consomme passe par elle.

## État de l'art (L29)

- **Problème d'école.** C'est la consommation automatique de la nomenclature d'une opération, que les ERP et MRP appellent *backflushing* : on déclare une fois les composants d'une opération, et ils sont sortis du stock quand l'opération est déclarée faite. L'annulation passe par une *écriture compensatoire* : un mouvement inverse, jamais un effacement. Le rejeu se règle par une *clé d'idempotence* par opération.
- **Examiné.** Une bibliothèque de moteur de règles (json-rules-engine) est inutile : il y a une seule forme de règle, « geste → article, quantité », sans condition imbriquée. L'event sourcing complet est trop lourd ; le journal `movements` existant suffit comme trace.
- **Décision.** Une fonction pure sur le modèle de `prepareBrewStockConsumption` (`src/domain/finance/brewStockConsumption.ts:38`), qui produit des mouvements idempotents. L'annulation reprend la logique de `revertTransaction` (`src/services/storage.ts:566`). Aucune dépendance neuve.

## La règle

1. **Geste** : `{ id, type, objet, cycle, quantites? }`. Le type est une chaîne libre, sans liste fermée. Il couvre par exemple laver un fût, brasser, embouteiller, nettoyer une cuve ou conditionner. Clé : `objet + cycle` (le fût F7 au 3e lavage, le brassin LOT-016 à l'étape brassage). Rejouer le même geste ne décompte rien de plus.
2. **Table réglée une fois par geste** : elle est rangée en config (synchronisée, hors ligne par le cache Firestore). Elle contient des lignes `{ geste, article (stockItemRef), quantité, unité, par : geste | litre | unité, active }`.
   - **Articles** pré-remplis par catégorie : un geste de nettoyage propose les articles `cleaning` du stock.
   - **Doses** jamais pré-remplies, conformément à PRODUCT.md et à pe4. Une dose inconnue se demande une fois, au curseur, au premier geste. Sans réponse, rien n'est décompté et la question revient au geste suivant. Une dose n'est jamais mise à 0.
3. **Plan pur** : `planifierConsommation(geste, table, stocks)` renvoie `{ mouvements, manquantes, alertes }`. Chaque mouvement est de type `consommation` et porte `gesteId` et `regleId`. Un stock insuffisant ne bloque jamais le geste : l'effet passe en alerte.
4. **Écriture** : le plan est écrit avec le geste, dans le même lot (`FirestoreRepo.put` par document).
5. **Bandeau d'effet** : il apparaît après le geste, avec Annuler. Exemple : « Fût F7 lavé : PBW −30 g, Star San −5 ml ». C'est l'onglet du bas de pe1, qui reprend la forme v6a.
6. **Trace sur place** (pe3) : la ligne de stock montre « −30 g · lavage F7 ↺ ».
7. **Annuler** : écrit les mouvements inverses de tout le `gesteId`. L'annulation est refusée avec son motif si le stock a été corrigé depuis.

## Branchements (chaque geste, une ligne)

| Geste | Ancre du code |
|---|---|
| Lavage d'un fût | `KegBoard.tsx:80` |
| Brassage, en plus des ingrédients | `Batch.stockConsumption`, `storage.ts:1003` |
| Conditionnement | `BatchPackagingForm` |

Tout geste ajouté plus tard appelle la même fonction : il n'y a pas de cas codé à la main.

## Fini quand

Tous ces points sont tenus :
- la règle est branchée sur au moins trois gestes réels ;
- Vitest couvre le plan pur : idempotence, dose inconnue, stock insuffisant, annulation ;
- le geste est joué dans l'app locale à 390 et à 1280, dans les deux thèmes, avec un bandeau visible et Annuler qui marche ;
- le build est vert ;
- aucune donnée réelle n'est touchée.

## État (16.11, codé)

- Plan pur : `src/domain/consommation/gestes.ts` ; 10 tests dans `tests/unit/consommationGestes.test.ts` (idempotence, dose inconnue, dose donnée plus tard, stock court, dose 0 = pas utilisé, par litre sans volume, geste inconnu, annulation unique, annulation refusée après comptage).
- Écriture : `StorageService.enregistrerGeste`, `annulerGeste`, `retenirDose` ; table dans `config/consommation` ; mouvements `consommation` et `consommation-annulee` dans `movements` (immuable).
- Écran : `src/ui/BandeauEffets.tsx` (pe1 et pe4, monté dans App) ; trace pe3 dans `StockRow`, ↺ annule.
- Branché : lavage d'un fût (`KegBoard`), brassage (`completeBrewStock`, étape brewday), conditionnement (`BatchDetailSheet`, au litre).
- Joué en local (`parcours-geste.cjs`, ?dev-local, nettoyants comptés à 5 en mémoire) : 390 tactile et 1280, sombre et clair ; question, dose retenue, effet 5 kg → 4,97 kg, Annuler rend, 2e fût sans question pour la soude, trace « −30 g · Fût F-002 lavé ↺ ». Aucune erreur de page. Build vert.
- Non fait : hébergement (la branche n'a pas 103 à 388 commits des autres lignes ; héberger d'ici les effacerait en ligne). Critique Opus non lancée.

## Ouvert
- « Pas maintenant » ramène la question au geste suivant, article par article ; plusieurs nettoyants sans dose font plusieurs questions, une à la fois.
- Changer une dose déjà retenue : pas encore d'écran (la table est en `config/consommation`).
- Conditionnement : les emballages se comptent au litre, sans distinguer fût et bouteille.

- Le bandeau de pe1 et la trace de pe3 se dessinent depuis sa page choisie (https://claude.ai/artifact/Phf2ArFjBguzQNsAZGkqkf). Aucune forme neuve.
- L9 parle d'une table « pré-remplie » et pe4 dit « jamais inventée ». Je lis : articles pré-remplis, doses demandées. Lecture étroite et réversible (L01).
