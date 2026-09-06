# Compagnon de brassage

Quatre phases libres — préparation, empâtage, ébullition, refroidissement —
plus recette complète et journal. Consulter une phase ne termine aucune tâche
et ne démarre aucun minuteur.

## À la cuve

- Préparations à cocher : moulin, balance, eau, doses de houblon, pH-mètre,
  refroidisseur, fermenteur, levure, aération.
- Ingrédients prévus/réels et case à cocher **après ajout**. Boutons ± et appui
  prolongé pour sels et acides ; ajouts initialement nuls accessibles.
- Litres réseau/RO calculés avec la coupe propre à chaque eau.
- Impact des écarts directement sous la dose modifiée, avec les constantes
  chimiques du plan d'eau. Projection de tous les ajouts de la liste, même
  ceux encore à verser. Sans analyse initiale : apports des sels seuls, identifiés.
  Dépassement de style distinct du risque sensoriel ; pas de verdict automatique
  « brassin perdu ». Dilution théorique détaillée, jamais appliquée silencieusement.
- Alternatives de malt : stock restant après les autres besoins de la recette,
  famille, procédé et classe de couleur compatibles. Masse ajustée au potentiel
  si les deux fiches le renseignent, sinon approximation à poids égal annoncée.
  Le potentiel initial ne remplace jamais celui, inconnu, du nouveau malt.
  Goût et pouvoir enzymatique restent à confirmer sur les fiches.
- Journal modifiable : relevés, notes et corrections acides, suppression avec
  annulation. Export texte comprenant ingrédients réels/prévus et cases cochées.
  La recette d'origine reste intacte.

## Horloges, mesures et calculs

Paliers et whirlpool : départ à température atteinte, pause/reprise,
−5/−1/+1/+5 minutes. Aucun minuteur arbitraire pour eau, concassage,
rinçage ou refroidissement. Dates absolues conservées au rechargement.

Ébullition : « Ébullition atteinte » lance une horloge unique, « Feu coupé »
l'arrête. Changer sa durée décale les ajouts attendus (minutes avant la fin).
Les ajouts cochés gardent leur heure réelle et ne sont pas redemandés.
Ajouts simultanés regroupés. L'IBU réutilise Tinseth et le contact prolongé
des houblons déjà versés, au volume et à l'OG de la recette : l'évaporation
supplémentaire reste à mesurer.

Le rendement utilise volume et densité du même moût et les potentiels connus :

- Potentiel = PPG × kg × 2,2046226, en points-gallons.
- Extrait recueilli = (SG − 1) × 1000 × litres × 0,26417205.
- Avant ébullition : extrait recueilli moins extrait soluble direct, divisé par
  le potentiel du grain. Les sucres prévus plus tard sont exclus.
- En fermenteur : rendement global, ajouts directs compris.
- Volume ramené à 20 °C et densité corrigée/refroidie confirmés séparément.
  Potentiel manquant : pas de rendement inventé. Résultat >100 % ou relevés
  espacés de plus de 30 minutes : vérification demandée.

pH : uniquement sur mesure à l'empâtage refroidie à 20–25 °C, avec la maische
réelle et la concentration connue (lactique 80 %, phosphorique 75 %). Première
fraction = moitié de l'estimation existante, arrondie vers le bas. Après un
ajout consigné, nouvelle mesure nécessaire avant toute correction, même si
l'ancienne saisie est éditée. Aucun acide pour un pH bas ; confirmation demandée
au-dessus de 6,2. Ce modèle de tampon n'est pas une titration.

Le conseil IA reçoit mesures, doses/coches, substitutions, stocks, notes et
durées. Réponse périmée écartée, aucune modification automatique des doses.
Calculs locaux utilisables hors réseau. Aucun appel Gemini payant utilisé aux tests.

Clôture : densité du moût refroidi et volume en fermenteur, journal conservé.
Le parcours d'inventaire existant reste inchangé : consigner une différence de
quantité ne réalise pas un nouveau mouvement de stock.

## Chrome Android, navigateur fermé

Chrome a abandonné Notification Triggers ; un minuteur JavaScript ou un service
worker ne remplace pas une alarme Android native. Implémentation retenue :

1. Activation volontaire, permission et inscription FCM avec clé publique VAPID.
2. Callable autorisée aux comptes vérifiés de la brasserie ; échéances absolues
   mises en file Cloud Tasks, limitées à 64 rappels et 48 heures.
