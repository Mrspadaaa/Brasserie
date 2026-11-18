OK — le client lit le flux d'aiTask : morceau provisoire, final, délai de 150 s, flux fermé = erreur (flux.test.ts 25/25)

Voie c-client, lenteur D (D308, D310). Aucun déploiement, aucun commit, aucun appel Gemini ; le callable est simulé.

## Fichiers écrits
- `src/services/aiClient.ts` : `AiClient.runFlux(req, onEtape, signal?)`, type `AiFluxEtape`. `run` est inchangé dans son comportement
  (sa charge et son traitement de la réponse sont extraits dans `chargeDe` et `reponseDe`, que `runFlux` réemploie).
- `src/services/geminiScanner.ts` : `scanDocument(file, tier, options?)`, `scanPages(files, options?)`, type `ScanFluxOptions`,
  `normalizeResult` garde `rangProvisoire` et `provisoireJeton`, `ScanOutcome.jeton`, méthode `appeler` (voir plus bas).
- `tests/unit/depense/lecture-d/flux.test.ts` : 25 tests (témoins 1, 1b, 1c, 2 à 7, plus des cas voisins).
- Dans la voie : `rouge.txt` (avant), `vert-1.txt`, `vert-2.txt`, `vert-3.txt`, `tsc.txt` (après).

## Ce que l'écran (voie E) appelle
- `GeminiScannerService.scanDocument(file, 'fast', { onProvisoire, signal })` et `GeminiScannerService.scanPages(files, { onProvisoire, signal })`.
  Le tier reste le deuxième paramètre de `scanDocument` (`QuickActionModal.tsx:332` le passe).
- **Sans option, ou avec des options vides : un seul appel `AiClient.run`, comme aujourd'hui**, ce qui garde verts tous les tests qui
  simulent `AiClient: { run }`. Le flux n'est lu que si `onProvisoire` ou `signal` est donné.
- `onProvisoire(o: ScanOutcome)` : `ok:true`, `jeton` (celui du morceau), `result` passé par `normalizeResult` (ids `line-N`),
  `model`, `elapsedMs`, `proofDataUrl`, `fileName`, `mimeType`, et `pagesLues` seulement si le morceau dit N pages. Pas de `documentHash`.
- Le final : le `ScanOutcome` d'aujourd'hui ; `result.provisoireJeton` et `result.items[i].rangProvisoire` (entier, `null` = ajoutée par
  la 3.8, clé absente = le serveur ne le dit pas). Un rang invalide est omis, jamais lu comme « ajoutée ».
- `onProvisoire` qui lève : avalé, le final arrive quand même. Appelé 0 fois si le serveur n'envoie aucun morceau (cache, ancien serveur,
  pièce sans 3.8). Un morceau d'une autre étape ou mal formé (jeton absent, `data` absente) est ignoré.
- Erreurs (toutes en `ok:false`, jamais d'exception) : flux fermé sans résultat → « Le serveur IA a fermé la connexion sans réponse… » ;
  150 s → le message de `deadline-exceeded` d'`humanize` ; `signal` levé → « Lecture interrompue. » ; erreur SDK → `humanize` ;
  `ok:false` du serveur après un morceau → rendu tel quel (le message du serveur).
- Un callable sans `.stream` retombe sur `run`. Un `signal` déjà levé ne lance aucun flux.

## Critères
1. **Témoins rouges d'abord.** `rouge.txt` (arbre d'avant, `flux.test.ts` écrit seul) : `Tests 20 failed | 5 passed (25)`. Les 5 verts sont des
   témoins de « rien ne change » (final sans option, `scanPages` sans option, ancien résultat sans nouvelles clés, signal déjà levé).
   Après : `Test Files 2 passed (2) / Tests 32 passed (32)` (`vert-1.txt` : flux.test.ts + geminiScanner.test.ts).
2. **Tests qui importent `aiClient` ou `geminiScanner`** (79 fichiers de `grep -rlE "services/(aiClient|geminiScanner)" tests`, aucune attente changée) :
   `vert-2.txt` : `Test Files 77 passed, 1 failed (78) / Tests 970 passed, 1 failed`. L'échec est `tests/integration/AppRoutePile.test.tsx` (« No
   useHopV55SemanticCompanionCycleV1 export is defined on the Host mock », hors de mes fichiers) ; **rejoué seul : 2/2 verts** (`vert-3.txt`).
   Un test de pile d'écrans, sans rapport avec le flux ; il peut être instable sur la copie partagée.
