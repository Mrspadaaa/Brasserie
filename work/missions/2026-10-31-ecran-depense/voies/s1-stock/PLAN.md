# PLAN — voie s1-stock : chaque ligne de facture reliée au bon article, ou à aucun

Mission 2026-10-31-ecran-depense. Plan écrit avant toute ligne de code (COMMUN.md, deux temps). Rien n'est modifié hors de ce dossier.
Portée en une ligne (L01) : l'appariement ligne lue → article de stock de la feuille « Nouvelle dépense » (un seul appelant,
`ExpenseSheet.tsx:151`), plus l'identité d'un produit tirée du libellé. Ni l'enregistrement, ni la création d'une fiche, ni l'écran.

Ses mots : « comme c'est de la facturation, c'est super important, ça doit être très fiable ! » ; « Attention au mapping, on veut pas
de retrouver avec plein de fiche du même produit ». Règle de conduite de tout le plan : **en cas de doute, aucune proposition**.
Une proposition manquée coûte deux secondes (il choisit dans la liste) ; une fausse fait entrer un faux stock (décision 117).

## 0. Ce que j'ai mesuré avant d'écrire (sur HEAD)

- **La chasse du 17.10, ce sont 27 cas** : `work/finalisation-tickets-2026-10-08/REV-JUS1/probe/v3d.hunt.test.ts` (A1-A9, B1-B7, C1-C5,
  D1-D6 ; 9 témoins justes, 18 fausses). Rejouée aujourd'hui depuis son dossier (`npx vitest run -c vitest.hunt.config.ts`) :
  **27 tests, 18 échecs, 9 passés** = exactement le chiffre du 17.10. Ce sont donc les 18 témoins rouges de départ.
  Les 18 en échec : A1-A6 (B-V3-4), B1-B6 (B-V3-5), C1-C4 (fournisseur = variante), D2 (« Crystal 60L »), D4 (« Malt d'avoine »).
- **`proposeStockItem` est une fonction pure et rapide** (jetons, pas de flou) ; les 89 tests existants de `stockLineMatching.test.ts` sont
  verts (d1) et sont ma garde contre la régression.
- **`jus0Journey.test.tsx:186-205`** (`tests/integration/`, hors de mon « Possède ») affirme le contraire de S1 : « ne propose aucun
  article de stock » avec « Malt fumé du Banc » en stock. Il casse dès que la garde se lève → **DÉCISION n° 1 ci-dessous**.
- Le libellé lu par Gemini arrive avec `stockCategory` **vide** (le prompt interdit de l'inventer, `prompts.ts:203`) : la catégorie de la
  ligne n'est donc pas une donnée sûre. La voie l1-lecture peut ajouter `alphaPct`/`cleanName` plus tard ; ce plan n'en dépend pas.

## 1. Défauts visés (7)

| Id | Défaut (preuve d1) | Cause |
|---|---|---|
| S1 | Aucune ligne n'a de proposition : `STOCK_LINE_PROPOSALS_ENABLED=false` (`stockLineMatching.ts:14`), et `ExpenseSheet.tsx:151` n'appelle l'algo que derrière elle | décision 117 ; on ne lève la garde que si les 6 suivants et la chasse sont à 0 fausse |
| S2 = B-V3-4 | « CARAMÜNCH® Typ 2 Kg » n'apparie pas « Caramünch Typ 2 » ; « Typ 1/Typ 3 Kg » apparient « Caramünch Typ » (A1-A6 de la chasse) | `stockLineMatching.ts:67` efface tout « nombre + unité de masse » comme conditionnement |
| B-V3-5 | un houblon/une levure est reçu sur un malt homonyme (B1-B6) ; « Crystal » en g compatible avec « Malt Crystal » en kg | la catégorie n'est jamais comparée ; g et kg sont compatibles (`units.ts:65-72`) |
| S3 | « Target 11.8% » n'apparie pas « Target » ni « Target 11.3% » : l'α fait partie de l'identité | l'α est un jeton du nom |
| A9 | l'α est perdu : pas de champ, il reste figé dans le nom de l'article créé | idem ; ici : α rendu à part avec sa source « libellé » |
| S4 | « Safale US-05 11,5g » 2 Stk n'apparie pas « Safale US-05 » en sachet ; poids 11,5 g laissé dans l'identité | `Units.areCompatible('Stk','sachet')=false` ; le poids est un jeton |
| A8 | « Maris Otter, Kg », « Gerstenflocken, 1 Kg », « CARAMÜNCH® Typ 2 Kg », « Nelson Sauvin ™ 9.6% » : l'unité, le conditionnement, ®, ™ restent dans le nom de la ligne | le prompt demande de recopier la désignation (`prompts.ts:194`) ; rien ne la nettoie côté client |

C1-C4 (le fournisseur retiré des deux côtés efface une vraie variante) et D2/D4 de la chasse ne sont pas des défauts du diagnostic mais
des fausses propositions de la chasse : ils sont corrigés ici parce que le critère est « 0 fausse sur les 27 ».

## 2. Décisions que ce plan tranche (et pourquoi)

Chaque règle ci-dessous est une **restriction** (elle supprime des propositions) sauf l'identité commune (α, récolte, poids de sachet,
équivalence Stk/sachet) que la voie demande. Aucune n'est tirée d'un exemple unique : chacune a un principe.

**R1 — un nombre qui suit un mot d'identité est de l'identité** (S2). Marqueurs, liste fermée : `typ`, `type`, `nr`, `no`, `n°`, `grade`.
Un nombre précédé d'un marqueur n'est jamais un conditionnement, côté ligne et côté article. (« Typ 2 Kg » → jetons `caramunch typ 2`.)

**R2 — un nombre nu devant l'unité n'est un conditionnement que s'il divise la quantité de la ligne** (A5, A6, reste de B-V3-4).
Sur une facture, la quantité est exprimée dans l'unité du montant ; un sac de N kg donne une quantité multiple de N. « Haferflocken, 1 Kg »
× 2 Kg : 1 divise 2 → sac. « Typ 2 Kg » × 1 Kg : 2 ne divise pas 1 → identité (juste sans même R1). « Crystal 150 Kg » × 25 : 150 > 25 →
identité. L'unité du nombre est convertie dans celle de la ligne (`Units.convert`, même famille seulement). Quantité inconnue : la
proposition est déjà refusée (`quantity > 0` exigé). Côté article (pas de quantité), la règle actuelle reste (« Malt Blond 25 kg »,
« Acide phosphorique 5 L »), sauf R1. *Garde-fou* : si le nombre est lu comme conditionnement et que le stock contient un article du même
nom **avec un numéro** (« Carafa 1 » à côté de « Carafa »), la lecture « conditionnement » est refusée : le stock lui-même dit que le
nom se décline en numéros. (A6 reste vrai pour une ligne « Carafa 2 Kg » × 2 Kg.)
→ **Un seul test existant change d'entrée** : `stockLineMatching.test.ts:61` `line('Froment Banc 5 kg')` (quantité par défaut 1, un sac de 5 kg
pour 1 kg est incohérent) devient quantité 5, **attendu inchangé** (DÉCISION n° 4).

