OK — préchauffe de Suggérer dans un worker (app) et face à face de Substituer sans candidat reculé ; reste ~100–250 ms de tâche longue, hors préchauffe

Rien n'est commité. Critère « aucune tâche longue > 50 ms » : NON tenu à la lettre (voir tableau) ; la préchauffe elle-même ne bloque plus le fil principal.

## Fichiers écrits
- Neufs : `src/ui/hopIndex/parcours/calcul.worker.ts`, `clientWorker.ts` (`activerWorker`), `donneesWorker.ts` (envoi du catalogue une fois, puis « inchangé »).
- Modifiés : `parcours/calcul.ts` (+ `clientEstPose`, `reinitialiserClient`), `maBiere/EtapeHoublons.tsx` (`activerWorker()` au montage, avant `usePrechauffeSuggerer`), `substituer/donnees.ts` (`Candidat.recule`, `faceAFaceParDefaut`), `substituer/index.tsx` (l'utilise). `suggerer/prechauffe.ts` : inchangé.
- Tests neufs : `tests/unit/hopIndexV4/clientWorker.test.ts` (9), `substituerFaceAFace.test.tsx` (6).
- Dans la voie : `mesure-w1.mjs`, `fumee-worker-prod.mjs` (non rejoué), `debug-worker.mjs`, journaux (`avant-longtask.log`, `apres-*.log`, `visee-*.log`, `temoin-sans-chauffe.log`, `vitest.log`, `build.log`).

## 1. Worker : tableau avant / après, Chrome ×4, 390 × 844, dev-local, étape Houblons
Avant = `longtask.mjs` d'e6, 3 essais, HEAD. Après = `mesure-w1.mjs` (3 essais). Le « fil principal » de mon script (`?calcul=immediat`, même code) donne un second « avant » proche dans le temps.

| | Préchauffe sur le fil principal | Tâche/blocage le plus long | Attente d'un toucher (max) |
|---|---|---|---|
| Avant, e6 (HEAD) | 1691 / 1887 / 1957 ms | 336 ms (API ; ne voit pas le bloc) | 59 / 1875 / 1952 ms |
| Avant, fil principal (mon script) | 408 / 397 / 830 ms | 419 / 401 / 851 ms | 13 / 400 / 843 ms |
| Après, worker | 3 / 1 / 1 ms (réponse du worker : 364 / 317 / 346 ms) | 349 / 241 / 285 ms (tâche API 234 / 214 / 247 ms) | 249 / 45 / 46 ms |
| Témoin worker sans préchauffe (2 essais) | – | 118 / 165 ms (tâche API 111 / 94 ms) | 120 / 135 ms |

Lecture : la préchauffe ne tient plus le fil principal (1 à 3 ms au lieu de 400 à 1950 ms) ; plus d'attente de 0,4 à 1,9 s sous le doigt. Restent des tâches de 100 à 250 ms juste après : le témoin sans préchauffe en a une de ~100 ms (arrivée du catalogue plein de c7, hors voie) ; avec préchauffe elle mesure 214 à 247 ms, soit ~130 ms de plus que le témoin, cause non établie (concurrence de cœurs avec le worker sur cette machine partagée ? ce n'est ni la copie du résultat, 0,6 ms, ni celle du catalogue, 5 à 28 ms ×4). Machine chargée : les mesures varient d'un facteur 2 d'une série à l'autre (e6 : 1207 ms ; ici 1691–1957 puis 400–830).
- Le worker n'est probablement pas ralenti par le ×4 (réponse en ~300 ms) : sur un vrai téléphone il sera plus lent et partagera les cœurs.
- Ouverture de Suggérer avec visée « + tropical » posée (geste : Ma bière, visée, onglet Suggestions), jusqu'à la première ligne : fil principal 246 / 126 / 134 ms ; worker 192 / 145 / 116 ms. La liste s'affiche toujours (repli synchrone du transport) : 3/3. Pas de régression mesurée ; dev-local a un stock vide, donc rien ne dit le coût sur le stock réel.
- Un seul essai du geste visée n'est pas une distribution (3 essais par variante).

