# Atelier levure et NOLO — contrôle Fruty, 9 septembre 2026

La création propose désormais des conduites NOLO complètes depuis l’étape Levure. Le mode « Évaluer ma recette » montre d’abord le prochain renseignement utile ; « Trouver une conduite » compare trois propositions et ouvre le catalogue complet. Aucun style n’exclut une souche.

## Ce qui change

- Un catalogue local commun résout les noms, alias et références de souche pour l’atelier, le calcul et le compagnon. Les corrections enregistrées priment sur les références embarquées.
- Quatre souches à fermentation limitée sont documentées dans le référentiel actuel. Les autres levures restent recherchables. Une souche suggérée sans relation applicable ne reçoit pas la formule LA-01.
- Chaque proposition expose souche, quantité, température, programme d’empâtage, grain, fermentation, eau et conditionnement avant application. La masse de grain n’est adaptée que si les potentiels sont disponibles. Les opérations, ajouts à cru et corrections personnelles d’eau sont conservés.
- La saisie aromatique reste libre. Le classement utilise les caractères écrits dans les fiches ; cette recherche documentaire ne prédit aucune intensité. Fruits et acidification restent des intentions jusqu’à saisie des apports réels.
- Le remplissage local renseigne les cases vides depuis les références identifiées. Le bouton IA groupé est disponible pendant la saisie des ingrédients, à l’étape Levure et au récapitulatif. Les résultats sont montrés avant application, associés à leur source, annulables et rejetés si le brouillon change.
- Les faits fermentaires importés ont un schéma dédié : souche, assimilation des sucres, POF, hydrolyse, plages avec unités, conditions, provenance et date. Ils ne permettent pas d’importer un coefficient de conversion.
- Le compagnon reste enregistré même lorsque son bouton flottant est masqué. Le raccourci de l’en-tête fonctionne sur téléphone et ordinateur. Échap ferme le dialogue supérieur sans fermer l’éditeur.
- Le build public utilise le gabarit de données initiales vide. Un garde de bundling refuse le module de données privées local ; les recettes et comptes réels proviennent de l’espace authentifié.

## Calcul et compatibilité

La proposition LA-01 prend 6 °P comme point de départ, à la borne basse du domaine de la référence conservée en base. Les autres souches peuvent explorer ce moût mais ne bénéficient pas de sa relation alcoolique. La quantité de levure et les réglages centraux sont des choix de préparation issus des plages fabricant, sans optimum aromatique supposé.

Le planificateur inverse la conversion SG → °P déjà utilisée par le moteur. Il ne réutilise pas une seconde approximation et ne perd plus de précision par un arrondi intermédiaire des points d’extrait. Le nouveau drapeau facultatif `nolo.planning.exactExtract` active ce chemin pour les nouvelles propositions. Son absence conserve le calcul historique et l’identité des anciennes mesures. Les relations scientifiques et leurs versions restent dans les documents de connaissance existants.

Les propositions appliquées portent leurs références figées. Leur clé comprend le brouillon complet : toute modification invalide une prévisualisation antérieure. Le réglage de carbonatation ne supprime pas silencieusement un resucrage déjà enregistré.

## Vérification indépendante

La fixture Fruty reprend la saisie fournie, y compris US-05 et les flocons sans potentiel ni couleur. Une seconde variante de contrôle complète les flocons avec des valeurs **synthétiques QA** (PPG 33, EBC 2), sans prétendre disposer de l’analyse d’un produit commercial. Ces valeurs n’entrent ni dans le référentiel ni dans une recette en production.

- Fruty incomplet : diagnostic sur le potentiel PPG, souche inadaptée au procédé documenté, fruit/acide et contact du houblon manquants. Pas de PPG inventé.
- Fruty complété en QA : proposition LA-01 à 6 °P, 15,6 g / 24 L, empâtage 65 °C / 40 min puis 73 °C / 25 min. Le moteur et la proposition retrouvent **0,3964 % vol.** selon la relation référencée ; l’écran encadre la valeur par 0,39–0,40. Ce n’est pas un intervalle statistique.
- Les autres souches ne reçoivent pas ce chiffre. Un fruit ultérieur dont la composition manque rend le bilan final incomplet.
- Les valeurs personnelles, les sels désactivés, les ajouts et le procédé choisi restent conservés. Les intentions et faits sourcés survivent à l’export/import.
- Les suites scientifiques NOLO et levure reproduisent leurs benchmarks existants, sans nouvel ajustement de coefficient pour Fruty.
- La suite intégrée a passé 3 184 tests, puis le test d’annulation ajouté et les 18 régressions ciblées associées ont passé.
- Le banc compilé utilise l’App et les composants réels avec adaptateurs de stockage et IA isolés. Aucun appel Gemini payant.
- Parcours vérifié : édition Fruty → compagnon → autocomplétion simulée → proposition → application → sauvegarde → rechargement → lecture. Puis deux pilotes Nuage, huit procédés et quatre combinaisons des cases avant/après traitement.
- Contrôles réels à 320, 390 et 1280 px : absence de débordement/erreur console, clavier, données inconnues non dessinées à zéro, bornes et positions des graphiques comparées au moteur.
- Sur la machine de contrôle, vingt ajouts : médiane 8,6–9,8 ms, maximum 13,1 ms pour les propositions ; zéro requête distante et zéro écriture pendant les simulations.
- Le parcours classique de levure a également été rejoué, avec six objectifs, calendrier, sauvegarde/rechargement et variantes en lecture seule.

Commandes : `npm test`, `node scripts/check-prompts.mjs`, `node scripts/check-nolo-science.mjs`, `node scripts/check-yeast-science.mjs`, `npm run test:smoke:fruty`, `npm run test:smoke:yeast`, builds frontend et functions, gardes d’authentification et de documents privés.

## Limites métier

US-05 ne devient pas une levure de fermentation limitée parce que la case NOLO est activée. L’analyse des flocons et la méthode d’acidification de Fruty restent à choisir. Un profil « Fruit Lambic » n’établit ni une culture mixte ni un apport de fruits. Les souches peu documentées restent utilisables pour préparer un essai, avec alcool à caractériser. La stabilité, la teneur après conditionnement et la qualité sensorielle nécessitent les analyses et dégustations du brassin réel.

Références déjà versionnées : [LA-01, guide novembre 2025](https://sbi4beer.com/wp-content/uploads/2025/11/SafBrew-LA-01-technical-guidelines-nov-25.pdf), [US-05, fabricant](https://fermentis.com/en/product/safale-us-05/), [Fruit Lambic, BJCP 2021](https://www.bjcp.org/style/2021/23/23F/fruit-lambic/).
