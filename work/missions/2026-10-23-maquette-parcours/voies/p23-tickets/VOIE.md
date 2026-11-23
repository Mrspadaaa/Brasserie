# Voie p23-tickets — les tickets houblons face à l'état réel, mises à jour prêtes (rien publié)

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` en entier : décisions, pages, états de reprise)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un état des lieux, des brouillons)
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, 24.10, mot pour mot : « Vérifie aussi au le git et issues sont à jour ». Les tickets sont les issues GitHub
de `Mrspadaaa/Brasserie`. Plusieurs tickets houblons sont restés à leur état du 17 au 19.10 (par exemple #138 « Lot 6 :
choisir Comparer et Suggestions », #136, #135, #137), alors que des choix ont été faits depuis (q2b, r6a, x3b, la base
v4.10, f1, la croix…). Ton travail : **pour chaque ticket houblons ouvert, dire s'il est à jour, et préparer le
commentaire (et la fermeture proposée) qui le remettrait à jour. Tu ne publies rien** : le pilote demande l'accord du
brasseur, puis publie.

## Tickets à voir
#119, #122 à #127, #130, #131, #132, #133, #135 à #146 (`gh issue view <n> --repo Mrspadaaa/Brasserie --comments`,
lecture seule). Pour chacun, l'état réel vient du dépôt, pas des reçus :
- les choix : `work/refonte-frontend/v4/choix/ecrans.json`, `cerveau/produit/acquis-valides.md`, SPEC-BRASSEUR § 0 et § 1 ;
- les défauts et contrôles : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D105 à D125), `portee-defauts.json` ;
- les pages publiées : MISSION.md « ## Pages », `work/missions/2026-10-22-systeme-agents/ETAT.md` « Pages en vigueur » ;
- les commits : `git log --oneline -80` ;
- ce qui est encore ouvert ou à son choix : MISSION.md « Reste », registre `work/refonte-frontend/registre.md` (tête).
Rappel : fini veut dire branché dans l'app et utilisable (CLAUDE.md) ; la maquette jouable n'est pas l'app (porte B
fermée). Un ticket d'app n'est donc pas fermé parce qu'une maquette existe.

## Livrables
1. `work/refonte-frontend/tickets-2026-10-24.md` : une section par ticket : titre, dernière mise à jour, verdict (`a-jour`,
   `a-completer`, `a-fermer-propose`, `a-scinder`), ce qui a changé depuis (avec commit, page ou ligne D), et le
   brouillon du commentaire en français clair et concis (à publier tel quel), avec les liens des pages en vigueur.
   Puis les tickets qui manquent (un sujet ouvert sans ticket : par exemple D122, D123, D124, D125, les vues à revoir),
   chacun avec titre et corps proposés.
2. `RESULTAT.md` : la table (ticket, verdict, une ligne), et la liste des gestes à faire sur accord (commentaires,
   fermetures, créations).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/tickets-2026-10-24.md`
- `work/missions/2026-10-23-maquette-parcours/voies/p23-tickets/RESULTAT.md`
GitHub en lecture seule : aucun `gh issue comment`, `close`, `create` ni `edit`.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : ses choix font foi ; un écran au choix ouvert reste ouvert dans le ticket. Ses mots se citent mot pour mot.
- L11 : fini = utilisable dans l'app.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : une ligne (tickets vus, décompte par verdict, tickets à créer).
