# Levures de bières de blé : choix par style et conduite des arômes

Une étape « levures » utile commence par le style de bière, puis aide à choisir une souche et à conduire sa fermentation. Le besoin d'une Weissbier est un équilibre entre banane, girofle, céréales et texture ; celui d'une Witbier intègre les épices et agrumes ajoutés ; celui d'une American Wheat laisse davantage de place au blé et aux houblons. Ces trois situations ne peuvent pas partager une sélection fondée sur le seul mot « fruité ».

Les faits fabricant ci-dessous décrivent des produits identifiés. Les essais décrivent leurs conditions propres. Les propositions d'interface constituent des choix éditoriaux pour L'Affinée : elles ne sont ni des consignes universelles de brasserie ni un modèle quantitatif du goût. Les sources ont été consultées le **12 septembre 2026**.

## 1. Le style détermine la première sélection

| Style et identifiant existant | Besoin du brasseur | Conséquence pour la sélection |
| --- | --- | --- |
| Weissbier / Hefeweizen — `weissbier` | Fermentation expressive banane–girofle, finale désaltérante, amertume contenue. Le BJCP décrit 8–15 IBU et met en garde contre un profil excessivement déséquilibré. | Présenter d'abord les souches expressément destinées aux Weizen. Les objectifs banane, équilibre et girofle viennent ensuite.[^1] |
| Dunkles Weissbier — `dunkles-weissbier` | Conserver le caractère Weizen avec davantage de matière maltée. | Réutiliser la famille de souches Weizen, en expliquant que le résultat se lit dans un contexte malté différent. Lallemand cite explicitement Dunkelweizen dans les usages de Munich Classic.[^8] |
| Weizenbock — `weizenbock` | Caractère Weizen dans une bière plus forte. | Même famille de départ, puis vérification de la tolérance et de l'ensemencement à partir de la recette. White Labs cite ce style pour WLP300 et WLP380.[^6][^7] |
| Witbier — `witbier` | Une levure belge fruitée et épicée qui s'accorde avec coriandre et écorces d'orange. | Sélection spécifique Wit ; le réglage aromatique doit considérer les ajouts d'épices. Le BJCP cite du blé non malté et une levure belge modérément fruitée/épicée.[^2] |
| American Wheat Beer — `american-wheat-beer` | Profil de fermentation plutôt neutre ; les céréales et houblons prennent plus de place. | Priorité aux souches propres et aux profils sans girofle marqué. Le BJCP exclut le caractère banane–girofle de la Weissbier ; sa plage est 15–30 IBU.[^3] |

Ces descriptions sont des repères de style, pas une interdiction de créer. Une fonction « Toutes les levures » doit rester disponible et expliquer l'écart lorsqu'il est documenté. Une bière appelée commercialement « Hefeweizen » peut appartenir à la tradition américaine : le nom ne suffit donc pas à déduire le style.

## 2. Une sélection courte, différenciée et traçable

Les plages ci-dessous sont celles des documents consultés, sans moyenne entre laboratoires. L'atténuation apparente est une spécification indicative obtenue dans certaines conditions de moût ; elle ne prédit pas seule la densité finale d'une recette.

