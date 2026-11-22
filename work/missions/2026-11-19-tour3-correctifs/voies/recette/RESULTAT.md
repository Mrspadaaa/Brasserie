OK — T2-8 et T2B-1 corrigés, tests rouge puis vert ; vision du banc à rejouer (DEMANDE EXECUTANT)

Arbre `port-carnet`, branche claude/port-carnet-1711. Rien commité, poussé ni déployé.

## n° → fait → preuve

### T2-8 — l'eau ajoutée dans les lectures
- Les trois fichiers cités : seul `brewerTools.ts` appelle `BrewingMath.waterVolumes` (outil `calculate_recipe`, champ `recommendedWater`). Il ignorait `installation.kettleTopUp` : corrigé, l'option `topUpToKettle` est passée quand la recette a le choix.
- `brewerRecipeRefresh.ts` n'appelle pas `waterVolumes` : il lit le `waterPlan` enregistré (déjà réduit de l'eau ajoutée par le plan). Aucun changement ; test de garde ajouté (moût avant ébullition ≤ 35 L, à 0,1 L d'arrondi du plan).
- `brewSystemInsights.ts` n'appelle pas `waterVolumes` (la variable du même nom est une liste de volumes mesurés). Aucun changement.
- Rouge avant (sortie citée) : `calculate_recipe : recommendedWater donne le même plan d'eau que BrewWizard` → `AssertionError: expected undefined to be 3.7` (topUpL absent, empâtage + rinçage trop hauts de 3,7 L). Vert après.
- Test : `tests/unit/recetteTour3.test.ts` (5 tests : référence BrewingMath 29 L / 130 min / cuve 35 L / 3,7 L, outil avec et sans le choix, autre volume, refresh).
- Autres appelants de `waterVolumes` sans l'option, hors de ma voie, à voir par le pilote : `src/domain/materielActuel.ts` (alerte AM-47, sur la recette non figée : sans conséquence tant que le choix n'existe pas), `fermentationPlanning.ts`, `noloRecipeSolver.ts`, `ui/NoloRecipeSimulator.tsx`, `design/BrewPreview.tsx`.

### T2B-1 — « Planifier » depuis une recette non figée
- Cause : `handleLaunchBrew` (`src/components/QuickActionModal.tsx`) sort tôt sur `recipeInstallationAdoptionIssue` en posant `brewError`. Le bouton restait actif, le message n'apparaît qu'après le clic (sous la grille, dans la zone qui défile, hors de vue à 390), et un deuxième clic ne change rien. Aucun planning, aucun retour visible.
- Choix : la plus sûre pour les données = l'option 2 de la voie. On ne planifie PAS « quand même » avec un matériel que la recette n'a jamais figé (règle écrite dans `recipeInstallation.ts` : jamais d'installation du jour attribuée en silence à une ancienne recette). Donc :
  - « Planifier » est désactivé tant que la recette n'a pas le matériel actuel (prop `planifierBloque` de `FeuilleBrasser`) ;
  - un bouton direct « Adapter à mon matériel actuel · <brasserie> » (même libellé que l'assistant) adapte avec `adaptRecipeEquipment` (le calcul de l'assistant), pour CE brassin, en mémoire : la recette enregistrée ne change pas, le lot garde le matériel adopté dans son instantané ;
  - la feuille ne se ferme pas ; une ligne dit « Matériel de X pris pour ce brassin · la recette enregistrée ne change pas » ;
  - si le volume ne tient pas : le message du moteur s'affiche (rouge) et rien n'est adapté ; si le matériel actuel n'est pas renseigné : « Planifier » reste désactivé, pas de bouton d'adaptation, la phrase existante renvoie vers Réglages.
- Rouge avant (sortie citée) : `tests/unit/recetteTour3.test.tsx` 4 tests rouges : `Received element is not disabled: <button class="d1b-btn d1b-primaire">`, `Unable to fire a "click" event - please provide a DOM element` (pas de bouton Adapter). Vert après (4/4).
- Fichiers hors « Possède » touchés, car la cause y est : `src/components/QuickActionModal.tsx` (handler, état `adoptee`, bouton, `planifierBloque`). Tests existants qui encodaient l'ancien comportement (message rouge au clic) mis à jour : `tests/integration/brewLegacyInstallationLaunch.test.tsx`, `tests/integration/batchScheduling.test.tsx`, `tests/integration/brewLegacyInstallationApp.test.tsx` (ce dernier échoue déjà sur HEAD pour une autre cause : la feuille ne s'ouvre pas, « Unable to find /^Planifier/ » ; vérifié en remettant HEAD sur les deux fichiers source, puis restaurés).

