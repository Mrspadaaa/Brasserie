OK — B1 et M1 à M5 corrigés ; 7 plans et le virement acceptés par les vraies règles à l'émulateur ; 4 témoins refusés.

## Fichiers écrits (tous dans Possède)
- `src/domain/finance/correctionMontant.ts` : étape « paiement » avec `date?` (M2) ; `anneesCloses()` (M4) ; `verrouMontant` juge aussi `dateNouvelle` / `archiveeNouvelleDate` (M3).
- `src/ui/finance/modifier/executerCorrection.ts` : `executerPlan` asynchrone, `await Promise.resolve()` après chaque étape (B1) ; date du paiement de remplacement (M2).
- `src/components/EditTransactionModal.tsx` : `handleSave` asynchrone, `onSave`/`onClose` après la mise en file de toutes les étapes ; plan impossible = erreur visible, rien d'écrit (M1) ; verrou sur l'année d'origine et celle de la date saisie (M3) ; clôture = `report` présent (M4).
- `src/ui/finance/modifier/modifier.css` : le bouton « Enregistrer » était noir sur noir (`.mod button { color: inherit }` battait `.mod-b1`) ; trouvé sur la capture, corrigé (`.mod button.mod-b1`).
- `src/ui/finance/payer/PayerVirement.tsx` : M5.
- `tests/unit/correctionMontant.test.ts`, `tests/integration/modifierMontant.test.tsx` (adaptés et étendus).
- Dossier voie : `emulateur.mjs`, `entree.ts` (empaquetage esbuild du vrai code), `capturer.mjs`, `sonder.mjs` (sonde de couleur, jetable), `tests.txt`, `emulateur.txt`, `cap/` (8 captures).