| Référence du catalogue | Profil déclaré et rôle possible | Plage de fermentation | Atténuation apparente déclarée |
| --- | --- | --- | --- |
| `wyeast-3068` — Wyeast 3068 Weihenstephan Weizen | Référence classique allemande, équilibre banane–girofle modulable.[^4] | 18–24 °C | 73–77 % |
| `wyeast-3638` — Wyeast 3638 Bavarian Wheat | Banane dominante avec pomme, poire et prune ; girofle et vanille. Alternative pour davantage de complexité fruitée, pas simplement « plus de banane ».[^5] | 18–24 °C | 70–76 % |
| `white-labs-wlp300` — White Labs WLP300 | Hefeweizen traditionnelle, orientation banane avec phénols équilibrés. STA1 négatif déclaré.[^6] | 20–22 °C | 72–76 % |
| `white-labs-wlp380` — White Labs WLP380 | Muscade, girofle et épices plus dominants que banane et chewing-gum dans la description actuelle. STA1 négatif déclaré.[^7] | 19–21 °C | 73–80 % |
| `lallemand-munich-classic` — LalBrew Munich Classic | Alternative sèche destinée aux styles allemands, banane et girofle affirmés. Plus expressive que LalBrew Wit selon Lallemand ; POF positif et caractère diastatique négatif dans la fiche technique.[^8][^9] | 17–25 °C | 76–83 % |
| `fermentis-w68` — Fermentis SafAle W-68 | Alternative sèche visant les bières de blé allemandes : banane, fruité et girofle. POF positif déclaré.[^10] | 18–26 °C | Ne pas inventer une valeur depuis les jauges graphiques de la page |
| `yeast-mangrove-jacks-132040951` — Mangrove Jack's M20 Bavarian Wheat | Hefeweizen, Kristallweizen, Dunkelweizen ; profil banane–girofle et texture soyeuse. Le guide prévient que ce caractère peut dominer malt et houblon.[^12] | 18–30 °C | 70–75 % |
| `yeast-fermentis-safale-wb-06` — Fermentis SafAle WB-06 | Alternative plus sèche, fruitée et phénolique, avec une pointe d'acidité possible. Fermentis la destine **aussi** aux Weizen et Wit ; elle est déclarée diastatique.[^11][^13] | 18–26 °C | Vérifier la donnée structurée et sa source avant calcul |

L'orientation de la première liste est une décision éditoriale : les sept premières références offrent une base courte pertinente pour les Weizen. WB-06 peut apparaître comme « alternative très sèche » avec son compromis. Elle ne doit pas être marquée « impossible en Hefeweizen » : cela contredirait le fabricant.[^13]

La fiche M20 présente une incohérence de conversion : la page produit écrit 18–30 °C avec une borne Fahrenheit basse erronée, tandis que le guide donne 64–86 °F. Conserver les valeurs Celsius et afficher la source, sans agréger aveuglément les nombres.[^12][^14]

### Exemples de suggestions entre laboratoires

| Intention et souche actuelle | Suggestion expliquée | Compromis à rendre visible |
| --- | --- | --- |
| « Girofle plus lisible », WLP300 | Comparer WLP380, dont la description met les épices devant la banane. | Autre plage fabricant et autre atténuation ; aucune garantie que la concentration absolue de banane baisse.[^6][^7][^17] |
| « Banane classique », levure Wit peu expressive | Comparer WLP300, 3068, Munich Classic et W-68. | Le changement peut rapprocher la bière d'une Weissbier ; vérifier le style avant de le proposer.[^4][^6][^8][^10] |
| « Plus de fruits différents », 3068 | Montrer 3638 pour son répertoire pomme–poire–prune en plus de la banane. | L'objectif devient une complexité fruitée différente, pas un gain chiffré.[^5] |
| « Même famille de bière, levure sèche », 3068 ou WLP300 | Présenter Munich Classic et W-68 avec leurs descriptions propres. | Une alternative pratique n'est pas une identité génétique ou un remplacement sensoriel garanti. |
| « Blé et houblons devant », souche Weizen | Revenir au choix de style, puis comparer les références American Wheat pertinentes. | Un objectif sans girofle change le caractère de la bière, et mérite une décision visible. |

Les noms Weihenstephan, W-68, Weizen ou Bavarian, et les tableaux d'« équivalences » circulant en ligne, ne prouvent pas que deux produits de laboratoires différents sont identiques. Aucune équivalence génétique entre les références de ce tableau n'est affirmée ici.

### Séparations nécessaires pour Wit et American Wheat

Wyeast 3944 (`wyeast-3944`) est une Witbier décrite avec phénols épicés, esters faibles à modérés, girofle délicat et finale légèrement acidulée. Elle constitue un choix explicable lorsque le brasseur veut éviter que les esters recouvrent les épices.[^15] Wyeast 1010 (`wyeast-1010`) vise au contraire une bière sèche, vive et pauvre en esters ; elle correspond mieux à une American Wheat.[^16]

