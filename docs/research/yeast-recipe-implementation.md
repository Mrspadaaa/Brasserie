# Levures : du style à une conduite de recette

Implémentation et recherches du 12 septembre 2026. L’étape Levure commence maintenant par le style de bière, propose une sélection de souches adaptées, puis permet de préparer et comparer leur conduite sur les données réelles de la recette.

La recherche complète est répartie entre [bières de blé, banane et girofle](yeast-wheat-style-evidence.md) et [cas de brasserie, houblons et autres fermentations](yeast-hop-practical-evidence.md). Ces dossiers donnent les sources primaires, les conditions des essais, les résultats contradictoires et les limites retenues pour l’application.

## Ce que le brasseur peut faire

| Besoin | Outil livré | Résultat utile |
| --- | --- | --- |
| Choisir une souche pour sa bière | Filtre par style, comparatif des laboratoires et filtre sèche/liquide | 24 références documentées dans 9 familles ; Weissbier, Witbier et blé américain sont séparés. Trois lignes d’abord, sélection complète à la demande. |
| Orienter une Hefeweizen vers banane ou girofle | Objectif dans le style, température avec curseur et fenêtre fabricant, contre-pression, repos férulique | Les effets attendus et les informations manquantes changent avec les réglages. Une proposition d’essai reste distincte de son application. |
| Comparer un autre laboratoire | Descriptions sourcées et raisons de comparer chaque candidate | Le choix conserve le contexte du style et montre les différences de température, d’atténuation et de dose documentées, sans prétendre que deux produits sont équivalents. |
| Préparer la quantité de levure | Plage de masse sèche au volume, marqueur de quantité, calculateur de cellules pour une référence liquide | La quantité prévue est située sous, dans ou au-dessus du repère fabricant. Le calcul cellulaire exige un taux explicite ; aucun nombre de flacons n’est inventé. |
| Anticiper la finale | Comparaison visuelle des plages de densité finale et indication d’alcool | Les intervalles utilisent un axe numérique commun. Ils restent des enveloppes documentaires dépendant de la DI et de l’atténuation, avec une confiance faible. |
| Relier levure et houblonnage | Tableau des ajouts à cru avec g/L, jour, phase biologique, contact et température | Le brasseur distingue fermentation active, ajout après fermentation et phase inconnue, puis rejoint directement l’étape Houblons pour corriger les données. |
| Voir les conséquences avant de décider | Tableau recette → scénario et courbe des températures | La souche, la quantité, les consignes et l’ajout éventuel d’un repos sont visibles avant application. La garde et les ingrédients restent conservés. |
| Revenir sur son choix | Réinitialisation, conservation de l’intention, variante locale d’une recette enregistrée | Les essais ne sont pas enregistrés tant que la recette ne l’est pas. Une variante de consultation se ferme sans modifier la recette sauvegardée. |

## Trois parcours concrets

### Hefeweizen : comparer banane et girofle

