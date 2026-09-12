# Évaluation réelle bornée du scan

Ce script est séparé de Vitest et des commandes de test usuelles. Il ne génère aucun conseil financier. Il traite **un PDF synthétique**, avec au maximum **deux requêtes Gemini et 2 048 jetons de sortie par requête**, puis demande à nouveau le même document pour vérifier le cache sans génération supplémentaire. Il n’a ni repli de modèle ni relance automatique.

Le chemin exécuté est le véritable handler local `aiTask.run`, puis `scanInvoiceSafely`, `runBudgetedInvoiceScan` et Gemini. Les contrôles de pause et de consommation viennent du projet Firebase de l’application ; chaque appel doit avoir sa réservation durable avant de partir. La limite de sortie du handler, 4 500 jetons, est abaissée à 2 048 par le garde de transport, après sa réservation conservative. Le test ne prétend pas vérifier le transport HTTPS déployé ou la vérification cryptographique des jetons Firebase.

Le PDF décrit un fermenteur neuf à 500 CHF, la réparation d’une pompe à 50 CHF, la livraison à 12 CHF et une remise de 12 CHF. Le total imprimé est de 550 CHF TTC. Les contrôles portent sur les montants source, la TVA, les catégories, la distinction matériel/réparation, l’absence de quantité inventée et la relecture indépendante. Les deux lecteurs reçoivent l’original ; le second ne reçoit pas les montants ou catégories proposés par le premier. Un désaccord ou une relecture incomplète fait échouer l’évaluation et reste visible dans le rapport.

Le document PDF et l’identité synthétique sont déterministes. Un autre lancement retrouve donc le même cache, y compris après redémarrage du processus. Une tentative précédente interrompue ou refusée ne crée pas automatiquement un nouvel identifiant. Un verrou local refuse aussi les lancements concurrents. Après interruption forcée, conserver le rapport et vérifier la tentative dans le registre avant toute suppression manuelle du verrou.

## Exécution volontaire

Compiler d’abord les Functions avec leur commande de compilation habituelle. Le script refuse les fichiers compilés plus anciens que leurs sources. Fournir uniquement dans l’environnement du processus enfant :

- `GEMINI_API_KEY` : clé Gemini déjà autorisée pour ce projet ;
- `EVAL_GOOGLE_ACCESS_TOKEN` : jeton OAuth temporaire ayant l’accès Firestore du projet ;
- `EVAL_FIREBASE_PROJECT_ID` : identifiant correspondant au projet de `.firebaserc` ;
- `AUTHORIZED_ACCOUNTS` ou `VITE_AUTHORIZED_ACCOUNTS` : liste configurée des comptes autorisés ;
- facultativement `EVAL_CALLER_EMAIL` : compte de cette liste à utiliser dans le contexte local du handler. Sinon le premier compte est utilisé.

Le script ne cherche aucun autre identifiant, ne lit aucun fichier de secrets et n’écrit aucune clé. Le SDK Firestore reçoit un client OAuth déjà muni du jeton en mémoire, construit avec la version de bibliothèque attendue par son transport GAX. Il vérifie que l’en-tête d’authentification porte ce jeton, en rapportant seulement un booléen et le nombre de requêtes authentifiées. Aucun compte ou jeton n’est inclus dans le rapport.

```sh
node scripts/eval-expense-scan.mjs --describe
node scripts/eval-expense-scan.mjs --preflight
node scripts/eval-expense-scan.mjs --confirm-paid-ai
```

`--describe` est entièrement local. `--preflight` lit seulement les contrôles et le cache synthétique ; il n’effectue aucun appel Gemini. Le dernier appel exige l’accord de coût explicite et, en CI, le second accord prévu par `paid-ai-test-guard.mjs`.

## Rapport et portée

Le [rapport JSON](expense-scan-evaluation.json) contient le modèle demandé, les limites demandées et appliquées, les statuts HTTP, les jetons déclarés par le fournisseur, les assertions et les montants extraits du document synthétique. Il est écrit avant chaque requête afin qu’une interruption laisse la trace d’une consommation possible. Une absence de métadonnées de consommation reste signalée comme inconnue.

Seuls le registre `invoiceScans` du document synthétique et la consommation quotidienne partagée sont écrits. La pause et les plafonds restent inchangés. Aucune transaction, aucun stock, aucune conversation, aucun job compagnon et aucun justificatif réel ne sont créés ou lus. Les variations du compteur quotidien peuvent inclure une utilisation simultanée de l’application ; les réservations du document et les métadonnées fournisseur donnent la consommation propre à cet essai.

Un résultat `passed-from-existing-cache` ne constitue pas une nouvelle mesure du fournisseur : il vérifie le résultat déjà conservé. Un échec ne déclenche aucune correction ni génération supplémentaire. Toute nouvelle version du document ou tout élargissement à un conseil requiert une décision explicite sur le budget restant.

## Essai réel du 9 septembre 2026 et correction locale

L’essai a effectué exactement **deux appels à `gemini-3.5-flash-lite`**, soit **1 802 jetons déclarés** : 1 378 pour la transcription et 424 pour la relecture. Le compteur partagé indique également deux appels et 1 802 jetons. Les deux requêtes ont été réservées avant génération ; le second passage du même document a utilisé le cache sans appel supplémentaire.

Quatorze contrôles sur quinze ont réussi : montants, TVA, date/devise, séparation matériel/réparation, absence de quantité inventée, livraison/remise, indépendance de la relecture, budget et cache. Le statut global reste `failed` dans le rapport original. Les deux lectures s’accordaient sur les champs, mais une note affirmative (« Fermenteur inox 30 litres - bien durable neuf ») avait été traitée comme un désaccord.

Ce faux positif a été corrigé hors ligne : la seconde lecture doit maintenant fournir un booléen `uncertain` explicite ; seules les ambiguïtés déclarées et les différences de champs produisent des alertes. Une ligne incomplète ou l’absence de cet indicateur reste signalée. Les alias de pièce sont comparés sans changer les valeurs source. Les tests d’intégration parcourent le handler, le budget en mémoire et le comparateur avec un fournisseur simulé.

**Aucune nouvelle génération réelle n’a vérifié cette correction.** Le rapport original, la version du scan et le résultat déjà en cache sont conservés tels quels ; le faux positif historique n’est pas requalifié en réussite.

## Second essai réel après publication — 9 septembre 2026

La correction a ensuite été vérifiée avec une nouvelle facture synthétique déterministe, `--fixture-v4` : hotte inox, réparation, livraison et remise. Le [rapport v4](expense-scan-evaluation-v4.json) est **passed**, avec **15 contrôles sur 15**, **deux générations** et **1 945 jetons déclarés**. La relecture indépendante est confirmée ; un second passage utilise le cache sans génération. Le premier rapport et son cache restent conservés.

Pour reproduire ce contrôle avec le même document et les mêmes limites, ajouter `--fixture-v4` aux commandes de préflight et d’évaluation. Une fois ce résultat en cache, le relancer ne mesure plus une nouvelle réponse du fournisseur. Le chemin testé reste le handler compilé avec Firestore et Gemini réels ; il ne remplace pas un parcours de scan dans un navigateur authentifié sur le site publié. Les endpoints HTTPS publiés ont été contrôlés séparément pour leur refus des requêtes non authentifiées, sans génération.