3. **Copie isolée** : la commande du critère donne `exit 0` (`vert-1.txt`) ; `copie.mjs "npx tsc --noEmit -p tsconfig.json"` : exit 0, aucune sortie (`tsc.txt`).
4. `git status --short` : de mon côté, seulement `src/services/aiClient.ts`, `src/services/geminiScanner.ts` et `tests/unit/depense/lecture-d/`.
   Les autres lignes (`functions/src/*`, `ExpenseSheet.tsx`, `src/ui/depense/*`, etc.) sont celles de s-serveur et r4-port-d.
   Le test de la voie E/S (`finale.test.ts`, `serveur.test.ts`) n'existait pas encore dans `lecture-d/` au moment du contrôle.

## Contrôle complémentaire contre le vrai SDK (hors livrable)
Les témoins simulent `stream()` d'après ma lecture de `streamAtURL`. Pour ne pas m'y fier seul, j'ai joué `AiClient.runFlux` dans la copie isolée,
sur le vrai `@firebase/functions` 0.12.9 (`firebase` 11.10) avec un `fetch` simulé (test jeté, non gardé : il vivait dans la copie) :
message puis résultat → 1 morceau reçu, final rendu ; **503 en texte brut → `ok:false` « fermé sans réponse »** (sans ma garde, `data` ne se résout jamais) ;
message SSE `error` → « Service IA momentanément indisponible. » ; `signal` levé → « Lecture interrompue. » ; une réponse JSON (non SSE) avec `result` → `ok:false`
aussi (flux fermé sans SSE : le SDK ne lit pas ce corps ; sans conséquence, un vrai `aiTask` ancien répond en SSE quand le client le demande, § 2 (a)).

## Écarts au plan et choix de lecture
- Plan § 5 : « `scanDocument` et `scanPages` prennent `{ onProvisoire, signal }` en option » : je les ai posés en **dernier paramètre** (3e de `scanDocument`).
- Plan § 5 : pas de `provisoire: true` repris côté client. Le serveur l'enverra (§ 2 (a)) dans `data` ; `normalizeResult` ne le garde pas, car le contrat de § 5 ne le liste pas.
  À demander à E s'il en veut un (une ligne : champ facultatif de `ScannedInvoiceResult`).
- `GeminiScannerService.appeler(req, options, provisoire)` est public (comme `fileToDataUrl`) : un détail d'implémentation, qui n'est pas pour l'écran.
- Le minuteur de 150 s part à l'entrée de `runFlux`, avant l'encodage base64 : il couvre l'envoi, comme le `timeout` du callable simple.
- `this.run(req) as Promise<AiResponse<T>>` : `this.run<T>` donnait TS2347 dans l'objet littéral ; sans effet à l'exécution.

## Doutes et limites
- « Flux fermé » repose sur le fait que le SDK pose `result` avant de fermer le flux (`createResponseStream`, vu dans le code et vérifié sur le SDK réel). `runFlux`
  laisse 8 micro-tâches après la fermeture avant de dire « rien reçu » ; un `result` qui arriverait plus tard qu'une fermeture serait refusé, ce que le SDK ne fait pas.
- Rien n'a été joué sur Cloud Run : la mise en tampon d'une réponse SSE par le réseau de Google reste à prouver au premier essai en ligne (PLAN.md, Doutes).
- Aucun test de l'écran ici (voie E). `ExpenseSheet.tsx` appelle toujours `scanDocument(file)` : aucun changement visible tant qu'E n'a pas branché `onProvisoire`.

CONNAISSANCE : sur le SDK installé, un faux flux simulé « fermé avant le résultat » n'existe pas : `createResponseStream` résout `data` à la ligne `result`, puis ferme le flux.
Un flux qui se ferme avec `data` encore en attente n'arrive que pour une réponse non SSE (401, 429, 503 de Cloud Run, vérifié : le 503 texte donne ce cas). Les témoins de flux
doivent garder le faux flux ouvert jusqu'au résultat (porte), sinon ils testent un cas impossible. Sous Vitest + jsdom, `useFakeTimers` doit se limiter à `setTimeout` et `clearTimeout` :
le FileReader de jsdom (`setImmediate`) se fige sinon.
LEÇON PROPOSÉE : aucune.
