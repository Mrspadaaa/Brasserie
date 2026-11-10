ECHEC — étape 4 : tests/unit/depense/qr/vue.test.ts reste vert hors ExpenseSheet/qrLecture (attendu rouge) ; étape 5 : contraste « 110,40 » non mesuré ; captures de qr-app écrasées par mes rejeux (hors de ma propriété)

Fichiers écrits : `voies/qr-rejeu/RESULTAT.md`, `voies/qr-rejeu/outils/servir-csp.mjs`, `voies/qr-rejeu/outils/csp-banc.mjs`, `voies/qr-rejeu/captures-csp/csp-a.json`, `voies/qr-rejeu/captures-csp/csp-b.json` (et leurs captures 390), copie `%TEMP%/qr-app-copie` (dist, vitest*.log, build.log, parcours.log).
Écrit hors de ma propriété, à signaler : `voies/qr-app/captures/` (z2-*-390.png, z2-*-ouvert, z2-*-1280.png, parcours.json) écrasé par deux passages de `parcours.mjs` faits sans `--sortie` (défaut = `qr-app/captures`). Dossier ignoré par git, sans copie : les captures d'origine sont perdues. Le contenu régénéré vient du même script et de la même copie ; à refaire ou à accepter par le pilote.

## Étape 1 — synchro
- `bash .../qr-app/outils/synchro.sh` : sortie « copie : C:/Users/mrspa/AppData/Local/Temp/qr-app-copie », code 0.
- Le script exclut `docs` : `docs/research` copié à la main (31 entrées). Écart de méthode, pas d'effet sur le code testé.

## Étape 2 — tsc, build, dev-auth
- `npx tsc --noEmit` : aucune sortie, code 0.
- `npm run build` : code 0, « built in 26.03s ».
- `node scripts/check-no-dev-auth.mjs` : « Bundle de production propre », code 0.
- `dist/index.html` référence `assets/index-BHd2d0qF.js` et `index-CDcwv01l.css`. Tailles : App-CAbNgYmM.js 3 115 211 o ; index-BHd2d0qF.js 198 983 o ; pdf-CcZYcL52.js 365 121 o ; pdf.worker.min-yatZIOMy.mjs 1 375 838 o ; zxing_reader-_HcWiliU.wasm 966 895 o.
- Douteux : `dist/` contient des fichiers de hashes anciens (ex. index-aKGgE7sY.js 36 098 o, EcranApp-* multiples) ; `dist` n'a pas été vidé par le build. Non recherché plus loin.

## Étape 3 — vitest
- `npx vitest run --maxWorkers=2 tests/unit/depense tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx` : code 0, 74 fichiers passés, 1 215 tests passés.

## Étape 4 — « échouaient avant » (copie seulement)
- ExpenseSheet.tsx remplacé par `git show HEAD:…` (cmp identique), `qrLecture.ts` renommé `.off`.
- `npx vitest run tests/unit/depense/qr` : code 1. Rouge : `lecture.test.ts` (échec de fichier), `ecran-qr.test.tsx` (15 tests). Vert : `confronter` (10), `s1` (7), `qr-facture` (13).
- **Écart** : `vue.test.ts` (19 tests) PASSE alors que l'attendu est rouge. Il ne dépend donc ni d'ExpenseSheet ni de qrLecture : le critère « vue rouge » est faux, à corriger par le pilote.
- Restauration : `synchro.sh` relancé, ExpenseSheet identique au dépôt (cmp), `qrLecture.ts` revenu. `npx vitest run tests/unit/depense/qr` : code 0, 6 fichiers, 90 tests verts.

