# Leçons des agents

Erreurs de méthode déjà commises, leur cause, et ce qu'il faut faire à la place. Chargé à chaque
session par CLAUDE.md : relire avant de planifier, briefer ou livrer. Les défauts du produit vont dans
`DEFAUTS-RECURRENTS.md`, les goûts du brasseur dans `SPEC-BRASSEUR.md` et `cerveau/brasseur/`.
- **Quand** : après une correction, une voie rejetée, un contrôle raté par notre faute, une hypothèse
  fausse, un travail refait. Avant de clore le tour.
- **Qui** : le pilote seul ; les agents proposent par `LEÇON PROPOSÉE : …`.
- **Format** : `### Lnn — règle`, puis Erreur (date, fait), Cause, Faire, Rôles, Contrôle.
- **Taille** : 170 lignes, 30 leçons et 8 mécanisées au plus. Au plafond, une entrée impose une sortie : fusion, ligne « Mécanisées », [[controles-mecanises]] (`systeme.mjs cerveau`, `charge`, `remplaces`).

## Comprendre la demande

### L01 — Reformuler la portée d'une décision avant de la propager
- Erreur : 12.10, « seul 3.8 », dit pour des tests, appliqué à toute l'app (G38 perdu). 24.10 : y1b et w2 visaient Comparer, greffés sur Dryhopper (D63). 25.10 : « traits trié » lu « plein », c'était « tiretés » (D147) ; « le + pas centré » (le signe dans son rond) lu comme la place du bouton (D149).
- Cause : la portée (tests seuls, un usage, toute l'app) n'a pas été écrite avant d'agir.
- Faire : écrire la portée (et l'écran visé) en une ligne. Si elle est ambiguë, appliquer la lecture étroite et réversible, et le signaler. Un mot mal tapé : le terme du métier le plus proche, et dire sa lecture. Une plainte visuelle : le plus petit sens, sur sa capture zoomée.
- Rôles : pilote, conseil
- Contrôle : aucun

### L02 — Expliquer une chose qui marche, ce n'est pas la refaire
- Erreur : 19.10, lots 12 et 12b. Il voulait une explication à l'appui long ; les lots ont refait la carte. « Tu as pas du tout bien compris le besoin ».
- Cause : le comportement actuel n'a pas été lu (l'appui long ouvrait déjà la fiche).
- Faire : lire ce que la base fait déjà à cet endroit, garder l'actuel au repos et n'ajouter qu'un petit élément. Quand il demande de challenger, rendre l'analyse avant de construire.
- Rôles : pilote, auteur
- Contrôle : `controle-appui.mjs` A6 à A8 (D70)

### L03 — Reprendre tout l'élément désigné, et sa maquette telle quelle
- Erreur : 19.10, l5b : barres reprises sans les pistes. 23.10 : maquette hors de ses choix (D105 à D107). 24.10 : un nom de vignette pris pour consigne (D140). 24-25.10 : Dryhopper et Comparer bâtis sur la mini maquette, pas l'écran jouable (D141).
- Cause : « X de la variante Y » lu au sens étroit.
- Faire : lister dans Y tout ce qui relève de X avant de reprendre. Sa maquette choisie : règle n° 1 ; inventaire, captures côte à côte de chaque état, gestes compris, même pour une revue (D123). Un nom de vignette cité (`data-nom`) n'est pas une consigne. La base d'une reprise est l'écran de la maquette jouable. Ses captures, mesurées (D106) ; désignée vaguement : SPEC et inventaires.
- Rôles : pilote, auteur, concepteur
- Contrôle : D92 PISTE ; `controle-choix.mjs` (D105) ; `controle-teinte.mjs` (D106)

### L04 — Prioriser comme un brasseur, pas comme un tableur
- Erreur : 18.10, recette vide « trop centré sur le ibu, pas d'info sur les AA », et un stock trop mis en avant.
- Cause : les données étaient justes, mais pas dans l'ordre de la décision du brasseur.
- Faire : sur une carte de houblon, dans cet ordre : nom, α, rôle, arômes en couleur, moment et dose, puis l'IBU. Le stock en icône seulement. Voir [[penser-brasseur]].
- Rôles : auteur, relecteur, conseil
- Contrôle : D87 (`controle-alpha.mjs`)

## Préparer : briefs, données, architecture

### L05 — Contrôler une exigence transversale sur tous les écrans, et la répéter dans chaque brief
- Erreur : 19.10, « au style » n'a été contrôlé que sur Ma bière ; Comparer, Suggestions, la fiche et la substitution l'ont perdu. « commen ça a pu être oublié ? »
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

### L10 — Un outil = un seul facteur libre, et la carte avant les variantes
- Erreur : 20.10, 41 variantes v0 au lot 21 sans carte des outils. 22.10, le conseil a montré que « Quand ? » et « Quelle dose ? » laissaient libres houblon, dose et levure.
- Cause : chaque écran faisait varier plusieurs facteurs. Un titre en forme de question ne suffisait pas à l'empêcher.
- Faire : définir chaque outil par le seul facteur qui y varie, afficher les autres sur une ligne de contexte, et lister ses éléments admis. Montrer la carte en fil de fer avant tout lot. Voir [[outils-houblons]] et [[2026-10-22-carte-outils-houblons]].
- Rôles : pilote, conseil, auteur, relecteur
- Contrôle : `controle-une-question.mjs` (D98)

## Prouver

### L11 — Fini veut dire utilisable, pas un reçu
- Erreur : 08.10, des reçus, des registres « qualifiés » et des couches V3/V4/V5.5 donnaient l'impression d'avancer, sans fonction utilisable.
- Cause : on comptait des preuves déclarées au lieu de parcours réels.
- Faire : une chose est finie si elle est branchée, atteinte par un vrai parcours dans Chrome, typée, testée, avec un build vert. Le quota sert d'abord ce qu'il verra : montrer tôt, outiller seulement ce qui bloque (24.10, SPEC § 1).
- Rôles : pilote, relecteur, exécutant
- Contrôle : aucun

### L12 — Un effet doit se voir, et une capture non regardée ne prouve rien
- Erreur : 19.10, loupe p02 : RAIL OK et LOT OK, mais 19 à 20 px sous le doigt, 8 à 13 au loin. 25.10 : + centré à 0 px (CENTRE OK), blancs jugés sur une page réduite : « comment ça peut passer ça ??? ».
- Cause : les contrôles bornaient le geste sans exiger de force minimale, et les captures n'étaient pas ouvertes.
- Faire : mesurer le rapport « sous le doigt / au loin » (×3 au moins). Ouvrir chaque capture en image avant de dire OK. Juger la zone entourée en recadrage plein format : un vert ne dit pas que c'est bien.
- Rôles : relecteur, auteur, exécutant
- Contrôle : aucun

### L13 — Une plainte devient un contrôle qui échoue sur la version rejetée, avant toute correction
- Erreur : 18.10, les mêmes défauts revenaient de v2 à v4 (trop de texte, cockpit) ; 20.10, « épicé » critiqué une deuxième fois (lots 15 et 21), la première plainte n'étant pas un contrôle.
- Cause : les corrections étaient des règles écrites, lues par des agents, et non des contrôles bloquants.
- Faire : ajouter la ligne à DEFAUTS-RECURRENTS avec ses mots, écrire le contrôle, vérifier qu'il échoue sur la version rejetée, puis corriger. Ne rien montrer sans LOT OK. Après deux refus du même élément, changer de genre de solution, pas d'objet, et partir d'une référence qu'il connaît (25.10 : [[beermaverick-radar]]). Une plainte ambiguë ne fige pas une seule lecture en contrôle bloquant : chaque lecture devient un axe de variantes (25.10 : « les pic » lu « sans pointe », D144). Un contrôle ne garde que s'il tourne sur le format actuel : ceux de la portée du lot (`portee-defauts.json`) entrent tous dans ses GATES, et un mort est adapté ou caduc (23.10 : D4). Rejouer chaque critère sur HEAD avant la voie (24.10, r14).
- Rôles : pilote, auteur
- Contrôle : `systeme.mjs mission` (portée) ; cablage (« OK 0/0 », portée inconnue)

### L14 — Confronter les données au savoir du brasseur sur les houblons phares
- Erreur : 20.10, avec l5f, Nelson Sauvin paraît « un houbon ordinaire alors que c'est un un houbon incroyable », et Motueka « ultra fruité ».
- Cause : 83 % de ses mots (vin blanc, groseille à maquereau, raisin) sont hors du lexique fermé des 12 familles, et sortent du dessin. Personne n'a confronté le rendu à la réputation du houblon (diagnostic du 22.10 : [[descripteurs-hors-familles]]).
- Faire : avant publication, mesurer la part de mots sans famille des houblons de référence (Nelson Sauvin, Citra, Motueka…), et confronter le rendu à leur réputation. À plusieurs variétés, comparer chaque nombre de la capture à la ligne de sa variété (un linalol d'un autre houblon).
- Rôles : relecteur, conseil, auteur
- Contrôle : `controle-sans-famille.mjs` (D100)

## Agents et outils

### L17 — Une voie n'écrit que dans ce qu'elle possède
- Erreur : lot 21 et 22.10, des fichiers de travail à la racine (`pistes-l5f.png`, `loupe.html`). 25.10, T4 : un déménagement sans les importeurs hors dossier.
- Cause : aucun périmètre d'écriture n'était déclaré, et personne n'a regardé `git status` après la voie.
- Faire : déclarer OWNS dans chaque VOIE.md, et lancer `git status --short` après chaque retour de voie. Le pilote commite par chemins (`git commit -- <chemins>`) : le `git mv` d'une voie en vol est déjà indexé (25.10). Les fichiers de travail d'une voie vont dans son OWNS ou dans `os.tmpdir()`, jamais à la racine. Un déménagement : `grep` de l'ancien chemin partout avant l'OWNS. Un critère non plus n'écrit dans un livrable (24.10). Référence de HEAD : `git show HEAD:<f>` vers `os.tmpdir()`, jamais en remplaçant le fichier (26.10).
- Rôles : pilote, auteur, exécutant, concepteur
- Contrôle : aucun

### L18 — Plafonner chaque voie, et réserver le jugement à ce qui en demande
- Erreur : lots 5 à 21, 8 à 12 auteurs en vol (3 prévus), 130 à 350 k jetons chacun. 25.10 : ports de code et finitions au concepteur Opus ; « pas tout le temps Opus, mais bien hiku ou si vraiment sonnet ».
- Cause : pas de plafond par voie, tout au modèle le plus cher, un retour sans format.
- Faire : un plafond de tours par agent (maxTurns), Haiku pour le mécanique (rejeux, captures), Sonnet pour le code (ports dans l'app compris), Opus pour dessiner ce qu'il voit, planifier, signer (L25). Retour en une ligne. Le plafond porte sur les agents et les tours, jamais sur les variantes (M13).
- Rôles : pilote
- Contrôle : `node scripts/agents/systeme.mjs agents`

### L28 — Charger les skills de méthode avant de planifier, surtout après une reprise
- Erreur : 24.10, après une reprise, six voies sans `voies` ni `conseil`.
- Cause : le résumé précédait le système.
- Faire : avant le premier VOIE.md ou Agent, invoquer `voies` (et `conseil` si le lot fixe une direction).
- Rôles : pilote
- Contrôle : aucun

## Décider

### L19 — Cadrer une décision sur l'acquis et les choix en attente, et lire la plainte comme une proposition
- Erreur : 22.10, conseil cadré sur « A, B ou C », sans savoir que Comparer était déjà intégré, qu'un choix de radar attendait, et que sa plainte contenait déjà une carte.
- Cause : le cadrage partait de la carte candidate du registre, sans relire les acquis, les décisions en attente ni les mots exacts.
- Faire : avant de cadrer, relire [[acquis-valides]], les choix en attente du registre et les mots du brasseur. Poser la cause observée (captures) avant les options. Citer la formule exacte, poids compris (D77).
- Rôles : pilote, conseil
- Contrôle : aucun

### L20 — Mesurer avant d'écarter un repli accepté par le brasseur
- Erreur : 20.10 et 22.10, la « grille 1,8 Mo » (fichier de maquette) a été lue comme un coût de calcul. Un conseiller a ensuite proposé d'abandonner le repli « dry hop et biotransformation seulement si c'est trop lourd » sans rien chronométrer.
- Cause : la taille des fichiers de maquette a servi de mesure du moteur.
- Faire : chronométrer le moteur (`simulerCas`, léger et complet) sur le cas réel et sur tout le catalogue. Le repli tient jusqu'à la mesure. Mesurer aussi une entrée qui change à chaque appel et le premier passage à froid. Avant une architecture de calcul, attribuer le temps mesuré au profil (25.10). Un réglage se choisit sur une moitié des cas, se juge sur l'autre (D77).
- Rôles : pilote, conseil, auteur, exécutant
- Contrôle : mesure faite le 22.10 ([[cout-calcul-moteur]]) ; pas de contrôle automatique

### L24 — Un choix du brasseur se montre en variantes, il ne bloque pas le lot
- Erreur : 22.10, le lot 22 attendait quatre questions fermées ; aucune mini maquette, aucune planche publiée.
- Cause : le pilote a traduit « au brasseur de trancher » (conseil) en portes bloquantes, contre [[le-brasseur-choisit]] et [[fil-de-fer-d-abord]].
- Faire : chaque choix ouvert devient un axe de variantes du lot suivant ; on lui montre, il choisit. Le pilote publie lui-même la page (artefact privé). Une page par choix, ses variantes côte à côte avec sa référence (D126).
- Rôles : pilote, conseil
- Contrôle : `systeme.mjs mission` refuse une voie montrée au brasseur (décideur brasseur) qui dépend de son choix ; `controle-page-choix.mjs` (D126)

### L25 — Ce que le brasseur verra se conçoit avec Opus et se juge par le critique calibré
- Erreur : 22.10, la planche « épicé » de Sonnet a été acceptée par le relecteur et le pilote. Le brasseur : « Aucun me convient... », troisième refus. L'utilisateur : « trop d'usage de sonnet et hiku ».
- Cause : les modèles étaient répartis par coût, et le critique Fable calibré du lot 21 (`fils21-choisir/critique/PORTRAIT.md`) avait été remplacé par un relecteur générique.
- Faire : maquettes, pictos et cartes à l'agent `concepteur` (Opus), montrés dans une vraie carte de la base. Relecture d'interface à l'agent `critique` (Fable). Sonnet pour les diagnostics, les contrôles et le code.
- Rôles : pilote
- Contrôle : `systeme.mjs mission` refuse une voie d'interface hors Opus ou Fable, et une relecture d'interface sans critique

### L26 — Une variante qui reprend un socle préfixe ses classes et assemble son code sans remplacement de chaîne
- Erreur : 22.10, lot 22, cinq variantes sur douze cassées en silence par le socle importé : classes partagées, un `$$` devenu `$` par `String.replace` ; contrôles verts.
- Cause : les classes de la variante partageaient l'espace de noms du socle, et le code client était assemblé par remplacement de chaînes.
- Faire : préfixer ses classes (`r6x-…`), un nom par rôle, et ses globales JS (script dans une fonction immédiate) ; assembler le code par `split/join` ou des indices ; capturer aussi l'état ouvert et la fiche, et les ouvrir (L12). Un composant de l'app réemployé apporte ses boutons (24.10 : le × du Sheet) : les contrôles de route le couvrent.
- Rôles : concepteur, auteur
- Contrôle : aucun ; revenu 4 fois le 23.10 : à mécaniser

### L27 — Un juge qui parle pour le brasseur s'étalonne sur ses vrais verdicts
- Erreur : 22.10, le critique Fable a étoilé 4 variantes du lot 22 que l'utilisateur trouve peu concluantes, « pas super calibré », et rejeté r6a, que le brasseur a choisie. Son portrait n'avait jamais été confronté à ses verdicts.
- Cause : aucune étape n'éprouvait le juge à l'aveugle, et les verdicts du brasseur ne revenaient jamais le corriger (boucle ouverte).
- Faire : un jeu d'étalonnage (capture et verdict mot pour mot), nourri à chaque retour du brasseur ; éprouver le critique à l'aveugle avant de s'y fier. Sous le seuil, il signale des défauts et ne rejette jamais la diversité. À l'entonnoir, son classement est une proposition ; le brasseur voit tout (M13). Idem pour le regard Brasseur du conseil. L'agent qui a lu ou enrichi le jeu ne refait jamais l'épreuve.
- Rôles : pilote, critique, conseil
- Contrôle : `systeme.mjs etalonnage` (portrait v2 : 88 % et 75 %)

## Mécanisées

- M10 — Un échappement écrit par un outil d'édition peut devenir un caractère de contrôle (22.10 : les `\b` de D98 devenus 0x08) : `systeme.mjs cablage` les refuse. Un critère n'imprime jamais son jeton sans condition (faux vert).
- M13 — Ce que le brasseur verra passe par l'entonnoir (`.claude/skills/voies/references/entonnoir.md`) : un vaste panel de concepts minimalistes sur la baseline, en trois chaleurs ; un classement ; des greffes « même les plus extravagantes » ; des passes v2, v3… jusqu'au satisfaisant. Le 22.10, le lot 22 (12 variantes) a perdu face au lot 21 (44 v0 : « vraiment plus qualitatif »). `systeme.mjs mission` : 48 v0 au moins en 6 séries, chaleurs (D22), baseline, tri, passe 2.
- M16 (L03) — Une reprise se contrôle geste par geste (repos, pendant, après), sur sa maquette et sur la construction : le 24.10, des inventaires « au repos » ont laissé le rail perdre ses fonctions (D124). Un contrôle arrêté au premier échec cache les suivants (« RAIL ECHEC 1 » en cachait 8). `controle-etats.mjs`, `controle-fonctions-rail.mjs`.
