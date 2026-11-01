# Revue du plan d3-drive-fond, regard Conception (relecteur neuf, 01.11)

Lu : VOIE.md, PLAN.md (§ 0 à § 7), COMMUN.md, SPEC-BRASSEUR.md (« Nouvelle dépense, passe 3 », l. 875), puis le code :
`driveFileStore.ts`, `financeDocuments.ts`, `purchaseEntry.ts`, `ExpenseSheet.tsx`, `firestore.rules`, `firestoreRepo.ts`, `firebaseAuth.ts`,
`App.tsx`, `FinancesTab.tsx`, `ModalShell.tsx`, le banc `scripts/check-invoice-journey-emulator.mjs` et `grep` de `tests/` et `scripts/`.

**Verdict : le parcours voulu est le bon et colle à ses mots** (invisible à la fin en arrière-plan ; si échec, grosse notification qui ramène à la
facture pour renvoyer le justificatif ou réparer le lien Drive). La cause racine est bien visée (l'envoi retient l'écran, `ExpenseSheet.tsx:281`,
`purchaseEntry.ts:363`, et rien n'est gardé hors de la feuille). **Mais 2 bloquants et 6 majeurs** : un renvoi de fichier qui échouerait toujours,
une règle qui peut effacer le justificatif au démarrage, et des fausses alertes. À corriger dans PLAN.md avant le code.

Vérifié juste dans le plan (pas à refaire) : `proofDocumentId` n'est lu que comme « le document existe » (`DocumentProofLink.tsx:18`, `ledger.ts:145`,
`annual.ts:132`, `backupTransfer.ts:242`) donc ne le poser qu'à la réussite est le bon choix ; règles Firestore sans liste de champs de `finance`
(`firestore.rules:99-108`, `allow update` générique l. 179-189) ; `financeDocuments` en création seule (l. 238-241) ; `put` sans `merge` retire un champ
`undefined` (`firestoreRepo.ts:596-604`) ; aucun brouillon de dépense persisté (`ExpenseSheet.tsx:87`, `useState`) ; aucun `fake-indexeddb`
(`package.json`) ; `PersistenceStatus` est monté hors du commutateur de vues (`App.tsx:852`) ; le mécanisme `financeOpenRequest` ouvre bien la fiche
(`FinancesTab.tsx:124-134`).

## Bloquants

