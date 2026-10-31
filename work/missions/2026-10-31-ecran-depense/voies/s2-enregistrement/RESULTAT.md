OK — Neuf défauts d'enregistrement corrigés (date supposée, prix, mouture, doublon, nom et preuve Drive), 187 tests verts.

Plan : `PLAN.md` (section « Corrections après la revue » en fin de fichier, elle l'emporte) ; revue triée : `REVUE-PLAN.md` (`REVUE OK`). Exigence D213 (unités) ajoutée en cours de route.

## Critères (sorties décisives)

- G1 `npm run build` : `✓ built in 25.84s` (`g1.txt`).
- G2 : `Test Files 14 passed (14)`, `Tests 187 passed (187)`, `TESTS ENREGISTREMENT OK` (`g2.txt`). Contient aussi `expenseSheet.test.tsx`, `brewBudget.test.ts`, `financeArchiveContinuity.test.ts` et `financeDocumentPersistence.test.ts`.
- G3 `systeme.mjs revue` : `REVUE OK (bloquant 1, majeur 14, détail 13)` (tous « corrigée » par le pilote).
- G4 : voir la fin de ce fichier (contrôle `note`).
- `npx tsc --noEmit -p .` : aucune erreur.
- Essais utilisés : un échec de syntaxe (accolade en trop, `financeDocuments.ts:46`), un jeu de données de test réutilisé (doublon dans `justificatif-nom.test.ts`) ; chaque critère passé au deuxième essai au plus.

## TEMOIN AVANT :

Commande : `npx vitest run tests/unit/depense/enregistrement tests/unit/purchasePrefill.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/driveFileStore.test.ts` sur le code de HEAD (aucun fichier de `src/` modifié), sortie complète dans `temoin-avant.txt` / `temoin-avant.clean.txt` :

`Test Files  8 failed (8)` · `Tests  58 failed | 34 passed (92)`.

Échecs par défaut, pour la bonne raison :
- A7 : `expected undefined to be 'document_date'` / `'typed'` ; `expected { date: '31.07.2026', …(3) } to match object { paymentDate: '31.07.2026', …(1) }` (rien ne marque la date de paiement).
- A11 : `expected [ undefined, undefined, …(21) ] to deeply equal [ 230, 10, 240, 180, 10, 175, …(17) ]` (le prix unitaire n'est jamais écrit).
- A12 : `expected 'Achat de malts, houblons, levures et …' to be 'Brau- und Rauchshop GmbH · 372765 · i…'` (la prose du modèle).
- S5, S8, DR1, DR5 : `TypeError: proposeMillingSurcharges / purchaseSimilarOrders / savePurchaseWithProofReceipt / driveProofFileName / getDriveProofDetails is not a function` (fonctions absentes) ; DR5 aussi `expected 'Screenshot_2026-04-27.jpg' to be '2026-04-27 Brau- und Rauchshop GmbH 3…'` (le nom d'origine part à Drive).
- S7 : `expected 13.8 to be 14.4` (le prix de Maris Otter ne contient pas la mouture).
- DR4 : `expected undefined to be 'drive/in-progress'` ; `expected "spy" to not be called at all, but actually been called 1 times` (le second clic retélécharge) ; `financeDocumentPersistence` : `promise rejected "Error: Un autre original utilise cet identifiant…" instead of resolving` (même contenu sous un autre nom).
- Garde-fous, déjà verts sur HEAD (ils protègent l'existant, ils ne prouvent pas la correction) : « ne bloque pas : validatePurchase ne se plaint pas d'un doublon », « garde-fou : une dépense écrite avant la correction garde son prix », les 5 tests de `purchasePrefill` hors A12/A7, 8 des 9 tests de `financeDocumentPersistence`, les 18 tests d'origine de `driveFileStore`.
- D213 (`unites.test.ts`) : écrit après le début du code, donc pas de rouge sur HEAD mesuré. Par construction il serait rouge : HEAD n'écrit pas `unitPriceCents` (même constat que le témoin A11) et n'a pas `proposeMillingSurcharges`. Le test « deux achats en kg puis en g » est un garde-fou, dit comme tel.

## Par défaut : ce qui est fait et son test

- **A7** (`paiement-prix.test.ts`) : la date de paiement venue de la date du document est marquée `paymentDateBasis:'document_date'` (scan : preuve payée, inconnue ou impayée) ; tapée : `'typed'` ; la date du jour substituée au changement de statut : base effacée (inconnue). Une date tapée égale à la date du document n'est plus écrasée quand celle-ci change. La dépense porte `finance.paymentDateBasis` ; le paiement porte `note: PAYMENT_DATE_ASSUMED_NOTE` quand elle est supposée. Choix « déduite et marquée », pas « vide » (un champ vide bloquerait chaque enregistrement) ; la bascule est une ligne dans `scannedPayment`. L'affichage et l'export liront le champ plus tard (hors voie).
- **A11** (même fichier) : sur les 23 lignes de la facture, 22 `unitPriceCents` gardés (`230, 10, 240…`), la ligne 22 (Hallertauer, 0,045 CHF/g) sans prix car ce n'est pas un nombre entier de centimes : arrondir à 5 donnerait 1,50 au lieu de 1,35. Un prix qui contredit le montant, sans quantité, sans unité ou sur une remise n'est pas gardé.
- **A12** (même fichier) : `invoicePurchaseDescription` rend `Fournisseur · N° · familles`, 60 caractères au plus. Sur la lecture simulée (aucune catégorie de stock lue) : `Brau- und Rauchshop GmbH · 372765 · ingrédients` (pas « malts, houblons, levures », qui demande `stockCategory`). Familles uniques, dans l'ordre de première apparition, mouture exclue. `applyScannedDescription(previous, scan)` ne remplace jamais une description tapée ni d'origine inconnue et non vide ; trois cas testés (tapée puis scan, scan puis scan, vide puis scan).
- **S5** (`mouture-prix.test.ts`) : `proposeMillingSurcharges` propose seulement ; la ligne « Zuschlag Schrotung » (6 Kg) est proposée au malt juste au-dessus (Maris Otter, 6 Kg) ; adjacence stricte, même quantité positive, même unité ; une remise, un port, une autre mouture entre les deux, une quantité absente, ou une mouture en première ligne : pas de lien. `confirmMillingSurcharge` est le geste du brasseur (à appeler par l'écran). La mouture ne crée ni article ni mouvement de stock.
- **S7** (même fichier) : avec le lien confirmé, `latestBrewPrices` rend `amount 14.4` pour `quantity 6` (2,40 CHF/kg) ; sans geste, 13,80 comme aujourd'hui (le prix du malt ne change pas tant que le brasseur n'a rien confirmé). Un lien qui ne tient pas (autre quantité, autre unité, montant nul, pas un service) est ignoré ; aucun prix pour une ligne sans lien. `weightedBrewPrices` compte aussi la mouture liée.
- **S8** (`doublon-commande.test.ts`) : `purchaseSimilarOrders` signale une même commande facturée sous un autre numéro : même fournisseur, même total, même n° de commande (60 jours au plus), ou références d'articles communes (7 jours au plus). Ne bloque pas (`validatePurchase` et `purchaseDuplicates` inchangés). Limite dite : le seuil de 7 jours repose sur une seule facture mesurée (L20), 3 jours entre la pro-forma et la finale ; le cas « 3 jours, autre n°, aucune référence » reste non signalé (test existant conservé).
- **DR5** (`justificatif-nom.test.ts`) : nom `2026-04-27 Brau- und Rauchshop GmbH 372765.jpg` (forme juridique gardée, extension tirée du type du contenu, 120 caractères au plus) ; nom d'origine dans `finance.proofOriginalFileName` ; `tx.proofFileName` = nom lisible ; nom mémorisé par saisie (nouvelle tentative après correction du fournisseur : même nom) ; l'attache à une dépense existante nomme avec cette dépense. Le contenu fait l'identité d'un original, pas le nom.
- **DR1** (`justificatif-nom.test.ts`, `justificatif-persistance.test.ts`, `driveFileStore.test.ts`) : `savePurchaseWithProofReceipt` rend `{transactionId, proof}` ; `proof` porte dossier `L’Affinée / Justificatifs / 2026` (lu sur Drive, pas déduit de la date), nom, octets, empreinte, `verified`, et `webViewLink` (seulement si l'adresse commence par `https://drive.google.com/`). `purchaseProofReceipt` relit la preuve après rechargement, `undefined` sans jeton ou hors ligne. `savePurchaseWithProof` rend toujours la chaîne.
- **DR4** : après 15 s, `code:'drive/in-progress'` et texte « peut encore aboutir » (neutre dans `financeDocuments`, texte d'achat posé par `confirmProof`). Un second clic compare localement (empreinte, octets, type) et lit les métadonnées Drive, sans téléchargement ; sans empreinte Drive il retombe sur le téléchargement (jamais d'acceptation silencieuse).
- **D213 — les unités** (`unites.test.ts`) : la ligne enregistrée garde l'unité imprimée (`Kg`, `g`, `Stk`), jamais réécrite ; `unitPriceCents` est le prix pour cette unité, absent sans unité lisible ; la mouture n'est proposée ni pour 6 Kg contre 6000 g, ni pour 6 Kg contre 6 g, ni sans unité ; le prix du malt ignore un lien d'une autre unité ; deux achats d'un même article en kg puis en g restent chacun dans leur unité (garde-fou).

## Fichiers écrits

- `src/services/purchaseEntry.ts`, `src/services/purchasePrefill.ts`, `src/services/financeDocuments.ts`, `src/services/driveFileStore.ts`, `src/domain/finance/brewBudget.ts`, `src/domain/finance/types.ts` (trois champs facultatifs : `surchargeOfLineId`, `paymentDateBasis`, `proofOriginalFileName`).
- Tests : `tests/unit/purchasePrefill.test.ts` (deux assertions réécrites : « propose le libellé par le code… » aux lignes 19-20 pour A12, et `scannedPayment` `toEqual` à la ligne 52 pour A7 — elles figeaient les défauts), `tests/integration/driveFileStore.test.ts` (option `withLink` éteinte par défaut + 5 tests DR1), `tests/integration/financeDocumentPersistence.test.ts` (mock complété par `getDriveProofDetails`, test « refuse une collision » : même contenu sous un autre nom accepté, autre contenu refusé), et dans `tests/unit/depense/enregistrement/` : `paiement-prix`, `mouture-prix`, `doublon-commande`, `justificatif-nom`, `justificatif-persistance`, `unites`.
- Voie : `PLAN.md`, `RESULTAT.md`, `temoin-avant.txt`, `temoin-avant.clean.txt`, `essai1.txt`, `g1.txt`, `g2.txt`.

## Rien ne se perd :

- Tous les champs ajoutés sont facultatifs et lus avec `?` ; aucun champ retiré d'un document Firestore, aucune migration. Une dépense écrite avant (sans `surchargeOfLineId`, `paymentDateBasis`, `unitPriceCents`, `proofOriginalFileName`) garde exactement son prix (test garde-fou) et reste lisible ; `tx.proofFileName` des anciennes dépenses reste le nom d'origine.
- Les 187 tests de G2 sont verts, dont tous les anciens des quatre fichiers (hors les deux assertions nommées plus haut). `loadFinanceDocument`, le chemin des originaux en blocs Firestore et le message « Hors connexion » sont inchangés.
- `savePurchaseWithProof` garde sa signature (chaîne) ; `saveFinanceDocumentConfirmed` passe de `void` à `DriveProofReceipt | undefined` sans changement pour `incomeEntry.ts`, `financeService.ts`, `TaxClosingSheet.tsx`. Rejoués : `jus0Journey`, `incomeEntry`, `taxWorkspace`, `backupTransfer`, `financeService*` : 41 verts, 2 rouges.
- Ces 2 rouges (`tests/integration/jus0Journey.test.tsx` : « C3 — une ligne lue qui existe déjà… n'est pas rattachée d'office » et « ne propose aucun article de stock… ») concernent la proposition d'article de stock dans `ExpenseSheet`. Ils ne dépendent d'aucun fichier de ma voie : `src/services/stockLineMatching.ts` porte une modification d'une autre voie (1 ligne, la garde `STOCK_LINE_PROPOSALS_ENABLED`) ; je n'y ai pas touché.
- La mouture n'est jamais liée sans le geste du brasseur : le prix du malt ne bouge pas tant qu'il n'a rien confirmé. Aucune donnée réelle, aucun Drive réel, aucun Gemini : Drive factice (`driveFileStore.test.ts`) et mocks.

## Hors périmètre et raccordements à faire (voie r1 et voie écran)

Rien n'est écrit dans `ExpenseSheet.tsx`. Pour que le brasseur le voie : passer `unitPrice:item.price` par ligne (A11) ; appeler `applyScannedDescription(draft, result)` à la place de `description` (A12) ; proposer `proposeMillingSurcharges(lines)` et appeler `confirmMillingSurcharge` au geste (S5) ; appeler `savePurchaseWithProofReceipt` pour afficher le reçu (DR1) ; afficher la base de la date de paiement (A7), le signal `purchaseSimilarOrders` (S8) et le message `drive/in-progress` comme un état, pas une erreur (DR4). Hors voie aussi : l'appariement et l'identité d'un produit (s1), la création d'un article et sa catégorie, l'envoi Drive anticipé, tout Drive réel.

## Doutes et limites

- Le dossier du reçu est relu sur Drive (parent = dossier d'année de l'app) : il est absent, pas déduit, quand Drive ne le rend pas. Le lien `webViewLink` n'est pas stocké dans Firestore.
- Le test D213 « 6 Kg contre 6000 g » vérifie l'absence de proposition ; la conversion kg/g n'est pas faite ici (aucune conversion silencieuse).
- Prix à 3 décimales (0,045 CHF/g) : non gardé en centimes (reste recalculable par montant ÷ quantité). À décider avec le pilote si un champ en dixièmes de centime est voulu.
- Pas de mesure en navigateur : la voie n'a pas d'interface.

LEÇON PROPOSÉE : un test qui épingle un défaut (ici deux assertions de `purchasePrefill.test.ts`) doit être nommé au plan avec ses lignes, et le `toEqual` exact sur un objet que l'on étend est un piège : préférer `toMatchObject` pour ne pas casser à chaque champ facultatif ajouté.

CONNAISSANCE : une preuve Drive se lit sur Drive (parent du fichier, propriétés cachées du dossier, `webViewLink` sous `drive.google.com`) ; un dossier déduit de la date serait faux dès qu'une date est corrigée entre deux tentatives. Voir `getDriveProofDetails` dans `src/services/driveFileStore.ts`.

## Corrections de la relecture (voie s2b, 31.10)

Les trois majeurs de `RELECTURE.md` sont corrigés. Méthode : tests écrits d'abord, rejoués sur le code de s2 non corrigé (sortie complète : `s2b-rouge.txt`) : `Test Files 4 failed (4)` · `Tests 12 failed | 55 passed (67)`, puis code corrigé.

### Tests rouges avant correction (sortie décisive)

- Constat 1 (nom lu sur Drive) :
  - `driveFileStore.test.ts` : `AssertionError: expected undefined to be '2026-04-27 Fournisseur A 111.pdf'` (fichier rangé sous A, renvoyé sous B : Drive ne rendait aucun nom) ; et `expected { checksumVerified: true, …(2) } to deeply equal { fileName: 'facture.pdf', …(3) }`.
  - `justificatif-persistance.test.ts` : `expected { …(7) } to match object { …(2) }` (le reçu disait B) ; `expected { …(6) } to not have property "fileName"` (Drive muet, le reçu portait quand même le nom de la saisie) ; `expected { …(7) } to match object { fileName: 'nom-sur-drive.pdf' }` (après rechargement, le nom venait du document Firestore).
  - `justificatif-nom.test.ts` : `expected '2026-04-27 Brau- und Rauchshop GmbH 3…' to be 'Screenshot_2026-04-27.jpg'` (Drive muet, la dépense gardait un nom déduit de la saisie).
- Constat 2 (nom figé avant l'envoi) : `justificatif-nom.test.ts`, pour `unavailable` et pour `drive/auth-required` : `AssertionError: expected '2026-04-27 Brau.jpg' to be '2026-04-27 Brau 372765.jpg'` (premier clic sans envoi, numéro saisi ensuite, le fichier serait parti sous l'ancien nom) ; et `expected '2026-04-27 Brau- und Rauchshop GmbH 3…' to be 'Nom sur Drive.jpg'` (le nom mémorisé était celui de la saisie, pas celui de Drive).
- Constat 3 (date tapée écrasée) : `paiement-prix.test.ts`, trois cas : `TypeError: applyScannedPayment is not a function`. La fonction n'existait pas ; le défaut lui-même (écrasement par `{...scannedPayment(scan2)}`) est prouvé par l'entrée de `RELECTURE.md` n° 3.
- Garde-fou déjà vert avant (dit comme tel) : « le nom de la dépense et du reçu est celui que Drive rend » (`justificatif-nom`) : le chemin reçu → dépense était juste ; le défaut était en amont (le reçu ne disait pas le nom de Drive).

### Corrections

1. **Nom du reçu lu sur Drive** (`driveFileStore.ts`, `financeDocuments.ts`, `purchaseEntry.ts`) : `getDriveProofDetails` rend `fileName` (le champ `name` des métadonnées, absent si Drive ne le rend pas). `confirmOriginal` lit ces détails **avant** d'écrire le document `financeDocuments/…` : le document et le reçu portent le nom de Drive. `proofReceipt` ne prend plus aucun nom dans la référence, le document Firestore ou la saisie ; `loadDriveProofReceipt` (après rechargement) lit aussi le nom sur Drive. `DriveProofReceipt.fileName` devient facultatif. Si Drive ne rend rien : le reçu n'a pas de nom ; `tx.proofFileName` reste le nom d'origine du téléphone (`draft.proofFileName`), jamais un nom déduit de la saisie. Une seule exception, dite : le document `financeDocuments/…` exige un `fileName` (validateur `isDriveFinanceOriginal`) ; si Drive ne rend pas le nom, il garde le nom demandé à l'envoi, mais ce nom ne passe ni dans le reçu ni dans la dépense.
2. **Nom mémorisé au bon moment** (`purchaseEntry.ts`) : `driveNames.set` n'est plus appelé avant `confirmProof`. Le nom n'est mémorisé qu'à l'arrivée d'un reçu qui porte un nom de Drive ; un échec avant tout envoi (`unavailable`, `drive/auth-required`) ne fige donc rien, et la tentative suivante nomme avec la saisie corrigée. Un envoi parti puis perdu (écriture Firestore manquée) : la nouvelle tentative retrouve le fichier par `documentKey`, et le reçu dit le nom de Drive (constat 1). **Test corrigé** : « une nouvelle tentative après correction du fournisseur redemande le même nom (mémorisé au premier envoi) » exigeait le contraire (échec simulé `drive/network` avant envoi, même nom exigé). Il est remplacé par deux cas `it.each(['unavailable','drive/auth-required'])` où le nom suit la saisie, plus le test de mémorisation par le reçu (`attachProofToPurchase` reprend « Nom sur Drive.jpg »).
3. **Date de paiement tapée jamais écrasée** (`purchasePrefill.ts`) : `applyScannedPayment(previous, scan, today)`, pure, même règle que `applyScannedDescription`. Si `paymentDateBasis === 'typed'` et la date n'est pas vide, elle rend `{ paymentStatus }` seulement (ni date ni base). Sinon, `scannedPayment` (vide, `document_date`, ou date du jour par défaut d'origine inconnue : `ExpenseSheet` initialise `paymentDate` à aujourd'hui sans base, donc l'inconnu ne doit pas bloquer un premier scan). Trois tests dans `paiement-prix.test.ts` (tapée puis scan, scan puis scan, vide puis scan), passés par `patchPurchaseDraft` comme à l'écran.

### Critères rejoués (après correction)

- G1 `npm run build` : `✓ built in 22.77s`. `npx tsc --noEmit -p .` : aucune erreur.
- G2 : `Test Files 14 passed (14)`, `Tests 199 passed (199)`, `TESTS ENREGISTREMENT OK` (187 → 199 : +12).
- G3 : `REVUE OK (bloquant 1, majeur 14, détail 13)`.
- G4 : voir le contrôle `note` ci-dessous.
- `npx vitest run tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx --maxWorkers=2` : `Test Files 2 passed (2)`, `Tests 29 passed (29)` (les 2 rouges de `jus0Journey` signalés plus haut ne le sont plus : la garde de s1 est en place).

### Fichiers écrits par s2b

`src/services/driveFileStore.ts`, `src/services/financeDocuments.ts`, `src/services/purchaseEntry.ts`, `src/services/purchasePrefill.ts`, `tests/integration/driveFileStore.test.ts` (ligne 252 : `fileName` ajouté à l'attendu ; deux tests), `tests/integration/financeDocumentPersistence.test.ts` (le mock des détails Drive rend le nom du premier envoi), `tests/unit/depense/enregistrement/justificatif-nom.test.ts`, `justificatif-persistance.test.ts` (mock des détails avec nom ; trois tests), `paiement-prix.test.ts` (trois tests), `s2b-rouge.txt`.

### Doutes et limites

- Le nom lu sur Drive n'est jamais rejoué contre un Drive réel (interdit) ; le Drive factice rend `name` comme l'API.
- `applyScannedPayment` n'est pas encore appelé par l'écran : `ExpenseSheet.tsx` utilise toujours `scannedPayment` (même raccordement que `applyScannedDescription`, voie r1).
- Pendant un envoi en cours (> 15 s), une nouvelle tentative avec saisie corrigée attend l'envoi en vol et obtient le nom de Drive (celui du premier envoi), pas celui de la saisie corrigée.
- Détails 4 à 9 de `RELECTURE.md` non traités (hors de la consigne).

CONNAISSANCE : un nom ou un dossier montrés comme « preuve Drive » se lisent dans les métadonnées Drive à chaque fois (`getDriveProofDetails`) ; le nom de la référence d'un appel, du document Firestore ou de la saisie dit seulement ce qu'on a demandé.
LEÇON PROPOSÉE : aucune
