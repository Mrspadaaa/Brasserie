# Leçons des agents

Erreurs de méthode déjà commises, cause, remède. Chargé par CLAUDE.md : relire avant de planifier, briefer ou livrer. Défauts du produit : `DEFAUTS-RECURRENTS.md` ; goûts du brasseur : `SPEC-BRASSEUR.md`, `cerveau/brasseur/`.
- **Quand** : après une correction, une voie rejetée, un contrôle raté par notre faute, une hypothèse fausse, un travail refait. **Qui** : le pilote seul ; les agents proposent par `LEÇON PROPOSÉE : …`.
- **Format** : `### Lnn — règle`, puis Erreur, Cause, Faire, Rôles, Contrôle. **Taille** : 170 lignes, 30 leçons et 8 mécanisées au plus ; au plafond, une entrée impose une sortie : fusion, ligne « Mécanisées », [[controles-mecanises]].

## Comprendre la demande

### L01 — Reformuler la portée d'une décision avant de la propager
- Erreur : 12.10, « seul 3.8 » partout. 01.11 : « sans clavier » lu « sans focus ». 21.11 : « l'app dans sa totalité ».. 24.11 : apport corrigé, salaire oublié (E45-3).
- Cause : portée (tests seuls, un usage, toute l'app) non écrite avant d'agir.
- Faire : écrire portée et écran visé en une ligne. Ambiguë : lecture étroite, réversible ; sa portée déjà dite prime. Mot mal tapé : terme du métier. Plainte visuelle : plus petit sens. Ses exemples illustrent une règle : le brief nomme la règle, pas ses exemples (15.11 : « C'est juste des exemples… !!! »). ([[maquettes-16-11]])
- Rôles : pilote, conseil
- Contrôle : aucun

### L02 — Expliquer une chose qui marche, ce n'est pas la refaire
- Erreur : 19.10, lots 12 et 12b : il voulait une explication à l'appui long, les lots ont refait la carte. « Tu as pas du tout bien compris le besoin ».
- Cause : l'appui long ouvrait déjà la fiche ; base non lue.
- Faire : lire la base, garder l'actuel au repos. S'il demande de challenger, rendre l'analyse avant de construire.
- Rôles : pilote, auteur
- Contrôle : `controle-appui.mjs` A6 à A8 (D70)

### L03 — Reprendre tout l'élément désigné, et sa maquette telle quelle
- Erreur : 26.10 : u4 masqué. 02.11 : p3c-3 avec l'ancien formulaire : « Mais l'app ». 22.11 : interrupteur des sels retiré : « On peut plus désactiver les sels ??? ».
- Cause : « X de Y » lu au sens étroit.
- Faire : lister dans Y tout ce qui relève de X. Sa maquette choisie : règle n° 1 ; un port retire ce qu'elle n'a pas, garde ce qu'elle a ; inventaire, captures côte à côte de chaque état et geste (D123). ([[maquettes-16-11]])
- Rôles : pilote, auteur, concepteur
- Contrôle : D92 PISTE ; `controle-choix.mjs` (D105) ; `controle-teinte.mjs` (D106)

### L04 — Prioriser comme un brasseur, pas comme un tableur
- Erreur : 18.10, recette « trop centré sur le ibu, pas d'info sur les AA », stock trop en avant.
- Cause : données justes, mais pas dans l'ordre de sa décision.
- Faire : carte de houblon : nom, α, rôle, arômes en couleur, moment et dose, puis IBU ; stock en icône seulement. Voir [[penser-brasseur]].
- Rôles : auteur, relecteur, conseil
- Contrôle : D87 (`controle-alpha.mjs`)

## Préparer : briefs, données, architecture

### L05 — Contrôler une exigence transversale sur tous les écrans, et la répéter dans chaque brief
- Erreur : 19.10, « au style » contrôlé sur Ma bière seule ; les autres l'ont perdu. « commen ça a pu être oublié ? » 22.11 : frise au seul Calendrier, « PARTOUT n'a pas été porté ». 23.11 : « lecture seule ».
- Cause : contrôle limité à l'écran d'origine, absent des briefs suivants.
- Faire : contrôle sur tous les écrans dès l'arrivée de l'exigence (grep des équivalents), recopiée dans chaque VOIE.md et brief de test (en ligne, chaque actionneur joué sur « ZZ TEST — … », Enregistrer compris, puis retiré). Un constat n'existe que versé à `work/missions/BUGS.md`. Contenu ajouté : ses plafonds. ([[maquettes-16-11]])
- Rôles : pilote
- Contrôle : `controle-au-style.mjs` (D75)

### L07 — Une baseline est un plancher à enrichir
- Erreur : 19.10, un brief disait « à reprendre, pas à réinventer » et a bridé les auteurs. « il faudrait évidemment d'enrichir et pas de limiter à ça !!! »
- Cause : le brief protégeait l'acquis au lieu de demander mieux.
- Faire : « plancher à enrichir » dans chaque brief ; une simple copie perd des points chez le relecteur.
- Rôles : pilote, relecteur
- Contrôle : aucun

### L29 — Un problème connu se résout par la méthode standard et ses bibliothèques, pas à la main
- Erreur : 02 et 03.11, D381 : découpe des photos réécrite à la main ; deux jours de rustines. « Tu reinvte la roue là » ; « c'est une erreur de junior ».
- Cause : une rustine par cas raté, problème type jamais nommé, existant jamais cherché.
- Faire : avant tout algorithme non trivial (image, OCR, géométrie, texte, calcul numérique, dates) : nommer le problème d'école, chercher méthode standard et bibliothèques maintenues, écrire la décision dans « ## État de l'art » de MISSION.md, puis coder. Deuxième rustine sur un module : refaire cette étape. Chaque changement rejoue tout le banc, temps compris.
- Rôles : pilote, auteur, conseil
- Contrôle : `systeme.mjs mission` refuse une mission de code sans « ## État de l'art » (problème type, examiné, décision)

## Prouver

### L11 — Fini veut dire utilisable, pas un reçu
- Erreur : 08.10, couches V3 à V5.5 inutilisables. 07.11 : « 2 115 verts », 27 fichiers non chargés. 20.11 : calendrier « une catastrophe ».
- Cause : preuves déclarées, non des parcours réels.
- Faire : un correctif se reproduit puis se prouve sur la vraie app (canal de prévisualisation, ZZ TEST), par le geste et l'entrée du constat ; une fixture ne le dit pas corrigé (23.11 : 7 KO sur 29). Fini = branché, typé, build vert. Un banc ne contourne aucun geste (D367) ; un drapeau se lit au paquet (D368). Donnée jetée ou test non chargé : jamais un vert. Défaut ouvert : corrigé sans attendre. ([[maquettes-16-11]])
- Rôles : pilote, relecteur, exécutant
- Contrôle : aucun

### L12 — Un effet doit se voir, et une capture non regardée ne prouve rien
- Erreur : 19.10, loupe faible. 02.11 : « MAIS QU'EST-CE QUI A ÉTÉ TESTÉ ». 22.11 : test en ligne « jugé par mesures », reçu : « Je l'ai expressément demandé ».
- Cause : captures non ouvertes, rapport sans vision reçu.
- Faire : effet ×3. Capture ouverte avant OK ; rapport de test sans capture ouverte : refusé. Avant déploiement : chaque genre, chaque état, téléphone surtout (390 en défilant), 1280 peu, côte à côte avec sa maquette, « combien et quels problèmes ? », critique puis pilote (D342). 390×660, 844×340. ([[maquettes-16-11]])
- Rôles : pilote, relecteur, auteur, exécutant
- Contrôle : aucun

### L13 — Une plainte devient un contrôle qui échoue sur la version rejetée, avant toute correction
- Erreur : 18.10, mêmes défauts de v2 à v4 (trop de texte, cockpit) ; 20.10, « épicé » critiqué une deuxième fois (lots 15 et 21), la première plainte n'étant pas un contrôle.
- Cause : règles écrites lues par des agents, non des contrôles bloquants.
- Faire : tout message, question comprise, mot pour mot dans SPEC au tour même (01.11 : six oubliés). Ligne à DEFAUTS-RECURRENTS avec ses mots, contrôle qui échoue sur la version rejetée, puis corriger ; rien montré sans LOT OK. Deux refus du même élément : changer de genre de solution, depuis une référence qu'il connaît ([[beermaverick-radar]]). Plainte ambiguë : chaque lecture un axe de variantes, aucune un contrôle bloquant (D144). ([[maquettes-16-11]])
- Rôles : pilote, auteur
- Contrôle : `systeme.mjs mission` (portée), cablage (« OK 0/0 »)

### L14 — Confronter les données au savoir du brasseur sur les houblons phares
- Erreur : 20.10, Nelson Sauvin paraît « un houbon ordinaire alors que c'est un un houbon incroyable ». 08.11 (bis) : malt en fermentation J+4 compté dans l'OG, vu trois fois, mal lu. « JAI VU CA EN 2S ???? ».
- Cause : 83 % de ses mots (vin blanc, groseille) hors des 12 familles, donc hors du dessin ([[descripteurs-hors-familles]]).
- Faire : relire chaque constat à la question « est-ce que ça existe en vrai ? » ; une maquette choisie ne valide aucune règle de brassage. Avant publication, mesurer la part de mots sans famille des houblons de référence (Nelson Sauvin, Citra…), confronter le rendu à leur réputation. ([[maquettes-16-11]])
- Rôles : relecteur, conseil, auteur
- Contrôle : `controle-sans-famille.mjs` (D100)

## Agents et outils

### L17 — Une voie n'écrit que dans ce qu'elle possède
- Erreur : lot 21 et 22.10, fichiers de travail à la racine ; 25.10, T4 : déménagé sans les importeurs ; 01.11 : correctif testé en partie, sources remises à HEAD.
- Cause : aucun périmètre d'écriture déclaré, `git status` non regardé après la voie.
- Faire : OWNS dans chaque VOIE.md ; `git status --short` après chaque voie ; commit par chemins. Fichiers de travail : son OWNS ou `os.tmpdir()`, jamais la racine. Déménagement, format, chargement, champ nourri d'ailleurs : `grep` des lecteurs (module compris), tests rejoués ; un correctif, toute la liste de sa voie. Un critère n'écrit pas dans un livrable. Référence : `git show HEAD:<f>` vers `os.tmpdir()` ; rien remis à HEAD sans copie vérifiée. Banc Chrome ou déploiement : depuis un dossier que nul autre n'écrit, puis lire « found N files » et la page servie. ([[maquettes-16-11]])
- Rôles : pilote, auteur, exécutant, concepteur
- Contrôle : aucun

### L18 — Plafonner chaque voie, et réserver le jugement à ce qui en demande
- Erreur : lots 5 à 21 : 130 à 350 k jetons par auteur. 09.11 : 10 relances : « pas pour du va et vient inutile !!! ».
- Cause : pas de plafond par voie, tout au modèle le plus cher, retour sans format.
- Faire : banc : parallèle par lots de 8, coût réservé avant envoi (23.11). maxTurns par agent, Haiku au mécanique, Sonnet au code, Opus pour dessiner ce qu'il voit, planifier, signer (L25). Retour en une ligne. Avant le premier VOIE.md ou Agent : `voies` (et `conseil` si le lot fixe une direction). Brief complet d’emblée ; retouches groupées. Peu de chantiers à la fois, méthode fixe en cours de lot (16.11). Maquettes : [[maquettes-16-11]]. Correction chirurgicale : liste figée, chaque défaut prouvé seul ; vision complète une fois, avant d’aller en ligne ; défaut neuf au registre ; 3 tours au plus, puis en ligne si aucun bloquant ne touche données ou geste principal (18.11).
- Rôles : pilote
- Contrôle : `systeme.mjs agents` ; `mission` : plafond ≤ maxTurns ; `.claude/hooks/garde-jetons.mjs` (3e relance, brief incomplet)

### L19 — Cadrer une décision sur l'acquis et les choix en attente, et lire la plainte comme une proposition
- Erreur : 17.11, « beaucoup utilisé comme brouillon » lu en usage principal : « Non focus sur l'achat de matériel ». 22.10, conseil cadré sur « A, B ou C », sans savoir que Comparer était intégré, qu'un choix de radar attendait, que sa plainte contenait une carte.
- Cause : carte candidate du registre cadrée sans relire acquis, attentes ni mots exacts.
- Faire : relire [[acquis-valides]], les choix en attente et ses mots ; poser la cause observée (captures) avant les options ; citer la formule exacte, poids compris (D77). Un parcours cite sa plainte (15.11 : « mal target »).
- Rôles : pilote, conseil
- Contrôle : aucun

### L20 — Mesurer avant d'écarter un repli accepté par le brasseur
- Erreur : 20 et 22.10, la « grille 1,8 Mo » lue en coût de calcul ; un conseiller voulait abandonner sans chronométrer un repli qu'il avait accepté. 07.11 : découpe réglée et jugée sur les mêmes 200 pièces ; sur 200 neuves, pire que HEAD (88 silencieuses contre 57).
- Cause : la taille des fichiers de maquette a servi de mesure du moteur.
- Faire : un chiffre dit est mesuré, ou « estimé » avec sa source ; une garantie se bâtit sans l'IA (qui n'ajoute que des alertes). Chronométrer `simulerCas` sur le cas réel et le catalogue, à froid, entrée changeante ; le repli tient jusqu'à la mesure. Avant une architecture de calcul, profiler. Réglage choisi sur une moitié des cas, jugé sur l'autre (D77) ; un brief ne taille rien sur ses exemples. ([[maquettes-16-11]])
- Rôles : pilote, conseil, auteur, exécutant
- Contrôle : mesure faite le 22.10 ([[cout-calcul-moteur]]) ; pas de contrôle automatique

### L24 — Un choix du brasseur se montre en variantes ; ni choix ni accord ne bloquent
- Erreur : 22.10, questions fermées sans maquette. 02.11 : « ?? J'ai déjà donné mon avis ».
- Cause : « au brasseur de trancher » lu en porte bloquante ([[le-brasseur-choisit]], [[fil-de-fer-d-abord]]).
- Faire : mot ou détail mineur : sans maquette ([[micro-correctifs]]). Chaque choix ouvert : un axe de variantes, on lui montre, il choisit. Artefact privé, une page par choix, variantes et référence côte à côte (D126) ; sans page : « à dessiner ». Point ouvert : le lien et ce qu'on attend, sans code (D307). Cas rare : défaut A, lettre jamais réclamée (D315). Avant une demande d'accord, finir le non bloqué : preuve sur fixture simulée, build, commande prête. Répondu (silence et « tous » compris) : jamais redemandé ; l'ouvert seul, sur écran annoté (16.11). Écran refait : `maquettes` (19.11). Port : d'abord l'écran de sa plainte. ([[maquettes-16-11]])
- Rôles : pilote, conseil
- Contrôle : `systeme.mjs mission` refuse une voie montrée au brasseur qui dépend de son choix ; `controle-page-choix.mjs` (D126)

### L26 — Une variante qui reprend un socle préfixe ses classes et assemble son code sans remplacement de chaîne
- Erreur : 22.10, lot 22, cinq variantes sur douze cassées en silence par le socle (classes partagées, `$$` devenu `$`) ; contrôles verts.
- Cause : classes dans l'espace de noms du socle ; code assemblé par remplacement de chaînes.
- Faire : préfixer ses classes (`r6x-…`), un nom par rôle, et ses globales JS (script dans une fonction immédiate) ; assembler par `split/join` ou indices ; capturer et ouvrir aussi l'état ouvert et la fiche (L12). Un composant de l'app réemployé apporte ses boutons (24.10 : le × du Sheet) : les contrôles de route le couvrent.
- Rôles : concepteur, auteur
- Contrôle : aucun ; revenu 4 fois : à mécaniser

### L27 — Un juge qui parle pour le brasseur s'étalonne sur ses vrais verdicts
- Erreur : 22.10, le critique Fable a étoilé 4 variantes du lot 22 que l'utilisateur trouve peu concluantes, « pas super calibré », et rejeté r6a, que le brasseur a choisie.
- Cause : juge jamais éprouvé à l'aveugle ; verdicts du brasseur jamais revenus le corriger (boucle ouverte).
- Faire : jeu d'étalonnage (capture et verdict mot pour mot), nourri à chaque retour du brasseur ; éprouver le critique à l'aveugle avant de s'y fier. Sous le seuil, il signale des défauts, ne rejette jamais la diversité. À l'entonnoir, son classement est une proposition ; le brasseur voit tout (M13). Idem pour le regard Brasseur du conseil. Qui a lu le jeu ne refait pas l'épreuve. Un plafond de mots tenu en retirant du contenu fait un écran « pas fini ». ([[maquettes-16-11]])
- Rôles : pilote, critique, conseil
- Contrôle : `systeme.mjs etalonnage` (portrait v2 : 88 % et 75 %)

### L28 — Une lecture se juge sur ses vraies pièces, champ par champ
- Erreur : 01.11, commande : noms doublés, 27 s. « en 10s, un seul test, j'ai trouvé tout ça » ; 21.11 : Carnet sans vrai lien, « 50 problème ».
- Cause : pièces fictives ou réduites, jamais jugées contre l'écran.
- Faire : une vraie pièce par genre dans l'app, champ par champ et temps ; au banc le jour même, par son entrée. Réponse IA rejouée : copie d'une vraie, anonymisée avant Git. Écran porté : chasseurs avant mise en ligne. ([[maquettes-16-11]])
- Rôles : pilote, exécutant, relecteur
- Contrôle : au banc (D261 à D263)

## Mécanisées

- Toutes dans [[controles-mecanises]] (M17 et M18, ex-L10 et ex-L25, sorties le 03.11).
