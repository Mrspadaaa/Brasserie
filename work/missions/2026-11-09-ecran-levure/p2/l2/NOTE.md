# l2 — la ligne r1 (p6-b2) et la bande compacte de r3 ; tout tient au premier écran (tiède, passe 2, 09.11)

Idée : la ligne de p6-b2, dose à droite comme les kg, avec sous elle, dans le même cadre, la bande de r3 en une hauteur de ligne
(FG · température fiche + conduite · floculation) ; le champ et la station Conduite entière au premier écran.

## D'où vient chaque partie
- r1 : la ligne (picto, nom, « 2–3 sachets » à droite, ×, flèche de sélection), la sous-ligne « sèche · Fermentis · 15–24 g » et sa
  mini-piste en grammes (plage hachurée, traits de sachet). La carte Dose de r1 est ôtée (doublon relevé par le critique).
- r3 : les trois repères, réduits en trois cellules (piste FG teal sur 1,000–1,070 avec OG en trait ; dégradé froid → chaud, plage
  cerclée, poignée de conduite à 19 °C ; trois segments de floculation).
- s1 : le champ toujours prêt et ses puces. Conduite : la station de sa capture, restylée (traits et typo de la maquette), sans
  « Brouillon », sans « 3 points à vérifier », sans phrase d'aide ; « Jours de bascule et légende » replié hors du premier écran.

## Cadres
1 repos (levure, bande, champ, conduite) · 2 floculation touchée → « recherche… » dans sa cellule · 3 résultat : la cellule dit
« moyenne à haute » en segments tiretés, et une rangée s'ouvre sous la bande : « à confirmer · fiche Fermentis · vue le 09.11 ·
Corriger · Garder » · 4 pas de levure (ligne tiretée « Levure à choisir », « — sachets », champ prêt) · 5 produit exact non choisi
(« — sachets », « choisis le sachet pour la dose »).

## Honnêteté
- Valeurs US-05 de la fiche (2–3 sachets, 15–24 g, FG 1,012–1,015, 18–26 °C). **Fictif** : le résultat de floculation du cadre 3.
- Inconnu : segments gris unis ; « à chercher » avec la loupe. Ni prix ni « Brouillon ».
- Seul écart de mots du cadre vide : « la dose viendra de sa fiche » (état vide, B8).

## Boosters UX
- `ligne-levure`, `dose-sachets` (mini-piste grammes), `bande-reperes` (trois pistes et la poignée de conduite), `chercher`,
  `champ-levure`, `conduite` (↕ ↔).
- B1 OK · B2 ~ (la ligne domine, la conduite pèse autant) · B3 77 mots · B6 ~ (12, 13, 14, 20, 26) · B8 OK · B9 s.o. · B11 « US-05,
  2–3 sachets, et sa conduite à 19 °C dans sa plage » · B12 OK (p6-b2) · B13 ~ (cellules de 115 px, poignée 22 px).

## Contrôles
- PAGE OK. Mots : **77** (> 72) ; 49 hors données. Écart : environ 20 mots sont les graduations et étiquettes du graphe de conduite
  (0, 10, 20, 30, J0 à fin J12, 19 °C ×3, 4 °C), acquis repris tel quel et visible en entier ici ; hors graphe, 57.
- PANEL (4 cadres p2l) : médiane 0,66 · ressemblance 0,93 → PANEL ECHEC (chrome imposé). CHOIX OK (levure ouvert).
- Captures : `l2-haut.png`, `l2-page.png`, `l2-cadres.png`, `l2-c1.png` à `l2-c5.png`.