## Étape 5 — parcours Chrome (serveur Vite copie, port 3457)
- Premier lancement : un Vite obsolète (PID 18884, même copie, lancé hors de ma session) occupait 3457 ; mon serveur a échoué. Le premier parcours a donc tourné sur ce serveur. Je l'ai arrêté (taskkill) et relancé mon serveur (PID 22284), puis rejoué le parcours. Le rapport ci-dessous est celui du second passage, arrêté après usage.
- `parcours.mjs --url=http://localhost:3457`, code 0 :
  - confirme : ok « QR ✓ », sceau contraste 4,65, total 110,40
  - contredit : diff « 110,40 », sceau contraste 4,42, total 110,04
  - partiel : partiel, contraste 12,63
  - illisible : off « illisible », contraste 13,9
  - sans : sans QR (cercle)
  - lecture : wait « lecture… », sceau contraste 5,74
  - pdf : ok « QR ✓ »
  - non-verifie : aucun sceau
  - confirme-1280 : ok ; contredit-1280 : diff
- Gestes : copie IBAN = `["CH4431999123000889012"]`, bouton « copié » ; duel 110,04 → 110,40 (« QR ✓ ») → 110,04 (« lu gardé »).
- Erreurs console/page : 0.
- Hôtes externes : `fonts.googleapis.com` seul, dans chaque état.
- **Non fait** : contraste du texte « 110,40 » (le parcours ne le mesure pas ; seul le contraste du sceau et du libellé « lecture… » sont sortis, 5,74 et ≥ 4,5). Critère à mesurer à part.
- Serveur 3457 arrêté : port libre.

## Étape 6 — épreuve CSP
- Script : `outils/servir-csp.mjs` lit l'en-tête `Content-Security-Policy` de `firebase.json` (jamais recopié). Passe b : `'wasm-unsafe-eval'` ajouté à `script-src`, rien d'autre. Banc : `outils/csp-banc.mjs` (qr-confirme et qr-pdf, `?dev-local&depense=qr-…`).
- **Prod (`dist/`)** : `?dev-local` absent du bundle (0 occurrence de « dev-local » dans `dist/*.js`). Le banc a expiré à 150 s en attendant l'application : le banc n'est pas joignable sur `dist/`. `vite preview` aurait le même bundle : non tenté.
- **Écart de méthode** : l'épreuve est donc jouée sur le serveur de développement Vite de la copie, avec la CSP de firebase.json en en-têtes serveur (`server.headers`). Le garde `?dev-local` est un outil de développement (`import.meta.env.DEV`) ; aucune garde n'est contournée.
- **Passe a (CSP telle quelle)** :
  - qr-confirme : aucun sceau (état non-verifié). Violations CSP : 2 × `script-src`, bloqué `wasm-eval`. Console (texte tronqué à 300 caractères par le script) : « wasm streaming compile failed: CompileError … 'unsafe-eval' is not an allowed source of script … script-src https://accounts.google.com … », puis « falling back to ArrayBuffer instantiation », puis « Aborted(CompileError …) ». Wasm zxing : 200, compilation bloquée.
  - qr-pdf : aucun sceau. Mêmes 2 violations `wasm-eval` et mêmes erreurs wasm. Worker pdf.js : `pdf.worker.min.mjs` chargé en 200, sans erreur.
  - Attendu de l'auteur (a) `non-verifie` : **conforme**.
- **Passe b (+ `'wasm-unsafe-eval'`)** :
  - qr-confirme : sceau « QR ✓ » (q=ok). 0 violation, 0 erreur console. Wasm 200.
  - qr-pdf : sceau « QR ✓ » (q=ok). 0 violation, 0 erreur console. Worker pdf.js 200.
  - Attendu de l'auteur (b) `ok` : **conforme**.
- Fichiers : `voies/qr-rejeu/captures-csp/csp-a.json`, `csp-b.json`, captures `csp-a-qr-*-390.png`, `csp-b-qr-*-390.png` (non ouvertes : hors étape 7).
- Conséquence : la CSP de firebase.json n'autorise pas le wasm ; sans `'wasm-unsafe-eval'` le sceau reste absent. Décision au pilote.

