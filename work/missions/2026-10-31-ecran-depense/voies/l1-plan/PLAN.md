# l1-plan — son choix D de la lenteur : le plan technique (D308)

Voie l1-plan, 02.11, auteur Opus. Je n'ai modifié aucun code de l'app, fait aucun commit et aucun appel Gemini.
Version 2 : je reprends le plan après le REJET de `RELECTURE.md`. Les points B1 à B3, M1 à M7 et m1 à m7 sont traités ; chaque reprise
est marquée `[B1]`, `[M3]`, etc.
Fichiers écrits, tous dans `voies/l1-plan/` et hors ligne :
- ce plan ;
- `octets.mjs`, qui mesure la taille des réponses ;
- `apparier.ts`, qui mesure le rapprochement des lignes entre le provisoire et le final (§ 2 bis) ;
- `gen/invoiceVisionReview-copie.ts`, la copie qu'écrit `apparier.ts`.
Les lignes citées sont celles du worktree au 02.11, à HEAD a115e82e. `ExpenseSheet.tsx` porte des changements non commités de r4-port-d
(voir `git status`) : ses numéros de ligne bougeront avec ce port, mais les noms de fonction restent.

**Recommandation : (a), un seul appel `aiTask` qui rend deux fois** (callable en flux, `sendChunk` côté serveur, `.stream()` côté client).
- Le premier écran arrive au bout de 6,3 s médian (9,9 s pour la pire pièce) ; « Confirmer », au bout de 18,5 s médian (37,7 s au
  pire). C'est le D mesuré par m-lenteur.
- Les appels de lecture et leur coût ne changent pas. Il s'ajoute au plus un appel texte `traduireNoms` quand la 3.8 change un nom, soit
  environ 0,005 CHF la pièce au plus `[M6]`.
- Aucune règle Firestore, aucun index.

## Ses mots et sa maquette (règle n° 1)
- « La lenteur go pour la d » (SPEC, 02.11). Sa maquette : `choix-lenteur/maquettes/d-06.html`, `d-15.html` et `d-lue.html`, avec
  leurs captures `img/d-06.png`, `d-15.png` et `d-lue.png`, que j'ai ouvertes.
- À 6 et à 15 s, on voit :
  - un fil de 22 px sous l'en-tête, qui reprend la frise d'aujourd'hui avec « vérification » en cours ;
  - « Lectures ●●◌ » dans la preuve ;
  - « Confirmer » gris, avec une roue.
  `d-15` est identique à `d-06` au pixel : c'est la même attente.
- À l'arrivée de la 3.8 (`d-lue`) :
  - le fil part ;
  - « Lectures 3/3 » s'affiche ;
  - une puce bleue « ↻ 3 corrigées » s'ajoute aux autres ;
  - chaque valeur corrigée est sur fond bleu, l'ancienne barrée sous le nom (« 10 Kg × 1,45 », « 30 ? », « 50 ? ») ;
  - les rouges passent de 3 à 1 ;
  - « Confirmer » redevient noir.
- **Les cadres bleus épais des captures ne font pas partie de l'écran.** Ce sont la marque « ce qui est neuf » de la page de choix :
  la classe `.cl-vise` (`outline … var(--vise)`, `d-06.html:13`) et le style en ligne de la rangée Lectures (`d-06.html:80`). Le port
  ne les dessine pas.
- Je lis le compte de la puce comme le nombre de **rangées** corrigées, pas de cellules : 3 pour 3 lignes, alors que Malt Pilsner a
  deux cellules bleues.
- Décision du pilote : sa saisie l'emporte. La 3.8 ne réécrit jamais une cellule qu'il a touchée.

## 1. Aujourd'hui, lu dans le code

### Du client au serveur
1. **Un document.** `attach` (`src/ui/finance/ExpenseSheet.tsx:396`) verrouille la lecture (`scanLocked`, `setBusy(true)`, l. 402). Il
   calcule l'empreinte (l. 405-406). Une dépense qui a déjà le même fichier n'est pas relue (l. 411-412). Il lance le QR (l. 413), puis
   `await GeminiScannerService.scanDocument(file)` (l. 414) et `applyOutcome(outcome, documentHash)` (l. 416). Le verrou se lève dans
   `finally` (l. 418).
2. **Plusieurs pages.** `GeminiScannerService.scanPages(lot…)` (`ExpenseSheet.tsx:494`) fait un seul appel avec `files`
   (`src/services/geminiScanner.ts:104-113`). Le résultat n'est valide que si `response.pages === files.length` (l. 111).
3. `scanDocument` (`geminiScanner.ts:90-98`) passe par `AiClient.run({ task:'scanInvoice', tier:'fast', file })` (l. 95), puis
   `normalizeResult` (l. 115-147). Les lignes y reçoivent l'id `line-${index+1}` (l. 124). L'écran retrouve ensuite la rangée d'un
   point par cet id (`ligneDepuisId`, `src/ui/depense/confiance.ts:320`).
4. `AiClient.run` (`src/services/aiClient.ts:112-139`) encode le fichier en base64 (l. 121-125) et appelle le callable
   `httpsCallable(functions, 'aiTask', { timeout: AI_CLIENT_TIMEOUT_MS })` (l. 102). Le délai vaut 150 s
   (`functions/src/aiTaskDeadline.ts:27`). L'appel part en direct vers `europe-west6` (`src/services/firebase.ts:53,77`) : aucune
   réécriture de l'hébergement n'est sur le chemin (`firebase.json`, la seule réécriture mène à `/index.html`).

### Sur le serveur
5. `aiTask = onCall({ region:'europe-west6', timeoutSeconds:300, maxInstances:3, … })` (`functions/src/ai.ts:291-303`). Son handler
   ne prend aujourd'hui qu'un argument, `request` (l. 304). Pour `scanInvoice`, il appelle `scanInvoiceSafely(uid, files|file, apiKey)`
   (l. 331-336), et toute erreur devient `{ ok:false, error }` (l. 335).
6. `scanInvoiceSafely` (`ai.ts:148-204`) :
   - il valide le fichier ou les pages (l. 154) ; la clé de cache d'une lecture à pages est `cleDePages` (l. 125-128) ;
   - chaque lecture passe par `read(...)` : plafond de 45 s par appel et délai global de 100 s (l. 185, 190) ;
   - chaque lecture écrit une ligne de journal, sans contenu de facture (l. 191-192) ;
   - le tout tourne dans `runBudgetedInvoiceScan` (l. 184-202), avec `lireCsv8` pour l'ordre des appels (l. 195-201) ;
   - il rend `{ ok, data, model, elapsedMs, cached, documentHash, pages? }` (l. 203).
7. **Où les deux Flash-Lite se finissent, où la 3.8 part** : `lireCsv8` (`functions/src/invoiceScanVote.ts:133-145`).
   - Les deux Flash-Lite partent ensemble : `Promise.allSettled([readLite(1), readLite(2)])` (l. 134). **Elles sont finies à la
     l. 137.**
   - La 3.8 part à la l. 140 (`await io.readStrong()`), seulement si `needsThirdLite(l1, l2)` et que le délai n'est pas atteint
     (l. 139).
   - `needsThirdLite` (l. 42) est vrai quand une Flash-Lite manque ou que `reconcileInvoiceVision([l1, l2]).needsCorrection` est vrai
     (l. 38-40).
   - Le résultat final est `finalOfStarVote(l1, l2, third)` (l. 142, définie l. 98-104) : les valeurs de la 3.8, le statut du vote à
     trois, et les points de désaccord ajoutés.
8. **La 3.8 en échec** : l'erreur est attrapée (`invoiceScanVote.ts:140`, `third = { cause }`). La fusion revient alors à
   `finalOfTwo`, qui ajoute le point « lecture coupée » (l. 64) et la phrase « Le contrôle complémentaire n'a pas abouti. Les
   divergences restent à vérifier sur le justificatif. » (`functions/src/invoiceVisionReview.ts:213`, `ajouterCoupure` l. 221-227).
9. **Le rapprochement des lignes** se fait par référence, par nom, puis par les chiffres, jamais par la seule position : `alignLines`
   (`invoiceVisionReview.ts:116`). La fonction n'est **pas exportée**. Elle sert à `reconcileInvoiceVision` (l. 245-427).

