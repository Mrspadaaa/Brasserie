# Voie l3 — l'atelier Houblons V5.5 n'attend plus la bibliothèque de levures (mission 2026-11-10-lenteur)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L13, L20, L29), `../../MISSION.md`, `../l1/RESULTAT.md`, `../l2/RESULTAT.md` (en entier :
  mesures, scripts, « DÉCISION À PRENDRE », « DEMANDE EXECUTANT »).
- Base : branche `l2/lenteur` (sha 1cd9336b), worktree `l2-wt` dans os.tmpdir() (à toi maintenant).
- Décision du pilote : suivre la recommandation de l2 (rendre la bibliothèque de levures asynchrone pour l'atelier) ; ne rien déployer.

## Objectif
1. `predictionReferences` et ses appelants : la bibliothèque de levures se charge par `import()` quand un calcul en a besoin (méthode
   standard : chargement paresseux + promesse mémorisée), sans changer un seul résultat de calcul (tests du moteur inchangés et verts).
   L'atelier V5.5 à froid revient au moins au niveau du tag (`en-ligne/2026-11-10-curseur`), mesuré médiane de 3, même banc.
2. Puis la « DEMANDE EXECUTANT » de l2 : série finale sur le dernier build (toutes les vues mesurées par l1/l2, froid et chaud, avant =
   tag, après = branche), suite complète, captures de l'accueil et de l'atelier chargés, ouvertes. Aucune vue plus lente qu'au tag au-delà
   du bruit mesuré (dis l'écart type).

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-lenteur/voies/l3/tests.txt`
  (rouges déjà sur le tag : fuzzSaisie, recipeAiWorkflow et recipeEditing (instables), designTokens, virgule-transversale ; zéro nouveau ;
  en arrière-plan, attends la fin) ; `VITE_HOP_V4=on npm run build`, `check-build-flags`, `check-no-dev-auth`.

## Possède
Worktree `l2-wt`, branche `l2/lenteur` ; `work/missions/2026-11-10-lenteur/voies/l3/**`. Pas `src/pages/BrewDayPage.tsx` ni `src/ui/Brew*`
(voie c3). Aucun déploiement, aucune donnée réelle, aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments), tableau final avant/après. À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha.
