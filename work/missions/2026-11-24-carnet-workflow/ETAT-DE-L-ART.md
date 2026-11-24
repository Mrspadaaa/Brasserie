# État de l'art : suivre un problème jusqu'à sa résolution (simple, visuel, ludique)

Sources web (lecture seule, 24.11) : comparatifs Things/Todoist/Linear (asianefficiency.com, dev.to, todoist.com), MaintainX/UpKeep (getmaintainx.com, upkeep.com, Capterra), Keepa/camelcamelcamel (repricer.com, coolcuration.com, visualping.io), streaks et gamification (smashingmagazine.com 2026-02, thedecisionlab.com, yukaichou.com, revenuecat.com). Surtout des avis et des pages commerciales : indices, pas mesures. Le reste (Trello, GitHub, Notion, Apple Notes, ADR) vient de la connaissance générale, non revérifié. PRODUCT.md n'a pas de section Carnet exploitable par mots-clés ; l'existant est pris de la demande (notes, IA de rangement, articles, Comparer, Calendrier, À venir, trigger de stock).

## 1. Le problème d'école

Son besoin = un **dossier vivant** : un problème ouvre un fil qui accumule recherches, options, décision, achat, puis se ferme en restant retrouvable. Familles voisines :
- **Suivi d'incidents / tickets** (GitHub Issues, Linear) : cycle d'états, historique. Lourd pour un seul utilisateur.
- **GMAO pour petits ateliers** (MaintainX, UpKeep) : ordre de travail, photo, équipement, récurrence.
- **Journal de bord** (Apple Notes, Day One) : saisie sans friction, pas d'état.
- **Listes de tâches** (Things, Todoist) : fermer, reporter, « un jour ».
- **Liste d'achats avec veille** (Keepa, alertes de retour en stock) : trigger prix/stock.
- **Base de connaissances « pourquoi j'ai choisi ça »** (Notion ; ADR en génie logiciel : contexte, options, décision, conséquences).

Problème type réel : **ticket + journal de décision + veille**, fusionnés. Son workflow n'est pas linéaire (humidificateur écarté, re-voulu, puis non) : le fil doit tolérer les retours en arrière et garder les options mortes.

## 2. Outils et motifs examinés (11)

1. **Things 3** : vues Aujourd'hui / Prévu / Un jour ; structure opiniâtre, soignée, rapide ; pousse à trier plutôt qu'à entasser. Lourd : rien, mais Apple seul. Reprendre : « Un jour » (idée sans date) et la sobriété.
2. **Todoist** : saisie en langage naturel (« demain 9 h »), multiplateforme. Fonctionnel mais « ne fait pas sourire ». Reprendre : saisie rapide en une phrase.
3. **Linear** : vitesse perçue, peu de statuts (backlog, en cours, fini). Lourd : pensé équipe (sprints, assignés). Reprendre : peu de statuts, instantanéité, aucun champ obligatoire.
4. **GitHub Issues** : fil chronologique de commentaires, liens entre tickets, fermeture avec cause. Lourd : labels, jalons. Reprendre : fermer **par** un événement lié, fil horodaté.
5. **Trello** : colonnes, cartes glissées au doigt, image de couverture. Visuel et tactile ; lourd quand les listes s'allongent. Reprendre : tout voir d'un coup d'œil, glisser pour changer d'état.
6. **Notion** : bases liées, vues multiples. Puissant mais il faut construire son système (abandon fréquent). Reprendre : une même fiche en liste et en tableau ; pas la page blanche.
7. **Apple Notes** : zéro friction, photo, scan, dictée. Aucun état ni rappel. Reprendre : écrire en un geste.
8. **MaintainX / UpKeep** (GMAO) : demande par photo ou voix, hors ligne, chat par ordre de travail, pièces et coûts, récurrence (affirmations de vendeurs, à pondérer). Lourd : équipements, procédures, plans payants. Reprendre : « photo + une phrase = ticket », coûts rattachés au problème.
9. **Keepa / camelcamelcamel** : prix cible, alerte de retour en stock par push/mail (confirmé pour Keepa, non vérifié pour camelcamelcamel), courbe d'historique. Reprendre : seuil de prix + « me prévenir si de nouveau dispo » sur une option même hors stock. Piège : alertes en rafale.
10. **Habitica / Duolingo** : séries, récompense immédiate, personnage. Fonctionne par aversion à la perte ; une série qui casse décourage durablement ; trop de gamification éteint le plaisir de l'activité (« streak creep »). Reprendre : retour visuel gratifiant à la fermeture, série indulgente (jours de grâce) ; pas de punition.
11. **ADR (Architecture Decision Records)** : fiche courte contexte / options / choix / pourquoi. Reprendre pour « pourquoi j'ai pris ça ».