### Le budget, le cache et le coût
10. `runBudgetedInvoiceScan` (`functions/src/invoiceScanBudget.ts:30-150`) tient une fiche par document, `invoiceScans/{id}`, dans une
    transaction (l. 33-58) :
    - `completed` : le résultat est servi sans coût (l. 37) ;
    - `running` : la fonction lève « Ce justificatif est déjà en cours d'analyse. » (l. 55) ;
    - au-delà de 3 appels par justificatif, elle refuse (l. 88, `SCAN_MAX_CALLS = 3`, `functions/src/invoiceScanCore.ts:25`) ;
    - à la fin, elle écrit `completed` ou `degraded` avec le résultat (l. 136) ; sur une erreur, `failed` ou `blocked` (l. 147).
11. L'id du cache est `invoiceScanIdFor` : version, empreinte du moteur, uid, type et octets du fichier (`invoiceScanCore.ts:148-152`).
    L'empreinte du moteur hache `ai.ts` et tous ses imports locaux (`engineDigestOf`, l. 121-131). **Toute modification de `ai.ts`
    ou de `invoiceScanVote.ts` change donc la clé** : une lecture déjà en cache n'est plus servie.
12. **Le coût** : chaque appel passe par `runWithMonthlyAiBudget` (`invoiceScanBudget.ts:99`), qui écrit le journal mensuel
    `brewerAiCosts/{mois}` et `brewerAiCosts/{mois}/calls/{id}` (`functions/src/monthlyAiBudget.ts:21-22`). Le budget du jour va dans
    `brewerAiUsage/{jour}` (`invoiceScanBudget.ts:81, 92`).
13. Les règles Firestore ne donnent au client ni `invoiceScans` ni `brewerAiCosts`. `grep invoiceScans firestore.rules` ne rend rien.
    Le bloc générique ne lit que `collectionsMetier()` (`firestore.rules:171-172`). Le serveur, lui, y écrit par le SDK Admin.

### Le retour au client
14. `applyOutcome` (`ExpenseSheet.tsx:326-386`) **reconstruit tout le brouillon en une fois** :
    - il vide les propositions et les décisions de lecture (l. 332) ;
    - il construit les lignes (l. 333-338) et déduit les unités (l. 341) ;
    - il rapproche chaque ligne du stock et crée d'office les « nouvel article » (l. 342-363) ;
    - il pose le brouillon (l. 365).
    Puis il lance `traduireLignes` sans l'attendre (l. 369-386, D280 ; 3,8 s en ligne selon m-lenteur). Cette traduction ne reprend
    jamais une ligne retouchée (l. 378).
15. **Le pied** : « Confirmer » est `disabled: saving||busy` (`ExpenseSheet.tsx:993`). `save` sort tout de suite si `scanLocked`
    (l. 520). L'icône `'spin'` existe déjà (`src/ui/depense/Pied.tsx:6, 20`).
16. **Ce qu'il voit pendant la lecture** : l'état « lecture » (`ExpenseSheet.tsx:1075-1086`), avec `FrisePages etat="lecture"`
    (l. 1082 ; `src/ui/depense/Pages.tsx:56-64`), la frise « envoi ✓ · lecture · vérification ».
17. **La rangée Lectures** : « Lectures n/n », ou « n lectures » sur un désaccord de lecture (`ExpenseSheet.tsx:970`). Elle se calcule
    sur `review.readers`.
18. **Hors ligne** : l'état `online` se met à jour sur les événements `online` et `offline` (`ExpenseSheet.tsx:204, 209`).

## 2. Les options techniques

### (a) Un appel qui rend deux fois : prouvé par le code installé
**Versions installées.** `firebase` 11.10.0 (`node_modules/firebase/package.json:3` et `package-lock.json:7861-7862` ; le dépôt demande
^11.4.0, `package.json:38`). `@firebase/functions` 0.12.9. `firebase-functions` 6.6.0 (`functions/node_modules/firebase-functions/
package.json:3` et `functions/package-lock.json:1464-1465` ; le dépôt demande ^6.3.2).

**Côté serveur, le flux existe.**
- `onCall` passe au handler un second argument, `response?: CallableResponse` (`functions/node_modules/firebase-functions/lib/v2/
  providers/https.d.ts:210`).
- `CallableResponse.sendChunk(chunk): Promise<boolean>` et `signal: AbortSignal` sont déclarés dans `lib/common/providers/https.d.ts:
  104-111`, et `request.acceptsStreaming` à la l. 98.
- L'implémentation est dans `lib/common/providers/https.js`, `wrapOnCallHandler` (l. 403) :
  - `acceptsStreaming` vaut `accept === "text/event-stream"` (l. 482) ;
  - `sendChunk` écrit `data: {"message": …}` et ne fait rien si le client n'a pas demandé le flux (l. 505-510) ;
  - la réponse finale part en `data: {"result": …}` (l. 553-555) ;
  - un battement `: ping` part toutes les 30 s (`DEFAULT_HEARTBEAT_SECONDS = 30`, l. 39 ; l. 408-423) ;
  - à la fermeture de la connexion, seul `signal` est levé (l. 426-428). **Le handler continue** : la lecture se termine et se met en
    cache.
- `.stream()` de l'objet de test est « Coming soon » (`lib/v2/providers/https.js:217-225`). Les tests appelleront donc
  `scanInvoiceSafely` ou `lireCsv8` en direct, pas `aiTask.stream`.

**Côté client, le flux existe.**
- `HttpsCallable.stream(data, { signal })` rend `{ data: Promise, stream: AsyncIterable }`
  (`node_modules/@firebase/functions/dist/functions-public.d.ts:135, 182-206`).
- Son implémentation : `httpsCallable$1` (`dist/esm/index.esm2017.js:510-518`), puis `streamAtURL` (l. 664-736), qui envoie
  `Accept: text/event-stream` (l. 673). `createResponseStream` (l. 764-847) pousse chaque `message` dans le flux (l. 778-780) et résout
  `data` sur `result` (l. 774-776).
- **Deux pièges lus dans ce code :**
  1. `stream()` n'a **aucun délai** : `streamAtURL` n'appelle pas `failAfter`, qu'emploie `callAtURL` (l. 612-614). Le client doit
     poser son propre `AbortController` à `AI_CLIENT_TIMEOUT_MS`.
  2. Une réponse qui n'est pas en flux ferme le flux sans résoudre `data` (l. 811-816 : `controller.close()`, aucun
     `resultRejecter`). C'est le cas d'un 401, d'un 429 ou d'un 503 de Cloud Run sans corps SSE. Le client doit traiter « flux fermé
     sans résultat » comme une erreur, sinon l'écran attend sans fin.
- `fetchImpl` se lit à chaque appel (l. 444-446) : le banc qui remplace `window.fetch` continue d'intercepter.

**Compatible dans les deux sens, donc sans ordre de déploiement.**
- Un ancien client n'envoie pas `Accept: text/event-stream` : `sendChunk` ne fait rien et la réponse reste celle d'aujourd'hui. Cela vaut
  aussi pour une app ancienne gardée en cache (PWA) face au serveur neuf : ni fil ni puce, sans autre conséquence `[m7]`.
- Un nouveau client face à l'ancien `aiTask`, qui n'appelle jamais `sendChunk`, ne reçoit que le résultat final : c'est A.

**Ce que (a) change côté serveur** (fichiers de la voie S) :
- `invoiceScanVote.ts` :
  - nouvelle fonction pure `provisoireDeDeux(l1, l2)` : le rapprochement de `finalOfTwo` (l. 59, 66) **sans** `ajouterCoupure`
    (l. 64), avec `review.readers = 2` et `provisoire: true`. La lecture n'est pas coupée, elle est en cours : la phrase « Le contrôle
    complémentaire n'a pas abouti » n'a rien à faire sur le premier écran ;
  - `Csv8Io.provisoire?(result)` est appelé entre la l. 137 et la l. 140, **seulement si les deux Flash-Lite sont lisibles et que la
    3.8 va partir**. Son échec ne fait jamais échouer la lecture (`try/catch`, jamais attendu avant `readStrong`) ;
  - quand un provisoire est parti, chaque ligne finale reçoit `rangProvisoire`, l'index de sa ligne provisoire ou `null` si la 3.8
    l'ajoute. Le rapprochement se fait par `alignerLignes`, avec un repli par la position (§ 2 bis). Le résultat reçoit
    `provisoireJeton`, le jeton du morceau envoyé dans **cet** appel. Ce sont des ajouts facultatifs, que le cache garde. Il n'y a pas
    de `apresProvisoire` `[M4]` : le client ne se fie qu'au morceau qu'il a reçu et à l'égalité des jetons.
