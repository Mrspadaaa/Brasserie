# Consolidation scientifique et mathématique du 8 septembre 2026

Cette passe Deep Research complète la [revue précédente](index-houblon-revue.md).
Les nouvelles mesures et notes sont des packs locaux installables depuis
**Stocks → Houblons → Sources et modèles**. Aucun déploiement ni import dans la
base distante n’a été effectué pendant l’audit.

## Données supplémentaires

`hopPublicLotBootstrap.json` contient **6 références documentaires, 10 échantillons
publics et 88 mesures** : neuf COA YQH/HopTechnic/YCH/Clayton, puis sept mesures du
tableau 2 de Samia et al. (2026). Les certificats sont référencés par URL, date et
empreinte SHA-256. Les onze pages des COA portant des données ont été inspectées
visuellement. Le script `scrape-hop-reference-lots.py --check` reconstitue le pack
hors ligne ; `--refresh` refuse un document modifié avant nouvelle revue.

Les échantillons ont `referenceOnly: true`. Ils ne représentent pas un stock
disponible et ne peuvent pas être associés à une nouvelle recette comme lots de
la brasserie. Les références parentes ne reçoivent aucune plage variétale déduite
de ces quelques échantillons. Le rejeu des 16 documents n’écrit rien deux fois.

Distinctions analytiques ajoutées :

- `3s4mpFree` : 3S4MP/3M4MP, distinct du 3MH et du 4MMP ;
- `ugKgThiolEquivalent` : équivalents thiol libre, distincts d’une masse de conjugué ;
- `ugLInternalStandardEquivalent` : mesure semi-quantitative, toujours documentaire
  en l’absence de facteurs de réponse et d’identité d’étalon modélisés ;
- `hsi` / `index` : indice HSI, distinct d’un pourcentage ou d’une ancienneté ;
- base ou unité inconnue conservée lorsque le certificat ne les établit pas.

La bibliothèque compte désormais **21 notes**, dont dix nouvelles. Le corpus
complet compte **766 références par source** (pas 766 variétés biologiques
distinctes), **3 222 mesures**, **6 levures** et toujours **un seul modèle
sensoriel exploratoire**. Les 1 037 unités et 1 017 années inconnues du corpus
restent inconnues. Une masse documentaire accrue ne vaut pas une validation.

## Corrections de logique

Le score est `100 × (1 − Σ(wᵢdᵢ)/Σwᵢ)`, avec des distances normalisées et des
poids positifs. Le même poids apparaît dans les deux sommes. Diviser deux
intervalles calculés indépendamment perdait cette dépendance et pouvait inverser
le classement prudent. Le moteur énumère maintenant les extrema exacts de ce
ratio sur la boîte de poids indépendants. Ce résultat mathématique n’affirme
pas que les arômes physiques sont indépendants.

Contre-exemple vérifié : deux axes, poids `[1,10]` et `[1,1]`, distances de A
`[1,0]` et de B `[0.8,0.8]`. L’ancien calcul classait A avant B. Les plages
exactes sont A = `[9.091,50]`, B = `[20,20]` : B est premier par borne basse.
L’oracle de test énumère tous les sommets de 60 boîtes de valeurs et de poids.

Les nouveaux instantanés portent `hop-envelope-v2`. Leur import vérifie les
relations triplet/modèle/contexte, puis rejoue le calcul depuis les **seules
preuves figées** : sorties, plages, confiance, sources, modèles et alertes
doivent correspondre. Une base analytique modifiée ou une source déclassée ne
peut plus conserver un ancien résultat incompatible. Les v1 gardent leur
validation structurelle sans recalcul ni réécriture. Toute évolution ultérieure
de la sémantique du moteur exige une nouvelle version et la conservation du
validateur de chaque version historique.

Une β-lyase génériquement positive ne fait plus disparaître la vigilance sur
les précurseurs cystéinylés : transport, conjugué, souche et milieu restent à
qualifier. « Rendement non établi » ne signifie pas « souche incapable ».

## Ce que les nouvelles publications permettent réellement

- [Samia et al., 30 juillet 2026](https://doi.org/10.1016/j.fochms.2026.100445) :
  texte intégral vérifié, mesures de houblon importées. Cinétiques sur un seul
  brassin biologique par condition, malgré les répétitions analytiques ; aucun
  taux universel déduit. Annexes non récupérées.
- [Chenot et al., 6 mars 2026](https://doi.org/10.1021/acs.jafc.5c14936) :
  transfert au moût et libération de 3SH sont deux rendements distincts. Résumé
  primaire vérifié, tableaux détaillés non accessibles ; aucun coefficient importé.
- [Costantini et al., 2 juillet 2025](https://doi.org/10.3390/foods14132357) :
  équivalents d’étalon au tableau 4, deux ajouts pendant la fermentation,
  ambiguïté SD/SE. Les données ne deviennent pas des concentrations absolues
  ni un modèle d’ajout isolé.
- [Rutnik et al., 30 avril 2022](https://doi.org/10.3390/foods11091310) :
  quinze traitements variété × HSI, souche et protocole documentés. Bon candidat
  pour un jeu d’observations ; la forme du produit reste à préciser, l’écart-type
  du panel ne donne pas une marge prédictive pour un autre brassin.
- [Willemart et al., 16 janvier 2025](https://doi.org/10.1080/03610470.2024.2432146) :
  activités enzymatiques et évolution d’esters sans croissance microbienne ;
  ni prédiction d’ABV/CO₂, ni seuil universel de protection.
- [Lino et al., 2026](https://doi.org/10.1016/j.afres.2026.101729) :
  récolte × variété × levure pertinent, mais tableaux non vérifiés et données
  annoncées sur demande. À obtenir avant toute calibration.

Une extension OHAI (intensité houblonnée globale) de Cascade 2015 est
numériquement plausible : R² de l’ajustement reproduit ≈ 0,56. Elle n’est pas
installée : transcription visuelle encore à vérifier et nécessité de séparer
l’intensité globale des axes aromatiques, pour éviter de compter deux fois une
réponse très corrélée à Citrus. Les contradictions de reconstruction Cascade
2014/Centennial ne sont pas résolues par ajustement arbitraire.

Les garanties [jackknife+/minmax de Barber et al., 2021](https://doi.org/10.1214/20-AOS1965)
nécessitent notamment l’échangeabilité. Les récoltes et panels de ce corpus ne
l’établissent pas : les marges actuelles restent descriptives, sans étiquette
« couverture 95 % ». Le score reste une convention de rapprochement de profil.

La priorité suivante est un jeu d’observations appariant protocole complet,
chimie et dégustation, avec répétitions biologiques identifiées. Une bière
commerciale sans levure ou timing connu enrichit les observations sensorielles,
mais ne devient pas un exemple supervisé du triplet.
