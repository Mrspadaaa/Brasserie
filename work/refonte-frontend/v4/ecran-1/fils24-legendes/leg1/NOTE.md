# leg1 — « Le panneau d'aujourd'hui, sous la bande, en pictos »

- Chaleur : **froide** (la légende d'aujourd'hui, déplacée sous les pastilles, en pictos).
- Base : la maquette du soir (`prototypes/houblons-v4/maquettes/parcours-sortie/ma-biere/etat.html`), rendue par Chrome
  et figée telle quelle (DOM du rendu, `socle.css` = copie de ses assets) ; seuls les deux panneaux de légende changent.
  Thème clair, 390 × 844. `etat.html` : les deux légendes ouvertes (doigt sur les deux « ? ») ; `repos.html` : au repos.

## L'idée
Le même « ? », le même contenu, mais le panneau s'ouvre collé sous la bande, une flèche pointée sur elle, et les noms
des familles deviennent des paires carré + picto, dans l'ordre exact de la bande (6 × 2). Vive, pâle, grise : trois
carrés suivis d'un mot (« marquée », « citée », « non décrite ») ; le trait sous un carré : deux exemples (« bouge dans
ma bière », orangé « sort du style »). Le reste des icônes de la carte suit en icône + deux ou trois mots. Ajouts
proposés : la même clé dans la ligne de Motueka, sous ses pastilles, avec « ◇ hors des 12 », +, 10′, IBU, stock, ♡.

## Ce qui tient
- Lien d'un coup d'œil : flèche sur la bande, panneau dans la carte. 27 mots (carte) et 20 (ajouts) au lieu de 70 et
  45 aujourd'hui. Au repos, rien ne change (`leg1-repos.png` = la maquette).
- Données du moteur (describeFamilies) : bandes de Nugget et Motueka ; Résineux +4 crans hors style.

## Ce qui casse
- Encore un panneau : 150 px de plus ouvert ; la clé est répétée dans les deux légendes.
- La clé dit « quelle couleur = quelle famille », elle ne lit pas le houblon (il faut remonter à la bande).

## Contrôles
- G1, G2 : voir RESULTAT de la voie. `controle-commun --page=etat.html --sans=mots,fiche,legende` : COMMUN OK. Raisons :
  `mots` comme tout le lot ; `fiche` : page figée du rendu, sans le code de l'app (appui long et rail de la construction,
  inchangés) ; `legende` : `etat.html` montre la légende ouverte par construction (D49). Le repos est joué sur
  `repos.html` : `controle-legende.mjs --page=repos.html` → LEGENDE OK (bouton 28 px, 29 mots, Échap referme).

## Passe 2 (« taux d'intensité et + d'info sur les caractéristiques spéciales »)
- Passe 2 : `etat-v2.html`, `captures/leg1-v2.png` (Nugget) et `leg1-v2-motueka.png`. Chaque paire carré + picto de la clé porte les barres du houblon (fiches qui la disent, n/N ; point : en tête d'une fiche) ; sous les états, mots précis (ananas · litchi · noix de coco, géranium, woody ; citron vert · zeste de citron), ◇ avec sources (gingembre, resiny ; mojito, fruité), linalol, thiols, géraniol « ? », huiles. Ce qui casse : le panneau s'allonge (les deux ne tiennent plus ensemble à l'écran) et la clé devient serrée. Données : describeFamilies et familyWords du moteur (n/N fiches, niveau, « en tête » = premier mot d'une fiche), catalogue Hopsteiner 2025 (linalol, thiols, huiles) ; géraniol non publié : « ? » ; Motueka « à 10′ : floral +1 cran » = l'effet du moteur de la maquette (D40, D53). TRAIT OK, COMMUN OK (--sans=mots,fiche,legende).
