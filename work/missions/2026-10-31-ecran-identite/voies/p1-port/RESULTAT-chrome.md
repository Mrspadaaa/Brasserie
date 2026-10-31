ECHEC — série Chrome : 19 lignes ECHEC et arrêt sur `r4a-reperes` absent ; baseline : 28 gestes en échec (`[data-ecran='ma-biere']` introuvable), aucun diff de pixels ; `captures/` non vidé (suppression refusée par le garde-fou).

## Ce qui n'a pas été fait comme demandé
- `captures/` n'est PAS vidé : la commande `rm` a été bloquée par une vérification de sécurité (suppression d'un glob dans le dossier de travail, non résolu). Je n'ai pas contourné ce blocage. Les anciennes captures (session précédente) sont toujours dans `voies/p1-port/captures/`.
- La nouvelle série est donc écrite dans `voies/p1-port/captures/neuve/` (sous-dossier neuf, pour ne pas mélanger). Le journal est `captures/neuve/identite-journal.txt`.
- Le pilote doit supprimer les anciennes captures à la main, ou autoriser ce `rm` : sans cela, `captures/` contient deux générations.
- La série a planté avant la fin : `app-vide`, `app-reperes-ouverts`, `app-cuve-deborde`, `app-profil-rendu`, `app-clavier-*`, `maquette-repos`, `cote-a-cote` ne sont pas produits dans `neuve/`.

## Commande 1 : baseline-visuelle --comparer
Commande : `node scripts/with_server.mjs --server "npm run dev -- --port 5611 --strictPort" --port 5611 -- node scripts/agents/baseline-visuelle.mjs --comparer`
Sortie : `BASELINE ECHEC 28`, code 1 (le `CODE=0` précédent venait du `tail`, pas de la commande).
Les 28 lignes : toutes `geste en échec — Waiting for selector [data-ecran='ma-biere'] failed` (etape-houblons ×4, ma-biere ×8, suggerer ×3, comparer ×3, fiche ×2, dryhopper ×5, substituer ×3). Aucune comparaison de pixels n'a eu lieu. Les dossiers `baselines/_ecarts/etape-houblons` et `_ecarts/fiche` existent mais je n'y ai trouvé aucun fichier `.diff`/`.actuel` à ouvrir.
Cause probable : la page `ma-biere` ne se monte pas dans ce serveur (hors périmètre de cette voie) ; non corrigé.

## Commande 2 : capturer-identite.mjs (dossier neuf)
Commande : `node scripts/with_server.mjs --server "npm run dev -- --port 5611 --strictPort" --port 5611 -- node work/missions/2026-10-31-ecran-identite/voies/p1-port/capturer-identite.mjs --sortie=work/missions/2026-10-31-ecran-identite/voies/p1-port/captures/neuve`
Sortie : `IDENTITE ECHEC 19`, code 1, arrêt sur une exception. Lignes ECHEC, telles quelles :
- `ECHEC 390 : Espace libre et Matériel fermés au repos`
- `ECHEC 390 : Espace libre et Matériel côte à côte`
- `ECHEC 390 : le pied Suivant se voit sans défiler ({"bas":1212,"haut":844})`
- `ECHEC 390 : le + ne recouvre aucun texte au repos ((+ introuvable))`
- `ECHEC 390 : la pastille du style est teintée (famille reconnue) {"teinte":"","fond":"rgba(158, 158, 158, 0.2)","paddingDroit":26,"chevron":28,"champ":158}`
- `ECHEC 390 : le chevron du style ne recouvre pas le texte`
- `ECHEC 390 : marqueur r4a-plages présent`
- `ECHEC 390 : la recette de démonstration a un plan d'eau (moût avant ébullition —) : sans lui, la cuve ne peut pas déborder`
- `ECHEC 390 : la cuve dit son dépassement «  »`
- `ECHEC 390 : exception Error: failed to find element matching selector "[data-element="r4a-reperes"]"`
- (mêmes 9 lignes à 1280, la dernière étant `ECHEC 1280 : exception Error: failed to find element matching selector "[data-element="r4a-reperes"]"`, et `IDENTITE ECHEC 19` en fin)
Lignes OK notables : aucun input type=number ; aucun texte sous 12 px (passe désormais, à la différence de la série précédente) ; aucun débordement horizontal ; un seul nombre avant ébullition (barre « — », bloc « 0 / 35 L ») ; la règle, les « › », le pointillé, l'ébullition 240, la puce fermenteur 60, « ↺ profil », « 5 L libres », le parcours au clavier avant l'arrêt.
Lignes INFO : tuiles `espace` (fermée, w 184 à 390) et `materiel` (ouverte, w 374) ; pied `{"bas":1212,"haut":844}` à 390 ; pastille `{"teinte":"","fond":"rgba(158, 158, 158, 0.2)"}` ; avant ébullition `—`.

