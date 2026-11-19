# Diagnostic IA-COMPLETER-ABSENT — compléter une fiche par l'IA (19.11)

Code lu : worktree `port-carnet`, tag `en-ligne/2026-11-19-tour2` (HEAD `be036eb21`). Rien modifié. Gemini jamais appelé.
Chemins relatifs à `port-carnet/`.

## Verdict en trois lignes

1. Le geste « compléter par l'IA » **existe en code pour la levure, le malt (grain) et le houblon (fiche d'index)**. Il n'a jamais été oublié d'un bloc : il manque ou est enfoui à chaque endroit où le brasseur le cherche.
2. **Ma levure** : l'autocomplétion de la fiche entière (« Autocomplétion des ingrédients », `YeastSheetAssistant`) est à **deux plis** : `Plus` puis `Fiche : compléter, corriger, chercher avec l'IA`, depuis `580cffdcd` (19.11, « deux volets au lieu de huit »). Au premier plan il ne reste que « ⌕ non documenté » (une donnée), qui n'existe que tant qu'un axe d'effet est inconnu.
3. **Fiches du stock** (levure, malt, houblon, sel) et **étape Houblons (V4)** : aucun geste. L'IA y travaille seule, après « Confirmer » d'une dépense (`enrichissement.ts`) ; le « Relancer » codé pour ces fiches (`relancerFiche`) n'a **jamais été branché** (`c032e1a2b`, 01.11, « codé sans branchement »).

## 1. Fonctions de complétion par l'IA

Drapeaux : `VITE_ENRICHISSEMENT_IA=production` (`src/services/enrichissementReglages.ts:22`, lu à l'appel) ne commande que la file de fond. `VITE_HOP_V4=on` (`src/ui/hopIndex/flags.ts:12`) est allumé dans `dist/` (D368, `scripts/check-build-flags.mjs:15`). Un seul appel Gemini côté front : `aiTask` (`src/services/aiClient.ts:116`) ; les autres callables sont `hopReclasserIA` et `proposeYeastDbCorrection`.

| Fonction | Fichier | Drapeau | Appel Gemini |
|---|---|---|---|
| `lookupYeastSheet` (levure entière : lab, souche, forme, atténuation, T°, floculation, faits techniques) | `src/ui/RecipeAutoComplete.tsx:324` | aucun | `aiTask` / `lookupIngredient` `kind:'levure'`, ancré Google (`functions/src/prompts.ts:1121`, `geminiBody.ts:46`) |
| `YeastSheetAssistant` (bouton « Rechercher la fiche avec l'IA », revue champ par champ, sources) | `RecipeAutoComplete.tsx:519` | aucun | via `lookupYeastSheet` (+ `verify`) |
| `IngredientCompletion` (« Compléter les données manquantes avec l'IA », recap, houblon, malt) | `RecipeAutoComplete.tsx:640`, bouton `:912` | rend `null` sans trou | `lookupIngredient` par ingrédient |
| `useRechercheDonnee` (« ⌕ non documenté », plafond 20/jour) | `src/ui/etapeLevure/useRechercheDonnee.tsx:52` | `PLAFOND_JOUR` | via `lookupYeastSheet` ; test : prop `recherche` |
| `AiAssist` (« Compléter avec l'IA », malt/houblon/levure) | `src/ui/AiAssist.tsx:80` | rend `null` si `missing=[]` (`:150`) | `lookupIngredient` (`:109`) |
| `lookupHopVariety` (« Rechercher une fiche publiée ») | `src/ui/hopIndex/HopIndexPanel.tsx:118,182` | aucun | `aiTask` / `lookupHopVariety` |
| `readHopCoa` (lecture d'un COA) | `HopIndexPanel.tsx:135` | aucun | `aiTask` / `readHopCoa` |
| Enrichissement de fond des fiches de stock (levure, malt) après dépense | `src/services/enrichissement.ts:125,244,272` (`App.tsx:458`) | `VITE_ENRICHISSEMENT_IA` ; plafonds | `lookupIngredient` (`:67`), catalogue du dépôt d'abord |
| `relancerFiche` (« Relancer ») | `enrichissement.ts:333` | — | **aucun appelant dans `src/`**, seulement `tests/unit/depense/enrichir/*` |
| `hopReclasserIA` (reclasser, suggérer des houblons) | `functions/src/hopReclasserIA.ts:116`, `src/ui/hopIndex/{substituer,suggerer}/ia.ts` | — | `generateContent` ; ce n'est pas une complétion de fiche |
| `proposeYeastDbCorrection` / `applyYeastDbCorrection` (« Corriger la fiche produit ») | `functions/src/yeastDbCorrections.ts`, `src/services/yeastDbCorrections.ts`, `src/ui/YeastPitchingPanel.tsx:217` | — | `generateContent`, ancré ; corrige la base partagée |
| `getFermentationResearch` | `functions/src/researchReport.ts` | — | rapport, pas une fiche |
| Sel, eau, matériel, fût, produit d'entretien | — | — | **rien** : `IngredientKind = 'levure' | 'malt' | 'houblon'` (`src/domain/ingredientFacts.ts:10`), aucun `kind` de sel côté `ingredientLookupDefinition` |

## 2. Tableau : geste IA par fiche montrée au brasseur

« Atteint » = visible au premier plan, un toucher, quand la fiche est incomplète.

| Fiche | Geste présent ? | Atteint au doigt ? | Cause |
|---|---|---|---|
| **Ma levure** (étape Levure 4/7), axes d'effet inconnus | « ⌕ non documentés » (une rangée, une recherche) `MaLevure.tsx:281-291`, « à chercher » floculation `:435` | **Oui, mais par donnée** et seulement tant qu'un axe est « inconnu ». Disparaît dès que la cellule est vue ; « rien de publié · OK » ramène le bouton | présent, limité |
| **Ma levure**, fiche entière (atténuation, T°, floculation, tolérance, lab, forme) | `YeastSheetAssistant` dans `Repli id="fiche"` (`EtapeLevure.tsx:245`) | **Non au premier plan** : Plus → Fiche, deux plis fermés par défaut (`ouverts = {}`, `:126`) | **enfoui** par `580cffdcd` (19.11) : `fiche` rangée dans `DANS_PLUS` ; avant, repli de premier niveau (`be70fa7c3`, 09.11) |
| Ma levure, fiche **sans levure choisie** | aucun (`choisie &&` `EtapeLevure.tsx:245`) | non | par construction |
| Chercher / Comparer / Suggérer (levure) | « ⌕ chercher » par cellule (`Chercher.tsx:113`) | oui, par cellule | présent, limité |
| **Fiche levure du stock** (`StockDetailSheet.tsx`, « Caractéristiques techniques ») | aucun ; seulement le mot « à saisir » (`:60`, `:414`) | **non** | jamais branché : le stock ne monte pas `AiAssist` ni `relancerFiche` ; l'IA ne part qu'après « Confirmer » d'une dépense |
| **Fiche malt du stock** | aucun, idem | non | idem |
| **Fiche houblon du stock** (α, lot) | aucun, idem | non | idem. `HopIndexPanel` (Stocks > Index houblon) offre « Rechercher une fiche publiée », mais c'est une fiche de variété, pas la fiche de stock |
| Malts, étape wizard (`fermentescibles/Fiche.tsx:87`) | `AiAssist` « Compléter avec l'IA » | oui, **seulement si grain ET trou** (`grain &&`, `missing.length`) | sucres, fruits, adjuvants exclus par `grain &&` ; rien « à l'état vide » ⇒ rien quand la fiche est pleine mais fausse |
| Malts, recap (`MaltDetails.tsx:57`) | `AiAssist` | oui, trou seulement | état vide seulement |
| **Houblons, étape wizard (V4, allumé)** | aucun | **non** | jamais porté : `RecipeAutoComplete scope="houblon"` ne reste que dans la branche `!hopV4Actif` (`BrewWizard.tsx:3075`) ; `src/ui/hopIndex/maBiere/` : 0 appel IA ; V4 monté depuis `259cde3d1` (25.10) |
| Recap (`BrewWizard.tsx:2583`) | « Compléter les données manquantes avec l'IA » | oui, **trou seulement** (`RecipeAutoComplete.tsx:889`, rend `null` sans trou) | état vide seulement ; houblons à `stockItemRef` exclus (`:` `searchGaps`) |
| Index houblon (Stocks) | `lookupHopVariety`, `readHopCoa` | oui | présent |
| **Sels / eau** | aucun | non | pas de `kind` sel : jamais conçu |
| **Matériel, fûts, entretien** (`EquipmentSheet`, `KegFiche`, `ui/equipment/*`) | aucun | non | jamais conçu |

Comptage « sans geste atteint » : fiche levure du stock, malt du stock, houblon du stock, étape Houblons V4, Ma levure (fiche entière), sels, matériel et fûts = **8 fiches** ; sucres de l'étape Malts et fiches pleines (recap, malts) = restes « état vide seulement ».

## 3. Ma levure : « (simulé) », LEV-5, fiche incomplète

- **« (simulé) »** : `src/ui/etapeLevure/apercuDev.ts:15-20`. Recherche du **banc local** `?dev-local&etape=levure&recherche=simulee` : répond en 2,5 s « moyenne / négatif / faible (simulé) », source « SIMULÉ · banc local, aucun appel IA ». Accrochée par `App.tsx:631` et lue par `EtapeLevure.tsx:138` **derrière `import.meta.env.DEV`** : jamais dans `dist/`. En ligne, `lookup` retombe sur `lookupYeastSheet` (Gemini réel, plafond 20/jour). Sa capture « négatif (simulé) à confirmer Retenir Écarter » vient donc du banc, pas de la prod. À vérifier : il a pu juger Ma levure depuis une capture du banc.
- **LEV-5 / `580cffdcd` n'a pas retiré le geste d'appel** : il l'a regroupé (cinq « ⌕ non documenté » empilés → une rangée, une recherche : `MaLevure.tsx:281`, `useRechercheDonnee.tsx:49-56`). En revanche, le même commit a **enfoui** l'autre geste : `fiche` entre dans `DANS_PLUS` (`EtapeLevure.tsx:45` du diff, `ouvre`), `Plus` fermé. C'est la cause visible de « pas de possibilité d'appeler l'autocomplete ».
- **Fiche incomplète, ce que l'écran affiche** : jauges des 12 axes quand la fiche du catalogue les donne ; sinon « ⌕ non documentés » (une rangée) et, pour la floculation, « à chercher ». Après une recherche : « recherche… n/20 », puis « valeur · à confirmer · Retenir · Écarter » ou « rien de publié · OK ». La recherche ne lit que les 12 axes d'effet (`CLES`, `useRechercheDonnee.tsx:24-28`) ; **atténuation, plage de T°, tolérance, forme, laboratoire** que Gemini renvoie dans la même réponse sont **jetés** par `chercher` (`faits.find(f => CLES[a].includes(f.key))`). Le trou d'une fiche (hors effets) n'a aucun message ni bouton au premier plan.
- Sans levure du catalogue (stock, saisie libre) : `EFFETS_INCONNUS` (`MaLevure.tsx:31`) ⇒ un seul « non documentés » ; l'axe `clarte` seul porte la floculation.

## 4. Proposition : le plus petit branchement

Principe : **un seul geste, trois installations**, sans nouvelle couche. Aucun nouvel appel Gemini : on monte ce qui existe.

1. **Ma levure.** Un bouton `✦ Compléter la fiche` au premier plan de la carte (près du « non documentés »), qui appelle `onFiche` (déjà passé à `MaLevure`, `EtapeLevure.tsx:218` → `vaAu('fiche')`, qui ouvre `plus` et `fiche`) **et lance** la recherche de `YeastSheetAssistant` (nouvelle prop `autoStart` sur `YeastSheetAssistant`, `RecipeAutoComplete.tsx:519`, ou clé de relance). Visible même quand les 12 axes sont connus mais que lab, forme, atténuation, T° manquent (`ingredientGaps` à l'appui). Si l'espace manque à 390 : seulement dans la rangée « non documentés » élargie à « Compléter ». Rien n'est écrit avant « Retenir » (règle d'`AiAssist`).
2. **Fiches du stock (levure, malt, houblon).** Dans « Caractéristiques techniques » de `StockDetailSheet.tsx:410`, monter `<AiAssist kind={…} name={item.name} missing={…champs vides…} onApply={facts => setDraft({ ...draft, ...factsForStock(kind, facts) })} />` : exactement ce que `fermentescibles/Fiche.tsx:87` fait pour le malt. `missing` vient de `estVide`/`champsASaisir` (déjà là). Brancher aussi « Relancer » sur `relancerFiche(item.ref)` quand `manque` contient « à saisir » (le service existe, testé, jamais appelé). Levure : `AiAssist` gère déjà `kind:'levure'` (`AiAssist.tsx:44`).
3. **Étape Houblons (V4).** Rendre le geste de la branche non V4 : `RecipeAutoComplete scope="houblon"` sous la liste de `EtapeHoublonsV4`, ou le bouton « Rechercher une fiche publiée » de `HopIndexPanel`. **Écran choisi par le brasseur** (registre `ecrans.json`) : sa maquette est la base ; l'ajout est donc un **choix ouvert à lui montrer en mini maquettes** (CLAUDE.md règle n° 1, L24), jamais à greffer seul. Idem pour 1 si la place du bouton touche l'écran choisi l5b.
4. **Sels, eau, matériel.** Hors périmètre : pas de `kind` ni de source publiée fiable. À proposer au brasseur, pas à coder.

Ordre de coût : 2 (réemploi pur) < 1 (une prop) < 3 (décision d'écran).

## Test qui échoue aujourd'hui (Gemini simulé)

Fichier suggéré : `tests/integration/iaFiches.test.tsx`. `vi.mock('../../src/services/aiClient')` : `AiClient.run` renvoie une fiche simulée et compte ses appels ; aucune clé, aucun réseau.

- **T1 (Ma levure)** : rendre `EtapeLevure` (comme `Banc` de `tests/integration/etapeLevure/maLevure1911.test.tsx:30`, mais avec le vrai `RecipeAutoComplete yeastEnrichment` en `aiEditor`) sur la recette Munich Lager Yeast. **Sans toucher `Plus`**, `screen.getByRole('button', { name: /compléter la fiche/i })` doit exister ; un clic appelle `AiClient.run` une fois avec `task:'lookupIngredient'` et `context.kind:'levure'`. Échoue aujourd'hui : le bouton n'existe que dans `Plus > Fiche`.
- **T2 (stock)** : `StockDetailSheet` sur un article Levure aux champs vides (atténuation, T°) : un bouton « Compléter avec l'IA » est présent ; clic ⇒ un appel simulé ; rien écrit avant « Appliquer » ; puis `draft.yeastAttenuationPct` rempli. Idem pour Malt et Houblon (`it.each`). Échoue aujourd'hui : aucun bouton.
- **T3 (contrat)** : `it.each(['Levure','Malt','Houblon'])` : pour chaque fiche d'ingrédient incomplète, un actionneur de nom `/compléter.*IA/i` est dans le DOM sans ouvrir de repli. C'est le contrôle de la ligne IA-COMPLETER-ABSENT (« chaque fiche incomplète a un actionneur atteint au doigt, simulé en test »).
- **T4 (garde-fou)** : `AiClient.run` jamais appelé avant le clic ; compté une seule fois par clic ; plafond `PLAFOND_JOUR` respecté pour la voie « ⌕ ».

## Doutes et limites

- Non vérifié par rendu : la présence réelle de `Plus > Fiche` à 390 en ligne (lu dans le code et le diff de `580cffdcd`). Un `getByRole` du test T1 le fera sur HEAD.
- `dist/` du worktree est l'état du build local, non celui du serveur : `VITE_HOP_V4=on` et `VITE_ENRICHISSEMENT_IA=production` y sont, rien ne prouve ce qui a été déployé le 19.11.
- La capture « (simulé) » du brasseur : origine non établie (banc local presque sûrement, car la chaîne n'existe pas dans le paquet).
- L'IA de fond n'a pas été jouée ; son état en ligne dépend de l'accord `production` et du plafond de 20 recherches/jour.

## Retour au pilote

DÉCISION À PRENDRE : l'étape Houblons V4 et Ma levure sont des écrans choisis. Le bouton « compléter » est-il (a) greffé sur la fiche existante (propre aux fiches du stock, aucun écran choisi touché), ou (b) montré en mini maquettes pour les deux écrans choisis ? Recommandation : (a) tout de suite pour le stock (réemploi pur d'`AiAssist`), (b) pour Ma levure et Houblons, une page de choix : bouton en carte, ou dans le menu, ou en tête de la rangée « non documentés ».

CONNAISSANCE : en 19.11, `580cffdcd` a rangé le repli « Fiche » (autocomplétion complète) dans « Plus » ; `relancerFiche` n'a jamais eu d'appelant UI depuis `c032e1a2b` (01.11).
LEÇON PROPOSÉE : un regroupement de volets (« huit replis → deux ») compte les gestes qu'il enfouit ; chaque geste IA ou de saisie déplacé sous un volet fermé se liste avec son nouveau nombre de touchers avant de livrer.
