# c1-rail — le contrôle du rail sur la maquette jouable

Voie c1-rail (mission 2026-10-23-controles-parcours), 23.10. Mode `--parcours` de
`work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs` ; le mode actuel ne change pas (RAIL OK 1/1 sur la base
consolidée).

## Base

- Les mots du brasseur et la règle d'origine : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D27 à D69) ; l'ancien
  mode : `controle-rail.mjs` (rail vertical, pages `index.html` et `cas-*`), jugé « à adapter » par l'audit a1
  (`work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md`, § 2).
- Le format lu : `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, « Contrat d'un écran ». Rien ne dépend de la mise
  en page : la poignée `[data-role="glisser-moment"][role="slider"]` d'un `[data-role="ligne-houblon"]`, ou
  `[data-role="frise"]` avec son `[role="slider"]` ; moment dans `aria-valuenow` et `aria-valuetext` ; IBU dans
  `[data-role="ibu-ajout"]` ou `"ibu-dry"` (`data-valeur`) ; pouce dans `[data-role="moment-pouce"]` ou `.pq-dry-pouce` ;
  graduations `[data-cran]`, seulement pendant le geste (sur le rail, ou dans une bulle `[data-role="loupe"]`).
- L'axe du rail est horizontal, sauf `aria-orientation="vertical"` (ou rail plus haut que large) : toutes les mesures
  (doigt, positions, écarts) se font le long de cet axe. C'est ce qui permet de rejouer la page Ma bière refaite (D105,
  frise verticale de la base v4.10) sans réécrire le contrôle.
- Le cran se lit par son `aria-valuetext` : « 45′ » ou « ébullition 45′ » ; « whirlpool » ou « WP » ; « actif · 2 j »
  ou « dry hop actif, 2 j » ; « après · 2 j » ou « dry hop après fermentation, 2 j ».
- Un doigt, c'est du vrai tactile (`touchscreen`, 390 px, `isMobile`) ; la souris à 1280 px pour D27 ; l'échelle des
  crans est lue au clavier (flèches), les gestes au doigt.
- Témoins : `temoins/rail-parcours-*` (fabriqués par `voies/c1-rail/fabrique-temoins.mjs`) : `ok` (positif, avec
  `cas-ebu45.html` et `cas-ebu120.html`), `ok-ligne` (positif, poignée de ligne et loupe en bulle), `gradue` (D47),
  `pas10` (D34), `sans-loupe` (D63), `ombre` (D42), `extreme` (D69), `saccade` (D46), `orpheline` (D41), `deplace`
  (D68), `chevauche` (D35), `inerte` (D27), `figes` (D44), `annule` (D42, geste interrompu).

## Passe 2 : une frise verticale à plusieurs houblons

Le brasseur a validé l'étape Houblons de la base v4.10 (« Ça c'est le bon », 23.10) : une frise verticale commune
`[data-role="frise"]` (`aria-orientation="vertical"`), une poignée `[data-role="glisser-moment"][role="slider"]` par
houblon, rattachée à sa ligne `[data-role="ligne-houblon"]` par `data-houblon` porté par la ligne ou par un de ses
descendants (le nom), plusieurs houblons sur le même rail. Le mode `--parcours` la joue : axe lu sur
`aria-orientation` (ou rail plus haut que large, ou l'essai du doigt), poignée courte prise au centre, D45, D56,
D61 bis, D64 jouées dès qu'il y a au moins deux poignées sur la page, ou une page `<route>/cas-k3.html` dans le
dossier de la route (jouée en priorité : Nugget et deux autres houblons), D55 jouée sur le rail vertical. Le témoin
positif est `rail-parcours-ok-vertical` ; les négatifs : `saute` (D64), `deux-chevauchent` (D56), `remonte`
(D61 bis), `irregulier` (D45), `vide` (D55). Une poignée qui est une piste tenant toute la colonne (limite annoncée
par la voie de l'écran : un doigt hors des repères est pris par la piste du dessus) est lue comme un rail long : le
contrôle ne distingue pas encore la piste du repère.

## Règles

Les 23 lignes de plaintes du rail. « Jouée » : le contrôle la rejoue et son échec porte l'identifiant `Dnn : …`.

- **D27** (« glisser comme un slider le moment de l'ajout ») : jouée. Un glissé complet au doigt prend au moins 3 valeurs
  (sinon les autres règles ne sont pas jouées, une poignée inerte n'a pas à échouer partout) ; à la souris à 1280 px
  aussi ; lâchée sur 45′, 25′ et 5′, l'IBU de l'ajout change d'un cran à l'autre (cité sous D34).
- **D28** (la levure, étape du rail) : sans objet (passe 2 : la levure de la frise verticale est un pont,
  `pont-etape-levure`, et reste hors de ce contrôle) : dans la maquette la levure n'est pas une étape du rail, c'est une
  ligne de Ma bière et l'écran Levure, atteint par le pont « Puis la levure » ; Levure se vérifie par CUMUL OK (D96).
- **D34** (tranches de 5′, rien d'imposé) : jouée. L'échelle lue au clavier : minutes d'ébullition toutes multiples de
  5, écart de 5′ entre deux crans (sinon « se règle par 10′ ») ; lâchée sur les crans les plus proches de 45′, 25′ et 5′,
  le rail dit ce moment et l'écrit, et les trois IBU diffèrent.
- **D35** (« un peu bancale ») : jouée, doigt posé à 35′, en fermentation active et après fermentation : aucun texte
  visible n'en chevauche un autre (rectangles des textes). Les vides de 64 px de la colonne verticale : sans objet,
  il n'y a plus de colonne.
- **D36** (ébullition de 120′ ou autre que 60′) : à brancher : la maquette n'a qu'une ébullition de 60′
  (`boilMin` fixe, `window.__parcours.etat` est une lecture). À demander à la session de la maquette : une route
  ou un état d'essai « ébullition de 45′ » et « de 120′ ». Le contrôle les joue dès que
  `<route>/cas-ebu45.html` et `cas-ebu120.html` existent (le rail commence à N′, rien au-delà, une ligne se pose
  à 75 % de N′) ; le témoin `ok` les a.
- **D37** et **D37 révisé** (durée dynamique, lue dans la recette avec renvoi, sans champ ni − / +) : jouée en partie :
  aucun champ ni `[data-action^="ebullition"]` dans la zone du rail (sinon : « règle l'ébullition sur le rail »).
  La part « le rail suit la durée » est à brancher avec D36 (mêmes `cas-ebu`). Le renvoi n'est pas exigé : la maquette
  n'a pas de réglage d'ébullition.
- **D41** (une minute qui sort de nulle part) : jouée. Au repos, toute minute écrite dans la zone du rail (« 10′ ») est la
  durée de l'ébullition (le cran le plus haut lu), 0′, ou le moment d'un ajout. Les ajouts proposés dans le rail :
  sans objet (aucun dans la maquette).
- **D42** (l'ombre) : jouée. Aucune ombre portée (flou ou décalage non nuls, hors `inset`) dans la zone du rail au
  repos, après le lâcher, et après un geste interrompu (`touchcancel`, échelle et loupe refermées).
- **D43** (« Que de j+3 », le jour se règle) : jouée sur les pages qui ont des boutons `[data-jour]` (Dryhopper) :
  toucher le premier puis le dernier jour proposés donne ces jours. Sans objet sur une ligne sans bouton de jour (Ma bière).
- **D44** (« Que du j+3 si on est en dehors du boil ») : jouée en fermentation : deux lâchers, sur le premier et sur le
  dernier cran de dry hop actif, donnent deux jours différents. Le whirlpool n'a qu'un cran dans la maquette (le
  moteur n'en simule qu'un) : à brancher, non joué et dit à chaque page (« un seul cran, aucun réglage »).
- **D45** (passer de 10′ à 5′ au-dessus des houblons) : jouée, passe 2, à plusieurs houblons (au moins deux poignées
  sur la page, ou `<route>/cas-k3.html` s'il existe : joué en priorité). Le doigt descend de 10 px en 10 px ; chaque
  fois que le moment tenu est dans l'ébullition, les cinq crans `[data-cran]` d'une bulle `[data-role="loupe"]`
  les plus proches du doigt sont à intervalles réguliers (écart-type ÷ moyenne ≤ 0,25, comme l'ancien mode).
  Sans bulle (graduations sur le rail, Dryhopper) : non jouée, la loupe les déforme volontairement (D63).
  Avec un seul houblon : non jouée, dite à chaque page.
- **D46** (« clancky ») : jouée. Sur 10 pas de 6 px, le pouce bouge au moins 9 fois et reste à 4 px au plus du doigt
  (écart du déplacement de chaque pas au pas du doigt). Un rail à crans accrochés (14 px de doigt par cran) l'échoue.
- **D47** (échelle seulement sous le doigt, loupe à la Apple) : jouée. Au repos : aucune graduation ni loupe visible ;
  le doigt posé : seules les graduations du segment sous le doigt (une graduation de classe `…loin…` ou marquée
  `data-hors-segment` compte comme « d'un autre segment ») ; après le lâcher, tout est refermé.
- **D55** (« autant d'espace, la apple en mode zoom loop ») : passe 1 : sans objet (rail horizontal, pas de colonne).
  Passe 2 : jouée sur un rail vertical (`aria-orientation="vertical"`, ou plus haut que large) dans la frise
  `[data-role="frise"]` : aucun vide de plus de 80 px entre deux éléments de la frise (textes et cartes
  `[data-role="ligne-houblon"]`), au repos comme pendant le geste (à 35′, en fermentation active, après fermentation).
  Témoin `rail-parcours-vide`. La règle « le premier ajout proposé ne descend pas de plus de 120 px » : sans objet
  (aucun ajout proposé dans la frise).
- **D56** (deux houblons, « 0′ » et « Nugget » l'un sur l'autre) : jouée, passe 2, à plusieurs houblons : le doigt
  descend de 10 px en 10 px ; à chaque pas, aucun texte du rail (nœuds, autres houblons, loupe) n'en chevauche un autre,
  hors de la carte et du repère du houblon tenu, seuls à suivre le doigt. Le chevauchement avec la zone du houblon tenu
  (sa loupe sur son nom) reste D35. Témoin `rail-parcours-deux-chevauchent`.
- **D61** (« à 35′ on dirait 60′ ») : jouée. La place dit le temps : 45′, 25′ et 5′ lâchés se posent à intervalles
  égaux (un seul houblon sur la page : à plusieurs, les cartes des autres s'intercalent entre deux minutes, ce que
  D61 bis et D64 jouent) ; la même course du doigt, lente puis en trois bonds, donne le même moment (± 1 cran).
- **D61 bis** (« l'échelle n'est plus du tout respectée quand on passe dessus ») : jouée. Un seul houblon : en
  avançant de 10 px en 10 px, le cran ne recule jamais et ne saute pas de plus de 2 crans (10′). Passe 2, à plusieurs
  houblons : la même descente avec les autres houblons posés ; en plus, aucun autre houblon ne bondit de plus de
  24 px en un pas. Témoin `rail-parcours-remonte`.
- **D63** (« ça fait pas zoom focus ») et **L12** : jouée. Tenu à 35′ : l'écart entre deux crans voisins sous le doigt
  vaut au moins 3 fois l'écart au loin. Crans sur le rail : l'écart des deux bouts de l'échelle ; crans dans une bulle
  de loupe : l'écart au repos de la piste (longueur ÷ nombre d'intervalles).
- **D64** (les houblons déjà posés sautent à droite) : jouée, passe 2, à plusieurs houblons : pendant la même
  descente, un houblon déjà posé ne bouge pas de côté de plus de 8 px (en travers de l'axe du rail), et reste dans le
  segment de son moment : entre les nœuds « whirlpool », « fermentation » et « post-fermentation » lus à leur texte, à
  4 px près. Témoin `rail-parcours-saute`.
- **D67** (la loupe doit suivre dans un autre segment) : jouée : même mesure qu'en D63, doigt tenu en fermentation
  active puis après fermentation ; rapportée seulement si D63 tient dans l'ébullition (sinon c'est le même défaut).
- **D68** (« toujours un petit souci », la tête du rail) : jouée. Le rail ne se déplace pas de plus de 40 px (haut et
  gauche de la poignée) pendant le geste cran par cran et pendant le balayage.
- **D69** (aller de l'extrême haut à l'extrême bas) : jouée, écrans de 620 et 844 px de haut : le rail, défilé au besoin,
  est dans l'écran ; d'un seul geste du premier cran au bord de l'écran on tient le dernier cran, et du dernier au
  premier ; le rail ne sort pas de l'écran.

## Doutes

- D46 et D47 (graduations d'autres segments) jugent un choix de conception : voir la décision à prendre dans RESULTAT.md.
- Ma bière est en reprise (D105) : ses défauts rendus ici sont provisoires. Le contrôle ne lit que le contrat ; une
  frise verticale doit porter `aria-orientation="vertical"` (ou être plus haute que large).
