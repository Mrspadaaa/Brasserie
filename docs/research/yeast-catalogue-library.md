# Bibliothèque commune du catalogue de levures

Livraison du 12 septembre 2026, feuille `yeast-catalogue-breadth/leaf-1.2`.

La bibliothèque expose les **1 733 références** du catalogue collecté sans les importer dans les données personnelles. Elle conserve **9 011 faits** et **3 448 reçus de collecte**, avec les identités, formes, statuts, valeurs inconnues, conditions, liens et empreintes d’origine. Elle ne transforme pas un produit du catalogue en levure adaptée à tous les styles : ce choix relève de l’analyse des usages documentés.

La source de cette livraison est [`src/data/yeastCatalogueBootstrap.json`](../../src/data/yeastCatalogueBootstrap.json), empreinte SHA-256 des octets UTF-8 : `0376f01676323043bc3deeb9eca29935fc5130ee5ed2b93ba27cc87f5ee1623b`. Ce fichier reste la source éditable et la source des scripts de collecte/import existants. Le parent a ajouté quatre faits NovaLager issus de la fiche technique fabricant et un reçu PDF ; les chiffres et le pack ci-dessous ont été remesurés le 13 septembre après intégration.

## Interface et données conservées

[`yeastCatalogueLibrary()`](../../src/domain/yeastCatalogueLibrary.ts) renvoie `readonly HopYeast[]`. L’appel est synchrone, commun au navigateur et au serveur, sans dépendance nouvelle, accès réseau, Node, DOM, Firebase, IndexedDB ou écriture de stockage. Il reconstruit le catalogue à la première lecture, valide chaque fiche avec `assertHopKnowledge`, gèle tous les objets et tableaux reconstruits, puis conserve le résultat en mémoire. Les lectures suivantes renvoient exactement le même tableau.

Les objets identiques, notamment les sources, peuvent être partagés entre plusieurs faits ou fiches. Leur gel empêche qu’une modification accidentelle se propage. Une édition personnelle doit commencer par `structuredClone(reference)` ; une simple copie superficielle conserve les sources et le catalogue imbriqué gelés.

L’égalité stricte avec la source est vérifiée pour **chaque référence et chaque champ**, dans le même ordre, et confirmée par l’égalité de la sérialisation JSON complète. Cela couvre notamment :

- les ID et noms existants, sans rapprochement entre laboratoires ;
- les formes présentes ou absentes, les statuts `listed`, `discontinued` ou `unknown`, et les traits inconnus ;
- les observations textuelles, plages, unités, qualificatifs et contextes, sans fusion ni traduction ;
- les sources de fiche et de chaque fait, les localisateurs, documents et reçus ;
- les dates, valeurs `null`, empreintes de contenu et empreintes des téléchargements.

L’empreinte `sourceSha256` du pack atteste quel fichier a servi à la génération. Elle **ne remplace pas** `catalogue.contentSha256` ni `retrievals[].sha256` : ces champs sont préservés sans recalcul. Le contrôle de fraîcheur se fait pendant les tests et la génération, sans ajouter une fonction de hachage au navigateur. La validation runtime du schéma ne constitue pas une authentification cryptographique des sources.

## Format réversible

[`scripts/build-yeast-library.mjs`](../../scripts/build-yeast-library.mjs) génère [`src/data/yeastCatalogueLibrary.json`](../../src/data/yeastCatalogueLibrary.json). Il ne sélectionne aucun champ métier. Il parcourt les valeurs JSON, reconnaît les valeurs identiques et les listes ordonnées de noms de propriétés, puis conserve uniquement les valeurs réutilisées dans un dictionnaire. Les valeurs uniques restent à leur place, ce qui réduit aussi le coût des indices après gzip.

Le format version 1 contient l’empreinte source, le nombre de fiches, les structures d’objet (`shapes`), les valeurs réutilisées (`nodes`) et la valeur racine (`root`). Il utilise les conventions suivantes :

