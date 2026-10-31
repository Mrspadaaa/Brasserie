# Compris : voie r1-raccord

## Objectif
Brancher sur la feuille « Nouvelle dépense » ce que s1 et s2 ont réparé dans les services : le prix unitaire lu est gardé sur la ligne,
une description ou une date de paiement tapée n'est jamais écrasée par un scan, le reçu Drive (dossier, nom, empreinte vérifiée,
`webViewLink`) est gardé dans l'état de l'écran et dit par les textes déjà présents, et un envoi de plus de 15 s se dit « en cours »
sans être une erreur. Côté enregistrement, une ligne que s1 relie à son article (Stk contre sachet, « Kilo », « Liter », « Kg. »)
s'enregistre sans que le brasseur retape l'unité, avec une quantité exacte, jamais convertie en silence ni devinée ; une unité illisible
bloque l'entrée en stock avec les mots « unité à préciser ».

## Écrit dans
- `src/ui/finance/ExpenseSheet.tsx`
- `src/services/purchaseEntry.ts`
- `src/services/stockLineMatching.ts` (seulement l'`export` de `linkUnit`)
- `tests/unit/purchaseEntry.test.ts`
- `tests/integration/expenseSheet.test.tsx`
- `tests/unit/depense/raccord/`
- `work/missions/2026-10-31-ecran-depense/voies/r1-raccord/COMPRIS.md`
- `work/missions/2026-10-31-ecran-depense/voies/r1-raccord/PLAN.md`
- `work/missions/2026-10-31-ecran-depense/voies/r1-raccord/RESULTAT.md`

## Fini quand
- G1 : `comprendre` rend `COMPRIS OK` (ce document).
- G2 : deux regards neufs ont relu `PLAN.md`, la revue est triée, aucun bloquant sans sort (`REVUE OK`).
- G3 : `npm run build` affiche `built in`.
- G4 : `npx tsc --noEmit -p .` passe (`TYPES OK`).
- G5 : les tests de `tests/unit/depense`, `purchaseEntry`, `purchasePrefill`, `stockLineMatching`, `expenseSheet`, `jus0Journey`,
  `driveFileStore` et `financeDocumentPersistence` passent (`TESTS RACCORD OK`).
- G6 : `RESULTAT.md` contient `TEMOIN AVANT`, `372765`, `Stk`, `Kilo`, `webViewLink`, `unité à préciser` et `Rien ne se perd`.
- Par défaut : chacun des sept défauts R1 à R7 a un test écrit d'abord, rouge sur le code d'aujourd'hui (sortie dans `r1-rouge.txt`),
  puis vert après la correction. Rien n'est inventé, une valeur tapée n'est jamais écrasée, les montants restent en centimes entiers.
- Premier temps (ce message) : `COMPRIS.md`, G1, `PLAN.md`, puis arrêt avec `PLAN PRÊT — <n> défauts`. Aucun code avant la revue triée.

## Ne fait pas
- Aucun élément nouveau à l'écran (bouton de mouture S5, signal S8, base de la date A7) : ils vont à la voie écran. Seuls changent des
  textes déjà présents (la ligne « Justificatif … », le message d'envoi).
- Pas de changement de l'appariement (s1), de la fiche d'un produit (S6), de la lecture (l2), de `Units` global, de `functions/`.
- Pas de Gemini réel, pas de Drive réel, pas de déploiement, pas de commit, pas de `git stash`, pas d'installation.
- Pas de lecture de `functions/.env`, `.codex/`, `source4-portable-bundle-manifest-01.json`, `work/refonte-frontend/v4/choix/`,
  `work/missions/2026-10-31-ecran-depense/brasseur/` ; rien du nom ni de l'adresse du brasseur dans une fixture.
- Rien d'écrit hors du « Possède » ; aucun champ retiré d'un document Firestore.

## Doutes
- R6 dit qu'« une unité lisible mais incompatible (kg face à g d'un houblon, D213) reste refusée », alors que kg et g sont de la même
  famille et que la même consigne veut « 6 Kilo → 6 000 g ». Ma lecture : le refus vise les familles différentes (Stk face à un houblon en g,
  litre face à un grain en g, sachet face à kg) ; kg ↔ g continue de se convertir, comme aujourd'hui. À confirmer par le pilote.
- R4 : la feuille se ferme dès que l'enregistrement réussit (`onSaved(); onClose()`), donc le reçu n'a pas de place pour s'afficher après
  un succès sans élément neuf. Ma lecture étroite : le reçu est gardé en état et dit par les textes existants (« Justificatif rattaché… »
  du rattachement, la ligne du pied « Le justificatif sera rangé… » quand l'envoi a abouti mais que la confirmation reste en attente), et
  passé à `onSaved` pour la voie écran. Rien de neuf n'est dessiné.
- R7 : la consigne dit « ligne reliée ». Je lis toute ligne dont l'entrée en stock est demandée (article existant ou nouvel article), car
  une unité `-` ou `n/a` deviendrait sinon l'unité du nouvel article. Plus large que la lettre ; à valider.
- R5 : `SACHET_MAX_G` n'existe que dans l'appariement (poids lu dans le libellé). À l'enregistrement, l'unité `g` face à un article en
  sachets n'est pas une équivalence : refus comme aujourd'hui, sans autre règle ; le seuil n'est pas recopié dans `purchaseEntry.ts`.
- R1 : un prix unitaire reste lié à l'unité imprimée ; si le brasseur retape l'unité de la ligne, le prix lu n'a plus de sens. Je propose
  de le retirer à ce moment-là (petit ajout dans `updateLine`), ce que la consigne ne dit pas.
- `expenseSheet.test.tsx` simule `savePurchaseWithProof` ; l'écran appellera `savePurchaseWithProofReceipt` : ce test (dans mon Possède)
  sera adapté, sans que ses attendus changent.
