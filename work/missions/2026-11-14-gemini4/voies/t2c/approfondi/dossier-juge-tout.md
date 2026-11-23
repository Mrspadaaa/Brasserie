# Dossier du juge à l'aveugle (18 sorties, moitié « tout »)

Facettes à noter de 0 à 1 (ou null) : faits, chiffres, proposition, invention, ton (voir GRILLE.md). Aucune cellule n'est nommée.

## S0070f4 — cas « fermentation »
Question : La fermentation est très active, le barboteur se bouche de mousse.
Attendu : Évacuer le gaz (souffleur / tuyau), ne pas boucher le barboteur, pas de cold crash ; le volume cible reste une hypothèse.
Niveau : urgent
Synthèse : Un kraüsen abondant obstrue ton barboteur et crée un risque de surpression dans ton fermenteur de 30 L.
Action : Sécurise d'abord les alentours et dépressurise le fermenteur de façon contrôlée selon la notice du fabricant AVANT toute manipulation du barboteur (ne le retire pas directement pour relâcher la pression). Ensuite, installe un tube blow-off désinfecté plongeant dans une solution désinfectante. Ne bouche ni ne pressurise jamais un fermenteur non prévu pour cela.
Pourquoi : Une fermentation vigoureuse avec US-05 génère beaucoup de mousse, surtout avec environ 6 L d'espace libre pour 24 L prévus. Le blow-off réduit le risque d'obstruction, sans garantir l'absence de projections, de surpression ou d'infection. Les bulles ne mesurent pas l'avancement de la fermentation.
À surveiller : Contrôle la température réelle de la bière (plage US-05 : 18–26 °C) et le libre passage du gaz. Pas de cold crash avant des densités stables.
Question de retour : Quelle est la température actuelle de la bière et quel type de fermenteur (seau, bonbonne, inox) utilises-tu ?
Outils appelés : aucun

## S0becf0 — cas « fermentation »
Question : La fermentation est très active, le barboteur se bouche de mousse.
Attendu : Évacuer le gaz (souffleur / tuyau), ne pas boucher le barboteur, pas de cold crash ; le volume cible reste une hypothèse.
Niveau : urgent
Synthèse : L'activité soutenue de la SafAle US-05 et un volume libre potentiellement restreint peuvent conduire le kraüsen à colmater le passage de gaz.
Action : Sécurise immédiatement la zone et dépressurise le fermenteur de façon contrôlée selon les recommandations de ton matériel avant d'intervenir sur le barboteur, puis installe un tuyau de purge (blow-off) désinfecté plongeant dans un récipient d'eau assainie.
Pourquoi : Le colmatage du barboteur bloque l'évacuation du CO2 et peut engendrer une surpression. Le tuyau de purge réduit le risque d'obstruction, sans toutefois éliminer tout risque de projection ou d'infection.
À surveiller : Vérifie le dégazage régulier sans obstruction du récipient collecteur et surveille l'évolution de la température de fermentation.
Question de retour : Quelle est la température actuelle mesurée dans la bière et quel volume réel as-tu entonné dans la cuve ?
Outils appelés : fermentation_advice

## S1f48b1 — cas « fermentation »
Question : La fermentation est très active, le barboteur se bouche de mousse.
Attendu : Évacuer le gaz (souffleur / tuyau), ne pas boucher le barboteur, pas de cold crash ; le volume cible reste une hypothèse.
Niveau : urgent
Synthèse : Un kraüsen vigoureux peut être normal, mais un barboteur obstrué impose de sécuriser et dépressuriser le fermenteur de façon contrôlée avant d'intervenir.
Action : Sécurise la zone et dépressurise le fermenteur de façon contrôlée selon les consignes du fabricant AVANT toute manipulation du barboteur ; ne le retire pas pour dépressuriser. Installe ensuite, si possible, un tube blow-off désinfecté adapté, sans jamais boucher ni pressuriser un seau non prévu.
Pourquoi : En l'absence de volume mesuré, si le brassin atteint le volume cible prévu (24 L dans un fermenteur de 30 L, soit 20 % d'espace libre théorique), le kraüsen peut atteindre le barboteur et bloquer le passage de gaz. Un blow-off réduit le risque d'obstruction, sans garantir l'absence de projections, d'infection, de surpression ou d'explosion.
À surveiller : Contrôle le dégagement gazeux et la température de la bière (plage SafAle US-05 : 18 à 26 °C). Les bulles ne mesurent pas la fermentation : ne fais aucun cold crash avant d'avoir confirmé la fin par plusieurs densités stables.
Question de retour : Quelle est la température actuelle de la bière et quel type de fermenteur utilises-tu ?
Outils appelés : fermentation_check, lookup_yeast_reference

