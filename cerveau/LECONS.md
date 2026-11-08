# Leçons des agents

Erreurs de méthode déjà commises, leur cause, et ce qu'il faut faire à la place. Chargé à chaque
session par CLAUDE.md : relire avant de planifier, briefer ou livrer. Les défauts du produit vont dans
`DEFAUTS-RECURRENTS.md`, les goûts du brasseur dans `SPEC-BRASSEUR.md` et `cerveau/brasseur/`.
- **Quand** : après une correction, une voie rejetée, un contrôle raté par notre faute, une hypothèse fausse, un travail refait. Avant de clore le tour.
- **Qui** : le pilote seul ; les agents proposent par `LEÇON PROPOSÉE : …`.
- **Format** : `### Lnn — règle`, puis Erreur (date, fait), Cause, Faire, Rôles, Contrôle.
- **Taille** : 170 lignes, 30 leçons et 8 mécanisées au plus. Au plafond, une entrée impose une sortie : fusion, ligne « Mécanisées », [[controles-mecanises]].

## Comprendre la demande

### L01 — Reformuler la portée d'une décision avant de la propager
- Erreur : 12.10, « seul 3.8 » (tests) mis partout. 01.11 : « sans clavier » lu « sans focus » (D230). 02.11 : « terminé tes tâches » lu « plus rien lancer » (D356).
- Cause : la portée (tests seuls, un usage, toute l'app) n'a pas été écrite avant d'agir.
- Faire : écrire la portée (et l'écran visé) en une ligne. Si elle est ambiguë, appliquer la lecture étroite et réversible, et le signaler. Un mot mal tapé : le terme du métier le plus proche, et dire sa lecture. Une plainte visuelle : le plus petit sens, sur sa capture zoomée.
- Rôles : pilote, conseil
- Contrôle : aucun

### L02 — Expliquer une chose qui marche, ce n'est pas la refaire
- Erreur : 19.10, lots 12 et 12b. Il voulait une explication à l'appui long ; les lots ont refait la carte. « Tu as pas du tout bien compris le besoin ».
- Cause : le comportement actuel n'a pas été lu (l'appui long ouvrait déjà la fiche).
- Faire : lire ce que la base fait déjà, garder l'actuel au repos et n'ajouter qu'un petit élément. Quand il demande de challenger, rendre l'analyse avant de construire.
- Rôles : pilote, auteur
- Contrôle : `controle-appui.mjs` A6 à A8 (D70)

### L03 — Reprendre tout l'élément désigné, et sa maquette telle quelle
- Erreur : 19.10, l5b : barres sans pistes. 26.10 : u4 masqué (D155). 02.11 : F rendu (D295) ; p3c-3 avec l'ancien formulaire : « Mais l'app » (D346).
- Cause : « X de la variante Y » lu au sens étroit.
- Faire : lister dans Y tout ce qui relève de X avant de reprendre. Sa maquette choisie : règle n° 1 ; un port retire ce qu'elle n'a pas ; inventaire, captures côte à côte de chaque état, gestes compris, même pour une revue (D123). Un nom de vignette (`data-nom`) n'est pas une consigne ; un choix vaut pour son principe, pas pour sa fixture. La base d'une reprise est l'écran de la maquette jouable. Ses captures, mesurées (D106) ; désignée vaguement : SPEC et inventaires. Un constat de revue qui contredit sa maquette ou une colonne refusée : refusé ou montré (L24). Un cas neuf se range dans un état de sa maquette, pas un composant neuf.
- Rôles : pilote, auteur, concepteur
- Contrôle : D92 PISTE ; `controle-choix.mjs` (D105) ; `controle-teinte.mjs` (D106)

### L04 — Prioriser comme un brasseur, pas comme un tableur
- Erreur : 18.10, recette « trop centré sur le ibu, pas d'info sur les AA », stock trop en avant.
- Cause : les données étaient justes, mais pas dans l'ordre de la décision du brasseur.
- Faire : sur une carte de houblon, dans cet ordre : nom, α, rôle, arômes en couleur, moment et dose, puis l'IBU. Le stock en icône seulement. Voir [[penser-brasseur]].
- Rôles : auteur, relecteur, conseil
- Contrôle : D87 (`controle-alpha.mjs`)

## Préparer : briefs, données, architecture

### L05 — Contrôler une exigence transversale sur tous les écrans, et la répéter dans chaque brief
- Erreur : 19.10, « au style » contrôlé sur Ma bière seule ; les autres l'ont perdu. « commen ça a pu être oublié ? »
- Cause : le contrôle ne couvrait que l'écran d'origine, et les briefs suivants ne reprenaient pas l'exigence.
- Faire : écrire le contrôle pour tous les écrans dès l'arrivée de l'exigence. Recopier la liste des exigences transversales dans chaque VOIE.md.
- Rôles : pilote
- Contrôle : `controle-au-style.mjs` (D75)

### L07 — Une baseline est un plancher à enrichir
- Erreur : 19.10, un brief disait « à reprendre, pas à réinventer » et a bridé les auteurs. « il faudrait évidemment d'enrichir et pas de limiter à ça !!! »
- Cause : le brief protégeait l'acquis au lieu de demander mieux.
- Faire : écrire « plancher à enrichir » dans chaque brief. Une simple copie perd des points chez le relecteur.
- Rôles : pilote, relecteur
- Contrôle : aucun

### L29 — Un problème connu se résout par la méthode standard et ses bibliothèques, pas à la main
- Erreur : 02 et 03.11, D381 : découpe des photos (papier, angle, seuil d'encre) réécrite à la main au lieu de la chaîne d'un scanner de document (OpenCV.js) ; deux jours de rustines, le banc des 200 en échec. « Tu reinvte la roue là » ; « c'est une erreur de junior ».
- Cause : chaque cas raté du banc a reçu sa rustine, sans jamais nommer le problème type ni chercher ce qui existe ; aucune étape ne le demandait.
- Faire : avant tout algorithme non trivial (image, OCR, géométrie, analyse de texte, calcul numérique, dates), nommer le problème d'école, chercher la méthode standard et les bibliothèques maintenues (licence, poids, vitesse), écrire la décision dans « ## État de l'art » de MISSION.md, puis coder. À la deuxième rustine sur un même module, s'arrêter et refaire cette étape. Chaque changement rejoue tout le banc, temps compris.
- Rôles : pilote, auteur, conseil
- Contrôle : `systeme.mjs mission` refuse une mission de code sans « ## État de l'art » (problème type, examiné, décision)

## Prouver

### L11 — Fini veut dire utilisable, pas un reçu
- Erreur : 08.10, reçus, couches V3 à V5.5 : rien d'utilisable. 02.11 : B codé, hors du menu (D366). 07.11 : « 2 115 verts » : 27 fichiers non chargés, non comptés.
- Cause : on comptait des preuves déclarées au lieu de parcours réels.
- Faire : une chose est finie si elle est branchée, atteinte depuis le menu dans Chrome, typée, testée, avec un build vert. Un banc ne contourne aucun geste (D367) ; un drapeau se lit au paquet (D368). Une donnée jetée n'est jamais un vert : lire par tranches. Compter aussi les fichiers de test non chargés.
- Rôles : pilote, relecteur, exécutant
- Contrôle : aucun

### L12 — Un effet doit se voir, et une capture non regardée ne prouve rien
- Erreur : 19.10, loupe p02 : 19 à 20 px sous le doigt, 8 à 13 au loin. 25.10 : + centré à 0 px : « comment ça peut passer ça ??? ». 02.11, Bauhaus : « MAIS QU'EST-CE QUI A ÉTÉ TESTÉ ».
- Cause : aucune force minimale exigée, captures non ouvertes.
- Faire : « sous le doigt / au loin » ×3 au moins. Ouvrir chaque capture avant de dire OK ; juger la zone en plein format : un vert ne dit pas que c'est bien. Avant de déployer : une pièce de chaque genre, chaque état touché, deux thèmes, 390 tactile en défilant et 1280, côte à côte avec sa maquette, à la question ouverte « combien et quels problèmes ? », critique puis pilote (D342). Reprise sur événement : rechargement et réseau joués.
- Rôles : pilote, relecteur, auteur, exécutant
- Contrôle : aucun

### L13 — Une plainte devient un contrôle qui échoue sur la version rejetée, avant toute correction
- Erreur : 18.10, les mêmes défauts revenaient de v2 à v4 (trop de texte, cockpit) ; 20.10, « épicé » critiqué une deuxième fois (lots 15 et 21), la première plainte n'étant pas un contrôle.
- Cause : les corrections étaient des règles écrites, lues par des agents, et non des contrôles bloquants.
- Faire : tout message, question comprise, va mot pour mot dans SPEC au tour même (01.11 : six oubliés). Ligne à DEFAUTS-RECURRENTS avec ses mots, contrôle qui échoue sur la version rejetée, puis corriger. Rien montré sans LOT OK. Après deux refus du même élément, changer de genre de solution, et partir d'une référence qu'il connaît ([[beermaverick-radar]]). Une plainte ambiguë : chaque lecture devient un axe de variantes, aucune un contrôle bloquant (D144). Un contrôle ne garde que s'il tourne sur le format actuel : ceux de `portee-defauts.json` entrent dans les GATES ; un mort est adapté ou caduc (D4). Rejouer chaque critère sur HEAD et sur la version voulue avant la voie ; un état de banc neuf, par une fonction pure aussi.
- Rôles : pilote, auteur
- Contrôle : `systeme.mjs mission` (portée), cablage (« OK 0/0 »)

### L14 — Confronter les données au savoir du brasseur sur les houblons phares
- Erreur : 20.10, Nelson Sauvin paraît « un houbon ordinaire alors que c'est un un houbon incroyable ».
- Cause : 83 % de ses mots (vin blanc, groseille) sont hors des 12 familles et sortent du dessin ; nul n'a confronté le rendu à sa réputation ([[descripteurs-hors-familles]]).
- Faire : avant publication, mesurer la part de mots sans famille des houblons de référence (Nelson Sauvin, Citra…), et confronter le rendu à leur réputation. À plusieurs variétés, comparer chaque nombre de la capture à la ligne de sa variété (31.10 : EBC au menu, « ? » à côté). Un critère tiré de son attente, et la colonne « aujourd'hui » d'un choix, se testent d'abord sur la donnée et le code (27.10 : radar entier ; 02.11 : Pilsner déjà relié).
- Rôles : relecteur, conseil, auteur
- Contrôle : `controle-sans-famille.mjs` (D100)

## Agents et outils

### L17 — Une voie n'écrit que dans ce qu'elle possède
- Erreur : lot 21 et 22.10, fichiers de travail à la racine ; 25.10, T4 : déménagé sans les importeurs ; 01.11 : correctif testé en partie, sources remises à HEAD.
- Cause : aucun périmètre d'écriture n'était déclaré, et personne n'a regardé `git status` après la voie.
- Faire : déclarer OWNS dans chaque VOIE.md, et lancer `git status --short` après chaque retour de voie. Commit par chemins. Fichiers de travail : son OWNS ou `os.tmpdir()`, jamais la racine. Déménagement, format, chargement, champ nourri d'ailleurs : `grep` des lecteurs (module compris), tests rejoués ; un correctif, toute la liste de sa voie. Un critère n'écrit pas dans un livrable. Référence : `git show HEAD:<f>` vers `os.tmpdir()` ; rien remis à HEAD sans copie vérifiée. Déployer ou jouer un banc Chrome d'un dossier que nul autre n'écrit (Vite recharge, 01.11), puis lire « found N files » et la page servie.
- Rôles : pilote, auteur, exécutant, concepteur
- Contrôle : aucun

### L18 — Plafonner chaque voie, et réserver le jugement à ce qui en demande
- Erreur : lots 5 à 21, 8 à 12 auteurs (3 prévus), 130 à 350 k jetons chacun. 25.10 : ports et finitions à Opus ; « pas tout le temps Opus, mais bien hiku ou si vraiment sonnet ».
- Cause : pas de plafond par voie, tout au modèle le plus cher, un retour sans format.
- Faire : un plafond de tours par agent (maxTurns), Haiku pour le mécanique (rejeux, captures), Sonnet pour le code (ports compris), Opus pour dessiner ce qu'il voit, planifier, signer (L25). Retour en une ligne ; variantes, 12 à 16 (D204). Petite suite : Haiku neuf. Un long livrable s'écrit section par section. Avant le premier VOIE.md ou Agent : `voies` (et `conseil` si le lot fixe une direction).
- Rôles : pilote
- Contrôle : `systeme.mjs agents` ; `mission` : plafond ≤ maxTurns (01.11)

## Décider

### L19 — Cadrer une décision sur l'acquis et les choix en attente, et lire la plainte comme une proposition
- Erreur : 22.10, conseil cadré sur « A, B ou C », sans savoir que Comparer était déjà intégré, qu'un choix de radar attendait, et que sa plainte contenait déjà une carte.
- Cause : le cadrage partait de la carte candidate du registre, sans relire les acquis, les décisions en attente ni les mots exacts.
- Faire : avant de cadrer, relire [[acquis-valides]], les choix en attente du registre et les mots du brasseur. Poser la cause observée (captures) avant les options. Citer la formule exacte, poids compris (D77).
- Rôles : pilote, conseil
- Contrôle : aucun

### L20 — Mesurer avant d'écarter un repli accepté par le brasseur
- Erreur : 20 et 22.10, la « grille 1,8 Mo » lue en coût de calcul ; un conseiller voulait abandonner sans chronométrer un repli qu'il avait accepté. 03.11 : « ≈ 45 lignes » non mesuré ; tri confié à l'IA : 306 lignes sur 300 (D381). 07.11 : découpe réglée et jugée sur les mêmes 200 pièces ; sur 200 neuves, pire que HEAD (88 silencieuses contre 57).
- Cause : la taille des fichiers de maquette a servi de mesure du moteur.
- Faire : un chiffre dit est mesuré, ou « estimé » avec sa source ; une garantie se bâtit sans jugement de l'IA (elle n'ajoute que des alertes). Chronométrer le moteur (`simulerCas`, léger et complet) sur le cas réel et sur tout le catalogue. Le repli tient jusqu'à la mesure. Mesurer aussi une entrée qui change à chaque appel, et à froid. Avant une architecture de calcul, attribuer le temps mesuré au profil (25.10). Un réglage se choisit sur une moitié des cas, se juge sur l'autre (D77) ; un brief ne taille rien sur ses exemples. Un banc ne juge ni un artefact de l'ordre, ni les données de la clé (g1), ni sur une référence au plafond. Un champ neuf d'une passe payante se sonde sur une image d'un pixel ; un refus garde son motif.
- Rôles : pilote, conseil, auteur, exécutant
- Contrôle : mesure faite le 22.10 ([[cout-calcul-moteur]]) ; pas de contrôle automatique

### L24 — Un choix du brasseur se montre en variantes ; ni choix ni accord ne bloquent
- Erreur : 22.10, questions fermées sans maquette. 01.11 : « Vue TVA : à choisir », sans page. 02.11 : « ?? J'ai déjà donné mon avis ». 07.11 : « Pourquoi tu attends mon accord ??? ».
- Cause : « au brasseur de trancher » lu en porte bloquante ([[le-brasseur-choisit]], [[fil-de-fer-d-abord]]).
- Faire : chaque choix ouvert devient un axe de variantes : on lui montre, il choisit. Artefact privé, une page par choix, variantes et référence côte à côte (D126) ; sans page : « à dessiner ». Un point ouvert : le lien et ce qu'on attend, sans code (D307). Un cas rare : défaut A, lettre jamais réclamée (D315). Avant une demande d'accord, finir le non bloqué : preuve sur fixture simulée, build, commande prête.
- Rôles : pilote, conseil
- Contrôle : `systeme.mjs mission` refuse une voie montrée au brasseur qui dépend de son choix ; `controle-page-choix.mjs` (D126)

### L26 — Une variante qui reprend un socle préfixe ses classes et assemble son code sans remplacement de chaîne
- Erreur : 22.10, lot 22, cinq variantes sur douze cassées en silence par le socle (classes partagées, `$$` devenu `$`) ; contrôles verts.
- Cause : les classes de la variante partageaient l'espace de noms du socle, et le code client était assemblé par remplacement de chaînes.
- Faire : préfixer ses classes (`r6x-…`), un nom par rôle, et ses globales JS (script dans une fonction immédiate) ; assembler le code par `split/join` ou des indices ; capturer aussi l'état ouvert et la fiche, et les ouvrir (L12). Un composant de l'app réemployé apporte ses boutons (24.10 : le × du Sheet) : les contrôles de route le couvrent.
- Rôles : concepteur, auteur
- Contrôle : aucun ; revenu 4 fois : à mécaniser

### L27 — Un juge qui parle pour le brasseur s'étalonne sur ses vrais verdicts
- Erreur : 22.10, le critique Fable a étoilé 4 variantes du lot 22 que l'utilisateur trouve peu concluantes, « pas super calibré », et rejeté r6a, que le brasseur a choisie.
- Cause : aucune étape n'éprouvait le juge à l'aveugle, et les verdicts du brasseur ne revenaient jamais le corriger (boucle ouverte).
- Faire : un jeu d'étalonnage (capture et verdict mot pour mot), nourri à chaque retour du brasseur ; éprouver le critique à l'aveugle avant de s'y fier. Sous le seuil, il signale des défauts et ne rejette jamais la diversité. À l'entonnoir, son classement est une proposition ; le brasseur voit tout (M13). Idem pour le regard Brasseur du conseil. Qui a lu le jeu ne refait pas l'épreuve.
- Rôles : pilote, critique, conseil
- Contrôle : `systeme.mjs etalonnage` (portrait v2 : 88 % et 75 %)

### L28 — Une lecture se juge sur ses vraies pièces, champ par champ
- Erreur : 01.11, commande : noms doublés, 27 s. « en 10s, un seul test, j'ai trouvé tout ça ». 02.11 : fiches de malt vides (D302), sa photo refusée (D324).
- Cause : pièces fictives ou réduites, écran jamais jugé contre la pièce ; réponse IA rejouée inventée.
- Faire : une vraie pièce par genre dans l'app (photo d'origine), champ par champ et temps ; au banc le jour même, par l'entrée de l'app. Local se dit « non déployé ». Une réponse IA rejouée se copie d'une vraie.
- Rôles : pilote, exécutant, relecteur
- Contrôle : au banc (D261 à D263)

## Mécanisées

- Toutes dans [[controles-mecanises]] (M17 et M18, ex-L10 et ex-L25, sorties le 03.11).
