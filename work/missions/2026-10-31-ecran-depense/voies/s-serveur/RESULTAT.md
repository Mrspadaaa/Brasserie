OK — provisoire en flux côté serveur : provisoireDeDeux, rangProvisoire, jeton ; dix témoins rouges puis verts ; tsc fonctions vert

## Fichiers écrits
- `functions/src/invoiceScanVote.ts` : `provisoireDeDeux(l1, l2)`, `rangsProvisoires(provisoire, final)` (rapprochement + repli par la position), `Csv8Io.provisoire?`, `lireCsv8` appelle `io.provisoire` entre les Flash-Lite et la 3.8 (jamais attendu), puis pose `rangProvisoire` sur chaque ligne finale.
- `functions/src/invoiceVisionReview.ts` : une ligne, `export { alignLines as alignerLignes }`.
- `functions/src/ai.ts` : `FluxProvisoire`, 5e paramètre facultatif de `scanInvoiceSafely`, jeton sur une copie rendue, handler `async (request, response?)` avec `randomUUID` et `response.sendChunk`.
- `tests/unit/depense/lecture-d/serveur.test.ts` : 25 tests (les dix témoins et leurs variantes).
- Dans la voie : `rouge-avant.txt`, `vert-apres.txt`, `tsc-app.txt`, `rangs-banc.ts` et `rangs-banc.txt` (mesure hors ligne, des comptes seulement).

