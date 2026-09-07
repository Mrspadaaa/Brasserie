# Questions du compagnon en arrière-plan

`askBrewer` accuse réception après une transaction Firestore, sans attendre Gemini. L’identifiant d’opération rend un renvoi réseau idempotent. La question apparaît immédiatement dans le fil et la saisie reste libre.

`brewerJobs` sert de file durable et de boîte de réception privée. La création déclenche `dispatchBrewerQuestion`, qui enfile une Cloud Task nommée par le hash du travail. `processBrewerQuestion` traite chaque conversation dans son ordre d’envoi, avec un verrou de 310 secondes, un jeton d’exécution et la génération du chat. Une fermeture du navigateur n’a aucun effet sur ce traitement.

Une panne transitoire du fournisseur obtient une reprise automatique. Un conseil rejeté reste une erreur explicite, jamais un conseil affiché sans vérification. Les travaux bloqués depuis 30 minutes sont marqués en erreur à la consultation, y compris si leur envoi en file a échoué. Une relance manuelle crée une nouvelle opération, en conservant la question précédente. Les champs métier ne changent qu’après validation explicite via `applyBrewerProposal`.

La relecture peut demander une réparation avec accès aux mêmes calculs, recherches et outils de proposition. `propose_changes` remplace une version précédente seulement après validation de la nouvelle liste complète ; les anciennes preuves sont retirées et leurs identifiants ne sont jamais réutilisés. Le preview utilise les mêmes champs et recalculs que l’application. Un redimensionnement avec `calculate_recipe(volumeL)` recalcule aussi l’eau et retourne les ingrédients du scénario ; `recommendedWater` reste distinct de l’eau réellement saisie. Les doses physiques de sels et d’acide ne changent pas automatiquement.

Les motifs concrets de chaque relecture et les erreurs d’outils sont enregistrés dans `brewerJobs.diagnostics`, côté serveur uniquement, y compris lorsque la dernière relecture échoue. Ils excluent les raisonnements internes et les identifiants d’accès. Un reset invalide aussi ces écritures. Le budget d’analyse réserve du temps à la relecture et à la correction.

Les états publics décrivent les appels effectués : contexte, modèle, outils, recherche web, relecture, correction et enregistrement. Ils ne contiennent aucun raisonnement interne. `getBrewerActivity` retourne uniquement les 50 derniers travaux de l’utilisateur connecté ; `getBrewerConversation` fournit le conseil et les erreurs. Aucun accès Firestore direct du navigateur à ces collections n’est ouvert.

`notifyBrewerAnswer` envoie une notification Web Push après l’enregistrement d’une réponse ou d’un échec, aux appareils inscrits avec `registerBrewerNotifications`. La permission se demande depuis le bouton « Me notifier à la réponse ». Le worker `/brew-alerts-sw.js` distingue ces notifications discrètes des alarmes de brassage. Un clic retrouve le chat dans l’application, en préservant un formulaire déjà ouvert.

Le reset invalide les exécutions et supprime les anciens travaux et échanges. Les propositions appliquées, recettes et journaux d’audit restent conservés. Le contexte d’entrée des travaux réussis est retiré de la file : le snapshot immuable de `brewerContexts` reste la référence du conseil.

## Modes et orchestration

Le choix Rapide / Auto / Pro 3.1 est mémorisé sur l’appareil et enregistré avec chaque question. Rapide garde Flash pour le conseil, les calculs, la réparation et la relecture ; seule la recherche web utilise Pro avant de rendre les preuves à Flash. Auto laisse le modèle choisir Pro selon le besoin. Pro force ce modèle pour l’analyse et la relecture.