White Labs WLP320 (`white-labs-wlp320`) est explicitement proposée pour American Wheat Beer, mais White Labs décrit de **très légères** notes banane et girofle. Ne pas traduire « plus propre » par « strictement sans phénols », ni déduire automatiquement un statut POF négatif de son nom.[^18] Pour Wit, le catalogue contient aussi `lalbrew-wit`, `white-labs-wlp400`, `white-labs-wlp410`, `yeast-fermentis-safale-bw-e2-80-9120` et `yeast-mangrove-jacks-3513142277` ; leur classement fin doit rester attaché à leurs fiches respectives.

## 3. Ce que les essais de brasserie permettent réellement de conclure

### Hansen Hefeweizen : un vrai brassin divisé

White Labs Brewing Co. décrit son brassage en lots divisés. La Hansen Hefeweizen existe avec WLP300 et WLP380 : la première version met en avant banane, girofle et citron ; la seconde banane, pâte à pain et chewing-gum, avec un équilibre esters/phénols décrit dans le texte. Cette expérience démontre l'intérêt d'une comparaison dans un même moût ; elle ne fournit pas ici de répétitions ou de panel indépendant permettant de garantir un classement permanent.[^19]

Une autre publication White Labs donne un exemple à 12 °P : 1,81 ppm d'acétate d'isoamyle pour WLP300 et 3,76 ppm pour WLP380. Ce résultat paraît inverser le raccourci « WLP300 = plus de banane ». Les températures, inoculums et répétitions ne sont pas suffisamment détaillés pour en tirer une nouvelle règle. Le point robuste est la distinction entre **description sensorielle habituelle**, **concentration d'un composé** et **résultat prédit d'une recette**.[^17]

### Lallemand : interaction souche, température et quantité

Lallemand publie ses propres essais sur moût à 12 °P, avec 0,5 ou 1,0 g/L et 20 ou 25 °C. L'inoculum inférieur accroît nettement l'acétate d'isoamyle de Munich Classic ; l'effet varie selon la souche. Une température supérieure peut aussi augmenter le 4-VG. La banane et le girofle ne sont donc pas deux quantités qui s'annulent sur un même curseur. Une coquille dans le paragraphe écrit g/hL alors que légende et graphique indiquent **g/L** : les essais correspondent à 50 et 100 g/hL.[^20]

### Suntory : le moût peut compter davantage que le thermostat

Hayashi, Hida et Hideshima (Suntory) ont étudié une levure de fermentation haute en essais de 2 L, puis en pilotes de 100 L et brassins de 50 hL. Dans leur domaine d'essai, glucose et leucine avaient davantage d'influence sur l'acétate d'isoamyle que température et aération. Un programme de décoction avec saccharification à 63 °C et repos de dégradation du maltose après sa formation a permis d'obtenir une Weizen à environ 5 ppm d'acétate d'isoamyle.[^21]

La souche commerciale n'est pas identifiée ; plusieurs paramètres changent lors de la validation en brasserie. Ce résultat justifie un lien avec l'empâtage, mais ne valide ni « 63 °C = banane » pour toute recette, ni un ajout de sucre automatique. Le repos concerné n'est pas simplement un repos férulique placé au début d'une infusion.

## 4. Leviers et limites du guide aromatique

### Banane : choisir la souche et le domaine de conduite

Pour **3068 et 3638**, Wyeast dit explicitement que température et densité initiale plus élevées, ainsi qu'un inoculum plus faible, favorisent les esters. Un surensemencement peut fortement atténuer le caractère banane. Le girofle peut alors paraître plus intense parce que les esters le masquent moins : cela ne signifie pas que le froid produit davantage de 4-VG.[^4][^5]

Proposition éditoriale : afficher une flèche de tendance pour les souches documentées et une phrase indiquant le paramètre modifié. Un scénario de température doit rester dans la plage de la souche ; son point précis doit être présenté comme un **point de départ à essayer**, jamais comme un optimum démontré. Pour une souche dépourvue de preuve propre, afficher « effet à vérifier avec cette souche ».

