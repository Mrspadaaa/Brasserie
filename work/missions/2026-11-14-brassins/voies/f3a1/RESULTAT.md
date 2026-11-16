OK — 7 bloquants e1 corrigés (24 L, 1280 rempli, DH, cadre), 10 images régénérées

## Bloquants (VERDICT c5a)
- [x] e1a n° 1 : en-tête « 45 L » → « 24 L » (DONNEES-COMMUNES), repos et geste.
- [x] e1b n° 1 : rail « Brassage · F2 45 L » → « 24 L ».
- [x] e1b n° 2 : à 1280, cuverie de la semaine et recette descendues dans la colonne gauche sous les jours (grille à zones « a b / c b ») ; plus de moitié vide.
- [x] e1b n° 3 : pastille « DH » posée dans la case di 15 (à côté de « di »), plus mangée par le cadre de lu 16, en cave comme en clair.
- [x] e1c n° 1 : en-tête « 45 L » → « 24 L ».
- [x] e1c n° 2 : cadre du jour passé derrière les barres (z-index, fond de colonne) ; « stable 1,010 » et le bloc PA ne sont plus traversés.
- [x] e1d n° 1 : tuile Cuve « 45 L visés » → « 24 L visés ».

## Non bloquants faits
- e1a n° 2 : titre au repos « Lundi 16.11 », retard dans la ligne « Prévue le 08.11 · 6 j de retard ».
- e1a n° 3, e1b n° 5, e1c n° 6 : « FG visée » → « FG cible ».
- e1a n° 4 : « déstocké au brassage » retiré de la tuile Stock.
- e1a n° 5 : libellés du curseur de jours descendus (top 50 px), le pouce ne les touche plus.
- e1c n° 3 : étiquette « lu 16 · +2 j » dans la rangée F2, à gauche du bloc PA.
- e1d n° 3 : pastille ocre et « aujourd'hui · sans starter ».

## Non faits (et pourquoi)
- « À définir » (e1b n° 4, e1c n° 4, e1d n° 6) : demande un menu ou un état neuf, pas une ligne de CSS ; passe 2.
- e1c n° 5 (étapes du starter au toucher), e1d n° 2 (Ingrédients en icône), n° 4 (plan du starter), n° 5 (vide du geste) : changent la composition ; passe 2.
- e1a, e1c, e1d n'ont toujours ni cave ni 1280 (doute du verdict, hors des 7 bloquants ; plan de capture.mjs inchangé).

## Fichiers écrits
- work/missions/2026-11-14-brassins/voies/e1/e1a|e1b|e1c|e1d/etat.html et NOTE.md (§ Corrections f3a1) ; les 10 PNG de capture.mjs (mêmes noms).
- work/missions/2026-11-14-brassins/voies/f3a1/RESULTAT.md, work/missions/2026-11-14-brassins/voies/f3a1/tests.txt.

## Captures (toutes ouvertes)
- work/missions/2026-11-14-brassins/voies/e1/e1a/e1a-repos-390-clair.png, e1a-geste-390-clair.png
- work/missions/2026-11-14-brassins/voies/e1/e1b/e1b-repos-390-clair.png, e1b-geste-390-clair.png, e1b-repos-390-cave.png, e1b-repos-1280-clair.png
- work/missions/2026-11-14-brassins/voies/e1/e1c/e1c-repos-390-clair.png, e1c-geste-390-clair.png
- work/missions/2026-11-14-brassins/voies/e1/e1d/e1d-repos-390-clair.png, e1d-geste-390-clair.png
- capture.mjs : 10 images, aucune erreur de page, aucun débord.

## Critères
- G1 : COCHE OK 7 · G2 : IMAGES OK · G3 : HORS OK (sorties dans tests.txt ; aucune suite Vitest, rien dans src/).

Prédiction : « Lundi en gros, 24 L dans F2, la cuverie sous les jours sur l'ordi : ok, maintenant je peux choisir. »

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
