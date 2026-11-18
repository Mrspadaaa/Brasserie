OK — module confiance.ts : sûr / repris / inconnu pour chaque valeur, unité déduite ; 14 pièces : 0 sûr faux, 61 tests verts

Aucune donnée privée ici : aucun nom d'achat des doc2, doc4, doc13 ; les valeurs des pièces du banc ne sont citées qu'en comptes.

## Fichiers écrits
- `src/ui/depense/confiance.ts` (module pur, aucun React, aucun réseau)
- `tests/unit/depense/confiance/unites.test.ts`, `niveaux.test.ts`, `points.test.ts`
- `work/missions/2026-10-31-ecran-depense/voies/f2-confiance/PLAN.md` (les deux tables, écrites avant le code), `mesure14.ts` (la mesure des 14 pièces), `RESULTAT.md`
- `git status --short` : seuls ces chemins sont de moi (les autres modifications du poste viennent des autres voies, déjà là au départ). Rien branché dans l'écran ni dans l'enregistrement.

## TEMOIN AVANT
Le module n'existait pas : `npx vitest run tests/unit/depense/confiance` →
`Error: Cannot find module '../../../../src/ui/depense/confiance' imported from …/unites.test.ts` — `Test Files 1 failed`, `Tests no tests`.
Et sur le code d'aujourd'hui, la forme doc14 inventée (`banc-k6/piece.ts`) : 10 lignes de stock, de matériel et d'emballage sur 10 sans unité lisible
(`isReadableUnit('')` faux), plus le port ; chaque ligne serait écrite « N ? » et « unité à préciser ». Ce second constat est le premier test de
`unites.test.ts` (il passe, car il décrit la donnée, pas le module).

