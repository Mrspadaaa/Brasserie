# Compagnon brasseur

## Besoin de cuverie et choix d’interface

Un brasseur seul doit pouvoir décider du prochain geste avec les mains occupées : faut-il agir maintenant, mesurer d’abord ou laisser le procédé continuer ? L’assistant commence par une action courte, explique l’impact, puis propose le prochain contrôle. Il pose seulement les questions qui changent la conduite à tenir.

Une entrée discrète ouvre une feuille mobile dans la recette, son brouillon, le jour de brassage et la fiche du lot. Les discussions du brouillon suivent la recette lors de son enregistrement. Les calculs, limites et sources sont repliés. La saisie reste en pied de feuille et utilise une police de16px. Le modèle prépare des propositions de champs ; seuls les champs cochés puis explicitement validés sont appliqués. « Garder dans les notes du journal » reste une action explicite du brasseur.

L’analyse exploratoire avec Gemini a fait apparaître des conseils trop automatiques (prolonger une ébullition de15min, refroidir immédiatement un dry-hop, doser une base d’après le volume seul). Ces propositions ont été écartées : les préconditions, la phase et les relevés décident du conseil.

## Contexte et outils

Le serveur authentifie le brasseur et recharge la recette figée du lot, le journal, les températures/densités, les notes de fermentation/dégustation, le profil matériel, les eaux et les caractéristiques du stock. Il exclut comptabilité, clients, tarifs et coordonnées bancaires. Un ancien lot sans copie figée est signalé ; il n’est pas reconstruit par supposition. Un brouillon et un journal local non synchronisé restent identifiés comme tels.

Les outils de calcul utilisent exactement les modules de l’interface, assemblés pour Node par `scripts/build-brewer-tools.mjs`. Ils couvrent recette/OG/FG/IBU/couleur, encombrement et volumes, houblonnage et durée d’ébullition, mélange osmosée/réseau, projection thermique et rampes, minimum physique de chauffe à puissance réduite, sauvetage volume/densité, contrôle pH, substitutions de malt et fermentation/réfractomètre. Les températures, doses et timings fournis à un outil restent des scénarios tant qu’ils ne sont pas consignés dans le journal.

La recherche documentaire passe par un outil Gemini avec Google Search ; ses références réellement retournées sont montrées dans les détails. Le modèle n’a ni navigateur arbitraire, ni exécution de code, ni accès aux écritures métier.

## Harness et vérification

Boucle bornée à 10 tours initiaux, puis jusqu’à deux corrections de 6 tours chacune en Flash, avec 16 appels d’outils et 6 tentatives de recherche web au total. Approfondi conserve une seule correction. Le parcours reste limité à 24 appels Gemini et soumis aux plafonds de question ainsi qu’au budget mensuel partagé ; les limites ne s’additionnent donc pas pour autoriser des appels sans fin. Les arguments numériques ont des unités et des plages ; un outil inconnu est refusé. Les contenus Gemini complets, signatures comprises, suivent les retours d’outils. La réponse est validée contre un schéma et ses références doivent exister.

En Rapide et Auto, Gemini Flash assure l’analyse, les recherches, la synthèse, les relectures indépendantes et les corrections nécessaires. Une question simple conserve deux étapes IA. Un achat mobilise trois chercheurs Flash en parallèle : produit exact, autre boutique et variantes, conditionnement et disponibilité annoncée. Les fiches produit sont ensuite lues par le serveur et les offres pertinentes sélectionnées pour le conseil. Deux relecteurs distincts contrôlent en parallèle la justesse technique et l’utilité pratique du résultat. Ils interviennent pour les achats, recherches documentaires, finances, propositions de champs et gestes sensibles ; tous deux doivent approuver chaque version. Les garde-fous de relecture restent actifs pour l’urgence et les corrections acides, sans passage automatique à Pro.

L’option « Approfondi » force Gemini 3.1 Pro pour l’analyse et la relecture ; ses recherches web restent sur Flash. Ce choix est conservé avec la question en attente. Une sélection de Pro n’est jamais remplacée silencieusement par un autre modèle : une indisponibilité est signalée et la question reste récupérable. Les modèles effectifs et la raison de la vérification sont enregistrés et affichés dans les détails. « Conseil relu » décrit une seconde analyse IA, pas une garantie d’exactitude physique.

Les substitutions ne se limitent au stock personnel que sur demande. Une rupture fournisseur déclenche `find_brewing_suppliers`, qui cherche ingrédients originaux et alternatives en Suisse avec Google Search. Le serveur lit ensuite les pages chez Brau- und Rauchshop, Brewstore Suisse, Sevibräu et SIOS. Les disponibilités proviennent du produit/conditionnement précis, jamais d’un bouton panier, d’une recommandation voisine ou d’un extrait indexé. Les autres boutiques restent des pistes documentaires sans stock confirmé. Les lectures sont bornées (8 pages, 10 secondes par page, 1,8 Mo) ; les redirections sont contrôlées contre une liste fermée de domaines publics. Un échec de lecture ne produit aucune preuve de stock. Les liens d’achat et l’heure du contrôle apparaissent sous le conseil ; après 24 heures l’étiquette devient « Stock à revérifier ». Aucun achat ni réservation n’est effectué.

