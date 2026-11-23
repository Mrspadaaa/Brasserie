# Dossier du juge à l'aveugle (18 sorties, moitié « jugement »)

Facettes à noter de 0 à 1 (ou null) : faits, chiffres, proposition, invention, ton (voir GRILLE.md). Aucune cellule n'est nommée.

## S1c234b — cas « routing-complex »
Question : Ma chauffe plafonne à 1000 W, je manque d’eau osmosée et je devrai faire un rinçage plus court. Je veux conserver du corps sans trop d’astringence. Comment hiérarchiser les compromis entre empâtage, rinçage, volume final et ébullition ? Donne-moi un plan cohérent avec mon matériel, sans inventer mes mesures.
Attendu : Hiérarchise les compromis (chauffe 1000 W, eau osmosée courte, rinçage plus court, corps contre astringence) avec les calculateurs, sans inventer les mesures.
Niveau : attention
Synthèse : Pour préserver le corps sans extraire d’astringence, sacrifie le volume final plutôt que de rincer avec une eau trop alcaline ou de subir une rampe d'ébullition interminable.
Action : Prioriser l’eau osmosée disponible pour couper l’alcalinité du rinçage, mesurer volume et densité avant ébullition, puis ajuster le volume final sans prolonger inutilement à 1000 W.
Pourquoi : À 1000 W, chauffer ~28 L prend physiquement au moins 65 min sans pertes ; limiter le volume à bouillir sécurise l'ébullition franche, tandis qu'un rinçage court ou dilué à l'osmosée évite la montée de pH et les polyphénols.
À surveiller : Surveiller la densité du jus de rinçage (ne pas descendre sous 1,010-1,012 SG) et mesurer précisément le volume pré-ébullition refroidi.
Question de retour : Quels sont ton volume exact d’eau osmosée disponible et le volume de premier jus mesuré avant rinçage ?
Outils appelés : calculate_recipe, heating_power, plan_recipe_water

## S2db5d2 — cas « color »
Question : Le moût semble bien plus foncé dans la grande cuve, je dilue ?
Attendu : Comparer en échantillon mince, densité et volume ; ne pas diluer sur l’apparence seule.
Niveau : attention
Synthèse : Ne dilue pas sur la seule couleur : l'effet de profondeur dans la grande cuve et la turbidité de l'empâtage assombrissent fortement la perception visuelle.
Action : Ne dilue pas et ne coupe pas la chauffe : prélève un petit échantillon de moût, laisse-le refroidir et observe-le en couche mince (dans un verre transparent ou une éprouvette).
Pourquoi : Le volume et la profondeur de liquide dans une cuve de 45 L donnent une teinte trompeuse bien plus sombre que la couleur réelle en verre. De plus, la recette ne contient que 100 % de malt Pale (6 EBC), ce qui donnera une bière blonde dorée. Diluer maintenant ferait chuter ta densité et déséquilibrerait tout le brassin sans motif réel.
À surveiller : Vérifie la densité actuelle et l'absence d'odeur de caramélisation anormale au fond.
Question de retour : As-tu une odeur de brûlé ou un dépôt suspect au fond de la cuve ?
Outils appelés : aucun

## S3bd59f — cas « metallic »
Question : Goût métallique après fermentation, comment rattraper ?
Attendu : Causes conditionnelles (eau, contact métal, rinçage), vérifications, aucun masquage chimique.
Niveau : attention
Synthèse : Un goût métallique peut venir de l’eau, d’un contact métallique ou d’une oxydation, sans diagnostic certain au goût seul.
Action : Cesse de déguster le lot par précaution et isole-le si tu suspectes une contamination chimique ou un défaut de rinçage. Compare ensuite le goût de ton eau de brassage avec celui de l’échantillon, puis inspecte les surfaces métalliques (cuve, raccords, robinet, serpentin) et les produits de nettoyage/rinçage utilisés.
Pourquoi : Le goût seul ne permet pas d’écarter une contamination chimique ou un résidu de produit, ni de garantir la salubrité à distance. Comparer l’eau de départ et vérifier le matériel permet de situer l’origine avant toute décision.
À surveiller : Ne masque pas le défaut avec un additif et n’embouteille pas tant que la cause n’est pas identifiée ; si le lot est sain mais oxydé ou marqué par le fer, le défaut ne se rattrape pas en fermenteur.
Question de retour : As-tu remarqué des traces d’oxydation, un contact avec un métal non inox ou un résidu de produit de nettoyage ?
Outils appelés : aucun

