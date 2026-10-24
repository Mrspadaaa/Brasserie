OK — controle-rail.mjs --parcours : 23 plaintes, rail horizontal et frise verticale à plusieurs houblons, 20 témoins ; D55 vide, D45 D56 D61 bis D64 rejoués

## Fichiers écrits

- `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs` : bloc `--parcours` ajouté en tête (le reste du fichier
  est intact ; `RAIL OK 1/1` sur la base consolidée).
- `work/refonte-frontend/v4/tournoi/outils/temoins/rail-parcours-{ok,ok-ligne,gradue,pas10,sans-loupe,ombre,extreme,saccade,orpheline,deplace,chevauche,inerte,figes,annule}/etat.html`,
  et `rail-parcours-ok/cas-ebu45.html`, `cas-ebu120.html`.
- `work/missions/2026-10-23-controles-parcours/voies/c1-rail/` : `fabrique-temoins.mjs` (fabrique les témoins),
  `NOTE.md` (les plaintes classées), ce fichier.

## Critères (sorties décisives)

| Critère | Sortie |
|---|---|
| G1 | `RAIL OK 1/1` |
| G2 | `rail-parcours-ok · 16 règles jouées` puis `RAIL OK 1/1` |
| G3 | `ECHOUE OK (D47, code 1)` |
| G4 | `ECHOUE OK (D34, code 1)` |
| G5 | `ECHOUE OK (D63, code 1)` |
| G6 | `ECHOUE OK (D42, code 1)` |
| G7 | `ECHOUE OK (D69, code 1)` |
| G8 | `ECHOUE OK (D46, code 1)` |
| G9 | `NOTE OK` (section « Règles », 23 lignes) |
| G10 | `ma-biere · 14 règles jouées`, `dryhopper · 15 règles jouées`, `VERDICT ECHEC (RAIL ECHEC 14 problème(s))` |
| G11 | cette section |
| G12 | `CABLAGE OK` |

Chaque témoin négatif échoue par son seul défaut (relu un par un) : gradue → D47 seul ; pas10 → D34 seul ;
sans-loupe → D63 seul ; ombre → D42 seul ; extreme → D69 seul (rail hors écran à 620 px) ; saccade → D46 seul
(« bouge 2 fois, 24 px ») ; orpheline → D41 ; deplace → D68 ; chevauche → D35 ; inerte → D27 ; annule → D42 (geste
interrompu) ; figes → D44 et D43 (les deux lisent les jours de contact). `ok` et `ok-ligne` passent.

## Essais utilisés

G1 à G12 : 1 essai chacun sur la version finale. En route : le témoin `pas10` échouait aussi par D63 (peu de crans,
loupe trop faible) → loupe du témoin renforcée ; `gradue` et `ombre` échouaient aussi par D42 (comparaison avec le
repos manquante) → comparées au repos ; `ok-ligne` échouait par D35 (bulle sur le titre) → bande libre ; D43 jouait
« 5 j » alors que Dryhopper propose 1, 2, 3 et 7 → premier et dernier jour proposés.

## Défauts du parcours

(Passe 1, 23.10 en début de soirée : pages d'alors. Ma bière a été refaite depuis (D105), Dryhopper corrigé : voir « Passe 2 » pour l'état actuel.)

Joué avec `systeme.mjs verdict -- node …/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours ma-biere dryhopper
--page=etat.html --parcours` : VERDICT ECHEC, 14 problèmes. Ils vont à la session de la maquette (elle possède les
écrans). **Ma bière : tous provisoires, page à refaire (D105)** : la route va devenir l'étape Houblons de la base
v4.10 ; le contrôle ne lit que le contrat, il se rejoue tel quel sur la nouvelle page. Captures regardées : le doigt posé
sur Ma bière et sur Dryhopper (L12), qui confirment D35.

### ma-biere (provisoires : page à refaire, D105)

