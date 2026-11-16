OK — r1a, r2a, r1c, r1d corrigées selon les revues, recapturées, notes et contrôles verts

## Corrections cochées
- [x] r1a [crit. 1 à 4, brasseur, UX, artiste, greffes r2b et r1c] : champ ouvert, stock en icône par ligne, pastilles de style retirées, Pale Ale « 6 j de retard », « Brasser » sur la ligne, métro collé au nom, comparaison v3 / v2 dans le dépli, « 7 lignées aux Archives », Citra 250 g harmonisé.
- [x] r2a [B crit. 1 et 2, crit. 3 et 4, UX, artiste, greffes] : « manque Citra 250 g » partout, plus de texte coupé, groupe « Plus loin », Pale Ale en retard, boutons de 44 px, verbes en filet, une ligne par lignée, feuille Brasser de r1d, vide à trois sources.
- [x] r1c [B crit. 1 à 5, brasseur, UX, greffe artiste] :
  - 1280 : grille à deux colonnes, sans troncature.
  - Les cartes parlent de la recette : métro des versions, stock, « dernière : LOT-019, en cuve », barre à la couleur EBC.
  - Fin de section à 104 px : le tiroir passe au-dessus de « + Recette ».
  - Vide : « ce que tu brasses ».
  - Plus de doublons « Stout Stout » ni « Dunkel Dunkel ».
  - Chiffres à virgule en `tabular-nums` (« 5,2 % ») au lieu du mono.
  - Tiroir entier cliquable, onglets en décor.
  - « Rangée cette semaine : Helles v4 · Annuler » sous la phrase.
  - Puces « Compris : Dunkel (nom) · brune (couleur) » au geste.
- [x] r1d [crit. 1 à 5, brasseur, UX, artiste] :
  - La pastille ouvre une confirmation pré-remplie : « Stout · Sam. 21 · F3 libre après la mise en bouteille de la Pils », « Créer LOT-021 », « Annuler ». Rien n'est créé avant.
  - Marmite au lieu du ▶ : picto noir sur fond clair, la bière en anneau, une règle dans les deux thèmes.
  - Un seul étage fixe en bas : pas de lecteur au repos, la Pale Ale en retard en ligne de tête.
  - « Modifier » et « Comparer » écrits.
  - « exemple (fictif) » retiré ; NEIPA à 6,3 – 6,8 % ; un seul filtre actif.
  - Le stock en icône remplace l'alcool à droite.

## Fichiers écrits
- `voies/r1/r1a/etat.html`, `NOTE.md`, 6 PNG
- `voies/r2/r2a/etat.html`, `NOTE.md`, 6 PNG (recapturées après le `<br>` de la Pale Ale)
- `voies/r1/r1c/etat.html`, `NOTE.md`, 6 PNG + `r1c-repos-390-fin.png`
- `voies/r1/r1d/etat.html`, `NOTE.md`, 5 PNG + `r1d-repos-1280-clair.png` + `r1d-repos-390-fin.png`
- `voies/rx/capture-1280.mjs` (1280 de r1d), `voies/rx/capture-fin.mjs` (bas de page r1c, r1d), `voies/rx/tests.txt`
(chemins depuis `work/missions/2026-11-14-brassins/`)

## Critères (rejoués depuis la racine, sortie dans `tests.txt`)
- G1 : `IMAGES OK`
- G2 : `IDENTITE OK 4/4`
- G3 : `COCHE OK`

## Captures ouvertes
- r1c : repos 390 clair, fin, cave, 1280, geste, recette (deux fois : virgule du mono corrigée), vide.
- r1d : repos 390 clair, fin, geste, recette (deux fois : « 80 % » corrigé), vide, 1280, cave.
  - Sur la capture cave, l'anneau de la Stout se perdait ; c'est corrigé (anneau, plus un filet clair), mais la nouvelle capture n'a pas été rouverte.
- Non rouvertes : r1a vide, et les r2a recapturées (retouche d'un seul `<br>`).
- Restes connus :
  - r2a : `CIBLES<44` vient du chrome commun, hors OWNS.
  - r1c cave : les stations du métro de la Stout sont peu visibles.

Prédiction : r1d, « là je vois ce qui manque, et il me demande avant de créer le lot » ; r1c, « mon carnet du moment, sans redire l'onglet Brassins ».

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
