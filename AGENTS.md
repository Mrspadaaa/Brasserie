# Consignes pour Codex — L'Affinée

## Priorité UI : densité utile sur mobile

- **Maximiser l'espace utile et compacter les données est la règle principale de l'interface.** Elle concerne boutons, champs, lignes, titres, en-têtes, pieds de page, navigation, marges et panneaux. Des tailles communes sont souhaitées, mais elles doivent être petites.
- Avant toute conception, modification ou revue frontend, lis [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md) et [le guide des outils UI](docs/ui-compacte.md). L'échelle de `DESIGN.md` fait autorité ; les anciennes tailles dans le code sont un état à migrer, pas une règle à défendre.
- Les prescriptions génériques des skills (44/48 px partout, texte à 14/16 px partout, grands espacements, composants pleine largeur, mobile forcément moins dense) cèdent devant cette décision explicite du projet. Adapte les règles contradictoires dans le périmètre du travail, sans redemander cette autorisation. Les recommandations Apple/Android natives ne sont pas des minima web.
- Choisis le contrôle et la représentation selon le besoin du brasseur : sélection segmentée, pastille, interrupteur, liste, édition sur place, jauge, plage, courbe, tableau ou détail repliable. Utilise les composants existants adaptés ; un bouton, un champ texte ou un paragraphe n'est pas le choix automatique. Une nouveauté doit améliorer l'action ou la lecture.
- Pour une tâche d'implémentation UI, livre ce choix dans l'écran : préciser le besoin, le contrôle utilisé, la représentation choisie et leur bénéfice constaté pendant la vérification. Une liste d'idées, un guide ou une simple réduction des tailles ne remplace pas cette mise en œuvre. Cela ne demande ni un nouveau widget sur chaque écran ni un audit hors périmètre.
- La densité conserve les valeurs et unités utiles, les libellés compréhensibles, les erreurs visibles, les contrastes, le clavier et le zoom. Une zone tactile élargie ne doit pas chevaucher une autre commande. Une action plus grande demande une raison liée à son usage précis, pas seulement « mobile » ou « cuverie ».
- **Dans chaque délégation frontend**, donne explicitement en entrée cette priorité, les trois documents et les composants pertinents. Un agent sans accès au dépôt reçoit les extraits utiles. Demande la vérification du contenu visible, de l'espace pris par les barres et du parcours complet sur téléphone.
- Une ancienne assertion de taille ou recommandation de skill n'est pas une preuve UX. Lorsqu'elle contredit la nouvelle règle, aligne le contrôle concerné sur `DESIGN.md` et conserve les vérifications de comportement et d'accessibilité pertinentes.

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
- Pour le frontend, applique la priorité UI ci-dessus et lis aussi `docs/ui-compacte.md`.
- Conçois d'abord pour le téléphone : maximum de données utiles visibles, détails secondaires à la demande, actions quotidiennes compactes et rapides.
- Vérifie dans le navigateur les parcours et tailles d'écran concernés, avec les outils disponibles. Signale clairement ce qui n'a pas pu être vérifié.
