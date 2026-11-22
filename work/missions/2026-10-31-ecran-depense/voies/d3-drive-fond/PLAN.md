# PLAN — d3-drive-fond : l'envoi au Drive en arrière-plan, et l'échec qui ramène à la facture (v2, après revue)

Auteur : Sonnet. **Aucune ligne de code écrite, aucun test lancé, aucun commit.** Date : 01.11. Décisions : D235 (le brasseur), D237 (§ 7, pilote),
T1 à T8 (§ 8, tri de la revue). **Règle de la voie : un justificatif n'est jamais perdu ni effacé sur un doute ; dans le doute, on garde et on attend.**
Lu : VOIE.md, REVUE-PLAN.md (tri), REVUE-conception.md, REVUE-pret.md, DIAGNOSTIC d2, PLAN s2, et le code d'aujourd'hui (chemins et lignes cités ;
les lignes du code sont celles de HEAD le 01.11). La liste des tests (§ 4.2) est un **attendu** tiré de la lecture : l'exécutant la rejoue sur HEAD avant le code.

## 0. Ce que le plan tranche, en tête

| Point | Choix | Pourquoi |
|---|---|---|
| Où vit le fichier avant l'envoi | **IndexedDB** (Dexie, base `laffinee-justificatifs`, table `envois`). Le fichier est stocké **tel que le code le consomme : la chaîne `data:…;base64,…`** (pas d'`ArrayBuffer`) | `prepareFinanceDocument` et `confirmOriginal` veulent cette chaîne (`financeDocuments.ts:7-12,77`) : une conversion de moins. Jusqu'à 4 Mo (`driveFileStore.ts:51`) : `localStorage` ne suffit pas. Modèles à reprendre pour le magasin : l'adaptateur injectable de `brewingScenarioLocalRepository.ts:225` et le refus de `VersionError` de `hopDecisionLocalRepository.ts:68-89`. |
| Brouillon | Aucun brouillon de dépense n'est persisté aujourd'hui (aucun `localStorage`/Dexie dans `ExpenseSheet.tsx`, `purchaseEntry.ts`, `purchasePrefill.ts` ; « brouillon » = la feuille ouverte, `useState`, `ExpenseSheet.tsx:87`). La consigne VOIE.md (« le brouillon est un acquis Dexie ») est inexacte sur ce point. Les Dexie du dépôt sont ceux des scénarios de brassage, des décisions houblons (`hopDecisionLocalRepository.ts:1`), de `hopV55/*`, plus un IndexedDB brut (`financialLedgerCache.ts:7-13`). Cette file est la première persistance d'un justificatif. | — |
| **Contrat « IndexedDB absent = synchrone »** | Sans `indexedDB` (jsdom, node, navigation privée refusée), ou si l'ouverture du magasin ou l'écriture du job échoue, ou au-delà du plafond (20 envois ou 60 Mo), **`savePurchaseWithProofReceipt` suit exactement le chemin d'aujourd'hui** : Drive d'abord, dépense ensuite, reçu rendu, feuille retenue pendant l'envoi. Tout Vitest (`environment: node`, jsdom sans `indexedDB`) prend ce chemin : les tests synchrones existants restent verts **parce que** ce contrat tient. Testé (§ 4.1, `contrat-synchrone.test.ts`). | Rien ne se perd si la file est indisponible. Et le brasseur ne voit jamais deux comportements au hasard : la file est active si et seulement si `proofQueueAvailable()` est vrai. |
| **État durable (type unique)** | Un seul type `ProofUpload`, écrit une fois (§ 2.0) : état `queued \| sending \| failed \| voided`, `reason` énuméré, `uid`. Sur la dépense : champ facultatif `finance.proofUpload`. **`proofDocumentId` n'est posé qu'à la réussite.** | Tous les lecteurs de `proofDocumentId` supposent que `financeDocuments/proof-…` existe : `DocumentProofLink.tsx:18-21`, la sauvegarde ZIP (`functions/src/backupTransfer.ts:236-245`), `ledger.ts:145`, `annual.ts:132,150`, `taxArchive.ts`. Le poser avant l'envoi fabriquerait des références mortes. Une dépense en attente est comptée « sans justificatif » (vrai) : filtres « Sans justificatif » et « À compléter » (`TransactionJournal.tsx:194-195`). |
| Règles Firestore, fonctions | **Aucun changement** | `updatedTransactionGuard` (`firestore.rules:99-108`) ne liste aucun champ de `finance` (précédent : `proofOriginalFileName`, `paymentDateBasis`) ; aucune liste blanche dans `functions/src` (`brewerFinanceContext.ts:5` énumère des champs lus). |
| Périmètre | **Achats** (`ExpenseSheet`, `savePurchaseWithProofReceipt`) seulement (§ 7.4) | Ventes (`incomeEntry.ts:31`), avoirs, clôture fiscale (`financeService.ts:166`, `TaxClosingSheet.tsx:61`) restent synchrones. |
| **Jamais d'effacement sur un cache (T1)** | La file ne lit **aucune dépense** avant `StorageService.isReady()` (`firestoreRepo.ts:369-371`) et un utilisateur restauré. « Dépense absente » n'efface jamais : le job reste, nouvel essai au réveil suivant. Seule une écriture prouvée refusée (`documentWriteState('transactions', id).status === 'rejected'`) met le job en `voided`. | Une transaction ne se supprime jamais (`firestore.rules:173`) : « absente » veut dire « pas encore chargée » ou « création refusée ». `App.tsx:296-330` charge les données après la connexion. |
| **`voided` (T2, § 7.2)** | Dépense annulée, écriture refusée, ou « Abandonner » : **aucun appel Drive, aucune alerte, fichier gardé 30 jours en local, aucune écriture Firestore** (impossible de toute façon : `firestore.rules:100`, `storage.ts:535`). Purge locale à J+30. | Le fichier n'est jamais supprimé sur un doute ; la règle Firestore interdit de lier une dépense annulée. |
| **Un autre fichier = un autre identifiant (T3)** | Même fichier (même sha256) : `proof-<submissionId>`. Autre fichier : `proof-<submissionId>-<n>` (`n` = `fileNo`, § 2.0). L'ancien identifiant reste orphelin, sans conséquence (rien ne le référence). | `uploadDriveOriginal` lie l'identifiant à l'empreinte (`driveFileStore.ts:309-311,315-319`, `financeDocuments.ts:104`) : un autre contenu sous le même identifiant échoue toujours en `drive/integrity`. La regex `^[A-Za-z0-9-]{8,100}$` (`financeDocuments.ts:8`) accepte le suffixe. |
| **`financeDocuments.ts` hors périmètre (T7)** | Aucun « mode patient ». La file rappelle `saveFinanceDocumentConfirmed` sur `drive/in-progress` jusqu'au résultat. | L'envoi continue au-delà de 15 s et un second appel se raccroche à la même promesse (`financeDocuments.ts:79-80,137-141`) ; chaque requête Drive a sa coupure de 45 s (`driveFileStore.ts:92`). |

## 1. Aujourd'hui, lu dans le code

**Quand l'envoi part.** Au clic « Confirmer et enregistrer » : `save` (`ExpenseSheet.tsx:276-294`) → `savePurchaseWithProofReceipt` (`purchaseEntry.ts:354-371`) : validation,
catalogue des houblons, puis `confirmProof` (`:388`) → `saveFinanceDocumentConfirmed` (`financeDocuments.ts:72`) → `confirmOriginal` (`:76-141`) → `uploadDriveOriginal`
(`driveFileStore.ts:299-395`) ; **seulement après**, `savePurchase` (`purchaseEntry.ts:443`), qui refuse sans cette confirmation (`:453`, `confirmedProofs`, un `WeakMap<PurchaseDraft,…>`, `:330`).

**Il retient l'écran.** `saveLocked`, `setSaving(true)` (`ExpenseSheet.tsx:281`) ; formulaire désactivé (`fieldset disabled`, `:531`) ; « Fermer » désactivé (`:501`) ; pied « Envoi au Drive · N Mo »
(`:585`). Après réussite, un reçu reste à l'écran jusqu'à « Terminé » (`setDone`, `:291`, `:584-586`, `receiptSentence`, `:54`). Hors ligne, `confirmPurchase` attend l'accusé du serveur 15 s
(`purchaseEntry.ts:431`) puis l'écran garde `pendingId` (« Vérifier la synchronisation »).

