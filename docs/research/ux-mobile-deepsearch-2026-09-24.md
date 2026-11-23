# Élargir les visualisations et interactions de L’Affinée

Recherche du 24 septembre 2026. Analyse du code, consultation de sources primaires, quatre missions GPT‑6 Luna Max et inspection ciblée dans le navigateur. Les recommandations ci-dessous sont des choix de conception à éprouver avec le brasseur ; aucun gain de temps n’est présenté comme mesuré.

## Ce qui changerait le plus l’application

Le potentiel dépasse largement les radars, pastilles rotatives et curseurs. Les pistes les plus utiles combinent une **représentation d’un problème** et le **geste qui permet de le résoudre** : sélectionner un écart pour accéder à sa correction, choisir un palier dans une frise, comparer les différences d’une variante, ou filtrer une liste en touchant le graphique correspondant.

Je commencerais par cinq essais : matrice de choix des levures ; frise de programme liée à son éditeur ; stock physique/réservé/libre ; comparaison d’eau avant/essai avec écarts alignés ; sélection d’une période financière liée à ses opérations. Ces essais peuvent largement exploiter le socle actuel. Une bibliothèque supplémentaire devient intéressante quand elle apporte une interaction difficile à fiabiliser, un véritable calendrier de ressources ou un schéma éditable.

Une bibliothèque de graphiques ne choisit ni la bonne question ni la bonne interaction. Inversement, « déjà réalisable en SVG » n’est pas une raison pour écarter une meilleure solution externe. Les deux décisions doivent être comparées séparément.

## Point de départ réellement observé

Le dépôt a été examiné en conservant ses modifications en cours. Les références produit sont `PRODUCT.md`, `DESIGN.md` et `docs/ui-compacte.md` dans leur état actuel.

| Déjà présent | Preuve dans le dépôt | Évolution intéressante |
|---|---|---|
| Radar ionique, plages et comparaison de valeurs | `src/ui/WaterRadar.tsx`, `IonComparison.tsx`, `water/WaterDoseImpact.tsx` | Relier un ion ou un écart aux sels concernés ; comparer avant/essai sur axes communs. |
| Frise et consignes de fermentation | `src/ui/FermentationTemperatureChart.tsx`, `YeastRecipePlan.tsx` | Faire de la frise une entrée de l’éditeur, montrer le déplacement des étapes suivantes. |
| Comparaison de 2–3 levures et plages fabricant | `src/ui/YeastChoiceComparison.tsx`, `YeastRangeComparison.tsx` | Mettre les différences discriminantes en évidence ; comparer des conditions, pas une note arbitraire. |
| Courbes et intervalles d’arômes / NOLO | `src/ui/hopIndex/HopAromaChart.tsx`, `HopRangePlot.tsx`, `src/ui/NoloAlcoholChart.tsx` | Lecture épinglée au toucher, variantes alignées et provenance de chaque intervalle. |
| Stock et couverture en brassins | `src/ui/StockRow.tsx`, `LevelGauge.tsx`, `src/domain/stockLevel.ts` | Montrer les engagements et le besoin d’une recette, avec unités compatibles. |
| Courbe financière, tableau exact et catégorie reliée au journal | `src/ui/finance/FinanceComparisonChart.tsx`, `CostComposition.tsx`, `src/components/tabs/FinancesTab.tsx` | Étendre la sélection aux périodes de la courbe. Les boutons de légende de la composition ouvrent déjà le journal filtré par catégorie. |
| Stepper, répétition à l’appui, balayage de ligne, recherche | `QuantityStepper.tsx`, `SwipeRow.tsx`, `Combobox.tsx`, `CommandPalette.tsx` | Meilleur placement et conséquences visibles ; ces gestes ne sont pas tous à recréer. |
| Maintien de l’écran et vibration d’alarme | `src/services/brewTimer.ts` | Rendre les états et limites compréhensibles ; ces API existent déjà dans le code. |

`package-lock.json` verrouille notamment React 19.2.8, Recharts 3.10.1, Motion 13.2.0, cmdk 1.1.1, React Virtuoso 4.18.12 et Fuse.js 7.5.0. Vaul est installé mais explicitement refusé par `PRODUCT.md` : sa présence n’autorise pas son utilisation.

