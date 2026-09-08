# Index houblon — implémentation et limites vérifiables

État local du 8 septembre 2026. Aucun déploiement, aucun appel Gemini facturable.
Lire aussi [l’étude scientifique](index-houblon-recherche.md) et
[l’audit initial](index-houblon-conception.md), ainsi que la
[consolidation Deep Research](index-houblon-consolidation.md).

## Parcours livré dans le code

Dans **Stocks → Houblons**, quatre vues partagent les données Firestore :

- **Variétés et lots** : recherche documentaire par nom, alias ou description ;
  saisie manuelle ; recherche IA sourcée ; transcription de COA à relire ; import
  et export au format de sauvegarde existant, import direct des packs documentaires,
  filtre par source. Récolte, région, producteur et stockage sont attachés au lot.
- **Profil recherché** : cible par axe, conditions de brassage, classement des
  triplets par borne prudente d’adéquation. Les pistes sans modèle restent
  visibles et non chiffrées. Sélectionner un lot refait le calcul avec son COA.
- **Dégustations** : observations commerciales, association facultative à une
  prédiction conservée, plages de perception et écarts historiques. La fiche
  brassin ouvre le même parcours pour une dégustation maison.
- **Sources et modèles** : installation explicite du lexique initial, levures,
  modèles à enveloppe observée, édition des paramètres, sources et versions,
  catalogues publics et bibliothèque de notes scientifiques ou communautaires.
  L’édition avancée JSON est validée avant écriture ; ce n’est pas un langage de
  règles exécutables.

La fiche recette associe chaque ajout à une variété et un lot, la souche au
référentiel, le contexte de bière et les intensités recherchées. Le jour de
brassage consulte les mêmes calculs, en tenant compte des masses du journal et
du contact d’ébullition effectivement terminé. Le volume reste celui du plan :
il n’est pas présenté comme un volume mesuré. Plusieurs ajouts ne sont pas
additionnés en un profil sensoriel de bière.

Le compagnon charge les sources et modèles et utilise `lookup_hop_reference`,
`predict_hop_aroma` et `compare_hop_tasting`. Il ne calcule pas ses propres coefficients. Les nouveaux
prompts `lookupHopVariety` et `readHopCoa` passent par la fonction IA générique.
Les réponses sont des propositions ; aucune analyse IA n’est enregistrée sans
relecture dans l’interface.

## Données et traçabilité

| Collection | Rôle |
| --- | --- |
| `hopVarieties` | Références documentaires par variété, source et forme du produit ; deux sources restent deux fiches |
| `hopLots` | Lots et mesures individuelles ; aucun champ hérité recopié |
| `hopKnowledge` | Types fermés : axe, levure, modèle, vigilance, fiabilité et note documentaire |
| `hopPredictions` | Prédictions figées, entrées, sources, coefficients et versions |
| `hopTastings` | Observations datées, axes versionnés, plages et référence facultative |

Les cinq collections sont déclarées dans `dataSchema.ts`, sauvegardées par le
pipeline existant et validées dans `parseBackup`. L’import contrôle tout le
fichier avant la première écriture, conserve les fiches absentes et n’écrit pas
les documents inchangés. Une prédiction existante ne peut pas être remplacée.
Les règles n’autorisent que création et lecture pour `hopPredictions`, comme un
registre. Changer un modèle ou un axe exige une version différente.

Les imports utilisent le `bulkWrite` existant, par lots de 450 écritures.
La validation précède tout envoi, mais plusieurs lots réseau ne constituent
pas une transaction globale : une interruption peut laisser les premiers
lots confirmés. Le rejeu compare les identifiants et contenus et complète
seulement ce qui manque. Aucun import ne supprime les documents absents.

Les boutons d’installation ajoutent seulement les fiches manquantes. Pour
actualiser une source existante, réexécuter le scraper, relire les différences,
puis importer le pack JSON depuis **Variétés et lots → Import, export et archives**.
Ce chemin fonctionne sans redéploiement ; il conserve les contrôles de version
des modèles et l’immutabilité des prédictions. Il remplace les fiches de mêmes
identifiants indiquées dans le fichier : conserver un export avant une révision
est utile pour revoir les anciennes références documentaires.

