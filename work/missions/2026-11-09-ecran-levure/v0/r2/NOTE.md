# r2 — les sachets dessinés, la jauge du fabricant, les repères en pastilles

Chaleur : **tiède** (l'approche de la série r : dose en sachets, plage du fabricant en jauge, repères en pastilles).
Axes : A1 carte compacte · A2 sachets entiers dessinés + jauge g/hL où tombe chaque nombre de sachets · A3 le nom est le champ, puces dessous · A4 FG et alcool en plage.
Idée : la dose se compte en sachets dessinés, et la jauge du fabricant montre que 2 sachets tombent dans la plage, 3 au-dessus.

## Ce qui est montré
- Le nom « SafAle US-05 » est le champ (souligné pointillé, loupe) ; « sèche » ; puces : Nottingham (stock), S-04, « + hors catalogue ».
- Panneau sachets : 2 sachets pleins + 1 hachuré (plage 2–3), **2–3 sachets**, 15–24 g ; jauge 0–120 g/hL, plage 50–80 hachurée, repères ① 38 · ② 77 (dans la plage, or) · ③ 115 g/hL. Toucher un sachet ou un repère choisit ce nombre.
- Pastilles : atténuation 78–82 %, température 18–26 °C, floculation « à renseigner » (pointillé), tolérance 9–11 % ; FG 1,012–1,015, alcool 6,8–7,1 %.
- Conduite › Paliers ; Fiche ⌄ (esters faibles, biotransformation non documentée, corriger) ; Produit ⌄ (sachet 11,5 g, offres) ; Comparer.
- Annexe : pas de levure (sachet vide) ; produit exact non choisi (sachet « ? ») ; deux levures en relais (Voss kveik puis Brettanomyces).

## Acquis J5
Catalogue (le nom-champ) · hors catalogue (puce) · fiche corrigeable (Fiche ⌄ ou une pastille) · Comparer · produit exact (Produit ⌄).

## Contrôles
- COMMUN OK (lot r) ; **77 mots** ; PAGE OK.
- Captures : `r2-haut.png`, `r2-page.png`, `r2-1280.png`, `r2-geste-avant.png`, `r2-geste-apres.png` (③ touché : « 115 g/hL au-dessus de la plage »).
- Panel : premier écran le plus vide du lot (remplissage 0,49).

## Boosters UX (boosters-ux)
- sachets — ajuster ; sachets dessinés touchables ; se remplissent au choix.
- jauge-fabricant — lire/choisir ; repères numérotés sur la plage g/hL ; verdict dans/sous/au-dessus.
- saisie-sachets — ajuster ; champ `inputmode=numeric`.
- nom-champ, puces-levure, hors-catalogue — choisir ; changent nom, sachets, jauge et pastilles (Nottingham : 50–100 g/hL).
- pastilles-reperes — lire ; ouvrent la fiche.
- B1 OK · B2 OK (le panneau sachets domine au flou) · B3 OK (77 mots) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (3 états) · B9 non mesuré · B10 OK · B11 OK (« 2 à 3 sachets, 2 dans la plage ») · B12 OK · B13 OK (repères 28 px).

## Tient / casse
- Tient : la plage fabricant devient une image honnête ; on voit pourquoi « 2–3 ».
- Casse : le bas du premier écran reste clair (remplissage 0,49) ; le nom-champ peut surprendre (on efface le nom en le touchant).
