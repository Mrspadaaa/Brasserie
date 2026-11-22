# f6a — REPRISE (agent arrêté à 200 k, rien n'est commité)

## Fait (non commité, dans port-carnet)
- `src/ui/depense/finale.ts` :
  - `varianteDeFournisseur` (LR1-5 en-tête, v3-3) : ressemblance ≥ 0,9 ou nom court contenu en mots entiers (≥ 4 car.) → pas de `corrections.entete.vendor` ; la valeur de la 3.8 est reprise.
  - `reglementLu` (v3-4) : `corrections.entete.paiement` seulement si la 1re lecture a LU une preuve (paid/unpaid), une pro-forma, un devis ou un avoir.
  - Boucle des cellules d'`appliquerFinale` : `VALEURS_GARDEES` (quantity, unitPrice, amount) jamais remplacées par l'inconnu du final ; « 1 × total » (`unFoisTotal`) : le prix suit le montant retenu (LR3-3 « 1 ? × 4,95 » sous « ? × — ») ; correction `unit` ignorée quand `uniteEffective` est la même (LR1-5 « 30 g » sous « 30 g »).
  - `alignerLignesLues` + `tableDeRangs(final, n, jeton, provisoire.items)` (LR3-3) : ancres = paires proposées (serveur ou position) dont le nom ressemble (≥ 0,5) ou au même montant, sauf si une autre ligne du provisoire porte presque le même nom (≥ 0,9, `mieux`) ; reste aligné par Needleman-Wunsch (≥ 0,7, ou 0,5 à montant égal). État de l'art : celui du serveur (`functions/src/invoiceScanVote.ts:160`, « alignement de deux séquences autour d'ancres (diff, Needleman-Wunsch) »).
- `src/ui/finance/controlesCroises.ts` : `rangDesLectures({attente, lectures, nPagesLues, nDesaccords})` (LR2-3) : « 3/3 · 7 valeurs en désaccord », resume « 7 valeurs en désaccord ».
- `tests/unit/depense/f6a-tour3.test.ts` (neuf, non suivi) : 14 tests. Rouge : `voies/f6a/tests-rouge.txt` (11 rouges, 3 témoins verts). Vert : `tests-vert.txt` (14/14, avant le dernier réglage des ancres : à rejouer).
- Trois tests partagés modifiés par script (`scratchpad/patch-tests.mjs`, split/join) : `tests/unit/depense/lecture-d/ecran.test.tsx`, `lecture-d/finitions.test.tsx`, `g2a/tout-valider.test.tsx` : dans `lire`, Sabro et Citra sans unité deviennent « Kg » aux deux lectures (la 3.8 les lit « g ») pour garder trois VRAIES corrections. Le script a peut-être tourné (pas de sortie lue) : vérifier `git diff --stat tests/unit/depense`.

## Reste à faire
1. `npx vitest run tests/unit/depense/f6a-tour3.test.ts tests/unit/depense/lecture-d tests/unit/depense/g2a tests/unit/depense/f1-tour3-b.test.ts` : attendus seuls rouges = `lecture-d/serveur.test.ts` (3, préexistants, functions/). Si ecran/tout-valider/finitions restent rouges sur les comptes (« 1 corrigée » au lieu de 3) : leur fixture `lecturesLenteur` (apercuDev.ts, à f6b) corrige Sabro/Citra en « g » alors que le provisoire montre déjà « 30 g » déduit → c'est LR1-5 ; mettre à jour le helper `lire` ou DEMANDE à f6b.
2. Rejouer `tests-vert.txt`, puis `tests-final.txt` (`tests/unit/depense tests/integration/expense*`) ; préexistants : `expenseSheet.test.tsx:155` et `lecture-d/serveur.test.ts` (3) ; `f6b-tour3.test.tsx` est à f6b.
3. `npx tsc --noEmit -p tsconfig.json` (filtrer finale.ts, controlesCroises.ts, f6a-tour3).
4. Commit par chemins : finale.ts, controlesCroises.ts, tests/unit/depense/f6a-tour3.test.ts, et les 3 tests partagés si modifiés.
5. RESULTAT.md + DEMANDE à f6b : dans `ExpenseSheet.tsx:1510`, remplacer le littéral de la rangée « lectures » par `...rangDesLectures({attente:verif==='attente',lectures:lectures??0,nPagesLues,nDesaccords})` (import depuis `./controlesCroises`) ; sans ce branchement LR2-3 n'est pas visible.

## États à capturer (banc v3, ?dev-local)
- LR1-5 : `depense=reel-doc14`, 1280 cave : en-tête « BRAU- UND RAUCHSHOP » sans barré ; `depense=v3-lent` 390 clair : Sabro « 30 g » sans barré.
- v3-3 et v3-4 : `reel-doc2`, 1280 cave et 390 clair : fournisseur sans barré ; Règlement « À payer » sans « Payé » barré.
- LR3-3 : `reel-doc25`, 1280 cave et 390 clair : « MASQUE DE PROTECT. » sans barré « COMBINAIBON » ; aucune « 2 lignes lues puis retirées » ; « BROSSE MET.GRAMGS » « 1 ? × 4,95 » sans barré.
- LR2-3 : `reel-doc25` « Lectures 3/3 · 7 valeurs en désaccord » (après le branchement f6b).
