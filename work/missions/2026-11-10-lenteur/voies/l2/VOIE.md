# Voie l2 — l'accueil et les vues s'ouvrent plus vite (mission 2026-11-10-lenteur)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote
- Ses mots (10.11) : « Tout les nouvelles vue on mis du temps à chargé, il semblerait qu'il y aille un peu de lenteur dans l'app ».
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L13, L17, L20, L29), `../../MISSION.md` (état de l'art), `../l1/RESULTAT.md` (mesures et
  causes classées, scripts de mesure de l1 à réutiliser), `vite.config.ts`, `src/App.tsx`.
- Base : tag `en-ligne/2026-11-10-curseur` (en ligne). `git worktree add <os.tmpdir()>/l2-wt -b l2/lenteur en-ligne/2026-11-10-curseur`,
  `node_modules` par jonction vers `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.

## Objectif
Corriger dans l'ordre des causes mesurées par l1, chaque gain chiffré avant / après sur le même banc (L20 : mêmes conditions, médiane de 3) :
1. Les JSON lourds (levures, références : 2,18 Mo) importés en statique dans `App` passent en `import()` dynamique chargé par les vues qui
   s'en servent (méthode standard) ; plus rien de lourd et d'inutile à l'accueil. Les 412 Ko préchargés sans servir à l'accueil : retirés
   du préchargement (ou chargés à l'inactivité).
2. Trace Performance (Chrome, CPU ×4) de l'accueil et de l'atelier Houblons en chaud : nomme le travail long (rendu, calcul, parse) et
   corrige la plus grosse cause si elle est simple et sûre ; sinon décris-la chiffrée dans RESULTAT.md.
3. Préchargement des vues probables après l'accueil (à l'inactivité) pour que l'ouverture d'une vue n'attende plus le réseau.
Pas de service worker dans cette voie (décision à part : risque de version périmée). Aucun comportement changé ; hors ligne préservé.

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-lenteur/voies/l2/tests.txt`
  (rouges déjà sur le tag : fuzzSaisie, recipeAiWorkflow et recipeEditing (instables), designTokens, virgule-transversale ; zéro nouveau ;
  en arrière-plan si long, attends) ; `VITE_HOP_V4=on npm run build`, `node scripts/check-build-flags.mjs`, `node scripts/check-no-dev-auth.mjs`.
- Mesure locale (build servi par `npx vite preview` en arrière-plan puis arrêté, Slow 4G + CPU ×4, froid et chaud) avant / après : accueil,
  Brassins, Stocks, Finances, Houblons ; tableau dans RESULTAT.md ; captures de l'accueil chargé, ouvertes (rien de cassé).

## Possède
Worktree `l2-wt`, branche `l2/lenteur` ; `work/missions/2026-11-10-lenteur/voies/l2/**`. Pas `src/pages/BrewDayPage.tsx` ni `src/ui/Brew*`
(voie c3 en cours). Aucun déploiement, aucune donnée réelle, aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha et le gain mesuré.
