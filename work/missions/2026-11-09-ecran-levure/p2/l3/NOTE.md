# l3 — r3 en un seul bloc : la dose au fond du densimètre (chaude, passe 2, 09.11)

Idée : un seul bloc dense. Une colonne de densité plate (1,070 en haut, 1,000 en bas) se lit de haut en bas : OG 1,066, la flèche
d'atténuation 78–82 %, la bande FG 1,012–1,015, puis, au fond, là où la levure se dépose, les sachets et la dose en 44 px. Sous elle,
la température (fiche + conduite) et la floculation, qui est ce dépôt même.

## D'où vient chaque partie
- r3 : densimètre, atténuation, FG et alcool en plage, température, floculation. Sans établi sombre, sans thermomètre ni éprouvette
  dessinés (« moins fantaisiste ») ; la colonne est un simple trait à bord arrondi.
- u3 : la flèche d'atténuation de l'OG vers la FG (greffe 5 du critique). r2 : les sachets dessinés. z3 : le dépôt au fond.
- s1 : champ et puces sous le bloc. Conduite : la station de sa capture, restylée à peine, sous le champ (cadre 6 pour la voir entière).

## Cadres
1 repos · 2 floculation touchée (le fond de la colonne se teinte, « recherche… », 4/20 aujourd'hui) · 3 résultat : le fond hachuré
tireté (proposé), « moyenne à haute », « à confirmer », source, Corriger / Garder · 4 pas de levure (colonne vide, FG « — », sachets
vides, « dose de sa fiche ») · 5 produit exact non choisi · 6 repos plus bas, la conduite entière.

## Honnêteté
- La dose ne fait pas la FG : les sachets sont posés au fond de la colonne (le dépôt), pas sur un axe de densité ; la FG vient de
  l'atténuation de la fiche à la dose du fabricant. À relire par le critique : le voisinage pourrait suggérer « plus de sachets,
  FG plus basse » (ce que le modèle ne calcule pas).
- 4 sachets dessinés : 2 pleins, 1 hachuré (haut de la plage), 1 vide (un de plus, au toucher) ; aucun chiffre exact au repos.
- **Fictif** : le résultat de floculation du cadre 3. Aucun prix, aucun « Brouillon ».

## Boosters UX
- `densimetre` — lire ; colonne OG → FG, sucres mangés hachurés, FG en bande.
- `dose-sachets` — ajuster ; sachets à toucher (segments 1 à 4), « 2–3 » en 44 px, la plus grande chose de l'écran.
- `temperature` — ajuster ; dégradé, plage fiche cerclée, poignée ↔ de la conduite à 19 °C.
- `chercher`, `champ-levure`, `ligne-levure`, `conduite`.
- B1 OK · B2 OK (le bloc, puis la dose) · B3 72 mots · B6 ~ (12, 13, 14, 20, 44) · B8 OK · B9 s.o. · B11 « US-05 : de 1,066 à
  1,012–1,015, 2–3 sachets » · B12 ~ (la colonne est neuve, le reste s1) · B13 ~.

## Contrôles
- PAGE OK. Mots : **72** (42 hors données). PANEL (4 cadres p2l) : PANEL ECHEC par la diversité 0,93 (chrome imposé). CHOIX OK.
- Captures : `l3-haut.png`, `l3-page.png`, `l3-cadres.png`, `l3-c1.png` à `l3-c6.png`.
