# Compagnon brasseur

## Besoin de cuverie et choix d’interface

Un brasseur seul doit pouvoir décider du prochain geste avec les mains occupées : faut-il agir maintenant, mesurer d’abord ou laisser le procédé continuer ? L’assistant commence par une action courte, explique l’impact, puis propose le prochain contrôle. Il pose seulement les questions qui changent la conduite à tenir.

Une entrée discrète ouvre une feuille mobile dans la recette, son brouillon, le jour de brassage et la fiche du lot. Les discussions du brouillon suivent la recette lors de son enregistrement. Les calculs, limites et sources sont repliés. La saisie reste en pied de feuille et utilise une police de16px. Aucune modification de recette, dose, mesure ou minuterie n’est faite par le modèle. « Garder dans les notes du journal » est une action explicite du brasseur.

L’analyse exploratoire avec Gemini a fait apparaître des conseils trop automatiques (prolonger une ébullition de15min, refroidir immédiatement un dry-hop, doser une base d’après le volume seul). Ces propositions ont été écartées : les préconditions, la phase et les relevés décident du conseil.

## Contexte et outils

Le serveur authentifie le brasseur et recharge la recette figée du lot, le journal, les températures/densités, les notes de fermentation/dégustation, le profil matériel, les eaux et les caractéristiques du stock. Il exclut comptabilité, clients, tarifs et coordonnées bancaires. Un ancien lot sans copie figée est signalé ; il n’est pas reconstruit par supposition. Un brouillon et un journal local non synchronisé restent identifiés comme tels.

Les outils de calcul utilisent exactement les modules de l’interface, assemblés pour Node par `scripts/build-brewer-tools.mjs`. Ils couvrent recette/OG/FG/IBU/couleur, encombrement et volumes, houblonnage et durée d’ébullition, mélange osmosée/réseau, projection thermique et rampes, minimum physique de chauffe à puissance réduite, sauvetage volume/densité, contrôle pH, substitutions de malt et fermentation/réfractomètre. Les températures, doses et timings fournis à un outil restent des scénarios tant qu’ils ne sont pas consignés dans le journal.

La recherche documentaire passe par un outil Gemini avec Google Search ; ses références réellement retournées sont montrées dans les détails. Le modèle n’a ni navigateur arbitraire, ni exécution de code, ni accès aux écritures métier.

## Harness et vérification

Boucle bornée à7 tours,16 appels d’outils et2 recherches. Les arguments numériques ont des unités et des plages ; un outil inconnu est refusé. Les contenus Gemini complets, signatures comprises, suivent les retours d’outils. La réponse est validée contre un schéma et ses références doivent exister.

En automatique, Gemini 3.8 Flash démarre et juge lui-même si la question mérite Gemini 3.1 Pro via `request_deep_analysis` : diagnostic complexe, arbitrages de recette ou incertitude importante. Il peut décider avant ou après un calcul, sans appel de classification supplémentaire. Les questions simples restent sur Flash. Les deux outils web utilisent systématiquement Gemini 3.1 Pro, qui reprend ensuite la synthèse et la relecture. Les résultats et le contexte sont transmis au changement de modèle, sans réutiliser les signatures de raisonnement de l’autre modèle. Les garde-fous de relecture restent actifs pour l’urgence et les corrections acides ; une réponse refusée est corrigée puis relue par Pro.

L’option « Analyse approfondie » force Gemini 3.1 Pro dès le départ ; ce choix est conservé avec la question en attente. Une sélection de Pro n’est jamais remplacée silencieusement par Flash ou Pro 2.5 : une indisponibilité est signalée et la question reste récupérable. Les modèles effectifs, celui de chaque recherche web et la raison du passage à Pro sont enregistrés et affichés dans les détails. « Conseil relu » décrit une seconde analyse IA, pas une garantie d’exactitude physique.

Les substitutions ne se limitent au stock personnel que sur demande. Une rupture fournisseur déclenche `find_brewing_suppliers`, qui cherche ingrédients originaux et alternatives en Suisse avec Google Search. Le serveur lit ensuite les pages chez Brau- und Rauchshop, Brewstore Suisse, Sevibräu et SIOS. Les disponibilités proviennent du produit/conditionnement précis, jamais d’un bouton panier, d’une recommandation voisine ou d’un extrait indexé. Les autres boutiques restent des pistes documentaires sans stock confirmé. Les lectures sont bornées (8 pages, 10 secondes par page, 1,8 Mo) ; les redirections sont contrôlées contre une liste fermée de domaines publics. Un échec de lecture ne produit aucune preuve de stock. Les liens d’achat et l’heure du contrôle apparaissent sous le conseil ; après 24 heures l’étiquette devient « Stock à revérifier ». Aucun achat ni réservation n’est effectué.

Points sensibles : aucun acide pour remonter un pH, aucune dose de base improvisée, concentration exacte du flacon obligatoire pour l’estimation acide, contrôle pH de maische interdit à une autre phase, consigne différente d’une mesure, volume cible différent du volume récolté, borne de chauffe différente d’une ETA, rampe différente du maintien, stabilité de densité différente d’un barboteur calme. Une couleur ou un goût seuls ne prouvent pas une cause ni la salubrité.

## Persistance

