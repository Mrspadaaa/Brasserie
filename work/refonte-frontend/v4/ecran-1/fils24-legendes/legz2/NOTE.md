# legz2 — « La bande en pictos » : les cases sont les pictos

- Chaleur : **chaude** (forme libre).
- Base : la maquette du soir (`parcours-sortie/ma-biere/etat.html`), rendue par Chrome et figée telle quelle ; seule
  la bande et sa légende changent. `style.css` est la copie de ses assets. Thème clair, 390 × 844.

## L'idée
La légende des familles disparaît parce que la bande se lit seule : chacune des 12 cases est le picto de sa famille,
au ton de la case : vif (marquée), pâle (citée), gris (non décrite). Même ordre, mêmes 12 colonnes que la base
(l'ordre du style), le code couleur reste. À un toucher du « ? », juste sous la bande, une clé d'une ligne : trois
pictos pris dans la bande elle-même, un par ton (« marqué », « cité », « non décrit »), et le ◇ avec les mots hors
des 12. Trois mots d'état, rien d'autre.

- Carte de Nugget : pictos de 14 px ; la clé « ananas marqué · agrumes cité · melon non décrit · ◇ gingembre · resiny ».
- Ligne de Motueka : pictos de 13 px sur leur propre rangée sous « 10 g +3 IBU » (189 px : la dose et l'IBU ne
  tiennent pas à côté) ; la clé en dessous ; le « ◇ mojito » de la base reste.

## Ce qui tient
- « Plus utilisé les icônes » : 12 pictos par carte, au repos, sans mot. La clé n'ajoute que trois mots.
- Vive / pâle / grise montrées par le ton, et les exemples de la clé sont des cases réelles de la bande.
- Pictos : les symboles de la planche standard, trait `currentColor` (`pz-<famille>`, même dessin), sans halo (D88).
- Données : pack-fiches.json ; ◇ : mots sans famille (D130).

## Ce qui casse
- Écart de baseline, assumé : les carrés pleins deviennent des pictos. La bande de 12 pictos est plus large
  (190 px) que les carrés (142 px) : sur la carte, « ? Sans Nugget › » passe à la ligne suivante (28 px de plus) ;
  sur la ligne d'ajout, la bande prend une rangée. Les cartes de Citra cryo et Saaz Late gardent leurs carrés dans
  cette page (la variante ne touche que Motueka) : en passe 2, toutes les bandes suivraient.
- À 13–14 px, un picto gris pâle (non décrit) se lit moins qu'un carré gris : le dessin au trait fin disparaît
  presque ; c'est voulu (absent), mais la comparaison de deux bandes à l'œil est moins immédiate qu'avec des aplats.
- Le trait sous la case (« ce que l'ajout fait bouger », D80) n'est pas repris sous les pictos dans cette v0.

## Contrôles
- G1 `legendes.mjs legz1 legz2 legz3 legz4` → `LEGENDES-BIEN-4`.
- G2 `controle-pictos-trait.mjs … --page=etat.html` → `legz2 · 42 pictos de famille · 0 faute(s)` ; `TRAIT OK`.
- `controle-commun.mjs … --page=etat.html --sans=mots,fiche,legende` → `COMMUN OK`. `--sans=fiche` : page figée (sans
  parcours.js), l'appui long n'ouvre pas la fiche ; `--sans=legende` : la page montre l'état ouvert demandé par le
  brief (aria-expanded="true") ; `--sans=mots` : v0. Pâle = ton de la famille à opacity .5 (comme les carrés « cité »
  de la base) : STANDARD S2 OK.
- `controle-panel.mjs` : remplissage médian 0,56 ; `PANEL ECHEC` sur la seule diversité (0,93) : même écran repris tel
  quel par le brief, seule la légende change.
