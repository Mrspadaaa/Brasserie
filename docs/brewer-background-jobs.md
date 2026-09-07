# Questions du compagnon en arrière-plan

`askBrewer` accuse réception après une transaction Firestore, sans attendre Gemini. L’identifiant d’opération rend un renvoi réseau idempotent. La question apparaît immédiatement dans le fil et la saisie reste libre.

`brewerJobs` sert de file durable et de boîte de réception privée. La création déclenche `dispatchBrewerQuestion`, qui enfile une Cloud Task nommée par le hash du travail. `processBrewerQuestion` traite chaque conversation dans son ordre d’envoi, avec un verrou de 310 secondes, un jeton d’exécution et la génération du chat. Une fermeture du navigateur n’a aucun effet sur ce traitement.

Une panne transitoire du fournisseur obtient une reprise automatique. Un conseil rejeté reste une erreur explicite, jamais un conseil affiché sans vérification. Les travaux bloqués depuis 30 minutes sont marqués en erreur à la consultation, y compris si leur envoi en file a échoué. Une relance manuelle crée une nouvelle opération, en conservant la question précédente. Les champs métier ne changent qu’après validation explicite via `applyBrewerProposal`.

La relecture peut demander une réparation avec accès aux mêmes calculs, recherches et outils de proposition. `propose_changes` remplace une version précédente seulement après validation de la nouvelle liste complète ; les anciennes preuves sont retirées et leurs identifiants ne sont jamais réutilisés. Le preview utilise les mêmes champs et recalculs que l’application. Un redimensionnement avec `calculate_recipe(volumeL)` recalcule aussi l’eau et retourne les ingrédients du scénario ; `recommendedWater` reste distinct de l’eau réellement saisie. Les doses physiques de sels et d’acide ne changent pas automatiquement.

Les motifs concrets de chaque relecture et les erreurs d’outils sont enregistrés dans `brewerJobs.diagnostics`, côté serveur uniquement, y compris lorsque la dernière relecture échoue. Ils excluent les raisonnements internes et les identifiants d’accès. Un reset invalide aussi ces écritures. Le budget d’analyse réserve du temps à la relecture et à la correction.

Les états publics décrivent les appels effectués : contexte, modèle, outils, recherche web, relecture, correction et enregistrement. Ils ne contiennent aucun raisonnement interne. `getBrewerActivity` retourne uniquement les 50 derniers travaux de l’utilisateur connecté ; `getBrewerConversation` fournit le conseil et les erreurs. Aucun accès Firestore direct du navigateur à ces collections n’est ouvert.

`notifyBrewerAnswer` envoie une notification Web Push après l’enregistrement d’une réponse ou d’un échec, aux appareils inscrits avec `registerBrewerNotifications`. La permission se demande depuis le bouton « Me notifier à la réponse ». Le worker `/brew-alerts-sw.js` distingue ces notifications discrètes des alarmes de brassage. Un clic retrouve le chat dans l’application, en préservant un formulaire déjà ouvert.

Le reset invalide les exécutions et supprime les anciens travaux et échanges. Les propositions appliquées, recettes et journaux d’audit restent conservés. Le contexte d’entrée des travaux réussis est retiré de la file : le snapshot immuable de `brewerContexts` reste la référence du conseil.

## Vérification

Avec Firestore Emulator sur `127.0.0.1:8080`, projet `demo-brewer-chat` :

```powershell
npm --prefix functions run build
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
node scripts/check-brewer-jobs.mjs
node scripts/check-brewer-proposals-persistence.mjs
```

Avec Vite sur le port 3007 :

```powershell
node scripts/check-brewer-jobs-mobile.mjs
node scripts/check-brewer-proposals-mobile.mjs
```

Les captures couvrent 320 et 390 px, la saisie pendant une réponse, l’accès hors du chat, l’erreur persistante et la récupération après rechargement. Les notifications et leurs liens sont vérifiés dans `tests/unit/brewerPush.test.ts`.

Déployer les index puis toutes les fonctions de ce flux : `askBrewer`, `getBrewerConversation`, `resetBrewerConversation`, `applyBrewerProposal`, `dispatchBrewerQuestion`, `processBrewerQuestion`, `getBrewerActivity`, `markBrewerRead`, `retryBrewerQuestion`, `registerBrewerNotifications`, `notifyBrewerAnswer`, et l’hébergement. Le compte de service de Cloud Tasks doit pouvoir appeler `processBrewerQuestion` ; valider une exécution réelle après le premier déploiement.
