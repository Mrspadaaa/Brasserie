OK — PRÊT À METTRE EN LIGNE 1761845a5 : E35-1, 2, 3 (partiel), 6, 9, 10, 15, 16 corrigés ; E35-13 laissé à ecr-saisie

## Plan (cause, fichier, correctif)
- E35-1 (B) : la saisie écrit la pièce ET `PLAN-<id>` (modele.ts `preparer`) ; `retirerEcriture` ne touchait qu'un plan « completed ». Correctif : `planApresRetraitRecurrent` (src/domain/finance/retraitEcriture.ts), branché dans src/ui/finance/modifier/retirerEcriture.ts. Le plan né de la pièce passe « Annulée » ; un plan écrit ailleurs, ou qui porte d'autres pièces actives, n'est jamais touché.
- E35-2 (B) : « De ma poche » rangé en Ventes et sommé. Correctif : champ `horsVentes` (calendrier.ts) posé par `calendrierPaiements.ts` (paiements) et `marquerHorsVentes` (apport promis) ; `pastille` (Rangee.tsx) ne le somme plus : « +X reçu, hors ventes » ou « attendu, hors ventes ». Jamais « à encaisser ».
- E35-3 (B) : autre entrée = `kind: income`, catégorie `recettes`, donc Ventes. Correctif : même `horsVentes: 'autre-entree'` (Calendrier), libellé « Autre entrée » (fiche, ligne), titre par défaut « Autre entrée du jj.mm » (une ligne dans src/ui/saisie/modele.ts, fichier d'ecr-saisie : voir plus bas).
- E35-6 (B) : hausse sur pièce payée = « Reste à payer » posé d'avance (`nouveauCents > ancienCents ? 'reste' : 'suit'`). Correctif : `choixParDefaut()` (correctionMontant.ts) = « Le paiement suit », « Reste à payer » reste un choix visible. EditTransactionModal.tsx : 2 lignes.
- E35-9 (m) : seules les lignes `recurring` portaient « à payer » (`proposition: 'echeance'`). Correctif : champ `prevue: 'payer' | 'recevoir'` posé par `choseArgent` sur toute pièce attendue (source `invoice`) ; pointillé (Barre, Marque), nom accessible (« , à payer » / « , à recevoir ») et Liste (« · à payer »). Je n'ai pas réutilisé `proposition: 'echeance'` : CalendrierTab:479 renverrait à Finances au lieu d'ouvrir la pièce.
- E35-10 (m) : le bloc « encaissées » (useDonneesCalendrier) ne gardait que `direction === 'in'` et `income/contribution`. Correctif : `chosesPayees` (src/domain/calendrierPaiements.ts) : une règle pour les sorties et les rentrées. Achat, autre sortie → Achats ; matériel, local → Travaux ; charges fixes, impôts, prélèvement privé → Papiers. Remboursements, pièces annulées, paiements de sens contraire, pièces encore attendues : exclus. Les pièces payées sont écartées de la fusion facture/livraison (`fusionnerFacturesLivraisons`).
- E35-15, E35-16 (D) : `libelleEcriture` (src/domain/finance/libelleEcriture.ts) : « Prélèvement privé », « Impôts », « Autre entrée » ; posé sur TransactionRow et TransactionDetails (le reste garde le libellé de la catégorie).
- E35-13 : feuille de saisie (Revient ?, carte de fin, TVA de Pour moi) = ecr-saisie. Non touché.

## Fichiers écrits (commit 1761845a5, par chemins)
src/domain/calendrierPaiements.ts (neuf), src/domain/finance/retraitEcriture.ts (neuf), src/domain/finance/libelleEcriture.ts (neuf), src/domain/calendrier.ts, src/domain/finance/correctionMontant.ts, src/ui/calendrier/useDonneesCalendrier.ts, src/ui/calendrier/frise/{Rangee,Barre,Marque,VueListe}.tsx, src/ui/finance/{TransactionRow,TransactionDetails}.tsx, src/ui/finance/modifier/retirerEcriture.ts, src/components/EditTransactionModal.tsx (2 lignes), tests/unit/ecritures23soir.test.ts (18 tests, neuf), tests/unit/saisieReprise.test.ts (1 test mis à jour : un prélèvement n'est plus « absent du Calendrier », il est en Papiers, jamais en Ventes).

## Critères
- `npx tsc --noEmit -p .` : seulement les 2 erreurs connues (seedData GanttTask, virtual:pwa-register).
- Tests : 24 fichiers liés (calendrier*, bugsWorkflowsCalendrier, correctionMontant, saisieReprise, Transaction*, modele…) + tests/unit/proprietes : 405 verts ; relancé après le commit : 141 verts (tests.log).
- Les tests ont été écrits après le code (modules neufs) : le test « sans correctif, la prévision d'une pièce retirée reste au Calendrier » rejoue le constat E35-1 sur le modèle réel. Je n'ai pas rejoué le rouge sur HEAD pour les autres (pas de `git stash`).

## Incident de commit (à connaître)
Mon premier commit (170cf424e, défait en soft reset avant tout autre commit) avait embarqué le travail en cours d'ecr-saisie dans EditTransactionModal.tsx (blocs E35-11, qui importent `resumeReglement` de modele.ts non commité). Corrigé : 1761845a5 ne contient que mes 2 lignes de ce fichier. Le travail d'ecr-saisie reste intact dans l'arbre de travail, non commité.

## Doutes et limites (preuve en ligne par le pilote, aucune capture locale)
1. src/ui/saisie/modele.ts : j'y ai changé UNE ligne (`autrei.nomDefaut` : « Recette du » → « Autre entrée du »). Fichier modifié par ecr-saisie, donc NON commité par moi : ecr-saisie doit le commiter avec le sien.
2. Opérations : l'en-tête de groupe reste « Ventes » (groupe `recettes`) et les piles de Finances (« Ventes », Mon mois, Analyse) comptent encore une autre entrée parmi les entrées de ventes. Seuls la ligne, la fiche et le Calendrier disent « Autre entrée ». Un groupe à part touche `sousTotal`, Piles et analyse : à décider.
3. E35-10 : tout paiement réel des 52 semaines passées entre dans les rangées (Achats, Papiers, Travaux), comme les ventes y entraient déjà : la frise sera plus chargée sur le passé. À regarder sur téléphone (390).
4. E35-1 : si la pièce retirée est la 1re échéance mais que d'autres pièces actives se rattachent au même plan, le plan est gardé (sa 1re échéance réapparaît alors à payer). Cas rare ; non géré.
5. E35-6 : le défaut est « Le paiement suit » pour toute hausse sur une pièce payée ; un fournisseur qui a réellement facturé plus choisit « Reste à payer » (visible).
6. Pas rejoué en ligne : ZZ TEST (retrait d'un Salaire/Loyer/Abonnement qui revient puis Calendrier ; apport et autre entrée ; achat payé 18.11 ; vente à recevoir le 23.12 ; Modifier 3,50 → 4,50).

DÉCISION À PRENDRE : groupe « Autres entrées » à part dans Opérations et les piles (voir 2) ; recommandation : oui, mais voie dédiée (touche sousTotal, Piles, analyse).
CONNAISSANCE : `git commit -- <chemins>` embarque tout l'état courant du fichier, y compris le travail d'une autre voie sur le même fichier : avant de commiter un fichier partagé, `git diff --stat -- <fichier>` doit montrer seulement ses lignes ; sinon construire l'index (hash-object + update-index) à partir de HEAD.
LEÇON PROPOSÉE : aucune
