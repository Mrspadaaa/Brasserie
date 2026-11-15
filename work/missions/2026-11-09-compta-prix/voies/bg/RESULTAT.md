OK — Vente écrite d'abord, justificatif Drive envoyé en arrière-plan par la file de la Dépense ; test rouge puis vert.

Voie bg (défaut CP-2). Ses mots (10.11) : « Ça prend énormément de temps d'enregistrer une facture l... Sûrement à cause du drive, faire le job en background. »
Pas de VOIE.md ni GATES.md dans le dossier : le contrat est le message de lancement.

## 1. Mesure : où part le temps
Local, fixture, médiane de 7 (`tests/unit/caisseMesuresVente.test.ts`, sortie `voies/bg/mesures.txt`) :
- Quittance (jsPDF, `preparerVente` paye) : 0,9 à 1,3 ms, PDF 12 Ko.
- Facture QR (jsPDF + swissqrbill, vrai PNG de bulletin 2480 × 1240 px fourni) : 77 à 79 ms, PDF 120 Ko.
- Mise en file (SHA-256 + écriture, magasin mémoire) : 4 à 5 ms.
Non mesuré, dit comme tel : le rendu canvas du navigateur du QR (`rasteriserNavigateur`, absent de jsdom), l'écriture Firestore réelle, l'envoi Drive (simulé, jamais appelé).
Lecture du code (`incomeEntry.ts` avant, `financeDocuments.confirmOriginal`) : avant l'écriture de la vente, la caisse attendait en série `getDocFromServer`, `uploadDriveOriginal` (fonction serveur, jusqu'à 5,6 Mo), `getDriveProofDetails`, `batch.commit` : 4 allers-retours au moins, puis l'accusé de la vente (15 s au plus). Le PDF local coûte moins de 0,1 s : ce n'est pas lui qui est lent, c'est Drive, comme il le pressentait. Pas de PDF à préparer à part : rien à déplacer.

