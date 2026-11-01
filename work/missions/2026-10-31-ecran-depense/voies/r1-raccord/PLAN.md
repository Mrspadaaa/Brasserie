# Plan : voie r1-raccord (R1 à R7)

Rédigé avant tout code. Base : HEAD `2a9490d4`. Témoin de départ : les 8 fichiers de la commande G5 (+ `tests/unit/depense`) = `Test Files 34 passed (34)`, `Tests 778 passed (778)`
(rejoué avant d'écrire ce plan). Aucun fichier du dépôt n'a été modifié par ce temps du plan.

## 0. Corrections après la revue (REVUE-PLAN.md, 31.10 nuit) : elles PRIMENT sur les §2 à §6 ci-dessous quand elles diffèrent

**Conception**
- **C1 / Prêt 4 (bloquant) — poids du libellé.** `stockQuantityFor` change de signature : `stockQuantityFor(line:{description:string;quantity:number;unit:string}, target:{name:string;unit:string;category?:string})`. Pour la branche `piece` (Stk/pce ↔ sachet, levure) seulement, elle relit le poids du libellé de la ligne et celui de l'article avec `readProductLabel` (mêmes options que l'appariement, `stockLineMatching.ts:193-201`) : poids de la ligne > `SACHET_MAX_G` (50 g, `mg` ramené en g) → `incompatible` ; poids des deux côtés et `weightKey` différents → `incompatible` ; sinon accepté. `SACHET_MAX_G` est **exporté** de `stockLineMatching.ts` (Possède élargi) et jamais recopié. Une ligne sans poids face à un article avec poids : acceptée (la revue ne demande que les deux refus ci-dessus). Tests rouges : « Safale US-05 500 g » 2 Stk refusé ; « 11,5 g » accepté ; poids 11,5 g face à un article « 11 g » refusé ; article sans catégorie : Stk face à sachet refusé (`category?:string`).
- **C2 / Prêt 2 — `onSaved` reçoit le reçu.** `save()` garde une variable locale : `const proof = pendingId ? receipt : (await savePurchaseWithProofReceipt(draft)).proof` ; `onSaved(proof)`. Test : premier clic, et reprise après échec de `confirmPurchase` (même reçu).
- **C3 / Prêt 7 — `drive/in-progress` aussi au rattachement.** Même état `proofSending` dans `save()` et `attachToExisting()`. Texte vrai dans chacun : `confirmProof` reçoit le texte à poser ; `PROOF_IN_PROGRESS` (achat) inchangé ; nouveau `PROOF_IN_PROGRESS_ATTACH` : « Envoi du justificatif en cours sur ton Drive : il peut encore aboutir. Rien n’a encore été rattaché. Touche de nouveau « Rattacher le justificatif » dans un instant : le fichier ne sera pas envoyé deux fois. » `proofSending` est remis à faux au début de chaque clic et dans `attach()` (« Changer »). Le `role="status"` se place juste après `errorBox` (`:214`). Test : rattachement > 15 s → état, pas erreur ; 2e clic réussit.
- **C4** — purge relative `Number(x.toPrecision(12))` à la place de 1e-6 ; si la quantité de la ligne est > 0 et le résultat ≤ 0 → `incompatible`. Tests : 1,15 Kilo → 1 150 g, 0,001 Kilo → 1 g, 1 g → 0,001 kg.
- **C5 / Prêt 10 — une unité vide ne donne qu'un message.** `|| !line.unit.trim()` retiré de `purchaseEntry.ts:205` ; `stockQuantityFor` n'est appelée que si la quantité est finie > 0 et l'unité lisible. Une ligne `''` ne dit que « unité à préciser ».
- **C6** — `setReceipt(undefined)` partout où `setPendingId(null)` et au début de `attach()`.
- **C7** — lien : `new URL(href)`, protocole `https:` et hôte exactement `drive.google.com`, sinon aucun lien ; `rel="noopener noreferrer"`.
- **C8** — le message « en cours » réutilise la classe de la ligne d'état existante (`:215`) au même emplacement que l'erreur ; aucun nouveau style.
- **C9 (acceptée)** — Risque assumé : le statut « Déjà payé / À payer » cliqué à la main n'a pas de marque « tapé » ; un second scan (autre document, `:132` remet la saisie à zéro) le remplace. La date tapée reste.
- **C10** — R2b : la description gardée devient aussi le libellé de la ligne neuve de la remise à zéro (`newLine` + description). Assertion au test R2 : second scan en échec, description gardée, total tapé, l'enregistrement part.
- **C11** — trois tests de plus : `unavailable` → `role="alert"`, ni `role="status"` ni reçu ; deux clics rapides → un seul appel ; nouvel article « 6 Kilo ».
- **C13 (décision du pilote) — unité d'un article neuf.** `newArticleUnit(unit)` : si `linkUnit` change l'écriture (autre que la casse) et que le résultat est une masse ou un volume (« Kilo » → `kg`, « Liter » → `l`, « Kg. » → `kg`), l'article prend cette unité ; toute autre unité lisible est gardée telle quelle (« Kg », « L », « Stk », « sachet ») ; illisible → refus R7. La ligne de dépense garde l'unité imprimée (D213). Test : nouvel article « 6 Kilo » → article `kg`, quantité 6 ; ligne « Kilo ».
- **C14** — R1b : `unitPrice` n'est retiré que si `value.unit` est défini et **différent** de `line.unit` (retaper la même unité garde le prix).

