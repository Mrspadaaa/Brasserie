# legz4 — « Trié par ton » : la case explique ses familles

- Chaleur : **chaude** (forme libre).
- Base : la maquette du soir (`parcours-sortie/ma-biere/etat.html`), rendue par Chrome et figée telle quelle ; seule
  la légende change. `style.css` est la copie de ses assets. Thème clair, 390 × 844.

## L'idée
À un toucher du « ? », juste sous la bande, les 12 familles sont rangées en trois groupes, chacun ouvert par la case
même qui les représente : une case vive, puis les familles marquées (picto et nom, 18 px) ; une case pâle, puis les
citées ; une case grise, puis les non décrites en pictos gris, sans nom. Puis « ◇ gingembre · resiny ». Aucun mot
d'état : la pastille en tête du groupe est la légende de ses familles. On lit d'un coup combien de familles sont
fortes (Nugget : cinq ; Motueka : une) et lesquelles.

- Carte de Nugget : [vif] Floral Herbacé Tropicaux Résineux Épicé · [pâle] Terreux Agrumes · [gris] 5 pictos · ◇.
- Ligne de Motueka : [vif] Agrumes · [pâle] Floral Tropicaux · [gris] 9 pictos · ◇ mojito · fruité (pictos 15 px).

## Ce qui tient
- Juste sous les pastilles, fermée au repos (« ? » de la base, D89).
- Plus d'icônes que de mots : 12 pictos et 3 cases-échantillons contre 7 noms (Nugget), 3 (Motueka).
- Vive / pâle / grise montrées (la case en tête du groupe), pas décrites ; ◇ (D130) ; pictos de la planche standard,
  trait `currentColor`, sans halo (D88).
- Données : pack-fiches.json.

## Ce qui casse
- La plus haute des quatre : 104 px sous la carte de Nugget (trois rangées de groupes) ; derrière un toucher, mais la
  frise descend d'autant. En passe 2 : les trois groupes sur deux rangées, ou le groupe gris en fin de la rangée pâle.
- L'ordre de la bande est perdu dans les groupes (Floral avant Tropicaux, mais Terreux après Épicé) : la lecture
  case-à-case passe par la couleur du picto, pas par la position.
- Les noms à 11 px sous les pictos sont au plancher de lisibilité ; sans nom, le groupe gris se devine seulement.

## Contrôles
- G1 `legendes.mjs legz1 legz2 legz3 legz4` → `LEGENDES-BIEN-4`.
- G2 `controle-pictos-trait.mjs … --page=etat.html` → `legz4 · 36 pictos de famille · 0 faute(s)` ; `TRAIT OK`.
- `controle-commun.mjs … --page=etat.html --sans=mots,fiche,legende` → `COMMUN OK`. Premier passage : STANDARD S3
  « rayons hors échelle 6px » → 8 px. `--sans=fiche` : page figée ; `--sans=legende` : état ouvert demandé par le
  brief ; `--sans=mots` : v0.
- `controle-panel.mjs` : remplissage médian 0,56 ; `PANEL ECHEC` sur la seule diversité (0,93 ; legz3~legz4 ≥ 0,95) :
  même écran repris tel quel par le brief, seule la légende change.