## Ce qui est fait
- **Types** : `Niveau` (`sur | repris | inconnu`), `Valeur<T>` (+ `facultatif` pour le numéro et la TVA absents), `ValeurUnite` (+ `source` imprimee | deduite | aucune, + `regle`).
- **`deduireUnite(ligne, contexte)`** : 20 règles dans l'ordre de PLAN.md, chacune testée (`niveaux.test.ts`, une `it` par règle). Une unité lisible dans `unit`, imprimée ou
  tapée, est `sur` et n'est jamais réécrite (testé : `l.unit` intact, « kg » tapé sur 87 × 0,04 reste « kg »). Ajustements : q × p ≠ montant plafonne un `sur` à `repris`
  (par `lineMathCheck`, la règle du serveur, sensible à l'unité) ; un article relié tenu dans une autre grandeur plafonne à `repris` ; deux autres lignes de la même famille qui
  impriment la même unité confirment une déduction (`repris` → `sur`) ; la famille « Autres » n'éclaire rien.
- **`confianceLigne`** → unité, quantité, prix, montant, famille, article, `pire`. Calcul exact = `sur` ; q × p ≠ montant : quantité et prix `repris`, montant `sur` si le total
  imprimé corrobore (`sumCheck`), sinon `inconnu` ; prix par 100 g = prix `repris`, montant intact ; absent = `inconnu` (jamais 0) ; service, port, remise, divers, entretien :
  « sans objet » (`sur`, sans valeur).
- **`confianceEntete`** → date, fournisseur, total, tva, numero, + `lignes` et `document` (deux champs en plus : les points « Lignes » et « Pro-forma » n'ont pas d'autre place). Une valeur tapée
  (`tapes`) est `sur`. Le numéro et la TVA absents sont `inconnu` + `facultatif` et ne rougissent pas `pire`.
- **`TABLE_POINTS`** : les 25 codes de `SCAN_POINT_CODES` ont un niveau (test : `CODES_SANS_NIVEAU` vide ; chaque point qui pèse donne au moins une cible ; un point qui ne pèse pas, aucune).
  `unite-absente` n'a plus de niveau propre : la déduction le remplace. La lecture enregistrée `apercu/lecture-372765.reconciliee.json` est mappée point par point (testé).
- **`pireNiveau`**, **`totalCorrobore`**, **`ciblesDuPoint`**.

### Table 1 : code de point → champ → niveau (détail et raisons dans PLAN.md)
ligne-montant : quantité, prix `repris` ; montant `sur` si le total corrobore, sinon `inconnu` · ligne-prix-par-lot : prix `repris` · unite-absente : remplacé par la déduction ·
alpha-libelle, ambiguite-ligne : article `repris` · nature-a-preciser : famille `repris` · forme-rejetee : la cellule rejetée `inconnu` · lectures-divergentes (qui pèse) : le champ `repris`
(une valeur retenue) ou `inconnu` · somme-ecart, tva-incoherente, ht-tva-ttc : `repris` si l'écart ≤ 5 centimes, sinon `inconnu` · somme-incomplete, devise-non-chf : total `repris` ·
total-absent, date-absente, taux-tva-hors-plage : `inconnu` · lignes-perdues : lignes `inconnu` · lignes-annoncees, lignes-non-rapprochees, lecture-coupee : lignes `repris` ·
pro-forma-non-payee, devis, document-livraison, avoir : document `repris` · type-deduit : ne pèse pas.

### Table 2 : indice → unité → niveau (ordre d'essai)
imprimée ou tapée → elle-même `sur` · hors stock → sans objet `sur` · quantité absente → `inconnu` · « …, Kg » nu dans le nom → cette unité, `sur` si q × p tombe juste · levure à 2-25 → sachet
(`sur` si le calcul tombe juste) ; > 50 g dans le nom ou > 25 → pièce `repris` · tuyau → m `repris` · matériel / emballage entier → Stk (`sur` à 1 ou calcul exact) · paquet dans le nom (100 Kapseln, 24-fach) → Stk
`repris` · houblon ≤ 0,50 par unité, q ≥ 5 → g `repris` ; paquet de 2 à 40 → Stk `repris` ; sinon `inconnu` · mesure en fin de nom : ≠ 1 → Stk `repris` (contenance), = 1 kg ou 1 l → kg ou l `repris` ·
malt à 0,8-6 → kg, à 0,0008-0,008 (q ≥ 50) → g, `repris` ; sinon `inconnu` · autre famille entière ≥ 0,50 → Stk `repris` · article relié en pièce ou sachet, ou voisines unanimes → `repris` · sinon `inconnu`.

## Critères
- `npx vitest run tests/unit/depense/confiance --maxWorkers=2` : `Test Files 3 passed (3)`, `Tests 61 passed (61)` (rouge avant : module introuvable, ci-dessus). Essais utilisés : 2 (un test d'unité nue, « Kg » rendu « kg » ; corrigé en `linkUnit`).
- `npx vitest run tests/unit/depense --maxWorkers=2` : `Test Files 14 failed | 82 passed (96)`, `Tests 1472 passed | 3 skipped`. Les 14 échecs sont **tous** `Failed to resolve import "zxing-wasm/reader" from "src/services/qrLecture.ts"`
  (vérifié sur les 14 fichiers par le rapport JSON de vitest) : l'écran importe désormais le lecteur de QR ; ce n'est plus seulement `fiche/ecran.test.tsx` comme la consigne le disait. Aucun de ces fichiers n'importe `confiance.ts`. Rien installé.
- `npx tsc --noEmit -p tsconfig.json` : aucune ligne ne cite `confiance` (mes fichiers sont sans erreur).
- Le compte des 14 pièces (`npx tsx work/missions/2026-10-31-ecran-depense/voies/f2-confiance/mesure14.ts [--detail]`, hors ligne, lecture `Csv8+N` de `banc-d272b-hl`) :
  ```
  LIGNES SANS UNITE IMPRIMEE : 141 (dont 30 sans objet : service, port, divers)
  UNITES IMPRIMEES (jamais réécrites) : 91
  SUR    : 53 justes, 0 faux, 0 sans vérité
  REPRIS : 56 justes, 2 faux, 0 sans vérité
  INCONNU: 0
  SUR FAUX : 0
  ```
  Sur la pièce doc14 : 8 `sur` (levure au sachet, 7 pièces de matériel dont le sac à houblon à 4), 5 `repris` (houblon en g, sirop 460 ml, anneaux de 100, capsules de 100, carton de 24), 1 sans objet (le port), aucun `inconnu`.
- `git status --short` : rien hors « Possède » de mon fait.

## Doutes et limites (à lire avant de se fier au 0 faux)
- **Une vérité d'unité mal posée m'a fait croire à 4 `sur` faux.** La première mesure prenait l'unité vraie de la facture PDF du même magasin ; or la commande en ligne vend le même malt « en gramme » (« Maris Otter, Gramm » 550 × 0,0021). La
  vérité cas-4 des doc11 et doc12 le marque (« g, gramm »). J'ai posé la lecture du métier d'abord (écrite dans `SURCHARGES`, avant le verdict) ; les 4 « faux » étaient mon étiquette, pas la règle.
- **Les 2 `repris` faux** sont la lactose « 1 Kg » : le PDF la compte « Stk », la règle dit « kg ». Même quantité en stock (1 paquet de 1 kg = 1 kg) ; « kg » est le choix sûr pour le lien au stock (`stockQuantityFor` refuse Stk → article en kg). Jamais `sur`.
- **Peu de diversité** : les 111 unités déduites viennent de 5 pièces (doc6, doc10, doc11, doc12, doc14) d'un même magasin, plus doc1 à doc4, doc7, doc13 (tout hors stock). Sous 40 pièces, c'est un indice, pas une preuve (skill banc-lecture). Les fourchettes de prix
  (levure 2-25, houblon ≤ 0,50, malt 0,8-6 et 0,0008-0,008) viennent du métier et de ce magasin ; un autre fournisseur peut tomber hors fourchette : la règle donne alors `inconnu` ou `repris`, jamais `sur`.
- Les `sur` déduits ne reposent que sur : le nom (unité écrite, calcul exact), une pièce de matériel à 1 (ambiguïté nulle), une levure à prix de sachet dont le calcul tombe juste. Tout le reste est `repris`.
- Je n'ai rien ouvert en image : le module n'a pas d'interface (L12 ne s'applique pas ici).

## Ce que f3 devra changer (rien n'est fait ici)
1. **Où l'unité déduite se pose** : un champ facultatif du brouillon, `uniteDeduite?: { unite: string; niveau: 'sur' | 'repris'; regle: string; raison: string }` sur `PurchaseLineDraft`, rempli par
   `deduireUnite` quand `unit` n'est pas lisible. `line.unit` reste l'unité imprimée, vide (D213). Sur la dépense enregistrée : ajouts facultatifs seulement (`unitDeduced`, sa règle, son niveau). Quand il tape ou accepte une unité, elle entre
   dans `unit` : elle devient « imprimée » et `sur`, jamais réécrite.
2. **Validation d'enregistrement (D214, `purchaseEntry.ts` ligne 428 : `unitOk = isReadableUnit(line.unit)`)** : accepter une ligne dont `unit` est illisible **si** `uniteDeduite` existe (niveau `sur` ou `repris` : le jaune s'enregistre, il l'a vu) ;
   refuser `inconnu` (pas d'unité, pas de quantité), comme aujourd'hui. Un service, un port, une remise : sans objet, jamais refusé.
3. **Les lecteurs de `line.unit`** (`stockQuantityFor`, `effetStock`, `conversionDe`, `matchStockLine`, `exactUnitPriceCents`, `linkUnits`) doivent lire une « unité effective » = `unit` si lisible, sinon `uniteDeduite.unite`. Le prix unitaire gardé
   (`exactUnitPriceCents`, D213 « un prix se lit pour l'unité imprimée ») : ne pas le garder sur une unité déduite, ou le marquer déduit. Pas de mouvement de stock avec une unité `inconnu`.
4. **L'écran** (`ExpenseSheet.tsx`) : `qte.inconnue`, `unitePrecis`, `precisIds`, `douteux`, `correction` (« Unité imprimée illisible : g kg Stk ») se remplacent par `confianceLigne(...).pire` et la couleur (`attention` / `alert`) ; les boutons g / kg / Stk restent pour `inconnu`.
   Les chips (`CHIP_PAR_CODE`, `chipsDeLecture`) et `statutAffiche` : un statut unique `pireNiveau(entête + lignes)` ; la chip « Unité » de `unite-absente` disparaît quand l'unité est déduite. Passer à `contexte.points` les points recalculés
   (`recalculerLecture`), pour qu'une valeur corrigée baisse son drapeau.
5. **Unités nouvelles** : « m » (tuyau) n'est pas dans `Units` (`familyOf('m')` rend `piece`) ; `stockQuantityFor` le refusera face à un article en Stk. À trancher avec f4 (stock) : un article « tuyau » en mètres, ou refus + choix.

## Hors périmètre
Écran, couleurs, rangées, chips ; brouillon et validation (f3) ; conversion pièce ↔ poids et unités du stock (f4) ; Gemini (jamais appelé).

DÉCISION À PRENDRE : (1) « 1 Kg » en fin de nom, sur une matière qui n'est ni malt ni céréale (lactose, dextrose) : « kg » (choix actuel, `repris`) ou « Stk » (comme l'étiquette du magasin) ? Recommandation : « kg », qui se relie au stock ; le jaune demande de contrôler.
(2) Le numéro de facture et la TVA absents : rouges (valeur absente = `inconnu`, comme dit) ou sans couleur ? Recommandation : sans couleur (`facultatif`), l'écran le décide ; le module ne compte pas ces deux-là dans `pire`.
(3) Un écart de somme ou de TVA jusqu'à 5 centimes est jaune, au-delà rouge : seuil posé par moi (arrondi suisse). À valider ou changer.
CONNAISSANCE : dans les commandes en ligne de la boutique de brassage du banc, l'unité n'est jamais une colonne : malts « …, Kg » ou « …, Gramm » dans le nom (les deux existent pour une même matière), houblon au gramme (0,04 à 0,08 CHF/g), levure à la pièce
(3 à 13,50), matériel et emballage à la pièce, tuyau au mètre (la facture PDF de la même commande le dit), « Kg » d'un malt à 1,5-3 CHF. Fourchettes utilisables pour déduire, jamais pour affirmer.
LEÇON PROPOSÉE : une unité vraie s'étiquette sur la MÊME pièce (sa vérité champ par champ), jamais par le nom d'un produit trouvé sur une autre pièce du même magasin : la même matière s'y vend en kg et en grammes. Ma première étiquette venait d'un PDF ; elle a produit 4 faux
« sûrs » qui n'étaient que mon étiquette (Rôles : auteur, exécutant ; Contrôle : lire la vérité cas-N du même document avant de juger un faux).