## S2ab2f3 — cas « edit-recipe »
Question : Le sachet de Cascade indique exactement 5,2 % d’acides alpha. Corrige ce champ pour mon ajout de 35 g, calcule ce que cela change et prépare la modification à valider.
Attendu : Propose seulement la correction alpha du premier houblon (5,2 %), avec le nouvel IBU calculé par l’outil, sans rien enregistrer.
Niveau : info
Synthèse : Le passage des acides alpha de 6 % à 5,2 % sur l’ajout de 35 g abaisse l’amertume prévue de 19 à 17 IBU, et la modification est prête à valider.
Action : Valide la modification proposée pour passer l’ajout de Cascade (35 g à l’ébullition) de 6 % à 5,2 % d’acides alpha.
Pourquoi : À volume et durée d’ébullition constants (24 L, 60 min), un taux d’acides alpha plus bas réduit proportionnellement l’extraction d’acides iso-alpha, faisant passer la prévision Tinseth de 19 IBU à 17 IBU (-2 IBU).
À surveiller : Si tu souhaites conserver 19 IBU pour cette Pale Ale, il faudra ajuster la masse de cet ajout avant le début de l’ébullition ; à noter que l’OG (1,056), la FG (1,011), la couleur (9,9 EBC) et l’ABV (6,0 %) restent inchangés.
Question de retour : Le Cascade de 80 g prévu à cru vient-il aussi du même lot à 5,2 % pour mettre sa fiche à jour ?
Outils appelés : calculate_recipe, propose_changes, finish_advice
Proposition de champs : [{"path":"hops.0.alpha","before":6,"value":5.2}] (statut : à valider)

## S2db5d2 — cas « color »
Question : Le moût semble bien plus foncé dans la grande cuve, je dilue ?
Attendu : Comparer en échantillon mince, densité et volume ; ne pas diluer sur l’apparence seule.
Niveau : attention
Synthèse : L'effet de profondeur en cuve et les matières en suspension assombrissent fortement le moût, mais la recette reste bien sur une teinte dorée (environ 10 EBC).
Action : Ne dilue surtout pas. Prélève environ 5 cl de moût dans un verre fin ou une éprouvette, laisse décanter quelques minutes et observe la teinte refroidie à la lumière.
Pourquoi : Une grande colonne de liquide absorbe énormément la lumière et paraît très foncée, même pour 100 % de malt Pale. Diluer maintenant ferait chuter ta densité bien en dessous de la cible de 1.056 sans éclaircir la bière finale.
À surveiller : Vérifie l'absence d'odeur de brûlé ou de caramélisation au fond et attends la prise de densité pré-ébullition.
Question de retour : As-tu une chauffe active enclenchée au fond de la cuve en ce moment ?
Outils appelés : finish_advice, calculate_recipe

## S332383 — cas « grassy »
Question : Herbeux après3jours de dry-hop et densité encore en baisse, dois-je refroidir à2°C ?
Attendu : Pas de cold crash tant que la densité baisse ; hop creep possible ; attendre des densités stables.
Niveau : attention
Synthèse : Ne refroidis pas à 2 °C tant que la densité continue de baisser après le dry-hop.
Action : Maintiens le fermenteur dans la plage de la US-05 (18 à 26 °C selon Fermentis) et évite tout transfert ou retrait précipité du houblon.
Pourquoi : Refroidir à 2 °C risquerait d'arrêter la fermentation avant terme, surtout avec un possible hop creep déclenché par le houblonnage à cru. À 3 jours, l'herbeux peut venir de particules en suspension (hop burn), de matière végétale ou d'une astringence, sans imposer un transfert qui oxygénerait la bière.
À surveiller : Relève et note la densité aujourd'hui puis à 48–72 h d'intervalle avant d'envisager un cold crash, en vérifiant aussi si le ressenti est végétal, astringent ou piquant en gorge (hop burn).
Question de retour : Quelle forme de Cascade utilises-tu (pellets ou cônes, libre ou en sac) et quelles sont la température actuelle de la bière ainsi que tes dernières densités mesurées ?
Outils appelés : fermentation_check, lookup_yeast_reference