Les vues **Levure** et **Eau et sels** ont été ouvertes dans le banc local construit à partir des vrais composants et des adaptateurs de test (`scripts/build-hop-recipe-qa.mjs`). Captures regardées à 390 × 844 et 1280 × 900. La vue Levure présente déjà une plage et une courbe ; l’atelier de l’eau combine déjà radar, ratio et doses. Le travail futur doit donc aussi améliorer leurs liens avec les décisions, sans les présenter comme de futures nouveautés.

## Un vocabulaire plus large : 30 pistes

Les exemples d’application sont des propositions pour L’Affinée. Les liens de bibliothèques plus bas attestent des capacités techniques, pas d’un bénéfice utilisateur déjà mesuré.

### Lire, comparer et repérer

| # | Représentation | Application concrète | Limite / donnée nécessaire |
|---|---|---|---|
| 1 | **Jauge à intervalle cible** (« bullet/range chart ») | Un ion, une température ou une capacité, avec mesure, cible et dépassement sur une ligne. | Bornes et unité explicites ; une inconnue n’est pas un point à zéro. Certaines variantes existent déjà. |
| 2 | **Deux points reliés** (« dumbbell ») | Avant/après une correction d’eau ou une variante de recette ; la longueur du lien représente l’écart. | Échelle commune ; distinguer deux valeurs calculées d’une mesure et d’une projection. |
| 3 | **Petits graphiques alignés** (« small multiples ») | Comparer trois programmes ou les historiques de quelques brassins sans superposer toutes les courbes. | Même échelle pour une même grandeur, sinon comparaison trompeuse. Empiler sur téléphone. |
| 4 | **Mini-courbe dans une ligne** (« sparkline ») | Température ou consommation : dernier relevé, tendance et ancienneté sans ouvrir une fiche. | Période et lacunes visibles ; une flèche ne suffit pas à qualifier une fermentation. |
| 5 | **Bande de projection + points mesurés** | Voir si les relevés se situent dans une projection documentée. | Une plage fabricant n’est pas un intervalle statistique de confiance ; aucune bande inventée. |
| 6 | **Matrice de compatibilité** | Levure × forme, plage de température, disponibilité, usage documenté. | « Oui », « non », « inconnu » et conditions ; aucune intensité 0–100 fabriquée. |
| 7 | **Tableau avec différences surlignées** | Comparer deux levures ou deux recettes en repérant ce qui change réellement. | Garder l’accès aux valeurs identiques et aux sources ; 2–3 candidats plutôt qu’un tableau illimité. |
| 8 | **Barre de composition liée aux ingrédients** | Parts de malts ou coûts par ingrédient ; toucher une part sélectionne sa ligne. | Indiquer total et unités ; les petites parts gardent leur nombre exact et une commande accessible. |
| 9 | **Cascade** (« waterfall ») | Du volume de départ au volume transféré ; du coût des ingrédients au coût total. | Les postes doivent se sommer réellement ; ne pas additionner des volumes à des références thermiques différentes. |
| 10 | **Barres divergentes** | Écarts positifs/négatifs entre cible et résultat pour plusieurs brassins. | Le zéro est une référence, pas une absence de donnée. Ne pas comparer sur un axe des unités différentes. |
| 11 | **Points bruts + médiane** | Calibration du rendement sur quelques brassins comparables. | Montrer le nombre d’observations et exclusions ; pas de distribution lissée crédible avec trois points. |
| 12 | **Carte à deux variables** | Température documentée et atténuation annoncée de candidats ; explorer des compromis. | Une position n’est pas un classement global ; intervalle et dépendance au moût restent visibles. |
| 13 | **Carte de chaleur** | Répartition des tâches par jour, fréquence de consommation ou état par lot. | Échelle connue ; une intensité de couleur ne peut pas inventer une donnée quantitative. |
| 14 | **Barres ordonnées / Pareto** | Quels ingrédients ou postes contribuent le plus à une dépense ? | Une catégorie touchée doit mener aux lignes correspondantes ; le coût complet peut être inconnu. |
| 15 | **Flux / Sankey** | Où partent des volumes ou des coûts à travers quelques étapes. | Seulement si les flux sont établis et cohérents ; branches et étiquettes sont coûteuses à lire à 390 px. |
| 16 | **Schéma de cuverie orienté action** | Sélectionner cuve, transfert ou mesure dans une représentation du matériel. | Schéma simple si le matériel est fixe ; un éditeur de nœuds n’est utile que si la topologie est modifiable. |

### Agir depuis les données