Les mesures distinguent point analytique, intervalle publié, résultat censuré et
inconnu. Un point sans marge reste un point documentaire : le moteur ne crée pas
une précision autour de lui. Une valeur sous LOD/LOQ conserve sa limite ; une
absence de limite laisse son intervalle inconnu. Un COA hors plage variétale
n’est jamais rabattu dans cette plage. Les bases matière sèche, produit tel
quel, huile et bière restent distinctes.
Une unité absente est explicitement `unknown`, jamais déduite de l’ordre de
grandeur. Une incohérence publiée reste visible avec sa provenance, mais ne
devient pas une entrée du moteur.
L’année inconnue d’une analyse réduit la confiance sans faire perdre sa
compatibilité physique. Elle reste inconnue dans une prédiction conservée ;
elle ne dispense pas de dater la provenance de chaque coefficient ou seuil.

## Calcul effectivement implémenté

Le noyau pur partagé est
[`hopPredictionCore.ts`](../functions/src/hopPredictionCore.ts). Il accepte des
données déjà chargées ; il ne lit pas le réseau et ne dépend pas de React.

Un modèle est limité à une variété, une forme, une souche, un timing et une
matrice nommée. Dose, température et durée doivent appartenir aux plages
documentées. Un champ de domaine absent ne devient pas une autorisation de
calcul universel. Premier moût, ébullition, whirlpool, fermentation active et
après fermentation sont distingués ; un jour de dry-hop ne détermine pas la
phase physiologique.

Deux représentations sont supportées par sortie :

1. Une **enveloppe effectivement observée** dans ce contexte. Ce n’est pas un
   intervalle de confiance statistique ni une intensité tirée d’un descripteur.
2. Un **étalonnage linéaire conjoint** avec intercept, coefficients par mesure,
   domaines des prédicteurs et résidu. Chaque paramètre possède sa plage et sa
   provenance datée. La propagation est une arithmétique d’intervalles
   conservatrice ; elle n’est pas une somme de règles enzymatiques indépendantes.

Les paramètres de régression ne doivent être entrés que si une étude ou des
observations permettent réellement de les estimer. Le pack Cascade fournit
une reconstruction exploratoire de 29 observations publiées, détaillée dans
[la note d’étalonnage](index-houblon-etalonnage.md), avec confiance faible.
Si un prédicteur manque, seule une enveloppe observée documentée peut
subsister, élargie au domaine complet de l’étalonnage pour ne pas gagner
artificiellement en précision. Une mesure connue
hors domaine produit une abstention plutôt qu’une extrapolation.

Plusieurs modèles applicables donnent l’union de leurs plages. Des résultats
disjoints abaissent la confiance. Le score de rapprochement mesure une distance
normalisée à la plage cible, pondérée par les poids sourcés des axes. Un axe
inconnu contribue un intervalle complet d’erreur possible ; il n’est pas retiré
du dénominateur. Si tous les axes cibles sont inconnus, le score est inconnu.

La politique initiale est un jugement local déclaré : échelle personnelle
0–100, coupures 33 et 66, importance égale des axes. Ces nombres sont dans le
document d’installation JSON et deviennent modifiables en base. Ils ne sont
pas présentés comme des seuils perceptifs publiés. Les confiances sont des
classes ordinales plafonnées par la qualité des sources, sans pourcentage de
probabilité inventé ni décote automatique liée à l’âge d’une publication.

Les vigilances sont séparées : possibilité de hop creep au houblonnage à cru ;
4MMP et précurseurs évaluables seulement avec seuil, unité, base et matrice
documentés. Aucun seuil universel d’excès de 4MMP n’a été installé. Le seuil de
détection olfactive n’est pas réutilisé comme seuil de rejet.
Une β-lyase positive ne suffit pas à lever la vigilance sur un conjugué
cystéinylé ou glutathionylé dont le transport et le traitement dans ce milieu
ne sont pas établis. Les instantanés v2 sont rejoués à l’import depuis leurs
preuves figées pour vérifier les plages et la confiance ; les v1 sont conservés.

## Bibliothèque installable et coût de fonctionnement

- **766 références** : 102 Hopsteiner, 220 HopDatabase, 119 hops-json,
  318 Beer Maverick, une référence Cascade de l’étude et six références
  regroupant les nouveaux échantillons publiés. Il ne s’agit pas de
  766 variétés différentes : les sources se recoupent et ne sont pas fusionnées.
- **Un étalonnage sensoriel exploratoire**, **six identités de levures**,
  **34 notes documentaires** et **10 échantillons publiés** portant 88 mesures
  supplémentaires. Le corpus total contient 3 222 mesures. Ces échantillons
  sont identifiés comme documentaires et ne représentent pas du stock disponible.
- L’année inconnue des agrégats GitHub reste inconnue. La date de mise à jour
  d’une page et la récolte d’un lot sont deux informations différentes.