Points sensibles : aucun acide pour remonter un pH, aucune dose de base improvisée, concentration exacte du flacon obligatoire pour l’estimation acide, contrôle pH de maische interdit à une autre phase, consigne différente d’une mesure, volume cible différent du volume récolté, borne de chauffe différente d’une ETA, rampe différente du maintien, stabilité de densité différente d’un barboteur calme. Une couleur ou un goût seuls ne prouvent pas une cause ni la salubrité.

## Persistance

### Champs proposés et remise à zéro

`propose_changes` utilise une liste fermée de champs et de types, partagée avec la validation serveur. Il prépare un avant/après, sans écriture, puis recalcule la recette simulée. La relecture contrôle aussi ces modifications ; une proposition refusée est retirée. Le brasseur peut écarter la proposition ou sélectionner les groupes de champs à appliquer. Les choix partiels sont revalidés ensemble (températures minimum/maximum, durée et houblons).

`applyBrewerProposal` accepte uniquement l'identifiant d'une proposition vérifiée, les cases cochées et une confirmation explicite. Le serveur retrouve son contexte d'origine, compare la version actuelle dans une transaction et refuse tout écrasement d'une correction plus récente. La recette enregistrée et les relevés du lot sont modifiés au serveur ; le journal passe par la même normalisation d'horloge et de révision que la saisie manuelle. Les recettes figées des lots, les stocks et les gestes terminés sont protégés. Les changements de recette recalculent l'affichage des ions sans changer les doses physiques. Les validations enregistrées gardent une trace avant/après dans l'audit, même après remise à zéro du chat. Un double clic retrouve le reçu de validation.

Dans le formulaire de création, seuls les champs du brouillon sont remplis après validation ; l'enregistrement de la recette reste une action distincte. Une évolution du brouillon pendant la validation empêche l'application de la réponse tardive. Ce statut local n'est pas persisté comme une écriture de recette réussie.

Le bouton de remise à zéro demande confirmation dans la feuille. `resetBrewerConversation` change la génération et invalide le traitement courant avant d'effacer les anciens échanges. Chaque nouvelle question porte la génération du chat : une ancienne page ou réponse ne peut réintroduire l'historique. La recette, le journal de brassage et les notes conservées restent intacts. Les snapshots de contexte partagés ne sont pas supprimés tant qu'ils peuvent servir aux autres archives.

`brewerChats` conserve chaque échange terminé, ses outils et sa relecture. `brewerContexts` déduplique les snapshots identiques par empreinte ; chaque réponse conserve la date du contexte. Les19 collections exportables incluent ces deux collections serveur, sans charger tout l’historique IA dans le cache de l’interface. La restauration est additive pour ces archives.

Un identifiant d’opération rend une relance idempotente. Un verrou transactionnel par conversation évite les générations concurrentes, avec bail et jeton contre les réponses tardives. Un identifiant réutilisé avec un autre contenu est refusé, même pendant la génération. Une relance rejoint l’opération existante ; une question différente attend la précédente, puis démarre automatiquement avec son historique actualisé. Le navigateur lit le reçu serveur toutes les 2,5 secondes pendant l’attente et peut retrouver une réponse même si la requête HTTP originale est interrompue. Réponse et libération du verrou sont atomiques ; le statut est lu dans une transaction cohérente. Le traitement est borné à 220 secondes dans les trois modes ; le bail ajoute 30 secondes pour l’enregistrement. Chaque recherche ou analyse Flash dispose au maximum de 45 secondes, chaque relecture Flash de 30 secondes, dans cette même limite globale. Les chercheurs et relecteurs indépendants travaillent en parallèle pour limiter l’attente.

La question, son mode et son contexte restent sur l’appareil en cas de coupure. Après rechargement, une réponse enregistrée est retrouvée ; un traitement en cours est rejoint automatiquement. Un traitement échoué laisse un bouton de relance explicite. L’historique est paginé par 20 échanges ; les 8 derniers accompagnent génération, correction et relecture avec leurs sources. Les gros champs ne sont pas indexés. Les logs indiquent durée, modèles effectifs et étape d’échec sans contenu de conversation ni secret.

Les clés sont exclusivement dans Secret Manager/côté serveur. Les collections de conversation sont inaccessibles aux écritures et lectures Firestore directes du navigateur ; les callables contrôlent le compte et cloisonnent les conversations par UID.

## Contrôles reproductibles

