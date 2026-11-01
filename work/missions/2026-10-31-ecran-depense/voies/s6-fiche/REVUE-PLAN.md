# Revue du plan s6-fiche, triée par le pilote (01.11, nuit)

Deux relecteurs neufs ont rendu `REVUE-conception.md` et `REVUE-pret.md`. Les preuves et les mesures (`readProductLabel` rejoué)
restent dans ces deux fichiers. Une ligne « corrigée » signifie ceci : l'auteur corrige PLAN.md selon la colonne « Correction
attendue », précisée par la Raison quand le pilote tranche, et cela avant toute ligne de code. La règle de la voie : une proposition
perdue est permise, une fausse écriture ne l'est pas. Dans le doute, on garde le rapprochement de s1, ou rien.

**Ce que le pilote tranche (à recopier dans PLAN.md, § 19)**
- **T1, le nom propre** (Prêt 1, Conception 4) : `nomPropre(libellé, catégorie)` part de `readProductLabel(…).name`. Il en retire
  `N EBC` / `EBC N` (la même expression que `lireEbc`, qui rend aussi l'empan), le code d'origine en queue et `bis( \d+)?`. Il sert à
  la famille et au nom proposé. Témoin sur HEAD : `Münchner Malz 15 EBC` face à `Münchner Malz` doit rendre `neuf`.
- **T2, la famille et `meme`** (Conception 2 et 3, Prêt 5) :
  - La famille se fait sur les jetons, comme s1 : `sameName`, les génériques, les fournisseurs, les passes 1 et 2. On y retire en plus
    le code d'origine, `bis N` et les jetons d'EBC. « Houblon Cascade 6% » est donc de la famille de « Cascade 8% ».
  - `meme` n'est rendu que si `matchStockLine` relie le même article (inclusion).
  - Même famille et aucun écart, mais une donnée connue d'un seul côté : c'est le cas neuf **`incertain`**. Il n'y a aucun lien
    automatique : le brasseur voit « Relier à … » et « Créer … ».
  - R7 devient l'implication « `matchStockLine` relie ⇒ `meme` », testée sur les 40 paires, et les paires `incertain` sont écrites une
    par une, dont Hallertauer (ligne 11) et Münchner (ligne 13). Ces deux lignes du tableau passent de « relié » à « proposé ».
- **T3, quand les champs de l'article neuf sont posés** (Conception 1, Prêt 3) :
  - Ils sont **dérivés**, jamais gardés. Une fonction pure, `articleNeufDe(ligne, stock, catalogues, nomTapé?)`, les calcule. L'écran
    l'appelle pour afficher (bouton « Créer », choix « Créer un nouvel article », pastille) et l'enregistrement l'appelle sur la ligne et
    le stock courants : ce qui est montré est ce qui est écrit.
  - Seul le nom tapé par le brasseur est gardé, par ligne ; il n'est jamais écrasé.
  - Tests :
    - libellé modifié après « Créer » : l'article écrit porte les valeurs du nouveau libellé, et le nom tapé reste ;
    - Maris Otter créé par le choix « Créer un nouvel article ».
- **T4, jamais de doublon de nom** (Conception 6 et 7) :
  - Pour un houblon ou un malt, `articleNeufDe` donne toujours un nom libre. Il tient compte du stock et des lignes `new` déjà
    décidées du même brouillon, qui valent comme membres virtuels pour le suffixe (`bis`, `bis 2`…), jamais pour `meme`. Un cas
    `ambigu` reçoit lui aussi un nom libre par le choix « Créer ».
  - `validatePurchaseCommit` refuse un `articleName` donné qui est déjà pris, avec un message vrai.
  - Les autres produits gardent le comportement de HEAD.
- **T5, `bis` dans les jetons** (Prêt 6) : `bis N` n'est retiré des jetons que pour un article qui porte au moins une donnée écrite
  par S6 (`alphaPct`, `origin`, `colorEbc` ou `fiche`). Deux tests : « Target bis » nu → `undefined` ; « Target bis » à `alphaPct`
  11,3 → relié. Ils sont rejoués avec `chasse-17-10` et `chasse-etendue`.
- **T6, le moteur houblons** (décision 1, Conception 5) :
  - L'option A est retenue, complétée. `src/domain/hopIndex/v4/donneesApp.ts` et `tests/unit/hopIndexV4/donneesApp.test.ts` entrent
    au Possède, pour ce seul changement : retirer `bis( \d+)?` dans `nomDeVariete` **et** avant `origineDuNom`.
  - Tests : « Target bis », « Target bis 2 », « Cascade CH bis », « Hallertauer Blanc bis ».
  - Le plan et RESULTAT disent que l'α du moteur est celle du dernier article (comportement d'avant, déjà vrai pour « Target 11.8% »
    et « Target 11.3% ») ; le pilote ouvre un ticket pour une clé par article.
