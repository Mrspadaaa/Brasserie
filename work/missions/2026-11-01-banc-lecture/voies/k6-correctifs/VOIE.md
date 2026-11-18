# Voie k6-correctifs — poser les correctifs de sa pièce et du doublon (D261b, D262a, D262c, D264a)

Agent : `auteur` (Sonnet). Plafond : 90 tours. Pilote : Opus. Aucun appel à Gemini, aucun déploiement, aucun commit.

## Entrées
- Diagnostic : `work/missions/2026-11-01-banc-lecture/voies/k6-diagnostic/RESULTAT.md` (causes, diffs proposés, tests rouges de
  `tests/unit/depense/banc-k6/`). Audit des vraies données : `work/missions/2026-10-31-ecran-depense/voies/e-reel/AUDIT.md` (R1).
- Défauts (ses mots) : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` lignes D261b, D262a, D262c, D264a.
- Banc mesuré (01.11 nuit, 14 pièces) : sur sa pièce, C★v8 lit 12/12 champs et 16/16 lignes ; la 3.8 y est appelée par `amountHT`
  et `kind` ; `tvaAmount` diverge sans l'appeler. Sortie `work/finalisation-tickets-2026-10-08/H13-reels/banc-k6-AC` (hors Git).

## À faire, dans cet ordre (chaque fois : le test rouge d'abord, puis le correctif, puis vert)
1. **D261b** : poser le correctif proposé de `sumCheck` (`functions/src/invoiceControls.ts`) ; vérifier que la règle client
   (`src/domain/finance/invoicePoints.ts`, `src/ui/depense/etat.ts`) suit (même fichier partagé ou même règle).
2. **D262a** : poser les deux correctifs proposés (`functions/src/invoiceVisionReview.ts` boucle d'en-tête ; `src/services/purchasePrefill.ts`).
   Un vrai écart de TVA reste un désaccord (test vert existant).
3. **D262c** : poser seulement le correctif de `contexteDe` (`src/services/stockLineMatching.ts`) : matériel, entretien, service, port,
   remise → « autres » ; repli sur le préfixe de référence pour un ingrédient sans mot de famille. **Ne touche ni `src/ui/depense/groupes.ts`
   ni `ExpenseSheet.tsx`** : de nouvelles bandes (sucre, matériel, emballage) sont un choix de dessin du brasseur (L24) ; marque le test des
   bandes neuves `it.todo` avec la raison.
4. **D264a** : `duplicateMatch` (`src/services/purchaseEntry.ts:82-98`) reconnaît un achat déjà au registre sous la forme historique de
   l'audit (écritures `B-…` : lis le code d'import et l'AUDIT pour leur forme exacte ; fixture inventée de même forme, aucune valeur réelle) :
   même fournisseur, même total (somme des écritures d'une même pièce si c'est ainsi qu'elles sont rangées), références en commun. Test rouge
   d'abord. Ne change ni le schéma Firestore ni les données.
5. **Ne pose pas** le correctif D261c (`SOFT_KINDS`, nom, ancre) : il change quand la 3.8 est appelée et attend son choix.
6. Retire les tests « AUJOURD'HUI … à retirer une fois le correctif posé » des correctifs posés ; remets `releveDivergences` au niveau du
   code posé (parité testée).
7. Contrôle de non-régression du banc, sans appel : `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --hors-ligne
   --reprendre work/finalisation-tickets-2026-10-08/H13-reels/banc-k6-AC --variantes A,Csv8 --normaliser --repeat 1 --cas
   cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json --out <os.tmpdir()>/banc-k6-apres` puis
   `scripts/banc-lecture-facture-juger.ts -- <ce dossier>` : comparer à `H13-reels/banc-k6-jug/RESULTAT-BANC.md` (avant). Aucun champ ni ligne
   juste de moins, aucun faux vert de plus ; écrire les deux tableaux résumés dans le RESULTAT (comptes seulement).

## Contrôles (tous dans la copie isolée : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<cmd>"`)
- `npx tsc --noEmit -p .` → 0 erreur ; `cd functions && npx tsc --noEmit -p .` → 0 erreur.
- `npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts
  tests/unit/geminiScanner.test.ts tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/unit/invoiceScanVote.test.ts
  tests/unit/dateFieldMois.test.tsx tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx
  tests/integration/jus0Journey.test.tsx tests/integration/financeDocumentPersistence.test.ts --maxWorkers=2` → tout vert (aucun rouge laissé).
- Les tests de `functions/` qui couvrent les fichiers touchés (cherche-les par `grep`), verts.

## Possède
`functions/src/invoiceControls.ts`, `functions/src/invoiceVisionReview.ts`, `src/services/purchasePrefill.ts`,
`src/services/stockLineMatching.ts`, `src/services/purchaseEntry.ts`, `scripts/banc-lecture-facture.ts` (relevé seulement),
`tests/unit/depense/banc-k6/`, tests neufs de ces fichiers, `work/missions/2026-11-01-banc-lecture/voies/k6-correctifs/RESULTAT.md`.
Rien d'autre (L17 : `git status --short` à la fin, dans le RESULTAT). Aucune valeur de ses pièces ni de ses données dans le code, les
tests, le RESULTAT ou le retour. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`,
`functions/.secret.local`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`. Pas de serveur de dev dans
`C:/Users/mrspa/Documents/Brasserie`.
Retour en une ligne : `K6-CORR OK — D261b, D262a, D262c (contexte), D264a posés ; banc hors ligne sans perte — <chemin du RESULTAT>`.
