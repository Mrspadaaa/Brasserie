OK — série u, 4 mini maquettes Matériel (rayons, jauges, chaîne, anneaux) ; G1 SERIE OK, PANEL ECHEC

## Fichiers écrits
- `v0/u/uq1/etat.html` (froide : rayons d'Articles + échéance), `v0/u/uq2/etat.html` (tiède : une jauge d'intervalle par ligne),
  `v0/u/uq3/etat.html` (chaude : la chaîne du brassin en plan de ligne), `v0/u/uq4/etat.html` (chaude : grille de tuiles à anneaux).
- `v0/u/<id>/NOTE.md` ×4 ; 12 captures `v0/u/<id>/<id>-{repos,geste,repos-cave}-390.png`.
- uq2 à uq4 assemblés par un script hors dépôt (scratchpad `assemble.cjs`, split/join, L26), en-tête et barres repris de uq1.

## Critères
- G1 : `SERIE OK`.
- `controle-panel.mjs` (8 captures repos+geste) : **PANEL ECHEC** — remplissage médian 0,42 (< 0,55) ; ressemblance 0,91 (≥ 0,90) ;
  paires proches uq1~uq3 repos, uq3~uq4 geste. Cause : listes claires à filets fins, beaucoup de blanc entre les lignes ; fiches au
  même gabarit (titre, pastille, sections, pied à deux boutons). Non repris faute de contexte (agent à 185 k).
- Premier écran : mots hors noms 38 / 43 / 37 / 28 (en-tête et barres compris ; ≤ 60) ; texte < 12 px : 0 ; cible < 24 px : 0 ;
  `type="number"` : 0. `controle-choix` : sans objet (Matériel absent de `ecrans.json`). Tests : sans objet.

## Captures (toutes ouvertes en planche, clair, cave, geste)
`work/missions/2026-11-14-materiel/v0/u/uq{1,2,3,4}/uq{n}-{repos,geste,repos-cave}-390.png`

Prédiction : « Là je vois enfin ce qui est en retard et quand ; la chaîne avec la pompe qui casse le rail, ça c'est parlant. »

DÉCISION À PRENDRE : aucune bloquante. En passe 2 : remplir (fonds de rangée teintés, rangées plus serrées), différencier les fiches
(uq3 et uq4 trop proches), éprouver les pictos de uq4 à 12 px, dessiner « en panne » en un toucher (glisser) pour uq1.

CONNAISSANCE : la classe `-sub` de la sous-navigation entre en collision avec un sous-titre de fiche nommé `-sub` (écart de 4 px
de la sous-navigation et cadre gris parasite) : nommer `-sous` le sous-titre.
LEÇON PROPOSÉE : le BRIEF-AUTEUR qui demande à une série de n'en lire que §1 à §6 met les axes dans le même fichier : les placer
dans un fichier à part, sinon l'auteur les lit en ouvrant le brief (c'est arrivé ici).