**Prêt à coder**
- **P1** — §4 reçoit `tests/integration/equipmentProjects.test.tsx` (rend le vrai `ExpenseSheet` par `UpgradeWorkspace`, écrit par le vrai `purchaseEntry`), ajouté à G5 par le pilote. Parents cherchés (`rg "UpgradeWorkspace|StocksTab|QuickActionModal|FinancesTab" tests/`) : voir RESULTAT.md ; tout test trouvé est rejoué à la main.
- **P3** — `ecran-lecture` : le mock de `savePurchaseWithProofReceipt` appelle `state.saved(draft)` et rend `{transactionId}` ; l'écran est jugé sur le brouillon reçu (`unitPrice`, `description`, `paymentDate`). `unitPriceCents` s'assère dans `unites-enregistrement` avec le vrai `savePurchase`.
- **P5 (décision du pilote) — table de vérité de `receiptSentence(r)`** (fonction pure exportée de `ExpenseSheet.tsx`, rend `{text, link?}`) : `text = "Justificatif rangé " + (folder ? "dans « {folder} »" : "sur ton Drive") + (fileName ? " sous « {fileName} »" : "") + (verified===true ? ", empreinte vérifiée" : "") + "."`. Cas : dossier+nom+vérifié → « Justificatif rangé dans « D » sous « N », empreinte vérifiée. » ; vérifié seul (cas réel de `financeDocuments.ts:107,135`) → « Justificatif rangé sur ton Drive, empreinte vérifiée. » ; dossier seul → « Justificatif rangé dans « D ». » ; nom seul → « Justificatif rangé sur ton Drive sous « N ». » ; rien → « Justificatif rangé sur ton Drive. » ; `verified` faux ou absent : rien sur l'empreinte (l'ancienne « non confirmée par Drive » est retirée). Lien : seulement s'il passe C7. Une seule phrase pour les deux emplacements (`:215`, `:286`).
- **P6** — harnais de `ecran-recu.test.tsx` : mocks de `expenseSheet.test.tsx:6-10` (storage avec `getTransactions` rendant la dépense à rattacher, `purchaseEntry` partiel) et rendu de `stock/unites.test.ts:79-90` ; doublon : `{id:'TX-old',date:'12.03.2026',description:'Achat',amountTTC:10,finance:{kind:'expense',vendor:'Fournisseur A',invoiceNumber:'MB-1',version:1,amountCents:1000,lines:[]}}` (sans `proofDocumentId` ni `proofUrl`), même fournisseur et même n° de facture que la lecture simulée.
- **P8 / C12** — `r1-rouge.txt` se produit à l'étape 1 du code, avant toute modification de `src/` ; RESULTAT.md cite sa ligne `Test Files … failed`.
- **P9** — voir C1 (`category?:string`, test sans catégorie).
- **P11** — test de parité `formatUnitLink` / `stockQuantityFor` sur chaque cas accepté R5 et R6 (le nombre écrit à droite de « → » ou « = » égale la quantité de `stockQuantityFor`). Une divergence n'est pas cachée : `formatUnitLink` est hors Possède ; elle est écrite `DÉCISION À PRENDRE` dans RESULTAT.md et le test reste rouge.
- **P12** — R4 est prouvé par jsdom seulement (sous `?dev-local` aucun reçu n'existe) ; le pilote le joue en ligne (D210).
- **P13** — `scripts/check-fix114-ui.mjs:148` ouvre « Nouvelle dépense » : n'appelle rien de changé, non rejoué (parcours en ligne).
- **Tests dans `raccord/` seulement** : les nouveaux tests vivent dans `tests/unit/depense/raccord/` ; `purchaseEntry.test.ts` n'est modifié que si un attendu l'exige (aucun prévu).

## 1. Défauts visés

| Id | Défaut | Où | Cause |
|---|---|---|---|
| R1 | A11 : le prix unitaire lu est perdu | `ExpenseSheet.tsx:150` | la ligne est construite sans `unitPrice` (le champ existe : `PurchaseLineDraft.unitPrice`, gardé par `exactUnitPriceCents`, `purchaseEntry.ts:178`) |
| R2 | A12 : une description tapée peut être écrasée par un scan | `ExpenseSheet.tsx:147,160` (+ `:132`) | la description est posée directement ; la re-lecture (`:132`) vide « Pour quoi ? » avant le second scan, même tapée |
| R3 | A7 : une date de paiement tapée peut être écrasée | `ExpenseSheet.tsx:160` | `scannedPayment(result, today)` étalé, au lieu de `applyScannedPayment(previous, result, today)` (`purchasePrefill.ts:130`) |
| R4 | DR1 + DR4 : le reçu Drive et l'état « envoi en cours » n'arrivent pas à l'écran | `ExpenseSheet.tsx:171,174,215,286` | l'écran appelle `savePurchaseWithProof` (chaîne seule) ; `drive/in-progress` tombe dans `setError` (cadre d'erreur) |
| R5 | Stk ↔ sachet refusé à l'enregistrement | `purchaseEntry.ts:209,350` | `Units.areCompatible('Stk','sachet')` est faux ; `pieceUnitsEquivalent` (`ingredientIdentity.ts:345`) n'est lu que par l'appariement |
| R6 | « Kilo », « Kilogramm », « Liter », « litre(s) », « Kg. » refusés à l'enregistrement | `purchaseEntry.ts:209,350` | l'appariement lit `linkUnit` (`stockLineMatching.ts:67`, non exportée), l'enregistrement lit `Units` brut |
| R7 | Garde D214 : une unité illisible doit dire « unité à préciser » | `purchaseEntry.ts:205` | `!line.unit.trim()` n'attrape que le vide ; `-`, `n/a`, `?` passent ou disent « ne se convertit pas » |

Deux sous-points sont rattachés à leur défaut parce qu'ils font mentir le test du défaut s'ils restent : R1b (le prix lu ne suit pas une unité retapée),
R2b (la re-lecture ne vide pas une description tapée). Ils sont comptés dans R1 et R2.

## 2. Changements (fichier, fonction)

### 2.1 `src/services/stockLineMatching.ts`
- Ligne 67 : `const linkUnit` → `export const linkUnit`. **Rien d'autre** (pas de nouvelle table, pas de nouvelle fonction).

### 2.2 `src/services/purchaseEntry.ts`
- Imports : `linkUnit` (avec `canonicalStockCategory` déjà importée de `./stockLineMatching`), `isReadableUnit` et `pieceUnitsEquivalent` de `./ingredientIdentity`.
- Nouvelle fonction exportée, au-dessus de `validatePurchase` :
  `stockQuantityFor(quantity:number, lineUnit:string, target:{unit:string;category:string}) : {ok:true;quantity:number;via:'same'|'conversion'|'piece'} | {ok:false;reason:'unreadable'|'incompatible'}`.
  Règles, dans cet ordre :
  1. `!isReadableUnit(lineUnit)` → `unreadable` (D214, jamais deviné).
  2. `a=linkUnit(lineUnit)`, `b=linkUnit(target.unit)`. `a===b` → `{quantity, via:'same'}` (aucun calcul).
  3. `Units.areCompatible(a,b)` et `Units.convert(quantity,a,b)` non nul → `{quantity: arrondi à 1e-6, via:'conversion'}` (l'arrondi retire seulement le bruit flottant, par ex. `1.15*1000`).
  4. `pieceUnitsEquivalent(lineUnit, target.unit, canonicalStockCategory(target.category))` → `{quantity, via:'piece'}` (1 pour 1, jamais en grammes).
  5. sinon `incompatible`.
  `Units` n'est pas modifié (`convert(2,'Stk','sachet')` reste `null`).
- `validatePurchase` (bloc `:203-211`) :
  - quantité absente ou ≤ 0 : message d'aujourd'hui (« indique la quantité reçue et son unité ») ;
  - **R7** : pour toute ligne avec `stockAction !== 'none'`, si `!isReadableUnit(line.unit)` : `${description} : unité à préciser (illisible ou absente). Rien n'entre en stock tant qu'elle manque.` ;
  - `existing` : `stockQuantityFor(...)` ; `incompatible` → message d'aujourd'hui inchangé (`${description} : ${unit} ne se convertit pas en ${target.unit}.`) ; `unreadable` n'ajoute pas de second message.
- `savePurchase` (`:348-351`) : `Units.convert(...)!` remplacé par `stockQuantityFor(...)` ; `ok:false` → `throw Error` (inatteignable après `validatePurchaseCommit`, défensif, avant la première écriture). Le mouvement `receipt` garde `unit:item.unit` (« sachet », « g »). La ligne de dépense garde `unit:line.unit` (« Stk », « Kilo ») : **D213, jamais réécrite**.
- `exactUnitPriceCents` (`:178`) : `!(line.unit??'').trim()` → `!isReadableUnit(line.unit)`. Raison : le commentaire dit « sans unité lisible, il n'est rattaché à rien » ; `-` ou `n/a` ne sont pas des unités (D214). Cas existants (`Kg`, `g`, `Stk`) inchangés.

### 2.3 `src/ui/finance/ExpenseSheet.tsx`
- **R1** (`:150`) : la ligne reçoit `unitPrice: result.currency==='CHF' ? (item.price ?? undefined) : undefined`. Une ligne sans prix lu n'en reçoit pas ; une devise étrangère non plus (le montant de ligne est déjà `undefined` dans ce cas). **R1b** : `updateLine` retire `unitPrice` quand `value.unit` change (le prix lu vaut pour l'unité imprimée ; `exactUnitPriceCents` retomberait sinon sur une quantité × prix coïncidente).
- **R2 + R3** (`:146-160`) : le `patch` du scan devient un `setDraft(previous => patchPurchaseDraft(previous, {...}, swissToday()))` construit **dans** la fonction de mise à jour, donc sur l'état courant et non sur le `draft` capturé avant l'`await` :
  `{vendor, date, ...applyScannedPayment(previous,result,today), invoiceNumber, ...applyScannedDescription(previous,result), category, amount, lines, source*…}`.
  La ligne de repli (`lines.length?…:[{…description:description||'Achat'}]`) prend la description gardée (`applyScannedDescription(previous,…).description ?? previous.description`) pour ne pas réécrire une saisie dans sa ligne.
  La saisie « Pour quoi ? » marque déjà `typed` (`patchPurchaseDraft:106`), la saisie d'une date de paiement aussi (`:104-105`) : un test les couvre au lieu de les réécrire.
- **R2b** (`:132`, re-lecture) : le `patch` de remise à zéro ne vide plus `description` quand `draft.descriptionSource==='typed'` ; sinon il la vide et efface sa source comme aujourd'hui (`description:'', descriptionSource:undefined`). La date de paiement tapée n'est pas touchée par cette remise (`patchPurchaseDraft:107` : base `typed`).
- **R4** :
  - import `savePurchaseWithProofReceipt` à la place de `savePurchaseWithProof` ; état `receipt: DriveProofReceipt|undefined` (`import type` depuis `financeDocuments`).
  - `save()` : `if(!pendingId){const r=await savePurchaseWithProofReceipt(draft);setPendingId(r.transactionId);setReceipt(r.proof);}` puis `confirmPurchase`. Succès : `onSaved(receipt)` ; le type de la prop devient `onSaved:(receipt?:DriveProofReceipt)=>void` (les appelants `()=>…` restent valides : `QuickActionModal.tsx:604`). La feuille se ferme comme aujourd'hui.
  - `attachToExisting()` : `attachProofToPurchase` rend déjà la preuve ; elle va dans `receipt`.
  - Texte du reçu, une seule fonction pure `receiptSentence(r)` dont chaque morceau vient d'un champ du reçu et n'apparaît que s'il est présent : `rangé dans « {folder} »` (si `folder`), `sous « {fileName} »` (si `fileName`), `empreinte vérifiée` (si `verified===true`) ou `empreinte non confirmée par Drive` (si `verified===false`), lien « Ouvrir dans Drive » (si `webViewLink` commence par `https://drive.google.com/`, `target="_blank" rel="noopener noreferrer"`). Drive muet (ni dossier ni nom) : « Justificatif rangé sur ton Drive. » sans rien de plus (s2b).
  - Où il s'affiche, **sans élément neuf** : (a) la ligne « Justificatif rattaché à « … » du … » (`:215`) reçoit la phrase à la suite ; (b) la ligne « Le justificatif sera rangé dans ton Drive privé à l'enregistrement. » (`:286`) devient la phrase du reçu quand l'envoi a abouti et que la confirmation reste en attente (`pendingId` posé, feuille ouverte).
  - **DR4** : `drive/in-progress` ne passe plus par `setError` : état `proofSending` (booléen) ; il s'affiche dans un `<div role="status">` (aucun `role="alert"`, ton neutre) avec le texte du service (« Envoi du justificatif en cours sur ton Drive… », `PROOF_IN_PROGRESS`, `purchaseEntry.ts:274`). `proofSending` est remis à faux au début du clic suivant. Aucun nouveau bouton : le second clic sur « Confirmer et enregistrer » rappelle `savePurchaseWithProofReceipt`, que s2 rend idempotent (comparaison locale, pas de nouvel envoi). `saveLocked` garde contre le double clic pendant un appel.
  - Les autres erreurs (`drive/auth-required`, `unavailable` « Hors connexion… », rejets) gardent leur cadre d'erreur.
- **R5/R6/R7 côté écran** : `issueTarget` (`:116`) : `message.includes('convertit')` devient `message.includes('convertit')||message.includes('unité à préciser')` (le champ « Unité ligne n » reçoit le focus). Rien d'autre ne change à l'écran.

### 2.4 Tests (créés ou adaptés, tous dans le Possède)
- `tests/integration/expenseSheet.test.tsx` : le `vi.mock` de `purchaseEntry` simule `savePurchaseWithProofReceipt` (retour `{transactionId:'TX-test'}`) à la place de `savePurchaseWithProof`. Aucune assertion existante ne change.
- `tests/unit/purchaseEntry.test.ts` : un test pour `stockQuantityFor` (`same`, `conversion`, `piece`, `incompatible`, `unreadable`) et le prix unitaire sans unité lisible.
- `tests/unit/depense/raccord/` (nouveaux) :
  - `unites-enregistrement.test.ts` (R5, R6, R7), harnais de `tests/unit/depense/enregistrement/unites.test.ts` (même mocks `storage`/`firestoreRepo`) ;
  - `ecran-lecture.test.tsx` (R1, R2, R3), harnais de `tests/unit/depense/stock/unites.test.ts` (jsdom, `ExpenseSheet` réel, Gemini simulé, `savePurchaseWithProofReceipt` simulé pour lire le brouillon enregistré) ;
  - `ecran-recu.test.tsx` (R4).

## 3. Tests qui échouent d'abord (données, attendu)

Sortie complète dans `voies/r1-raccord/r1-rouge.txt`, à produire à l'étape 1 du code, sur HEAD, avant toute modification de `src/`. Fixtures : lignes de la facture 372765 déjà dans `tests/unit/depense/stock/fixtures/` (`lignes-372765.json`, `stock-simule.json`) et la lecture simulée `diagnostic/d1/lecture-simulee-372765.json` ; aucune donnée du brasseur.

| Défaut | Test (fichier) | Données | Attendu | Rouge aujourd'hui parce que |
|---|---|---|---|---|
| R1 | `ecran-lecture` « le prix unitaire lu est gardé » | lecture : Maris Otter 6 Kg, `price` 2,30, 13,80 CHF ; Target 40 g, 0,04, 1,60 ; une ligne sans prix | brouillon enregistré : `unitPrice` 2,3 et 0,04 ; `undefined` pour la ligne sans prix ; `unitPriceCents` écrit 230 et 4 | `unitPrice` absent |
| R1b | idem « retaper l'unité retire le prix » | idem, unité retapée « g » | `unitPrice` retiré, `unitPriceCents` absent | prix gardé (6 g × 2,30 = 13,80) |
| R1 (devise) | idem « devise étrangère : pas de prix » | `currency:'EUR'`, `price` 2,3 | aucun `unitPrice` | (vert aujourd'hui, témoin) |
| R2 | `ecran-lecture` « une description tapée survit à un second scan » | scan 1, saisie « Malt pour la Pale Ale », « Changer », scan 2 (autre fournisseur) | « Pour quoi ? » = la saisie ; `descriptionSource:'typed'` ; le fournisseur change | la re-lecture vide la description puis le scan la remplit |
| R2 | idem « sans saisie, le second scan remplace la description lue » | scan 1, scan 2 | description du scan 2, source `scan` | (témoin) |
| R3 | `ecran-lecture` « une date de paiement tapée survit à un second scan » | scan 1 (date 27.04.2026), date de paiement tapée par le raccourci « Hier », scan 2 (autre date) | date de paiement inchangée, statut qui suit le scan 2 | `scannedPayment` étalé |
| R3 | idem « supposée : le second scan la remplace » | scan 1, scan 2 sans saisie | date du scan 2 | (témoin) |
| R4 | `ecran-recu` « le reçu rangé est dit » | `savePurchaseWithProofReceipt` rend `{transactionId, proof:{folder:'L’Affinée / Justificatifs / 2026', fileName:'2026-04-27 Brau- und Rauchshop GmbH 372765.jpg', verified:true, webViewLink:'https://drive.google.com/file/d/abc/view'}}`, `confirmPurchase` en attente | la ligne du pied dit dossier, nom, « empreinte vérifiée » et un lien `href` exact | l'écran appelle l'ancienne fonction, aucun reçu |
| R4 | idem « Drive muet : rien d'inventé » | `proof:{folder:undefined, fileName:undefined, verified:false}` | « Justificatif rangé sur ton Drive. » sans nom, sans dossier, « empreinte non confirmée par Drive » | idem |
| R4 | idem « lien hors drive.google.com refusé » | `webViewLink:'https://exemple.test/x'` | aucun lien | (garde de l'écran) |
| R4 | idem « rattachement : la ligne dit le reçu » | doublon proposé, `attachProofToPurchase` rend un reçu | la ligne « Justificatif rattaché… » porte dossier, nom, lien | reçu jeté |
| DR4 | idem « > 15 s : un état, pas une erreur » | `savePurchaseWithProofReceipt` rejette `{code:'drive/in-progress'}` puis réussit | 1er clic : `role="status"` avec « Envoi du justificatif en cours », aucun `role="alert"` ; 2e clic : appel, fermeture | message dans le cadre d'erreur |
| DR4 | idem « le second clic ne relance pas un envoi confirmé » | Drive confirmé, `confirmPurchase` échoue une fois | `savePurchaseWithProofReceipt` appelé 1 fois pour 2 clics, reçu toujours affiché | (garde `pendingId` existante, témoin) |
| R5 | `unites-enregistrement` « Stk face à un sachet de levure » | Windsor 2 Stk, BE-256 1 Stk, US-05 2 Stk, Verdant 2 Stk de la 372765 ; articles `Levure`, unité `sachet` | `validatePurchase` sans erreur ; mouvement `quantity` 2/1/2/2, `unit:'sachet'` ; ligne de dépense `unit:'Stk'` | « Stk ne se convertit pas en sachet » |
| R5 | idem « Stk face à un malt ou un houblon : refus » | malt en kg, houblon en g, malt en `sachet` | erreur « ne se convertit pas » | (témoin) |
| R5 | idem « Sachets / sachet » et « Stk / pce » | `Sachets` face à `sachet` | accepté, 1 pour 1 | refus (`areCompatible` faux) |
| R5 | idem « levure en g face à un sachet » | `g` face à `sachet` | refus comme aujourd'hui, pas de grammes en sachets | (témoin) |
| R6 | idem « les écritures de s1 » | `6 Kilo` malt en g ; `2 Kg.` houblon en kg ; `1 Kilogramm` en g ; `3 Liter` article en ml ; `2 litres` article en L | acceptées ; mouvements 6 000 g, 2 kg, 1 000 g, 3 000 ml, 2 L, exacts ; ligne de dépense garde « Kilo », « Kg. »… | refus « ne se convertit pas » (Kilo, Kilogramm, Liter) |
| R6 | idem « arrondi » | `1.15 Kilo` → g, `0.001 Kilo` → g | 1150 et 1 exactement (`toBe`) | — |
| R6 | idem « incompatible reste refusé » | `Liter` face à un grain en g ; `Stk` face à un houblon en g ; `kg` face à `sachet` | refus | (témoin) |
| R7 | idem « unité illisible : jamais en stock » | `matchStockLine` propose Maris Otter avec unité `''`, `-`, `n/a` (3 lignes, `unitMissing`) ; la ligne est reprise en `existing` | `validatePurchase` contient le nom de la ligne et « unité à préciser » ; `savePurchase` lève, **0 écriture** (`state.writes` vide), aucun mouvement | `''` : message « indique la quantité… » sans le mot ; `-`/`n/a` : « ne se convertit pas » |
| R7 | idem « nouvel article à unité illisible » | `stockAction:'new'`, unité `-` | refus « unité à préciser » | article créé avec l'unité `-` |
| R7 | `purchaseEntry` « prix sans unité lisible » | `unitPrice` 2,3, `unit:'-'` | `unitPriceCents` absent | prix gardé |

Le témoin « avant » de RESULTAT.md est la ligne `Test Files … failed` de `r1-rouge.txt`. Les lignes marquées « témoin » sont vertes dès le départ : elles
prouvent que la correction ne desserre rien.

## 4. Tests et scripts hors Possède qui touchent ce qui change

`grep` sur `tests/` et `scripts/` entiers (`ExpenseSheet`, `savePurchaseWithProof`, `validatePurchase`, `linkUnit`, `Units.areCompatible`) :
- `tests/integration/jus0Journey.test.tsx`, `tests/unit/depense/stock/ecran.test.ts`, `tests/unit/depense/stock/unites.test.ts` : rendent `ExpenseSheet` (le dernier avec des mocks de `financeDocuments` sans `loadDriveProofReceipt`). Ils ne simulent pas `savePurchaseWithProof` ; `savePurchaseWithProof` appelait déjà `savePurchaseWithProofReceipt`, donc le chemin d'écriture est le même. **Ils restent verts sans modification** (rejoués avant et après).
- `tests/unit/depense/enregistrement/*.test.ts` (6 fichiers), `tests/unit/purchaseEntry.test.ts` (partie hors Possède : aucune), `tests/unit/depense/stock/relecture.test.ts` : appellent `validatePurchase`/`savePurchase` ou `matchStockLine`. Les messages d'erreur existants sont gardés mot pour mot (`ne se convertit pas`, `quantité`, `ne peut pas entrer en stock`, `doublon`) ; seul s'ajoute « unité à préciser ». Rejoués après chaque changement de `purchaseEntry.ts`.
- `tests/unit/stockLineMatching.test.ts`, `tests/unit/depense/stock/*.test.ts` : `linkUnit` n'est qu'exportée, aucune ligne de logique ne change. Rejoués.
- `scripts/agents/inventaire-ecrans.mjs` : nomme `ExpenseSheet` pour l'inventaire, n'appelle aucune fonction changée.
- Fixtures relues contre les nouvelles règles : `tests/unit/depense/enregistrement/paiement-prix.test.ts:69-72` (lignes `Stk` avec `stockAction:'none'`) et `unites.test.ts:19` (`Kg`, `g`, `Stk`, aucun stock) : la garde R7 ne s'applique qu'aux lignes en stock, donc inchangés.
- Aucun test hors Possède n'est cassé par ce plan ; si l'un l'était à l'exécution, je m'arrête et le pilote tranche (COMMUN).

## 5. Risques

- **Données existantes** : aucun champ de document Firestore ajouté, retiré ou renommé. Une dépense enregistrée avant (ligne `Stk`, `Kg`) reste lisible : ses lignes gardent leur unité imprimée, ses mouvements leur unité d'article. `unitPrice` n'est qu'un champ du brouillon.
- **Écriture de stock = argent et quantités** : une seule fonction (`stockQuantityFor`) sert la validation et l'écriture ; elles ne peuvent plus diverger. Le seul cas nouveau accepté est `piece` (même pièce, 1 pour 1) et les écritures de `linkUnit` ; tout ce qui n'était pas une unité reste refusé. Le doute se résout en refus.
- **Arrondis** : la conversion arrondit à 1e-6 pour retirer le bruit flottant (testé 1,15 kg → 1 150 g). Les montants ne changent pas (centimes entiers).
- **Hors ligne / Drive** : `unavailable` garde son message « Hors connexion… » en cadre d'erreur ; aucun état « en cours » n'est posé pour une panne réseau. Un reçu n'est affiché que s'il a été rendu par Drive.
- **Double clic** : `saveLocked` (ref) et `pendingId` d'aujourd'hui, inchangés ; `proofSending` est un affichage, pas une garde.
- **Le patch du scan dans un `setDraft(updater)`** : fonction pure (`patchPurchaseDraft`, `applyScanned*`), sans effet de bord ; `proposedStock`/`lineStartsOpen` (refs) restent mis à jour avant, comme aujourd'hui. Le mode strict de React peut l'appeler deux fois sans conséquence (aucune écriture).
- **Prix unitaire à tort** : `exactUnitPriceCents` continue de ne le garder que s'il est exact en centimes et cohérent avec quantité × prix = montant ; R1 n'élargit rien.
- **R7 plus large que la lettre** (nouvel article inclus) : un brasseur qui crée un article avec une unité `-` est arrêté ; c'est voulu (l'unité deviendrait celle de l'article).
- **Le reçu ne se voit pas après un succès** : la feuille se ferme. Voir DÉCISION ci-dessous.

## 6. Parcours dans Chrome

À l'exécution : essayer `?dev-local` ; si « Nouvelle dépense » s'ouvre et accepte une facture simulée, script `puppeteer-core` dans la voie (captures ouvertes). Sinon dit pourquoi (la fixture n'a pas de stock) et laisse au pilote le jeu en ligne (D210). Aucun Drive réel.

## 7. Hors périmètre
Bouton de mouture (S5), signal S8, base de la date (A7), tout nouvel élément visible (voie écran, L25) ; l'appariement s1 ; la création et la catégorie d'un article (S6) — un nouvel article prend toujours l'unité imprimée de la ligne (« Kilo » deviendrait l'unité de l'article), non modifié ici ; `Units` global ; la lecture ; Gemini réel ; Drive réel ; `functions/` ; tout commit.

## 8. Décisions que le plan tranche, et pourquoi
1. **Une fonction commune plutôt qu'une table partagée** (R5/R6) : `stockLineMatching.ts` ne gagne qu'un `export` ; la règle d'enregistrement vit dans `purchaseEntry.ts`, à côté de `validatePurchase`.
2. **« kg face à g d'un houblon » (R6)** : lu comme « famille différente ». kg ↔ g se convertit (6 Kilo → 6 000 g), sinon la consigne se contredit.
3. **Reçu affiché sans élément neuf** : deux phrases existantes (`:215`, `:286`), plus le reçu passé à `onSaved`.
4. **Seuil `SACHET_MAX_G`** : non recopié. À l'enregistrement, `g` face à `sachet` n'est pas une équivalence : refus.

DÉCISION À PRENDRE (pour le pilote, avant le code) : après un enregistrement réussi la feuille se ferme, donc le brasseur ne voit jamais le reçu dans le cas courant. Options : (a) ne rien ajouter ici, passer le reçu à `onSaved` et laisser la voie écran le montrer (recommandé : L25, un élément visible se conçoit en Opus) ; (b) garder la feuille ouverte avec un état « Enregistré » : élément neuf, hors consigne.
