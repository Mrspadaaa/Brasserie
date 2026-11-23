# Audit de persistance — 7 septembre 2026

## Base réelle

- 620 documents métier contrôlés, dont 10 recettes, 11 lots et 317 lignes d’audit. Les 12 reçus techniques du journal ont aussi été inspectés.
- Configuration, recette v2, copies figées et relevés présents. Aucune quantité ni mesure historique n’a été réécrite par l’audit.
- Deux anciens lots (`LOT-001`, `LOT-002`) référencent une recette absente et n’ont pas de copie figée. Leur composition passée ne peut pas être établie à partir de la base actuelle : aucune recette n’a été inventée pour les compléter.
- Deux réponses 404 de `getBrewSession` ont été observées sur Android. La création locale précédant sa confirmation serveur constituait une course possible ; le journal attend désormais l’enregistrement du lot avant de le demander au serveur.

## Corrections

- Les écritures synchrones d’une action sont regroupées dans un lot Firestore atomique : document métier, stock et audit réussissent ou échouent ensemble. Au-delà de 450 opérations, le groupe entier est refusé.
- Les écritures en attente sont distinguées des confirmations serveur, y compris après rechargement du cache IndexedDB. Les erreurs de lecture ne donnent plus accès à une collection faussement vide.
- Les modifications ordinaires d’un lot préservent le journal géré par le serveur ; vider une valeur facultative ou remplacer une structure ne laisse plus ses anciennes valeurs cachées.
- Les identifiants courts basés sur les trois derniers chiffres de l’horloge ont été retirés des raccourcis lots/clients. Les identifiants d’audit portent aussi un suffixe UUID pour éviter une collision entre appareils.
- Le lancement rapide ne fabrique plus de mesure de densité, de température d’ensemencement ni de statut de fermentation. Les objectifs restent dans la recette figée ; le volume choisi détermine les ingrédients.
- La suppression du dernier gabarit ou de la dernière idée persiste : les exemples ne réapparaissent plus à la lecture.
- L’initialisation vérifie les collections principales sur le serveur, afin de ne pas repeupler une base déjà utilisée depuis un cache vide.

## Sauvegardes et reprise

- La protection contre la suppression de la base et la récupération ponctuelle sur sept jours étaient déjà activées.
- Sauvegarde native quotidienne activée, conservation de quatorze jours. La première sauvegarde sera produite par le service selon son horaire ; l’activation ne constitue pas une première copie déjà terminée.
- L’export JSON v3 lit les 17 collections métier dans un même instantané serveur et vérifie son empreinte SHA-256 à réception. Il comprend également les idées, gabarits, registres et articles finis omis auparavant. Les pièces Drive restent sur Drive ; les secrets et reçus techniques sont couverts par les sauvegardes natives, pas par cet export métier.
- Import v2/v3 validé intégralement avant écriture, fusion par identifiant. Les documents absents du fichier et les registres déjà présents sont conservés. Les fiches métier sont restaurées dans une seule transaction (440 fiches modifiées maximum ; au-delà, utiliser la restauration native). Les registres historiques sont ajoutés par groupes reprenables, sans modifier les entrées existantes.
- Une restauration interrompue conserve son identifiant sur l’appareil. Réimporter le même fichier reprend le travail sans rejouer les changements métier déjà confirmés. La réussite n’est annoncée qu’après confirmation de tous les groupes.
- Les journaux déjà présents restent prioritaires. Un journal réintroduit depuis une sauvegarde ne programme pas de sonnerie jusqu’à une nouvelle action dans le journal.
- Une copie serveur réelle a été relue et passée dans la restauration à l’identique : **zéro fiche métier modifiée**, sept journaux conservés. Seul un reçu technique d’idempotence a été ajouté.

## Trace et optimisation

- `recordDataChange` consigne les modifications réellement observées par Firestore dans `dataHistory` : événement unique, date de commit, contexte d’auteur, champs touchés, empreintes et états avant/après. Les événements rejoués ne créent pas de doublons. Les très gros documents restent dans les sauvegardes natives (seules leurs empreintes sont conservées au-delà de 700 Ko cumulés).
- Les changements effectifs de quantité créent aussi une entrée immuable dans `movements`. Un changement d’unité n’est pas présenté comme une consommation. Ces traces commencent au déploiement ; elles ne reconstruisent pas les événements antérieurs.
- Les reçus d’opérations expirent après sept jours, les inscriptions d’alarme après 48 heures. Les règles TTL ne ciblent aucune recette, mesure ni trace métier.
  Les trois politiques sont enregistrées ; Firestore signalait encore leur activation en cours (`CREATING`) lors du contrôle après déploiement.
- Les gros champs de journal, copies de recette et instantanés d’historique ne sont plus indexés inutilement. Les recherches sur les identifiants et les champs réellement interrogés restent disponibles.
- Dépendances serveur : correctif `qs` 6.16.0 imposé pour les deux avis de déni de service. L’avis transitif `uuid` demeure dans les SDK Google ; il concerne les générateurs v3/v5/v6 avec buffer fourni, alors que les appels repérés utilisent v4. Aucune vulnérabilité élevée ou critique n’a été signalée par l’audit npm serveur. Le déclassement majeur proposé automatiquement par npm n’a pas été appliqué.

## Vérification

- 1 598 tests unitaires et d’intégration ; builds TypeScript/Vite et Functions.
- Chrome + émulateur Firestore réel : écriture atomique, refus d’un registre entraînant l’annulation du stock, conservation IndexedDB après rechargement hors ligne, reprise du réseau, attente de création du lot, préservation du journal avec effacement de champs ordinaires.
- Captures mobiles à 320 et 390 px ; absence de débordement et d’erreur JavaScript.
- Production : onze fonctions `ACTIVE`, trois routes rejetant les appels anonymes, création/modification/suppression d’une sonde technique consignées par le déclencheur réel. Sonde supprimée ; traces de contrôle conservées. HTML, JavaScript et CSS servis identiques aux fichiers construits localement.
- `scripts/check-backend-persistence.mjs` utilise exclusivement le projet d’émulation `demo-backend-audit`. Démarrer Firestore sur 8080 et Vite sur 3017 avec `VITE_FIREBASE_PROJECT_ID=demo-backend-audit`. Il réinitialise uniquement cette base d’émulation.

Références : [transactions et lots atomiques](https://firebase.google.com/docs/firestore/manage-data/transactions), [sauvegardes natives](https://firebase.google.com/docs/firestore/backups), [index et TTL](https://firebase.google.com/docs/reference/firestore/indexes).