**L'attente est bornée à 15 s, pas l'envoi.** `waitForOriginal` (`financeDocuments.ts:46-51`) rejette en `drive/in-progress` ; le travail continue (`pendingOriginals`, `:45,80,137-140`).

**Échecs aujourd'hui** (rien n'est écrit, tout reste dans la feuille ouverte) :

| Cause | Code | Message / lieu | Repris ? |
|---|---|---|---|
| Hors ligne | `unavailable` (`financeDocuments.ts:53-58`), reformulé `purchaseEntry.ts:394-395` | « Hors connexion… » dans le cadre d'erreur (`ExpenseSheet.tsx:507`) | Au clic |
| Jeton absent / expiré | `drive/auth-required` (`driveFileStore.ts:73,80,84,117`) | message + `DriveConnection always` (`:509,292`) | Non |
| Drive jamais connecté | `ensureDriveAccessToken` rend `null` seulement pour `functions/failed-precondition` (`firebaseAuth.ts:117-119`) ; **toute autre erreur de la fonction est relancée brute** (`:120-121`) | idem / erreur brute | Non |
| Session Firebase pas encore restaurée | `getCurrentUser()` `null` → `drive/auth-required` (`driveFileStore.ts:71-74`) | idem | Non |
| Quota / débit / accès / introuvable | `drive/quota`, `drive/rate-limit`, `drive/forbidden`, `drive/not-found` (`:118-123`) | message dans la feuille | Non |
| Réseau coupé | `drive/network` (`:102`), `drive/unavailable` (`:124`) | idem ; reprise du même envoi au clic suivant (identifiant réservé, `:322-361`) | Au clic |
| Fichier trop lourd / format | `drive/invalid-file` (`:265-281`) | **jamais atteint** depuis la feuille : `attach` refuse > 4 Mo et les formats hors JPG/PNG/WebP/PDF (`ExpenseSheet.tsx:249`). **Atteignable depuis la fiche** (§ 2.4) | — |
| Fichier modifié sur Drive | `drive/integrity` (`:229,291`) | message | Non |

**Où l'échec se voit.** Seulement dans la feuille. Toast global : 4 s, sans action (`App.tsx:409-412,845-850`). Bandeau persistant `writeError` : écritures Firestore seulement, masqué en vues `wizard` et `hopV55`
(`App.tsx:832`). `PersistenceStatus` (`App.tsx:852`) : Firestore seulement. Fermer la feuille ou recharger perd le fichier.

**Ce qui se réutilise.** Envoi idempotent : identifiant réservé avant les octets, reprise par morceaux, recherche par `appProperties.documentKey`, `navigator.locks` entre onglets (`driveFileStore.ts:168-172,311,316`) ;
un original déjà confirmé se recoupe sans téléchargement (`financeDocuments.ts:96-111`). Un second envoi du même `documentId` ne crée pas de doublon dans Drive (tests existants).

**Contraintes de l'environnement.** (1) `StorageService.getTransactions()` est un **cache** rempli par les snapshots ; il est vide tant que `isReady()` est faux. (2) `documentWriteState` est en mémoire (`firestoreRepo.ts:270`) : après un redémarrage il rend
`unknown`. (3) `ModalShell` ramène le focus dans le dialogue au sommet (`ModalShell.tsx:14,98-114`) : des boutons hors dialogue ne se pressent pas tant qu'une feuille est ouverte. (4) `StorageService.updateTransaction` = `put` du document **entier** sans `merge`
(`storage.ts:532-540`, `firestoreRepo.ts:574-606`) ; une valeur `undefined` retire le champ ; il lève sur une dépense annulée (`:535`).

## 2. Le parcours voulu

### 2.0 Le type, écrit une fois (`src/domain/finance/types.ts`)

