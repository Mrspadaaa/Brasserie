# Levures : vérification du parcours complet

Passe du 12 septembre 2026, après la [recherche et l’implémentation métier](yeast-recipe-implementation.md). Les choix suivent PRODUCT.md, DESIGN.md et le guide des outils UI : densité utile sur téléphone, valeurs et unités lisibles, détails secondaires à la demande. Skills appliqués : Unlazy, Impeccable, senior-frontend, ui-design-system, a11y-audit, React best practices et frontend-testing-debugging.

| Besoin du brasseur | Mise en œuvre dans l’écran | Bénéfice constaté |
|---|---|---|
| Ajuster une souche déjà choisie | Objectif segmenté, curseur de température avec saisie précise, plage fabricant et comparaison de DF | À 320 px, les réglages et les actions d’application restent visibles dans la même hauteur d’écran. Le comparatif des laboratoires s’ouvre à la demande. |
| Comprendre sans lire toute la documentation | Effet attendu visible ; pression, explications, calcul cellulaire, contacts et sources dans des panneaux repliables | Les conséquences utiles restent proches du réglage. Les données manquantes et erreurs restent visibles. |
| Relire une recette | Objectif, souche, dose et consigne dans le résumé fermé ; programme de température dans le panneau Levure | Une seule section rassemble la conduite. Elle distingue l’intention adoptée des réglages actuels après modification. |
| Vérifier une recette importée | Aperçu avec objectif, pression et contacts à cru repliables avant reprise | Le brasseur peut vérifier les nouveaux réglages avant de les enregistrer. Une quantité absente reste « à préciser ». |
| Exécuter le brassin | Consignes adaptées à la préparation, l’empâtage et l’ensemencement ; trois lectures avec actions « Relever » | Le guide lit la recette figée du brassin. La température, la densité et le volume mesurés restent distincts des consignes prévues. |

La revue a corrigé deux incohérences métier : le dosage sec du catalogue ne s’applique plus à une forme liquide, à un levain ou à une forme inconnue ; la pression prévue reste cohérente lorsque la souche est reconnue par son nom. Un ensemencement déjà consigné ne propose pas un nouvel ajout. Le retour de température nomme explicitement l’« écart » à la cible.

Le contrôle du texte agrandi a également conduit à empiler les libellés et effets quand deux colonnes deviennent trop étroites. Le comparatif de souches conserve le nom, le laboratoire, la description et la plage sur des lignes successives.

## Échanges et IA

L’export natif dans le presse-papier et le téléchargement réel de `recette-laffinee.txt` ont été exécutés dans Chrome. Le fichier UTF-8 et le presse-papier contiennent le même texte, après normalisation des fins de ligne Windows. Ce texte a été repris dans une autre recette, puis enregistré : souche, forme, quantité, objectif, pression zéro, repos férulique, garde et phase/durée/température des ajouts à cru sont conservés.

Le lecteur reconnaît le format de L’Affinée avant de tenter une lecture libre. Une copie complète endommagée est refusée avec une erreur visible. Les données partielles restent inconnues, sans ajout automatique d’un sachet. Les textes non structurés restent consultables dans les notes ; une alternative citée dans une recette ne devient pas une équivalence scientifique.

Un adaptateur partagé fournit à l’IA le style, l’objectif adopté, les consignes actuelles, les inconnues, les paliers et les contacts réels des houblons. Il alimente la revue de recette, le contexte serveur, l’outil de fermentation et le diagnostic du brassin. Les tests vérifient notamment les demandes incompatibles avec le style, les alternatives limitées au style, les réglages périmés et la distinction entre une DI fournie explicitement et celle de la recette. La transmission est vérifiée ; aucune réponse d’un modèle distant n’a été sollicitée.

## Vérification effectuée

- Application React réellement compilée et ouverte dans Chrome, avec stockage, authentification et appels distants remplacés par les adaptateurs locaux du dépôt. Aucune écriture dans un compte réel.
- Téléphone à **375, 320 et 430 px**, puis ordinateur à **1280 px** : création, comparaison Wyeast/White Labs, proposition girofle, température, pression, repos, navigation vers Houblons/Paliers, sauvegarde, réouverture et variante locale sans modification de la recette enregistrée.
- Aux quatre largeurs : copie native, aperçu d’import, reprise, sauvegarde, ouverture du brassin figé, repos férulique, ensemencement, saisie invalide puis corrigée d’une mesure, retour au guide et consultation des contacts à cru. Ce parcours a révélé un écran blanc lorsque les cibles DF/alcool étaient nulles ; le correctif du catalogue commun a été intégré et le parcours rejoué avec succès.
- États complémentaires : style inconnu, filtre vide, DI/programme manquants, dose hors plage puis corrigée, phase de houblonnage inconnue puis précisée ; incohérence de forme revue à 375 et 1280 px. Clavier, focus, ouverture/fermeture des panneaux et texte racine agrandi à 200 % contrôlés.
- Captures avant et après ouvertes et examinées. Les parcours finaux ne signalent aucune erreur JavaScript, aucun débordement de page ni commande de l’atelier hors écran.
- Tests ciblés réussis : atelier, overview, guide du brassin, mesures existantes, échanges UI et format texte, adaptateur IA et contexte/outil serveur. Les deux feuilles indépendantes ont été relues et leurs tests relancés par le pilote.
- Builds application et serveur réussis. Les avertissements existants sur les gros bundles restent présents. La simulation de téléphone ne remplace pas un essai sur appareil physique avec lecteur d’écran.

Captures : [éditeur compact](yeast-recipe-evidence/frontend-editeur-320.png), [overview](yeast-recipe-evidence/frontend-overview-1280.png), [import](yeast-recipe-evidence/frontend-import-375.png), [aide à l’ensemencement](yeast-recipe-evidence/frontend-brassage-320.png), [relevé de température](yeast-recipe-evidence/frontend-mesure-375.png), [contacts à cru](yeast-recipe-evidence/frontend-contacts-1280.png), [forme à confirmer](yeast-recipe-evidence/frontend-forme-375.png), [texte agrandi](yeast-recipe-evidence/frontend-zoom-320.png).

Reproduction : `node scripts/check-yeast-recipe-ui.mjs` pour l’atelier et l’overview ; `node scripts/check-yeast-workflow-ui.mjs` pour les échanges et le brassin. Ces scripts utilisent Puppeteer déjà installé et Chrome Windows, bloquent les requêtes HTTP externes et ferment leur navigateur/serveur. Le second écrit `transfer-brew.json` et ses captures dans le dossier temporaire `laffinee-yeast-front-flow-evidence`.

La recherche reste qualitative : aucun pourcentage d’intensité banane/girofle ni date biologique de fin de fermentation n’est inventé. Cette livraison reste dans le dépôt local, sans déploiement.