- `invoiceVisionReview.ts` : `alignLines` est exportée (renommée `alignerLignes`), sans autre changement.
- `ai.ts` :
  - le handler devient `async (request, response)` ;
  - pour `scanInvoice` avec `request.acceptsStreaming`, il tire un jeton (`randomUUID`) et passe à `scanInvoiceSafely`, en **cinquième
    paramètre** facultatif, `{ jeton, onProvisoire: data => response?.sendChunk({ etape:'provisoire', jeton, data, model, elapsedMs,
    pages? }).catch(() => false) }`. Le quatrième, `evaluationOptions` (`ai.ts:148`), sert à `scripts/eval-expense-vision.mjs` et ne
    bouge pas `[m1]` ;
  - le jeton n'est posé sur le résultat que si ce résultat a été calculé dans cet appel (`reviewed.cached === false`, `ai.ts:203`). Un
    `degraded` resservi après une relecture ratée (`invoiceScanBudget.ts:139-145`) ne le porte donc jamais `[M4]` ;
  - `response.signal` n'arrête pas la lecture : une 3.8 déjà partie finit et se met en cache.

**Ce que (a) change côté client** (voies C et E) :
- `aiClient.ts` reçoit `runFlux(req, onEtape, signal?)`. Il fait `const { stream, data } = await callAiTask.stream(payload, { signal })`
  (`stream()` rend une **Promise**, `functions-public.d.ts:135`). Puis il lit les morceaux et fait `await data`.
  - Le délai propre est de 150 s. Son `AbortController` est combiné au `signal` de l'écran, qui est levé quand la feuille se ferme.
  - Un flux fermé sans résultat est une erreur.
  - Les erreurs passent par `humanize`.
- `geminiScanner.ts` : `scanDocument` et `scanPages` prennent `{ onProvisoire, signal }` en option, et `normalizeResult` garde
  `rangProvisoire` et `provisoireJeton`. Le provisoire passe lui aussi par `normalizeResult`, et porte le `jeton` du morceau.
- L'écran : voir la section 5, voie E.

**Coût.** La lecture fait les mêmes appels qu'aujourd'hui : deux Flash-Lite, plus une 3.8 sur 12 pièces sur 14, soit 0,0445 CHF par
pièce (médiane). Le journal `brewerAiCosts` et le registre `invoiceScans` (3 appels au plus) ne changent pas.

**`traduireNoms` en plus `[M6]`.** Aujourd'hui, `traduireLignes` fait un seul appel par pièce (`src/services/nomsFr.ts:128-130`). Avec
D, il en fait un au provisoire, puis un autre au final, pour les seules lignes dont le nom de base change ou que la 3.8 ajoute.
- Mesuré par `apparier.ts` : **10 pièces sur 12** ont au moins un nom ou une variante changés, ou une ligne ajoutée, soit 52 lignes.
  C'est une borne haute : une variante changée ne change pas toujours la base envoyée à la traduction.
- Coût de l'appel : la traduction d'une pièce **entière** coûte environ 0,005 CHF en 3.8, 4,1 s médian (D280,
  `work/refonte-frontend/decisions.md:1241`). Le second appel n'envoie qu'une partie des noms : sa borne est **+ 0,005 CHF sur environ
  10 pièces sur 12**.
- Ce second appel passe par `aiTask`, donc par `brewerAiCosts`.
- Variante moins chère, réversible : traduire une seule fois, au final. Les noms français arriveraient alors après « Confirmer » noir.
  Je ne la retiens pas : elle change ce qu'il voit pendant les 12 s d'attente.

**Octets.** Les octets montants ne changent pas : l'image part une fois. En descente, un morceau de plus, de la taille d'une lecture.
Mesuré par `node work/missions/2026-10-31-ecran-depense/voies/l1-plan/octets.mjs work/finalisation-tickets-2026-10-08/H13-reels/
banc-k6-C/raw` :

    OCTETS Csv81 : 14 lectures, médiane 7577, max 13911
    OCTETS Csv82 : 14 lectures, médiane 8093, max 14161

Cela fait environ 8 ko médian et 14 ko au plus. C'est le texte brut du modèle. Le morceau réel porte la lecture normalisée et ses points :
il est donc plus gros, mais du même ordre, et sans enjeu face à l'image qui monte `[m5]`.

**Risques.**
- Une connexion tenue ouverte jusqu'à 37,7 s, aujourd'hui déjà le cas avec A. Le battement est à 30 s.
- Le flux fermé sans résultat (piège 2 ci-dessus).
- Je n'ai pas pu vérifier dans le code ce que fait Cloud Run d'un handler dont le client s'est déconnecté (CPU après fermeture). Le
  risque est le même aujourd'hui avec A, et la section 4 dit le repli.
- Le changement de l'empreinte du moteur (point 11).

### (b) Deux appels
- **Appel 1** : les deux Flash-Lite. Le serveur garde les deux lectures normalisées dans `invoiceScans/{id}`, par le SDK Admin, sous un
  nouveau statut `provisoire`. Elles pèsent de 8 à 14 ko chacune, sous la limite de 1 Mo d'un document. Il rend le provisoire.
- **Appel 2** : la 3.8, puis le vote, en relisant les deux lectures gardées. **Il doit renvoyer l'image.** La 3.8 la lit, le serveur
  ne la garde pas, et elle ne tient pas dans Firestore : jusqu'à 4 Mo, soit environ 5,6 M caractères en base64, ou 16 M caractères
  pour des pages (`ai.ts:106`). Le serveur ne relit pas l'image avec les Flash-Lite.
- **Durée de garde** : jusqu'à l'appel 2, bornée comme `RUNNING_STALE_MS` à 10 min (`invoiceScanBudget.ts:29`). Passé ce délai, le
  provisoire est servi tel quel, comme un `degraded`.
- **Temps** : le premier écran est celui de (a). « Confirmer » arrive **plus tard que A et que (a)** : 18,5 s médian, plus un
  aller-retour, plus le renvoi de l'image, plus deux transactions de budget. Je n'ai pas mesuré ce surplus (aucun banc de transfert).
- **Coût** : les mêmes appels Gemini. Les octets montants doublent.
- **Risques** :
  - il faut toucher le registre d'argent : une `fence` par appel, le passage `provisoire → running → completed`, le compteur de 3
    appels réparti sur deux requêtes (`invoiceScanBudget.ts:33-58, 88`) ;
  - un onglet fermé entre les deux appels laisse la 3.8 jamais lancée ;
  - les deux appels peuvent tomber sur deux instances (`maxInstances: 3`), ce que Firestore permet.
- **Aucune règle et aucun index** (SDK Admin), mais un code d'argent plus risqué, pour un « Confirmer » plus lent.

### (c) Les autres options que le code rend possibles
- **(c1) Le client écoute `invoiceScans/{id}` par `onSnapshot`** : le serveur écrirait le provisoire puis le final dans la fiche.
  **Écartée** : il faut une règle de lecture de `invoiceScans` (point 13), ce qui demande son accord.
- **(c2) Le provisoire rendu par la réponse, la 3.8 finie après la réponse dans la même instance.** **Écartée** : la suite n'a plus de
  canal vers le client, à moins de (c1) ou d'un second appel. Après la réponse, Cloud Run ne garantit pas le CPU (comportement de la
  plateforme, non lu dans ce code).
- **(c3) La 3.8 lancée en même temps que les Flash-Lite**, ce qui est possible parce qu'elle ne voit pas leurs valeurs (`ai.ts:197`).
  « Confirmer » passerait de la somme des durées au plus long des deux. La pire pièce, doc9 (8,6 + 29,1 s), passerait de 37,7 s à
  29,1 s. Mais la 3.8 partirait sur 14 pièces sur 14 au lieu de 12, avec trois réservations de budget ouvertes ensemble. Le temps
  d'une 3.8 lancée en parallèle n'est pas mesuré, et c'est hors de la mesure qu'il a choisie. **Non retenue maintenant** ; voir
  « Décision à prendre ».

