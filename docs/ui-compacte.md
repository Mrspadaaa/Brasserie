# Choisir les outils UI de L'Affinée

Ce guide est une entrée obligatoire pour les tâches frontend, y compris les
sous-agents. Il complète [PRODUCT.md](../PRODUCT.md) et [DESIGN.md](../DESIGN.md).
La priorité est de maximiser les données utiles visibles sur téléphone et de
raccourcir les gestes, en gardant une interface claire. Les dimensions sont
définies dans DESIGN ; ce guide explique quel outil employer et pourquoi.

## Choisir avant de dessiner

Pour chaque donnée, décider si le brasseur doit **lire, comparer, choisir,
ajuster, suivre ou déclencher une action**. Choisir ensuite la représentation
et le contrôle qui demandent le moins d'espace, de saisie et de gestes pour
ce besoin. Un bouton classique, un champ texte et un paragraphe ne sont pas
des réponses automatiques.

Il faut employer les outils appropriés, pas simplement les citer dans un plan.
À la revue d'un écran, remplacer les contrôles ou affichages mal adaptés dans
le périmètre de la tâche. Ne pas multiplier les nouveautés : le vocabulaire
reste cohérent d'un écran à l'autre et l'état courant se comprend immédiatement.

## Interagir : le contrôle selon le besoin

| Besoin du brasseur | Outil à privilégier | Usage et limite |
|---|---|---|
| Choisir entre quelques possibilités courtes | Sélecteur segmenté / groupe radio | Moyens de paiement, mode de saisie : options comparables et sélection visible en un geste. Si les mots ne tiennent pas, utiliser un select compact. |
| Changer une petite catégorie familière | Pastille rotative | Valeur courante directement dans la ligne ; au plus cinq valeurs, faciles à comprendre et réversibles. Éviter pour une décision coûteuse ou des options à découvrir. |
| Activer ou désactiver immédiatement une option | Interrupteur | État binaire explicite, avec libellé stable. Ne pas représenter une commande ponctuelle par un interrupteur. |
| Cocher plusieurs éléments ou préparer une sélection | Cases à cocher | Options indépendantes, sélection multiple de lignes ; cocher n'exécute pas une suppression. |
| Choisir dans une liste finie sans besoin de recherche | Select natif compact | Bon pour une petite liste dont les libellés seraient trop longs en segments. Ne pas remplacer chaque select par une recherche. |
| Trouver un ingrédient parmi beaucoup de références | Combobox avec recherche | Catalogue, suggestions, informations discriminantes dans chaque option. Garder la valeur sélectionnée visible et distinguer sélection et simple saisie. |
| Appliquer une configuration connue | Puces de préréglage | Un appui applique le programme ; montrer celui qui correspond aux valeurs actuelles. Éviter de faire défiler des programmes qui écrasent les paliers au passage. |
| Ajuster souvent une quantité | Stepper compact | Valeur, unité et −/+ sur la même ligne ; saisie directe pour éviter une succession d'appuis. Paliers supplémentaires à la demande. |
| Explorer une grandeur bornée | Curseur avec valeur exacte | Une dilution ou une plage de température ; repères fidèles et possibilité d'ajuster précisément. Une valeur rarement changée n'a pas besoin d'une grande piste. |
| Modifier une valeur déjà affichée | Édition sur place | Ouvrir l'éditeur à l'endroit de la valeur, avec indication d'éditabilité, libellé et sortie claire. Ne pas ajouter un bouton « Modifier » et un second bloc de saisie pour chaque nombre. |
| Renseigner une date ou un mois | Sélecteur natif et raccourcis utiles | Aujourd'hui/hier quand fréquents ; mois pour les périodes. Éviter la saisie manuelle d'un format et les calendriers permanents. |
| Affiner ou filtrer une liste | Puces de filtres, recherche révélée, tri compact | Montrer filtres actifs et nombre de résultats ; conserver un moyen clair de les retirer. Ne pas cacher les filtres qui expliquent une liste vide. |
| Accéder à plusieurs vues d'un même sujet | Onglets | Un panneau à la fois, état actif et titre explicites. Les segments modifient une valeur, les onglets changent une vue : conserver cette distinction sémantique. |
| Atteindre une action secondaire de ligne | Menu contextuel, actions révélées | Allège les rangées répétées. L'action quotidienne reste directement accessible ; un glissement est un raccourci avec une alternative visible et au clavier. |
| Chercher une destination ou une action transversale | Palette de commandes | Utile dans une application riche ; elle complète la navigation visible. |
| Consulter une explication ou un réglage secondaire | Disclosure, accordéon, popover | Résumé utile dans l'état fermé ; détails dans le flux si possible. Popover pour une information courte, feuille pour une tâche qui demande de l'espace. Les erreurs doivent rester visibles ou ouvrir la section. |