**R3 — la catégorie tranche, jamais l'unité** (B-V3-5). `StockLineInput` reçoit `stockCategory?` et `reference?`. Nature de la ligne,
dans cet ordre : (a) `stockCategory` lue, canonisée (`canonicalStockCategory`) ; (b) les mots de catégorie du libellé (`malt|malz` → Malt ;
`houblon|hopfen|hop|hops|pellet|t90` → Houblon ; `levure|hefe|yeast` → Levure ; `sucre` → Sucre) — si deux natures différentes, inconnue ;
(c) le préfixe du code article (`MA…`, `HO…`, `HE…`), **utilisé seulement pour refuser**, jamais pour choisir (convention de ce
fournisseur, d1 : MA0221, HO0102, HE0102). Un article est écarté si sa catégorie canonique et la nature de la ligne sont **toutes deux
dans `STOCK_CATEGORIES`** et différentes. Catégorie inconnue, vide ou « Divers » (ce que crée aujourd'hui `purchaseEntry.ts:222`) : jamais
un motif de refus. Ensuite, comme aujourd'hui : un seul article restant, sinon rien. Deux articles homonymes de catégories différentes et
une ligne sans nature : deux candidats → aucune proposition.

**R4 — α et récolte sortent de l'identité seulement dans le contexte houblon** (S3, A9). Contexte houblon = la catégorie de l'article
candidat est Houblon, ou la nature de la ligne est Houblon. Alors : un nombre suivi de `%` entre 1 et 30 est l'α (jamais « Acide 75% »,
qui reste identité) ; un nombre de 4 chiffres 2000-2039 isolé est la récolte (jamais hors houblon : « Wyeast 2000-… » garde son code) ;
un code pays en capitales de 2 lettres qui suit l'α (« 9.5% CH ») est l'origine, **gardée comme jeton d'identité** (un Cascade US n'est
pas un Cascade NZ) mais exclue du nom propre. L'α de la ligne et celui de l'article (`StockItem.alphaPct`, sinon lu dans son nom) sont
comparés à 0,05 près : différents → la proposition est faite, **marquée « α différente »** (même variété, autre récolte : on ajoute au
lot). Un α absent d'un côté n'est pas une différence. Un α jamais deviné : valeur et `source:'libellé'`.

**R5 — équivalence « à la pièce » dans l'appariement, `units.ts` inchangé** (S4). `Stk`, `Stück`, `stuck`, `pce`, `pcs`, `pc`, `pièce(s)`,
`unité(s)` sont une même unité de pièce ; elle est équivalente à `sachet`/`sachets` **seulement pour un article de catégorie Levure**
(les deux sens). Hors levure, `Stk` ne s'apparie qu'à une pièce. Le résultat porte `unitAlias:{from:'Stk', to:'sachet'}`. Le **poids du
sachet** : sur une ligne à la pièce, « nombre + g|ml » **collé en fin de nom** d'une levure est `pieceWeight` (« 11 g », « 11,5 g ») :
retiré de l'identité, rendu à part (valeur, unité, `source:'libellé'`), **jamais converti** (aucun « 23 g » calculé). Si l'article porte
lui-même un poids dans son nom, les deux doivent être égaux, sinon aucune proposition (500 g ≠ 11 g). Pourquoi l'équivalence ne peut pas
vivre dans `units.ts` : `Units` est lu par les mouvements de stock (`purchaseEntry.ts:226`, `Units.convert`) ; y déclarer Stk = sachet
rendrait la conversion « possible » et donnerait un `null` non géré (`!` à `:226`) ; `convert(2,'Stk','g')` doit rester `null`.
Conséquence pour l'enregistrement : `validatePurchase` (`purchaseEntry.ts:115`, voie s2) refuse encore `Stk` → `sachet`. Donc, **quand
l'alias a servi**, `ExpenseSheet` pose sur la ligne `unit` = l'unité de l'article (« 2 sachet ») et garde « Stk » dans `evidence`
(« unité lue : Stk »). La quantité ne change jamais. (Le choix manuel d'un article en sachets pour une ligne « Stk » reste bloqué :
hors périmètre, à signaler à s2.)

**R6 — le fournisseur ne devient pas une variante** (C1-C4, m-p). Deux passes, la plus stricte d'abord : (1) libellés complets, mots
du fournisseur gardés des deux côtés — un seul article égal → proposé, deux → rien ; (2) seulement si (1) ne trouve rien : on retire
les mots du fournisseur de l'**article** (comme aujourd'hui, décisions 113/114) et, côté **ligne**, seulement ceux qu'un mot de liaison
introduit (`du, de, de la, des, von, bei, chez, by, of` : « Cascade **du Banc** » chez la Malterie du Banc). « Munich Rauch » chez Rauch AG
garde `rauch` et n'apparie pas « Malt Munich ». Les tests des décisions 113/114 (`Froment Banc`, `W-suisse`, `F1-*`) restent vrais : je
les ai déroulés à la main contre les deux passes (§ 7).

**R7 — « 60L » n'est pas « 60 »** (D2). Un nombre suivi d'une unité de mesure **d'une autre famille que celle de la ligne** reste collé
(`60l`), au lieu de perdre son unité comme « générique » : « Crystal 60L » (degrés Lovibond, ligne en kg) ≠ « Crystal 60 ».

