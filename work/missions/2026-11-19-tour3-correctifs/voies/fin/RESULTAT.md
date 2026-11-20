OK — compte « 0 opération · 1 à payer » ; fiche à payer : « Confirmer le paiement » et « Retirer cette écriture » ; 4 tests voisins à mettre à jour

## PLAN (écrit avant le code)
1. Test d'abord (`tests/integration/financesTour3.test.tsx`), rouge sur le code actuel (L13).
2. T2-3 : la liste épingle les « à payer » hors période (voulu, commentaire de `bases` dans `TransactionJournal.tsx`) ; le compte le dit : `Frise` reçoit `horsPeriode` (« 1 à payer »), calculé dans `TransactionJournal` sur les mêmes lignes que la liste. Frise, sélecteur, piles : intacts.
3. T2-4 (a) : `TransactionDetails` : bouton principal d'une sortie ouverte = « Confirmer le paiement » (même `onPay` qu'avant) ; l'état « à confirmer » garde « Confirmer le paiement » (un toucher) + « Noter un paiement ».
4. T2-4 (b) : « Retirer cette écriture » pour toute écriture (même chemin `retirerEcriture` : inversion des paiements s'il y en a, puis `revertTransaction`, qui garde tous les refus de lien : avoir, amortissement, stock consommé).
5. Preuve : tests voisins, tsc, banc Chrome (390 tactile, 844×340, 1280, clair et cave), captures ouvertes.

## Règle comptable citée (PRODUCT.md avant le code)
PRODUCT.md n'a pas de section « finances » (ligne 85 : « Stocks, finances, clients — inventaire, TVA suisse, factures QR », rien de plus). La règle vit dans le code et ses commentaires : `src/ui/finance/modifier/retirerEcriture.ts` — « Les règles Firestore interdisent de supprimer une pièce et un paiement : on ne supprime donc rien » ; la fiche le redit (« Une écriture ne se supprime jamais : elle sort de la liste, et "Écritures annulées uniquement" la montre »). Conséquence : pour une écriture à payer, « Annuler » et « Retirer » étaient déjà la même opération (`StorageService.revertTransaction`, sans paiement à inverser) ; seul le mot changeait. Aucune règle n'exige de garder « Annuler » à côté : les liens (avoir, amortissement, stock reçu ou consommé) sont refusés par `revertTransaction` lui-même, avec son motif, pour une libre comme pour une liée. Un seul bouton, le mot du brasseur.

## Rouge « avant » (code d'origine, 7 échecs sur 10)
```
× T2-3 > octobre : … « 0 opération · 1 à payer »
   AssertionError: expected '31 jours · 0 opération1er31' to match /31\s*jours\s*·\s*0\s*opération\s*·\s*1\s*à payer/
× T2-3 > octobre avec une opération payée : expected '31 jours · 1 opération1er31' to match /1\s*opération\s*·\s*1\s*à payer/
× T2-4 > le bouton principal dit « Confirmer le paiement » : expected <button …> to be null  (« Noter un paiement » présent)
× T2-4 > un seul bouton « Confirmer le paiement » : Unable to find … name /^Confirmer le paiement/
× T2-4 > une écriture à payer … « Retirer cette écriture » : expected <button …> to be null  (« Annuler cette écriture » présent)
× T2-4 > liée à un avoir : Unable to find … name "Retirer cette écriture"
× T2-4 > liée au stock : Unable to find … name "Retirer cette écriture"
✓ novembre (dans la période), ✓ « à confirmer » inchangé, ✓ payée garde Retirer   (3 garde-fous qui passaient déjà)
Tests 7 failed | 3 passed (10)
```

## Fait (n° → preuve)
- **T2-3** : l'épinglage des « à payer » hors période est VOULU (`TransactionJournal.tsx`, `bases.keep` : « Tout montre au moins ce que montrent les courantes »). Le compte le dit donc : « 31 jours · 0 opération · 1 à payer » (« à encaisser » si entrées, « à régler » si mixte). Compté sur les mêmes lignes que la liste (filtres recherche/catégorie suivis ; rien hors archives ni exercice). Frise, poignées, sélecteur de période : intacts. Rouge avant → vert après (3 tests T2-3).
- **T2-4 (a)** : sortie ouverte (à payer, partielle) : « Confirmer le paiement », même `onPay` qu'avant. « À confirmer » (état inconnu) : inchangé (un toucher + « Noter un paiement »). Une entrée garde « Noter un encaissement ».
- **T2-4 (b)** : « Retirer cette écriture » pour toute écriture (plus de « Annuler cette écriture » : même opération). Texte de confirmation adapté si aucun paiement (« rien à inverser »). Liens : refus de l'avoir, de l'amortissement, du stock consommé testés (pièce liée et libre) : la pièce reste, motif dit.
- Aucun calcul de solde touché.

## Critères
- G1 `VITEST OK` (10/10 ; rouge d'avant ci-dessus). G2 `TSC OK` (une erreur transitoire de StocksTab, autre voie, résorbée). G3 : « avant » cité.
- Essais : 1 par critère. Banc : plusieurs essais (cacheDir vite à part, EPERM avec la voie voisine).

## Fichiers écrits
`src/ui/finance/TransactionDetails.tsx`, `TransactionJournal.tsx`, `operations/Bande.tsx`, `operations/Frise.tsx`, `tests/integration/financesTour3.test.tsx` ; ici : `banc-fin.mjs`, `banc-sortie.txt`, `tests.txt`, `captures/`. NB : `UpgradeWorkspace.tsx` apparaît modifié dans `git status` : pas par cette voie.

## À regarder en vision (pilote)
`?dev-local`, Finances › Opérations, ‹ période précédente › une fois (Oct.) avec une dépense « à payer » datée d'aujourd'hui : l'en-tête de la frise dit « … 0 opération · 1 à payer » et la ligne est là. Toucher la ligne : bouton noir « Confirmer le paiement » ; « Corriger une erreur de saisie » › « Retirer cette écriture » › texte « rien à inverser ». 390 tactile, 844×340, 1280 ; clair et cave. Captures ouvertes par moi : m390 clair (octobre, fiche), m390 cave (retrait), d1280 clair, p844 clair (fiche) : rien ne déborde. `captures/apres-*`. Pas de captures « avant » (ancien code non rejouable sans toucher aux voies voisines) : le rouge des tests en tient lieu.

## Tests voisins (tests.txt) : 4 échecs HORS Possède, attendus, à mettre à jour par le pilote
- `ficheBarre.test.tsx` l.87 : `'Noter un paiement'` → `'Confirmer le paiement'` ; l.92 : `'Annuler cette écriture'` → `'Retirer cette écriture'`.
- `fnJeuEnLigne.test.tsx` l.96-98 : « une dépense à payer garde “Noter un paiement” » → « Confirmer le paiement ».
- `avisApresAnnulation.test.tsx` l.40-41 : `'Annuler cette écriture'` → `'Retirer cette écriture'`, puis `'Confirmer la correction'` → `'Confirmer le retrait'`.
- `financesLot2.test.tsx` l.130-133 (« une pièce déjà payée n'a pas de bouton… ») : la fixture est en réalité `unpaid` ; la pièce à payer porte désormais ce bouton (décision plus récente, T2-4). Passer la fixture à `paymentStatus:'paid'` avec un paiement.
Les 96 autres tests voisins passent.

DÉCISION À PRENDRE : « Confirmer le paiement » sur une pièce à payer ouvre la feuille de paiement (date, montant), alors que dans la liste « ✓ Payé » écrit d'un toucher et que « Confirmer le paiement » de la liste ne vaut que pour l'état « à confirmer ». J'ai suivi le contrat (même geste qu'avant, mot changé). Option : un toucher payé aujourd'hui en banque comme la liste. Recommandation : garder la feuille (la date réelle se demande).
CONNAISSANCE : PRODUCT.md n'a pas de section finances ; la règle « une écriture ne se supprime jamais, elle s'annule » vit dans `retirerEcriture.ts` et les règles Firestore.
LEÇON PROPOSÉE : aucune
