# PLAN f1 — une vraie QR-facture et un numéro continu (étape 1, aucun code écrit)

Sources lues : `VOIE.md`, `../COMMUN.md`, `PLAN-METIER.md` § 3.3, 3.5, 3.6, 4, 5 ; `src/services/swissQrBill.ts` (41 lignes) ;
`src/ui/finance/InvoiceSheet.tsx` ; `src/types/index.ts:728, 810-823` ; `src/data/seedData.ts:33-43` ; `src/domain/finance/{types,ledger,iban}.ts`.

## 0. Faits vérifiés (état de l'art, L29)

| Sujet | Fait | Preuve |
|---|---|---|
| Bibliothèque | `swissqrbill` **4.4.1** installée (`package.json:48` `^4.4.1`) ; **absente du `node_modules` du worktree**, présente dans `C:/Users/mrspa/Documents/Brasserie/node_modules` (les tests du worktree la résolvent par le dossier parent) | `node_modules/swissqrbill/package.json` |
| API utilisée | `swissqrbill/svg` : `SwissQRBill(data, {language:'FR', scissors, outlines})` → `.toString()` = SVG 210 × 105 mm de la section paiement complète (récépissé + partie paiement, textes traduits, croix suisse) ; `SwissQRCode(data, 46)` = le QR seul. `swissqrbill/utils` : `isIBANValid`, `isQRIBAN`, `calculateSCORReferenceChecksum`, `isSCORReferenceValid`, `calculateQRReferenceChecksum`, `isQRReferenceValid`, `getReferenceType`, `formatIBAN`. `swissqrbill/pdf` exige PDFKit (absent) : **non utilisé**. Types `Data` : `creditor {account,name,address,buildingNumber?,zip,city,country}`, `debtor?` (même forme sans `account`), `amount?`, `currency`, `reference?`, `message?`, `additionalInformation?`. | `lib/esm/shared/types.d.ts`, essai Node (script jetable hors dépôt) |
| Ce que la bibliothèque encode | toujours l'adresse de type **`S`** (structurée) : charge utile `SPC / 0200 / 1 / IBAN / S / nom / rue / n° / NPA / ville / pays` | `lib/esm/shared/qr-code.js:10-26, 52-58` |
| Ce que la bibliothèque **ne vérifie pas** | **mesuré** : `zip: ''` et `address: ''` sont **acceptés** sans erreur (seul `undefined` est refusé) ; la ville vide aussi. Le contrôle « NPA et localité obligatoires » est donc **à nous** (`validator.js:100-160` ne teste que `=== undefined`, longueur et type). Longueurs refusées : nom ≤ 70, rue ≤ 70, n° ≤ 16, NPA ≤ 16, ville ≤ 35, pays = 2 lettres | essai Node, `validator.js` |
| Règles IBAN / référence (bibliothèque) | IBAN ordinaire (CS hors 30000-31999) : référence absente ou **SCOR ≤ 25 car.** ; QR-IBAN (`CH44 3199 9123 0008 8901 2`, exemple SIX) : référence **QRR de 27 chiffres obligatoire**, modulo 10 vérifié. Mesuré : QR-IBAN sans référence QRR de 27 → `QR_REFERENCE_LENGTH_IS_INVALID`. `calculateSCORReferenceChecksum('FAC20260001')` = `59` → `RF59FAC20260001`, `isSCORReferenceValid` = vrai | essai Node |
| Norme SIX | page SIX (lue le 09.11) : « Depuis le 22 nov. 2025, **IG QR-bill 2.3** en vigueur : **seule l'adresse structurée** est permise » ; **v2.4** introduite avec la version SIC du **13 nov. 2026** (reprend la 2.3 jusqu'en nov. 2027), « aucune adaptation technique pour la facturation en CHF ». PDF `ig-qr-bill-v2.3-en.pdf` téléchargé et lu : **§ 4.3.1 (p. 39) « Structured address fields »** : *Street* et *Building number* **optionnels** ; **Postal code, Town et Country obligatoires** ; Nom obligatoire (≤ 70) ; **débiteur optionnel** (groupe « Optional data group », la case se remplit à la main si absent) | `https://www.six-group.com/.../ig-qr-bill-v2.3-en.pdf` (copie temporaire hors dépôt, rien commité) |
| jsPDF | `jspdf ^3.0.0` (`package.json:40`), `addImage(dataUrl,'PNG',x,y,w,h)` accepte un PNG sans DOM ; `svg2pdf.js` **absent** | `package.json` |
| Existant à ne pas confondre | `src/services/qrFacture.ts` (424 l.) = **lecture** du QR d'une facture fournisseur (parseSwissQr). Aucun rapport avec l'émission ; je ne le touche pas | `qrFacture.ts:1-3` |