**R8 — malté ≠ non malté pour une céréale qui existe crue** (D4). Si la ligne dit `malt/malz` (mot ou suffixe) et pas l'article, ou
l'inverse, et que le radical est une céréale de la liste fermée (`avoine hafer oat froment ble wheat weizen orge gerste barley seigle
roggen rye mais riz`), pas de proposition. « Pilsner », « Munich » ne sont pas des céréales : « Munich Malt » ↔ « Malt Munich » ↔ « Munich »
restent inchangés.

**R9 — parenthèse = annotation quand un code produit la précède** (levures de la facture). Dans « Safale BE-256 (Abbaye) », le code
`be256` identifie la souche ; « (Abbaye) » est un style. Une parenthèse est ignorée de l'identité si le libellé a, hors parenthèse, un jeton
mêlant lettres et chiffres (`be256`, `us05`, `wlp001`) ; elle reste dans le **nom propre**. Sinon elle reste identité.

**R10 — fabricants de levure ignorables, liste fermée** (« les levures s'apparient quand leur article existe »). `fermentis`, `lallemand`,
`lalbrew`, `danstar` sont ignorés **dans une levure** quand un seul côté les porte (« LALLEMAND Verdant IPA » ↔ « Verdant IPA » ;
« LALLEMAND Windsor » ↔ « LALLEMAND Windsor » reste égal sans rien). Ce n'est **pas** une tolérance de plus pour les autres catégories.
C'est la « suite sûre » nommée dans ARB-M4 (mineurs) ; une marque absente de la liste ne fait que perdre une proposition.
→ DÉCISION n° 2.

**Identité commune** — `src/services/ingredientIdentity.ts` (nouveau, **pur**, sans React ni Firestore), lue d'un libellé en **un seul
passage** : le libellé est découpé en morceaux (mot, nombre+unité, `%`, année, parenthèse, code pays, symbole ®™), chaque morceau reçoit
un **rôle** (`identité | conditionnement | alpha | récolte | poidsPièce | origine | annotation | ignoré`), et on en tire à la fois les
**jetons d'appariement** et le **nom propre** — pour qu'ils ne divergent jamais. Le libellé brut n'est jamais modifié.

```ts
export type Sourced<T> = T & { source: 'libellé' };
export interface ProductIdentity {
  rawLabel: string;                       // intact
  name: string;                           // nom propre : sans ®™, unité, conditionnement, α, récolte, poids de pièce, code pays
  alpha?: Sourced<{ value: number }>;     // en %, jamais deviné
  harvestYear?: Sourced<{ value: number }>;
  packSize?: Sourced<{ value: number; unit: string }>;   // « 1 Kg », « 25 kg »
  pieceWeight?: Sourced<{ value: number; unit: string }>; // « 11,5 g » d'un sachet
  origin?: Sourced<{ code: string }>;
  tokens: string[];                       // pour l'appariement
}
export function readProductLabel(label: string, ctx?: { unit?: string; quantity?: number; hopContext?: boolean; pieceWeightContext?: boolean }): ProductIdentity;
export function inferNature(label: string, reference?: string, stockCategory?: string): { category?: string; source?: 'catégorie lue'|'libellé'|'code article'; weakOnly?: boolean };
export function isPieceUnit(unit: string): boolean;       // Stk, Stück, pce, pcs…
export function pieceUnitsEquivalent(lineUnit: string, itemUnit: string, itemCategory: string): boolean;
```

`stockLineMatching.ts` : `GENERIC`, la règle « mêmes jetons, ordre libre, nom collé, suffixe -malz, un seul article » et
`canonicalStockCategory`/`STOCK_CATEGORIES` **restent**. `tokens()` (`:60-72`) passe par `readProductLabel`. Nouveau :

```ts
export interface StockLineMatch { item: StockItem; identity: ProductIdentity; alphaDiffers?: { line: number; item: number };
  unitAlias?: { from: string; to: string }; pass: 1 | 2 }