Interprétation (non corrigée) : la recette de démonstration de cette série est « Stout export » (20 L, 16D, sans grain) : elle n'a ni moût avant ébullition ni plan d'eau, donc la cuve ne peut ni déborder ni être mesurée. Le script attend une recette avec grain (ancienne « Milk Stout #2 »), ce qui n'est plus le cas. C'est la cause la plus probable des échecs « cuve » et « +N L de trop » ; le `r4a-reperes` absent est un marqueur que la version actuelle ne pose pas (à vérifier par le pilote).

## Captures ouvertes (dossier `captures/neuve/`), une à deux phrases chacune
390 :
- `app-repos-390` : état au repos sur « Stout export », 20 L pour fermenteur 30 L, pastille grise « 16D » sans teinte de famille, carte Espace libre fermée à demi-largeur et Matériel ouvert pleine largeur en dessous ; le pied Retour/Suivant est sous le pli.
- `app-repos-cave-390` : thème sombre (cave) de la même étape, contrastes et hachures lisibles, bordure et « + » en or ; rien de coupé visible.
- `app-ebullition-240-390` : 240 min, règle 0 à 270 avec « › », pas de barre de cuve (sans grain, « — » et « sans malts »), Espace libre fermée à demi-largeur et Matériel ouvert.
- `app-fermenteur-ouvert-390` : défilé, Matériel ouvert, Fermenteur 30 au focus, « Installation à adopter » et deux bandeaux ambre ; le bloc « Volumes et matériel » affiche « Fermenteur · prévu 20 / 30 L » et « Espace libre 10 L · 33,3 % ».
- `app-fermenteur-60-390` : fermenteur 60, « ↺ profil », bandeaux « Adapter la recette à 30 L » et « Adapter à mon matériel actuel » ; le bloc donne « Espace libre 40 L · 66,7 % », et le bas (Retour/Suivant) est coupé par le bord.
1280 :
- `app-repos-1280` : en-tête « Modifier « Stout export » », Abandonner sous le titre, carte Volume à 20 L et règle volume lisible, Espace libre fermé à droite et pleine largeur d'un côté ; pastille 16D grise.
- `app-repos-cave-1280` : thème sombre sur tout l'écran, cartes et règles lisibles, rien de coupé visible.
- `app-ebullition-240-1280` : règle 0 à 270, « ~12 L évaporés », Espace libre fermé à demi-largeur et Matériel ouvert ; lisible.
- `app-fermenteur-ouvert-1280` : Matériel ouvert, Fermenteur 30 au focus, « Adapter la recette à 30 L » et « Adapter à mon matériel actuel » en bandeaux, bloc à « 20 / 30 L » ; pied Retour/Suivant visible en bas.
- `app-fermenteur-60-1280` : fermenteur 60, « ↺ profil », bandeaux d'adaptation, bloc « 20 / 60 L » et « 40 L · 66,7 % » ; le pied est en bas, presque coupé.

Non ouvertes : aucune capture produite pour app-vide, app-reperes-ouverts, cote-a-cote, maquette-repos (série plantée avant).

## Débordements, texte coupé, chevauchements vus
- 390 : le pied Retour/Suivant n'est pas visible au premier écran (confirmé par le script, `bas 1212 > haut 844`).
- 390 et 1280 : les tuiles du bas ne sont pas côte à côte fermées : Espace libre fermé, Matériel ouvert, donc la règle « deux demi-tuiles fermées » n'est pas tenue dans l'état affiché.
- 390 : le « + » flottant recouvre la bordure droite de Matériel (pas du texte) à `app-fermenteur-60-390`.
- Bloc « Volumes et matériel » et barre de cuve : sans grain, la barre affiche « — » et le bloc « 0 / 35 L » ; pas de dépassement affichable dans cette recette.

## Baseline : suite
Les 28 échecs sont des gestes (`ma-biere` introuvable), pas des écarts visuels : la voie n'a donc aucun écart de pixels à ouvrir. À traiter par le pilote avant de dire que les autres étapes sont inchangées.
