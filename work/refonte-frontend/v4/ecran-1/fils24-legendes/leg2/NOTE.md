# leg2 — « La légende lit Nugget »

- Chaleur : **froide** (la légende d'aujourd'hui, déplacée sous les pastilles, en pictos).
- Base : la maquette du soir, rendue par Chrome et figée (`socle.css` = copie de ses assets) ; seuls les deux panneaux
  de légende changent. Thème clair, 390 × 844. `etat.html` : légendes ouvertes ; `repos.html` : au repos.

## L'idée
Le même « ? », mais la légende ne dit plus « quelle couleur = quelle famille » en général : elle lit CE houblon. Un
crochet sous toute la bande, puis trois rangs calés sur son bord gauche : marquée, citée, non décrite ; dans chaque
rang, ses familles (le carré tel qu'il est sur la bande, puis le picto ; les absentes en gris). Un rang « dans ma
bière » montre le vrai trait : Résineux +4 crans, hors style. Dans la ligne de Motueka, les mots d'état passent à
gauche pour que les pictos tombent juste sous ses pastilles ; puis « hors des 12 : ◇ mojito · fruité ». Le reste des
icônes tient sur une ligne.

## Ce qui tient
- On lit Nugget d'un coup : cinq familles marquées, deux citées ; Motueka : agrumes seul, floral et tropical cités.
- 17 et 11 mots ; tout vient du moteur (niveaux, fiches, effet).

## Ce qui casse
- Plus haut que leg1 (quatre rangs) ; la clé générale couleur → famille n'y est plus (le picto la porte).
- Parenté : legz4 (« Trié par ton ») a la même idée de groupes par ton ; leg2 garde les mots d'état d'aujourd'hui et
  ajoute le rang « dans ma bière ». Deux séries qui y arrivent seules : un signal pour le tri.

## Contrôles
- `controle-commun --page=etat.html --sans=mots,fiche,legende` : COMMUN OK (raisons de leg1 : page figée, légende ouverte
  par construction). `controle-legende.mjs --page=repos.html` : LEGENDE OK (19 mots, Échap referme).

## Passe 2 (« taux d'intensité et + d'info sur les caractéristiques spéciales »)
- Passe 2 : `etat-v2.html`, `captures/leg2-v2.png` (Nugget) et `leg2-v2-motueka.png`. Chaque famille lue porte ses barres n/N et le point « en tête » ; trois rangs de plus : mots précis, hors des 12 (◇ et sources), les fiches (linalol, thiols, géraniol « ? », huiles). Ce qui casse : le rang « marquée » de Nugget passe sur deux lignes ; plus haut encore que leg1 v2. Données : describeFamilies et familyWords du moteur (n/N fiches, niveau, « en tête » = premier mot d'une fiche), catalogue Hopsteiner 2025 (linalol, thiols, huiles) ; géraniol non publié : « ? » ; Motueka « à 10′ : floral +1 cran » = l'effet du moteur de la maquette (D40, D53). TRAIT OK, COMMUN OK.
