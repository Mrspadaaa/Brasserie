OK — contexte du compagnon Finances sans TX-… ni cashComplete ; pièces nommées par leurs mots ; 3 lignes du serveur à changer (DEMANDE PILOTE)

## Cause trouvée
1. Le contexte financier que le modèle lit (`buildFinanceAssistantContext`, bâti côté serveur par `functions/src/brewerFinanceContext.ts` à partir de `src/domain/finance/assistantContext.ts`) portait des identifiants internes : `id`, `proofId`, `planId`, `refundOfId`, `sourceIds` (« invoice:TX-… »), `closingId`, `assetId`, `recipeId`, `batchId`, `stockItemRef`, `ref`, `sourceCreativeItemId`, le drapeau anglais `cashComplete`, et des chemins `transactions/{id}`. Les phrases d'alerte des calculateurs partagés (ledger, annual) citent aussi l'identifiant (« Justificatif manquant : TX-… — … », « Montant à vérifier : TX-… », « Paiement supérieur à la pièce TX-… »).
2. Le serveur (`functions/src/prompts.ts` l. 89 et 90) ordonne au modèle : « Cite … les vrais IDs de pièces/budgets dans le texte » et « Respecte … cashComplete ». Il recopie donc ce qu'on lui demande. Hors de mon périmètre : DEMANDE PILOTE ci-dessous.
3. Le client (feuille du compagnon, `FinanceAssistant.tsx`, `compagnon/contexte.ts`) n'envoie au chat que la question et la consigne en français ; aucun identifiant n'y passe (vérifié par test). Rien à changer dans `src/ui/finance/compagnon` ni `FinanceAssistant.tsx`.

## Fichiers écrits
- `src/domain/finance/assistantContext.ts` : lignes sans identifiant (libellé, fournisseur, date, montant, échéance, n° de facture, `justificatif: 'enregistré'`) ; `ledger.caisse` et `forecast.caisse` = `'complète'` ou absents (jamais un faux complète, `cashCents` reste `null` si inconnu) ; chemins des sources en français ; nouveau `nommeurDePieces` qui remplace, dans toutes les phrases du contexte, l'identifiant connu par « libellé, fournisseur, date, montant » (« TX-1 — Loyer » devient « « Loyer », fournisseur, date, montant ») ; enveloppe de `simulateBreweryInvestment` qui lit `caisse: 'complète'` (l'outil serveur reçoit le `ledger` du contexte : sans cela l'outil aurait perdu la caisse).
- `tests/unit/assistantContextSansId.test.ts` (neuf, 7 tests) ; `tests/integration/compagnonContexte.test.tsx` (+1 test) ; `tests/integration/financeAssistantContext.test.ts` (10 assertions mises à jour : elles décrivaient `id`, `sourceIds`, `closingId`, `recipeId`, `batchId`, `cashComplete`, que ce choix remplace).
- `tests.txt`, `build.txt`, `emulateur.txt`.

