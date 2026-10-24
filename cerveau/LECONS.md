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
- Erreur : 12.10, « seul 3.8 peut être utilisé », dit pour des tests, a été appliqué à toute l'app ; le lot G38 (#93) perdu.
- Cause : la portée (tests seuls, un usage, toute l'app) n'a pas été écrite avant d'agir.
- Faire : écrire la portée en une ligne. Si elle est ambiguë, appliquer la lecture étroite et réversible, et le signaler.
- Rôles : pilote, conseil
- Contrôle : aucun

### L02 — Expliquer une chose qui marche, ce n'est pas la refaire
- Erreur : 19.10, lots 12 et 12b. Il voulait une explication à l'appui long ; les lots ont refait la carte. « Tu as pas du tout bien compris le besoin ».
- Cause : le comportement actuel n'a pas été lu (l'appui long ouvrait déjà la fiche).
- Faire : lire ce que la base fait déjà à cet endroit, garder l'actuel au repos et n'ajouter qu'un petit élément. Quand il demande de challenger, rendre l'analyse avant de construire.
- Rôles : pilote, auteur
- Contrôle : `controle-appui.mjs` A6 à A8 (D70)

### L03 — Reprendre tout l'élément désigné, et sa maquette telle quelle
- Erreur : 19.10, « Meilleures bar » de l5b. Seules les barres de voie ont été reprises, pas les pistes d'objectif. « C'est pas exactement ce que j'ai demandé ». 23.10 : la maquette suivait la carte et un thème proposé, pas ses choix (D105, D106), pourtant dite conforme ; « comme la maquette de base » lu base v4.10, c'était x3b, notée pour cela (D107).
- Cause : « X de la variante Y » lu au sens étroit.
- Faire : lister dans Y tout ce qui relève de X avant de reprendre. Sa maquette choisie : règle n° 1 ; inventaire, captures côte à côte de chaque état qu'elle montre, gestes compris, même pour une revue (24.10 : seul le glisser d'ébullition comparé, le froid avait pris Dryhopper, D123). Ses maquettes : ses captures, mesurées (D106). Désignée vaguement : ses mots dans SPEC et les inventaires.
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
- Erreur : 20.10, 41 variantes v0 au lot 21 sans carte des outils. « plusieur confusion entre timing, comparaison, houbons side by side […] ». 22.10, le conseil a montré que « Quand ? » (y1b) et « Quelle dose ? » (y3) laissaient libres houblon, dose et levure.
- Cause : chaque écran faisait varier plusieurs facteurs. Un titre en forme de question ne suffisait pas à l'empêcher.
- Faire : définir chaque outil par le seul facteur qui y varie, afficher les autres sur une ligne de contexte, et lister ses éléments admis. Montrer la carte en fil de fer avant tout lot. Voir [[outils-houblons]] et [[2026-10-22-carte-outils-houblons]].
- Rôles : pilote, conseil, auteur, relecteur
- Contrôle : `controle-une-question.mjs` (D98)

## Prouver

### L11 — Fini veut dire utilisable, pas un reçu
- Erreur : 08.10, des reçus, des registres « qualifiés » et des couches V3/V4/V5.5 donnaient l'impression d'avancer, sans fonction utilisable.
- Cause : on comptait des preuves déclarées au lieu de parcours réels.
- Faire : une chose est finie si elle est branchée, atteinte par un vrai parcours dans Chrome, typée, testée, avec un build vert. Classer l'existant : fini, inachevé récupérable, inutilisable.
- Rôles : pilote, relecteur, exécutant
- Contrôle : aucun

### L12 — Un effet doit se voir, et une capture non regardée ne prouve rien
- Erreur : 19.10, loupe p02 avec RAIL OK et LOT OK, mais 19 à 20 px sous le doigt contre 8 à 13 au loin. « L'échelle ne s'adapte toujours pas » ; 24 à 44 % des captures regardées.
- Cause : les contrôles bornaient le geste sans exiger de force minimale, et les captures n'étaient pas ouvertes.
- Faire : mesurer le rapport « sous le doigt / au loin » (×3 au moins). Ouvrir chaque capture en image avant de dire OK, dont celles de `verifier-page.mjs` (22.10 : script cassé).
- Rôles : relecteur, auteur, exécutant
- Contrôle : aucun