## Fichiers écrits (port-carnet)
- `src/domain/brewerTools.ts`
- `src/ui/production/brasser/FeuilleBrasser.tsx`
- `src/components/QuickActionModal.tsx` (hors Possède, voir plus haut)
- `src/ui/production/brasser/banc/banc.html` et `banc.tsx` : harnais de banc, fixture « ZZ TEST — … » en mémoire, jamais lié à l'app (`/src/ui/production/brasser/banc/banc.html`, `?figee=1`, `?sans-materiel=1`)
- Tests : `tests/unit/recetteTour3.test.ts`, `tests/unit/recetteTour3.test.tsx` ; mis à jour : les trois tests d'intégration ci-dessus.
- Dans la voie : `banc.mjs`, `tests.txt`, `captures/`.

## Critères
- G1 : `npx vitest run tests/unit/recetteTour3.test.ts*` → 2 fichiers, 9 tests verts. Voisins (`tests.txt`, 14 fichiers, 110/111 verts avant mise à jour de batchScheduling ; batchScheduling rejoué : 10/10).
- G2 : `npx tsc --noEmit -p .` → aucune erreur (rejoué après toutes les modifications des sources ; le harnais de banc a été ajouté ensuite, à rejouer par le pilote).
- G3 : cette section cite la sortie rouge d'avant.
- Essais : 1 par critère.

## Vision : 390 clair faite, le reste en DEMANDE EXECUTANT
Le banc a d'abord échoué (aucun bouton en 90 s) : vite lancé depuis le dossier de la voie ne trouvait pas la config Tailwind. Corrigé par `process.chdir(RACINE)` dans `banc.mjs`. Rejoué sur 390×660 clair : captures `captures/p390-clair-avant-geste.png`, `-clic-desactive.png`, `-adapte.png` ouvertes.
- Avant le geste : « Planifier jeu. 19.11 » grisé, « Recette à adapter… » avec « Modifier la recette › », et le bouton « Adapter à mon matériel actuel · ZZ TEST — Royal Catering » dessous. Aucun rouge (`alerte: null`). Après le clic réel sur le bouton grisé : rien ne change, aucun lot.
- Défaut vu à la capture et corrigé : le bouton « Adapter » ne faisait que 28 px (classe `min-h-touch` sans effet) ; passé à `min-h-[44px]`, plein large, remesuré : 44 px.
- Après le geste : la feuille reste ouverte, ligne « Matériel de ZZ TEST — Royal Catering pris pour ce brassin · la recette enregistrée ne change pas. », « Planifier jeu. 19.11 » noir actif ; clic : `titre: planifie`, un lot `LOT-001`, 24 L, matériel adopté dans l'instantané (`mat: true`).
- Pas rejoué après le correctif des 44 px : les captures `-adapte` et `apres-planifier` datent de la première passe (même rendu hormis ce bouton).
Reste à jouer (DEMANDE EXECUTANT), depuis `Brasserie/work/missions/2026-11-19-tour3-correctifs/voies/recette` :
1. `node banc.mjs ./captures` (sans filtre ; chaque jeu ≈ 1 min, lancer en arrière-plan) : attendu : 6 jeux (390×660 et 1280×800 ; 844×340 en plus, clair et cave), chacun `avant-geste`, `clic-desactive`, `adapte` ; `mesures.jsonl` avec `planifier.desactive: true` avant, `adapter` non nul avant et nul après, `alerte: null` partout, `debordeX: false`, `apres-planifier` : un lot, `mat: true`, titre « ferme ».
2. Ouvrir en image : `p390-clair-avant-geste.png`, `p390-cave-adapte.png`, `l844-clair-avant-geste.png`, `d1280-cave-avant-geste.png`.
À regarder (pilote) : bouton « Adapter à mon matériel actuel » joignable au pouce à 390 et à 844×340 (hauteur ≥ 44 px, barre du pied sans recouvrement), « Planifier » grisé lisible dans les deux thèmes, ligne « pris pour ce brassin » après le geste, aucun rouge.

## Doutes et limites
- « Planifier quand même » (cuve en conflit) et « Planifier <jour> » partagent le même verrou : le bouton est grisé dans les deux cas tant que la recette n'est pas adaptée.
- Le bouton d'adaptation vit dans le bloc d'avertissement de la modale, sous « Recette à adapter… › Modifier la recette » qui reste (la maquette d1b n'a pas été redessinée).
- Adapter ajuste le grain selon le rendement du matériel (même calcul que l'assistant) : le brasseur le voit dans le brassin, pas dans la recette.

DÉCISION À PRENDRE : garder l'adaptation « pour ce brassin » (recette intacte, recommandé), ou enregistrer aussi la recette adaptée (nouvelle version) depuis la feuille ? Recommandation : garder.

CONNAISSANCE : `waterVolumes` est appelé sans l'option d'eau ajoutée dans cinq modules hors voie (materielActuel, fermentationPlanning, noloRecipeSolver, NoloRecipeSimulator, BrewPreview) ; `recipeInstallation`, `adaptRecipeEquipment`, `brewingMath.scaleRecipe`, `brewerTools` la passent.
LEÇON PROPOSÉE : un test d'intégration qui attend un message au clic sur un bouton actif cache un bouton « mort » ; exiger aussi l'état du bouton (désactivé ou effet visible) et rejouer les tests voisins qui encodent l'ancien comportement.
