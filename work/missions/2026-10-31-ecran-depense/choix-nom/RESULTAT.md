C-NOM OK — 6 options (A référence + B à F) en 18 mini maquettes — choix-nom/index.html

Voie c-nom, 02.11, agent concepteur (Opus). Aucun code de l'app touché, aucun commit, aucun serveur Vite, aucune donnée réelle.

## Fichiers écrits (tous sous `choix-nom/`)
- `index.html` : la page de choix (titre daté 02.11, `#a-choisir` en tête, `[data-choix="nom-article"]`, A en `data-reference`, B à F en `data-variante`, chaque vignette dans un lien vers son image et une visionneuse `dialog`).
- `maquettes/{a..f}-{depense,stock,suivantes}.html` : 18 pages statiques à 390 px, thème clair, jetons de `themes.css`. Elles reprennent la rangée de `Ligne.tsx` (filet de famille, picto, nom, colonne « qté × prix », montant), le picto de `Pictos.tsx` (relié, nouvel article, lien proposé en jaune pointillé), la bande de `Liste.tsx` et le plateau d'`ExpenseSheet` (imprimé, calcul, Ingrédient/Service/Matériel, ligne « article « … » · nouvel article ⇄ »).
- `img/*.png` : les 18 captures (390 px, échelle ×2).
- `outils/gen.mjs` : écrit les maquettes et les capture (`node …/choix-nom/outils/gen.mjs`).
- `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png` : captures du contrôle 2.

## Les options (une seule chose varie : le nom au stock et le lien)
Chaque option montre trois mini maquettes : **Facture 1 · DE** (la ligne du nouvel article ouverte), **Au stock** (liste et fiche), **Factures suivantes** (le même malt en DE, EN et FR, puis ce que le stock en garde). Un cadre bleu marque le nom qui entre au stock.
- **A, aujourd'hui (référence)** : la rangée dit « Malt de Vienne », mais le plateau crée « Wiener Malz ». Au stock, c'est l'allemand. Ensuite, DE se relie ; EN et FR créent chacune un article : « 3 fiches du même malt ».
- **B, proposée par le pilote** : article « Malt de Vienne » ; « Sur la facture : Wiener Malz » sous le Nom de la fiche seulement ; DE, EN et FR se relient : « 1 fiche », 45 kg.
- **C** : comme B, mais la carte du stock montre l'imprimé dessous, plus pâle (après trois factures : « Wiener Malz · Vienna Malt »).
- **D** : B, plus un signal en tête du Stock, « Haferflocken = Flocons d'Avoine ? », avec Fusionner et Garder les deux (les deux cartes en pointillé). Seul le geste est montré.
- **E (ajoutée)** : le nom français est proposé en jaune (nom de rangée souligné en pointillé, champ article en pointillé, « Garder ») : il le garde ou le change avant « Confirmer ». Le reste comme B (`retenirNomBrasseur`).
- **F (ajoutée)** : comme B, mais une facture d'une autre langue que celle de l'article ne se relie pas d'office : le lien est proposé en jaune (« article « Malt de Vienne » · proposé », Garder, ⇄). Même DE se relie seule. Le stock est montré après « Garder ».
E et F sont deux vraies alternatives : la confiance dans la traduction (E) et dans le lien entre langues (F). Elles ne changent que le nom et le lien.

