# Voie maquettes3 — le Carnet comme suivi d'un problème jusqu'à sa résolution : simple, visuel, un peu ludique

- Agent : concepteur ; Modèle : opus ; Niveau : interface ; Plafond : 120 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes. Charge le skill `maquettes` (mode greffe depuis ses meilleurs classés) et, pour le cadrage, les heuristiques de `boosters-ux`.
- Possède : work/missions/2026-11-24-carnet-workflow/maquettes3/.

## Économie
- Mécanique : aucune.
- Gestes : réemploie l'outil de rendu de ../../2026-11-24-carnet-personas/maquettes2/ (outil.mjs, planche.mjs) ; une maquette = un fichier HTML ; captures 390 ouvertes avant verdict.

## À faire
1. CADRAGE.md (une page) : le cycle de vie retenu (états minimaux), ce qui se saisit en 1 geste (voix, photo, deux lignes), ce que l'IA fait seule (ranger, catégoriser, sous-catégoriser, rattacher, proposer la tâche suivante), ce qui reste au brasseur, et ce qui rend l'usage « ludique » sans gadget.
2. 6 versions, chacune jouée de bout en bout sur ses 3 histoires (DOSSIER) : trop de vapeur → steam condenser (veille du 2e, achat fin du mois, fermé par l'achat, retrouvable) ; inspection électrique / fusible → outils achetés ; écoulement qui fuit → trouvailles, contact, devis, résolu ; plus 2 notes courtes (débit au transfert, moisissure, fenêtre). Écrans : liste (tout ce qui est ouvert, d'un coup d'œil), un problème ouvert, sa fin « résolu » et sa relecture des mois plus tard, la saisie rapide, la vue « à faire ».
3. Page de choix page.html (comme les passes 1 et 2 : actuel à gauche, classement 1 à 5, Copier) → node scripts/agents/verifier-page.mjs page.html --page-lot --captures cap/page → PAGE OK.

## Tenue
- RESULTAT.md tenu au fil DÈS LE DÉBUT : ligne 1 « RESULTAT maquettes3 : N versions, page OK/KO ».
- Tests : sans objet (maquettes).
- Ne touche aucun fichier de src/ ; rien n'est publié (le pilote publie). Si ton contexte dépasse 250 k, écris ton état de reprise dans RESULTAT.md et rends « REPRISE : <fichier> ».