### Girofle : capacité de la levure et précurseurs de l'empâtage

Un repos autour de 43–45 °C peut favoriser la libération d'acide férulique ; sa conversion fermentaire dépend de la capacité phénolique de la levure. White Labs décrit le lien entre empâtage, précurseur et 4-VG, tandis que Lallemand mentionne 45 °C et pH 5,8 pour cette activité.[^17][^20] Une levure POF négative ne devient pas une levure de Hefeweizen simplement parce qu'un repos est ajouté.

Proposition éditoriale : lorsqu'un brasseur vise davantage de girofle avec une souche documentée, montrer si sa recette comprend déjà un tel repos, puis proposer de le préparer dans l'étape empâtage. Si l'interface choisit 20 minutes par défaut, cette durée doit être identifiée comme une suggestion de travail ; aucune source examinée ne démontre que 20 minutes est l'optimum universel. Ajouter deux repos identiques ne crée pas deux fois plus de girofle.

La proportion de blé n'est pas une concentration de précurseur. La présentation scientifique Lallemand à l'ASBC souligne que l'extraction de l'acide férulique peut être meilleure depuis l'orge que depuis le blé ; enzymes, variété et traitement du malt interviennent. Elle rappelle également le rôle de la qualité de la levure et du moût.[^22] Ne pas construire une jauge « plus de blé = plus de girofle ».

### Pression : signaler une contrainte, éviter une fausse courbe

Souffriau et ses collègues ont mesuré une inhibition de la production d'acétate d'isoamyle sous CO₂, variable selon les souches. Leur dispositif emploie notamment +0,65 bar ; ils montrent aussi des réponses non monotones du rapport ester/alcool à pression supérieure. Les souches étudiées ne sont pas une validation comparative de 3068, WLP300, Munich Classic ou W-68.[^23]

Proposition éditoriale : si une recette prévoit une pression précoce et un objectif banane, indiquer « La pression pendant la fermentation peut freiner les esters recherchés ». Distinguer pression durant la production des arômes et carbonatation ultérieure. Ne pas calculer un pourcentage de banane perdu par bar, ni transformer +0,65 bar en seuil universel. Le programme de pression doit aussi rester lié au matériel réellement utilisé.

### Quantité : un outil de dosage est immédiatement utile

Munich Classic est recommandée à 50–100 g/hL ; sa fiche avertit qu'un calculateur conçu pour les levures liquides peut conduire à un surensemencement. Les moûts forts, riches en adjuvants ou acides peuvent demander une autre conduite et davantage de levure/nutrition. La durée annoncée de quatre jours concerne un moût standard à 20 °C, pas un calendrier garanti.[^9]

W-68 et WB-06 indiquent 50–80 g/hL. Pour W-68, la même page affiche une instruction d'ensemencement direct à 20–32 °C : cette plage ne doit pas remplacer la plage de fermentation de 18–26 °C dans le simulateur.[^10][^11]

Proposition éditoriale : calculer les grammes depuis le **volume entrant en fermenteur**. À 20 L, cela donne 10–20 g pour Munich Classic et 10–16 g pour W-68 selon ces recommandations. Ce sont des conversions de dosage, pas des conversions de goût. Pour une levure liquide, ne pas transformer des mL ou « un sachet » en cellules viables sans donnée explicite. Le choix d'une faible quantité expérimentale doit rester distinct d'une levure vieille, mal stockée ou de viabilité inconnue.

Pour 3068 et 3638, Wyeast demande 33 % d'espace libre dans le fermenteur en raison du comportement de fermentation haute. Cet élément mérite un rappel contextualisé à côté du volume, plutôt qu'une recommandation générique détachée du matériel choisi.[^4][^5]

## 5. Interactions avec les autres étapes

