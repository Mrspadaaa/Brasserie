# Index Houblon — décisions scientifiques avant le schéma

Étude initiale des 7–8 septembre 2026 pour L’Affinée, établie avant le schéma.
La [revue complémentaire](index-houblon-revue.md) et
l’[étalonnage exploratoire installé](index-houblon-etalonnage.md) documentent
les résultats de la passe suivante. L’audit du dépôt, l’esquisse des
variétés/lots et les critères de réception figurent dans
[le dossier technique](index-houblon-conception.md).

Les constats ci-dessous viennent de publications ou de documents de leurs auteurs.
Les décisions de produit sont explicitement présentées comme des propositions de
L’Affinée, datées de 2026. Elles ne sont pas des lois de chimie.

## Les six réponses

| Question | Réponse retenue pour concevoir |
| --- | --- |
| Axes aromatiques | Des lexiques professionnels existent. Aucun nombre universel d’axes orthogonaux n’est établi pour cet usage. Reprendre un vocabulaire publié, puis versionner un regroupement local à éprouver en dégustation. |
| Cystéine / glutathion | La forme du conjugué a des effets mesurés, dépendants de la souche et du protocole. La conserver dès la collecte. Ne pas imposer une chaîne universelle à deux étapes ni une pénalité fixe au glutathion. |
| Huiles → perception | Des modèles empiriques publiés existent pour des contextes limités. Aucun modèle général transférable au triplet demandé n’a été identifié dans les sources examinées. |
| Composition des transformations | Ni addition ni multiplication systématique. Distinguer des mesures alternatives du même rendement, des étapes successives et de véritables branches partageant un substrat. |
| Risques | Une sortie distincte, alimentée par les mêmes faits et, lorsqu’ils existent, les résultats chimiques. Un risque ne doit pas disparaître dans une moyenne aromatique. |
| Confiance | Provenance et année sont nécessaires mais insuffisantes. Évaluer aussi méthode, précision, pertinence du contexte, validation et dépendance entre sources. Aucune pondération probabiliste inventée. |

### 1. Axes : adopter une langue, tester sa projection

