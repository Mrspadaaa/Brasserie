# Dossier relecture-frise

## Question du brasseur (23.11, mot pour mot)
« le cœur de la frise est reconstruit: ça a été fait en utilisant une librairie ? Tout a bien été réfléchis ? Et l'objectif est bien d'avoir ce que j'avais avant mes robuste, fonctionelle et sans bug ? »

## Objectif
Le même écran (ses choix, règle n° 1), toutes les fonctions et gestes d'avant, en robuste, fonctionnel, sans bug.

## Ce qui existe
- Inventaire écrit avant la reconstruction : work/missions/2026-11-23-reprise-soir/voies/frise/INVENTAIRE.md (26 fonctions d'état, 14 lectures).
- Ancien cœur : commit 06c430228 (avant D444). Nouveau : commits 4b0fbc6a5, cd90d85fa, 898446c6f, puis correctifs fix29 9f407872e.
- Nouveau cœur : src/ui/calendrier/cadre/etat.ts (réducteur), cadre/useCadre.ts, src/domain/calendrier/temps.ts (d3), src/domain/calendrier/dates.ts, src/ui/calendrier/onglet/textes.ts, src/ui/calendrier/CalendrierTab.tsx (ou chemin réel).
- Test par modèle : e2e/calendrier/etat-coherent.spec.ts (ETAT_RUNS, ETAT_SEED) ; copie prête pour Playwright : C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal (HEAD fd27f22e5, node_modules complets ; config playwright.lotcal.config.ts si utile).
- Constats en ligne après reconstruction : BUGS.md lignes T29-1 à T29-12 (tour 29), corrigés par fix29 (non prouvés en ligne ; un critique les rejoue au tour 32).
