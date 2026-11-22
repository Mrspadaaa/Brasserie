# Voie l1 — mesurer la lenteur, en ligne et au paquet (mission 2026-11-10-lenteur)

- Agent : auteur · Modèle : sonnet · Plafond : 100 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L20, L29), `../../MISSION.md` (état de l'art), `vite.config.ts`, `firebase.json` (en-têtes de cache,
  lecture seule), `src/App.tsx` (routes, `lazy`), `cerveau/agents/verification-locale.md` (lecture seule en ligne : n'annuler que les
  écritures nommées ; profil sans `brew-outbox-*`).

## Objectif
1. **En ligne** (https://brasserie-l-affinee.web.app, lecture seule, aucune donnée touchée, aucun bouton qui écrit) : puppeteer-core,
   390 tactile, throttling Slow 4G + CPU ×4, puis sans throttling. Pour l'accueil et chaque vue du menu (Brassins, Conduite d'un brassin,
   Recettes, Stocks, Finances et ses onglets, Dépense ouverte sans rien saisir, Houblons, Levures, Ventes, Clients) : temps jusqu'au contenu
   utile visible, octets et requêtes, en cache froid (profil vidé du cache HTTP) et chaud (seconde visite). Trois mesures par cas, médiane.
2. **Paquet** : sur le tag `en-ligne/2026-11-10-mesures` (worktree détaché dans os.tmpdir(), `node_modules` par jonction vers
   `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`), build avec `rollup-plugin-visualizer` (ou `source-map-explorer`) sans
   rien committer dans `src/` : qui pèse dans `App`, `Host`, `data`, les bootstraps houblons ; ce qui est chargé à l'accueil et n'y sert pas.
   Même mesure de taille sur un tag d'une semaine plus tôt (le plus proche du 03.11 dans `git tag -l "en-ligne/*"`) : qu'est-ce qui a grossi ?
3. **Causes classées** par gain estimé (ms au téléphone) et risque, avec la méthode standard de chacune ; aucune correction dans cette voie.

## Contrôles
- La ligne « Tests » : pas de vitest ; le tableau des mesures va dans `tests.txt` de cette voie (comme `--reporter=dot > …/l1/tests.txt`).
- Chaque chiffre mesuré, ou « estimé » avec sa source (L20).

## Possède
`work/missions/2026-11-10-lenteur/voies/l1/**` ; un worktree détaché à toi dans os.tmpdir(). Rien dans `src/`, aucun déploiement, aucune
donnée réelle, aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne (les trois plus grosses causes).
