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

# Session 4 (21.11, arrêtée vers 175 k) — fait, commits par chemins (index temporaire)
- `ebbe788f0` revert de edeb5fdaa (D403). `ee51d4717` relierStock lit `StockItem.fiche.id` avant le nom (lien 'fiche') ; fixture ZZ TEST Citra
  porte `fiche: beermaverick-citra` ; test donneesApp (relié par fiche, non relié sans, fiche inconnue → nom). Le moteur voit le stock (N1 houblon ok).
- `376be5c45` tsc propre (cases.ts:85, `!(b.stock.libre > 0)`). `21cc639a9` CarteDose : VIRGULE OK, designTokens vert.
- VR-1 (bornesProcede) : versé à BUGS.md (Brasserie `900cd2072`, BUGS OK) ; `dd1e1e9e8` eauIssues attend `installation.manualWaterSplit !== false`
  pour « trop d'eau » ; étape VR-1 de chaines.mjs : KO sur tour7 (build gardé `%TEMP%/chaines-build-YljAZX`), ok sur l'arbre.
- `9331513c3` N1 levure v05 : `PoserDuStock` (MaLevure.tsx, classes lv-pz-, jetons ml- : `.ml-carte, .lv-pz {`), `doseProposee` (dose.ts),
  `onStock(item, dose)` → `selectYeast(name, item, dose)` ; fixture US-05 `fiche: fermentis-us05`. Chaîne N1 complète : KO tour7, ok arbre
  (captures `%TEMP%/vrecette/cap-n1b`). Capture 390 sombre ouverte : proche de v05 ; nom « SafAle US-05 » + « Fermentis · sèche » corrigé APRÈS
  la capture (à revoir) ; pas d'échelle de besoin quand l'OG manque (honnête).

## Reste, dans l'ordre
1. Revoir N1-3 levure (nom/fabricant), puis « Poser » → carte après le geste (r4 v02) : dose posée ? Vision 390 tactile + 1280, deux thèmes.
2. Ma levure, points de la voie (plainte-20-11/RESULTAT.md) : 1, 2, 3, 7 ; DÉCISIONS au pilote pour 4 (functions/src/fermentationContext.ts),
   5 (D391), 6 (donnée floculation).
3. « Suivant » à place fixe (`principes --seul assistant-recette` KO, VUE-SAUTE) : piste `endActionsCollant` pour toutes les étapes hors récap (PageShell l. 585).
4. N3 (relierAuStock.ts), C1-RECETTE au récap, WFR-4 (B4).
5. Preuves : chaines `--etape N1,N3,C1-RECETTE,B4,VR-1` (rouge `--ref en-ligne/2026-11-21-tour7`, vert arbre) ; principes `--seul recette,recette-pose,assistant-recette` ;
   `controle-choix.mjs` ; vitest assistant + levure (`tests/integration/etapeLevure`) ; tsc ; `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build`.