## 2 bis. Le rapprochement provisoire → final, mesuré `[M3]`
Commande, hors ligne et sans appel :
`npx tsx work/missions/2026-10-31-ecran-depense/voies/l1-plan/apparier.ts --banc=banc-k6-C`.

Méthode :
- Les lectures `Csv81`, `Csv82` et `Csv83` viennent de `H13-reels/banc-k6-C/raw`, chargées comme dans `m-lenteur/mesurer.ts` : même
  `readingFromResponse` avec N, et même règle « la 3.8 que le code appellerait ».
- Le provisoire est `reconcileInvoiceVision([l1, l2]).result`, la base de `provisoireDeDeux`. Le final est `finalOfStarVote(l1, l2, l3)`.
- Le rapprochement est `alignLines`, pris dans une **copie** du fichier de production, écrite par le script dans `gen/` : imports
  redirigés, un export ajouté. `functions/src/` n'est pas touché.
- Le script n'écrit que des comptes.

    APPARIER 12/14 pièces avec provisoire : 183 lignes rapprochées sur 184 provisoires (99.5 %) et 190 finales (96.3 %) ; sans paire
    1 provisoires, 7 finales, sur 7 pièces ; repêchables par la position 1 (listes de même longueur : 6 pièces) ; rapprochées hors de
    leur rang 0 ; rapprochées et changées 80
    CHAMPS CHANGES (lignes rapprochées) : variant 37, stockCategory 25, name 22, price 12, unit 10, kind 2
    NOMS 10/12 pièces ont au moins un nom changé ou une ligne ajoutée (52 lignes)

Ce que ces nombres disent :
- **Les lignes ajoutées par la 3.8 sont fréquentes** : 7 lignes, sur 6 pièces sur 12 (doc3, doc6, doc10, doc11, doc12 et doc14 ont
  chacune une ligne finale sans paire). Le choix l2-lignes (D310) vise donc un cas courant, pas un cas rare.
- **Une seule ligne provisoire perd sa paire** : doc13, qui n'a qu'une ligne et dont la 3.8 change à la fois le nom et le montant. C'est
  le cas annoncé par la relecture.
- **Le repli est nécessaire et suffit sur ce banc** : quand les deux listes ont la même longueur, un orphelin provisoire de rang i se
  rapproche de l'orphelin final de rang i. Il repêche doc13 (1 sur 1). Hors de ce cas, aucun repli : la ligne finale est « ajoutée » et
  la provisoire « non lue ». Le choix l2-lignes dit comment elles se montrent.
- Aucune ligne rapprochée ne change de rang : la renumérotation (§ 4 bis, B3) ne déplace donc rien sur ce banc. Elle reste exigée, pour
  un ordre qui changerait.
- 80 lignes rapprochées ont au moins un champ différent. Ce sont surtout la variante (37) et la famille (25), qui ne sont pas toujours
  des cellules visibles. La puce compte les cellules **du brouillon** qui changent, après les mêmes transformations (B1) : jamais ces
  80 champs bruts.
- Limites : 12 pièces et 1 tirage, donc un indice. Le repli n'est éprouvé que sur 1 cas.

## 3. La recommandation : (a)

