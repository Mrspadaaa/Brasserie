---
name: pictos-familles
description: Pictos des 12 familles d'arômes : où ils vivent, leurs règles (au trait, ton de la famille), les symboles déjà pris, ce qui se lit à 12 px, et l'histoire du picto « épicé » (quatre refus ; épices réelles demandées, entonnoir r4d).
type: produit
maj: 2026-10-23
sources: work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html ; work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json ; work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs ; work/refonte-frontend/v4/SPEC-BRASSEUR.md ; work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/RESULTAT.md ; work/missions/2026-10-22-reprise-lot21/voies/r4d-a-douce/RESULTAT.md (et r4d-b à r4d-f)
---

**Où** : symboles `p-<famille>` de `fils17-standard/v3/planche.html` (viewBox 24, trait 2.571, bouts
ronds) ; tons dans `jetons-familles.json` (Épicé : base `#7a4e3a`) ; posés par `picto(f, w)` de
`l8g/noyau.mjs`, toujours avec `data-famille`.

**Règles** : au trait, sans halo ni disque pâle (D88, `controle-pictos-trait.mjs`) ; ton de la
famille, c'est le code couleur des arômes, un acquis ([[acquis-valides]]). Pas de hachures dans un
picto : dans l'app, le hachuré veut dire « inconnu ».

**Symboles déjà pris, à ne pas réutiliser pour une autre famille** : feuille (Herbacé), brins
(Végétal), sapin (Résineux), monticule (Terreux), roue à rayons (Agrumes), fleur (Floral), flamme
(ébullition, icône d'action). Un triangle sur une hampe devient le sapin ; une plume, la feuille.

**Ce qui se lit à 12 px** (séries r4d, 22.10) : la lisibilité ne se voit qu'en vrais pixels (densité
1, agrandis ×4, sans lissage) ; deux tiers des dessins justes à 96 px étaient faux à 12 px.
- Un contour ne garde un blanc visible que si ses bords sont à 4,6 unités au moins ; 2 unités de jour
  au moins entre deux traits. Une silhouette fermée ou trois traits au plus résistent.
- Deux silhouettes à quatre pointes (losange, étincelle) se confondent ; une composition de deux ou
  trois objets ne se lit plus à 16 px : essayer un objet seul, puis ajouter.
- Épices réelles : seuls le clou de girofle (silhouette d'épingle) et la badiane (étoile à huit) se
  nomment sans hésiter à 12 px ; réglisse et coriandre à 16 px. Graines et fruits ronds (anis, carvi,
  tonka, muscade, genièvre) retombent sur goutte, ovale ou « grain de café ». La cannelle n'a pas
  encore de dessin qui se nomme sous 24 px (« trombone », « pilule »).
- Le clou : bouton presque plein (rayon 1,7), couronne de trois sépales serrés, tige effilée ; en
  anneau, il se lit « clé » ou « épingle ».

**Picto « épicé »**, quatre refus :
- lot 15 : « pico épice très étrange, plutôt vanille, canelle ? » ; lot 21 (grains de poivre) :
  « épicé l'icone est toujours pas bon.. » ;
- 22.10, planche r4 (sept épices-objets brunes) : « Aucun me convient... » ;
- 22.10, planche r4c (trois piments et le mot) : « Il y a que 3 variante, qui sont toutes quasiment
  identique ??? » ; « un piment n'a rien à voir la dedans... ». Un seul auteur convergeait ;
- 22.10, nuit, il précise : « Je veux un forme qui représente vraiment ce que c'est, genre canellle
  vanille, ou clou de girofle ect... » (D101 quater) : une épice réelle, pas un signe ni une sensation ;
- r4d en entonnoir (`fils22-picto-epice-3/`) : 48 propositions en six séries, dont 32 épices réelles
  (A, D, E, F) ; B (sensation) et C (signe) classées et montrées sans passe 2. Tri, passes et choix du
  brasseur en attente.
- Contrôles : D101 à D101 quater (`controle-planche-picto.mjs` : `--refuses`, `--genres`, `--voisins`,
  `--ter`, `--epices=N`), témoins dans `tournoi/outils/temoins/`.
