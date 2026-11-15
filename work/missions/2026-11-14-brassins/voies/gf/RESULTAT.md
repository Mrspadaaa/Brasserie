OK — 4 greffes s4a × s6c (froide, 2 tièdes, chaude), identité OK, 13 captures

## Fichiers écrits (tous dans voies/gf/)
- `capture.mjs` (gabarit de s6, ids gf) ; `tests.txt` (sortie des CHECK ; aucune suite Vitest, rien dans `src/`)
- `gfa/` froide — s4a allégé, houblons dessous : etat.html, NOTE.md, repos/geste/cave 390, repos 1280 clair
- `gfb/` tiède — houblons d'abord, frise du temps dessous : etat.html, NOTE.md, repos/geste/cave 390
- `gfc/` tiède — dry hop sur l'axe, houblons pendus à leur jour par un fil : etat.html, NOTE.md, repos/geste/cave 390
- `gfd/` chaude — le graphique est l'écran, le jour J+6 s'ouvre et porte les colonnes : etat.html, NOTE.md, repos/geste/cave 390

## Critères (rejoués depuis la racine, `tests.txt`)
- G1 : `GREFFES OK`
- G2 : `IDENTITE OK 4/4`
- G3 : `HORS OK`

## Premier écran (contre 16 éléments pour s4a)
gfa 7 · gfb 6 · gfc 6 · gfd 5. Tous : feuille de l'app, carnet · stock · dossier à côté du × (k4 B0), un accès Mesurer au pied,
°C cuve « — / 19 » au pied, valeurs en ligne en Source Sans tabulaire (k3 n° 6), α et rôle unifiés sur roles.ts (k4).

## Captures
Ouvertes et corrigées : gfa-repos-390-clair, gfa-geste-390-clair (avant la feuille empilée), gfc-repos-390-clair (avant la correction
« 1,018 » et la hauteur 210), gfd-repos-390-clair (avant la correction des étiquettes et du bloc provisoire).
**Non ouvertes** (contexte de l'agent à 175 k, consigne « vers 150 k, rends ») : gfb-repos/geste/cave, gfc-geste et cave,
gfd-geste et cave, gfa-cave, gfa-repos-1280-clair, et les versions finales de gfc-repos et gfd-repos. Voir DEMANDE EXECUTANT.

Prédiction : « gfd, là je vois mon temps et mes houblons au jour où je les mets ; gfa c'est s4a en propre. »

## DEMANDE EXECUTANT
1. `cd work/missions/2026-11-14-brassins/voies/gf && node capture.mjs gfa:repos gfa:geste gfa:repos:cave gfa:repos:clair:1280 gfb:repos gfb:geste gfb:repos:cave gfc:repos gfc:geste gfc:repos:cave gfd:repos gfd:geste gfd:repos:cave` → 13 lignes `<id>-….png {"h":…}`.
2. Rejouer G1 à G3 de GATES.md → `GREFFES OK`, `IDENTITE OK 4/4`, `HORS OK`.
3. Captures à ouvrir et juger (renvoyer au concepteur ou au critique, liste numérotée « combien et quels problèmes ? ») :
   les 13 PNG ci-dessus, à côté de `voies/s4/s4a/s4a-repos-390-clair.png` et `voies/s6/s6c/s6c-repos-390-clair.png`.
   Points à regarder : gfa-1280 (graphe J+0…J+12 à gauche, houblons à droite, pas de demi-écran vide) ; gfb (frise et liseré de
   phase lisibles, bandeau au-dessus du pied) ; gfc-geste (fil de Citra parti de J+5) ; gfd-geste (pied m2 qui pousse le graphique,
   point creux 1,016 sur J+5) ; les quatre caves (encres or et vert lisibles sur fond sombre).

DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un concepteur de 4 greffes à 45 tours dépasse 150 k s'il ouvre chaque image ; confier les captures cave/geste à un exécutant dès la première passe.
