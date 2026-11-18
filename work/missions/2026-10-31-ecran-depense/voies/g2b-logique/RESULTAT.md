OK — sûr si le calcul tombe juste, aucun « ? » hors stock, nature suit la famille, désaccord jaune ; 0 ingrédient changé

## Fichiers écrits
- Code : `src/ui/depense/confiance.ts`, `familles.ts`, `finale.ts`, `groupes.ts` (seulement `LigneBande.horsStock`, `horsCompte`, `quantites` ; fonctions de pliage à g2a, non touchées).
- Tests (D343 : un test par règle, lignes fictives courtes, aucun jeu de fixtures neuf) : `tests/unit/depense/g2b/regles-g2b.test.ts` (5 tests : D328a, D328b, D328c ×2, désaccord) ; `g2b/mesure-banc.test.ts` (inerte sans `MESURE_SORTIE`, lit les vraies pièces). Adaptés : `confiance/niveaux.test.ts` (3 tests), `confiance/points.test.ts` (1 test).
- Voie : `rouge-head.txt`, `avant.json` / `apres.json` (fiches anonymes : aucun nom ni valeur), `avant-comptes.txt`, `apres-comptes.txt`, `diff-avant-apres.mjs` / `.txt`, `apres-iso.txt`, `base-depense.txt`, `tsc.txt`.

## Fonctions changées
- `confiance.ts`
  - `regles` (D328a) : hors familles d'ingrédients, quantité entière dont q × prix = montant tombe juste → `sur` (règles `mesure-contenance`, `mesure-un`, `piece-defaut`). Malt, houblon, levure, sucre, additif : règles d'avant. Une ligne « Autres » d'ingrédient sous « Brassage » garde les règles d'un ingrédient.
  - `deduireUnite` (D328b) : `other` et `maintenance` en quantité entière → pièce déduite, sûre (`piece-hors-stock`) ; service, port, remise, inconnu, quantité non entière ou absente → « sans objet », sûr. Jamais `inconnu`.
  - `TABLE_POINTS['lectures-divergentes']` (note du pilote) : toujours `repris` (avant : `inconnu` sans lecture retenue). Vérifié : un champ vide reste `inconnu` de lui-même ; `forme-rejetee` reste `inconnu` (une valeur rejetée, pas un désaccord) ; un désaccord qui ne pèse pas ne baisse rien.
