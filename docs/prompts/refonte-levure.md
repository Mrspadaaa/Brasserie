# Mission autonome — refonte complète de Levure

## Démarrage et responsabilités

Cette mission est destinée à une **future session**, après fusion de la
préparation. Partir de `main` synchronisé, constater l'état du dépôt, préserver
tout travail présent et créer `codex/yeast-ui-refactor` si une branche dédiée
convient. `AGENTS.md` est chargé automatiquement ; ce fichier est la mission
explicitement pointée au démarrage, pas une invitation à lire tous les markdown.
Lire les skills natifs `unlazy`, `caveman-lite` et
`brasserie-frontend`, puis les sections pertinentes de `PRODUCT.md`, `DESIGN.md`
et `docs/ui-compacte.md`. Ne pas charger `CLAUDE.md` ou `.claude/` dans les
modèles OpenAI. Aucun déploiement ni écriture de vérification sur une DB réelle :
utiliser des fixtures et les émulateurs adaptés. Ne pas écraser les modifications
d'autrui. Cette préparation n'a modifié aucun écran de l'application.

Sol Max pilote les choix, l'implémentation et ses preuves dans son contexte
complet. Il consulte Astra Max dans un processus `astra-review` séparé au
cadrage, avant les choix coûteux de contrat, d'UX et d'architecture, puis lui
fait relire les risques restants du parcours intégré et ses preuves avant
livraison. Chaque avis porte sur un angle précis ; Astra peut vérifier en lecture
seule les sources et implémentations pertinentes, sans exploration générale,
production ou orchestration. Sol décide et motive un avis écarté ; une autre
consultation répond seulement à un arbitrage ouvert, une contradiction ou des
échecs répétés. Les Luna Max reçoivent recherches, tests, reproductions, revues
ciblées ou une petite correction cohérente, avec fichiers attribués ; Sol en
délègue jusqu'à 9 utiles selon les places disponibles, sans doublonner les
recherches ni leur confier une refonte mal bornée. Un seul Claude Opus 5.5 xhigh
participe : d'abord une contribution de conception à partir d'un
brief et de captures ciblés, puis une revue sur rendu et parcours observés avec
corrections utiles. Une nouvelle mission Claude exige un problème précis ; ne
pas entretenir une boucle de consultations ni lui confier l'exploration générale
du dépôt. Le relais Claude peut mobiliser au plus 9 Luna, sans doublonner le
travail des Sol. Voir `docs/openai-setup.md` pour lancer et diagnostiquer le CLI
sur abonnement sans repli API. Les profils natifs Sol/Luna complets restent
872000 tokens configurés, 828400 utiles vérifiés précédemment. Astra reste à
272000 tokens configurés, 258400 utiles.

Écrire avant les changements les critères, responsabilités de fichiers et
contrôles dans `docs/validation/yeast-refactor-implementation.md`. Y garder
un petit « État de reprise » vivant : objectif et dernières corrections de
l'utilisateur ; branche et commit de référence ; décisions et invariants ;
agents actifs, identifiants et fichiers confiés ; terminé et prouvé versus
ouvert ; prochaine action et liens aux preuves. Actualiser aux jalons et avant
une pause ou un relais prévisible, pas à chaque outil. Au démarrage, à la
reprise, après une compaction détectée ou un changement de périmètre, relire
les consignes applicables et cet état, vérifier diff et agents, puis poursuivre
sans répéter les recherches ni créer de doublons. Ne pas créer de registre
global partagé entre tâches ou promettre un hook avant toute compaction.
Rester dans le périmètre Levure et les liaisons nécessaires avec recette, stock,
catalogue, Gemini et brassage ; préserver les étapes Eau/sels et leur calcul.

## Résultat attendu pour le brasseur

Refondre réellement l'interface graphique de Levure. Aucun champ, composant,
regroupement ou emplacement actuel n'est acquis. Depuis l'étape Levure, le
brasseur trouve ou commence à saisir sa levure **en un clic**. Il comprend les
conséquences documentées de cette levure **dans sa recette**, règle les variables
pertinentes du procédé, voit la quantité à ensemencer et la préparation requise,
compare une autre souche avant tout remplacement, puis l'applique explicitement.
Il peut revenir, corriger, sauvegarder et retrouver ces décisions. Le parcours
doit rester utilisable pour une recette incomplète et hors ligne.

