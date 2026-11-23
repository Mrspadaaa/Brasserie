# Évaluation réelle de la vision Flash

## Résultats du 9 septembre 2026

Deux essais réels autorisés ont utilisé **5 appels Flash au total**, 11 547 jetons déclarés, pour une estimation cumulée de **0,045142 CHF**. Aucun appel Pro, recherche web ou fichier métier créé. Toutes les réservations mensuelles de ces essais ont été régularisées ; le budget configuré reste 20 CHF.

| Document | Résultat constaté | Appels | Délai du pipeline | Coût estimé |
| --- | --- | ---: | ---: | ---: |
| PDF synthétique | Tous les montants, données source et natures corrects ; faux avertissement de sous-catégorie détecté | 3 | 5,972 s | 0,026858 CHF |
| PNG synthétique, après correction | Tous les contrôles passent, deux lectures concordantes | 2 | 4,535 s | 0,018284 CHF |

Le premier rapport reste volontairement marqué `failed` : son assertion exigeait une vérification sans divergence, alors que les lecteurs proposaient trois sous-catégories éditoriales différentes. Le rapprochement a ensuite été corrigé : une sous-catégorie libre sans accord reste vide, sans déclencher une troisième lecture. Les montants, la catégorie principale et la nature des articles restent contrôlés. Ce changement est couvert par les tests locaux et l'essai PNG suivant ; le PDF n'a pas été relancé pour économiser les appels. Les deux essais ont aussi vérifié un retour du cache identique sans nouvelle génération.

Validation locale finale : **3 150 tests réussis dans 200 fichiers**, compilation frontend et Functions réussie. L'interface a été contrôlée dans le navigateur à 390 × 844 pixels : états vérifié/corrigé/incertain, détails et confirmation, sans débordement horizontal ni erreur console. L'ancien script `eval-expense-scan.mjs` refuse désormais les versions incompatibles avant tout accès aux identifiants, écriture ou provision ; ses rapports historiques restent intacts.

`scripts/eval-expense-vision.mjs` est une évaluation volontaire séparée de Vitest et des tests ordinaires. Elle utilise le pipeline compilé `scanInvoiceSafely`, ses registres Firestore réels et Gemini réel, avec **un document synthétique déterministe par exécution** : un PDF par défaut, ou une image PNG avec `--image`. Chaque exécution autorise au maximum **trois appels à Gemini 3.8 Flash**, et **2 048 jetons de sortie par appel**. Exécuter successivement le PDF puis le PNG représente donc six appels maximum au total. Aucun autre modèle, aucune recherche web, aucun repli et aucune relance ne sont autorisés. La troisième lecture éventuelle appartient au pipeline applicatif ; le script ne corrige pas le résultat lui-même.

Le document contient une hotte neuve à 500 CHF, une réparation de pompe à 50 CHF, la livraison à 12 CHF et une remise de 12 CHF. Les totaux imprimés sont 508,79 CHF HT, 41,21 CHF de TVA à 8,1 % et 550 CHF TTC. La réparation n'indique aucune quantité, unité ou prix unitaire. Le test vérifie leur absence, les valeurs exactes, les quatre natures d'achat et la concordance finale. Les deux premières lectures doivent se chevaucher réellement. Chaque lecture reçoit le même original, sans les valeurs proposées par les autres lecteurs.

## Commandes

Compiler d'abord les Functions avec leur commande habituelle. L'évaluation refuse les modules compilés périmés. Fournir seulement dans l'environnement du processus :

- `GEMINI_API_KEY` : clé Gemini existante du projet ;
- `EVAL_GOOGLE_ACCESS_TOKEN` : jeton OAuth temporaire autorisé à accéder au Firestore du projet ;
- `EVAL_FIREBASE_PROJECT_ID` : projet par défaut de `.firebaserc` ;
- `AUTHORIZED_ACCOUNTS` ou `VITE_AUTHORIZED_ACCOUNTS` : configuration existante des comptes autorisés.

