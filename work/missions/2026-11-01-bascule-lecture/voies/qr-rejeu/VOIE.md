# Voie qr-rejeu — rejouer qr-app depuis la copie isolée, et éprouver la CSP (D247, D252)

Agent `executant` (Haiku), 40 tours au plus. Décideur : pilote. Tu ne corriges rien : tu rejoues et tu rapportes.

## Où
- Dépôt : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie` (lecture seule pour toi, sauf ta voie).
- Copie isolée : `%TEMP%/qr-app-copie` (`npm ci` réel dedans). Jamais de serveur ni d'installation dans
  `C:/Users/mrspa/Documents/Brasserie` ni dans les `node_modules` du dépôt (ce sont des jonctions vers lui).
- Rapport de l'auteur : `work/missions/2026-11-01-bascule-lecture/voies/qr-app/RESULTAT.md` (sections « DEMANDE EXECUTANT » et
  « Suite 1 »).

## À faire, dans l'ordre (note chaque sortie telle quelle)
1. `bash work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/synchro.sh`. Copie aussi `docs/research` dans la copie (le
   dernier contrôle de `npm run build` le lit).
2. Dans la copie : `npx tsc --noEmit` (attendu : aucune sortie), `npm run build` (attendu : code 0),
   `node scripts/check-no-dev-auth.mjs` (attendu : « Bundle de production propre »). Note les tailles de `dist/assets` :
   `zxing_reader-*.wasm`, `pdf-*.js`, `pdf.worker.min-*.mjs`, `App-*.js`, `index-*.js`.
3. Dans la copie : `npx vitest run --maxWorkers=2 tests/unit/depense tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx`
   (attendu : 0 rouge ; note le nombre de fichiers et de tests).
4. « Échouaient avant », **dans la copie seulement** : remplace `src/ui/finance/ExpenseSheet.tsx` par
   `git -C <dépôt> show HEAD:src/ui/finance/ExpenseSheet.tsx`, renomme `src/services/qrLecture.ts` en `qrLecture.ts.off`, puis
   `npx vitest run tests/unit/depense/qr` : attendu **rouge** pour `lecture`, `vue`, `ecran-qr`. Puis refais l'étape 1 et vérifie
   que `npx vitest run tests/unit/depense/qr` est de nouveau vert.
5. Serveur Vite de la copie sur le port 3457 (`npx vite --port 3457 --strictPort`, en arrière-plan), puis
   `node work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/parcours.mjs --url=http://localhost:3457`. Attendus :
   0 erreur console ; les états `ok`, `diff`, `partiel`, `off`, `sans QR`, `wait`, `ok` (PDF) et « aucun sceau » ;
   `gestes.copierIban.copie = ["CH4431999123000889012"]` ; le duel `110,04 → 110,40 → 110,04` ; seul hôte externe :
   `fonts.googleapis.com`. Contrastes : « lecture… » et « 110,40 » ≥ 4,5. Arrête le serveur à la fin.
6. **Épreuve de la CSP.** Sers `dist/` de la copie avec un petit serveur statique Node que tu écris dans ta voie
   (`outils/servir-csp.mjs`, avec Write). Il envoie **exactement** l'en-tête `Content-Security-Policy` de `firebase.json`
   (lu par le script dans le fichier du dépôt, jamais recopié à la main) et les mêmes règles de réécriture vers `index.html`.
   Deux passes : (a) la CSP telle quelle ; (b) la même avec `'wasm-unsafe-eval'` ajouté à `script-src`. À chaque passe, joue dans
   Chrome (puppeteer-core) la lecture de `src/ui/depense/apercu/qr/facture-qr.png` **et** du PDF fictif avec QR, par le même
   banc `?dev-local&depense=qr-confirme` (et son équivalent PDF ; voir `apercuDev.ts`). Rapporte pour chaque passe :
   l'état du sceau, les violations CSP de la console (texte exact) et le statut du worker de pdf.js. Attendu, d'après l'auteur :
   (a) `non-verifie` (aucun sceau), (b) `ok`. Si `?dev-local` est refusé par le bundle de production, dis-le et joue la même chose
   avec `vite preview` et les en-têtes ajoutés par ton serveur ; ne contourne aucune garde du code.
7. Ouvre en image (outil Read) chaque capture de `voies/qr-app/captures/` et sa jumelle de
   `work/missions/2026-10-31-ecran-depense/qr/v1/z2/` : `z2-confirme-390`, `z2-contredit-390`, `z2-contredit-apres-390`,
   `z2-partiel-390`, `z2-illisible-390`, `z2-sans-390`, `z2-lecture-390`, `z2-confirme-ouvert-390`, `z2-illisible-ouvert-390`,
   `z2-partiel-ouvert-390`, `z2-confirme-1280`, `z2-contredit-1280`. Pour chaque paire : présente des deux côtés ou non, et ce qui
   diffère à l'œil (position du sceau, mots, couleurs). Tu ne juges pas le goût : le critique le fera.

## Possède
`work/missions/2026-11-01-bascule-lecture/voies/qr-rejeu/**` et la copie isolée `%TEMP%/qr-app-copie`. Rien d'autre : aucune
correction du code, aucun commit, pas de `git stash`, aucun déploiement, aucun appel Gemini, aucune donnée réelle. Ne touche jamais
`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env`. Chemins absolus dans Bash ; aucun code écrit par heredoc ni `node -e`.

## Retour
`voies/qr-rejeu/RESULTAT.md` : une section par étape, avec sorties, nombres et chemins. Puis une ligne :
`QR-REJEU OK — <résumé>` si les étapes 2 à 5 sont conformes (l'étape 6 se rapporte telle quelle, quel que soit son résultat), sinon
`QR-REJEU ECHEC — <étapes et écarts>`.
