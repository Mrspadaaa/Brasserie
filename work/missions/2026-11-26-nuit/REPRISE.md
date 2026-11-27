# Reprise — nuit du 26 au 27.11 (bug finder / fixer, perf)

État au 27.11 à 01:36 (heure suisse). Registre : JOURNAL.md (heures), BUGS.md (NUIT-0 à NUIT-10), PERF.md.

## En ligne
- Lot 1 (00:10) : `index-Bc72xyPN.js`, 406a10de3, tag local `en-ligne/2026-11-27-nuit-lot1`.
- Lot 2 (01:19) : `index-CI1mVmm1.js`, 892d7cf2d, tag local `en-ligne/2026-11-27-nuit-lot2`.
- Branche de mise en ligne `claude/nuit-en-ligne-2611` = tag en-ligne/2026-11-23-tour80 + src/tests de la nuit, SANS le chantier Carnet suspendu (analyseLocale.ts, tests/fixtures/c80, c81Regles). Worktree : `<scratchpad>/deploy-nuit` (node_modules en jonction vers port-carnet, .env de openai-clean-start/Brasserie, seedData de port-carnet).
- Prouvé en ligne : `outils/scan.mjs` (31 écrans) CHEVAUCHEMENT OK à 390, 360, cave ; `outils/preuve-ma-biere-live.mjs` 6/6 (paliers, + Eau, Récap) ; `outils/preuve-lot2-live.mjs` 2/2 (Échap, Sels 360).

## Travail
- Branche `claude/nuit-bugs-2611-0406b7` (worktree eau-sels-1911-f5e6d2). Vite local : 3131 (ce code), 3132 (tour 80, `<scratchpad>/base80`).
- Lot 3 prêt à finir : 91103d746 (zones des « + » des paliers 23 → 31 px, controle-ma-biere 9/9).
- Agent Sonnet lancé 01:40 : banc des fiches hors Ma bière (fixtures ZZ en mémoire, 3131) → `<scratchpad>/gestes-fiches/GESTES-FICHES.md`. Lire, vérifier chaque capture, corriger les constats prouvés (test qui échoue d'abord).

`<scratchpad>` = C:\Users\mrspa\AppData\Local\Temp\claude\b544ff255d45c8a5\b8d55cb5-6273-4076-b363-d67bfb7c3518\scratchpad

## Étapes d'un lot
1. Critique Opus NEUVE (un agent critique ne se relance que 2 fois, hook) sur `node outils/captures-lot.mjs 3131 <scratchpad>/avd/<sha>` ; VERDICT.md (modèle : `<scratchpad>/avd/892d7cf2d/VERDICT.md`) ; `node scripts/agents/controle-avant-deploiement.mjs <sha> --dossier <scratchpad>/avd`.
2. Dans deploy-nuit : `git checkout claude/nuit-bugs-2611-0406b7 -- <fichiers src et tests changés depuis le tour 80, sauf Carnet>`, commit ; tests complets, aucun fichier rouge neuf face à `<scratchpad>/f-base80.txt`.
3. Build : `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build`, puis check-firebase-config, check-no-dev-auth, check-build-flags, garder-morceaux ; `npx firebase deploy --only hosting --project brasserie-l-affinee --non-interactive -m "…"` ; tag local.
4. Rejeu en ligne (lib.mjs contourne le service worker) : scan 390, 360, cave ; preuves Ma bière et lot 2 ; captures regardées.

## Restes écrits
- NUIT-6 (montée étroite muette, poignée ↔ petite), NUIT-7 (ZZ TEST resté : suppression = son accord), NUIT-9 non rejoué en ligne (aucun brouillon ZZ avec houblon ; prouvé au banc), NUIT-10 (Entrée → ajout voulu ; 999 min signalé).
- Interdits : push/PR/merge, règles, données réelles hors ZZ TEST, Gemini réel, chantier Carnet suspendu ; ne jamais fermer le Chrome 9222 (fermer() de lib.mjs seulement).
- Récapitulatif du matin (≤ 400 caractères) vers 07:00 : lots en ligne (index), preuves, commits, PERF.
