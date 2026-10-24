# E — Données houblon : ce qui existe, ce qui est établi, ce que le moteur peut en tirer honnêtement

Recherche du 18.10.2026 (chercheur science brassicole et données, Opus 5.5). Dépôt lu sans modification ;
sources web consultées le 18.10.2026. Les numéros `[n]` renvoient à la section Sources.

**Niveau de preuve.** **[P]** publié : article à comité de lecture, mesure primaire ou fiche d'un
organisme public. **[F]** fiche fabricant ou fournisseur : donnée commerciale, méthode rarement
décrite. **[S]** secondaire : blog, vulgarisation ou opinion d'expert. **[H]** hypothèse de l'auteur.
*relayé* : page non lue en direct (Beer Maverick et Wiley ont répondu 403, Yakima Chief 429). Le
contenu vient alors du résumé d'un moteur de recherche.

---

## 0. L'essentiel

- **Le flou vient du modèle, pas d'un manque de données.** Dans V5.5, une famille qu'aucune fiche
  ne cite prend tout le domaine (`descriptor.unmentioned` = 0–1, `hopExtrapolationBootstrap`). Le
  code le dit lui-même : les analyses d'huile ou de thiols ne sont pas transformées en intensité
  (`functions/src/hopExtrapolationCore.ts`, l. 137). Pourtant, le dépôt contient déjà l'huile totale
  de 318 variétés, le myrcène, l'humulène et le caryophyllène de 260 variétés, et le linalol de 77.
- **Les fiches divergent fortement.** Pour Nugget, l'huile totale va de 0,8 à 3,3 mL/100 g selon
  six sources, et le myrcène de 27 à 59 % de l'huile. D'une récolte à l'autre, Hopsteiner mesure
  −61 % du rapport linalol/alpha pour Perle et −45 % d'huile pour Hallertau Blanc [1].
- **Même la chimie mesurée prédit peu le sensoriel.** L'huile totale n'est pas corrélée à
  l'intensité aromatique (23 lots de Cascade) [2]. Un composé marqueur explique environ la moitié de
  la variance, et seulement au sein d'une variété [3]. Avec 226 mesures faites sur la bière finie,
  le R² moyen face à un panel entraîné reste de 0,21 [4].
- **S1 : le trou est d'abord un trou d'import.** La boutique Hopsteiner US décrit Nugget comme
  « woody and resiny » [5] ; Yakima Chief le dit « woody » [6]. Or la famille de l'app « Boisé et
  résineux » contient justement les mots *woody* et *resinous*. Ensuite, après 60′ d'ébullition, le
  myrcène a disparu. Le boisé ou l'épicé perçu vient plausiblement des produits d'oxydation de
  l'humulène et du caryophyllène (« kettle hop »). L'amertume, le torréfié ou l'oxydation peuvent
  aussi l'expliquer.
- **Ce qui est réaliste :** un a priori **ordinal** à plusieurs sources ; une chimie exprimée en
  **charge introduite par moment**, avec une table de survie qualitative ; la **dégustation du
  brasseur** comme point de départ. Pas d'intensité 0–100 que les données ne portent pas.

## 1. Données quantitatives par variété

### 1.1 Déjà dans le dépôt (comptage du 18.10.2026)

| Fichier | Variétés | Champs présents (nombre de variétés) | Utilisation dans V5.5 |
|---|---|---|---|
| `hopBeerMaverickBootstrap.json` | 318 | alpha, bêta, huile totale (318) ; myrcène, humulène, caryophyllène (260) | composants en % d'huile, **refusés** par `introducedChemistry` (« unité non additionnable ») |
| `hopManufacturerBootstrap.json` (Hopsteiner 2025) | 102 | alpha, bêta, huile totale (102) ; linalol (77) ; familles déclarées ; classe « Thiol impact » | seuls les **mots** des fiches comptent |
| `hopDatabaseBootstrap.json` (kasperg3, MIT) | 220 | alpha, bêta, huile totale (unité inconnue) | idem |
| `hopPublicLotBootstrap.json` | 6 (10 lots) | certificats d'analyse YQH, HopTechnic, YCH, Clayton | lots |

