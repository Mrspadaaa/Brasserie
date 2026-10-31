OK — R1 à R7 : le scan arrive à l'écran (prix, description, date, reçu Drive), et Stk/sachet, Kilo/Liter s'enregistrent exacts.

## TEMOIN AVANT
Tests écrits d'abord, lancés sur HEAD avant toute modification de `src/` (sortie complète : `r1-rouge.txt`) :
`Test Files  3 failed (3)` — `Tests  46 failed | 7 passed (53)` (les 7 verts sont les témoins qui prouvent que rien n'est desserré : refus Stk face à un malt/houblon, g face à sachet, autre famille, « quantité absente », second scan sans saisie).
Causes lues dans la sortie : `expected [ 'Kilo', 6 ] to deeply equal [ 'kg', 6 ]` ; `expected [ 230, 230 ] to deeply equal [ 230, undefined ]` ; `expected 'Autre Malterie SA · MB-2 · ingrédients' to be 'Malt pour la Pale Ale'` (description tapée écrasée) ; `expected '' to be 'Malt pour la Pale Ale'` (remise à zéro) ; `receiptSentence is not a function` ; `Unable to find an element with the text: /Envoi du justificatif en cours/` ; `stockQuantityFor is not a function` ; `unité à préciser` absent de « Produit : indique la quantité reçue e… ».

## Par défaut : le test et sa ligne (tous dans `tests/unit/depense/raccord/`)
- **R1** `ecran-lecture.test.tsx` « chaque ligne scannée porte son prix lu… » : `[['Kg',2.3],['g',0.04],['pce',undefined]]`. R1b « retaper l'unité retire le prix lu » (`ExpenseSheet.tsx` `updateLine`, seulement si l'unité change). `unitPriceCents` : `unites-enregistrement.test.ts` « le prix unitaire n'est rattaché à aucune unité illisible » → `[230, undefined]`.
- **R1, cas limites** `ecran-lecture.test.tsx`, describe « R1 : cas limites du prix unitaire » :
  - Conception n° 14 : retaper la MÊME unité (« Kg ») garde le prix unitaire (2,3) ; une autre unité le retire (R1b ci-dessus). La saisie identique est forcée par une valeur intermédiaire, sinon React ne la signale pas. Mutation vérifiée : si le code retire le prix à toute saisie d'unité, ce test échoue.
  - Facture hors CHF (EUR) : la ligne lue ne reçoit aucun `unitPrice`, même quand le brasseur tape le total en CHF (`sourceCurrency:'EUR'`, `unitPrice` indéfini). Le prix lu serait en EUR ; `ExpenseSheet.tsx` ne le pose que si `result.currency==='CHF'`.
- **R2** `ecran-lecture.test.tsx` : saisie « Malt pour la Pale Ale » gardée après un second scan (`descriptionSource:'typed'`) ; second scan en échec : la saisie reste ET devient le libellé de la ligne, l'enregistrement part ; témoin sans saisie : remplacée.
- **R3** `ecran-lecture.test.tsx` : date de paiement tapée (« Hier ») gardée après un second scan, base `typed`, date du document qui suit le scan ; témoin : date supposée remplacée, base `document_date`.
- **R4** `ecran-recu.test.tsx` : `receiptSentence` (table de vérité, 6 cas + 5 liens refusés) ; `onSaved` reçoit le reçu au premier clic et à la reprise ; la ligne du pied et la ligne « Justificatif rattaché… » disent le reçu ; Drive muet : rien d'inventé ; > 15 s à l'enregistrement et au rattachement : `role="status"`, aucun `role="alert"`, 2e clic réussit ; hors ligne : alerte, pas d'état « en cours » ; deux clics rapides : un appel.
- **R5** `unites-enregistrement.test.ts` : les 4 lignes « Stk » de la facture 372765 (Windsor, BE-256, US-05, Verdant) → sachets 2, 1, 2, 2 ; refus Stk face à malt/houblon/malt en sachets, g face à sachet, article sans catégorie ; poids : « Safale US-05 500 g » refusé, « 11,5 g » accepté, 11,5 g face à un article « 11 g » refusé.
- **R6** même fichier : Kilo → g (6 → 6 000), Kg. → kg, Kilogramm → g, Liter → ml, litres/Litre → L, 1,15 Kilo → 1 150, 0,001 Kilo → 1, g → kg 0,001 ; autre famille refusée ; nouvel article « 6 Kilo » → article `kg`, ligne `Kilo` ; parité `formatUnitLink` / `stockQuantityFor` sur 8 cas (aucune divergence trouvée).
- **R7** même fichier : `matchStockLine` propose Maris Otter avec l'unité `''`, `-`, `n/a` (`unitMissing`) ; `validatePurchase` dit le nom de la ligne et « unité à préciser », un seul message, `savePurchase` lève, 0 écriture ; nouvel article à unité illisible refusé aussi.