Traiter chaque **champ, sortie calculée, source, état, erreur et action** avec une
matrice courte : décision du brasseur, utilité maintenant, moment, emplacement,
visibilité immédiate ou à la demande, contrôle, représentation, meilleure
alternative plausible et constat dans le parcours. Garder l'accès aux données
secondaires pertinentes ; une donnée ne disparaît pas du modèle parce qu'elle
quitte l'écran principal. Déplacer ou remplacer les composants hérités si une
autre organisation aide mieux. Une capture sans geste vérifié et sans cette
revue sémantique ne valide pas l'UX.

Explorer plusieurs moyens **visuels et interactifs** de montrer sélection,
écarts et conséquences, au-delà du texte. Prototyper les choix incertains avec
les mêmes cas représentatifs, données manquantes et unités réelles. Examiner
les outils du dépôt et des outils externes maintenus dans leur documentation
actuelle ; décider selon lisibilité, clavier/tactile, exactitude, maintenance et
coût mesuré. Aucune liste de graphiques ni nouvelle bibliothèque n'est imposée.
Un résultat sensoriel qualitatif reste qualitatif : ne fabriquer ni intensité
0–100, ni courbe temporelle, ni score de compatibilité faute de modèle applicable.
Mettre mesures, estimations, cibles, informations fabricant et inconnues dans
des états distincts. Un scénario ne modifie pas la recette avant l'action
« appliquer » ; une recette mise à jour ne réécrit pas un brassin déjà lancé.

## Recherche, offres et comparaison

Une recherche accepte nom, code, fabricant, alias et souche d'une recette,
y compris une référence étrangère sans offre locale connue. Séparer l'identité
recherchée, l'alternative fonctionnelle, le produit vendu et le stock personnel.
Une souche similaire n'est pas identique ; les différences de données et leur
incertitude restent visibles. Comparer sur **la même recette** les plages
documentées et les sorties estimables, puis demander une application explicite.
Rendre les réglages de fermentation documentés accessibles au moment utile ;
relier chaque réglage à son effet justifiable et à sa limite. Si volume, densité
ou autre paramètre manque, montrer ce qui peut être comparé sans inventer le
reste.

Pour des petits brassins, privilégier sachets secs autour de 11–12 g **ou**
petits packs liquides, sans filtre « exactement 12 g ». Classer les offres
pertinentes par **distribution vérifiée** : Suisse, puis France et Allemagne
au même rang, puis reste de l'Europe. Le pays du laboratoire n'est pas le pays
de distribution. Distinguer : stock de la brasserie, référencement chez un
vendeur, stock marchand annoncé, stock effectivement revérifié, conditions de
livraison en Suisse et date de chaque observation. Une offre connue comme
indisponible ou non livrable ne devient pas achetable grâce à son rang. Les
souches étrangères restent recherchables comme références et comparateurs ;
ne pas encombrer la sélection ordinaire avec toutes les fiches mondiales.

Partir des observations datées de
`docs/research/yeast-availability-2026-09-24.md` et des pistes visuelles de
`docs/research/yeast-visualization-options.md`. Ce sont des amorces, pas une
preuve de stock actuel ni une liste fermée. Revérifier seulement les fiches
produit et conditions de livraison nécessaires au parcours implémenté. La
carte `docs/research/yeast-code-map-2026-09-24.md` situe le code et les limites
Gemini ; recontrôler ses chemins sur le nouveau `main` avant modification.

## Ensemencement et starter, du choix au brassage

