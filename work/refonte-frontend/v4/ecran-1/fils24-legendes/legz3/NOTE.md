# legz3 — « Les mots des fiches » : la légende dit pourquoi la case est vive

- Chaleur : **chaude** (forme libre).
- Base : la maquette du soir (`parcours-sortie/ma-biere/etat.html`), rendue par Chrome et figée telle quelle ; seule
  la légende change. `style.css` est la copie de ses assets. Thème clair, 390 × 844.

## L'idée
À un toucher du « ? », juste sous la bande, chaque famille présente apparaît avec son picto au ton de sa case et les
mots que les fiches ont réellement écrits, dans la couleur de la famille : « géranium · floral », « herbacé »,
« terreux » (pâle, citée), « ananas · litchi · noix de coco … », « woody · resinous », « épicé ». Les familles non
décrites suivent en pictos gris, sans mot, puis « ◇ gingembre · resiny ». La légende n'explique pas le code : elle
donne au brasseur ce que la pastille résume, ses arômes avec leurs sources, dans l'ordre de la bande.

- Carte de Nugget : 7 familles présentes, 5 absentes en gris, ◇ ; trois lignes.
- Ligne de Motueka : « floral » (pâle), « agrumes · citron vert · citron … » (vif), « fruits tropicaux » (pâle),
  9 pictos gris, « ◇ mojito · fruité » ; le « ◇ mojito » de la base reste au-dessus.

## Ce qui tient
- Juste sous les pastilles, dans leur ordre ; fermée au repos (le « ? » de la base, D89), rien ne pousse le
  premier écran.
- Plus d'icônes que de mots d'explication : 12 pictos, zéro mot de légende ; les mots sont ceux des fiches
  (penser brasseur : les arômes, pas le code) ; flb5b : le houblon est plus que ses 12 familles (◇).
- Vive / pâle / grise montrées par le ton des pictos ; ◇ (D130) ; pictos de la planche standard, trait
  `currentColor`, sans halo (D88).
- Données : pack-fiches.json, mots uniques (minuscules), trois par famille puis « … ».

## Ce qui casse
- « marqué 1/4 » (Épicé, une seule fiche mais mention première) n'est pas distingué de « marqué 2/4 » : le ton seul
  ne porte pas le nombre de fiches ; à ajouter en passe 2 si le brasseur le veut (« 2/4 » en mono après le picto).
- Un houblon très décrit (Citra, 10 familles) ferait quatre à cinq lignes ; acceptable derrière un toucher.
- Les mots anglais des fiches (« woody », « pineapple ») restent tels quels : honnêteté des sources, mais mélange de
  langues sous l'œil.

## Contrôles
- G1 `legendes.mjs legz1 legz2 legz3 legz4` → `LEGENDES-BIEN-4`.
- G2 `controle-pictos-trait.mjs … --page=etat.html` → `legz3 · 36 pictos de famille · 0 faute(s)` ; `TRAIT OK`.
- `controle-commun.mjs … --page=etat.html --sans=mots,fiche,legende` → `COMMUN OK`. Premier passage : CONTRASTE
  « agrumes » 4,34:1 sur le gris de la carte → le bloc est posé sur un panneau blanc bordé (le style du panneau de
  légende de la base) : 4,65:1, OK. `--sans=fiche` : page figée ; `--sans=legende` : état ouvert demandé par le
  brief ; `--sans=mots` : v0.
- `controle-panel.mjs` : remplissage médian 0,56 ; `PANEL ECHEC` sur la seule diversité (0,93 ; legz3~legz4 ≥ 0,95) :
  même écran repris tel quel par le brief, seule la légende change.