## S467b61 — cas « hops »
Question : Compare70min d’ébullition avec premier houblon à+30min depuis début plutôt que+0.
Attendu : simulate_boil : contact plus court, IBU estimés, concentration inconnue sans relevés.
Niveau : info
Synthèse : Sur 70 min d’ébullition, ajouter le Cascade à +30 min réduit le temps d'isomérisation à 40 min, donnant 17 IBU contre 20 IBU s'il est versé à +0 min.
Action : Choisis l’ajout à +30 min si tu veux modérer l’amertume (17 IBU), ou à +0 min si tu cherches une amertume un peu plus franche (20 IBU).
Pourquoi : Un ajout à +30 min laisse le houblon infuser 40 min au lieu de 70 min, réduisant l'extraction d'amertume tout en conservant un peu plus de composés aromatiques. Dans les deux cas, les 10 min de chauffe supplémentaires évaporent environ 0,5 L de moût en plus.
À surveiller : Surveille le volume et la densité pré-ébullition réels pour confirmer la concentration exacte après ces 10 min supplémentaires.
Question de retour : Souhaites-tu ajuster la quantité de houblon pour maintenir exactement 19 IBU, ou cette variation te convient-elle ?
Outils appelés : simulate_boil, simulate_boil, inspect_brewery, simulate_boil, simulate_boil

## S5df166 — cas « ph-meter »
Question : Mon pH-mètre est en panne. Comment continuer ?
Attendu : Pas de dose à l’aveugle ; électrode / étalonnage, mesure de remplacement, prochaine mesure.
Niveau : attention
Synthèse : En pleine saccharification avec un pH-mètre en panne, continue le palier à 67 °C sans ajouter d'acide à l'aveugle et tente un diagnostic rapide de la sonde à part.
Action : Ne verse aucun acide à l'aveugle dans la maische. Contrôle ton pH-mètre hors cuve (rinçage et hydratation de l'électrode, piles, tampons d'étalonnage frais selon le fabricant) pendant que tu maintiens tes 67 °C. Si l'appareil ne repart pas, poursuis la saccharification sans correction acide de rattrapage.
Pourquoi : Ton plan actuel (100 % malt Pale, bicarbonates à 144 mg/L après 20 % d'osmosée, 0 mL d'acide saisi) donne une estimation théorique haute (5,89 ± 0,15), mais un calcul théorique n'est pas un pH mesuré : acidifier sans lecture fiable risque de sur-corriger ou de dépasser le seuil gustatif lactique, surtout si un traitement a déjà été mis. Au rinçage, évite de chauffer au-delà de 75–78 °C et ne rince pas à l'excès pour limiter le risque d'extraction de tannins avec une eau alcaline.
À surveiller : Surveille le maintien thermique à 67 °C, puis relève le volume et la densité avant ébullition (ramenés à 20 °C). Si le pH-mètre refonctionne après étalonnage, mesure uniquement un échantillon de moût refroidi à 20 °C (l'ATC ne corrige pas le décalage chimique du pH à chaud).
Question de retour : As-tu déjà versé des sels ou de l'acide dans l'eau d'empâtage ou de rinçage, et disposes-tu de solutions tampons fraîches (pH 4,01 / 7,00) ou de bandelettes pH fines ?
Outils appelés : calculate_recipe, plan_recipe_water

## S83ddcf — cas « hops »
Question : Compare70min d’ébullition avec premier houblon à+30min depuis début plutôt que+0.
Attendu : simulate_boil : contact plus court, IBU estimés, concentration inconnue sans relevés.
Niveau : info
Synthèse : Sur 70 min d’ébullition, décaler le Cascade (hop-0) à +30 min baisse l’amertume estimée à 17 IBU contre 20 IBU à +0 min (19 IBU prévus).
Action : Garde l’ajout à +0 min pour viser 20 IBU, ou décale à +30 min si tu préfères descendre autour de 17 IBU (vs 19 IBU prévus à 60 min).
Pourquoi : À +0 min, le houblon bout 70 min (20 IBU). À +30 min, il ne bout que 40 min (17 IBU), avec davantage d’arômes conservés mais sans chiffrage précis du goût ni de la couleur.
À surveiller : Sans volume et densité pré-ébullition mesurés, la concentration exacte reste inconnue ; l’évaporation supplémentaire simulée est de 0,48 L.
Question de retour : Quel volume et quelle densité pré-ébullition mesures-tu ?
Outils appelés : simulate_boil, simulate_boil

## S94acab — cas « routing-complex »
Question : Ma chauffe plafonne à 1000 W, je manque d’eau osmosée et je devrai faire un rinçage plus court. Je veux conserver du corps sans trop d’astringence. Comment hiérarchiser les compromis entre empâtage, rinçage, volume final et ébullition ? Donne-moi un plan cohérent avec mon matériel, sans inventer mes mesures.
Attendu : Hiérarchise les compromis (chauffe 1000 W, eau osmosée courte, rinçage plus court, corps contre astringence) avec les calculateurs, sans inventer les mesures.
Niveau : attention
Synthèse : Priorise la maîtrise du pH à l’empâtage et un rinçage plus court pour ménager ta chauffe à 1000 W et limiter le risque d’astringence, quitte à accepter un volume final plus faible.
Action : 1) Empâtage : reste à 67 °C pour le corps et garde l’eau osmosée restante en priorité pour la maische (et l’acide prévu) afin de contenir l’alcalinité (HCO3 180 mg/L). 2) Rinçage : raccourcir le rinçage est cohérent ; cela réduit le volume à chauffer et limite le risque de pH trop haut et d’astringence, sans fixer de volume de coupe avant bilan. 3) Ébullition : ne lance le minuteur ni les houblons qu’après ébullition franche confirmée, sans couvrir la cuve. 4) Volume final : accepte un volume plus bas plutôt que de forcer un rinçage long.
Pourquoi : À 1000 W, monter 27 L de 67 à 100 °C demande au minimum 62,2 min sans aucune perte, sans garantie de maintenir l’ébullition. Réduire le volume via un rinçage court aide la chauffe et diminue le risque d’extraire des tannins avec une eau alcaline, sans prouver le pH réel ni le rendement exact.
À surveiller : Note volume pré-ébullition, densité ramenée à 20 °C et températures horodatées pendant la montée en chauffe avant d’ajuster le plan.
Question de retour : Combien de litres d’eau osmosée te reste-t-il, et quels sont ton volume et ta température horodatée actuels ?
Outils appelés : heating_power

