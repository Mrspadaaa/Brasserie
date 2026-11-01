# PLAN — d3-drive-fond : l'envoi au Drive en arrière-plan, et l'échec qui ramène à la facture

Auteur : Sonnet. **Aucune ligne de code écrite.** Date : 01.11. Décision : D235 (« Drive : envoi après "Confirmer", en arrière-plan, rien à
l'écran tant que ça marche ; un échec = grosse notification qui ramène à la facture (renvoyer le justificatif, reconnecter Drive) »).
Lu : VOIE.md, `diagnostic/d2/DIAGNOSTIC.md` (DR1 à DR5, LE5), `voies/s2-enregistrement/PLAN.md`, et le code d'aujourd'hui (chemins et
lignes cités). Aucun Drive, aucun Gemini, aucun serveur, aucun commit.

## 0. Ce que le plan tranche (et pourquoi), en tête

| Point | Choix | Pourquoi |
|---|---|---|
| Où vit le fichier avant l'envoi | **IndexedDB** (Dexie, base `laffinee-justificatifs`, table `envois`), le fichier en `ArrayBuffer` | Le fichier fait jusqu'à 4 Mo (`MAX_DRIVE_ORIGINAL_BYTES`, `driveFileStore.ts:51`) : `localStorage` (≈ 5 Mo, déjà utilisé pour les identifiants de reprise, `:57,204-214`) ne le tient pas. Dexie est déjà une dépendance (`package.json:36`). Je n'ai trouvé **aucun brouillon de dépense persisté** (aucun `localStorage`, `Dexie`, `setUiState` dans `ExpenseSheet.tsx`, `purchaseEntry.ts`, `purchasePrefill.ts`) : « brouillon » = la feuille ouverte (`useState`, `ExpenseSheet.tsx:87`). Les seuls Dexie du dépôt sont ceux des houblons. Cette file est donc la première persistance d'un justificatif. |
| Où vit l'état durable sur la dépense | Champ facultatif **`finance.proofUpload`** `{ state:'queued'\|'failed', reason?, at, attempts? }`. **`proofDocumentId` n'est posé qu'à la réussite.** | Tous les lecteurs de `proofDocumentId` supposent que le document `financeDocuments/proof-…` existe : `DocumentProofLink.tsx:21` (`loadFinanceDocument`), la sauvegarde ZIP (`functions/src/backupTransfer.ts:236-245`, `documentIds`), `ledger.ts:145` (compte des justificatifs manquants), `annual.ts:133,150`, `taxArchive.ts`. Le poser avant l'envoi fabriquerait des références mortes partout. Posé après, une dépense en attente est comptée « sans justificatif » (c'est vrai : le fichier n'est pas dans Drive) et apparaît sous le filtre « Sans justificatif » (`TransactionJournal.tsx:48`). Le champ voyage par Firestore : l'échec se voit aussi depuis un autre appareil. |
| Règles Firestore, fonctions | **Aucun changement** | `updatedTransactionGuard` (`firestore.rules:99-108`) ne liste aucun champ de `finance` : l'ajout d'un champ passe (précédent : `proofOriginalFileName`, `paymentDateBasis`, ajoutés sans règle). `grep` de `functions/src` : aucune liste blanche des champs de `finance`. |
| Périmètre | **Achats** (`ExpenseSheet`, `savePurchaseWithProofReceipt`) seulement | Ventes (`incomeEntry.ts:31`), avoirs, clôture fiscale (`financeService.ts:166`, `TaxClosingSheet.tsx:61`) restent synchrones : une clôture scellée exige l'original confirmé (`confirmOriginal`). La file est écrite pour un `documentId` quelconque, donc extensible plus tard sans refonte. |
| Dépense annulée avant l'envoi | **L'envoi est abandonné, le fichier local effacé** | `updatedTransactionGuard` refuse toute écriture sur une dépense annulée (`before.finance.voidedAt == null`, `firestore.rules:100`), et `StorageService.updateTransaction` lève (`storage.ts:535`). Le lien ne pourrait jamais être posé : le fichier partirait orphelin dans Drive. Dit au brasseur dans la fiche (« Écriture annulée »), pas en notification. |

## 1. Aujourd'hui, lu dans le code

**Quand l'envoi part.** Au clic « Confirmer et enregistrer » : `save` (`ExpenseSheet.tsx:276-294`) → `savePurchaseWithProofReceipt`
(`purchaseEntry.ts:354-371`) : validation, catalogue des houblons, puis `confirmProof` (`:388`) → `saveFinanceDocumentConfirmed`
(`financeDocuments.ts:72`) → `confirmOriginal` (`:76-141`) → `uploadDriveOriginal` (`driveFileStore.ts:299-395`) ; **seulement après**, `savePurchase`
(`purchaseEntry.ts:443`), qui refuse sans cette confirmation (`:453`, `confirmedProofs`). L'ordre « Drive d'abord, dépense ensuite » est un invariant testé.

**Il retient l'écran.** `saveLocked`, `setSaving(true)` (`ExpenseSheet.tsx:281`) ; le champ du formulaire est désactivé (`fieldset disabled`, `:531`) ;
« Fermer » désactivé (`:501`, `disabled={busy||saving}`) ; le pied dit « Envoi au Drive · N Mo » (`:585`). Après la réussite, un reçu reste
à l'écran jusqu'à « Terminé » (`setDone`, `:291`, `:584-586`, `receiptSentence`, `:54`) : c'est le résultat de DR1, **en contradiction avec
D235** (« rien à l'écran tant que ça marche ») : voir § 5, tests à réécrire.

**L'attente est bornée à 15 s, pas l'envoi.** `waitForOriginal` (`financeDocuments.ts:46-51`) rejette avec `drive/in-progress` au bout de 15 s ; le
travail continue (`pendingOriginals`, `:45,137-140`). L'écran affiche alors « Envoi … en cours » (`proofSending`, `ExpenseSheet.tsx:506`) et le brasseur doit
retoucher « Confirmer ». Chaque requête Drive a sa propre coupure à 45 s (`driveFileStore.ts:92`) ; un 401 déclenche un renouvellement silencieux
(`:95-98`).

**Ce qui se passe à l'échec** (rien n'est écrit, tout reste dans la feuille ouverte) :

| Cause | Code d'erreur | Message / lieu (aujourd'hui) | Repris ? |
|---|---|---|---|
| Hors ligne | `unavailable` posé par `offlineOriginalError` (`financeDocuments.ts:53-58`), reformulé par `confirmProof` (`purchaseEntry.ts:394-395`) | « Hors connexion : le justificatif n'a pas pu être envoyé… » dans le cadre d'erreur de la feuille (`:507`) | Non : reclic à la main |
| Jeton absent / expiré (après un renouvellement) | `drive/auth-required` (`driveFileStore.ts:73,80,84,117`) | message + `DriveConnection always` (`ExpenseSheet.tsx:509,292`) | Non |
| Drive déconnecté (consentement jamais donné, `functions/failed-precondition` → jeton `null`, `firebaseAuth.ts:117-119`) | `drive/auth-required` | idem | Non |
| Quota Drive plein | `drive/quota` (`:118-119`) | message dans la feuille | Non |
| Débit limité | `drive/rate-limit` (`:120-121`) | idem | Non |
| Accès refusé / introuvable | `drive/forbidden`, `drive/not-found` (`:122-123`) | idem | Non |
| Réseau coupé en cours d'envoi | `drive/network` (`:102`), `drive/unavailable` (`:124`) | idem ; la reprise est automatique **dans la même session** au clic suivant (identifiant réservé `proof-<submissionId>`, session d'envoi `sessions`, `:339-361`) | Au clic seulement |
| Fichier trop lourd / format | `drive/invalid-file` (`:265,269-281`) | **jamais atteint** : `attach` refuse > 4 Mo et les formats hors JPG/PNG/WebP/PDF avant tout envoi (`ExpenseSheet.tsx:249`) | — |
| Fichier changé sur Drive | `drive/integrity` (`:229,291`) | message | Non |