3. Nouvelle révision à chaque changement. Anciennes tâches invalidées ;
   désactivation sérialisée avec les synchronisations concurrentes.
4. Push de données, notification du service worker, vibration, lien vers le brassin.
   Un même tag évite une seconde sonnerie lors d'une relivraison.
5. Rappels trop anciens (>5 minutes) et brassins clôturés ignorés. L'interface
   affiche « Synchronisées » seulement après confirmation. Une fermeture pendant
   le court délai de regroupement envoie aussi le dernier horaire.

**Limites :** réseau, Doze, permissions et arrêt forcé de Chrome peuvent retarder
ou empêcher la notification. Son non garanti contre les réglages Android.
Pour une alarme exacte hors réseau, reporter l'heure dans Horloge. Pas de faux
lien SET_TIMER : Chrome exige une activité BROWSABLE, absente du gestionnaire
d'horloge Android de référence.

### Activation lors du déploiement

**Aucun déploiement ni changement IAM effectué dans cette refonte.**

1. Activer FCM (dont API Registration web) et Cloud Tasks dans le projet Firebase ;
   vérifier facturation et quotas nécessaires aux fonctions/files.
2. Renseigner VITE_FIREBASE_VAPID_KEY avec la clé **publique** Web Push de la console.
   Recompiler le frontend avec sa configuration Firebase habituelle.
3. Déployer syncBrewAlarms et deliverBrewAlarm en europe-west6, puis le frontend
   comprenant /brew-alerts-sw.js. Conserver AUTHORIZED_ACCOUNTS comme pour l'IA :
   liste vide = aucun accès.
4. Compte de service effectif : création de tâches sur la file, invocation de
   la fonction de livraison, envoi FCM, selon la documentation Firebase.
   Ne pas rendre la fonction de livraison publiquement invocable.
5. La collection brewAlarmDevices reste réservée au SDK serveur. Pas de règle
   cliente à ouvrir. Une politique Firestore TTL sur expiresAt peut nettoyer
   les inscriptions temporaires après 48 heures.
6. Valider sur le téléphone réel : départ court, attente de synchronisation,
   écran verrouillé/Chrome fermé, arrivée/vibration/lien, puis +5, pause,
   annulation et perte/reprise du réseau. Ce test matériel reste à effectuer
   après activation ; un navigateur de bureau ne le remplace pas.

## Code et vérification

- domain/brewCompanion : ingrédients, échéances, écarts, alternatives, rendement, IBU.
- domain/brewDay : saisies, retours locaux, reprise des anciens journaux.
- UI : BrewIngredients, BrewDayMeasurements, BrewJournal, BrewAlarmSettings.
- services/brewAlarms + public/brew-alerts-sw + functions/src/brewAlarms :
  abonnement, notification système et livraison.

Tests métier et UI : navigation parallèle, horloges, surdosage, coupes d'eau
différentes, substitutions, saisies hostiles, journal, pH et rendement,
autorisation serveur, notifications périmées, annulation concurrente.
Le banc eau/osmosée a ensuite fait l’objet d’un audit distinct, à la demande du
brasseur : voir [les sources, corrections et limites des profils](water-style-audit.md).

## Références vérifiées

- [Chrome : abandon des notifications locales programmées](https://developer.chrome.com/docs/web-platform/notification-triggers).
- [Web.dev : réception push navigateur fermé](https://web.dev/articles/push-notifications-faq?hl=en).
- [Firebase : files Cloud Tasks](https://firebase.google.com/docs/functions/task-functions).
- [Firebase : configuration FCM Web](https://firebase.google.com/docs/cloud-messaging/web/get-started).
- [Chrome : restrictions des intents Android](https://developer.chrome.com/docs/android/intents).
- [Android DeskClock : activités déclarées](https://android.googlesource.com/platform/packages/apps/DeskClock/+/refs/heads/main/AndroidManifest.xml).
- [Brewer's Friend : définition des rendements](https://www.brewersfriend.com/2009/06/27/brew-house-efficiency-defined/).
- [Bru'n Water : pH et eau](https://www.brunwater.com/water-knowledge).
- [Bru'n Water : magnésium et calcium](https://www.brunwater.com/articles/why-so-much-calcium-in-some-brewing-waters).