## S95bbc3 — cas « routing-complex »
Question : Ma chauffe plafonne à 1000 W, je manque d’eau osmosée et je devrai faire un rinçage plus court. Je veux conserver du corps sans trop d’astringence. Comment hiérarchiser les compromis entre empâtage, rinçage, volume final et ébullition ? Donne-moi un plan cohérent avec mon matériel, sans inventer mes mesures.
Attendu : Hiérarchise les compromis (chauffe 1000 W, eau osmosée courte, rinçage plus court, corps contre astringence) avec les calculateurs, sans inventer les mesures.
Niveau : attention
Synthèse : Protège d'abord la qualité d'extraction (température et alcalinité au rinçage), accepte un volume pré-ébullition réduit pour soulager tes 1000 W, et ne fige le volume final qu'après lecture du couple volume/densité avant ébullition.
Action : En phase de saccharification actuelle (67 °C), maintiens le palier sans surchauffer, contrôle le pH d'empâtage refroidi à 20 °C si ton pH-mètre est étalonné, puis prépare une eau de rinçage sous 78 °C en y réservant ton reste d'osmosée ou une acidification mesurée. Accepte un volume pré-ébullition plus bas plutôt que de forcer le rinçage à l'eau alcaline (HCO3 180 mg/L).
Pourquoi : 1) Empâtage (corps) : garde tes 67 °C prévus sans prolonger à l'aveugle ; la cuve occupe ~28,7 L théoriques (limite utile 35 L provisoire). 2) Rinçage (anti-astringence) : sans osmosée ni acide, ton réseau à 180 mg/L de HCO3 augmente le risque de remontée du pH en fin de filtration (sans le prouver seul). Un rinçage court sous 78 °C limite l'extraction de tannins, au prix d'un rendement moindre non chiffrable d'avance. 3) Chauffe (1000 W) : de 67 à 100 °C, le minimum physique sans aucune perte est déjà de 64,5 min pour 28 L contre 50,7 min pour 22 L, sans garantir le maintien de l'ébullition réelle avec les déperditions. Réduire le volume collecté aide la rampe ; ne couvre pas l'ébullition.
À surveiller : Mesure le volume réel et la densité ramenée à 20 °C en fin de filtration (avant ébullition), puis vérifie l'obtention d'une vraie ébullition découverte avant de lancer le minuteur de 60 min et les 35 g de Cascade.
Question de retour : Quel volume et quelle température as-tu actuellement en cuve, et combien de litres d'osmosée ou d'acide (avec sa concentration %) te reste-t-il pour le rinçage ?
Outils appelés : calculate_recipe, simulate_water, simulate_water, heating_power, heating_power