- Catalogues chargés dynamiquement dans l’interface, liste affichée par vingt
  fiches, recherches par nom/alias/description et filtre de source.
- Calcul pur : les connaissances sont validées et les identifiants indexés
  une fois par classement. Aucun cache persistant ne masque une révision.
- Compagnon : chargement à la demande hors de l’onglet Houblons. Les outils
  disposent des analyses complètes ; les prompts contiennent un aperçu,
  les sources et les modèles, avec les références pertinentes pour les lots
  ou modèles. `lookup_hop_reference` retrouve les autres fiches et COA.
- Les propositions persistées conservent seulement les identités nécessaires
  à leur rejeu, les définitions utiles et une indication explicite de recharger
  les analyses avant un nouveau calcul. Elles ne dupliquent pas les catalogues.
- Les plafonds du contexte IA sont visibles en cas de troncature : 1 000
  références variétales, 400 lots/connaissances, 20 prédictions et dégustations
  récentes. Ces plafonds ne limitent pas les collections de l’utilisateur.

## Vérifications et points encore ouverts

- Validation finale locale du 8 septembre 2026 : **1 914 tests réussis dans
  82 fichiers**, builds Vite et Cloud Functions réussis. Aucun appel Gemini réel.
  Le correctif final de validation v2 passe également ses 72 tests ciblés.
- Tests dédiés : repli COA, absence/ND/zéro, unités et formes, propagation du
  résidu, modification des coefficients, manque de provenance, contradictions,
  classement prudent, copie profonde au lancement et comparaison historique ;
  validation des 766 références, import de plus de 450 documents, rejeu sans
  écriture, unité inconnue, dates impossibles, intégrité sémantique des v2 et
  score pondéré comparé aux sommets de 60 boîtes d’incertitude.
- Recalcul indépendant par NumPy (SVD et identité PRESS) : paramètres et
  erreurs de validation croisée concordent avec le pack JavaScript.
- Parcours Chrome en **320, 390 et 1 280 px** : classement, resserrement par lot,
  sauvegarde de deux prédictions et dégustation commerciale. Aucun débordement
  horizontal de page ni erreur JavaScript. Le réseau métier/IA est bloqué dans
  le script ; les packs publics sont réellement installés dans le cache local,
  puis des fixtures explicitement synthétiques vérifient le parcours COA.
  Le pack des échantillons publics et son rejeu sans écriture sont vérifiés.
- Les règles générées couvrent **22 collections**. Cela vérifie la couverture
  textuelle ; cela ne prétend pas tester des règles déployées sur Firebase.

Les scripts et résultats de contrôle sont dans
[`check-hop-index-mobile.mjs`](../scripts/check-hop-index-mobile.mjs) et le
dossier local ignoré `.codex-remote-attachments/hop-index/`.
Le rapport graphique est `report.json`, le diagnostic de données et de coût
est `data-audit.json`, la suite complète de cette passe est consignée dans
`deep-research-2026-09-08/full-test-final.log`.
Vite signale encore des chunks de grande taille ; les quatre catalogues sont
chargés séparément à la demande. Cela n’est pas masqué par un relèvement du
seuil d’avertissement.

**Limite scientifique actuelle :** le seul modèle sensoriel installé porte
sur Cascade en cônes × Wyeast 1728 × ajout après fermentation dans la bière
clarifiée du protocole publié. Il ne couvre ni pellets, ni NEIPA, ni fermentation
active, ni changement arbitraire de souche. Son transfert à un nouveau millésime
reste exploratoire. Le parcours logiciel et le calcul sont testés ; leur
validité sensorielle générale n’est pas démontrée. Un COA limité à l’alpha ne
précise pas à lui seul l’arôme d’agrumes. Une observation commerciale dont
le triplet est inconnu reste une observation, pas un exemple supervisé du triplet.

Choix d’interface : palette, champs et feuilles du dépôt ; lignes lisibles
montrant origine et incertitude ; classes en premier, plages et sources
dépliables ; graphes de plages distinctes pour cible, prédiction et dégustation.
Un inconnu n’est ni zéro ni un sommet de radar. Les fixtures et captures
restent séparées des données de production.

La [passe complémentaire sur les photographies Lallemand](index-houblon-lactones-esters.md)
ajoute 13 notes, trois identités analytiques et l’unité absolue µg/L de bière.
Elle n’ajoute aucun coefficient au moteur. Le journal de suite le plus récent
est `photos-followup-2026-09-08/full-test.log`.
