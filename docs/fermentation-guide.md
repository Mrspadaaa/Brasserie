# Atelier de levure — Weissbier, banane et girofle

État des sources vérifiées le 8 septembre 2026. Ce module aide à choisir une souche et une conduite de fermentation dans la recette. Il ne prédit pas une concentration d’ester, un score de banane ou un optimum universel. Les propositions doivent ensuite être confrontées aux densités et aux dégustations du brasseur.

## Ce qui est documenté

| Souche | Lecture utile pour le brasseur | Fermentation fabricant | Quantité sèche fabricant |
| --- | --- | --- | --- |
| [White Labs WLP300](https://www.whitelabs.com/yeast-single?id=148&type=YEAST) | Profil orienté banane, girofle également présent ; pas de classement entre fabricants. | 20–22 °C | Non applicable : cellules viables à connaître. |
| [Wyeast 3068](https://wyeastlab.com/product/weihenstephan-weizen/) | Banane/girofle ; le fabricant décrit une modulation des esters par température et ensemencement. Attention au volume libre. | 18–24 °C | Non applicable : cellules viables à connaître. |
| [LalBrew Munich Classic](https://admin.lallemandbrewing.com/wp-content/uploads/2023/05/TDS_LPS_BREWINGYEAST_MUNICHCLASSIC_ENG_A4-5.pdf) | Option sèche, esters et phénols documentés, POF+. Le résultat annoncé en quatre jours à 20 °C concerne le moût standard Lallemand. | 17–25 °C | 50–100 g/hL |
| [Fermentis SafAle W-68](https://fermentis.com/en/product/safale-w-68/) | Banane, fruit et girofle/poivre. Pas d’optimum banane publié dans cette fiche. | 18–26 °C | 50–80 g/hL |

Ces fiches ne donnent pas toutes une date de publication. Leur année reste `null`, distincte de la date de consultation. Les températures autorisées pour verser directement W-68 ne sont pas la fenêtre de fermentation. La fiche Munich Classic consultée indique 17–25 °C ; une [ancienne version datée Oct 2020](https://connect.lallemandbrewing.com/wp-content/uploads/2021/02/TDS_LPS_BREWINGYEAST_MUNICHCLASSIC_ENG_A4.pdf) indique 17–22 °C. Ne pas transformer l’année contenue dans une URL en année bibliographique. Les programmes proposés ici restent aussi dans l’ancienne plage.

## Pourquoi les conduites diffèrent

La banane est principalement associée à l’acétate d’isoamyle, un ester. Le girofle est associé au 4-vinylgaïacol, un phénol. La capacité de libération des thiols du houblon est distincte ; elle reste inconnue pour ces quatre références dans l’index.

[Lallemand, Precision Flavor Through Fermentation Control (2025)](https://www.lallemandbrewing.com/en/global/resources/whats-new/precision-flavor-through-fermentation-control/) conseille, pour favoriser la banane sans augmenter autant le girofle, de jouer sur une dose plus basse et une température modérée. Ce conseil ne justifie ni carence volontaire, ni sous-ensemencement extrême. Il ne se transpose pas en coefficient universel à toutes les souches.

[Wheat Beer Solutions, Lallemand](https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Wheat-Beer-Solutions-BP-ENG-digital-LalBrew.pdf) présente notamment des essais à deux températures et deux doses sur un moût donné. Le document relie aussi le repos férulique au précurseur du girofle. Son extraction graphique n’a pas été assez fiable pour importer les hauteurs des barres comme des mesures. L’accès direct au PDF a été bloqué lors de cette vérification ; les passages indexés et le texte fabricant de 2025 permettent une recommandation qualitative seulement. Aucune concentration lue approximativement sur un graphique n’alimente le modèle.

[Souffriau et al. (2022), DOI 10.1128/aem.00814-22](https://doi.org/10.1128/aem.00814-22) étudient l’inhibition de production d’acétate d’isoamyle sous CO₂. L’effet varie selon la souche ; le rapport ester/alcool n’est pas équivalent à l’intensité sensorielle de banane. L’étude ne fournit pas de facteur numérique applicable à WLP300, 3068, Munich Classic ou W-68. Le conseil de conduite reste qualitatif : éviter une contre-pression volontaire pour rechercher les esters, sans compromettre les instructions de sécurité du fermenteur.

## Propositions éditoriales — à tester

Les chiffres du tableau suivant sont des **choix de L’Affinée datés de 2026**, dans les fenêtres fabricant. Aucune publication citée ne démontre que ces rampes maximisent la banane. Les sources des valeurs sont stockées avec les paramètres, et non remplacées par le nom d’un fabricant qui n’a pas publié ces paliers.

| Objectif banane | Ensemencement et principale proposés | Fin et repos proposés |
| --- | --- | --- |
| WLP300 | 21 °C, plage 20–22 °C | 22 °C, plage 21–22 °C |
| 3068 | 22 °C, plage 21–23 °C | 23 °C, plage 22–24 °C |
| Munich Classic | 20 °C, plage 18–20 °C | 21 °C, plage 20–22 °C |
| W-68 | 21 °C, plage 20–22 °C | 22 °C, plage 21–23 °C |

Un second objectif propose un point de départ modéré pour l’équilibre banane/girofle. Il ne promet aucun ratio sensoriel. Pour les deux objectifs, la principale est planifiée sur 4–7 jours (consigne initiale 5), puis la fin et le repos sur 2–3 jours (consigne initiale 3). Ces plages sont volontairement communes faute de mesures comparables, **pas une estimation de cinétique spécifique à chaque levure**. Un budget de 6–10 jours est donc proposé ; il peut être dépassé.

La transition s’appuie sur le ralentissement de fermentation et une densité approchant sa fin attendue. Le conditionnement exige une densité finale cohérente et stable, ainsi qu’une dégustation satisfaisante. La stabilité seule ne distingue pas une fermentation finie d’une fermentation bloquée. Un palier final plus chaud n’est pas présenté comme une création garantie d’esters. Aucun calendrier n’autorise à lui seul le conditionnement.

## Calculs et limites

- `grammes = (g/hL) × volumeL / 100`, appliqué aux deux bornes de la dose fabricant. Le facteur 100 est une conversion d’unité. La plage obtenue conserve sa source et une confiance réduite quand sa date est inconnue. Elle n’intègre pas la densité, la nutrition ou la viabilité.
- `durée minimale = somme des minima`, `durée maximale = somme des maxima`. C’est l’enveloppe de planification de phases successives, sans hypothèse d’indépendance et sans couverture probabiliste. Ce n’est pas un intervalle de confiance à 95 %.
- La courbe montre les consignes choisies et leur plage de réglage proposée. Aucun tracé de densité ni de concentration aromatique n’est fabriqué.
- Ni la moyenne de l’atténuation fabricant, ni un nombre de sachets/flacons ne sont imposés. Une quantité non renseignée utilise la convention existante `qty: 0`, affichée « À renseigner » sur la fiche.
- Les paramètres de programme personnalisés restent des décisions du brasseur. Leur modification ne transforme pas les plages proposées en données expérimentales.

## Architecture et usage

`fermentationGuideBootstrap.json`, généré par `scripts/build-fermentation-guide.mjs`, propose quatre guides typés dans **la collection existante `hopKnowledge`**. Le nouveau type `fermentation` contient les profils documentaires, sources, températures, doses et plans ; aucun moteur de règles ou coefficient biologique ne se cache dans le code. Les souches utilisent le type `yeast` existant. Leur statut POF et leur fenêtre rejoignent aussi les contrôles du solver de houblonnage, sans en devenir un calcul de thiols.

Les guides sont disponibles à l’étape Levure et par des raccourcis à la création et dans l’atelier aromatique. La consultation n’écrit rien. « Appliquer cette levure et ces paliers » enregistre les références manquantes puis modifie le brouillon. Une révision déjà enregistrée est prioritaire, y compris désactivée ou invalide ; elle ne provoque jamais le retour silencieux à la proposition initiale. Les révisions modifiées demandent une nouvelle version, y compris lors d’un import. L’Index propose également l’installation explicite de l’ensemble des guides pour leur édition.

La principale et le repos sont remplacés ; les ajouts, la garde et la refermentation sont conservés et leur nouvel ordre est visible avant application. Le choix « levure seulement » préserve le programme. Grains, houblons, eau et ingrédients ne sont pas remplacés. Les anciennes prédictions de houblonnage et leur contexte expérimental sont détachés lors de l’adoption.

La recette conserve une copie du guide, de ses sources et des réglages adoptés. Une modification ultérieure de la souche, de la dose, du volume ou du programme devient visible sur la fiche. La lecture de cette fiche ne crée ni connaissance ni réglage. La copie textuelle d’une recette transporte les étapes concrètes et leurs notes ; les références internes restent dans la sauvegarde de la base. Le guide de fermentation ne fait pas partie des preuves copiées dans une prédiction de houblonnage.

## Ce qui permettrait une véritable prédiction

Il manque une série de brassins avec composition du moût, cellules viables, température réelle dans le temps, pression, oxygénation, extrait, taux d’ensemencement, acétate d’isoamyle et 4-VG mesurés, puis dégustations répétées à âge comparable. Les observations commerciales aident à documenter le résultat sensoriel, mais une levure ou une conduite inconnue ne peut pas être reconstruite avec certitude à partir du goût. Aucun optimum, classement d’intensité ou intervalle statistique par souche n’est annoncé avant cette calibration.

La validation locale couvre provenance, conversion de dose, champs inconnus, révisions, conservation des ingrédients et étapes, copies figées, import/rejeu et consultation en lecture seule. Aucun appel Gemini n’est nécessaire à cet atelier.