## 2. Face à face de Substituer
Test `substituerFaceAFace.test.tsx`, Nugget à 60′ (stout 16D), stock des fixtures : sur HEAD (copie `git archive` dans le scratchpad) « 46 g de Nugget remplacés par 24 g de Citra cryo » → rouge ; après : 35 g de Galaxy → vert. Règle : B = premier du stock qui suffit et n'est pas reculé (`amertumeDeconseillee` du moteur, exposé en `Candidat.recule`) ; sans B, le premier de la liste hors stock ; à défaut un reculé. A inchangé.
Rouge sur 959 dans `vitest.log` : le premier rejeu avait `sourcesLignes.test.tsx` (« Lotus et Citra au face à face… Citra α : la barre manque ») : mon premier jet écartait aussi les reculés dans le repli ; corrigé (le repli prend le premier hors stock, sans écarter Citra) : 4/4 verts. Le rejeu complet avait ensuite un seul rouge : mon propre nouveau test (attente fausse, corrigée). Après correction : `substituerFaceAFace`, `sourcesLignes`, `clientWorker` = 18/18 ; le dossier complet n'a pas été rejoué une troisième fois (958/959 avant la correction du test, plus une erreur d'infrastructure « Timeout calling onTaskUpdate » sous charge).

## 3. Build et budget
`npm run build` (VITE_HOP_V4=on) : EXIT=0. `check-hop-budget --chunk-outils profil-simule` : **B5 163,5 ko** (≤ 164 ko, tenu ; B1 921 ko et B2 773 ko déjà dépassés avant ce lot, hors critère). **Worker : `calcul.worker-bn4LIabF.js`, 1 262 ko bruts, 256 ko gzip (204 ko brotli)**, chunk à part, chargé au montage de l'étape. Vite le produit (IIFE ; le chunk `EtapeHoublons` le référence avec `{type:"module"}`). Réponse du worker de production dans Chrome : `fumee-worker-prod.mjs` écrit, NON rejoué.

## DEMANDE EXECUTANT
1. Depuis la racine : `node work/missions/2026-10-25-integration-houblons/voies/w1-worker-app/fumee-worker-prod.mjs` → attendu `WORKER PROD OK` (nécessite `dist/` construit avec les sources actuelles : `VITE_HOP_V4=on npm run build` avant).
2. Maquette : `node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-w1`, puis `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-w1 --ecran=substituer`. Attendu : ETATS OK ; sinon lister les états en échec (le face à face change : Citra cryo n'y est plus, `etat-subst-face` et voisins) et ouvrir les captures. Je juge ensuite ; ce sont des attendus à actualiser, comme e6.
3. `npm run check:hop-perf`.

## Doutes et limites
- Les scripts Puppeteer qui interceptent les requêtes (`setRequestInterception`, dont `longtask.mjs` d'e6) bloquent le chargement du worker : il ne répond jamais (`debug-worker.mjs`), l'écran se sert alors du repli. J'ai donc mesuré avec `mesure-w1.mjs` (sans interception, hôtes externes coupés par Chrome). Aucun délai de garde : un worker qui ne démarre pas reste silencieux (repli par lecture synchrone).
- Le worker chauffe SES caches, pas ceux du fil principal : l'ouverture de Suggérer calcule à froid sur le fil principal sauf si la visée est celle de la préchauffe (`{floral: 1}`). Pas de régression vue ici, mais à vérifier sur le stock réel.
- Mode développement seulement (dev-local) ; production : build vérifié, rendu non joué.

DÉCISION À PRENDRE : préchauffer dans le worker la visée réelle du brasseur (`proposer`, `proposerRapide`, `leviers`) au lieu de `{floral: 1}` ? Option : oui, en passant la visée à `usePrechauffeSuggerer` (exige l'accès à la visée depuis l'étape ; touche `suggerer/` et peut-être `commun/`) ; non : on garde l'ouverture à froid. Recommandation : mesurer d'abord l'ouverture sur le stock réel.

CONNAISSANCE : la préchauffe dans un worker ne chauffe pas le fil principal ; l'interception de requêtes de Puppeteer empêche un worker de module de démarrer.
LEÇON PROPOSÉE : un contrôle qui passe par `setRequestInterception` ne peut pas mesurer un worker : couper les hôtes par `--host-resolver-rules`.