### L13 — Une plainte devient un contrôle qui échoue sur la version rejetée, avant toute correction
- Erreur : 18.10, les mêmes défauts revenaient de v2 à v4 (trop de texte, cockpit). 20.10 : le picto « épicé » est critiqué pour la deuxième fois (lot 15, puis lot 21), car la première plainte n'était pas devenue un contrôle.
- Cause : les corrections étaient des règles écrites, lues par des agents, et non des contrôles bloquants.
- Faire : ajouter la ligne à DEFAUTS-RECURRENTS avec ses mots, écrire le contrôle, vérifier qu'il échoue sur la version rejetée, puis corriger. Ne rien montrer sans LOT OK. Après deux refus du même élément, changer de genre de solution, pas d'objet. Un contrôle ne garde que s'il tourne sur le format actuel : ceux de la portée du lot (`portee-defauts.json`) entrent tous dans ses GATES, et un contrôle mort est adapté ou déclaré caduc (23.10 : D4 oublié ; 31 scripts sur 50 non rejoués).
- Rôles : pilote, auteur
- Contrôle : `systeme.mjs mission` (portée) ; cablage (« OK 0/0 » ; portée inconnue, 24.10 : p17 sans rail)

### L14 — Confronter les données au savoir du brasseur sur les houblons phares
- Erreur : 20.10, avec l5f, Nelson Sauvin paraît « un houbon ordinaire alors que c'est un un houbon incroyable », et Motueka « ultra fruité ».
- Cause : 83 % de ses mots (vin blanc, groseille à maquereau, raisin) sont hors du lexique fermé des 12 familles, et sortent du dessin. Personne n'a confronté le rendu à la réputation du houblon (diagnostic du 22.10 : [[descripteurs-hors-familles]]).
- Faire : avant publication, mesurer la part de mots sans famille des houblons de référence (Nelson Sauvin, Citra, Motueka…), et confronter le rendu à leur réputation. À plusieurs variétés, comparer chaque nombre de la capture à la ligne de sa variété (un linalol affiché pour un autre houblon).
- Rôles : relecteur, conseil, auteur
- Contrôle : `controle-sans-famille.mjs` (D100)

## Agents et outils