**Où l'échec se voit.** Seulement dans la feuille de saisie, tant qu'elle est ouverte. Le toast global de l'App disparaît seul après 4 s et n'a
pas d'action (`App.tsx:409-412,845-850`). Le bandeau persistant `writeError` (`App.tsx:832-843`) et `PersistenceStatus` (`src/ui/PersistenceStatus.tsx`,
monté `App.tsx:852`) ne parlent que des écritures **Firestore**, jamais de Drive. Fermer la feuille ou recharger la page perd le fichier
(aucune copie locale hors de la mémoire de la feuille).

**Ce qui est déjà solide et se réutilise.** Envoi idempotent : identifiant réservé avant les octets, reprise par morceaux, recherche par
`appProperties.documentKey`, `navigator.locks` entre onglets (`driveFileStore.ts:168-172,311,316`), `pending`/`pendingIds` (localStorage pour l'identifiant). Un
original déjà confirmé se recoupe sans téléchargement (`financeDocuments.ts:96-111`). Résultat : un second envoi du même `documentId` ne crée
**pas** de doublon dans Drive (tests existants « resumes confirmed chunks », « recovers a lost final acknowledgement »).

## 2. Le parcours voulu

### 2.1 « Confirmer » : enregistrer, fermer, envoyer plus tard

1. **Validation** inchangée (`validatePurchaseCommit`, `purchaseEntry.ts:335`). Le doublon par empreinte `purchase-<documentHash>` reste (`:337-339`) : même fichier, deux dépenses = refusé, donc pas de second envoi du même contenu.
2. **Mise en file durable (avant toute écriture de dépense)** : `enqueueProof(job)` écrit dans IndexedDB et ne rend la main que quand la transaction IDB est terminée.
   Le job : `{ submissionId, transactionId:'TX-<id>', documentId:'proof-<id>', driveName (nom lisible, `driveProofFileName`, `purchaseEntry.ts:170`), originalName, mimeType, year (année de la facture), sha256, bytes, data, state, attempts, nextAt, lastFailure?, createdAt }`.
3. **Écriture de la dépense** avec `finance.proofUpload={state:'queued',at}` et `sourceDocumentHash` (`savePurchase`, `:443-499`). Le garde `confirmedProofs` (`:453`) accepte « un job en file de même empreinte » à la place de « original confirmé ». `proofDocumentId` absent ; `proofFileName` = nom lisible prévu ; `proofOriginalFileName` inchangé.
4. **`confirmPurchase`** (attente de l'accusé Firestore, `:428-442`) : inchangée. Puis **`onSaved()` et fermeture immédiate** : plus d'état `done`, plus de reçu à l'écran.
5. **Départ de la file** sans l'attendre : `void runProofQueue()`.
6. **Repli sans perte** : si IndexedDB est indisponible (navigation privée, quota) ou si l'écriture du job échoue, `savePurchaseWithProofReceipt` suit **exactement le chemin d'aujourd'hui** (Drive d'abord, dépense ensuite). Le brasseur n'a pas la nouvelle vitesse mais ne perd rien. Idem au-delà du plafond de la file (20 envois ou 60 Mo en attente).

### 2.2 L'envoi (la file)

- **Un seul travailleur** à la fois, pour toute l'app : `navigator.locks.request('laffinee-file-justificatifs', { ifAvailable:true })` (repli sans verrou : un drapeau de module). Premier entré, premier servi (`createdAt`).
- **Pour un job** : (a) relire la dépense (`StorageService.getTransactions`) : absente → abandon (§ 3) ; annulée → abandon ; (b) jeton : `FirebaseAuthService.ensureDriveAccessToken()` (silencieux, jamais de fenêtre) ; `null` → échec `auth` ; (c) `confirmOriginal` en **mode patient** (voir § 5, `financeDocuments.ts`) : sans la coupure de 15 s, avec les mêmes contrôles de taille et d'empreinte ; (d) **relire la dépense** (elle a pu être modifiée pendant l'envoi) et poser le lien comme `attachProofToPurchase` (`purchaseEntry.ts:420-424`) : `proofDocumentId`, `proofFileName` = nom que Drive rend, `proofUpload` retiré ; attente de l'accusé (`waitForDocument`, 15 s, comme `:424`) ; (e) **seulement alors** effacer le job et le fichier d'IndexedDB.
- **Réussite** : la dépense « porte son lien » (`proofDocumentId` → `financeDocuments/proof-…` → `driveFileId`). Rien à l'écran, aucune notification. Le reçu (dossier, nom, empreinte) reste lisible à la demande par `purchaseProofReceipt` (`:376`) / `loadDriveProofReceipt` (`financeDocuments.ts:151`), pour la fiche de la dépense.
- **Reprise et essais.** Une cause se classe en **passagère** ou **à traiter par le brasseur** :