Le farnésène est publié par Beer Maverick (Nugget : 0–1 %) mais n'a pas été importé.

### 1.2 Sources externes

| Source | Couverture | Champs huile | Sensoriel | Fiabilité, provenance | Licence, accès |
|---|---|---|---|---|---|
| **Beer Maverick** [F agrégé] [7] | ≈ 318 variétés | huile totale, myrcène, humulène, caryophyllène, farnésène, « autres » | étiquettes (#herbal…), radar 0–5 | plages historiques agrégées de fournisseurs, élargies en cas de désaccord ; ni récolte ni lot | aucune licence ouverte trouvée ; 403 aux robots |
| **Yakima Chief Hops** [F] [6] [8] | portefeuille YCH (non compté) | huile totale, myrcène, humulène, caryophyllène, farnésène, **linalol, géraniol, β-pinène**, autres | 3 à 5 étiquettes, et **CATA** : % d'évaluateurs qui cochent chacune des **15 catégories** (sweet, aromatic, berry, stonefruit, pomme, melon, tropical, citrus, floral, herbal, vegetal, grassy, earthy, woody, spicy) | plusieurs années de récolte ; YCH précise que l'analyse sensorielle d'un houblon n'indique pas forcément le goût en bière | propriétaire ; 429 aux robots (relayé) |
| **Hopsteiner** [F] [5] [9] [1] | ≈ 100 variétés | huile totale, farnésène, linalol (% d'huile), cohumulone, xanthohumol ; myrcène absent de la fiche Nugget | familles déclarées sur houblon brut, descripteurs, classe thiols | fiche mise à jour le 11.02.2025 ; la **boutique US diverge** (huile de Nugget 0,8–1,5 contre 1,5–3,0 sur la fiche) ; newsletter annuelle des écarts de récolte | aucune licence sur la fiche variété |
| **BarthHaas** [F] [10] | catalogue BarthHaas | linalol, géraniol (% d'huile), etc. ; « moyenne des 4 dernières années » ; méthodes ASBC Hops-17 et EBC 7.12 (relayé) | Hop Aroma Compendium 2013 : radar sur houblon brut et sur infusion froide ; Hop Harvest Guide annuel | méthode normalisée | propriétaire (non vérifié) |
| **Hopfenforschung Hüll** [F institut] [11] | variétés cultivées en Allemagne | huile totale, **linalol en mg/100 g**, rapport linalol/α, farnésène, rapport caryophyllène/humulène | profils d'arôme sur houblon brut, **en bière** et en dry hop (graphiques) | institut de recherche | aucune licence affichée |
| **USDA-ARS, fiches de cultivars** [P] [12] | cultivars USDA | huile totale (moyenne sur 3 ou 10 ans) ; composants pour certains (Centennial oui, Nugget non) | une phrase | essais publics anciens | œuvre fédérale américaine, probablement libre [H, à confirmer] |
| **Hop Growers of America**, Variety Snapshot 2017–2020 [F] [13] | variétés américaines | alpha, bêta, cohumulone, huile totale ; composants à vérifier | descripteurs | PDF gratuit, sans récolte précisée | licence non indiquée |
| **John I. Haas**, fiches courtes [F] [14] | portefeuille Haas | myrcène, humulène, caryophyllène, farnésène | descripteurs | Nugget : myrcène 27–42 % (relayé), loin des autres sources | propriétaire |
| **Littérature académique** [P] | 1 à 84 lots par étude | GC-MS complet ; thiols (4MSP dans 53 échantillons : < 1 à 114 µg/kg, valeurs maximales chez Citra, Eureka, Simcoe, Apollo, absent des variétés traditionnelles allemandes et anglaises) [15] | panels entraînés | élevée, mais conditions étroites | souvent payant ; CC BY chez MDPI, Nature Comm., Kvasny Prumysl |
| **Certificat du lot acheté** [P lot] | le lot | selon le laboratoire : alpha, bêta, HSI, huile totale, parfois composants | — | **la meilleure donnée** pour la bière brassée | document du fournisseur |

### 1.3 Dispersion des sources : Nugget

| Source | Huile totale (mL/100 g) | Myrcène (% huile) | Humulène | Caryophyllène | Linalol |
|---|---|---|---|---|---|
| Beer Maverick (dépôt) | 0,9–3,3 | 48–59 | 12–22 | 7–10 | — |
| YCH (relayé) | 1,0–3,0 | 40–55 | 16–22 | 7–11 | 0,6–1,0 % |
| Hopsteiner, fiche | 1,5–3,0 | — | — | — | 0,8–1,0 % |
| Hopsteiner, boutique | 0,8–1,5 | — | — | — | — |
| John I. Haas (relayé) | — | 27–42 | 16–19 | 7–10 | — |
| USDA-ARS | 1,56 (0,8–2,57 sur 10 ans) | — | — | — | — |
| Hüll | 1,4 | — | — | — | 10 mg/100 g |

Les sources s'écartent d'un facteur 4 sur l'huile totale et d'un facteur 2 sur le myrcène.
D'une récolte à l'autre, l'huile varie de −45 % à +38 %, et le rapport linalol/alpha de −61 % à
+29 % [1]. Une valeur variétale n'est donc qu'une plage large : le lot prime.

## 2. Liens entre composés et familles d'arôme

| Composé | Descripteurs | Seuil indicatif en bière | Ébullition de 60′ | Whirlpool | Houblonnage à cru | Famille de l'app |
|---|---|---|---|---|---|---|
| β-myrcène | herbacé, résineux, vert, balsamique [16] | 9,5 à 350 µg/L selon les sources [16] | ≈ 50 % perdu en 10 min, absent à 60 min (Mitter et Steiner 2009, relayé) [17] | partiel | peu soluble ; pic à 3–6 h puis baisse [18] ; emporté par le CO₂ et la levure [16] | résineux, végétal, herbacé |
| α-humulène, β-caryophyllène | épicé, boisé [16] | 120–450 et 230 µg/L [16] | hydrocarbures perdus, mais **≈ 30 produits d'oxydation formés** pendant l'ébullition, qui orientent la bière vers boisé, foin, houblonné, épicé [19] ; humulène époxyde I au-dessus du seuil dans les bières houblonnées en cuve [16] | — | peu solubles | boisé et résineux, épicé, herbacé |
| sesquiterpénoïdes oxygénés | épicé, herbacé, « noble » ; picotement trigéminal [20] [21] | seuils individuels au-dessus des teneurs en bière, mais effet d'ensemble à quelques ppb [20] | formés | — | — | épicé, herbacé, boisé |
| linalol | floral, lavande, agrumes [16] | 8 µg/L (tableau [16]) ; varie avec l'énantiomère et la matrice | quasi éliminé en 70 min (Kishimoto, relayé) [22] | mieux retenu à 85 °C qu'à 95 °C [17] ; un whirlpool de 20 min dépasse un ajout à 60′ [17] | extrait ; continue de monter sur 24 h [18] | floral, agrumes |
| géraniol | floral, rose [16] | 4 à 40 µg/L [16] | mieux retenu que le myrcène [17] | — | transformé en β-citronellol par la levure [23] | floral |
| β-citronellol | citron, lime [16] | 8 à 40 µg/L [16] | formé par la levure | — | linalol, géraniol et citronellol additionnent leurs effets ; mélange perçu agrumes [23] | agrumes |
| esters du houblon (2-méthylbutyl isobutyrate) | fruité [16] | 78 µg/L [16] | diminuent [17] | — | transfert jusqu'à ≈ 80 % (Gahr 2019, relayé) [17] | fruits (sans famille précise) |
| 4MMP (thiol) | cassis, fruit de la passion [16] | 1,5 ng/L [16] ou 6 ng/L [24] | −91 % (étude sur Simcoe non nommée, relayé) [17] | préférer un whirlpool plus frais [17] | forme libre plus précurseurs 100 à 1 000 fois plus abondants, libérés par la β-lyase de la levure [24] | petits fruits, tropical |
| 3MH, 3MHA | pamplemousse et rhubarbe ; fruit de la passion [16] | 55 et 4–5 ng/L [16] [24] | 3MH augmente à chaud (relayé) [17] | — | la levure estérifie le 3MH en 3MHA [24] | agrumes, tropical |

Autres résultats établis :

- **Dose de dry hop.** Cascade de 2 à 16 g/L : l'extraction plafonne vers 8 g/L, dès 4 g/L pour les
  notes d'agrumes. À forte dose, le profil glisse vers herbacé et thé [25] [P ; chiffres relayés].
- **L'huile totale prédit mal.** Sur 23 lots de Cascade, aucune corrélation avec l'intensité [2].
  Sur 84 lots, le géraniol (Cascade) et le β-pinène (Centennial) font mieux ; un marqueur explique
  environ la moitié de la variance, l'huile totale moins de 30 % [3] [P ; relayé].
- **Indicateurs du métier.** Rapport linalol/alpha pour un ajout tardif [1] [11] ; mL d'huile par
  hL pour un dry hop : 2 mL/hL en ajout tardif, 4 mL/hL à cru dans l'exemple BarthHaas [10] [F].
- **Interaction arôme–amertume.** L'arôme de houblon rend l'amertume plus âpre, plus persistante et
  plus astringente, surtout par l'odorat [26] [P].
- **Fiches contre bière.** Sur 9 bières mono-houblon, les descripteurs des catalogues ne
  correspondent pas toujours au panel. Les alpha, le linalol, le myrcène et le géraniol sont utiles,
  selon l'étape de brassage [27] [P].

## 3. Une stout « trop résineuse » avec Nugget seul à 60′

Recette S1 : 46 g dans 20 L (2,3 g/L), 60′, DI 1,066, 70 EBC, US-05, 59,7 IBU. Le style BJCP 16D
prévoit 50–70 IBU et un arôme de houblon « faible, terreux, herbacé ou floral, facultatif ». Le
torréfié doit rester « sans morsure vive » [28].

**Charge introduite [H, calcul sur les fiches].** 0,37 à 1,52 mL d'huile, soit 18 à 76 µL/L, dont
3 à 25 µL/L d'humulène et de caryophyllène. Le linalol représente ≈ 0,1 à 0,65 mg/L (0,23 mg/L avec
la valeur de Hüll). Aucune donnée publique ne permet de calculer ce qui reste après 60′.

Explications, de la plus solide à la plus fragile :

1. **Lacune d'import, pas absence de description** [F, vérifié]. La boutique Hopsteiner US
   annonce un profil « woody and resiny » et l'étiquette « Resinous » [5]. YCH donne « woody » [6].
   Charles Faram évoque « a touch of resin » en bouche (relayé) [29]. Yakima Valley Hops parle de
   « woody and piney », qu'il attribue au myrcène (opinion, relayé) [29]. Avec ces fiches, Nugget
   serait cité dans « Boisé et résineux ». Le lexique a aussi des trous : *resiny*, *dank* et *ginger*
   (étiquette Beer Maverick de Nugget) ne correspondent à aucune famille.
2. **Arôme d'ébullition issu des sesquiterpènes** [P pour le mécanisme ; intensité non chiffrée].
   Le myrcène a disparu à 60′ [17]. L'humulène et le caryophyllène forment des époxydes, des
   humulénols et de l'oxyde de caryophyllène, qui donnent boisé, foin et épicé [19] [20]. Nugget est
   riche en huile et dosé à 2,3 g/L : c'est l'origine houblon la plus plausible d'un **boisé**. Un
   résineux de type sapin ou sève (myrcène, pinène) est peu plausible après 60′.
3. **Amertume** [P pour le mécanisme, H pour l'application]. Avec 60 IBU, la bière est dans le haut
   de la bande ; la cohumulone de Nugget est de 24–30 % [9]. L'arôme rend l'amertume plus âpre et plus
   persistante [26]. En brasserie, « résineux » désigne aussi la sensation des résines amères [S].
4. **Malt torréfié** [P partiel]. Le gaïacol, au descripteur fumé, et le 4-méthylphénol sont plus
   concentrés dans les bières brunes, et le gaïacol est élevé dans les malts chocolat et noir [30].
   Aucune étude trouvée sur le masquage par le torréfié ou une confusion avec le résineux [H].
5. **Oxydation** [H, peu de preuves trouvées]. Un houblon âgé ou une bière vieillie : le gaïacol des
   bières brunes augmente encore après 14 mois de vieillissement [30].
6. **Levure** [faible]. US-05 est neutre et ne crée pas de résine.

**Conséquence pour le moteur.** Deux voies sont documentables pour « moins boisé ou résineux » :
réduire la masse à l'ébullition à IBU égal, avec un houblon d'amertume plus pauvre en huile ou en
humulène par IBU, et baisser l'IBU vers le bas de la bande. Les afficher comme « plausible, non
chiffré ».

## 4. Modèles existants

| Outil ou étude | Entrées | Sortie | Fiabilité |
|---|---|---|---|
| Hop Oils Calculator, Scott Janish [S] [31] | variété, grammes, moment (whirlpool, pré-fermentation, à cru ; **ébullition exclue**) | composition d'huile estimée et radar du Hop Aroma Compendium | moyennes variétales du Select Botanicals Group ; aucune validation publiée |
| Dosage d'huile BarthHaas [F] [10] | mL/100 g, volume | grammes pour viser un nombre de mL/hL | règle de dosage, pas prédiction |
| Rapport linalol/alpha, Hopsteiner [F] [1] | analyses de récolte | ajustement d'un ajout tardif | indicateur, pas sensoriel |
| Lafontaine et al. 2018 [P] [3] | 16 analytes d'huile, 84 lots | intensité et qualité du dry hop | ≈ ½ de la variance par un marqueur, propre à chaque variété |
| Vollmer et Shellhammer 2016 [P] [2] | huile totale, 23 lots | intensité | aucune corrélation |
| Legisa et Mengoni 2021 [P] [27] | catalogue, certificats, 9 bières | tendances | écarts entre catalogues et panel ; base d'un futur outil |
| Schreurs et al. 2024 [P] [4] | 226 mesures sur 250 bières **finies** | 50 descripteurs du panel, avis RateBeer | R² moyen 0,21 (panel) et 0,69 (RateBeer) ; pas de recette en entrée ; ne sépare pas cause et corrélation |
| V5.5 de L'Affinée | descripteurs, dose, moment, levure | plages 0–100 | hypothèses expertes non ajustées |

Aucun modèle publié ne prédit, avec une précision mesurée, l'intensité de 12 familles d'une bière à
partir de sa recette. La littérature fournit trois choses : des ordres de grandeur de charge
(mL/hL), des marqueurs propres à chaque variété, et le **sens** des effets de la dose, du moment et
de la levure. Je n'ai trouvé aucun logiciel de recette publiant un modèle d'arôme validé [H].

## 5. Recommandation pour le moteur

1. **Remplacer « cité / non cité » par un a priori ordinal, à plusieurs sources, famille par
   famille.** Trois niveaux : *non décrit*, *cité* (1 source), *marqué* (au moins 2 fiches, ou CATA
   YCH au-dessus d'un seuil à fixer). Afficher le compte (« 2 fiches sur 4 »). Le CATA YCH se
   rapproche presque terme à terme des 12 familles : woody donne boisé et résineux, vegetal et grassy
   donnent végétal ; sweet et aromatic restent hors familles. Ajouter la boutique Hopsteiner, Hüll et
   BarthHaas. Étiqueter « houblon brut » ou « en bière ». Compléter le lexique (*resiny*, *dank*,
   *spruce*, *balsamic*, *ginger*, *hay*). **Droits** : aucune de ces sources n'affiche de licence
   ouverte. Un import massif attend l'accord de l'utilisateur ; d'ici là, relever quelques faits
   cités, comme le fait déjà le dépôt. Effet sur S1 : Nugget devient cité en boisé et résineux, et
   « diminuer ou remplacer Nugget » devient une voie établie.
2. **Brancher la chimie déjà présente, comme charge introduite par moment, jamais comme
   intensité.** Calcul : % d'huile × huile totale × masse, en µL par litre. Trois indicateurs :
   myrcène ; humulène et caryophyllène ; linalol et géraniol. La plage couvre toutes les sources.
   Rôle : classer et expliquer les voies (« cette voie retire X µL/L de sesquiterpènes de
   l'ébullition »).
3. **Table de survie qualitative, sourcée, par moment.** Trois classes : absent, partiel, extrait.
   Quatre groupes : hydrocarbures, sesquiterpènes et leurs produits d'oxydation, alcools terpéniques,
   thiols et esters. Moments : ≥ 30′, 10–5′, whirlpool, dry hop actif, dry hop après fermentation.
   Chaque case porte sa source et son niveau de preuve (section 2). C'est cette table qui dit, pour
   S1 : « à 60′ le myrcène a disparu ; reste plausible : boisé, épicé ou foin issus de l'oxydation ».
4. **Situer la bière par la dégustation du brasseur.** Les plages 0–45 ou 0–55 sont un artefact du
   domaine complet donné aux familles non citées. Le point de départ est la perception saisie
   (faible, moyen, marqué) ; le champ `HopTasting.axes[].perceived` existe déjà. Le moteur ne prédit
   que le sens d'une voie et son ampleur relative en crans, avec son niveau de preuve. Masquer les
   plages qui couvrent tout le domaine.
5. **Diagnostiquer hors houblon quand la chimie n'explique pas la plainte.** Liste fixe, sourcée et
   non chiffrée : amertume par rapport à la bande du style, et son interaction avec l'arôme ;
   torréfié ; oxydation (âge et HSI du houblon, âge de la bière) ; forte dose végétale à
   l'ébullition. Les voies associées portent la mention « hors modèle ».
6. **Le lot avant la variété.** Le certificat du lot remplace la fiche variétale. Afficher l'écart de
   récolte quand il est connu. Parler la langue du métier : linalol/alpha pour un ajout tardif, mL
   d'huile par hL pour un dry hop.
7. **Pas de régression fine ; valider en ordinal.** Trois niveaux au plus et le sens des effets.
   Avant d'en afficher davantage, mesurer l'accord avec les dégustations du brasseur, par exemple le
   rang de Spearman ou le pourcentage de sens correct, et le journaliser. Même avec la chimie de la
   bière finie, le R² reste de 0,21 [4].
8. **Thiols et biotransformation : des drapeaux, pas des chiffres.** La classe thiols de Hopsteiner
   et la liste 4MSP [15] signalent un potentiel cassis ou tropical pour un dry hop ou un whirlpool
   tiède. Le passage du géraniol au citronellol [23] peut faire glisser le floral vers les agrumes.
   Une levure non caractérisée reste « inconnue ».

### Que montrer quand la donnée manque

- **Houblon, famille non décrite :** « Aucune des N fiches lues (liste) ne décrit cette famille. Pas
  d'information, ce qui ne veut pas dire pas d'arôme. » L'effet de la voie vaut « ? » ; il est exclu
  du classement chiffré et n'est jamais compté comme 0.
- **Bière non située :** « Le modèle ne place pas ta bière sur cette famille. Pars de ta
  dégustation : faible, moyen ou marqué. »
- **Cause hors houblon :** « Après 60′ d'ébullition, le houblon explique mal un goût résineux.
  Pistes non modélisées : amertume, torréfié, oxydation. »
- **Fiches divergentes :** donner la plage des sources (« huile 0,8–3,3 mL/100 g selon 6 fiches »)
  et proposer de saisir le certificat du lot.
- **Jamais :** une plage 0–100, un repère central sans source, ni 0 pour une valeur inconnue.

## Sources

Toutes consultées le 18.10.2026. *relayé* : contenu obtenu par un résumé de moteur de recherche.

1. Hopsteiner, *Variations in hop aroma depending on crop year*, newsletter 01/2024 (lue).
   https://www.brauwelt.com/images/BWI_NL/hopsteiner/2024/2024-01_TS_Variations.pdf
2. Vollmer, Shellhammer, *Influence of hop oil content and composition on hop aroma intensity in
   dry-hopped beer*, J. Am. Soc. Brew. Chem., 2016 (résumé relayé).
   https://www.asbcnet.org/publications/journal/vol/2016/Pages/ASBCJ-2016-4123-01.aspx
3. Lafontaine, Pereira, Vollmer, Shellhammer, *The effectiveness of hop volatile markers for
   forecasting dry-hop aroma intensity and quality of Cascade and Centennial hops*, BrewingScience
   71, 2018, p. 116–140 (relayé). https://brewingscience.de/index.php/brewingscience/article/view/277
4. Schreurs et al., *Predicting and improving complex beer flavor through machine learning*, Nature
   Communications, 26.03.2024, CC BY (lu). https://pmc.ncbi.nlm.nih.gov/articles/PMC10966102/
5. Hopsteiner, boutique, Nugget Pellets Type 90, © 2024 (lu). https://shop.hopsteiner.com/43209089.html
6. Yakima Chief Hops, Nugget (relayé, 429). https://www.yakimachief.com/nugget.html
7. Beer Maverick, Nugget (relayé, 403 ; relevé du dépôt daté du 08.03.2023). https://beermaverick.com/hop/nugget/
8. Yakima Chief Hops, méthode CATA (relayé, page CTZ). https://www.yakimachief.com/ctz.html
9. Hopsteiner, fiche variété Nugget, mise à jour le 11.02.2025 (lue). https://www.hopsteiner.de/en/products/all-hop-varieties/detail/nug
10. BarthHaas, *What is hop oil?*, 06.06.2021 (lu) ; pages variétés, par exemple Tettnanger (relayé).
    https://www.barthhaas.com/ressources/blog/blog-article/what-is-hop-oil ·
    https://www.barthhaas.com/hops-and-products/hops/tettnang-tettnanger
11. Gesellschaft für Hopfenforschung, Hüll, Nugget (lue). https://www.hopfenforschung.de/en/sorte/nugget/
12. USDA-ARS, fiches des cultivars 21193 (Nugget) et 21507 (Centennial) (lues).
    https://ars.usda.gov/ARSUserFiles/2450/hopcultivars/21193.html
13. Hop Growers of America, Variety Snapshot 2018 et 2020 (relayé).
    https://www.usahops.org/cabinet/data/USAHops_VarietyManual_2018_Web.pdf ·
    https://www.usahops.org/cabinet/data/HGA_VS_2020.pdf
14. John I. Haas, fiche courte Nugget (relayé).
    https://www.johnihaas.com/wp-content/uploads/2020/09/MiniSpecSheets-Nugget.pdf
15. Reglitz, Steinhaus, *Quantitation of 4MSP in hops by a stable isotope dilution assay…*, J. Agric.
    Food Chem. 65(11), 2017, p. 2364–2372 (relayé).
    https://portal.fis.leibniz-lsb.tum.de/en/publications/quantitation-of-4-methyl-4-sulfanylpentan-2-one-4msp-in-hops-by-a-4/
16. Klimczak, Cioch-Skoneczny, Duda-Chodak, *Effects of dry-hopping on beer chemistry and sensory
    properties — a review*, Molecules 28(18):6648, 2023, CC BY, tableau 2 (lu ; matrice des seuils non
    précisée). https://pmc.ncbi.nlm.nih.gov/articles/PMC10534726/
17. Janish, *Survivables: unpacking hot-side hop flavor*, ≈ juin 2020 (lu ; synthèse de Mitter et
    Steiner 2009, Inui 2012, Sharp 2017, Gahr 2019, Reglitz 2018) [S].
    https://scottjanish.com/survivables-unpacking-hot-side-hop-flavor/
18. Wolfe, Shellhammer, Qian, actes ASBC 2012 (relayé). https://asbcnet.org/events/archives/2012Proceedings/Pages/109.aspx
19. Praet, Van Opstaele, Aerts, De Cooman : MBAA 2014 (M-19), ASBC 2015 (n° 9), J. Am. Soc. Brew.
    Chem. 2016, deux articles (relayé).
    https://mbaa.com/meetings/archive/2014/proceedings/Pages/M-19.aspx ·
    https://www.asbcnet.org/publications/journal/vol/2016/Pages/ASBCJ-2016-3257-01.aspx ·
    https://www.asbcnet.org/publications/journal/vol/2016/Pages/ASBCJ-2016-1205-01.aspx
20. *The oxygenated sesquiterpenoid fraction of hops in relation to the spicy hop character of beer*,
    J. Inst. Brew. (vraisemblablement Goiris et al., 2002 ; auteurs non vérifiés) (relayé).
    https://core.ac.uk/works/31199204
21. Dietz, Cook, Huismann, Wilson, Ford, *The multisensory perception of hop essential oil: a
    review*, J. Inst. Brew., 2020, DOI 10.1002/jib.622 (résumé relayé).
    https://nottingham-repository.worktribe.com/output/5013108
22. Thèse de l'Oregon State University résumant Kishimoto (relayé). https://ir.library.oregonstate.edu/downloads/sb397f148
23. Takoi et al., *The contribution of geraniol metabolism to the citrus flavour of beer*, J. Inst.
    Brew., 2010, DOI 10.1002/j.2050-0416.2010.tb00428.x ; suite dans J. Am. Soc. Brew. Chem. 72,
    2014 (relayé). https://asbcnet.org/publications/journal/vol/abstracts/ASBCJ-2014-0116-01.htm
24. Molitor, Shellhammer, *Hop biotransformation & yeast*, Lallemand Brewing, 26.01.2023, mis à
    jour le 12.07.2023 (lu).
    https://www.lallemandbrewing.com/en/asia/resources/whats-new/hop-biotransformation-by-brewing-yeast/
25. Lafontaine, Shellhammer, *Impact of static dry-hopping rate on the sensory and analytical
    profiles of beer*, J. Inst. Brew., 2018, DOI 10.1002/jib.517 (chiffres relayés par la
    vulgarisation). https://brulosophy.com/2019/02/21/the-surprising-science-of-dry-hopping-lessons-from-tom-shellhammer/
26. Oladokun et al., Food Res. Int. 86, 2016, p. 104–111 ; Food Chem. 230, 2017, p. 215–224
    (résumés relayés). https://eprints.nottingham.ac.uk/35018/ · https://eprints.nottingham.ac.uk/41518/
27. Legisa, Mengoni, *Finding correlations between hop catalogs and real hoppy character in brewery
    conditions*, Kvasny Prumysl 67(6), 15.12.2021, p. 537–547, CC BY (résumé lu).
    https://kvasnyprumysl.eu/index.php/kp/article/view/253
28. BJCP 2021, 16D Foreign Extra Stout (lu). https://www.bjcp.org/style/2021/16/16D/foreign-extra-stout/
29. Charles Faram et Yakima Valley Hops, Nugget (relayé).
    https://charlesfaram.com/hop-oracle/nugget-hop/ · https://yakimavalleyhops.com/products/nugget-hop-pellets
30. UCLouvain, *Special beer aging: contribution of oxidation related compounds and roasted-like
    phenols* (relayé). https://research.dial.uclouvain.be/handle/2078.5/79821
31. Janish, *Hop Oils Calculator*, non daté (lu). https://scottjanish.com/hop-oils-calulator/