Une recette de 20 L avec Wyeast 3068 retrouve automatiquement la famille Weissbier. Le brasseur choisit ensuite Équilibre, Banane ou Girofle, et peut comparer notamment WLP300 et WLP380. White Labs décrit une orientation davantage banane pour WLP300 et davantage épicée pour WLP380. Ce sont des motifs de comparaison, pas un classement sensoriel universel : les essais de brassin partagé examinés dans la recherche ne donnent pas toujours la même hiérarchie. [WLP300](https://www.whitelabs.com/yeast-single?id=148&type=YEAST), [WLP380](https://www.whitelabs.com/yeast-single?id=151&type=YEAST).

Pour 3068, l’essai girofle proposé prépare une consigne de 18 °C et un repos férulique de 44 °C pendant 15 minutes. La température se situe dans la fenêtre Wyeast ; le repos est ajouté seulement avant un palier de saccharification existant et sans doublon. Le couple 44 °C / 15 min est une proposition éditoriale de L’Affinée. La recherche soutient le levier d’un repos vers 43–45 °C, mais ne fournit pas un gain de girofle calculable pour ce moût. [Wyeast 3068](https://wyeastlab.com/product/weihenstephan-weizen/), [Lallemand, Wheat Beer Solutions](https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Wheat-Beer-Solutions-BP-ENG-digital-LalBrew.pdf).

L’interface explique aussi que diminuer les esters peut rendre le girofle plus perceptible sans augmenter nécessairement le 4-VG. La pression est un autre levier conditionnel : son effet dépend de la souche et des conditions ; aucun coefficient « par bar » n’est appliqué. Le zéro signifie explicitement l’absence de contre-pression ; un champ vide signifie une information inconnue. [Souffriau et al., 2022](https://journals.asm.org/doi/10.1128/aem.00814-22).

### Hazy IPA : dose et contact avec les houblons

Le parcours vérifié utilise Verdant, 20 L de moût, 60 g de Citra en fermentation active et 40 g de Mosaic à J+8 sans phase renseignée. Le total est de 5 g/L à cru. Le deuxième ajout reste « À préciser » : un jour du calendrier ne démontre pas une fin de fermentation. Après correction dans l’étape Houblons — phase après fermentation, contact de 24 h à 18 °C — le tableau Levure reflète immédiatement ces valeurs.

Le repère sec de Verdant, 50–100 g/hL, devient 10–20 g pour 20 L au fermenteur. Une saisie de 8 g apparaît sous cette plage ; 15 g apparaît dedans. Cela ne constitue pas un conseil de sous-ensemencement pour obtenir davantage d’esters. [Lallemand, Verdant IPA](https://www.lallemandbrewing.com/en/united-states/products/lalbrew-verdant-ipa/).

Les conseils distinguent contact avec la levure, pertes possibles pendant la fermentation et reprise de fermentation après houblonnage. Ils demandent de recontrôler densité et diacétyle après le dernier ajout. L’intensité fruitée n’est pas dérivée de l’activité β-lyase : l’essai pilote de Samia et collaborateurs montre précisément que thiols mesurés et fruité perçu peuvent diverger. [Brewers Association, Hop Creep](https://cdn.brewersassociation.org/wp-content/uploads/2020/05/Hop-Creep-%E2%80%93-Technical-Brief.pdf), [Samia et al., 2024](https://brewingscience.de/index.php/brewingscience/article/download/241/150/416).

### Recette incomplète ou style personnel

Un style inconnu ne devient pas automatiquement une ale neutre. Le brasseur choisit une famille de comparaison ou utilise la saisie libre et le stock. Une sélection sans référence documentée pour la forme demandée affiche un état vide explicite.

Sans DI, la densité finale et le besoin cellulaire restent indisponibles. Sans température principale, le curseur n’affiche pas une fausse position. Si le brasseur applique ensuite un scénario Weissbier / Banane à son style personnel, cette intention est conservée à la réouverture ; une modification ultérieure du style réel est détectée.

## Interactions et conservation des données

Le moteur est local et ne dépend d’aucune requête à un modèle. Il lit le style, le volume, la DI, la référence de levure, les fermentescibles, les paliers d’empâtage, le programme de fermentation et les ajouts de houblon.

L’application est explicite : choisir seulement la souche ou reprendre les réglages du scénario. L’étape Paliers reçoit le repos proposé et les consignes adoptées ; Houblons et Paliers affichent un rappel de la conduite de levure. Les données d’eau, les ajouts d’ingrédients et la garde sont conservés. Les anciennes prédictions liées à des réglages remplacés sont invalidées. La fiche enregistrée et le format d’export/import texte conservent l’intention du scénario.

Le programme détaillé reste éditable pour chaque phase. Dans le formulaire de création, l’ancien sélecteur guidé par goût et ses estimations historiques ne doublent plus le nouveau comparatif. Les anciennes recettes restent lisibles et les références saisies par l’utilisateur ne sont pas remplacées par le catalogue embarqué.

## Vérification

- **94 tests pertinents** : 45 cas du moteur, 3 cas de références, 7 cas de transfert, 12 cas du nouvel atelier, 15 régressions d’édition et 12 régressions de l’atelier historique. Les parcours touchés ont été rejoués après les corrections de finition.
- **Chrome réel**, application React compilée avec adaptateurs locaux : téléphone à 375, 320 et 430 px, puis ordinateur à 1280 px. Comparaison entre laboratoires, clavier, saisies invalides puis corrigées, pression, repos férulique, navigation, enregistrement, rechargement et variante sans écriture.
- **États complémentaires à 375 px** : houblonnage avec phase inconnue puis corrigée, dose sous la plage puis dans la plage, style inconnu, sélection vide et recette sans DI ni programme.
- **Revue visuelle** : captures avant/après réellement ouvertes et examinées ; les trois colonnes du comparatif se réorganisent lorsque le texte agrandi manque de place. Contrôle du focus, des unités, des commandes et de l’espace pris par l’en-tête. Les deux commandes du titre utilisent 28 px.
- **Calculs scientifiques existants** : vérification hors ligne réussie, aucun appel IA payant. Les essais du navigateur bloquent les requêtes externes et n’écrivent dans aucun compte réel.
- **Build de production** : réussi après intégration des modifications simultanées de l’écran Clients ; TypeScript, Vite et vérification d’exclusion des recherches privées réussis. Les avertissements existants de taille des bundles et d’imports dynamiques restent présents.

Captures conservées : [choix par style](yeast-recipe-evidence/choix-375.png), [scénario girofle et programme](yeast-recipe-evidence/scenario-375.png), [contacts des houblons](yeast-recipe-evidence/houblons-375.png), [quantité et plage fabricant](yeast-recipe-evidence/dose-375.png), [comparatif avec texte agrandi](yeast-recipe-evidence/zoom-320.png). La dernière exécution a produit 31 captures et aucune erreur JavaScript, aucun débordement de page ni aucune commande hors écran détectés.

Reproduction : `node scripts/check-yeast-recipe-ui.mjs` compile l’application isolée, exécute les parcours et écrit les captures avec `after.json` dans le dossier temporaire `laffinee-yeast-design-evidence`. Le plugin de navigateur n’étant pas disponible, ce contrôle utilise le runtime Puppeteer déjà présent dans le dépôt et Chrome installé sur Windows. Le script ferme son navigateur et son serveur à la fin.

## Limites assumées

La sélection est documentée, mais n’est pas un catalogue exhaustif : certaines familles, dont les ales belges, ont encore peu de références comparées. La saisie libre reste disponible. Une fiche fabricant contradictoire ne produit pas de plage recomposée arbitrairement.

Les effets aromatiques sont qualitatifs. Il n’existe ici ni courbe calibrée d’intensité banane/girofle, ni prédiction universelle des thiols, ni date de fin de fermentation calculée. Les durées servent au programme. Les plages de DF/alcool restent indicatives ; aucune valeur ne remplace les mesures du brassin. La quantité sèche ne suppose pas une masse de sachet ; le calcul liquide ne suppose pas la viabilité, un nombre de flacons ou un volume de levain.

Cette livraison modifie le dépôt local ; aucun déploiement n’a été effectué.
