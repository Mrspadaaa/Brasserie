OK — controle-rail.mjs --parcours : 23 plaintes classées, 14 témoins, joué sur le parcours : 14 défauts à corriger

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