## Contrôles et sorties
1. `controle-page-choix.mjs … --min=4` → `nom-article : OK (5 variantes, 6 par rangée à 1280, 2 à 390)` puis `PAGE-CHOIX OK (1 choix)`.
2. `verifier-page.mjs … --page-lot --captures …/choix-nom/controle` → `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)`.
3. `grep -E "CHF|Fr\.|[0-9]+,[0-9]{2}" maquettes/*.html` : aucun « CHF » ni « Fr. ». Valeurs, toutes fictives et écrites par moi : 1,60 ; 9,60 ; 2,30 ; 11,90 (facture 1 : 6 Kg × 1,60, 1 Kg × 2,30) ; 1,55 ; 15,50 ; 1,40 ; 35,00 ; 1,70 ; 6,80 (factures suivantes). Les fournisseurs sont fictifs : Malzhaus Nord, Northfield Maltings, Moulin du Jura. Les stocks aussi : 3, 4, 2, 6, 12, 16, 25, 45 kg. J'ai changé les 5 Kg × 1,65 = 8,25 et 2 Kg × 1,90 = 3,80 des captures f3, pour ne recopier aucune quantité réelle.
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` (`grep -ci depense` → 0). La base est l'écran actuel (f3, D282 à D285) : rangées, plateau et pictos sont repris tels quels, seuls le nom et le lien changent.

## Ce que j'ai vu sur les captures (ouvertes)
- `img/a-depense.png` contre `img/b-depense.png` : la divergence d'aujourd'hui se voit (rangée en français, champ article en allemand, cadré en bleu).
- `img/a-suivantes.png` : le cadre « 3 fiches du même malt » dit sa plainte en un coup d'œil ; `b-suivantes` : « 1 fiche, 45 kg ».
- `img/c-stock.png` : l'imprimé pâle sous le nom ; à trois langues, la carte s'alourdit (visible sur `c-suivantes`).
- `img/d-stock.png` : signal en tête, deux cartes en pointillé, rien de fusionné.
- `img/e-depense.png` : le « Garder » et le ⇄ passent à la ligne sous le champ (largeur de 390 px) ; c'est lisible.
- `img/f-suivantes.png` : deux barres jaunes, une par facture d'une autre langue.
- `controle-ordinateur.png` : 6 colonnes, tête alignée ; à 1280 les vignettes font environ 200 px, la différence se lit au cadre bleu, le détail à l'agrandissement. `controle-page.png` : 2 par rangée, sans débordement.

## Correction du pilote (02.11)
- Mesure du pilote (`matchStockLine`, arbre actuel) : un article « Premium Pilsner Malz » relie déjà « Premium Pilsner Malt » (EN) et « Malt Pilsner Premium » (FR), car les mots sont communs ; la colonne A était fausse. Un nom qui se traduit ne se relie pas : « Wiener Malz » / « Vienna Malt » / « Malt de Vienne », « Haferflocken » / « Flocons d'avoine ».
- Fait : le produit d'exemple des 18 maquettes est devenu « Wiener Malz » (imprimé DE), « Malt de Vienne » (français) et « Vienna Malt » (EN), avec les mêmes valeurs fictives. Dans A, les factures suivantes relient DE ; EN et FR créent chacune un article : « 3 fiches du même malt », cette fois vrai. CARABELGE reste en seconde ligne.
- La page porte, sous la question, la ligne mesurée, coupée en deux paragraphes : « Mesuré le 02.11 : … non). » et « B à F demandent… à construire après ton choix. ». En un seul bloc, elle dépassait la limite de 45 mots de verifier-page.
- Rejoué : `PAGE-CHOIX OK (1 choix)` (5 variantes, 6 par rangée à 1280, 2 à 390) ; `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)`. Le grep ne trouve aucun « CHF » ; les valeurs fictives sont inchangées.
- Ouvertes : `img/a-suivantes.png` (DE relié ; EN et FR avec le picto « nouvel article » ; Wiener Malz 16 kg, Vienna Malt 25 kg, Malt de Vienne 4 kg dans le cadre « 3 fiches ») ; `img/b-suivantes.png` (trois reliés, « 1 fiche », 45 kg) ; `img/f-suivantes.png` (EN et FR proposés en jaune avec « Garder ») ; `controle-ordinateur.png` (la ligne mesurée en gris sous la question, 6 colonnes alignées).

## Retouches e-t8 (verdict `critique/VERDICT-c-nom.md`, ACCEPTÉ, deux majeurs)
- **Majeur 1, les colonnes se ressemblent** : les 7 vignettes identiques à B au pixel (md5 identique) sont grisées (opacité 0,45) et portent un badge « = B » en coin : c-, d- et f-depense, e- et f-stock, d- et e-suivantes. Sous chaque lettre, une balise : A « 3 fiches » (en pointillé), B à F « 1 fiche ».
- **Majeur 2, l'en-tête** : il garde la question (une ligne) et la recommandation (une ligne), environ 35 mots au lieu de 105. La mesure passe sous la tête de A (« aujourd'hui : DE se relie, EN et FR font 2 fiches de plus — mesuré 02.11 »). Un badge « à construire » est posé sur B à F. La légende du cadre bleu devient le `title` des vignettes de dépense. Dans les six `*-depense`, la bande grise « Malzhaus Nord · DE » remplace les deux champs inventés.
- **Détails** :
  - Chevron sous « plus ».
  - Cartes du stock en `#f1f1f1`, voile de la fiche ramené de 0,16 à 0,10.
  - « Fusionner » en contour (d-stock).
  - Dans e-depense, « Garder » à droite du champ, sur une ligne : le champ se cale sur son nom, et « · nouvel article » tombe dans E seulement, le picto cube + le disant déjà. À 220 px, le champ ne tenait pas sur une ligne avec Garder et ⇄ dans les 344 px du plateau.
  - `color-scheme: light` sur la page, sans thème sombre.
- **« Retirer »** : il est ajouté à la barre « proposé » de F (lien vers un article existant, comme `tactile390-clair-relie.png`), mais pas au plateau d'un nouvel article. Dans `ExpenseSheet`, `retirerEl` n'apparaît que pour `stockAction === 'existing'` ; pour un nouvel article, l'écran actuel n'a que ⇄. Je reprends la base telle quelle.
- La page s'écrit désormais par `outils/page.cjs` (CSS dans `outils/page.css`), les maquettes toujours par `outils/gen.mjs`.
- Rejoué : `nom-article : OK (5 variantes, 6 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)` ; `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Ouvertes :
  - `controle-ordinateur.png` : balises et « = B » visibles, l'œil tombe sur A, B, C-stock, D-stock et E-dépense.
  - `controle-haut.png` : la question et la recommandation, puis A et B au premier écran.
  - Deux vignettes grisées, sur la page : c-depense et e-stock.
  - `img/e-depense.png` : Garder sur la ligne du champ.

## Ce qui reste douteux
- Le lien entre langues de B à F n'existe pas encore (voir « Correction du pilote ») : à construire après son choix.
- La pastille DE/EN/FR de la bande grise est un repère de maquette : l'écran ne montre pas la langue aujourd'hui.
- Les en-têtes des factures suivantes (bande grise avec le fournisseur) et le titre « Factures suivantes » sont une composition de maquette : l'app montre une dépense à la fois.

Prédiction : il regarde la colonne A, voit « 3 fiches du même malt », et dit « B, évidemment, et D pour nettoyer ce qui est déjà là ».

DÉCISION À PRENDRE : aucune dans ce contrat. Si B + D est choisi, la fusion touche ses données réelles : elle attend son accord.
CONNAISSANCE : aujourd'hui, le plateau d'une nouvelle ligne crée l'article sous `neuf.name` (l'imprimé), alors que la rangée affiche `nameFr` (ExpenseSheet, `nomArticle`, `NomArticle enLigne`) : la divergence est dans le champ « article « … » ».
LEÇON PROPOSÉE : aucune