## Corrections
- **B1** : un lot Firestore par étape. Aucun changement dans `firestoreRepo.ts` : `flushWrites` est déjà en file par `queueMicrotask` à la première écriture ; l'`await Promise.resolve()` laisse partir ce lot (une étape = au plus un paiement + son solde, ou le montant + son journal). Pas de `waitForWrites` : le hors ligne reste (lots rejoués dans l'ordre). Preuve : test qui rejoue ce mécanisme (3 lots pour baisse + suit : `[CONTRE-PAI-1] [montant] [PAI-neuf]` ; 4 lots pour deux contre-paiements ; 2 pour hausse + suit) ; sans l'`await`, 3 tests échouent (essayé, puis remis). Test aussi : « mise à jour » pas annoncée avant la fin des étapes, `waitForWrites` jamais appelé.
- **M1** : `planPour` rend `{plan, erreur}` ; plan impossible + montant changé : message en alerte, `handleSave` lève, aucune écriture (test avec `planCorrection` forcé à lever).
- **M2** : baisse « suit » : remplacement daté du paiement inversé le plus récent (`date` dans l'étape) ; hausse « suit » : date absente = aujourd'hui. Vérifié à l'émulateur (remplacements datés 2026-11-09) et en intégration.
- **M3** : verrou sur l'année d'origine ET celle de la date saisie ; si seule la nouvelle date déclenche, le message ajoute « Remets la date d'origine pour modifier le montant. » ; enregistrer avec un montant changé dans ce cas lève et n'écrit rien (test).
- **M4** : « année close » = une clôture avec `report` (figée par `finalizeClosing`, convention déjà utilisée par `annual.ts`, `assistantContext.ts`, `dataBackup.ts`) ; un brouillon (`CLOTURE-<année>`, sans `report`) ne verrouille pas. Tests unitaires et intégration (brouillon libre, figée verrouillée).
- **M5** : hors ligne avec justificatif : « … Retirer le justificatif pour payer maintenant. » ; reconnu par `code === 'unavailable'` ou un message « Hors connexion… » (le test existant de `payerVirement.test.tsx` lève un `Error` sans code). Test : message, aucun paiement, puis Retirer + Payer écrit le paiement.

## Critères
- G1 `VITEST OK` : 4 fichiers, 70 tests verts (`tests.txt`).
- G2 `EMULATEUR OK` (`emulateur.txt`) : émulateur Firestore, règles de `firestore.rules` du dépôt principal (copiées dans un dossier temporaire, adresse autorisée remplacée par celle du banc ; original intact), SDK client avec jeton, un `writeBatch` par étape, pièces « ZZ TEST », plans produits par le vrai `planCorrection` :
  - hausse + suit : 2 lots, montant 45,50, réglé 45,50 ; hausse + reste : 1 lot, réglé 42,00 ;
  - baisse sous le payé + suit : 3 lots, montant 40,00, réglé 40,00, remplacement daté 2026-11-09 ; + reste : 2 lots, réglé 0 ;
  - baisse avec deux paiements inversés + suit : 4 lots, montant 25,00, réglé 25,00 ; un seul inversé : 3 lots ;
  - virement de 300,00 sur 2 pièces du même fournisseur (un lot, un paiement par pièce) : 60,00 soldé + 240,00 sur 400,00.
  - **Témoin** : l'ancien regroupement (toutes les étapes dans un seul lot) est refusé (`permission-denied`) pour baisse + suit et baisse à deux paiements (les deux certains) ; il l'est aussi pour hausse + suit (montant + paiement dans le même lot, ce que la relecture n'avait pas pu prouver) et baisse + reste. Donc la proof discrimine et r2/B1 est confirmé, y compris le cas « même document écrit deux fois ».
- G3 `TSC OK`.

## Captures (ouvertes : 390 clair baisse, 1280 cave baisse, 390 cave après, avant/après correction du bouton)
`cap/modifier-{390,1280}-{clair,cave}-{baisse,apres}.png` : Électricité 68,00 → 67,00 (baisse sous le payé, « Le paiement suit », aperçu avant/après). Défaut trouvé et corrigé : bouton « Enregistrer » illisible. Ouvertes après correction : 390 clair baisse et 1280 cave baisse (OK : bouton lisible, aperçu avant/après lisible). Les 390 cave baisse, 1280 clair baisse et les 4 « apres » ont été regénérées après la correction mais je n'ai ouvert que le 390 cave « apres » (avant correction : liste à jour, « Opération mise à jour. », rangée à 67,00).

## Doutes et limites
- Le script émulateur reproduit la forme des écritures de `recordPayment`/`updateTransaction` (même `set` fusionné avec `increment` + `lastPaymentId`, même `set` complet de la pièce relue, entrée `auditLogs`) mais n'exécute pas `FirestoreRepo` lui-même (il demande le navigateur). Écart possible : un champ ajouté plus tard à ces écritures. Le banc en ligne « ZZ TEST » reste à jouer par le pilote (L11).
- Les lots partent dans le même tour macro (microtâches enchaînées) : le rafraîchissement serveur d'après-lot ne peut pas s'intercaler avant la dernière étape. Hors ligne, les lots se rejouent dans l'ordre, mais un refus du serveur sur un lot ancien laisse les lots suivants échouer à leur tour (bandeau « Enregistrement refusé » existant).
- Verrou M3 : l'année de la nouvelle date est jugée dès que la date saisie est lisible, même si l'on ne change que la date et que le montant reste le même (le champ montant se grise alors) ; la date elle-même reste enregistrable. À trancher par le pilote si on veut verrouiller aussi la date.
- Écart de couverture : le test de M5 est dans `modifierMontant.test.tsx` (je ne possède pas `payerVirement.test.tsx`).
- Aucun fichier hors Possède écrit (`git status` : seuls le dossier q5 et mes chemins ont changé ; les autres lignes existaient déjà).

CONNAISSANCE : une clôture « confirmée » = `FinancialClosing.report` présent ; un brouillon d'inventaire (`CLOTURE-<année>`) n'en a pas. Les règles Firestore refusent tout lot contenant deux créations de `financialPayments` sur la même pièce ou un `set` de pièce suivi d'un paiement sur elle : une étape = un lot, et un `await Promise.resolve()` suffit à faire partir le lot de `FirestoreRepo`.

LEÇON PROPOSÉE : celle de r2 (un test `?dev-local` ne prouve pas les règles ; tout plan à plusieurs écritures sur une pièce se joue à l'émulateur) est confirmée par le témoin ; un script `emulateur.mjs` (esbuild du vrai code + SDK client + règles copiées) est réutilisable pour toute voie d'écriture financière. Autre : un bouton stylé par une seule classe est battu par `.mod button { color: inherit }` ; ouvrir la capture a trouvé un bouton noir sur noir que les tests ne voyaient pas.