## Test rouge avant correction
- `tests/unit/assistantContextSansId.test.ts` sur HEAD : 4 échecs sur 6 (« TX- » présent, `cashComplete` présent, alerte sans les mots de la pièce, `ledger.caisse` absent).
- `compagnonContexte.test.tsx` (nouveau test) sur `assistantContext.ts` de HEAD : échec `not.toMatch(/TX-|PAY-9|PL-MAT/)` ; vert avec la correction (fichier remis après l'essai, `cmp` identique).

## Critères
- G1 `vitest-lu.mjs tests.txt` : `VITEST OK` (2 fichiers, 20 tests). Aussi : `financeAssistantContext.test.ts` 25/25 (rejoué avec un alias temporaire vers `functions/node_modules` du dépôt principal, absent du worktree ; config temporaire supprimée), dont le test de harnais Finances.
- G2 : `BUILD OK` avec `npx vite build` (sortie dans le scratchpad). `npm run build` complet échoue dans ce worktree sur `tsc` : `functions/src/brewerCatalogueStore.ts` et `brewerScenarioStore.ts` ne trouvent pas `firebase-admin/firestore` (dépendance de `functions/` absente du worktree, sans lien avec cette voie).
- G3 : `TSC OK`.
- G4 : `V6A OK`.
- G5 : `EMULATEUR OK`.
- Essais : 1 par critère.

## Captures
Aucune : ce correctif change le texte envoyé au modèle, pas un pixel (la feuille et le chat sont intacts, `FinanceAssistant.tsx` non touché). Aucune réponse du modèle n'est montrable sans Gemini. `cap/` vide. À juger sur le rejeu en ligne après le diff serveur ci-dessous.

## DEMANDE PILOTE : diff exact de `functions/` (je n'y ai pas touché)
1. `functions/src/prompts.ts` l. 89 : remplacer
   `Cite FINANCE dans evidenceIds et les vrais IDs de pièces/budgets dans le texte quand utiles.`
   par
   `Cite FINANCE dans evidenceIds. Dans le texte, nomme chaque pièce, projet ou budget par ses mots (libellé, fournisseur, date, montant, titre) ; n’écris jamais un identifiant ni un nom de champ du contexte (amountCents, caisse…) dans la réponse.`
2. `functions/src/prompts.ts` l. 90 : `Respecte coverage, scope, complete, missing, cashComplete et les null.` devient `Respecte coverage, scope, complete, missing, caisse (« complète » ou absente : absente veut dire trésorerie inconnue) et les null.`
3. `functions/src/prompts.ts` l. 92 : `Si cashComplete=false, pas de promesse…` devient `Si la caisse n’est pas « complète », pas de promesse…`
4. `functions/src/brewerHarness.ts` l. 726 : `un solde certain quand cashComplete=false` devient `un solde certain quand la caisse n’est pas « complète »`.
5. `functions/src/brewerHarness.ts` l. 256 : `data: { asOf: finance.asOf, scope: finance.scope, cashComplete: finance.ledger?.cashComplete, sourceIds: [...].map(row => row.id) }` devient `data: { asOf: finance.asOf, scope: finance.scope, caisse: finance.ledger?.caisse }` (les lignes n'ont plus d'`id` : sans ce changement `sourceIds` devient une liste de `null`).
6. `tests/integration/financeAssistantContext.test.ts` l. ~232 : `toContain('cashComplete=false')` devient `toContain('caisse')` (ce test lit `prompts.ts`).
`functions/src/brewerFinanceTools.ts` n'a pas à changer (l'enveloppe de `simulateBreweryInvestment` accepte `caisse`).
Entre mon changement et ce diff : le modèle ne voit plus d'identifiant ni de `cashComplete` dans le contexte, mais le prompt lui parle encore de `cashComplete` et d'IDs. Il se tait ou nomme ; à rejouer en ligne après le diff.

## Doutes et limites
- Les autres noms de champs du contexte restent anglais (`amountCents`, `complete`, `frozen`, `inForecast`, `payment: 'unpaid'`…) : les renommer tous casserait le prompt, 25 tests et le harnais pour un gain incertain. Seuls les identifiants internes et `cashComplete` sont retirés. Si le brasseur revoit « amountCents » dans une réponse, il faudra traduire tout le contexte (à décider).
- Filet côté rendu possible (hors mon périmètre : `BrewerChat`) : masquer tout « TX-… » dans la réponse affichée. Non fait : le modèle ne reçoit plus de TX- à recopier ; à ne faire que si un rejeu en reproduit.
- `git status` : mes écritures sont `assistantContext.ts`, les trois fichiers de tests, `tests/unit/assistantContextSansId.test.ts` et ce dossier ; les autres fichiers modifiés (TransactionJournal, prevision, previsions, libelles, u2Pures, w1Mineurs…) sont ceux de w1.
- Les écritures de la feuille m4ia-c côté serveur restent la limite connue : le serveur lit tout le registre, la restriction passe par la consigne.

## Mots du brasseur / mission
CONNAISSANCE : le contexte financier est bâti côté serveur à partir de `assistantContext.ts` (bundle `functions/lib/financeContext.js`), et le prompt (`prompts.ts`) dicte au modèle les noms de champs à citer : toute exigence « le modèle ne dit pas X » se corrige aux deux endroits.
LEÇON PROPOSÉE : un test de contexte envoyé à un modèle liste les identifiants du jeu d'essai et les noms de champs interdits, et rejoue aussi le texte du prompt qui les nomme ; sinon le prompt redemande ce que le contexte a retiré.