## S974ef8 — cas « ph-meter »
Question : Mon pH-mètre est en panne. Comment continuer ?
Attendu : Pas de dose à l’aveugle ; électrode / étalonnage, mesure de remplacement, prochaine mesure.
Niveau : attention
Synthèse : Sans appareil fiable, ne tente aucun ajustement chimique du moût.
Action : Poursuis ton empâtage à 67 °C selon le planning sans ajouter d'acide ni de base à l'aveugle.
Pourquoi : Corriger un pH sans mesure fiable risque de faire dériver le moût vers une acidité excessive ou de bloquer l'activité enzymatique.
À surveiller : Vérifie l'hydratation de l'électrode, les piles et fais un étalonnage avec des tampons frais à température ambiante pour le prochain brassin.
Question de retour : As-tu des bandelettes pH sous la main ou ton eau a-t-elle déjà reçu un traitement d'acide calculé ?
Outils appelés : check_ph

## Sacd32f — cas « ph-meter »
Question : Mon pH-mètre est en panne. Comment continuer ?
Attendu : Pas de dose à l’aveugle ; électrode / étalonnage, mesure de remplacement, prochaine mesure.
Niveau : attention
Synthèse : Sans pH-mètre fiable, ne fais aucune correction d'acide à l'aveugle et poursuis ton empâtage normalement.
Action : Poursuis la saccharification à 67 °C sans ajouter d'acide ni faire de correction à l'aveugle. En parallèle, vérifie l'électrode du pH-mètre, son hydratation et tente un nouvel étalonnage avec des tampons frais selon les consignes du fabricant (ou utilise des bandelettes pH si tu en as sous la main).
Pourquoi : Un pH-mètre en panne peut afficher une valeur fausse et conduire à sur-acidifier ou déséquilibrer la maische. Le pH cible de ta recette (5,4) reste théorique tant qu'il n'est pas mesuré, mais l'empâtage peut se dérouler sans correction aveugle.
À surveiller : Si tu retrouves une mesure fiable, refroidis d'abord l'échantillon à ~20 °C (l'ATC ne compense pas le décalage chimique à chaud) avant de lire. Surveille ensuite la densité et le déroulement normal de la filtration.
Question de retour : As-tu des bandelettes pH ou des tampons d'étalonnage frais pour tester l'appareil ?
Outils appelés : aucun

## Sb0f49f — cas « metallic »
Question : Goût métallique après fermentation, comment rattraper ?
Attendu : Causes conditionnelles (eau, contact métal, rinçage), vérifications, aucun masquage chimique.
Niveau : attention
Synthèse : Un goût métallique ne se rattrape pas avec des additifs : il faut localiser la cause (matériel, eau ou oxydation) et vérifier la salubrité.
Action : Isole le fermenteur, suspends les dégustations et compare ton eau de brassage avec un échantillon d'eau bouillie.
Pourquoi : Les ions métalliques (fer, cuivre) et les composés d'oxydation lipidique restent dissous et stables dans la bière, sans élimination possible.
À surveiller : Inspecte la cuve d'ébullition, les raccords, le refroidisseur et l'absence de rouille ou d'agression acide sur les métaux.
Question de retour : As-tu utilisé des pièces en laiton, du fer/acier non inox, un produit détartrant mal rincé ou une eau riche en fer ?
Outils appelés : finish_advice, lookup_yeast_reference

## Sc0dd72 — cas « power »
Question : 28L mesurés à67°C, chauffe1000W : combien pour atteindre80°C ?
Attendu : heating_power : 25,4 min minimum sans pertes, aucune heure d’arrivée garantie.
Niveau : attention
Synthèse : À 1000 W sur 28 L, il faut au minimum théorique 25,4 minutes sans aucune perte pour monter de 67 °C à 80 °C, mais la durée réelle sera plus longue.
Action : Lance la chauffe en homogénéisant régulièrement (brasse ou recircule) et relève la température après 10 à 15 minutes pour mesurer ta vitesse de montée réelle.
Pourquoi : Ce calcul de 25,4 minutes est une borne basse physique pour de l'eau pure sans déperditions : l'inertie de la cuve, la présence éventuelle des grains et les pertes vers l'air ambiant ralentissent la rampe, et 1000 W ne garantissent ni une heure d'arrivée exacte ni la capacité à maintenir une ébullition plus tard.
À surveiller : Surveille la pente réelle sur deux relevés horodatés pour vérifier que la chauffe ne plafonne pas face aux pertes thermiques, et sépare bien ce temps de rampe d'un éventuel maintien.
Question de retour : Ce volume de 28 L correspond-il à la maische complète avec le grain, ou au moût filtré seul (et la cuve est-elle isolée) ?
Outils appelés : heating_power

## Scd7fde — cas « power »
Question : 28L mesurés à67°C, chauffe1000W : combien pour atteindre80°C ?
Attendu : heating_power : 25,4 min minimum sans pertes, aucune heure d’arrivée garantie.
Niveau : info
Synthèse : Il faudra au strict minimum 25,4 minutes pour faire monter 28 L de 67 °C à 80 °C avec 1000 W.
Action : Prévoir au minimum 26 minutes de montée en maintenant un brassage régulier pour homogénéiser la température.
Pourquoi : Ce calcul de 25,4 minutes est une borne basse physique pour de l'eau pure sans aucune perte thermique. En conditions réelles, l'inertie de la cuve, la présence de matière et les déperditions avec l'air ambiant allongeront ce délai.
À surveiller : Surveille la vitesse de montée réelle au thermomètre pour vérifier si les pertes thermiques ne ralentissent pas trop la rampe.
Question de retour : Quelle est la température relevée après 10 à 15 minutes de chauffe pour mesurer les déperditions réelles de ta cuve ?
Outils appelés : heating_power

## Sd13c88 — cas « hops »
Question : Compare70min d’ébullition avec premier houblon à+30min depuis début plutôt que+0.
Attendu : simulate_boil : contact plus court, IBU estimés, concentration inconnue sans relevés.
Niveau : info
Synthèse : Sur 70 min d'ébullition totale, décaler le Cascade de +0 min à +30 min depuis le début réduit son contact à 40 min et abaisse l'amertume estimée de ~20 IBU à ~17 IBU, avec la même évaporation supplémentaire (~0,48 L).
Action : Sur 70 min d'ébullition, ajoute les 35 g de Cascade à +0 min (70 min de contact) si tu vises ~20 IBU, ou à +30 min depuis le début (40 min d'ébullition restante) si tu préfères ~17 IBU (contre 19 IBU prévus en 60 min à +0 min).
Pourquoi : Dans les deux cas à 70 min, les 10 minutes supplémentaires ajoutent environ 0,48 L d'évaporation théorique, mais la concentration réelle (volume final et DI) reste inconnue tant que le moût pré-ébullition n'est pas mesuré (tu es encore en saccharification). À +0 min le houblon bout 70 min (~20 IBU), tandis qu'à +30 min il ne bout que 40 min (~17 IBU) ; l'évolution exacte des arômes et de la couleur ne se chiffre pas ici.
À surveiller : Mesure le volume et la densité pré-ébullition après le rinçage, et attends une ébullition franche avant de lancer ton minuteur.
Question de retour : Quels seront ton volume et ta densité pré-ébullition mesurés avant de lancer l'ébullition ?
Outils appelés : inspect_brewery, calculate_recipe, simulate_boil, simulate_boil, simulate_boil

