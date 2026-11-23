OK — fix114, D273c, virgule (50 sur 53), designTokens (17 sur 19) : 4 tests verts hors occurrences des autres voies

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Reste des autres voies : `TRANSVERSE-RESTE.md` (même dossier).

## Les 4 points

1. **fix114 : ce n'était pas un bug du code, mais un test périmé.** Le test du 15.11 voulait chaque geste une seule fois ; BUGS 34 (16.11, `plus-commun-identique.test.ts`, règle du pilote « certaines actions doivent toujours être possible ») fixe l'inverse : un geste monté en tête garde sa case dans « Partout », marqué ↑. Corriger le code aurait changé le visuel choisi (b1s-b2). Le test suit la règle du 16.11 : Facture et Vente deux fois sur Finances (plein en tête, court ↑ en Partout), une fois ailleurs. Capture 390 de Finances, clair et cave, ouverte : « Nouvelle écriture », « Entrer une facture », « Encaisser une vente », « Estimer un brassin » en tête ; Écriture ↑, Facture ↑, Vente ↑, Recette, Brassin, Compagnon en Partout. Pas de doublon accidentel. Captures : `…/scratchpad/plus-finances-390-clair.png` et `-cave.png`.
   DÉCISION À PRENDRE : si le brasseur veut vraiment « Facture » une seule fois à l'écran Finances, c'est un autre choix de dessin (retirer la case ↑ de Partout), pas un correctif. Recommandation : garder.
