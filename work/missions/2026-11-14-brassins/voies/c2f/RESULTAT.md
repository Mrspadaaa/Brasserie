OK — 7 bloquants de c2 corrigés (s1e2, s1g, s3b2), 18 images recapturées et ouvertes

## Fichiers écrits
- `voies/p2a/s1e2/etat.html`, `voies/p2a/s1g/etat.html`, `voies/p2c/s3b2/etat.html` (corrections seules, rien redessiné).
- Les 18 PNG des trois variantes (six chacune), recapturés ; une ligne « Correctifs c2f » ajoutée à chaque NOTE.md.
- `voies/c2f/c2f-edit.mjs` (remplacements vérifiés, un par cible), `c2f-cap.mjs` (captures), `c2f-planche.mjs` (planche de revue dans os.tmpdir), `c2f-cap.txt`, `tests.txt`.

## Bloquants (image qui le prouve)
- [x] s1e2-1 : la ligne « Blanche · LOT-011 » est retirée de Clos ; restent Stout LOT-015 et Saison LOT-012 (`p2a/s1e2/s1e2-liste-390-clair.png`).
- [x] s1e2-2 : la pastille ① est posée au-dessus de la barre NEIPA, et ② reste sur le 15.11. Plus aucun recouvrement (`s1e2-liste-390-clair.png`).
- [x] s1e2-3 : tableau 1280 : 12.11 éch. 20,5 °C ; 10.11 éch. 20,0 °C ; 09.11 éch. « — » (`s1e2-repos-1280-clair.png`).
- [x] s1g-1 : Blanche et Brune retirées de Clos (`p2a/s1g/s1g-liste-390-clair.png`).
- [x] s1g-2 : même tableau 1280 corrigé : 20,5 / 20,0 / — (`s1g-repos-1280-clair.png`).
- [x] s1g-3 : à 1280, l'étiquette « 1,018 » passe sous le point, à gauche, hors du trait (`s1g-repos-1280-clair.png`).
- [x] s3b2-1 : au dry hop, le fil vert de J+5 s'arrête 24 px au-dessus de l'étiquette « 1,018 » (`p2c/s3b2/s3b2-dryhop-390-clair.png`).

## Non bloquants corrigés en une ligne
- [x] s1e2-4 et s1g-7 : bandes repos et garde et marches de consigne à J+7 et J+10 (avant : J+6,5 et J+9,5). Les étiquettes sont recentrées (`*-repos-390-clair.png`).
- [x] s1e2-5 : « OG 1,062 » et « 1,058 » ont leur chiffre sur la courbe (`s1e2-repos-390-clair.png`).
- [x] s1e2-6 et s1g-6 : « densité — Relever » (souligné) au-dessus du densimètre. Dans s1g, le texte est décalé à gauche pour ne pas croiser le fil du dry hop (`s1g-dryhop-390-clair.png`).
- [x] s1e2-7 et s1g-8 : les cases °C J+1 à J+4 portent « J+n ».
- [x] s1g-5 : au repos, sous le dry hop : « au geste : stock −180 g, daté du jour » (`s1g-repos-390-clair.png`).
- [x] s3b2-2 : « ? » remplacé par « — » dans le cercle du jour (`s3b2-repos-390-clair.png`).
- [x] s3b2-3 : la pastille « 13.11 · bande +0,004 » passe de l'ambre au neutre (fiche et liste).
- [x] s3b2-4 : « 1,018 · éch. 20,5 °C » au repos.
- [x] s3b2-5 (en partie) : sur la mini courbe de la Pils, « 1,010 » est resserré.
- [x] s3b2-7 : la grille porte J0 1,062 et J+2 « — ».

## Laissés (pas en une ligne, à la passe suivante)
- s1g-4 : les cases °C ne sont pas alignées sur les colonnes de la courbe.
- s3b2-5 : les espaces autour des chiffres en mono viennent de la police, pas du texte.
- s3b2-6 : à 1280, le tiers bas reste vide et le texte est de 10 à 11 px.
- Doutes de c2 non traités : axe °C cassé, « cuve libre ».
- Nouveau : la liste de s1g a environ 150 px vides en bas, depuis le retrait des deux lots inventés. Aucun autre lot n'est permis.

## Critères (sorties dans `voies/c2f/tests.txt`)
- c2f G1 : `INVENTE OK` · c2f G2 : `COCHE OK`.
- p2a G1 : `PASSE OK` · p2a G2 : `MESURE OK` · p2c G1 : `PASSE OK` · p2c G2 : `MESURE OK`.
- Captures (`c2f-cap.txt`) : 18 images, `petits=[]`, sw = largeur de vue, aucune erreur JS, aucun nom inventé dans le texte rendu.

## Captures (toutes ouvertes)
- `voies/p2a/s1e2/s1e2-{repos,geste,dryhop,liste}-390-clair.png`, `s1e2-repos-390-cave.png`, `s1e2-repos-1280-clair.png`
- `voies/p2a/s1g/s1g-…` (mêmes six) ; `voies/p2c/s3b2/s3b2-…` (mêmes six). Planche geste et cave de s1g et s3b2 : `os.tmpdir()/c2f-planche.png`.

Prédiction : « Là c'est mes brassins, plus de Blanche. Le 1 et le 2 se lisent, et la densité, je sais où la relever. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
