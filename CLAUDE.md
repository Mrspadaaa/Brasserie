# Consignes pour Claude — L'Affinée

## Utilisation automatique des skills

- Avant de commencer une tâche, examine les descriptions des skills disponibles dans la session, les plugins et `.claude/skills/`.
- Lorsqu'un skill correspond à la demande, invoque-le avec l'outil `Skill` avant d'exécuter les étapes concernées.
- Si `Skill` ne connaît pas un skill local pourtant présent, lis directement `.claude/skills/<nom>/SKILL.md` et applique ses instructions et les arguments demandés, une seule fois. Indique brièvement ce chargement depuis le disque ; ne répète pas les appels refusés et ne prétends pas que le catalogue a été actualisé. Résous les références depuis le dossier du skill.
- N'attends pas que l'utilisateur mentionne son nom ou tape une commande `/skill`. Une demande explicite de skill doit aussi être prise en compte.
- Lis et applique ses instructions pendant toute la tâche, ainsi que les références nécessaires aux étapes effectuées.
- Si la tâche évolue, vérifie si d'autres skills deviennent pertinents.
- Indique brièvement quels skills tu utilises et pourquoi, avant leur première utilisation.
- Si aucun skill ne correspond, poursuis normalement. Si un skill pertinent est indisponible, signale-le brièvement et utilise les capacités disponibles.
- Sélectionne les skills selon leur description et leur utilité réelle. Consulte d'abord les descriptions, puis charge les instructions des skills retenus ; évite les chargements et audits redondants.
- Les instructions explicites de l'utilisateur priment sur les recommandations des skills. Leur sélection automatique ne nécessite pas de confirmation supplémentaire.

## Tokens : Caveman lite et RTK

- Au début de la session, invoque le skill local `caveman` avec l'argument `lite` via l'outil `Skill`, une seule fois. Respecte ensuite une demande de changement de mode ou d'arrêt.
- Caveman s'applique aux messages de conversation : français clair, phrases complètes, explications courtes. Préserve les incertitudes utiles, les négations, les nombres et les erreurs exactes. Les annonces de skills restent brèves.
- Le code, les textes de l'application, les commentaires, la documentation et les messages de commit gardent leur qualité habituelle. Les tests, les vérifications visuelles et la profondeur d'analyse restent adaptés au problème.
- Garde `impeccable` pour les tâches frontend. Charge un skill principal, puis les compléments nécessaires à la tâche ; évite les références déjà lues, les audits répétés et les délégations redondantes.
- Utilise le skill local `code-simplifier` pour une demande de simplification et une passe ciblée après un ensemble cohérent de modifications de code. Préserve le comportement, la lisibilité et la qualité du frontend ; moins de lignes n'est pas un objectif en soi. Applique-le avec le modèle courant, sans imposer Opus ni lancer un agent supplémentaire. Une seule passe utile suffit.
- Utilise RTK pour les sorties verbeuses de Git et des tests, par exemple `rtk git status`, `rtk git log -5` et `rtk test npm test -- --maxWorkers=2 <fichiers-cibles>`. Sous Windows, utilise `npm.cmd` si nécessaire.
- Préserve la commande de test du projet, ses contrôles préalables, ses arguments et son code de sortie. Si RTK ne gère pas correctement une commande, utilise directement la commande d'origine.
- Lis le code et les différences utiles sans compression avant de décider d'une modification. Consulte le journal complet ou relance sans RTK si un diagnostic manque ou semble ambigu. Un résumé vide ne prouve pas une réussite.
- RTK est installé sur cette machine via WinGet. Une session ouverte avant son installation peut nécessiter un redémarrage pour retrouver `rtk` dans le PATH.
- Sur cette machine, si `rtk` est absent du PATH, utilise directement `C:/Users/mrspa/AppData/Local/Microsoft/WinGet/Packages/rtk-ai.rtk_Microsoft.Winget.Source_8wekyb3d8bbwe/rtk.exe` après avoir vérifié son existence, sans refaire une recherche ni une installation. Sous PowerShell, invoque ce chemin avec `&` ; sous Bash, mets-le entre guillemets.

## Tâches de fond : Unlazy

- Utilise automatiquement `unlazy` depuis `.claude/skills/unlazy/SKILL.md` pour une tâche longue, plusieurs résultats à livrer, un audit approfondi ou une reprise de travail incomplet. Charge-le avant l'implémentation ; une retouche triviale ne nécessite pas de registre de critères.
- Choisis le mode solo et des vérifications séquentielles quand la tâche s'y prête. Décompose et délègue seulement lorsque cela aide à terminer le travail ; conserve les consignes d'économie de cette configuration Claude.
- Écris les critères de réussite, vérifie les résultats et signale les critères non satisfaits. Conserve `impeccable` et les contrôles frontend pertinents : Unlazy complète les skills métier.

## Frontend : sélection systématique selon la tâche

Pour une création, modification ou revue d'interface, sélectionne les skills pertinents avant de concevoir ou de modifier l'écran, même si la demande ne contient pas les mots « design » ou « frontend ».

| Travail concerné | Skills à utiliser lorsqu'ils correspondent |
| --- | --- |
| UX, hiérarchie visuelle, formulaires, navigation, responsive, finition | `impeccable` ; `frontend-design` si disponible et complémentaire |
| Composants React/TypeScript, interactions, architecture ou performances frontend | `senior-frontend` |
| Couleurs, typographie, espacements, tokens et cohérence des composants | `ui-design-system` |
| Accessibilité, contrastes, clavier, focus, libellés ou cibles tactiles | `a11y-audit` |
| Interface Apple ou audit explicitement lié aux HIG | `apple-hig-expert` |

Cette liste complète les descriptions des skills et doit évoluer avec les skills installés. Une tâche exclusivement backend ou Git ne déclenche pas les skills frontend.

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