export function matchStockLine(line: StockLineInput, items: StockItem[]): StockLineMatch | undefined;
export function proposeStockItem(line, items): StockItem | undefined   // = matchStockLine(...)?.item, signature et exports inchangés
export const STOCK_PROPOSAL_KINDS = ['ingredient','packaging','cleaning'] as const;   // lignes à qui on propose ; « service » jamais (mouture)
```
`StockLineInput` gagne `stockCategory?`, `reference?` (facultatifs : tous les appelants et tests actuels restent valides).

## 3. Changements, fichier par fichier

| Fichier | Fonction | Changement |
|---|---|---|
| `src/services/ingredientIdentity.ts` (nouveau) | `readProductLabel`, `inferNature`, `isPieceUnit`, `pieceUnitsEquivalent` | R1, R2, R4, R5 (poids), R7, R9, R10 ; nom propre (A8) ; α/récolte/poids/origine avec source (A9, S3, S4) |
| `src/services/stockLineMatching.ts` | `tokens` (`:60-72`) | délègue à `readProductLabel`, comportement identique pour les 89 tests sauf R1/R2/R7 |
| idem | `proposeStockItem` (`:89-101`) → `matchStockLine` | deux passes (R6), filtre de nature (R3), compatibilité d'unités + alias (R5), α différente (R4), garde-fou « frère numéroté » (R2), R8 ; `proposeStockItem` devient l'enveloppe |
| idem | `:14` `STOCK_LINE_PROPOSALS_ENABLED` | `true`, commentaire : levée le 31.10 après chasse du 17.10 rejouée à 0 fausse ; l'export reste (`mesures.ts` d1 l'importe) |
| `src/ui/finance/ExpenseSheet.tsx` | l.148-155 de `attach`, **seules lignes touchées** | pour les lignes `STOCK_PROPOSAL_KINDS` : appeler `matchStockLine` avec le **libellé brut** (`[name,variant]`), `stockCategory`, `reference: item.reference`, `vendor` ; à la correspondance : `stockAction:'existing'`, `stockRef`, `unit` = unité de l'article **si et seulement si** `unitAlias`, `proposedStock.current.add(id)` (déjà là). Le **nom propre** remplace `description` pour ces lignes (A8) ; `evidence` reçoit « Libellé : <brut> », puis en clair ce qui a été déduit avec sa source (« α 11,3 % — lu dans le libellé », « récolte 2024 — libellé », « sachet 11,5 g — libellé », « unité lue : Stk », « α différente de l'article : 11,8 % / 11,3 % »). Aucun nouvel état, aucun nouveau ref, rien hors de ces lignes |
| `tests/unit/stockLineMatching.test.ts` | `:61` | quantité 5 pour `Froment Banc 5 kg` (DÉCISION n° 4) ; le reste inchangé ; ajout d'un `describe` « S1-S4 / B-V3-5 » repris de la chasse |
| `tests/unit/depense/stock/` (nouveau) | voir § 4 | fixtures et tests |

`purchaseEntry.ts`, `purchasePrefill.ts`, `units.ts` : **non modifiés** (lecture seule). Aucun champ Firestore ajouté ni retiré : la
proposition vit dans le brouillon en mémoire de la feuille ; ce qui est écrit à « Confirmer » est inchangé (`stockItemRef`, `unit`).

## 4. Tests : écrits et lancés AVANT la correction (L13)

Un dossier `tests/unit/depense/stock/`. **Le témoin avant n'utilise que l'API d'aujourd'hui** (`proposeStockItem`, `ExpenseSheet`), pour
échouer sur un comportement et non sur un import manquant ; les tests du nouveau module s'écrivent avec le code.

| # | Fichier | Contenu (données → attendu) | Rouge sur HEAD ? |
|---|---|---|---|
| T1 | `chasse-17-10.test.ts` | **les 27 cas** (id, libellé, unité, quantité, fournisseur, stock, attendu) transcrits de `v3d.hunt.test.ts`. Chaque cas compte `fausse` (propose ≠ attendu et attendu « rien » ou autre article) ou `manquée` (rien alors qu'un article juste existait). Assertion : `fausses === 0` ; le nombre de `manquées` est imprimé et borné par la liste commentée des pertes assumées | **18 rouges** (A1-A6, B1-B6, C1-C4, D2, D4) |
| T2 | idem | chasse **étendue**, mes propres variantes de chaque règle (pas de relecture par moi seul : la revue en ajoutera) : R2 « Carafa 2 Kg » × 2 Kg avec « Carafa 1 » + « Carafa » → rien ; « Haferflocken, 1 Kg » × 2 → Haferflocken ; R3 « Crystal » sans mot de nature en kg face à « Houblon Crystal » en g avec code `MA…` → rien, sans code et seul candidat → inchangé ; R4 « Acide phosphorique 75% » ≠ « …85% » ; « Wyeast 2007 » garde son code ; R5 « Stk » face à une bouteille en pièces ≠ sachet, 11,5 g contre 500 g → rien ; R6 « Cara Munich » chez « Cara Malt SA » ; R8 « Avoine » ↔ « Malt d'avoine » dans les deux sens ; R9 « Crystal (60) » garde 60 ; R10 « Fermentis Windsor » ↔ « Lallemand Windsor » (fabricants différents sur la même souche : voir risque) | une partie rouge sur HEAD, le reste garde les témoins |
| T3 | `facture-372765.test.ts` | fixture **réduite** `lignes-372765.json` (n, code, libellé, quantité, unité, nature attendue, nom propre attendu, α/poids attendus) tirée de `diagnostic/d1/verite-facture-372765.json` sans nom ni adresse (vérifié par `grep` avant la copie) ; stock simulé de `mesures.ts` (16 articles, **simulé**, marqué tel quel). Attendu : les 9 lignes déjà appariées le restent (Maris Otter, Pilsner Malz, Röstgerste, Gerstenflocken, Haferflocken, Weizenmalz hell, Nelson Sauvin 9.6 %, Sabro 13.4 %, Motueka 8.1 %) ; en plus : Caramünch Typ 2 (S2), Target 11.3 % et Galaxy 17.2 % (S3), Windsor, Safale BE-256, SafAle US-05, Verdant IPA (S4, R9, R10) ; **rien** pour Goldings East Kent et Hallertauer Blanc (absents) ; **rien** pour les 5 « Zuschlag Schrotung » (kind service, non éligibles + libellé sans article) | rouge sur HEAD pour les 7 lignes nouvelles (avec garde levée par un `import`), vert pour les 9 |
| T4 | `s3-s4-variantes.test.ts` | S3 : « Target 11.8% » ↔ « Target 11.3% » → proposé, `alphaDiffers {11.8, 11.3}` ; ↔ « Target » → proposé sans différence ; « Target 11.3% » ↔ « Target 11.8% » idem. S4 : « Safale US-05 11,5g » 2 Stk ↔ « Safale US-05 » en sachet → proposé, `unitAlias`, poids 11,5 g source « libellé », **aucune conversion** ; la même chose avec « Stk » et un article « Stk » ; `Units.convert(2,'Stk','g') === null` (preuve que `units.ts` n'a pas bougé) | rouge sur HEAD (`proposeStockItem` rend `undefined`) |
| T5 | `a8-a9-ecran.test.tsx` (jsdom, mêmes simulations de modules que `jus0Journey.test.tsx`) | `ExpenseSheet` + lecture simulée de la facture (`lecture-simulee-372765.reconciliee.json`) + stock simulé ; **Gemini jamais appelé** (`scanDocument` mocké). Attendu à la lecture : ligne 1 `description` « Maris Otter », `evidence` contenant « Libellé : Maris Otter, Kg », proposée « Maris Otter » (`Stock ligne 1` = `existing`) ; ligne 6 « Caramünch Typ 2 » ; ligne 8 `description` « Target », `evidence` « α 11,3 % — lu dans le libellé » ; ligne 12 `unit` « sachet », `evidence` « unité lue : Stk » ; lignes de mouture `Stock ligne n` = `none` ; Goldings `none` ; **aucune écriture** (`savePurchaseWithProof` non appelé) ; | rouge sur HEAD (description « Maris Otter, Kg », `none` partout) |
| T6 | idem | « un choix qu'il a fait n'est jamais remplacé » : après lecture, il passe la ligne 1 à « Aucun » puis à un autre article, modifie le total, la date ; un nouveau rendu ne remet pas la proposition ; seule une **nouvelle lecture** (« Changer ») repart de zéro, comme aujourd'hui (`ExpenseSheet.tsx:132`) | vert/rouge selon l'ordre : écrit avec T5 |
| T7 | `identite.test.ts` | A8 : nom propre des 18 lignes de stock = `nomPropre` de la vérité (sauf « Hallertauer Blanc 9.5% CH » : nom « Hallertauer Blanc », origine CH) ; A9 : α et sa source ; `rawLabel` intact ; un α absent n'est jamais 0 ; « Acide 75% » pas d'α | écrit avec le module |
| T8 | `perf.test.ts` | 500 articles × 35 lignes en moins de 250 ms (le moteur est synchrone sur le fil de l'UI) | — |

Les 89 tests existants + `purchaseEntry.test.ts` + `purchasePrefill.test.ts` (G2) restent verts. Sortie du témoin dans RESULTAT.md sous
« TEMOIN AVANT : » : le journal de `npx vitest run tests/unit/depense/stock/chasse-17-10.test.ts … ` sur le code d'aujourd'hui
(attendu : « 18 fausses » et le détail A1-A6, B1-B6, C1-C4, D2, D4, plus les 7 lignes de la facture).

**Forme du rejeu** : `npx vitest run tests/unit/stockLineMatching.test.ts tests/unit/depense/stock tests/unit/purchaseEntry.test.ts
tests/unit/purchasePrefill.test.ts --maxWorkers=2` (G2), `npm run build` (G1). Les anciens tests d'intégration voisins
(`tests/integration/expenseSheet.test.tsx`, `jus0Journey.test.tsx`) sont rejoués à part : le premier doit rester vert (lignes
« autre » : pas de proposition, pas de changement de `description`), le second est la DÉCISION n° 1.

## 5. Risques

| Risque | Parade |
|---|---|
| **Données existantes** : articles déjà créés « Target 11.3% » (α dans le nom), « Divers » (S6), « Caramünch Typ 2 », levures en `sachet` | α retirée des deux côtés en contexte houblon (R4) : « Target 11.3% » reste proposé pour « Target » ; catégorie « Divers »/vide n'écarte rien (R3) ; aucun article n'est réécrit ni renommé ; une dépense enregistrée avant reste lisible (le plan ne touche ni `purchaseEntry` ni Firestore) |
| **Fausse proposition qui passe** | 27 cas + chasse étendue (T2) ; la revue à deux regards ajoute les siens ; trois essais par critère, sinon ECHEC |
| **Hors ligne** | l'algo est synchrone et local (`StorageService.getStocks()`, cache Dexie) ; pas de réseau pour apparier ; stock vide → rien |
| **Double clic / rafales** | la proposition n'est calculée qu'une fois par lecture, dans `attach` verrouillé par `scanLocked` ; `proposedStock` est vidé à chaque lecture (`:149`) ; aucune écriture avant « Confirmer » (T5/T6) |
| **Arrondis** | aucun montant n'est touché ; α comparé à 0,05 près sur des décimales lues en chaîne ; « divise la quantité » à 1e-9 près après conversion d'unité (1 g ≠ 0,001 kg en flottants) |
| **Alias d'unité** : la ligne dit « sachet » ou « Stk » après la proposition | `unit` ne change que si l'alias a servi, la quantité jamais ; l'original reste dans `evidence` ; le brasseur voit « 2 sachet » dans la ligne |
| **Perte de rappel** (manquées) | assumée et comptée à part : marques hors liste, EBC, parenthèse sans code, quantité non multiple. Elle ne bloque rien |
| **Fabricant sur une même souche** (R10) : « Fermentis Windsor »/« Lallemand Windsor » | un article par fabricant n'existe presque jamais ; si les deux sont au stock, deux candidats → rien. À défaut de R10, Verdant IPA devient une manquée |
| **Mots du fournisseur dans le nom d'un article** (reste de m-q) : un article « Malt Munich Rauch » (fournisseur Rauch) et une ligne « Munich » chez Rauch AG sont toujours égaux en passe 2 | **non corrigé ici** (décisions 113/114 et le test `Froment Banc` le veulent) ; DÉCISION n° 6 |
| Les 89 tests existants cassent par effet de bord de R1/R2/R7 | prédit à la main : seul `:61` change d'entrée (§ 3). Si un autre casse au code, je m'arrête et je le dis au pilote : aucun attendu n'est réécrit pour faire passer |
| `jus0Journey` | DÉCISION n° 1 |
| Le moteur sur de gros stocks | T8 ; jetons de chaque article recalculés par ligne : si la mesure dépasse, mémoïsation par appel (un `Map` local) |

## 6. Hors périmètre

L'enregistrement (prix, mouture rattachée au malt S5, catégorie/unité d'un article créé S6, `unitPriceCents`) : voie s2. La **création**
d'une fiche et la recherche d'un produit nouveau : voie suivante, qui réutilisera `readProductLabel`/`matchStockLine` (même identité, donc
pas de doublon). L'écran de la dépense (variantes à choisir par le brasseur). `purchaseEntry.ts:115` (refus `Stk` → `sachet` pour un choix
manuel) et `purchasePrefill.ts`. `units.ts`. Toute modification de `functions/` : l'α lu par le schéma (`alphaPct`) et un `cleanName` serveur
sont l'affaire de l1-lecture ; `readProductLabel` s'y branchera sans changement.

## 7. Vérifications à la main faites pour ce plan (pas encore du code)

- Les 27 cas ont été dépouillés un à un contre R1-R8 : A1-A4 (R1, aussi R2), A5-A6 (R2 + frère numéroté), B1-B6 (R3 : `T90 Pellets`,
  `Houblon`, `Levure`, `Hefe` donnent la nature), C1-C4 (R6), D2 (R7), D4 (R8) deviennent « rien » ; A7-A9, B7, C5, D1, D3, D5, D6 restent des
  témoins. **D5 « Cascade · 2024 » ↔ « Houblon Cascade »** : « rien (perte assumée) » le 17.10 ; la consigne de cette voie (la récolte sort
  de l'identité) le rend **proposé, récolte 2024 rendue à part**. Ce n'est pas une fausse proposition (même houblon) : l'attendu change
  et je le dis ici (DÉCISION n° 5).
- Passes de R6 déroulées sur `Froment Banc 5 kg` (passe 1), `Froment` chez la Malterie du Banc (passe 2), `Cascade pellets` ↔ « Houblon
  Cascade du Banc » (passe 2), `Levure S-04` ↔ « Levure du Banc S-04 » (passe 2), `F1-cara` (rien), `W-suisse` (passe 2) : toutes comme
  aujourd'hui.
- Le stock simulé de d1 est **simulé** (noms d'après `StockPreview.tsx`) : le test le dit ; on ne prouve rien sur les vrais articles
  du brasseur (voir doute).

## 8. Décisions à prendre par le pilote avant le code

1. **`tests/integration/jus0Journey.test.tsx:186-205`** asserte « aucune proposition » (décision 117) et casse à la levée de la garde.
   Options : (a) m'ajouter ce seul `it` à mon « Possède » pour le retourner (« propose Malt fumé du Banc, marque proposé, aucune écriture ») ;
   (b) le retourner toi-même ; (c) garder la garde fermée (alors S1 n'est pas tenu). **Recommandation : (a)**, le test devient la preuve
   parcours de S1.
2. **R10 (fabricants de levure ignorables)** : 7e tolérance au sens d'ARB-M4 (« décision numérotée »). Sans elle, « LALLEMAND Verdant IPA »
   reste une manquée et le critère « les levures s'apparient quand leur article existe » n'est pas tenu pour Verdant. **Recommandation :
   oui, liste fermée de 4**.
3. **A8 dans l'écran** : remplacer `description` par le nom propre pour les lignes de stock (le libellé brut reste dans `evidence`).
   Alternative : ne rien changer à `description`, ne rendre le nom propre que par `readProductLabel`. **Recommandation : remplacer** : c'est
   le nom que prendrait l'article créé (`purchaseEntry.ts:222`) et « Maris Otter, Kg » y est faux. Se limite aux lignes ingrédient/emballage/
   nettoyage ; une ligne « autre » ou « service » garde son libellé.
4. **`stockLineMatching.test.ts:61`** : quantité 1 → 5 sur `Froment Banc 5 kg`, attendu inchangé (R2). Sans R2, A5/A6 ne tombent pas.
5. **D5 « Cascade · 2024 »** : attendu « rien » → « proposé avec récolte rendue à part » (consigne S3/A9). Alternative : garder « rien »
   (la récolte reste identité) et accepter que « Cascade 2024 » soit une manquée ; mais alors « Target 11.8% » (α d'une autre récolte) et
   la récolte ne sortent pas ensemble de l'identité, contre la consigne. **Recommandation : proposé.**
6. **Mots du fournisseur dans le nom d'un article (reste de m-q)** : garder (décisions 113/114, test `Froment Banc`) ou refuser dès que
   le mot du fournisseur n'est pas introduit par une liaison ni présent dans `item.supplier` (casse `Froment Banc`, ligne `:65`).
   **Recommandation : garder, et le dire** (aucun cas de la facture ni de la chasse ; la création copie `supplier` depuis la facture, donc le
   cas demande un nom d'article contenant le fournisseur ET une ligne qui ne le contient pas).

## 9. Ordre de travail après la revue

1. Écrire T1-T3 (API actuelle), les lancer, enregistrer « TEMOIN AVANT » (18 + 7).
2. `ingredientIdentity.ts` + T7 ; `matchStockLine` ; vert sur T1-T4 et les 89.
3. Lever la garde ; l'appel dans `ExpenseSheet` (l.148-155 seulement) ; T5/T6 ; `jus0Journey` selon la décision n° 1.
4. G1 (`npm run build`), G2, chasse relancée depuis son dossier d'origine (doit donner 26/27 verts + D5 relabellé), `git status --short`.
5. RESULTAT.md : « 0 fausse proposition », nombre de manquées, « Rien ne se perd », « 372765 ».

## Doutes et limites déjà connus

- Le vrai stock du brasseur n'est pas connu : « 0 fausse » est prouvé sur 27 cas + mes variantes + la facture 372765 contre un stock
  **simulé**, pas sur ses articles. Les noms réels (« Maris Otter », « Safale US-05 11,5 g »…) peuvent exposer une classe nouvelle.
  Parade : le marquage « proposé » reste visible et rien n'entre en stock sans « Confirmer ».
- L'α d'un article est `StockItem.alphaPct` quand il existe, sinon lu dans son nom ; si l'article porte l'α dans le nom et dans le champ
  avec des valeurs différentes, je prends le champ.
- Gemini n'est jamais appelé : la lecture simulée de d1 fait foi (`lecture-simulee-372765.reconciliee.json`).

---

# 10. Version corrigée selon REVUE-PLAN.md (31.10) — **prime sur les § 2 à 9 ci-dessus partout où elle les contredit**

Règle du pilote qui gouverne tout : **une proposition perdue est permise, une fausse ne l'est pas ; dans le doute, rien.** Chaque ligne
ci-dessous nomme le numéro de la revue (Co = Conception, Pr = Prêt à coder).

**Mesure préalable faite (Pilote : « rejoue tout `tests/integration` sur HEAD avec la garde levée »).** Garde passée à `true`, rien
d'autre changé : `npx vitest run tests/integration --maxWorkers=2`, journal complet et liste des fichiers rouges dans RESULTAT.md
(« REJEU INTEGRATION »). Le sort de chaque `it` qui change est dit là, après rejeu réel (Co 9, Pr 2).

| Réf. revue | Ce qui change dans le plan |
|---|---|
| Co 4, Pr 4 | **`description` reste TOUJOURS le libellé brut.** Le § 3 « nom propre dans `description` » et la décision n° 3 sont supprimés. `readProductLabel().name` sert à l'appariement et à la future fiche produit ; il est livré et testé (T7), pas branché sur l'écran. `evidence` garde `Réf.` puis l'extrait, puis, **seulement si l'identité a déduit quelque chose**, `Libellé : <brut>` puis les faits déduits avec leur source (« α 11,3 % (libellé) », « récolte 2024 (libellé) », « poids du sachet 11,5 g (libellé) », « unité lue : Stk ») : ordre `Réf. · extrait · Libellé : brut · déduit` (Pr 7). Rien n'est perdu : le brut n'est jamais remplacé. L'α ne va pas à l'article créé (`purchaseEntry.ts:222`, écriture de `alphaPct`) : voie fiche produit / S6 |
| Pr 1 | **Casse** : `name` garde la casse imprimée, sans ®™ (« CARAMÜNCH Typ 2 », « LALLEMAND Windsor »). Toute comparaison (appariement, T5, T7) est sans casse ni accents (`normalize`). Aucune règle de casse inventée |
| Co 3 | **R2 remplacée** : un nombre suivi d'une unité de la famille de la ligne n'est un conditionnement que s'il est **séparé du nom par une virgule ou un point médian (·) ET s'il divise la quantité** de la ligne (côté article, qui n'a pas de quantité : séparateur seul). **Sans séparateur : identité**, et « 25 kg » reste du texte incertain dans le nom propre (Co 13). Le garde-fou « frère numéroté » reste. **Propositions perdues par cette règle** (liste exacte et comptée dans RESULTAT.md, §« pertes assumées ») : tout libellé à sac collé, du type « Malt Blond 25 kg », « Munich Malt 25 kg », « CARAMUNICH 25 kg », « Sucre roux 25kg », « Blond Malt 25 kg », « Acide phosphorique 20 L » ↔ « … 5 L », « Froment Banc 5 kg », et l'article « Malt Blond 25 kg » pour la ligne « Blond ». Leurs `it` dans `stockLineMatching.test.ts` passent de « proposé » à « rien » (perte permise), avec la variante à virgule (« Malt Blond, 25 kg ») ajoutée en positif. Aucun n'est supprimé |
| Co 1, Co 2 | **R3 complétée**. (a) *Nature inconnue* : l'article est refusé si l'identité de son nom (jetons, mots génériques exclus) est **aussi un nom connu d'une autre catégorie** : noms de houblons du catalogue du dépôt (`src/data/hopDatabaseBootstrap.json`, 219 noms extraits par `voies/s1-stock/extraire-noms-houblons.mjs`, embarqués dans `ingredientIdentity.ts` : le JSON de 1,1 Mo est chargé à la demande par l'app, jamais dans le paquet principal), liste fermée de malts et de levures écrite dans le même fichier, et autres articles du stock de catégorie différente et même identité. Test : « Crystal » kg face à « Houblon Crystal » g → rien ; « Crystal » face à « Malt Crystal » → rien. Limite écrite : un homonyme absent de ces listes passe encore (nature inconnue, un seul candidat). (b) **`kind` ↔ catégorie** : `ingredient` refuse Emballage, CIP alcalin, CIP acide, Désinfectant, Détergent, Sols, EPI ; `cleaning` refuse Malt, Houblon, Levure, Sucre ; `packaging` refuse Malt, Houblon, Levure, Sucre ; catégorie inconnue, « Divers », Consommable, Additif : jamais un refus. Tests « Acide lactique » (CIP acide), « Sel » (Détergent) |
| Co 5 | **R4 corrigée** : α ou récolte **connues des deux côtés et différentes → aucune proposition** (plus de présélection avec marque). α d'un côté seulement, ou égale : proposé. La marque « α différente » et `alphaDiffers` disparaissent. Tests : « Target 11.8% » ↔ « Target 11.3% » → rien ; « Cascade 2024 » ↔ « Cascade 2023 » → rien ; « Cascade 2024 » ↔ « Houblon Cascade » (sans récolte) → proposé, récolte 2024 dans `evidence`. L'identité (`readProductLabel`) donne bien le même `name` « Target » pour 11.3 et 11.8, avec leurs α séparées |
| Co 6 | **R5 corrigée** : le poids du sachet est lu aussi côté article (dans son nom ; `yeastLot` ne porte aucun poids de sachet, vérifié). Ligne avec poids, article avec poids différent → rien ; **ligne sans poids et article avec poids → rien** ; ligne avec poids et article sans poids → **proposé avec la marque « poids du sachet non confirmé »**, rendue par `lineStatus` (`ExpenseSheet.tsx`, ligne repliée) : drapeau porté par l'ensemble `proposedStock` (clé `<id>#poids`, vidée avec lui à chaque lecture), aucun nouvel état. Hors pièces (article en g/kg) : le poids n'est qu'une indication, jamais une différence |
| Co 7 | **R9 limitée à la nature Levure** (contexte levure, voir Pr 3) ; un jeton de `GENERIC` (`t90`, `type`) ne compte jamais comme code. Tests : « Cascade T90 (Cryo) » ↔ « Houblon Cascade » → rien ; « Pilsner (bio) » ↔ « Malt Pilsner » → rien |
| Co 8 | **R8** : liste de céréales complétée (FR/DE/EN) : avoine hafer oat oats ; froment blé ble wheat weizen ; orge gerste barley ; seigle roggen rye ; épeautre dinkel spelt ; sarrasin buchweizen buckwheat ; millet hirse ; sorgho sorghum ; triticale ; maïs mais corn ; riz reis rice ; kamut. Un test par céréale, deux sens. Limite écrite : un grain hors liste reste une fausse proposition possible (jamais rencontré) |
| Co 10 | **Contestée par le pilote** : la passe 2 du fournisseur est gardée (« Munich » chez Rauch AG ↔ « Malt Munich Rauch » reste proposé, c'est le produit de ce fournisseur). Test miroir verrouillé avec commentaire, sans marque |
| Co 11 | **R10** : un fabricant (fermentis, lallemand, lalbrew, danstar) n'est ignoré que si le reste du nom porte un code de souche (lettres + chiffres, hors `GENERIC`) ou une souche de la liste fermée (windsor, nottingham, verdant ipa, voss, belle saison, kveik, ...). « Lallemand Abbaye » ↔ « Abbaye » reste refusé |
| Co 12 | `StockLineMatch.originalUnit` est rendu. **Limite assumée** : le rétablir quand le brasseur écarte la proposition demande une écriture dans `updateLine` (l. 84 d'`ExpenseSheet.tsx`), hors de mon Possède. Je ne la fais pas ; l'unité lue reste lisible dans `evidence` (« unité lue : Stk ») et je demande la ligne 84 au pilote (DÉCISION n° 7) |
| Co 13 | `readProductLabel` distingue : *identité certaine* (marqueur typ/type/nr, α, poids, année, conditionnement séparé qui divise) et *incertain* (« 25 kg » collé) ; le nom propre garde le texte incertain : « Pilsner 25 kg » ↔ nom « Pilsner 25 kg » |
| Pr 3 | **Contexte houblon** : nature Houblon (mot du libellé ou catégorie lue), ou catégorie de l'article candidat Houblon, ou un mot du libellé (au pluriel près) parmi les noms de houblons du catalogue (premier mot compris : « Hallertauer », « Goldings »). **Contexte levure** : nature Levure, ou catégorie candidate Levure, ou un jeton de la liste fermée de souches/codes. Le contexte sert à l'identité (α, récolte, poids, parenthèse, fabricant), **jamais seul à proposer** |
| Pr 5 | T5 : `Stock ligne n` n'existe que pour les lignes de stock ; `queryByLabelText('Stock ligne n')` vaut `null` pour une ligne `service` (mouture) |
| Pr 6 | **Lignes d'`ExpenseSheet.tsx` écrites** : l'import (l. 12), `attach` (l. 148 à 155), `lineStatus` (vers l. 196, la marque du poids). `s2` n'écrit rien dans ce fichier ; la voie r1 branchera ce qui vient de s2 après s1. Rien d'autre |
| Pr 8 | **Table des unités de pièce** (aucune autre équivalence) : groupe PIÈCE = {`stk`, `stuck` (Stück), `pce`, `pces`, `pcs`, `pc`, `piece`, `pieces`, `unite`, `unites`} ; groupe SACHET = {`sachet`, `sachets`}. Deux unités d'un même groupe sont la même unité. PIÈCE ↔ SACHET : équivalentes **seulement si la catégorie de l'article est Levure** (les deux sens). Autre catégorie : « Stk » face à une bouteille en `pièce` → compatible (même groupe), « Stk » face à un article en `sachet` non levure → refusé. `Units`/`units.ts` : inchangés |
| Pr 9 | T1 : **un `it` par cas** (27), comme `v3d.hunt.test.ts`, pour voir 18 rouges et non un seul |
| Pr 10 | Fixtures **copiées** dans `tests/unit/depense/stock/fixtures/` : stock simulé de d1 (16 articles, marqué SIMULÉ), `lignes-372765.json` (réduit : pas de nom ni d'adresse), lecture réconciliée de d1 pour T5. `mesures.ts` n'est jamais importé |
| Pr 11 | T8 : borne à 1 s pour 500 articles × 35 lignes (aucune assertion de ms plus fine) |
| Pr 12 | Risque assumé écrit : le préfixe de code `MA`/`HO`/`HE` (R3 c) est la convention de ce fournisseur ; il ne fait que **refuser** — au pire une proposition perdue, permise |
| Pr 13 | `functions/src/prompts.ts` (chemin complet) |

**Décisions du § 8 après tri du pilote** : 1 jus0Journey (a) avec C3 (`:55-69`) → les deux `it` deviennent « proposé, aucune écriture » ;
2 R10 acceptée avec Co 11 ; 3 refusée ; 4 `:61` : le cas « Froment Banc 5 kg » passe en « rien » sous la règle du séparateur (l'entrée
quantité reste telle quelle, plus de besoin) ; 5 acceptée seulement sans récolte connue différente ; 6 gardée. **Nouvelle DÉCISION n° 7** :
rétablir l'unité lue (ligne 84, `updateLine`).

---

# 11. Les unités (D213, D214) — ajoutées avant le code ; **remplacent la gestion d'unité des § 2 R5 et § 10 Co 12**

Ses mots : « oui attention au unités » (D213) ; « Unité illisible : la ligne n'est reliée à aucun article.???? » (D214, qui refuse la
règle D213 n° 4 « une ligne sans unité lisible n'est reliée à rien »).

- **L'unité imprimée n'est jamais réécrite.** Le plan du § 2 R5 (poser `unit` = l'unité de l'article quand l'alias a servi) et Co 12
  (`originalUnit` à rendre) tombent : `ExpenseSheet` ne touche plus `unit`. Rien à « faire revenir » quand le brasseur écarte la proposition :
  l'unité n'a pas bougé (test `unites.test.ts`).
- **La conversion se voit** : `formatUnitLink(quantité, unité lue, unité de l'article, catégorie)` rend « 25 kg → 25 000 g » (convertible) ou
  « 2 Stk = 2 sachet » (même pièce, levure), sinon rien ; `lineStatus` l'ajoute à la ligne repliée d'une ligne reliée (proposée ou choisie).
  La conversion elle-même reste celle de `savePurchase` (`Units.convert`) : aucune quantité n'est réécrite ici.
- **« Crystal » kg face au seul « Houblon Crystal » g → rien** : nature inconnue + identité aussi connue du catalogue des malts (R3 a),
  testé dans `unites.test.ts`, `chasse-etendue.test.ts` (E5, E6) et `chasse-17-10.test.ts` (B1-B3).
- **D214, lecture étroite** : une ligne dont l'unité est illisible (`''`, espaces, `-`, `?`, un nombre seul, `…`) reste proposée, aux mêmes
  conditions (nom, nature, catégorie, α, récolte, poids de levure, homonyme, quantité > 0) ; l'unité absente n'assouplit rien ; aucune unité
  n'est devinée ni recopiée depuis l'article (champ « Unité ligne n » vide) ; `lineStatus` porte « unité à préciser » ; une unité lisible mais
  incompatible (Stk face à un malt en kg) reste « rien ». Tests écrits d'abord, rouges sur la règle refusée (`temoin-avant.txt`), puis verts.
- **À l'enregistrement** (lu, pas modifié : `purchaseEntry.ts` est à s2) : `validatePurchase` refuse toute ligne liée sans unité
  (`purchaseEntry.ts:201`, « indique la quantité reçue et son unité »), et `:205` refuse une unité non convertible (« Stk ne se convertit pas
  en sachet »). Donc rien n'entre en stock tant que l'unité manque ou ne se convertit pas ; `:343` (`Units.convert(...)!`) n'est jamais atteint
  avec une unité vide. Le garde explicite « rien n'entre en stock tant que l'unité manque » est donc déjà là ; la voie r1 le rendra lisible.
