---
name: maquettes-16-11
description: ajouts du 16.11 (et précisions antérieures de L03, L13, L14, L17, L20, L24, L28) aux leçons L01, L05, L11, L12, L13, L17, L27, L28 (maquettes, notes de juges, tests tactiles), versés mot pour mot.
type: agents
maj: 2026-11-16
sources: cerveau/LECONS.md
---

Ajouts du 16.11 sortis de LECONS pour tenir le plafond de charge ; chacun complète le « Faire » de la leçon nommée.

- **L01** Une comparaison (« comme le + ») illustre un principe, pas l'objet à copier (16.11 : « Ça a rien avoir avec le bouton plus »).
- **L05** Réglage répété (16.11, le + juste au-dessus des onglets, « la 200eme fois », à droite après correction) : SPEC et DEFAUTS dès la première fois, dans chaque brief de maquette (FAB-GAUCHE).
- **L11** Un parcours scripté réussi ne voit ni le clavier qui cache, ni la colonne coupée, ni l'écran vide (16.11, carnet p5 : 4 écrans inutilisables après 5 passes notées 8). Avant toute page : audit écran par écran (« utilisable ? »), clavier ouvert, paysage, états vides et neufs, face à sa base préférée, trois regards.
- **L12** Le pilote ouvre lui-même les captures avant d'annoncer une note (16.11 : p5 annoncé à 8,2, captures jamais ouvertes par lui, refusé). Un juge compare côte à côte avec la version préférée du brasseur, écran par écran.
- **L13** Une boucle empilant ses exigences peut descendre sous sa base choisie (16.11, fb9 : 7,2 contre 8 pour fb) : repos d'abord, un lot à la fois sous garde mesurée.
- **L17** Base d'un port : le dernier tag en ligne ; avant `firebase deploy`, tout tag `en-ligne/*` inclus, sinon arrêt (16.11).
- **L27** Note de juges : montrer les captures avant de l'annoncer (16.11, p5 noté 8,2 par les juges, refusé par lui : « je comprends pas trop P5 »).
- **L28** « Claude in Chrome non connecté » est souvent passager : réessayer (list_connected_browsers) dans l'heure (16.11 : « il a toujours été possible de tester »). Toucher réel : testé chez nous, jamais renvoyé au brasseur ; émulation tactile CDP à 390 sur la version du tag en ligne, ou panneau intégré en mode mobile (16.11 : « Non ça c'est les sessions ou toi... »).

Précisions plus anciennes, sorties de LECONS pour la même raison :

- **L03** Base d'une reprise : l'écran de la maquette jouable, captures mesurées (D106) ; désignée vaguement : SPEC et inventaires. Constat de revue contredisant sa maquette ou une colonne refusée : refusé ou montré (L24). Cas neuf : un état de sa maquette, pas un composant neuf.
- **L13** Un contrôle ne garde que s'il tourne sur le format actuel : ceux de `portee-defauts.json` entrent dans les GATES, un mort est adapté ou caduc (D4). Rejouer chaque critère sur HEAD et sur la version voulue avant la voie ; état de banc neuf : fonction pure aussi.
- **L14** À plusieurs variétés, comparer chaque nombre de la capture à la ligne de sa variété (31.10 : EBC au menu, « ? » à côté). Critère tiré de son attente, colonne « aujourd'hui » d'un choix : testés d'abord sur la donnée et le code (27.10 : radar entier ; 02.11 : Pilsner déjà relié).
- **L17** Dossier neuf : copier `.env` et `seedData.ts`, puis `check-firebase-config.mjs` (14.11 : app cassée 10 min, `auth/invalid-api-key`).
- **L20** Un banc ne juge ni un artefact de l'ordre, ni les données de la clé (g1), ni sur une référence au plafond. Une garde se prouve sur chaque variante de lecture, pas sur le tirage (LO-1). Un chiffre de brief sort du code (09.11).
- **L24** Un retour nomme le groupe par son titre (« Créer un brassin »), pas son id : rattacher par titre avant de redemander (15.11 : e5, e8 redemandés, « j'ai déjà donné mon avis »). Statut « needs the user » : lire (list_events) avant de dire qu'une session attend (15.11 : « ??? »).
- **L28** Une pièce entre au banc vue en plein format (08.11 : 4 montages crus réels). Défaut en ligne : rejouer le banc serveur puis écran, noter le geste du testeur (LO-3).
- L01, sens inverse (16.11) : une exigence donnée pour un écran ne s'étend pas aux autres sans ses mots. Le paysage était demandé pour le calendrier seul : « Pas besoin pour le carnet... ».
- Mini maquettes en clair seul, pas de cave (16.11 : « Pas besoin des mini maquettes en cave ») ; l'app et le jouable gardent les deux thèmes.
- Le critique d'un lot juge contre TOUTES ses plaintes du chantier (lignes CAL-* de DEFAUTS, SPEC du sujet), pas contre la base du lot : le 16.11 nuit, z1, z2 et w3 gardaient la zone qu'il avait refusée deux fois (« Toujours le même problème... »). Une page qui remontre une base refusée la marque « base, défaut connu ».
- Un agent de workflow peut rendre un texte vide (critique du carnet et des ports, nuit du 16.11) : la passe suivante corrige alors à l'aveugle. Chaque appel de critique se relance une fois s'il rend vide, et une correction sans liste ne conclut jamais « prêt ».
- 17.11 : après son tri, la passe suivante est en **mode greffe** (workflow maquettes, args.sources) : inventaire des meilleurs écrans et idées de ses retenues, puis des versions qui les combinent sur tout le parcours ; jamais un axe par version reparti de la base (« répartir de 0 pour chaque vue est pas une bonne idée »).
- 17.11 : chaque version d’un lot montre le **parcours complet** ; un axe par version laisse des écrans à 5 versions sur 12 (« Elles sont où les autres version ? »). Pages de choix rangées par écran, top 3 par écran ; la passe suivante part de ses n° 1 (TOP3.md).
- 17.11 : trois lots arrêtés dans la journée à chaque nouvelle parole (« On a pas perdu plein de travail ??? »). Un lot en vol ne s’arrête pas pour une parole qui précise : elle entre dans la passe de correction ou la passe suivante ; ses versions finies sont gardées et montrées à côté.
- L18 (16.11) : statique ne veut pas dire sans critique ni pressé ; la base reste son choix inscrit, jamais la dernière itération (« ce qui a été choisi … a été enlevé »). Explorer en mini maquettes statiques nombreuses ; le jouable après son choix ([[fil-de-fer-d-abord]]).
- 19.11 : les chiffres « exemple » d'une maquette viennent de sa capture réelle et du moteur, jamais d'un inventaire précédent (r2 : FG 1,018 pour OG 1,026, sa capture dit 1,006).
