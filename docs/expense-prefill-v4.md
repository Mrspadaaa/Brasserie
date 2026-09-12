# Saisie quotidienne et vision v4

La photo ou le PDF lance automatiquement deux lectures Flash indépendantes. Une troisième lecture n'est achetée qu'en cas de divergence utile à résoudre. L'accord des lecteurs ne constitue pas une garantie de justesse : les valeurs manquantes, ambiguïtés et corrections restent signalées près des champs.

Le type de pièce distingue facture, ticket, bordereau de livraison, devis et avoir. La date imprimée prime sur une date affichée par le téléphone. Les références de commande ne deviennent pas des numéros de facture. Références d'article, tailles et variantes sont transcrites ; les articles sans rapport avec la brasserie restent classés « Autre » sans créer de matériel ni de stock.

Si le total TTC n'est pas imprimé, un détail complet en CHF peut fournir une somme proposée. Le total source reste absent ; le champ prérempli est accompagné d'une alerte. Les totaux imprimés divergents sont conservés et signalés. Aucun taux de change ni montant de TVA n'est inventé.

Les achats ordinaires sont proposés payés à la date de l'achat, sauf indication explicite contraire, devis, avoir ou paiement futur. Cette valeur par défaut est une préférence de saisie, distincte d'une preuve de paiement lue dans la pièce. Changer la date déplace le paiement avec elle, sauf si l'utilisateur a choisi une autre date de paiement. Les raccourcis Hier/Aujourd'hui/Demain et le changement de mois conservent une date exacte ; le jour est limité au dernier jour du mois si nécessaire.

La confirmation reste explicite. Un avoir ne peut pas être enregistré comme nouvelle dépense. Les contrôles de doublon, le rangement privé de l'original sur Drive avant l'écriture comptable et la reprise après coupure restent en place. Le brouillon et les résultats de lecture survivent à une reconnexion Drive sans nouvel appel IA.

## Vérification du 9 septembre 2026

- 154 tests locaux ciblant la vision, les montants, les dates, la conservation des métadonnées, l'enregistrement et la connexion Drive. Les fixtures de ces tests sont synthétiques et ne font aucun appel Gemini.
- Essai d'intégration réel, volontaire et distinct des tests : une photo fournie par l'utilisateur, deux appels `gemini-3.8-flash`, 5 187 jetons déclarés, 3,798 secondes pour le pipeline, coût estimé par l'application à 0,019311 CHF.
- Le type de document, sa date, les trois articles, leurs montants, tailles, références, la devise et l'absence de total final ont été reconnus. Le total manquant reste explicitement à confirmer. Le cache renvoie le même résultat sans génération supplémentaire.
- Les réservations partagées quotidiennes et mensuelles ont été vérifiées avant les appels. Aucune transaction, aucun mouvement de stock ni original Drive n'a été créé pendant cet essai.
- Interface vérifiée dans un navigateur isolé à 360 × 800, 390 × 844 et 1 024 × 900 pixels : somme proposée lisible, libellé concis, maintien du jour et suivi du paiement au changement de mois, aucun débordement horizontal ni erreur console. Le résultat réel a été rejoué localement sans nouvel appel fournisseur.
- Photo et résultats détaillés conservés uniquement dans le dossier local ignoré des pièces jointes ; ils ne font pas partie des fixtures ni du build public. Le test utilise le pipeline compilé avec Gemini et les registres de budget Firestore réels ; il ne valide pas le consentement Google du navigateur, actuellement bloqué par `origin_mismatch`.

Le schéma de scan et la clé du cache passent à `invoice-v4`. Les métadonnées source ajoutées aux dépenses sont facultatives : les anciennes écritures restent lisibles sans migration.

La fonction `aiTask` a été publiée à Zurich, puis le frontend sur Firebase Hosting. Le chargement HTTP du bundle publié `/assets/index-8zPXy4bd.js` a été confirmé. La configuration OAuth Google demeure en attente d'une session interactive dans la console, comme décrit dans `drive-connexion.md`.