| | 1er écran (méd / pire) | « Confirmer » (méd / pire) | appels | coût par pièce (méd) | règles ou index |
|---|---|---|---|---|---|
| aujourd'hui (A) | 18,5 s / 37,7 s | 18,5 s / 37,7 s | 2 + 3.8 sur 12/14 | 0,0445 CHF | — |
| **(a) un appel en flux** | **6,3 s / 9,9 s** | **18,5 s / 37,7 s** | identiques, + un `traduireNoms` sur environ 10 pièces sur 12 | 0,0445 CHF + ≤ 0,005 | aucun |
| (b) deux appels | 6,3 s / 9,9 s | > 18,5 s (+ aller-retour et renvoi de l'image, non mesuré) | identiques | 0,0445 CHF | aucun (registre touché) |
| (c1) écoute de la fiche | 6,3 s / 9,9 s | 18,5 s / 37,7 s | identiques | 0,0445 CHF | **règle neuve : écartée** |

Toutes les durées viennent de `voies/m-lenteur/RESULTAT.md` (tableau, ligne D). Ce sont des temps côté serveur : le transfert n'est pas
compté, et `traduireNoms` (3,8 s) part après le premier écran sans le retarder.

Pourquoi (a) :
1. Il tient les deux nombres de son choix sans en perdre un. (b) retarde « Confirmer », et (c1) demande une règle.
2. La justesse finale est celle de A (154/165 champs, 217/224 lignes), puisque la fusion finale est inchangée (`finalOfStarVote`).
3. Il ne touche pas au registre d'argent (`invoiceScanBudget.ts`).
4. Il marche avec un client ou un serveur ancien : aucun ordre de déploiement.
5. Les deux pièces sans 3.8 (doc7 3,1 s et doc8 9,9 s) ne reçoivent aucun morceau provisoire. Leur écran arrive déjà final, comme
   aujourd'hui.

Le contrôle en ligne de m-lenteur concorde : sur doc14 le 02.11, les deux Flash-Lite ont pris 6,1 et 6,6 s, puis la 3.8 14,8 s. Avec
(a), son écran serait arrivé vers 6,6 s, et « Confirmer » vers la même fin qu'aujourd'hui.

## 4. Les cas limites, dans la forme de sa maquette

« Fil », « ●●◌ », « roue », « puce » et « bleu » renvoient à sa maquette. **À montrer** marque un cas que sa maquette ne dessine
pas : je propose une forme sans la décider.

| cas | ce qu'il voit | ce que fait « Confirmer » |
|---|---|---|
| **3.8 normale** (12 pièces sur 14) | `d-06` dès le provisoire, puis `d-lue` : le fil part, « Lectures 3/3 », puce « ↻ N corrigées » si N > 0, valeurs bleues et ancienne barrée, drapeaux recalculés sur le final | gris avec la roue, puis noir |
| **pièce sans 3.8** (doc7, doc8 : 3,1 et 9,9 s) | l'écran final d'emblée, sans fil, « Lectures 2/2 » (forme d'aujourd'hui, `ExpenseSheet.tsx:970`) | noir d'emblée |
| **3.8 en échec** (erreur, sortie coupée, refus du budget) | le final arrive avec les valeurs du provisoire et le point « lecture coupée » (`invoiceScanVote.ts:64`) ; le fil part, la rangée dit « 2 lectures » en attention (forme d'aujourd'hui, l. 970), aucune puce « corrigées » | noir ; le point est un drapeau comme les autres |
| **3.8 en retard** (plus de 40 s) | le fil, « ●●◌ » et la roue restent ; la 3.8 est coupée à 45 s par appel (`ai.ts:190`) et l'ensemble à 100 s (`ai.ts:185`), puis c'est le cas « en échec » | gris jusqu'à l'arrivée, puis noir ; aucune attente au-delà de 100 s plus l'envoi. Un « Confirmer sans attendre » n'est pas dans sa maquette : **à montrer** seulement si le pilote le juge utile, sinon rien |
| **erreur après le provisoire** (IA mise en pause pendant la 3.8 : `stopped.signal.throwIfAborted()`, `invoiceScanBudget.ts:134`, rendu en `ok:false`, `ai.ts:335`) | les valeurs provisoires restent, comme dans le cas « en échec » ; le message d'erreur se place où ? **à montrer** (la rangée d'erreur d'aujourd'hui, `ExpenseSheet.tsx:1087`, ne vise que l'absence de lecture) | noir ; les drapeaux du provisoire restent |
| **hors ligne pendant la 3.8** | le flux tombe ; les valeurs provisoires restent, le fil et la roue aussi ; au retour en ligne (événement `online`, l. 209), le client relance **une fois** le même appel, que le serveur sert depuis le cache (`invoiceScanBudget.ts:37`, sans coût) s'il a fini ; s'il tourne encore : « déjà en cours » (l. 55), et le client réessaie une fois 20 s plus tard. Le fil « en attente du réseau » n'est pas dessiné : **à montrer** | gris tant que le final n'est pas là (sa règle), au plus jusqu'à la fin de partie (ligne suivante) |
| **fin de partie : la reprise échoue, ou un `running` n'expire pas** `[M2]` | l'attente est **bornée côté client** : 150 s après l'envoi (`AI_CLIENT_TIMEOUT_MS`), ou après la seconde reprise ratée. L'écran prend alors la forme du cas « 3.8 en échec », qui existe déjà : le fil part, la rangée dit « 2 lectures » en attention (`ExpenseSheet.tsx:970`), et le récap porte la phrase de production « Le contrôle complémentaire n'a pas abouti. Les divergences restent à vérifier sur le justificatif. » (`invoiceVisionReview.ts:213`), posée par le client sur le provisoire. Ses saisies restent. Cette issue est **à montrer** : la forme existe, mais son emploi sans réponse du serveur est neuf | noir ; il enregistre les valeurs provisoires, avec leurs drapeaux, comme aujourd'hui après une 3.8 coupée |
| **feuille fermée, ou onglet fermé** `[M1]` | la feuille **se ferme** pendant la vérification : « Fermer » n'est pas bloqué. Le `signal` de l'écran coupe le flux ; rien n'est gardé côté client, comme aujourd'hui quand on ferme après une lecture. Le serveur finit et met en cache (`https.js:426-428`). Rouvrir le même fichier : le final arrive tout de suite (`cached`), sans fil ni morceau | noir |
| **un final sans jeton égal après un provisoire** `[M4]` (le `degraded` resservi, `invoiceScanBudget.ts:139-145`) | l'en-tête se fusionne comme d'habitude. Les lignes se rapprochent par la position si les deux listes ont la même longueur ; sinon les lignes provisoires restent telles quelles, et l'écran prend la forme de la fin de partie | noir |
| **un final seul, sans morceau** (cache, ancien serveur, pièce sans 3.8) `[M4]` | `applyOutcome` comme aujourd'hui ; `rangProvisoire` et `provisoireJeton`, s'ils sont là, sont ignorés | noir |
| **plusieurs pages** | le même chemin : `scanInvoiceSafely` lit les pages d'un seul appel (`ai.ts:154`), et le morceau porte `pages` ; le fil est celui de `FrisePages` avec `pages` (`Pages.tsx:56`) | comme le cas normal |
| **une cellule qu'il a touchée** | sa valeur reste, sans fond bleu ; une valeur de la 3.8 qui en diffère n'est ni posée ni montrée | ne dépend pas de la cellule |
| **une ligne qu'il a ajoutée** (id `crypto.randomUUID()`, `ExpenseSheet.tsx:67`, jamais `line-N`) | intacte | — |
| **une ligne qu'il a supprimée** | la 3.8 ne la fait pas revenir, même corrigée | — |
| **une ligne que la 3.8 ajoute** (`rangProvisoire: null` ; 7 lignes sur 6 pièces sur 12, § 2 bis) | une rangée de plus, id `line-${nProvisoire + k}` (B3), à sa place dans le groupe ; elle compte 1 dans la puce. Sa forme : **le choix l2-lignes** (D310), pas encore fait ; E l'attend | — |
| **une ligne que la 3.8 ne lit plus** (1 ligne sur 184, § 2 bis, repêchée par la position) | « rien ne se perd » : je ne la retire pas en silence. Sa forme : **le choix l2-lignes** | — |
| **un en-tête corrigé** (numéro, HT, type de pièce, total, date…) | sa saisie l'emporte, comme sur une rangée (§ 4 bis, B2). Sa maquette ne corrige que des rangées. Le fond bleu et l'ancienne valeur barrée sur un champ d'en-tête : **à montrer**. Le champ compte une fois dans la puce | — |

## 4 bis. La règle de fusion (`src/ui/depense/finale.ts`, pure, voie E)

### La base de comparaison `[B1]`
- **La base est le brouillon tel que l'a posé `applyOutcome` du provisoire.** Ce n'est pas la valeur brute de la lecture. Au moment où
  `applyOutcome(provisoire)` pose le brouillon (`ExpenseSheet.tsx:365`), E prend un **instantané** `base`, par id de ligne et par
  cellule, pour toutes les cellules de la liste B2. C'est la même idée que `lectureLigne` (l. 368), qui ne garde aujourd'hui que
  `quantité|unité`.
- Cet instantané suit la **seule** écriture faite par le programme entre le provisoire et le final : le `.then` de `traduireLignes`
  (l. 370-384), qui pose `nameFr` et parfois `stockAction` et `stockRef`. Ces cellules, l'instantané les reprend au même moment.
  Tout autre changement vient d'un de ses gestes. Les effets d'un geste comptent comme ce geste : la catégorie Rénovation (l. 251),
  ou le prix vidé quand il change l'unité (l. 246).
- **Le final passe par les mêmes transformations** avant toute comparaison. Il faut d'abord extraire, sans changer son comportement, le
  calcul pur des lignes d'`applyOutcome` (l. 333-363) : libellé lu, Rénovation, unités déduites, rapprochement du stock, nouvel article
  d'office. Ce calcul devient `lignesDeLecture(result, stock, existants)`, qui rend les lignes et les propositions. L'en-tête prend les
  mêmes fonctions qu'aujourd'hui : `invoiceTotalProposal`, `applyScannedDescription` et `applyScannedPayment`
  (`src/services/purchasePrefill.ts:144`).
- Pour chaque cellule `c` d'une ligne appariée :
  - elle est **touchée** si `courant[c] !== base[c]`, ou si son registre (B2) la nomme, ou si elle a le focus à l'arrivée du final
    `[m3]` ;
  - touchée, elle ne change pas ;
  - sinon, elle prend `final[c]`, et la correction `{ id, champ, avant: base[c], apres: final[c] }` est notée si les deux valeurs
    diffèrent.
- Témoin rouge E1 : une unité absente du provisoire, déduite (« kg »), que le brasseur ne touche pas, et que la 3.8 lit « g ». Le
  final pose « g », bleu, avec « kg » barré. Le test échoue si la comparaison se fait sur la valeur brute (`''` ≠ « kg » ⇒ jugée
  touchée).

### La liste des cellules et leur registre « touché » `[B2]`
Partout, « touché » = `courant ≠ base` **ou** le registre de la cellule.

En-tête : la cellule du brouillon, d'où vient sa valeur, et son registre.

| cellule | ce qui la pose | registre |
|---|---|---|
| `vendor` | `result.vendor` (l. 365) | `reviewedFields` `'vendor'` (l. 206 ; posé l. 612 et dans la carte d'en-tête, l. 1017) |
| `date` | `result.date` | `'date'` (l. 611, 1013) |
| `invoiceNumber` | `result.invoiceNumber` | `'invoiceNumber'` |
| `amount`, `sourceAmount`, `sourceTotalBasis` (le total : une seule cellule) | `invoiceTotalProposal`, `result.amountTTC` | `'amountTTC'` (`setTotal`, l. 550) |
| `sourceVatAmount`, `sourceVatRate` (la TVA : une seule cellule) | `result.tvaAmount`, `result.tvaRate` | `'tvaAmount'` ; le choix d'une valeur de TVA dans le panneau (l. 887) ajoute `'TVA|'` à `reglees` : la cellule est touchée |
| `sourceNetAmount` (HT) | `result.amountHT` | aucun aujourd'hui : diff seul ; E ajoute `'amountHT'` à `reviewedFields` au geste |
| paiement (`paymentStatus`, `paymentDate`…) | `applyScannedPayment` | `'paymentEvidence'`, et `paymentDateBasis === 'typed'`, que `applyScannedPayment` respecte déjà (`purchasePrefill.ts:146`) |
| `description`, `descriptionSource` | `applyScannedDescription` | `descriptionSource === 'typed'` |
| `category` | `result.category` | `'category'` |
| `sourceCurrency` | `result.currency` | `'currency'` (l. 613) |
| `sourceDocumentType`, `sourceOrderNumber` | `result.documentType`, `result.orderNumber` | diff seul (aucun champ ne les édite aujourd'hui) |
| `scanModel` | toujours celui du final | ce n'est pas une cellule |

Rangée : la cellule de `PurchaseLineDraft`, d'où vient sa valeur, et son registre.

| cellule | ce qui la pose | registre |
|---|---|---|
| `description` (libellé), `nomLu`, `imprime` (nom et **variante**) | `libelleLu`, `lireOptions` (l. 335) | diff ; le libellé tapé (l. 747) |
| `kind` (nature) | `scanKind`, Rénovation (l. 336-338) | `manuallyClassified` (l. 138) |
| `quantity`, `unit` | lecture, puis `avecUnitesDeduites` (l. 341) | diff ; le segment d'unité (l. 820) |
| `unitPrice`, `amount` | lecture, seulement si la devise est CHF (l. 335) | diff |
| `stockCategory` (la famille) | lecture | diff ; la bande change si la famille change (m3, plus bas) |
| `sourceReference`, `evidence` | lecture | diff ; `evidence` suit sa ligne et n'est jamais une correction montrée |
| `stockAction`, `stockRef`, `articleName` (le lien au stock) | rapprochement (l. 342-363), traduction (l. 379-382) | `manuallyClassified`, `articleName` tapé, « Garder » (l. 795) |
| `nameFr` | traduction | voir M6, plus bas |

`alphaPct` et `vatCode` ne sont pas des cellules du brouillon. L'écran les lit dans `scan.result.items`. Ils suivent donc le résultat
final remappé (B3). L'α qu'il tape sur la fiche d'un nouvel article vit dans le brouillon de l'article et n'est pas réécrit.

Témoin rouge E2 : il tape la date (`reviewed('date')`, même valeur que la base, ou une autre) ; la 3.8 lit une autre date. Sa date
reste, et aucune correction n'est comptée.

### Une seule table « rang final → id du brouillon » `[B3]`
Elle se construit une fois, puis s'applique à **tous** les champs du final qui portent une ligne.
- Une ligne appariée (`rangProvisoire = r`, ou le repli par la position) prend l'id `line-${r+1}`, celui de sa ligne provisoire.
- La k-ième ligne ajoutée par la 3.8 prend `line-${nProvisoire + k}`. Pourquoi pas un UUID : `confianceLigne` lit le rang dans l'id,
  et retombe sur la position pour un autre id (`confiance.ts:320`). Un UUID prendrait donc les points d'une autre ligne. Pourquoi pas
  l'index final : il entrerait en collision avec les ids provisoires `line-1` à `line-nProvisoire`. `nProvisoire + k` est unique et
  lisible par `ligneDepuisId`.
- Les champs remappés, chacun par la même table :
  - `points[].ligne` et `points[].lignes[]` ;
  - `points[].champs[]` (`items.N.champ`, `invoiceVisionReview.ts:84`) ;
  - `points[].cle` (`…:N:champ`, l. 89) ;
  - puis `points[].signature`, recalculée par `signerPoint` sur le point remappé ;
  - `controls.lines.skippedIds`, des ids `line-N` (`invoiceControls.ts:127`), lus avec `port` à `ExpenseSheet.tsx:722, 967` ;
  - `remarques[].ligne` et `rejets[].ligne` (`geminiScanner.ts:138, 144`) ;
  - `items[]` eux-mêmes : remis dans l'ordre du brouillon, avec leur nouvel id.
- `points[].valeurs[].ligne` reste tel quel : c'est le rang **dans chaque lecture**, pas dans le final. `linesLost` est un compte, pas un
  index, et reste tel quel.
- `reglees` (l. 194) est indexé par signature `[m6]`. Une décision du provisoire reste si la signature du point remappé existe encore ;
  sinon elle tombe, et le point revient s'il existe toujours.
- Témoin rouge E3 : une ligne de port à la position 3 du final et à la position 2 du provisoire, avec `skippedIds: ['line-3']`. Après
  remap, `skippedIds` vaut `['line-2']`, et « Qté × prix » reste juste (l. 967).
- Une ligne qu'il a ajoutée a un UUID et retombe sur la position (`confiance.ts:320`) `[m4]`. C'est un défaut d'aujourd'hui, hors de E
  (`confiance.ts` n'est pas à E) ; je le note.

### Les lignes ajoutées, retirées, supprimées
- Une ligne finale sans paire : ajoutée, avec son id `line-${nProvisoire + k}`. Sa forme vient du choix l2-lignes.
- Une ligne provisoire sans paire : gardée, jamais retirée en silence. Sa forme vient aussi de l2-lignes.
- Une ligne qu'il a supprimée (une id de `base` absente du courant) ne revient pas.
- Une ligne qu'il a ajoutée (un id hors de `base`) ne bouge pas.

### Ce que la fusion ne fait jamais `[m3]`
- Elle **n'appelle jamais `applyOutcome`**, qui remet tout à zéro : `choixGroupes`, `manuallyClassified`, `readCount` (la clé des
  rangées, l. 854), et le plateau ouvert (l. 332, 364).
- Elle garde `choixGroupes`. Une ligne corrigée qui devient « à vérifier » ouvre son groupe, selon la règle de r4-port-d. Une rangée
  dont la nature ou la famille change passe dans sa nouvelle bande à l'arrivée, une seule fois. Une rangée qui a le focus est traitée
  comme touchée et ne saute pas sous son doigt (L12).
- Elle ne refait le rapprochement au stock (`lignesDeLecture`, sur la ligne seule) que pour une ligne corrigée qui n'est pas touchée
  et dont l'article n'est pas choisi par lui.

### La puce « ↻ N corrigées » `[m2]`
N est le nombre de **cibles** corrigées : une rangée avec au moins une cellule corrigée compte 1, un champ d'en-tête corrigé compte 1.
Sur `d-lue`, Malt Pilsner (deux cellules), Sabro et Citra donnent bien 3. Une ligne ajoutée par la 3.8 compte 1. Une ligne provisoire
sans paire ne compte pas dans « corrigées » : sa marque est celle de l2-lignes.

### La traduction après le final `[M6]`
- La fusion **incrémente `nomsJeton`** (l. 367). Une traduction du provisoire encore en vol, comme sur doc3 et doc13, dont le final peut
  arriver avant ses 3,8 s, est alors jetée par sa garde (l. 370).
- La fusion **efface `nameFr`** d'une ligne dont le nom de base change, puis relance `traduireLignes` sur ces seules lignes et sur les
  lignes ajoutées. C'est un appel, dont le coût est borné en § 2 (a).

## 4 ter. Les états de l'écran `[M1]`
Un état neuf, `verif: 'aucune' | 'attente' | 'finie' | 'echec'`, distinct de `busy`, avec une ref jumelle `verifRef` pour les gardes. Il
s'y ajoute un jeton de lecture, `lectureJeton`, qui jette un final arrivé pour une autre lecture.

| moment | `busy` | `verif` | `showForm` | `scanLocked` |
|---|---|---|---|---|
| envoi | vrai (l. 402, 477) | `aucune` | faux | vrai |
| morceau provisoire reçu | **faux** | `attente` | **vrai, au morceau** (et non plus dans `finally`, l. 418, 499) | **reste vrai** |
| final reçu et fusionné | faux | `finie` | vrai | faux (dans `finally`) |
| fin de partie (M2) | faux | `echec` | vrai | faux |
| final sans morceau (cache, pièce sans 3.8) | faux (dans `finally`) | `aucune` | vrai | faux |

Ce que voit chaque élément pendant `attente` :
- **Le formulaire et le justificatif** se montrent, puisque `busy` est faux (l. 998, 1152).
- **« Fermer »** est permis : `fermerOff` et `dismissible` ne lisent que `busy || saving` (l. 1140-1141). À la fermeture, le démontage
  lève le `signal` passé à `runFlux`.
- **« Confirmer »** : texte « Confirmer », icône `'spin'`, désactivé, aria « Vérification en cours » (l. 993 : `disabled` devient
  `saving || busy || verif === 'attente'`).
- **`save`** sort tout de suite tant que `verifRef.current === 'attente'`, en plus de `scanLocked` (l. 520).
- **`attachToExisting`** (l. 543-544), `attach`, `ajouterUnePage` et `lirePages` sont déjà gardés par `scanLocked`. Leurs boutons sont
  désactivés pendant `attente` : « Rattacher le justificatif » (l. 991-992), « Changer » (`changerOff`), le dépôt de fichier. Ils ne
  restent donc jamais actifs pour rien.
- **Les champs** restent modifiables : sa saisie l'emporte.

`attach` (l. 414) et `lirePages` (l. 494-495) gardent **un seul `await`**, celui du final. Le provisoire arrive par `onProvisoire`, qui :
1. vérifie `mounted.current` et `lectureJeton` ;
2. appelle `applyOutcome(provisoire, documentHash)` ;
3. prend l'instantané `base` et retient le jeton du morceau ;
4. pose `busy = false`, `showForm = true` et `verif = 'attente'`.

Après l'`await` :
- **un morceau a été reçu** et `final.provisoireJeton` égale son jeton : `appliquerFinale` (§ 4 bis), puis `verif = 'finie'` ;
- **un morceau a été reçu, sans jeton égal** : le repli de M4 ;
- **aucun morceau** : `applyOutcome(final)` comme aujourd'hui ;
- **`ok: false` après un morceau** : la fin de partie (M2), avec le message dans `error`.

**Le bornage `[M2]`.**
- **Côté client, il suffit.** L'attente se termine au plus tard à 150 s après l'envoi, ou après la seconde reprise ratée. C'est un
  minuteur de `runFlux`, plus la reprise hors ligne.
- **Côté serveur, aucun bornage dans ce port.** Un `running` sans `previousResult` qui n'expire pas est un choix exprès : « A
  crash/timeout deliberately retains its reservation and does not permit retry » (`invoiceScanBudget.ts:26`). Le borner rouvrirait une
  lecture payée après un plantage. Ce n'est pas l'affaire de D, mais une décision d'argent ; je la laisse au pilote, hors de S.

## 4 quater. Témoins de M4, voies C et E
- C5 : un final seul, avec `rangProvisoire` et `provisoireJeton`, sans morceau → `onProvisoire` n'est jamais appelé ; le final est rendu
  tel quel.
- E4 : un morceau de jeton « j1 », puis un final sans `provisoireJeton` et de même longueur → les lignes se rapprochent par la position.
  Le même cas, de longueur différente → les lignes provisoires restent, et `verif = 'echec'`.

## 5. Les voies du port
Le contrat entre les voies est fixé ici, pour que S et C travaillent en parallèle :
- le morceau : `{ etape:'provisoire', jeton, data, model, elapsedMs, pages? }` ;
- le final : `AiTaskResult` d'aujourd'hui, plus `data.provisoireJeton?: string` et `data.items[i].rangProvisoire?: number | null`.
  Aucun `apresProvisoire` `[M4]`.

Chaque voie possède des **fichiers** disjoints, et un fichier de test à elle `[M5]` :
- S : `serveur.test.ts` ;
- C : `flux.test.ts` ;
- E : `finale.test.ts` et `ecran.test.tsx` ;
- B : aucun test unitaire.
Les quatre fichiers de test vivent dans `tests/unit/depense/lecture-d/`. Aucune voie ne possède le dossier en bloc.

**S, serveur** (Sonnet, `auteur`) — Possède `functions/src/invoiceScanVote.ts`, `functions/src/invoiceVisionReview.ts` (l'export
seul), `functions/src/ai.ts` et `tests/unit/depense/lecture-d/serveur.test.ts`. S fait aussi le repli par la position dans le
rapprochement (§ 2 bis), et le jeton.
- Témoins rouges, avant le code :
  1. `lireCsv8` sur deux Flash-Lite en désaccord appelle `io.provisoire` une fois, **avant** que `readStrong` ne se résolve ;
  2. sur deux Flash-Lite d'accord, aucun provisoire ;
  3. une Flash-Lite coupée : aucun provisoire (on attend la 3.8) ;
  4. le provisoire ne contient aucun point `lecture-coupee` ;
  5. la 3.8 en échec : les valeurs finales égalent celles du provisoire, avec le point de coupure ;
  6. une ligne ajoutée par la 3.8 a `rangProvisoire: null`, une ligne permutée garde son rang ;
  7. une pièce d'une ligne dont la 3.8 change le nom et le montant (la forme de doc13, en fictif) a `rangProvisoire: 0` par le repli par
     la position ;
  8. `scanInvoiceSafely(uid, file, apiKey, undefined, { jeton, onProvisoire })` l'appelle sur un désaccord simulé par `fetch` (forme de
     `invoiceScanCsv8.test.ts`), et le final porte `provisoireJeton === jeton` ;
  9. un final servi du cache ne porte pas le jeton de l'appel ;
  10. un `onProvisoire` qui lève ne change pas le final.
- Ces tests restent verts sans modification : `invoiceScanCsv8`, `invoiceScanVote` (parité avec le banc), `invoiceScanTransport`,
  `invoiceScanBudget`, `invoiceScanCache-d273c`. Pour ce dernier, l'empreinte change : il doit le dire, pas figer une valeur. Les deux
  `tsc` (app et functions).
- Gemini est toujours simulé, avec des lectures fictives de la forme de celles des tests existants. Aucune valeur de ses pièces.

**C, client** (Sonnet) — Possède `src/services/aiClient.ts`, `src/services/geminiScanner.ts` et
`tests/unit/depense/lecture-d/flux.test.ts`. Le faux `httpsCallable` a un `.stream` qui rend une **Promise** de `{ stream, data }`.
- Témoins rouges :
  1. `onProvisoire` est appelé avec un `ScanOutcome` provisoire qui porte le jeton, puis le final est rendu ;
  1b. (C5, § 4 quater) un final seul, avec `rangProvisoire` et `provisoireJeton`, n'appelle jamais `onProvisoire` ;
  1c. un `signal` levé par l'écran coupe le flux et rend `ok:false`, sans exception ;
  2. **un flux fermé sans résultat rend `ok:false`** et n'attend pas sans fin ;
  3. le délai de 150 s abandonne (faux temps) ;
  4. un serveur qui n'envoie aucun morceau rend le final seul, comme A ;
  5. `ok:false` après un provisoire est rendu tel quel ;
  6. `rangProvisoire` traverse `normalizeResult` ;
  7. pour les pages, la règle `pages === N` (`geminiScanner.ts:111`) s'applique au final.
- Le test existant `geminiScanner.test.ts` reste vert.

**E, écran** (le dessin vient de sa maquette ; port en Sonnet, revue par le critique) — Possède :
- `src/ui/finance/ExpenseSheet.tsx` ;
- `src/ui/depense/finale.ts` (nouveau, pur : `lignesDeLecture` extrait d'`applyOutcome`, la table de B3, `appliquerFinale`) ;
- `Recap.tsx`, `Ligne.tsx`, `Pages.tsx`, `Pied.tsx`, `p3c.css` ;
- `Verdict.tsx`, pour la puce dans `ChipsBar` (l. 16) ;
- `etat.ts`, pour la source de puce `'corrigee'` (`Chip.source`, l. 17) et `chipsDeLecture` ;
- `types.ts`, où `ApercuDepense` (l. 9-14) gagne `provisoire`, `final` et `delaiMs` ;
- `apercuDev.ts`, pour les états `lenteur-provisoire`, `lenteur-lue`, `lenteur-echec`, `lenteur-touchee` et `lenteur-sans-38` ;
- `tests/unit/depense/lecture-d/finale.test.ts` et `ecran.test.tsx`.
`[M5]` : E ne touche pas `confiance.ts`.

- Témoins rouges :
  1. E1 (B1) : une unité déduite, non touchée, est corrigée par la 3.8 ;
  2. E2 (B2) : une date tapée n'est pas réécrite ;
  3. E3 (B3) : `skippedIds` est remappé, et « Qté × prix » reste juste ;
  4. E4 (M4) : un final sans jeton égal, de même longueur, se rapproche par la position ; de longueur différente, il garde le provisoire
     et passe en `echec` ;
  5. après un provisoire, l'écran montre les lignes, et « Confirmer » est désactivé avec la roue (aria « Vérification en cours ») ;
     « Fermer » reste actif, « Rattacher » et « Changer » sont désactivés ;
  6. `save` refuse tant que `verif === 'attente'` ;
  7. après le final, le bouton est actif et la puce dit « N corrigées », N compté par cible (m2) ;
  8. une ligne qu'il a supprimée ne revient pas ;
  9. une ligne de la 3.8 sans paire est ajoutée avec l'id `line-${n+1}` ;
  10. la fusion n'appelle pas `applyOutcome` : `readCount` et `choixGroupes` restent (m3) ;
  11. une traduction du provisoire qui arrive après la fusion est jetée, et `nameFr` est effacé sur un nom changé (M6) ;
  12. le cas « en échec » rend « 2 lectures » et aucune puce ;
  13. le cas sans 3.8 : aucun fil, bouton noir ;
  14. la fin de partie à 150 s (faux temps) passe en `echec`, et le bouton est noir (M2).
- Les suites Dépense existantes restent vertes (`tests/unit/depense/**`, 111 fichiers ou plus).

**B, banc Chrome** (Haiku pour les rejeux et les captures) — Possède `scripts/check-invoice-journey-emulator.mjs` et le dossier de la
voie.
- `[M7]` **Le shim de page change aussi**, pas seulement `callableAnswer`.
  - Aujourd'hui, le `window.fetch` posé dans la page (l. 275-305) construit `new Response(payload, …)` d'un bloc (l. 303-304), à partir
    de la réponse du pont `__jus0Bridge` (l. 301, exposé l. 2283).
  - Quand la requête porte `Accept: text/event-stream`, le pont rend `{ sse: [{ message }, …, { result }], delaiMs }`. Le shim en fait
    un `ReadableStream`, construit **dans la page** : le délai se joue côté page, pas côté Node. Chaque bloc s'écrit `data: {…}\n\n`,
    et les blocs sont séparés par `delaiMs`.
  - Un cas « flux fermé sans résultat » ferme le flux sans `result`.
- `callableAnswer` (l. 309-346) rend cette forme pour `scanInvoice` quand le cas le demande.
- Le manifeste rejoué (hors Git) reçoit, pour chaque pièce, le provisoire calculé par `provisoireDeDeux` sur les deux lectures brutes
  de `banc-k6-C/raw`.
- Cas : `lenteur-provisoire`, `lenteur-lue`, `lenteur-echec`, `lenteur-touchee`, `lenteur-sans-38`, `lenteur-hors-ligne`,
  `lenteur-fermee` (la feuille se ferme pendant `attente`) et `lenteur-sans-resultat`.
- Lancement : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <sortie> <cas> 390,1280`.
- Captures à 390 px tactile, ouvertes en image et mises côte à côte avec `d-06.png` et `d-lue.png` (L03, L12).

**L'ordre `[M5]`** :
1. r4-port-d, avec son ajout du segment Plié | Déplié (D311). Ce sont les mêmes fichiers qu'E (D308 (3)).
2. Le choix l2-lignes (D310, `MISSION.md:118`) : la ligne que la 3.8 ajoute et celle qu'elle ne lit plus. Il vise un cas courant
   (§ 2 bis : 6 pièces sur 12).
3. S et C, en parallèle. Ils peuvent tourner pendant 1 et 2, puisqu'ils ne touchent aucun fichier de r4-port-d.
4. E.
5. B.
6. n3-ht (les lignes hors taxe, qui touchent `ExpenseSheet.tsx`), **après E**.
7. Le pilote : relecture, tests, deux `tsc`, build, banc. Puis son accord pour le déploiement.

## 6. Ce qui demande son accord
Le redéploiement d'aiTask (`--only functions:aiTask`) et de l'hébergement : c'est le cadre neuf de D308 (4). Rien d'autre :
- aucune règle Firestore, aucun index ;
- aucun appel réel pour tester ;
- aucune donnée réelle touchée.

Conséquence à lui dire avec la demande : l'empreinte du moteur change (point 11). Une pièce déjà lue mais jamais enregistrée serait
relue à son prochain envoi, soit environ 0,0445 CHF. Une pièce enregistrée n'est pas relue (`purchaseSameFile`, `ExpenseSheet.tsx:411`).

## Doutes et limites
- Je n'ai pas vérifié ce que fait Cloud Run d'un handler dont le client s'est déconnecté. Repli : le cache, plus une reprise au retour
  en ligne. Avec A, le risque est déjà le même.
- Un `running` sans `previousResult` reste refusé « déjà en cours » sans limite de temps (`invoiceScanBudget.ts:40, 55`). C'est un choix
  exprès (l. 26), pas un effet de D. Avec D, la fin de partie côté client (§ 4 ter, M2) empêche qu'il bloque l'écran.
- Je n'ai pas vérifié que le réseau de Google ne met pas en tampon une réponse SSE. C'est à prouver au premier essai en ligne : un
  `message` doit arriver avant le `result`. S'il était mis en tampon, l'écran se comporterait comme A, sans perte.
- Les temps sont ceux du banc (14 pièces, 1 tirage), et la mesure de § 2 bis porte sur 12 pièces : des indices, pas des preuves. Le
  repli par la position n'est éprouvé que sur doc13.

DÉCISION À PRENDRE :
(1) Les cas « à montrer » qui restent sont l'erreur après le provisoire, le fil hors ligne, l'en-tête corrigé et la fin de partie. La
ligne ajoutée et la ligne disparue sont déjà au choix l2-lignes. Options : des mini maquettes dans un artefact neuf (L24), ou les
formes que je propose comme défaut réversible. Recommandation : ajouter l'en-tête corrigé et la fin de partie à la page de l2-lignes,
où une même planche les montre ; garder le défaut proposé pour les deux autres.
(2) (c3), la 3.8 lancée en même temps que les Flash-Lite. Options : non, ou un banc payant plus tard. Recommandation : non pour ce
port, car elle sort de la mesure qu'il a choisie.
(3) Borner côté serveur un `running` sans `previousResult` (`invoiceScanBudget.ts:26`). Recommandation : non dans ce port, puisque la
borne côté client suffit à D ; c'est une décision d'argent, à part.

CONNAISSANCE : le callable en flux est déjà installé et compatible dans les deux sens (`firebase` 11.10, `firebase-functions` 6.6 :
`sendChunk`, `.stream()`). `stream()` n'a pas de délai (`streamAtURL`) et laisse `data` sans réponse si le serveur ne répond pas en SSE
(`createResponseStream`). Le client doit fixer son délai et traiter un flux fermé sans résultat comme une erreur.
CONNAISSANCE (2) : sur banc-k6-C, `alignLines` rapproche 183 des 184 lignes provisoires de leur final. La 3.8 ajoute une ligne sur 6
pièces sur 12. Seule une pièce d'une ligne, dont le nom et le montant changent ensemble, demande le repli par la position.
LEÇON PROPOSÉE : un plan de fusion « sa saisie l'emporte » nomme trois choses avant d'être donné au codeur : la base de comparaison
(le brouillon déjà transformé, pas la lecture brute), la liste complète des cellules avec leur registre (en-tête compris), et tous les
champs qui portent un index de ligne. Il mesure aussi son appariement sur les vraies pièces. (C'est la proposition de RELECTURE.md, que
je reprends : je l'ai manquée en version 1.)

## 7. Précisions de la relecture 2 (pilote, 02.11 ; `RELECTURE-2.md`, RELECTURE OK)
Elles font partie du contrat des voies S, C, E et B, au même titre que le reste du plan.
- **R1** (fin de partie, E) : le client appelle `ajouterCoupure(provisoire, 'delai-saute', phraseCoupure('delai-saute'))`
  (`functions/src/invoiceVisionReview.ts:216-227`) : le point `lecture-coupee` marque les lignes « repris » (`confiance.ts:282`), pas seulement une phrase.
- **R2** : la 3.8 ajoute 6 lignes sur 6 pièces sur 12 après le repli de doc13 ; la ligne « ne lit plus » de § 4 est repêchée par la position.
  Le cas reste réel (listes de longueurs différentes).
- **R3** : les décisions de fin de plan sont tranchées par D312 (`work/refonte-frontend/decisions.md`). E code les formes A de la voie l3-cas
  (en-tête corrigé : la langue bleue de sa maquette ; 3.8 qui n'arrive jamais : la forme d'aujourd'hui d'une 3.8 coupée) et ne les attend pas.
- **R4** : `points[].ligne` vaut le numéro de l'id (`line-N` donne N), pas la position dans `items` (`confiance.ts:320`).
- **R5** : `traduireLignes` rend une `Map<rang, nameFr>` dont le rang est la position dans la liste envoyée ; pour la seconde traduction
  (lignes changées seulement), E reporte ce rang vers l'id.
