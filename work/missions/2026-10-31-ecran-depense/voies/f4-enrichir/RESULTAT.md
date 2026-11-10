OK — f4 corrigée (M1 à D5, D-a, D-b) ; copie branchée : 382 verts, App +18 kB

## Détails de REVUE-code-2 (01.11, après REVUE OK) — test rouge d'abord, puis vert
| détail | correction | test (`learn.test.ts`) | rouge avant |
|---|---|---|---|
| D-a `relancerFiche('RECETTE-…')` | refusé (`ref.startsWith('RECETTE-')` → `false`), le travail reste `aControler` | M3 : `relancerFiche(t.ref)` → `false`, état inchangé | `expected true to be false` |
| D-b faits de levure bruts | `faitsEcrivables` passe `yeastTechnicalFacts` par `mergeYeastTechnicalFacts` et `yeastFermentationFacts` par `readIngredientFermentationFacts` (forme invalide non écrite), comme le chemin d'origine | « D-b : levure f4, faits normalisés » : doublon fusionné (1 fait), fermentation invalide absente, trace `remplis` | `expected [ {…}, …(1) ] to deeply equal [ {…} ]` |

Rejeu (essai 1 chacun) : worktree `Tests 5 failed | 103 passed (108)` (les 5 témoins) ; copie isolée non branchée, même compte ; copie isolée
BRANCHÉE : `Test Files 28 passed (28)`, `Tests 382 passed (382)`, puis `tsc` exit 0 (`sondes/copie-tests-branche-2.log`). Build non rejoué pour
ces deux détails (aucun import neuf au démarrage hors `enrichissementRecette` : `ingredientFacts` et `ingredientFermentationFacts` sont déjà
importés par `storage.ts`). Plus rien n'est écrit dans `src/` par la voie.

TEMOIN AVANT : sur l'arbre d'avant la voie, `temoin.test.ts` (aucun module neuf importé) : P1 (a) `neuf « Münchner Malz bis »` au lieu d'`incertain` ;
(b) `seul ['ebc']` au lieu de `[]` ; (c2) `ambigu « Windsor bis 2 »` au lieu de `meme` ; (d) `meme S-4` au lieu d'`incertain « Target bis 2 »` ;
`temoin-e4.test.ts` : un `FICHE-…` écrit à côté de l'article f4. Gardes vertes : (b0), (c), E1 à E3 (constats).

