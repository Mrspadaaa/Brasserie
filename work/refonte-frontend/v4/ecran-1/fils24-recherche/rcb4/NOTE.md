# rcb4 — « Par élimination »

- **Chaleur** : chaude (forme libre).
- **Idée** : on ne dit pas ce qu'on veut, on raye ce qu'on ne veut pas (D32 « je sais pas comment bannir une
  contrainte », D20 « pas aimer un houblon en particulier »). Les 12 familles en colonnes ; un toucher sur un picto
  raye la colonne (trait orangé, colonne grisée), tout houblon qui la cite sort, le compte descend sous le doigt.
  Ce qui reste est une matrice : un point sous chaque famille que ses fiches citent (gros : marqué, petit : cité),
  aligné sous son picto, à sa couleur. Les colonnes attendues par la 16D (floral, herbacé, terreux) sont entourées
  de pointillé.
- **Cas** : rayés résineux, épicé, végétal, pépins (« ma stout est trop résineuse ») → 78 houblons restent sur 297
  décrits (21 sans famille décrite restent hors du compte, dits en bas), du plus huileux au moins (Styrian Cardinal,
  Galaxy 60 g, Strata, Bravo, Merkur…). Mots hors des 12 sous le nom (cannabis, dank, vanille, vin blanc…).
- **D'où, où** : le champ « Ajouter — houblon… » de l'étape ; « + » vers la recette, appui long → fiche courte,
  glisser à gauche → Comparer. Le toucher qui raye n'est pas joué dans cette v0 (capture fixe).
- **Baseline** : pictos au trait v3 (en-tête des colonnes), couleurs des familles (points), thème blanc, α en plage
  puis rôle en mot puis l'huile en bout de ligne (L04), stock en badge, lentille au style / absolu et zone 16D (les
  trois colonnes), légende derrière « ? », fiche à l'appui long ; deux tailles de texte (12, 15).

## Ce qui tient, ce qui casse

- Tient : la matrice se lit en colonnes (qui a du floral, qui n'a que des agrumes) autant qu'en lignes ; les
  colonnes éteintes disent la contrainte sans un mot ; le compte « 78 restent » répond tout de suite.
- Casse : les noms longs se coupent (Styrian Cardi…) ; l'ordre par huile n'est pas le seul possible (par nombre de
  familles marquées, par stock) ; 127 mots au premier écran (16 lignes), au-dessus de D1.

## Contrôles (24.10, soir)

- `concepts.mjs` : CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` : TRAIT OK (12 pictos, 0 faute).
- `controle-commun … --page=etat.html --sans=mots` : COMMUN OK.
- `controle-panel` (quatre captures) : PANEL OK (premier essai 0,39 de remplissage : lignes resserrées, colonnes
  rayées en gris --trait).
- `mots-premier-ecran --max=70 --modere` : 141 mots (74 hors données : alerte, modéré), MOTS ECHEC — v0, sauté.
- `controle-une-question` (D98) : indicatif ; « aucun titre », « 3 facteurs libres » : écran de recherche, non joué.

Captures (ouvertes) : `captures/rcb4.png`, `captures/rcb4-fiche.png`, `captures/rcb4-page.png`. Générateur :
`generer.mjs` ; données et pièces communes dans `../rcb1/`.

## Passe 2 (24.10, nuit, retour du critique : REJET D97, D14)
- Mots traduits (Merkur « sucre », Pekko « doux » filtré comme générique, reste « thym, concombre ») ; rôle du fournisseur d'abord (`usage[].roles`, règle de roles.ts) : Strata aromatique (« Ajouts tardifs, Houblonnage à cru ») ; Pekko, Merkur, Newport, Yeoman sans fournisseur restent « amérisant » par l'α, honnêtement. Colonnes rayées : un trait vertical gris par colonne, plus de rectangles (D82) ; colonne des noms à 130 px, noms en entier ; α du lot (Galaxy 11–16 · lot 17,2). Refait en place (demande du pilote), capture `captures/rcb4.png` rouverte ; CONCEPTS-BIEN-4, TRAIT OK, COMMUN OK, PANEL OK.
