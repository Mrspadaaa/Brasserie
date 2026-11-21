# REPRISE V-RECETTE (21.11, session 3, arrêtée vers 155 k de contexte)

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Possède : `src/pages/BrewWizard.tsx`, `src/domain/recette/`,
`src/ui/production/recettes/CarnetRecettes.tsx`, et par D400 : `src/domain/hopIndex/v4/quickAdd.ts` (classement seul),
`src/ui/etapeLevure/**`, `tests/unit/recettePropositions.test.ts` ; par D402 : `src/domain/hopIndex/v4/cases.ts` (tri de buildFromEmpty).
Les 4 rouges transverses (fix114, designTokens, invoiceScanCache-d273c, virgule-transversale) partent à une autre voie (D402) : ne pas toucher.

## Fait en session 3 (commits, par chemins)
- `938285b2f` CarteDose : `max` borné (dose NaN, infinie ou > 98) — cause des 2 rouges fuzzSaisie (RangeError Invalid array length).
- `d693b6899` tests levure : helper (`ouvrirAtelierLevure` par `act-atelier`, `defaultIgnore` de la conduite masquée, `libelle`, neuf
  `allerEtapeSeule`), recipeEditing, recipeAiWorkflow, YeastRecipeWorkbench, noloWizardApply (touche l'étape sans ouvrir l'atelier : l'atelier
  ouvert montre le simulateur NOLO). Rejeu seuls : fuzz + nolo + yeastCandidate 24/24 et 4/4, recipeAiWorkflow 34/34 (le timeout de wiz7 = charge).
- `f407607c9` G1 + N1 malt : BrewWizard.wip remis + pied d'étapes `<nav>` → `<div role="group" aria-label="Étapes de la recette">` (principes
  exclut `nav` : « Suivant » n'était pas vu). Preuve arbre : `principes.mjs --seul recette,recette-pose` ok ; N1 partie malt ok ; B4, D394 ok.
- `6f013ba00` N1 houblon (cases.ts) : stock libre d'abord, nom devant code sans nom (X06297) ; un α ≥ 10 % du stock amérise aussi et reste
  proposé à l'arôme. Test neuf `tests/unit/hopIndexV4/construireStockDabord.test.ts` (31 styles, vert).
- `edeb5fdaa` **HORS POSSÈDE, à confirmer par le pilote** : `donneesApp.ts` `nomDeVariete` ignore le préfixe « zz test » (sans cela « ZZ TEST
  Citra » n'est relié à aucune variété : stock de test invisible au moteur). Revert simple si refusé.
- `6eaa3258f` chaines.mjs (hors Possède, nécessaire) : N1 attend `^Ajouter (ZZ TEST )?Citra(?![a-z])` ; `recetteNeuve` sans `caramel` tape « 0 »
  (N1 pose la masse ; B4 a besoin d'un malt à 0 kg).
- Piège : `node -e` avec `\\b`, `\\s` sous bash a écrit des retours arrière (0x08) ; passer par Edit pour les regex.

## Reste à faire, dans l'ordre
1. **N1 levure** (dernier rouge de la chaîne N1, build `Temp/vrecette/build-arbre`, captures `Temp/vrecette/cap-n1`) : la chaîne veut le texte
   « ton stock d'abord » et un bouton « Poser ». Aujourd'hui (MaLevure.tsx l. 470-485, ChampLevure l. 255-268) : puces proposées (Pomona, Verdant
   IPA) PUIS stock ; ZZ TEST US-05 passe à la ligne, masqué. À faire : stock d'abord, et un bloc « Ton stock d'abord · <levure> · dose » + « Poser »
   (v05 : levure du style en stock, dose écrite). Vérifier si « ZZ TEST US-05 » se relie à US-05 (même problème de préfixe que le houblon).
   Chercher la maquette v05 choisie (choix-workflows-2.html dans la mission du dépôt Brasserie) avant de dessiner ; règle n° 1.
2. Les 7 points de Ma levure (`work/missions/2026-11-19-ma-levure-maquettes/port/plainte-20-11/RESULTAT.md`, dépôt Brasserie) : faisables
   dans la voie : 1 (« 100 % du be… » → « 100 % » seul quand la puce manque est là), 2 (« sous la plage » à 390 sous 150 px ; ambre en cave),
   3 (rejouer le ↔ à 1280, course courte), 7 (conduite lager : « Caler à 11 °C »). Hors voie : 4 (functions/src/fermentationContext.ts), 5 (D391),
   6 (donnée floculation).
3. N3 (`relierAuStock.ts`, « Tout relier à ton stock »), C1-RECETTE au récap, **« Suivant » à place fixe** : `principes --seul assistant-recette`
   KO (VUE-SAUTE : « Suivant » saute de 490 puis 655 px, CLS session 0,429 ; ajout d'un malt CLS 0,1). Piste : `endActionsCollant` pour toutes les
   étapes hors récap (PageShell l. 585), et zones changeantes à hauteur fixe. WFR-4 : B4 vert sur l'arbre.
4. Preuves finales : étapes `chaines --etape N1,N3,C1-RECETTE,B4` et `principes --seul recette,recette-pose,assistant-recette` rouges sur
   `--ref en-ligne/2026-11-21-tour7`, vertes sur l'arbre ; vision 390 tactile + 1280, deux thèmes ; `controle-choix.mjs` ; vitest assistant +
   levure (`tests/integration/etapeLevure`, les 39 fichiers du helper) ; `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build`.

## À rendre au pilote (DÉCISIONS, hors Possède)
- `donneesApp.ts` préfixe « zz test » (commit edeb5fdaa) : garder ou revert.
- `bornesProcede.ts` l. 183 : après un toucher sur un malt de spécialité seul (Caramünch 0,35 kg, N1), « Une valeur à corriger : Eau d'empâtage
  11,3 L pour 0,4 kg… Erreur de saisie probable » s'affiche en rouge sur toutes les étapes. Le plan d'eau par défaut ne suit pas une facture
  partielle : l'alerte devrait attendre une facture plausible ou un plan d'eau posé par le brasseur. À verser à BUGS.md.
- fix114, designTokens, invoiceScanCache-d273c, virgule-transversale : voie transverse (D402).
