# État de reprise — mission 2026-11-09-levure-retours (09.11)

## Objectif
Ses cinq retours du 09.11 sur l'étape Levure en ligne, et la recherche avancée des houblons. Mots et lecture : `MISSION.md` et la fin de
`work/refonte-frontend/v4/SPEC-BRASSEUR.md`. Fini, c'est : déployé, joué en ligne sur une recette « ZZ TEST », puis UN seul rapport au
brasseur (il refuse les messages à chaque retour d'agent).

## Décisions (pilote)
- Recherche avancée des houblons : un bouton « Recherche avancée » près du champ « Ajouter — houblon… », qui ouvre la vue c6b générique
  dans la pile de l'app.
- `etapeLevure/Conduite.tsx` reste dans le dépôt, non monté.
- Pastilles « 1 » de la station de conduite : masquées dans Ma levure (réversible).

## Fait
- **Voie r1, finie** (`voies/r1/RESULTAT.md`) :
  - recherche sur place dans Ma levure ;
  - conduite de base (`YeastRecipePlan`) ;
  - 7 alignements ;
  - 219 tests verts.
- **Pilote, après r1** :
  - prop `initialConductOpen` dans `src/ui/YeastRecipePlan.tsx` (le clic simulé est retiré) ;
  - saisie libre pré-remplie (`src/ui/nomLibreLevure.ts`, lu par `YeastIngredientPicker`) ;
  - test dans `etapeRetours.test.tsx` ;
  - tsc 0.
- **Voie r2, arrêtée à sa limite de 120 tours, code fini** (`voies/r2/RESULTAT.md`) :
  - Chercher levure : ligne entière, 5 alignements ;
  - moteur générique `src/domain/rechercheAvancee/facettes.ts` et vue `src/ui/rechercheAvancee/` ;
  - houblons : `src/ui/hopIndex/rechercheAvancee/`, bouton « avancée » dans `Ajouter.tsx`, route `hopSearch`.
  Ses captures h1 à h5 sont faites ; la série complète ne l'est pas.
- **Commit 0df6d24a** (local, non poussé, non déployé) : pilote rejoué, tsc 0, 1 255 tests verts (128 fichiers, levure, houblons,
  YeastRecipeChoice).

## Prochaines actions
1. (fait : rejeu tsc et vitest)
2. `git status --short` contre les Possède. Ne jamais commettre :
   - `src/data/hopSources/beeranalytics-*.json` ;
   - `scripts/eval-hop/k1-*` ;
   - les GATES d'essai-voies ;
   - les PNG fermentescibles ;
   - `mesurer-loupe.mjs`, `check-invoice-journey-emulator.mjs`, `controle-bugs.mjs` ;
   - `journal-gemini.md`, `pistes-l5f.png`, `fraisT3` ;
   - `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `.claude/launch.json`.
3. Commit par chemins. Le sujet nomme les bugs (« ID : … », hook bugs-auto). Fin : « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».
4. Critique (agent `critique`, Fable), sur les bancs `?dev-local&etape=levure` et `&etape=houblons`, à 390 tactile et 1280, clair et cave,
   côte à côte avec `captures-brasseur/` et la maquette c6b ; écrit dans `critique/`.
5. Déployer depuis la copie `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70` (checkout détaché du commit) :
   - `VITE_HOP_V4=on npm run build` ;
   - check-no-dev-auth, check-build-flags ;
   - `npx firebase deploy --only hosting --project brasserie-l-affinee --non-interactive` ;
   - vérifier que l'`index-*.js` servi existe dans dist.
   Puis envoyer le sha servi à la session Monitoring (`local_6078cde8-…`), pour `bugs-auto --deploye <sha>`.
6. Jouer en ligne (Chrome) sur une recette « ZZ TEST — … » :
   - Ma levure : taper, choisir, saisie libre, conduite ;
   - Chercher : ligne entière ;
   - Houblons : recherche avancée, puis ajout.
   Retirer ensuite les données de test.
7. Un seul rapport au brasseur. Sessions liées à intégrer :
   - BR-45 (`local_c6bd4a52-…`, branche à fusionner sur son accord) ;
   - banc Gemini (`local_f6a697fc-…`, commande de déploiement des fonctions à lui soumettre).

## Risques ouverts
- r2 touche `src/domain/levure/**` (généralisation) : les tests levure doivent rester verts.
- Le premier chargement de Vite au banc dépasse 30 s : allonger les délais.