BarthHaas/HAAS publie une langue sensorielle en **12 catégories**, accompagnée de
références d’entraînement. Le lexique Yakima Chief Hops, révision d’avril **2021**,
sépare notamment agrumes, fruits tropicaux, fruits à noyau et melon, ainsi que les
arômes, les goûts et les sensations en bouche. Ce sont des référentiels
professionnels : leur existence ne démontre pas que leurs catégories forment des
dimensions indépendantes ou une échelle quantitative universelle.
[HAAS : catégories](https://www.johnihaas.com/aromastandardskit/),
[YCH : lexique V1, copie indexée](https://www.yakimachief.com/media/wysiwyg/Sensory_Lexicon_V1.pdf).

**Proposition de travail, L’Affinée 2026 :** commencer les essais de représentation
avec 12 familles inspirées du lexique YCH : agrumes ; tropical ; fruits à noyau ;
pomme/poire ; baies ; melon ; floral ; herbacé ; boisé/résineux ; épicé ;
vert/herbeux ; terreux. Ce choix privilégie la distinction des fruits utile au
brassage ; il ne reprend pas les 12 catégories BarthHaas à l’identique.

Conserver les descripteurs détaillés et les mots d’origine. Les notes soufrées,
alliacées, animales, sucrées ou torréfiées restent saisissables, même si elles ne
figurent pas dans cette vue initiale. Une note n’est désirable ou gênante qu’en
fonction du profil recherché. La vue et ses regroupements doivent rester modifiables.

Pour l’incrément variétés/lots, utiliser seulement des **descriptions documentées**,
sans radar chiffré. Noter leur contexte : houblon frotté, infusion, bière d’essai,
fiche fabricant sans protocole connu. Un descriptif de variété ne devient jamais
une prédiction de bière. Un axe non évalué reste non évalué, et non égal à zéro.

Avant de figer une vue, faire décrire puis redécrire quelques bières avec le même
vocabulaire ; examiner les familles confondues et les notes impossibles à ranger.
Cette vérification locale détermine la forme utile des axes, sans prétendre
valider statistiquement un modèle avec quelques dégustations.

### 2. Conjugués : différence réelle, rendement non universel

Les expériences de Santiago et Gardner (**2015**) étudient notamment
`IRC7`, `OPT1` et `CIS2` dans le transport et la conversion de précurseurs. Elles
emploient des souches et un milieu synthétique de type jus de raisin. Elles
étayent des mécanismes ; leurs rendements ne constituent pas des coefficients
prêts à employer dans un moût de brasserie.
[Article original](https://academic.oup.com/femsyr/article/15/5/fov034/2467698).

Chenot et collaborateurs (**2022**) montrent, dans leurs essais brassicoles, que
des levures lager libèrent des thiols depuis les conjugués glutathionylés. Les
effets d’une modification de température et d’azote diffèrent suivant la forme du
précurseur. « Une étape en plus implique toujours un rendement moindre » n’est
donc pas une règle exploitable.
[Article original](https://pubs.acs.org/doi/10.1021/acs.jafc.1c07272).

Christiaens et collaborateurs (**2025**) ont fermenté un moût enrichi en
γ-GluCys-3SHol et mesuré une libération dépendante de la souche, de la densité et
de la température. Leurs résultats soutiennent une activité sur cet intermédiaire
dipeptidique. La discussion propose aussi une libération directe depuis le
tripeptide chez une souche particulière, **hypothèse à confirmer**, notamment par
suivi des intermédiaires. Cela interdit de transformer le diagramme simplifié
glutathion → cystéine → thiol en vérité exhaustive.
[Résumé et protocole](https://pubmed.ncbi.nlm.nih.gov/39860195/),
[discussion et conclusion indexées](https://pmc.ncbi.nlm.nih.gov/articles/PMC11767611/).

Un second résultat est déterminant : Calicis et collaborateurs (**2025**) mesurent
les activités carboxypeptidase et γ-glutamyltranspeptidase, sans trouver de
corrélation générale entre ces dosages et la libération de thiols déjà observée.
Une fiche « activité enzymatique élevée » ne suffit pas à calculer un rendement.
[Résumé original](https://pubmed.ncbi.nlm.nih.gov/40572456/).

**Décision proposée :** conserver séparément l’identité de la molécule cible,
sa forme libre ou conjuguée, la forme de conjugaison lorsqu’elle est connue, la
matrice et la méthode d’analyse. Prévoir notamment Cys, GSH, γ-GluCys et CysGly,
ainsi que « forme non précisée », sans rendre leur dosage obligatoire. Ne pas
confondre les synonymes 3MH/3SH/3SHol, 3MHA/3SHA et 4MMP/4MSP avec des molécules
supplémentaires ; garder aussi l’isomère si la source le distingue.

Au premier moteur, préférer un **rendement net empirique par précurseur, souche et
contexte**, seulement lorsqu’une source compatible le documente avec son
incertitude. Ce rendement représente le processus observé ; ce n’est pas la
simulation d’une réaction unique. Les capacités enzymatiques peuvent rester
documentaires. Une chaîne calculable viendra uniquement si ses étapes, transports
et paramètres sont suffisamment identifiés. Ni `IRC7 présent` ni « levure
biotransformatrice » ne devient un pourcentage par défaut.

### 3. Huiles et perception : oui à des modèles locaux, pas à une formule générale

Machado et collaborateurs (**2020**) publient des régressions PLS pour des bières
houblonnées à cru avec Mandarina Bavaria : houblonné global, agrumes, fruits verts
et fruits doux. L’étude porte sur deux bières de base, un dosage et un suivi
expérimental déterminés. La notice des auteurs donne même une équation pour
l’intensité houblonnée globale, dont les entrées sont des concentrations de
volatils **dans la bière**, et non des pourcentages d’huiles dans le houblon.
L’existence de cette équation répond à la question ; sa validation ne s’étend pas
automatiquement aux autres variétés, levures, matrices ou timings.
[Notice originale et équation publiée](https://portal.fis.tum.de/en/publications/prediction-of-fruity-citrus-intensity-of-beers-dry-hopped-with-ma/).

Lafontaine et collaborateurs (**2018**) étudient Cascade et Centennial sur plusieurs
récoltes. Les marqueurs les plus utiles diffèrent selon la variété, et le volume
total d’huile explique moins bien les différences sensorielles que certains
composés individuels. Une fiche moyenne ne remplace donc pas un lot.
[Article original](https://brewingscience.de/index.php/brewingscience/article/view/277).

Takoi et collaborateurs (**2016**) observent des changements de perception dans
des mélanges de monoterpénols et de 4MSP. Leurs essais soutiennent des interactions
sensorielles dans les mélanges testés, sans fournir une matrice de pondérations
universelles par axe.
[Article original](https://brewingscience.de/index.php/brewingscience/article/view/299).

Samia et collaborateurs (**2025**) montrent dans leurs essais avec Cascade que
l’azote du moût et la souche influencent la libération de thiols. Une augmentation
de thiols ne correspond pas nécessairement à une intensité tropicale accrue.
Le dosage chimique et la perception doivent donc rester deux niveaux distincts.
[Résultats et conclusion de l’article](https://doi.org/10.1080/03610470.2025.2530859).

**Décision proposée :** séparer trois questions : ce qui est apporté/extrait ; ce
qui reste ou se transforme pendant le procédé ; ce qui est perçu dans la bière.
L’absence d’un modèle validé au dernier niveau n’autorise pas une somme
`huile × poids arbitraire` présentée comme une mesure sensorielle. Un rapport
concentration/seuil de détection n’est pas non plus une intensité par axe.

Le triplet reste l’identité minimale de toute prédiction. Il doit aussi porter
le contexte disponible : dose rapportée au volume, forme de produit, température,
durée, état de fermentation, matrice et âge de la bière. Ces informations peuvent
manquer ; leur absence limite le domaine de validité et la confiance. Le seul
jour « J+3 » ne prouve pas un état physiologique identique entre deux levures.

Si une formule heuristique devient utile pour explorer des pistes, l’identifier
comme **jugement L’Affinée**, expliquer son domaine, stocker tous ses paramètres
avec cette provenance et l’année, et afficher une confiance réduite. Sans bornes
défendables, même cette formule ne doit pas fabriquer une plage numérique.

### 4. Plusieurs transformations : ne jamais consommer deux fois le même précurseur

Les travaux de **2015** distinguent transport, conversion et acétylation d’une
partie du 3MH en 3MHA. Le précurseur glutathionylé peut aussi servir de source de
soufre pour la croissance ; les auteurs proposent une perte vers d’autres voies
comme explication partielle de faibles rendements. Cela soutient l’existence de
destins alternatifs, sans mesurer une compétition universelle. Les observations
brassicoles de **2025** montrent aussi l’influence de l’azote et de la souche.
Ces résultats ne justifient pas des rendements indépendants fixes pour chaque
enzyme et ne donnent pas les constantes d’une compétition pour toute paire de voies.
[Santiago et Gardner](https://academic.oup.com/femsyr/article/15/5/fov034/2467698),
[Samia et al.](https://doi.org/10.1080/03610470.2025.2530859).

**Règles de conception proposées :**

| Situation | Traitement défendable |
| --- | --- |
| Deux articles mesurent le même rendement net | Deux estimations alternatives. Les confronter et expliquer leur sélection ; ne pas les additionner comme deux réactions. |
| Deux étapes véritablement successives | Multiplier des fractions conditionnelles seulement si leur définition et leur contexte le permettent. Ne pas appliquer ces facteurs une seconde fois à un rendement net qui les inclut déjà. |
| Deux voies consomment le même stock moléculaire | Partager un même bilan molaire. Ne pas attribuer la totalité du stock à chaque voie. Sans partage documenté, produire des scénarios alternatifs ou une sortie qualitative. |
| 3MH transformé ensuite en 3MHA | Déduire du stock de 3MH la part transformée ; conserver un bilan des équivalents moléculaires et des pertes. Les masses des molécules ne sont pas interchangeables. |
| Plusieurs molécules contribuent à un arôme | Addition de concentrations, addition d’intensités et synergie sont des opérations différentes. Une synergie sensorielle n’est pas une réaction qui crée des molécules. |

La conservation de matière est un garde-fou nécessaire, pas une validation du
modèle. Plafonner une somme erronée ne répare pas une mauvaise hypothèse
d’indépendance. Un modèle cinétique avec saturation/compétition ne sera utile
qu’avec ses paramètres expérimentaux ; il n’est pas requis pour démarrer.

### 5. Risques : une couche explicite avec ses propres preuves

Kirkpatrick et Shellhammer (**2018**) démontrent une activité de dégradation des
dextrines associée au houblon, susceptible d’alimenter une refermentation. L’effet
dépend de la dose, du temps et de la température. Une prédiction de thiols ne
suffit donc pas à évaluer le hop creep.
[Publication des auteurs](https://foodsci.oregonstate.edu/publication/evidence-dextrin-hydrolyzing-enzymes-cascade-hops-humulus-lupulus).

Young et Fox (**2026**, publication en ligne le 5 août) discutent des contributions
possibles de plusieurs sources de glucides au hop creep. Ce travail récent
renforce la prudence envers un indicateur unique « activité enzymatique → risque » ;
il ne permet pas ici de chiffrer la probabilité d’une refermentation.
[Article original, extraits indexés](https://www.tandfonline.com/doi/full/10.1080/03610470.2026.2686573).

**Architecture proposée :** des fonctions métier explicites pour les alertes,
partageant les données résolues avec le calcul aromatique. Les seuils, conditions
quantitatives, messages de référence et niveaux d’impact documentés vivent dans
la donnée. Aucune DSL de conditions ni moteur de règles générique.

| Alerte | Déclenchement à concevoir | Si l’information manque |
| --- | --- | --- |
| Hop creep | Contexte de houblonnage à cru, produit utilisé, activité fermentaire résiduelle, substrats, temps/température ; mesures de stabilité si disponibles | « Risque à vérifier » avec les éléments absents. Aucun feu vert fondé sur le silence du COA. |
| 4MMP/4MSP trop dominant | Comparer une concentration mesurée ou une plage prédite à un critère sensoriel justifié pour la matrice et l’objectif | « Dominance non quantifiable ». Ne pas utiliser le seuil de détection comme seuil de défaut. |
| Précurseurs élevés, capacité non documentée | Avertissement de potentiel non démontré pour la souche et ce timing ; distinguer capacité inconnue et faible activité mesurée | « Expression non démontrée », sans annoncer rendement nul ni défaut certain. |

Le 4MSP contribue aussi à des impressions fruitées dans les mélanges étudiés par
Takoi : sa présence seule n’est pas un défaut. Aucun seuil universel de rejet
sensoriel applicable à L’Affinée n’a été retenu dans cette étude.
[Takoi et al., 2016](https://brewingscience.de/index.php/brewingscience/article/view/299).

Chaque alerte doit montrer sa gravité, sa confiance, son état d’évaluation, les
faits déclencheurs et ses références. Distinguer « constaté », « possible »,
« non évalué » et « non déclenché dans le contexte documenté ». Un bon score
aromatique ne compense jamais une alerte ; une alerte peut exister sans score.

### 6. Confiance : évaluer une donnée dans son usage

La provenance répond à « d’où vient-elle ? » ; la fiabilité et l’applicabilité
répondent à « que peut-on en conclure ici ? ». L’étude de Calicis (**2025**) illustre
pourquoi une mesure enzymatique publiée ne suffit pas à prédire une conversion.
[Article original](https://pubmed.ncbi.nlm.nih.gov/40572456/).

**Politique qualitative proposée, L’Affinée 2026, à enregistrer comme donnée :**

| Dimension | Informations à conserver |
| --- | --- |
| Traçabilité | Auteur/organisme, titre, référence ou pièce source, année/version, date de consultation, page/table ou emplacement de la valeur |
| Nature de preuve | COA analytique, expérience contrôlée, revue, fiche fabricant, observation personnelle, communauté, jugement interne |
| Méthode et précision | Méthode, unités et base de mesure, répétitions si connues, dispersion/incertitude déclarée, limites de détection/quantification |
| Applicabilité | Lot/récolte, produit, matrice, souche, substrat, dose, timing, température et conditions pertinentes |
| Concordance | Contradictions, réplications indépendantes, source primaire commune à plusieurs reprises secondaires |
| Modèle | Validation dans son domaine, extrapolation, erreur de prédiction connue et données manquantes |

Un COA peut être la meilleure preuve de la composition de **son lot**, tout en
n’apportant aucune validation du profil aromatique. Un article relu sur le vin
peut être peu applicable au moût. Une fiche fabricant peut identifier correctement
une variété sans documenter son rendement de biotransformation. Une revue et
l’article qu’elle cite ne sont pas deux expériences indépendantes.

L’interface résume la confiance par `low`, `medium`, `high` avec des raisons
lisibles. Ces classes sont ordinales, pas des probabilités déguisées. « High »
demande des preuves adaptées et une validation pour la grandeur annoncée ; il
n’est pas accordé automatiquement à un DOI ou à un COA. Une entrée absente
nécessaire au résultat entraîne une raison explicite de dégradation, sans
pondération numérique improvisée. Distinguer confiance et intensité d’arôme.

L’année n’est pas une fonction de décote automatique : une méthode ancienne peut
rester valide, une fiche de lot décrit une récolte particulière. Une publication
non datée conserve « année inconnue », distincte de sa date de consultation.
Elle peut documenter une recherche ; elle ne fournit pas un coefficient actif
tant que sa provenance annuelle n’est pas établie.

## Incertitude : contrat commun aux futurs résultats

Toute grandeur dérivée numérique aura une plage, la nature de cette plage, une
classe de confiance, des raisons et les références exactes de ses entrées et
paramètres. Une plage de variétés publiée, une incertitude analytique et un
intervalle de prédiction ne désignent pas la même chose.

Si aucune plage défendable n’existe, rendre **« non quantifiable avec les données
actuelles »**, avec `range: null`, une confiance faible et l’explication. Ce n’est
pas un zéro, ni un intervalle arbitraire, ni un écran en erreur. Les descriptions,
pistes documentées et alertes évaluables restent disponibles. L’absence de levure
ou de timing produit un contexte incomplet, jamais un score de houblon seul.

Une valeur ponctuelle sur un COA reste une **valeur rapportée**. Sans incertitude
analytique fournie, ne pas fabriquer un « ± » ni la transformer en intervalle
dégénéré pour simuler une certitude. Un COA partiel resserre seulement ce qu’il
mesure de façon comparable ; il ne rend pas automatiquement toute la prédiction
précise. Une contradiction peut au contraire justifier une plage plus large ou
une suspension du calcul concerné.

Les premières classes et bornes proposées par l’équipe auront une provenance
interne, une année et une justification, au même titre que les autres paramètres.
Une donnée manquante réduit ce qui peut être affirmé ; **elle ne crée jamais une
preuve de substitution**.

## Dégustations : préparer l’apprentissage sans inventer les causes

Prévoir dès la conception une dégustation portant soit sur un brassin maison,
soit sur une bière commerciale. Conserver date, identité de bière/lot si connue,
conditions de service, âge/conservation connus, vocabulaire et version d’échelle,
observations par axe, caractère aveugle ou non et provenance des informations de
recette. « Houblonnée au Citra » sur une étiquette ne donne ni dose, ni souche, ni
timing : conserver ces inconnues.

Le futur écart dégusté/prédit doit référencer une **prédiction figée** : entrées,
versions des paramètres, axes, date et résultat original. Une révision du modèle
crée une nouvelle comparaison et conserve l’ancienne. Comparer seulement des axes
et contextes compatibles. Ne pas remplacer les axes non notés par des zéros.

Les bières commerciales enrichissent le vocabulaire, les préférences et les
observations. Elles ne permettent pas à elles seules d’identifier causalement le
rendement d’un triplet inconnu ou l’apport individuel des houblons d’un mélange.
Séparer ces usages dans la future calibration ; éviter que des dégustations du
même brassin/produit se retrouvent à la fois dans l’ajustement et la validation.
Avec peu de brassins, conserver les écarts et l’erreur visible avant d’ajuster
automatiquement des coefficients.

## Registre des sources et limites de cette étude

Recherche ciblée effectuée les **2026-09-07 et 2026-09-08**, pas une revue systématique exhaustive.
Requêtes centrées sur lexiques sensoriels du houblon, conjugués/levures,
régressions chimiques et sensorielles, et hop creep, avec vérification de travaux
récents. Les blogs, forums, brevets et résumés générés n’ont pas servi de preuve
chimique. Aucun appel Gemini du projet n’a été effectué.

| Source | Année et type | Accès exploité / limite |
| --- | --- | --- |
| [HAAS, langue sensorielle](https://www.johnihaas.com/aromastandardskit/) | Professionnel, page non datée | Page lue ; vocabulaire, pas coefficients. Le [Hops Companion](https://www.johnihaas.com/wp-content/uploads/2021/11/HAAS_HopsCompanion-Final-ForWeb.pdf) constitue aussi une référence publiée accessible. |
| [YCH, Hop & Beer Sensory Lexicon V1](https://www.yakimachief.com/media/wysiwyg/Sensory_Lexicon_V1.pdf) | Avril 2021, professionnel | Texte du document indexé lu ; URL directe en 404 lors de cette recherche. Retrouver la pièce stable avant d’en importer automatiquement une version. |
| [Santiago et Gardner, gènes et thiols](https://doi.org/10.1093/femsyr/fov034) | 2015, expérience publiée | Texte consulté chez l’éditeur ; milieu œnologique synthétique, extrapolation brassicole à documenter. |
| [Chenot et al., malt/houblon et conjugués](https://doi.org/10.1021/acs.jafc.1c07272) | 2022, expérience publiée | Résumé original indexé ; pas d’extraction des tableaux de rendement. |
| [Christiaens et al., γ-GluCys](https://doi.org/10.3390/molecules30020325) | 2025, expérience publiée | Résumé/protocole PubMed et conclusion primaire indexée ; hypothèses mécanistiques distinguées des résultats. |
| [Calicis et al., activités enzymatiques](https://doi.org/10.3390/molecules30122491) | 2025, expérience publiée | Résumé et légendes PubMed ; absence de corrélation générale, pas de coefficient récupéré. |
| [Machado et al., modèles Mandarina Bavaria](https://doi.org/10.1021/acs.jafc.9b06139) | 2020, expérience publiée | Résumé et équation via l’université des auteurs ; modèles complets, erreurs et domaine à examiner avant réutilisation. |
| [Lafontaine et al., marqueurs Cascade/Centennial](https://doi.org/10.23763/BrSc18-19lafontaine) | 2018, expérience publiée | Résumé de l’éditeur ; ne valide pas de généralisation à toute variété. |
| [Takoi et al., mélanges et interactions](https://brewingscience.de/index.php/brewingscience/article/view/299) | 2016, expérience publiée | Résumé éditeur et passages du PDF indexés ; conditions expérimentales spécifiques. |
| [Samia et al., azote et souches](https://doi.org/10.1080/03610470.2025.2530859) | 2025, expérience publiée | Résultats/conclusion primaires indexés ; accès direct éditeur refusé pendant la recherche. Financement Lallemand indiqué par les auteurs. |
| [Kirkpatrick et Shellhammer, dextrines](https://doi.org/10.1021/acs.jafc.8b03563) | 2018, expérience publiée | Résumé publié par Oregon State ; mécanisme de hop creep, pas seuil universel. |
| [Young et Fox, glucides et hop creep](https://doi.org/10.1080/03610470.2026.2686573) | 2026, expérience publiée | Date et passages éditeur indexés ; article complet à examiner pour toute extraction quantitative. |

Les revues de [Dietz et al., 2020](https://doi.org/10.1002/jib.622) et de
[Svedlund et al., 2022](https://doi.org/10.1007/s00253-022-12068-w) ont servi à
repérer les travaux originaux, pas à constituer des réplications supplémentaires.

**Ce que ces sources permettent de décider maintenant :** la séparation des
preuves, du contexte, du calcul et de la perception ; les champs à préserver ;
les simplifications à éviter. Elles ne suffisent pas encore à livrer un moteur
quantitatif général. La prochaine extraction scientifique devra qualifier, modèle
par modèle, ses tableaux, unités, conditions et incertitudes avant activation.
