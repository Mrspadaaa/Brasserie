# Compréhension de la voie p6a

## Objectif
Deux variantes copiées de `v5/m1/a.html` (r4e-a, moment au menu ancré, forme m1), qui gardent tout et ajoutent sur chaque ligne du ticket
(malts, flocons, sucres, fruits) un moyen de changer la masse d'un geste, sans clavier, depuis le repos (D219 : « mini slider ou bouton+ /- facil ») :
- `p6-a1` : boutons − et + sur la ligne, un cran de la piste par toucher (50 g sous 1 kg, 100 g au-dessus), rôles `masse-moins` / `masse-plus`,
  `aria-label` au pas réel (« Ajouter 100 g de Pilsner Malz ») ;
- `p6-a2` : mini curseur par ligne, `role="slider"`, rôle `masse-curseur`, nommé « Masse de … », `aria-valuenow` / `aria-valuetext`, flèches ±1 cran.
La masse tapée reste ; % du grain, total, teinte, OG et plateau suivent ; les autres masses ne bougent pas ; le plateau ne bouge ni ne s'ouvre.

## Écrit dans
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-a1/`
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-a2/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p6a/COMPRIS.md`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p6a/RESULTAT.md`

## Fini quand
- MASSE OK (`controle-masse-ligne.mjs`), MOMENT OK, VOLEE OK, GESTES OK, PAGE OK, MOTS OK (80 au plus), COMMUN OK, CONTRASTE OK, HAUTEUR OK,
  pour chacune des deux variantes ;
- chaque `capturer.mjs` imprime CAPTURES OK, et ses captures (repos, Pilsner pendant et après, #sucre, #fruit, 8 grains, 1280) sont ouvertes ;
- RESULTAT.md cite D219, « slider » et les captures (NOTE OK).

## Ne fait pas
- Ne touche ni `v3/`, `v4/`, `v5/`, `v6/p6-b*`, ni les contrôles, ni `ecrans.json`, `ecrans-app.json`, `src/`, `functions/`, `.codex/`, le manifeste.
- Ne retire ni ne renomme aucun rôle existant ; ne touche pas la forme du moment (m1).
- N'ajoute rien au repos qui ne serve ce geste ; pas de `type="number"`, pas de texte sous 12 px, pas de phrase d'aide.
- Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`, pas de `git stash`, aucun commit, pas de push.

## Doutes
- Place des − / + : la ligne n'a que 360 px utiles ; je les mets de part et d'autre de la masse, en trait fin gris, cibles 24 × 32 px.
- Plage du curseur : 0 à 2 × la masse donnerait une plage nulle à 0 kg ; je prends la plage de la piste du plateau (`pmax`), figée pendant le geste.
- Le contrôle lit la masse par `[data-role="kg-ligne"]` exact : le curseur est donc un élément à part, pas un rôle ajouté au champ.