**Décision de méthode** : le QR vient de `SwissQRBill` (jamais dessiné à la main). Rendu dans le PDF selon P4 : SVG de la section paiement → **PNG par canvas** → `doc.addImage` en bas de la dernière page. Pas de dépendance neuve.

## 1. Défauts visés

| n° | Défaut (INVENTAIRE / PLAN-METIER § 3.3) | Cause dans le code | Corrigé par |
|---|---|---|---|
| 9 | « No QR » : la facture n'a qu'un IBAN en texte, aucune QR-facture (`swissQrBill.ts:13, 49`) | aucune génération de QR | § 2.1, 2.3 |
| 10 | destinataire sans adresse (`swissQrBill.ts:26` imprime nom + contact + e-mail) ; n° `FAC-<année>-<8 hex>` (`InvoiceSheet.tsx:20`, `swissQrBill.ts:15` : `FAC-<8 hex>`) | n° aléatoire, `Client.address` jamais lu | § 2.2, 2.4 |
| 11 | adresse de la brasserie : `company.address` / `company.npa` = chaînes libres (« Rue de l’Exemple 1 », « 1000 Ville », `seedData.ts:37-38`) ; pas de rue / n° / NPA / localité / pays | pas de modèle structuré | **f1 : le type `AdresseStructuree` et sa validation** ; **uv : l'écran Réglages et les champs `company`** (hors Possède de f1) |
| 21 | échéance vide par défaut (`InvoiceSheet.tsx:19`, refus si vide `:34`) ; journal = premier article seulement (`:45` `items[0].description`) | | § 2.2 : `echeanceFacture`, `libelleFacture` (f1 fournit les fonctions ; uv les branche) |

## 2. Changements (fichier → fonction)