**B1. « Renvoyer » un autre fichier sous le même `documentId` échoue toujours (`drive/integrity`), donc le cas « fichier perdu » n'a pas d'issue.**
Preuve : PLAN.md:100 (« absent : sélecteur de fichier, puis nouveau job remplaçant l'ancien »), :115 (« nouvelle mise en file avec le même `documentId` »).
Or `uploadDriveOriginal` lie l'identifiant à l'empreinte : `driveFileStore.ts:309-311` (réservation `localStorage` d'un autre sha256 → `integrity`),
`:315-319` (fichier Drive trouvé par `documentKey`), `financeDocuments.ts:104` (`otherOriginal`). Une tentative qui a déjà réservé un identifiant
(écrit avant les octets, `:322`) rend impossible tout autre contenu sous `proof-<submissionId>`. Le job passerait en `failed` motif `file`,
la notification reviendrait, et seul « Abandonner » sortirait de la boucle. C'est exactement le cas que VOIE.md demande (« perte du fichier »)
et celui de la phrase du brasseur (« renvoie sur la facture pour upload le justificatif »).
Correction : un nouveau fichier prend un **nouveau** `documentId` (`proof-<submissionId>-<n>` ou `proof-<uuid>`, la regex l. 8 de `financeDocuments.ts` et
`prepare` `:271` l'acceptent), l'ancien identifiant reste orphelin sans conséquence (rien ne le référence). Seul le **même** fichier (même sha256)
réutilise l'identifiant. Ajouter le test : échec `quota` après réservation, puis renvoi d'un autre fichier = succès, un seul fichier lié.

**B2. « Dépense absente de la base » → abandon et fichier effacé : au démarrage, c'est le cache non chargé, donc perte irréversible du justificatif.**
Preuve : PLAN.md:74 (a), :113 et :131 (« 0 appel Drive, fichier effacé »). La lecture est `StorageService.getTransactions()`, un cache
synchrone rempli par les snapshots (`firestoreRepo.ts:369-371` `isReady()`, :192). Une transaction ne se supprime jamais
(`firestore.rules:173` : `allow delete` exclut `transactions`) : « absente » ne peut donc vouloir dire que « pas encore chargée » ou « création
refusée ». Le plan démarre la file « au montage (après connexion) » (:157) sans attendre `isReady()`. Mauvais cas : redémarrage, cache vide,
la file voit « absente », efface le fichier ; la dépense apparaît ensuite sans justificatif et sans copie.
Correction : (1) la file ne lit aucune dépense avant `StorageService.isReady()` ; (2) « absente » ne supprime **jamais** : le job reste, nouvel essai
au prochain réveil ; (3) seule une écriture **prouvée refusée** (`FirestoreRepo.documentWriteState('transactions', id).status==='rejected'`,
`purchaseEntry.ts:436`) met le job de côté, gardé 30 jours comme pour l'annulation (D237 n° 2), sans notification. Test : cache non prêt = 0 effacement.

## Majeurs

**M1. Le plan se contredit sur l'annulation, et l'état « annulée » n'existe pas dans la machine à états.** § 0 (PLAN.md:16), § 3 (:113, :114), § 4 (:131) et
§ 6.2 (:180) disent « fichier effacé » ; § 7.2 (:187) dit « gardé 30 jours, sans notification ». Le corps n'a pas été réécrit. L'état du job est
`queued|sending|failed` (:65, :13) : un job gardé mais non envoyé n'a pas d'état, et le magasin d'alertes compte « les jobs locaux `failed` » (:96) : il
alerterait pour une dépense annulée. Correction : ajouter l'état `voided` (aucun appel Drive, pas d'alerte, purge à 30 jours, rendu par « Abandonner »),
réécrire :16, :113-114, :131, :180, ajouter le test « annulée : 0 appel Drive, fichier encore là, 0 alerte ».

**M2. Hors ligne, « Confirmer » ne ferme pas l'écran : D235 n'est pas tenue dans le cas où le plan le promet.** PLAN.md:117 l'admet (« ce n'est pas
changé ici »). `save()` appelle `confirmPurchase` (`ExpenseSheet.tsx:285-287`) qui attend l'accusé serveur 15 s (`purchaseEntry.ts:431`), puis
affiche l'erreur « Confirmation en attente » et garde `pendingId` : l'écran reste, le pied dit « Vérifier la synchronisation ». Aujourd'hui le
justificatif hors ligne est refusé ; demain il est accepté, mais l'écran reste 15 s puis rouge. Les pastilles et le hors ligne sont des acquis.
Correction : décider dans le plan, pas en note. Proposition prudente : si la dépense est écrite en file locale (`documentWriteState` = `pending`) et que le
navigateur est hors ligne, fermer sans attendre l'accusé (l'écriture est durable dans le cache persistant, `firebase.ts:72`) ; le garde « Confirmer à
nouveau » ne sert plus. À défaut, l'écrire comme limite assumée dans « Décisions pour le pilote » avec le texte exact vu par le brasseur.

**M3. Le classement des échecs crée de fausses « grosses notifications ».** (a) `ensureDriveAccessToken` ne transforme en `null` que
`functions/failed-precondition` ; toute autre erreur de la fonction (`functions/unavailable`, `deadline-exceeded`, `internal`, démarrage à froid) est relancée
brute (`firebaseAuth.ts:117-121`), donc tombe dans « Autre : toute erreur inconnue → `failed` » (PLAN.md:87) et écrit un échec **dans Firestore, visible
sur tous les appareils**. (b) `FirebaseAuthService.getCurrentUser()` est `null` tant que Firebase n'a pas restauré la session : `session()` lève
`auth-required` (`driveFileStore.ts:75-84`), classé « `failed` tout de suite » (:82). (c) `navigator.onLine` ment (réseau captif, 4G faible) ; le plan fonde
« pas un essai » sur lui (:80). Correction : attendre l'utilisateur authentifié et `isReady()` avant de travailler ; classer les codes `functions/*`
transitoires comme passagers ; une erreur réellement inconnue = 2 essais avant `failed`, pas 0 ; ne compter un essai que si une requête a atteint un
serveur (réponse HTTP ou erreur Drive typée), pas selon `onLine`. Tests : `functions/unavailable` → pas d'alerte ; session non restaurée → pas d'alerte.