```
type ProofUploadState  = 'queued' | 'sending' | 'failed' | 'voided';
type ProofUploadReason = 'auth' | 'quota' | 'forbidden' | 'not-found' | 'network' | 'file' | 'unknown' | 'expired'   // sur failed
                       | 'cancelled' | 'refused' | 'abandoned';                                                      // sur voided
interface ProofUpload  { state: ProofUploadState; reason?: ProofUploadReason; uid: string; at: string; failures?: number; fileNo?: number }
```
- `finance.proofUpload?: ProofUpload` sur la dépense. **Firestore ne reçoit que `queued` (à l'enregistrement) et `failed`** ; `sending` est transitoire et `voided` interdit d'écriture (dépense annulée) : ces deux états vivent seulement dans le job local, qui porte le même type plus le fichier :
  `ProofJob = ProofUpload & { submissionId, transactionId:'TX-<id>', documentId, dataUrl, mimeType, driveName, originalName, year, sha256, bytes, createdAt, wakeId?, lastWakeAt?, lastFailure?:{message,at} }`.
- `fileNo` (absent = 1) est le `n` de T3 : `documentId = fileNo>1 ? 'proof-<submissionId>-<fileNo>' : 'proof-<submissionId>'`. Écrit aussi sur Firestore, pour qu'un autre appareil prenne `fileNo+1`.
- `uid` : un job n'est travaillé que par la session de ce compte ; un autre compte le laisse intact.

### 2.1 « Confirmer » : enregistrer, fermer, envoyer plus tard

1. **Validation** inchangée (`validatePurchaseCommit`, `purchaseEntry.ts:335`). Le doublon par empreinte `purchase-<documentHash>` reste (`:337-339`).
2. `proofQueueAvailable()` faux → **chemin synchrone d'aujourd'hui** (contrat § 0). Sinon :
3. **`navigator.storage.persist()`** est demandé à la première mise en file (aucun appel dans `src/` aujourd'hui) : Safari non installé purge l'IndexedDB après 7 jours sans usage ; le refus est noté et ne bloque rien (le fichier peut alors disparaître : l'état `expired` existe, § 3).
4. **`enqueueProof(job)`** écrit dans IndexedDB et ne rend la main que quand la transaction IDB est terminée. Échec → retour au chemin synchrone (jamais de perte).
5. **Raccord avec `savePurchase` (synchrone)** : un `Map<submissionId, {sha256, dataUrl, mimeType, originalName, driveName}>` `queuedProofs`, posé par `savePurchaseWithProofReceipt` après l'écriture IDB, et le nom lisible prévu (`driveProofFileName`, `purchaseEntry.ts:170`) mis **avant** dans `driveNames`. `savePurchase` : le garde `:453` accepte « original confirmé » **ou** « job en file de même `submissionId`, mêmes data-URL, nom d'origine et type » ; il écrit alors `proofUpload:{state:'queued',uid,at}`, **pas** de `proofDocumentId`, `proofFileName` = nom lisible prévu (lu dans `driveNames`), `proofOriginalFileName` inchangé, `sourceDocumentHash` inchangé.
6. Retour : `{ transactionId, queued:true }` (sans `proof`). `savePurchaseWithProof` (chaîne) reste.
7. **Accusé de la dépense** (`confirmPurchase`, `:428-442`) :
   - **En ligne** : la feuille attend l'accusé comme aujourd'hui (≤ 15 s), puis ferme. Critère : **fermée en moins de 2 s** réseau présent.
   - **Hors ligne (T5)** : si `navigator.onLine === false` et que `documentWriteState('transactions', 'TX-<id>').status === 'pending'` (écriture en file locale, durable dans le cache persistant, `firebase.ts:72`), la feuille **se ferme sans attendre l'accusé**. L'accusé est alors attendu par un suiveur hors feuille (`watchPurchaseConfirmation`) : un refus plus tard passe par le bandeau d'écriture existant (`App.tsx:832`) et met le job en `voided` (reason `refused`).
8. Dans les deux cas, la feuille appelle `onSaved()` puis `onClose()` ; **plus d'état `done`** ni de reçu à l'écran sur ce chemin. Le pied dit « Enregistrement… » (jamais « Envoi au Drive ») quand la file est active.
9. `void runProofQueue('save')` : départ sans attendre.

Le reçu (dossier, nom, empreinte) se lit à la demande dans la fiche (`purchaseProofReceipt`, `purchaseEntry.ts:376` ; § 7.1).

### 2.2 Le travailleur (la file)

- **Un seul travailleur** pour toute l'app : `navigator.locks.request('laffinee-file-justificatifs', { ifAvailable:true })` (repli : drapeau de module). Premier entré, premier servi (`createdAt`).
- **Réveils** (T6, pas de minuteries) : démarrage de l'app, `online`, `focus`, `visibilitychange` (visible), `pageshow` — le jeu d'événements de `FirestoreRepo.startSync` (`firestoreRepo.ts:522-531`) — et `save`. Chaque réveil porte un `wakeId`. **30 s au moins entre deux essais d'un même job.** Aucun `setTimeout` d'échelle.
- **Préconditions** (avant de toucher un job) : `FirebaseAuthService.getCurrentUser()` non nul **et** `uid` du job égal à celui de la session ; `StorageService.isReady()`. Sinon : rien, rien d'effacé, rien de compté ; le réveil suivant réessaie (T1).
- **Pour un job** :
  1. *Relire la dépense* (cache prêt) : (a) `proofDocumentId` déjà posé → job `voided` (reason `cancelled`), fichier gardé, orphelin Drive noté dans le journal, **aucun écrasement** (T8) ; (b) dépense annulée (`finance.voidedAt`) → `voided` `cancelled` ; (c) écriture initiale refusée (`documentWriteState(...).status==='rejected'`) → `voided` `refused` ; (d) **absente** → *aucune action*, le job reste (T1) ; (e) écriture initiale pas encore confirmée (`pending`/`unknown` avec `fromCache`) → attendre son accusé (`waitForDocument`) ; non confirmée → le job reste.
  2. *Jeton* : `ensureDriveAccessToken()` (silencieux, jamais de fenêtre) ; `null` → échec `auth` ; erreur relancée → classée § ci-dessous (jamais `failed` directement).
  3. *Envoi* : `saveFinanceDocumentConfirmed(prepared, year)` sans le toucher ; sur `drive/in-progress` **on rappelle** (T7) jusqu'au résultat, dans la limite de la vie de l'app (un envoi coupé par la fermeture repart au réveil). Le job passe `sending` (local).
  4. *Lien* (T8) : relire la dépense, **de préférence depuis le serveur** (`getDocFromServer`) ; si `proofDocumentId` est déjà là → `voided` (a) ci-dessus ; sinon
     `StorageService.updateTransaction({ ...current, proofFileName: <nom que Drive rend>, finance: { ...current.finance, proofDocumentId, proofUpload: undefined } })`, puis `waitForDocument` (15 s, identité sur `proofDocumentId`). L'appel est **entouré d'un `try`** : une dépense annulée entre-temps (`storage.ts:535` lève) → `voided` ; `permission-denied` (paiement arrivé entre-temps, `unchangedPaymentGuard`, `firestore.rules:91-94,104-105`) → **relire et réessayer une fois**, puis passager.
  5. *Nettoyage* : le job et son fichier ne sont effacés **qu'après l'accusé du lien**.
- **Classement des échecs** (T6). « Atteint un serveur » = une réponse HTTP de Drive (un statut) ou un code `functions/*` renvoyé par la fonction. Seul un essai qui a atteint un serveur est **compté** (`failures`, une fois par `wakeId`) ; `navigator.onLine` n'en décide jamais.

| Cause | Genre | Conduite |
|---|---|---|
| Hors ligne (`navigator.onLine===false`), `drive/network` (fetch échoué), `functions/unavailable`, `functions/deadline-exceeded` | Attente | État `queued`, **non compté**, aucune alerte ; réveil suivant. |
| Session non restaurée, cache non prêt | Attente | Idem (précondition). |
| `drive/unavailable` (5xx), `drive/rate-limit`, `functions/internal`, `functions/resource-exhausted`, démarrage à froid | Passagère | Compté. **`failed` (reason `network`) après 6 échecs sur 6 réveils distincts.** |
| `drive/auth-required` avec jeton `null` obtenu (consentement absent) | Reconnexion | `failed` `auth` tout de suite ; **file arrêtée** (même cause pour tous). |
| `drive/quota` | Place | `failed` `quota` ; file arrêtée. |
| `drive/forbidden` | Droits | `failed` `forbidden` ; file arrêtée. |
| `drive/not-found` | Dossier / fichier | **Un** essai de plus (le cache des dossiers est vidé, `driveFileStore.ts:357`), puis `failed` `not-found`. |
| `drive/invalid-file`, `drive/integrity`, id pris par un autre contenu | Le fichier | `failed` `file` ; **le job suivant continue**. |
| Toute autre erreur (réellement inconnue) | Inconnue | Compté ; **`failed` `unknown` après 2 échecs** sur 2 réveils distincts (message brut français gardé). |
| Écriture Firestore du lien refusée définitivement | Inconnue | idem. |

- **Écrire l'échec** : à `failed`, le travailleur écrit sur la dépense `finance.proofUpload = { state:'failed', reason, uid, at, failures, fileNo }` par `updateTransaction` sur la dépense relue, **entouré d'un `try`** (dépense annulée → `voided`, rien écrit). Hors ligne, Firestore met l'écriture en file.
- **Bascule `failed` → `queued`** (après « Reconnecter » réussi, ou « Renvoyer ») : le travailleur écrit `proofUpload.state='queued'` sur la dépense **avant** de renvoyer, avec la même garde (annulée → `voided`, rien écrit). Sans cela, la notification resterait « à renvoyer » pendant l'envoi et sur les autres appareils.
- **Réussite** : la dépense « porte son lien » (`proofDocumentId` → `financeDocuments/proof-…` → `driveFileId`). Rien à l'écran, aucune notification.

### 2.3 La notification (point d'accroche seulement ; forme provisoire, remplacée par celle du choix p3, § 7.6)

- **État global** : un magasin observable `proofUploadStatus` (`subscribe`/instantané, modèle `FirestoreRepo.subscribe`, `PersistenceStatus.tsx:6-8`) qui réunit (1) les dépenses dont `finance.proofUpload.state==='failed'` (Firestore : visibles depuis tout appareil et après perte du stockage local) ; (2) celles en `queued` depuis plus de **48 h** (« en attente depuis N jours ») ; (3) les jobs locaux `failed` ; (4) un job local dont la dépense reste **absente** après 7 jours, cache prêt (« un justificatif attend sa dépense ») : le fichier n'est **jamais** supprimé, seul « Abandonner » le met en `voided`. **Un job `voided` n'alerte jamais.** Une dépense `queued` récente, ou en attente de réseau, n'alerte pas.
- **Composant** `<ProofUploadNotice />` monté dans `App.tsx` à côté de `<PersistenceStatus />` (`:852`). **Apparition (T4)** : seulement **quand aucune feuille n'est ouverte** — aucun `[role="dialog"]` dans le document (même prédicat que `ModalShell.tsx:14`) — ; la feuille de la dépense est fermée après « Confirmer », donc l'échec d'une autre dépense ne la gêne pas ; une autre feuille ouverte **retarde** la notification jusqu'à sa fermeture (observateur du DOM). **Vues exclues, nommées** : `wizard` et `hopV55` (comme `writeError`, `App.tsx:832`) ; elle y apparaît à la sortie. Persistante (jamais le toast de 4 s), en `z-[60]` comme `writeError` ; « Plus tard » la réduit sans effacer l'état. Une seule pour N dépenses (« 2 justificatifs à renvoyer »).
- **Actions** :
  - **« Renvoyer le justificatif »** : **`setActiveTab('finances')` puis `setFinanceOpenRequest({ id, at:Date.now() })`** (les deux appels de la palette, `App.tsx:689-690`) ; `FinancesTab` (`src/components/tabs/FinancesTab.tsx:125-134`) traite la demande une fois monté et ouvre la fiche `TransactionDetails`. La fiche reçoit un bloc « justificatif à renvoyer » (près de `DocumentProofLink`, `TransactionDetails.tsx:46`) : motif en clair, **Renvoyer maintenant** (fichier local présent : bascule `queued` et relance ; absent ou autre appareil : sélecteur de fichier, § 2.4), `DriveConnection` si le motif est `auth`, **Abandonner**.
  - **« Reconnecter Drive »** : dans la notification quand le motif est `auth` (`DriveConnection compact`, `DriveConnection.tsx`) ; après `refreshDriveAccess` réussi : bascule `queued` puis `runProofQueue('reconnect')`.
  - **« Abandonner »** (fiche seulement) : job `voided` `abandoned` (fichier gardé 30 jours, aucune écriture si impossible), `proofUpload` retiré de la dépense ; elle reste « sans justificatif ». Jamais fait seul.

### 2.4 Le renvoi depuis la fiche : fonction neuve `resendProof(transactionId, file)`

`attachProofToPurchase` ne convient pas : elle exige un `PurchaseDraft` complet et `purchaseProofAttachable` (`purchaseEntry.ts:401-413`). `resendProof` (dans `purchaseEntry.ts`) :
1. Dépense présente, non annulée, **sans `proofDocumentId`** ; sinon refus clair.
2. **Mêmes gardes que `attach`** (`ExpenseSheet.tsx:249`) : ≤ 4 Mo, JPG/PNG/WebP/PDF (`GeminiScannerService.normalizeMimeType`). Refus avec message, rien n'est mis en file : `drive/invalid-file` devient atteignable ici et est testé.
3. Calcule la chaîne `data:`, l'empreinte, le type, et le **nom lisible depuis la dépense** (`driveProofFileName` avec sa date, son fournisseur, son numéro, repli sur le nom d'origine).
4. **Même empreinte que le job local** → même `documentId` ; **autre empreinte** → `fileNo+1` (lu dans `proofUpload.fileNo` Firestore, donc valable depuis un autre appareil) (T3).
5. Met en file, écrit `proofUpload.state='queued'` (même garde que § 2.2), `void runProofQueue('resend')`.
6. `acceptsProof` (`purchaseEntry.ts:398`) **refuse** désormais une dépense qui porte `finance.proofUpload` (le brasseur voit « envoi en cours ») : « Rattacher le justificatif » (`attachProofToPurchase`) ne peut donc plus envoyer sous un second identifiant pendant que la file envoie le premier.

## 3. Les cas

| Cas | Conduite voulue |
|---|---|
| **Cache non prêt au démarrage** (T1) | Aucune lecture de dépense, aucun effacement, 0 appel Drive. Les jobs restent. Testé. |
| **Dépense absente** | Jamais d'effacement ni d'abandon. Le job reste ; alerte locale après 7 jours (§ 2.3 (4)) ; seul « Abandonner » le met en `voided`. |
| **Dépense annulée avant l'envoi** (§ 7.2, T2) | Job `voided` `cancelled` : **0 appel Drive, 0 alerte, fichier présent à J+29, absent à J+31, aucune écriture Firestore.** |
| **Écriture refusée** (marqueur `purchase-<hash>` pris par un autre appareil, `purchaseEntry.ts:337-339`) | `documentWriteState` = `rejected` → `voided` `refused`. Le lien n'est **jamais** écrit (sinon `updateTransaction` recréerait la dépense par `put` sans stock ni paiement, `firestore.rules:95-98,196`). |
| **Fermeture de l'app pendant l'envoi** | Le job est `sending` en IndexedDB. Au démarrage, un `sending` sans verrou tenu depuis plus de 2 min repasse `queued` sans compter. L'envoi repart du début mais **n'ajoute rien dans Drive** : identifiant réservé (`localStorage`, `driveFileStore.ts:204-214`) et recherche `documentKey` (`:316`). Pas d'API Background Sync (absente d'iOS) : l'envoi reprend au retour au premier plan. |
| **Fermeture entre « envoyé » et « lié »** | `confirmOriginal` retrouve `financeDocuments/proof-…` confirmé, le recoupe localement (`financeDocuments.ts:96-111`), puis le lien est posé. |
| **Deux dépenses en file** | Ordre d'arrivée, un envoi à la fois. Cause commune (`auth`, `quota`, `forbidden`) : la file s'arrête, **une seule** notification ; cause du fichier (`file`) : on passe au suivant. |
| **Même justificatif envoyé deux fois** | (1) un job par `submissionId` (clé primaire) ; (2) verrou du travailleur ; (3) `uploadDriveOriginal` (`pending`/`pendingIds`/`withLock`/`documentKey`) : aucun doublon dans Drive ; (4) « Renvoyer » pendant `sending` est sans effet ; (5) **« Rattacher » refusé** pour une dépense qui porte `proofUpload` (§ 2.4) ; (6) le même fichier sous une autre saisie est refusé avant (`purchaseEntry.ts:337-339`) ; (7) deux appareils : le lien n'est posé que si `proofDocumentId` est absent (T8). |
| **Autre fichier après un échec** (T3) | Échec `quota` après réservation, puis renvoi d'un **autre** fichier : `fileNo+1`, nouvel identifiant, succès, **un seul fichier lié**. |
| **Fichier gardé où, combien de temps, effacé quand** | IndexedDB de l'appareil, chaîne `data:`. **Gardé jusqu'à ce que le lien soit confirmé**, puis effacé. En `failed` : gardé 30 jours (puis `expired` : la dépense dit « fichier local effacé, joindre à nouveau »). En `voided` : gardé 30 jours, purge **sans écriture Firestore**. Jamais envoyé à Gemini ni à un serveur applicatif. Plafond : 20 envois ou 60 Mo, au-delà le chemin synchrone. `navigator.storage.persist()` demandé (§ 2.1) ; sur Safari non installé le fichier peut disparaître avant 30 jours, `expired` le dit. |
| **Un autre appareil voit l'échec** | Il lit `finance.proofUpload.state==='failed'`. Sans le fichier : « Renvoyer » ouvre le sélecteur (§ 2.4, `fileNo+1`). Pas d'alerte pour un `queued` récent d'un autre appareil. |
| **Dépense modifiée pendant l'envoi** | Le lien se pose sur la dépense **relue juste avant** (§ 2.2 étape 4), jamais sur l'instantané. |
| **Hors ligne à « Confirmer »** (T5) | La file reçoit le fichier ; la dépense s'écrit en file locale ; la feuille se ferme sans attendre l'accusé ; l'envoi attend le réseau. Un refus plus tard : bandeau d'écriture existant + `voided`. Le critère « fermée en moins de 2 s » vaut **réseau présent** ; hors ligne : « se ferme sans attendre l'accusé ». |
| **Drive jamais connecté** | Le jeton n'est lu que par un job (pas au montage sans justificatif, `6391816f`). Sans consentement : `failed` `auth` → notification. La feuille peut afficher « Drive à connecter » (DR3) mais ne bloque plus. |
| **Compte changé** | `driveFileStore.session` refuse si l'`uid` diffère (`:79-80`) ; un job d'un autre `uid` n'est jamais travaillé. |

## 4. Les tests (L13)

Dossier `tests/unit/depense/drive-fond/`. Le magasin s'injecte par `setProofFileStore(store | null)` (export nommé de `proofQueue.ts`, **réexporté par `purchaseEntry.ts`**) ; par défaut = Dexie si `indexedDB` existe, sinon `null` (repli synchrone). En test : un magasin mémoire. Un test jsdom commence par `// @vitest-environment jsdom` (modèle `ecran-recu.test.tsx:1` ; `vitest.config.ts` ne donne jsdom qu'à `tests/integration/**`). **Les nouveaux modules (`proofQueue`, `proofUploadStatus`) ne touchent `FirestoreRepo` ni `FirebaseAuthService` qu'à l'appel, jamais à l'import** (les tests existants les simulent presque vides : `expenseSheet.test.tsx:8`, `ecran-recu.test.tsx:13`).
Drive, Firestore, session et temps sont factices ; aucun Gemini.

