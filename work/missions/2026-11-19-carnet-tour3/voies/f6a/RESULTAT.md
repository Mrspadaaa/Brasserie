OK — f6a : LR1-5, v3-3, v3-4, LR3-3, LR2-3 corrigés et testés (commit 84551fc8e, port-carnet) ; captures à prendre par v5

Commit 84551fc8e (port-carnet) : src/ui/depense/finale.ts, src/ui/finance/controlesCroises.ts, tests/unit/depense/f6a-tour3.test.ts (14 tests, neuf), et attendus de 3 tests partagés (lecture-d/ecran, lecture-d/finitions, g2a/tout-valider : +2 lignes chacun dans `lire`, plus un attendu `'repris'` → `null` dans tout-valider : « Annuler » rend maintenant une unité LUE, pas déduite).

## Preuves
- Rouge : tests-rouge.txt (11 rouges, 3 témoins verts). Vert : f6a-tour3 + lecture-d + g2a + f1-tour3-b : tout vert sauf lecture-d/serveur (3). Final : `npx vitest run tests/unit/depense tests/unit/expenseSheet.test.tsx tests/integration/expense` → tests-final.txt : 2817 verts, 4 rouges.
- 4 rouges, tous préexistants : lecture-d/serveur.test.ts (3, empreinte de functions/) et tests/integration/expenseSheet.test.tsx:155 (« confirmation explicite des valeurs corrigées »). Preuve : finale.ts et controlesCroises.ts remis à HEAD (copie, puis restaurés, diff vérifié) → les mêmes 4 échouent. Limite : ExpenseSheet.tsx (f6b) reste modifié pendant cette preuve ; le rouge expenseSheet.test.tsx n'est donc prouvé préexistant que pour MES fichiers.
- tsc : 0 erreur.
- Tests partagés : seuls les attendus de LR1-5 (« 30 g » barré sous « 30 g ») changent : le provisoire de Sabro/Citra lit Kg (final sans unité : Kg), la 3.8 « g » reste une vraie correction. Aucun autre attendu touché.

## Id | verdict | état à capturer (banc v3, ?dev-local, 390 clair et 1280 cave)
- LR1-5 | corrigé | `depense=reel-doc14` 1280 cave : en-tête « BRAU- UND RAUCHSHOP » sans barré ; `depense=v3-lent` 390 clair : Sabro « 30 g » sans barré, sans « 30 g » barré dessous.
- v3-3 | corrigé | `reel-doc2` : fournisseur sans barré quand il est contenu dans le nom retenu (ressemblance ≥ 0,9 ou mots entiers ≥ 4 car.).
- v3-4 | corrigé | `reel-doc2` : Règlement « À payer » sans « Payé » barré (correction seulement si la 1re lecture a LU une preuve payé/impayé, pro-forma, devis, avoir).
- LR3-3 | corrigé | `reel-doc25` : « MASQUE DE PROTECT. » sans « COMBINAIBON » barré ; aucune « 2 lignes lues puis retirées » parasite ; « BROSSE MET.GRAMGS » « 1 ? × 4,95 » sans barré « ? × — » (prix suit le montant retenu).
- LR2-3 | code prêt, PAS visible | `reel-doc25` : « Lectures 3/3 · 7 valeurs en désaccord » seulement après branchement f6b (DEMANDE).

DEMANDE à f6b : dans `src/ui/finance/ExpenseSheet.tsx` (~l. 1510), remplacer le littéral de la rangée « lectures » par `...rangDesLectures({attente: verif==='attente', lectures: lectures??0, nPagesLues, nDesaccords})` (import depuis `./controlesCroises`). Sans cela LR2-3 n'est pas visible.

Doutes : seuils d'appariement (0,5 / 0,7 / 0,9) réglés sur les fixtures et les cas reel-doc14/2/25, non mesurés sur un lot neuf ; à contrôler sur captures v5. Gemini : aucun appel.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
