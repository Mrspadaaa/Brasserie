# Budget mensuel Gemini

Le panneau **Limites IA** propose 5, 10 ou 20 CHF, ou un montant de 0 à 100 CHF. Aucun montant n’est activé implicitement. Tant qu’il n’est pas enregistré, les nouveaux appels sont refusés ; la saisie manuelle et les lectures déjà en cache restent disponibles. Modifier le budget ne réactive pas une IA suspendue et ne remet pas les dépenses à zéro.

Le budget porte sur **l’usage estimé de tous les appels Gemini de cette application** : compagnon, lecture et relecture des factures, autres tâches et chaque tentative de modèle de repli. Il ne plafonne pas la facture Google Cloud : Firestore, Drive, réseau, Functions, taxes, taux de change et appels effectués ailleurs sont distincts.

## Calcul et protection

- Montants entiers en micro-CHF, mois civil `Europe/Zurich`.
- Tarifs de provision issus de la [table officielle Gemini](https://ai.google.dev/gemini-api/docs/pricing), vérifiés le 9 septembre 2026. Les modèles Flash 3.6/3.7/3.8 utilisent déjà les tarifs standard annoncés pour janvier 2027 ; aucune promotion ou gratuité n’est supposée. Conversion de provision volontairement prudente : 1 USD = 1,25 CHF, sans prétendre être un cours de change.
- Chaque appel réserve son entrée et sa sortie avant le réseau, dans une transaction Firestore commune à tous les appels concurrents. Les réponses comptent aussi les tokens de réflexion. Les médias réservent le contexte maximum du modèle, car leur taille compressée ne borne pas leur tokenisation. Une seule réponse et une sortie maximale explicite sont imposées.
- Le repli Flash Lite 3.1 distingue les entrées audio (0,50 USD par million de tokens) des entrées texte/image/vidéo seules (0,25 USD). En présence d’audio, de vidéo pouvant contenir de l’audio ou d’un fichier sans type connu, l’application réserve et règle toute l’entrée au tarif audio supérieur. Ce choix conserve une marge prudente sur les contenus mixtes.
- Le règlement reprend les métadonnées du fournisseur aux tarifs de provision. La marge non utilisée est libérée. Une réponse sans métadonnées complètes, un délai dépassé, un incident réseau ou une confirmation Firestore perdue conserve la réserve. Un refus certain avant génération peut la libérer ; aucune nouvelle génération n’est déclenchée pour réconcilier le registre.
- Le 1er du mois renouvelle l’enveloppe ; les appels commencés auparavant restent imputés à leur mois d’origine. Les réservations incertaines ne sont jamais effacées automatiquement pour autoriser d’autres dépenses.
- Les quotas quotidiens et par question préexistants restent appliqués. Les autres tâches partagent désormais aussi le quota quotidien. La pause est vérifiée avant chaque réservation.

Un tarif ancien déclenche un conseil de révision après 30 jours, sans coupure imposant une maintenance mensuelle au brasseur. Un modèle inconnu et toute option dont le coût n’est pas couvert sont refusés. Les prix peuvent évoluer chez Google : ce mécanisme est un plafond d’usage estimé, pas un plafond garanti de facturation.

## Recherche web

La recherche Google Search de Gemini est activée et comprise dans l’enveloppe mensuelle choisie. L’enveloppe demandée pour cette brasserie est **20 CHF par mois**, recherche comprise ; l’application conserve ce choix dans le panneau Limites IA et ne remet pas les dépenses à zéro lors d’un changement.

Pour les modèles Gemini 3 utilisés ici, Google facture **chaque requête de recherche unique non vide**, et plusieurs peuvent être exécutées dans un seul appel Gemini. Le tarif vérifié est de 14 USD pour 1 000 requêtes. La provision ignore volontairement le quota gratuit partagé du projet et compte **0,0175 CHF par requête** après la conversion prudente. [Règles officielles de recherche](https://ai.google.dev/gemini-api/docs/google-search#pricing), [tarifs Gemini](https://ai.google.dev/gemini-api/docs/pricing).

Avant chaque appel avec recherche, le registre réserve **20 requêtes, soit 0,35 CHF, en plus des tokens**. Ce nombre est une marge de provision, jamais une limite technique imposée à Google. Un achat mobilise trois chercheurs Flash en parallèle. Une recherche complémentaire ciblée peut être demandée pendant la correction, dans la limite totale de **six tentatives avec recherche par question**, replis compris. Les relecteurs travaillent sur les preuves existantes, sans outil Google Search. Les réservations parallèles partagent le même registre atomique ; elles ne peuvent pas chacune consommer la même enveloppe restante.

Rapide et Auto utilisent exclusivement Flash : pas de promotion automatique à Gemini 3.1 Pro, même en cas de désaccord ou de réparation. Les achats, recherches documentaires, finances, propositions de champs et gestes sensibles reçoivent deux relectures Flash parallèles, avec au maximum deux corrections si nécessaire. Pro demeure un choix explicite via Approfondi. Cette latitude supplémentaire ne change pas les **20 CHF mensuels** acceptés.

Au retour, l’application déduplique les requêtes non vides de `candidates[0].groundingMetadata.webSearchQueries` et règle leur coût ainsi que les tokens consommés. Une liste explicitement vide indique zéro recherche ; des métadonnées absentes ou malformées conservent toute la réserve. Le registre conserve les nombres et coûts, **pas le texte des recherches**, qui pourrait contenir du contexte privé. [Schéma des métadonnées](https://ai.google.dev/api/generate-content#GroundingMetadata).

Le [schéma GoogleSearch](https://ai.google.dev/api/generate-content#GoogleSearch) ne fournit pas de plafond pour les recherches internes. Si Google en exécute plus que la provision, leur coût observé est compté intégralement ; les appels suivants s’arrêtent si l’enveloppe restante ne permet plus de réserver leur coût. Les appels déjà en cours ne peuvent pas être annulés rétroactivement. Ce suivi protège **le budget estimé de l’application** et ne garantit donc pas un plafond exact de facturation Google.

## Vision des dépenses

Les factures, tickets, photos JPG/PNG/WebP et PDF acceptés (4 Mo, 4 pages maximum) sont lus par **Gemini 3.8 Flash**, avec une résolution visuelle haute. Deux transcriptions complètes sont lancées en parallèle. Un troisième contrôle indépendant peut résoudre une divergence ou une ambiguïté, dans la limite de trois appels par justificatif ; il ne reçoit pas les montants proposés par les deux premiers lecteurs. Une majorité de deux lectures peut corriger les champs proposés. Les divergences persistantes, chiffres absents et incohérences restent signalés, sans reconstituer des montants imprimés.

Chaque lecture dispose de 45 secondes, dans un délai commun de 100 secondes. Cette voie n'utilise ni Pro, ni recherche web, ni chaîne de repli. Son registre `invoice-v3` réutilise un résultat terminé pour le même fichier et le même utilisateur, sans nouvel appel. Un échec fournisseur ne provoque pas de nouvelles tentatives automatiques.

Les deux lectures partagent les plafonds quotidiens et le budget mensuel de 20 CHF. Comme les autres médias, elles conservent une provision prudente du contexte maximal : environ 2,01 CHF temporairement réservés par lecture avec la sortie maximale, puis régularisés à l'usage communiqué par Gemini. Cette provision peut empêcher une nouvelle double lecture lorsque le solde disponible est inférieur à environ 4,02 CHF ; elle ne représente pas le prix normal d'une facture. Le cache et la saisie manuelle restent disponibles.

L'écran présente la vérification, les corrections proposées et les points à confirmer. Le brasseur valide avant l'enregistrement. Le fichier original est enregistré dans son Drive privé à ce moment-là ; Firestore conserve les métadonnées et le résultat structuré de lecture, pas le fichier binaire. Le préclassement ne crée pas automatiquement de stock ni de matériel. Le [test réel dédié](expense-vision-evaluation.md) reste distinct des tests unitaires.

## Données et vérification

`brewerAiControls/current.monthlyLimitMicroChf` conserve le choix. `brewerAiCosts/{YYYY-MM}` cumule les provisions réglées et réservées ; sa sous-collection `calls` garde uniquement les références, modèle, nombre de tokens, recherches provisionnées et observées, leurs coûts et un indicateur de dépassement de réserve, jamais les prompts, requêtes, factures ou secrets. Ces registres sont privés au serveur.

Tests sans réseau : réservations concurrentes sur la dernière place, frontières des mois suisses, paliers Pro, sortie et réflexion, métadonnées absentes, panne de règlement, rejet certain, partage compagnon/facture, facture reprenable après configuration du budget, chaque repli des autres tâches et validation explicite du formulaire. Pour Search : réservations concurrentes, doublons et requêtes vides, métadonnées ambiguës, dépassement de provision et refus du prochain appel. Ces tests unitaires ne contactent jamais Gemini. Les tests réels autorisés restent séparés et limités en appels et en provision.