## La facture 372765, avant et après
- Avant : ses 4 lignes « Stk » reliées par s1 à un sachet de levure donnaient « Stk ne se convertit pas en sachet » (bloquait « Confirmer ») ; une ligne « Kilo » donnait « Kilo ne se convertit pas en g ».
- Après : `validatePurchase` ne dit rien ; mouvements de 2, 1, 2, 2 sachets (unité `sachet`), la ligne de la dépense garde « Stk » (D213) ; 6 « Kilo » face à un article en g → 6 000 g, la ligne garde « Kilo ».

## Critères
- G1 `COMPRIS OK (6 doutes)` ; G2 `REVUE OK (bloquant 1, majeur 7, détail 19)` ; G3 `✓ built in 22.16s` ; G4 `TYPES OK` ;
  G5 `Test Files  38 passed (38)`, `Tests  850 passed (850)` sur 39 fichiers (rejoué après les corrections de la relecture ; 842 sur 38 avant), `TESTS RACCORD OK` (commande de GATES.md, `equipmentProjects` compris) ; G6 voir ci-dessous.
- Parents rejoués à la main (`rg "UpgradeWorkspace|StocksTab|QuickActionModal|FinancesTab" tests/`) : `AppQuickActionReturn`, `batchScheduling`, `brewCreationBudgetContinuity`, `brewLegacyInstallationLaunch`, `compactStocks`, `dashboardNavigation`, `fix114`, `financeWorkspace` : `Test Files 8 passed (8)`, `Tests 59 passed (59)`. `tests/ux-mobile/*` et `scripts/check-fix114-ui.mjs` : parcours navigateur, non rejoués.
- Essais : 1 par critère. Un seul ajustement de test avant le vert (index du document dans l'écriture `put`, `state.transactions` à vider dans une boucle).

## Le lien `webViewLink`
Le reçu de Drive porte `webViewLink` ; l'écran n'en fait un lien que s'il est en `https:` sur l'hôte exactement `drive.google.com` (`new URL`), `target="_blank" rel="noopener noreferrer"`. Refusés (testés) : `http://drive.google.com/…`, `https://drive.google.com.exemple.test/x`, `https://exemple.test/x`, `javascript:alert(1)`, une chaîne qui n'est pas une adresse. La phrase (`receiptSentence`) : « Justificatif rangé dans « dossier » sous « nom », empreinte vérifiée. » ; chaque morceau n'est dit que s'il est dans le reçu ; « empreinte vérifiée » si et seulement si `verified === true`, même sans dossier ni nom.

## Fichiers écrits
`src/ui/finance/ExpenseSheet.tsx`, `src/services/purchaseEntry.ts`, `src/services/stockLineMatching.ts` (deux `export` : `linkUnit`, `SACHET_MAX_G`), `tests/integration/expenseSheet.test.tsx` (le mock simule `savePurchaseWithProofReceipt` ; aucun attendu changé), `tests/unit/depense/raccord/{unites-enregistrement.test.ts, ecran-lecture.test.tsx, ecran-recu.test.tsx}`, `PLAN.md` (§0 corrections de la revue), `COMPRIS.md`, `r1-rouge.txt`, ce fichier.

## Ce qui a changé, en bref
- `stockQuantityFor` (une règle pour valider et écrire) : unité illisible → refus ; même unité → telle quelle ; `linkUnit` + `Units` → conversion exacte (`toPrecision(12)`) ; Stk ↔ sachet pour une levure, 1 pour 1, sauf poids du libellé > `SACHET_MAX_G` ou différent de celui de l'article ; sinon refus. `Units` inchangé.
- `validatePurchase` : « unité à préciser » (R7) pour toute ligne qui entre en stock ; messages d'avant gardés mot pour mot (`ne se convertit pas`, `quantité`).
- Article neuf : unité de la table (Kilo → kg), sinon l'unité lisible telle quelle ; la ligne garde l'imprimée.
- `exactUnitPriceCents` : le prix n'est rattaché à aucune unité illisible.
- `ExpenseSheet` : scan posé sur l'état courant (`setDraft` + `applyScannedDescription` + `applyScannedPayment`), `unitPrice` par ligne en CHF, `receipt` et `proofSending` en état, `onSaved(receipt)`, `PROOF_IN_PROGRESS_ATTACH` pour le rattachement, focus de « unité à préciser » sur le champ Unité.

## Rien ne se perd
- Description tapée : gardée par un second scan et par la remise à zéro de « Changer » (testé). Date de paiement tapée : gardée (testé). Unité imprimée : jamais réécrite (« Stk », « Kilo », « Kg. » restent sur la ligne de la dépense). Aucun champ de document Firestore ajouté ni retiré. Les 778 tests d'avant restent verts (39 fichiers, 850 avec les nouveaux).
- Une dépense enregistrée avant reste lisible : ses lignes gardent leur unité et leurs mouvements leur unité d'article.

## Corrections de la relecture (RELECTURE.md, 0 bloquant, 2 majeurs, 5 détails)
Tests d'abord, rouges sur le code d'alors : `r1b-rouge.txt` → `Test Files  1 failed | 3 passed (4)`, `Tests  4 failed | 59 passed (63)` (n° 1, 2, 3 et « le refus empêche toute écriture », chacun pour la bonne raison : `expected '' to contain 'ne se convertit pas'`). Puis la correction ; G3 `✓ built in 22.93s`, G4 `TYPES OK`, G5 `Test Files  39 passed (39)`, `Tests  850 passed (850)`, `TESTS RACCORD OK`, G6 `NOTE OK`.
- **n° 1 et 2 (majeurs, fausses écritures)** `stockQuantityFor` (`purchaseEntry.ts`), branche Stk/pce ↔ sachet d'une levure : toute mesure du libellé (nombre + kg, g, mg, ml, cl, dl, l) qui n'est pas LE poids du sachet lu (≤ `SACHET_MAX_G`), et tout multiplicateur (« 10 x … », « … x10 », « 10x11,5g », « … × 10 »), donnent `incompatible`, donc le refus d'avant r1. Refusés (testés, `unites-enregistrement.test.ts`) : « 0,5 kg », « 1 kg », « 1kg », « 0.5 l », « 10 x 11,5 g », « 11,5 g x10 », « 10x11,5g », « 11,5 g × 10 ». Acceptés : « 11,5 g », « 11g », un libellé sans mesure, « (Abbaye) BE-256 ».
- **n° 3** même règle que `stockLineMatching.ts:193-201`, sans modifier ce fichier : poids des deux côtés différents → refus ; ligne sans poids face à un article au poids connu → refus (« Safale US-05 » face à « … 500 g » et face à « … 11,5 g ») ; ligne avec poids face à un article sans poids → seulement ≤ `SACHET_MAX_G`. Conséquence assumée (dans le doute, rien) : une ligne « Stk » sans poids face à un article dont le nom porte un poids est refusée à l'enregistrement ; le brasseur choisit l'article sans poids ou corrige la ligne. Cette limite remplace celle qui disait le contraire plus haut.
- **n° 4** `rattachement-en-cours.test.ts` : le vrai `attachProofToPurchase` avec `drive/in-progress` → code gardé, le message contient « Rattacher le justificatif », jamais « Confirmer et enregistrer » ni « Rien n'est enregistré » ; témoin : l'achat garde « Confirmer et enregistrer ».
- **n° 5 par mutation** (script hors dépôt, code remis ensuite, `Tests  63 passed (63)` après) : retirer `unitPrice` à la lecture → 3 rouges (R1, R1b, « même unité ») ; retirer le test d'unité de `updateLine` → R1b rouge ; reprendre le texte de l'achat au rattachement → rouge ; ne plus remettre le reçu à zéro au rejet → rouge ; retirer la garde de mesure → 3 rouges. **Le témoin R3 « date supposée remplacée » est vert avant et après r1** : dans `r1-rouge.txt` il était rouge par le harnais (le mock vise `savePurchaseWithProofReceipt`, que l'ancien écran n'appelait pas), pas par le comportement ; R1 et R1b de même. La preuve du comportement est la mutation ci-dessus.
- **n° 6** `ecran-recu.test.tsx` : rejet confirmé de la dépense (`status:'rejected'`) → alerte, plus de « Justificatif rangé », le pied redit « sera rangé dans ton Drive privé », le clic suivant rappelle `savePurchaseWithProofReceipt` (2 appels) et `onSaved` reçoit le reçu. Mutation vérifiée (rouge sans `setReceipt(undefined)`).
- **n° 7 — défaut connu d'avant r1, non corrigé, pour la voie écran** : « Changer » le fichier garde `pendingId`. Après un premier enregistrement dont la confirmation est restée en attente, un nouveau fichier est annoncé « sera rangé dans ton Drive privé à l'enregistrement » alors que `save()` saute l'envoi (`if(!pendingId)`) et appelle `onSaved(undefined)`. Remettre `pendingId` à zéro créerait une seconde dépense (doublon) : laissé tel quel sur décision du pilote.

## Doutes et limites
- **Parcours Chrome non fait** : sous `?dev-local` aucun reçu Drive n'existe et la fixture n'a pas de stock ; R4 est prouvé par jsdom seulement. Le pilote le jouera en ligne (D210). Aucune capture, aucun contrôle visuel : l'interface n'a changé que dans deux phrases et un état « en cours » qui réutilise la classe de la ligne d'état existante.
- Le reçu ne se voit pas après un succès (la feuille se ferme) : il est passé à `onSaved(receipt)` pour la voie écran (décision du pilote).
- Un statut « Déjà payé / À payer » cliqué à la main n'a pas de marque « tapé » : un second scan le remplace (compromis accepté, Conception n° 9). La date tapée reste.
- Une ligne « Stk » sans poids face à un article dont le nom porte un poids est refusée à l'enregistrement, comme par l'appariement (correction de la relecture n° 3) : un cas légitime peut être refusé, jamais accepté à tort.

## Hors périmètre (inchangé)
Bouton de mouture S5, signal S8, base de la date A7, fiche d'un produit S6, appariement s1, lecture, `Units` global, Gemini réel, Drive réel, `functions/`. Aucun commit.

DÉCISION À PRENDRE : aucune nouvelle.
CONNAISSANCE : à l'enregistrement, la règle d'une unité est une seule fonction (`stockQuantityFor`, `purchaseEntry.ts`) qui lit la table de l'appariement (`linkUnit`) et `pieceUnitsEquivalent` ; `formatUnitLink` (affichage) lui est identique sur les 8 cas testés.
LEÇON PROPOSÉE : un test de parité entre le texte affiché d'une conversion et la quantité écrite (ici `formatUnitLink` / `stockQuantityFor`) évite qu'un écran dise un chiffre et que le stock en écrive un autre.