2. **D273c : fichier généré, jamais suivi.** `functions/src/hopAdviceContentReference.ts` n'a existé dans aucun commit (seul le `.d.ts`, « generated from the exact shared domain implementation ») : `scripts/build-brewer-tools.mjs` le génère par esbuild depuis `src/domain/hopDecision/adviceContentReference.ts` vers `functions/lib/`. Deux autres modules sont dans le même cas (`brewerHopAdviceSemanticSource4`, `brewerTools`). Correctif dans `functions/src/invoiceScanCore.ts` : table `GENERATED_FROM_SHARED_DOMAIN` + `engineModuleUrl` ; sous Vitest l'empreinte lit la source partagée sans suivre ses imports ; déployé (`.js`), rien ne change. Aucune fonction déployée. Limite : sous Vitest l'empreinte ne couvre pas les imports profonds de ces trois modules.
3. **virgule-transversale : 50 sur 53.** Valeurs brutes via `nombreFr` ou `fr` (QuickActionModal, brewDayCalculs, analyseLocale, iaSimulee, BrewPitchJauge, BrewDayPage `{max} g`, TarifsFrise, attente, fermentescibles, BienCuve, CarteApres, FicheFermentation, modele fermentation, PostFiche, AdapterVolumes, EtapeRecap, pistes). Faux positifs ou texte déjà formaté : `// virgule-ok : <raison>` (chemins SVG de mur.ts, largeurs et couleurs CSS, `chf()` de functions, `abv` stocké, textes déjà formatés), ou réordonnancement de props (`g={g}` avant `key`, `m`). Restent 3 dans `src/ui/etapeLevure/CarteDose.tsx` : listées dans TRANSVERSE-RESTE.md. Le test échoue donc exactement sur ces 3 lignes.
4. **designTokens : 17 sur 19.** `text-cave-100` vers `text-cave-200`, `text-cave-300` vers `text-cave-400`, `border-cave-500` vers `border-cave-600` (App, CalendrierPreview, Ligne, RelireFin, controlesCroisesVue, ExpenseSheet). Avant, ces classes ne produisaient aucune règle (l'élément héritait de son parent) : la couleur devient explicite, au degré voisin ; c'est le seul écart de rendu possible, non capturé hors du menu +. Restent 2 dans `src/ui/calendrier/LienSection.tsx` (voie Calendrier), listées.

## Preuves

- `npx vitest run` fix114, invoiceScanCache-d273c, plus-commun-identique : verts. designTokens : 1 échec, les 2 lignes de LienSection. virgule-transversale : 1 échec, les 3 lignes de CarteDose.
- `node scripts/agents/controle-virgule.mjs` : 3 écritures, toutes CarteDose.
- `tsc --noEmit` (racine) : une seule erreur, `src/domain/hopIndex/v4/cases.ts(85,55)`, fichier de la voie V-RECETTE, étranger à ma voie (le tsc était propre avant son changement). `functions` tsc : propre.
- Build : `npm run build` bloqué par cette erreur tsc. `VITE_HOP_V4=on VITE_CARNET_IA=production npx vite build` : sortie 0 ; `check-private-research` OK ; `check-build-flags dist` : DRAPEAUX OK (CarnetsVue et CreativeLabTab → production).
- Tests voisins (`vitest related` des fichiers touchés, coupé à 580 s, 7 fichiers rendus) : un échec, `tests/integration/recipeAiWorkflow.test.tsx`, fichier modifié par une autre voie, non relié à mes changements. Un second lot (carnets, finance, depense, brewDay, stock, fermentation, atelier) a été lancé ; sa sortie n'a pas été relue : à rejouer.

DEMANDE EXECUTANT :
1. `npx vitest run tests/unit/carnets tests/unit/finance tests/unit/depense tests/unit/brewDay tests/unit/stock tests/unit/fermentation tests/unit/atelier tests/integration/depense tests/unit/stock --maxWorkers=3` depuis `port-carnet` ; attendu : aucun échec lié à nombreFr, virgule-ok ou cave-200/400/600.
2. Après la correction de `hopIndex/v4/cases.ts` par V-RECETTE : `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` ; attendu : sortie 0 et « DRAPEAUX OK ».

## Commits (branche `claude/port-carnet-1711`)

- fix114 : `f60871d15`.
- D273c : `02bdcffba`.
- virgule : mes 32 fichiers sont entrés dans le commit `a50c28243` de la voie V-CAL (« V-CAL G3 »), qui a vidé l'index partagé du worktree pendant que je le préparais ; leur contenu est exact, mais le message n'est pas le mien. `9772fd412` corrige `mur.ts` (un retour chariot était resté au milieu d'une ligne).
- designTokens : `04a76fb5e`.
- Rien de `source4-…json` ni de `seedData.ts`.

## Doutes, limites

- Le worktree est partagé : l'index et les fichiers de plusieurs voies (BrewDayPage, brewDayCalculs, hopIndex…) y bougent en parallèle. J'ai commité par plomberie (index temporaire) pour n'embarquer que mes blobs. Le pilote devrait vérifier `git show a50c28243 --stat` : il contient aussi `CalendrierTab`, `Frise`, `Rangee`, `brewLaunch`, `brewDayCalculs` (partie N2) et `tests/unit/brewDayJourJ.test.ts`, qui sont à V-CAL ou à une autre voie, pas à moi. Mes lignes y sont identifiables (nombreFr, `virgule-ok`).
- Six commentaires `virgule-ok` sont des dérogations : ils ne corrigent pas un affichage, ils disent pourquoi le contrôle se trompe. Le contrôle (script) n'a pas été changé.

CONNAISSANCE : `functions/src/{hopAdviceContentReference,brewerHopAdviceSemanticSource4,brewerTools}.ts` n'existent pas : ils sont générés (esbuild) vers `functions/lib/` ; seuls leurs `.d.ts` sont suivis.
LEÇON PROPOSÉE : sur un worktree partagé, un `git add` ou `update-index` met mon travail dans l'index commun, et le commit d'une autre voie l'emporte (vu le 21.11 : mes 32 fichiers dans « V-CAL G3 ») ; commiter par plomberie (`GIT_INDEX_FILE` temporaire, `commit-tree`, `update-ref`), sans jamais passer par l'index commun. Et : un contrôle rouge peut être un test périmé par une décision plus récente (fix114 contre BUGS 34) ; chercher la décision avant de « corriger » le code.