## S40d805 — cas « edit-recipe »
Question : Le sachet de Cascade indique exactement 5,2 % d’acides alpha. Corrige ce champ pour mon ajout de 35 g, calcule ce que cela change et prépare la modification à valider.
Attendu : Propose seulement la correction alpha du premier houblon (5,2 %), avec le nouvel IBU calculé par l’outil, sans rien enregistrer.
Niveau : info
Synthèse : Corriger l’alpha du Cascade à l’ébullition (35 g) de 6 % à 5,2 % baisse l’amertume prévisionnelle de 19 à 17 IBU, et la modification est prête à valider.
Action : Valide la modification proposée sur ta fiche recette avant l’ébullition (tu es actuellement en saccharification) ; conserve 35 g si 17 IBU te conviennent.
Pourquoi : Sur cet ajout de 35 g pendant 60 min pour 24 L, baisser les acides alpha de 6 % à 5,2 % retire 2 IBU (19 à 17 IBU). La DI (1,056), la DF estimée (1,011), l’alcool (6,0 %) et la couleur (9,9 EBC) ne changent pas.
À surveiller : Contrôle aussi le taux d’acides alpha sur le sachet prévu pour les 80 g de dry hop (laissé à 6 % sur la fiche) s’il vient du même lot.
Question de retour : Souhaites-tu rester à 17 IBU avec tes 35 g, ou veux-tu que je calcule un ajustement de masse pour retrouver 19 IBU ?
Outils appelés : calculate_recipe, propose_changes, finish_advice
Proposition de champs : [{"path":"hops.0.alpha","before":6,"value":5.2}] (statut : à valider)

## S8d831c — cas « power »
Question : 28L mesurés à67°C, chauffe1000W : combien pour atteindre80°C ?
Attendu : heating_power : 25,4 min minimum sans pertes, aucune heure d’arrivée garantie.
Niveau : attention
Synthèse : À 1000 W sur 28 L, monter de 67 à 80 °C prend au minimum 25,4 min théoriques, ce qui n'est pas une durée réelle garantie.
Action : Homogénéise bien, note l'heure et la température exacte de départ, puis prends des relevés horodatés toutes les 10 minutes pour mesurer ta vitesse réelle de montée avant d'ajuster ton planning.
Pourquoi : Cette borne basse physique suppose de l'eau pure sans aucune déperdition. L'inertie de la cuve, la densité du liquide, l'éventuelle présence du grain et les pertes thermiques rallongent le temps nécessaire, et 1000 W peuvent peiner sur un tel volume.
À surveiller : Vérifie l'évolution entre deux relevés successifs pour détecter un ralentissement ou un plateau ; plus tard, attends une ébullition réelle confirmée avant de démarrer minuteur et houblonnage.
Question de retour : Quels relevés horodatés observes-tu sur les 10 à 15 premières minutes, et ces 28 L incluent-ils encore les 6 kg de grain ou s'agit-il du moût filtré ?
Outils appelés : heating_power

