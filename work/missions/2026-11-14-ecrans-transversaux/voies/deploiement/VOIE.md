# Voie deploiement — mise en ligne des écrans transversaux (mission 2026-11-14-ecrans-transversaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote (déploiement demandé par la mission : « porter 1:1, tester, déployer, jouer en ligne »)
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L17), `work/missions/2026-11-14-ecrans-transversaux/ETAT.md`.

## Objectif
Mettre en ligne la branche `claude/ecrans-transversaux` (worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, 21 commits et plus
depuis `en-ligne/2026-11-14-atelier-uv4`) **par-dessus le dernier tag déployé `en-ligne/2026-11-15-finances`** (il contient futs et atelier-kckd),
sans rien perdre de ce que ces tags ont mis en ligne.
1. Copie neuve : `git worktree add C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux en-ligne/2026-11-15-finances -b deploy/transversaux`.
2. Cherry-pick, dans l'ordre, de chaque commit de `en-ligne/2026-11-14-atelier-uv4..claude/ecrans-transversaux`. Conflit : garder **les deux**
   intentions (le code déployé des autres missions d'abord ; nos changements par-dessus) ; points chauds attendus : Finances (plage, Frise, Bande :
   la période commune doit réemployer leur version déployée), CreativeLabTab (Atelier), KegBoard (Fûts), App.tsx, QuickActionModal (caisse v3a
   intacte). Écris chaque conflit et sa résolution dans RESULTAT.md.
3. Copie `.env` et `src/data/seedData.ts` depuis le dépôt principal ; `npm ci` (et `functions/`) ; `node scripts/check-firebase-config.mjs` (OBLIGATOIRE :
   le 14.11 un build sans .env a cassé l'app 10 min).
4. `npx tsc --noEmit -p .` ; `npx vitest run tests/unit --reporter=dot > <voie>/tests.txt 2>&1` (rouges déjà rouges sur le tag : les nommer en
   rejouant le même fichier sur le tag ; tout nouveau rouge bloque) ; `VITE_HOP_V4=on npm run build` ; `node scripts/check-no-dev-auth.mjs` ;
   `node scripts/check-build-flags.mjs` ; `node scripts/check-firebase-config.mjs`.
5. Avant de déployer, banc local du build (`npx vite preview` ou le serveur de dev sur la copie, ?dev-local) : ouvre en 390 tactile et 1280 l'en-tête,
   Plus, la période (Plus puis Finances), la recherche, le + sur Brassins, Réglages, et Finances (son écran déployé doit être intact) ; captures
   dans `<voie>/avant/`, ouvertes.
6. `firebase deploy --only hosting` depuis la copie ; lis « found N files » ; ouvre l'URL servie dans Chrome (page de connexion attendue, rien de
   cassé, aucune erreur de console) ; vérifie l'absence de `dev-local` dans le bundle servi.
7. Tag `en-ligne/2026-11-15-transversaux` sur le commit déployé (local, pas de push).
Jamais `.codex/hooks.json`, `functions/.env`, `firestore.rules` ; aucune donnée réelle modifiée ; ni stash ni checkout dans les autres dossiers.

## Contrôles
- Tests : `npx vitest run tests/unit --reporter=dot > work/missions/2026-11-14-ecrans-transversaux/voies/deploiement/tests.txt 2>&1`.
- Sorties de build et de contrôles dans `work/missions/2026-11-14-ecrans-transversaux/voies/deploiement/` (fichiers).
- RESULTAT.md tenu au fil (une ligne par étape ; une limite de tours ne doit rien perdre). Sous 150 k ; au-delà REPRISE avec l'étape exacte.

## Possède
La copie `C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux` et sa branche `deploy/transversaux` ; `work/missions/2026-11-14-ecrans-transversaux/voies/deploiement/**`.

## Rendre
Une ligne : « deploiement : OK, en ligne, tag en-ligne/2026-11-15-transversaux (<sha>), found N files » ou « deploiement ECHEC : <étape, raison> ».