## Se18ee4 — cas « metallic »
Question : Goût métallique après fermentation, comment rattraper ?
Attendu : Causes conditionnelles (eau, contact métal, rinçage), vérifications, aucun masquage chimique.
Niveau : attention
Synthèse : Un vrai défaut métallique ne se rattrape pas en post-fermentation : il faut d'abord écarter une contamination chimique ou matérielle avant de décider du sort du brassin.
Action : Ne rajoute aucun additif pour masquer le goût. Si tu suspectes un résidu chimique ou un produit non rincé, cesse immédiatement les dégustations et isole le lot. Sinon, goûte ton eau de brassage brute à part et inspecte toutes les surfaces en contact (cuve, refroidisseur, raccords, fermenteur).
Pourquoi : Le goût métallique a plusieurs causes possibles impossibles à trancher au goût seul : eau riche en fer, contact avec un métal réactif ou corrodé, oxydation des lipides, ou résidu de nettoyant/désinfectant. Masquer ce défaut est inefficace et aucune salubrité ne peut être garantie à distance en cas de doute chimique. Parfois, dans une bière très jeune avec des particules de levure ou du Cascade en dry-hop en suspension, une âpreté ou le piquant du CO2 trompe le palais et s'atténue après sédimentation, contrairement aux ions métalliques dissous qui restent.
À surveiller : Vérifie l'absence de rouille, rayure, laiton terni ou cuivre oxydé sur le matériel, et relève ta densité actuelle (aucun relevé n'est enregistré dans le journal) sans exposer la bière à l'oxygène.
Question de retour : En quoi sont faits ta cuve, tes raccords et ton fermenteur, et quels produits de nettoyage ou désinfection as-tu utilisés (avec ou sans rinçage) ?
Outils appelés : fermentation_check