# Session 5 (21.11, arrêtée vers 165 k) — fait, commits par chemins (index temporaire)
- Accords du pilote : `donneesApp.ts` (fiche d'abord, puis nom) accepté ; Ma levure 5 et 6 dans `src/` permis ; **point 4
  (`functions/src/fermentationContext.ts`, « 14.5 °C » corrigé à l'affichage seulement) REPORTÉ : aucune fonction ne part en ligne avec ce tour.**
- `eb37ba387` N1 levure : la vision (build `%TEMP%/vrecette/build-arbre`, captures `%TEMP%/vrecette/cap-n1c`, 390 tactile + 1280, clair + cave,
  avant/après « Poser » ; script `scratchpad/vision-n1.mjs` de la session) a trouvé : (a) « Poser » posait « ZZ TEST US-05 · Hors catalogue · saisie
  libre » (selectYeast par le nom du stock) → `onStock(item, dose, fiche)` pose la fiche (applyCatalogueYeast + doseApresChoix) liée au lot
  (`stockItemRef`) ; une puce du stock reliée à une fiche fait de même ; (b) regex de PoserDuStock sans barres inverses (piège `node -e`) réparées ;
  (c) carte « US-05 (Fermentis) » → `nomDeCarte` retire la parenthèse d'un fabricant connu : « SafAle US-05 » / « Fermentis » ; (d) à 1280, la
  levure choisie revenait en puce « ZZ TEST US-05 » → exclue (`enStock`). Captures ouvertes après correctif : 390 clair et 1280 cave OK.
- `2db277681` Ma levure 5 (D391) : `ligneFabricant` dit aussi le dessous (« sous le fabricant 15–23 g : l’OG 1,026 en demande moins ») ;
  6 : fait versé US-05 `flocculation` niveau moyen (page Fermentis lue le 21.11 : « Sedimentation time Medium ») ; cellule « floculation moyenne ».
  Tests : `levureN1.test.ts` (nouveau), domaine (47 faits ; London pour l'inconnu), leviers-stock, etapeCoque (London), instantané
  `rechercheAvancee-identite.json` régénéré (clarte : 1 documentée de plus, ordre des ex æquo). vitest `tests/integration/etapeLevure tests/unit/levure` :
  26 fichiers, 224 verts ; tsc 0.
- Non revu en vision : la ligne « sous le fabricant … » à 390 (longueur) sur une recette avec OG ; à faire avec la preuve finale.

## Reste, dans l'ordre (agent neuf)
1. « Suivant » à place fixe (`principes --seul assistant-recette` KO, VUE-SAUTE) : piste `endActionsCollant` pour toutes les étapes hors récap (PageShell l. 585).
2. N3 (relierAuStock.ts), C1-RECETTE au récap (horizons existants), WFR-4 (B4) : chacun rouge sur `--ref en-ligne/2026-11-21-tour7`, vert sur l'arbre.
3. Fin : `controle-choix.mjs` OK ; vitest assistant + levure ; `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` ; vision « sous le fabricant ».

# Session 6 (21.11, arrêtée vers 155 k) — fait, commits par chemins (index temporaire, script `scratchpad/commit.sh` : read-tree HEAD, add, commit-tree, update-ref, puis `git reset -q -- <chemins>` pour que l'index réel suive HEAD)
- Vision « sous le fabricant » à 390, recette avec OG (Pilsen 2,5 kg, PPG 37 posés au doigt → OG 1,024 ; 24 L ; US-05 posée puis 1 sachet) :
  « 11,5 g · couvre le besoin » ; sous la barre « sous le fabricant 12–19 g : l'OG 1,024 en demande moins · taux ale 0,75 M/mL/°P · 24 L » sur 2 lignes,
  lisible, clair et cave (captures `%TEMP%/vrecette/cap-fab/fab-clair.png`, `fab-cave.png`, ouvertes). OK. Note : les malts du stock ZZ TEST
  n'ont pas de potentiel (OG « — ») ; le banc parcours n'a pas de catalogue de malts (un nom tapé reste « ? », potentiel —).
- `b7b9b64e3` « Suivant » à place fixe : `endActionsCollant` à toutes les étapes (le récap n'a pas de rangée) + `setStep` en `startTransition`
  (le Suspense du dessus cachait tout l'assistant ~75 ms au passage Levure → Paliers : la rangée passait à top 0). Mesure principes
  `--controle VUE-SAUTE --seul assistant-recette` : les trois « Suivant » à 0 px (avant : 490, 655 px ; c'est le rouge sur l'état d'avant, même build).
  vitest brewWizard*, bAssistant*, bugs-r3/w1-wizard, assistantPlusActions, companionRecipeWizard : 15 fichiers, 160 verts. tsc 0.
- principes assistant-recette reste ECHEC (3), causes établies (trace layout-shift, `scratchpad/dbg-cls.mjs`) :
  1. « Changer de fermenteur » : tuile Matériel ouverte passe sous Espace libre (`.idn-tuile.idn-ouvert { grid-column: 1 / -1 }`, 640 → 703 px,
     CLS 0,029) = **comportement de SA maquette r4-a** (`work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html`, `ouvrirMat` + `grid-column:1/-1`) ;
     plus le focus de `ouvrirFermenteur` (BrewWizard ~l. 1943) qui fait défiler 102 px. **DÉCISION au pilote** : règle n° 1 contre VUE-SAUTE ;
     piste sans toucher son visuel au repos : la puce « fermenteur 30 L » devient le champ sur place (ChampNombre), sans ouvrir la tuile.
  2. « ZZ TEST Munich » (2e malt) : la ligne ajoutée pousse Ajouter / Repères / Détail de 52 px (CLS 0,076, shifts à +24 ms). Piste : compenser le
     défilement dans Ajout.tsx (useLayoutEffect, scrollBy du delta) ; insuffisant si la page n'a pas 52 px à défiler (cas du banc) → DÉCISION ou
     réserve basse. Hors Possède (`src/ui/fermentescibles/`).
  3. session CLS 0,109 (somme de 1 et 2).
  Piège du banc : `trouver('ZZ TEST Citra', contient)` à l'étape Houblons trouve un élément couvert par le pont « levure ? » et le toucher ouvre
  Levure (l'action « Citra » de principes navigue) ; sans effet sur le verdict.
- WFR-4 : chaines `--etape B4` ok sur l'arbre (« le récap nomme le malt à 0 kg et son bouton ouvre l'étape Malts/sucres »). Rouge sur tour7 à
  rejouer (`--build %TEMP%/chaines-build-YljAZX`, build tour7 gardé).
- N3 : KO sur l'arbre (« ne propose pas Tout relier à ton stock ») ; rien codé. Relevé pour coder :
  - maquette choisie `Brasserie/work/missions/2026-11-20-moins-de-gestes/v07.html` (NOTE en tête) : rangée sombre `.v07-relier` (min-height 52,
    radius 12, titre 16 px gras + sous-texte 14 px, flèche) sous l'état (« Stock à vérifier ») de la fiche recette (CarnetRecettes.tsx `feuille()`,
    l. ~233-246) ; après : chaque ligne reliée dit sa source (`.v07-src` : point, « nom exact » / « nom proche ? » à confirmer, × pour défaire),
    barre noire `.v07-annuler` (« N reliées » + « Annuler »), ligne sans article = reste à lui ; recalcul α → dose montré à part, jamais appliqué.
  - fixture `rebrasser` : « ZZ TEST Pale Ale v1 », lignes sans `stockItemRef`, Citra α 9 % ; stock ZZ-CITRA α 12,5 %. Les noms sont exacts, donc
    `compareRecipeWithStock` (stockLevel.ts l. 181-191) les tient déjà pour « linked » par le nom : la rangée doit s'afficher dès qu'une ligne
    cœur n'a pas de `stockItemRef` (et pas seulement sur « non relié »).
  - module neuf `src/domain/recette/relierAuStock.ts` (Possède) : par ligne sans ref → exact (nom normalisé, unique) / proche (préfixe « zz test »,
    casse, accents, mots inclus) / aucun ; houblon relié : `alphaPct` du lot posé (`StockItem.alphaPct`), ancien α gardé pour le dire ; rend la
    recette neuve + le compte. Test unitaire. Persistance : chercher comment le carnet enregistre une recette (StorageService / onEditRecipe).
  - chaine N3 attend `\d+ reliées?` et « 12,5 » dans la fiche après le toucher.
- C1 au récap : non commencé. Spéc PORT.md l. 54 (Brasserie) : horizons aujourd'hui / 1 mois / 3 / 6 mois / 1 an (« vers févr. »), composant
  existant `src/ui/saisie/Horizons.tsx` + `src/domain/horizons.ts` ; consommateurs BrewWizard l. ~759, 1447, 1753. Pas d'étape `C1-RECETTE` dans
  chaines.mjs : à écrire (rouge tour7, vert arbre).

## Reste, dans l'ordre (agent neuf)
1. N3 (ci-dessus), commit. 2. C1 au récap + étape C1-RECETTE, commit. 3. DÉCISIONS au pilote : VUE-SAUTE « Changer de fermenteur » (r4-a) et
   « Munich » (fermentescibles, hors Possède). 4. Fin : chaines `--etape N1,N3,C1-RECETTE,B4,VR-1` rouge tour7 (`--build %TEMP%/chaines-build-YljAZX`)
   / vert arbre ; `controle-choix.mjs` ; vitest assistant + levure ; `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` ; vision 390 tactile
   + 1280, deux thèmes, assistant entier (rangée fixe à toutes les étapes, `--build %TEMP%/vrecette/build-arbre` à reconstruire après N3/C1).
