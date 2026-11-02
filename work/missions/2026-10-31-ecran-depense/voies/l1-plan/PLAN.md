# l1-plan — son choix D de la lenteur : le plan technique (D308)

Voie l1-plan, 02.11, auteur Opus. Je n'ai modifié aucun code de l'app, fait aucun commit et aucun appel Gemini. J'ai écrit deux fichiers
dans `voies/l1-plan/` : ce plan et `octets.mjs`, une mesure hors ligne de la taille des réponses.
Les lignes citées sont celles du worktree au 02.11, à HEAD a115e82e. `ExpenseSheet.tsx` porte des changements non commités de r4-port-d
(voir `git status`) : ses numéros de ligne bougeront avec ce port, mais les noms de fonction restent.

**Recommandation : (a), un seul appel `aiTask` qui rend deux fois** (callable en flux, `sendChunk` côté serveur, `.stream()` côté client).
Le premier écran arrive au bout de 6,3 s médian (9,9 s pour la pire pièce), « Confirmer » au bout de 18,5 s médian (37,7 s au pire).
C'est exactement le D mesuré par m-lenteur. L'option ne change ni les appels, ni le coût, ni les règles Firestore, ni les index.

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
- Un ancien client n'envoie pas `Accept: text/event-stream` : `sendChunk` ne fait rien et la réponse reste celle d'aujourd'hui.
- Un nouveau client face à l'ancien `aiTask`, qui n'appelle jamais `sendChunk`, ne reçoit que le résultat final : c'est A.