## See0052 — cas « power »
Question : 28L mesurés à67°C, chauffe1000W : combien pour atteindre80°C ?
Attendu : heating_power : 25,4 min minimum sans pertes, aucune heure d’arrivée garantie.
Niveau : info
Synthèse : Avec 1000 W sur 28 L, il faut au minimum 25,4 minutes sans aucune perte pour passer de 67 °C à 80 °C.
Action : Lance la chauffe et note la température réelle avec l'heure toutes les 5 à 10 minutes pour mesurer ta vitesse de montée réelle.
Pourquoi : Ce calcul de 25,4 minutes est une borne basse théorique (eau seule, sans pertes). La masse du grain, la cuve et les déperditions thermiques rallongent ce temps en pratique, et ce minimum ne garantit pas que la puissance suffise à atteindre ou maintenir la cible.
À surveiller : Vérifie que la température monte régulièrement ; si elle stagne avant 80 °C, la puissance de 1000 W ne compense plus les déperditions.
Question de retour : Quelle température mesures-tu après 10 minutes de chauffe ?
Outils appelés : heating_power

## Sf5c60d — cas « color »
Question : Le moût semble bien plus foncé dans la grande cuve, je dilue ?
Attendu : Comparer en échantillon mince, densité et volume ; ne pas diluer sur l’apparence seule.
Niveau : info
Synthèse : Ne dilue pas maintenant : un grand volume de moût en cuve paraît toujours beaucoup plus sombre qu'en verre.
Action : Ne dilue pas et ne coupe pas la chauffe sur la couleur seule : prélève un petit échantillon mince, refroidis-le vers 20 °C et observe-le sous un éclairage neutre.
Pourquoi : La profondeur de liquide (~28,7 L occupés à l'empâtage), la turbidité des farines et le manque de lumière en cuve faussent complètement l'œil ; la prévision théorique de 9,9 EBC (Morey) n'est pas une mesure en cuve, et diluer à l'aveugle ferait chuter ta densité cible (1,056).
À surveiller : Vérifie l'absence d'odeur de brûlé ou d'accroche au fond de la cuve, puis mesure la densité refroidie (et le volume en fin de filtration) pour savoir si le moût est réellement trop concentré.
Question de retour : Sens-tu une odeur de brûlé en cuve, et quelle est la densité (ramenée à 20 °C) de ton échantillon ?
Outils appelés : calculate_recipe

## Sf61499 — cas « color »
Question : Le moût semble bien plus foncé dans la grande cuve, je dilue ?
Attendu : Comparer en échantillon mince, densité et volume ; ne pas diluer sur l’apparence seule.
Niveau : info
Synthèse : Ne dilue pas le moût uniquement sur son aspect visuel en grande cuve : la profondeur, la turbidité et l'éclairage le font paraître beaucoup plus foncé qu'il ne l'est réellement.
Action : Ne dilue pas pour l'instant. Prélève un petit échantillon mince, laisse-le refroidir à température ambiante et observe-le à la lumière du jour (ou dans les mêmes conditions que d'habitude), tout en vérifiant s'il y a une odeur de brûlé.
Pourquoi : Dans une grande cuve, la lumière traverse une épaisseur importante de moût trouble, ce qui assombrit fortement la teinte perçue. Diluer à l'aveugle risquerait de faire chuter ta densité sous la cible (1.056) sans raison.
À surveiller : Mesure le volume et la densité à 20 °C en fin de saccharification pour vérifier si le moût est réellement trop concentré avant d'envisager un ajustement.
Question de retour : As-tu déjà relevé le volume ou la densité actuels, ou senti une odeur de brûlé ?
Outils appelés : aucun