| # | Interaction | Application concrète | Limite / alternative |
|---|---|---|---|
| 17 | **Toucher un palier pour le régler** | Frise → durée/température du palier → recalage des étapes suivantes. | Saisie exacte toujours possible ; dates futures provisoires, pas de fin automatique de fermentation. |
| 18 | **Épingler une lecture** | Un toucher fixe date, température et densité au-dessus d’une courbe ; autre toucher change la sélection. | La lecture doit rester visible hors du doigt ; ne dépend pas du survol. |
| 19 | **Inspection pas à pas des points** | Parcourir les relevés rapprochés sans viser un minuscule point. | Commandes précédent/suivant ou clavier ; l’axe temporel du graphique conserve les vraies dates. |
| 20 | **Graphique qui filtre sa liste** | Toucher une catégorie de dépense, un brassin ou une plage pour afficher les lignes associées. | Filtre actif et retour « tout afficher » visibles ; filtre n’est pas suppression. |
| 21 | **Réglage + conséquence adjacente** | Modifier une dose et voir les ions concernés, ou modifier un volume et voir les besoins associés. | Recalcul métier existant ; une conséquence sensorielle non modélisée reste qualitative. |
| 22 | **Aperçu puis application explicite** | Variante temporaire, comparaison à la recette enregistrée, appliquer ou revenir. | La simulation reste locale ; un brassin lancé garde sa recette figée. |
| 23 | **Édition directement sur une valeur** | Toucher une quantité lisible ouvre son éditeur au même endroit. | L’éditabilité doit se voir ; erreur, unité et sortie claire ; conserver décimales françaises et valeur vide. |
| 24 | **Zone de glissement d’une valeur** (« scrubber ») | Ajustement rapide d’un paramètre sans piste de slider permanente. | À tester comme raccourci ; évite la concurrence avec le défilement. Saisie et −/+ demeurent disponibles. |
| 25 | **Pas fin / pas large explicite** | Pesée par 0,1 g ou 1 g selon l’action ; exploration puis finition exacte. | Unité et pas affichés ; une accélération cachée ne doit pas faire dépasser une dose. Le stepper existe déjà. |
| 26 | **Déplacer avec alternative « monter/descendre »** | Réordonner une liste de tâches ou un programme. | Le glisser seul est insuffisant ; la physique ou les dépendances peuvent interdire un nouvel ordre. |
| 27 | **Actions contextuelles et annulation** | Sélection de lignes → barre d’actions ; correction d’une modification réversible. | L’annulation respecte persistance et synchronisation. Ne pas promettre d’annuler une action physique déjà faite. |
| 28 | **Recherche à facettes avec compteurs** | Repérer des levures sèches disponibles, garder les critères actifs et comparer une sélection courte. | La disponibilité commerciale n’est pas la compatibilité ; les compteurs doivent correspondre aux données réellement connues. |
| 29 | **Séquence « maintenant / ensuite »** | Prochaine pesée, minuteur, ajout ou relevé à faire avec état courant accessible. | Chronologie prévue et horodatage réel distincts ; ni faux pourcentage ni hypothèse de tâche exécutée. |
| 30 | **Scan pour retrouver une fiche** | QR interne de cuve, fût ou lot → fiche correspondante → confirmation de l’action. | Code identifié ≠ lot identifié si l’étiquette n’encode pas le lot. Décodage hors ligne et recherche manuelle de repli. |

Ces familles peuvent être combinées : une matrice peut contenir des intervalles, une frise peut piloter un éditeur exact, une cascade peut sélectionner un poste du tableau. Une bonne composition peut apporter davantage que cinq widgets autonomes.

## Les cinq premiers essais que je recommande

### 1. Levure : comparer les conditions et les différences

**Décision :** « Quelle alternative convient à ma recette et qu’est-ce qui change ? »

Une sélection de deux ou trois références, avec plages alignées et matrice qualitative. Mettre en tête les différences de température, forme, dose documentée et disponibilité connue ; ouvrir les sources depuis le fait concerné. Les profils aromatiques restent des descriptions ou catégories documentées. Pour comparer un scénario, utiliser le modèle de recette applicable et montrer les données manquantes.

**Point d’entrée :** `YeastChoiceComparison.tsx`, `YeastCandidatePicker.tsx`, `YeastRecipePlan.tsx`. **Nature :** renforcer une comparaison déjà présente. **Coût relatif :** faible à moyen pour la lecture ; supérieur si l’on ajoute des données d’approvisionnement.