### 2.1 `src/services/swissQrBill.ts` (existant, Possède)
Garde `InvoiceItem`, `InvoiceDocumentOptions`, `invoiceTotals`, `SwissQrBillService.generateInvoicePdf` **à signature compatible** (les 3 appelants le mockent ou l'appellent en synchrone : `InvoiceSheet.tsx:43`, `factureClientSaisie.test.tsx:7`, `incomeProofFlows.test.tsx:7`, `financeInvoice.test.ts:9`).

Ajouts :
1. `export interface AdresseStructuree { nom: string; rue: string; numero: string; npa: string; localite: string; pays: string }` (pays = ISO 2 lettres, défaut `CH`). **Type local à f1** : `src/types/index.ts` appartient à uv (phase 3) ; uv branchera les champs `company` / `Client` sur ce type.
2. `export function problemesAdresse(a: Partial<AdresseStructuree> | undefined, role: 'brasserie' | 'client'): string[]` — messages en français, un par défaut : nom vide ou > 70 ; **NPA vide** (≤ 16) ; **localité vide** (≤ 35) ; pays ≠ 2 lettres ; rue > 70 ; n° > 16. `role==='brasserie'` ajoute **rue obligatoire** (décision P7 ; plus strict que la norme, qui rend rue et n° optionnels : voir DÉCISION D2). Remplace le contrôle absent de la bibliothèque.
3. `export function adresseDepuisTexte(rue?: string, npaLocalite?: string): AdresseStructuree-sans-nom | null` — **repli pour les données existantes** (`Client.address` est une chaîne, `company.npa` vaut « 1700 Fribourg ») : `^(.*?)[ ,]+(\d+\s?\w?)$` pour rue + n° ; `^(\d{4})\s+(.+)$` pour NPA + localité. Retourne `null` si le texte ne se découpe pas : **jamais d'invention**. Pour la brasserie, ce repli **ne suffit pas à émettre** (P7) : il sert à pré-remplir les Réglages.
4. `export async function preparerQrFacture(entree): Promise<QrFacturePrete>` avec
   `entree = { iban, creancier: AdresseStructuree, debiteur?: AdresseStructuree, montantCents, numero, devise?: 'CHF', langue?: 'FR', rasteriser?: Rasteriseur }`.
   Étapes : (a) `ibanCompact` + `ibanValide` (`domain/finance/iban.ts`, déjà là) ; (b) `problemesAdresse` créancier, et débiteur **s'il est donné** (absent = permis ; **donné mais incomplet = erreur**, jamais une adresse tronquée envoyée) ; (c) montant entier > 0, ≤ 12 chiffres ; (d) **référence** : `isQRIBAN(iban)` → **QRR** = chiffres de l'année et de la séquence du n° (`FAC-2026-0001` → `20260001`) complétés de zéros à 26 chiffres + `calculateQRReferenceChecksum` ; n° non numérique (anciens `FAC-2026-1a2b3c4d`) + QR-IBAN → erreur claire ; IBAN ordinaire → **SCOR** `RF` + `calculateSCORReferenceChecksum(corps)` + corps (`FAC20260001`, ≤ 25 car., lettres et chiffres seuls) ; (e) `message` = n° ; (f) `import('swissqrbill/svg')` **dynamique** (garde la bibliothèque hors du paquet principal ; poids mesuré à l'étape 2) → `new SwissQRBill(data, {language:'FR'})` ; toute `ValidationError` est reprise en message français **sans l'IBAN** ; (g) `rasteriser(svg, 210, 105)` → PNG. Retourne `{ png, svg, reference, typeReference: 'QRR'|'SCOR', iban }`.
   Erreur typée `QrFactureInvalide extends Error { problemes: string[] }` (la caisse affiche la liste).
5. `Rasteriseur = (svg: string, largeurMm: number, hauteurMm: number) => Promise<string>` (PNG data URL) ; **`rasteriserNavigateur`** par défaut : `Blob` SVG → `Image` → `<canvas>` à **600 ppp** (4960 × 2480 = 12,3 Mpx, sous la limite iOS de 16,7 Mpx ; repli 300 ppp si `toDataURL` échoue) → `toDataURL('image/png')` ; hors navigateur : erreur « Rendu du QR indisponible ». Le **rasteriseur est injectable** : Vitest (Node, sans canvas) y passe un faux.
6. `generateInvoicePdf` : `InvoiceDocumentOptions` reçoit `qr?: QrFacturePrete`, `creancier?: AdresseStructuree`, `debiteur?: AdresseStructuree`. Changements :
   - en-tête : adresse de la brasserie en lignes structurées (`rue n°` / `NPA localité`), sinon l'ancien `address, npa` ;
   - destinataire : nom, **adresse imprimée** (problème 10) si `debiteur`, sinon le texte `client.address` brut s'il existe, puis contact et e-mail ;
   - section paiement : si `options.qr`, bas de la **dernière** page : si `y > 187` mm, `addPage()` ; `doc.addImage(qr.png,'PNG',0,192,210,105)` (A4 : 297 − 105). La ligne « Règlement par virement » garde l'IBAN lisible ; « Motif » devient la référence (SCOR / QRR formatée par `formatReference`). Sans `qr` : comportement actuel inchangé (aucune promesse de QR) ;
   - `invoiceNumber` par défaut : `FAC-${crypto.randomUUID()…}` **disparaît** ; le numéro devient obligatoire (le paramètre 4 sans défaut : les 2 appelants le passent déjà) ; un oubli est une erreur de type, pas un hex.
7. `invoiceTotals` : le net d'une ligne passe par `toCents` de `ledger.ts` (1 × 1,005 CHF = **101** ct, aujourd'hui 100 par `Math.round(100.49999…)`) ; TVA **par ligne** inchangée (déjà `Math.round(netCents × taux)` ligne par ligne) ; test écrit sur ce comportement.
8. `export function libelleFacture(clientNom, items): string` — « Facture Café du Bourg — 24 × Pale Ale 33 cl · 6 × IPA 75 cl » : **tous** les articles (problème 21), tronqué proprement à 140 car. avec « … et N autres » ; remplace `items[0].description` (`InvoiceSheet.tsx:45`, branché par uv).

### 2.2 `src/domain/finance/numeroFacture.ts` (neuf, Possède)
- `prochainNumeroFacture(ecritures: FinanceTransaction[], annee: number): string` → `FAC-2026-0001`. Lit `finance.invoiceNumber` **et** `id`, **seulement les recettes** (`transactionKind(tx)==='income'`, `ledger.ts:48` : un fournisseur peut imprimer `FAC-2026-0009`, sans rapport) ; motif `^FAC-(\d{4})-(\d{4,6})$` : l'**année** doit être l'année demandée, la séquence **4 à 6 chiffres** (les anciens `FAC-2026-1a2b3c4d`, hexadécimaux sur 8, sont ignorés ; un ancien hex de 8 chiffres seulement ne peut pas passer pour une séquence) ; **les écritures annulées comptent** (`voidedAt` : un numéro envoyé n'est jamais réutilisé) ; max + 1 ; `padStart(4,'0')` ; au-delà de 9999, 5 chiffres.
- `doublonsNumeroFacture(ecritures): { numero: string; ids: string[] }[]` — numéros portés par ≥ 2 recettes, pour le signalement à la synchro (P6 : « jamais renuméroté après envoi »).
- `echeanceFacture(dateIso: string, delai: 'reception' | 10 | 30 = 30): string` — arithmétique en **UTC** (`Date.UTC`, `setUTCDate`) sur une date ISO `AAAA-MM-JJ` ; `'reception'` = la date d'émission ; date illisible → lève (pas de repli silencieux). Pas de bibliothèque : `date-fns` / `luxon` absents du projet (`package.json`), une addition de jours en UTC est le calcul standard.
- Année du numéro : celle de la **date d'émission** (pas de l'horloge). uv appelle `prochainNumeroFacture` **à l'enregistrement** (pas à l'ouverture) ; le numéro préparé reste fixé pour la reprise (`pending.current`, déjà en place, `InvoiceSheet.tsx:24`).