| Genre | Causes (code) | Conduite |
|---|---|---|
| Attente réseau | hors ligne (`navigator.onLine===false`, `unavailable`) | État `queued`. **Pas un essai** compté, pas de notification. Reprise sur `online`, `visibilitychange`, `pageshow`, `focus` (même jeu d'événements que `FirestoreRepo.startSync`, `firestoreRepo.ts:522-531`) et à l'ouverture de l'app. |
| Passagère | `drive/network`, `drive/unavailable`, `drive/rate-limit`, `drive/in-progress` (jamais en mode patient), 5xx | **6 essais au plus** (1 + 5 reprises) à 30 s, 2 min, 10 min, 1 h, 6 h (`nextAt` en base, donc reprise après fermeture). Un essai ne compte que si le réseau était là. Le 6e échec : état `failed`, motif `network`. |
| Reconnexion | `drive/auth-required`, jeton `null` | `failed` **tout de suite**, motif `auth` ; **toute la file s'arrête** (même cause pour tous). Reprise après « Reconnecter Drive » réussi. |
| Place | `drive/quota` | `failed` tout de suite, motif `quota` ; file arrêtée. Reprise par « Renvoyer » après avoir libéré de la place. |
| Droits | `drive/forbidden` | `failed`, motif `forbidden` ; file arrêtée (même compte pour tous). |
| Dossier / fichier | `drive/not-found` | **un** essai de plus (le cache des dossiers est vidé, `driveFileStore.ts:357`), puis `failed` motif `not-found`. |
| Le fichier lui-même | `drive/invalid-file`, `drive/integrity`, id déjà pris par un autre contenu | `failed` motif `file`; **le job suivant continue**. |
| Autre | toute erreur inconnue (Firestore refuse le lien, etc.) | `failed` motif `unknown`, message brut français conservé, jamais avalé. |

- **L'échec devient visible et durable.** Au passage en `failed`, le travailleur écrit sur la dépense `finance.proofUpload={state:'failed',reason,at,attempts}` (merge sur la dépense relue ; hors ligne, Firestore met l'écriture en file). Le job local garde `lastFailure` avec le message.

