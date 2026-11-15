ECHEC — rejeté : q4 écrit deux paiements (ou un montant et un paiement) de la même pièce dans un seul lot Firestore, que les règles refusent ; jamais joué à l'émulateur.

Relecture de q1 (Payer) et q4 (Modifier), code non commité, contre les contrats VOIE.md et `firestore.rules` (racine du dépôt principal ; le worktree n'a que `firestore.rules.template`). Rien rejoué en ligne ; émulateur non lancé (pas de `node_modules/.bin` dans le worktree). Les 3 fichiers de tests de q1/q4 sont verts d'après `tests.txt` ; je n'ai rejoué que 3 fichiers d'autres voies (voir M7).

Bilan : 1 bloquant, 8 mineurs.

## Mécanisme clé (preuve commune)
- `src/services/firestoreRepo.ts:140-145` : `enqueueWrite` met un `queueMicrotask(flushWrites)` ; `flushWrites` (l.102-116) envoie TOUT ce qui est en file dans UN `writeBatch`. Tout code synchrone qui écrit plusieurs fois (executerPlan, la boucle de PayerVirement) part donc en un seul lot atomique.
- `firestore.rules` l.202-210 : la création d'un paiement exige `getAfter(transactions/<tx>).lastPaymentId == id` (état APRÈS le lot) et `matchingPaymentGuard(get(tx) = état d'avant le lot, getAfter(tx), …)` avec `solde(après) == solde(avant) + delta` (l.79-90). Un lot ne peut donc contenir QU'UN paiement par pièce. C'est la forme voulue : `newTransactionGuard` / `stageNewTransactionPayment` créent une pièce et son paiement dans un lot.
- Les tests passent parce qu'ils jouent `?dev-local` : `FirestoreRepo.put` / `adjustNumber` y écrivent dans un cache (l.592-598, 615-618), sans lot ni règles. Le RESULTAT de q4 l'avoue (« règles non jouées »).

## Bloquant

### B1 — q4 : une correction qui écrit deux paiements, ou montant + paiement, dans un même lot est refusée
- Fichiers : `src/ui/finance/modifier/executerCorrection.ts:55-79` (boucle synchrone, aucune coupure entre étapes) ; `src/domain/finance/correctionMontant.ts:62-82` (plans à 2 paiements ou plus).
- Scénario 1 (certain) : pièce de 100,00 soldée par PAI-1, baisse à 60,00, « Le paiement suit » (le défaut d'une baisse, `EditTransactionModal.tsx:84`). Plan : `CONTRE-PAI-1`, montant 60, paiement PAI-x de 60. Un seul lot contient deux créations de `financialPayments` pour la même pièce. `lastPaymentId` final = PAI-x : la création de `CONTRE-PAI-1` échoue (`getAfter(tx).lastPaymentId == id`), et le contrôle de solde de PAI-x échoue (avant 100, delta +60 attendu, après 60). Le lot est rejeté en entier.
- Scénario 2 (certain) : baisse sous le payé avec deux paiements dont le dernier ne suffit pas (test unitaire l.52) : deux contre-paiements dans le même lot, même refus.
- Scénario 3 (à prouver à l'émulateur) : hausse + « paiement suit » (montant, puis paiement) ; baisse + « reste à payer » (contre-paiement, puis montant). Même document `transactions/<id>` écrit deux ou trois fois dans un lot : l'étape « montant » (set complet) change `finance.amountCents`, or l'étape paiement exige `after.diff(before).affectedKeys().hasOnly(['settlementBalanceCents','lastPaymentId'])` (rules l.105). Si Firestore évalue `resource` sur l'état d'avant le lot, c'est refusé. Rien dans le dépôt ne prouve l'inverse.
- Ce que voit le brasseur : le cache local est mis à jour tout de suite (`firestoreRepo.ts:606-609, 621-624`), la feuille se ferme sur « Opération mise à jour. » (`FinancesTab.tsx:134`, `EditTransactionModal.tsx:149-150`) ; le refus n'arrive qu'après, hors ligne puis synchronisé, en bandeau « Enregistrement refusé », et la ligne revient à l'ancien état au rafraîchissement. Une correction d'argent annoncée réussie, puis perdue : inacceptable pour la voie à risque élevé.
- Correction attendue : un lot par étape. `executerPlan` devient asynchrone et laisse partir le lot entre deux étapes (au minimum `await Promise.resolve()` après chaque écriture : la microtâche de `flushWrites` est déjà en file ; ou exposer un `FirestoreRepo.flushNow()`), sans `waitForWrites` (qui attend le serveur et casserait le hors ligne : les lots se rejouent dans l'ordre à la reconnexion). Relire la pièce vivante avant l'étape montant (déjà fait). Jouer ensuite à l'émulateur Firestore (Java 21 présent ; modèle : `scripts/check-invoice-journey-emulator.mjs`) les 4 plans de la VOIE : hausse + suit, hausse + reste, baisse sous le payé (un et deux paiements), baisse au-dessus. L'écran ne ferme et ne dit « mise à jour » qu'une fois les lots partis ; et le test d'intégration doit compter les lots (un paiement par lot).
- q1 n'a pas ce défaut : la boucle de `PayerVirement.tsx:96-105` écrit un seul paiement par pièce, sur des pièces différentes, donc des documents différents dans le même lot, chacun conforme (voir « q1 vérifié »).

## Mineurs

### M1 — q4 : repli silencieux sur une écriture directe si le plan échoue
- `EditTransactionModal.tsx:86-90` : `planPour` avale l'exception de `planCorrection` (« Aucun paiement à inverser… ») et rend `null` ; `handleSave` fait `plan ?? []` (l.143) puis `StorageService.updateTransaction(candidate)` (l.147) avec le nouveau montant et l'ancien solde réglé : solde > montant, refus des règles (`updatedTransactionGuard` : `solde <= montant`). Atteignable seulement sur des données incohérentes (réglé net supérieur à la somme des paiements vivants), mais le geste réussit à l'écran.
- Correction : si `change` et plan `null`, afficher l'erreur et ne rien écrire.

### M2 — q4 : le paiement de remplacement est daté d'aujourd'hui (caisse faussée)
- `executerCorrection.ts:23` (`date: ctx.aujourdhui`) ; contre-paiement daté de l'origine (`calculs.ts:78`).
- Scénario : facture de 100 payée le 02.11, baisse à 60 le 15.11, « paiement suit » : -100 le 02.11, +100 le 02.11 (contre), -60 le 15.11. La caisse entre le 02.11 et le 15.11 est surévaluée de 60 et le mouvement apparaît le 15.11 alors que l'argent est sorti le 02.11 (une correction d'erreur, pas un nouveau virement). Pour une baisse, la date du dernier paiement inversé est la bonne ; pour une hausse « suit », aujourd'hui se défend. Décision du pilote ; le RESULTAT de q4 le signale (« daté d'aujourd'hui ») sans en dire l'effet.

### M3 — q4 : le verrou se juge sur l'ancienne date seulement
- `EditTransactionModal.tsx:68-71` : `verrouMontant(transaction, …)` lit la date d'origine. Le champ Date reste libre (l.246-249) : on peut, dans la même sauvegarde, passer une pièce d'une année ouverte à une date d'une année close ou archivée ET changer le montant. `validateFinanceTransaction` ne contrôle pas la clôture.
- Correction : évaluer le verrou aussi sur l'année de `draft.date`, ou verrouiller la date avec le montant.

### M4 — q4 : « une clôture existe » = un brouillon suffit
- `EditTransactionModal.tsx:69` : `clotures.map(c => c.year)` ; `ClosingSheet` enregistre un brouillon (`saveLabel="Conserver le brouillon"`, `inventoriesConfirmed:false`). Un brouillon d'inventaire ouvert pour regarder bloque donc toute la comptabilité de l'année. C'est la lettre du contrat (« une clôture existe pour cette année »), mais pas l'intention d'une année « close ». À trancher par le pilote (par exemple `inventoriesConfirmed` ou la présence de `report`/`tax`) ; aucun test ne le couvre.

### M5 — q1 : un justificatif joint, hors ligne, empêche tout le paiement
- `PayerVirement.tsx:89-94` : `saveFinanceDocumentConfirmed` lève `offlineOriginalError` hors ligne ; aucun paiement n'est écrit, et la feuille ne propose pas « payer sans justificatif » (seul « Retirer » s'offre). Le contrat dit « sans justificatif, le paiement s'enregistre quand même » ; l'exigence « hors ligne gardé » est tenue seulement sans fichier. Cohérent avec `ExpenseSheet`, mais à dire : ajouter dans l'erreur le geste « Retirer le justificatif pour payer maintenant ».

### M6 — q1 : l'ordre d'imputation mêle échéance et date
- `repartition.ts:39-43` : clé = échéance, à défaut date de la pièce. Une pièce sans échéance du 05.01 passe avant une pièce en retard d'échéance 01.10 : elle est imputée d'abord sans porter le mot « retard » (`PayerVirement.tsx:149`, retard = échéance passée). La consigne « retard d'abord » tient entre pièces à échéance, pas entre les deux sortes. Même règle que `summarizeLedger.outstanding`, donc cohérent ; à connaître, pas à corriger sans décision.

### M7 — Trois tests d'autres voies sont rouges à cause de ces ports, non adaptés
- Rejoués : `tests/integration/editTransactionBe66.test.tsx` (2), `tests/integration/liveDataViews.test.tsx:136` (`216,20 CHF` introuvable), plus `tests/integration/financeWorkspace.test.tsx:100` annoncé par q1 (champ « Date réelle du paiement » absent tant qu'on n'a pas choisi « autre »). Résultat : 2 fichiers en échec, 3 tests rouges. Hors Possède des deux voies, donc hors de leur faute ; le pilote doit les adapter (avec accord sur le texte de la maquette) avant tout « vert » de la mission (L11).

### M8 — q1 : un justificatif déjà rangé reste orphelin si le premier paiement est refusé
- `PayerVirement.tsx:89-103` : le document est rangé (Drive) avant les paiements ; si `recordPayment` lève sur la première pièce (pièce annulée entre-temps, date invalide), aucun paiement n'est écrit mais l'original reste rangé. `v.preuve` est mémorisé donc un réessai ne le double pas : pas de doublon, seulement un fichier sans paiement si on abandonne. Mineur.

## q1 vérifié (réponses aux questions)
- Règles : un paiement par pièce touchée, des pièces différentes, un lot : conforme (chaque pièce a son `lastPaymentId`, son solde monte du montant du paiement, `solde <= montant` garanti par `refusDuVirement` et `recordPayment` qui relit `remainingCents`). Champs `proofDocumentId` / `proofFileName` en plus : la règle `validPaymentRecord` ne restreint pas les clés. Hors ligne, puis synchronisé : lot rejoué tel quel, aucune dépendance entre pièces.
- Centimes : `repartition.ts` est en entiers sans division ; FIFO, partiel (dernière pièce), montant supérieur au total refusé (`refusDuVirement:47-55`, exception dans `repartirVirement`), pièces d'un autre tiers, soldées, annulées ou à avoir imputé exclues (`piecesOuvertesDuTiers:94-98`), `Math.round(v*100)` du champ ne laisse pas de dérive (29 centimes ok). Plusieurs paiements antérieurs : le reste vient de `paymentState` (contre-paiements, avoirs imputés compris).
- Écriture à moitié faite : une validation qui échoue sur la 2e pièce laisse la 1re écrite (déjà en file, elle partira) ; le message dit « Déjà enregistré : X. Le reste du virement n'est pas écrit. » et recale le montant (`PayerVirement.tsx:107-114`). Réessai identique : ids et horodatage figés, aucun doublon. Visible et honnête.
- Verrou : Payer ne verrouille rien (contrat) ; une pièce annulée est refusée par `recordPayment` (« pièce existante et active »). Services existants réutilisés : `FinanceService.recordPayment`, `prepareFinanceDocument`, `saveFinanceDocumentConfirmed`, `driveProofFileName`, `ChampNombre` ; aucun chemin parallèle.
- Périmètre : `git status` : q1 n'a écrit que dans son Possède (+ `capturer.mjs`, `cap/`, dans son dossier). `MovementSheet.tsx`, `TransactionDetails.tsx` sont d'une autre voie.

## q4 vérifié (réponses aux questions)
- Domaine : `planCorrection` en centimes entiers, conforme à la VOIE sur le papier (ordre hausse : montant puis paiement ; baisse : contre-paiements, montant, paiement) ; plusieurs paiements : inverse du plus récent au plus ancien juste ce qu'il faut ; paiement déjà inversé exclu ; `CONTRE-<id>` identique, même montant, sens inverse, date d'origine (`contrePaiement`) conformes à `validPaymentReversal`. Montant > total : sans objet (hausse libre), avoirs actifs bornent la baisse (`erreurNouveauMontant`). L'ordre des écritures est juste ; c'est le regroupement en lot qui casse (B1).
- Écriture à moitié faite : l'erreur dit « Déjà écrit : … » (`executerCorrection.ts:74-77`) ; mais comme les écritures partent en un lot, un arrêt au milieu laisse en réalité les étapes déjà en file partir seules (état intermédiaire : paiement inversé, montant ancien).
- Verrou : année close/archivée/pièce annulée : bien gardé par `verrouMontant` (+ avoir et pièces à plusieurs lignes, écarts dits). Limites : M3, M4.
- Services existants réutilisés : `FinanceService.recordPayment`, `StorageService.updateTransaction` (valide, journalise), `contrePaiement` de `operations/calculs`, `isTransactionArchived`, `FinanceService.getClosings`. Pas de chemin parallèle ; `onSave` ne réécrit pas (notice seulement), donc pas de double écriture de l'ancien solde.
- TVA : `tvaAmount` et `amountTTC` recalculés uniquement quand HT ou taux change ; `finance.amountCents` et la ligne unique suivent ; `validateFinanceTransaction` appelé avant la première écriture.
- Périmètre : `git status` : q4 n'a écrit que dans son Possède.

## À jouer avant d'accepter
Émulateur Firestore, plans de q4 (un lot par étape), puis banc en ligne « ZZ TEST » (VOIE : jamais de donnée réelle). Les captures de q4 restent non vues par l'auteur (RESULTAT : « DEMANDE EXECUTANT ») : hors de cette relecture de code.

LEÇON PROPOSÉE : un test d'écritures financières en `?dev-local` ne prouve pas les règles Firestore : tout plan à plusieurs écritures sur un même document ou à plusieurs paiements d'une même pièce se joue à l'émulateur, et `FirestoreRepo` regroupe toute écriture synchrone en un seul lot (une étape = un lot).