| Étape | Analyse utile dans le contexte de la levure | Action proposée |
| --- | --- | --- |
| Style | Une intention sans phénols s'accorde difficilement avec une Weissbier classique ; un objectif banane extrême peut aussi sortir du repère choisi. | Revoir l'intention ou conserver explicitement une variante personnelle. |
| Céréales et empâtage | Présence et position d'un repos férulique ; ingrédients pouvant modifier la fermentabilité et la matière. | Préparer une modification du programme, montrer le temps ajouté et conserver le reste du programme. |
| Houblons | Amertume prévue face au style ; présence d'ajouts tardifs ou de dry hop face à une intention centrée sur la levure. | Afficher les IBU et les ajouts existants ; ouvrir leur étape pour ajuster le compromis. |
| Fermentation | Consigne hors plage fabricant, pression précoce, quantité non définie, changement de souche. | Proposer une conduite sourcée et rendre visibles les données à redéfinir. |
| Volumes et matériel | Quantité de levure basée sur le bon volume ; mousse haute et espace libre. | Recalculer le dosage et contrôler la capacité utile du fermenteur. |

Le lien aux houblons doit rester concret : une Weissbier à houblonnage aromatique prononcé peut conserver son objectif personnel, mais l'interface peut expliquer que la lecture de la banane et du girofle sera moins isolée. M20 fournit un cas documenté de domination potentielle du caractère levure sur le malt et le houblon.[^12] Les IBU ne sont pas une mesure de l'arôme de houblon : un faible IBU n'annule pas l'effet d'un dry hop.

Un statut β-lyase élevé ne prédit pas à lui seul le fruité final. Il ne doit pas faire passer une souche belge phénolique en tête d'une liste American Wheat sans considérer le style. Aucun modèle de masquage en fonction des grammes de houblon n'est validé par les sources de ce rapport.

## 6. Proposition d'outils utilisables pendant la création

Les éléments suivants sont des propositions éditoriales à implémenter et tester dans le parcours de recette.

1. **Choix par style** : une liste courte de références adaptées, avec laboratoire, forme, conditions et raison de sélection. La recherche globale reste accessible.
2. **Intention** : Banane / Équilibré / Girofle pour une Weizen ; d'autres choix selon le style. L'intention n'est pas un ordre de remplacer la levure.
3. **Comparaison de deux scénarios** : recette actuelle et proposition. Montrer souche, température, pression précoce et repos d'empâtage ; les valeurs sont concrètes, les effets sensoriels restent qualitatifs.
4. **Analyse de cohérence** : prioriser un petit nombre de points issus de la vraie recette. Exemples : consigne hors plage, quantité absente, pression et banane, houblonnage marqué, repos déjà présent.
5. **Comparaison de laboratoires** : afficher une autre souche avec raison et compromis, puis une action explicite pour l'appliquer. Recalculer les informations dépendantes après le changement.
6. **Dosage** : plage en grammes pour une sèche lorsque le fabricant fournit g/hL ; détails de provenance à la demande. Aucune masse de sachet supposée.
7. **Essai en lots divisés** : conserver les deux conduites et inviter à noter le résultat réel. Le brasseur construit progressivement une référence propre à son moût et à sa cuve.

Le visualiseur devrait représenter les **leviers et leurs directions** : « consigne augmentée → esters potentiellement favorisés », « repos présent → précurseur de girofle favorisé ». Des barres sans unité ou un score de 0 à 100 risqueraient de suggérer une mesure inexistante. Une comparaison peut rester très visuelle en affichant les paramètres du brassin et les explications côte à côte.

Une action appliquée doit pouvoir être comprise au retour dans les étapes concernées. Changer la souche sans actualiser l'ensemencement, les bornes de température ou les prévisions liées aux houblons laisserait une recette incohérente. Un scénario provisoire doit pouvoir être écarté sans perdre la recette de départ.

## 7. Limites à conserver dans le produit