```sh
node scripts/eval-expense-vision.mjs --describe
node scripts/eval-expense-vision.mjs --preflight
node scripts/eval-expense-vision.mjs --confirm-paid-ai
```

Pour vérifier séparément la lecture d'une image :

```sh
node scripts/eval-expense-vision.mjs --image --describe
node scripts/eval-expense-vision.mjs --image --preflight
node scripts/eval-expense-vision.mjs --image --confirm-paid-ai
```

Le PNG `tests/fixtures/expense-vision.png` a été créé de zéro avec System.Drawing sous PowerShell, puis inspecté visuellement. Il reproduit les mêmes informations en texte noir sur fond blanc, sans calque de texte PDF : 1 400 × 1 300 pixels, 55 350 octets. Le script vérifie son empreinte SHA-256 fixe `cf4a07f22830b721c35478a76b9ba3fe4900df6cc6ef2db2d019eba7bcaacad2` avant toute génération. Aucun document privé n'a servi à le créer. Son identité synthétique et son cache diffèrent de ceux du PDF.

`--describe` est entièrement local. `--preflight` lit seulement les contrôles, la consommation partagée et le cache synthétique, sans génération ni écriture Firestore. L'appel payant exige le flag explicite et, en CI, `ALLOW_PAID_AI_TESTS_IN_CI=1`. Les lanceurs locaux existants montrent comment obtenir les secrets dans la mémoire du processus à partir de la session Firebase CLI ; ils ne doivent pas être exécutés tels quels, car ils désignent une autre évaluation. Adapter un **nouveau** lanceur pour importer ce script sans modifier les anciens.

## Budget, cache et données

Les plafonds et la pause restent inchangés. Avant chaque transmission au fournisseur, le script vérifie la réservation du justificatif et une réservation mensuelle distincte. La provision multimédia conservatrice de l'application reste intégralement active ; deux lecteurs parallèles peuvent demander environ 4 CHF de budget disponible à réserver, bien que le coût observé d'un document court soit bien inférieur. Le rapport distingue les montants réservés, les jetons réellement déclarés et l'estimation de coût calculée selon la politique de l'application. Il ne constitue pas une facture Google. Une consommation inconnue reste inconnue et n'est jamais remplacée par zéro.

Seuls le registre du document synthétique et les registres quotidiens et mensuels de consommation peuvent être écrits. Un garde indépendant interdit les écritures directes ou transactionnelles dans les autres collections. Aucun fichier comptable, stock, conversation, facture réelle ni fichier Drive n'est créé. Les contrôles de budget sont en lecture seule.

Le document, son identité synthétique et son empreinte sont fixes. Un second passage vérifie le cache avec **zéro génération**. Une tentative précédente inachevée ne reçoit jamais un nouvel identifiant automatiquement. Un verrou refuse deux exécutions simultanées. Les rapports sont écrits en série autour des requêtes pour conserver une trace exploitable en cas d'interruption. La consommation partagée peut inclure d'autres usages de l'application ; les métadonnées de chaque requête donnent la consommation propre au test.

## Rapport et limites de vérification

Le rapport PDF est `docs/expense-vision-evaluation.json`, et son préflight utilise `docs/expense-vision-preflight.json`. Le cas PNG écrit séparément `docs/expense-vision-image-evaluation.json` et `docs/expense-vision-image-preflight.json`. Il ne remplace aucun rapport PDF. Les anciens rapports de scan restent intacts. Un statut `passed-from-existing-cache` vérifie un résultat conservé et ne mesure pas une nouvelle réponse Gemini. Un échec n'entraîne aucune nouvelle génération hors des trois appels prévus pour le cas choisi.

Ce contrôle couvre le pipeline local compilé avec Firestore et Gemini réels. Il ne vérifie pas le transport HTTPS publié, l'authentification cryptographique du navigateur, le chargement depuis un téléphone, les photos floues ou les documents de plusieurs pages. Le PDF et l'image sont volontairement synthétiques et lisibles. Ils ne mesurent pas la précision sur des justificatifs réels.