Les segments, pastilles et déclencheurs peuvent utiliser `<button>` dans le
code : c'est leur forme et leur comportement adaptés au besoin qui changent.
Ne pas remplacer un élément HTML natif par un `<div>` cliquable pour éviter
le mot « bouton ». Les [patterns WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/)
décrivent les rôles et interactions ; les fiches
[radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/),
[switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) et
[combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) aident à conserver
le bon comportement clavier.

## Afficher : la donnée ne se résume pas à une phrase

| Ce qu'il faut comprendre | Représentation compacte | Application métier |
|---|---|---|
| Valeur exacte avec contexte | Nombre + unité, métadonnée proche | Quantité, température, densité, CHF ; chiffres alignés et unité à côté. Une valeur calculée est une sortie, pas un champ désactivé qui ressemble à une saisie. |
| Catégorie ou état | Badge, pastille, icône accompagnée d'un libellé | Style, étape du brassin, statut de facture ; couleur stable, jamais seul moyen de comprendre. |
| Niveau dans une plage connue | Jauge linéaire / meter | Couverture de stock, capacité disponible, seuil de réserve ; valeur et seuil lisibles dans une ligne. |
| Avancement d'une tâche | Barre de progression, étapes | Import réellement quantifié, étapes de préparation. Si l'avancement est inconnu, le montrer indéterminé ; aucun faux pourcentage. |
| Écart à un objectif ou incertitude | Barre de plage, repère cible, intervalle | Ions face au style, intervalle aromatique, projection d'alcool ; distinguer mesure, cible et prévision. |
| Évolution dans le temps | Petite courbe / sparkline, courbe détaillée à la demande | Températures, densité, dépenses ; montrer durée, unité, lacunes et valeurs exactes accessibles. La petite courbe signale une tendance sans prendre tout l'écran. |
| Comparaison de plusieurs valeurs exactes | Tableau compact / lignes à colonnes alignées | Ingrédients, montants, ions avant/après. Ne pas transformer chaque cellule en carte mobile. Défilement horizontal local si la comparaison le nécessite. |
| Composition d'un total | Barre empilée avec valeurs | Parts de malts, répartition de dépenses ; segments proportionnels et total explicite. Éviter les parts presque indiscernables sans nombres associés. |
| Ordre et durée d'un programme | Frise / chronologie | Paliers de fermentation, échéances ; durée réelle quand l'axe est quantitatif, étapes séparées si elle est inconnue. |
| Forme d'un profil multidimensionnel | Radar accompagné des valeurs utiles | Profil ionique ou aromatique ; conserver des axes stables. Pour juger un petit écart, préférer la barre de plage ou le tableau. |
| Couleur ou aspect du produit | Nuancier EBC, vignette utile | Couleur prévue de bière, photo permettant d'identifier un article. Une image décorative ne doit pas chasser les données. |
| Groupe d'informations secondaires | Résumé structuré repliable | « 3 paliers · 18 j » ouvre le programme ; l'information nécessaire à la décision reste dans le résumé. |
| Chargement, enregistrement ou erreur | Squelette, indicateur local, message contextuel | Préserver l'espace des données en chargement, confirmer près de l'action et donner un moyen de corriger une erreur. |

Un graphique doit gagner en compréhension ou en compacité. Pour comparer trois
montants exacts, trois lignes peuvent être meilleures qu'un graphique. Ne pas
remplacer du texte utile par des pictogrammes mystérieux, un radar décoratif ou
une légende plus encombrante que les données. Prévoir une lecture accessible
et les nombres nécessaires à l'action.