**Essai observable :** retrouver une souche, comparer une alternative, nommer deux différences et une inconnue, appliquer explicitement le choix puis le retrouver après sauvegarde. Comparer une matrice à des lignes de plages avant de choisir la forme finale.

### 2. Fermentation : sélectionner la phase plutôt que chercher son formulaire

**Décision :** « Quel palier je règle, et qu’est-ce que cela décale ? »

La frise montre les durées prévues et la consigne. Sélectionner la phase met son éditeur exact à proximité et souligne ses conséquences temporelles. Les relevés réels apparaissent comme relevés, séparément. Une durée absente laisse un ordre de phases, sans inventer de largeur proportionnelle.

**Point d’entrée :** `FermentationTemperatureChart.tsx`, `YeastRecipePlan.tsx`, `BrewThermalControl.tsx`. **Nature :** nouvelle liaison entre lecture et édition. **Coût relatif :** moyen.

**Essai observable :** sélectionner le deuxième palier, ajouter un jour, constater le décalage, effacer la durée, corriger et revenir à l’état enregistré. Le glissement éventuel se compare à « toucher + saisie », sans devenir le seul geste.

### 3. Stocks : voir ce qui peut réellement être utilisé

**Décision :** « Puis-je brasser cette recette avec ce qui reste ? »

Une barre de stock physique indique la part engagée, le besoin de l’essai et le disponible restant. Le manque est nommé en kg/g/sachets ; une quantité attendue ne remplit pas la barre du disponible. Choisir la recette actualise les besoins associés.

**Point d’entrée :** `StockRow.tsx`, `StockDetailSheet.tsx`, `src/domain/stockLevel.ts`. **Nature :** composition des données existantes de stock/besoins, sous réserve d’une définition précise de l’engagement. **Coût relatif :** moyen.

**Donnée nouvelle éventuelle :** aucune commande fournisseur entrante, affectation physique de fermenteur ou péremption générique ne doit être présumée disponible. Ces extensions nécessitent d’abord un modèle et une saisie. L’exemple interactif comprend une commande fictive uniquement pour montrer sa séparation du disponible.

**Essai observable :** une demande dépassant le libre signale le manque, sans déduire deux fois ce qui a déjà été consommé ni traiter une conversion d’unité impossible comme un zéro fiable.

### 4. Eau : choisir un écart et voir ses leviers

**Décision :** « Quel problème corriger et qu’est-ce que cette dose affecte aussi ? »

À côté du profil, afficher les écarts chiffrés et sélectionner un ion. Le contrôle de dose associé et les autres ions touchés deviennent visuellement liés. Comparer avant/essai avec deux repères et une plage cible. Garder le radar si sa forme aide à lire l’ensemble ; les valeurs alignées servent une autre lecture.

**Point d’entrée :** `WaterWorkbench.tsx`, `WaterDoseImpact.tsx`, `IonComparison.tsx`, `SaltDoseControl.tsx`. **Nature :** enrichissement d’outils déjà présents. **Coût relatif :** moyen, calculs existants conservés.

**Essai observable :** identifier une concentration trop basse, régler une dose, voir les effets couplés et revenir en arrière. Un rapport sulfate/chlorure dans la plage ne masque pas deux concentrations trop faibles.

### 5. Finances : passer du graphique aux opérations

**Décision :** « Qu’est-ce qui explique ce montant ? »

Les catégories sont déjà reliées au journal : les boutons de légende de `CostComposition` déclenchent `openJournal` avec la catégorie choisie. L’essai nouveau consiste à sélectionner une période dans la courbe pour retrouver ses opérations, avec filtre actif lisible et retour conservé. Pour le budget d’un brassin, une composition ou une cascade pourrait expliquer le coût consommé et le coût par litre à partir des lignes de `estimateBrewBudget`, en gardant les prix manquants et estimations visibles.

**Point d’entrée :** `FinanceComparisonChart.tsx`, `FinancesTab.tsx`, `BrewBudgetSheet.tsx`. **Nature :** extension d’une liaison graphique/journal existante et nouvelle lecture du budget. **Coût relatif :** faible à moyen.

**Essai observable :** retrouver les opérations responsables d’un montant, ouvrir une pièce puis revenir avec le filtre et la position conservés. Le tableau exact garde la même source que le graphique.

## Pistes plus ambitieuses à garder ouvertes

