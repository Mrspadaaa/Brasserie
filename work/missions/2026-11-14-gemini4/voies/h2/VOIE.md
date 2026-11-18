# Voie h2 — préparer le déploiement de h1 (Hydrogen + « Un doute ? ») sur ce qui est vraiment en ligne (mission 2026-11-14-gemini4)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (ordre du brasseur : déployer sans attendre ; aucune régression)
- Fait établi par le pilote : `aiTask` en ligne = tag `aitask/2026-11-10-1148` (source déployée le 10.11 à 11:48). Ce tag a ~400 lignes de
  `functions/src/invoiceScanVote.ts`, `invoiceVisionReview.ts`, `invoiceScanPrompts.ts` ABSENTES de `claude/refonte-houblons-v4`. L'hébergement en ligne =
  tag `en-ligne/2026-11-14-stock-c`. Les commits h1 sont `fffd62a6` (serveur : Hydrogen 3ᵉ lecture, repli 3.8) et `72429e3f` (option `relecture: 'argon'`,
  bouton, garde « pas fait mieux »). Lis `../h1/RESULTAT.md`.
- Travaille dans un dossier neuf : `git worktree add <os.tmpdir()>/deploy-h2 aitask/2026-11-10-1148` depuis ce dépôt (jamais dans le worktree courant,
  jamais `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70`). Ni stash.

## Objectif
1. Serveur : branche `deploy/h2-aitask` depuis `aitask/2026-11-10-1148`, y porter les changements SERVEUR de h1 (fffd62a6, 72429e3f) en gardant tout le
   comportement du tag (conflits résolus en faveur du tag, plus le changement de modèle et l'option relecture). `npm --prefix functions ci` si besoin,
   tests `functions` et tests unitaires/intégration de la lecture verts (rouges déjà présents sur le tag : les lister, pas de nouveau), tsc functions,
   `npm --prefix functions run build`.
2. Client : branche `deploy/h2-hosting` depuis `en-ligne/2026-11-14-stock-c`, y porter les changements CLIENT de 72429e3f (bouton, aiClient, geminiScanner,
   ExpenseSheet, controlesCroisesVue et leurs tests). Le client doit fonctionner avec le serveur du point 1. tsc racine, tests ciblés,
   `VITE_HOP_V4=on npm run build`, `node scripts/check-no-dev-auth.mjs`, `node scripts/check-build-flags.mjs`.
3. Rapatrier : liste dans RESULTAT.md les commits ou fichiers du tag `aitask/2026-11-10-1148` absents de `claude/refonte-houblons-v4` (d'où ils viennent :
   `git branch -a --contains`, sessions lecture-robuste / fusion-lectures), sans rien fusionner dans la branche courante.

## Contrôles
- Tests : `npx vitest run tests/unit/invoice* tests/integration/invoice* tests/unit/models* --reporter=dot > work/missions/2026-11-14-gemini4/voies/h2/tests.txt` (serveur et client, sur chaque branche ; ajouter les tests `functions`, commandes écrites en tête du fichier).
- Aucun déploiement, aucun appel Gemini réel, aucun push. Commits sur les deux branches `deploy/h2-*` seulement, terminés par
  « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Possède
Le dossier temporaire `deploy-h2`, les branches `deploy/h2-aitask` et `deploy/h2-hosting`, `work/missions/2026-11-14-gemini4/voies/h2/**`.

## Rendre
`RESULTAT.md` au fil : SHA des deux branches, chemin du dossier, tests, ce qui manque sur la branche courante. Une ligne.