Au choix d'une levure, indiquer la **quantité théorique nécessaire**, les
**sachets/packs entiers** correspondants et, lorsque pertinent, la possibilité
et le calendrier d'un starter. Présenter séparément la dose recommandée par le
fabricant pour le produit et une estimation cellulaire documentée : elles ne
sont pas interchangeables. Conserver les unités d'entrée et de sortie (g, mL,
cellules, volume de moût en mL/L/hL, densité/°P, taille du pack) et le calcul
de conversion explicitement. Une quantité en grammes ne donne pas un nombre de
cellules sans données validées pour le produit ; un volume de pack ne garantit
pas sa viabilité. Le nombre de packs à acheter est entier, la quantité calculée
et l'éventuel surplus restant visibles.

Séparer la **quantité prévue dans la recette** de la **quantité conseillée**.
Pour un produit vendu exclusivement en sachet dont le conditionnement est
documenté, la sélection peut initialiser « 1 sachet de 11,5 g » (poids réel
du produit, jamais supposé). Cette quantité reste ajustable et ne certifie pas
que la dose est suffisante. Si le calcul applicable conseille trois sachets,
montrer « 1 prévu / 3 conseillés », l'écart et une action « Utiliser 3 sachets ».
Recalculer le conseil lorsque volume, densité ou levure change, sans écraser
silencieusement la quantité choisie. Garder le détail du pitch rate accessible
au moment utile, sans imposer une longue fiche technique avant chaque choix.

Définir et tester les paramètres, unités, formules et conditions d'application
à partir des sources primaires réunies dans
`docs/research/yeast-pitch-rate-2026-09-24.md`, puis vérifier la fiche exacte
du produit retenu. Selon la méthode applicable, inclure volume à ensemencer,
densité du moût, type/procédé de fermentation, forme et souche, dose ou contenu
cellulaire publié par pack, date de production/péremption, conservation et
viabilité **si connues**. Rendre les hypothèses modifiables là où elles le sont
réellement. Afficher « inconnu / calcul impossible » quand la viabilité, le
conditionnement ou le modèle manque ; ne pas substituer une moyenne opaque.
Si le fabricant fournit une **plage** de dose, montrer la plage de masse et de
packs entiers correspondante sans choisir silencieusement son milieu. Le
brasseur peut ensuite sélectionner une dose applicable dans cette plage pour
obtenir un nombre unique de packs et son surplus, avec la justification et les
conditions affichées.
La masse de grains seule, par exemple 12 kg pour une imperial stout, ne
détermine ni le volume à ensemencer ni une recommandation de trois sachets.
Relier le calcul aux valeurs communes de la recette. Distinguer la contribution
à la densité et la fermentescibilité documentée des ajouts, notamment la
maltodextrine ; ne pas inventer un retrait automatique de la densité utilisée
par une formule de pitch rate. L'extrait de malt destiné au milieu d'un starter
et la maltodextrine sont des produits distincts, avec usages et sources explicites.
Ne pas supposer qu'une levure sèche exige un starter. Pour chaque résultat,
montrer formule, provenance, unités, conditions et limites (notamment forme,
souche, température, stockage et âge) ; éviter une précision injustifiée.

Si un starter est retenu, l'aide devient un **plan enregistré** : volume et
milieu documentés, étapes, durée et échéances relatives à la date de brassage,
matériel et consignes applicables, statut prévu/en cours/fait, confirmation de
ce qui a réellement été préparé et quantité effectivement ensemencée. La
préparation apparaît **en amont** du jour de brassage si son délai l'exige, puis
se retrouve dans la conduite du jour de brassage. Éviter de proposer le jour
même un starter devenu impossible. Relier le plan au produit/lot et à la recette
avec une révision ; figer les données nécessaires dans le snapshot du brassin
au lancement. Un changement ultérieur de recette ou de catalogue ne doit pas
réécrire ce brassin. Prévoir correction, annulation et reprise hors ligne.

## Gemini : corriger et enregistrer réellement

Implémenter un parcours où Gemini recherche des alternatives, complète,
**contrôle et corrige aussi des champs déjà présents en DB**, avec des outils
réels d'application. Il ne suffit ni d'écrire une suggestion dans le chat, ni
de remplir uniquement les trous. Chaque proposition a : identité stable de
l'entité et chemin du champ, ancien et nouveau typés, motif, URL/source directe
et date de vérification, produit/souche/forme/conditionnement et portée
(référence catalogue, offre, stock, recette, ou autre cible explicite), révision
attendue et état de validation. Ne pas déduire la disponibilité marchande d'une
fiche technique ou d'un pays de laboratoire. La recherche web établit une
source, pas automatiquement la vérité de chaque fait extrait.

