# Déploiement prêt (08.11) — commit `65d3c645`

Ce qui part : l'app (hosting) et les 40 fonctions qui tournent déjà en ligne (liste lue en lecture seule le 08.11), à leur version de `65d3c645`.
Firebase saute celles qui n'ont pas changé. Ne part pas : les 9 fonctions du conseil houblon V1, jamais déployées (`dispatchBrewerHopAdviceV1` et
`notifyBrewerHopAdviceAnswerV1` exclues par consigne ; `askBrewerHopAdviceV1`, `getBrewerHopAdviceActivityV1`, `getBrewerHopAdviceConversationV1`,
`markBrewerHopAdviceReadV1`, `processBrewerHopAdviceV1`, `resetBrewerHopAdviceConversationV1`, `retryBrewerHopAdviceQuestionV1` neuves, hors périmètre) ;
ni Firestore (règles, index), ni la découpe D381 F (non committée, dans `%TEMP%\deploy-hosting-qr` seulement).

Contenu : D378, D379, corrections du test en ligne (commits `19a0d538` à `65d3c645`), en-tête « · 24 L », pastille « Stock » alignée, « Fixer le seuil minimum ».

Préparé dans `%TEMP%\deploy-2bfe5dc3` (nom historique ; worktree détaché sur `65d3c645`, modules reliés à `deploy-hosting-qr`, `.env` public copié, `seedData.ts` = exemple) :
`npm run build` vert (tsc, vite, contrôle du rapport privé), `npm --prefix functions run build` vert, aucune trace de `dev-local` dans `dist`,
CSP : `'wasm-unsafe-eval'` seul, aucun `'unsafe-eval'`. Manifeste du dépôt inchangé (`21dd75b3`).

## La commande (une seule, PowerShell)

```powershell
Set-Location "$env:TEMP\deploy-2bfe5dc3"; firebase deploy --project brasserie-l-affinee --non-interactive --only "hosting,functions:aiTask,functions:applyBrewerProposal,functions:applyYeastDbCorrection,functions:askBrewer,functions:cleanupBreweryTransfers,functions:cleanupFinancialSync,functions:deliverBrewAlarm,functions:dispatchBrewerQuestion,functions:driveAuthorization,functions:exportBreweryData,functions:getBrewAlertConfig,functions:getBrewSession,functions:getBrewerActivity,functions:getBrewerAiBudget,functions:getBrewerConversation,functions:getFermentationResearch,functions:hopReclasserIA,functions:markBrewerRead,functions:migrateFinanceDocuments,functions:notifyBrewerAnswer,functions:processBrewerQuestion,functions:proposeYeastDbCorrection,functions:readBrewingCatalogue,functions:readBrewingScenario,functions:recordDataChange,functions:recordFinancialPaymentChange,functions:recordFinancialTransactionChange,functions:registerBrewDevice,functions:registerBrewerNotifications,functions:rescheduleBrewAlarms,functions:resetBrewerConversation,functions:restoreBreweryData,functions:retryBrewerQuestion,functions:saveBrewSession,functions:setBrewerAiBudget,functions:syncBrewAlarms,functions:syncFinancialLedger,functions:transferBreweryData,functions:writeBrewingCatalogue,functions:writeBrewingScenario"
```

## Après

1. Lire la version servie (`index.html` en ligne = `dist/index.html`) et les journaux des fonctions.
2. Relecture Gemini des 13 vraies pièces par l'app déployée (facturée, journalisée) ; gestes d'écriture sur « ZZ TEST — … » ; corriger, redéployer.
3. 26 écritures B-001 à B-026 : copie de secours lisible d'abord, retrait par la voie de l'app, facture 372765 intacte, journal et totaux relus.

## Fait (08.11)

- Hébergement : `65d3c645`, puis `92de7371` (total des pièces lues en morceaux), puis `1927152d` (avis « Nouvelle version · Recharger »), servi = `dist/index.html`.
- Fonctions : les 40 à `65d3c645` (40 « Successful update »), puis `aiTask` à `92de7371`. Déployées depuis le dépôt principal : `%TEMP%deploy-2bfe5dc3` n'a pas `functions/.env` (comptes autorisés).
