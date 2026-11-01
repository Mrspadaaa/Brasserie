# PLAN — voie l1-lecture (la lecture d'une facture contrôlée par le code)

Mission 2026-10-31-ecran-depense. Auteur : Sonnet. Temps 1 : ce plan seulement, aucune ligne de code écrite. Gemini jamais appelé.
Entrées lues : VOIE.md, GATES.md, COMMUN.md, diagnostic d1 (§ tableau, § 2, § 3), `verite-facture-372765.json`, `lecture-simulee-372765.json`,
`functions/src/invoiceScanCore.ts`, `functions/src/prompts.ts:175-245`, `tests/unit/invoiceScanCore.test.ts`, `functions/src/invoiceVisionReview.ts`,
`src/services/purchasePrefill.ts`, `src/services/geminiScanner.ts`, `functions/src/ai.ts:98-160`.

## 0. CORRECTIONS DE REVUE (31.10, `REVUE-PLAN.md` triée) — **priment sur les §§ 2 à 7 ci-dessous quand elles les contredisent**

Possède élargi par le pilote : `functions/src/ai.ts` (constante de sortie seulement, si le test de taille l'exige), `tests/unit/invoiceVisionReview.test.ts`
(fixture des lignes 179-182 seulement : `item({ quantity: 5 })` devient `item({ quantity: 2 })`, 2 × 5 = 10, somme 20 = TTC). G2 rejoue aussi
`tests/integration/invoiceReview.test.ts`, `tests/unit/invoiceScanTransport.test.ts` et `scripts/check-prompts.mjs`.

**Contrat révisé (remplace § 2.1)**
- `points` est un **instantané de la lecture** : le brasseur corrige une valeur, le point ne se recalcule pas (recalcul client : l2). `cle` (stable : `<code>:<ligne|->:<champ>`) et
  `champs` (les cellules en cause) permettent à l'écran de marquer « revu » un point dont une cellule a changé.
- Champs à **sens fixe** : `lu` (toujours un nombre imprimé/lu, centimes ou % ou lignes), `calcule` (toujours le résultat du code), `ecart = lu − calcule`,
  `luTexte` (valeur lue qui est un texte). Un calcul n'est jamais dans `lu`. `unite: 'centimes'|'pourcent'|'lignes'|'texte'`.
- Facultatifs ajoutés au point : `origine` (`'controle'` | `'forme'` : valeur lue rejetée à la mise en forme), `enjeu` (`'argent'|'stock'|'info'`), `bloque` (le client
  refuserait d'enregistrer en l'état : seulement `somme-ecart`), `champs`, `cle`, `candidats` (réservé, non rempli par l1). Codes : type exporté
  `ScanPointCode = typeof SCAN_POINT_CODES[number]`, liste extensible (l2 en ajoute) ; ajouts de l1 : `ligne-prix-par-lot` (inverifiable), `lignes-annoncees`
  (inverifiable), `devis` (inverifiable), `forme-rejetee` (inverifiable).
- `controls` exporté en interface : `lines:{checked,failed,skipped,skippedIds}`, `sum:{statut,base}` (`base: 'TTC'|'HT'|null`), `vat:{statut,base}`, `totals:{statut}`.
  `statut` ∈ `ok|ecart|incomplet|non-verifiable` (`incomplet` seulement pour `sum`).
- Valeurs lues **gardées** à côté des valeurs retenues : `documentTypeLu` (≙ `documentType` tel que lu), `documentTypeRetenu` (`invoice` si `proForma` + `paid` + lu `quote`,
  sinon = lu) ; `alphaPctLu` par ligne. **`documentType` n'est jamais écrasé** (remplace § 2.6 : plus de conversion) ; le point `type-deduit` accompagne `documentTypeRetenu`.
  Le « Devis : vérifier… » reste en issue + point `devis` (inverifiable) quand `proForma` est faux ; absent quand `proForma` est vrai.
- Valeurs rejetées à la mise en forme : champ `rejets` (`{champ, ligne, luTexte, raison}`, repris tel quel au second passage) ; un point `forme-rejetee` (inverifiable) par rejet :
  taux hors [0, 1], `vat` coupé au-delà de 6 rangées (`vatTronque`), `vatCode` > 10 caractères, `printedLineCount` non entier ou négatif, α hors ]0, 30], montant à fraction de centime.
- `vatRate` par ligne **supprimé** du schéma et du résultat (jetons) : un taux imprimé sur la ligne se dit dans `vatCode` (« 8.1% »).
- Aucune clé à `undefined` dans le résultat (Firestore `ref.update`) : test `JSON.parse(JSON.stringify(x))` à l'identique sur chaque fixture.