### L17 — Une voie n'écrit que dans ce qu'elle possède
- Erreur : lot 21, un auteur a laissé `pistes-l5f.png` à la racine du dépôt. 22.10, la voie r4c a écrit `loupe.html` et `loupe.png` à la racine (un sous-agent n'a pas le dossier temporaire du pilote).
- Cause : aucun périmètre d'écriture n'était déclaré, et personne n'a regardé `git status` après la voie.
- Faire : déclarer OWNS dans chaque VOIE.md, et lancer `git status --short` après chaque retour de voie. Les fichiers de travail d'une voie vont dans son OWNS ou dans `os.tmpdir()`, jamais à la racine. Un critère non plus n'écrit dans un livrable (24.10 : un G1 recapturait les images d'une page publiée).
- Rôles : pilote, auteur, exécutant, concepteur
- Contrôle : aucun

### L18 — Plafonner chaque voie, et réserver le jugement à ce qui en demande
- Erreur : lots 5 à 21, 8 à 12 auteurs en vol (3 prévus), à 130 à 350 k jetons chacun ; le pilote lisait tout.
- Cause : pas de plafond par voie, tout au modèle le plus cher, un retour sans format.
- Faire : un plafond de tours par agent (maxTurns), Haiku pour le mécanique, Sonnet pour l'analyse et le code, Opus pour l'interface, la planification et la signature (L25). Retour en une ligne. Le plafond porte sur les agents et les tours, jamais sur les variantes (M13).
- Rôles : pilote
- Contrôle : `node scripts/agents/systeme.mjs agents`

### L28 — Charger les skills de méthode avant de planifier, surtout après une reprise
- Erreur : 24.10, reprise sur un résumé du 20.10 : six voies lancées sans `voies` ni `conseil`, un lot de création prévu sans chaleurs. « Pourquoi tu n'as pas utiliser de base les bon outils ? »
- Cause : le résumé précédait le système.
- Faire : avant le premier VOIE.md ou Agent, invoquer `voies` (et `conseil` si le lot fixe une direction).
- Rôles : pilote
- Contrôle : aucun ; hook proposé

## Décider

### L19 — Cadrer une décision sur l'acquis et les choix en attente, et lire la plainte comme une proposition
- Erreur : 22.10, le pilote a cadré le conseil sur « A, B ou C, combien d'outils ». Il ignorait que Comparer était déjà intégré (base v4.6), que le radar r2 ou r3 attendait son choix, et que la plainte « suggestions, comparer, substituer, dryhopper » contenait déjà une carte.
- Cause : le cadrage partait de la carte candidate du registre, sans relire les acquis, les décisions en attente ni les mots exacts.
- Faire : avant de cadrer, relire [[acquis-valides]], les choix en attente du registre et les mots du brasseur. Poser la cause observée (captures) avant les options.
- Rôles : pilote, conseil
- Contrôle : aucun

### L20 — Mesurer avant d'écarter un repli accepté par le brasseur
- Erreur : 20.10 et 22.10, la « grille 1,8 Mo » (fichier de maquette) a été lue comme un coût de calcul. Un conseiller a ensuite proposé d'abandonner le repli « dry hop et biotransformation seulement si c'est trop lourd » sans rien chronométrer.
- Cause : la taille des fichiers de maquette a servi de mesure du moteur.
- Faire : chronométrer le moteur (`simulerCas`, léger et complet) sur le cas réel et sur tout le catalogue. Le repli tient jusqu'à la mesure. Mesurer aussi une entrée qui change à chaque appel et le premier passage à froid.
- Rôles : pilote, conseil, auteur, exécutant
- Contrôle : mesure faite le 22.10 ([[cout-calcul-moteur]]) ; pas de contrôle automatique

### L24 — Un choix du brasseur se montre en variantes, il ne bloque pas le lot
- Erreur : 22.10, le plan de reprise faisait attendre le lot 22 sur quatre questions fermées (radar r2/r3, base de comparaison…). La vague 1 n'a donné aucune mini maquette d'écran, et sa planche n'a pas été publiée. « Pourquoi ça n'a pas produit les mini maquettes ? »
- Cause : le pilote a traduit « au brasseur de trancher » (conseil) en portes bloquantes, contre [[le-brasseur-choisit]] et [[fil-de-fer-d-abord]].
- Faire : chaque choix ouvert devient un axe de variantes du lot suivant ; on lui montre, il choisit. Le pilote publie lui-même la page des fils de fer (artefact privé).
- Rôles : pilote, conseil
- Contrôle : `systeme.mjs mission` refuse une voie montrée au brasseur (décideur brasseur) qui dépend de son choix

### L25 — Ce que le brasseur verra se conçoit avec Opus et se juge par le critique calibré
- Erreur : 22.10, la planche « épicé » de Sonnet a été acceptée par le relecteur Sonnet et par le pilote. Le brasseur : « Aucun me convient... », troisième refus. L'utilisateur : « pas très qualitatif... trop d'usage de sonnet et hiku sur des tâches complexes ».
- Cause : les modèles étaient répartis par coût, et le critique Fable calibré du lot 21 (`fils21-choisir/critique/PORTRAIT.md`) avait été remplacé par un relecteur générique.
- Faire : maquettes, pictos et cartes à l'agent `concepteur` (Opus), montrés dans une vraie carte de la base. Relecture d'interface à l'agent `critique` (Fable). Sonnet pour les diagnostics, les contrôles et le code ; Haiku pour le mécanique.
- Rôles : pilote
- Contrôle : `systeme.mjs mission` refuse une voie d'interface hors Opus ou Fable, et une relecture d'interface sans critique

### L26 — Une variante qui reprend un socle préfixe ses classes et assemble son code sans remplacement de chaîne
- Erreur : 22.10, lot 22, cinq variantes sur douze cassées en silence par le socle importé (l8g, fiche g1) : classes partagées (`.rep`, `.r-bord`…), un `$$` devenu `$` par `String.replace`. Tous les contrôles étaient verts.
- Cause : les classes de la variante partageaient l'espace de noms du socle, et le code client était assemblé par remplacement de chaînes.
- Faire : préfixer ses classes (`r6x-…`), un nom par rôle, et ses globales JS (script dans une fonction immédiate) ; assembler le code par `split/join` ou des indices ; capturer aussi l'état ouvert et la fiche, et les ouvrir (L12). Un composant de l'app réemployé apporte ses boutons (24.10 : le × gris de 16 px du Sheet dans la fiche) : les contrôles de route le couvrent aussi.
- Rôles : concepteur, auteur
- Contrôle : aucun ; revenu 4 fois le 23.10 : à mécaniser

### L27 — Un juge qui parle pour le brasseur s'étalonne sur ses vrais verdicts
- Erreur : 22.10, le critique Fable a étoilé 4 variantes du lot 22 que l'utilisateur trouve peu concluantes, « pas super calibré », et rejeté r6a, que le brasseur a choisie. Il a aussi rejeté la planche « épicé » à six genres (D101 ter). Son portrait (PORTRAIT.md), écrit par un modèle, n'avait jamais été confronté à ses verdicts.
- Cause : aucune étape n'éprouvait le juge à l'aveugle, et les verdicts du brasseur ne revenaient jamais le corriger (boucle ouverte).
- Faire : un jeu d'étalonnage (capture et verdict mot pour mot), nourri à chaque retour du brasseur ; éprouver le critique à l'aveugle avant de s'y fier. Sous le seuil, il signale des défauts et ne rejette jamais la diversité. À l'entonnoir, son classement (demandé : « vaste panel et ensuite ranking ») est une proposition, et le brasseur voit tout (M13). Idem pour le regard Brasseur du conseil.
- Rôles : pilote, critique, conseil
- Contrôle : `systeme.mjs etalonnage` (portrait v2 : 88 % et 75 %)

## Mécanisées

- M10 — Un échappement écrit par un outil d'édition peut devenir un caractère de contrôle : le 22.10, les deux `\b` de D98 étaient des 0x08 (table `NOMME` morte, vue par la voie r6i), comme le `—` du pilote devenu un tiret. `systeme.mjs cablage` refuse tout caractère de contrôle dans les scripts de contrôle ; une voie qui en écrit un le rejoue (oublié deux fois le 24.10). Un critère n'imprime jamais son jeton sans condition : le jeton dans la commande donne un faux vert.
- M11 (L16) — Tout livrable d'agent est un fichier du dépôt : `JURY-VERDICT.md` annoncé, jamais produit. `systeme.mjs voies` rejoue les critères de chaque voie au lieu de croire son rapport.
- M12 — Une variante rejetée est relancée ou écartée ; des écrans ne sont finis qu'une fois publiés, chaque version dans un artefact neuf et lisible (22.10 : 6 rejets en plan ; 23.10 : « chaque version devrait en créé des nouveaux »). `systeme.mjs voies` (« ## Pages »), `verifier-page.mjs`.
- M13 — Ce que le brasseur verra passe par l'entonnoir (`.claude/skills/voies/references/entonnoir.md`) : un vaste panel de concepts minimalistes sur la baseline, en trois chaleurs ; un classement ; des greffes « même les plus extravagantes » ; des passes v2, v3… jusqu'au satisfaisant. Le 22.10, le lot 22 (12 variantes) a perdu face au lot 21 (44 v0 : « vraiment plus qualitatif »). `systeme.mjs mission` : 48 v0 au moins en 6 séries, chaleurs (D22), baseline, tri, passe 2.
- M14 — Un panel v0 vaut le lot 21 avant d'être trié : le 23.10, 56 concepts « minimalistes » (5 tours chacun, un squelette commun) étaient « vraiment moins quali », et 32 pictos sur 48 restaient sur ses exemples. Minimaliste = une idée, pas un écran vide ; la baseline est un vocabulaire, pas un gabarit ; ses exemples, un tiers du panel au plus. `controle-panel.mjs` (PANEL OK), exigé par `systeme.mjs mission` dans chaque tri.