### 2.3 La notification (point d'accroche seulement ; la forme est un axe de p3)

- **État global** : un petit magasin observable `proofUploadStatus` (`subscribe` / instantané, sur le modèle de `FirestoreRepo.subscribe`, `PersistenceStatus.tsx:6-8`), qui réunit
  (1) les dépenses dont `finance.proofUpload.state==='failed'` (lues dans Firestore : visibles depuis tout appareil, et survivent à la perte du stockage local),
  (2) celles en `queued` depuis plus de **48 h** (« en attente depuis N jours » : l'attente n'est pas un échec mais ne doit pas durer sans que ça se sache),
  (3) les jobs locaux en `failed`.
  Une dépense `queued` récente, ou en attente de réseau, n'alerte pas.
- **Composant** : `<ProofUploadNotice />`, **monté dans `App.tsx` à côté de `<PersistenceStatus />`** (`App.tsx:852`), **hors** du commutateur de vues, donc visible partout comme le bandeau `writeError` (`:832`, `z-[60]`), **persistant** (jamais le toast de 4 s, `:409-412`), non dissimulable par un changement d'onglet ; fermable seulement par une action qui règle la cause, ou « Plus tard » qui le réduit sans effacer l'état (il revient au prochain démarrage). Une seule notification pour N dépenses (« 2 justificatifs à renvoyer »).
- **Actions** :
  - **« Renvoyer le justificatif »** : `setFinanceOpenRequest({id, at:Date.now()})` (`App.tsx:212,691`) ouvre l'onglet Finances sur la dépense (`FinancesTab.tsx:125-134` → fiche `TransactionDetails`). La fiche reçoit un bloc « justificatif à renvoyer » (près de `DocumentProofLink`, `TransactionDetails.tsx:46`) : motif en clair, bouton **Renvoyer maintenant** (fichier local présent : relance le job ; absent : sélecteur de fichier, puis nouveau job remplaçant l'ancien), et, si le motif est `auth`, `DriveConnection` (`DriveConnection.tsx`, déjà écrit : prépare la fenêtre Google avant le clic pour que le téléphone l'autorise).
  - **« Reconnecter Drive »** : dans la notification elle-même quand le motif est `auth` (composant `DriveConnection compact`) : après `refreshDriveAccess` réussi, `runProofQueue()` reprend toute la file.
  - **« Abandonner »** (dans la fiche, pas dans la notification) : efface le job et le fichier local, retire `proofUpload` ; la dépense reste « sans justificatif » (honnête). Jamais fait seul.
- Si le brasseur est **dans la feuille de saisie** au moment de l'échec (il enchaîne une autre dépense), la notification s'affiche quand même par-dessus : c'est le but de l'« état global ».

## 3. Les cas

| Cas | Conduite voulue |
|---|---|
| **Fermeture de l'app pendant l'envoi** | Le job est en `sending` dans IndexedDB. Au démarrage suivant, un job `sending` sans verrou tenu depuis plus de 2 min repasse `queued`, sans compter l'essai. L'envoi **repart du début** (la session d'envoi en reprise est en mémoire, `sessions`, `driveFileStore.ts:61`) mais **n'ajoute rien dans Drive** : l'identifiant réservé (`localStorage`, `:204-214`) et la recherche `documentKey` (`:316`) retrouvent le fichier s'il est déjà complet. Limite dite : iOS suspend un onglet en arrière-plan ; l'envoi reprend au retour au premier plan. Pas d'API Background Sync (absente d'iOS). |
| **Fermeture entre « envoi Drive fini » et « lien posé »** | Au redémarrage, `confirmOriginal` trouve le document `financeDocuments/proof-…` déjà confirmé et le recoupe localement (empreinte, octets, type ; `financeDocuments.ts:96-111`) : pas de nouvel envoi, le lien est posé. |
| **Deux dépenses en file** | Ordre d'arrivée, un envoi à la fois. Une cause commune (`auth`, `quota`, `forbidden`) arrête la file et **une seule** notification parle des deux ; une cause propre au fichier (`file`) passe au suivant. |
| **Même justificatif envoyé deux fois** | Quatre barrières : (1) `documentId` = `proof-<submissionId>` fixe, un job par `submissionId` (clé primaire) ; (2) verrou du travailleur entre onglets ; (3) `uploadDriveOriginal` : `pending`/`pendingIds`/`withLock`/recherche par `documentKey`, aucun doublon dans Drive (déjà testé) ; (4) « Renvoyer » pendant un envoi en cours est sans effet (état `sending`). Le même fichier sous une **autre** saisie est refusé avant (`purchaseEntry.ts:337-339`). |
| **Dépense supprimée / annulée avant l'envoi** | Absente de la base (écriture refusée puis rejouable, `replayable`, `:328-329,436-439`) ou annulée (`voidedAt`) : le job est abandonné **avant** tout appel Drive ; fichier effacé ; aucune notification. Un test vérifie « 0 appel Drive ». |
| **Fichier gardé où, combien de temps, effacé quand** | IndexedDB de l'appareil, en `ArrayBuffer` : **gardé jusqu'à ce que le lien soit confirmé** (§ 2.2 e). Effacé aussi par « Abandonner », par l'annulation de la dépense, et **après 30 jours en `failed`** (alors la dépense passe à `reason:'expired'` : « fichier local effacé, joindre à nouveau »). Jamais envoyé à Gemini ni à un serveur ; aucune donnée réelle dans les tests. Plafond : 20 envois ou 60 Mo, au-delà le chemin synchrone d'aujourd'hui. |
| **Un autre appareil voit l'échec** | Il lit `finance.proofUpload.state==='failed'` dans Firestore. N'ayant pas le fichier, « Renvoyer » y ouvre directement le sélecteur de fichier (nouvelle mise en file avec le même `documentId`). Jamais d'alerte pour un `queued` récent d'un autre appareil. |
| **Brasseur modifie la dépense pendant l'envoi** | Le lien se pose sur la dépense **relue** juste avant (comme `purchaseEntry.ts:420-422`), jamais sur l'instantané de la mise en file. Si elle a été annulée entre-temps : abandon. |
| **Hors ligne à « Confirmer »** | Aujourd'hui : refus (« rien n'est enregistré »). Demain : la file reçoit le fichier ; la dépense s'écrit comme n'importe quelle dépense sans justificatif, et l'envoi attend le réseau. Limite : `confirmPurchase` attend l'accusé du serveur jusqu'à 15 s (`purchaseEntry.ts:431`) ; hors ligne, il rend « à confirmer » comme pour toute dépense : **ce n'est pas changé ici**. |
| **Drive jamais connecté** | Le jeton n'est vérifié qu'à l'envoi (pas au montage sans justificatif, `6391816f`). Une dépense sans justificatif ne déclenche aucun appel (file vide). Avec justificatif : la file demande le renouvellement silencieux ; sans consentement, échec `auth` à l'envoi, donc notification. La feuille peut continuer à afficher « Drive à connecter » avant le clic (DR3), mais ne bloque plus. |
| **Compte changé** | `driveFileStore.session` refuse si l'`uid` diffère (`:79-80`) : échec `auth`. Les jobs portent l'`uid` ; un job d'un autre compte n'est jamais envoyé (il attend le bon compte). |

## 4. Les tests (L13) : écrits d'abord, échouent sur le code d'aujourd'hui

Tout est en `tests/unit/depense/drive-fond/` sauf mention. La file reçoit un **adaptateur de stockage** (`FileStore` : `put/get/list/delete`) : en test, une mémoire ; en
production, Dexie. Il n'y a ni `fake-indexeddb` ni test IndexedDB dans le dépôt (`grep` des dépendances et des tests) : ne rien ajouter (voir § 6) ; la couche Dexie se prouve dans Chrome.
Drive, Firestore et le temps sont factices ; aucun Gemini.

| Fichier | Ce qui est affirmé | Échec aujourd'hui |
|---|---|---|
| `file.test.ts` | `enqueueProof` écrit avant de rendre ; un nouveau module (rechargement simulé) relit les jobs ; un job par `submissionId` ; ordre d'arrivée ; plafond 20 / 60 Mo → refus typé | module absent |
| `echecs.test.ts` | Table cause → genre → conduite : chaque code `DriveFileError` (`auth-required`, `quota`, `rate-limit`, `forbidden`, `not-found`, `network`, `unavailable`, `invalid-file`, `integrity`), `unavailable` hors ligne, jeton `null`, erreur inconnue | module absent |
| `envoi.test.ts` (temps factice) | **Réussite** : lien posé (`proofDocumentId`, `proofFileName` lu sur Drive), `proofUpload` retiré, job et fichier effacés **après** l'accusé ; si l'accusé échoue, le fichier reste. **Hors ligne** : aucun essai compté, reprise à `online`. **Passagère** : reprises à 30 s, 2 min, 10 min, 1 h, 6 h puis `failed` motif `network` au 6e. **`auth`** : `failed` immédiat, 2e job non tenté, reprise après reconnexion. **`quota`**, **`forbidden`** idem. **`file`** : le job suivant part. **Deux dépenses** : ordre et un seul envoi à la fois. **Même `documentId` deux fois** (deux travailleurs simultanés) : `uploadDriveOriginal` appelé 1 fois. **Dépense absente / annulée** : 0 appel Drive, fichier effacé. **Dépense modifiée pendant l'envoi** : le lien se pose sur la version relue. **Job `sending` périmé** : repasse `queued`, essai non compté. **30 jours** : `expired`. | module absent |
| `confirmer.test.ts` (`purchaseEntry` réel ; `financeDocuments`/Drive simulés) | Drive qui **ne répond jamais** : `savePurchaseWithProofReceipt` rend en moins de 1 s (temps factice), la dépense existe avec `finance.proofUpload.state==='queued'` et **sans** `proofDocumentId`, `uploadDriveOriginal` pas attendu. Écriture IDB qui échoue → chemin synchrone d'aujourd'hui (Drive d'abord, dépense ensuite ; les tests M6 « hors connexion » restent verts). Même empreinte sous une autre saisie → refus inchangé. Le garde `:453` accepte le job en file. | l'appel attend Drive 15 s puis lève |
| `notification.test.tsx` (jsdom, `tests/integration/` pour l'environnement) | `ProofUploadNotice` : `failed` dans Firestore → rôle `alert`, **toujours là après 10 s** (≠ toast de 4 s) ; N dépenses → un seul bandeau « N justificatifs » ; motif `auth` → bouton Drive ; « Renvoyer » appelle `setFinanceOpenRequest` avec l'id de la dépense ; `queued` récent / attente réseau → rien ; `queued` > 48 h → bandeau d'attente | composant absent |
| `fiche.test.tsx` | `TransactionDetails` d'une dépense `failed` : motif lisible, « Renvoyer maintenant » (fichier local → relance le job ; absent → sélecteur de fichier), « Abandonner » (retire l'état, la dépense reste « sans justificatif ») ; `DocumentProofLink` n'est montré qu'avec `proofDocumentId` | bloc absent |
| `feuille.test.tsx` | `ExpenseSheet` : après « Confirmer » avec justificatif, `onClose` est appelé sans attendre Drive, aucun texte « Envoi au Drive » ni « Justificatif rangé » | `done` + reçu à l'écran |

**Contrôle Chrome sur fixtures** (le banc existe : `scripts/check-invoice-journey-emulator.mjs`, vraie App sur émulateurs, **Drive factice dans la page** par enveloppe de `fetch`, aucune requête hors localhost). Nouveau cas `drive-fond`, joué à **390 tactile** puis **1280**, captures **ouvertes** (L12) :
1. Drive factice **lent** (10 s par requête) : « Confirmer » → la feuille se ferme en moins de 2 s (mesure) ; la dépense est dans la liste ; aucune notification.
2. Drive factice répond **403 `storageQuotaExceeded`** → la notification apparaît, sur l'onglet Finances **et** sur le tableau de bord ; le texte dit la cause ; elle persiste après 10 s.
3. « Renvoyer le justificatif » → la fiche de **cette** dépense s'ouvre (id vérifié dans l'interface) ; le Drive factice repasse en succès ; « Renvoyer maintenant » → plus de notification, `Justificatif` s'ouvre (`DocumentProofLink`), **un seul fichier** dans le Drive factice.
4. `auth` (jeton refusé) : « Reconnecter Drive » visible dans la notification ; le clic appelle la reconnexion factice puis la file repart.
5. Réseau coupé (`context.setOffline`) puis rétabli : aucune notification pendant la coupure, envoi à `online`.
6. Rechargement de la page en plein envoi : au démarrage la file reprend, un seul fichier dans le Drive factice.
Le banc (`scripts/`) n'est pas dans mon Possède : le pilote l'assigne à la voie de code.

**Témoin avant (L13)** : `confirmer.test.ts` et le cas Chrome 1 sont lancés sur HEAD **avant** tout code, leur échec est la sortie de départ.

## 5. Fichiers touchés et risques

**Nouveaux** (`src/services/`) : `proofQueue.ts` (file : jobs, travailleur, reprise, classement des échecs), `proofQueueStore.ts` (adaptateur Dexie + adaptateur mémoire pour les tests), `proofUploadStatus.ts` (magasin observable). (`src/ui/finance/`) : `ProofUploadNotice.tsx` (le point d'accroche ; **forme choisie par le brasseur** sur les maquettes p3), bloc « justificatif à renvoyer » dans `TransactionDetails.tsx`.

**Modifiés** :
- `src/services/purchaseEntry.ts` : `savePurchaseWithProofReceipt` (mise en file à la place de `confirmProof`, repli synchrone), garde `:453`, `savePurchase` écrit `finance.proofUpload` ; `attachProofToPurchase` reste le chemin « fichier perdu, nouveau fichier ».
- `src/services/financeDocuments.ts` : `saveFinanceDocumentConfirmed(…, { patient:true })` sans la course de 15 s (`:46-51`) ; le reste inchangé.
- `src/domain/finance/types.ts` : `TransactionFinance.proofUpload?` (facultatif).
- `src/ui/finance/ExpenseSheet.tsx` : fermeture immédiate, retrait de `done`/reçu (`:132,291,584-586`), de `proofSending` pour ce chemin ; **c'est un écran du brasseur** (D235 : base r2b « telle qu'elle est dans l'app »). Le registre `ecrans.json` ne contient pas d'entrée « dépense » (recherche : aucune) ; la voie code ne touche pas à la mise en page de r2b, seulement au comportement du pied (« Terminé » retiré). À faire confirmer par `controle-choix.mjs` au port.
- `src/App.tsx` : monter `<ProofUploadNotice />` à côté de `<PersistenceStatus />` (`:852`), démarrer la file au montage (après connexion). `src/ui/finance/TransactionJournal.tsx` : distinguer « envoi en cours / à renvoyer » dans le filtre « Sans justificatif » (`:48`).

**Tests existants à réécrire (ils figent le comportement synchrone)** : `tests/unit/depense/raccord/ecran-recu.test.tsx` (reçu à l'écran, DR1), `rattachement-en-cours.test.ts` (message « Envoi en cours » de la feuille, `purchaseEntry.ts:384-386`), `tests/unit/depense/enregistrement/justificatif-nom.test.ts` et `justificatif-persistance.test.ts` (Drive d'abord), `purchaseEntry.test.ts` (garde « Confirme d'abord l'envoi »). Rejoués avant/après : `driveFileStore.test.ts` (18, inchangés : `driveFileStore.ts` n'est pas touché), `financeDocumentPersistence.test.ts`, `incomeEntry.test.ts`, `taxWorkspace.test.tsx`. Le pilote tranche la liste avant le code (règle COMMUN.md : un test hors Possède reste vert sans être modifié).

**Schéma, règles, fonctions.** Schéma Firestore : **un champ facultatif ajouté** sur `transactions.finance` ; aucun champ retiré, aucune migration, une dépense d'avant reste lisible (champ absent = pas d'envoi en attente). Règles : **inchangées** (voir § 0). Fonctions : **inchangées**. Sauvegarde ZIP (`backupTransfer.ts:236-245`) : une dépense dont le fichier n'est pas encore dans Drive n'a **pas** de `proofDocumentId` ; le fichier local n'est donc pas dans l'export tant que l'envoi n'a pas abouti — limite à dire, pas de trou silencieux (le champ `proofUpload` voyage avec la dépense).

**Risques et parades.**
- *Perte du fichier avant l'envoi* (stockage vidé, appareil perdu) : c'est le seul vrai risque nouveau. Parades : écriture IDB confirmée avant la dépense ; l'état `failed`/`expired` est dans Firestore, donc la dépense dit toujours « justificatif à joindre » ; jamais d'affichage « envoyé » sans `proofDocumentId`.
- *Invariant « Drive avant dépense » levé* : remplacé par « fichier durable avant dépense ». La comptabilité ne dépend pas de Drive pour exister ; elle comptabilise le justificatif comme manquant (`ledger.ts:145`) jusqu'au lien.
- *Concurrence* sur la dépense : relecture juste avant d'écrire, comme `attachProofToPurchase`. À vérifier au code : `FirestoreRepo.put` accepte `{merge:true}` (`:574`) ; sinon relecture complète comme aujourd'hui. Retirer un champ en `merge` demande un `deleteField` ; sinon écrire `finance` entière relue.
- *Quota Dexie / navigateur* : plafond de file et repli synchrone.
- *Pas de réveil par le système* (surtout iOS) : la file n'est pas un service d'arrière-plan ; elle vit tant que l'app est ouverte ou revient au premier plan (dit au brasseur par l'alerte d'attente > 48 h).
- *Les fenêtres Google* ne s'ouvrent jamais seules (`googleAuthorization.ts:14-31`) : « Reconnecter » reste un clic.
- *Aucun appel Drive réel* dans les tests ; l'essai réel unique (DR2) reste une décision à part du brasseur.

**À part : ce qui demande un accord** (rien de ceci n'est dans le plan à exécuter sans lui)
1. Ajout éventuel de `fake-indexeddb` (dépendance de test) si le pilote veut tester la couche Dexie en unitaire plutôt qu'en Chrome. Recommandation : non, adaptateur mémoire + Chrome.
2. Déploiement : **aucun** (ni règles, ni fonctions) pour ce plan tel qu'écrit.
3. Données réelles : **aucune**. Un essai Drive réel de bout en bout (DR2) reste hors plan.

## 6. Décisions pour le pilote

1. **Reçu à l'écran** : D235 (« rien à l'écran tant que ça marche ») retire le reçu de DR1 (`done`, `receiptSentence`). Le plan le déplace dans la fiche de la dépense (« Rangé dans Drive · dossier · nom · vérifié », par `purchaseProofReceipt`). Recommandation : oui ; à confirmer avec les maquettes p3.
2. **Annulation avant envoi** : abandon et fichier effacé (la règle Firestore interdit de lier). Autre option : conserver le fichier localement 30 jours comme pour un échec, sans notification. Recommandation : abandon (une écriture annulée ne doit pas laisser traîner un justificatif en attente).
3. **Seuils** (modifiables sans refonte) : 6 essais, pas 30 s / 2 min / 10 min / 1 h / 6 h, alerte d'attente à 48 h, fichier gardé 30 jours, plafond 20 envois / 60 Mo. Ils sont des choix du plan, pas des mesures ; rien n'a été chronométré.
4. **Ventes et clôture fiscale** : restent synchrones dans cette passe. Étendre la file aux ventes demande son propre accord (la clôture, elle, ne doit pas l'être).
5. **Propriété du banc Chrome** (`scripts/check-invoice-journey-emulator.mjs`) pour le cas `drive-fond`.

## 7. Décisions du pilote (01.11, D237 ; réversibles)
1. Reçu : oui, dans la fiche de la dépense ; rien à l'écran tant que ça marche (D235). La forme sera revue sur la maquette qu'il choisira (p3).
2. Annulation avant envoi : **le fichier est gardé localement 30 jours, sans notification** (option prudente : rien n'est perdu ni
   supprimé sans lui), l'envoi est abandonné (la règle Firestore interdit de lier).
3. Seuils : ceux du plan, en constantes réglables, signalés comme choix et non mesures.
4. Ventes et clôture : synchrones dans cette passe.
5. Banc Chrome `scripts/check-invoice-journey-emulator.mjs` : à la voie de code qui suivra ce plan (cas `drive-fond`).
6. La forme de la notification d'échec est un axe des maquettes p3 : le code pose le mécanisme (état durable, notification globale
   persistante, deux gestes) avec une forme provisoire, remplacée par celle qu'il choisira.