| Défaut | Mesure | Ce que l'écran doit changer |
|---|---|---|
| **D35** | doigt posé à 35′ : 7 chevauchements (« Nugget » sur « 45′ », « 40′ »…) ; en fermentation active 9 ; après 10. Sur la capture, la bulle de loupe recouvre le nom « Nugget » et l'α de la ligne. | Poser la loupe là où elle ne cache pas le titre de la ligne (hors de la ligne, ou sous le rail). |
| **D46** | sur 10 pas de 6 px, le pouce bouge 4 fois, écart au doigt jusqu'à 6,0 px (9 fois et 4 px au plus). Cause : 14 px de doigt par cran (`PX_CRAN`) pour 8,7 px de piste par cran. | Le pouce suit le doigt de façon continue ; seul le moment s'accroche au cran. |
| **D69** | écrans 620 et 844 px : du premier cran au bord de l'écran, le doigt tient le cran 25 sur 27 (« après 5 j »), pas 27 ; du dernier au bord opposé, le cran 10 (« ébullition 10′ »), pas 0. Même cause : 27 crans × 14 px = 378 px > la largeur de l'écran. | Le pas par cran s'adapte : `min(14, course disponible ÷ (n − 1))`, pour que les deux bouts se rejoignent d'un geste. |

Rien d'autre ne sort sur Ma bière : D47 (aucune graduation au repos, tout se referme au lâcher), D42, D41, D34 (tranches
de 5′, 3 IBU différents), D44 (jours de fermentation), D61, D63, D67, D68 tiennent.

### dryhopper

| Défaut | Mesure | Ce que l'écran doit changer |
|---|---|---|
| **D35** | à 35′ : « 45′ » sur « 40′ » et « ≈+5 » sur « ≈+7 » ; après fermentation : « 4 j » sur « 5 j » et « ~+23 » sur « ~+23 ». Sur la capture, « 30′ » et « 25′ » se superposent au bord gauche de la bulle. | La position des étiquettes de la loupe est bornée par `clamp(24px, …, 100 % − 24px)` : au bord, elles s'empilent. Décaler les étiquettes voisines au lieu de les écraser (largeur d'une étiquette au moins entre deux centres). |
| **D46** | pouce : 5 mouvements sur 10, écart jusqu'à 6,1 px. | Même remède que Ma bière : pouce continu sous le doigt, crans accrochés seulement pour la valeur. |
| **D47** (3 lignes) | doigt posé en ébullition : 15 graduations d'autres segments restent visibles (courtes, `pq-dry-cran-loin`) ; en fermentation active et après : 21. | Voir la décision à prendre : retirer les crans des autres segments, ou déclarer l'écart. |

D43 (jours 1 et 7 au toucher), D44, D61, D63, D67, D68, D69 (620 et 844 px) tiennent sur Dryhopper.

## Doutes et limites

- Non jouées, dites à chaque page : **D36 et D37** (ébullition de 45′ et 120′ : la maquette n'a qu'une ébullition de 60′ ;
  le contrôle les joue dès que `cas-ebu45.html` et `cas-ebu120.html` existent, le témoin `ok` en a) ; **D44, whirlpool**
  (un seul cran, rien à régler).
- Un OK rendu ici dit « les règles jouées tiennent », pas « le rail est réussi » : D61 vérifie la place et la vitesse, pas
  le ressenti ; D63 mesure les écarts de crans, pas la lisibilité de la loupe (capture à regarder).
- Le contrôle dure environ 35 s par page (dix à quinze chargements de page).
- Ma bière en reprise : si la nouvelle frise est verticale, elle doit déclarer `aria-orientation="vertical"` pour que
  toutes les mesures se fassent sur le bon axe ; les marqueurs du contrat suffisent sinon.

DÉCISION À PRENDRE : D47 sur Dryhopper. a1 passe 3 garde des crans courts pour les autres segments (orientation du
rail), alors que D47 (« juste les afficher quand on est à cet emplacement ») demande seulement le segment sous le
doigt. Options : (a) retirer les crans des autres segments pendant le geste ; (b) les garder et déclarer l'écart dans
`portee-defauts.json` (le contrôle ne distinguerait plus rien). Recommandation : (a) si le brasseur n'a pas validé ces
crans courts ; sinon (b) en nommant l'écart. Décideur : pilote, avec le brasseur pour le goût.

