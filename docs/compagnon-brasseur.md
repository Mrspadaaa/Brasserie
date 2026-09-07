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

La génération utilise la chaîne Max existante (Gemini3.8Flash en premier). Une relecture indépendante utilise d’abord Gemini3.1Pro, puis2.5Pro et la chaîne Max en secours. Une réponse refusée est corrigée et relue ; un deuxième refus ou une panne de validation laisse la question récupérable. « Conseil relu » décrit cette seconde analyse IA, pas une garantie d’exactitude physique. Les modèles ont été contrôlés dans le catalogue réel de l’API et appelés pendant les essais.

Points sensibles : aucun acide pour remonter un pH, aucune dose de base improvisée, concentration exacte du flacon obligatoire pour l’estimation acide, contrôle pH de maische interdit à une autre phase, consigne différente d’une mesure, volume cible différent du volume récolté, borne de chauffe différente d’une ETA, rampe différente du maintien, stabilité de densité différente d’un barboteur calme. Une couleur ou un goût seuls ne prouvent pas une cause ni la salubrité.

## Persistance

`brewerChats` conserve chaque échange terminé, ses outils et sa relecture. `brewerContexts` déduplique les snapshots identiques par empreinte ; chaque réponse conserve la date du contexte. Les19 collections exportables incluent ces deux collections serveur, sans charger tout l’historique IA dans le cache de l’interface. La restauration est additive pour ces archives.

Un identifiant d’opération rend une relance idempotente. Un verrou transactionnel par conversation évite les demandes concurrentes, avec bail et jeton contre les réponses tardives. Un identifiant réutilisé avec un autre contenu est refusé. La question en attente et son contexte restent sur l’appareil en cas de coupure. Après rechargement, une réponse déjà enregistrée est retrouvée sans renvoi. L’historique est paginé par20 échanges ; les12 derniers accompagnent le nouveau raisonnement, les plus anciens restent consultables. Les gros champs ne sont pas indexés.

Les clés sont exclusivement dans Secret Manager/côté serveur. Les collections de conversation sont inaccessibles aux écritures et lectures Firestore directes du navigateur ; les callables contrôlent le compte et cloisonnent les conversations par UID.

## Contrôles reproductibles

- `npx vitest run` : suite métier/UI, avec tests de préconditions, erreurs, signatures Gemini, refus de relecture, contexte périmé et reprise réseau.
- `npm --prefix functions run build` : compile les fonctions et assemble les calculateurs partagés.
- `node scripts/eval-brewer.mjs` : évaluation réelle facultative, clé dans `GEMINI_API_KEY`. Dix scénarios synthétiques, dont pH-mètre, pH bas,1000W, fermentation, métallique, herbeux, couleur, osmosée, houblon et instruction malveillante. Résultats privés sous `.codex-remote-attachments/`.
- `node scripts/check-brewer-persistence.mjs` : Firestore émulé uniquement (`demo-brewer-chat`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`), appels Gemini réels. Vérifie authentification, snapshot, exclusion des champs privés, concurrence, relance, historique, déduplication, export et journal inchangé.
- `node scripts/check-brewer-mobile.mjs` : Vite sur3007, Chrome local, transport de contrôle explicitement simulé. Captures390/320px et écran réduit à480px, absence de débordement, saisie et bouton accessibles. Les essais modèle/serveur sont séparés.

Le contrôle visuel confirme que les conseils longs défilent dans la feuille, les preuves restent repliées et le champ de réponse reste accessible. Les mesures réelles et les caractéristiques provisoires du matériel restent nécessaires : le compagnon ne pilote pas la cuve.

## Références utilisées

Le traitement des appels d’outils suit la [documentation Gemini](https://ai.google.dev/gemini-api/docs/function-calling) et la conservation des [signatures de raisonnement](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures). Le format de réponse suit les [sorties structurées Gemini](https://ai.google.dev/gemini-api/docs/structured-output).

Les précautions de mesure sont fondées sur [Hanna, pH de la maische](https://blog.hannainst.com/measuring-the-ph-of-mash-in-the-brewing-process/) et [l’étalonnage du pH-mètre](https://knowledge.hannainst.com/en/knowledge/generalized-calibration-ph-electrode-meter). Les familles de défauts sensoriels, qui ne suffisent pas à établir une cause unique, s’appuient sur [BJCP, Beer Faults](https://www.bjcp.org/education-training/education-resources/beer-faults/).
