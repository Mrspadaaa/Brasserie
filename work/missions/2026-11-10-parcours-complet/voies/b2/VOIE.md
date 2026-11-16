# Voie b2 — PC-2 (a) au geste tactile, et « Quantité invalide » au jour de brassage (mission 2026-11-10-parcours-complet)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L13, L17, L29) ; `../b1/RESULTAT.md` (PC-2 a non reproduit en jsdom, PC-1 levure
  « à régulariser ») ; `../r2/RESULTAT.md` lignes 11, 25, 28 (reproduits en ligne, bundle index-Cmht_ZH1.js) et `../r2/tests.txt`.
- Base : le code en ligne est le tag `en-ligne/2026-11-10-parcours` (lecture2 + b1). Travaille dans
  `git worktree add <os.tmpdir()>/b2-wt -b b2/parcours en-ligne/2026-11-10-parcours`, `node_modules` par jonction vers
  `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules` (complet : cheerio, firebase-admin… ; b1 en manquait).

## Objectif
Un test qui échoue sur le tag avant chaque correction (L13), à la cause :
1. **PC-2 (a)** : dépense sans justificatif, ligne en « nouvel article », catégorie choisie dans la liste (Malt, Houblon, Levure) au
   vrai geste tactile (pointerdown/touchstart, pas un click jsdom ; puppeteer-core en émulation tactile 390 sur le banc local) : à la
   création, catégorie "" (article en « Divers ») ; pour Levure, l'unité « sachet » perdue aussi. Trouve pourquoi (blur avant sélection,
   valeur non propagée…), corrige, prouve au banc Chrome tactile.
2. **« Quantité invalide. Réessayer · Recharger le serveur »** et « Journal à synchroniser », requête 400, dès l'arrivée à
   l'ensemencement, avant tout geste sur la levure (brassin dont la levure n'a pas de quantité réelle). Probablement lié à PC-1 de b1
   (levure « à régulariser ») ou à un envoi de quantité nulle/inconnue. Reproduis au banc local (émulateurs ou fixture), trouve
   l'appel et la règle serveur qui refuse, corrige côté client (inconnu ≠ 0 : n'envoie pas une quantité inconnue) sans toucher
   `firestore.rules` ni `functions/` ; sinon écris la cause dans RESULTAT.md.

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-parcours-complet/voies/b2/tests.txt`
  (zéro nouveau rouge contre le tag ; liste ceux déjà présents) ; `VITE_HOP_V4=on npm run build` vert.
- Captures Chrome réel tactile 390 (et 1280 pour la dépense) avant/après, toutes ouvertes, dans `voies/b2/captures/`.

## Possède
Le worktree `b2-wt` et sa branche `b2/parcours` ; `work/missions/2026-11-10-parcours-complet/voies/b2/**` (dans ce dépôt).
Aucun déploiement, aucune donnée réelle, aucun appel Gemini, ni `functions/.env` lu. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments) : cause, commits (sha), tests, captures. Arrête-toi à 150 k : « REPRISE : <fichier> ».
Réponse finale au pilote : une ligne avec le sha final de `b2/parcours`.
