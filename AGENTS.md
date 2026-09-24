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
- Pars des outils réellement disponibles dans Codex. Cette branche fournit
  trois skills natifs ciblés : `unlazy`, `caveman-lite`, `brasserie-frontend`.
  Charge ceux qui correspondent au travail. Utilise les agents natifs et les
  skills OpenAI pertinents ; ne copie ni ne synchronise la configuration Claude.

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
- Pour les travaux substantiels, applique Unlazy : critères écrits avant le
  travail, responsabilités de fichiers, vérification indépendante et preuves.
  Astra pilote en Max ; Sol et Luna travaillent en Max dans leur propre contexte.
  Caveman lite garde les comptes rendus concis sans limiter le travail utile.
- Répartition effective : Astra cadre, arbitre et vérifie l'intégration ; Sol
  possède un bloc complet d'investigation, réalisation et validation ; Luna
  reçoit des recherches, tests et revues ciblés. Astra ne refait pas en parallèle
  le travail confié. Une retouche simple reste directe si déléguer coûte davantage.
- Transmettre objectif, fichiers, contraintes, faits établis et preuves attendues,
  sans recopier tout l'historique. Réutiliser l'agent pour les suites liées et
  les recherches déjà vérifiées ; ne les rouvrir qu'en cas de changement ou doute.
  La grande fenêtre de contexte est une capacité disponible, pas une cible à remplir.
- Vérifier les livrables sur leurs preuves et les risques d'intégration. Une revue
  indépendante vise un risque distinct ; ne pas répéter tout l'audit ou tous les
  tests sans changement, échec ou incertitude. Garder les sorties détaillées dans
  les artefacts et remonter résultats, écarts et décisions nécessaires.
- Astra peut lancer au plus 2 Sol et 9 Luna directs ; chaque Sol peut lancer
  jusqu'à 9 Luna. Sur le runtime actuel, lancer les processus natifs avec
  `codex exec --profile sol-full` ou `codex exec --profile luna-full` : les rôles
  seuls n'élargissent pas la fenêtre héritée d'Astra. Depuis un Sol lancé avec
  sa fenêtre complète, employer le rôle `luna` pour ses enfants. Voir
  `docs/openai-setup.md` pour les réglages et les preuves. Un seul Claude participe ; il peut demander jusqu'à
  9 Luna via le relais natif Codex. Adapter les vagues aux places disponibles.

## Particularités du produit

- Le brasseur doit trouver ce qui compte, comprendre l'état réel et terminer
  l'action. Sur téléphone, maximise les données utiles visibles et garde les
  commandes compactes selon `DESIGN.md`, avec libellés, unités et accessibilité.
- Recherche activement des « boosters UX/UI » au-delà du texte. Le choix des
  représentations et interactions reste ouvert ; valorise leur bénéfice observé
  pour comprendre et agir. Conserve les informations métier pertinentes. La
  réduction des tailles ou le masquage systématique ne sont pas des objectifs.
- Dans une refonte, aucun élément ne conserve sa place par ancienneté. Pour
  chaque donnée et commande, vérifier son utilité pour le brasseur à ce moment,
  sa place, sa visibilité immédiate ou à la demande, son contrôle et sa
  représentation. Comparer les alternatives pertinentes, y compris les outils
  externes maintenus ; une simple vérification de débordement ne valide pas l'UX.
- Mesure, estimation, cible et donnée manquante restent distinctes. N'invente pas
  une valeur pour compléter un affichage. Une simulation ne modifie pas la
  recette enregistrée ; une recette modifiée ne réécrit pas un brassin lancé.
- Préserve le fonctionnement hors ligne. Pour un changement visible, ouvre et
  examine les vues avant/après sur un mobile et un desktop représentatifs
  (par défaut 390 et 1280 px) ; une autre largeur répond à un défaut constaté,
  pas à une matrice systématique. Joue le parcours
  modifié avec sauvegarde, retour et correction selon le cas. Regarde les captures
  et rapporte les vérifications réellement effectuées.
