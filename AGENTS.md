# Consignes pour Codex — L'Affinée

## Utilisation automatique des skills

- Avant de commencer une tâche, examine les descriptions des skills disponibles dans la session et les plugins.
- Consulte aussi les métadonnées `name` et `description` des `SKILL.md` présents dans `.agents/skills/` et `.claude/skills/`, lorsque ces dossiers existent. Les skills du projet peuvent ainsi servir aux deux assistants sans dupliquer leurs instructions.
- Lorsqu'un skill correspond à la demande, charge-le avant d'exécuter les étapes concernées : utilise le mécanisme fourni par l'environnement ou lis son `SKILL.md` à l'emplacement annoncé. Pour un skill local de ce dépôt, lis le fichier correspondant. Ne suppose pas l'existence de l'outil `Skill` de Claude dans Codex.
- N'attends pas que l'utilisateur mentionne son nom, tape `$skill` ou utilise une commande. Une demande explicite de skill doit aussi être prise en compte.
- Applique ses instructions pendant toute la tâche. Résous les références et scripts relatifs depuis le dossier du `SKILL.md` lu ; adapte les outils aux capacités réellement disponibles.
- Si la tâche évolue, vérifie si d'autres skills deviennent pertinents.
- Indique brièvement quels skills tu utilises et pourquoi, avant leur première utilisation.
- Si aucun skill ne correspond, poursuis normalement. Si un skill pertinent est indisponible, signale-le brièvement et utilise les capacités disponibles.
- Sélectionne les skills selon leur description et leur utilité réelle. Consulte d'abord les descriptions, puis charge les instructions des skills retenus ; évite les chargements et audits redondants.
- Les instructions explicites de l'utilisateur priment sur les recommandations des skills. Leur sélection automatique ne nécessite pas de confirmation supplémentaire.

## Tâches de fond : Unlazy sans plafond artificiel

- Utilise automatiquement `unlazy` pour une tâche longue, plusieurs résultats à livrer, un audit approfondi ou une reprise de travail incomplet. Charge `.agents/skills/unlazy/SKILL.md` avant l'implémentation ; évite de relire sa copie identique dans `.claude/skills/`.
- Pour Codex, l'utilisateur ne demande aucun plafond artificiel de tokens, de durée, de profondeur de décomposition ou de passes utiles. N'applique pas les restrictions d'économie propres à `CLAUDE.md` et ne réduis pas la qualité ou la portée du travail pour économiser des tokens.
- Dimensionne la décomposition selon les résultats à livrer. Utilise l'orchestration et des sous-agents pour les sous-tâches indépendantes lorsque cela aide à les terminer et à les vérifier ; conserve les dépendances, responsabilités et vérifications d'intégration prévues par Unlazy.
- Écris les critères de réussite avant le travail, vérifie chaque résultat avec des preuves adaptées et signale tout critère non satisfait. Un résultat abandonné ou non vérifié n'est pas terminé.
- Conserve `impeccable`, les skills métier et les vérifications frontend pertinentes. Les réponses restent claires et concises, sans réduire la profondeur du travail. Une retouche triviale ne nécessite pas de registre de critères ; les vérifications supplémentaires doivent répondre à un changement, un échec ou une incertitude réelle.

## Frontend : sélection systématique selon la tâche

Pour une création, modification ou revue d'interface, sélectionne les skills pertinents avant de concevoir ou de modifier l'écran, même si la demande ne contient pas les mots « design » ou « frontend ».

| Travail concerné | Skills à utiliser lorsqu'ils correspondent et sont disponibles |
| --- | --- |
| UX, hiérarchie visuelle, formulaires, navigation, responsive, finition | `impeccable` dans `.claude/skills/impeccable/SKILL.md` ; `frontend-design` si complémentaire |
| Composants React/TypeScript, interactions, architecture ou performances frontend | `senior-frontend` dans `.claude/skills/senior-frontend/SKILL.md` ; `react-best-practices` selon la modification |
| Couleurs, typographie, espacements, tokens et cohérence des composants | `ui-design-system` dans `.claude/skills/ui-design-system/SKILL.md` |
| Accessibilité, contrastes, clavier, focus, libellés ou cibles tactiles | `a11y-audit` dans `.claude/skills/a11y-audit/SKILL.md` |
| Vérification visuelle, responsive et interactions dans le navigateur | `frontend-testing-debugging` |
| Interface Apple ou audit explicitement lié aux HIG | `apple-hig-expert` dans `.claude/skills/apple-hig-expert/SKILL.md` |

Utilise le nom complet annoncé par le catalogue si un plugin préfixe le nom du skill. Cette liste complète les descriptions des skills et doit évoluer avec les skills installés. Une tâche exclusivement backend ou Git ne déclenche pas les skills frontend.

## Frontend : revue visuelle obligatoire

- Le code, le build et les tests automatisés ne suffisent pas à valider une interface. Pour tout changement de rendu ou d'interaction, lance l'application avec les modifications et ouvre réellement les vues concernées dans un navigateur.
- Inspecte le rendu avant modification lorsqu'il existe, puis après modification. Prends et regarde les captures des vues concernées : générer une capture sans l'examiner, lire le DOM ou relire le JSX/CSS ne constitue pas une revue visuelle.
- Vérifie d'abord le téléphone, puis une largeur ordinateur. Contrôle la hiérarchie, la densité d'information, la lisibilité, les couleurs, les espacements, les débordements, les cibles tactiles et les éléments fixes qui peuvent masquer le contenu.
- Joue les parcours modifiés avec les outils du navigateur : clics, saisie, navigation, ouverture et fermeture des panneaux, validation et correction des erreurs selon le cas. Observe les résultats et les états pertinents : contenu chargé, liste vide, chargement, erreur et formulaire rempli.
- Fais une critique UX avec `impeccable` : le brasseur comprend-il immédiatement l'écran, voit-il l'information prioritaire et termine-t-il son action simplement ? Les détails secondaires restent accessibles sans surcharger la vue. Utilise `a11y-audit` pour les contrôles d'accessibilité pertinents.
- Corrige les défauts observés, puis recontrôle les vues et interactions affectées. Dans le compte rendu, indique les écrans, formats et parcours réellement vérifiés, avec les captures utiles. Si le rendu ne peut pas être ouvert ou inspecté, explique le blocage et marque la validation visuelle comme non effectuée ; ne présente pas le frontend comme entièrement validé.

## Contexte de la brasserie

- Avant une décision produit, demande-toi : « De quoi a besoin le brasseur dans cette situation ? »
- Pour le frontend, lis `PRODUCT.md` et `DESIGN.md` et respecte les choix existants ainsi que les dernières demandes de l'utilisateur.
- Conçois d'abord pour le téléphone : informations utiles en premier, détails secondaires accessibles à la demande, actions quotidiennes rapides et compréhensibles.
- Vérifie dans le navigateur les parcours et tailles d'écran concernés, avec les outils disponibles. Signale clairement ce qui n'a pas pu être vérifié.
