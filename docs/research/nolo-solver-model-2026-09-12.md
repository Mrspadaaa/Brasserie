# Simulation d’une recette NOLO depuis une consigne

Le simulateur prépare une **recette à essayer** : choix du procédé et de la souche, réduction d’extrait, conduite, dose, calendrier, volumes et objectif de traitement. Il affiche une plage conditionnelle après les opérations connues. Il conserve les analyses séparément. Une consigne préremplie n’est ni une mesure ni une validation de la bière conditionnée.

Date de revue : 12 septembre 2026. Périmètre : les huit procédés de L’Affinée, avec les ingrédients et le matériel de la recette. La sélection des souches est documentée dans [la recherche sur les levures par procédé](nolo-process-yeasts-2026-09-12.md).

## Ce que les sources permettent de proposer

| Source primaire ou référence de calcul | Constat utile | Application et limite |
|---|---|---|
| [Fermentis, SafBrew LA-01 Technical Guidelines V3, novembre 2025](https://sbi4beer.com/wp-content/uploads/2025/11/SafBrew-LA-01-technical-guidelines-nov-25.pdf) | Le résultat dépend du moût et du protocole d’empâtage ; la régression publiée appartient à cette souche. | La préparation LA-01 reprend ses paliers documentés. Le nouveau simulateur utilise une hypothèse d’atténuation apparente éditable ; il n’emprunte pas la régression LA-01 pour une autre souche. Le moteur historique continue à identifier séparément son domaine expérimental. |
| [Lallemand, LalBrew LoNa](https://www.lallemandbrewing.com/en/united-states/products/lalbrew-lona/) et [fiche technique LoNa](https://admin.lallemandbrewing.com/wp-content/uploads/2023/04/LoNa-TDS-ENG-A4-Print-LalBrew.pdf) | La fiche fournit une plage d’atténuation de 16–20 %, une température et une dose de référence. | Ces bornes constituent une hypothèse initiale sur la recette. Elles ne sont pas une distribution de probabilité, et une composition différente peut les déplacer. |
| [Lallemand, NABLAB Best Practices](https://connect.lallemandbrewing.com/wp-content/uploads/2023/06/NABLAB-BP-ENG-Digital-LalBrew.pdf) | Recette, fermentescibilité, choix de levure et conduite sont liés. La limitation biologique, l’arrêt et le retrait d’alcool sont des voies distinctes. | Les procédés possèdent des paramètres différents. La désalcoolisation commence par une bière mère ; un faible extrait utilise le moût prévu et une fermentation envisagée complète. La stabilisation ne se déduit pas de la seule durée. |
| [Nikulin, Aisala et Gibson, 2022, DOI 10.1002/jib.681](https://doi.org/10.1002/jib.681), [texte des auteurs chez VTT](https://cris.vtt.fi/ws/portalfiles/portal/56611249/J_Institute_Brewing_2022_Nikulin_Production_of_non_alcoholic_beer_via_cold_contact_fermentation_with_Torulaspora.pdf) | L’étude compare des souches particulières près de 1 °C. Au pilote, la circulation avec la lager A15 s’arrête à 48 h ; le protocole Tdel8 diffère. Les populations cellulaires et la circulation sont décrites. | 1 °C et 48 h servent de repères de conduite éditables. L’atténuation initiale 1–5 % de l’application est explicitement une **hypothèse de pilote**, sans transfert de performance vers une lager commerciale. La dose sèche usuelle ne reproduit pas les populations de cette étude. |
| [Dan Bies, Briess, 10 février 2020, Cold Extraction of Malt Components](https://brewingwithbriess.com/blog/cold-extraction-of-malt-components-and-their-use-in-brewing-applications/) | L’extraction froide sépare différemment les fractions du malt. Le fabricant présente une extraction de 24 h et plusieurs modalités de contact ; l’eau doit hydrater le grain. | La recette propose un contact froid distinct du mash chaud. Le rendement 25 % et sa tolérance relative de 25 % sont des valeurs de départ **choisies par le simulateur**, et non des chiffres universels publiés par Briess. Un ancien mash-out chaud et son acidification ne sont pas réutilisés. |
| [Brewer’s Friend, calculateur ABV, 16 juin 2011](https://www.brewersfriend.com/2011/06/16/alcohol-by-volume-calculator-updated/) | Documentation primaire du calcul approché `(OG − FG) × 131,25`, déjà versionné dans l’application. | Le coefficient sert à la préparation, pas à une mesure analytique NOLO. Le modèle ne prétend pas résoudre tous les effets de matrice et d’alcool résiduel à faible concentration. |

Les fiches fabricant sans année de publication conservent `year: null`. Le modèle de simulation est daté et versionné indépendamment ; aucune année de publication n’est inventée pour faire accepter une plage documentaire.

## Équations et résolution inverse

Le calcul d’extrait réutilise `BrewingMath.extractPoints` en pleine précision. Chaque ingrédient avant fermentation contribue par sa masse et son potentiel PPG ; le rendement concerne le grain. Les ingrédients ajoutés en fermentation sont exclus de cette OG et doivent posséder une opération liée dans le bilan. Les proportions des ingrédients du moût sont conservées lors d’une modification de quantité.

Pour une OG centrale `G`, une tolérance relative d’extrait `t`, l’atténuation apparente `a` en pour cent et le coefficient versionné `k` :

```text
OG_min = 1 + (G − 1) × (1 − t / 100)
OG_max = 1 + (G − 1) × (1 + t / 100)
ABV_min = k × (OG_min − 1) × a_min / 100
ABV_max = k × (OG_max − 1) × a_max / 100
```

La borne haute est comparée à `cible − réserve`. La réserve initiale est le plus petit de 0,05 point de % vol. et 10 % de la cible ; elle reste éditable. C’est une marge de préparation choisie, sans interprétation probabiliste. Les opérations déjà connues sont calculées séparément, dans leur ordre, avant cette comparaison. Elles ne sont pas soustraites une deuxième fois dans la réserve.

Le solveur recherche une quantité d’extrait, un retrait d’alcool ou une chute de densité par dichotomie sur **le même évaluateur** que la recette appliquée. Il ne conserve pas un résultat obtenu par une seconde formule contradictoire. La quantité proposée est la plus élevée compatible avec le budget dans le domaine exploré, à composition constante. Après la préparation, les réglages manuels conservent la quantité proposée : augmenter l’atténuation, le rendement ou la tolérance peut donc faire dépasser la cible, ce que la vue signale.

Pour l’arrêt, le paramètre physique est la chute `OG − SG` à obtenir depuis **l’OG réellement mesurée**. La SG absolue proposée est un repère. Une même variation d’OG n’est pas soustraite deux fois comme si l’OG et la FG étaient indépendantes. Les températures et durées n’impliquent aucune loi cinétique chiffrée.

Pour le retrait, seule la quantité d’alcool déjà présente est réduite. La concentration finale dépend aussi du volume après traitement. Les sucres encore disponibles restent dans le bilan ; le retrait ne les fait pas disparaître. Une plage de retrait constitue une consigne à vérifier, sans conversion arbitraire en température de chauffe ou en minutes.

## Préparation par procédé

| Procédé | Ce que le solveur prépare | Paramètre à calibrer au pilote |
|---|---|---|
| Fermentation limitée | Grist, souche adaptée, paliers, dose et calendrier | Atténuation sur la composition réelle, sucres simples |
| Restitution aromatique | Base limitée et conservation des ajouts déjà décrits | Dose sensorielle au banc ; composition alcool/sucres du support à saisir |
| Faible extrait | Quantité de moût à fermentation classique, dose et calendrier | Atténuation réelle et équilibre sensoriel d’un moût très léger |
| Extraction froide | Rendement froid proposé, quantité, température et durée d’extraction | OG et volume récupérés ; absorption, filtration et acidification |
| Contact froid | OG proposée, calendrier froid, ensemencement comme repère de préparation | Atténuation effectivement atteinte, cellules et contrôle du contact |
| Fermentation arrêtée | Grist conservé, chute de densité à viser, programme de suivi | Mesures rapprochées, séparation/stabilisation ; durée non libératoire |
| Désalcoolisation | Bière mère, dose et fermentation, retrait et volume final | Alcool avant/après traitement, rétention des arômes |
| Seconde extraction | Volume/OG envisagés et conduite de récupération, sans réduire du grain neuf | Volume et OG effectivement obtenus, qui restent des mesures séparées |

Une récupération déjà renseignée demeure inchangée : le solveur ne cherche pas une masse fictive de malt pour modifier sa densité mesurée. Les blocs fondamentaux manquants — volume, PPG, plage invalide ou ajout de fermentation non comptabilisé — produisent une erreur actionnable et empêchent l’application. Les paramètres inconnus pour lesquels un essai est possible sont explicitement préremplis comme hypothèses.

Les volumes d’eau sont replanifiés avec le matériel de la recette. Le traitement est recalculé par l’outil d’eau existant lorsque son domaine s’applique. Sinon les concentrations minérales sont conservées par proportion des volumes, les anciens acides sont rendus absents et un titrage est demandé. Les capacités de cuve et de fermenteur incluent les ajouts connus. Les références et mesures d’origine restent dans la recette source du comparatif.

## Portée de la plage affichée

Cette plage est une propagation déterministe de bornes documentaires et de bornes choisies. Elle ne donne **ni IC 95 %, ni chance chiffrée de réussite**. Les tolérances proposées n’ont pas été calibrées sur une série de brassins. Elles permettent de préparer un premier essai, de comparer des hypothèses et de voir ce qui domine le budget alcoolique. Une analyse du pilote et un suivi reproductible peuvent ensuite informer des bornes plus pertinentes.

Changer la température, la durée ou la dose modifie les instructions de la recette. Cela ne déplace pas numériquement l’ABV tant que l’utilisateur ne modifie pas son hypothèse d’atténuation : aucune cinétique n’est inventée. Un écart à la température documentaire est signalé. La projection ne couvre pas une contamination, une reprise après arrêt, un hop creep non caractérisé ou une stabilisation non validée.

## Reproductibilité et vérification

Les hypothèses adoptées vivent dans `nolo.planning.simulation`, avec version, source, paramètres, plage d’OG, références et contexte. Le serveur et le frontend utilisent le même `evaluateNoloScenario`. Un changement de recette ou de rendement invalide les hypothèses anciennes ; un changement de procédé les écarte. L’application refuse une proposition dont la recette source a changé. Le transfert JSON peut réordonner les propriétés sans modifier cette identité.

Les tests dédiés couvrent les huit procédés sur une recette simple et sur les premières candidates réelles du catalogue, les quantités et capacités du matériel de Fruty, la résolution inverse et les réglages, le retrait et l’arrêt, les ajouts comptés une fois, les données invalides, les sources sans année, la conservation des mesures, la reprise après application et le rejeu après import/export. Le registre `.unlazy/nolo-solver/gates/leaf-1.2.md` en conserve les résultats exécutés ; les parcours UI, IA et jour de brassage sont vérifiés à l’intégration.