**Ce que (a) change côté serveur** (fichiers de la voie S) :
- `invoiceScanVote.ts` :
  - nouvelle fonction pure `provisoireDeDeux(l1, l2)` : le rapprochement de `finalOfTwo` (l. 59, 66) **sans** `ajouterCoupure`
    (l. 64), avec `review.readers = 2` et `provisoire: true`. La lecture n'est pas coupée, elle est en cours : la phrase « Le contrôle
    complémentaire n'a pas abouti » n'a rien à faire sur le premier écran ;
  - `Csv8Io.provisoire?(result)` est appelé entre la l. 137 et la l. 140, **seulement si les deux Flash-Lite sont lisibles et que la
    3.8 va partir**. Son échec ne fait jamais échouer la lecture (`try/catch`, jamais attendu avant `readStrong`) ;
  - quand un provisoire est parti, chaque ligne finale reçoit `rangProvisoire` (l'index de sa ligne provisoire, ou `null` si la 3.8
    l'ajoute), et le résultat reçoit `apresProvisoire: true`. C'est un ajout facultatif, que le cache garde.
- `invoiceVisionReview.ts` : `alignLines` est exportée (renommée `alignerLignes`), sans autre changement.
- `ai.ts` :
  - le handler devient `async (request, response)` ;
  - pour `scanInvoice` avec `request.acceptsStreaming`, il passe `onProvisoire = data => response?.sendChunk({ etape:'provisoire',
    data, model, elapsedMs, pages? }).catch(() => false)` à `scanInvoiceSafely` (nouveau paramètre facultatif) ;
  - `response.signal` n'arrête pas la lecture : une 3.8 déjà partie finit et se met en cache.

**Ce que (a) change côté client** (voies C et E) :
- `aiClient.ts` reçoit `runFlux(req, onEtape)` : `callAiTask.stream(payload, { signal })`, un délai propre de 150 s, la lecture des
  morceaux, puis `await data`, avec une erreur si le flux se ferme sans résultat. Les erreurs passent par `humanize`.
- `geminiScanner.ts` : `scanDocument` et `scanPages` prennent `{ onProvisoire }` en option, et `normalizeResult` garde
  `rangProvisoire` et `apresProvisoire`.
- L'écran : voir la section 5, voie E.

**Coût.** Les mêmes appels qu'aujourd'hui : deux Flash-Lite, plus une 3.8 sur 12 pièces sur 14, soit 0,0445 CHF par pièce (médiane).
Le même journal `brewerAiCosts` et le même registre `invoiceScans`, à 3 appels au plus.

**Octets.** Les octets montants ne changent pas : l'image part une fois. En descente, un morceau de plus, de la taille d'une lecture.
Mesuré par `node work/missions/2026-10-31-ecran-depense/voies/l1-plan/octets.mjs work/finalisation-tickets-2026-10-08/H13-reels/
banc-k6-C/raw` :

    OCTETS Csv81 : 14 lectures, médiane 7577, max 13911
    OCTETS Csv82 : 14 lectures, médiane 8093, max 14161

Cela fait environ 8 ko médian et 14 ko au plus, en plus des points. Ce sont des textes de réponse, pas des valeurs, et la mesure s'est
faite hors ligne.

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

## 3. La recommandation : (a)

| | 1er écran (méd / pire) | « Confirmer » (méd / pire) | appels | coût par pièce (méd) | règles ou index |
|---|---|---|---|---|---|
| aujourd'hui (A) | 18,5 s / 37,7 s | 18,5 s / 37,7 s | 2 + 3.8 sur 12/14 | 0,0445 CHF | — |
| **(a) un appel en flux** | **6,3 s / 9,9 s** | **18,5 s / 37,7 s** | identiques | 0,0445 CHF | aucun |
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
| **hors ligne pendant la 3.8** | le flux tombe ; les valeurs provisoires restent, le fil et la roue aussi ; au retour en ligne (événement `online`, l. 209), le client relance **une fois** le même appel, que le serveur sert depuis le cache (`invoiceScanBudget.ts:37`, sans coût) s'il a fini ; s'il tourne encore : « déjà en cours » (l. 55), et le client réessaie une fois 20 s plus tard. Le fil « en attente du réseau » n'est pas dessiné : **à montrer** | gris tant que le final n'est pas là (sa règle) ; l'enregistrement hors ligne ne se fait donc pas sur un provisoire |
| **onglet fermé** | rien n'est gardé côté client, comme aujourd'hui ; le serveur finit et met en cache (`https.js:426-428`). Rouvrir le même fichier : le final arrive tout de suite (`cached`), sans fil | noir |
| **plusieurs pages** | le même chemin : `scanInvoiceSafely` lit les pages d'un seul appel (`ai.ts:154`), et le morceau porte `pages` ; le fil est celui de `FrisePages` avec `pages` (`Pages.tsx:56`) | comme le cas normal |
| **une cellule qu'il a touchée** | sa valeur reste, sans fond bleu ; une valeur de la 3.8 qui en diffère n'est ni posée ni montrée | ne dépend pas de la cellule |
| **une ligne qu'il a ajoutée** (id `crypto.randomUUID()`, `ExpenseSheet.tsx:67`, jamais `line-N`) | intacte | — |
| **une ligne qu'il a supprimée** | la 3.8 ne la fait pas revenir, même corrigée | — |
| **une ligne que la 3.8 ajoute** (`rangProvisoire: null`) | une rangée de plus, à sa place dans le groupe ; elle compte dans la puce. La forme d'une rangée neuve n'est pas dessinée : **à montrer** (ma proposition : la rangée entière sur fond bleu, sans ancienne valeur) | — |
| **une ligne que la 3.8 ne lit plus** (ligne provisoire sans paire) | « rien ne se perd » : je ne la retire pas en silence. **À montrer** (ma proposition : la rangée barrée en attention, qu'il retire ou garde d'un toucher) | — |
| **un en-tête corrigé** (numéro, HT, type de pièce, total) | sa maquette ne corrige que des rangées. Le fond bleu et l'ancienne valeur barrée sur un champ d'en-tête : **à montrer** ; il compte dans la puce | — |

La règle de fusion, pure et testable (`src/ui/depense/finale.ts`, voie E) :
- Une cellule est « touchée » si elle est dans le registre `touchees` (posé par ses gestes : champs, unité, nature, article) **ou** si
  sa valeur diffère de celle du provisoire.
- Pour chaque ligne finale appariée (`rangProvisoire = r`), sur la ligne `line-${r+1}` du brouillon et pour chaque cellule (libellé,
  quantité, unité, prix, montant, nature, référence) :
  - touchée : rien ne change ;
  - sinon : la valeur finale est posée, et la correction notée `{ ligneId, champ, avant, apres }` si les deux valeurs diffèrent.
- Les points du final sont renumérotés de l'ordre final vers les ids provisoires (`ligne`, `lignes`), parce que l'écran lit le rang
  dans l'id (`confiance.ts:320`).
- Une ligne corrigée et non touchée se rapproche de nouveau du stock (unité, proposition, nouvel article), par les mêmes fonctions
  qu'`applyOutcome` (l. 341-363). Une ligne dont il a déjà choisi l'article garde son choix (`manuallyClassified`, l. 138).
- `traduireLignes` ne repart que pour les lignes dont le nom a changé.

## 5. Les voies du port (après r4-port-d, D308 (3))
Le contrat entre les voies est fixé ici, pour que S et C travaillent en parallèle :
- le morceau : `{ etape:'provisoire', data, model, elapsedMs, pages? }` ;
- le final : `AiTaskResult` d'aujourd'hui, plus `data.apresProvisoire?: true` et `data.items[i].rangProvisoire?: number | null`.

**S, serveur** (Sonnet, `auteur`) — Possède `functions/src/invoiceScanVote.ts`, `functions/src/invoiceVisionReview.ts` (l'export
seul), `functions/src/ai.ts` et `tests/unit/depense/lecture-d/serveur.test.ts`.
- Témoins rouges, avant le code :
  1. `lireCsv8` sur deux Flash-Lite en désaccord appelle `io.provisoire` une fois, **avant** que `readStrong` ne se résolve ;
  2. sur deux Flash-Lite d'accord, aucun provisoire ;
  3. une Flash-Lite coupée : aucun provisoire (on attend la 3.8) ;
  4. le provisoire ne contient aucun point `lecture-coupee` ;
  5. la 3.8 en échec : les valeurs finales égalent celles du provisoire, avec le point de coupure ;
  6. une ligne ajoutée par la 3.8 a `rangProvisoire: null`, une ligne permutée garde son rang ;
  7. `scanInvoiceSafely(…, onProvisoire)` l'appelle sur un désaccord simulé par `fetch` (forme de `invoiceScanCsv8.test.ts`) ;
  8. un `onProvisoire` qui lève ne change pas le final.
- Ces tests restent verts sans modification : `invoiceScanCsv8`, `invoiceScanVote` (parité avec le banc), `invoiceScanTransport`,
  `invoiceScanBudget`, `invoiceScanCache-d273c`. Pour ce dernier, l'empreinte change : il doit le dire, pas figer une valeur. Les deux
  `tsc` (app et functions).
- Gemini est toujours simulé, avec des lectures fictives de la forme de celles des tests existants. Aucune valeur de ses pièces.

**C, client** (Sonnet) — Possède `src/services/aiClient.ts`, `src/services/geminiScanner.ts` et
`tests/unit/depense/lecture-d/flux.test.ts`. Le faux `httpsCallable` a un `.stream` qui rend des morceaux puis `data`.
- Témoins rouges :
  1. `onProvisoire` est appelé avec un `ScanOutcome` provisoire, puis le final est rendu ;
  2. **un flux fermé sans résultat rend `ok:false`** et n'attend pas sans fin ;
  3. le délai de 150 s abandonne (faux temps) ;
  4. un serveur qui n'envoie aucun morceau rend le final seul, comme A ;
  5. `ok:false` après un provisoire est rendu tel quel ;
  6. `rangProvisoire` traverse `normalizeResult` ;
  7. pour les pages, la règle `pages === N` (`geminiScanner.ts:111`) s'applique au final.
- Le test existant `geminiScanner.test.ts` reste vert.

**E, écran** (le dessin vient de sa maquette ; port en Sonnet, revue par le critique) — Possède `src/ui/finance/ExpenseSheet.tsx`,
`src/ui/depense/finale.ts` (nouveau, pur), `Recap.tsx`, `Ligne.tsx`, `Pages.tsx`, `Pied.tsx`, `p3c.css`, `apercuDev.ts` (états
`lenteur-provisoire`, `lenteur-lue`, `lenteur-echec`, `lenteur-touchee`) et `tests/unit/depense/lecture-d/`.
- Témoins rouges :
  1. après un provisoire, l'écran montre les lignes, et « Confirmer » est désactivé avec la roue (aria « Vérification en cours ») ;
  2. `save` refuse tant que le final manque ;
  3. après le final, le bouton est actif et la puce dit « N corrigées » ;
  4. une quantité qu'il a tapée n'est pas réécrite ;
  5. une ligne qu'il a supprimée ne revient pas ;
  6. une ligne de la 3.8 sans paire est ajoutée ;
  7. les points renumérotés visent la bonne rangée ;
  8. le cas « en échec » rend « 2 lectures » et aucune puce ;
  9. le cas sans 3.8 : aucun fil, bouton noir.
- Les suites Dépense existantes restent vertes (`tests/unit/depense/**`, 111 fichiers ou plus).

**B, banc Chrome** (Haiku pour les rejeux et les captures) — Possède `scripts/check-invoice-journey-emulator.mjs` et le dossier de la
voie.
- `callableAnswer` (l. 309-346) répond aujourd'hui `application/json` d'un bloc. Il doit répondre en SSE quand la requête porte
  `Accept: text/event-stream` : un morceau provisoire, une attente réglable, puis `result`.
- Le manifeste rejoué (hors Git) reçoit, pour chaque pièce, le provisoire calculé par `provisoireDeDeux` sur les deux lectures brutes
  de `banc-k6-C/raw`.
- Cas : `lenteur-provisoire`, `lenteur-lue`, `lenteur-echec`, `lenteur-touchee`, `lenteur-sans-38`, `lenteur-hors-ligne`.
- Lancement : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <sortie> <cas> 390,1280`.
- Captures à 390 px tactile, ouvertes en image et mises côte à côte avec `d-06.png` et `d-lue.png` (L03, L12).

Ordre : S et C en parallèle, puis E, puis B, puis le pilote (relecture, tests, deux `tsc`, build, banc), puis son accord pour le
déploiement.

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
- Un `running` sans `previousResult` reste refusé « déjà en cours » sans limite de temps (`invoiceScanBudget.ts:40, 55`). C'est un défaut
  d'aujourd'hui que D ne crée pas. Il est hors de cette voie, à noter.
- Les temps sont ceux du banc (14 pièces, 1 tirage) : un indice, pas une preuve.

DÉCISION À PRENDRE : (1) les cinq cas « à montrer » (erreur après le provisoire, hors ligne, ligne ajoutée par la 3.8, ligne qu'elle
ne lit plus, en-tête corrigé). Options : mini maquettes dans un artefact neuf (L24), ou les formes que je propose en défaut
réversible. Recommandation : mini maquettes pour la ligne ajoutée et la ligne disparue, qui sont les plus fréquentes après une
correction de lignes ; défaut proposé pour les trois autres. (2) (c3), la 3.8 lancée en même temps que les Flash-Lite. Options : non,
ou un banc payant plus tard. Recommandation : non pour ce port, car elle sort de la mesure qu'il a choisie.

CONNAISSANCE : le callable en flux est déjà installé et compatible dans les deux sens (`firebase` 11.10, `firebase-functions` 6.6 :
`sendChunk`, `.stream()`). `stream()` n'a pas de délai (`streamAtURL`) et laisse `data` sans réponse si le serveur ne répond pas en SSE
(`createResponseStream`). Le client doit fixer son délai et traiter un flux fermé sans résultat comme une erreur.
LEÇON PROPOSÉE : aucune. Le piège des barres inverses dans `node -e` m'a coûté un essai (déjà dans [[poste-windows-msix]]).
