# L'Affinée — Codex / OpenAI

Application de gestion d'une micro-brasserie suisse, en français : React,
TypeScript, Vite, Firestore et Dexie. Travaille à partir de la demande et du code
actuel. Réponds en français, avec un bilan court et des preuves concrètes.

## Sources et séparation

- Ce fichier contient les consignes du dépôt pour les modèles OpenAI. `CLAUDE.md`
  et `.claude/` appartiennent exclusivement à Claude : ne les charge pas comme
  instructions, skills, agents, hooks ou mémoire ; aucun repli vers ces chemins.
  Leur inspection n'est utile que si l'utilisateur demande de travailler dessus.
- `AGENTS.md` est le point d'entrée automatique. Lire en plus la mission
  explicitement demandée, pas chaque markdown du dépôt.
  « Lis ton .md » désigne ces consignes et le guide `docs/openai-setup.md` ;
  cela n'active pas une mission produit donnée en exemple dans ce guide.
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
- Au démarrage et au premier retour d'un délégué, distinguer paramètres écrits,
  lancement confirmé et valeurs effectives observées. Vérifier modèle, effort
  et fenêtre dans les métadonnées disponibles, sans générer un tour de diagnostic
  si les journaux de travail suffisent. Signaler une valeur non observable.
  Conserver mode de lancement, identifiant d'agent ou de session native et session
  de commande. Pour une session CLI active, utiliser `codex queue` avec son profil
  pour les suites ; une mise en file n'est pas encore un travail reçu ou terminé.
  Voir `docs/openai-setup.md`. Ne pas recréer un agent pour contourner un message
  non transmis ; résoudre le canal et vérifier la prise en compte.
- Pour les travaux substantiels, applique Unlazy : critères écrits avant le
  travail, responsabilités de fichiers, vérification indépendante et preuves.
  Sol pilote en Max avec son contexte complet. Caveman lite garde les bilans
  concis sans limiter le travail utile.
- Économiser le contexte sans réduire les preuves : exécuter les contrôles
  déterministes par outils, transmettre aux agents les fichiers et questions
  utiles, puis les différences lors d'une suite. Attendre les résultats via
  les outils de suivi, sans tours répétés de surveillance ni agents surveillants.
  Pour implémenter un concept validé dans une session neuve, fournir un relais
  court : référence retenue, décisions métier, fichiers, preuves et défauts
  ouverts. Ne pas relancer la conception sans contradiction nouvelle.
- Astra Max est un expert transversal : Sol le consulte par processus
  `astra-review` séparé quand l'incertitude, le coût d'une erreur ou le besoin
  de recul le justifie, même avant un échec et hors refonte. Architecture,
  données, cohérence métier/UX, diagnostic complexe, performance, comparaison
  et contre-expertise sont des motifs possibles. Pour un travail à risque,
  demander un avis au cadrage avant les choix coûteux, puis sur les risques
  restants du parcours intégré et ses preuves ; d'autres avis ciblés restent
  possibles. Ni audit global systématique ni consultation mécanique de chaque
  champ. Astra peut mener l'investigation pertinente avec ses outils en lecture
  seule et proposer solution concrète, preuves et limites. Sol garde réalisation,
  intégration, délégation et décision ; il motive tout avis écarté.
- Pour une conception importante, une architecture nouvelle ou une ambiguïté
  métier structurante, consulter Astra dès les hypothèses, avant les maquettes
  ou les choix coûteux. Un audit technique initial ne remplit pas ce jalon
  métier/UX. Utiliser `docs/prompts/consultation-astra.md` ; les suites portent
  sur les différences et les nouvelles décisions. À chaque jalon concerné,
  tracer avis reçu, décision/correction et preuve, ou consultation encore ouverte.
  La fréquence suit les décisions utiles, pas un quota d'appels.
- Luna Max peut posséder un livrable autonome de recherche, réalisation, test ou
  vérification quand contrats et critères sont clairs. Attribuer fichiers,
  contraintes, faits acquis et preuves attendues ; remonter les ambiguïtés
  structurantes à Sol/Astra. Éviter les doublons, réutiliser les faits vérifiés
  pour une suite liée et ne pas présenter la revue de l'auteur comme
  indépendante. La grande fenêtre de contexte est une capacité, pas une cible.
- Choisir les outils selon la question, sans liste fermée : outils locaux/CLI
  et documentation officielle pour les faits techniques, navigateur réel et
  mesures pour l'UX ou la performance, recherche externe approfondie si la
  confrontation de plusieurs sources ou hypothèses peut changer la décision.
  Arrêter la recherche quand preuves et limites permettent cette décision ;
  réutiliser les recherches datées, actualiser seulement ce qui l'exige.
  Regrouper les lectures indépendantes, garder les gros journaux en artefacts
  et remonter faits, écarts et références. Ni nombre d'appels ni gratuité
  supposée des outils ou résultats ne sont des objectifs.
- Garder l'« État de reprise » dans le registre propre à la mission : objectif
  et dernières corrections utilisateur, branche et commit de référence,
  décisions et invariants, agents actifs avec identifiants et fichiers confiés,
  terminé et prouvé versus ouvert, prochaine action et liens aux preuves.
  Actualiser aux jalons et avant une pause ou un relais prévisible, pas à chaque
  outil. Au démarrage, à la reprise, après une compaction détectée ou un
  changement de périmètre, relire les consignes applicables et cet état, vérifier
  diff et agents avant d'agir, puis poursuivre sans recherches ni agents doublons.
  Ne pas créer de fichier global partagé entre tâches ni promettre un hook avant
  toute compaction.
- À chaque jalon, rapprocher critères, contrats à risque, avis et actions, tests
  capables d'échouer et contrôle UX utile. Distinguer contrôles exécutables et
  décisions humaines ; les instructions seules ne garantissent pas l'absence
  de dérive. Rejouer une vérification pour un changement, un échec ou un doute
  concret. Ne pas promettre de baisse chiffrée du quota sans mesure fiable.
- Sol peut lancer jusqu'à 9 Luna utiles. Le défaut du PC et le profil natif
  `sol-full` lui donnent la fenêtre complète ; ses enfants de rôle `luna` en
  héritent. Pour consulter Astra avec environ 258400 tokens utiles, lancer
  `codex exec --profile astra-review` dans un processus distinct : les rôles
  directs héritent de la fenêtre du parent dans ce runtime. Voir
  `docs/openai-setup.md` pour les réglages et les preuves. Un seul Claude
  participe ; il peut demander jusqu'à 9 Luna via le relais natif Codex.
  Adapter les vagues aux places disponibles sans viser le plafond.

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