### 4.1 Tests nouveaux, et ce qui prouve quoi

**Témoin de départ (L13)** : le seul qui échoue pour la bonne raison sans importer rien de nouveau est `confirmer.test.ts` (ci-dessous). Les autres échouent par « module absent » : ils prouvent un contrat, pas un défaut, et sont étiquetés **contrat**.

| Fichier | Affirme | Sur HEAD |
|---|---|---|
| `confirmer.test.ts` (**témoin du défaut**) | Importe seulement `purchaseEntry` (existant). Appelle `(mod as any).setProofFileStore?.(memoire)` (rien à HEAD : l'appel est conditionnel, aucune erreur d'import). Drive qui **ne répond jamais** : `savePurchaseWithProofReceipt` doit rendre en moins de 1 s (temps factice) avec la dépense écrite, `finance.proofUpload.state==='queued'`, **sans** `proofDocumentId`, `uploadDriveOriginal` pas attendu. | **ROUGE** pour la bonne raison : l'appel attend Drive puis lève `drive/in-progress` à 15 s. |
| `contrat-synchrone.test.ts` (**garde-fou**) | `typeof indexedDB === 'undefined'` dans l'environnement ; sans magasin, `savePurchaseWithProofReceipt` suit l'ordre d'aujourd'hui (Drive, puis dépense, `proofDocumentId` posé, reçu rendu) ; magasin qui lève à l'écriture ou plafond atteint : même chemin. | **VERT** sur HEAD (il décrit le chemin actuel) et après. Échoue si quelqu'un ajoute `fake-indexeddb` sans le dire. |
| `file.test.ts` (contrat) | `enqueueProof` n'est rendu qu'après écriture ; un module rechargé relit les jobs ; un job par `submissionId` ; ordre d'arrivée ; plafond 20 / 60 Mo ; `fileNo` et `documentId`. | module absent |
| `echecs.test.ts` (contrat) | Table § 2.2 : chaque cause → genre → conduite, **dont** `functions/unavailable` (attente, 0 alerte), `functions/internal` (passager), session non restaurée (attente), erreur inconnue = 2 échecs, `onLine` ne décide jamais du comptage. | module absent |
| `envoi.test.ts` (contrat) | **Réussite** : lien posé par `updateTransaction({...current, finance:{...current.finance, proofDocumentId, proofUpload: undefined}})`, job et fichier effacés **après** l'accusé ; accusé raté → fichier gardé. **T1** : cache non prêt (`isReady()` faux) → 0 lecture, 0 effacement, 0 appel Drive ; dépense absente → job intact. **T2** : annulée → `voided`, 0 appel Drive, 0 alerte, fichier à J+29 et absent à J+31, 0 écriture Firestore. **Refusée** (`rejected`) → `voided`, lien jamais écrit. **T3** : `quota` après réservation, puis autre fichier → `fileNo+1`, un seul fichier lié ; même fichier → même identifiant. **T6** : 6 échecs passagers sur 6 `wakeId` distincts → `failed network` ; 6 échecs au même `wakeId` → un seul compté ; 30 s minimum entre deux essais ; inconnue → `failed` au 2e. `auth` : `failed`, file arrêtée, 2e job non tenté, reprise après reconnexion avec bascule `queued`. **T7** : `drive/in-progress` rappelé jusqu'au résultat. **T8** : `proofDocumentId` déjà posé (autre appareil) → `voided`, rien écrit ; `permission-denied` → relu et réessayé une fois ; annulée entre-temps → attrapée. Deux dépenses : ordre, un envoi à la fois. Même `documentId`, deux travailleurs : `uploadDriveOriginal` appelé 1 fois. `sending` périmé → `queued` sans compter. | module absent |
| `renvoi.test.ts` (contrat) | `resendProof` : fichier de 5 Mo refusé, format refusé (rien en file) ; dépense avec `proofDocumentId` refusée ; `acceptsProof` refuse une dépense qui porte `proofUpload` ; nom lisible calculé depuis la dépense ; autre appareil (job absent) → `fileNo+1` lu sur Firestore. | module absent |
| `notification.test.tsx` (contrat, jsdom) | `ProofUploadNotice` : `failed` dans Firestore → rôle `alert`, **toujours là après 10 s** ; N dépenses → un seul bandeau ; motif `auth` → bouton Drive ; **aucune** notification si un `[role="dialog"]` est ouvert, elle apparaît à sa fermeture ; vues `wizard`/`hopV55` : absente, présente à la sortie ; `voided` : jamais ; `queued` récent : rien ; `queued` > 48 h et « sans dépense » > 7 jours : bandeau ; « Renvoyer » rend `setActiveTab('finances')` puis `setFinanceOpenRequest` avec l'id, **jusqu'à la fiche ouverte** (App réelle ou `FinancesTab` monté avec la demande). | composant absent |
| `fiche.test.tsx` (contrat, jsdom) | `TransactionDetails` d'une dépense `failed` : motif lisible, « Renvoyer maintenant », « Abandonner » (retire l'état ; la dépense reste « sans justificatif » ; `voided`), `DocumentProofLink` seulement avec `proofDocumentId`. | bloc absent |
| `feuille.test.tsx` (**garde-fou**, jsdom) | Mock de `savePurchaseWithProofReceipt` rendant `{ transactionId, queued:true }` : `onClose` appelé sans attendre ; ni « Envoi au Drive » ni « Justificatif rangé ». Hors ligne + écriture `pending` : fermée sans attendre l'accusé. | **VERT sur HEAD** pour le premier cas (HEAD ferme déjà quand le mock ne rend pas de `proof`, `ExpenseSheet.tsx:291`) : il garde le comportement, ne prouve pas le défaut. Le défaut de la feuille est prouvé par le cas Chrome 1. |