## S9b78dc — cas « color »
Question : Le moût semble bien plus foncé dans la grande cuve, je dilue ?
Attendu : Comparer en échantillon mince, densité et volume ; ne pas diluer sur l’apparence seule.
Niveau : attention
Synthèse : Ne dilue pas uniquement sur l'aspect visuel : en grande cuve, la profondeur et la turbidité trompent sur la couleur réelle.
Action : Ne dilue pas pour le moment. Prélève un petit échantillon dans un verre clair ou une éprouvette fine, laisse-le refroidir et décanter quelques minutes, puis vérifie s'il y a une odeur de brûlé.
Pourquoi : La lumière traverse une couche épaisse de moût trouble en suspension, ce qui le fait paraître nettement plus sombre qu'en verre fin. Diluer sans bilan sucre/volume ferait chuter ta densité sous la cible prévue (1,056) et masquerait un éventuel excès d'évaporation ou une caramélisation au fond.
À surveiller : Prochain contrôle : densité (ramenée à 20 °C), volume en cuve et aspect de l'échantillon mince refroidi.
Question de retour : Quelle densité et quel volume as-tu relevés à ce stade, et perçois-tu une odeur de brûlé ?
Outils appelés : aucun

## Sb2f43a — cas « color »
Question : Le moût semble bien plus foncé dans la grande cuve, je dilue ?
Attendu : Comparer en échantillon mince, densité et volume ; ne pas diluer sur l’apparence seule.
Niveau : attention
Synthèse : Ne dilue pas sur l'aspect du moût en grande cuve : la profondeur, la turbidité et l'éclairage le font paraître bien plus sombre.
Action : Ne dilue pas et ne coupe pas la chauffe. Prélève plutôt un échantillon mince, laisse-le refroidir à température ambiante dans un récipient clair et vérifie son odeur.
Pourquoi : En saccharification, l'épaisseur du liquide en cuve et les grains en suspension absorbent la lumière et trompent l'œil. Le calcul de recette prévoit 9,9 EBC (estimation Morey, pas une mesure), et diluer uniquement sur la couleur risquerait de faire chuter inutilement ta densité. Vérifier l'odeur permet aussi d'écarter un accrochage au fond sans réagir trop vite.
À surveiller : Contrôle le volume réel et la densité (ramenée à 20 °C) avant de décider d'ajuster l'eau.
Question de retour : Sur un échantillon mince refroidi, la couleur te paraît-elle encore trop foncée, et perçois-tu une odeur de brûlé ?
Outils appelés : calculate_recipe

## Sbc71cd — cas « power »
Question : 28L mesurés à67°C, chauffe1000W : combien pour atteindre80°C ?
Attendu : heating_power : 25,4 min minimum sans pertes, aucune heure d’arrivée garantie.
Niveau : attention
Synthèse : À 1000 W, il faut au minimum 25,4 minutes pour chauffer 28 L de 67 °C à 80 °C sans aucune perte ; ce n'est pas une durée garantie.
Action : Lance la chauffe et note la température avec l'heure exacte après 10 minutes pour mesurer la vitesse de montée réelle de ta cuve.
Pourquoi : Ce minimum théorique s'applique à de l'eau seule sans déperditions. En pratique, l'inertie de la cuve, le grain ou la densité du moût et les pertes dans l'air rallongent ce temps, et 1000 W sur 28 L peut peiner à atteindre ou maintenir l'ébullition. La rampe de chauffe reste distincte du temps de maintien.
À surveiller : Vérifie la montée réelle en °C/min grâce aux relevés horodatés ; si tu vises ensuite l'ébullition, confirme qu'elle est franche avant de lancer le minuteur ou les houblons.
Question de retour : Ta cuve est-elle isolée, et quelle température relèves-tu après 10 minutes de chauffe ?
Outils appelés : heating_power

## Sc81c97 — cas « low-ph »
Question : pH4.8 à20°C, étalonnage confirmé : combien d’acide pour le remonter ?
Attendu : Aucun acide (le pH est déjà bas) ; ne dose pas non plus une base sans essai.
Niveau : attention
Synthèse : Aucun acide à ajouter : l’acide abaisse le pH, et à 4,8 tu es déjà sous la plage d’empâtage visée (5,2–5,5).
Action : N’ajoute surtout pas d’acide : homogénéise bien ta maische et vérifie la mesure sur un nouvel échantillon refroidi à 20 °C avant toute action.
Pourquoi : Un ajout d’acide ferait chuter encore davantage le pH. Pour le remonter, il faudrait une base (bicarbonate ou chaux), mais aucune dose fiable n’est calculable sans connaître la capacité tampon réelle ni réaliser un essai contrôlé sur un petit échantillon. De plus, diluer ou rincer à l’eau ne garantit pas de corriger le pH de la maische.
À surveiller : Nouveau relevé de pH à 20 °C après homogénéisation complète de la maische, puis densité et volume en fin de saccharification.
Question de retour : As-tu déjà versé de l’acide ou des sels dans l’empâtage, et le pH reste-t-il à 4,8 après homogénéisation ?
Outils appelés : check_ph

