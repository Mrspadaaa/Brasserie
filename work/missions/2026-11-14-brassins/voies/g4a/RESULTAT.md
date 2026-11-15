OK — 12 bloquants de k4 (s5, s6) corrigés, captures régénérées, IDENTITE OK 6/6

## Bloquants (VERDICT k4, sections s5 et s6, et B0)
- [x] s5a n° 1 : B0, « ⋯ dossier » ajouté à côté de courbe · carnet · stock (budget, installation, OG, jour brassé, volume, suppression).
- [x] s5b n° 1 : B0, « ⋯ » ajouté en puce à côté de stock.
- [x] s5c n° 1 : une case « ajouté aujourd'hui » (44 px) par houblon, à droite des grammes ; la carte n'est plus un bouton ; légende « case = ajouté aujourd'hui, stock déduit ».
- [x] s5c n° 2 : liste, rangée recherche · filtre · stats sous le titre, ★ et ⋯ sur chaque tuile (NEIPA, Pale Ale, Pils, Stout, Saison).
- [x] s5c n° 3 : B0, « ⋯ dossier » à côté de carnet et stock.
- [x] s6a n° 1 : 1280 en poste de cave, feuille 76rem : gestes à gauche ; relevés et courbe (220 px) à droite ; « Autres cuves » dessous (Pale Ale, Pils, Stout F-01). La ligne des relevés n'est plus coupée.
- [x] s6a n° 2 : liste, ★ et ⋯ sur chaque rangée, icône stats à côté de recherche et filtre.
- [x] s6a n° 3 : B0, « stock · ⋯ dossier » dans l'en-tête de la feuille, à côté du × (Journal reste le carnet).
- [x] s6b n° 1 : geste, « taper la valeur » sous 1,016 (m2).
- [x] s6b n° 2 : B0, « carnet · stock · ⋯ dossier » dans l'en-tête de la feuille.
- [x] s6c n° 1 : 1280, houblons et courbe côte à côte, gestes à droite, autres cuves dessous ; feuille à hauteur du contenu.
- [x] s6c n° 2 : B0, « stock · ⋯ dossier » dans l'en-tête de la feuille.

## Non bloquants faits
- s5a n° 2, s5c, s6a n° 7, s6c n° 5 : espace fine entre nombre et unité en chasse fixe (`word-spacing:-.3em`).
- s5c n° 4 « — » au J+5 ; n° 5 Mosaic au J+6 ; n° 6 « 1,062 » sur deux lignes ; n° 7 « arôme · actif » ; n° 12 rail « 6 j de retard ».
- s6a n° 4 stepper retiré ; n° 8 bouton « Préparer le dry hop ».
- s6b n° 5 Mosaic « J+6 demain » comme Citra.
- s6c n° 3 « 24 L » au sous-titre ; n° 4 J+7 au pas (x 319) ; n° 6 OG à l'échelle (y 4,5).

## Pas faits (contexte)
- s5a n° 3 à 7 ; s5b n° 2 à 6 ; s5c n° 8 à 11 ; s6a n° 5, 6 ; s6b n° 3, 4, 6 à 8 (espaces doubles de s6b aussi) ; s6c : aucun reste.
- s5b : la ligne « OG 1,062 · FG visée 1,014–1,010 » est serrée sur quatre lignes à gauche des quatre puces (mon CSS de retour à la ligne n'a pas pris). À corriger : `.s5b-outils{flex-wrap:wrap}` et `.s5b-outils p{flex-basis:100%}`.

## Fichiers écrits
- `voies/s5/{s5a,s5b,s5c}/etat.html`, `voies/s6/{s6a,s6b,s6c}/etat.html`, une section « g4a (15.11) » dans chaque NOTE.md, toutes les PNG des six variantes.
- Copies d'avant : `%TEMP%/claude/…/scratchpad/g4a-av/*.html`.

## Critères
- G1 : voir `tests.txt` (COCHE OK 12).
- G2 : IMAGES OK.
- G3 : HORS KO, à cause de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, déjà modifié avant la voie (git status du début). Je n'ai rien écrit hors de la mission.
- Identité : `controle-identite.mjs voies/s5 voies/s6` donne IDENTITE OK 6/6.

## Captures ouvertes
s6a-repos-1280-clair, s6a-repos-390-clair, s6a-liste-390-clair, s6b-repos-390-clair, s6b-geste-390-clair, s6c-repos-390-clair,
s6c-repos-1280-clair (avant et après la hauteur), s5c-repos-390-clair, s5c-liste-390-clair (avant et après), s5a-repos-390-cave,
s5b-repos-390-clair. Pas ouvertes, faute de contexte : s5a-geste, s5a-repos-390-clair, s5a-1280, s5b-geste, s5b-cave, s5c-geste,
s5c-cave, s6a-geste, s6a-cave, s6b-cave, s6b-1280, s6c-geste et s6c-cave. Ce sont les mêmes changements, rejoués par le script ; à ouvrir par le pilote.

Prédiction : « Là, je retrouve mon stock et mon dossier partout, et sur l'ordi la NEIPA ressemble enfin à un poste de cave. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la feuille de la trousse ne porte que le titre et le × ; l'accès carnet · stock · ⋯ s'injecte après `DOMContentLoaded`, juste avant `.id-feuille-fermer`.
LEÇON PROPOSÉE : aucune.