## Critère 1 : témoins rouges avant, verts après
Avant (`rouge-avant.txt`, arbre d'avant) : `Tests 15 failed | 10 passed (25)`. Rouges : T1, T4, T4 bis, T5, T6, T6 bis, T7, T7 bis, T8, T8 bis, T9, T9 bis, T9 ter, T10, T10 ter.
Verts avant, par nature : T2, T3, T3 bis, T7 ter, T8 ter, T8 quater, T10 bis et les trois tests d'empreinte. Ce sont des gardes d'absence (« aucun provisoire », « aucun jeton ») qu'un arbre sans la fonction satisfait. T2 et T3 du plan sont de cette nature : ils ne pouvaient pas être rouges avant. Ils gardent le cas d'aujourd'hui.
Après (`vert-apres.txt`) : `serveur.test.ts (25 tests)` vert.

## Critère 2 : tests existants, aucune attente changée
`invoiceScanCsv8` (31), `invoiceScanVote` (55), `invoiceScanTransport` (12), `invoiceScanBudget` (30), `invoiceScanCache-d273c` (5), plus `invoiceScanCore` (10) et `invoiceScanMontantSeul` (15) : tous verts.
L'empreinte change : `serveur.test.ts` le dit sans figer de valeur (`une ligne de plus dans ai | invoiceScanVote | invoiceVisionReview change l'empreinte`).

## Critère 3
- `copie.mjs "npx vitest run tests/unit/depense/lecture-d/serveur.test.ts tests/unit/invoiceScan --maxWorkers=2"` : `Test Files 8 passed (8) | Tests 183 passed (183)`.
- `copie.mjs "npx tsc --noEmit -p tsconfig.json"` : **exit 2, une erreur qui n'est pas à moi** : `src/services/aiClient.ts(188,57): error TS2347: Untyped function calls may not accept type arguments.` C'est `runFlux` de la voie c-client (`callAiTask.stream`), rejouée deux fois, même sortie. Aucun de mes fichiers n'est cité.
- tsc des fonctions (`cd functions && npx tsc --noEmit -p tsconfig.json`) : exit 0, sans sortie. Il tourne dans le dépôt (pas besoin de la copie).

## Critère 4
`git status --short` sur mes chemins : `functions/src/{ai,invoiceScanVote,invoiceVisionReview}.ts` modifiés, `tests/unit/depense/lecture-d/` (le dossier contient aussi `flux.test.ts` de c-client). Les autres lignes du statut (`src/services/aiClient.ts`, `geminiScanner.ts`, `src/ui/**`, `work/**`) ne sont pas de moi.

## Mesure sur les pièces du banc (hors ligne, des comptes)
`npx tsx work/missions/2026-10-31-ecran-depense/voies/s-serveur/rangs-banc.ts` :

    RANGS 12/14 pièces avec provisoire : 184 lignes finales avec un rang sur 190 (6 nulles) ; 184 lignes provisoires dont 0 sans ligne finale ; rang différent de la position 0

- Les 184 lignes provisoires ont leur ligne finale : 183 par `alignerLignes`, 1 (doc13) par le repli de position. Concorde avec PLAN § 2 bis.
- 6 lignes finales ajoutées (`rangProvisoire: null`) sur 6 pièces, ce que dit R2.
- Aucun rang pris deux fois (le script le vérifie).
- Limite : 12 pièces et 1 tirage, un indice.

## Écarts au plan (tous compatibles)
1. **`alignerLignes` est un alias d'export** (`export { alignLines as alignerLignes }`), pas un renommage : `l1-plan/apparier.ts` ajoute à une copie du fichier `export { alignLines as alignerLignesCopie }` ; un renommage l'aurait cassé. Le comportement est identique.
2. **`onProvisoire(data, meta)`** reçoit en second argument `{ model, elapsedMs, pages? }` : `scanInvoiceSafely` connaît le modèle, la durée et les pages, le handler non. Le handler fabrique le morceau `{ etape:'provisoire', jeton, data, model, elapsedMs, pages? }` du contrat § 5. Le morceau n'a donc pas changé pour le client.
3. **Le jeton va sur une copie** (`{ ...reviewed.result, provisoireJeton }`), jamais sur l'objet que le registre a gardé : le cache ne le rejoue pas (T9 ter). `rangProvisoire`, lui, est gardé par le cache (ajout facultatif, comme le plan le dit). Un final servi du cache a donc des rangs mais pas de jeton : C5 et E4 (ignorés) le couvrent.
4. **Une levée de `onProvisoire` = morceau non parti** : ni `rangProvisoire` ni jeton, le final est identique à celui d'un appel sans flux (T10). Une promesse rejetée est avalée, mais le morceau compte comme parti (le serveur ne peut pas savoir) : le client, lui, ne se fie qu'à l'égalité des jetons (M4).
5. **3.8 en échec** : `rangProvisoire` = identité (le final est le provisoire plus la coupure), sans passer par le rapprochement (T5, T10 ter).
6. Le handler n'est pas testé de bout en bout : `aiTask.run(request)` ne passe pas de `response`, et `.stream()` du test est « Coming soon » (PLAN § 2). Ce qui est testé : `scanInvoiceSafely` avec un `onProvisoire` (T8 à T10). Le glue du handler (`acceptsStreaming && response` → `sendChunk`) tient en quatre lignes, lues, non jouées.

## Doutes et limites
- Rien joué en ligne : le réseau de Google peut mettre en tampon un SSE (PLAN, doutes). À prouver au premier essai en ligne.
- Le provisoire coûte un second `reconcileInvoiceVision` sur deux lectures (quelques ms, après le calcul de `needsThird`) : non mesuré à part.
- `invoiceScanVote.ts` garde sa mention « module pur » : `lireCsv8` appelle `io.provisoire`, qui reste une dépendance injectée.

CONNAISSANCE : sur banc-k6-C, `rangsProvisoires` rattache 184 lignes provisoires sur 184 à leur ligne finale (183 par `alignerLignes`, 1 par le repli de position), et la 3.8 ajoute 6 lignes sur 6 pièces sur 12 : aucun rang pris deux fois, aucun rang différent de la position.
LEÇON PROPOSÉE : aucune. (Un test qui n'écrit qu'« absent » est vert sur l'arbre d'avant : pour qu'un témoin « sans effet » soit rouge d'abord, il lui faut un préalable qui prouve que l'effet existe ailleurs. Je l'ai fait pour T9 et T10.)