### 4.2 Les tests et scripts existants, fichier par fichier (attendu)

Règle d'ensemble : **jsdom et node n'ont pas `indexedDB`** → `proofQueueAvailable()` est faux → chemin synchrone (§ 0). Les tests qui moquent `savePurchaseWithProofReceipt` sans `queued` ramènent la feuille à la branche d'aujourd'hui (`proof` rendu → reçu ; sinon fermeture).

| Fichier | Assertion (ce qu'il fige) | Attendu après le code | Pourquoi |
|---|---|---|---|
| `tests/integration/expenseSheet.test.tsx` (:10, :170, :214, :225) | mock rend `{transactionId}` ; `onSaved` appelé une fois ; reprise « Vérifier la synchronisation » | **VERT** | mock sans `queued`, jsdom sans IDB |
| `tests/integration/expenseSheetMouture.test.tsx` (:17-21) | vrai `savePurchase`, Drive simulé ; prix « avec mouture » | **VERT** | `financeDocuments` simulé, chemin synchrone |
| `tests/integration/jus0Journey.test.tsx` (:19, :76, :133, :144) | `state.proofConfirm` appelé une fois ; hors ligne refusé ; « Terminé » | **VERT** | repli synchrone (jsdom sans IDB) ; c'est le contrat testé |
| `tests/integration/documentProofLink.test.tsx` | `DocumentProofLink` charge l'original d'un `proofDocumentId` | **VERT** | composant non touché |
| `tests/integration/financeDocumentPersistence.test.ts`, `tests/unit/financeDocuments.test.ts`, `financeDocumentMigration.test.ts`, `financeDocumentHistory.test.ts` | `confirmOriginal`, 15 s, nom, hors ligne | **VERT** | `financeDocuments.ts` non modifié (T7) |
| `tests/integration/incomeProofFlows.test.tsx`, `tests/unit/incomeEntry.test.ts`, `taxWorkspace.test.tsx`, `taxArchive.test.ts`, `fribourgTax.test.ts`, `backupTransfer.test.ts`, `tests/unit/backupTransferServer.test.ts` | ventes, clôture, sauvegarde ZIP : envoi synchrone, `proofDocumentId` | **VERT** | périmètre achats seulement ; `documentIds` ne lit que `proofDocumentId` |
| `tests/integration/financeAssistantContext.test.ts`, `tests/unit/finance.test.ts`, `financeArchiveContinuity.test.ts` | `hasProof`, `missingProofCount`, notes | **VERT** | `ledger.ts`, `annual.ts` non modifiés ; champ facultatif ajouté seulement |
| `tests/unit/depense/ecran/ecran.test.tsx`, `tri.test.tsx`, `fiche/ecran.test.tsx`, `raccord/ecran-lecture.test.tsx` | feuille r2b ; mock de `savePurchaseWithProofReceipt` sans `queued` | **VERT** | idem |
| `tests/unit/depense/ecran/tri.test.tsx:200` | pied « Envoi au Drive · 0,7 Mo » pendant l'envoi (chemin banc `apercu`) | **VERT** | `proofQueueAvailable()` faux en jsdom : le texte d'aujourd'hui ne disparaît qu'avec la file active |
| `tests/unit/depense/raccord/ecran-recu.test.tsx` (:48-61 `receiptSentence`, :66-75 reçu puis « Terminé ») | reçu à l'écran jusqu'à « Terminé » quand le service rend un `proof` | **VERT** | c'est l'écran du **chemin synchrone** (repli) ; `receiptSentence` reste exporté de `ExpenseSheet.tsx`. Si le pilote veut le reçu retiré aussi du repli (§ 6.1), ce fichier est **réécrit** |
| `tests/unit/depense/raccord/changer-fichier.test.tsx` (:58-80, :88-112, :190-205) | « Justificatif rangé » affiché après `save` ; « Changer » bloqué après un envoi | **VERT** | idem : mock rend `proof`, pas de `queued` |
| `tests/unit/depense/raccord/rattachement-en-cours.test.ts` | messages « Envoi du justificatif en cours » et « Rattacher » ; `drive/in-progress` | **VERT** | `confirmProof` et `attachProofToPurchase` gardent leur chemin ; fixtures sans `proofUpload` |
| `tests/unit/depense/raccord/autre-original.test.ts`, `raccord/unites-enregistrement.test.ts` | « Un autre original » ; unités à l'enregistrement | **VERT** | chemin synchrone |
| `tests/unit/purchaseEntry.test.ts` | garde « Confirme d'abord l'envoi » (`:453`) ; ordre Drive → dépense ; M6 hors connexion | **VERT** | sans magasin, rien ne change ; le garde accepte *en plus* un job en file |
| `tests/unit/depense/enregistrement/justificatif-nom.test.ts`, `justificatif-persistance.test.ts` | nom lisible ; `financeDocuments` réel, Drive d'abord | **VERT** | chemin synchrone |
| `tests/unit/depense/enregistrement/paiement-prix.test.ts`, `mouture-prix.test.ts`, `unites.test.ts`, `doublon-commande.test.ts` | prix, base de la date de paiement, moutures, unités, signal S8 | **VERT** | le contenu écrit par `savePurchase` est inchangé ; seul `proofUpload` s'ajoute (absent sur le chemin synchrone) |
| `tests/unit/depense/fiche/ecriture.test.ts`, `stock/ecran.test.ts`, `stock/unites.test.ts` | écriture des articles ; stock | **VERT** | idem |
| `tests/integration/financeJournalUx.test.tsx`, `financeWorkspace.test.tsx`, `financeArchives.test.tsx`, `tests/unit/depense/onglets/ta2-compteur.test.tsx` | journal, filtres, compteurs | **VERT** | le prédicat `proof` (`TransactionJournal.tsx:194-195`) ne change que pour une dépense qui porte `proofUpload`, absent de ces fixtures |
| `tests/integration/AppQuickActionReturn.behavior.test.tsx`, `AppRoutePile.test.tsx`, `dashboardNavigation.test.tsx`, `bootstrapError.test.tsx`, `brewLegacyInstallationApp.test.tsx`, `AppLanceurOutilsHoublons.test.tsx`, `fix114.test.tsx` | rendent `App` | **VERT** | `<ProofUploadNotice />` et le démarrage de la file sont inertes sans `indexedDB`, sans utilisateur et sans `FirestoreRepo` à l'import ; **à confirmer sur HEAD d'abord** (risque : un mock de `firestoreRepo` minimal) |
| `scripts/check-invoice-journey-emulator.mjs` :588-609 (`confirmSheet`, issue `'recu'`, bouton « Terminé ») | attend le reçu puis « Terminé » | **ROUGE par conception** | Chrome a `indexedDB` : la feuille se ferme sans reçu. Réécrit : l'issue attendue est `'fermée'` sans reçu ; le reçu se lit dans la fiche |
| idem :763-765, :785 (`doc5-recu-drive`, « la feuille se ferme (reçu Drive, puis « Terminé ») ») | message et capture du reçu | **ROUGE** puis réécrit | idem |
| idem :803, :828, :899, :1088, :1145 (`verifyPurchase` : `proofDocumentId` et original lus **juste après** la fermeture) | l'original est dans Drive, le lien est posé | **ROUGE par course** | l'envoi arrive après la fermeture : attendre (sondage borné, 60 s) que `proofUpload` disparaisse avant de lire |
| idem :1160-1201 (`doc4`, `hors-ligne`, `__jus0Offline`) | hors ligne : refus / rien au serveur pendant la coupure, une dépense synchronisée au retour | **à réécrire** | T5 : hors ligne la feuille se ferme ; l'envoi attend `online` |
| idem :1057-1102 (`rattacher`, « Rattacher le justificatif », « Terminé » du bouton `attached`) | joindre à une dépense existante **sans** `proofUpload` | **VERT** | `attachProofToPurchase` inchangé pour une dépense sans `proofUpload` ; « Terminé » du chemin `attached` (`ExpenseSheet.tsx:587`) reste |
| `src/ui/depense/apercuDev.ts:81` (`apercu.enregistrer` → `setReceipt`/`setDone`), `ExpenseSheet.tsx:279-291` | chemin du banc de développement des états de la maquette r2b | **inchangé** | le banc `apercu` simule l'enregistrement : il garde ses états ; `done` n'est retiré que sur le chemin `queued` |

**Contrôle Chrome sur fixtures** (le banc existe ; Drive factice **dans la page** par enveloppe de `fetch`, aucune requête hors localhost ; il n'a aujourd'hui que le succès et `window.__jus0Offline`, `:260,284-290` : les **réglages** Drive lent, 403 `storageQuotaExceeded`, jeton refusé, `functions/unavailable` sont **à ajouter au banc par la voie de code**, § 7.5). Cas `drive-fond`, joués à **390 tactile** puis **1280**, captures **ouvertes** (L12) :
1. Drive lent (10 s par requête), réseau présent : « Confirmer » → la feuille se ferme en **moins de 2 s** (mesure) ; la dépense est dans la liste ; aucune notification. **Témoin du défaut sur HEAD** : la feuille reste.
2. Drive répond 403 `storageQuotaExceeded` : la notification apparaît (aucune feuille ouverte), sur Finances **et** sur le tableau de bord ; la cause est dite ; elle persiste après 10 s ; **tab ou clavier atteint ses boutons**.
3. « Renvoyer le justificatif » → l'onglet Finances s'ouvre sur la fiche de **cette** dépense (id vérifié) ; Drive repasse en succès ; « Renvoyer maintenant » → plus de notification, `Justificatif` s'ouvre, **un seul fichier** dans le Drive factice.
4. Jeton refusé : « Reconnecter Drive » dans la notification ; après la reconnexion factice la file repart, la dépense repasse `queued` puis liée.
5. Réseau coupé **avant** « Confirmer » (T5) : la feuille se ferme sans attendre l'accusé (mesure < 5 s), aucune notification ; au retour du réseau, une dépense synchronisée, un envoi, un lien.
6. Réseau coupé **pendant** l'envoi puis rétabli : aucune notification ; envoi à `online`.
7. Rechargement de la page en plein envoi : la file reprend au démarrage ; un seul fichier dans le Drive factice.
8. **Autre fichier après un échec** (T3) : quota, puis « Renvoyer » avec un autre fichier : succès, un seul fichier lié.
9. **Redémarrage cache non prêt, hors ligne** (T1) : la page rechargée hors ligne ; aucun job effacé (IndexedDB relue), 0 appel Drive.
10. `functions/unavailable` du renouvellement du jeton : **pas d'alerte** ; la file réessaie au réveil suivant.
11. Fichier de plus de 4 Mo ou format refusé choisi dans la fiche : refus clair, rien en file.

## 5. Fichiers touchés et risques

**Nouveaux** : `src/services/proofQueue.ts` (types, travailleur, réveils, classement, `setProofFileStore`, `proofQueueAvailable`, inerte à l'import), `src/services/proofQueueStore.ts` (adaptateur Dexie + adaptateur mémoire ; refus de `VersionError`), `src/services/proofUploadStatus.ts` (magasin observable), `src/ui/finance/ProofUploadNotice.tsx` (forme provisoire), bloc « justificatif à renvoyer » dans `TransactionDetails.tsx`.

**Modifiés** :
- `src/services/purchaseEntry.ts` : `savePurchaseWithProofReceipt` (file, repli synchrone, `queuedProofs`), garde `:453`, `savePurchase` écrit `proofUpload`/`proofFileName`, `acceptsProof` (`:398`) refuse si `proofUpload`, nouvelle `resendProof`, `watchPurchaseConfirmation`, réexport de `setProofFileStore`.
- `src/domain/finance/types.ts` : `ProofUpload` et `TransactionFinance.proofUpload?`.
- `src/ui/finance/ExpenseSheet.tsx` : branche `queued` (fermeture, pied « Enregistrement… », fermeture hors ligne T5). **Le chemin synchrone, `done`, le reçu et `receiptSentence` sont conservés** pour le repli. Écran du brasseur (D235, base r2b) : ni mise en page ni composant de r2b ne changent ; seul le comportement du pied après « Confirmer ». Le registre `ecrans.json` ne contient pas d'entrée « dépense » ; `controle-choix.mjs` à rejouer au port.
- `src/App.tsx` : monter `<ProofUploadNotice />` près de `<PersistenceStatus />` (`:852`) ; démarrer la file quand l'utilisateur est restauré **et** `isReady()`.
- `src/ui/finance/TransactionJournal.tsx:194-195` : un prédicat « envoi en cours / à renvoyer » dans le filtre « Sans justificatif » et dans « À compléter » ; `src/ui/finance/TransactionDetails.tsx` : le bloc.
- **Non touchés (T7)** : `src/services/financeDocuments.ts`, `src/services/driveFileStore.ts`, `ModalShell.tsx`, `FinancesTab.tsx`, `firestore.rules`, `functions/`.

**Schéma, règles, fonctions.** Un champ facultatif ajouté sur `transactions.finance` ; aucun champ retiré, aucune migration ; une dépense d'avant reste lisible. Règles : **inchangées**. Fonctions : **inchangées**. Sauvegarde ZIP (`backupTransfer.ts:236-245`) : une dépense dont le fichier n'est pas encore dans Drive n'a pas de `proofDocumentId` ; son fichier local n'est donc pas dans l'export tant que l'envoi n'a pas abouti. Export et rapport annuel : `proofFileName` porte le **nom prévu** (`annual.ts:134,151`, `financeExport.ts:49,135`) pour une pièce pas encore dans Drive, alors que `hasProof` est faux : sans conséquence comptable, **limite à dire**.

**Risques et parades.**
- *Perte du fichier avant l'envoi* (stockage vidé, Safari 7 jours, appareil perdu) : écriture IDB confirmée avant la dépense ; `persist()` demandé ; `failed`/`expired` est dans Firestore ; jamais d'effacement sur un cache ni sur « absente » (T1).
- *Invariant « Drive avant dépense » levé* : remplacé par « fichier durable avant dépense » ; la comptabilité compte le justificatif manquant (`ledger.ts:145`) jusqu'au lien.
- *Concurrence* sur la dépense : relecture serveur juste avant ; pas d'écrasement d'un `proofDocumentId` (T8) ; `permission-denied` relu une fois.
- *Pas de réveil par le système* (surtout iOS) : la file vit tant que l'app est ouverte ou revient au premier plan ; l'alerte d'attente à 48 h le dit.
- *Les fenêtres Google* ne s'ouvrent jamais seules (`googleAuthorization.ts:14-31`) : « Reconnecter » reste un clic.
- *Aucun appel Drive réel* dans les tests ; l'essai réel (DR2) reste hors plan.
- *À part, accord requis (rien de ceci n'est prévu)* : `fake-indexeddb` ; déploiement de règles ou de fonctions ; données réelles ; essai Drive réel.

## 6. Ce qui reste ouvert (le pilote, pas l'auteur)

1. **Reçu dans le repli synchrone** : le plan conserve l'écran du reçu (« Terminé ») **dans le chemin synchrone seul** (IndexedDB absent), parce que c'est le comportement d'aujourd'hui et qu'il garde vertes `ecran-recu.test.tsx` et `changer-fichier.test.tsx`. Le chemin normal n'a aucun reçu à l'écran (§ 7.1). Si le pilote préfère le retirer aussi du repli : ces deux fichiers sont réécrits.
2. **Seuils** (§ 7.3, constantes réglables, choix et non mesures) : 6 échecs passagers sur réveils distincts ; 2 pour l'inconnue ; 30 s entre deux essais ; alerte d'attente 48 h ; alerte « sans dépense » 7 jours ; fichier gardé 30 jours ; plafond 20 envois / 60 Mo ; `sending` périmé 2 min.
3. **Propriété du banc Chrome** : § 7.5 (voie de code suivante).

## 7. Décisions du pilote (01.11, D237 ; réversibles)
1. Reçu : oui, dans la fiche de la dépense ; rien à l'écran tant que ça marche (D235). La forme sera revue sur la maquette qu'il choisira (p3).
2. Annulation avant envoi : **le fichier est gardé localement 30 jours, sans notification** (option prudente : rien n'est perdu ni
   supprimé sans lui), l'envoi est abandonné (la règle Firestore interdit de lier).
3. Seuils : ceux du plan, en constantes réglables, signalés comme choix et non mesures.
4. Ventes et clôture : synchrones dans cette passe.
5. Banc Chrome `scripts/check-invoice-journey-emulator.mjs` : à la voie de code qui suivra ce plan (cas `drive-fond`).
6. La forme de la notification d'échec est un axe des maquettes p3 : le code pose le mécanisme (état durable, notification globale
   persistante, deux gestes) avec une forme provisoire, remplacée par celle qu'il choisira.

## 8. Ce que le pilote tranche (T1 à T8, recopiés de REVUE-PLAN.md)
- **T1, jamais d'effacement sur un cache** (Conception B2, Prêt 1) : la file ne lit aucune dépense avant `StorageService.isReady()` et un
  utilisateur restauré ; « absente » n'efface jamais (le job reste, nouvel essai au réveil suivant) ; seule une écriture prouvée refusée
  (`documentWriteState('transactions', id).status === 'rejected'`) met le job en `voided`. Test : cache non prêt, 0 effacement, 0 appel Drive.
- **T2, l'état `voided`** (Conception M1, D6, Prêt 2, 12) : un seul type `ProofUpload` écrit une fois (`queued | sending | failed | voided`,
  `reason` énuméré, `uid`). `voided` (annulée, refusée, ou « Abandonner ») : aucun appel Drive, aucune alerte, purge locale à 30 jours sans
  écriture Firestore. § 0, § 3, § 4 et § 6.2 réécrits dans ce sens.
- **T3, un autre fichier = un autre identifiant** (Conception B1) : le même fichier (même sha256) réutilise `proof-<submissionId>` ; un
  autre fichier prend `proof-<submissionId>-<n>`. Test : échec après réservation, puis autre fichier, un seul fichier lié.
- **T4, la notification** (Prêt 4, Conception D5) : elle n'apparaît que sans feuille ouverte (la feuille de la dépense est fermée après
  « Confirmer » ; une autre feuille ouverte la retarde jusqu'à sa fermeture) ; « Renvoyer » fait `setActiveTab('finances')` puis
  `setFinanceOpenRequest(...)`, testé jusqu'à la dépense ouverte ; vues exclues (`wizard`, `hopV55`) nommées, elle y apparaît à la sortie.
  Sa forme reste provisoire jusqu'à son choix sur p3 (D237 n° 6).
- **T5, hors ligne, l'écran se ferme aussi** (Conception M2, Prêt 17) : si le navigateur est hors ligne et que l'écriture de la dépense est en
  file locale (`pending`), la feuille se ferme sans attendre l'accusé ; un refus plus tard passe par le bandeau d'écriture existant et met le
  job en `voided` (T1). En ligne, « ferme en moins de 2 s ». Les deux écrits dans les cas Chrome.
- **T6, reprise sur événements** (Conception D3, M3, Prêt 7 b et c) : pas d'échelle de minuteries ; reprise au démarrage, `online`, `focus`,
  `visibilitychange`, 30 s au moins entre deux essais ; un essai ne compte que si une requête a atteint un serveur ; `functions/*`
  transitoires et session non restaurée = passagers, jamais `failed` ; `failed` après 6 échecs passagers sur des réveils distincts, ou 2
  pour une erreur inconnue. Alerte d'attente à 48 h gardée.
- **T7, pas de mode patient dans `financeDocuments.ts`** (Conception D2, Prêt 7 a) : `financeDocuments.ts` reste hors du périmètre ; la file
  rappelle `saveFinanceDocumentConfirmed` sur `drive/in-progress` jusqu'au résultat.
- **T8, l'écriture du lien** (Prêt 8, Conception M4) : relire la dépense (serveur si possible), puis
  `updateTransaction({...current, finance: {...current.finance, proofDocumentId, proofUpload: undefined}})` ; ne rien écrire si l'écriture
  initiale est refusée ou pas encore confirmée (attendre son accusé) ; si un `proofDocumentId` est déjà posé, ne pas l'écraser (job
  `voided`, orphelin noté) ; `permission-denied` = relire et réessayer une fois ; toute écriture sur une dépense annulée est attrapée.

