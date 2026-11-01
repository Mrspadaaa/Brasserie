D3C OK — envoi Drive en arrière-plan codé : file locale, notification d'échec, fiche, banc Chrome 131/131 aux deux largeurs.

## Le diff en trois phrases
« Confirmer » met le fichier dans une file locale (IndexedDB, `proofQueue.ts` et `proofQueueStore.ts`), écrit la dépense avec `finance.proofUpload = queued` et ferme la feuille sans attendre Drive (hors ligne aussi, T5) ; sans IndexedDB ou si la file refuse, le chemin synchrone d'avant reste exactement le même. Un seul travailleur envoie sur des événements (démarrage, `online`, `focus`, `visibilitychange`, `pageshow`, cache prêt), classe les échecs (attente / passager / reconnexion / place / droits / fichier / inconnu), pose le lien sur la dépense relue sans jamais écraser un `proofDocumentId` (T8) et n'efface rien sur un doute (T1, T2). En cas d'échec, une notification unique et persistante (`ProofUploadNotice`, montée dans `App.tsx`) offre « Renvoyer le justificatif » (ouvre la fiche de cette dépense) et, pour le motif `auth`, « Reconnecter Drive » ; la fiche (`TransactionDetails` + `ProofResendPanel`) porte « Renvoyer maintenant », « Choisir un autre fichier » (`resendProof`, fileNo+1) et « Abandonner ».

## Fichiers écrits
Neufs : `src/services/proofQueue.ts`, `proofQueueStore.ts`, `proofUploadStatus.ts`, `src/ui/finance/ProofUploadNotice.tsx`, `tests/unit/depense/drive-fond/` (9 fichiers : `confirmer`, `contrat-synchrone`, `file`, `echecs`, `envoi`, `renvoi`, `notification.tsx`, `fiche.tsx`, `feuille.tsx`), `rejouer-temoin.sh`.
Modifiés : `src/domain/finance/types.ts` (type `ProofUpload`, champ facultatif), `src/services/purchaseEntry.ts` (file, repli synchrone, garde, `acceptsProof`, `resendProof`, `canCloseWithoutAck`, `watchPurchaseConfirmation`, réexport `setProofFileStore`), `src/ui/finance/ExpenseSheet.tsx` (le pied après « Confirmer » seulement), `src/ui/finance/TransactionDetails.tsx`, `src/ui/finance/TransactionJournal.tsx` (prédicat nommé `sansJustificatif`), `src/App.tsx` (monter la notification, démarrer la file), `scripts/check-invoice-journey-emulator.mjs`, `work/missions/.../d3-drive-fond/PLAN.md` (§ 10 seulement).
Non touchés : `financeDocuments.ts`, `driveFileStore.ts`, `ModalShell.tsx`, `FinancesTab.tsx`, règles, fonctions, `package.json`, `DriveConnection.tsx`. Aucune dépendance ajoutée. Pas de commit, ni de déploiement.

