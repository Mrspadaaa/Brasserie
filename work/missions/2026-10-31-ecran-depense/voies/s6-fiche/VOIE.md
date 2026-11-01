# Voie s6-fiche — l'article d'un produit déjà connu : « bis » ou son origine, ses vraies valeurs, sa fiche

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (le stock, les fiches et un champ de données neuf, donc des quantités et le schéma)
- Plafond : 150 tours, dont 40 pour le plan ; 3 essais par critère
- Dépend de : e-port (l'écran r2b ; le code ne commence qu'après son commit), s1-stock, l2-rapprochement
- Décideur en cas de doute : le pilote, avec l'option prudente et réversible

## Objectif
Ses mots sont en D215 et D216 (`work/refonte-frontend/decisions.md`), avec la lecture du pilote : lis-les en entier. En bref :
- même produit et mêmes données : c'est le même article ;
- même produit, mais une donnée connue des deux côtés diffère : c'est un article neuf. Il porte son origine dans son nom
  (« Cascade CH ») quand l'écart est l'origine, et « <nom> bis » sinon ;
- l'article neuf reçoit ses vraies valeurs, lues sur la facture. L'article existant n'est ni fusionné ni modifié ;
- l'article neuf est lié à la fiche la plus proche, et ses propres valeurs priment là où elles sont connues ;
- une fiche dédiée est cherchée ; à défaut, la fiche approchée reste, et cela se voit (« fiche Cascade US, pas exactement la bonne ») ;
- une seule fiche par produit ;
- une valeur tapée n'est jamais écrasée.

Après cette voie, sur l'écran « Nouvelle dépense » (r2b, porté par e-port) :
1. **Une seule règle** décide « même produit, donnée qui diffère ».
   - Elle est exportée par `src/services/stockLineMatching.ts` et remplace `voisinDe` de `src/ui/depense/etat.ts`, qui en recopie la
     règle (relecture e-port, R9).
   - Ses données comparées sont celles que `readProductLabel` lit dans le libellé et que l'article porte : α, origine, récolte, EBC,
     poids de pièce ou forme.
   - Une donnée n'est comparée que si elle est connue des deux côtés.
2. **Le bouton propose le bon nom** :
   - « Target 11.3% » face à « Target » à α 11,8 : « Créer « Target bis » » ;
   - « Cascade CH » face à « Cascade US » : « Créer « Cascade CH » » ;
   - un second écart : « bis 2 » (hypothèse du pilote, réversible).

   Le nom est le nom propre (`readProductLabel(…).name`), jamais le libellé brut. Le brasseur peut le changer, et sa saisie n'est
   jamais écrasée. Le ⇄ « Relier à … » reste.
3. **L'article neuf est écrit avec ses valeurs** : son nom, l'α lu s'il s'agit d'un houblon, et toute donnée lue qui a sa place dans
   `StockItem` (l'EBC d'un malt). `purchaseEntry.ts` reçoit pour cela des champs facultatifs sur la ligne ; sans eux, il fait comme
   avant (`name: line.description`).
4. **Le lien de l'article à sa fiche** est un champ facultatif de `StockItem` : l'identifiant de la fiche et la marque « approchée ».
   - Il est posé à la création, sur la fiche la plus proche des catalogues du dépôt. Ces catalogues sont l'index des houblons, celui des
     fermentescibles de a1 (`src/data/fermentables/`, `src/domain/fermentables/noms.ts`) et celui des levures.
   - La recherche d'une fiche dédiée ne lit que ces catalogues et les sources du dépôt, **jamais Gemini** : Gemini en production
     attend l'accord de l'utilisateur, avec son coût montré avant.
   - À l'écran, la pastille de la ligne dit la fiche et sa marque, dans la forme de r2b : « fiche Cascade US · approchée ».
   - Les règles Firestore ne contrôlent que `currentStock` (`firestore.rules.template:178`) ; un champ facultatif y passe. Rien n'est
     réécrit sur les articles existants, et il n'y a pas de migration.
