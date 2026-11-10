# p5a — Prévisions : chaque marche dit son nom (froide)

Idée : p4a telle qu'il l'a vue (deux cartes Sans / Avec, l'escalier, la liste numérotée), où les étiquettes de p1b reviennent **sur l'escalier** : chaque marche porte son nom, son montant et sa date (−3 000 frigo 15.11, −57 brassin 20.11, −400 loyer 25.11, −7 impôt, −750 fermenteur), le passage sous zéro en rouge à sa date, les deux fins écrites au bout. Un seul chemin plein (le choisi), l'autre en pointillé avec sa fin. Le graphe passe de 232 à 300 px, les étiquettes de 12 à 13 px.

## Ce qui change par rapport à p4a
- Les pastilles numérotées (2, 3, 5) partent : le nom et le montant sont écrits sur la marche (« on perd l'info directement sur le graph »).
- Les deux cartes de projet sous le graphe partent ; leurs sources vont dans la liste (Frigo : usure 600, litre 8,01 ; Pale Ale : recette, stock, facture), ce qui rend la place au graphe.
- Annexe : « Sans frigo », l'échelle se resserre, chaque marche garde son nom, la case pointillée dit ce que ferait le frigo (fin à −892,66).

## Problèmes de l'inventaire
15, 16, 24, 86-métier (point bas et date), et sa remarque du 09.11 (l'info sur le graphe).

## Honnêteté
Chiffres de la fixture et du brief passe 3 ; frigo « exemple » ; fermenteur « devis » sans date (28.01 posé pour le dessin, comme p4a) ; « Entrées : aucune » ; « estimé » sur la fin.

## Boosters
horizon (segment) · avant-apres (deux cartes) · escalier-nomme · sources (dans la liste) · notions (à payer / prévu).
B1 OK · B2 OK (cartes puis escalier, un primaire) · B3 OK (60 mots) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (annexe) · B9 s.o. · B10 OK · B11 OK (« −3 000 frigo le 15.11, puis loyer, sous zéro le 25.01 ») · B12 OK · B13 OK (cartes 62 px, lignes 27 px, segment 28 px).

## Contrôles
PAGE OK · 1280 OK (débord 0) · MOTS 60 · COMMUN OK (couleurs, survol, blocs, contraste, standard, parlant, brutes ; `--acc` déclaré dans `:root`, voir RESULTAT) · PANEL OK (lot des six). Statique, sans script ; séparateurs écrits en virgules (le « · » compte pour un mot).

## Tient / casse
Tient : la lecture en trois secondes (le frigo est la grande marche nommée, la fin rouge est écrite). Casse : à 12 mois, les étiquettes se chevaucheraient ; il faudrait n'écrire que les marches de plus de 100 CHF.