## 2. Ce qui a été fait
- La vente (transaction + paiement) s'écrit d'abord ; le PDF entre dans la file `proofQueue` (la même que la Dépense, même magasin Dexie) ; le travailleur l'envoie après la fermeture de la caisse.
- La transaction écrite n'a pas de `proofDocumentId` (posé par `linkJob` une fois l'envoi fait), porte `syncedToDrive: false` et `finance.proofUpload = queued`. `linkJob` pose `syncedToDrive: true` (seulement si la valeur est `false` : la Dépense ne change pas).
- Message : « … Quittance en cours d'envoi vers Drive. » ; « conservée dans Drive » seulement par le chemin synchrone, quand le reçu Drive existe.
- État d'envoi visible : facture QR, écran de résultat, une ligne « PDF en cours d'envoi vers Drive… » → « PDF dans Drive », ou « Envoi Drive à renvoyer » + bouton « Renvoyer » (`requeueProof`). Vente « payé ici » : la caisse se ferme, l'état est dans le journal (« envoi en cours ») et la fiche (`ProofResendPanel`), comme la Dépense.
- Hors ligne : la caisse n'attend pas l'accusé du serveur ; la vente est écrite sur l'appareil, le message dit « Écrite sur cet appareil : elle se synchronise au retour du réseau », le job reste `queued`, l'envoi repart au retour (`runProofQueue('online')`, testé).
- En ligne : l'accusé du serveur est attendu 2 s au plus (`INCOME_ACK_WAIT_MS`), puis la caisse rend la main.
- Repli : sans file (pas d'IndexedDB, file pleine, pas de session, `?dev-local`), chemin d'avant : envoi confirmé avant l'écriture (testé).

## Fichiers
Possède, écrits :
- `src/ui/vente/Caisse.tsx` (appel, messages, `EtatEnvoi`), `src/ui/vente/envoiJustificatif.ts` (neuf : `useEnvoiVente`, `etatEnvoi`), `src/ui/vente/caisse.css` (3 règles `.cs-fait > div`, `.cs-envoi`).
- `src/services/proofQueue.ts` (ajouts : `EnqueueInput.transactionId`, `jobOfTransaction`, `getProofJob` retrouve aussi par numéro d'écriture, `requeueProof`/`abandonProof` idem, `syncedToDrive` dans `linkJob`). La Dépense garde `TX-<saisie>` par défaut.
- Service d'écriture adapté : `src/services/incomeEntry.ts` (nouvelle `saveIncomeEntryInBackground` ; `saveIncomeEntry` garde son contrat, utilisé par `InvoiceSheet`).
- Tests : `tests/integration/caisseEnFond.test.tsx` (neuf, 6 tests), `tests/unit/caisseMesuresVente.test.ts` (neuf, mesure), `tests/integration/caisseVente.test.tsx` (ligne de mock).
Hors Possède, touchés (une ligne de mock chacun, pour que `Caisse` trouve `saveIncomeEntryInBackground` dans le module simulé ; comportement des tests inchangé) : `tests/integration/incomeProofFlows.test.tsx`, `tests/integration/factureClientSaisie.test.tsx`, `tests/integration/venteComptoirBornes.test.tsx`.
Non touché mais vu modifié par un autre : `voies/COMMUN.md`.

## 3. Critères
- Test rouge sur l'ancien comportement : `BG_ANCIEN=1 npx vitest run tests/integration/caisseEnFond.test.tsx` → 5 échoués, 1 passé (le contrôle du chemin synchrone) ; trace `voies/bg/ancien.txt` (la caisse ne ferme pas en 1 s, Drive à 10 s).
- Vert : même fichier sans la variable → 6 passés (`voies/bg/tests-enfond.txt`) : Drive simulé non rendu, caisse fermée et vente écrite en < 1 s (162 ms au passage), job en file puis `sending`, `syncedToDrive` faux puis vrai à la fin, lien posé, job retiré ; hors ligne puis retour ; facture QR, résultat « en cours » puis « dans Drive » ; échec `drive/auth-required` → `failed`, puis `requeueProof(numéro de la vente)` → envoi → vrai ; repli synchrone.
- Rejeu : `tests/integration/caisse*`, `tests/unit/caisse*`, `factureQr`, `incomeProofFlows`, `financeQuickActions`, `tests/unit/depense/drive-fond` (file, envoi, échecs, renvoi, fiche, notification, confirmer, contrat synchrone), `factureClientSaisie`, `venteComptoirBornes`, `incomeEntry`, `operationsCalculs` : 21 fichiers, 227 tests passés (`voies/bg/tests.txt`). Il n'existe pas de fichier `proofQueue*` : la file est couverte par `drive-fond/`.
- `npx tsc --noEmit` : 2 erreurs, toutes deux d'environnement (firebase-admin, react-zoom-pan-pinch) ; aucune dans les fichiers de la voie (`voies/bg/tsc.txt`).

## Essais, doutes, limites
- Essais : 1 par critère. Un faux départ de test (le travailleur de la file est un singleton : un envoi laissé en vol bloquait le test suivant), corrigé dans l'`afterEach`.
- Validation visuelle NON effectuée : aucun navigateur à disposition, aucune capture. Le seul changement de rendu est la ligne d'état sous « Facture … enregistrée » (écran de résultat de la facture QR, maquette v3a). À juger sur capture, 390 et 1280, deux thèmes ; en `?dev-local` il n'y a pas de session, donc pas de file : l'état « en cours » ne s'y voit pas (seulement « PDF gardé sur cet appareil »).
- Une vente refusée plus tard par le serveur (règle Firestore) alors que la caisse est fermée ne s'affiche nulle part ; le job passe `voided refused`. Même limite que la Dépense (`judgeExpense`). Le refus dans les 2 s reste dit dans la caisse comme avant.
- `computeProofAlerts` (`src/services/proofUploadStatus.ts`, hors Possède) ne regarde que les écritures `expense` : un envoi de vente en échec alerte par la ligne du job (sans libellé), mais l'alerte « en attente depuis 48 h » ne couvre pas les ventes.
- Les rapports et exports qui comptent les justificatifs voient une vente en file « sans justificatif » jusqu'à l'envoi (comme la Dépense) ; `ledger.ts:172` la compte dans `missingProofCount` pendant ce temps.
- Le délai d'accusé de 2 s est un choix de la voie, réglable (`INCOME_ACK_WAIT_MS`), pas une mesure.

DEMANDE EXECUTANT :
- Capture de l'écran de résultat de la facture QR (390 tactile et 1280, thème clair et sombre) avec la ligne d'état « PDF en cours d'envoi vers Drive… » et l'état « Envoi Drive à renvoyer » ; à produire depuis un rendu de `Caisse` avec la file simulée (extraire du test `caisseEnFond.test.tsx` « facture QR » ou le jouer dans l'app avec session de test). Fichiers : `voies/bg/captures/`. Ouvrir chaque capture en image ; juger le chevauchement de la ligne avec le montant sur 390.
- Rejeu : `npx vitest run tests/integration/caisseEnFond.test.tsx --reporter=dot` attendu 6 passés ; avec `BG_ANCIEN=1` attendu 5 échoués.

DÉCISION À PRENDRE : élargir `computeProofAlerts` aux ventes (`kind: 'income'`) pour l'alerte de 48 h ? Options : (a) oui, un mot à changer dans `proofUploadStatus.ts` + son libellé « dépense » à revoir ; (b) laisser (l'échec alerte déjà). Recommandation : (a), dans une voie qui possède ce fichier.

CONNAISSANCE : la file `proofQueue` sert aussi aux écritures hors Dépense depuis `EnqueueInput.transactionId` ; le job se retrouve par numéro d'écriture (`getProofJob`, `requeueProof`, `abandonProof`) ; `linkJob` pose `syncedToDrive: true` sur ce qui le portait à `false`. Mesure du 10.11 : PDF local < 0,1 s, le temps perdu est l'envoi Drive en série avant l'écriture.
LEÇON PROPOSÉE : aucune
