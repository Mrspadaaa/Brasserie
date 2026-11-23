# Justificatifs et conservation à long terme

Les nouveaux achats, ventes, factures client et pièces fiscales conservent leurs PDF ou images dans le Drive privé du compte Google connecté. L’application utilise la portée `drive.file` déjà demandée à la connexion ; elle ne crée aucun partage public. Les originaux sont classés dans **L’Affinée / Justificatifs / année**. Le quota de stockage du compte Drive s’applique.

Firestore conserve les données comptables et une petite fiche `financeDocuments` : identifiant Drive, nom, format, nombre d’octets, empreinte SHA-256 et date. Aucun binaire n’est ajouté aux nouvelles écritures. Un fichier ne peut pas dépasser 4 MiB. L’original est envoyé et vérifié avant la confirmation de l’écriture et de son éventuel paiement. Les reprises conservent les identifiants et ne doublent pas les règlements. Le jeton temporaire Google reste en mémoire et se renouvelle automatiquement grâce à une autorisation chiffrée côté serveur. Un premier consentement ou une révocation nécessite un clic. Voir [la connexion persistante](drive-connexion.md).

## Reprise des anciens fichiers

Dans **Réglages → Sauvegardes → Déplacer les anciens justificatifs**, l’application parcourt les anciennes pièces par pages, une seule fois par passe. Elle copie chaque original dans Drive, puis le serveur relit les octets Drive et compare leur empreinte au fichier encore conservé dans Firestore. La référence est modifiée et les anciens blocs retirés dans la même transaction. Une modification concurrente, un fichier différent, une coupure ou un quota plein conserve l’ancien original et permet de reprendre.

Les documents fiscalement figés gardent leurs identifiants et leurs références. Les anciennes quittances avec PDF incorporé sont aussi reprises. Les liens externes ajoutés manuellement restent des liens : leur contenu doit être joint séparément si l’on veut l’inclure dans les archives.

La migration nécessite une connexion Drive du brasseur. Le déploiement seul ne déplace pas ses fichiers. Les anciens événements d’historique et les copies gérées/PITR ne sont pas purgés ; une baisse du stockage n’est donc pas nécessairement immédiate. Les nouveaux événements d’historique ne dupliquent plus les binaires.

## Sauvegardes réellement indépendantes

Les exports ZIP globaux récupèrent les octets Drive, les vérifient, puis les incluent dans les volumes avec la comptabilité. Ils restent lisibles sans Drive. La pagination et des volumes d’environ 32 MiB limitent la mémoire requise sur mobile. Il faut conserver tous les volumes d’une même sauvegarde, sur un autre support.

À la restauration, le navigateur vérifie les originaux contre les ZIP sélectionnés puis les renvoie dans Drive ; le serveur les relit avant de publier leurs références. Un fichier Drive perdu peut ainsi être recréé avec un nouvel identifiant et une référence réparée. Les originaux ne sont pas réinjectés durablement comme blocs Firestore. Le staging temporaire de restauration est nettoyé après sept jours.

Le dossier fiscal annuel contient également les PDF/images, les comptes et un index SHA-256. Si Drive est déconnecté, le téléchargement s’arrête pour permettre une reconnexion. Un original réellement manquant figure explicitement dans l’index ; l’application ne certifie pas un dossier incomplet.

## Chargement des comptes et coûts

Le registre comptable léger reste complet, car les impayés, avoirs, soldes et prévisions dépendent aussi des exercices anciens. Une première ouverture le charge par pages à un instant cohérent et le conserve dans un cache IndexedDB isolé par projet et compte. Les ouvertures suivantes synchronisent seulement les modifications. Un cache trop ancien ou un journal incomplet déclenche une reconstruction. Les pièces originales se chargent seulement lorsqu’on les ouvre ou les exporte. Le journal d’audit affiche 100 entrées puis charge les précédentes sur demande.

Les archives par année masquent les anciennes opérations dans les vues quotidiennes ; elles ne suppriment pas leur valeur comptable. Les nouvelles collections de synchronisation et de budget sont privées au serveur, sauf le petit indicateur de révision lisible par l’utilisateur autorisé.

Le budget Gemini commun est décrit dans [gemini-budget.md](gemini-budget.md). Le budget mensuel choisi pour cette installation est de **20 CHF**, recherche web comprise. Il plafonne une estimation de l’usage Gemini de l’app, pas la facture globale Google Cloud.
