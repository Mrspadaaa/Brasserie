# Levure — recherche des représentations et outils

Consultation des documentations officielles : 24 septembre 2026. Ces pistes
préparent la conception ; aucune bibliothèque nouvelle n'est encore installée
et aucun prototype n'est déclaré validé. Les choix finaux restent ouverts.

## Commencer par la question, pas par le graphique

| Question du brasseur | Approches à confronter dans un prototype | Preuve attendue |
| --- | --- | --- |
| Où trouver ma levure ou celle d'une recette ? | Recherche unique toujours repérable, code/fabricant/alias, suggestions discriminantes, séparation référence source/offres locales | Depuis Levure, un geste permet de saisir ou d'ouvrir la recherche ; pas de panneau préalable. Une référence hors catalogue local reste trouvable. |
| Quelle alternative puis-je réellement acheter ? | Comparaison de candidats liés à leurs offres et conditionnements, écarts mis en évidence, filtres utiles au moment du choix | Le brasseur distingue compatibilité métier, disponibilité et transport sans ouvrir chaque dossier ; une rupture ne ressemble pas à une incompatibilité. |
| Qu'est-ce qui change dans MA bière ? | Comparaison avant/essai sur axes communs, plages documentées, différences adjacentes au réglage ; comparaison alignée ou petits multiples | Il identifie ce qui évolue, ce qui reste identique et ce qu'on ne sait pas prédire ; les valeurs précises restent accessibles. |
| Sur quoi puis-je agir pour changer le profil ? | Contrôle accompagné de sa conséquence ; relation visuelle réglage → effets documentés ; programme temporel directement manipulable si cela aide | Les variables réellement disponibles et leurs dépendances sont explicites ; un réglage sans modèle ne produit pas une fausse courbe de goût. |
| Pourquoi Gemini propose-t-il cette correction ? | Différence par champ, source et état de validation proches de l'action ; détail de preuve à la demande | Ancienne/nouvelle valeur, portée et sauvegarde compréhensibles ; les corrections ne sont pas noyées dans un message de chat. |

La liste n'est pas un catalogue fermé. Pour les choix structurants, produire
des alternatives réellement différentes et essayer celles qui semblent les
plus adaptées avec le même cas métier. Un autre arrangement de cartes ne
constitue pas nécessairement une alternative de conception.

## Outils évalués et critères de choix

| Outil | Capacité établie par sa documentation | Intérêt possible / limite à éprouver |
| --- | --- | --- |
| HTML/CSS/SVG et composants React du dépôt | Éléments et interactions contrôlés par l'application ; aucune dépendance ajoutée | Bon candidat pour relations qualitatives, écarts précis et petits visuels composés. Clavier, annonces et interactions restent à implémenter et tester ; « maison » ne garantit pas la simplicité. |
| Recharts, déjà installé | [Couche d'accessibilité](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility) avec navigation clavier ; active par défaut en v3 | Premier candidat pour séries et intervalles quantitatifs quand il convient. Vérifier le comportement réel de la composition et du tactile ; un tooltip au survol ne suffit pas sur téléphone. La présence dans le projet ne lui donne pas priorité sur un meilleur résultat. |
| visx | [Primitives React modulaires fondées sur D3](https://github.com/airbnb/visx), composition personnalisée | À tester si les interactions ou formes importantes sont difficiles avec Recharts. Plus de travail pour composer axes, focus, interactions et sémantique ; importer seulement les modules utiles et mesurer le coût réel. |
| Observable Plot | [Marques, échelles, facettes](https://observablehq.github.io/plot/) et [interaction de pointeur](https://observablehq.github.io/plot/interactions/pointer) | Bon candidat de prototype pour comparer plusieurs séries, intervalles ou petits multiples. Intégration au cycle React, édition directe, tactile et clavier à valider ; un joli explorateur au pointeur n'est pas automatiquement un contrôle métier. |
| Apache ECharts | [Rendus Canvas/SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/) et [support ARIA/motifs](https://echarts.apache.org/handbook/en/best-practices/aria/) | À envisager pour une interaction ou un volume qui le justifie. Configuration ARIA explicite et imports ciblés nécessaires ; l'étiquette descriptive ne prouve pas l'accessibilité d'un éditeur. Mesurer coût et bénéfice avant ajout. |
| Combobox native du dépôt / primitives accessibles | [Pattern WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) : valeur, suggestions et commandes clavier | Comparer le sélecteur actuel à ce contrat. Une bibliothèque de contrôle devient utile si elle règle un défaut réel, pas pour changer l'habillage de chaque champ. |

La sélection est une hypothèse d'ingénierie, pas un benchmark effectué. La prochaine
session compare le coût gzip et de chargement, les interactions et la maintenance
sur son prototype ; elle vérifie licence, compatibilité React 19, activité et
version effectivement installable avant d'ajouter une dépendance. Ne pas installer
toutes ces bibliothèques « au cas où » ni ajouter un service externe obligatoire.

## Outils de conception et de revue

Faire une maquette interactive courte avec fixtures locales pour les décisions
difficiles. Le navigateur permet d'éprouver sélection, saisie, comparaison et
reprise. Des croquis ou maquettes générées peuvent aider la divergence visuelle,
mais ne prouvent ni le modèle métier ni la persistance. Un schéma de relations
peut rendre une conséquence qualitative compréhensible sans la convertir en
pourcentage. Les composants existants sont une boîte à outils, pas le plan d'écran.

Claude reçoit un dossier ciblé : mission, contraintes métier/design pertinentes,
matrice des champs, options et captures choisies. Il critique surtout hiérarchie,
moment d'affichage, geste et pertinence de représentation. Sol réalise les
explorations de code et prototypes ; Luna relève les incohérences, cas inconnus
et défauts de parcours. Astra arbitre et vérifie le résultat intégré.

Une revue positive doit dire ce que le brasseur arrive à décider ou régler.
Pour chaque champ/action, conserver une ligne de décision vérifiable. L'agent
rejoue des scénarios et donne les preuves ; seule une vraie séance avec le
brasseur autorise à parler d'une validation utilisateur.

## Fidélité et performance

- Une intensité sensorielle qualitative ne devient pas une donnée 0–100 pour
  alimenter un radar. Ne pas interpoler des goûts, ester/pression/température
  ou durées sans relation documentée applicable à la souche, la forme et au moût.
- Distinguer effet de souche, effet de procédé, estimation de recette et mesure.
  La référence fabricant d'atténuation n'est pas une mesure de la bière future.
- Les axes et unités d'une comparaison restent communs ; les valeurs absentes
  restent inconnues. Rendre les différences pertinentes visibles, sans prétendre
  que toutes les souches sont interchangeables.
- Une seule source de données pour contrôles, visuels, calculs et sauvegarde.
  Exploration locale sans appel IA à chaque saisie ; recherche distante explicite,
  révision capturée et annulation des réponses devenues obsolètes.
- Charger les gros dossiers/graphes à l'usage et mesurer les calculs responsables.
  Définir une cible de réponse locale avant l'implémentation, puis mesurer le
  p95 sur un banc décrit. Rapporter séparément latence IA/réseau et interactions
  locales ; ne pas annoncer un gain sans mesure comparable.
- Parcours nominal sur un mobile et un desktop (390 et 1280 px par défaut), avec
  clavier, noms longs, erreurs et reprise. Une largeur supplémentaire doit résoudre
  une incertitude réelle. Le zoom reste vérifié comme interaction, sans prétendre
  qu'un simple redimensionnement est un essai de zoom natif.
