# Références : carnet de décision mobile (f9)
Recherche web du 2026-11-16, sans donnée du brasseur. Les sources sont des pages vendeur ou des blogs : indices, pas des normes. Ce que les recherches n'ont pas documenté est dit "non vérifié".

## (a) Carnet, comparaison d'options, journal de décision

- **Linear mobile** (refonte iOS/Android, 16.10.2025 ; barre d'outils personnalisable, 22.01.2026).
  Motif : ligne d'une seule hauteur, pastille d'état colorée à gauche, lignes groupées par section d'état, état changé par une feuille modale. Une icône remplace un libellé.
  Reprendre : une pastille d'état par option (retenue, écartée, à voir) et des sections par état. Un icône d'état par ligne remplace une étiquette de texte.
  Sources : linear.app/changelog/2025-10-16-mobile-app-redesign ; linear.app/changelog/2026-01-22-customize-your-navigation-in-linear-mobile ; screensdesign.com/apps/linear-mobile (démontage tiers). Aucune source ne parle d'un journal de décision chez Linear.
- **Things 3** (sources 2018 à 2020, anciennes).
  Motif : l'espace blanc sépare les projets et les tâches ; les "headings" découpent un projet en jalons ; la liste de contrôle découpe une tâche.
  Reprendre : un titre de groupe + de l'air entre groupes plutôt que des cadres ou des cartes ; ranger le détail dans l'élément, pas sur la liste.
  Sources : macdrifter.com/2018/02/things-3-from-an-omnifocus-and-taskpaper-user.html ; ixd.prattsi.org/2020/02/design-critique-things-3-ios-app.
- **Are.na** (critiques Pratt 02.2025 et 02.2026 ; refonte mobile annoncée 04.2025).
  Motif : le "canal" contient des "blocs" ; structure claire, mais critique : sobre jusqu'à l'ennui, navigation floue, boutons trop petits (avis anecdotique).
  Reprendre : la structure à un niveau (un carnet = des blocs). Éviter : navigation floue, cibles petites (min 44 px).
  Sources : ixd.prattsi.org/2025/02/design-critique-are-na-ios-app ; ixd.prattsi.org/2026/02/design-critique-are-na-ios-app-2 ; buttondown.com/aredotna (04 et 06.2025).
- **Notion mobile, Apple Notes** : non vérifié. La recherche n'a rien donné de daté 2025-2026 (seulement l'aide sur la vue galerie : propriétés choisies visibles sur la carte, image de couverture). Pas de reprise fondée.

## (b) Aperçu de lien produit, suivi de prix / stock

- **Raindrop.io** (iOS 5.2.1, 11.09.2025 ; iOS 5.0 : actions rapides sur l'aperçu).
  Motif : vignette extraite automatiquement du lien ; affichage au choix carte, galerie ou liste ; actions (déplacer, étiqueter, supprimer) sur l'écran d'aperçu ; recherche simplifiée avec un bouton de filtres dédié.
  Reprendre : vignette + titre + domaine pour chaque lien ; bascule liste / cartes ; actions à un toucher depuis l'aperçu ; un seul bouton Filtres.
  Sources : help.raindrop.io/changelog/ios.md ; blog.raindrop.io/ios-ipados-app-5-0 ; help.raindrop.io/bookmarks.md.
- **Keepa** (fiche App Store, instantané 03.2026).
  Motif : courbe d'historique de prix, séries activables une à une, durée réglable du jour à tout l'historique ; alertes de baisse de prix et de disponibilité ; scan du code-barres.
  Reprendre : un graphique par produit avec séries activables ; une alerte de baisse ; un état de disponibilité lisible. Mise en page exacte : non vérifié.
  Source : apps.apple.com/us/app/-/id1518541385.
- **Google Shopping** (articles 2024-2025, mise en page non décrite).
  Motif : verdict en un mot sur le prix (bas / typique / élevé) au-dessus de l'historique ; liste de vendeurs avec leur prix ; bouton "suivre le prix" qui alerte à la baisse ; produits suivis rangés sous "Enregistrements".
  Reprendre : un verdict en un mot avant la courbe ; la liste d'offres triée par prix.
  Sources : wordtracker.com/blog/ppc/pricing-and-promotions-highlighted-in-googles-new-shopping-features ; androidcentral.com/googles-new-shopping-updates-will-help-you-find-best-deals.
- **CamelCamelCamel, Honey** : non vérifié (aucune source trouvée dans cette passe).

## (c) Tableaux de comparaison sur téléphone

- Règle de choix, recoupée par plusieurs blogs : défilement horizontal avec première colonne figée pour des données denses à comparer ; cartes empilées pour des fiches lues une à une ; ou masquer les colonnes secondaires avec un moyen de les ouvrir.
  Sources : developer.chrome.com/docs/modern-web-guidance/guides/ui-atoms/responsive-table ; uxdesign.cc/how-to-design-data-tables-for-phones-7ed6b04da10 ; foolproof.co.uk/journal/making-product-comparison-work-on-mobile.
- Pièges notés : une colonne figée se perd s'il y a trop de lignes ; les cartes empilées détruisent la comparaison côte à côte ; la sémantique de tableau se perd pour un lecteur d'écran. Un seul élément figé par écran.
- Recette citée : remonter d'abord les lignes qui décident, replier les lignes identiques, garder l'action proche, et proposer un sélecteur à deux options pour comparer deux à deux.
  Source : poper.ai/blog/comparison-table-design-examples/ (vendeur, indicatif).

## À reprendre en priorité (synthèse)

1. Ligne unique par option : pastille d'état à gauche, nom, une valeur clé à droite ; groupes par état avec de l'air entre (Linear, Things).
2. Un toucher ouvre la fiche : vignette, détail et actions (Raindrop).
3. Comparer deux options à la fois, lignes décisives en haut, lignes identiques repliées (recette c).
4. Un verdict en un mot avant tout graphique (Google Shopping).
5. Cibles d'au moins 44 px ; navigation à un seul niveau (leçon Are.na).
