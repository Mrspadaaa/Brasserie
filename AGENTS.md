# L'Affinée — règles communes Codex / OpenAI

Application de micro-brasserie suisse, en français : React, TypeScript, Vite,
Firestore et Dexie. Partir de la demande et du code courant. Répondre en français,
avec un bilan court, des preuves concrètes et les limites encore ouvertes.

## Charger le bon contexte

- Ce fichier est l'entrée commune automatique. Les rôles ont une source unique :
  `.agents/roles/sol.md`, `astra.md` et `luna.md`. Leur texte est injecté par les
  profils/définitions natifs générés ; ne pas charger tous les rôles. Le mandat
  et le lancement déterminent le rôle, pas le seul nom du modèle.
- Dans une tâche principale sans rôle injecté, lire `.agents/roles/sol.md` pour
  le pilotage. Une consultation externe explicitement confiée lit `astra.md` ;
  une sous-tâche délimitée lit `luna.md`. Un autre rôle natif explicite conserve
  son mandat. Ce routage ne transforme pas une analyse demandée en réalisation.
- `CLAUDE.md` et `.claude/` appartiennent exclusivement à Claude. Aucun chargement
  comme instructions, skills, agents, hooks ou mémoire OpenAI, aucun repli vers
  ces chemins. Les inspecter seulement si l'utilisateur demande de travailler
  dessus. Partager missions, documents métier et preuves, pas les préprompts privés.
- Lire la mission demandée et l'état de reprise utile. « Lis ton .md » désigne
  ces consignes et `docs/openai-setup.md`, sans activer ses exemples de mission.
  Les anciens prompts et comptes rendus sont des archives, pas de nouvelles demandes.
- Les références métier communes sont `PRODUCT.md`, `DESIGN.md` et
  `docs/ui-compacte.md` : lire leurs sections pertinentes.
- Charger les skills qui servent le travail : `unlazy` pour une réalisation/audit
  substantiel, `caveman-lite` pour les bilans, `brasserie-frontend` pour l'UI,
  `conception-generique` pour une règle/parcours guidé par des exemples.
  `claude-expert` prépare un transfert à Claude ; ce n'est pas une consultation
  supplémentaire obligatoire. Partir des outils réellement disponibles.

## Travail, preuves et continuité

- Une réalisation va jusqu'au résultat utilisable, vérifié et corrigé dans le
  périmètre demandé. Une analyse seule reste une analyse. Le chargement d'un skill
  n'étend pas le mandat ; une preuve hors périmètre est signalée au responsable.
- Préserver les modifications concurrentes et attribuer les fichiers avant de
  déléguer. Ne pas déployer ni écrire sur les données réelles pour tester ; employer
  les fixtures. Une opération réversible nécessaire au mandat ne requiert pas
  une validation à chaque étape.
- Choisir les contrôles selon le risque et `package.json` : `npm run dev`,
  `npm test -- <fichier>`, `npm run build`. Un test doit pouvoir refuser le défaut
  initial. Signaler un contrôle impossible et son motif ; ne pas masquer un échec.
- À la reprise ou après compaction/changement de périmètre, relire consignes et
  état utile, vérifier diff et agents avant d'agir. Sol tient le registre propre
  à la mission ; les délégués lui rendent preuves et limites. Pas de dossier global
  de suivi partagé entre missions, ni promesse de hook avant toute compaction.
- Distinguer configuration écrite, lancement confirmé et paramètres effectivement
  observables. Conserver identifiants et références de travail ; les journaux
  existants suffisent souvent, sans tour modèle de diagnostic. Les commandes,
  canaux de reprise et limites du runtime sont dans `docs/openai-setup.md`.
- Utiliser outils locaux/CLI, documentation officielle, navigateur et mesures
  selon la question. Rechercher plus largement seulement si cela peut changer
  la décision. Grouper les lectures indépendantes, conserver les gros journaux
  en artefacts et réutiliser les preuves. Aucun nombre d'appels, remplissage de
  contexte ou gain de quota non mesuré ne constitue un objectif.

## Valider la demande entière

Pour un changement substantiel, consigner dans le registre existant le résultat
observable demandé, les contrats à préserver, les choix remplaçables et le motif
de refus. Déduire cela des décisions acquises, sans nouvelle confirmation imposée.
Choisir retouche, restructuration ou remplacement selon ce résultat ; ni réemploi
de composants ni réécriture ne constitue à lui seul une réussite.

Éprouver une tranche complète dans le vrai parcours avant de généraliser. À la
revue, présenter demande, feedbacks, critères et artefacts avant le récit de l'auteur.
Un avis « retenu » reste à vérifier. Comparer aux références validées, expliquer
les écarts et conserver les réserves jusqu'à correction prouvée ou arbitrage
explicite. Tests verts, captures nombreuses et maquette seule ne prouvent pas
la satisfaction de tout le besoin. Pas de monitoring ou d'expert systématique
pour une retouche ; contrôle proportionné et relecteurs prévus aux jalons utiles.

## Généraliser sans suradapter aux exemples

Distinguer exigences, illustrations et fixtures. Un exemple n'autorise ni option
produit ni règle dédiée à son nom. Charger `conception-generique` quand ce risque
existe : propriétés, invariants, exceptions justifiées, domaine de validité et
preuves discriminantes. Les retouches mécaniques ne déclenchent pas cet examen.
Une demande large concerne tous les blocs/états concernés, pas les seuls exemples.

## Contrats produit

- Penser comme un brasseur avec les exigences UX/UI et d'ingénierie du projet.
  Préserver informations utiles, valeurs, unités, sources et capacités. Rechercher
  les représentations/interactions qui aident à comprendre et agir au-delà du texte.
- En refonte, aucune position n'est acquise. Examiner utilité, moment, place,
  visibilité et geste ; réduire les tailles ou tout masquer n'est pas un objectif.
- Distinguer mesure, estimation, cible et donnée manquante. Ne pas inventer de
  valeur pour compléter un écran. Simulation ≠ recette enregistrée ; modifier
  une recette ne réécrit pas un brassin lancé. Préserver le hors ligne.
- Pour un changement visible, ouvrir les vues avant/après sur un mobile et un
  desktop représentatifs (390/1280 px par défaut), regarder les captures et jouer
  gestes, sauvegarde, retour et correction selon le risque. Une autre largeur
  répond à un défaut constaté. Le seul contrôle du viewport ne valide pas l'UX.
