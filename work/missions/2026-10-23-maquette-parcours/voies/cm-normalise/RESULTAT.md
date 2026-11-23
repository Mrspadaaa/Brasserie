OK — controle-normalise-moment.mjs écrit : ECHEC sur cmb3a à cmb3d à 60′, OK sur le témoin ; lecture des barres à confirmer

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-normalise-moment.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/normalise-ok/etat.html` (témoin construit, valeurs simulées, normalisation calculée par la page)
- `work/refonte-frontend/v4/tournoi/outils/temoins/normalise-ko/etat.html` (même page, tout garde l'échelle du dry hop : témoin négatif de construction, en plus de ce qui était demandé)
- ce fichier

## Sorties décisives
Commande : `node work/refonte-frontend/v4/tournoi/outils/controle-normalise-moment.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cmb3a cmb3b cmb3c cmb3d`
- Chaque page, 60′ : `ECHEC — barres sous 40 % de la piste pour leur plus grande valeur : herbal 11 %, earthy 12 %, spice 30 %` (+ radar 73 à 100 % du rayon, écart max 77 points : ces deux mesures passent).
- Chaque page, dry hop actif et après : OK (toutes les familles ont une barre à 68 % ou plus ; radar 100 %).
- Dernière ligne : `NORMALISE ECHEC (4)`, code de sortie 1.

Commande : `… controle-normalise-moment.mjs work/refonte-frontend/v4/tournoi/outils/temoins normalise-ok`
- 60′, dry hop actif, dry hop après : OK ; dernière ligne `NORMALISE OK`. Le même appel avec `normalise-ko` donne ECHEC aux trois moments (60′ : barre max 12 %, écart 9 points, radar 12 %).
- Captures des deux témoins prises et ouvertes en image (60′) : barres pleines à l'échelle de chaque famille dans le témoin OK, minuscules dans le KO.

Contrôles de forme : aucun caractère de contrôle dans le script (grep, 0 ligne) ; l'usage n'imprime pas le jeton (il est assemblé en fin de script) ; sans argument, code 2 ; pas d'arrêt au premier échec (une ligne par page et par moment). Essais : 1 par critère. `git status` : seuls les fichiers ci-dessus sont nouveaux.

## DÉCISION À PRENDRE : lecture du critère (1)
Lu à la lettre (« la plus grande barre de la page remplit 40 % »), le critère laisse passer cmb3a à cmb3d : leurs barres sont bien rapportées au plus fort apport de la famille au moment choisi, et la plus grande va à 100 %. Le défaut D142 n'y est donc pas dans le « tout garde l'échelle du dry hop » mais dans le plancher de 0,3 cran de la note cmb3a : à 60′ les apports d'Herbacé, Terreux et Épicé sont sous ce plancher et leurs barres s'écrasent (11, 12, 30 %).
- Option A (retenue par défaut) : chaque famille non nulle doit voir sa plus grande barre à 40 % ou plus. Échoue sur cmb3a à cmb3d, passe au dry hop. Une famille toute à zéro ou inconnue n'est pas jugée.
- Option B : `--barres=globale`, la lecture à la lettre ; cmb3a passe (vérifié : NORMALISE OK).
- Recommandation : A. Contrepartie à trancher avec le brasseur : normaliser une famille dont l'apport réel à 60′ est quasi nul (0,03 cran) grossit du bruit ; la barre dirait « beaucoup » là où il n'y a presque rien. Si on garde le plancher pour ces cas, A échouera toujours sur 60′ et il faudra une exemption (apport sous un seuil en crans, lu dans l'aria-label).

## Repères et limites
- Rien ne manquait sur cmb3a à cmb3d : le contrôle lit, à défaut de repère propre, les structures existantes. Repères demandés pour les pages à venir (utilisés en premier si présents) : `data-role="barre-famille"` sur la barre, `data-role="piste-famille"` sur sa piste, `data-role="radar"` sur le svg du radar. Sans eux, la barre est le `[data-famille]` hors svg et sans data-role d'une cellule `[data-col]`, la piste son parent direct ; cmb3a à cmb3d n'en ont pas besoin.
- Le radar est lu sur les éléments `[data-serie]` ; centre et rayon sur les lignes d'axe (point de départ commun), à défaut le plus grand cercle de grille. Les trois formes de radar de cmb3 (multiples, un seul, secteurs de cmb3d) sont lues. Au radar, les cmb3 passent à 60′ (73 à 100 %) : le radar n'est pas le défaut mesurable ici ; le 100 % des secteurs de cmb3d est l'arc même, borné au rayon.
- Le contrôle mesure la géométrie rendue, pas l'intention : une barre à 100 % par un plafond sans calcul serait OK. Les sélecteurs de moment sont ceux de D141 (`data-role="quand-comparer"`). Aucune mesure en mode « Absolu » (la page ouvre en « Au style »).
- Dry hop : chaque moment dry hop du sélecteur est testé (actif et après sur cmb3).

CONNAISSANCE : à 60′ les rangées de cmb3a à cmb3d partagent les mêmes barres (identiques d'une page à l'autre) ; elles sont rapportées par famille au plus fort apport, avec un plancher de 0,3 cran qui écrase Herbacé, Terreux et Épicé.
LEÇON PROPOSÉE : aucune

---

# Ajout 1 — D67 : exemption « ~0 » dans controle-normalise-moment.mjs
Fait. Une cellule dont l'apport est sous 0,05 cran n'est jugée dans aucune mesure de barres. Lecture : `data-valeur` (en crans, sur la cellule ou la barre), sinon le « ~+0,1 cran » de l'aria-label de la cellule (« ~+0 cran » = sous 0,05, l'aria-label arrondit au dixième). La famille n'est pas jugée si toutes ses cellules sont exemptées ou à zéro.
- cmb3a à cmb3d, 60′ : ECHEC, une seule famille restante : `spice 30 %` (Cascade +0,1 cran seul non exempté ; Herbacé et Terreux disparaissent du jugement). Dry hop actif et après : OK. Dernière ligne `NORMALISE ECHEC (4)`.
- normalise-ok : OK aux trois moments (`NORMALISE OK`), son 60′ montre des cellules « ~0 » sans barre ; normalise-ko : ECHEC aux trois moments.
- Limite vue en passant : la rangée Résineux de cmb3 a des barres à 0 % alors que l'aria-label donne ~+0,1 à +0,2 cran (le résineux se dessine autrement, « déjà au-delà ») ; elle est donc comptée « à zéro », non jugée.

# Ajout 2 — D143 : controle-pics-radar.mjs
Fichiers : `work/refonte-frontend/v4/tournoi/outils/controle-pics-radar.mjs` ; `temoins/pics-ok/etat.html`.
Captures ouvertes : les deux brasseur-*.jpg (contours en étoile : une famille à zéro tire jusqu'au centre, une seule famille forte fait une aiguille) et le témoin pics-ok à 60′ et dry hop après (courbes rondes, zéro posé sur l'anneau pointillé).
Mesures (chaque contour `[data-serie]`, par série ; les cercles de sommet sont ignorés) : 1 lisse (path sans L, H, V ni lineto implicite après M ; ni polygon ni polyline) ; 2 centre : échantillon getPointAtLength, max(200, un point tous les 2 unités), distance minimale ≥ 12 % du rayon ; 3 angle entre pas voisins sous 60°. Tous les moments du sélecteur ; sans sélecteur (rpz2) une mesure « sans sélecteur ». Rayon et centre : lignes d'axe, sinon plus grand cercle.
Sorties :
- cmb3a à cmb3d : ECHEC à chacun des 5 moments (20 lignes) ; `PICS ECHEC (20)`, sortie 1. cmb3a : paths avec L, angles 115 à 159°, centre à 27 % ; cmb3b : plongée à 0 % du centre, angles 180° ; cmb3c : un seul contour, angles 140 à 152° ; cmb3d : secteurs reliés au centre (0 %), angles 173°.
- rpz2 (`work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/rpz2/etat.html`, chemin vérifié) : `PICS ECHEC (1)` ; trois polygones (un path L pour Idaho 7), plongée à 0 %, angle 180°.
- pics-ok : OK aux 5 moments, centre au plus près 20 %, angle max 22° ; `PICS OK`, sortie 0.
- Pas de caractère de contrôle (grep : 0) ; jeton assemblé en fin de script ; sans argument : usage et code 2.

Constat de construction (utile au concepteur) : une spline cardinale fermée (Catmull-Rom) passant par les 12 valeurs brutes ECHOUE encore (angles 82 à 112° aux pics, essais 1/6, 1/4, 1/3 de poignée : plus grand = pire, boucles). Un lissage voisin 1-2-1 d'un passage avant la courbe suffit (angle max 22°, zéros isolés restant sur l'anneau à 20 %) ; deux passages donnent 7°. Une spline seule ne règle donc pas « les pics » : il faut aussi arrondir les valeurs voisines (ou interpoler en polaire).

DÉCISION À PRENDRE : lissage des valeurs du radar. Il rend le contour moins fidèle (un pic isolé d'une famille est étalé sur ses voisines) ; à valider avec le brasseur sur mini maquettes (choix d'affichage, règle n° 1), pas à imposer. Recommandation : un passage 1-2-1, les valeurs exactes dans l'aria-label et au toucher.
CONNAISSANCE : aucun des radars de cmb3 et rpz2 n'est une courbe ; seul un contour arrondi par lissage passe le seuil de 60° au pas de 2 unités.
LEÇON PROPOSÉE : aucune