- `familles.ts` : `estFamilleIngredient`, `familleAUnStock` (lue dans la table des catégories de stock), `NATURE_DE_FAMILLE`.
- `finale.ts` : `lignesDeLecture` (D328c) ; `libelleAvant` appelle `texteQuantite(…, false)` (g2a a changé `texteQuantite` : sans cela le barré « 30 ? » devenait « 30 »).
- `groupes.ts` : `LigneBande.horsStock?`, `quantites` ignore une ligne hors stock sans unité lisible ou sans quantité (plus de « ? » à l'en-tête).

## D328c, ce qui est fait
Une ligne lue `stock` prend la nature de sa famille quand ce n'est pas un ingrédient : nettoyage et consommable → `cleaning`, emballage → `packaging`, matériel et rénovation → `equipment`, services → `service`, « Autres » → `other`. Matériel, rénovation, services, « Autres » n'ont aucune catégorie de stock : `stockAction: none`. Nettoyage et emballage en ont (CIP, désinfectant, détergent, EPI, Emballage) : natures `cleaning` et `packaging`, aucun « nouveau » d'office, mais un article déjà là se relie. Un article déjà au stock relié par nom garde la ligne en ingrédient pour une famille sans stock. Une nature lue autre que `stock` n'est jamais réécrite. La nature changée à la main reste la sienne (mécanique de fusion existante : `touchee`, cellule `kind`).

## Critères
1. Rouge sur HEAD puis vert. `rouge-head.txt` (sources HEAD, tests adaptés) : 8 échecs, tous pour la bonne raison (D328a vernis 5,8KG « repris », D328b « 3 Stk + 1 ? », D328c nettoyant `ingredient` et article non relié, désaccord `inconnu`, + les 3 tests adaptés de `niveaux`/`points`). Avec mes changements : 5/5 verts pour `regles-g2b`, `confiance/` vert.
2. Vraies pièces, avant (HEAD) / après, `avant-comptes.txt`, `apres-comptes.txt`, `diff-avant-apres.txt` : `LIGNES D'INGREDIENT DU BANC : 193 ; CHANGEES : 0` puis `INGREDIENTS INCHANGES OK` (niveau, règle, unité, nature, stock, « nouveau » : rejeu-k6.json, 7 pièces, 46 lignes d'ingrédient ; banc d272b, 14 pièces, 147).
   - rejeu-k6 (82 lignes) : hors ingrédients, unité repris 3 → 3, sûr 33 → 33 ; 1 ligne `ingredient` matériel → `equipment`, « nouveau » 47 → 46 ; 3 lignes `other` : « sans objet » → pièce déduite.
   - banc d272b (232 lignes) : unité hors ingrédients repris 9 → 6 ; rangées inconnues 2 → 1 (un désaccord devenu repris) ; « nouveau » 153 → 147 ; 6 `ingredient` hors famille d'ingrédient : 4 → `equipment`, 2 → `cleaning`.
   - Sa lecture Bauhaus du 02.11, comptes seulement (17 lignes) : avant, 14 × `repris/piece-defaut`, 2 nettoyants `ingredient` en stock « new », 2 × sans objet, 14 rangées jaunes ; après, 17 unités `sur`, les 2 nettoyants `cleaning`, stock `none` ×17, 0 « nouveau », 2 rangées jaunes (désaccord de nature equipment / other / stock : légitime, D277).
3. tsc : `copie.mjs "npx tsc --noEmit"` sortie 0. `vitest tests/unit/depense` : base HEAD 146 fichiers verts (`base-depense.txt`). Copie isolée « HEAD + mes seuls changements » (`apres-iso.txt`) : 2225 verts, 0 test en échec ; 5 fichiers ne chargent pas (`firebase-functions`, `seedData` absents de cette copie : environnement ; `learn`, `serveur`, `aiTask-traduireNoms`, `pages/lecture-serveur`, `lecture-coupee`). Cette copie porte le correctif d'un test hors Possède (ci-dessous). Sur le worktree courant, que g2a modifie en même temps, le dernier passage montrait 14 échecs : pliage (`bandes/sous-groupes-d307` et `d311`, `ecran/sous-groupes-d311`), « Tout valider » (`lecture-d/ecran`), `pages/entree` : tous dans l'écran de g2a ; plus le test hors Possède ci-dessous. Non rejoué après le dernier état de g2a.
4. `git status --short` : mes écritures sont dans Possède ; les autres fichiers modifiés sont ceux de g2a.

## Tests existants adaptés (dans Possède)
- `confiance/niveaux.test.ts` règle 1 (`other`, `maintenance` : pièce déduite, D328b), règle 17 (sûr quand le calcul tombe juste, D328a ; le cas « repris » se teste avec montant absent ou faux), « seconde source » (montant de C absent : un calcul juste est déjà sûr seul).
- `confiance/points.test.ts` : désaccord sans lecture retenue : `repris`.

## Test hors Possède qui casse à cause de D328c (non modifié, L17)
`tests/unit/depense/stock/renovation-d306.test.tsx`, 4e test : sa « Brosse métallique » lue `stock` sous Brassage attendait « nouvel article » ; c'est un consommable (`cleaning`, aucun « nouveau »), le but de D328c. Correctif vérifié (6 verts) : remplacer `'Brosse métallique'` par `'Balai de cantonnier'`. Au pilote, ou autorise-moi.

## Pour g2a / le pilote
- Le « ? » d'un service, port ou remise à l'en-tête de bande tombe seulement si `ExpenseSheet.tsx` (`ligneBandes`, ~l.1022) passe `horsStock: HORS_STOCK_KINDS.includes(l.kind)` à `LigneBande`. Pour `other` et `maintenance` entiers, l'unité déduite (Stk) suffit sans cela. La rangée est déjà réglée (`texteQuantite` de g2a).
- Une ligne `equipment` non entière garde `inconnu` (règle 8, test existant) : pas dans la liste hors stock du brief.
- `selectCategory` ne recalcule pas la nature quand « Pour quoi ? » change après la lecture (seulement le stock).
- Les 2 « désaccord » de sa pièce portent sur la nature ; elle suit maintenant la famille, on pourrait les trancher seuls : lecture du serveur, hors de ma voie.

## Doutes
- Règle 17 inchangée sur les bornes (prix ≥ 0,50, q ≤ 1000) : des brosses à 0,45 restent `inconnu`.
- « Autres » devient `other` hors dépense « Brassage » ; sous Brassage une ligne sans mot de famille reste ingrédient (une épice, un adjuvant ne se perdent pas) : plus prudent que le brief, réversible dans `lignesDeLecture`.
- Un faux « sûr » reste possible pour une ligne hors ingrédient vendue au poids avec q entier et calcul juste (le sens de D328a) ; un article relié tenu au kilo la plafonne à `repris`.
- Mesure hors ligne et sans stock : le rapprochement avec un stock se vérifie par test (un article fictif). Pas de Chrome (logique pure) : l'en-tête de bande est à voir par g2a.

## DÉCISION À PRENDRE : nature d'une ligne de Rénovation
Le brief disait « rénovation → other ». J'ai gardé `equipment` : acquis D306 (sélecteur « Matériel », ses tests verts) et `other` n'allume aucun mot du segment Nature tant que le D335 de g2a manque. Options : (a) `equipment` (actuel) ; (b) `other` (une ligne dans `NATURE_DE_FAMILLE`, `familles.ts`) + adaptation de `stock/renovation-d306` (2 tests) + D335. Recommandation : (a).

CONNAISSANCE : une ligne `stock` lue « nettoyant » n'était pas reliée à un article de nettoyage existant : `regleProduit` en kind `ingredient` ne reconnaît pas un article de catégorie Détergent, `matchStockLine` en kind `cleaning` si ; la bonne nature au départ règle le lien.
LEÇON PROPOSÉE : aucune
