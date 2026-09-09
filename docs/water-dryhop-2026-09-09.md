# Eau, autocomplétion à cru et amertume — 9 septembre 2026

## Corrections

Le radar, le rapport SO₄/Cl, les neuf sels et les deux doses d’acide sont visibles ensemble dans l’atelier mobile. La disposition du radar devient plus large pour garder ses chiffres lisibles. Seules les explications et les diagnostics détaillés se replient ; le radar reste aussi visible dans les sections d’eau ouvertes du récapitulatif et de la consultation.

L’autocomplétion technique inclut les houblons à cru. Stock et catalogue emploient les mêmes champs initiaux pour l’ajout. L’alpha reste modifiable, les données déjà saisies et le contexte de l’ajout sont préservés. Une durée absente ne s’affiche plus comme une durée nulle.

Le calcul courant des IBU à chaud distingue contribution connue et total incomplet. Il refuse notamment une durée supérieure à l’ébullition, un alpha absent ou une température de whirlpool manquante. Une recette uniquement houblonnée à cru possède une contribution Tinseth nulle, même sans OG ; cela ne décrit pas son amertume finale. Création, consultation, propositions de fermentation, aide de brassage et repères d’eau partagent ce contrôle. Les fonctions historiques et les anciennes valeurs enregistrées restent disponibles.

## Simulation à cru : portée précise

Source primaire : [Maye, Smith et Leker, MBAA TQ 53(1), 2016, 23–27](https://cdn.hopsteiner.de/assets/cdn/service/technical_information_and_support/technical-publications/2016-06_humulinone-formation-in-hops-and-hop-pellets-and-its-implications-for-dry-hopped-beers_maye_et-al_mbaa.pdf).

La case « Simuler l’amertume à cru » transpose des scénarios expérimentaux d’extraction d’humulinones et de perte d’iso-alpha. Le résultat est un équivalent d’amertume en mg/L iso-alpha, **pas une prédiction du test IBU de laboratoire**. Les paramètres proviennent des tableaux 1 et 3–5 ; la relation sensorielle de référence est contrôlée séparément sur le tableau 6. Les différences d’arrondis et les contradictions de pourcentages entre tableaux sont conservées dans les localisateurs.

La plage initiale de composition vient de deux lots précis, pas d’une population de houblons. Elle est une hypothèse modifiable, jamais une analyse du lot utilisateur. L’interpolation en dose et le transfert des ratios de rétention à la recette sont des choix expérimentaux de l’application. Aucune validation externe ni couverture statistique ne sont revendiquées. Une fermentation active, une matrice NOLO, d’autres températures et formes peuvent sortir des scénarios montrés. Les données ne permettent pas de chiffrer les effets de chaque événement espacé ; le programme cumulé est présenté comme un scénario de contact commun, sans bonus d’espacement.

Le total des masses est combiné avant interpolation. Chaque scénario conserve ensemble sa rétention d’iso-alpha et son extraction ; le delta ne soustrait pas deux intervalles indépendants. L’alpha du sachet ne devient jamais une teneur en humulinones. Au-delà de la dose maximale étudiée, le moteur explique sa limite et ne plafonne pas silencieusement les grammes. Les coefficients sont versionnés dans `hopKnowledge`, éditables via Sources et modèles ; un import séparé crée seulement la référence absente et préserve toute révision existante.

## Validation

- 15 tests de calcul : unités, relation sensorielle publiée, zéros et inconnues, contrôle des domaines, dépendances d’incertitude, total avant arrondi, source obligatoire et priorité aux révisions en base.
- Parcours réel compilé avec adaptateurs locaux : Fruty, saisie d’acide/sel/rapport, Doser, recherche Cascade à cru, autocomplétion IA simulée, simulation, modification d’hypothèse, sauvegarde et rechargement.
- Contrôle visuel et géométrique à 320×700, 390×700, 320×740, 390×740, 390×844 et 1280×900. Tous les réglages d’eau tiennent dans les cinq fenêtres mobiles, sans recouvrement. Console et réseau contrôlés.
- Zéro requête et zéro écriture pendant la simulation, après chargement. Calcul de vingt ajouts inférieur à 1 ms dans le banc Chrome de contrôle (mesure du moteur, distincte du rendu).
- Suite intégrée : un échec financier préexistant reproduit sur le dépôt principal sans ces changements (`equipmentProjects`, attendu impayé alors que la saisie initialise payé). Il ne provient pas de cette correction. Le comportement financier et ses tests restent inchangés.

Le succès des tests du proxy d’amertume prouve sa reproduction et sa cohérence informatique ; il ne prouve pas sa validité sensorielle pour un autre brassin.