## Témoin sur HEAD (L13)
`tests/unit/depense/drive-fond/confirmer.test.ts` écrit avant le code, lancé sur le code d'alors (puis re-lancé sur la copie de `purchaseEntry.ts` de HEAD avec la version finale du test) :
```
× « Confirmer » ne attend plus Drive > Drive ne répond jamais : … rend en moins d'une seconde, en file, sans proofDocumentId  1005 ms
  → l'appel attend encore Drive après 1 s: expected undefined to be defined
```
Après le code : `1 passed`. Le test utilise le temps réel : le calcul d'empreinte du navigateur n'obéit pas aux minuteries factices (la première version, en temps factice, était rouge pour une mauvaise raison et a été corrigée).
Témoin du banc : `bash work/missions/2026-10-31-ecran-depense/voies/d3c-drive-code/rejouer-temoin.sh` (remet six sources à HEAD le temps de l'essai, restaure par `trap` ; sauvegarde dans `os.tmpdir()`), 390, cas `drive-fond` :
```
KO  390 · drive-fond 1 : Drive lent, la feuille se ferme en moins de 2 s après « Enregistrer »
KO  390 · drive-fond 1 : la dépense est écrite, en file, sans proofDocumentId
KO  390 · drive-fond 7 : rechargement en plein envoi … un seul fichier dans le Drive factice
KO  390 · drive-fond 2 : Drive plein, la feuille se ferme quand même / la notification d'échec paraît / persistante / clavier / Finances / tableau de bord / failed-quota écrit
code de sortie du banc sur HEAD : 1 (attendu : 1)
```
(`temoin-head/console.log`). Versions de la voie remises et revérifiées (`git diff --stat`, types, tests, build après).

## Critères (sorties)
- `npx tsc --noEmit -p . && echo TYPES OK` → **TYPES OK**
- Vitest : `npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/financeQuickActions.test.tsx tests/integration/fix114.test.tsx tests/integration/financeDocumentPersistence.test.ts tests/integration/documentProofLink.test.tsx tests/unit/financeDocuments.test.ts tests/unit/financeDocumentMigration.test.ts tests/unit/financeDocumentHistory.test.ts tests/integration/incomeProofFlows.test.tsx tests/unit/incomeEntry.test.ts tests/integration/taxWorkspace.test.tsx tests/integration/taxArchive.test.ts tests/unit/fribourgTax.test.ts tests/integration/backupTransfer.test.ts tests/unit/backupTransferServer.test.ts tests/integration/financeAssistantContext.test.ts tests/unit/finance.test.ts tests/unit/financeArchiveContinuity.test.ts tests/integration/financeJournalUx.test.tsx tests/integration/financeWorkspace.test.tsx tests/integration/financeArchives.test.tsx tests/integration/AppQuickActionReturn.behavior.test.tsx tests/integration/AppRoutePile.test.tsx tests/integration/dashboardNavigation.test.tsx tests/integration/bootstrapError.test.tsx tests/integration/brewLegacyInstallationApp.test.tsx tests/integration/AppLanceurOutilsHoublons.test.tsx --maxWorkers=2 && echo TESTS DRIVE OK` → **93 fichiers, 1350 tests verts, TESTS DRIVE OK** (dont 9 fichiers / 99 tests de `drive-fond`). Les tests existants du § 4.2 sont verts sans réécriture (le repli synchrone tient).
- `node scripts/audit_inputs.mjs` → **INPUT PROTECTION AUDIT PASSED** (653 usages, 365 fichiers).
- `npm run build && echo BUILD OK` → **BUILD OK** (vérification seulement).
- Banc : `node scripts/check-invoice-journey-emulator.mjs --replay work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu.json --out work/missions/2026-10-31-ecran-depense/voies/d3c-drive-code/banc-3` (défauts : 390 et 1280, les 13 cas dont `drive-fond`) → **131/131 contrôles du banc OK, `EMU-INVOICE-JOURNEY-OK`, code 0** (`banc-3/console.log`, `report.json`). Dont 66 contrôles `drive-fond` (33 par largeur). Une première passe 390 seul (`banc-2`) : 34/34. `banc-1` (arrêtée par moi après 4 min) a montré un défaut réel, corrigé (voir écarts).
- `with_server.mjs … controle-bande.mjs` → **BANDE OK**.

## Cas Chrome joués (tous deux largeurs, 390 tactile et 1280)
1 Drive lent : feuille fermée en 569 ms (390) et 688 ms (1280) ; dépense en file, aucune notification. 7 rechargement en plein envoi : un seul fichier lié. 2 Drive plein : notification, cause dite, persistante après 10 s, Tab atteint « Renvoyer le justificatif » et « Plus tard », présente sur Finances et sur le tableau de bord, `failed/quota` écrit sur la dépense. 3 « Renvoyer le justificatif » ouvre la fiche de CETTE dépense (id vérifié par le texte de la fiche) ; « Renvoyer maintenant » : lié, un seul fichier, « Justificatif » s'ouvre. 4 jeton refusé : « Reconnecter Drive » présent ; après reconnexion factice, liée. 5 hors ligne avant « Enregistrer » : fermée en moins de 5 s, rien au serveur, au retour une dépense, un envoi, un lien. 6 coupure pendant l'envoi : aucune notification, jamais `failed`. 8 autre fichier : identifiant `-2`, un seul fichier lié, le premier jamais parti. 9 redémarrage Firestore injoignable : file intacte. 10 `functions/unavailable` : pas d'alerte, reprise au réveil. 11 fichier de 5 Mo refusé dans la fiche, rien en file. Cas existants mis à jour : `doc4` (hors ligne : la feuille se ferme, la dépense arrive au retour, le lien plus tard), `doc5` (plus de reçu à l'écran), `verifyPurchase` (attend le lien, 120 s au plus).

