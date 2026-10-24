# rcb2 — « Le champ α × huile »

- **Chaleur** : tiède (la forme de la série rcb : un autre genre de recherche, ici les curseurs devenus un plan).
- **Idée** : tout le catalogue sur un seul plan, l'α en travers et l'huile totale en hauteur : c'est ce qui sépare
  un Galaxy (en haut à droite) d'un Saaz (en bas à gauche), nommés comme repères (D131 ter). On pose un cadre au
  doigt (quatre poignées), les houblons dedans prennent la couleur de leur première famille et se listent dessous,
  du plus huileux au moins ; un cercle noir autour d'un point : dans mon stock. Pas de champ, pas de pastille.
- **Cas** : cadre α 8–14, huile ≥ 2 mL/100 g → 40 houblons (Styrian Cardinal, Galaxy, Tango, Melba, Strata…), 301
  sur le plan ; chaque point au milieu de la plage publiée (dit dans la légende). 17 houblons sans huile publiée
  restent hors du plan, comptés en bas de page : l'inconnu n'est pas mis à 0.
- **D'où, où** : le champ « Ajouter — houblon… » de l'étape ; « + » vers la recette, appui long → fiche courte,
  glisser à gauche → Comparer (barre du bas). Le geste du cadre n'est pas joué dans cette v0 (capture fixe).
- **Baseline** : pictos au trait v3, couleurs des familles, thème blanc, α en plage puis rôle en mot puis l'huile
  (L04), stock en badge, lentille au style / absolu et zone 16D, légende derrière « ? », fiche à l'appui long, deux
  tailles de texte au premier écran (12, 15).
- **Écart assumé** : la couleur d'un point est celle de sa première famille citée, pas d'une teinte par houblon
  (D40 bis) : 40 houblons ne tiennent pas dans une palette.

## Ce qui tient, ce qui casse

- Tient : le plan se lit d'un coup (nuage gris, cadre, repères) ; Galaxy et Saaz se distinguent sans un mot ; le
  cercle du stock situe mes houblons (Citra cryo, Sabro, Idaho 7 dans ou près du cadre).
- Casse : une plage large (Galaxy, α 11–16, huile 1,8–5) devient un point ; les points se chevauchent entre 10 et 14 %
  d'α ; 134 mots au premier écran (12 lignes), au-dessus de D1.

## Contrôles (24.10, soir)

- `concepts.mjs` : CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` : TRAIT OK (138 pictos, 0 faute).
- `controle-commun … --page=etat.html --sans=mots` : COMMUN OK.
- `controle-panel` (quatre captures) : PANEL OK (remplissage médian 0,70).
- `mots-premier-ecran --max=70 --modere` : 185 mots (118 hors données), MOTS ECHEC — v0, sauté.
- `controle-une-question` (D98) : indicatif, écran de recherche ; non joué sur cette page.

Captures (ouvertes) : `captures/rcb2.png`, `captures/rcb2-fiche.png`, `captures/rcb2-page.png`. Générateur :
`generer.mjs` ; données et pièces communes dans `../rcb1/`.