- **T7, G7 de bout en bout** (Prêt 2) :
  1. Un test de la voie, `tests/unit/depense/fiche/fixture-s6.test.ts` (`ECRIRE_FIXTURE=1`), fait passer une lecture simulée par le
     vrai rapprochement, comme `fixture.test.ts`. Cette lecture contient Cascade CH, Münchner 15 EBC et un produit inconnu. Le test
     écrit `src/ui/depense/apercu/lecture-s6.reconciliee.json` et `stock-s6.json`. `fixture.test.ts` n'est pas touché.
  2. `apercuDepense('s6')` (`?dev-local&depense=s6`, sous `import.meta.env.DEV` seulement) les charge. Son `enregistrer` appelle la
     vraie création de l'article (la partie pure d'`articleNeuf`) et expose les articles écrits, avec l'article existant avant et après,
     sur un crochet de développement. G3 vérifie que rien n'en reste dans `dist/`.
  3. `capturer-s6.mjs` lit ce crochet.
- **T8, les catalogues** (Prêt 7, Conception 10) :
  - Le plan nomme la fonction existante qui charge le catalogue plein (`data.ts:120` ou `cataloguePleinCharge`). L'enregistrement
    l'attend. Si elle échoue, on n'écrit aucune fiche (proposition perdue) : jamais une fiche différente selon le moment.
  - Le plan nomme aussi le champ de `CatalogueHop` qui porte l'origine, et le chargement de `noms.ts`.
  - `UK` et `GB` donnent « Royaume-Uni ». Les autres codes restent inconnus.
  - RESULTAT donne la taille des morceaux du build, avant et après.
- **T9, la fiche lue et sa marque** (Conception 8 et 9) :
  - `StockItem.fiche = { id, approchee }`. La marque est gardée telle qu'elle a été jugée à la création, puisque toutes les valeurs lues
    ne sont pas gardées ; le plan le dit.
  - Le plateau de l'écran Dépense lit `fiche` sur une ligne reliée (« fiche Cascade US · approchée »).
  - Malts : la fiche est « approchée » si l'EBC lu sort de la plage de la fiche, quand le catalogue en donne une. Sinon, elle n'est
    « exacte » que pour le nom canonique de la fiche, jamais pour un alias court (`pale`, `golden`, `otter`).
- **T10, les seuils** (décision 6, Conception 11) : α à 0,05, EBC à **1 point** (constante nommée), « approchée » quand l'α est hors
  de la plage de la fiche.
- **T11, levures** (Conception 12) : pas de fiche, et la coupe est signée par le pilote. Le motif est le risque d'une fausse fiche de
  souche (formes, codes), non le budget. Le « bis » sur un poids de sachet connu des deux côtés reste.
- **T12, les autres décisions** :
  - 2 : amender la seule attente `tri.test.tsx:68` (« Créer « Target bis » ») ; la ligne 69 est inchangée.
  - 3 : nom propre pour les houblons et les malts seulement. Est « houblon » ce que s1 dit houblon (`hasHopWord`, nature).
  - 4 : voir T4.
  - 5 : `StockItem.origin` est gardé.
  - 7 : `ingredientIdentity.ts` entre au Possède pour le seul mot `export` d'`ORIGINS`. Le plan dit qui d'autre lit ces codes.
  - Écarts mixtes : l'origine d'abord, dès qu'un membre de la famille diffère par l'origine, puis le suffixe si le nom est pris
    (« Cascade CH bis »).
- **T13, budget et témoins** (Prêt 4, 8, 9, 11 ; Conception 13, 14) :
  - les signatures et les types sont écrits (`RegleProduit` en union discriminée, avec `incertain`) ;
  - le budget par étape tient en 110 tours au plus ;
  - l'ordre de coupe : d'abord la pastille et le champ nom, puis la fiche des fermentescibles, puis `bis N`. La règle du nom et
    l'écriture ne sont jamais coupées ;
  - un témoin est un comportement, jamais une erreur d'import ;
  - avant le code, `tests/unit/depense/ecran/` est rejoué avec la nouvelle règle : liste des lignes de 372765 qui gagnent un voisin, et
    des tests dont une attente change ;
  - « Rien ne se perd » reçoit deux lignes « ce qui change » : la source de l'α du moteur, et un EBC écrit qui rend une couleur
    calculable. Chacune a son test.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Les champs `article*` posés par l'écran ne sont jamais invalidés : un libellé ou un stock changés écrivent un autre produit | dériver à l'enregistrement par une fonction pure, seul le nom tapé gardé ; test | corrigée | T3 |