| Valeur encodée | Reconstruction |
| --- | --- |
| Chaîne, booléen ou `null` | Valeur littérale inchangée |
| Nombre entier isolé | Référence à une entrée déjà reconstruite du dictionnaire |
| `[0, ...valeurs]` | Tableau |
| `[1, nombre]` | Nombre littéral |
| `[2]` | Zéro négatif, distinct de zéro avec `Object.is` |
| `[idStructure + 3, ...valeurs]` | Objet suivant l’ordre des propriétés de cette structure |

Les enfants du dictionnaire précèdent leurs parents. Les références en avant, cycles, structures incohérentes, versions inconnues, comptes de fiches divergents et identités dupliquées sont refusés. Une fiche décodée invalide fait échouer la lecture ; elle n’est pas silencieusement retirée. Le cache n’est assigné qu’après une validation complète.

`Object.fromEntries` reconstitue les propriétés propres des objets. Les chaînes ne subissent aucune normalisation Unicode, les dates ne sont pas converties en objets `Date`, les qualificatifs ne deviennent pas des valeurs centrales et un champ absent ne devient pas `null`.

## Coûts mesurés

Mesures du fichier source et du pack, effectuées avec `node scripts/build-yeast-library.mjs --check`. Les tailles sont des octets UTF-8 ; gzip utilise les réglages par défaut de Node.

| Représentation | Taille JSON | Taille gzip |
| --- | ---: | ---: |
| Source lisible conservée dans le dépôt | 8 515 827 | — |
| Source minifiée de référence | 5 975 316 | 442 224 |
| Pack partagé généré | **1 387 956** | **394 880** |

Le pack réduit le JSON de **76,8 %** par rapport à la source minifiée et le gzip de **10,7 %**. Il contient **7 873 entrées de dictionnaire** et **20 structures d’objet**. Le format testé conserve directement les valeurs uniques : la première variante, qui plaçait chaque valeur dans un dictionnaire, réduisait le JSON mais augmentait le gzip et n’a pas été retenue.

La sonde navigateur autonome, construite avec esbuild en mode navigateur, ES2020, IIFE et minification, mesure **1 433 320 octets**, soit **404 817 octets en gzip**. Cette sonde comprend le pack, le décodeur et les validateurs nécessaires. Ce n’est ni la taille totale de l’application Vite ni son augmentation exacte, car l’application utilise déjà certains validateurs.

Le test de mesure a exécuté la sonde dans **20 contextes VM neufs**, sous **Node v24.19.0** sur ce poste Windows. La reconstruction, la validation et le gel lors du premier appel prennent une médiane de **47,55 ms**, entre **44,79 et 49,77 ms**. Une boucle de 10 000 lectures du cache prend environ **0,70 ms** à la médiane ; ce résultat amorti sert seulement à distinguer le premier calcul du retour du cache. Il ne fixe aucun seuil de performance pour l’interface.

Le catalogue reconstruit contient **23 999 objets/tableaux distincts**, contre **42 363** dans la source JSON parsée séparément. Cette comparaison montre le partage structurel, pas la consommation totale de mémoire : le module conserve aussi la représentation encodée et le moteur JavaScript a ses propres coûts. Aucun chiffre de heap ou de RAM mobile n’est revendiqué.

La mesure exclut le réseau, l’analyse/évaluation initiale du bundle, le filtrage des styles, la recherche, le rendu React et les autres étapes de recette. Elle n’est pas un test sur téléphone. Seule la **reconstruction** est différée jusqu’au premier appel ; l’import statique du JSON appartient au chargement du module. Une stratégie de chargement asynchrone changerait le contrat d’intégration et n’est pas introduite ici.

## Intégration UI, IA et serveur

La fusion dans `yeastReferences()` est à la charge de la feuille parente. L’ordre attendu est le catalogue complet, les références métier enrichies de même ID, puis les documents personnels. Une version personnelle conserve la priorité, y compris si elle est invalide ou doit masquer la version par défaut. Il faut résoudre cette priorité **avant** d’écarter les fiches invalides ; sinon une valeur par défaut pourrait réapparaître malgré la correction personnelle. L’absence d’un catalogue personnel peut continuer à suivre la règle d’enrichissement conservateur existante.