## Captures ouvertes en image (L12)
390 : `banc-2/390-01-…feuille-avant`, `390-02-…feuille-fermee` (tableau de bord + « Achat enregistré. »), `390-03-…notification-echec` (cause, deux boutons, au-dessus de la barre de navigation), `390-05-…fiche-a-renvoyer` (motif, 3 gestes), `390-07-…reconnecter` (« Reconnecter Drive »), `390-09-…fichier-refuse` (refus « 4 Mo maximum »), `banc-3/390-46-…justificatif-ouvert`. 1280 : `banc-3/1280-43-…notification-echec`, `1280-45-…fiche-a-renvoyer`. Non ouvertes (existent) : `1280-41/42/44/46/47/48/49`, `390-04/08` du `banc-2`, les captures des cas existants.
Ce que j'y ai lu : rien de caché par la barre du bas ; la notification tient en 3 lignes à 390 ; cibles ≥ 28 px ; texte ≥ 12 px. Le PDF de la fiche s'affiche en gris : Chrome sans visionneuse PDF, pas un défaut.

## Écarts au plan (écrits dans PLAN.md § 10)
Les huit précisions écrites avant le code. En plus : (1) le délai de 30 s ne retient un job que dans la même vie de page et après un essai qui a atteint un serveur (défaut trouvé par le banc : un rechargement ou un `online` à moins de 30 s laissait le job sans nouvel événement) ; (2) fermeture hors ligne : `pending` et `queued` ; (3) notification au-dessus de la barre de navigation ; (4) le bouton « Reconnecter Drive » est propre à la notification et à la fiche (`DriveConnection.tsx` hors périmètre) ; (5) `sansJustificatif` : même comportement qu'avant, intention écrite ; (6) le banc saisit à la main avec des PDF synthétiques distincts.

## Essais utilisés
Banc : 3 passes (banc-1 abandonnée sur un défaut réel, banc-2, banc-3 verte) + témoin. Tests : `confirmer` (1 correction : temps réel), `renvoi` (1 attendu corrigé : une dépense déjà tentée sans fichier local prend fileNo+1), `envoi` (2 corrections de test : ordre du journal, annulation optimiste simulée).

## Doutes et limites
- **« Reconnecter Drive »** n'a pas été joué avec une vraie fenêtre Google : le banc bloque `accounts.google.com`, le bouton y dit « La connexion Google ne peut pas être préparée. Réessaie. » ; la reconnexion est factice (même appel que le bouton). À essayer par le brasseur avec son vrai Drive (DR2, hors plan).
- Le chemin « Renvoyer » jusqu'à la fiche est joué dans Chrome seulement (id vérifié par le texte de la fiche) ; le test jsdom de la notification s'arrête à l'appel `onResend(id)` (le `App` réel n'est pas monté en test).
- Cas 9 : le banc bloque les requêtes Firestore et vérifie que la file survit ; « 0 appel Drive pendant le blocage » est prouvé en test unitaire (T1), pas en Chrome (le cache persistant peut être prêt malgré le blocage ; compteur noté dans `report.json`, `drive-fond-9-appels-drive-pendant-le-blocage`).
- `controle-choix.mjs` non rejoué : l'écran « dépense » n'a pas d'entrée dans `ecrans.json` (PLAN § 5) ; la mise en page de r2b n'a pas changé, seul le pied après « Confirmer » (« Enregistrement… » au lieu de « Envoi au Drive » quand la file est active).
- Fins de ligne mixtes (CRLF et LF) dans `purchaseEntry.ts` et `TransactionDetails.tsx` : mes lignes sont en LF ; Git normalise.
- Les seuils sont des choix du pilote, en constantes réglables (`PROOF_LIMITS`), pas des mesures. Sur iOS la file ne vit que tant que l'application est ouverte ou revient au premier plan (alerte d'attente à 48 h).
- Les fichiers `scripts/banc-lecture-*` et `tests/unit/hopIndexV4/fraisT3.test.ts` modifiés dans l'arbre viennent d'autres voies.

DEMANDE EXECUTANT : aucune (le banc complet a été joué en un bloc, 131/131).

CONNAISSANCE : une file d'envoi sans minuterie doit exempter du délai anti-rafale tout essai qui n'a atteint aucun serveur et tout redémarrage, sinon le job attend un événement qui ne vient pas ; seul le banc Chrome l'a montré (les tests unitaires, au temps factice, étaient verts).
LEÇON PROPOSÉE : un contrôle de « reprise sur événement » se joue dans Chrome avec un rechargement et un retour du réseau à moins du délai de garde, pas seulement en temps factice : les 28 tests unitaires du travailleur étaient verts alors que le premier essai du banc restait bloqué 240 s.
