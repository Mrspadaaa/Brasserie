# COMPRIS — voie p6b

## Objectif
D219 : « je pensais plutôt à un mini slider ou bouton+ /- facil ». Deux variantes copiées de `v5/m1/b.html` (r4e-b, moment m1), qui
gardent tout et ajoutent sur chaque ligne du ticket (malts, flocons, sucres, fruits) un geste sans clavier pour changer la masse :
- `v6/p6-b1/etat.html` : boutons − et + autour de la masse, un cran de la piste par toucher (50 g sous 1 kg, 100 g au-dessus),
  rôles `masse-moins` / `masse-plus`, `aria-label` avec le pas réel ; 0 kg est le plancher.
- `v6/p6-b2/etat.html` : la barre de la ligne, déjà tirée pour la part, devient le mini curseur de masse de toutes les lignes ;
  sucres et fruits reçoivent une barre de même forme (masse sur une plage, pas de part). Une seule barre par ligne. Rôle
  `masse-curseur`, `role="slider"`, « Masse de … », `aria-valuenow`/`aria-valuetext` en kg, flèches ±1 cran.
Dans les deux : la masse tapée reste, % / total / teinte / OG / plateau suivent, les autres masses ne bougent pas, le plateau ne
bouge ni ne s'ouvre ; le plateau garde ses −/+ et sa piste.

## Écrit dans
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/` (etat.html, capturer.mjs, captures)
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/` (idem)
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/COMPRIS.md`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/RESULTAT.md`

## Fini quand
G1 à G22 de GATES.md rendent leur jeton (COMPRIS, MASSE, MOMENT, VOLEE, GESTES, PAGE, MOTS, COMMUN, CONTRASTE, HAUTEUR, CAPTURES,
NOTE) ; captures ouvertes et jugées (repos, pendant/après sur Pilsner, Dextrose #sucre, Mangue #fruit, 8 grains, 1280).

## Ne fait pas
Ne touche ni `v3/`, `v4/`, `v5/`, `v6/p6-a*`, ni aucun contrôle, ni `ecrans.json`, `src/`, `functions/`, `.codex/`, le manifeste ;
pas de serveur dans `Documents/Brasserie`, pas de stash, pas de commit. Ne change pas la forme m1 du moment. Rien d'ajouté au repos
qui ne serve le geste ; aucune phrase d'aide.

## Doutes
- b2 : la consigne propose `data-role="part-ligne masse-curseur"` sur le même élément, mais `controle-volee.mjs` lit
  `[data-role="part-ligne"]` en égalité exacte : la liste à deux noms ferait disparaître la part pour lui. Lecture retenue : la
  zone tirée garde `data-role="part-ligne"` tel quel, et le curseur de masse (`masse-curseur`, slider) est l'élément intérieur qui
  la remplit (même boîte, une seule barre, un seul doigt). À signaler dans RESULTAT.md.
- b2, grains : la longueur reste la part du grain (le contrôle de part tire à 30 % de la largeur et attend 30 %) ; sucres et fruits :
  la masse sur la plage du plateau (0–2 kg sous 1 kg). La masse suit au cran dans les deux cas.
- b1 : la place de − / + sur la ligne à 390 px sans dépasser sa hauteur ; à mesurer sur la base avant de trancher.