**M4. L'écriture du lien peut ressusciter une dépense refusée, et deux appareils peuvent se marcher dessus.**
(a) `updateTransaction` fait un `set` du document entier depuis le cache (`storage.ts:535-541`, `firestoreRepo.ts:574-606`). Si la création de la dépense a
été refusée côté serveur (marqueur `purchase-<hash>` pris par un autre appareil, `purchaseEntry.ts:337-339`) mais que le cache local la montre encore, ce `set`
la **recrée** sans stock ni paiement (la règle `create` ne demande qu'un solde nul, `firestore.rules:95-98,196`). Correction : avant d'écrire le lien, exiger
`documentWriteState('transactions', id).status !== 'rejected'` et, si l'écriture initiale n'est pas encore confirmée, attendre son accusé
(`waitForDocument`, `purchaseEntry.ts:431`) ; sinon job en attente.
(b) Un autre appareil voit la dépense `failed` ou `queued > 48 h` (PLAN.md:98, :115) et peut y joindre un fichier ; l'appareil d'origine reprend ensuite son
job : le plan ne dit pas ce qu'il fait si `proofDocumentId` est déjà posé. Correction : à l'étape (d) (:74), si la dépense relue porte déjà un
`proofDocumentId`, abandonner le job sans écraser le lien (le fichier déjà envoyé reste dans Drive, sans lien : noter l'orphelin) et le dire dans un test.
(c) Le même `set` complet rejette la réécriture si un paiement est arrivé entre-temps (`unchangedPaymentGuard`, `firestore.rules:91-94,104-105`) : c'est déjà vrai de
`attachProofToPurchase` (`purchaseEntry.ts:423`), mais ici l'écriture est différée de minutes ou d'heures. À l'étape (d), relire la dépense depuis le serveur
(`getDocFromServer`) ou traiter un `permission-denied` comme « relire et réessayer une fois », pas comme `failed unknown`.

**M5. Le chemin « renvoi depuis la fiche » n'existe pas dans le code que le plan réutilise.** PLAN.md:153 dit « `attachProofToPurchase` reste le chemin fichier perdu,
nouveau fichier ». Or cette fonction exige un `PurchaseDraft` complet (`purchaseEntry.ts:408-413`) et `purchaseProofAttachable` : même total, mêmes raisons de
doublon, `draft.proofDataUrl` (:401-403). La fiche n'a qu'un fichier choisi. Il faut une fonction neuve (`resendProof(transactionId, file)`) qui calcule
l'empreinte, le type et le nom lisible à partir de la dépense (`driveProofFileName`, :170) et refait les contrôles de `attach`
(≤ 4 Mo, JPG/PNG/WebP/PDF, `ExpenseSheet.tsx:249`) : `drive/invalid-file`, présenté comme « jamais atteint » (PLAN.md:46), le devient. Écrire la fonction, ses
garde-fous et un test (fichier de 5 Mo ou format refusé dans la fiche).

**M6. L'inventaire des tests et scripts touchés est incomplet (exigé par `sans-memoire.md` § 2, puces 4).** PLAN.md:159 cite 9 fichiers ; un `grep` de
`tests/` et `scripts/` sur `Terminé|Justificatif rangé|Envoi au Drive|saveFinanceDocumentConfirmed|proofDataUrl` en rend plus de 25. Absents du plan, avec la raison :
- `tests/integration/jus0Journey.test.tsx:19,157` (simule `financeDocuments`, attend « Terminé ») ;
- `tests/unit/depense/raccord/changer-fichier.test.tsx:64,71` (« Justificatif rangé » à l'écran) ;
- `tests/integration/expenseSheet.test.tsx:171`, `expenseSheetMouture.test.tsx`, `tests/unit/depense/ecran/ecran.test.tsx`, `tri.test.tsx`, `fiche/ecriture.test.ts:10`,
  `stock/ecran.test.ts:19`, `enregistrement/mouture-prix|paiement-prix|unites|doublon-commande`, `raccord/autre-original`, `unites-enregistrement` ;
- **le banc Chrome existant** `scripts/check-invoice-journey-emulator.mjs:595-607` (attend « Terminé ») et `:785-803` (« l'original est rangé dans Drive » **tout de suite** après
  « Confirmer ») : ces deux contrôles échoueront par conception.
Le plan doit dire, par fichier : reste vert (précisément parce que jsdom n'a pas d'`indexedDB` et prend le **repli synchrone**, à écrire noir sur blanc), réécrit, ou attend la
file. Les rejouer sur HEAD d'abord.

## Détails

**D1. « Les seuls Dexie du dépôt sont ceux des houblons » est inexact** (PLAN.md:12) : `brewingScenarioLocalRepository.ts:1,66`, `hopDecisionLocalRepository.ts:1,54` et un IndexedDB brut
`financialLedgerCache.ts:7-13`. Utile : le précédent d'adaptateur injectable (`brewingScenarioLocalRepository.ts:225`) et la gestion de `VersionError`
(`hopDecisionLocalRepository.ts:68-89`) sont à reprendre pour `proofQueueStore.ts`. Le plan a raison sur le fond (aucun brouillon de dépense n'est persisté, contrairement à
VOIE.md « le brouillon est un acquis (Dexie) ») : le dire dans RESULTAT comme correction de la consigne.

**D2. Mécanisme plus simple pour le « mode patient »** (PLAN.md:154, :74 c). Inutile de toucher `financeDocuments.ts` : l'envoi continue au-delà de 15 s
(`financeDocuments.ts:137-141`) et un second appel se raccroche à la même promesse (`:79-80`). La file peut boucler sur `drive/in-progress` (rappeler `saveFinanceDocumentConfirmed`) jusqu'au
résultat ; chaque requête Drive a déjà sa coupure de 45 s (`driveFileStore.ts:92`). Moins de code partagé modifié, `financeDocuments.ts` hors du périmètre à risque.

**D3. L'échelle d'essais est plus lourde que ce que l'app peut tenir.** 30 s / 2 min / 10 min / 1 h / 6 h persistés en `nextAt` (PLAN.md:81) supposent un onglet vivant ; sur téléphone
l'onglet est suspendu (le plan le dit, :109). Plus simple et aussi sûr : reprise **sur événements** (démarrage, `online`, `focus`, `visibilitychange`) avec un délai mini de 30 s entre deux
essais, et `failed` après N échecs passagers consécutifs sur des **démarrages ou réveils distincts**. À trancher par le pilote (c'est un seuil, pas une mesure, §7.3).

**D4. La promesse « gardé 30 jours » n'est pas tenue sur Safari non installé** (cap de 7 jours sur IndexedDB sans usage) et `navigator.storage.persist()` n'est appelé nulle part
(`grep` de `src/` : aucun). Appeler `persist()` à la première mise en file, et noter que le fichier peut disparaître : la dépense dit alors « joindre à nouveau » (déjà prévu : `expired`).

**D5. La notification « par-dessus la feuille » n'est pas garantie.** `ModalShell` est en `z-50` ou `z-[60]` (`ModalShell.tsx:153`) et piège la tabulation (`:104`) : un bandeau en `z-[60]` (`App.tsx:832`)
peut passer sous une feuille `abovePage`, et ses boutons sont hors de portée du clavier tant que la feuille est ouverte. Fixer un `z-[70]` et tester au clavier (Tab depuis la feuille), pas seulement à 390 tactile.

**D6. Les formes du plan ne s'accordent pas.** Le job porte `uid` en § 3 (:119) mais pas en § 2.1 (:65) ; `proofUpload.state` ne contient que `queued|failed` (:13) alors qu'on y écrit `reason:'expired'`
(:114) ; l'ensemble des `reason` (`auth, quota, forbidden, not-found, network, file, unknown, expired`) n'est défini qu'en prose. Écrire le type `ProofUpload` une fois, avec l'état `voided` (M1).

**D7. Bascule `failed` → `queued` après « Reconnecter ».** Le plan reprend la file (:101) mais ne dit pas qu'il remet `finance.proofUpload.state` à `queued` : la notification
resterait « à renvoyer » pendant le nouvel envoi et sur les autres appareils. Écrire la bascule (et son effacement si la dépense est annulée entre-temps, auquel cas l'écriture est refusée,
`firestore.rules:100` : tester avant d'écrire `failed`).

**D8. Le filtre « Sans justificatif » n'est pas à `TransactionJournal.tsx:48`** (c'est l'étiquette) mais à `:194` (la logique) ; le plan veut en outre distinguer « envoi en cours » : ajouter la ligne au
test et au compte du filtre. De même, `annual.ts:134,151` et `financeExport.ts` listent `proofFileName` sans `proofDocumentId` : sans conséquence comptable (`hasProof` faux), mais un nom de fichier
« prévu » apparaît dans l'export pour une pièce qui n'est pas encore dans Drive ; à dire dans « limites » (PLAN.md:161).

**D9. L'injection du `FileStore`** (PLAN.md:123) n'est pas décrite : comment `savePurchaseWithProofReceipt` reçoit l'adaptateur (setter de module, comme `brewingScenarioLocalRepository.ts:225` ?), et
quel adaptateur jsdom utilise par défaut (aucun → repli synchrone). Nécessaire pour `confirmer.test.ts` et `feuille.test.tsx`.

**D10. Cas Chrome à ajouter** (PLAN.md:137-143) : (7) renvoi d'un **autre** fichier après un échec (B1) ; (8) redémarrage avec cache non prêt, hors ligne (B2) ; (9) `functions/unavailable` du renouvellement
de jeton : pas d'alerte (M3) ; (10) un fichier refusé dans la fiche (> 4 Mo).

## Sur « un mécanisme plus simple »

Le cœur du plan (file IndexedDB + état durable `proofUpload` dans la dépense + notification globale lue dans Firestore) est le plus simple qui tienne la fermeture de l'app et la perte du fichier ;
je n'ai pas trouvé de chemin plus court. Les allègements possibles sont D2 (pas de mode patient) et D3 (retries sur événements). La fonction de migration serveur
(`functions/src/financeDocumentMigration.ts`) n'est pas un recours : c'est le client qui envoie à Drive, le serveur ne fait que vérifier et lier.

LEÇON PROPOSÉE : une règle « abandonner / effacer » sur une donnée irremplaçable (un fichier) ne se fonde jamais sur un cache non prêt : le plan doit nommer la condition de lecture (`isReady()`) avant de nommer l'effacement.
