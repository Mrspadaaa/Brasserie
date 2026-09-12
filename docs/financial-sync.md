# Synchronisation comptable et coût des archives

Les moteurs de trésorerie, impayés, avoirs, prix d’ingrédients, statistiques, fiscalité et contexte IA utilisent toujours un registre complet. Une année archivée ne disparaît jamais de leurs calculs.

Le premier accès sur un appareil lit `transactions` et `financialPayments` par pages de 100 lignes maximum, au même instant Firestore. Les pages ne sont publiées dans l’application que lorsque les deux collections sont complètes. Une copie atomique IndexedDB conserve le registre, sa révision, son nombre de lignes et son identité projet/utilisateur. Une interruption ne valide jamais un demi-registre.

Aux ouvertures suivantes, seul `financialSync/state` est suivi en temps réel. Les événements dérivés indiquent les chemins modifiés, sans recopier les fichiers. Le serveur relit les chemins concernés et associe chaque transaction à ses règlements au même instant de lecture, même lorsque leurs événements arrivent en décalé. Le client conserve les confirmations récentes et les écritures SDK encore hors ligne ; il ne rejoue aucune opération financière.

Les événements restent 35 jours. Un cache de plus de 30 jours, un curseur impossible ou un événement manquant impose une nouvelle copie complète. Hors ligne, un cache complet récent reste consultable et est signalé comme tel ; sans cache complet, les calculs ne s’ouvrent pas. Un stockage local refusé est signalé, car la prochaine ouverture relira le registre.

Les originaux ne sont pas retirés ni transformés par cette synchronisation. Le service de documents les conserve séparément. Les anciennes pièces contenant encore un fichier intégré restent fidèlement reprises tant que leur migration n’est pas confirmée.

Le journal d’audit suit ses 100 dernières entrées. Le bouton de consultation charge 100 événements supplémentaires ; recherche et export indiquent explicitement qu’ils portent sur les entrées chargées. Cela ne limite pas la sauvegarde serveur complète.

Déployer ensemble `syncFinancialLedger`, `recordFinancialTransactionChange`, `recordFinancialPaymentChange`, `cleanupFinancialSync` et le frontend. Autoriser uniquement la lecture brasseur de `financialSync/state` ; `financialSyncEvents`, `financialSyncSessions` et `financialSyncVersions` restent réservées au serveur et hors des collections de sauvegarde métier. Aucun champ métier ni migration source n’est nécessaire.

Vérification locale du 9 septembre 2026 : 23 tests nouveaux (cache, reprises réseau, complétude, isolation utilisateur, journal, version des triggers, suppression dans la même milliseconde et cohérence des règlements). Un vrai émulateur Firestore a aussi repris 402 lignes en 5 pages, vérifié une écriture concurrente au bootstrap, un règlement dont le deuxième trigger est retardé, la déduplication et un journal expiré. Aucun appel Gemini.