## 9. Où chaque constat de la revue est corrigé

| Constat | Où |
|---|---|
| Conception B1 / T3 | § 0, § 2.0 (`fileNo`), § 2.4, § 3 « Autre fichier », test `envoi` + Chrome 8 |
| Conception B2, Prêt 1 / T1 | § 0, § 2.2 (préconditions, 1 (d)), § 3, tests `envoi`, Chrome 9 |
| Conception M1, D6, Prêt 2, 12 / T2 | § 0, § 2.0 (type unique), § 3, § 2.3, tests `envoi` (J+29/J+31) |
| Conception M2, Prêt 17 / T5 | § 2.1 (7), § 3, Chrome 5 |
| Conception M3, Prêt 7 b c / T6 | § 2.2 (réveils, table), tests `echecs`, Chrome 10 |
| Conception M4, Prêt 8 / T8 | § 2.2 étape 4, § 3, tests `envoi` |
| Conception M5 | § 2.4, test `renvoi`, Chrome 11 |
| Conception M6, Prêt 5 | § 4.2 (liste fichier par fichier), § 0 (contrat), `contrat-synchrone` |
| Conception D1, Prêt 13 | § 0 (Brouillon) |
| Conception D2, Prêt 7 a / T7 | § 0, § 2.2 étape 3, § 5 (non touchés) |
| Conception D3 / T6 | § 2.2 |
| Conception D4 | § 2.1 (3), § 3 |
| Conception D5, Prêt 4 / T4 | § 2.3 |
| Conception D7 | § 2.2 (bascule `failed`→`queued`) |
| Conception D8, Prêt 11 | § 0, § 5 (`TransactionJournal.tsx:194-195`, limite d'export) |
| Conception D9, Prêt 9 | § 4 (point d'injection), `confirmer.test.ts` |
| Conception D10, Prêt 18 | § 4.2 (cas Chrome 1 à 11, réglages du banc à ajouter) |
| Prêt 3 | § 2.4 (6), § 3 « Même justificatif deux fois » |
| Prêt 6 | § 2.1 (5) |
| Prêt 10 | § 2.3 (`src/components/tabs/FinancesTab.tsx:125-134`) |
| Prêt 14 | § 0 (chaîne `data:`) |
| Prêt 15 | § 4 (`// @vitest-environment jsdom`) |
| Prêt 16 | § 4 (rien à l'import) |

## 10. Écarts et précisions écrits avant le code (voie d3c-drive-code, 01.11)

Les huit précisions des secondes lectures (REVUE-conception.md et REVUE-pret.md, « Seconde lecture (v2) »), retenues telles quelles. Rien d'autre ne change au § 0 à § 9.

1. **Dépense annulée jamais lue par la notification.** `proofUploadStatus` ignore toute dépense dont `finance.voidedAt` est posé, quel que soit son `proofUpload` ; un job `voided` n'alerte jamais non plus.
2. **`drive/auth-required` = motif `auth`.** Toute erreur de ce code, qu'elle vienne d'un jeton `null`, d'une session pas encore restaurée avec utilisateur présent ou d'un 401 de Drive, donne `failed` `auth` et « Reconnecter Drive » (file arrêtée). Seul l'absence de session Firebase (`getCurrentUser()` nul) reste une précondition : rien n'est tenté.
3. **Délai minimal avant `failed network`.** Constante `TRANSIENT_MIN_SPAN_MS = 2 h` : six échecs passagers sur six réveils distincts ne suffisent pas, il faut aussi que le dernier tombe au moins 2 h après le premier (`firstFailureAt` sur le job). Choix du pilote, constante réglable.
4. **« Abandonner » d'un job sans dépense** : sur la notification « sans dépense » elle-même (bouton « Abandonner » de cette variante), puisque aucune fiche n'existe. Job `voided` `abandoned`, fichier gardé 30 jours.
5. **Test hors ligne** : accepte `queued` et `pending` comme états de la dépense pendant la coupure (le suivi de l'écriture varie selon l'instant).
6. **Code nu `unavailable`** de `saveFinanceDocumentConfirmed` (Firestore ou réseau, `financeDocuments.ts:53-58`) : dans la table des échecs, genre **passager** (compté, `failed network` après 6 réveils distincts et 2 h). Hors ligne déclaré (`navigator.onLine===false`) : aucun essai, rien de compté (précondition d'attente). `onLine` ne sert qu'à ne pas tenter ; il ne décide jamais d'un comptage.
7. **Prédicat « feuille ouverte »** : `document.querySelector('[role="dialog"],[role="alertdialog"]')` (comme `Sheet.tsx:88` et `App.tsx:200`).
8. **Chemins corrigés** : `tests/integration/taxArchive.test.ts`, `tests/integration/backupTransfer.test.ts`, `tests/integration/taxWorkspace.test.tsx` (et non `tests/unit/`). Témoin `confirmer.test.ts` : avec `saveFinanceDocumentConfirmed` simulé qui ne répond jamais, HEAD ne lève pas `drive/in-progress` à 15 s (le simulé remplace `waitForOriginal`) ; le test est rouge parce que l'appel ne rend jamais (le temps factice avance de 1 s, l'appel attend toujours Drive).

Écarts constatés au code :
- **`TransactionJournal.tsx:194-195`** : une dépense `queued` ou `failed` n'a pas de `proofDocumentId` ; les filtres « Sans justificatif » et « À compléter » la comptent donc déjà sans justificatif. Le prédicat devient une fonction nommée `sansJustificatif(t)` (même comportement, intention écrite, testée), sans autre changement.
- **`DriveConnection.tsx`** n'est pas modifiable ici (hors « Possède ») et son libellé est « Connecter Drive ». La notification et la fiche portent donc leur propre bouton « Reconnecter Drive », qui appelle les mêmes `FirebaseAuthService.prepareGoogleLogin` puis `refreshDriveAccess`.
- **Lecture « serveur » du lien (T8)** : `FirestoreRepo.waitForDocument` (lecture serveur de ce document, `firestoreRepo.ts:277-296`), repli sur le cache ; aucun import direct de `firebase/firestore` dans la file.
- **Délai de 30 s entre deux essais (§ 2.2), précisé en codant, après le premier essai du banc Chrome** : il ne retient un job que dans la même vie de page (`lastLife`) et seulement si l'essai précédent a atteint un serveur (`waited` faux). Raison : sans minuterie, un rechargement de page ou un retour du réseau moins de 30 s après un essai raté faute de réseau laissait le job attendre un événement qui ne venait pas (banc : « rechargement en plein envoi » restait sans lien après 240 s). Les échecs comptés (5xx, quota, inconnue) restent espacés de 30 s ; le comptage par réveil et le délai de 2 h sont inchangés. Testé (`envoi.test.ts`).
- **Statut d'écriture accepté pour la fermeture hors ligne** : `pending` et `queued` (`FirestoreRepo` pose `queued` à l'enregistrement dans la file des écritures ; précision n° 5).
- **Place de la notification** : au-dessus de la barre de navigation (`bottom: var(--main-navigation-height) + 0,5 rem`), pas sur elle (forme provisoire, D237 n° 6).
- **Banc Chrome** : le cas `drive-fond` saisit à la main (lecture refusée par le banc) avec des PDF synthétiques distincts, parce que l'empreinte d'un document fait l'identité d'un achat (`purchase-<hash>`) : six documents rejoués ne suffisaient pas à sept dépenses. « Reconnecter Drive » : la fenêtre Google ne peut pas s'ouvrir dans le banc (requêtes hors localhost bloquées) ; la reconnexion est factice, par l'appel même du bouton (`requeueAfterReconnect`).