L'utilisateur peut demander et approuver une **correction** d'une valeur
existante. L'outil relit l'état actuel, compare la révision et l'ancienne
valeur, valide la portée et la source, écrit la correction autorisée dans la
bonne entité et l'audit, puis retourne la valeur et la révision enregistrées.
Une saisie plus récente ou un fait contradictoire déclenche un conflit lisible
et une nouvelle évaluation ; l'autorisation de corriger n'est jamais un
écrasement aveugle. Distinguer « brouillon modifié », « enregistré localement/en
attente de synchronisation » et « confirmé côté serveur ». Revenir à la fiche
et la rouvrir pour prouver la persistance ; vérifier aussi un refus/conflit et
la reprise hors ligne. Le précédent `import-plan.mjs` et les transactions
Gemini actuelles dans la carte sont des points de départ, pas cette fonction
déjà implémentée. Préserver imports/exports, données antérieures et contrats
des recettes incomplètes. Aucun test ne doit écrire sur la DB réelle.

## Vérification et sortie

Avant/après : ouvrir réellement Levure sur **un mobile 390 px** et **un desktop
1280 px** représentatifs, examiner les captures et jouer le parcours avec
recherche, choix, réglage, comparaison, application, retour, erreur, sauvegarde,
réouverture et correction. Une autre largeur sert seulement à élucider un
défaut constaté. Vérifier clavier, zoom, libellés, unités et accès aux valeurs
exactes. Rejouer la planification du starter avant brassage jusqu'à l'usage
dans le jour de brassage ; tester dose fabricant et estimation cellulaire,
valeurs manquantes, pack entier, sec et liquide. Tester une souche étrangère
recherchée avec alternative distribuée localement, un vendeur France/Allemagne,
un produit non livrable, stock personnel et offre inconnue distincts.

Inclure le scénario imperial stout : sélectionner une levure en sachet,
retrouver un sachet prévu, compléter volume/densité et obtenir le conseil
calculé, l'appliquer puis sauvegarder/rouvrir. « Trois sachets » est un exemple
de résultat à établir avec une fixture documentée, pas une règle liée au style
ou aux 12 kg de grains. Faire varier le volume, la densité et le conditionnement,
tester un manque de données, une quantité manuelle conservée et l'ajout de
maltodextrine. Vérifier séparément l'option starter et son milieu approprié.

Faire vérifier les contrats de calcul, sauvegarde/snapshot, conflits Gemini,
offline et import/export avec des tests pouvant échouer et des fixtures. Partir
des scripts et tests ciblés indiqués dans la carte, puis `npm run build` si les
sources ont changé. Mesurer toute performance annoncée sur un banc décrit :
latence locale de recherche/réglage (objectif produit : p95 sous 200 ms,
sur un même banc avant/après ; ce n'est pas un résultat déjà obtenu),
taille/chargement des graphes et dossiers, coût d'une dépendance ajoutée ;
séparer la latence réseau/Gemini. Un build ou l'absence de débordement seuls
ne valident pas l'expérience. Faire relire indépendamment les données métier
et les captures, corriger les défauts observés, puis rejouer les parcours
affectés. Ne prétendre à une validation utilisateur que si elle a eu lieu.

Renseigner le registre avec fichiers changés, décisions visuelles et métier,
sources/formules, captures examinées, scénarios joués, commandes exécutées,
résultats, mesures et limites. À chaque jalon, vérifier critères, contrats à
risque, avis reçus et suites, tests capables d'échouer et contrôle UX utile.
Distinguer contrôles exécutables et décisions humaines : les consignes seules
ne prouvent pas l'absence de dérive ni une baisse du quota. La livraison future
est une refonte utilisable et prouvée, sans déploiement ou mutation de production
automatiques.
