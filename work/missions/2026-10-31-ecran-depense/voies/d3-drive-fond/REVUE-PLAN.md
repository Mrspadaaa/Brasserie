# Revue du plan d3-drive-fond, triée par le pilote (01.11)

Deux relecteurs neufs ont rendu `REVUE-conception.md` et `REVUE-pret.md` ; les preuves restent là-bas. « corrigée » : l'auteur réécrit
PLAN.md selon la colonne « Correction attendue », précisée par ce que tranche le pilote, avant toute ligne de code. Règle de la voie : un
justificatif n'est jamais perdu ni effacé sur un doute ; dans le doute, on garde et on attend.

**Ce que le pilote tranche (à recopier dans PLAN.md, § 8)**
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

## Conception
| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| B1 | bloquant | renvoi d'un autre fichier sous le même `documentId` toujours en `drive/integrity` (`driveFileStore.ts:309-311`) | nouvel identifiant pour un autre fichier, test | corrigée | T3 |
| B2 | bloquant | « absente » efface le justificatif au démarrage, cache non prêt (`firestoreRepo.ts:369-371`) | `isReady()`, jamais d'effacement, rejet prouvé seul | corrigée | T1 |
| M1 | majeur | annulation contradictoire, état absent de la machine (PLAN.md:16, :113, :187) | état `voided`, corps réécrit, test | corrigée | T2 |
| M2 | majeur | hors ligne, « Confirmer » attend 15 s (`purchaseEntry.ts:431`) | fermer si écriture en file locale | corrigée | T5 |
| M3 | majeur | fausses grosses notifications (`firebaseAuth.ts:117-121`, session, `onLine`) | classement passager, essai compté au serveur | corrigée | T6 |
| M4 | majeur | le lien peut recréer une dépense refusée, deux appareils (`storage.ts:535-541`) | garde d'écriture, pas d'écrasement | corrigée | T8 |
| M5 | majeur | `attachProofToPurchase` inutilisable depuis la fiche (`purchaseEntry.ts:408-413`) | fonction neuve `resendProof`, gardes de taille et format, test | corrigée | — |
| M6 | majeur | inventaire des tests et du banc Chrome incomplet (25 fichiers) | liste vérifiée fichier par fichier, rejouée sur HEAD | corrigée | avec Prêt 5 |
| D1 | détail | « seuls Dexie des houblons » faux | phrase corrigée ; adaptateur injectable sur `brewingScenarioLocalRepository.ts:225` | corrigée | — |
| D2 | détail | mode patient inutile | boucle sur `drive/in-progress` | corrigée | T7 |
| D3 | détail | échelle de minuteries trop lourde | reprise sur événements | corrigée | T6 |
| D4 | détail | 7 jours d'IndexedDB sur Safari, `persist()` jamais appelé | `persist()` à la première mise en file, `expired` montré | corrigée | — |
| D5 | détail | notification sous la feuille (`ModalShell.tsx:153`) | sans feuille ouverte | corrigée | T4 |
| D6 | détail | formes du job non accordées | type `ProofUpload` unique | corrigée | T2 |
| D7 | détail | bascule `failed` → `queued` après « Reconnecter » non écrite | écrire la bascule, garde annulée | corrigée | — |
| D8 | détail | filtre « Sans justificatif » à `:194` ; nom prévu dans l'export | chemin juste, limite écrite | corrigée | — |
| D9 | détail | injection du `FileStore` non décrite | setter de module, repli synchrone sans IndexedDB | corrigée | avec Prêt 9 |
| D10 | détail | cas Chrome 7 à 10 manquants | ajoutés au plan | corrigée | — |

## Prêt à coder
| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | fichier effacé quand « absente », au démarrage (`App.tsx:296-330`) | attendre le chargement, rejet prouvé seul, test | corrigée | T1 |
| 2 | bloquant | corps et § 7 contradictoires, état du job gardé absent | état `voided`, purge sans Firestore, test J+29 / J+31 | corrigée | T2 |
| 3 | majeur | « Rattacher » crée un doublon dans Drive (`purchaseEntry.ts:402`) | `acceptsProof` refuse si `proofUpload`, pas d'écrasement, tests | corrigée | T8 |
| 4 | majeur | notification inatteignable sous une feuille, « Renvoyer » n'ouvre rien (`App.tsx:689-690`) | trancher, deux appels, vues exclues | corrigée | T4 |
| 5 | majeur | liste des tests à réécrire incomplète | liste vérifiée, contrat « IndexedDB absent = synchrone » testé | corrigée | avec Conception M6 |
| 6 | majeur | raccord `savePurchase` / garde non spécifié (`purchaseEntry.ts:330, :477, :480`) | `queuedProofs`, nom lisible dans `driveNames` avant | corrigée | — |
| 7 | majeur | mode patient : trois trous | (a) sans objet, (b) et (c) classés | corrigée | T6, T7 |
| 8 | majeur | merge ou remplacement complet (`storage.ts:532-540`) | relire puis `updateTransaction` complet, attraper l'annulée | corrigée | T8 |
| 9 | majeur | tests qui échouent pour la mauvaise raison | point d'injection, témoin qui n'importe rien de neuf, mock exact | corrigée | — |
| 10 | détail | chemin de `FinancesTab` faux | `src/components/tabs/FinancesTab.tsx:125-134` | corrigée | — |
| 11 | détail | prédicat « Sans justificatif » en `:194-195` | chemin juste | corrigée | — |
| 12 | détail | job sans `uid` | type unique | corrigée | T2 |
| 13 | détail | phrase fausse sur Dexie | corrigée | corrigée | avec Conception D1 |
| 14 | détail | conversion `data:` ↔ `ArrayBuffer` non dite | stocker la chaîne `data:` | corrigée | — |
| 15 | détail | environnement jsdom des tests | `// @vitest-environment jsdom` | corrigée | — |
| 16 | détail | nouveaux modules ne touchent `FirestoreRepo` qu'à l'appel | écrit au plan | corrigée | — |
| 17 | détail | hors ligne : « ferme en moins de 2 s » seulement en ligne | écrit | corrigée | T5 |
| 18 | détail | le banc Chrome n'a que le succès | réglages à ajouter au banc (voie de code) | corrigée | D237 n° 5 |