## Correction d'après REVUE-code.md (01.11) — chaque défaut : test rouge d'abord, puis vert
| défaut | correction | test | rouge avant |
|---|---|---|---|
| M1 travail qui lève | `runOnce` : try/catch par travail (sauf `ExecutantInterdit`), `essaiQuiALeve` (jour d'échec, écart 30 min, 3 jours → `echec troisJours`), puis le suivant ; réponse payante gardée (`reponses.put`) AVANT son adaptation | `file.test` « ne bloque pas le suivant, et la recherche payante n'est pas refaite » (2 appels, puis 2 encore après 2 jours) | `expected { ref: 'MP-…-1' … } to match object { etat: 'introuvable' }` |
| M2 retenue d'un houblon | `FAMILLE_DE_CATEGORIE` : Malt et Levure seulement ; le chemin passe dans `enrichissementRecette.ts` (`apprendreSurFicheRetenue`) : liste blanche (jamais `alphaPct`), chaque champ avec `remplis` (`par: 'retenue'`, `repris`) | `learn.test` (à travers `learnIngredient`) : houblon + α → aucun `put` sur l'article ; malt à EBC vide → `colorEbc` 20 tracé, `alphaPct` absent ; `cle.test` houblon → `undefined` | houblon `expected [['stockItems','MP-h-0',…]] to deeply equal []` ; malt `expected 3 to be undefined` |
| M3 `proche` silencieux | travail f4 `RECETTE-<clé>` « à contrôler » (raison `proche`, `faits` gardés) + ligne de journal « Faits acceptés gardés à contrôler » | `learn.test` M3 (montage simulé, journal, travail, `resume.aControler` 1) | `expected false to be true` |
| D1 hors ligne confirmé | `traiterTravail` : `navigator.onLine === false` → attend, AVANT `portes` | `file.test` D1 : attend, 0 `put`, 0 recherche | `expected 'fait' to be 'attend'` |
| D2 catalogue des levures | `enrichissementLevures.ts` (neuf) porte `yeastReferences` et `localIngredientFacts` ; `enrichissementCatalogues` les charge par `import()`, pour une levure seulement (`chargerPour`) | `file.test` D2 : espion jamais appelé (malt + houblon) ; source sans import statique | `not to match /^import …yeastReferences…/` |
| D3 émulateur hors DEV | `etatDe(valeur, emulateurs, dev)` ; `emulateur` exige `import.meta.env.DEV === true` | `interrupteur.test` `etatDe('emulateur','true',false)` → `eteinte` | `expected 'emulateur' to be 'eteinte'` |
| D4 catalogue `aControler` | `origineDesValeurs` : une valeur de catalogue non vue sur une fiche `aControler` → `ai` | `faits.test` D4 | `expected 'manufacturer' to be 'ai'` |
| D5 vacuité | `compteur.size === 0` vérifié | `interrupteur.test` | vert avant et après (le test était vrai par vacuité ; renforcé) |
| trouvé au rejeu branché | un journal (`logAction`) qui lève APRÈS l'écriture faisait rendre `false` → l'ancien chemin écrivait un `FICHE-…` en double. `noter` gardé ; une écriture faite rend toujours `true` | `learn.test` « un journal qui lève … pas de FICHE-… en double » | `expected ['MP-m-0', …(1)] to deeply equal ['MP-m-0']` |

Essais : M1 1, M2 1, M3 1, D1 à D5 1 chacun, journal qui lève 1 (trouvé seulement par E4 resté rouge dans la copie branchée : `localStorage is not defined`).

## Sorties décisives (rejouées le 01.11)
- Worktree, `vitest run tests/unit/depense/enrichir` : `Test Files 2 failed | 8 passed (10)`, `Tests 5 failed | 102 passed (107)` ; les 5 rouges sont
  les témoins (a), (b), (c2), (d), E4, attendus rouges tant que les fichiers du pilote ne sont pas branchés.
- Worktree, `tsc --noEmit` : seules les erreurs connues de `qrLecture.ts` (`zxing-wasm`, `pdfjs-dist` absents ici).
- Copie isolée (`p3c-port/copie.mjs`), NON branchée : vitest même compte (5 témoins, 102 verts) ; `npx tsc --noEmit -p tsconfig.json` exit 0 ;
  `npx vite build` exit 0, `App-*.js` 3 139,42 kB (gzip 801,18). f4 n'y est pas dans le paquet (aucun importeur).
- Copie isolée BRANCHÉE (`sondes/brancher-copie.mjs` pose les branchements 1 à 5 ci-dessous, par split/join, et refuse tout dossier autre que
  `%TEMP%/qr-app-copie`) : `vitest run tests/unit/depense/enrichir tests/unit/depense/fiche tests/unit/purchaseEntry.test.ts tests/unit/depense/ecran`
  → `Test Files 28 passed (28)`, `Tests 381 passed (381)` : les 5 témoins passent au vert ; `tsc` exit 0 ; build exit 0.

## Poids du paquet (build réel, copie branchée contre non branchée, même arbre)
- `App-*.js` : 3 157,70 kB contre 3 139,42 kB → **+18,28 kB minifiés, +7,25 kB gzip**, au démarrage.
- Par `import()` seulement : `enrichissementTravail` 10,52 kB, `enrichissementCatalogues` 2,54 kB, `enrichissementLevures` 0,72 kB (le catalogue
  des levures est déjà dans App : `yeastReferences` est importé par `brewerTools`, `fermentationPlanning`… ; f4 n'ajoute pas ses 1,4 Mo).
- Seuil du plan (+10 Ko) dépassé : voir DÉCISION 2.

## Ce qui est fait, et son test
| quoi | fichier | test |
|---|---|---|
| Clé de fiche, comparaison des produits, `ficheRetenueDe` (P3 ; Malt et Levure) | `src/domain/stock/ficheCle.ts` | `cle.test.ts` |
| Levure → catalogue, table des 11 cas (E2) | `src/domain/stock/ficheLevure.ts` | `levure.test.ts` |
| Valeur remplie ≠ valeur lue, patch des trous, niveaux D277, origine (P1, P2, D4) | `src/domain/stock/ficheValeurs.ts` | `valeurs.test.ts`, `faits.test.ts` |
| `factsFromStock` : `origin` ai / manufacturer / personal (P2) | `src/domain/ingredientFacts.ts` (`factsFromStock` et un import) | `faits.test.ts` |
| `nomDeFiche` connaît `levure:<id>`, `cle:` sans nom | `src/domain/stock/fiche.ts` | via `procedure.test.ts` |
| Magasin local `laffinee-fiches` (Dexie, mémoire ; `faits` gardés) | `src/services/enrichissementStore.ts` | via `file.test.ts` |
| Interrupteur (DEV exigé pour `emulateur`), plafonds, classes d'échec (P4) | `src/services/enrichissementReglages.ts` | `interrupteur.test.ts` |
| Adaptation des réponses ; catalogues par `import()` | `src/services/enrichissementCatalogues.ts` | `levure.test.ts`, `procedure.test.ts` |
| Catalogue des levures (NEUF, `import()` seul) | `src/services/enrichissementLevures.ts` | `levure.test.ts`, `file.test` D2 |
| Façade : planifier, tenir, file (un travail qui lève ne bloque plus), réveils, résumé, relancer, « Vu », `garderFaitsProches` | `src/services/enrichissement.ts` | `file.test.ts`, `procedure.test.ts`, `learn.test.ts` |
| Le travail : hors ligne, portes, rapprochement, recherche (réponse gardée avant adaptation), écriture (`import()` seul) | `src/services/enrichissementTravail.ts` | idem |
| Branchement 2 côté f4 (NEUF) : `apprendreSurFicheRetenue`, `faitsEcrivables` | `src/services/enrichissementRecette.ts` | `learn.test.ts`, `temoin-e4.test.ts` (branché) |
| Cas émulateurs `enrichir` (P6, ajouts seulement) | `scripts/check-invoice-journey-emulator.mjs` | `node --check` : SYNTAXE OK ; non lancé (consigne) ; serveur Vite de dev → `DEV` vrai, D3 ne le gêne pas |

Banc : `tests/unit/depense/enrichir/{aide.ts, montage.ts}` (stock et Firestore simulés, la vraie `savePurchase`, Gemini jamais appelé : recherche
rejouée et `AiClient.run` espionné « jamais appelé »). `learn.test.ts` écrit une copie de `storage.ts` branchée dans `sondes/genere/` (ignoré par
Git, un fichier par processus : ils s'accumulent, à vider sans risque).

## Rien ne se perd
- Un article existant n'est jamais touché ; un champ plein n'est jamais réécrit (« Écart non écrit : colorEbc lu 20, trouvé 22 » au journal) ;
  jamais `currentStock`, `name`, `unit`, `category`, `alphaPct`, `yeastLot`, `yeastNotes`, `supplier`, `origin`.
- Toute valeur écrite porte sa trace (`fiche.remplis[champ]`), chemin de la recette compris (M2) ; retouchée par lui, elle est la sienne.
- Les faits d'une recette sur un produit `proche` sont gardés « à contrôler », jamais jetés (M3).
- Une réponse payante est stockée avant son adaptation : un travail qui lève ensuite ne la redemande pas (M1).
- Hors ligne, même dépense confirmée : rien n'est écrit ni cherché (D1). `planifierEnrichissement` ne lève jamais ; sans IndexedDB, sans effet.

## Branchements du pilote (P5) — ancrés par leur texte, à relire au moment de brancher
1. `src/services/stockLineMatching.ts` — AVANT toute clé `remplis` écrite sur ses données (sinon P1 ne tient pas). Ajouter l'import
   `import { porteDonneeLue, valeurLueDe } from '../domain/stock/ficheValeurs';` puis remplacer
   `const porteDonneeS6 = (item: StockItem) => item.alphaPct !== undefined || item.origin !== undefined || item.colorEbc !== undefined || item.fiche !== undefined;`
   par `const porteDonneeS6 = porteDonneeLue;` et, dans `donneesDArticle`,
   `{ alpha: positif(item.alphaPct), origine: item.origin, ebc: positif(item.colorEbc) }`
   par `{ alpha: positif(valeurLueDe(item, 'alphaPct')), origine: item.origin, ebc: positif(valeurLueDe(item, 'colorEbc')) }`.
2. `src/services/storage.ts`, `learnIngredient` (RÉÉCRIT, M2 et M3) : import `import { apprendreSurFicheRetenue } from './enrichissementRecette';`
   puis, juste avant `    const item = matches[0];`, insérer la ligne
   `    if (!matches.length && !facts.ref && apprendreSurFicheRetenue(name, facts, stock, (resume, details) => this.logAction('Modification', 'Stocks', name.trim(), resume, details))) return;`
   Effet : aucun article de ce nom exact, un article f4 porte la fiche de ce produit (Malt ou Levure ; jamais un houblon) :
   `meme` → ses champs vides reçoivent les faits de la liste blanche, chacun avec `remplis` (`par: 'retenue'`, `repris`), jamais `alphaPct` ni
   `yeastNotes`, une ligne de journal ; `proche` → rien sur un article, une ligne « Faits acceptés gardés à contrôler », les faits dans un travail
   f4 « à contrôler » ; sinon (ou une erreur avant toute écriture) → `false`, le comportement d'avant (un `FICHE-…`). Texte testé mot pour mot
   (`learn.test.ts`, constante `BRANCHE`).
3. `src/services/purchaseEntry.ts` : import `import { planifierEnrichissement } from './enrichissement';` ; après
   `void runProofQueue('save');` (dans le `try`) ajouter `planifierEnrichissement(draft);` ; et remplacer
   `return {transactionId:savePurchase(draft,{catalogues}),proof:proofReceipts.get(draft.submissionId)};` par
   `const transactionId=savePurchase(draft,{catalogues}); planifierEnrichissement(draft); return {transactionId,proof:proofReceipts.get(draft.submissionId)};`
4. `src/ui/finance/ExpenseSheet.tsx` : import `import { tenirEnrichissement } from '../../services/enrichissement';` ; après
   `useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);` ajouter `useEffect(()=>tenirEnrichissement(),[]);`
5. `src/App.tsx` : import `import { startEnrichissement } from './services/enrichissement';` ; après `const stopProofQueue = startProofQueue();`
   ajouter `const stopFiches = startEnrichissement();` ; à côté de `stopProofQueue();` ajouter `stopFiches();`
6. `src/types/index.ts`, l'élargissement de `fiche` (accord de schéma), en remplaçant `fiche?: { id: string; approchee: boolean };` par :
   ```ts
   fiche?: {
     id: string; approchee: boolean;          // s6 ; jamais réécrits par f4
     cle?: string;                            // famille|fabricant|mots
     par?: 'catalogue' | 'retenue' | 'en-ligne'; // provenance du lien posé par f4 ; absent = lien de s6
     aControler?: boolean; propose?: string | null;
     remplis?: Partial<Record<'colorEbc' | 'potentialPpg' | 'yeastLab' | 'yeastStrain' | 'yeastForm' | 'yeastAttenuationPct' | 'yeastTempMinC'
       | 'yeastTempMaxC' | 'yeastFlocculation' | 'yeastAlcoholTolerancePct' | 'yeastTechnicalFacts' | 'yeastFermentationFacts' | 'technicalSource',
       { par: 'catalogue' | 'retenue' | 'en-ligne'; source: string; url?: string; le: string; niveau: 'sur' | 'repris'; valeur: unknown; deduit?: string }>>;
     vu?: string;
   };
   ```
   Mes fichiers n'en ont pas besoin (type local `FicheEnrichie`) ; après la pose, `ficheDe` peut perdre son `as`.
Les branchements 1 à 5 sont exactement ceux que pose `sondes/brancher-copie.mjs` (381 verts, tsc et build verts sur la copie).

À dire à f3 : l'écran de la Dépense ne lit jamais `item.colorEbc`, `item.potentialPpg` ni `item.alphaPct` en direct ; il passe par
`donneesDArticle` ou `valeurLueDe` (une valeur remplie par f4 n'est pas une valeur lue).

## Hors périmètre, limites
- `feuille.test.tsx` non écrit : la feuille n'est pas branchée ; la tenue est testée (R8).
- Le cas émulateurs pilote la dépense par `savePurchaseWithProofReceipt` de l'App, pas par la feuille ; levure du Banc rejouée `found: false`.
- `failed-precondition` avec un message du serveur se classe `autre` (compté), faute de code d'erreur rendu par `aiClient`.
- Le compteur du plafond vit dans IndexedDB : effacer le site le remet à zéro (le budget mensuel du serveur reste).
- Un travail `RECETTE-…` (M3) n'a ni dépense ni article : il est montré « à contrôler » dans le résumé ; aucun écran ne l'ouvre encore (f3).
- Une réponse de levure refusée par la garde d'`AiClient.run` : classe `inexploitable` → introuvable, comptée au plafond, pas un jour d'échec.

DÉCISION À PRENDRE :
1. Accord de schéma (`StockItem.fiche` élargi, branchement 6) : oui recommandé ; sans lui, rien n'est branché.
2. Poids MESURÉ : +18,28 kB minifiés (+7,25 kB gzip) au démarrage, contre un seuil de +10 Ko. Options : (a) accepter (0,6 % du morceau App) ;
   (b) charger la façade par `import()` depuis `App` et `purchaseEntry` (≈ −11 kB estimés, au prix d'un `planifier` asynchrone, à tester sur
   le rechargement juste après « Confirmer »). Recommandé : (a).
3. Interrupteur : `emulateur` (serveur de dev seulement) pour le parcours ; `production` seulement sur son accord, après la mesure réelle du coût
   (3 appels journalisés, hors voie). Plafond 5 recherches et 10 tentatives par jour : recommandé.
4. Houblon hors catalogue (`lookupHopVariety`), `BrewWizard.tsx:1590`, sels et acides, `derivedFields` côté serveur, collection
   `fichesProduits`, écran des travaux `RECETTE-…` : voies suivantes.

DEMANDE PILOTE : poser les branchements 1 à 6 (1 d'abord), puis rejouer
`./node_modules/.bin/vitest run tests/unit/depense/enrichir tests/unit/depense/fiche tests/unit/purchaseEntry.test.ts --maxWorkers=2`
(attendu : 0 rouge dans `enrichir`, hors chargements `zxing` ; la copie branchée l'a déjà donné : 381/381).

DEMANDE EXECUTANT : après les branchements, sans aucune voie qui écrit dans `src/` (Vite recharge) :
`node scripts/check-invoice-journey-emulator.mjs --replay <manifeste habituel> --out <dossier ignoré> --cases enrichir --widths 390,1280`
Attendu : `ENRICHIR OK 390 · 8/8 · appels 2` et `ENRICHIR OK 1280 · 8/8 · appels 2`, puis `… 0 requêtes bloquées hors localhost`.
Captures à ouvrir : `390-*-enrichir-stock-1.png`, `390-*-enrichir-stock-2.png`, `1280-*-enrichir-stock-1.png`, `1280-*-enrichir-stock-2.png`.
Avant le branchement, le cas doit sortir `ENRICHIR KO` (0 appel) : c'est son témoin rouge. Un arrêt en route ne sort aucune ligne `ENRICHIR` : échec.

Fichiers de sonde (ignorés par Git, `sondes/`) : `brancher-copie.mjs` (neuf), `copie-branchee.mjs`, `sonde-p1-apres.ts`, `scinder.mjs`, `genere/`,
journaux `tests-corr.log`, `copie-tests.log`, `copie-build.log`, `copie-tests-branche.log`, `copie-build-branche.log`, `sonde-e4.log`.
Aucun fichier du pilote touché (`storage.ts`, `stockLineMatching.ts`, `purchaseEntry.ts`, `ExpenseSheet.tsx`, `App.tsx` : aucune ligne f4, grep vide).

CONNAISSANCE : Vite (et Vitest) remplacent `import.meta.env.VITE_…` à la transformation : `vi.stubEnv` ne l'atteint pas ; tester la règle pure.
Le catalogue des levures reconnaît 4 levures sur 4 de 372765 (`ficheLevureDe`), contre 1 par `resolveFermentationYeast`. `StorageService.logAction`
lit `localStorage` : il lève hors navigateur ; un appel de journal ne doit jamais décider d'une écriture.

LEÇON PROPOSÉE : un branchement donné au pilote se rejoue posé, dans une copie isolée (tests, tsc, build), avant de rendre : le test du module
seul (`learn.test`, journal simulé) était vert, le témoin branché a trouvé une double écriture (journal qui lève après le `put`).
