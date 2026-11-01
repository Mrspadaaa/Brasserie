# PLAN — voie s6-fiche (D215, D216) — 19 points — version corrigée selon REVUE-PLAN.md (T1 à T13)

Lu avant d'écrire : VOIE.md, GATES.md, COMMUN.md, D215, D216, D229, `critique/VERDICT-port.md` n° 4 et 13, `e-port/RESULTAT.md` (R6, R9), `ingredientIdentity.ts`, `stockLineMatching.ts`, `purchaseEntry.ts`
(l. 401-407, 436-441), `ui/depense/etat.ts`, `ExpenseSheet.tsx` (l. 187-194, 328, 343, 350-362), `donneesApp.ts`, `data.ts`, `noms.ts`, les catalogues, puis `REVUE-PLAN.md`, `REVUE-conception.md`, `REVUE-pret.md`.
Base rejouée : 12 fichiers, 541 tests verts (`tests/unit/depense/stock`, `purchaseEntry`, `stockLineMatching`, `depense/ecran/etat` et `tri`). Aucun code écrit ; le code commence quand le pilote le dit, après le commit de l'écran Dépense.
Possède étendu (VOIE.md, GATES.md) : `donneesApp.ts` et son test (le seul retrait de `bis`), `ingredientIdentity.ts` (le seul mot `export` d'`ORIGINS`), `tri.test.tsx` (la seule attente de la ligne 68).

## 1. Défauts visés
| id | défaut sur HEAD (preuve) |
|---|---|
| F1 | Le bouton dit `Créer « {line.description.trim()} »` : « Target 11.3% », jamais « Target bis » (`ExpenseSheet.tsx:358` ; `tri.test.tsx:68`) |
| F2 | Le voisin n'existe que si la ligne porte un α (`etat.ts:142`) : « Cascade CH » face à « Cascade US » n'a ni voisin, ni bouton, ni lien |
| F3 | L'article neuf est écrit `name: line.description.trim()` (`purchaseEntry.ts:406`) : « Target 11.3% », « Maris Otter, Kg » ; l'α n'est jamais dans `alphaPct`, l'EBC jamais dans `colorEbc` |
| F4 | `StockItem` n'a aucun lien vers une fiche ; rien n'est cherché dans les catalogues à la création |
| F5 | La règle « même produit, autre α » existe trois fois : `matchStockLine` (`stockLineMatching.ts:188-190`), `memeProduit` (`etat.ts:83`), `voisinDe` (`etat.ts:139`) (R9) |
| F6 | Un article « X bis » ne serait jamais retrouvé à la facture suivante (jetons `[x, bis]`) : chaque achat refabriquerait un article (« plein de fiches du même produit ») |
| F7 | Le nom de l'article neuf n'est pas modifiable à l'écran |
| F8 | Menu « Créer un nouvel article » sur une ligne ambiguë : `savePurchase` retombe sur `name = description` et écrit un doublon exact (Conception 6) |
| F9 | « Münchner Malz 15 EBC » : l'EBC reste dans le nom et dans les jetons ; face à « Münchner Malz » la famille est vide, jamais un « bis » (Prêt 1) |
| F10 | La famille par `name` laisse « Houblon Cascade 6% » hors de « Cascade 8% » : un « Cascade » neuf sans « bis » à côté du même produit (Conception 3) |

## 2. La règle unique (exportée par `stockLineMatching.ts`)
Une fonction pure `regleProduit` ; ses briques vivent dans `src/domain/stock/donnees.ts` (lectures) et sont réexportées. `voisinDe` et `memeProduit` (etat.ts) en deviennent des enveloppes : leurs signatures et leurs tests d'`etat.test.ts` ne changent pas.

### Signatures (TypeScript)
```ts
// src/domain/stock/donnees.ts
export type Ecart = 'alpha' | 'origine' | 'recolte' | 'ebc' | 'poids';
export type Contexte = 'Houblon' | 'Malt' | 'Levure' | 'autre';
export const SEUIL_ALPHA = 0.05;            // points d'α, comme s1
export const SEUIL_EBC = 1;                 // points d'EBC (constante nommée, T10)
export interface DonneesProduit { alpha?: number; origine?: string; recolte?: number; ebc?: number; poids?: string /* weightKey */ }
export interface Empan<T> { value: T; debut: number; fin: number }       // position dans le libellé, pour le retirer du nom
export function lireEbc(libelle: string): Empan<number> | undefined;        // « 15 EBC », « EBC 15 » ; « 8-12 », « EBC 8 à 12 » : inconnu
export function lireOrigine(libelle: string, contexte: Contexte): Empan<string> | undefined; // code de ORIGINS en capitales, dernier mot ou après α/récolte ; jamais « US-05 »
export function nomPropre(libelle: string, contexte: Contexte): string;     // T1, point 4
export function ecartsEntre(ligne: DonneesProduit, article: DonneesProduit): Ecart[]; // connues des deux côtés ET différentes

// src/services/stockLineMatching.ts
export interface LigneProduit { description: string; unit: string; quantity?: number; vendor?: string; stockCategory?: string; reference?: string; kind?: string }
export function contexteDe(l: Pick<LigneProduit, 'description' | 'stockCategory' | 'reference'>): Contexte;  // comme s1 : hasHopWord, inferNature
export function donneesDeLigne(l: LigneProduit): { contexte: Contexte; jetons: string[]; donnees: DonneesProduit; nom: string };
export function donneesDArticle(a: StockItem): { contexte: Contexte; jetons: string[]; donnees: DonneesProduit; nom: string };
export interface MembreVirtuel { nom: string }       // une ligne `new` déjà décidée du même brouillon (T4) : compte pour le suffixe, jamais pour `meme`
export type RegleProduit =
  | { cas: 'inconnu'; nom: string }
  | { cas: 'meme'; article: StockItem }
  | { cas: 'incertain'; voisin: StockItem; nom: string; connuUnSeulCote: Ecart[] }
  | { cas: 'ambigu'; candidats: StockItem[]; nom: string }
  | { cas: 'neuf'; nom: string; ecarts: Ecart[]; voisin: StockItem; motif: 'origine' | 'bis' };
export function regleProduit(ligne: LigneProduit, stock: readonly StockItem[], brouillon?: readonly MembreVirtuel[]): RegleProduit;
```

### Les cinq cas (T2)
- **Famille** (sur les jetons, comme s1) : `sameName` des jetons de la ligne et de l'article, avec les génériques, les fournisseurs et les passes 1 et 2 de s1 (code partagé avec `examine`, pas copié). On retire en plus des jetons de la famille :
  le code d'origine, `bis( \d+)?` et les jetons d'EBC (`15`, `ebc`). « Houblon Cascade 6% » est donc de la famille de « Cascade 8% » ; « Cascade Cryo » reste hors famille (descripteur de s1). Mêmes refus de catégorie que s1 (`KIND_REFUSES`, nature, homonymes d'une autre catégorie).
- **Écarts** : seuls comptent les écarts de données connues **des deux côtés** (α ≥ `SEUIL_ALPHA`, origine, récolte, EBC ≥ `SEUIL_EBC`, poids de pièce). Connue d'un seul côté : jamais un écart.
- `inconnu` : famille vide. `meme` : **seulement si `matchStockLine` relie ce même article** (inclusion : `meme` ⊆ s1). `neuf` : tous les membres ont au moins un écart. `ambigu` : au moins deux membres sans écart et s1 ne relie pas (« Target » sans α face à « Target » et « Target bis »).
  `incertain` : un seul membre sans écart, que s1 ne relie pas (donnée connue d'un seul côté, unité non liable) : **aucun lien automatique** ; le brasseur voit « Relier à … » et « Créer … ».
- `voisinDe` = `neuf`, `incertain` ou `ambigu` → le voisin (le membre à l'écart le plus petit, puis le premier du stock) ; `memeProduit` = `meme` → l'article. Changement de sens, dit : `memeProduit` relie moins qu'avant (R6 reliait « le premier de même nom »).
- **R7 devient une implication** : `matchStockLine` relie ⇒ `regleProduit` rend `meme` du même article, testée sur 40 paires nommées ; les paires `incertain` sont écrites une par une, dont Hallertauer (ligne 11 du tableau) et Münchner (ligne 13).

## 3. Les données comparées et leurs sources
| donnée | côté ligne | côté article | contexte |
|---|---|---|---|
| α | `readProductLabel(…).alpha` | `item.alphaPct ?? readProductLabel(name).alpha` | houblon |
| récolte | `.harvestYear` | `readProductLabel(name).harvestYear` | houblon |
| origine | `.origin` (après α ou récolte), sinon `lireOrigine` | `item.origin ?? lireOrigine(name)` (« Cascade US », « Hallertauer Blanc DE 9.5% ») | houblon et malt |
| EBC | `lireEbc` | `item.colorEbc ?? lireEbc(name)?.value` | malt |
| poids de pièce | `.pieceWeight` | `readProductLabel(name).pieceWeight` | levure, pièces |
Les codes d'origine lus sont ceux d'`ORIGINS` (13 : CH DE US NZ AU UK GB CZ SI FR PL AT BE) ; les autres (« CHE », « ES », « IT ») restent inconnus : une proposition perdue, permise. `ORIGINS` est **exporté** de `ingredientIdentity.ts`
(le seul mot `export`, T12) pour ne pas dupliquer la liste ; autres lecteurs de codes d'origine : `origineDuNom` (`donneesApp.ts`, 2 ou 3 capitales, sa propre expression) et la table `PAYS` de `MarquesVue.tsx` ; aucun n'importe `ORIGINS`.
`lireOrigine` et `lireEbc` sont écrits avec Write, puis `node --check` et des tests qui exercent les expressions (L26). **Honnêteté** : la facture 372765 n'imprime aucun EBC ; la forme (sèche, liquide) n'est imprimée nulle part
et n'est pas lue : non comparée. `scan.alphaPct` / `alphaPctLu` (`geminiScanner.ts:15`) ne sont pas recopiés dans la ligne du brouillon : un seul α, celui du libellé (comme s1).

## 4. Le nom propre et la table des noms (T1, T12)
`nomPropre(libelle, contexte)` part de `readProductLabel(libelle, …).name` et en retire : `N EBC` / `EBC N` (par l'empan de `lireEbc`), le code d'origine en queue (empan de `lireOrigine`) et `bis( \d+)?` final. Il sert à la **famille** (côté jetons, point 2)
et au **nom proposé**. Pour un houblon ou un malt seulement, « houblon » étant ce que s1 dit houblon (`hasHopWord`, nature) : un houblon hors des 219 noms, sans catégorie lue, garde son libellé, sans α ni « bis » (proposition perdue). La récolte reste dans
le nom (« Citra 2025 ») faute de champ. Tout le reste (levure, sucre, emballage, catégorie inconnue) : `description.trim()` comme aujourd'hui.
**Nom candidat** : écart d'**origine** connu sur la ligne (au moins un membre diffère par l'origine) → `{nomPropre} {CODE}` (D216, « l'origine d'abord », écarts mixtes compris) ; sinon écart → `{nomPropre} bis` ; `incertain` et `ambigu` : le nom propre, plus le code d'origine si la ligne
en a un. **Nom libre** (T4) : tant que le candidat est pris (nom plié, tout le stock **et** les lignes `new` déjà décidées du brouillon), on ajoute `bis`, puis `bis 2`, `bis 3`… (« bis 2 » = hypothèse du pilote : une constante). Pour un houblon ou un malt, `regleProduit`
rend donc **toujours** un nom libre, y compris pour `ambigu` et `incertain`.
| # | ligne | stock | cas | nom proposé | écrit en plus |
|---|---|---|---|---|---|
| 1 | Target 11.3 %, g | Target, α 11,8 | neuf (α) | **Target bis** | alphaPct 11,3 ; fiche Target, exacte |
| 2 | Target 11.3 %, g | Target 11,8 et Target bis (alphaPct 11,3) | meme | (relié à Target bis) | — |
| 3 | Target 12.5 %, g | Target 11,8 et Target bis 11,3 | neuf (α) | **Target bis 2** | alphaPct 12,5 |
| 4 | Target, g (sans α) | Target 11,8 et Target bis 11,3 | ambigu | pas de bouton « Créer » ; le menu « Créer un nouvel article » donne **Target bis 2** | — |
| 5 | Cascade CH, g | Cascade US | neuf (origine) | **Cascade CH** | origin CH ; fiche Cascade (États-Unis), **approchée** |
| 6 | Cascade 8 % CH, g | Cascade US | neuf (origine) | **Cascade CH** | alphaPct 8 ; origin CH ; approchée |
| 7 | Cascade CH, g | « Cascade » avec `origin` CH (écrit par S6) | meme | relié | — |
| 8 | Cascade CH 6 %, g | Cascade US et « Cascade CH » (α 8) | neuf (origine d'abord, nom pris) | **Cascade CH bis** | alphaPct 6 ; origin CH |
| 9 | Hallertauer Blanc 9.5 % CH, g | Hallertauer Blanc DE 9.5 % | neuf (origine) | **Hallertauer Blanc CH** | origin CH ; fiche Hallertau Blanc (Allemagne), approchée |
| 10 | Hallertauer Blanc 9.5 % CH, g | Hallertauer Blanc, α 9,0, origine inconnue | neuf (α seul) | **Hallertauer Blanc bis** | alphaPct 9,5 ; origin CH ; approchée (origine ≠ fiche) |
| 11 | Hallertauer Blanc 9.0 % CH, g | Hallertauer Blanc, α 9,0, origine inconnue | **incertain** (origine connue d'un seul côté) | **proposé** : « Relier à Hallertauer Blanc » ou « Créer « Hallertauer Blanc CH » » ; aucun lien automatique | — |
| 12 | Münchner Malz 15 EBC, kg | Münchner Malz, colorEbc 20 | neuf (EBC) | **Münchner Malz bis** | colorEbc 15 ; fiche munich-malt (nom canonique : exacte) |
| 13 | Münchner Malz 15 EBC, kg | Münchner Malz, colorEbc inconnu | **incertain** | **proposé** : « Relier à Münchner Malz » ou « Créer « Münchner Malz bis » » | — |
| 14 | Sabro® 13.4 %, g | rien | inconnu | **Sabro** | alphaPct 13,4 ; fiche Sabro (catalogue plein) |
| 15 | Maris Otter, Kg, 6 (menu « Créer ») | rien | inconnu | **Maris Otter** (avant : « Maris Otter, Kg ») | fiche maris-otter-malt, exacte |
| 16 | Safale US-05 11,5g, Stk | Safale US-05 11 g | neuf (poids) | **Safale US-05 11,5g** (poids déjà dans le nom : pas de suffixe) | pas de fiche (T11) |
| 17 | Produit inconnu des catalogues | rien | inconnu | description.trim() (hors houblon/malt) | aucune fiche |
| 18 | Houblon Cascade 6 % → ligne « Cascade 8% » | « Houblon Cascade 6% » | neuf (α) | **Cascade bis** | alphaPct 8 |
| 19 | Münchner Malz 15 EBC | ancien « Münchner Malz 20 EBC » (sans colorEbc) | neuf (EBC lu dans le nom) | **Münchner Malz bis** | colorEbc 15 |
| 20 | Deux lignes « Target 12 % » dans la même saisie, Target 11,8 au stock | — | neuf, puis neuf avec membre virtuel | **Target bis**, puis **Target bis 2** | — |
Chaque ligne est un test de `tests/unit/depense/fiche/noms.test.ts`. Le nom tapé par le brasseur prime toujours (point 9).

## 5. Retrouver l'article écrit par S6, sans fausse proposition (F6, T5)
Dans `matchStockLine`, sans changer ses autres règles : (a) `bis( \d+)?` final est retiré des jetons d'un **article seulement s'il porte au moins une donnée écrite par S6** (`alphaPct`, `origin`, `colorEbc` ou `fiche`) et s'il reste un jeton ;
un « Target bis » nu (créé à la main) garde ses jetons ; (b) si l'article porte `origin` et que son nom ne l'écrit pas, le code est ajouté à ses jetons (« Cascade » + origin CH ≡ « Cascade CH »). Tests : « Target bis » nu → `undefined` ;
« Target bis » à `alphaPct` 11,3 → relié ; « Cascade » origin CH ← « Cascade CH » ; puis `chasse-17-10` et `chasse-etendue` rejoués (0 fausse proposition, 1 manquée A9).

## 6. Les champs ajoutés et l'article neuf dérivé (T3, T9)
Types (`src/types/index.ts`, facultatifs) :
- `StockItem.origin?: string` : code pays en capitales lu sur la facture (« CH »).
- `StockItem.fiche?: { id: string; approchee: boolean }` : `id` du catalogue (`beermaverick-cascade`, `munich-malt`). Le nom affiché (« Cascade US ») se **lit** dans le catalogue à partir de l'id. `approchee` est **gardée telle que jugée à la création**, parce que les valeurs
  lues sur la facture (l'origine, l'EBC) ne sont pas toutes gardées sur l'article ; la relire plus tard donnerait une autre réponse.
- `PurchaseLineDraft.articleName?: string` : **le seul état gardé**, le nom tapé par le brasseur, jamais écrasé. Aucun autre champ `article*` n'est stocké dans le brouillon.
**L'article neuf est dérivé, jamais gardé** : une fonction pure
```ts
// src/domain/stock/articleNeuf.ts
export interface Catalogues { houblons?: readonly CatalogueHop[]; /* catalogue plein, ou rien */ }
export interface ArticleNeuf { regle: RegleProduit; name: string; alphaPct?: number; colorEbc?: number; origin?: string; fiche?: { id: string; approchee: boolean }; voisin?: StockItem }
export function articleNeufDe(ligne: LigneProduit, stock: readonly StockItem[], catalogues: Catalogues, nomTape?: string, brouillon?: readonly MembreVirtuel[]): ArticleNeuf;
```
est appelée **aux mêmes trois endroits** par l'écran pour afficher (bouton « Créer », menu « Créer un nouvel article » / champ nom, pastille) et **par l'enregistrement** (`savePurchase`) sur la ligne et le stock **courants** : ce qui est montré est ce qui est écrit. Un libellé modifié après « Créer » écrit les
valeurs du nouveau libellé ; le nom tapé reste. Pour un houblon ou un malt, l'enregistrement applique `articleNeufDe` à toute ligne `new` ; pour les autres produits, seul `articleName` (tapé) change le nom : comportement de HEAD sinon.
Aucune règle Firestore à changer (`firestore.rules.template:178`). Aucune migration : les articles existants n'ont pas ces clés. Une clé absente n'est pas écrite.

## 7. L'écriture (`purchaseEntry.ts`, la seule création de l'article neuf)
Extraire `newStockItem(line, draft, ref, derive: ArticleNeuf | undefined)` (pure, exportée) de l'`push` de la l. 406. `savePurchase(draft, options?: { catalogues?: Catalogues })` l'appelle à la même place, dans le même ordre d'écritures, avec les mêmes `ref`, quantité, unité, `supplier`,
mouvement `receipt-…` et `stockItemRef`. Elle y ajoute, seulement si présents : `name`, `alphaPct`, `colorEbc`, `origin`, `fiche`. Le stock lu est celui de `validatePurchaseCommit` ; les lignes `new` des index précédents sont les membres virtuels.
`savePurchaseWithProofReceipt` (déjà asynchrone) **attend** `chargerCataloguePlein()` avant d'écrire ; s'il échoue, aucun `catalogues` n'est passé : **aucune fiche** (proposition perdue), jamais une fiche différente selon le moment. `savePurchase(draft)` seul (tests, sync) : pas de fiche.
`validatePurchaseCommit` refuse (T4) : un `articleName` donné **vide** ou **déjà pris** (stock ou autre ligne `new` du même brouillon), avec un message vrai (« Un article porte déjà ce nom : relie-le ou change le nom »). Un nom absent n'est jamais refusé pour un houblon ou un malt : la dérivation donne toujours un nom libre.
Idempotence (`submitted`, `replayable`, marqueur `movements/purchase-…`) inchangée : la même saisie rejouée n'écrit pas deux articles. Aucun appel de service ajouté ni retiré : mêmes `put`, `adjustNumber`, `addStockItem`.

## 8. La fiche la plus proche, catalogue par catalogue (jamais Gemini, jamais le réseau)
Module pur `src/domain/stock/fiche.ts`, catalogues passés en argument. `export function ficheLaPlusProche(nom: string, contexte: Contexte, origine: string | undefined, alpha: number | undefined, ebc: number | undefined, cat: Catalogues): { id: string; nom: string; approchee: boolean } | undefined`.
| catalogue | source | recherche | marque « approchée » |
|---|---|---|---|
| houblons | `CatalogueHop[]` **plein** (505 : 317 + ajouts c6), chargé par `chargerCataloguePlein()` (`data.ts:134` → `chargerAjouts`, `data.ts:119`) ; `cataloguePleinCharge()` (`data.ts:109`) le rend s'il est arrivé. Origine de la fiche : `CatalogueHop.origin` (`data.ts:47`, `string | null`, en français : « États-Unis ») ; variété par `varieteDe(nom, catalogue)` (`donneesApp.ts`) | d'abord le nom **avec** l'origine (« Saaz US » → « Saaz (US) » : dédiée) ; sinon le nom seul. Aucune variété unique : **aucune fiche** | origine de l'article connue et ≠ origine de la fiche, ou origine du catalogue `null` avec une origine connue, ou α hors de la plage de la fiche (`CatalogueHop.alpha`). Code d'origine absent de la table pays (CH, AT, BE) : approchée |
| fermentescibles | `slugBeerAnalytics(nom)` de `domain/fermentables/noms.ts` (194, import statique d'une table de ~10 Ko) | nom exact ou alias | **exacte** seulement pour le nom canonique ou le nom anglais de la fiche ; un alias court (`pale`, `golden`, `otter`) est **approchée** ; approchée aussi si l'EBC lu sort de la plage de la fiche *quand le catalogue en donne une* : aujourd'hui aucune table d'EBC (`fermentescibles.json`, `typicite-styles.json`), la règle de plage est donc inactive, et le résultat le dit. Nom hors table : aucune fiche |
| levures | — | **pas de fiche** (T11) | — |
| autres | — | aucune | — |
Table pays, dans `fiche.ts` (doublon assumé de `PAYS` de `MarquesVue.tsx`, qu'un domaine ne peut pas importer) : US États-Unis, DE Allemagne, **UK et GB Royaume-Uni**, NZ Nouvelle-Zélande, AU Australie, CZ Tchéquie, SI Slovénie, FR France, PL Pologne. Autres codes : pas de pays connu.
L'écran déclenche `chargerCataloguePlein()` à la première ligne « nouvelle » et se réaffiche à l'arrivée (`siCataloguePleinArrive`, `data.ts:111`) ; tant qu'il n'est pas arrivé la pastille ne dit pas de fiche. **Poids** : `data.ts` est déjà un morceau de l'outil houblons, chargé ici par `import()` du module ; il n'est pas certain qu'il se sépare du
paquet principal (le JSON est importé statiquement ailleurs). RESULTAT donne la taille des morceaux de `npm run build` avant et après ; si le paquet principal grossit de plus de 50 Ko, la fiche des houblons est coupée et le pilote tranche.

## 9. L'écran (`ExpenseSheet.tsx`, `ui/depense/`, après le commit de l'écran Dépense)
Besoin : voir quel article va naître, avec quel nom et quelle fiche, et pouvoir corriger. Contrôles : le bouton existant (« Créer « Target bis » », ⇄ « Relier à … » gardés, r2b) ; dans le plateau d'une ligne « nouvelle », un `Input` « Nom de l'article » (composant protégé, G6) ; la pastille.
- `articleNeufDe` est appelé pour le bouton, pour le menu `Stock ligne N` = « Créer un nouvel article » (ligne 343, `v==='new'`), et à chaque rendu où le stock, la ligne ou le catalogue changent ; sa valeur n'est jamais gardée, hormis le nom tapé (ref par ligne, comme `proposedStock`). Écrire `articleName` au clavier le garde ; vider le champ rend la main à la dérivation.
- `ambigu` : pas de « Créer » dans la ligne du résultat ; le choix d'article du plateau reste et dit « plusieurs articles Target : choisis » ; le menu « Créer » reste possible et donne un nom libre (« Target bis 2 »).
- `incertain` : deux boutons, « Relier à … » et « Créer … », aucun lien automatique ; le choix « Créer » du menu (`lieAuStock`) ne relie plus qu'un cas `meme`.
- Pastille d'une ligne nouvelle : `fiche Cascade US · approchée` (ou `fiche Target` quand elle est exacte, `nouveau` sans fiche). **Le plateau d'une ligne reliée lit `StockItem.fiche`** de l'article relié et dit la même phrase (T9). Mesure à 390 : si la pastille déborde, elle passe sur deux lignes ; jamais de défilement horizontal ; le pied reste visible et actif.
- Les tests de `ecran/` qui lisent « nouveau » sans fiche restent verts.

## 10. Ce qui lit un article par son nom, et ce que le lien change
| lecteur | lit | effet |
|---|---|---|
| `relierStock` (index des houblons, `donneesApp.ts:110`) | `name` | **corrigé dans la voie (T6)** : `nomDeVariete` retire `bis( \d+)?` final, et la même expression est retirée **avant** `origineDuNom` (« Cascade CH bis » garde son origine). Tests dans `donneesApp.test.ts` : « Target bis », « Target bis 2 », « Cascade CH bis », « Hallertauer Blanc bis ». **L'α du moteur est celle du dernier article trié ayant du stock** (`donneesApp.ts:127`) : comportement d'avant, déjà vrai pour « Target 11.8% » et « Target 11.3% » ; le pilote ouvre un ticket pour une clé par article. RESULTAT le répète |
| `factsForRecipeStockItem` (`ingredientFacts.ts:659`) | `stockItemRef`, sinon la clé du nom | « Target bis » a une clé distincte : « Target » reste unique. Choisi par sa référence, le bis apporte son α et son EBC |
| `learnIngredient` (`storage.ts:724`) | nom exact | inchangé |
| Stock (`StockDetailSheet`, `IngredientPicker`, `HopIngredientPicker`) | `alphaPct`, `colorEbc` | affichent l'α et l'EBC lus (avant : dans le nom seulement) |
| `BrewWizard.tsx:1443` | `alphaPct ?? 0` | article neuf sans α : inconnu, comme avant (hors Possède, non touché) |
| `StockItem.fiche` | écran Dépense (plateau des lignes reliées, pastille) | seul lecteur ; ni recettes, ni Comparer, ni fiche du stock ne le lisent : **coupé**, le pilote ouvre le ticket si voulu |

## 11. Les témoins rouges sur HEAD (un témoin = un comportement, jamais une erreur d'import — T13)
Chaque test est écrit contre les exports **existants** (`voisinDe`, `memeProduit`, `matchStockLine`, `savePurchase`, l'écran rendu) avant tout code ; `npx vitest run tests/unit/depense/fiche` et sa sortie vont dans « TEMOIN AVANT ». Quand la fonction nouvelle n'existe pas, le test passe par l'écran ou par `savePurchase`.
| règle | test (`tests/unit/depense/fiche/`) | échoue sur HEAD parce que |
|---|---|---|
| R1 origine | `regle.test.ts` : `voisinDe(Cascade CH, [Cascade US])` rend l'article | HEAD rend `undefined` (pas d'α) |
| R2 nom bis | `ecran.test.tsx` : le bouton dit `Créer « Target bis »` | HEAD : `Créer « Target 11.3% »` |
| R3 origine à l'écran | `ecran.test.tsx` : la ligne « Cascade CH » face à « Cascade US » montre un bouton `Créer « Cascade CH »` et ⇄ | HEAD : **aucun bouton Créer pour cette ligne** |
| R3b écriture | `ecriture.test.ts` : `savePurchase` de la ligne Cascade CH écrit `name` « Cascade CH », `origin` « CH » | HEAD écrit `name = description`, pas d'`origin` |
| R4 bis 2 | `ecran.test.tsx` : Target + Target bis au stock, ligne « Target 12.5% » → `Créer « Target bis 2 »` | HEAD : `Créer « Target 12.5% »` |
| R5 écriture | `ecriture.test.ts` : `savePurchase` d'une ligne « Target 11.3% » avec Target au stock écrit `name` « Target bis », `alphaPct` 11,3 | HEAD : `name` « Target 11.3% », pas d'`alphaPct` |
| R6 retrouver | `regle.test.ts` : `matchStockLine(Target 11.3%, [Target, Target bis(alphaPct 11,3)])` rend « Target bis » | jetons `[target, bis]` ≠ `[target]` : `undefined` |
| R7 implication | `regle.test.ts` : sur 40 paires nommées, `matchStockLine` relie ⇒ `memeProduit` rend le même article ; les paires `incertain` une par une | garde, vert partout ; ses paires `incertain` (Hallertauer, Münchner) échouent sur HEAD par le comportement de `memeProduit` (relie à tort) |
| R8 EBC | `ecriture.test.ts` : `savePurchase` d'un libellé « Münchner Malz 15 EBC » face à « Münchner Malz » (colorEbc 20) écrit « Münchner Malz bis », `colorEbc` 15 | HEAD : `name` « Münchner Malz 15 EBC », pas de `colorEbc` |
| R9 jamais écrasée | `ecran.test.tsx` : le nom tapé est gardé après un changement de libellé, de stock et de catalogue | pas de champ nom |
| R10 libellé modifié (Conception 1) | `ecriture.test.ts` : « Créer » sur « Target 11.3% », libellé changé en « Galaxy 17.2% » → l'article écrit porte Galaxy, alphaPct 17,2 ; le nom tapé reste | HEAD n'écrit ni α ni nom nettoyé |
| R11 famille (Conception 3) | `regle.test.ts` : « Houblon Cascade 6% » face à la ligne « Cascade 8% » → voisin trouvé, « Cascade bis » ; « Cascade Cryo » hors famille | HEAD : `voisinDe` rend `undefined` (nom « Houblon Cascade ») |
| R12 Maris Otter (Prêt 3) | `ecran.test.tsx` + `ecriture.test.ts` : le menu « Créer un nouvel article » sur « Maris Otter, Kg » écrit « Maris Otter » | HEAD : « Maris Otter, Kg » |
| R13 ambigu | `ecran.test.tsx` : menu « Créer » sur la ligne « Target » (deux membres) → nom libre, jamais deux « Target » | HEAD : doublon exact |
| R14 moteur | `donneesApp.test.ts` : « Target bis », « Target bis 2 », « Cascade CH bis », « Hallertauer Blanc bis » reliés à leur variété | HEAD : `nonRelies` (« aucune variété… ») |
| R15 Gemini jamais | `fiche.test.ts` : `domain/stock/*` n'importe ni `geminiScanner`, ni `functions/`, aucun `fetch` | garde |
| R16 existant intact | `ecriture.test.ts` : l'article de la famille est identique avant et après (objet comparé en profondeur) ; aucun `put` ni `adjustNumber` sur lui hors réception de la ligne reliée | garde |
Un test qui passerait sur HEAD est dit garde.

## 12. Rien ne se perd : ce que fait aujourd'hui la création d'un article neuf
| aujourd'hui (`purchaseEntry.ts:401-407`, `:436-441`) | après S6 |
|---|---|
| `ref` = `MP-<saisie>-<index>`, `id` = `ref` | identique |
| `type` = cleaning si la ligne l'est, sinon rawMaterials | identique |
| `name` = `description.trim()` | houblon ou malt : le nom dérivé (point 4) ; sinon `articleName` si tapé, sinon identique |
| `category` = catégorie canonique, sinon Emballage / Consommable / Divers | identique |
| `unit` = `newArticleUnit(line.unit)` ; la ligne de dépense garde l'unité imprimée (D213) | identique |
| `currentStock` = `line.quantity` ; reçu de la même quantité et unité | identique ; unité illisible : refus inchangé (D214) |
| `minStock` 0, `reorder` false, `supplier` | identique |
| mouvement `receipt-…`, `stockItemRef`, marqueur `purchase-…` | identique |
| α, EBC, récolte, origine, conditionnement imprimés : seulement dans le nom | α → `alphaPct` ; EBC → `colorEbc` ; origine → `origin` ; **récolte reste dans le nom** ; **conditionnement (« , 1 Kg ») retiré du nom d'un houblon ou d'un malt** : la quantité et l'unité restent sur la ligne de la dépense. Perte voulue, dite ici |
| poids de sachet d'une levure | reste dans le nom (la levure garde `description.trim()`) : `stockQuantityFor` le relit |
| article existant | jamais lu pour écrire, jamais modifié (R16) |
| dépense déjà enregistrée | intacte ; ses lignes pointent des `ref` qui ne changent pas |
| **ce qui change 1 : la source de l'α du moteur** | un `alphaPct` écrit fait dire « fiche de stock » à `relierStock` (`donneesApp.ts:123`) au lieu de « lu sur l'article » ; l'α du moteur reste celle du dernier article (point 10). Test : `donneesApp.test.ts`, `Target bis` à `alphaPct` 11,3 |
| **ce qui change 2 : un EBC écrit** | un `colorEbc` écrit rend calculable la couleur d'une recette qui ne l'était pas (`factsForRecipeStockItem`, malt). Test : `ecriture.test.ts` + `ingredientFacts` sur « Münchner Malz bis » choisi par sa référence |

## 13. Les tests existants dont une attente change
- `tests/unit/depense/ecran/tri.test.tsx:68` (dans mon Possède, la seule attente) : `Créer « Target 11.3% »` devient `Créer « Target bis »` ; la ligne 69 (`Relier à Target 11.8%`) est inchangée.
- `etat.test.ts:57-62, 90-94` : inchangés (les enveloppes tiennent) ; à vérifier : « Galaxy 17.2% » ← « Galaxy » reste `meme` (s1 le relie).
- Le test « relecteur R6 … relié à X, nom déjà au stock » : `lieAuStock` ne relie plus que `meme` ⊆ s1 ; rejoué avant le code.
- **Avant le code**, `tests/unit/depense/ecran/` (dont `ecran.test.tsx` et `libelles.test.tsx`) est rejoué avec la nouvelle règle en maquette : la liste des lignes de 372765 qui gagnent un voisin (stock simulé « Hallertauer Blanc DE 9.5% », levures, malts), et chaque test dont l'attente change, sont écrits dans RESULTAT (ou « aucune ligne ne change »).
- `jus0Journey`, `unites-enregistrement`, `purchaseEntry.test.ts:41` écrivent par `savePurchase` : seules les catégories sont lues (`jus0Journey:49`), les lignes `new` de houblon ou de malt y reçoivent maintenant le nom dérivé ; à rejouer avant le code, toute attente de nom qui change est nommée.

## 14. Tests et scripts hors Possède qui appellent ce qui change (`grep` sur `tests/` et `scripts/` entiers)
`tests/unit/depense/{stock,ecran,raccord,enregistrement}/`, `tests/unit/{purchaseEntry,purchasePrefill,stockLineMatching,financeArchiveContinuity}.test.ts`, `tests/integration/{expenseSheet,expenseSheetMouture,jus0Journey,financeQuickActions,fix114,equipmentProjects}.test.tsx`,
`tests/unit/hopIndexV4/donneesApp.test.ts` (Possède), `tests/unit/fermentescibles/`, `tests/integration/hop*` (lisent `relierStock`). `scripts/` : aucun appelant. Diagnostics `mesures.ts` et `sonde-doublon.ts` : lecture seule. Rejeu : la commande de G5, plus `tests/unit/hopIndexV4`, sur HEAD avant le code, puis après.

## 15. Risques
- **Données existantes** : aucun article n'est relu pour être réécrit ; `origin` et `fiche` absents = inconnus. Un ancien « Target 11.8% » ou « Münchner Malz 20 EBC » est de la famille (α et EBC lus dans le nom).
- **Hors ligne** : le catalogue plein est un morceau du paquet ; s'il manque, aucune fiche, le nom est proposé, l'enregistrement reste possible. Aucun appel réseau, aucun appel de service ajouté ou retiré.
- **Double clic** : `articleNeufDe` est déterministe sur le brouillon et le stock ; la saisie rejouée ne réécrit rien. Deux lignes du même produit dans une saisie : la 2e reçoit « bis 2 » (membres virtuels, T4) ; deux `articleName` tapés égaux sont refusés.
- **Arrondis** : α à 0,05 près, EBC à 1 point ; l'α écrite est le nombre imprimé (11,3), jamais un calcul. Pas d'argent touché.
- **Lecture d'une origine** : « DE » dans « Malt DE … » (français « de ») : lue seulement en capitales, dernier mot ou après un α, jamais dans une levure (`US-05`), seulement pour un houblon ou un malt. Dans le doute : inconnue.
- **Fausse écriture** : au pire une proposition perdue ; jamais une fusion silencieuse. Une seule voie vers `meme` : s1 relie. Une donnée connue d'un seul côté est `incertain`, sans lien automatique.
- **Prolifération** : à chaque lot l'α varie de quelques dixièmes → des « bis » : bornée par le retour de l'article déjà écrit (point 5), pas supprimée ; EBC à 1 point pour la limiter.

## 16. Coupé, et pourquoi
- **Fiche des levures** (T11, signée par le pilote) : le risque est une **fausse fiche de souche** (formes multiples, codes), non le budget. Le « bis » sur un poids de sachet connu des deux côtés reste.
- **Lecture de `fiche` hors de l'écran Dépense** (recettes, Comparer, fiche du stock) : coupé, ticket au pilote ; `StockItem.fiche` est lu par le plateau et la pastille de l'écran Dépense.
- **Recherche d'une fiche dédiée en ligne** : jamais (Gemini attend l'accord de l'utilisateur et un coût montré avant).
- **Forme (sèche, liquide), potentiel, malterie, souche** : non lus, non comparés. **Plage d'EBC des malts** : le catalogue n'en donne pas.
- `scan.alphaPct` / `alphaPctLu` : non recopiés. Une clé d'α par article dans le moteur : ticket du pilote.
- Aucun changement à `invoicePoints.ts`, `functions/`, aux règles Firestore, à `BrewWizard.tsx`. **Hors Possède étendu**, seuls changent : `donneesApp.ts` (retrait de `bis`), `ingredientIdentity.ts` (le mot `export`), `tri.test.tsx:68`.
  Comportement sans ces trois autorisations (défaut dit) : « Target bis » non relié et signalé dans RESULTAT, liste d'origines dupliquée dans `donnees.ts`, test `tri.test.tsx:68` en échec nommé.

## 17. Décisions du point 17 de la première version : leur sort
1 (moteur) : option A retenue et complétée (T6). 2 : amender la seule attente (T12). 3 : nom propre pour houblon et malt seulement (T1, T12). 4 : `ambigu` sans bouton, menu « Créer » avec nom libre (T4). 5 : `origin` gardé (T12). 6 : α 0,05, EBC 1 point, « approchée » hors plage (T10). 7 : `export ORIGINS` dans le Possède (T12). Tout est reporté au § 19.

## 18. Ordre du travail, budget et coupe (T13)
Budget : 110 tours au plus pour le code (plafond de la voie 150, 40 pour le plan), 3 essais par critère.
| étape | contenu | tours |
|---|---|---|
| 0 | rejeu de `tests/unit/depense/ecran/` et des tests nommés au point 13 avec la nouvelle règle en maquette (liste des lignes qui gagnent un voisin) ; les témoins du point 11 écrits et rouges sur HEAD | 14 |
| 1 | `domain/stock/donnees.ts`, `fiche.ts` + tests (les expressions exercées, `node --check`) ; `export ORIGINS` | 14 |
| 2 | `regleProduit`, partage de code avec `examine`, point 5, enveloppes d'`etat.ts`, R7 | 22 |
| 3 | `articleNeuf.ts`, `newStockItem`, validation, champs de `types/index.ts`, `donneesApp.ts` + test | 16 |
| 4 | écran : bouton, menu, champ nom, pastille, plateau de la ligne reliée (après le commit de l'écran) | 20 |
| 5 | banc `s6` (T7), `capturer-s6.mjs` à 390 et 1280, captures ouvertes | 14 |
| 6 | G3 à G8, taille des morceaux du build, RESULTAT | 10 |
Ordre de coupe si le budget manque : d'abord la **pastille et le champ nom** (l'article reste dérivé), puis la **fiche des fermentescibles**, puis `bis N` (seul « bis » et les noms d'origine). **Jamais coupées** : la règle du nom et l'écriture. Série mécanique (captures, rejeu de G5) : demande à l'exécutant Haiku, jugée par moi.

## 19. Décisions du pilote, recopiées (revue triée, 01.11 nuit) : T1 à T13
- **T1, le nom propre** (Prêt 1, Conception 4) : `nomPropre(libellé, catégorie)` part de `readProductLabel(…).name`. Il en retire `N EBC` / `EBC N` (la même expression que `lireEbc`, qui rend aussi l'empan), le code d'origine en queue et `bis( \d+)?`. Il sert à la famille et au nom proposé. Témoin sur HEAD : `Münchner Malz 15 EBC` face à `Münchner Malz` doit rendre `neuf`. → points 2, 4, 11 (R8, R11).
- **T2, la famille et `meme`** (Conception 2 et 3, Prêt 5) : la famille se fait sur les jetons, comme s1 (`sameName`, génériques, fournisseurs, passes 1 et 2), en retirant en plus le code d'origine, `bis N` et les jetons d'EBC ; `meme` n'est rendu que si `matchStockLine` relie le même article (inclusion) ; même famille, aucun écart, donnée connue d'un seul côté : le cas **`incertain`**, sans lien automatique (« Relier à … » et « Créer … ») ; R7 devient l'implication « `matchStockLine` relie ⇒ `meme` » sur 40 paires, les paires `incertain` écrites une par une, dont Hallertauer (ligne 11) et Münchner (ligne 13), ces deux lignes passant de « relié » à « proposé ». → points 2, 4 (lignes 11, 13), 11 (R7).
- **T3, quand les champs de l'article neuf sont posés** (Conception 1, Prêt 3) : champs **dérivés**, jamais gardés ; `articleNeufDe(ligne, stock, catalogues, nomTapé?)` est appelée par l'écran (bouton « Créer », menu « Créer un nouvel article », pastille) et par l'enregistrement, sur la ligne et le stock courants ; seul le nom tapé est gardé, par ligne, jamais écrasé. Tests : libellé modifié après « Créer » (l'article écrit porte les valeurs du nouveau libellé, le nom tapé reste) ; Maris Otter par le menu « Créer ». → points 6, 7, 9, 11 (R10, R12).
- **T4, jamais de doublon de nom** (Conception 6 et 7) : pour un houblon ou un malt, `articleNeufDe` donne toujours un nom libre, en tenant compte du stock et des lignes `new` déjà décidées du brouillon (membres virtuels pour le suffixe, jamais pour `meme`) ; un cas `ambigu` reçoit un nom libre par le menu « Créer » ; `validatePurchaseCommit` refuse un `articleName` donné déjà pris, message vrai ; les autres produits gardent HEAD. → points 4 (ligne 20), 7, 11 (R13).
- **T5, `bis` dans les jetons** (Prêt 6) : `bis N` n'est retiré des jetons que pour un article portant `alphaPct`, `origin`, `colorEbc` ou `fiche` ; tests « Target bis » nu → `undefined`, « Target bis » à `alphaPct` 11,3 → relié, rejoués avec `chasse-17-10` et `chasse-etendue`. → point 5.
- **T6, le moteur houblons** (décision 1, Conception 5) : option A complétée ; `donneesApp.ts` et `donneesApp.test.ts` au Possède pour ce seul changement : retirer `bis( \d+)?` dans `nomDeVariete` **et** avant `origineDuNom` ; tests « Target bis », « Target bis 2 », « Cascade CH bis », « Hallertauer Blanc bis » ; le plan et RESULTAT disent que l'α du moteur est celle du dernier article (déjà vrai pour « Target 11.8% » et « Target 11.3% ») ; le pilote ouvre un ticket pour une clé par article. → points 10, 11 (R14), 12.
- **T7, G7 de bout en bout** (Prêt 2) : (1) `tests/unit/depense/fiche/fixture-s6.test.ts` (`ECRIRE_FIXTURE=1`) fait passer une lecture simulée (Cascade CH, Münchner 15 EBC, un produit inconnu) par le vrai rapprochement, comme `fixture.test.ts`, et écrit `src/ui/depense/apercu/lecture-s6.reconciliee.json` et `stock-s6.json` (`fixture.test.ts` n'est pas touché) ; (2) `apercuDepense('s6')` (`?dev-local&depense=s6`, sous `import.meta.env.DEV` seulement) les charge, et son `enregistrer` appelle la vraie création de l'article (la partie pure, `newStockItem`) et expose les articles écrits, avec l'article existant avant et après, sur un crochet de développement ; G3 vérifie que rien n'en reste dans `dist/` ; (3) `capturer-s6.mjs` lit ce crochet. → point 18 (étape 5).
- **T8, les catalogues** (Prêt 7, Conception 10) : fonction existante `chargerCataloguePlein` (`data.ts:134`, `chargerAjouts` `data.ts:119`, `cataloguePleinCharge` `data.ts:109`) ; l'enregistrement l'attend, s'il échoue aucune fiche ; champ d'origine `CatalogueHop.origin` ; `noms.ts` en import statique ; `UK` et `GB` → « Royaume-Uni », les autres codes restent inconnus ; RESULTAT donne la taille des morceaux du build avant et après. → points 7, 8.
- **T9, la fiche lue et sa marque** (Conception 8 et 9) : `StockItem.fiche = { id, approchee }`, marque gardée telle que jugée à la création (toutes les valeurs lues ne sont pas gardées) ; le plateau de l'écran Dépense lit `fiche` sur une ligne reliée (« fiche Cascade US · approchée ») ; malts : « approchée » si l'EBC lu sort de la plage de la fiche quand le catalogue en donne une, sinon « exacte » seulement pour le nom canonique, jamais pour un alias court. → points 6, 8, 9.
- **T10, les seuils** : α à 0,05, EBC à 1 point (constante nommée `SEUIL_EBC`), « approchée » quand l'α est hors de la plage de la fiche. → points 2, 3, 8.
- **T11, levures** : pas de fiche, coupe signée par le pilote ; motif : le risque d'une fausse fiche de souche, non le budget ; le « bis » sur un poids de sachet connu des deux côtés reste. → points 4 (ligne 16), 8, 16.
- **T12, les autres décisions** : (2) amender la seule attente `tri.test.tsx:68` (« Créer « Target bis » »), ligne 69 inchangée ; (3) nom propre pour les houblons et les malts seulement, « houblon » étant ce que s1 dit houblon (`hasHopWord`, nature) ; (4) voir T4 ; (5) `StockItem.origin` gardé ; (7) `ingredientIdentity.ts` au Possède pour le seul mot `export` d'`ORIGINS`, le plan dit qui d'autre lit ces codes (point 3) ; écarts mixtes : l'origine d'abord dès qu'un membre diffère par l'origine, puis le suffixe si le nom est pris (« Cascade CH bis »). → points 2, 3, 4, 13.
- **T13, budget et témoins** (Prêt 4, 8, 9, 11 ; Conception 13, 14) : signatures et types écrits (`RegleProduit` en union discriminée avec `incertain`, point 2) ; budget par étape ≤ 110 tours et ordre de coupe (point 18) ; un témoin est un comportement, jamais une erreur d'import (point 11) ; avant le code, rejeu de `tests/unit/depense/ecran/` avec la nouvelle règle, lignes de 372765 qui gagnent un voisin et tests dont l'attente change (points 13, 18) ; « Rien ne se perd » avec deux lignes « ce qui change », chacune avec son test (point 12).