5. **Ce qui lit la fiche ensuite** (recettes, Comparer, fiche du stock) : le plan inventorie ce qui lit aujourd'hui un article par son
   nom, et dit ce que le lien change. Si le brancher dépasse la voie, le plan coupe et le dit ; le pilote tranche.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`. Deux temps :
1. tu écris `COMPRIS.md`, tu lances G1, puis tu écris `PLAN.md`. Tu t'arrêtes et rends `PLAN PRÊT — <n> points` ;
2. le pilote fait relire le plan par deux regards neufs et te renvoie la revue triée ; ensuite, tu codes.

Le plan tranche les points suivants, et dit pourquoi :
- la règle unique, ses données comparées et leurs sources ;
- la table des noms : au moins Target, Cascade CH ou US, Hallertauer, un malt à l'EBC différent, et « bis 2 » ;
- les champs ajoutés : leurs types, ce qui les écrit, ce qui les lit ;
- la fiche la plus proche, catalogue par catalogue ;
- le témoin rouge sur HEAD de chaque règle ;
- le tableau « Rien ne se perd », pour ce que fait aujourd'hui la création d'un article neuf ;
- les tests existants dont une attente changera : chacun est nommé, et le pilote tranche avant le code.

Le business est juste à 100 % : une proposition perdue est permise, une fausse écriture ne l'est pas. Dans le doute, on garde le
rapprochement de s1, ou rien. Cette voie ne modifie jamais un article existant. Aucun appel de service n'est ajouté ni retiré sans que
le plan le dise.

L'interface suit `.claude/rules/affinee-frontend.md`, DESIGN.md et la maquette r2b (`v1/r2b/etat.html`, « Target bis » et ⇄) :
- les champs passent par le composant protégé `Input` ;
- aucun débordement à 390 ;
- le pied reste visible et actif.

## Possède
- `src/services/stockLineMatching.ts`, pour la règle exportée ;
- `src/services/purchaseEntry.ts`, pour la seule création de l'article neuf ;
- `src/types/index.ts`, pour les seuls champs facultatifs de `StockItem` ;
- `src/domain/stock/` (neuf), pour la fiche la plus proche ;
- `src/ui/finance/ExpenseSheet.tsx` et `src/ui/depense/`, pour la proposition, le nom modifiable et la pastille. On n'y écrit qu'après
  le commit d'e-port ;
- `tests/unit/depense/fiche/` (neuf) ;
- `tests/unit/purchaseEntry.test.ts` et `tests/unit/stockLineMatching.test.ts`, en ajouts seulement ;
- `work/missions/2026-10-31-ecran-depense/voies/s6-fiche/` ;
- ajoutés par la revue triée (T6, T12) : `src/domain/hopIndex/v4/donneesApp.ts` et `tests/unit/hopIndexV4/donneesApp.test.ts` (le seul retrait de `bis`), `src/services/ingredientIdentity.ts` (le seul mot `export` d'`ORIGINS`), `tests/unit/depense/ecran/tri.test.tsx` (la seule attente de la ligne 68).

Interdits :
- `functions/`, `src/domain/finance/invoicePoints.ts`, `firestore.rules.template` ;
- `src/pages/BrewWizard.tsx`, `src/ui/fermentescibles/`, `src/ui/identite/` ;
- les tests hors Possède, qui restent verts sans être modifiés ;
- tout ce que COMMUN.md interdit ;
- tout appel réel à Gemini.

## D'abord
1. Écris `COMPRIS.md` (Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes) et lance G1.
2. Lis D215, D216, `critique/VERDICT-port.md` (n° 4 et 13), `voies/e-port/RESULTAT.md` (T6, R6, R9) et
   `src/services/ingredientIdentity.ts` (`readProductLabel`).
3. Lis la création de l'article dans `purchaseEntry.ts` (`stockAction === 'new'`), puis `stockLineMatching.ts`.
4. Écris le plan.

## Critères
`GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine. G2 attend la revue triée du pilote.

G7 : tu écris `voies/s6-fiche/capturer-s6.mjs` (puppeteer-core, comme `voies/e-port/capturer-depense.mjs`).
- Sur l'app servie, avec le banc de développement d'e-port, il joue trois lignes :
  - la ligne Target ;
  - Cascade CH, une ligne ajoutée à la fixture par le script qui l'écrit ;
  - un produit inconnu.
- Il joue ces lignes à 390 et à 1280.
- Il imprime `S6 OK` seulement si tout ce qui suit est vrai :
  - les noms proposés sont ceux de la table ;
  - l'article écrit au banc porte son nom, son α et sa fiche ;
  - l'article existant est inchangé ;
  - aucune erreur de console ;
  - aucune requête hors localhost.

## Rendre
`RESULTAT.md`, écrit section par section au format de COMMUN.md :
- ligne 1 `OK — …` ou `ECHEC — …` ;
- « TEMOIN AVANT : … » ;
- le tableau « Rien ne se perd » ;
- les règles de nom tenues ;
- la fiche, et ce qui la lit ;
- ce qui est coupé, et pourquoi ;
- les captures ouvertes ;
- `LEÇON PROPOSÉE : …` et `CONNAISSANCE : …`.

Puis une ligne au pilote.