Le HTML fournit déjà des sorties adaptées :
[`meter`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meter)
représente une mesure dans une plage,
[`progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)
l'avancement d'une tâche et
[`output`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output)
un résultat de calcul. Un
[`details` avec `summary`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)
fournit un détail repliable. Un tableau de données reste un `<table>` ; un
ensemble de libellés et valeurs peut employer `<dl>`, `<dt>`, `<dd>`.

## Réutiliser ce qui existe dans ce dépôt

Inventaire vérifié dans les sources le 12.09.2026. **Présent ne signifie pas
déjà conforme à la nouvelle densité ni validé pour tout usage.** Lire le
composant, adapter son rendu dans le périmètre concerné et vérifier le parcours.

| Outil disponible | Point d'entrée |
|---|---|
| Segments, pastilles rotatives, préréglages | [SegmentedControl](../src/ui/SegmentedControl.tsx), [CycleTag](../src/ui/CycleTag.tsx), [PresetChips](../src/ui/PresetChips.tsx) |
| Recherche et choix de référence | [Combobox](../src/ui/Combobox.tsx), [IngredientPicker](../src/ui/IngredientPicker.tsx), [CommandPalette](../src/ui/CommandPalette.tsx) |
| Quantités, décimales françaises, dates | [QuantityStepper](../src/ui/QuantityStepper.tsx) (variante `compact`), [NumberInput](../src/ui/NumberInput.tsx), [NumericField](../src/ui/NumericField.tsx), [DateField](../src/ui/DateField.tsx) |
| Curseurs | [SliderField](../src/ui/SliderField.tsx), [RatioSlider](../src/ui/RatioSlider.tsx) |
| Détails et feuilles | [RecipeDisclosure](../src/ui/RecipeDisclosure.tsx), [Sheet](../src/ui/Sheet.tsx), [ModalShell](../src/ui/ModalShell.tsx) |
| Listes, filtres et actions de ligne | [EntityList](../src/ui/EntityList.tsx), [CatalogToolbar](../src/ui/production/CatalogToolbar.tsx), [CatalogItemMenu](../src/ui/production/CatalogItemMenu.tsx), [SwipeRow](../src/ui/SwipeRow.tsx) |
| Valeurs et états | [Reading](../src/components/ui/Reading.tsx), [BeerStyleTag](../src/ui/BeerStyleTag.tsx), [BrewTag](../src/ui/BrewTag.tsx), [PersistenceStatus](../src/ui/PersistenceStatus.tsx) |
| Jauges et comparaisons | [LevelGauge / LevelDot](../src/ui/LevelGauge.tsx), [IonComparison](../src/ui/IonComparison.tsx), [WaterAnalysisTable](../src/ui/WaterAnalysisTable.tsx) |
| Profils, plages et courbes | [WaterRadar](../src/ui/WaterRadar.tsx), [HopRangePlot](../src/ui/hopIndex/HopRangePlot.tsx), [FermentationTemperatureChart](../src/ui/FermentationTemperatureChart.tsx), [NoloAlcoholChart](../src/ui/NoloAlcoholChart.tsx) |

[`package.json`](../package.json) fournit notamment `lucide-react` pour les
icônes, `recharts` pour les graphiques, `cmdk` pour la palette, `react-virtuoso`
pour les grandes listes et `fuse.js` pour la recherche. Une dépendance présente
n'est pas une obligation d'emploi : les graphiques SVG et contrôles natifs
peuvent suffire. `vaul` reste refusé par PRODUCT même s'il apparaît installé.

Les interrupteurs réutilisables, sparklines, barres de composition, popovers
ou éditeurs sur place du tableau sont des **options à composer ou à intégrer
selon le besoin**, pas une affirmation qu'un composant générique existe déjà.
Vérifier le support des navigateurs visés avant d'introduire une nouvelle API.
N'ajouter une bibliothèque qu'après avoir vérifié les composants du dépôt et
les possibilités HTML/CSS/SVG adaptées.

## Applications attendues dans les écrans

- **Ligne d'ingrédient** : nom, quantité/unité et moment d'ajout restent
  comparables dans une rangée compacte ; pastille si la catégorie s'y prête,
  édition de quantité sur place, détails techniques repliés. La suppression
  secondaire peut passer par le menu de ligne.
- **Atelier de l'eau** : volumes à préparer visibles, ion/valeur/plage alignés,
  repères graphiques pour les écarts ; calculs explicatifs à la demande. Une
  mesure absente reste inconnue, jamais représentée par une barre à zéro.
- **Finances** : période compacte, catégories en filtres, lignes de montants
  alignés, comparaison ou évolution selon la question ; pièce justificative et
  ventilation détaillée depuis la ligne concernée.
- **Fermentation** : résumé du programme, chronologie des paliers ou courbe de
  température, valeurs exactes accessibles ; ne pas empiler un grand bloc de
  texte et une grande carte pour chaque palier.

Ces exemples guident le choix dans les tâches d'écran ; ils ne constituent
pas un compte rendu de modifications déjà livrées.

## Composer un outil métier avec le contrôle et son résultat

Un outil utile associe le geste à son effet visible. Le contrôle et sa lecture
peuvent tenir dans le même bloc compact, au lieu d'empiler un formulaire, un
paragraphe explicatif et un graphique séparés.

| Décision à aider | Interaction possible | Résultat à rendre visible |
|---|---|---|
| « Que change ce réglage ? » | Préréglage ou ajustement borné avec saisie exacte | Valeur avant/après, intervalle et déplacement du repère sur une plage. La mise à jour s'appuie sur le modèle métier, sans fausse précision. |
| « Quelle option convient le mieux à ma recette ? » | Filtre par style, sélection de quelques candidats | Tableau comparatif compact avec différences utiles, compatibilité et incertitudes. Pour les levures, distinguer caractéristiques documentées et effets dépendant du procédé. |
| « Comment se déroule mon programme ? » | Édition d'un palier, sélection d'une étape | Chronologie et courbe cohérentes avec les durées et consignes ; mise en évidence de l'étape modifiée. Une durée inconnue ne devient pas une durée inventée. |
| « Quelle part représente cet ingrédient ou cette dépense ? » | Édition directe dans une ligne | Proportion dans une barre empilée, montant ou quantité, et total mis à jour à proximité. |
| « Où est le problème et que puis-je ajuster ? » | Sélection d'un écart puis accès au réglage concerné | Jauge avec seuil, raison courte et paramètres pertinents ; le détail explique le calcul à la demande. |
| « Est-ce que ce scénario mérite d'être appliqué ? » | Comparaison état actuel/scénario et application explicite | Effets attendus, données manquantes et étapes de recette affectées. Explorer ne doit pas modifier silencieusement la recette enregistrée. |

La simulation NOLO peut ainsi associer réglages et intervalle projeté ; l'aide
au choix d'une levure peut associer filtres de style et comparaison. Ces exemples
de présentation n'affirment aucun lien scientifique : la tâche métier vérifie
les calculs, les sources et ce qu'il est réellement possible de prédire.

Les outils natifs et les patterns établis restent utiles dans ces compositions :
le [slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) prévoit notamment la
valeur, les bornes et les commandes clavier ; le
[tableau](https://www.w3.org/WAI/ARIA/apg/patterns/table/) garde la structure des
comparaisons ; le [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
expose l'état ouvert/fermé. Un
[popover](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) peut
afficher une aide contextuelle sans quitter l'écran. Choisir l'outil selon son
usage et vérifier son comportement sur les appareils visés.

## Ce qu'une tâche d'implémentation doit livrer

Dans le périmètre modifié, choisir le besoin prioritaire, le contrôle pour agir
et la représentation pour comprendre. **Mettre ce choix en œuvre dans l'écran**,
puis jouer le parcours et examiner le rendu. Un catalogue de composants ou une
réduction de hauteur ne suffit pas lorsque le mauvais outil reste en place.

Le compte rendu indique brièvement le besoin traité, les outils réellement
employés, les fichiers concernés et le résultat observé : geste évité, lecture
plus directe ou données mieux comparables, avec la capture utile. Ne pas inventer
un gain chiffré ; mesurer si un chiffre est annoncé. Une retouche étroite reste
étroite : aucun quota de nouveaux composants ni audit général imposé.

## Mise en œuvre disponible dans l'application

Les primitives communes appliquent désormais les hauteurs 24/28/32 px :
[Button](../src/components/ui/Button.tsx), [QuantityStepper](../src/ui/QuantityStepper.tsx),
[FormNav](../src/ui/FormNav.tsx) et les commandes de [Sheet](../src/ui/Sheet.tsx).
La saisie conserve 16 px ; les libellés secondaires passent à 12 px. L'en-tête
compact est activé pour tous les onglets dans [App](../src/App.tsx).

Le parcours [Stocks](../src/components/tabs/StocksTab.tsx) compose ces outils :

- Groupe de choix « Tous / À commander / Épinglés » avec compteurs. « À commander »
  utilise les mêmes besoins calculés que la liste de courses, puis la recherche
  s'applique au sous-ensemble choisi.
- [Ligne compacte](../src/ui/StockRow.tsx) avec quantité et unité côte à côte,
  mini-jauge et indication de réserve. [LevelGauge](../src/ui/LevelGauge.tsx)
  distingue une couverture de brassins d'un ratio face au seuil ; sans donnée,
  il affiche « Niveau inconnu » sans simuler une jauge pleine.
- [Fiche article](../src/ui/StockDetailSheet.tsx) avec disponibilité en premier,
  tableau des besoins et caractéristiques techniques dépliables.
- [Correction d'inventaire](../src/ui/InventoryCorrectionSheet.tsx) avec compteur,
  paliers, motif à sélection directe et écart calculé dans un `output`. La
  validation conserve le parcours de comptage journalisé.

Réutiliser ces compositions lorsqu'elles conviennent au besoin. Les autres
écrans continuent à être vérifiés dans leur propre périmètre ; la présence de
ces primitives ne constitue pas une validation automatique de toute l'application.

La passe transverse ajoute des compositions effectivement utilisées :

| Écran | Outil employé et information conservée |
|---|---|
| Clients | Recherche commune au téléphone et à l'ordinateur, types en radios, lignes `details` avec nom, statut et ventes ; coordonnées et commandes au dépliage. Les ventes passent sous le nom lorsque le texte agrandi manque de place. |
| Prix et marges | Tableau Produit / Prix HT / Coût / Marge, filtre « Sans marge », région de défilement accessible par Tab ; édition depuis le nom, résultats calculés en `output` et pertes avec leur signe réel. |
| Réserve OFDF | Année dans un select, volume et montant en `dl`, démarches dans un détail natif. Le caractère indicatif et la réduction annuelle non confirmée restent visibles. |
| Fûts | Liste compacte, états en radios avec compteurs et recherche par bière/client ; choix du brassin dans une Combobox, puis confirmation du remplissage. La livraison conserve les informations de contenu. |
| Matériel | Liste ordonnée par réparation puis entretien, filtre « À traiter », état dans les métadonnées ; catégorie en select, état en radios, achat et notes repliables. |
| Production — volumes | Recette source dans un select, volume cible en stepper avec saisie décimale directe, eau calculée en `dl` et ingrédients dans un tableau. Un volume invalide laisse les commandes accessibles pour le corriger. |
| Recettes et brassins | Repères chiffrés rapprochés, détails repliables ; sur mobile, le volume correspond à l'étape : prévu, en cuve ou conditionné. Une mesure absente reste explicite. |
| Jour de brassage | Consigne, minuterie et ingrédients rapprochés, relevé dans une petite feuille, commandes de pied de 32 px. Le journal associe heure, étape et valeur dans une ligne de mesure avec correction sur place. |
| Eau | Curseur natif et saisies exactes du pourcentage et des litres ; la ligne se réorganise avec le texte agrandi pour conserver aussi le complément en eau du réseau. |
| Réglages et navigation | En-têtes et pieds resserrés, catégories sur une bande d'onglets, résumés de cuverie en libellés/valeurs ; champs de 32 px à texte saisi de 16 px. Les dialogues s'ancrent au-dessus du clavier dès qu'il réduit l'espace visible. |

Ces choix ne justifient pas de comprimer les valeurs jusqu'à les couper :
les barres peuvent défiler localement, les noms et groupes peuvent revenir à
la ligne, et les détails gardent un accès au clavier. Les parcours ont été
examinés dans le navigateur aux largeurs 320, 375, 430 et 1280 px, avec essais
de texte agrandi et de clavier simulé sur les surfaces concernées. Cette revue
ne remplace pas un essai sur téléphone physique avec ses aides techniques.

## Entrée à donner aux agents et vérification

Inclure dans chaque délégation frontend :

> Applique la priorité de densité mobile de PRODUCT.md et les petites dimensions
> de DESIGN.md. Lis docs/ui-compacte.md. Choisis, puis utilise dans ton périmètre,
> le contrôle ET la représentation adaptés au besoin du brasseur ; réutilise les
> composants pertinents. Les anciens minima génériques de 44/48 px ne priment
> pas sur ces consignes. Vérifie réellement l'écran et le parcours sur téléphone
> puis ordinateur, avec captures examinées. Rapporte le besoin traité, le contrôle
> et la représentation effectivement utilisés, ainsi que le résultat observé.
> Une proposition documentaire seule ne termine pas une tâche d'implémentation.

Si l'agent ne peut pas lire les fichiers, lui fournir les extraits pertinents
et les chemins des composants de son périmètre.

La validation compare à 320 / 375 / 430 px puis 1280 px : espace occupé par les
barres, données utiles visibles, gestes pour finir l'action, lecture des unités,
débordements, cibles réellement activables sans chevauchement, clavier et focus.
Ouvrir et fermer les détails, tester sélection et correction, vérifier la liste
vide, le chargement et l'erreur quand ces états sont concernés. Les libellés
longs et le zoom doivent pouvoir agrandir les contrôles sans couper le contenu.

Une taille conforme seule ne prouve pas une bonne UX. La nouvelle norme compacte
et les repères de [taille web AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
servent à vérifier l'interaction, pas à rétablir des barres ou des boutons trop
grands. Conserver contraste, valeurs exactes, unités, noms accessibles et moyen
de corriger une erreur.
