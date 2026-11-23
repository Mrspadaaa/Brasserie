# Revue de logique et de l’état de l’art

Une [consolidation Deep Research ultérieure](index-houblon-consolidation.md)
ajoute des COA publics, dix notes et les corrections du score et des imports v2.
Les chiffres ci-dessous décrivent la passe précédente.

Revue du 8 septembre 2026, poursuivant les six décisions de
[la note de recherche](index-houblon-recherche.md). Les conclusions ci-dessous
distinguent données mesurées, extrapolation et choix propres à l’application.

## Conclusions sur les formules

| Approche | Ce qu’elle permet | Décision pour l’Index |
| --- | --- | --- |
| Régression par variété et protocole | Relier un prédicteur mesuré à une réponse sensorielle dans un domaine étudié | Premier étalonnage exploratoire Cascade 2015, faible confiance, domaine fermé et résidu explicite |
| Modèle multivarié de bière finie | Relier la chimie **de la bière** à des perceptions, avec interactions | Piste pour analyser des dégustations commerciales disposant d’analyses ; pas une formule depuis un COA de houblon |
| Concentration / seuil olfactif (OAV) | Indiquer une activité odorante dans une matrice donnée | Aucun transfert automatique vers une intensité par axe ou un seuil de défaut |
| Somme de conversions de précurseurs | Nécessiterait bilan matière, transport, compétition et pertes documentés | Pas de somme de rendements indépendants ni de coefficient universel Cys/GSH |
| Distance à un profil cible | Classer des plages déjà prédites, selon les préférences | Convention mathématique locale, poids sourcés et incertitude conservée ; pas une probabilité |

L’étalonnage installé et sa reconstruction sont détaillés dans
[la note dédiée](index-houblon-etalonnage.md). Un second calcul indépendant
par NumPy (SVD et PRESS) retrouve la pente, l’intercept, le R² et toutes les
bornes du pack. La régression est empirique :
l’association du géraniol à Citrus ne prouve pas que son augmentation isolée
produirait le même effet. Les données ne justifient ni une fonction linéaire
universelle, ni une attribution des différences entre années à la seule levure.