### 2.3 Donnée de test, jamais de donnée réelle
IBAN QR d'exemple du guide SIX : `CH44 3199 9123 0008 8901 2` ; IBAN ordinaire d'exemple (CS 04835) : `CH56 0483 5012 3456 7800 9` (mesuré valide par `isIBANValid`, `isQRIBAN` = faux). Adresses : « Brasserie de test, Rue du Test 1, 1700 Fribourg, CH » et « Café du Bourg, Grand-Rue 12, 1630 Bulle, CH ». L'IBAN réel n'est jamais lu ni recopié.

## 3. Tests qui échouent d'abord — `tests/unit/factureQr.test.ts` (neuf)
Chaque test échoue sur HEAD (module `numeroFacture` absent, `preparerQrFacture` absent). Environnement `node` (défaut `vitest.config.ts:54` hors `tests/integration`) ; rasteriseur injecté = faux PNG 1 × 1 constant.

| # | Règle | Données → attendu |
|---|---|---|
| 1 | n° continu | `[]`, 2026 → `FAC-2026-0001` ; recettes `0001`, `0002` → `FAC-2026-0003` |
| 2 | repart chaque année | recettes 2026 jusqu'à `0007`, année 2027 → `FAC-2027-0001` |
| 3 | autres années et formats ignorés | `FAC-2025-0099`, `FAC-2026-1a2b3c4d`, `FAC-2026-12345678` → 2026 donne `0001` |
| 4 | dépenses fournisseur ignorées | dépense `invoiceNumber: 'FAC-2026-0009'` → `0001` |
| 5 | annulée compte | recette `0004` avec `voidedAt` → `0005` |
| 6 | 5 chiffres | `0009999` → `FAC-2026-10000` |
| 7 | doublons | deux recettes `FAC-2026-0002` → `[{numero, ids:[a,b]}]` ; aucun doublon → `[]` |
| 8 | échéance | `2026-09-09` +30 → `2026-10-09` ; +10 → `2026-09-19` ; `reception` → `2026-09-09` ; `2026-12-25` +30 → `2027-01-24` ; `2028-02-15` +30 → `2028-03-16` ; `'2026-13-40'` → lève |
| 9 | libellé tous articles | 2 articles → contient les 2 ; 1 article ; > 140 car. → « … et N autres » |
| 10 | adresse structurée acceptée | créancier + débiteur complets → `preparerQrFacture` rend `png` et aucune `ValidationError` |
| 11 | **refusée sans NPA** (la bibliothèque seule l'accepte : le test le prouve en appelant `new SwissQRBill` avec `zip:''` puis `preparerQrFacture` qui refuse) | NPA `''` → `QrFactureInvalide`, `problemes` contient « NPA » ; idem localité, pays `'Suisse'`, nom 71 car. |
| 12 | rue : brasserie obligatoire, client facultatif | brasserie sans rue → refus ; débiteur sans rue → accepté (norme 2.3 § 4.3.1) |
| 13 | débiteur absent permis ; incomplet refusé | sans `debiteur` → OK (Comptoir) ; `debiteur` sans NPA → refus (jamais tronqué) |
| 14 | SCOR | IBAN ordinaire, `FAC-2026-0001` → `RF59FAC20260001`, `isSCORReferenceValid` vrai, `typeReference:'SCOR'` |
| 15 | QRR | QR-IBAN SIX → référence 27 chiffres, `isQRReferenceValid` vrai, finit par le chiffre de contrôle |
| 16 | QR-IBAN + n° non numérique | `FAC-2026-1a2b3c4d` → refus en français |
| 17 | IBAN invalide ou vide | `''` → « IBAN à renseigner » ; `CH00…` → refus ; **le message ne contient pas l'IBAN saisi** |
| 18 | montant | 0, négatif, décimal en centimes non entiers → refus ; `10810` → `108.10` dans `data.amount` (via espion sur le constructeur ou lecture du SVG) |
| 19 | TVA par ligne en centimes | `1 × 1,005 @ 8,1 %` → net 101 (aujourd'hui 100), TVA 8 ; deux lignes `3 × 0,35 @ 8,1 %` → net 105 chacune, TVA 9 chacune = **18**, total 228, alors que l'arrondi de la TVA sur la somme (210 ct) donnerait 17 : le test fixe « TVA par ligne » (valeurs recalculées en Node : 105 × 0,081 = 8,505 → 9 ; 210 × 0,081 → 17) |
| 20 | PDF avec QR | `generateInvoicePdf(..., {qr})` → `doc.output()` contient `/Subtype /Image` ; `doc.getNumberOfPages()` = 1 pour 1 article ; pour 12 articles > 187 mm → la section paiement va sur une page propre (nb pages + 1) |
| 21 | PDF sans QR inchangé | aucun `/Subtype /Image`, ne contient pas « Swiss QR », IBAN lisible (test existant `financeInvoice.test.ts`, rejoué) |
| 22 | hors navigateur | `rasteriserNavigateur` sans `document` → « Rendu du QR indisponible » |

Non testable en Vitest (pas de canvas) : **la netteté réelle du PNG et la lecture du QR par l'application bancaire** — geste du pilote en Chrome puis sur téléphone (PLAN-METIER § 3.7), IBAN d'exemple ; je le note dans RESULTAT.

## 4. Appelants hors Possède, rejoués sur HEAD
`grep` sur `src/`, `tests/`, `scripts/` entiers (`swissQrBill|SwissQrBillService|invoiceTotals|generateInvoicePdf|numeroFacture|FAC-`) :

| Appelant | Lien | Sur HEAD | Change ? |
|---|---|---|---|
| `src/ui/finance/InvoiceSheet.tsx:10, 20, 28, 41, 43, 45` | importe `invoiceTotals`, `SwissQrBillService`, `InvoiceItem` ; n° `FAC-<année>-<8 hex>` ; `generateInvoicePdf` **synchrone** | — (uv, phase 3) | **uv** le réécrit ; f1 garde la compatibilité (signature, synchrone, `invoiceTotals`) |
| `tests/unit/financeInvoice.test.ts` (3 tests) | `generateInvoicePdf(…,'FAC-TEST',…)`, `invoiceTotals` | **vert** | non : les 3 passent après (n° explicite, centimes 14 650 / 10 810 inchangés ; `1e100` → « précision » inchangé) |
| `tests/integration/factureClientSaisie.test.tsx` | `vi.mock('…/swissQrBill', importOriginal + SwissQrBillService mocké)` | **vert** | non (nouveaux exports ajoutés, mock `...importOriginal` les garde) |
| `tests/integration/incomeProofFlows.test.tsx` | même mock | **vert** | non |
| `tests/unit/depense/lecture/facture-372765.test.ts` | « FAC- » dans une pièce de lecture, sans lien avec `swissQrBill` | **vert** | non |
| `scripts/agents/controle-virgule.mjs:36` | `swissQrBill.ts` dans `EXPORTS_TEXTE` (point décimal toléré) | `VIRGULE OK` | **`numeroFacture.ts` n'est pas exempté** : aucun `{n} CHF` décimal dedans (le libellé écrit `24 × …`, entier) ; je rejoue le contrôle à l'étape 2 |
| `scripts/agents/inventaire-ecrans.mjs` | cite `InvoiceSheet` | non rejoué (simple inventaire) | non |

Rejeu HEAD (commande de VOIE.md) : `npx vitest run tests/unit/financeInvoice.test.ts tests/integration/factureClientSaisie.test.tsx tests/integration/incomeProofFlows.test.tsx tests/unit/depense/lecture/facture-372765.test.ts --reporter=dot > voies/f1/tests-head.txt` → **`Test Files 4 passed (4) | Tests 16 passed (16)`** (voir `tests-head.txt`). `qrFacture.ts` et ses 9 tests (`tests/unit/depense/qr/*`) ne sont pas touchés.

## 5. Risques

| Risque | Parade |
|---|---|
| **Données existantes** : `company.address` / `company.npa` en chaînes (`seedData.ts:37-38` : « 1000 Ville »), `Client.address` chaîne, anciens n° `FAC-<année>-<8 hex>` en base | les anciens n° ne sont jamais lus comme séquence, jamais renumérotés ; `adresseDepuisTexte` découpe sans inventer et rend `null` sinon ; la brasserie **sans adresse structurée valide ne peut pas émettre de QR** (P7), et la valeur de repli factice (« Ville », « CHE-XXX ») est refusée : `problemesAdresse` rejette localité vide, et l'écran de uv doit signaler le placeholder `1000 Ville` |
| **Hors ligne** : n° max + 1 local ; deux appareils → doublon | `doublonsNumeroFacture` pour la synchro ; aucune renumérotation après envoi (P6) ; aucune requête réseau dans f1 |
| **Double clic / reprise** | n° fixé avant l'appel (uv garde `pending.current`) ; `preparerQrFacture` est pure et sans effet : l'appeler deux fois donne le même résultat |
| **Arrondis** | centimes entiers de bout en bout ; `toCents` pour le net ; TVA par ligne ; le montant du QR = `totalCents / 100` à 2 décimales ; pas d'arrondi à 5 ct (la norme n'en exige pas pour un virement) |
| **PNG** : flou à 300 ppp (module du QR : 46 mm ÷ ~57 = 0,8 mm ≈ 9,5 px à 300 ppp, bords non entiers) ; mémoire iOS ; poids du PDF (~12 Mpx) | 600 ppp par défaut ; poids du PDF et du paquet **mesurés à l'étape 2** ; repli 300 ppp ; si flou constaté au téléphone : variante vectorielle (D1) |
| **Paquet** : `swissqrbill` + `svg-engine` entrent dans le bundle | `import()` dynamique, découpe dans un chunk ; `npm run build` mesuré à l'étape 2 |
| **jsdom** (tests d'intégration) : `svg-engine` choisit sa version « browser » | `swissqrbill` n'est importée qu'à l'appel de `preparerQrFacture` ; les tests d'intégration existants mockent `generateInvoicePdf` : aucune charge |
| **TVA** : taux par ligne (consigne, verres) | `InvoiceItem.tvaRate` par ligne existe déjà ; f1 n'en choisit aucun (métier : uv, confirmé par le pilote) |
| Norme v2.4 (13.11.2026) | « aucune adaptation technique » pour le CHF ; EUR hors périmètre (CHF seul) |

## 6. Hors périmètre
Écran Caisse, Réglages (champs `company`), `EditClientModal`, `src/types/index.ts`, `storage.ts`, `companyDefaults.ts`, branchement du n° et de l'échéance dans `InvoiceSheet` (tout à **uv**, phase 3). Information de facturation Swico S1 (`additionalInformation`) : non demandée, à ajouter plus tard si le brasseur veut l'import comptable. EUR, QR sans montant, avoirs. Gemini : jamais appelé. IBAN réel : jamais recopié. Aucune écriture hors `Possède`.

## 7. Décisions à trancher (reportées dans RESULTAT)
- **D1** (P4 confirmé, vecteur en repli) : PNG 600 ppp par canvas. Variante si le PNG est flou ou lourd : QR en **rectangles vectoriels** (`SwissQRCode`, 1 712 `<rect>` lus puis `doc.rect`) + textes du récépissé posés par jsPDF aux cotes SIX ; plus net, ~15 Ko au lieu d'un PNG, testable sans canvas, mais le gabarit du récépissé est écrit par nous. Recommandation : PNG d'abord, mesurer, ne basculer qu'au constat.
- **D2** rue obligatoire pour la brasserie : P7 la demande ; la norme 2.3 ne l'exige pas (§ 4.3.1). Recommandation : l'exiger (une facture sans rue paraît incomplète à un client), mais le dire à l'écran sans bloquer un cas rare « lieu-dit ».
- **D3** hors Possède : le type `AdresseStructuree` vit dans `swissQrBill.ts` ; uv le réemploie pour `company` et `Client`. Si le pilote préfère `src/types/index.ts`, c'est une édition de uv.

## 8. Revue du plan (REVUE-A F1-1…5, REVUE-B f1-1…6, R4, R6) et décisions du pilote — étape 2

| Constat | Sort | Raison / ce qui change dans le code |
|---|---|---|
| F1-1 (G) `toCents` faux sur 1 132 de 20 000 x,xx5 | **retenu** | `toCents` (`ledger.ts:5`) est hors Possède. Aide locale `centimesNet(quantité, prix)` = `Math.round(Number((q × p × 100).toFixed(6)))` : le produit flottant est ramené à 6 décimales avant l'arrondi demi-supérieur. Test **balayage** : `1 × (10 n + 5) / 1000` pour n = 0…19 999 → n + 1 centime pour chaque n ; plus 2,135 → 214 et 4,015 → 402. Le plan § 2.1.7 est corrigé : plus de `toCents`. |
| F1-2 (G) le gabarit `seedData` (« 1000 Ville », « Rue de l’Exemple 1 », « Ma Brasserie ») passerait | **retenu** (décision pilote : tout champ vide **et** le gabarit refusent le QR) | `problemesAdresse(…, 'brasserie')` exige nom, rue, **n°**, NPA, localité, pays tous remplis (P7 : « tout champ vide »), et refuse le gabarit : localité « Ville », rue contenant « Exemple », nom « Ma Brasserie ». Chaque message dit « Réglages ». Test : créancier tiré de `initialCompany` (`seedData.ts:33`) → refus avec « Réglages ». `adresseDepuisTexte` ne contourne pas ce refus : le contrôle porte sur l'adresse découpée, pas sur son origine. Le client garde la norme (rue et n° facultatifs). |
| F1-3 (D) borne du montant | **retenu** | `montantCents` entier, 1 ≤ m ≤ 99 999 999 999 (999 999 999,99 : `amount.toFixed(2).length ≤ 12`, `validator.js:115`) ; test à la borne et à la borne + 1. |
| F1-4 (D) « Case postale 123 » | **retenu** | `adresseDepuisTexte` : un texte qui commence par case postale / postfach / CP reste entier dans `rue`, `numero` vide ; NPA = 4 chiffres (CH/LI) sinon `null` (un client étranger : `null`, adresse imprimée en texte, débiteur laissé vide). Tests. |
| F1-5 (D) fond du PNG | **retenu** | `fillStyle = '#fff'` + `fillRect` avant `drawImage` dans `rasteriserNavigateur` ; vérifié au geste du pilote (non testable sans canvas). |
| f1-1 (G) 600 ppp : mémoire, page blanche iOS | **retenu** | **300 ppp par défaut** (2 480 × 1 240 = 3,1 Mpx), paramètre `ppp` ; 600 seulement après mesure au téléphone. Le PNG rendu est contrôlé : `startsWith('data:image/png;base64,')` et longueur > 1 000, sinon erreur « Rendu du QR échoué » (iOS rend parfois un PNG vide sans lever). Test sur ce contrôle avec un faux rasteriseur. Variante vectorielle (D1) gardée en repli. |
| f1-2 (G) `Infinity` → 0 ct avec `toCents` | **retenu** (sans objet avec `centimesNet`) | `centimesNet` n'utilise pas `toCents` : `1e308 × 10` = Infinity → `Number('Infinity')` → pas un entier sûr → l'erreur « précision » de `invoiceTotals` reste. Test ajouté (`quantity 1e308`). |
| f1-3 (G) `rxPrixInconnu.test.tsx` oublié | **retenu** | ajouté au rejeu HEAD et à l'étape 2 (voir § 4 : 5 fichiers). |
| f1-4 (D) hors ligne, chunk dynamique | **écarté pour f1, noté pour uv** | f1 rend une erreur claire si `import('swissqrbill/svg')` échoue (« Hors ligne : QR indisponible, aucune facture sans QR n'est enregistrée ») ; le préchargement à l'ouverture de la caisse est à uv. |
| f1-5 (D) test 20 sans DOM | **retenu** | vérifié au premier essai ; le PNG 1 × 1 de test est un vrai PNG valide. |
| f1-6 (D) données existantes | **sans objet** | rien migré, rien écrit. |
| R4 (G) `doublonsNumeroFacture` sans appelant | **retenu, branchement nommé** | La fonction est livrée et testée ; **uv** l'appelle à l'enregistrement d'une facture (avertissement si le n° existe déjà) ; le signalement à la synchro est à brancher par uv ou d2 (à inscrire dans leur VOIE.md). Sans branchement elle reste inerte : le pilote l'a vu (DÉCISION D4 dans RESULTAT). |
| R6 (D) `controle-virgule.mjs` | **retenu** | `numeroFacture.ts` ne formate aucun nombre décimal avec unité ; rejoué à la fin. |
| Pilote : IBAN de test | **retenu** | seuls les IBAN publics du guide SIX (`CH44 3199 9123 0008 8901 2` QR-IBAN ; `CH56 0483 5012 3456 7800 9` ordinaire), marqués « exemple SIX, test » dans le fichier de test. |
| Pilote : PNG, aucune dépendance | **retenu** | P4 inchangé. |