## 3. Cycles de vie et états minimaux

Cycle décrit : problème → recherche → options → choix → achat → résolu → retrouvable.

États minimaux proposés (5) : **Noté** (constat seul, peut y rester) · **En recherche** (pistes et options attachées) · **Décidé / à acheter** (un choix, éventuellement daté « fin du mois ») · **Fait** (acheté / réparé) · **Résolu** (clos, avec cause de fermeture). « Retrouvable » n'est pas un état mais une propriété : tout fil clos reste classé et cherchable.

Règles : transitions libres dans les deux sens (rouvrir sans cérémonie) ; « Noté » est une fin valable (débit de transfert, fenêtre) ; chaque option a son mini-état (candidate, surveillée, écartée, choisie) ; fermer par un achat lié ferme les options restantes avec leur raison (« humidificateur : finalement non »).

## 4. Usages réels (15)

Les siens : (1) trop de vapeur au brassage, steam condenser ; (2) inspection électrique, fusible, matériel adapté ; (3) fuite d'écoulement : contacts, plans, devis, estimation ; (4) débit de transfert insuffisant (note seule) ; (5) moisissure dans un coin ; (6) fenêtre qui ferme mal.

Autres plausibles (hypothèses à valider avec lui) : (7) température de fermentation qui dérive (glycol, sonde) ; (8) condensation et sol glissant ; (9) tuyau ou raccord qui goutte, joint à changer ; (10) CO2 : régulateur, détecteur, bouteille en fin ; (11) pompe qui cavite ou perd du débit ; (12) nettoyage/désinfection : produit, procédure ; (13) contrôle sanitaire, registres, autorisations ; (14) nuisibles, mouches ; (15) évacuation des drêches.

## 5. Ce qui fait utiliser un outil à quelqu'un qui « ne note rien »

- **Friction de saisie nulle** : une action, un champ. Voix et photo d'abord (Apple Notes, MaintainX). Le titre peut venir après, proposé par l'IA.
- **Aucune organisation exigée** : l'outil range (le Carnet a déjà l'IA de rangement), l'utilisateur ne choisit pas de dossier en saisissant.
- **Rappel au bon moment, pas en rafale** : lié au contexte (prochain brassin, fin du mois) ; un rappel sans action possible se coupe.
- **Récompense à la fermeture** : petite animation, compteur « problèmes résolus », avant/après en photo ; indulgente, jamais culpabilisante.
- **Vue d'ensemble** : un coup d'œil dit « 2 en recherche, 1 à acheter fin du mois, 1 trigger actif » (Trello, Things).
- **Valeur immédiate** : rendre vite quelque chose d'utile (option comparée, alerte de stock), pas seulement du rangement.
- **Pardon** : retour en arrière sans pénalité, séries avec jours de grâce.

Ses mots : « si c'est pas facile, visuel, fun, ça résout pas la problématique ». Les sources vont dans ce sens, mais sans mesure sérieuse sur ce public.

## 6. Cinq recommandations pour le Carnet

1. **Un fil « problème » bâti sur les notes existantes** : une note devient un fil en recevant un des 5 états ; « Noté » reste le défaut, rien d'obligatoire. Capture en un geste (photo, voix, une phrase) ; l'IA de rangement propose titre, catégorie et sous-catégorie, sans jamais bloquer.
2. **Options en cartes, branchées sur Articles et Comparer** : chaque piste (steam condenser, humidificateur) est un article avec son mini-état (candidate / surveillée / écartée / choisie) et son raisonnement gardé ; Comparer sert de « pourquoi j'ai choisi ça ».
3. **Trigger de stock et de prix sur toute option, même hors stock** (comme Keepa) : « me prévenir » et « à acheter fin du mois » qui apparaît dans À venir et au Calendrier à la date voulue. Alertes regroupées, pas en rafale.
4. **Fermeture par événement** : l'achat de l'option choisie résout le fil et ferme les autres options avec leur raison (modèle GitHub). Le fil clos reste retrouvable par catégorie et par recherche, et rouvrable.
5. **Ludique léger, vue d'ensemble d'abord** : rangées ou colonnes (Noté / En recherche / À acheter / Résolu) à la Trello/Things, glisser pour changer d'état, petite animation et compteur à la résolution, avant/après photo ; indulgence, pas de série punitive. Éviter le Habitica complet (risque de « streak creep »).

Choix de goût (vue d'ensemble, ton ludique) : à montrer en mini maquettes au brasseur (règle n° 1), pas à trancher ici.
