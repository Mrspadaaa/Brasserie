# legz1 — « Au doigt » : la bande se lit en la touchant

- Chaleur : **tiède** (la forme de la série legz : un autre genre de légende, ici la légende par le geste).
- Base : la maquette du soir (`parcours-sortie/ma-biere/etat.html`), rendue par Chrome et figée telle quelle ; seule
  la légende change. `style.css` est la copie de ses assets. Thème clair, 390 × 844.

## L'idée
La bande des 12 cases devient une piste. Le doigt se pose ou glisse sur une case ; une ligne fixe, juste sous la
bande, lit la case tenue : son picto au ton de la case (vif, pâle, gris), le nom de la famille, combien de fiches la
citent (« 2/4 »), et les mots que ces fiches ont écrits (« ananas · litchi · noix de coco … »). La case tenue se
soulève (×1,5, cerclée) avec une petite flèche vers la lecture : le lien entre la pastille et sa lecture est à 2 px.
Un 13ᵉ repère « ◇ » ferme la bande : tenu, il lit « hors des 12 : gingembre, resiny ».

- Carte de Nugget (60′) : capture avec le doigt sur Tropicaux → « Tropicaux 2/4 ananas · litchi · noix de coco … ».
- Ligne de Motueka : doigt sur Agrumes → « Agrumes 2/2 agrumes · citron vert · … » ; le « ◇ mojito » de la base reste.
- Au repos, la ligne reste (une ligne de 22 px, 18 px sur la ligne d'ajout) et lit la dernière case tenue ; la page
  statique montre l'état « pendant ». Le « ? » de la base reste, fermé : il n'est plus nécessaire pour la bande.

## Ce qui tient
- Juste sous les pastilles, et liée à la case par la flèche et le soulèvement.
- Plus d'icônes que de mots : un picto, un nom, un compte, les mots des fiches (pas une explication).
- Vive / pâle / grise montrées par le ton du picto, jamais décrites. ◇ pour les mots hors des 12 (D130).
- Pictos : les symboles de la planche standard, en trait `currentColor` (`pz-<famille>`, même dessin), D88.
- Le geste marche dans la page (script en fin de page : pointerdown et glisser sur la piste).
- Données : pack-fiches.json (Nugget : tropical marqué 2/4 ; Motueka : agrumes marqué 2/2). Les mots d'une famille
  sont ceux des fiches, uniques, trois au plus puis « … ».

## Ce qui casse
- Une ligne de plus sur chaque carte au repos (22 px) ; si c'est trop, la ligne peut n'apparaître qu'au premier
  toucher de la bande.
- Les cases font 10 × 12 px : le doigt couvre deux cases ; la case tenue est celle sous le centre du doigt, le
  glissement corrige. Le geste de la piste ne doit pas se confondre avec l'appui long de la carte (fiche) : à régler
  en passe 2 (la piste arrête la propagation).
- La ligne tronque les mots longs (« … ») ; en passe 2, la ligne pourrait passer à deux lignes au toucher.

## Contrôles
- G1 `legendes.mjs legz1 legz2 legz3 legz4` → `LEGENDES-BIEN-4`.
- G2 `controle-pictos-trait.mjs … --page=etat.html` → `legz1 · 14 pictos de famille · 0 faute(s)` ; `TRAIT OK`.
- `controle-commun.mjs … --page=etat.html --sans=mots,fiche,legende` → `COMMUN OK` (couleurs, au-style, survol, blocs,
  contraste, standard, trait, parlant, brutes OK). `--sans=fiche` : la page est figée (sans parcours.js), l'appui long
  n'ouvre pas la fiche ; `--sans=legende` : ici la lecture est au repos, par choix (le brief l'admet) ; `--sans=mots` :
  v0.
- `controle-panel.mjs` sur les quatre captures : remplissage médian 0,56 (≥ 0,55), 0 sous 0,50 ; `PANEL ECHEC` sur la
  seule diversité (ressemblance 0,93) : les quatre pages sont le même écran, repris tel quel par le brief, seule la
  légende change.