`brewerChats` conserve chaque échange terminé, ses outils et sa relecture. `brewerContexts` déduplique les snapshots identiques par empreinte ; chaque réponse conserve la date du contexte. Les19 collections exportables incluent ces deux collections serveur, sans charger tout l’historique IA dans le cache de l’interface. La restauration est additive pour ces archives.

Un identifiant d’opération rend une relance idempotente. Un verrou transactionnel par conversation évite les générations concurrentes, avec bail et jeton contre les réponses tardives. Un identifiant réutilisé avec un autre contenu est refusé, même pendant la génération. Une relance rejoint l’opération existante ; une question différente attend la précédente, puis démarre automatiquement avec son historique actualisé. Le navigateur lit le reçu serveur toutes les 2,5 secondes pendant l’attente et peut retrouver une réponse même si la requête HTTP originale est interrompue. Réponse et libération du verrou sont atomiques ; le statut est lu dans une transaction cohérente. Le traitement est borné à 220 secondes dans les deux modes pour permettre une sélection tardive de Pro ; le bail ajoute 30 secondes pour l’enregistrement. Chaque recherche web dispose au maximum de 90 secondes, dans cette même limite globale.

La question, son mode et son contexte restent sur l’appareil en cas de coupure. Après rechargement, une réponse enregistrée est retrouvée ; un traitement en cours est rejoint automatiquement. Un traitement échoué laisse un bouton de relance explicite. L’historique est paginé par 20 échanges ; les 8 derniers accompagnent génération, correction et relecture avec leurs sources. Les gros champs ne sont pas indexés. Les logs indiquent durée, modèles effectifs et étape d’échec sans contenu de conversation ni secret.

Les clés sont exclusivement dans Secret Manager/côté serveur. Les collections de conversation sont inaccessibles aux écritures et lectures Firestore directes du navigateur ; les callables contrôlent le compte et cloisonnent les conversations par UID.

## Contrôles reproductibles

- `npx vitest run` : suite métier/UI, avec tests de préconditions, erreurs, signatures Gemini, refus de relecture, contexte périmé et reprise réseau.
- `npm --prefix functions run build` : compile les fonctions et assemble les calculateurs partagés.
- `node scripts/eval-brewer.mjs` : évaluation réelle facultative, clé dans `GEMINI_API_KEY`. Douze scénarios synthétiques, dont le choix autonome de Pro sur un arbitrage complexe et la recherche suisse obligatoirement réalisée par Pro. `BREWER_EVAL_CASES` sélectionne des scénarios ; `BREWER_EVAL_MODE=deep` force Pro. Résultats privés sous `.codex-remote-attachments/`.
- `node scripts/check-brewer-persistence.mjs` : Firestore émulé uniquement (`demo-brewer-chat`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`), appels Gemini réels. Vérifie authentification, snapshot, exclusion des champs privés, concurrence, relance, historique, déduplication, export et journal inchangé.
- `node scripts/check-brewer-mobile.mjs` : Vite sur3007, Chrome local, transport de contrôle explicitement simulé. Captures390/320px et écran réduit à480px, absence de débordement, saisie et bouton accessibles. Les essais modèle/serveur sont séparés.
- `node scripts/check-brewer-shopping-mobile.mjs` : même environnement, choix de modèle, reprise d’une question en attente et cartes fournisseurs, en passant par le vrai service navigateur avec réponses réseau simulées.

Le contrôle visuel confirme que les conseils longs défilent dans la feuille, les preuves restent repliées et le champ de réponse reste accessible. Les mesures réelles et les caractéristiques provisoires du matériel restent nécessaires : le compagnon ne pilote pas la cuve.

## Références utilisées

Le traitement des appels d’outils suit la [documentation Gemini](https://ai.google.dev/gemini-api/docs/function-calling) et la conservation des [signatures de raisonnement](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures). Le format de réponse suit les [sorties structurées Gemini](https://ai.google.dev/gemini-api/docs/structured-output).

La recherche utilise [Google Search Grounding](https://ai.google.dev/gemini-api/docs/google-search). Les adaptations de stock ont été vérifiées sur les fiches [Brau- und Rauchshop](https://www.brauundrauchshop.ch/r%C3%B6stgerste), [Brewstore](https://brewstore.ch/ingredients-de-brassage-fr/pale-ale-ebc-5.5-7.5-100gr-fr/), [Sevibräu](https://www.bierbrauzubehoer.ch/produktkategorien/braumalz-flocken-malzextrakt/roestmalze/250/1kg-roestgerste-ebc-1100-1200) et [SIOS](https://www.sios.ch/Roasted-Barley-1200-EBC-ab-1-kg). La distinction Carafa / Carafa Special est documentée par [Weyermann](https://www.weyermann.de/product/weyermann-carafa-spezial-typ-2/).

Les précautions de mesure sont fondées sur [Hanna, pH de la maische](https://blog.hannainst.com/measuring-the-ph-of-mash-in-the-brewing-process/) et [l’étalonnage du pH-mètre](https://knowledge.hannainst.com/en/knowledge/generalized-calibration-ph-electrode-meter). Les familles de défauts sensoriels, qui ne suffisent pas à établir une cause unique, s’appuient sur [BJCP, Beer Faults](https://www.bjcp.org/education-training/education-resources/beer-faults/).