- Les descriptions de fabricant sont adaptées à la sélection de produits mais ne sont pas des classements sensoriels universels établis dans le même protocole.
- Les essais Suntory et Lallemand couvrent des conditions déterminées ; ils n'identifient pas une formule générale température × quantité × pression.
- Une concentration d'acétate d'isoamyle n'est pas une note de banane perçue ; les autres arômes, le moût, la maturation et le service participent au résultat.
- Banane et girofle peuvent tous deux augmenter ; leur équilibre perçu ne se réduit pas à une somme constante.
- Le statut POF inconnu reste inconnu. La mention d'une note épicée ne doit pas devenir un résultat de laboratoire.
- Le repos férulique n'impose pas un changement automatique du pH global de la recette. Un réglage de l'eau ou de l'acidification demande son contexte propre.
- Ne pas extrapoler l'atténuation en densité finale certaine, ni annoncer une fin de fermentation à date fixe.
- Pour M20, une bière forte demande de considérer la tolérance annoncée de 7,5 % ABV ; la plage de température large ne suffit pas à conclure qu'elle convient à toute Weizenbock.[^12]
- Une substitution entre laboratoires conserve le style visé, mais doit être présentée comme un essai de formulation dont le résultat reste à vérifier.

## Sources

Consultation de toutes les sources : **12 septembre 2026**. « Sans date » signifie qu'aucune date de publication fiable n'était affichée ; un chemin d'URL ou une date d'indexation n'est pas traité comme une date scientifique.