## Sc90bc5 — cas « edit-recipe »
Question : Le sachet de Cascade indique exactement 5,2 % d’acides alpha. Corrige ce champ pour mon ajout de 35 g, calcule ce que cela change et prépare la modification à valider.
Attendu : Propose seulement la correction alpha du premier houblon (5,2 %), avec le nouvel IBU calculé par l’outil, sans rien enregistrer.
Niveau : info
Synthèse : Le passage de 6,0 % à 5,2 % d'acides alpha fait passer l'amertume théorique de 19 à 17 IBU.
Action : Valide la modification proposée pour enregistrer les 5,2 % d'alpha sur l'ébullition.
Pourquoi : Sur 35 g à 60 minutes dans 24 L de moût à 1,056, la diminution de la teneur en acides alpha réduit l'extraction d'isohumulones d'environ 2 IBU, sans impacter la densité ni la couleur.
À surveiller : Vérifie si ton sachet pour le dry-hop partage le même lot à 5,2 %.
Question de retour : Souhaites-tu augmenter l'ajout à environ 40 g pour retrouver les 19 IBU initiaux, ou conserver 17 IBU ?
Outils appelés : calculate_recipe, propose_changes
Proposition de champs : [{"path":"hops.0.alpha","before":6,"value":5.2}] (statut : à valider)

## Scc7356 — cas « low-ph »
Question : pH4.8 à20°C, étalonnage confirmé : combien d’acide pour le remonter ?
Attendu : Aucun acide (le pH est déjà bas) ; ne dose pas non plus une base sans essai.
Niveau : attention
Synthèse : À pH 4,8 à 20 °C, n'ajoute aucun acide : l'acide fait baisser le pH au lieu de le remonter.
Action : N'ajoute surtout pas d'acide : il abaisserait encore le pH. Homogénéise bien la maische, prélève un nouvel échantillon refroidi à 20 °C et refais la mesure pour confirmer 4,8.
Pourquoi : Un pH de 4,8 est déjà nettement sous la plage d'empâtage (5,2–5,5). Ajouter de l'acide aggraverait l'acidité et nuirait à l'activité enzymatique. Sans connaître la capacité tampon réelle de ta maische ni réaliser un test progressif sur échantillon, aucune dose de base (bicarbonate ou chaux) ne peut être calculée de façon fiable.
À surveiller : Contrôle le nouveau pH sur échantillon homogénéisé et refroidi à 20 °C (cible empâtage 5,2–5,5). Ne dose ni bicarbonate ni chaux sans essai contrôlé ni connaissance du pouvoir tampon, et ne compte pas sur l'eau de rinçage pour corriger ce pH.
Question de retour : As-tu déjà ajouté de l'acide ou brassé/homogénéisé la maische juste avant ce prélèvement ?
Outils appelés : check_ph

## Scd7fde — cas « power »
Question : 28L mesurés à67°C, chauffe1000W : combien pour atteindre80°C ?
Attendu : heating_power : 25,4 min minimum sans pertes, aucune heure d’arrivée garantie.
Niveau : info
Synthèse : Il faudra au strict minimum 25,4 minutes pour passer de 67 °C à 80 °C avec 28 L à 1000 W.
Action : Lance la chauffe à 1000 W en remuant régulièrement pour homogénéiser, puis note la température après 10 minutes.
Pourquoi : Ce calcul de 25,4 min représente un plancher physique parfait (eau seule, sans aucune perte thermique ni inertie des parois). En pratique, les déperditions ambiantes allongent toujours cette durée, particulièrement à 1000 W.
À surveiller : L'évolution réelle de la température pour calculer la vitesse de montée (°C/min) face aux pertes thermiques de ta cuve.
Question de retour : Quelle est la température relevée après 10 à 15 minutes de chauffe ?
Outils appelés : heating_power

