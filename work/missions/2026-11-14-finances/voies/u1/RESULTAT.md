OK — 19 apport annulable, 20 « Retirer cette écriture » en un geste, 18 Nouvelle dépense en colonne centrée à 1280.

## Fichiers écrits
- `src/domain/finance/correctionMontant.ts` : `paiementsVivants` exporté ; `planRetrait` (un contre-paiement par paiement en vigueur).
- `src/ui/finance/modifier/retirerEcriture.ts` (neuf) : `retirerEcriture` = refus anticipé si un avoir actif est lié, puis `executerPlan` (un lot par étape), puis `StorageService.revertTransaction`.
- `src/ui/finance/TransactionDetails.tsx` : « Corriger ce paiement saisi par erreur » aussi pour un apport / prélèvement (19) ; pièce payée : bouton « Retirer cette écriture » + confirmation (dit que la suppression est interdite, que l'écriture sort de la liste et que « Écritures annulées uniquement » la montre) ; pièce sans paiement : « Annuler cette écriture » inchangé.
- `src/ui/finance/ExpenseSheet.tsx` : colonne `[data-dp="colonne"]` (`lg:max-w-[760px]`, centrée, bordures latérales) autour de l'en-tête, de la bande, des champs et du pied ; « Total TTC » : `pt-1.5` devenu `pt-4` (18).
- `work/.../voies/q5/emulateur.mjs` (entrée d'empaquetage `voies/u1/entree.ts`) : 4 contrôles neufs (retrait d'une dépense payée en deux fois, d'un apport, d'un prélèvement ; témoin : annuler une pièce encore payée est refusé).
- Tests neufs : `tests/integration/apportAnnulable.test.tsx` (2), `retirerEcriture.test.tsx` (6), `nouvelleDepenseColonne.test.tsx` (2).
- Voie : `capturer.mjs`, `capturer-ecritures.mjs`, `sonder.mjs`, `entree.ts`, `cap/` (36 captures), `tests.txt`, `tests-liste.txt`, `build.txt`, `emulateur.txt`.

## Rouge avant correction (sur HEAD)
- 19 : `apportAnnulable.test.tsx` rouge sur HEAD, 2 échecs (« Unable to find … Corriger ce paiement saisi par erreur », apport et prélèvement), vert après.
- 20 : `retirerEcriture.test.tsx` rouge sur HEAD parce que `retirerEcriture.ts` n'existait pas (échec d'import, pas d'assertion) ; vert après (6/6).
- 18 : `nouvelleDepenseColonne.test.tsx` rouge sur HEAD (ExpenseSheet remis à HEAD le temps du test, restauré, `cmp` identique), 2 échecs : colonne absente, `pt-1.5`; vert après.
- 17 : non reproduit, rien fait.

## Critères
- G1 : `node …/vitest-lu.mjs …/u1/tests.txt` → `VITEST OK` (77 fichiers, 815 tests : les suites qui importent TransactionDetails, ExpenseSheet, correctionMontant, MovementSheet, EditTransactionModal, FinancesTab, sauf les 3 ci-dessous).
- G2 : `BUILD OK` (`npx vite build`, comme les autres voies ; `npm run build` entier échoue sur `functions/` faute de `firebase-admin` dans le worktree, sans rapport).
- G3 : `TSC OK`.
- G4 : `V6A OK` ; `FRISE OK` aussi.
- G5 : `EMULATEUR OK : 12 contrôles joués contre les règles du dépôt, un lot par étape ; témoins refusés` (les 8 anciens + 4 neufs, 9 s).
- Essais : un par critère après la correction du test de 18 (un `sed` du Bash avait perdu `\b` : relu et refait à l'Edit).

## Captures ouvertes (cap/, 390 et 1280, clair et cave)
- `depense-*-feuille` : à 1280, colonne de 760 px centrée (en-tête, bande, Total TTC, pied) ; 390 inchangé ; Total TTC visiblement détaché de la bande.
- `apport-*-a1..a4` : la fiche de l'apport offre « Corriger ce paiement… » ; confirmation ; « Annuler cette écriture » ; écriture annulée (paiement « corrigé » replié, 2 paiements conservés).
- `retrait-*-r1..r4` : « Retirer cette écriture » + phrase de confirmation ; fiche annulée ; l'écriture a quitté la liste ; `Filtres › Écritures annulées uniquement` la montre (barrée, « Annulé »). Journal : `capture-ecritures.log` (écriture absente de la liste : false, visible par le filtre : true, aux 4 combinaisons).

## Hors voie, à ne pas me prêter (pour le pilote)
- `tests/integration/expenseSheet.test.tsx` « attend une confirmation explicite des valeurs corrigées » : `equipmentAction: 'none'` attendu, `'new'` reçu. Échoue aussi avec `ExpenseSheet.tsx` remis à HEAD ; non lié aux colonnes.
- `tests/integration/financeWorkspace.test.tsx` « la bascule retire le projet de matériel » (`/Avec pompe prévue/`) : échoue aussi avec ExpenseSheet à HEAD ; tient plutôt à la voie u2 (libellés des projets).
- `tests/integration/dashboardNavigation.test.tsx` (« Garde du mois précédent ») : 2 à 3 échecs selon le tirage et la charge, 0 dans un lot de trois fichiers ; fiche brassin, aucun lien avec mes fichiers.

## Doutes et limites
- `retirerEcriture` : si l'annulation est refusée après les contre-paiements (stock consommé, amortissement lié), l'erreur le dit (« Déjà écrit : paiement inversé ») ; seul l'avoir lié est vérifié avant. L'écran reste utilisable : la ligne affiche « corrigé » et le geste se rejoue.
- La fiche d'une écriture annulée montre deux croix côte à côte (le carré d'icône « annulé » est une croix, plus la fermeture) : existant, hors voie, à regarder.
- À 1280 la colonne est fixée à 760 px y compris avec un justificatif ouvert ; non vu avec une vraie pièce (aucune lecture Gemini, interdit).
- Contre-paiement d'un paiement plus ancien que la pièce : même règle `payment.date >= original.date` que l'existant, jouée par l'émulateur.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une pièce se retire (jamais se supprime) par contre-paiements puis `voidedAt` : les règles exigent un réglé nul et `lastPaymentId` inchangé à l'annulation (`updatedTransactionGuard`) ; le contre-paiement lui-même doit avoir l'id `CONTRE-<id>` et une date ≥ celle de l'original.
LEÇON PROPOSÉE : un `sed` du Bash a encore perdu `\b` dans une regex de test (le test réécrit n'a donc pas changé) : toujours Edit pour du code, et relancer le test qui exerce la regex.
