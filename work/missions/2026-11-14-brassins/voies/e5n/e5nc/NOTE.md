# e5nc — tiède
Chaleur : tiède
Idée : une question par écran.

Plein écran, trois questions (Bière, Quand, Volume et cuve), une barre de progrès. La première montre les recettes en verres remplis à leur couleur (jetons EBC ; NEIPA trouble, Pils limpide), avec le dernier lot ; un toucher répond et passe à la suite, pas de bouton « Suivant ». Pale Ale marquée « prévue ». Geste : écran final « NEIPA planifiée », verre plein, les trois réponses touchables (NEIPA, sam. 21.11, 24 L · F3) et la carte telle qu'elle entre dans la liste.
- Diffère des 4 refusées : rien n'est demandé deux fois ni d'un coup ; trois touchers ; la couleur de la bière est le choix.
- Baseline : identité de l'app (trousse identite.css + chrome.js, IDENTITE OK) ; volume au curseur m2 (jamais type="number") ; chiffres à la virgule ; inconnu « — » ; cibles ≥ 44 px ; clair et cave ; classes et globales préfixées (L26).
- Données : BRIEF-AUTEUR § Les chiffres et DONNEES-COMMUNES seulement (24 L par recette, cuves de 30 L, pertes ≈ 2 L, LOT-020 prévu en F2, Pils en F3) ; fictifs : LOT-021 (prochain numéro), dates choisies, F3 libre une fois la Pils tirée (e4c).
- Écarts : les écrans 2 et 3 (jours, curseur et cuves) ne sont pas dessinés (repos, geste, vide demandés) ; bas de l'écran final peu rempli.
- Corrigé k6 (g6f, 15.11) : n° 1 (écrans Quand et Volume et cuve dessinés : etat=quand, volume), n° 2 (verres dans l'ordre de couleur, Pils pâle, NEIPA voilée), n° 3 (carte de e6a), n° 4 à 6.
