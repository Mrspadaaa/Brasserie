# Voie p8-portabilite — rendre la maquette facile à intégrer dans l'app

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : opus
- Niveau : conception (architecture : la vraie intégration suivra ce que tu poses)
- Plafond : 150 tours ; 3 essais par critère
- Dépend de : p1-ma-biere, p5-parcours (le moteur et le socle que tu touches servent à leurs constructions)
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente et réversible, écrite dans
  RESULTAT.md

## Objectif
Le brasseur, le 23.10 : « Vérifie que pour la mise en place, ce soit aussi facile », puis « La vraie intégration ».
La relecture p7 a prouvé, fichier et ligne à l'appui, ce qui empêche aujourd'hui de déplacer la maquette dans l'app
(`voies/p7-implementation/RESULTAT.md`, « ## Bloquants »).

Ta voie lève ces bloquants dans la maquette, **sans toucher à un fichier de l'app** (porte B fermée). Ainsi la
vraie intégration devient un déplacement plus quelques branchements, pas une réécriture. Rien de ce que le brasseur
voit ne change : ses choix sont vérifiés par `controle-choix.mjs` (règle n° 1).

## Entrées
- `work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md` : les bloquants B1 à B11, les
  types, l'ordre conseillé.
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (sa section « ## Vérifié contre l'app » et ses erreurs).
- Le moteur : `prototypes/houblons-v4/src/engine/` (dont `data.ts`, `recipe.ts`, `hops.ts`, `voies.ts`,
  `substitution.ts`, `tolerance.ts`) et `prototypes/houblons-v4/src/style/scale.ts` ; `prototypes/houblons-v4/ENGINE.md`.
- L'app, en lecture seule :
  - pages : `src/types/index.ts` (`Recipe`, `HopIngredient`, `YeastSpec`), `src/pages/useFullScreenRoute.ts`,
    `src/pages/RecipePage.tsx` ;
  - services : `src/services/recipeSave.ts` (`saveRecipeConfirmed`) ;
  - domaine : `src/domain/hopIndex/recipeBindings.ts` (`patchIndexedHop`, un précédent) ;
  - outils houblons : `src/ui/hopIndex/` (dont `hopSolver.worker.ts`, `HopRecipePanel.tsx`) ;
  - `vite.config.ts`, `vitest.config.ts`, `tsconfig.json` de la racine.
- Des recettes réelles de fixture pour les tests : `tests/fixtures/` (chercher une recette avec houblons et levure).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/src/**` : le moteur v4 et l'échelle au style.
- `prototypes/houblons-v4/data/**`
- `prototypes/houblons-v4/tests/**`
- `prototypes/houblons-v4/parcours/src/moteur/**`, `…/parcours/src/etat/**`, `…/parcours/src/coquille/**`,
  `…/parcours/src/commun/**`, `…/parcours/src/integration/**` (nouveau)
- Dans les écrans, seulement les lignes d'import des fichiers de `work/` : `…/ecrans/comparer/valeurs.ts`,
  `…/ecrans/dryhopper/mesures.ts`.
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, `prototypes/houblons-v4/ENGINE.md`
- `work/missions/2026-10-23-maquette-parcours/voies/p8-portabilite/RESULTAT.md`
- Rien dans `src/`, `functions/` ni dans les configurations de la racine (`app-intacte.mjs`).

## Consignes
1. **Moteur portable** :
   - B3 : retirer `process.env.V4_TEMOIN_NEGATIF` des fichiers du moteur ; le témoin négatif devient un paramètre
     (option, ou variable de module posée par `scripts/check-engine.mjs`). `npm run check:engine` garde son témoin.
   - B4 : remplacer les imports `@app/…` et `@functions/…` du moteur par des chemins relatifs, le style de l'app,
     sans toucher aux configurations de la racine.
2. **Données injectables** (B2, au moins à l'entrée de l'adaptateur) :
   - l'adaptateur de la maquette reçoit un objet de données : catalogue, stock, dégustation, α du lot par ajout ;
   - les valeurs par défaut restent les fixtures actuelles ;
   - dans l'app, on lui passera le stock réel, le catalogue de production (#120) et la dégustation du brasseur ;
   - écrire dans ARCHITECTURE.md ce qui reste en singleton dans le moteur, et le chemin pour l'enlever.
3. **Conversion de recette** (B5), dans `parcours/src/integration/` :
   - `toHopRecipe(recette de l'app)` vers la recette du moteur ;
   - son inverse, un **patch** sur `hops` et `yeast` seulement, jamais l'écriture du `Recipe` du moteur. Champs :
     `timeMin`, `stage`, `aromaTiming`, `aromaContactHours`, `dayOffset`, `weightG`, `alpha` du lot ;
   - un `id` stable par ajout ;
   - écrits contre le vrai type `Recipe` de `src/types/index.ts` (import de type seulement) ;
   - tests Vitest dans `prototypes/houblons-v4/tests/conversion-recette.test.ts`, sur une recette réelle de fixture :
     aller-retour sans perte, l'IBU du moteur proche de celui de l'app pour la même recette (écart et raison écrits),
     α inconnu → inconnu, jamais 0.
4. **Navigation** (B1) : réécrire la pile de routes de la maquette comme une extension de `useFullScreenRoute` (même
   API, une pile au lieu de `tabs`). Ainsi le portage remplace ce crochet, sans réécrire les écrans. Le hash de la
   maquette reste, à part, pour les pages construites.
5. **Hors de `work/`** (B8) : les imports de `jetons-familles.json`, de `planche.html?raw` et de
   `comparatifs-dryhop.json` deviennent des données versionnées du prototype (`prototypes/houblons-v4/data/`), copiées
   avec leur source, sans les retaper à la main. Les pictos deviennent un fichier de symboles SVG, et non un
   découpage de chaîne.
6. **Crochet de test** : `window.__parcours` passe dans un seul module (`parcours/src/integration/crochetTest.ts`) :
   - même forme qu'aujourd'hui, documentée ;
   - dans l'app, il sera derrière `import.meta.env.DEV` ;
   - les marqueurs `data-*` des écrans restent : les contrôles du brasseur (`controle-choix`, `controle-rail`,
     `controle-usage-intensite`, les `jeu.mjs`) devront pouvoir vérifier ses choix dans l'app aussi (règle n° 1) ;
   - écrire la forme du crochet dans ARCHITECTURE.md (« ## Crochet de test »). La supervision en fera un mode `--url`
     des contrôles.
7. **ARCHITECTURE.md corrigé** :
   - les vrais dossiers cibles de l'app (`src/ui/hopIndex/`, `src/domain/hopIndex/`, ou un dossier neuf justifié) ;
   - la vraie navigation ;
   - les sections `## Conversion de recette` et `## Crochet de test` ;
   - l'ordre d'intégration, chantier par chantier, avec ce qui reste au brasseur : le thème (B7) ; l'atelier V5.5
     remplacé ou gardé (B6) ; Dryhopper, Substituer et Levure, encore ouverts.
8. **Rien ne bouge à l'écran** : les mêmes pages, les mêmes nombres. Rejouer `controle-choix`, le parcours et
   `check:engine`.

9. **Performance** (mesurée par la supervision, t2) : à ×4, le toucher froid Ma bière → Suggérer prend 782 ms, dont
   490 ms de moteur ; vers Substituer, 743 ms. Le glisser de Dryhopper : p95 121 ms. Le script : 1 518 Ko brut, 339 Ko
   gzip. Prendre les optimisations classées dans `work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md`
   (§ Optimisations) qui relèvent de ta voie : JSON en paresseux, calcul de Suggérer hors du fil principal ou précalculé
   au repos. Écrire dans ARCHITECTURE.md ce qui part en worker dans l'app.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : ses choix. Aucun écran ne change de forme ; `controle-choix.mjs` (CHOIX OK) le prouve.
- Inconnu ≠ 0 ; simulé marqué « ~ » ; aucun fichier de l'app modifié ; Gemini jamais appelé.
- L26 : aucun `String.replace` avec une chaîne qui contient `$`. L17 : fichiers de travail dans ton OWNS ou
  `os.tmpdir()`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` :
- ce qui est fait, bloquant par bloquant (B1 à B8), avec ce qui reste et pourquoi ;
- les sorties des critères ;
- l'écart d'IBU entre la conversion et l'app ;
- `LEÇON PROPOSÉE : …` ou `CONNAISSANCE : …` s'il y a lieu.

Réponse finale au pilote : une ligne.