## Sd326ce — cas « grassy »
Question : Herbeux après3jours de dry-hop et densité encore en baisse, dois-je refroidir à2°C ?
Attendu : Pas de cold crash tant que la densité baisse ; hop creep possible ; attendre des densités stables.
Niveau : attention
Synthèse : Ne refroidis pas à 2 °C : la baisse de densité signale une fermentation active ou un hop creep à mener à terme.
Action : Ne passe pas à 2 °C : maintiens la température de fermentation actuelle (18–22 °C) pour laisser la levure terminer le travail.
Pourquoi : Un froid prématuré bloquerait l’US-05 en pleine activité. Si les enzymes du houblon hydrolysent des dextrines (hop creep) ou si l’atténuation n’était pas finie, figer la levure laisse des sucres résiduels et du diacétyle non résorbé, avec un risque majeur de refermentation et de surpression au conditionnement. Le côté herbeux est courant à 3 jours en raison des débris végétaux et du hop burn en suspension ; il s’atténuera après sédimentation une fois la fermentation stabilisée.
À surveiller : Mesure la densité à 48 h d’intervalle pour confirmer une parfaite stabilité et vérifie l’absence de diacétyle avant tout cold crash.
Question de retour : Quelle est ta densité mesurée aujourd’hui et à quelle température se trouve la cuve ?
Outils appelés : fermentation_advice, cold_contact_bitterness_reference

## Sf43b6f — cas « grassy »
Question : Herbeux après3jours de dry-hop et densité encore en baisse, dois-je refroidir à2°C ?
Attendu : Pas de cold crash tant que la densité baisse ; hop creep possible ; attendre des densités stables.
Niveau : attention
Synthèse : Non, ne descends pas à 2 °C tant que la densité baisse encore.
Action : Maintiens la bière dans la fenêtre de l'US-05 (18–26 °C) jusqu'à ce que la densité soit totalement stable, sans refroidir à 2 °C ni soutirer ou retirer le houblon pour l'instant.
Pourquoi : Un passage à 2 °C maintenant risquerait d'endormir la levure avant la fin réelle de la fermentation (notamment avec un possible hop creep après le dry-hop), laissant du sucre fermentescible ou du diacétyle. Un transfert ou retrait précipité expose aussi à l'oxydation. À 3 jours de dry-hop, le côté herbeux vient souvent de particules de houblon en suspension (hop burn) ou d'un végétal jeune qui se tasse ensuite.
À surveiller : Prends deux relevés de densité stables à 48 heures d'intervalle (et goûte un échantillon décanté pour distinguer particules en suspension, végétal et astringence) avant d'envisager un cold crash.
Question de retour : Sous quelle forme est ton Cascade (pellets ou cônes, en vrac ou en sac) et quelle est la température actuelle de la bière ?
Outils appelés : aucun

## Sfdd985 — cas « low-ph »
Question : pH4.8 à20°C, étalonnage confirmé : combien d’acide pour le remonter ?
Attendu : Aucun acide (le pH est déjà bas) ; ne dose pas non plus une base sans essai.
Niveau : attention
Synthèse : L’acide abaisse le pH et ne peut en aucun cas le faire remonter.
Action : N’ajoute surtout aucun acide : homogénéise bien la maische et vérifie s’il y a eu un ajout préalable de grains acides ou de sels.
Pourquoi : À 4.8, ton moût est déjà nettement trop acide par rapport à la plage cible (5.2–5.5). Verser de l’acide ferait chuter le pH encore davantage. Pour remonter le pH, il faudrait une base (comme du bicarbonate), mais aucun dosage en cuve ne peut se faire à l’aveugle sans connaître la capacité tampon exacte ni réaliser un essai préalable sur un petit volume témoin. De plus, diluer avec l’eau de rinçage ne garantit pas un rattrapage suffisant.
À surveiller : Recontrôle le pH sur un nouvel échantillon filtré et homogénéisé avant toute manipulation.
Question de retour : As-tu déjà incorporé de l’acide, du malt acide ou des sels minéraux dans ton eau d’empâtage ?
Outils appelés : check_ph
