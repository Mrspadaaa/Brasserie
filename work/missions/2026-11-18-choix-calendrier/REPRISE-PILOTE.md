# Reprise du pilote (19.11, ~00:30) — mode nuit

## En ligne
Tag le plus récent : en-ligne/2026-11-19-paquet-d (port-carnet, HEAD 57725ef5f) : calendrier (D384 à D390, lots A à D) + carnet (D383). 0 bloquant en ligne.

## Recette de mise en ligne (worktree C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet)
fetch des tags ; chaque tag en-ligne/* récent ancêtre de HEAD ; tests calendrier + carnet ; cp ../Brasserie/.env .env ; rm -f .env.local ;
VITE_HOP_V4=on VITE_CARNET_IA=production npm run build ; node scripts/check-firebase-config.mjs dist/assets ; node scripts/check-no-dev-auth.mjs dist ;
node scripts/garder-morceaux.mjs dist ; rm -f .env (le worktree n'a pas de .env à lui) ; npx firebase deploy --only hosting --project brasserie-l-affinee ;
tag annoté en-ligne/<date>-<nom> ; push branche + tag ; curl : index servi = dist/index.html. Fonctions : seulement functions:aiTask si functions/ change.

## À faire
1. Session carnet-paquet (local_8deb3b9b…, branche claude/carnet-paquet-1811-c995a7) : à sa fin, lire son RESULTAT (work/missions/2026-11-17-port-carnet/paquet-1/RESULTAT.md dans son worktree), fusionner sa branche dans claude/port-carnet-1711, tests, déployer, test en ligne vraie IA (5 CHF accordés, ~19 envois déjà faits ; plafond 10 de plus), verser au registre.
2. Calendrier, paquet E (registre) : PC-136 (vente/achat d'un jour ne se glissent pas en vue Semaine), en-tête paysage aligné 147 px (> 120, E10), vue Mois glisser en semaines, doute achat lié qui ne suit pas la fête.
3. Chaque lot : correctifs un par un prouvés seuls, captures ouvertes, déploiement, test EN LIGNE (« Et bien tester sur la vrai app surtout !! »), registre.
4. Fin : un seul récapitulatif ≤ 400 car. ; D390 (fil au toucher seulement) à faire confirmer au brasseur.