La bibliothèque est déjà validée et mise en cache. La fusion peut réutiliser ce résultat ; les contrôles des documents personnels et enrichissements restent nécessaires. Un calcul dérivé ne doit pas trier ou modifier les tableaux imbriqués partagés. Les caches des sélections et de l’IA doivent également dépendre de l’état personnel pertinent pour éviter de conserver une ancienne correction.

Le compagnon et les outils IA doivent utiliser la même bibliothèque pour résoudre les identités et extraire les faits utiles. Il ne faut envoyer ni le pack encodé ni les 1 733 fiches dans chaque prompt : une recherche locale, des résultats limités et les sources des candidats retenus évitent d’alourdir le contexte. Les champs inconnus et les conditions restent nécessaires dans l’extrait envoyé. Le pack améliore le transport de code et les répétitions de données ; il ne compresse pas un prompt pour le modèle.

Les bundles serveur de [`scripts/build-brewer-tools.mjs`](../../scripts/build-brewer-tools.mjs) utilisent les modules métier partagés. La bibliothèque n’introduit aucun accès navigateur dans ce chemin. Le cache vaut pour chaque instance du module dans le processus courant. Deux bundles serveur indépendants peuvent chacun embarquer leur exemplaire : le partage entre fichiers de déploiement n’est pas garanti par ce module. Une nouvelle version du catalogue suit une reconstruction et un déploiement ordinaires, sans migration automatique des documents personnels ni réécriture des recettes/brassins figés.

La recherche d’imports dans `src/` et `functions/` ne révèle pas d’import runtime du gros fichier `yeastCatalogueBootstrap.json` au moment de cette livraison. Il reste utilisé par les scripts de collecte, d’enrichissement, de contrôle et d’import. La bibliothèque n’ajoute donc pas, dans ces modules runtime, une seconde copie chargée de ce fichier brut. Cette propriété doit être conservée lors de l’intégration.

## Régénération et preuves

Après toute modification du catalogue source, y compris après les scripts de collecte ou d’enrichissement :

```sh
node scripts/build-yeast-library.mjs
node scripts/build-yeast-library.mjs --check
npx vitest run tests/unit/yeastCatalogueLibrary.test.ts
```

Le générateur écrit seulement le pack. Son import depuis les tests ne lance aucune commande et n’écrit aucun fichier. `--check` compare les octets attendus au fichier généré et échoue si celui-ci est périmé. Les tests reproduisent cette comparaison : la fraîcheur ne repose pas sur une simple comparaison du nombre de fiches. Le source et son pack généré doivent être livrés ensemble lorsqu’un catalogue change.

La mesure facultative est reproductible sans fichiers temporaires :

```sh
npx vitest run tests/unit/yeastCatalogueLibrary.test.ts --mode yeast-library-measure
```

Les **8 tests** de [`yeastCatalogueLibrary.test.ts`](../../tests/unit/yeastCatalogueLibrary.test.ts) ont passé, dont l’égalité exhaustive, les contrôles de fraîcheur/taille, l’immuabilité et la copie personnelle, les erreurs de format, la validation métier après décodage, la conservation du zéro signé/absences/null et l’exécution d’un bundle navigateur dépourvu de stockage. Les contrôles négatifs introduisent un doublon, une correction source, une référence cyclique, un compte faux et un statut β-lyase inventé. La compilation `npx tsc --noEmit --pretty false` a également passé.

Quatre passes ont été effectuées : livraison complète du pack et du décodeur ; revue des identités et de la provenance ; recherche de défauts de gel, format, fraîcheur et portabilité ; simplification et mesures du format final. La preuve navigateur est une exécution JavaScript isolée, pas une revue visuelle. Cette feuille ne modifie aucune interface : la vérification du parcours réel et de la densité mobile appartient à l’intégration parente.