Schreurs et al. (2024) ont étudié 250 bières, plus de 200 mesures chimiques,
un panel entraîné et des avis publics. Le gradient boosting dépasse les
modèles linéaires sur plusieurs réponses. Les entrées sont cependant des
mesures de **bière finie**. Le remplacement de leurs rares données manquantes
par une moyenne ne respecte pas le contrat de cette application et n’est pas
repris. Leur validation ne dispense pas de vérifier chaque réponse, son
domaine et ses marges. [Article primaire](https://www.nature.com/articles/s41467-024-46346-0).

La classification « Thiol impact » de Schmidt, Hoferer et Biendl (2024) porte
sur les thiols **libres** de 250 échantillons, 97 variétés. Elle retient des
maxima et extrapole aux 3MH/3M4MP un transfert discuté pour le 4MMP. Elle ne
mesure pas la capacité d’une levure à libérer des précurseurs. Les classes
sont donc importables comme documentation, jamais comme prédiction du
triplet ou règle d’excès. Il faut garder 3MH et 3M4MP distincts et ne pas
confondre un seuil de perception avec un seuil de rejet.
[Article primaire et tableaux](https://cdn.hopsteiner.de/assets/cdn/service/technical_information_and_support/technical-publications/2024-12_Determination_of_Variety_Dependent_Thiol_Impact_Based_on_LC-MS_MS_Analysis_of_Different_Hop_Samples_Collected_Worldwide_BS_Schmidt_et_al.pdf).

Les informations récentes des laboratoires confirment qu’une étiquette
« β-lyase+ » ne définit pas un rendement : les constructions génétiques et
les conditions diffèrent. Omega distingue notamment IRC7 et PatB ; Lallemand
discute la répression par l’azote. Ce sont des descriptions de fabricants,
pas des coefficients interchangeables.
[Omega, guide 2026](https://omegayeast.com/blogs/brewing-guides/how-to-thiol),
[Lallemand, note 2025](https://www.lallemandbrewing.com/en/global/resources/whats-new/precision-flavor-through-fermentation-control/).

Samia et ses coauteurs comparent cinq souches LalBrew avec Cascade à
l’ébullition et au whirlpool, sans dry-hop. La souche donnant le plus de
thiols libres n’obtient pas le fruité le plus élevé. L’étude distingue donc
production chimique et perception, et montre une interaction avec la
température de fermentation. Le compte rendu utilise une analyse CATA :
ses fréquences ne sont pas des intensités continues à recopier dans les axes.
Les cinq identités de souches sont référencées, sans en déduire une activité
β-lyase isolée ni des coefficients. [Compte rendu primaire, 2024](https://brewingscience.de/index.php/brewingscience/article/download/241/150/416).
L’article détaillé est paru en ligne le 26 décembre 2025 dans un volume daté
2026 ; son identifiant ne doit pas être confondu avec celui de l’autre étude
Samia sur la disponibilité des précurseurs.
[Article détaillé et référence bibliographique](https://doi.org/10.1080/03610470.2025.2593042).

La comparaison Verdant IPA/Pomona publiée par Lallemand en 2026 est utile
comme exemple d’essai sur moût commun, avec un mélange de houblons au
whirlpool. Ses écarts relatifs ne sont pas des rendements par houblon isolé.
Le billet HTML est documenté ; le PDF de newsletter n’a pas pu être récupéré.
[Compte rendu du fabricant](https://www.lallemandbrewing.com/en/africa/resources/whats-new/practical-tips-for-thiol-boosting-recipes/).

## Bases consultées et aptitude à l’import

| Base / source | Données réellement accessibles | Utilisation et limites |
| --- | --- | --- |
| [Hopsteiner](https://www.hopsteiner.de/en/products/all-hop-varieties) | **102 fiches** extraites ; date de mise à jour, plages alpha/bêta/huiles/linalol, lexique brut, classe thiols | Pack fabricant disponible. Forme commerciale inconnue ; aucune intensité en bière issue du radar brut |
| [BarthHaas](https://www.barthhaas.com/hops-and-products/hop-varieties-overview) | Catalogue, descripteurs et lexique HOPSESSED ; guides de récolte | Documentation et vocabulaire. Les catégories publiées ne sont pas les douze familles personnelles de l’app |
| [YCH](https://www.yakimachief.ca/sensory-analysis) | Programme sensoriel, travaux Survivables, fiches produit et analyses par lot | Très pertinent pour les lots. La récupération directe de la page principale a rencontré un contrôle d’accès automatisé ; aucun contournement ni donnée supposée |
| [Schreurs / Zenodo](https://doi.org/10.5281/zenodo.10653704) | Données supplémentaires et code annoncés par l’article | Base utile pour chimie/perception de bières commerciales ; les avis RateBeer bruts sont signalés comme restreints. Le téléchargement Zenodo a échoué par délai serveur lors de cette revue |
| [HopDatabase](https://github.com/kasperg3/HopDatabase/blob/cf9aad4b59fe7c30441550ef703e095f8b1116ab/website/public/data/hops.json) | **220 entrées réelles** au commit épinglé ; agrégation de fabricants, liens primaires lorsqu’ils sont fournis | Plages et descripteurs documentaires importés séparément. Pas de date ni d’unité attestées dans le fichier normalisé ; pas de radar, moyenne ou score de substitution repris |
| [hops-json](https://github.com/stuartraetaylor/hops-json/blob/655499ffda7166abff83f52f8012390ffc1107f7/hops.json) | **119 entrées**, issues de BrewDB selon le README | Source communautaire, année et unité inconnues ; les bornes ne deviennent pas des mesures de lot |
| [Beer Maverick](https://beermaverick.com/hops/) | **318 pages détaillées**, toutes récupérées ; plages historiques de fournisseurs, unités explicites, tags | Fiches conservées séparément ; dates HTML de modification, aucune moyenne intersource. La base explique élargir des plages en présence de divergences de fournisseurs |

Avec la référence propre à l’étude Cascade, ces packs contiennent **760
fiches**, pas 760 variétés biologiquement distinctes. Citra, par exemple,
apparaît dans plusieurs bases. Aucune moyenne, fusion d’identité ou
interchangeabilité scientifique n’est déduite du seul nom. L’interface montre
l’auteur de la référence et permet de filtrer les sources.

Deux anomalies concrètes ont été prises en compte :

- [Super Galena, Hopsteiner](https://www.hopsteiner.de/en/products/all-hop-varieties/detail/sga)
  présente des bornes bêta `8.0–2.5`. Elles ne sont pas inversées pour produire
  un chiffre plausible : le champ reste non exploitable et le texte publié
  reste consultable avec sa source.
- [Citra, Beer Maverick](https://beermaverick.com/hop/citra/) porte une date
  de modification HTML de 2023. Le millésime 2025 de son titre destiné aux
  moteurs de recherche n’est pas repris comme année d’analyse ou de récolte.

Les valeurs ponctuelles publiées restent des points sans marge inventée.
Les unités manquantes des fichiers GitHub restent `unknown`, avec une base
également inconnue, et sont interdites comme unités de prédicteur ou de seuil.
Les zéros utilisés comme remplissage par un agrégat ne deviennent pas des
preuves d’absence d’un composé. La source de l’agrégat et son commit sont
conservés ; un lien de fabricant cité par cet agrégat n’est pas présenté comme
une page primaire relue pour chacune de ses valeurs.

Le [lexique BarthHaas publié](https://www.barthhaas.com/fileadmin/user_upload/downloads/barth-berichte-broschueren/hop_harvest_guide/barthhaas-hop-harvest-guide-2019-en.pdf)
comprend aussi des familles mentholées, végétales et crémeuses/caramélisées.
Le choix local privilégie les fruits et reste modifiable ; il ne revendique
pas une couverture universelle ou l’identité avec HOPSESSED. Un changement
d’axes doit porter une version et préserver les définitions historiques.

## Millésime, terroir et stockage

L’étude Strata de Chenot et Shellhammer (2026) suit plusieurs récoltes et
exploitations/parcelles. Elle constate des variations de composés, mais ne
permet pas d’isoler proprement terroir, conduite culturale, récolte et
transformation. Un emballage plus oxygéné se comporte différemment des lots
conservés sous faible oxygène. Ce résultat ne justifie pas de pénalité annuelle
uniforme ni de multiplicateur régional pour toutes les variétés.
[Article primaire](https://doi.org/10.1080/03610470.2026.2673486).

Le guide BarthHaas portant sur la récolte 2023 a été présenté en mars 2024 :
publication et récolte sont distinctes. [Annonce officielle](https://www.barthhaas.com/company/news/news-article/bh/barthhaas-issues-hop-harvest-guide-2023).
L’étude Callista examine également maturité de récolte, année et localisation ;
son résumé ne suffit pas à installer un coefficient transférable.
[Résumé primaire](https://pubmed.ncbi.nlm.nih.gov/38129004/).

Conséquence dans le produit : année de récolte, région, producteur et stockage
sont attachés au **lot**. Ils sont conservés à l’export et transmis au compagnon,
sans être utilisés comme corrections numériques non documentées. La forme du
produit et les unités restent des conditions de compatibilité indépendantes.
Pour un futur modèle de fermentation, il faudra aussi distinguer sa température
de celle du contact au whirlpool ; la note de protocole ne doit pas devenir un
raccourci pour confondre ces deux variables.

## Retours de brasseurs et littérature pratique

La recherche a inclus les publications d’auteurs brasseurs, les comptes rendus
de fabricants et les discussions HomebrewTalk et Aussie Home Brewer. Ces
sources peuvent suggérer des expériences ou des causes à contrôler ; elles
ne reçoivent pas le poids d’une mesure analytique répétée.

- L’essai de Phil Rusher chez Brülosophy compare des timings avec Imperial
  A24 et un mélange de houblons. Dix essais triangulaires sont réalisés par
  **un même dégustateur**. Le résultat non significatif ne prouve ni une
  équivalence ni l’absence de biotransformation. Aucune marge ou pente
  chimique n’en est extraite. [Compte rendu de 2021](https://brulosophy.com/2021/03/01/biotransformation-impact-of-dry-hopping-neipa-at-high-krausen-when-fermented-with-imperial-yeast-a24-dry-hop-exbeeriment-results/).
- HomebrewTalk montre des calendriers d’ajout variables, sans COA, contrôle
  commun ou phase physiologique prouvée. Un nombre d’heures après ensemencement
  ne certifie pas le même état fermentaire dans tous les brassins.
  [Discussion de 2018](https://homebrewtalk.com/threads/biotransformation-hop-schedule.649715/).
- Aussie Home Brewer présente des explications contradictoires de l’activité
  après dry-hop. Elles soulignent le besoin de mesurer la densité plutôt que
  d’attribuer tout dégazage à une reprise de fermentation. Les affirmations
  niant le hop creep ne supplantent pas les expériences sur les enzymes.
  [Discussion de 2019](https://aussiehomebrewer.com/threads/dry-hop-hop-creep-and-d-rest.101168/).

Deux notes communautaires sont installables avec le type de source clairement
indiqué. Le compagnon peut les citer comme retours de brasseurs ; elles ne sont
jamais sélectionnées comme modèles par le moteur. Aucun ouvrage payant ou
contenu inaccessible n’est présenté comme ayant été lu intégralement.

## Revue du moteur et corrections

| Point contrôlé | Résultat / correction |
| --- | --- |
| Triplet et contexte | Pas de prédiction chiffrée sans variété, souche et timing explicites ; premier moût distinct ; un jour de dry-hop n’identifie pas une phase de fermentation |
| Valeur analytique ponctuelle | Une valeur hors domaine est refusée même sans intervalle ; l’absence de marge ne contourne plus ce contrôle |
| Donnée manquante | L’enveloppe de secours inclut le domaine complet de l’étalonnage, afin qu’une donnée absente ne rende pas le calcul plus précis |
| Unités et bases | % d’huile, mg/100 g de houblon, µg/kg et ng/L de bière restent distincts ; aucune densité d’huile ou correction de matière sèche supposée |
| Année d’un COA | Une année inconnue réduit la confiance et reste inconnue dans l’instantané ; elle ne devient pas une incompatibilité dimensionnelle. Les coefficients et seuils, eux, exigent toujours une provenance datée |
| Composition | Un seul ajustement conjoint par sortie ; union conservatrice entre modèles, confiance réduite si contradiction ; pas de profil d’assemblage obtenu par somme |
| Score | Un axe inconnu élargit le score ; il ne disparaît pas du dénominateur. Les plages qui se recouvrent ne prouvent pas un ordre sensoriel |
| Vigilances | Hop creep indépendant du score ; 4MMP et précurseurs exigent un seuil sourcé, une unité, une base et une matrice compatibles |
| Recettes | Conservation des associations à l’enregistrement et aux modifications internes ; changement d’identité ou de procédé retire les associations devenues fausses |
| Brassage | Copies profondes des cibles et références ; prise en compte des masses consignées et du contact d’ébullition terminé |
| Historique | Prédictions immuables avec données et versions copiées ; la différence perçu − prévu conserve les deux marges |
| Compagnon | Même moteur côté client et serveur ; chargement de l’index à la demande depuis les autres écrans ; propositions de cible avec bornes liées |
| Coefficients invalides | Une connaissance invalide est exclue du calcul et reste corrigeable ; aucun coefficient de remplacement silencieux |
| Voie glutathionylée | Une β-lyase positive ne suffit pas à supprimer la vigilance sur le transport et le traitement du conjugué |
| Import volumineux | Validation entière, comparaison par identifiant, lots réseau de 450, réimport identique sans écriture ; aucune atomicité globale revendiquée |
| Catalogues et IA | Fiches affichées par vingt ; validation et indexation une fois par classement. Analyses complètes dans les outils, aperçu limité dans le prompt, identités utiles dans les propositions persistées |
| Graphes | Plages de cible, prédiction et dégustation sur des pistes séparées ; inconnu visible, jamais remplacé par zéro ou un sommet de radar |
| Calcul indépendant | Régression SVD, PRESS et bornes contrôlés avec NumPy ; tests des coefficients signés, poids incertains et écarts historiques |

Les équations du moteur ne cherchent pas à estimer une réaction inconnue.
Pour un ajustement documenté, elles propagent `intercept + Σ(coefficient × mesure)
+ résidu` par intervalles. Pour le classement, la distance d’une valeur à la
plage cible vaut zéro dans cette plage, puis augmente avec son éloignement,
normalisé par l’étendue de l’axe. Les poids sont des données sourcées ; un axe
inconnu garde une erreur possible couvrant tout l’axe. Le score est un choix
de produit pour rapprocher des profils, pas un modèle psychophysique.

## Reproduire et actualiser les extractions

Les scripts ne font aucun appel IA ni écriture Firestore :

```text
node scripts/scrape-hopsteiner.mjs
node scripts/scrape-hop-community.mjs
node scripts/scrape-hop-literature.mjs
node scripts/audit-hop-index.mjs
node scripts/build-hop-study.mjs --check
python scripts/check-hop-study-math.py
```

Les scrapers utilisent un cache local, les URL, empreintes SHA-256 du contenu
conservé et dates de récupération. Les anciennes pages mises en cache sans
reçu conservent une date inconnue ; la date de compilation du manifeste ne
la remplace pas. `--refresh` relit les pages accessibles. Pour les dépôts GitHub,
les commits restent épinglés : une nouvelle révision exige une modification
explicite et une revue du diff. Une exécution d’échantillonnage `--limit` ne
remplace pas le catalogue complet. Une extraction de catalogue interrompue
par des erreurs ne remplace pas le pack complet précédent.

Les reçus et pages brutes sont dans le dossier local ignoré
`.codex-remote-attachments/hop-index/`. Les données normalisées et leurs
provenances sont versionnables dans `src/data/`. Les deux notices MIT figurent
dans [`hop-catalogue-LICENSES.txt`](../src/data/hop-catalogue-LICENSES.txt).
Les pages de fabricants ne sont pas reproduites intégralement dans l’application.

Les refus HTTP sont consignés, sans contournement : certaines pages Lallemand
et HomebrewTalk étaient consultables via l’index de recherche mais refusaient
le téléchargement direct. Le texte intégral téléchargeable, le texte indexé
consulté et une simple référence bibliographique ne sont donc pas confondus.
La revue couvre les sources identifiées et accessibles ; elle ne revendique
pas une recherche exhaustive de toute la littérature ou de tous les forums.

Le diagnostic local trouve **3 134 champs analytiques**, dont **1 017** ont
une unité et une année non attestées dans les deux fichiers GitHub. Aucun
de ces nombres ne reçoit une unité déduite. Sur cette machine, un classement
de **22 800 triplets** a pris environ **244 ms** ; c’est une mesure ponctuelle,
pas une garantie sur téléphone. Une seule combinaison de ce diagnostic
disposait d’un étalonnage quantifiable. Le contexte complet des outils
représente **3 124 895 octets**, contre **36 344 octets** pour l’aperçu du
prompt ; les analyses restent consultables à la demande. Ces compteurs sont
reproductibles avec le script d’audit et évolueront avec la bibliothèque.

## Ce qui doit rester explicite

La passe finale de validation donne **1 889 tests réussis**, deux builds
réussis, une couverture des **22 collections** par les règles et trois
parcours Chrome en **320, 390 et 1 280 pixels** sans erreur JavaScript ni
débordement horizontal de page. Le réseau métier et l’IA sont bloqués dans
ce contrôle d’interface. Les imports publics et les exemples synthétiques
de COA y restent identifiables. Aucun déploiement ni test Gemini payant
n’a été effectué. [État opérationnel et limites](index-houblon-implementation.md).

Le resserrement d’une plage après ajout d’un COA démontre la propagation de
l’information ; il ne valide pas à lui seul le lien chimie/perception.
Une observation commerciale sans levure ou timing connus ne peut pas devenir
un exemple d’apprentissage supervisé du triplet. Elle reste utile pour le
vocabulaire, la comparaison descriptive et les écarts, sans attribution causale.

Avant d’activer un nouvel étalonnage, il faut retrouver les unités, le
protocole, les identités, la réponse sensorielle, les domaines et une erreur
résiduelle défendable. Aucun apprentissage automatique ni entraînement
facturable n’est déclenché par les imports ou les tests ordinaires.