L’effort de Pro dépend de l’étape : medium pour la première décision, low pour les suivis d’outils et la relecture courante, high pour une réparation ou une situation sensible. Les paramètres suivent la [documentation Gemini](https://ai.google.dev/gemini-api/docs/generate-content/thinking). Le conseil doit préparer dès la première réponse les champs justifiés par une demande de nom ou d’adaptation, avec validation humaine ultérieure. Un simple report « veux-tu que je prépare les champs ? » est renvoyé au modèle dans la même question.

L’orchestration reste un générateur et une relecture indépendante, avec les calculs déterministes de l’application. Les appels d’outils indépendants peuvent être regroupés dans un tour ; les étapes dépendantes attendent leurs résultats, conformément au [protocole d’appels de fonctions Gemini](https://ai.google.dev/gemini-api/docs/generate-content/function-calling). Aucun outil ne crée de sous-agent, de nouvelle question, ni ne modifie les limites. Ajouter une équipe d’agents n’apporterait ici aucune réduction garantie de délai ou de coût.

## Plafonds et arrêt

`brewerBudget.ts` réserve une marge de tokens avant **chaque** appel payé, dans une transaction Firestore commune à toutes les conversations. Par défaut : 120 appels par jour, dont 40 Pro, et 1 500 000 tokens comptabilisés ; par question, 12 appels et 240 000 tokens, reprises automatiques comprises. Le jour suit Europe/Zurich. Le nombre d’appels et de recherches web reste plafonné même si le fournisseur ne renvoie pas ses métadonnées d’usage. Une panne de contrôle bloque les nouveaux appels.

Les métadonnées de consommation réconcilient la réservation après réception. Un timeout ou une interruption conserve sa marge, car l’appel peut rester facturé. Une erreur de réconciliation ne déclenche jamais une seconde génération payante. `brewerAiUsage/{jour}` conserve les compteurs partagés et `brewerJobs.budget` les réservations privées. Les compteurs ne sont pas remis à zéro par un reset de chat, un changement de mode ou une nouvelle tentative.

`getBrewerAiBudget` et `setBrewerAiBudget` sont réservés au brasseur connecté. Le menu replié « Limites IA » montre l’usage, règle les plafonds du jour et suspend/réactive le compagnon. Un abonnement serveur à `brewerAiControls/current` interrompt les requêtes en cours lors d’une suspension ; les appels suivants sont aussi bloqués par la transaction. Enregistrer des plafonds ne réactive jamais une suspension concurrente. Une limite atteinte reste une erreur explicite et ne déclenche pas de reprise automatique. Une relance manuelle est possible après réactivation, sans effacer le compteur du jour.

Ces contrôles concernent le compagnon et ne constituent pas un plafond monétaire de toute la facturation Google ni des autres assistants de l’application. Un appel transmis avant l’arrêt peut continuer d’être facturé par le fournisseur.

## Vérification

Avec Firestore Emulator sur `127.0.0.1:8080`, projet `demo-brewer-chat` :

```powershell
npm --prefix functions run build
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
node scripts/check-brewer-jobs.mjs
node scripts/check-brewer-proposals-persistence.mjs
node scripts/check-brewer-budget.mjs
```

Avec Vite sur le port 3007 :

```powershell
node scripts/check-brewer-jobs-mobile.mjs
node scripts/check-brewer-proposals-mobile.mjs
```

Les captures couvrent 320 et 390 px, la saisie pendant une réponse, l’accès hors du chat, l’erreur persistante et la récupération après rechargement. Les notifications et leurs liens sont vérifiés dans `tests/unit/brewerPush.test.ts`.

Déployer les index puis toutes les fonctions de ce flux : `askBrewer`, `getBrewerConversation`, `resetBrewerConversation`, `applyBrewerProposal`, `dispatchBrewerQuestion`, `processBrewerQuestion`, `getBrewerActivity`, `markBrewerRead`, `retryBrewerQuestion`, `registerBrewerNotifications`, `notifyBrewerAnswer`, et l’hébergement. Le compte de service de Cloud Tasks doit pouvoir appeler `processBrewerQuestion` ; valider une exécution réelle après le premier déploiement.

Pour les modes et budgets : déployer `askBrewer`, `retryBrewerQuestion`, `getBrewerConversation`, `processBrewerQuestion`, `getBrewerAiBudget` et `setBrewerAiBudget` avant l’hébergement. Les nouveaux documents de contrôle restent privés (refus Firestore par défaut).