- `npm test` : suite métier/UI locale, avec tests de préconditions, erreurs, signatures Gemini simulées, refus de relecture, contexte périmé et reprise réseau. Aucun appel Gemini réel et aucun coût IA.
- `npm --prefix functions run build` : compile les fonctions et assemble les calculateurs partagés.
- `npm run test:ai:eval -- --confirm-paid-ai` : évaluation réelle facultative et facturable, clé dans `GEMINI_API_KEY`. Scénarios synthétiques, dont un arbitrage en Flash, la recherche suisse en Flash et la préparation d'un champ alpha à valider. `BREWER_EVAL_CASES` sélectionne des scénarios ; `BREWER_EVAL_MODE=deep` force Pro pour l’analyse et la relecture. Résultats privés sous `.codex-remote-attachments/`.
- `node scripts/eval-brewer-shopping-flash.mjs --confirm-paid-ai` : un achat synthétique Cascade pellets 100 g en Suisse, au maximum 10 tentatives Flash, 3 recherches, 32 000 jetons de sortie réservés, 1,50 CHF de provision et 120 secondes. Le test exige trois chercheurs, deux relecteurs, des fiches produit contrôlées, le bon houblon et un conditionnement de 100 g ; il contrôle aussi l’absence de modification du contexte synthétique. Le rapport inclut coût estimé, jetons, conditionnements et liens, y compris les échecs, sous `.codex-remote-attachments/brewer-flash-expanded-eval/report.json`. Aucun lancement depuis les tests unitaires.
- `node scripts/replay-brewer-shopping-flash.mjs chemin-du-rapport.json chemin-du-replay.json` : rejoue les réponses déjà enregistrées et relit seulement les pages vendeur. Aucun appel Gemini, aucune clé. Utiliser le rapport de la nouvelle équipe pour le parcours à trois chercheurs et deux relecteurs ; un ancien rapport n’a pas assez de réponses pour valider ce parcours. Le rapport d’origine reste intact et le nouveau rapport indique explicitement qu’il s’agit d’un replay, sans nouvelle validation du comportement génératif des modèles.
- `npm run test:ai:persistence -- --confirm-paid-ai` : Firestore émulé uniquement (`demo-brewer-chat`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`), appels Gemini réels et facturables. Vérifie authentification, snapshot, exclusion des champs privés, concurrence, relance, historique, déduplication, export et journal inchangé.
- `node scripts/check-brewer-mobile.mjs` : Vite sur3007, Chrome local, transport de contrôle explicitement simulé. Captures390/320px et écran réduit à480px, absence de débordement, saisie et bouton accessibles. Les essais modèle/serveur sont séparés.
- `node scripts/check-brewer-shopping-mobile.mjs` : même environnement, choix de modèle, reprise d’une question en attente et cartes fournisseurs, en passant par le vrai service navigateur avec réponses réseau simulées.
- `node scripts/check-brewer-proposals-persistence.mjs` : Firestore émulé, fournisseur simulé ; autorisations, sélection, brouillon sans écriture métier, idempotence, audit, conflit, relevé et réponse tardive après reset.
- `node scripts/check-brewer-proposals-mobile.mjs` : véritable formulaire de recette en 390/320px, API simulée ; aucune application avant validation, valeur relue dans la question suivante, annulation/confirmation du reset et vérification de la nouvelle génération.
- `node scripts/check-water-acid-mobile.mjs` : HCO₃ après acide par eau, graphique et panneau de rinçage en 390/320px ; appels externes bloqués, aucun coût IA.

Le contrôle visuel confirme que les conseils longs défilent dans la feuille, les preuves restent repliées et le champ de réponse reste accessible. Les mesures réelles et les caractéristiques provisoires du matériel restent nécessaires : le compagnon ne pilote pas la cuve.

Les deux commandes `test:ai:*` refusent de démarrer sans
`--confirm-paid-ai`. Dans une CI, elles restent bloquées même avec ce flag tant
que `ALLOW_PAID_AI_TESTS_IN_CI=1` n'est pas défini. Elles ne font partie ni de
`npm test`, ni du build, ni du déploiement.

## Références utilisées

Le traitement des appels d’outils suit la [documentation Gemini](https://ai.google.dev/gemini-api/docs/function-calling) et la conservation des [signatures de raisonnement](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures). Le format de réponse suit les [sorties structurées Gemini](https://ai.google.dev/gemini-api/docs/structured-output).

La recherche utilise [Google Search Grounding](https://ai.google.dev/gemini-api/docs/google-search). Les adaptations de stock ont été vérifiées sur les fiches [Brau- und Rauchshop](https://www.brauundrauchshop.ch/r%C3%B6stgerste), [Brewstore](https://brewstore.ch/ingredients-de-brassage-fr/pale-ale-ebc-5.5-7.5-100gr-fr/), [Sevibräu](https://www.bierbrauzubehoer.ch/produktkategorien/braumalz-flocken-malzextrakt/roestmalze/250/1kg-roestgerste-ebc-1100-1200) et [SIOS](https://www.sios.ch/Roasted-Barley-1200-EBC-ab-1-kg). La distinction Carafa / Carafa Special est documentée par [Weyermann](https://www.weyermann.de/product/weyermann-carafa-spezial-typ-2/).

Les précautions de mesure sont fondées sur [Hanna, pH de la maische](https://blog.hannainst.com/measuring-the-ph-of-mash-in-the-brewing-process/) et [l’étalonnage du pH-mètre](https://knowledge.hannainst.com/en/knowledge/generalized-calibration-ph-electrode-meter). Les familles de défauts sensoriels, qui ne suffisent pas à établir une cause unique, s’appuient sur [BJCP, Beer Faults](https://www.bjcp.org/education-training/education-resources/beer-faults/).