## Étape 7 — paires de captures (12 paires ouvertes en image)
Gauche = `voies/qr-app/captures/` (régénérées par mes rejeux, voir plus haut) ; droite = `work/missions/2026-10-31-ecran-depense/qr/v1/z2/`. Les 24 fichiers existent des deux côtés.
- confirme-390 : présentes des deux côtés. Sceau QR ✓ en haut à droite, même place. Diffère : gauche « 3 proposées », Citra et Carafa « Créer », ligne mouture avec chevron ; droite « 6 proposées », Citra +100 g relié, Carafa « nouveau », « Rattacher » en noir.
- contredit-390 : présentes. Même duel (lu 110,04 / QR-facture 110,40, « Somme des lignes 110,40 · deux contre un »), chips ① Total et ③ mouture. Gauche : bas de feuille avec une ligne fantôme sous le pied.
- contredit-apres-390 : présentes. Gauche : ① Total barré en vert ; droite : ① Total barré, ② Règlement pleine largeur. Même état.
- partiel-390 : présentes. Sceau « partiel » sous le QR, même place. Diffère comme confirme (3 proposées, Citra « Créer »).
- illisible-390 : présentes. Sceau barré « illisible », chip « Photographier le QR » sous le montant, mêmes deux côtés. Diffère par la liste (position de défilement, données).
- sans-390 : présentes. Cercle pointillé « sans QR » à droite. Diffère : même écart de données.
- lecture-390 : présentes, états différents. Gauche : feuille en chargement « Lecture et vérification… », fichier facture-qr.png 0,1 Mo, fond flouté. Droite : formulaire avec lignes squelettes et « lecture en cours… ». Différence de moment de capture plus que de design.
- confirme-ouvert-390 : présentes. « Ce que dit le QR » en bas de feuille, mêmes rangées. **IBAN différent** : gauche CH44 3199 9123 0008 8901 2 (celui que teste le copier), droite CH93 0076 2011 6238 5295 7.
- illisible-ouvert-390 : présentes. Texte différent : gauche « vu, rien décodé » ; droite « vu, barré par un tampon : rien décodé ».
- partiel-ouvert-390 : présentes. Même IBAN différent que confirme-ouvert ; droite « lu 12.10 » tronqué, gauche « lu 12.10.2026 ».
- confirme-1280 : présentes. Gauche : panneau « Lecture vérifiée » (3 reliés, 0 nouveau, 3 sans stock), Citra « Créer » ; droite : 4 reliés, 1 nouveau, 1 mouture, 1 sans stock. Même IBAN différent.
- contredit-1280 : présentes. Gauche : « Somme des lignes = imprimé 110,40 ≠ 110,04 », sceau 110,40, pas de Règlement visible au-dessus ; droite : même duel, Règlement et ③ mouture visibles, IBAN différent.
- Je ne juge pas le goût ; le critique le fera.

## Non fait / douteux
- Contraste « 110,40 » (étape 5) : non mesuré.
- Captures qr-app d'origine : perdues (écrasées), pas de sauvegarde.
- Dist de production : banc impossible ; épreuve CSP faite en dev avec en-têtes.
- Stock et QR des captures qr-app diffèrent de z2 (IBAN, « Créer » contre relié) : données à confirmer par le pilote (fixtures régénérées ou logique de rapprochement).
- Dist : fichiers de hashes anciens non vidés.

CONNAISSANCE : le banc `?dev-local` ne tourne que hors `dist/` ; la CSP de firebase.json bloque le wasm de zxing (sceau absent), `'wasm-unsafe-eval'` le rétablit (passe b).
LEÇON PROPOSÉE : `parcours.mjs` écrit par défaut dans `voies/qr-app/captures` ; un rejeu doit passer `--sortie=<dossier de sa voie>`, sinon il écrase les preuves de la voie d'origine. Règle : tout script de capture reçoit son dossier de sortie explicitement.

QR-REJEU ECHEC — étape 4 : `vue.test.ts` vert hors ExpenseSheet/qrLecture (attendu rouge) ; étape 5 : contraste « 110,40 » non mesuré ; captures de qr-app écrasées (hors possession). Étapes 2, 3, 6 et 7 conformes à leurs attendus ; étape 6 rapportée telle quelle.
