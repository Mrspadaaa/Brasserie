# Reprise — nuit du 26 au 27.11 (bug finder / fixer, perf)

État au 27.11 vers 01:45 (heure suisse).

## Fait
- En ligne : lot 1, Hosting `index-Bc72xyPN.js`, branche `claude/nuit-en-ligne-2611` (406a10de3 = tag en-ligne/2026-11-23-tour80 + src de la nuit SANS le chantier Carnet b7c38b376/c81Regles), tag local `en-ligne/2026-11-27-nuit-lot1`. Worktree de mise en ligne : scratchpad `deploy-nuit` (node_modules en jonction vers port-carnet, .env de openai-clean-start/Brasserie, seedData de port-carnet).
- Branche de travail : `claude/nuit-bugs-2611-0406b7` (ce worktree) ; serveur Vite local 3131 (ce code) et 3132 (tour 80, scratchpad `base80`).
- Prouvé en ligne : `outils/scan.mjs` (31 écrans, `ecrans-tous.json`) CHEVAUCHEMENT OK à 390, 360, cave ; `outils/preuve-ma-biere-live.mjs` PREUVE OK 6/6 (paliers, + Eau, Récap).
- Contrôle de chevauchement : `outils/lib.mjs` `chevauchements()` ; KO sur le tour 80 (Ma bière Sels, Volumes, À venir, Réalisés), OK après.
- BUGS.md : NUIT-0 à NUIT-7 ; PERF.md écrit (Bord 1 220 → 610 ms, Calendrier brewBudget 2 699 → 53 ms, App 679 → 545 Ko gzip).

## En cours
- Agent « auteur » (Sonnet) : chasse édition au doigt Ma bière sur 3131 → `scratchpad/gestes-mb/GESTES.md`. À lire, vérifier les captures, corriger les constats prouvés.

## Reste
- NUIT-4 (Sels à 360 : étiquettes coupées), NUIT-6 restes (montée muette, poignée ↔ petite), NUIT-7 (ZZ TEST resté : suppression = son accord).
- Calendrier : 1,6 s CPU ×4 de style/mise en page (trace Performance à faire).
- Lot 2 : tout nouveau correctif → mêmes étapes (critique Opus, `controle-avant-deploiement.mjs <sha> --dossier scratchpad/avd`, tests complets comparés à `f-base80.txt`, build depuis deploy-nuit, `firebase deploy --only hosting`, rejeu en ligne).
- Récapitulatif du matin (≤ 400 caractères) à 07:00.