- **Vue opérationnelle du brassage :** une frise verticale « maintenant / ensuite », avec minuteries et ajouts ponctuels placés dans le programme. `buildTimeline` et les horodatages existent ; une phase terminée peut comparer prévu et réel si la cible initiale est encore disponible. Une action ponctuelle se représente par un repère, une phase par une durée. [Exemple prévu/réel de vis-timeline](https://visjs.github.io/vis-timeline/examples/timeline/items/expectedVsActualTimesItems.html).
- **Agenda de préparation :** une vue sur 7 ou 14 jours relie brassins, ingrédients requis et tâches de préparation. `plannedBrewDate` donne une date, pas une heure : un événement journalier est honnête avec ces données. La [vue liste de FullCalendar](https://fullcalendar.io/docs/list-view) est une alternative à comparer à un calendrier quadrillé sur téléphone.
- **Planning par cuve :** voir disponibilité, capacité et conflits avant de déplacer un brassin. Il faut d’abord enregistrer capacité utile, affectation de l’équipement et occupation prévue ; ces relations n’existent pas encore dans le modèle inspecté. Un futur planning peut alors comparer matrice courte et calendrier de ressources.
- **Schéma interactif du procédé :** toucher une cuve ou un transfert pour consulter sa consigne, saisir un relevé ou voir l’écart. Un SVG suffit pour un circuit fixe ; [React Flow propose aussi des connexions par appui sur écran tactile](https://reactflow.dev/examples/interaction/touch-device) si le circuit devient modifiable.
- **Exploration des candidats sur deux axes :** température documentée et atténuation annoncée, avec sélection ouvrant le comparatif. Les plages restent des plages et la position n’est pas un classement. Pour des lots, il manque actuellement quantité propre et péremption : ne pas produire une carte de disponibilité ou de fraîcheur à partir de l’année de récolte seule.

Ces pistes demandent des essais spécifiques ; elles ne sont pas éliminées parce qu’elles dépassent les composants actuels.

## Bibliothèques : ce qu’elles apportent et quand les choisir

Les versions, dates de publication, licences déclarées et plages de dépendances React sont conservées dans [le relevé npm](ux-mobile-dependencies-2026-09-24.json). Elles ont été obtenues directement auprès du registre le 24 septembre 2026. Une publication récente est un signal, pas une garantie de maintenance ; une plage `peerDependencies` compatible n’est pas un test d’intégration. Aucun paquet n’a été installé ou mis à jour.

### Visualisation

| Solution | Apport concret / source officielle | Place recommandée |
|---|---|---|
| **HTML/CSS/SVG + React existant** | Contrôle exact des petits visuels et des interactions ; sémantique et clavier à réaliser. | Premier comparateur pour intervalles, matrice courte, stock et programme simple. Pas une obligation de tout faire maison. |
| **Recharts 3.10.1 — MIT** | Séries React, compositions et [navigation clavier](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility), activée par défaut depuis v3. | Déjà installé. Bon point de départ pour courbes et vues liées. Les légendes, valeurs manquantes et gestes tactiles restent à valider dans la composition. |
| **Apache ECharts 6.1.0 — Apache‑2.0** | Plusieurs rendus, graphiques riches et [sélection assistée des petites marques sur mobile](https://echarts.apache.org/handbook/en/how-to/interaction/coarse-pointer/). [Descriptions ARIA et motifs](https://echarts.apache.org/handbook/en/best-practices/aria/) à configurer. | Candidat sérieux pour des explorations plus complexes. Évaluer sur une vue précise ; description ARIA n’équivaut pas à un éditeur accessible au clavier. |
| **visx / XYChart 4.0.0 — MIT** | [Primitives React fondées sur D3](https://github.com/airbnb/visx) pour composer une représentation sur mesure ; React 18/19 déclarés. | Utile si la liaison graphique/contrôle devient difficile avec Recharts. Davantage de composition et d’accessibilité à prendre en charge. |
| **D3** | [Modules de visualisation sur mesure](https://d3js.org/) : échelles, formes, transformations et interactions à assembler. | Option pour une représentation inhabituelle ; laisser React gérer les éléments qu’il possède et utiliser les calculs D3 explicitement. Plus de travail de composition qu’un catalogue de graphiques. Version non relevée dans le snapshot. |
| **Observable Plot 0.6.17 — ISC** | Marques, facettes et [inspection au pointeur avec épinglage](https://observablehq.github.io/plot/interactions/pointer). | Très bon outil d’exploration et de prototypes ; pas un éditeur métier prêt à l’emploi. Dernière publication `latest` observée : février 2025. |
| **Vega‑Lite 6.4.3 — BSD‑3‑Clause** | Spécifications déclaratives et [sélection liée entre graphiques](https://vega.github.io/vega-lite/examples/interactive_layered_crossfilter.html). | Intéressant pour analyses coordonnées ; plus de moteur et d’intégration pour quelques jauges. Tester explicitement le tactile. |
| **Nivo core 0.99.0 — MIT** | [Catalogue React de graphiques](https://nivo.rocks/) ; React 19 déclaré par le paquet core. | À comparer pour un besoin particulier de matrice ou graphique prêt à composer ; pas de migration globale justifiée ici. Le module retenu exige son propre contrôle. |
| **Highcharts 13.1.1 — licence éditeur** | [Module d’accessibilité](https://www.highcharts.com/docs/accessibility/accessibility-module) et large catalogue. | Option commerciale à considérer si support et fonctionnalités précises justifient le coût. Les [conditions d’utilisation](https://www.highcharts.com/license) doivent correspondre à l’application. |

Aucun chiffre de poids gzip ajouté n’est annoncé : ni la taille npm ni le poids promotionnel d’un module ne mesure son impact dans le bundle de L’Affinée. Ce coût doit être mesuré avec les imports réels et le chargement différé du prototype.

### Contrôles et interaction

| Solution | Apport / source | Décision proposée |
|---|---|---|
| **React Aria Components 1.21.1 — Apache‑2.0** | Contrôles non imposés visuellement, locale, focus et clavier ; [NumberField](https://react-aria.adobe.com/NumberField). | Premier candidat à comparer si un contrôle actuel a un vrai défaut d’accessibilité ou de comportement. Le comportement par défaut `snap` peut borner/arrondir : préserver la saisie métier et choisir la validation appropriée. |
| **Base UI 1.8.0 — MIT** | [Number Field avec zone de glissement](https://base-ui.com/react/components/number-field), pas fins/larges ; [Drawer](https://base-ui.com/react/components/drawer) avec positions d’arrêt et prise en compte du clavier logiciel. | Deux essais ciblés : réglage sans piste permanente et feuille compacte pour l’action courante. Comparer la feuille à un `<dialog>` natif si les positions et gestes ne sont pas utiles. Contrôler bornage, valeur vide et conservation du brouillon. |
| **Radix Primitives — MIT** | [Slider multi-poignées et clavier](https://www.radix-ui.com/primitives/docs/components/slider) ; autres primitives de dialogue et sélection. | À retenir pour un composant manquant précis. Choisir une famille cohérente, sans empiler trois systèmes concurrents. |
| **dnd‑kit — MIT** | [Outils de déplacement et tri](https://dndkit.com/) avec architecture spécialisée. | Pour un vrai programme ou tableau réordonnable. Distinguer `@dnd-kit/react` 0.5.0 et l’API de `@dnd-kit/core` 6.3.1 : exemples et paquets ne sont pas interchangeables. |
| **Motion — MIT** | [Gestes et déplacement](https://motion.dev/docs/react-gestures), déjà présent en 13.2.0. | Réutiliser pour indiquer une conséquence, accompagner une ouverture ou une réorganisation. Une animation ne fournit pas toute la logique d’un tri accessible. |
| **@use-gesture/react 10.3.1 — MIT** | [Reconnaissance de gestes](https://use-gesture.netlify.app/docs/gestures/) configurables. | Option si Motion et Pointer Events ne suffisent pas. Publication `latest` observée en mars 2024 : ne pas la qualifier de récemment publiée. |
| **Floating UI React 0.27.20 — MIT** | Placement des éléments flottants et comportements tels [fermeture au clavier / extérieur](https://floating-ui.com/docs/usedismiss). | Bon candidat pour aide ancrée ou éditeur contextuel difficile à positionner près du clavier mobile. Ne règle pas seul la navigation et la sauvegarde. |
| **cmdk / Fuse.js / React Virtuoso** | Recherche de commandes, recherche textuelle et listes longues, déjà présentes. | Mieux exposer recherche/facettes et sélection courte avant de remplacer le socle. |

Les contrôles numériques existants protègent les décimales françaises et les entrées incomplètes. Une démonstration externe séduisante ne justifie pas de perdre cette propriété.

Deux points vérifiés lors de la synthèse : la plage React `^19.0.0-rc.1` déclarée par React Aria accepte bien React stable 19.2.8 selon SemVer ; ce n’est pas une incompatibilité en soi. Pour Motion, [la politique `reducedMotion` vaut `never` par défaut](https://motion.dev/docs/react-motion-config) : respecter le réglage système demande une configuration explicite telle que `user` et un contrôle du rendu.

### Organisation, planning et schémas

| Solution | Apport / source | Limite pour L’Affinée |
|---|---|---|
| **React Flow 12.12.0 — MIT** | [Nœuds, liens, clavier, focus et annonces](https://reactflow.dev/learn/advanced-use/accessibility). | Pour une installation ou un procédé réellement éditable ; trop de navigation pour simplement consulter trois étapes fixes. |
| **FullCalendar React 7.1.0 — MIT pour le paquet standard** | Agenda et intégration React. Les [vues de ressources / timeline](https://fullcalendar.io/docs/premium) relèvent des plugins Premium à licence distincte. | Une vue de cuves exige les affectations de ressources et dates connues ; calendrier liste/jour à privilégier sur téléphone. |
| **vis-timeline 8.5.4 — Apache‑2.0 ou MIT** | [Frises, groupes et manipulation temporelle](https://visjs.github.io/vis-timeline/docs/timeline/). | Candidat à comparer à une frise simple quand zoom, groupes et longs programmes sont vraiment utiles ; cycle React et accessibilité à éprouver. |
| **TanStack React Table 9.2.4 — MIT** | [Logique de tables sans habillage imposé](https://tanstack.com/table/latest). | Utile pour un catalogue riche en tri, filtres et comparaisons. La bibliothèque ne dessine pas une bonne vue mobile à notre place. |
| **AG Grid Community 36.2.0 — MIT** | [Grille et distinction Community / Enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/). | Peut convenir à une gestion de bureau dense ; ne pas transposer une grille desktop entière à la cuverie. Fonctions premium à vérifier selon le besoin exact. |
| **Mermaid 12.0.0 — MIT** | [Diagrammes décrits en texte](https://mermaid.js.org/). | Très utile dans les explications et documents ; peu adapté à une saisie quotidienne directe de mesures. |

Ces solutions peuvent fonctionner avec des données locales si elles sont intégrées et servies localement. Cela ne rend pas automatiquement hors ligne les sources, images, modèles de scan ou services externes : prévoir leur disponibilité et éprouver une session sans réseau.

## Ce que le téléphone permet réellement

| Possibilité | Intérêt ici | Limite attestée |
|---|---|---|
| Écran maintenu allumé | Suivre la cuverie sans retoucher l’écran avec les mains occupées. | [Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) exige un contexte sûr et un document actif ; le système peut le libérer. Le code le prévoit déjà. Ce n’est pas une garantie d’alarme en arrière-plan. |
| Scan local | Retrouver cuve, fût ou lot sans saisie longue. | [BarcodeDetector](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) a une disponibilité limitée. [ZXing Browser](https://github.com/zxing-js/browser) est une option à évaluer, mais son [moteur ZXing JS se déclare en maintenance seule](https://github.com/zxing-js/library), sans développement actif planifié. Une publication récente du wrapper ne suffit donc pas à en faire le choix par défaut. Caméra, autorisation et ressources locales restent nécessaires. |
| Retour haptique | Retour supplémentaire après un geste ou une alarme. | [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) n’est pas disponible partout, notamment pas comme socle Safari iOS. Toujours un retour visuel ; le dépôt l’emploie déjà pour les alarmes. |
| Dictée | Saisie de notes mains occupées, si l’environnement le permet. | [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) reste de disponibilité limitée et peut utiliser un service distant. Ne pas promettre du français hors ligne sur tous les appareils ; relire nombres et unités. |
| Glissement et déplacement | Réordonner ou explorer rapidement. | Le [critère WCAG sur le glisser](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) demande une solution utilisable avec un pointeur sans glisser, hors exceptions. Ajouter seulement le clavier ne règle pas ce besoin tactile. |
| Commandes compactes | Conserver les données utiles visibles. | Le [minimum WCAG 2.2 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) est 24 × 24 px CSS ou exceptions. Ce n’est pas une consigne d’agrandir toute l’application ; vérifier chaque cible et son espacement, puis le geste réel. |

Une étude exploratoire de 2024 portant sur treize interactions et douze participants souligne notamment l’inspection précise, la découverte des gestes, la manipulation à une main et le retour à l’état précédent. C’est une inspiration de conception, pas une preuve de vitesse pour cette brasserie. Elle incite à essayer la lecture épinglée et une navigation simple entre points, sans copier les gestes de secousse ou imposer deux doigts. [Article de Snyder et collègues](https://arxiv.org/html/2404.11602v1).

## À écarter comme réponses automatiques

- Des radars pour tout : la silhouette d’un profil a son utilité, mais plusieurs polygones superposés ne facilitent pas forcément la lecture d’un petit écart.
- Des jauges circulaires, donuts ou pictogrammes partout : ils peuvent consommer plus d’espace que les valeurs qu’ils expliquent. La relation ou l’action doit justifier la forme.
- Un menu radial ou un geste caché pour les commandes indispensables : options à essayer dans un contexte particulier, pas nouvelle navigation par défaut.
- L’appui long comme unique accès, le glissement comme unique validation, la vibration comme seule confirmation, ou un survol nécessaire sur téléphone.
- Une « carte des goûts » qui transforme des adjectifs fabricant en coordonnées chiffrées ou attribue une note de qualité globale sans modèle.
- Une grosse bibliothèque de grilles, un éditeur de nœuds ou un calendrier de ressources ajouté avant d’avoir le besoin et les données.
- Une animation permanente ou un nouveau parcours qui dépend du réseau pour chaque réglage.

## Ressources pour continuer à élargir les choix

- [From Data to Viz](https://www.data-to-viz.com/) : arbre de choix selon la structure des données et limites des représentations. Utile pour produire deux alternatives pertinentes avant de coder.
- [Visual Vocabulary du Financial Times](https://ft-interactive.github.io/visual-vocabulary/) : vocabulaire visuel par intention de lecture ; ressource d’inspiration, pas bibliothèque mobile.
- [Exemple de vues liées Vega‑Lite](https://vega.github.io/vega-lite/examples/interactive_layered_crossfilter.html) : rend concret le lien entre sélection graphique et données correspondantes.
- [Manipulation directe, Nielsen Norman Group](https://www.nngroup.com/articles/direct-manipulation/) : intérêt du retour immédiat et réversible, avec les limites de précision et de répétition.

## Vérifications et portée

Cette recherche ne modifie aucun composant de l’application, aucune dépendance et aucune donnée réelle. Les nouveaux fichiers sont le présent rapport, un relevé public de métadonnées npm et des exemples de conversation avec données fictives.

Les quatre missions indépendantes ont terminé avec GPT‑6 Luna et l’effort Max : visualisations ; interactions ; organisation opérationnelle ; mobile et accessibilité. Le parent a confronté leurs propositions au code et aux sources primaires, puis corrigé les écarts de synthèse : fonctionnalité financière déjà présente, interprétation de SemVer, versions npm plus récentes que certaines pages de releases et statut de maintenance du moteur de scan.

Les exemples interactifs montrent quatre mécanismes : profils avant/scénario avec cible, frise liée à un réglage exact, stock libre/réservé avec manque, matrice avec inconnues. Ils n’utilisent aucun calcul scientifique de substitution et ne sauvegardent rien dans la brasserie.

Contrôles réellement effectués dans le navigateur intégré : consultation des vues Levure et Eau à 390 et 1280 px ; sélection d’une levure du stock de test ; passages entre étapes ; examen des captures. Pour les exemples : changement de scénario, sélection d’un palier, ajout d’un jour et décalage observé, durée vide refusée puis corrigée, dépassement du stock libre, sélection d’un critère et inconnue conservée. Pas d’erreur ni d’avertissement dans les journaux consultés de ces deux pages.

Ces contrôles n’établissent pas la conformité globale, la performance des bibliothèques non installées, une validation VoiceOver/TalkBack, le comportement sur un iPhone physique ou le geste avec gants et mains mouillées. Ils ne constituent pas une comparaison avant/après d’une refonte : aucune refonte de l’application n’a été réalisée.

Pour retenir un premier changement, faire jouer la même décision avec deux représentations, sur une donnée normale, une inconnue et une erreur. Comparer réussite de l’action, erreurs, retours en arrière, précision et effort de navigation. Compter moins de lignes de texte ne suffit pas ; le critère est que le brasseur comprenne et termine mieux son action.
