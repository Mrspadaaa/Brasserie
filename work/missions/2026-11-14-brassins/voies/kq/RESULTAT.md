OK — 48 problèmes, 12 bloquants : les cinq ports (gfc, e6a, e6c, e3gb, e9na) à CORRIGER

- **gfc** (fiche fermentation, q1) — REJET : 13 problèmes, 5 bloquants : carnet · stock · dossier hors de la barre du × ; tâches sans case ;
  « Ajouté auj. » de Citra déstocke aussi Mosaic ; feuille rouge de confirmation au lieu du toast Annuler ; °C cuve remplacé par °C au relevé
  (règle n° 1, D105). Phrase prédite : « J'ai coché Citra, pourquoi Mosaic est sorti du stock ? » Relance : q1 corrige les 5 [B] (VERDICT.md).
- **e6a** (liste des brassins, q2) — REJET : 9 problèmes, 1 bloquant : période « Toutes » et deux réglages au lieu de « Nov. + en cours ».
  Phrase prédite : « C'est presque ça, mais où est mon Nov. + en cours ? » Relance : q2, avec la décision de période du pilote.
- **e6c** (feuille Filtrer, q2) — REJET : 10 problèmes, 1 bloquant : Alcool « 3 sans valeur » sans le point provisoire de la NEIPA
  (la fiche dit 5,9 %). Phrase prédite : « La NEIPA a un alcool sur sa fiche, pas dans le filtre ? » Relance : q2.
- **e3gb** (Carnet et Dossier, q3) — REJET : 8 problèmes, 2 bloquants : pictos de familles absents du dry hop ; après « Accepter les 5 »,
  « Accepter les 0 » grisé au lieu de « 5 rangés · 1 envoyé à la Stout · Annuler ». Phrase prédite : « Et mon Annuler ? » Relance : q3.
- **e9na** (Atelier, q4) — REJET : 8 problèmes, 3 bloquants : le rangement n'est plus l'IA ; styles absents ; fiche d'idée réduite
  (degré, arômes, pour, notes liées). Phrase prédite : « Ce n'est plus le carnet que l'IA range. » Relance : q4 ; la tâche IA demande
  son accord (déploiement des fonctions).

Critère : G1 `VERDICT OK` (tests.txt). Captures non ouvertes listées par section (budget de contexte).

DEMANDE EXECUTANT :
1. Refaire `voies/q4/captures/e9na-repos-app-390-clair.png` : elle montre la liste des Brassins vide, pas l'Atelier (rejouer `node voies/q4/banc.mjs`, ouvrir la PNG, attendre « Noter en vrac » en tête).
2. Captures à ouvrir par le pilote ou un critique neuf, non regardées ici : q1 1280 (geste-confirmation, mesurer, taper, erreur, après relevé) ; q2 e6a/e6c 1280 cave ; q3 cave et dossier 1280 ; q4 états listés en fin de section e9na.

LEÇON PROPOSÉE : un port qui dit « ACCORD » sur un élément de sa maquette (tâches sans case, styles, IA locale) l'a retiré sans son
accord : chaque ACCORD de port qui touche un élément visible de la maquette choisie passe en DÉCISION À PRENDRE, jamais en écart accepté.
