# Brief de consultation Astra

Le rôle provient de `.agents/roles/astra.md`, injecté par `astra-review`.
Ce document fournit les entrées de la mission ; il ne redéfinit pas le rôle.
Lancement et reprise : sections utiles de `docs/openai-setup.md`.

## Socle du brief

Fournir seulement les éléments nécessaires à la décision, sans questionnaire
obligatoire ni relecture générale d'une mission déjà connue.

- Décision à éclairer maintenant et résultat observable attendu.
- Demande d'origine, dernières corrections utilisateur et contrats à préserver.
- Faits établis avec portée, sources/artefacts actuels et inconnues.
- Hypothèses, alternatives et ce qui ferait refuser le résultat.
- Depuis l'avis précédent : changements, décisions et nouvelles preuves.

## Compléments selon la question

- **Conception importante :** faits métier et options encore ouvertes, avant
  maquettes ou choix coûteux ; une proposition technique ne valide pas l'UX.
- **Frontend :** tâche du brasseur, utilité/moment des informations, geste,
  représentation, états concernés et alternatives utiles. Fournir vues actuelles
  et preuves des interactions ; une capture ne prouve pas seule un parcours.
- **Règle guidée par des exemples :** exigences versus illustrations, propriétés,
  invariants, exceptions, domaine de validité et contre-exemple hors fixtures.
- **Revue de résultat intégré :** demandes et feedbacks avant le récit de l'auteur,
  décisions retenues/écartées/ouvertes, diff/version, artefacts et contrôles qui
  peuvent refuser le défaut initial. Nommer les limites des preuves disponibles.

## Retour à consigner par Sol

Recommandation ou verdict borné, constats matériels, motifs, preuves, conditions
et limites ; vérifications hors mandat à confier au responsable. Pour chaque
constat retenu, Sol relie décision, changement et preuve actuelle dans le registre
existant. Un envoi, un avis reçu et une recommandation vérifiée restent distincts.

Ces éléments sont un dossier de mission. Les préprompts OpenAI ne sont pas une
entrée Claude ; transmettre seulement besoin, résultats et artefacts nécessaires.