| 2 | majeur | La règle est plus lâche que s1 sur l'origine, l'EBC et le poids (lignes 11 et 13) ; R7 ne peut pas être vert | cas `incertain`, `meme` ⊆ s1, R7 en implication | corrigée | T2 |
| 3 | majeur | La famille par `name` laisse « Houblon Cascade 6% » hors de « Cascade 8% » | famille sur les jetons comme s1 | corrigée | T2 |
| 4 | majeur | Le nom d'un malt garde l'EBC ; lignes 12 et 13 impossibles | `nomPropre` sans EBC ; tests | corrigée | T1 |
| 5 | majeur | L'option A est incomplète (`origineDuNom` sur le nom brut ; α du dernier article) | retirer `bis` aux deux endroits ; dire l'α du moteur | corrigée | T6 |
| 6 | majeur | Un cas `ambigu` passé par le choix « Créer » écrit un doublon « Target » | nom libre dans tous les cas ; validation | corrigée | T4 |
| 7 | détail | Deux lignes du même produit proposent le même « bis » | les lignes `new` du brouillon comme membres virtuels | corrigée | T4 |
| 8 | détail | `StockItem.fiche` sans lecteur ; `approchee` stockée deux fois | plateau lit `fiche` ; motif de la marque gardée | corrigée | T9 |
| 9 | détail | Un malt toujours « exacte » quel que soit l'EBC | plage d'EBC, alias court jamais exact | corrigée | T9 |
| 10 | détail | Le catalogue dépend du moment ; UK et GB ; codes non lus | catalogue plein attendu, sinon pas de fiche ; UK/GB | corrigée | T8 |
| 11 | détail | EBC à 0,5 refait des « bis » à chaque lot | 1 point | corrigée | T10 |
| 12 | détail | Le motif de la coupe des levures est faux | motif réécrit, coupe signée | corrigée | T11 |
| 13 | détail | Des témoins ne sont pas des comportements (R3, R7, R8) | un témoin = un comportement ; témoins des n° 1, 3, 5, 6 | corrigée | T13 |
| 14 | détail | « Rien ne se perd » ne dit pas ce qui apparaît | deux lignes « ce qui change », un test chacune | corrigée | T13 |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | La famille et le nom d'un malt sont impossibles tels qu'écrits (`Münchner Malz 15 EBC`) | `nomPropre(libellé, catégorie)` ; témoin | corrigée | T1 |
| 2 | bloquant | G7 inécrivable : `enregistrer` simulé, pas de crochet, Cascade CH hors fixture | le mécanisme de bout en bout | corrigée | T7 |
| 3 | majeur | Le moment où les champs entrent dans le brouillon n'est pas écrit (select `new`, stock qui change) | une seule fonction, appelée aux trois endroits | corrigée | T3 |
| 4 | majeur | Signatures et types absents | les écrire | corrigée | T13 |
| 5 | majeur | `meme` plus faible que `matchStockLine` (Hallertauer, « Cascade » nu) | inclusion ; R7 sur 40 paires nommées | corrigée | T2 |
| 6 | majeur | Retirer `bis` des jetons de tout article crée une fausse proposition | retrait seulement si l'article porte une donnée S6 ; tests | corrigée | T5 |
| 7 | majeur | Le chargement des catalogues n'est pas réalisable tel qu'écrit (JSON déjà statique) | nommer la fonction existante, l'origine, `noms.ts` ; tailles du build | corrigée | T8 |
| 8 | majeur | Budget et coupe non écrits | budget ≤ 110, ordre de coupe | corrigée | T13 |
| 9 | détail | R3 et R4/R8 mal décrits sur HEAD | témoins de comportement | corrigée | T13 |
| 10 | détail | Contradiction sur les fichiers hors Possède | « sauf T6 et T12 » ; comportement par défaut dit | corrigée | T6, T12 |
| 11 | détail | D'autres lignes de 372765 gagnent un voisin, tests non rejoués | rejouer `tests/unit/depense/ecran/` avant le code ; nommer | corrigée | T13 |
