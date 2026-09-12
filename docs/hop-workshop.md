# Atelier aromatique — 8 septembre 2026

L’atelier commence par des programmes effectivement brassés et décrits, puis permet de les adapter à une recette. Une fiche `trial` est un compte rendu, pas un modèle. Aucun rendement enzymatique ni score de réussite n’a été ajouté.

## Parcours

- Création de recette : accès dès l’identité et depuis les autres étapes ; atelier intégré au choix des houblons. Rechercher un essai, lire son programme et son résultat, prévisualiser les masses au volume de la recette, puis reprendre explicitement le houblonnage et la levure.
- Adaptation : choisir un objectif et une souche, modifier les lignes de houblons et leurs phases de contact. Les différences au programme de référence restent visibles. Les champs absents ne deviennent ni une température usuelle ni une moyenne de plage.
- Recette terminée : graphiques et informations en lecture seule. Toute modification passe par le parcours d’édition de la recette. Consulter un sujet technique ne modifie rien.
- Recherche de houblon : catalogue fabricant, références d’essais et fiches enregistrées partagent la même source de lecture. Cascade est accessible sans achat ni import préalable. Un choix documentaire enregistre uniquement la référence utilisée ; il ne crée pas de stock.

## Données et mathématiques

`hopKnowledge` accepte un nouveau type `trial`, validé côté serveur et client. Les doses, températures, contacts et éventuelles plages sensorielles portent chacun une source datée. `assessmentSource` identifie séparément le jugement de transposition et le regroupement en familles. Les records enregistrés dans Firestore priment sur les références livrées ; ils sont modifiables depuis Sources et modèles, sans redéploiement. Les catalogues de secours restent en lecture seule jusqu’à une action explicite.

`Recipe.hopTrialId` identifie un repère documentaire vivant. Il ne certifie pas `hopMatrixId` et ne fige pas une prédiction historique. Une adaptation conserve ses propres ingrédients ; le résultat expérimental reste affiché comme résultat de la source. Les instantanés quantitatifs existants restent indépendants.

Le seul dimensionnement est `masse (g) = dose publiée (g/L) × volume de recette (L)`. Il s’agit d’un programme, pas d’une prédiction aromatique. Une dose publiée comme plage ne reçoit pas de moyenne automatique. Aucune plage de température n’est remplacée par son milieu. Les alpha et quantités de levure inconnus utilisent les conventions de saisie existantes « à compléter » et ne deviennent pas des analyses.

La comparaison traite les ajouts comme un ensemble avec multiplicité : leur ordre visuel est indifférent, leurs phases et références restent distinctes. Les bornes n’acceptent qu’une tolérance d’arrondi machine. La plage nominale d’une souche n’est pas assimilée au palier réel de fermentation. Grist, lot, forme, clarification et conduite complète restent explicitement à vérifier, même si les conditions connues concordent.

Les graphes séparent objectif personnel, dose du programme, dose de la recette, résultat du panel et analyse chimique. Chaque graphique analytique conserve son unité et sa base de mesure ; huiles, ng/L de bière et équivalents d’étalon ne sont pas fusionnés. Un point sans incertitude publiée reste un point observé, sans intervalle inventé.

## Sources retenues et portée

- [Lafontaine et al., 2018](https://doi.org/10.23763/BrSc18-19lafontaine) : Cascade en cônes, Wyeast 1728, bière clarifiée après fermentation. La plage sensorielle du panel reste limitée à ce protocole. Elle n’est pas transférée à une IPA trouble en pellets.
- [Samia et al., EBC 2024](https://brewingscience.de/index.php/brewingscience/article/download/241/150/416) : essais Cascade au brassage avec plusieurs souches et températures discrètes. Le programme reprend une condition étudiée ; le résumé sensoriel concerne la série. Diamond sert de contre-exemple, car davantage de thiols ne signifie pas nécessairement davantage de fruité.
- [Lallemand, 2026](https://www.lallemandbrewing.com/en/africa/resources/whats-new/practical-tips-for-thiol-boosting-recipes/) et [newsletter 22](https://admin.lallemandbrewing.com/wp-content/uploads/2026/04/newsletter-WBWY-22-web-vfinal.pdf) : moût partagé entre Verdant et Pomona. Cascade, Hallertau Blanc et Simcoe sont un mélange ; le résultat ne décrit aucun de ses houblons isolément. Les conditions de recette proviennent du texte indexé du PDF, dont le téléchargement direct répondait 403. Température et durée du whirlpool absentes ; aucune reconstruction du graphique OAV.
- [Takoi et al., 2017](https://doi.org/10.23763/BrSc17-17takoi) : terpènes libres et précurseurs. Aucun passage universel de composition en huiles à intensité sensorielle.
- [Wyeast, 2025](https://wyeastlab.com/resource/characterizing-german-and-belgian-strains-for-pof/) : caractère POF et phénols volatils, indépendant de β-lyase. Aucune attribution de statut POF à une souche non vérifiée.
- [Guanilo-Pairazamán et al., 2026](https://doi.org/10.3389/frfst.2026.1815939) : information sur les composés phénoliques et le houblonnage, mais protocole partiellement ambigu et absence de répétition biologique par condition ; aucun programme conseillé ni coefficient importé.

Les notes existantes sur Cys/GSH, ATF1, lactones, esters et matrices restent accessibles dans la vue technique. Les photographies Lallemand servent à retrouver ces sources ; leurs concentrations d’exemple et seuils ne deviennent pas des constantes de calcul.

## Validation

Tests locaux : sources obligatoires sur toutes les conditions ; validation complète du pack ; absence de moyenne et de coefficient inventés ; remplacement uniquement après aperçu et persistance ; recette conservée en cas d’échec ; adaptation US-05 distincte du résultat de l’essai ; recherche Cascade sans stock ; bilan en lecture seule. Le script navigateur `check-hop-workshop.mjs` vérifie le parcours réel sur téléphone et ordinateur, sans accès réseau externe ni appel Gemini.