**Calculs révisés**
- `toCents(x)` : entier de centimes exact (tolérance 1e-7 relatif), sinon `null` → la ligne est « non vérifiée » (sa trace dans `skippedIds` ; en somme : `somme-incomplete`). Test 1,345.
- C1 : en plus de § 2.3 — si `montant / (quantité × prix)` vaut 10, 100, 1000 (ou l'inverse) à 1e-6 : point `ligne-prix-par-lot` **inverifiable** (« prix probablement par 100 g »), jamais `ecart`, ligne comptée `skipped`. Test 250 g × 8,00 = 20,00. La phrase C1 va dans `issues` (≤ 250 car., contient « lignes » pour le routage de `invoiceFieldHints`, jamais « total »).
- C2 : `items.length === 0` ⇒ `sum: non-verifiable`, aucun point ni issue (billets sans lignes : `invoiceVisionReview.test.ts:199-201,221-225`, `invoiceScanCore.test.ts:12`). Base : Σ lignes = TTC ⇒ `ok/TTC` ; sinon, si `amountHT` est lu et Σ lignes = HT au centime ⇒ `ok/HT` ; sinon `somme-ecart` (écart contre le TTC).
- P2 révisé : `linesLost` certain = `max(raw.items.length − 35, raw.linesLost)` ⇒ `sum: incomplet` toujours. `printedLineCount` (« lignes d'articles seulement ») : écart annoncé `printed − items.length − linesLost` > 0 ⇒ si Σ lignes = TTC au centime et rien de certain perdu : seulement un point `lignes-annoncees` (inverifiable), `sum` reste `ok` ; si la somme ne tombe pas juste : ces lignes s'ajoutent à `linesLost`, `incomplet`. « Plus de 35 lignes : compléter le détail manuellement. » n'est posée que si `raw.items.length > 35` (une seule fois dans `result.issues` après rapprochement) ; le point `lignes-perdues` a sa propre phrase (« Détail des lignes incomplet : N ligne(s) non conservée(s) (35 lignes au plus)… »), qui contient « 35 lignes » (lu par `invoiceTotalProposal`, `purchasePrefill.ts:16-17`).
- C3/A10 révisé : jonction ligne ↔ rangée par **code normalisé** (premier mot, majuscule, sans le taux : « N 8.1% » → `N` ; un `vatCode` « 8.1% » joint par le taux) ; R4 exclut du calcul les lignes `shipping`/`discount` sans code (mention dans le détail) et reste `inverifiable` si une autre ligne n'a pas de code. Tolérance R1 = `⌈n/2⌉ + 1` centimes (n = lignes du code, 1 si inconnu) ; un écart non nul sous la tolérance est un détail `arrondiPossible` (listé seulement si le point est levé). R2, R3, R4 : égalité stricte. **Base choisie une fois pour le bloc** : moins de relations en échec, puis plus petite somme d'écarts, puis TTC. `details` triés par écart décroissant. Sur 372765 : base TTC ; échecs R2 (4,15 ≠ 2,80), R3 (110,40 ≠ 86,50), R4 N (26,20 ≠ 11,20), R4 R (84,20 ≠ 75,30) ; R1 des deux codes sous tolérance (arrondiPossible).
- A9 révisé : α recoupé avec **les pourcentages du nom seul** (jamais l'`evidence`, qui peut citer « 8.1% ») ; `alpha-libelle` si le nom en imprime au moins un et qu'aucun n'égale `alphaPct` à 0,05 près ; plage plausible ]0, 30] (hors plage ⇒ `alphaPct = null`, `alphaPctLu` gardé, rejet tracé). Test : extrait « 8.1% », nom « Target 11.3% », α 11,3 ⇒ 0 point.
- A3 révisé : **aucune suppression d'avertissement dans le code** (§ 2.7 (i)(ii) retirés) ; le prompt seul réduit le bruit ; sa preuve viendra du banc réel D210, pas d'un filtre.
- Prompt : un arrondi imprimé est une ligne à part, **négatif ⇒ `discount`, positif ⇒ `other`** (`purchaseEntry.ts:101` refuse un négatif non `discount`) ; le code de TVA est le premier mot de la colonne (sans le taux), le même dans `vat[].code` et `vatCode`.
- Taille : test d'une lecture de 35 lignes aux champs lourds, jetons estimés à 3,2 caractères par jeton ; si > 3 800, relever la constante de sortie (`ai.ts:100-101` et `SCAN_MAX_OUTPUT`) à la plus petite valeur laissant 20 % de marge, 8 000 au plus, et le dire dans RESULTAT.md.
- P1 révisé : toute occurrence de `/Type /ObjStm` non appariée à un flux décodé ⇒ refus ; `pages` = nombre d'occurrences de `/Type /Page` (hors `/Pages`) dans le clair + les flux décodés ; `/Count` lu seulement dans la fenêtre (±300 caractères) d'un `/Type /Pages` (un `/Count` d'`/Outlines` ne compte pas). Messages : chiffré → « Ce PDF est chiffré : exporte les pages utiles en images. » ; flux illisible ou non Flate → « Ce PDF compressé ne permet pas de compter ses pages. Exporte les pages utiles en images. » ; 0 page → message existant ; > 4 pages ou `/Count` > 4 → « Sélectionne un justificatif de 4 pages maximum. ». Références corrigées : la coupe à 35 lignes du client est `geminiScanner.ts:51`.
- Test d'ordre du rapprochement : `reconcileInvoiceVision` appelé en **lecture seule** sur des lectures **différentes** (quote + proForma + paid ; α 250) ; `type-deduit` et `alpha-libelle` survivent à la seconde passe parce que les valeurs lues sont gardées.
- Troisième lecture : fréquence attendue de l'écart 1 à 5 centimes (arrondi imprimé non lu comme ligne) : rare sur les factures suisses à lignes TTC ; relais l2 : relecture seulement si l'écart n'est pas un multiple de 5 centimes.

**Relais obligatoires vers l2 (§ 6 remplacé)** : (1) `geminiScanner.ts` + `ScannedInvoiceResult` passent `points`, `controls`, `vat`, `proForma`, `documentTypeRetenu`, `linesLost`, `rejets`, `vatCode`, `alphaPct` ; (2) `invoiceVisionReview.ts` vote ces champs, prend `vat`/`linesLost` de la lecture dont les lignes sont retenues, et lit `points` pour la 3ᵉ lecture (`ecart` sur `ligne-montant`/`somme-ecart`, jamais `tva-incoherente` ni `lignes-perdues`) ; (3) `scannedPayment` lit `documentTypeRetenu` ; (4) recalcul côté client des points de ligne et de somme à la correction ; (5) le pilote passe `purchaseEntry.ts:237`, son test `:16`, `scripts/eval-expense-vision.mjs:142` à `invoice-v5` dans le même commit, et corrige `docs/expense-prefill-v4.md:22`, `docs/gemini-budget.md:37`.

---

## 1. Défauts visés (9) et un garde-fou

| Id | Défaut (preuve d1) | Corrigé à sa cause par |
|---|---|---|
| C1 | quantité × prix = montant jamais contrôlé (`invoiceScanCore.ts:59-96` n'a pas la règle) | `lineMathCheck`, un point par ligne qui ne se recoupe pas |
| C2 | somme des lignes : tolérance 5 centimes (`:85`) et silence si une ligne n'a pas de montant (`:85`, `every(...!==null)`) | `sumCheck` : égalité au centime ; ligne sans montant = point `somme-incomplete` |
| C3 | TVA par taux jamais contrôlée ; bloc imprimé de 372765 incohérent et muet | `vatBlockCheck` + schéma `vat[]` ; un seul point `tva-incoherente` avec ses `details` |
| A10 | un seul `tvaRate` / `tvaAmount` (`prompts.ts:215-216`), pas de code N/R par ligne, pas de bases par taux | schéma : `vat[]` (code, taux, base, montant) et `vatCode` / `vatRate` par ligne |
| A6 | pas de pro-forma (`invoiceScanCore.ts:13`) ; lue « quote » + payée → « À payer » côté client (`purchasePrefill.ts:66`) | champ `proForma` + règle de normalisation (§ 2.6) |
| A9 | α dans le nom seulement (`prompts.ts:226-237`, pas de champ) | `alphaPct` par ligne, lu ; recoupé avec le libellé |
| P1 | tout PDF avec `/ObjStm` refusé (`invoiceScanCore.ts:35`) | `countPdfPages` : décompresse les `/ObjStm` Flate, compte les pages |
| P2 | au-delà de 35 lignes, `slice(0, 35)` (`:62`) sans compter les perdues ; somme déclarée sans elles | `linesLost`, `printedLineCount`, point `lignes-perdues`, `controls.sum = 'incomplet'` |
| A3 | le prompt demande de ne « jamais prétendre une certitude de 100 % » (`prompts.ts:190`) : 7 puces dont 5 d'explication | prompt resserré + deux suppressions prouvées par le code (§ 2.7) |
| C4 | (conforme) HT + TVA = TTC seulement si les trois sont lus ; HT calculé jamais présenté comme lu | **rien à changer** ; un test garde-fou (vert avant et après) ; seul changement : l'écart devient aussi un point typé `ht-tva-ttc` |

## 2. Changements (fichier, fonction)

Tout le code vit dans `functions/src/invoiceScanCore.ts` et `functions/src/prompts.ts` : je ne possède aucun autre fichier de `functions/src`.
Les fonctions de contrôle sont **exportées** (testables seules) et pures. Montants = centimes entiers (`toCents`), jamais de float comparé.

### 2.1 Le contrat du point typé (ajouté au résultat ; `issues` reste rempli comme aujourd'hui)

Résultat de `normalizeInvoiceScan` : tout ce qui existe + **ajouts facultatifs** (un ancien consommateur les ignore ; aucun champ retiré).

```ts
// functions/src/invoiceScanCore.ts
export const SCAN_POINT_CODES = [
  'ligne-montant',        // C1  quantité × prix ≠ montant de la ligne
  'somme-ecart',          // C2  somme des lignes ≠ total TTC imprimé
  'somme-incomplete',     // C2b + P2  le total ne peut pas être vérifié (ligne sans montant lisible, ou lignes perdues)
  'tva-incoherente',      // C3/A10  le bloc TVA imprimé ne se recoupe pas (détails dans `details`)
  'ht-tva-ttc',           // C4  HT + TVA ≠ TTC (contrôle d'aujourd'hui, désormais typé)
  'lignes-perdues',       // P2  des lignes n'ont pas été conservées
  'pro-forma-non-payee',  // A6  pro-forma sans preuve de paiement : demande de paiement, pas une dépense réglée
  'type-deduit',          // A6  documentType changé par une règle (la valeur lue est gardée dans `lu`)
  'alpha-libelle',        // A9  alphaPct ≠ le pourcentage imprimé dans le libellé
] as const;

export interface ScanPointDetail {          // une relation arithmétique, dans un point `tva-incoherente`
  relation: string;                         // ex. 'base-par-code:N', 'tva-du-taux:R', 'somme-tva', 'somme-bases'
  attendu: number | null; lu: number | null; ecart: number | null;   // centimes
  code?: string;                            // code de TVA concerné (N, R…)
}
export interface ScanPoint {
  code: ScanPointCode;
  gravite: 'ecart' | 'inverifiable';        // ecart = deux nombres lus ne se recoupent pas ; inverifiable = le contrôle ne peut pas tourner
  champ: InvoiceField | 'vat';              // où : champ d'en-tête ('amountTTC', 'tvaAmount', 'items', 'documentType'…) ou 'vat' (bloc par taux)
  ligne: number | null;                     // numéro 1-based de la ligne (id `line-<n>`), null si le point porte sur l'en-tête
  lignes?: number[];                        // plusieurs lignes (somme-incomplete : celles sans montant lisible)
  regle: string;                            // la règle, en français : « quantité × prix unitaire = montant de la ligne »
  attendu: number | null; lu: number | null; ecart: number | null;  // lu − attendu ; unité dans `unite`
  unite: 'centimes' | 'pourcent' | 'lignes' | 'texte';  // 'texte' : attendu/lu = null, valeurs dans `message`
  message: string;                          // la phrase (la même que celle poussée dans `issues`)
  details?: ScanPointDetail[];
}
// Ajoutés au résultat :
points: ScanPoint[];                        // [] si tout se recoupe
controls: {                                 // ce qui a pu être vérifié, pour ne jamais déclarer vérifié ce qui ne l'est pas
  lines: { checked: number; failed: number; skipped: number; skippedIds: string[] };   // C1
  sum: 'ok' | 'ecart' | 'incomplet' | 'non-verifiable';                                // C2/P2
  vat: 'ok' | 'ecart' | 'non-verifiable';                                              // C3/A10
  totals: 'ok' | 'ecart' | 'non-verifiable';                                           // C4 (HT + TVA = TTC)
};
proForma: boolean;                          // A6
vat: Array<{ code: string; rate: number | null; base: number | null; amount: number | null }>;  // A10 : le bloc imprimé, tel quel (taux fraction, montants CHF)
linesLost: number;                          // P2 : lignes non conservées (0 par défaut)
printedLineCount: number | null;            // P2 : nombre de lignes imprimées, annoncé par le modèle
// Ajoutés à chaque ligne de `items` :
vatCode: string;                            // '' si non imprimé ; tel qu'imprimé (N, R, A, 1, «8.1%»…), 10 caractères au plus
vatRate: number | null;                     // fraction si la ligne imprime son taux
alphaPct: number | null;                    // A9, % tel qu'imprimé
```

Règles du contrat (la voie suivante et l'écran s'y fient) :
- `sum === 'ok'` **seulement si** toutes les lignes conservées ont un montant entier en centimes, `linesLost === 0`, le TTC est lu et la somme est égale au centime. Sinon `incomplet` (ligne sans montant, lignes perdues) ou `ecart`. Le total n'est jamais « vérifié » par défaut.
- `non-verifiable` = aucune relation n'a pu être calculée (données absentes). Ce n'est **pas** `ok`, et ce n'est pas un point (rien n'est affiché pour une valeur absente par nature : A3).
- Un `ecart` d'une ligne dit qu'une des trois valeurs (quantité, prix, montant) est fausse, sans dire laquelle : aucune n'est corrigée.
- Les points sont **recalculés** à chaque appel de `normalizeInvoiceScan` à partir des champs lus (`raw.points` / `raw.controls` d'entrée sont ignorés) : `reconcileInvoiceVision` rappelle `normalizeInvoiceScan(merged)` (`invoiceVisionReview.ts:137`) et doit retrouver les mêmes points (test d'idempotence).
- `linesLost` et `printedLineCount` d'entrée sont **repris** au second passage (la seconde normalisation ne peut pas redécouvrir des lignes déjà coupées) : `linesLost = max(raw.items.length − 35, raw.linesLost)`.

### 2.2 `normalizeInvoiceScan` (`invoiceScanCore.ts:59-96`) — forme des lignes et de l'en-tête
- `items` (`:62-67`) : ajouter `vatCode: text(item?.vatCode, 10)`, `vatRate: rate(item?.vatRate)` (nombre dans [0, 1], sinon `null`), `alphaPct: alpha(item?.alphaPct)` (nombre dans ]0, 100], sinon `null`). Une valeur hors plage devient `null` **et** le fait est signalé (point `alpha-libelle` avec `lu`), pas avalé.
- En-tête (`:68-78`) : `proForma: raw?.proForma === true`, `vat: vatRows(raw?.vat)` (au plus 6 lignes ; `code` ≤ 10 caractères ; `rate` dans [0, 1] sinon `null` ; `base` / `amount` nombres finis sinon `null` ; **les valeurs lues ne sont jamais recalculées**), `printedLineCount` (entier ≥ 0 ou `null`), `linesLost`.
- `tvaRate`, `tvaAmount`, `amountHT`, `amountTTC` : inchangés (valeurs lues, `null` si absent).

### 2.3 C1 — `lineMathCheck(items)` (nouvelle, exportée)
Pour chaque ligne conservée avec `quantity`, `price` **et** `amountTTC` non nuls :
- attendu = `quantity × price` en centimes flottants (`q × p × 100`). Lu = `toCents(amountTTC)`.
- Arrondi : la ligne se recoupe si `|lu − attendu| ≤ 0,5 + 1e-9` centime (donc le centime le plus proche ; **si l'attendu tombe pile sur un demi-centime, les deux voisins passent**, car l'arrondi du fournisseur est inconnu : 0,045 × 5 = 0,225 → 0,22 ou 0,23). Aucune autre tolérance.
- Remise (`kind === 'discount'`) : on compare les valeurs absolues (la règle « une remise est négative » est déjà bloquante au client, `purchaseEntry.ts:101`) ; le signe n'est pas jugé ici.
- Ligne **sans prix** (ou sans quantité, ou sans montant) : non vérifiable, **pas de point** (port, forfait, remise en %, ligne sans quantité sont normaux) ; elle est comptée dans `controls.lines.skipped` / `skippedIds`. Une ligne dont le prix ou le montant n'est pas un nombre entier de centimes côté montant (fraction de centime) compte aussi comme non vérifiée.
- Point : `{code:'ligne-montant', gravite:'ecart', champ:'items', ligne:n, regle:'quantité × prix unitaire = montant de la ligne', attendu, lu, ecart, unite:'centimes', message:'Ligne 1 (Maris Otter) : 60 × 2,30 = 138,00, la ligne indique 13,80.'}`. La phrase va aussi dans `issues` (ne contient pas « somme des lignes » : ne déclenche pas à elle seule la 3ᵉ lecture, voir § 4).

### 2.4 C2 et P2 — `sumCheck(items, amountTTC, linesLost)` (nouvelle) remplace `:85-86`
- Plus de tolérance de 5 centimes : égalité en centimes entiers (Σ `toCents(amountTTC)` des lignes, remises incluses, contre `toCents(result.amountTTC)`).
- Si `amountTTC` est `null` : `sum = 'non-verifiable'`, pas de point (le TTC absent a déjà son issue `:81`).
- (a) Toutes les lignes ont un montant entier et `linesLost === 0` : écart ≠ 0 → point `somme-ecart` (même phrase qu'avant : « La somme des lignes ne correspond pas au total TTC. » complétée de l'écart en francs ; elle contient « somme des lignes » donc la 3ᵉ lecture existante se déclenche comme avant, mais maintenant dès 1 centime) ; écart = 0 → `sum = 'ok'`. Si l'écart est de 1 à 5 centimes le message ajoute « (un arrondi imprimé, Rundung, est-il une ligne omise ?) » : c'est la seule trace de l'ancienne tolérance, en indice, pas en laissez-passer.
- (b) Au moins une ligne sans montant lisible : point `somme-incomplete` (`lignes:[…]`, `lu` = somme partielle, `attendu` = TTC, `ecart` omis car une somme partielle n'a pas d'écart honnête), `sum = 'incomplet'`. Phrase : « Total des lignes non vérifiable : N ligne(s) sans montant lisible (lignes …). » (ne contient pas « somme des lignes »).
- (c) `linesLost > 0` : `sum = 'incomplet'` quel que soit le résultat de la somme partielle ; point `lignes-perdues` (§ 2.5). Aucun `somme-ecart` n'est levé dans ce cas, même si la somme partielle dépasse le TTC : des lignes perdues peuvent être des remises, donc `incomplet` seul est honnête (choix prudent, réversible).

### 2.5 P2 — lignes perdues
- `linesLost = max(raw.items.length − 35, raw.linesLost ?? 0, max(0, printedLineCount − items.length))` quand `printedLineCount` est lu. Le troisième terme attrape aussi une omission **sous** 35 lignes si le modèle a annoncé plus de lignes qu'il n'en a transcrit.
- Point `lignes-perdues` : `{gravite:'ecart', champ:'items', attendu: printedLineCount ou raw.items.length, lu: items.length, ecart: -linesLost, unite:'lignes', message:'N ligne(s) du document n'ont pas été conservées (35 au plus) : compléter le détail ; le total n'est pas vérifié.'}`.
- L'issue existante garde son début « Plus de 35 lignes » (`reconcileInvoiceVision` filtre par `startsWith('Plus de 35 lignes')`, `invoiceVisionReview.ts:140`) : « Plus de 35 lignes : N non conservées, compléter le détail manuellement. »
- La limite de 35 ne change pas (client `purchaseEntry.ts:98`, `geminiScanner.ts:62`).

### 2.6 A6 — pro-forma
- Prompt + schéma : `proForma` (booléen, vrai si le document porte « Pro-Forma », « Proforma », « Pro forma »). Consigne : une pro-forma dont le paiement est imprimé est une facture réglée (`documentType: invoice`, `paymentEvidence: paid`), jamais un devis.
- Code : `proForma && paymentEvidence === 'paid' && documentType === 'quote'` → `documentType = 'invoice'` **avec un point** `type-deduit` (`gravite:'ecart'`, `champ:'documentType'`, `unite:'texte'`, message « Pro-forma payée lue comme devis : traitée comme facture (paiement imprimé). »). Le « Devis : vérifier… » (`:89`) n'est pas posé dans ce cas. La valeur lue (« quote ») reste dans le message du point, rien n'est perdu.
- `proForma && paymentEvidence !== 'paid'` : `documentType` inchangé, point `pro-forma-non-payee` (`gravite:'inverifiable'`, message « Pro-forma sans paiement imprimé : demande de paiement, pas une dépense réglée. ») et issue.
- `proForma && documentType === 'invoice' && paid` : aucun point, aucun avertissement (c'est le cas de 372765).
- `DOCUMENT_TYPES` **ne change pas** (le type 'proForma' est un booléen à part ; ajouter une valeur à l'enum casserait `ScannedInvoiceResult.documentType` côté client, hors Possède).
- Hors de ma voie, à signaler (§ 6) : `scannedPayment` (`purchasePrefill.ts:66`) continue de lire « quote + paid → unpaid » si un autre chemin produit ce couple.

### 2.7 A3 — le prompt n'avertit que d'un doute réel (`prompts.ts:178-203`)
Le texte de `scanInvoice.system` change **seulement** là ; les autres tâches ne bougent pas. Remplacements :
- `fieldWarnings` (`:190`) : « fieldWarnings : un avertissement par champ au plus, et seulement pour une valeur **illisible**, **absente alors qu'elle est essentielle** (date, total TTC, fournisseur), ou **confondable** avec une autre (par exemple deux numéros proches). N'ajoute jamais d'avertissement pour une valeur lue sans hésitation, ni pour expliquer où elle est imprimée, ni pour un champ absent par nature (total HT non imprimé, taux unique sur un document à plusieurs taux, intitulé « pro-forma »). Ces cas sont portés par vat, proForma et amountHT = null. La phrase de l'avertissement donne les deux valeurs en cause. » (la phrase « Ne prétends jamais une certitude de 100 % » disparaît).
- `tvaRate` (`:183`) : « tvaRate vaut null si plusieurs taux ; dans ce cas recopie chaque taux dans vat. »
- Même principe pour `ambiguity` (`:201-202`, déjà strict : conservé).
- Nouvelles consignes (courtes) : vat = tableau récapitulatif TVA **imprimé**, tel quel (code, taux fraction, base, montant), `[]` s'il n'y en a pas, aucun calcul ; `vatCode` = lettre ou taux imprimé sur la ligne, `""` sinon ; `alphaPct` = % d'acides alpha imprimé pour un houblon (« Target 11.3% » → 11.3), `null` sinon ; `printedLineCount` = nombre de lignes d'articles imprimées, même si tu n'en transcris que 35 ; un arrondi imprimé (« Rundung », arrondi à 5 centimes) est une ligne à part (`kind: other`, montant signé).
- Deux suppressions prouvées **dans le code** (`normalizeInvoiceScan`, filtre sur `fieldWarnings`), car l'information est désormais portée ailleurs : (i) avertissement `tvaRate` quand `vat.length ≥ 2` (le multi-taux est lu) ; (ii) avertissement `documentType` quand `proForma === true`. Aucune autre suppression ; un avertissement `amountHT` ou `invoiceNumber` reste (le code ne peut pas prouver qu'il est faux ; seul le prompt en réduit le bruit). Limite assumée : l'effet du prompt ne se mesure pas sans appel réel (hors périmètre) ; le plan teste le texte du prompt et les deux suppressions, pas le comportement du modèle.
- Forme des avertissements : **inchangée** (`{field, message}`) : `tests/unit/invoiceVisionReview.test.ts` compare `fieldWarnings` par `toEqual`. Pas de champ `kind` obligatoire (la proposition d1 « rejeter un avertissement sans type » casserait ce test).

### 2.8 Schéma (`prompts.ts:204-244`)
Ajouts : en-tête `proForma` (BOOLEAN), `vat` (ARRAY de `{code: STRING, rate: NUMBER nullable, base: NUMBER nullable, amount: NUMBER nullable}`, tous requis dans l'objet), `printedLineCount` (INTEGER nullable) ; ligne `vatCode` (STRING), `vatRate` (NUMBER nullable, **non requis**), `alphaPct` (NUMBER nullable). Requis d'en-tête : + `proForma`, `vat`, `printedLineCount` ; requis de ligne : + `vatCode`, `alphaPct`. Les mocks d'`invoiceReview.test.ts` ne portent pas ces champs : `normalizeInvoiceScan` doit les accepter absents (défauts : `false`, `[]`, `null`, `''`). Le test d'intégration ne vérifie que `arrayContaining` sur `required` (`:96-97`) : reste vert.
Coût en jetons : environ +12 jetons par ligne (`"vatCode":"R","alphaPct":null`), soit environ +15 % sur les 84 jetons par ligne estimés par d1 ; 35 lignes ≈ 3 400 jetons de sortie pour un plafond de 4 500 (réflexion comprise, `SCAN_MAX_OUTPUT`, `ai.ts` hors Possède). `vatRate` n'est pas requis exprès (il économise 35 × 5 jetons). Risque dit dans § 5.

### 2.9 C3 / A10 — `vatBlockCheck(items, vat, tvaAmount, amountTTC, linesLost)` (nouvelle, exportée)
Quatre relations, calculées seulement quand leurs entrées existent. Le bloc imprimé peut être en base **TTC** (base brute, TVA = base × taux ÷ (1 + taux)) ou **HT** (base nette, TVA = base × taux) : le code ne sait pas laquelle, donc il évalue chaque base et garde celle qui échoue le moins (égalité → TTC, car les lignes sont lues TTC) :

| Relation | Base TTC | Base HT |
|---|---|---|
| R1 TVA du taux | `amount = base × taux ÷ (1+taux)` | `amount = base × taux` |
| R2 somme des TVA | Σ `amount` des lignes du bloc = `tvaAmount` imprimé | idem |
| R3 somme des bases | Σ `base` = `amountTTC` | Σ `base` + Σ `amount` = `amountTTC` |
| R4 bases contre les lignes, par code | `base` = Σ montants des lignes de ce code | `base` = Σ montants − `amount` du taux |

- Égalité au centime partout ; arrondi de R1 comme en C1 (centime le plus proche, demi-centime : deux voisins). R4 n'est tentée que si **toutes** les lignes conservées portent un code (`vatCode` non vide, ou `vatRate` retrouvé dans le bloc) et que `linesLost === 0` ; sinon `inverifiable` pour R4 seule. Jonction ligne ↔ rangée du bloc : `code` égal (insensible à la casse), sinon `taux` égal.
- Un **seul** point par document : `{code:'tva-incoherente', gravite:'ecart', champ:'vat', ligne:null, regle:'TVA imprimée : taux, bases, total et lignes se recoupent', unite:'centimes', attendu: amountTTC, lu: Σ bases, ecart, message:'TVA imprimée incohérente avec les lignes : …', details:[…relations qui échouent…]}`. Pas de six puces (A1).
- `controls.vat` : `ok` (au moins une relation calculée, toutes tenues), `ecart` (au moins une échoue), `non-verifiable` (aucune relation calculable, par exemple `vat = []`). Aucune valeur lue n'est modifiée, `amountHT` reste `null`.
- La phrase d'issue ne contient ni « totaux HT + TVA » ni « Taux TVA incohérent » : elle ne déclenche pas la 3ᵉ lecture (`invoiceVisionReview.ts:151`), qui ne peut rien contre un document incohérent (d1 § 3, d2).
- Taux hors [0, 1] dans l'en-tête : l'issue « Taux TVA incohérent : vérifier le document. » existante est conservée (`:84`).

### 2.10 C4 — `:82-83` (HT + TVA = TTC)
Comportement conservé (tolérance de 2 centimes, comparaison en centimes entiers au lieu de flottants ; même phrase « Les totaux HT + TVA ne correspondent pas au TTC du document. »). S'ajoutent le point `ht-tva-ttc` et `controls.totals`. Aucun HT n'est jamais calculé ni déduit par la lecture.

### 2.11 A9 — α
`alphaPct` repris tel que lu. Recoupement : si le nom ou l'`evidence` imprime un pourcentage (`/(\d{1,2}(?:[.,]\d{1,2})?)\s*%/`) et que `alphaPct` diffère de plus de 0,05 point, ou si `alphaPct` est hors ]0, 100] : point `alpha-libelle` (`gravite:'ecart'`, `unite:'pourcent'`, ligne n). Si `alphaPct` est `null` et que le libellé imprime un %, **rien n'est déduit** (le code n'extrait pas l'α du nom : le nom n'est pas retouché ; l'extraction du libellé vers l'article est l'affaire de la voie stock, sa source étant `alphaPct` quand il est lu).

### 2.12 P1 — `validateInvoiceFile` (`:31-39`) → `countPdfPages(bytes)` (nouvelle, exportée)
- Texte de base = le PDF en latin1. Pour chaque flux dont le dictionnaire (du `obj` précédent au mot `stream`) contient `/Type /ObjStm`, `/FlateDecode` et ni `/DecodeParms` (prédicteur) ni autre `/Filter` : `zlib.inflateSync(flux, { maxOutputLength: 4 Mo })` (le CR/LF final est toléré : vérifié, `inflateSync` l'ignore). Le contenu décodé est découpé en objets avec la table `/N` paires de nombres, `/First` du dictionnaire.
- Objets du fichier = objets en clair (découpés au `endobj`) + objets décodés. Pages = nombre d'objets portant `/Type /Page` (pas `/Pages`) ; arbre = `/Count` pris **seulement** dans les objets portant `/Type /Pages` (un `/Count` d'`/Outlines` n'est plus pris pour un nombre de pages : faux refus d'aujourd'hui évité).
- Accepté si `1 ≤ pages ≤ 4` et tout `/Count` d'arbre ≤ 4. Refusé (même message qu'aujourd'hui) si : `/Encrypt` ; un `/ObjStm` qu'on ne sait pas décoder (filtre autre que Flate, prédicteur, décompression en erreur ou plus de 4 Mo, plus de 200 flux, total décodé > 16 Mo) ; `pages < 1` ; `pages > 4`. Le message de refus > 4 pages reste « Sélectionne un justificatif de 4 pages maximum. ».
- Tests existants (`invoiceScanCore.test.ts:29-31`) : `'/Type /Pages /Count 2 /Type /Page /Type /Page'` accepté (un seul « objet », Count 2, 2 pages) ; `'/Count 5'` refusé ; `'/Type /ObjStm /Type /Page'` refusé (aucun flux décodable) : **inchangés, restent verts**.
- Limite : je ne détecte pas une page « fantôme » dans une mise à jour incrémentale ; le comptage peut alors **sur**-compter (refus prudent), jamais sous-compter.

### 2.13 Version du registre
`INVOICE_SCAN_VERSION` : `'invoice-v4'` → **`'invoice-v5'`** (`invoiceScanCore.ts:4`). Raison : le format du résultat change (points, controls, vat, items enrichis) et le schéma de sortie du modèle aussi ; `invoiceScanId` (`:43-45`) hache la version, donc une lecture `invoice-v4` en cache n'est plus servie sous le nouveau format (nouvelle réservation / nouvel appel, une fois par document déjà lu — assumé : la justesse avant la vitesse). Trois références à `'invoice-v4'` sont **hors de ma voie** et restent en l'état, sans casser de test : `src/services/purchaseEntry.ts:237` (`scanProvenance.promptVersion`, écrit dans la dépense), `tests/unit/purchaseEntry.test.ts:16`, `scripts/eval-expense-vision.mjs:142` (garde-fou qui lèvera « invoice-v4 attendu » : script d'évaluation Gemini réel, jamais lancé ici). Voir § 6, décision 2.

## 3. Tests qui échouent d'abord (L13)

Dossier `tests/unit/depense/lecture/` (créé) ; chaque test est écrit et lancé **avant** la correction, sa sortie va dans RESULTAT.md sous « TEMOIN AVANT : ». Tous sur fixtures, `normalizeInvoiceScan`, `validateInvoiceFile`, `TASKS.scanInvoice` : aucun appel réseau, Gemini simulé (objets JSON).

Fixtures dans `tests/unit/depense/lecture/fixtures/` (sans nom ni adresse) : `verite-372765.json` (copie de `diagnostic/d1/verite-facture-372765.json`, qui ne contient ni nom ni adresse du client) et `lecture-372765.json` : la lecture simulée d1 (`lecture-simulee-372765.json`) complétée, **ligne à ligne par un script de génération gardé dans la voie** (`generer-fixture.mjs`, écrit avec Write), de `vatCode` (code N/R de la colonne « Code »), `alphaPct` (les 9 houblons), `vat` (le bloc imprimé tel que lu : N 8.1 % base 26,20 TVA 1,95 ; R 2.6 % base 84,20 TVA 2,20), `proForma: true`, `printedLineCount: 23`. Les quatre `fieldWarnings` d'origine restent dans la fixture (pire cas du modèle).

| Fichier de test | Cas (entrée → attendu) | Échoue aujourd'hui parce que |
|---|---|---|
| `lignes.test.ts` (C1) | ligne 1 de la vérité avec quantité 60 → `points` contient `ligne-montant`, `ligne:1`, `attendu:13800`, `lu:1380`, `ecart:-12420` ; les 23 lignes vraies → 0 point, `controls.lines.checked = 23` ; remise (`discount`, qté 1, prix 2, montant −2) → 0 point ; ligne sans prix → 0 point, `skipped` = 1 et son id ; 0,045 × 30 = 1,35 → ok ; 0,045 × 5 → 0,22 **et** 0,23 passent, 0,24 non ; `issues` contient la phrase | `points` n'existe pas ; `issues: []` |
| `somme.test.ts` (C2, P2) | ligne 2 à 0,63 → `somme-ecart`, `ecart:+3`, `sum:'ecart'`, indice « Rundung » ; ligne 4 sans montant → `somme-incomplete`, `lignes:[4]`, `sum:'incomplet'` ; 23 lignes vraies → `sum:'ok'` ; 36 lignes → `linesLost:1`, `lignes-perdues`, `sum:'incomplet'` même si la somme des 35 vaut le TTC ; `printedLineCount:25` et 23 transcrites → `linesLost:2` ; deuxième passage `normalizeInvoiceScan(résultat)` → mêmes `points` et même `linesLost` | tolérance 5 cts (0,63 ne lève rien), silence (b), `slice(0,35)` sans compte |
| `tva.test.ts` (C3, A10, C4) | bloc de la vérité (26,20 / 84,20 ; 1,95 / 2,20 ; `tvaAmount` 2,80 ; TTC 86,50 ; codes N/R) → exactement **un** point `tva-incoherente` avec `details` pour R2 (4,15 ≠ 2,80), R3 (110,40 ≠ 86,50), R4 N et R (26,20 ≠ 11,20 ; 84,20 ≠ 75,30) et R1 des deux taux ; `controls.vat:'ecart'` ; `tvaAmount === 2.8`, `amountHT === null`, `amountTTC === 86.5`, `vat` identique à l'entrée (rien corrigé) ; bloc **cohérent** construit pour le test (base brute 108,10 taux 8,1 % TVA 8,10 ; une ligne de 108,10 code N ; TTC 108,10) → 0 point, `vat:'ok'` ; même bloc en base nette → `ok` ; `vat: []` → `non-verifiable`, 0 point ; garde-fou C4 : HT null + TVA 4,15 + TTC 86,50 → `amountHT` reste `null` ; HT 83,70 + TVA 4,15 + TTC 86,50 → point `ht-tva-ttc` et la phrase « ne correspondent pas » (vert avant et après pour la phrase) | `vat`, `points`, `controls` n'existent pas ; `vat` n'est pas lu |
| `document.test.ts` (A6, A9, A3) | `proForma:true`, `quote`, `paid` → `documentType:'invoice'`, point `type-deduit`, pas d'issue « Devis » ; `proForma`, `invoice`, `paid` → 0 point ; `proForma`, `unknown` → `pro-forma-non-payee` ; ligne « Target 11.3% » avec `alphaPct:11.3` → conservé, 0 point ; avec 11.8 → `alpha-libelle` ; avec 250 → `null` + point ; avertissements de la fixture 372765 → `tvaRate` et `documentType` retirés, `amountHT` et `invoiceNumber` conservés ; le texte `TASKS.scanInvoice.system` ne contient plus « certitude de 100 % » et contient « illisible », « confondable », « vat », « printedLineCount », « Rundung » ; `schema.properties` porte `proForma`, `vat`, `printedLineCount` et `items.items.properties` porte `vatCode`, `alphaPct`, avec les requis annoncés ; les **autres** tâches de `prompts.ts` ne bougent pas : vérifié par `git diff` (seul le bloc `scanInvoice` change), pas par un test | pas de champ ni de règle |
| `pdf.test.ts` (P1) | PDF 1.5 construit dans le test avec `zlib.deflateSync` : 1 page dans un `/ObjStm` Flate → accepté ; 5 pages dans l'`/ObjStm` → refusé (« 4 pages ») ; `/ObjStm` avec un flux non Flate → refusé ; flux corrompu → refusé ; bombe (flux dont la sortie dépasse 4 Mo) → refusé ; `/Encrypt` → refusé ; PDF d'une page avec `/Outlines … /Count 12` en clair → accepté ; `/Pages … /Count 5` → refusé ; 4 Mo + 1 octet → refusé (inchangé) | `/ObjStm` toujours refusé |
| `facture-372765.test.ts` (lecture simulée de sa facture) | `normalizeInvoiceScan(lecture-372765)` ; **champ par champ** contre `verite-372765.json` : 23 lignes, pour chacune `reference = code`, `name = libelle`, `quantity`, `unit`, `price`, `amountTTC`, `vatCode = codeTva`, `alphaPct = attendu.alphaPct ?? null` ; en-tête : `invoiceNumber`, `orderNumber`, `date`, `currency`, `amountTTC 86.5`, `amountHT null`, `tvaRate null`, `tvaAmount 2.8`, `proForma true`, `documentType invoice`, `paymentEvidence paid` ; `controls = {lines:{checked:23,failed:0,skipped:0}, sum:'ok', vat:'ecart', totals:'non-verifiable'}` ; `points` = exactement 1 (`tva-incoherente`) ; `issues` gagne la phrase TVA ; `linesLost 0` ; `reconcileInvoiceVision` sur trois copies → les mêmes `points` (1) | rien n'existe |

Tests existants à garder verts, **sans les modifier** quand ils sont hors de mon Possède : `tests/unit/invoiceVisionReview.test.ts`, `tests/unit/purchasePrefill.test.ts`, `tests/unit/purchaseEntry.test.ts`, `tests/integration/invoiceReview.test.ts` (rejoué à chaque étape ; il contient `first.items[1] = {…items[0], quantity: 2, amountTTC: 50}` à la ligne 180, ligne dont prix 500 × 2 ≠ 50 : elle lèvera un point `ligne-montant` mais ce test compare des statuts de vote, pas `points` ; si un statut change, je m'arrête et je le dis). `tests/unit/invoiceScanCore.test.ts` (dans mon Possède) : ajouter, sans retirer, un cas par défaut simple ; ses assertions actuelles ne changent pas.

Gate G1 : `npx tsc -p functions/tsconfig.json --noEmit` (strict ; `any` du paramètre `raw` conservé).

## 4. Risques

| Risque | Traitement |
|---|---|
| **Données existantes** : une dépense déjà enregistrée porte `lines` sans `vatCode`, `alphaPct`, etc. | rien n'est lu par la fonction de lecture à l'enregistrement ; tous les ajouts sont facultatifs ; aucun champ Firestore touché (la lecture n'écrit pas dans Firestore ; les résultats en cache `invoice-v4` ne sont plus servis, ils ne sont ni modifiés ni supprimés) |
| **Lecture en cache** au nouveau format | version `invoice-v5` (§ 2.13) |
| **Hors ligne / double clic** | hors de ma voie : la fonction est pure et sans E/S ; aucun état, rien à rejouer. Le contrôle est déterministe : deux appels sur la même entrée donnent le même résultat (test d'idempotence) |
| **Arrondis** | tout en centimes entiers ; produit quantité × prix arrondi au centime le plus proche, demi-centime : les deux voisins passent (§ 2.3) ; plus de tolérance de 5 centimes ; TVA : égalité au centime, rien de recalculé ; seule tolérance conservée : 2 centimes pour HT + TVA = TTC (C4, conforme, HT et TVA arrondis chacun) |
| **Faux positifs C1** : prix imprimé arrondi alors que le montant vient d'un prix plus précis (prix 0,0333 affiché 0,03) | le point dit « une des trois valeurs est fausse », pas laquelle ; il ne corrige rien ; il apparaît avec l'écart en centimes ; le client exige de toute façon l'égalité de la somme (`purchaseEntry.ts:102`) |
| **Troisième lecture** : plus d'écarts de somme (dès 1 centime) → plus de troisièmes lectures payantes | borné par `SCAN_MAX_CALLS = 3` et par le budget existant (`invoiceScanBudget.ts`) ; les nouveaux points `ligne-montant`, `tva-incoherente`, `somme-incomplete`, `lignes-perdues` ne déclenchent **pas** la 3ᵉ lecture (le test de déclenchement `invoiceVisionReview.ts:151` lit des phrases) ; proposé à la voie suivante de lire `points` (§ 6) |
| **Plafond de sortie 4 500 jetons** | +15 % de jetons par ligne ; 35 lignes ≈ 3 400 jetons selon l'estimation d1 (3,2 caractères par jeton) ; le plafond est celui de `ai.ts` (hors Possède). Non mesuré en réel (aucun appel). À mesurer au test réel. Si le plafond est dépassé : `finishReason ≠ STOP` → « Lecture incomplète » (existant) |
| **Prompt** : l'effet de A3 sur le bruit ne se prouve pas hors appel réel | testé : texte du prompt + suppressions par le code ; dit dans RESULTAT.md comme limite |
| **Réponse d'un ancien mock** sans les nouveaux champs | défauts (`false`, `[]`, `null`, `''`) ; tests d'intégration inchangés |
| **Fixture** | aucune donnée du brasseur : la vérité d1 ne porte ni nom ni adresse (vérifié par grep « Lieferadresse » : seul un numéro sans nom) ; je ne lis pas `brasseur/` |
| **Décompression de PDF** | `maxOutputLength` 4 Mo par flux, 200 flux et 16 Mo décodés au plus ; entrée déjà bornée à 4 Mo ; tout échec = refus avec le message habituel |

## 5. Hors périmètre (ne pas faire)
Rapprochement des lectures, troisième lecture, journaux par lecture, statut « à confirmer » (`invoiceVisionReview.ts`, `ai.ts`) ; l'écran ;
`geminiScanner.ts`, `purchasePrefill.ts`, `purchaseEntry.ts`, `stockLineMatching.ts` ; réduction d'image, autre modèle, réflexion plus faible ;
`SCAN_MAX_OUTPUT` ; tout appel réel ; `eval-expense-vision.mjs`. Les autres prompts de `prompts.ts` ne bougent pas.

## 6. DÉCISIONS À PRENDRE (pilote) et passages de relais

1. **Le client perd les nouveaux champs.** `GeminiScannerService.normalizeResult` (`geminiScanner.ts:42-60`) reconstruit le résultat champ par champ et jette `points`, `controls`, `vat`, `proForma`, `linesLost`, `vatCode`, `alphaPct`. Tant qu'une voie ne l'étend pas, l'écran ne verra rien. Option A (recommandée) : la voie qui rapproche les lectures / le statut ajoute le passage de ces champs et leur type dans `ScannedInvoiceResult`. Option B : je le fais ici (hors Possède : refusé par le contrat).
2. **Trois références à `'invoice-v4'` hors de ma voie** : `purchaseEntry.ts:237`, son test `:16`, `eval-expense-vision.mjs:142`. Option A (recommandée) : je bump `INVOICE_SCAN_VERSION` à `invoice-v5` et je laisse les trois en l'état, la voie qui écrit `purchaseEntry.ts` met `'invoice-v5'` avec son test ; le script d'évaluation est mis à jour par le pilote. Option B : ne pas bumper (refusé par VOIE.md : le format change).
3. **Pro-forma payée lue « devis »** : le plan corrige à la source (le serveur ramène 'quote' → 'invoice' avec un point `type-deduit`, la valeur lue reste dans le point). Alternative, sans toucher une valeur lue : le laisser à `scannedPayment` (`purchasePrefill.ts:66`, « la preuve de paiement lue l'emporte sur le type »). Recommandation : les deux (défense en profondeur) ; la seconde est hors de ma voie.
4. **Troisième lecture** : `invoiceVisionReview.ts:151` ne regarde que des phrases (`totaux HT + TVA|somme des lignes|Taux TVA incohérent`). Recommandation à la voie suivante : lire `points[].gravite === 'ecart'` sur `ligne-montant` / `somme-ecart` (une lecture erronée d'un chiffre se corrige par un nouveau vote) et **jamais** sur `tva-incoherente` ni `lignes-perdues` (un document incohérent ne se corrige pas par relecture).
5. **Rejeter un avertissement sans type** (proposition d1) : écartée ici, car `invoiceVisionReview.test.ts` compare `fieldWarnings` en `toEqual` ; l'avertissement typé (`kind`, `candidates`) reste possible plus tard comme ajout facultatif.

Pas de `CONNAISSANCE` ni de `LEÇON` à ce stade.

## 7. Ordre du temps 2 (après la revue triée)
1. Écrire les fixtures et les six fichiers de test ; lancer ; sortie dans « TEMOIN AVANT » de RESULTAT.md (chaque défaut échoue ; C4 : vert, garde-fou).
2. Coder dans `invoiceScanCore.ts` (helpers, normalisation, `countPdfPages`, version) puis `prompts.ts` (prompt, schéma).
3. Relancer les six fichiers et G1, G2 ; rejouer `tests/integration/invoiceReview.test.ts`, `tests/unit/purchaseEntry.test.ts`.
4. Relire en expert (facturation suisse : TVA 8,1 / 2,6 / 3,8 %, arrondi 5 centimes, pro-forma, ObjStm) et remplacer la version facile.
5. `RESULTAT.md` : « TEMOIN AVANT », le contrat, la facture 372765 champ par champ, « Rien ne se perd ».