[^1]: BJCP. [2021 Beer Style Guidelines — 10A Weissbier](https://www.bjcp.org/style/2021/10/10A/weissbier/). 2021. Sections impression générale, arôme, saveur, ingrédients et statistiques.
[^2]: BJCP. [2021 Beer Style Guidelines — 24 Belgian Ale, section 24A Witbier](https://www.bjcp.org/style/2021/24/belgian-ale/). 2021. Page de catégorie utilisée, la route individuelle étant intermittente.
[^3]: BJCP. [2021 Beer Style Guidelines — 1 Standard American Beer, section 1D](https://www.bjcp.org/style/2021/1/standard-american-beer/). 2021. Sections arôme, saveur, ingrédients et statistiques.
[^4]: Wyeast Laboratories. [3068 Weihenstephan Weizen](https://wyeastlab.com/product/weihenstephan-weizen/). Sans date. Profil, conduite esters/phénols, spécifications.
[^5]: Wyeast Laboratories. [3638 Bavarian Wheat](https://wyeastlab.com/product/bavarian-wheat/). Sans date. Profil fruité, conduite esters/phénols, spécifications.
[^6]: White Labs. [WLP300 Hefeweizen Ale Yeast](https://www.whitelabs.com/yeast-single?id=148&type=YEAST). Sans date. Description actuelle, températures, atténuation, STA1, styles proposés.
[^7]: White Labs. [WLP380 Hefeweizen IV Ale Yeast](https://www.whitelabs.com/yeast-single?id=151&type=YEAST). Sans date. Description actuelle, températures, atténuation, STA1, styles proposés. La formulation actuelle est plus nuancée que certaines anciennes descriptions « presque pas de banane ».
[^8]: Lallemand Brewing. [LalBrew Munich Classic](https://www.lallemandbrewing.com/en/canada/products/munich-classic-wheat-beer-yeast/). Sans date. Origine de collection déclarée, usages et données produit.
[^9]: Lallemand Brewing. [Munich Classic — Technical Data Sheet](https://admin.lallemandbrewing.com/wp-content/uploads/2023/05/TDS_LPS_BREWINGYEAST_MUNICHCLASSIC_ENG_A4-5.pdf). Version servie au jour de consultation, deux pages ; date de version non lisible dans le texte extrait. p. 1 : POF, diastatique, conditions ; p. 2 : dose, inoculation et limites des calculateurs liquides.
[^10]: Fermentis. [SafAle W-68](https://fermentis.com/en/product/safale-w-68/). Sans date. Destination allemande, POF, dosage et distinction entre fermentation et ensemencement direct.
[^11]: Fermentis. [SafAle WB-06](https://fermentis.com/en/product/safale-wb-06/). Sans date. Usages Wit/Weizen, caractère diastatique, dose et température.
[^12]: Mangrove Jack's. [Craft Series — Brewer's Yeasts](https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785). Sans date de version certaine. Page numérotée 08 (neuvième page du PDF), M20 ; tableau récapitulatif en fin de document.
[^13]: Philippe Janssens, Fermentis. [Wheat Beer Solutions — SafAle W-68 & SafAle BW-20 Q&A](https://fermentis.com/en/knowledge-center/expert-insights/beer/safale-w-68-safale-bw-20-qa/). Sans date. Différenciation W-68/BW-20/WB-06 et invitation explicite à expérimenter. Ses proportions simplifiées de blé ne sont pas utilisées comme contraintes de recette.
[^14]: Mangrove Jack's. [M20 Bavarian Wheat Yeast — 10 g](https://mangrovejacks.com/products/m20-bavarian-wheat-10g). Sans date. Source de la coquille de conversion de température ; le guide technique est cohérent en Celsius/Fahrenheit.
[^15]: Wyeast Laboratories. [3944 Belgian Witbier](https://wyeastlab.com/product/belgian-witbier/). Sans date. Profil épicé et usage Witbier.
[^16]: Wyeast Laboratories. [1010 American Wheat](https://wyeastlab.com/product/american-wheat/). Sans date. Profil pauvre en esters et finale.
[^17]: White Labs. [Many Flavors of Fermentation Series Part 2 — Metabolites](https://blog.whitelabs.com/many-flavors-of-fermentation-series-part-2). 12 juin 2025. Tableau 2 WLP300/WLP380 et section phénols. La simplification génétique de cette page n'est pas utilisée pour déduire un génotype de catalogue.
[^18]: White Labs. [WLP320 American Hefeweizen Ale Yeast](https://www.whitelabs.com/yeast-single?id=149&type=YEAST). Sans date. Usage American Wheat et traces aromatiques décrites.
[^19]: White Labs Brewing Co. [Hansen Hefeweizen](https://whitelabsbrewingco.com/hansen-hefeweizen-2/). Sans date. Brassage divisé, variantes WLP300/WLP380 et descriptions de dégustation.
[^20]: Lallemand Brewing. [Best Practices — Wheat Beer Solutions](https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Wheat-Beer-Solutions-BP-ENG-digital-LalBrew.pdf). Sans date de version certaine. p. 2 : repos férulique ; p. 5, figure 4 et texte : essais R&D à 12 °P, effet dépendant de la souche et erreur d'unité dans le paragraphe phénols. Les valeurs de dosage utilisées sont celles de la légende g/L.
[^21]: Chie Hayashi, Yoshinori Hida, Seigo Hideshima, Suntory Beer Limited. [Elucidation of the ester formation mechanism in top fermenting yeast](https://www.asbcnet.org/events/archives/2016/proceedings/Documents/196_Hayashi.pdf). World Brewing Congress, 13–17 août 2016, poster 196. Essais 2 L, pilotes 100 L et brassage 50 hL. Une communication de congrès avec description de méthode, pas une validation multibrasserie.
[^22]: Sylvie Van Zandycke, Lallemand Brewing. [Brewer's Yeast Contribution to Flavor](https://www.asbcnet.org/events/archives/2017ASBCMeeting/proceedings/2017PreMeeting/PM_Sensory1_VanZandycke.pdf). ASBC Meeting 2017. Diapositives 4–6, 18–22 : variables de fermentation, rapport orge/blé, libération d'acide férulique. Présentation technique avec références ; le travail original de Coghe et al. (2004, DOI 10.1021/jf0346556) cité par cette présentation n'a pas été utilisé comme source intégrale indépendamment accessible.
[^23]: Ben Souffriau et al. [Polygenic Analysis of Tolerance to Carbon Dioxide Inhibition of Isoamyl Acetate “Banana” Flavor Production in Yeast Reveals MDS3 as Major Causative Gene](https://journals.asm.org/doi/10.1128/aem.00814-22). Applied and Environmental Microbiology, 8 septembre 2022. DOI 10.1128/aem.00814-22. Méthode, résultats figure 2 et discussion ; article intégral accessible sur le site de l'éditeur.