DÉCISION À PRENDRE : D46 sur un rail à crans. Un pouce qui suit le doigt au pixel (écart ≤ 4 px) est plus fluide mais
sépare la position du pouce de la valeur lue entre deux crans. Recommandation : pouce continu, valeur accrochée
(comme les curseurs de l'app) ; sinon assouplir le seuil de D46 pour les rails à crans (par exemple 9 fois sur 10 sur
un déplacement de cran).

CONNAISSANCE : sur la maquette, Ma bière (rail de ligne) fait 14 px de doigt par cran pour 27 intervalles : 378 px,
plus que l'écran (390 px) : les deux bouts du rail ne se rejoignent pas d'un geste (cran 25 sur 27) ; Dryhopper, à
loupe de Sarkar et Brown, les rejoint.

LEÇON PROPOSÉE : aucune

## Passe 2 (23.10, soir)

Demande : la frise verticale de l'étape Houblons de la base v4.10 (le choix du brasseur) à plusieurs houblons ; D45,
D56, D61 bis, D64 redeviennent actives ; D55 (vide) sur un rail vertical ; G13 à G19.

### Fichiers

- `controle-rail.mjs` (mode `--parcours`, le mode actuel intact : G1 `RAIL OK 1/1`) : lit l'axe (`aria-orientation`,
  rail plus haut que large, sinon essai du doigt), accepte une poignée courte prise au centre, rattachée à sa ligne
  par `data-houblon` porté par la ligne ou par un descendant (le nom), classe les crans « en fermentation » comme
  « actif ». Règles ajoutées : D45, D56, D61 bis, D64 à plusieurs houblons ; D55 sur une frise verticale ; D61
  « place » seulement à un houblon (à plusieurs, les cartes s'intercalent) ; D69 : seul le bout visé doit rester dans
  l'écran. `cas-k3.html`, quand il est dans le dossier de la route, est joué en priorité pour les règles à plusieurs
  houblons ; sinon la page elle-même si elle porte au moins deux poignées ; sinon « non joué » et la demande
  (une session de la maquette qui l'a lu ainsi voit désormais la page jouée : ma-biere/cas-k3.html existe).
- Témoins, `temoins/rail-parcours-…` : `ok-vertical` (positif : trois houblons sur une frise commune, poignée par
  houblon, `data-houblon` sur le nom, loupe en bulle, nœuds écrits), `saute` (D64), `deux-chevauchent` (D56),
  `remonte` (D61 bis), `irregulier` (D45), `vide` (D55). Fabriqués par `voies/c1-rail/fabrique-temoins.mjs` et
  `page-vertical.mjs` (même dossier).
- `NOTE.md` : section « Passe 2 », D45, D55, D56, D61 bis, D64 reclassées.

### Critères

| Critère | Sortie |
|---|---|
| G1 à G8 | `RAIL OK 1/1`, `RAIL OK 1/1`, `ECHOUE OK` ×6 (D47, D34, D63, D42, D69, D46) |
| G9, G11, G12 | `NOTE OK`, `NOTE OK`, `CABLAGE OK` |
| G10 | `ma-biere · 20 règles jouées`, `dryhopper · 17 règles jouées`, `VERDICT ECHEC (RAIL ECHEC 3 problème(s))` |
| G13 | `rail-parcours-ok-vertical · 19 règles jouées`, `RAIL OK 1/1` |
| G14 | `ECHOUE OK (D64, code 1)` |
| G15 | `ECHOUE OK (D56, code 1)` |
| G16 | `ECHOUE OK (D61 bis, code 1)` |
| G17 | `ECHOUE OK (D45, code 1)` |
| G18 | `NOTE OK` (« plusieurs houblons », « aria-orientation », « rail-parcours-ok-vertical ») |
| G19 | `ECHOUE OK (D55, code 1)` |

Chaque témoin de la passe 2 échoue par son seul défaut (relu : saute → D64 seul, deux-chevauchent → D56 seul, remonte →
D61 bis seul (deux lignes : un houblon, puis plusieurs), irregulier → D45 seul, vide → D55 seul, au repos et pendant le
geste). Les témoins de la passe 1 (14) sont rejoués : mêmes verdicts. Essais : un par critère sur la version finale ;
en route, le témoin vertical a demandé six réglages (cartes qui se recouvrent sous le doigt, titre sous la loupe,
frise trop étirée : un vide de 100 px que D55 a lui-même trouvé, `data-houblon` sur le nom).

### Ce que le contrôle rend sur le parcours construit (rejoué à 18 h 40 environ)

`ma-biere/etat.html` (une seule poignée : Nugget), 20 règles jouées, 3 problèmes, tous D55 :

| Défaut | Mesure | Ce que l'écran doit changer |
|---|---|---|
| **D55** au repos | un vide de **182 px** dans la frise, entre 239 et 421 px (carte de Nugget → repère 0′) | frise proportionnelle aux minutes avec cartes hautes : la base consolidée n'a pas ce vide ; resserrer l'écart (échelle des minutes, ou carte repliée) jusqu'à 80 px au plus |
| **D55** pendant le geste, à 35′ | vide de 93 px (entre 349 et 442 px) | idem : la loupe grossit autour du doigt, le reste du rail reste compact |
| **D55** pendant le geste, après fermentation | vide de 169 px (entre 239 et 408 px) | idem |

`ma-biere/cas-k3.html` (Nugget 60′, Cascade 10′, Galaxy 5′ : D45, D56, D61 bis, D64 jouées), 20 règles jouées,
3 problèmes :

| Défaut | Mesure | Ce que l'écran doit changer |
|---|---|---|
| **D55** au repos et après fermentation | vide de 148 px (entre 239 et 387 px) | idem |
| **D35** après fermentation | « 1 j » (loupe) sur « 10′ » (repère de Cascade) | la loupe passe sur le repère d'un autre houblon : la décaler ou la tenir à droite des repères |

Tiennent sur les deux : D61 bis, D64 (aucun houblon déjà posé ne saute de côté ni ne bondit de plus de 24 px, aucun ne
sort de son segment), D56 (aucun texte du rail sur un autre hors de la carte tenue), D46, D47, D63, D67, D68, D69,
D44 (jours de fermentation), D41, D42, D34. `dryhopper` : 17 règles jouées, aucun problème (les défauts D35, D46,
D47 de la passe 1 ont été corrigés depuis par la session de la maquette) ; D45, D56, D61 bis, D64 : non joués, une
seule poignée (ce qui est dit à la page).

### Limites, dites

- **D45 non jouée sur la maquette** : la frise de Ma bière affiche ses minutes en graduations sur le rail (60′ 55′ …
  0′), pas en bulle ; la loupe les déforme volontairement (D63), la règle de régularité ne s'y applique pas. Elle ne
  s'applique qu'à une bulle de crans (le témoin `irregulier` la prouve).
- **La piste couvre toute la colonne** (limite annoncée par la voie de l'écran : chaque houblon a une piste de
  406 px, un doigt hors des repères est pris par la piste du dessus) : le contrôle prend la poignée au repère
  (`deb + 14`), donc il ne rend pas ce défaut. Un doigt posé entre deux repères n'est pas joué ; à brancher si le
  brasseur le demande (règle nouvelle : « un doigt posé sur un repère tient le repère sous lui »).
- **D61 « place »** n'est pas jouée à plusieurs houblons (les cartes des autres s'intercalent) : D61 bis et D64 la
  remplacent, avec le seuil de 24 px de l'ancien mode.
- La session de la maquette reconstruit ce dossier : les nombres ci-dessus datent d'une construction ; rejouer
  `node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs
  prototypes/houblons-v4/maquettes/parcours ma-biere dryhopper --page=etat.html --parcours` et, pour les règles à
  plusieurs houblons, `ma-biere --page=cas-k3.html`.
- Le rappel du système cite `systeme.mjs appels controle-rail.mjs --rejouer` : cette commande n'existe pas dans la
  version du dépôt lue ici (l'aide ne la liste pas) ; les critères ont été rejoués un à un.

CONNAISSANCE : une frise verticale qui garde la hauteur de ses cartes sur une échelle de minutes ouvre un vide de
150 à 180 px dès qu'un houblon quitte le haut ; D55 le mesure en lisant les textes et les cartes de la frise.
LEÇON PROPOSÉE : aucune
