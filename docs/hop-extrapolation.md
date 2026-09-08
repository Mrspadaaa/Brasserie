# Modèle exploratoire houblon × levure × timing

Version initiale : 8 septembre 2026. Public : brasseur de L’Affinée et mainteneur du modèle.

Le simulateur permet d’explorer une combinaison libre et d’appliquer ce scénario pendant la création de recette. Il donne un **indice expérimental de présence sensorielle avec une plage**, par famille. Ce n’est pas une concentration, un rendement enzymatique, une intensité de panel étalonnée ou une probabilité de réussite. La confiance reste faible tant que les hypothèses n’ont pas été confrontées à une validation indépendante.

Les calculs exacts déjà disponibles conservent leur priorité dans leur domaine. Le modèle général remplit les autres axes. Une absence de description n’est jamais convertie en absence d’arôme. Les risques et les concentrations chimiques restent des sorties séparées.

## Ce qui étaye le modèle — et ce qui ne l’étaye pas

| Décision | Preuve consultée | Limite de transposition |
| --- | --- | --- |
| Réponse de dose compressive et différente selon la famille | [Lafontaine et Shellhammer, 2018, DOI 10.1002/jib.517](https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517) : Cascade, un lot de cônes, bière clarifiée, cinq doses de 0 à 16 g/L. Entre 8 et 16 g/L, agrumes sans différence significative mais herbacé/thé en hausse. | Ni plateau universel ni constante universelle de saturation. Nos constantes sont des hypothèses, pas une régression de cette étude. |
| Séparer le profil fermentaire de l’expression du houblon | [Kumar et al., 2023, DOI 10.3390/foods12051064](https://doi.org/10.3390/foods12051064) : Motueka à 5 g/L après ébullition, plusieurs souches, 20 °C. Effets distincts sur alcools terpéniques et acétates ; US-05 et WLP001 ne sont pas dépourvues de transformation. | Un fermenteur par souche, taux d’ensemencement variables ; fréquences sensorielles et abondances analytiques, pas intensités transférables par axe. |
| Ne pas imposer « plus tard = plus de tous les arômes » | [Takoi et al., 2016, BrewingScience 69, 1–7](https://brewingscience.de/index.php/brewingscience/article/download/284/194/505) : 18 variétés à chaud, trois comparées sur plusieurs timings, pellets T90 à 0,8 g/L avec une levure lager interne. | Effets spécifiques aux composés. L’ajout chaud est un extrait traité à 105 °C puis mélangé ; pas un whirlpool domestique identique. |
| Ne pas déduire un axe sensoriel depuis un seul facteur de transfert chimique | [Haslbeck, Minkenberg et Coelhan, 2018](https://doi.org/10.1080/03610470.2018.1483701), également exposé dans la [thèse de Haslbeck, 2022](https://mediatum.ub.tum.de/doc/1634154/1634154.pdf), pp. 68, 80–81 et 96–98 : dose et température affectent différemment myrcène et linalool. | Expériences en bouteilles, matrices et alcools contrôlés, pas de calibration sensorielle universelle. |
| Ne pas assimiler plus de thiols à plus de fruité | [Samia et al., EBC 2024](https://brewingscience.de/index.php/brewingscience/article/download/241/150/416) : Diamond présente beaucoup de thiols mais un caractère fruité/tropical moindre dans cet ensemble d’essais. | Compte rendu court et contexte particulier ; pas un rendement de β-lyase par souche. |

Les profils fabricant orientent trois priors de souche. [Fermentis US-05](https://fermentis.com/en/product/safale-us-05/) décrit un profil neutre ; [Verdant IPA](https://admin.lallemandbrewing.com/wp-content/uploads/2023/05/TDS_LPS_BREWINGYEAST_VERDANT_ENG_A4-4.pdf) décrit notamment l’abricot ; [Pomona](https://admin.lallemandbrewing.com/wp-content/uploads/2024/04/Pomona-TDS-FRA-A4-Print-LalBrew.pdf) décrit pêche, agrumes et tropical. Les deux dernières fiches déclarent un caractère POF négatif. La date de publication des fiches n’est pas établie par leur chemin d’hébergement : elles gardent `year: null`. **Aucune borne numérique du profil de souche n’est attribuée à ces fabricants.**

Les questions initiales de chimie restent traitées selon le socle documentaire : axes locaux explicitement choisis ; conjugués cystéinylés/glutathionylés conservés distincts ; pas de rendement générique déduit d’une étape enzymatique ; pas de somme indépendante de voies concurrentes ; pas d’équivalence POF/β-lyase/ATF1. Le modèle phénoménologique ne prétend pas résoudre cette chaîne biochimique.

## Formule et unités

Pour une famille `a`, une variété, une souche et un timing explicites :

```
D_a = dose_gL / (K_timing_gL × facteur_dose_a + dose_gL)
H_a = descripteur_a × D_a × contact_timing × expression_timing
      × expression_souche_a × gain × matrice
I_a = clamp(1 − exp(−(H_a + arôme_propre_souche_a))
            + marge_structurelle + marge_documentaire, 0, 1)
```

`I_a` est ensuite projeté sur l’échelle locale de l’axe. La marge documentaire est symétrique ; la borne maximale de sa plage donne l’enveloppe utilisée. L’erreur structurelle reste additive sur la sortie pour que la saturation ne fasse pas disparaître l’incertitude.

Le contact à chaud utilise `exp(−heures / constante_perte_heures)` pour ébullition/premier moût. Le contact du whirlpool et du houblonnage à cru utilise `1 − exp(−heures / constante_extraction_heures)`. Les deux phénomènes ne sont pas multipliés avec un temps partagé dont les extrema seraient ignorés. La version initiale ne prédit pas les pertes à très long contact, le vieillissement ou l’oxydation ; ces limites restent explicites.

La température de contact connue dans la fenêtre de scénario n’introduit pas de correction thermique. Une température absente ou hors fenêtre élargit la plage. Cela évite de faire passer un Q10 inventé pour une loi mesurée. Une fenêtre de scénario n’est pas un domaine de validation. La température de fermentation, le grist, l’alcool, l’oxygène et la quantité de levure ne sont pas identifiés individuellement dans cette version.

L’ensemble impose une **convention cardinale** aux familles initialement qualitatives. L’addition, l’exponentielle et les distances entre axes sont des choix du modèle, pas des conséquences automatiques des mots « faible/moyenne/forte ». Les interactions et la dépendance entre les facteurs ne sont pas estimées : la boîte d’hypothèses est un dispositif d’exploration, non une distribution probabiliste jointe.

Le graphe ajoute un **repère central** avec sa plage, présenté comme une classe de tendance. Chaque paramètre porte une valeur `central`, datée et modifiable ; la proposition initiale choisit le milieu de sa plage. Ce choix n’est pas une espérance probabiliste ou une moyenne mesurée. Les magnitudes de marge documentaire n’introduisent aucun décalage directionnel du repère. Dose ou contact absents : aucun repère central, aucune valeur de procédé imputée. Les familles non documentées restent grisées et n’affichent pas ce repère. Le classement conserve les bornes et n’utilise pas le repère central pour inventer un gagnant.

## Registre des hypothèses

Toutes les valeurs ci-dessous sont des **propositions de conception assistées par IA, datées du 8 septembre 2026, à réviser par le brasseur**. Elles ne résultent ni d’un panel d’experts ni d’une élicitation formelle. L’attribution `kind: judgment` et la confiance faible sont obligatoires.

| Paramètre initial | Plage | Interprétation |
| --- | --- | --- |
| Descripteur positif | 0,55–0,90 | Domaine latent de présence, sans concentration imputée |
| Famille non mentionnée ou description absente | 0–1 | Domaine complet, jamais zéro automatique |
| Gain | 2,2–3 | Convention d’échelle permettant aux classes locales d’être atteignables |
| Matrice et interactions non résolues | 0,85–1,15 | Facteur structurel supposé, non mesuré |
| Marge structurelle de sortie | −0,08 à +0,08 | Ne disparaît pas à forte dose |
| Demi-dose à cru | 2–4 g/L | Forme compressive ; pas un seuil universel |
| Facteur de demi-dose herbacé/végétal | 1,5–2,5 | Réponse plus progressive proposée ; autres axes : 1 |
| Arôme propre d’une souche non caractérisée | 0–1,1 | Enveloppe contenant tous les profils proposés |
| Expression avec une souche non caractérisée | 0–2 | Aucune neutralité ou activité nulle supposée |

Les bornes par timing, profil de souche, provenance, forme et température sont décrites individuellement dans `src/data/hopExtrapolationBootstrap.json`. Leur provenance renvoie à ce registre avec une justification propre. Les sources primaires motivent la structure et ses limites ; elles ne sont jamais affichées comme auteurs de nos chiffres.

Une fiche fabricant n’est pas une mesure de lot. La répétition des mots ou des descriptions ne renforce pas le signal. Une famille non renseignée conserve une plage englobant celle d’un descripteur connu. Un profil de souche manquant conserve une enveloppe englobant les profils disponibles.

## Propagation des plages et classement

Pour une dose connue `d`, la borne basse du facteur de dose utilise le plus grand `K`, et la borne haute le plus petit. La dose est la même au numérateur et au dénominateur. Une dose inconnue utilise directement `[0,1]` pour ce facteur ; aucune moyenne n’est imputée. Le calcul `1/(1+K/d)` reste stable à très grande dose et donne zéro à dose nulle. Les noyaux de contact sont monotones dans leurs constantes ; un contact inconnu utilise leur domaine `[0,1]`.

L’arithmétique d’intervalles garantit une inclusion **dans la formule choisie**, à la précision numérique près. Elle ne prouve pas la justesse de la formule physique. Voir [Rump, 2010, *Verification methods*](https://www.tuhh.de/ti3/rump/intlab/ActaNumerica2010.pdf), notamment la discussion des dépendances et de la surestimation. Les tests utilisent une tolérance de calcul explicitement séparée des marges aromatiques.

Le classement existant mesure une distance à l’intervalle cible, pondérée par les paramètres sourcés des axes. Pour les résultats extrapolés : borne basse d’adéquation décroissante, puis largeur croissante. Des plages qui se recouvrent ne démontrent pas un ordre. Seule une borne basse strictement supérieure à la borne haute d’une autre piste fournit un ordre robuste suffisant selon cette convention.

Dans l’atelier, une recherche conserve la souche et le timing pour proposer des houblons. « Comparer aussi les levures » explore aussi les souches disponibles ; à cru, elle compare les phases active et après fermentation à dose, température et contact identiques. Les phases chaudes restent distinctes pour ne pas comparer artificiellement un whirlpool de 24 heures à 18 °C à un ajout à cru. Le traitement par petits groupes conserve le même résultat tout en laissant l’interface répondre.

## Données, édition et historique

- La nouvelle connaissance `kind: extrapolation` vit dans **la collection existante `hopKnowledge`**. Aucun moteur de règles, aucune nouvelle collection, aucune Cloud Function spécialisée.
- Le JSON initial est proposé à la lecture. Une révision Firestore de même identifiant prime immédiatement, même si elle est désactivée. Une révision invalide n’est pas remplacée silencieusement par le défaut.
- L’atelier peut enregistrer les hypothèses, puis l’éditeur des connaissances permet de les modifier sans redéploiement. Une modification exige une nouvelle version. Le moteur reçoit uniquement des données validées.
- `predictHopTriplet` est commun au navigateur, au classement et aux outils du compagnon. Le modèle expérimental ne remplit pas `beer:4mmpFree` et ne modifie pas une alerte sur la seule base d’un indice sensoriel.
- Une prédiction conservée utilise `hop-experimental-v3` et copie les coefficients, axes, sources et entrées. La validation rejoue le calcul depuis cette copie et refuse les plages ou étiquettes falsifiées. Les versions historiques restent inchangées.
- Une simulation ne réécrit pas la recette. L’action « Appliquer ce scénario » est explicite, et la lecture d’une recette enregistrée ne réalise aucune écriture.

Le nom Cascade peut proposer la fiche générique Hopsteiner lorsque l’ingrédient n’est pas associé. US-05 est reconnue par les variantes explicites de son nom. Ces rapprochements et toute hypothèse de phase sont affichés comme propositions de simulation ; ils ne deviennent des associations enregistrées qu’à l’application. Un `J+3` n’est jamais une mesure du stade de fermentation.

Un COA d’alpha-acides n’améliore pas cette prédiction aromatique. Le modèle expérimental n’utilise pas encore les concentrations pour ses indices ; les étalonnages analytiques spécifiques existants peuvent le faire dans leur propre domaine. Les graphes des différents ajouts ne s’additionnent pas : le caractère fermentaire y serait compté plusieurs fois et les mélanges ne sont pas étalonnés.

## Validation à conduire sur les dégustations

La confiance statistique d’un futur résultat demande une **calibration séparée**. [Angelopoulos et Bates, version 2022](https://arxiv.org/abs/2107.07511) présentent les intervalles conformes et leurs hypothèses ; [Tibshirani et al., 2019](https://www.stat.berkeley.edu/~ryantibs/papers/weightedcp.pdf) montrent pourquoi un changement de distribution exige un traitement spécifique. Afficher « 95 % » maintenant serait injustifié.

1. Conserver la prédiction avant de voir la dégustation, avec lot, souche, phase, conditions réelles et version du modèle.
2. Déguster selon les mêmes axes, en aveugle si possible, et garder les répétitions d’une bière dans le même groupe d’évaluation. Une répétition instrumentale ou plusieurs juges d’un même brassin ne sont pas des brassins indépendants.
3. Comparer valeurs perçues et plages archivées, y compris les échecs. La section Dégustations conserve déjà ces écarts. Les bières commerciales complètent ce jeu si le triplet est documenté ; sinon elles restent des observations sensorielles documentaires.
4. Réviser les paramètres sur un ensemble d’apprentissage, puis évaluer sur des lots, souches ou variétés laissés hors de cet ensemble. Ne pas utiliser les mêmes essais pour choisir les bornes et annoncer leur couverture.
5. Publier nombre de brassins indépendants, couverture observée par axe, largeur des plages et domaine d’usage. Ne relever la confiance qu’après cette évaluation ; aucune hausse automatique due à un COA, une saturation ou plusieurs citations.

Pour améliorer les priors, une vraie élicitation avec des brasseurs reste à organiser : [O’Hagan, 2019, *Expert Knowledge Elicitation: Subjective but Scientific*](https://doi.org/10.1080/00031305.2018.1518265). Les valeurs de cette première version ne doivent pas être présentées comme le résultat d’un tel protocole.

La recherche s’arrête ici pour cette version : les preuves suffisent à choisir une structure exploratoire et à délimiter ses prétentions. Aucune source vérifiée ne fournit la fonction universelle recherchée. Ajouter des sources plus faibles ne justifierait pas des plages plus serrées.
