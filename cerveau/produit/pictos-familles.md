---
name: pictos-familles
description: Pictos des 12 familles d'arômes : où ils vivent, leurs règles (au trait, ton de la famille), les symboles déjà pris, et l'histoire du picto « épicé » (deux refus, planche r4 au choix du brasseur).
type: produit
maj: 2026-10-22
sources: work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html ; work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json ; work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs ; work/refonte-frontend/registre.md (lot 15, lot 21) ; work/refonte-frontend/v4/SPEC-BRASSEUR.md ; work/refonte-frontend/v4/ecran-1/fils22-picto-epice/NOTE.md ; work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/RESULTAT.md
---

**Où** : symboles `p-<famille>` de `fils17-standard/v3/planche.html` (viewBox 24, trait 2.571, bouts
ronds) ; tons dans `jetons-familles.json` (Épicé : base `#7a4e3a`) ; posés par `picto(f, w)` de
`l8g/noyau.mjs`, toujours avec `data-famille`.

**Règles** : au trait, sans halo ni disque pâle (D88, `controle-pictos-trait.mjs`) ; ton de la
famille, c'est le code couleur des arômes, un acquis ([[acquis-valides]]).

**Symboles déjà pris, à ne pas réutiliser pour une autre famille** : feuille (Herbacé), brins
(Végétal), sapin (Résineux), monticule (Terreux), roue à rayons (Agrumes), fleur (Floral), flamme
(ébullition, icône d'action).

**Picto « épicé »** :
- lot 15 : « pico épice très étrange, plutôt vanille, canelle ? ». Lu comme « ressemble à une
  vanille », il a été remplacé par des grains de poivre (5 cercles) ;
- lot 21 : « épicé l'icone est toujours pas bon.. ». Le poivre est donc refusé deux fois ;
- 22.10, planche r4 (`fils22-picto-epice/`) : 7 propositions au trait, cannelle, vanille, badiane,
  girofle, mortier, coriandre et saupoudreur. La planche couvre les deux lectures de la phrase du
  lot 15. Relue et acceptée par un relecteur Sonnet, **puis refusée par le brasseur : « Aucun me
  convient... »** (croix rouge sur les sept). Toutes étaient du même genre : une épice en petit objet
  brun ;
- 22.10, planche r4c (concepteur Opus, `fils22-picto-epice-2/`) :
  - première passe, six genres (lettre, mot, piment, volutes, zigzag, couronne) : rejetée par le
    critique Fable ;
  - planche resserrée : trois dessins de piment et le mot « épicé » en repli, montrés à côté d'Herbacé
    et de Végétal, à 12 et 16 px. Acceptée par le critique, avec en tête p1 « calice et crochet ».
    Réserve à dire au brasseur : piquant n'est pas l'épicé du houblon. **Choix du brasseur en
    attente** ;
- contrôle : D101 et D101 bis (`controle-planche-picto.mjs`, `--refuses --genres --voisins`, témoins
  `planche-poivre.html` et `planche-r4-refusee.html`).
