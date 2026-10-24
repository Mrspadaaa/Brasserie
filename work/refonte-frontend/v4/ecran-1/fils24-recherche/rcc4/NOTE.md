# rcc4 — La grille des mots

- **Chaleur** : chaude (forme libre).
- **Série** : rcc, « l'arôme d'abord ».
- **Idée** : la matrice nettoyée de flb5b, retournée en outil de recherche. Les mots qu'on veut sentir sont en lignes, les
  houblons qui les portent en colonnes, classés par couverture. On retire un mot (×), on en tape un (champ texte, jamais
  type="number"), ou on touche un mot proposé (« Ils sentent aussi »). La grille se reclasse.
- **Vrai cas** : on vient du champ « Ajouter — houblon… » de l'étape (stout export). Six mots : ◇ vin blanc, ◇ groseille à
  maquereau, ◇ raisin, ◇ sauvignon blanc, fruit de la passion (Tropicaux), cassis (Baies). **61 houblons** portent au moins un mot.
  - **Hallertau Blanc 6/6, 30 g en stock** (la découverte : un « Nelson » en stock).
  - Nelson Sauvin 4/6 (100 g).
  - Ariana 3/6 (0 g, en orangé).
  - Citra cryo 2/6 (65 g).
  - African Queen, Bramling Cross et Citra 2/6.
  - Puis Emerald Spire, Galena, Godiva, Mistral…

## Ce qui tient
- La grammaire que le brasseur a choisie (flb5b : « La matrice nettoyée », ◇ pour les types hors 16D). Ses mots hors 16D sont
  ici des critères de premier rang (D130 : « C'est très important surtout dans la comparaison !!!! »).
- Un rond de couleur quand le mot est rangé dans une famille, un rond noir quand il est hors des 12 : on voit d'un coup qui a
  quoi.
- Sous chaque nom, dans l'ordre L04 : α (du lot, en orangé hors de sa plage, ex. Nelson Sauvin 9,6), usage en mot, stock en
  badge, puis la bande des 12 familles, debout.
- Ligne 16D (au style, par défaut) : les familles attendues de la stout export que le houblon porte aussi (Ariana : Floral,
  Herbacé). Elle disparaît en absolu.
- Colonne touchée = choisie, rappelée dans le pied : « Hallertau Blanc α 9,5 double 30 g · 6 mots sur 6 · Comparer · + Ajouter ».
  L'appui long sur un nom ouvre la fiche.

## Ce qui casse
- 7 colonnes au plus à 390 px ; la suite tient sur une ligne (« puis Emerald Spire 2/6 · … »).
- Les noms debout se lisent moins vite que couchés.
- Au premier écran, la grille ne dit pas la force (huile) : à greffer de rcc3 ?

## Baseline : écart déclaré
- `--sans=mots` : 135 mots au premier écran (92 hors données). Les mots des lignes sont la requête elle-même.

## Contrôles (24.10, soir), sorties recopiées
- `concepts.mjs` : CONCEPTS-BIEN-4.
- `controle-pictos-trait.mjs` : rcc4 · 15 pictos de famille · 0 faute ; TRAIT OK.
- `controle-commun.mjs … --sans=mots` : COMMUN OK. Le premier passage échouait au contraste (tiret « — » gris à 2,68:1) ; corrigé
  en #5f646d, le pire cas est désormais « pêche 3 » à 4,63:1.
- `controle-panel.mjs` : PANEL OK.
- Réactivité (D138) : retirer « vin blanc » et « raisin » reclasse la grille, Nelson Sauvin passant de la 2e à la 4e colonne
  (115 ms).

Captures : `captures/rcc4.png`, `captures/rcc4-fiche.png`, `captures/rcc4-apres.png` (deux mots retirés).
