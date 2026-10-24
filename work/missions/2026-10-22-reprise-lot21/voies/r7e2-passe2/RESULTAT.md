OK — e5 passe 2 : frise gagner/payer, 10 greffes, 76 mots, huit critères verts

## Fichiers écrits
Tous sous `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/` :
- `e5/etat.html`, `generer.mjs`, `socle2.mjs` (copie du socle v0 : pictos de la planche standard, α et plage, départ à
  actif · 2 j), `captures.mjs`, `NOTE.md` ;
- `captures/` (captures et `geste-e5.json`) ; `captures/travail/` (retouches scriptées, copies du générateur, `gates.txt`).
La v0 n'est pas touchée.

## Ce qui a changé depuis la v0 (détail dans NOTE.md, § Passe 2)
- Greffes :
  - dock-profil (e1) ;
  - loupe des voisins ×4,3 sous le doigt (a1, b1) ;
  - « trop amer » en orangé (a8) ;
  - jury 3 → 8,1 sur 15 en ronds (c6) ;
  - « CO₂ et levure : ~−6 résineux » calculé (d1, d2), convention du moteur dite derrière le « ? » ;
  - bouton « le meilleur : actif · 2 j » (g4, g1) ;
  - hachure « IBU à cru ? » (g1) ;
  - jours sans gain hachurés au bout de la frise (e2) ;
  - texte de la levure qui suit le moment (g1, g4 ; Pomona ~+13 seulement à l'actif, calculé) ;
  - mesure qui suit le moment, avec « jamais mesuré » au whirlpool (c7, c5).
- Retouches :
  - α 12,7 % puis 9,5–14,9 (D87) ;
  - 12 barres l5b à un toucher, « Face à ta stout » gardé ;
  - pas de 5′ gradué et joué au clavier.
- Retouches communes : points partout, 76 mots, le meilleur et le piège, la levure en dernière étape, les conventions
  derrière le « ? ».
- Baseline : jauge d'amertume de y1b, jours de contact x3b au bout de la frise, pictos standard dont « épicé »
  cannelle et clou croisés.

## Sorties décisives (rejouées après la dernière retouche)
- G1 : `COMMUN OK`.
- G2 : `e5 76 mots`, `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)`.
- G4 : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`.
- G5 : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- G6, G7, G8 : `EXISTENT OK`, `NOTE OK`, `NOTE OK`.
- Geste au doigt (`captures/geste-e5.json`) :
  - départ : actif · 2 j ;
  - glissé : 50′, « floral ≈+4 · trop amer », ≈157 IBU ;
  - jours : actif · 7 j ;
  - après · 3 j : floral ~+23, résineux ~+20, jury de Lafontaine ;
  - 0 erreur.

## Captures ouvertes
`passe2/captures/e5-premier-ecran.png`, `passe2/captures/e5-390.png`, `passe2/captures/e5-toucher-390.png` (loupe à
50′), `passe2/captures/e5-apres-390.png`.

## Prédiction
« Très très bien celui-là : je vois ce que je gagne et ce que je paie à chaque moment, et la loupe suit le doigt. Mais
le jury et le CO₂, c'est sur Cascade ou c'est calculé ? »

CONNAISSANCE : `mots-premier-ecran` compte chaque jeton séparé par des blancs, y compris « · », « : », « › » et « ? ».
Dessiner les séparateurs et les flèches en CSS (::before, ::after) a fait passer e5 de 95 à 76 mots, sans retirer
d'information. De plus, `\s` couvre les espaces insécables : ils ne regroupent pas deux jetons.

LEÇON PROPOSÉE : un bloc balisé `data-acquis` doit avoir sa propre boîte. Le 23.10, le conteneur du geste ne
contenait qu'un curseur en position absolue : il mesurait 0 px et `controle-acquis` l'a jugé « caché au repos ». Il
faut donner au conteneur la position et la taille du curseur, ou poser la balise sur le curseur lui-même.
