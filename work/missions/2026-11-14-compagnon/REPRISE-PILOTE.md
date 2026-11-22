# Reprise du pilote — compagnon p2a (15.11)

## Fait
- p2a choisie (« Tout se lit sans lire / p2a · de s3b / Parfait », SPEC 15.11). Page : https://claude.ai/artifact/V4JfNqJvtKUWRFLMoxYLam.
- Port : worktree `C:/Users/mrspa/AppData/Local/Temp/compagnon-p2a`, branche `claude/compagnon-p2a`, dernier commit f8739172. Contrôles `outils/controle-port.mjs noms|tsc|tests|build` : PORT OK.
- Critique Opus : c3 93 défauts → fx1, fx2a/b/c, fx3 → c4 33 restants (17 banc) → fx3 en corrige 14 des 16 non-banc. Restes listés dans `avant-deploiement/cdc008ee/VERDICT.md`.
- Copie de déploiement : `C:/Users/mrspa/AppData/Local/Temp/deploy-compagnon`, branche `deploy/compagnon-p2a`, commit cdc008ee = `en-ligne/2026-11-15-futs` + merge de la branche du port (diff nul sur les fichiers du compagnon). `.env`, `seedData.ts`, node_modules liés.
  - tsc OK ; `VITE_HOP_V4=on npm run build` OK (dist/ prêt) ; check-no-dev-auth OK ; check-build-flags OK ; check-firebase-config (script du dépôt partagé) OK.
  - `controle-avant-deploiement.mjs cdc008ee --dossier work/missions/2026-11-14-compagnon/avant-deploiement` : AVANT-DEPLOIEMENT OK.
  - Suite Vitest complète lancée en fond, sortie `C:/Users/mrspa/AppData/Local/Temp/deploy-compagnon-vitest.txt`. Rouges connus de la base (à ne pas imputer au port) : recipeEditing (6), recipeAiWorkflow (2), expenseSheet (1), yeastPitchingExecution (2), designTokens (hors compagnon), virgule-transversale (hors compagnon) ; sur la branche du port, brewWizardDraftAsyncChange est vert.

## Reste
0. FAIT (15.11) : suite complète sur cdc008ee = 13 rouges, tous dans les rouges connus (expenseSheet 1, recipeAiWorkflow 2, recipeEditing 6, yeastPitchingExecution 2, designTokens 1, virgule-transversale 1) ; 14 968 verts.
1. (fait) Lire la fin de `deploy-compagnon-vitest.txt` : liste des fichiers en échec ⊆ rouges connus ci-dessus, sinon diagnostiquer.
2. Revérifier qu'aucun tag `en-ligne/*` plus récent que `en-ligne/2026-11-15-futs` n'est apparu (sinon le fusionner dans deploy-compagnon, rebuild, revérifier).
3. Depuis `deploy-compagnon` : `npx firebase deploy --only hosting -m "Compagnon brasseur p2a"` ; lire « found N files » ; ouvrir la page servie dans Chrome (bundle neuf, `?dev-local` doit montrer la connexion).
4. Tag `en-ligne/2026-11-15-compagnon` sur cdc008ee ; note dans le dossier partagé des sessions (`compagnon-2026-11-14.md`) : prochain déploiement part de ce tag.
5. Jouer en ligne : ouvrir le compagnon (brassin ou recette), une question réelle au plus, ne rien appliquer ; regarder la carte (aucun nom de modèle, feu, proposition, détails).
6. Ajouter la page dans ecrans.json si utile ; signer MISSION.md ; commit par chemins de la mission (fichiers ignorés : `git add -f`).
7. Récapitulatif final ≤ 400 caractères à la session parente.
