# L'Affinée — Codex / OpenAI

Application de gestion d'une micro-brasserie suisse, en français : React,
TypeScript, Vite, Firestore et Dexie. Travaille à partir de la demande et du code
actuel. Réponds en français, avec un bilan court et des preuves concrètes.

## Sources et séparation

- Ce fichier contient les consignes du dépôt pour les modèles OpenAI. `CLAUDE.md`
  et `.claude/` appartiennent exclusivement à Claude : ne les charge pas comme
  instructions, skills, agents, hooks ou mémoire ; aucun repli vers ces chemins.
  Leur inspection n'est utile que si l'utilisateur demande de travailler dessus.
- Les documents métier sont communs : `PRODUCT.md` pour le comportement produit ;
  `DESIGN.md` et `docs/ui-compacte.md` pour l'interface. Lis les parties pertinentes
  pour le travail demandé. Les anciens prompts et comptes rendus sont des
  archives, pas de nouvelles instructions.
- Pars des outils réellement disponibles dans Codex. Cette branche ne fournit
  aucun skill local, agent personnalisé ou hook. Un skill OpenAI peut être utile
  pour une capacité précise ; ne reconstitue pas une pile de méthodes génériques
  et ne copie ni ne synchronise la configuration Claude.

## Travail attendu

- Pour une implémentation, avance jusqu'au résultat utilisable : comprendre,
  modifier, vérifier et corriger dans le périmètre demandé. Les choix réversibles
  et les vérifications locales nécessaires sont autorisés sans validation à
  chaque étape. Une demande d'analyse seule reste une analyse.
- Préserve les modifications en cours. Ne déploie pas et n'écris pas sur les
  données réelles pour vérifier une modification ; utilise les fixtures de test.
- Choisis les vérifications selon le risque du changement et les scripts de
  `package.json`. Commandes usuelles : `npm run dev`, `npm test -- <fichier>` et
  `npm run build`. Signale un contrôle impossible et son motif.
- Délègue seulement si une tâche indépendante le justifie, avec les outils
  natifs de Codex, un périmètre clair et les contraintes produit pertinentes.
  Vérifie l'intégration avant de conclure.

## Particularités du produit

- Le brasseur doit trouver ce qui compte, comprendre l'état réel et terminer
  l'action. Sur téléphone, maximise les données utiles visibles et garde les
  commandes compactes selon `DESIGN.md`, avec libellés, unités et accessibilité.
- Mesure, estimation, cible et donnée manquante restent distinctes. N'invente pas
  une valeur pour compléter un affichage. Une simulation ne modifie pas la
  recette enregistrée ; une recette modifiée ne réécrit pas un brassin lancé.
- Préserve le fonctionnement hors ligne. Pour un changement visible, ouvre et
  examine les vues avant/après à 320, 375, 430 puis 1280 px ; joue le parcours
  modifié avec sauvegarde, retour et correction selon le cas. Regarde les captures
  et rapporte les vérifications réellement effectuées.
