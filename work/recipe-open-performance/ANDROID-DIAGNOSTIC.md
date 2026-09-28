# Mesurer dans le navigateur réellement utilisé

Le correctif n'est pas publié par cette mission. Le script `scripts/recipe-open-diagnostic.js` peut déjà fonctionner sur la version déployée, sans modifier son application, OAuth, Firebase, ses règles ou ses Functions. Il refuse de démarrer sur l'écran de connexion. Aucun SDK, aucune lecture de stockage/cookies, aucune transmission automatique.

## Maintenant, sans publication

1. Sur Chrome PC normalement authentifié, ouvrir DevTools → Console. Copier le contenu du script local, puis l'exécuter volontairement après connexion et affichage de Recettes. Ne pas importer de cookies/tokens entre profils. L'onglet du navigateur intégré de Codex est un autre profil.
2. Pour mesurer **Chrome exécuté sur Android**, utiliser les DevTools distants déjà associés au téléphone, par USB ou Wi-Fi selon votre association. Le téléphone conserve sa connexion OAuth normale. Dans `chrome://inspect/#devices`, choisir l'onglet L'Affinée sous le modèle du téléphone, puis exécuter ce même script dans sa Console. Désactiver Screencast pendant le relevé : il affecte la cadence des images, selon la [documentation officielle Chrome](https://developer.chrome.com/docs/devtools/remote-debugging/#screencast-your-android-screen-to-your-development-machine). Une émulation mobile sur le PC ne remplace pas cette étape.
3. Cliquer **Démarrer**. Indiquer « Premier passage » seulement pour la première ouverture de cette session, puis « Réouverture à chaud ». Ne pas effacer les données du site ou le cache Firestore pour fabriquer un état froid.
4. Depuis la liste : ouvrir une fiche, attendre son contenu et toucher **Contenu utilisable** quand elle permet réellement de comprendre et agir. Replier/déplier un détail, revenir, rouvrir. Puis toucher Modifier, attendre l'éditeur et son champ de nom, donner le focus à ce champ **sans modifier ni enregistrer**, revenir et rouvrir. Distinguer « Détails et actions » de la fiche complète. Répéter quelques fois dans la même session et connexion.
5. **Exporter JSON** télécharge `laffinee-recettes-performances.json` sur cet appareil. Fermer le panneau retire les observateurs et listeners ; recharger la page retire aussi l'instrumentation. Le JSON peut être conservé localement et examiné avant toute transmission volontaire.

L'entrée en édition écrit éventuellement un brouillon **local** après normalisation ; elle ne sauvegarde pas la recette serveur. Les effets et compteurs d'écriture de ce parcours sont contrôlés dans le banc QA. Ne déclencher ni Compléter/Rechercher/IA, ni sauvegarde, création, suppression, brassage ou stock en production pour ces mesures.

## Données exportées et limites

Le JSON contient uniquement types d'action, timings, longues tâches, tailles/durées de ressources classées sans URL, version Chrome/plateforme, viewport, état en ligne/service worker et empreintes des modules publics. Ni noms de recettes/ingrédients, ni texte/champ saisi, ni ID métier, ni URL de backend/requête, ni token/cookie/contenu du stockage. Aucun profil CPU détaillé n'est généré : la timeline/CPU de DevTools sur le téléphone complète ce diagnostic si nécessaire.

La mesure automatique attend les commandes et le contenu attendus puis deux images ; le repère humain indique l'utilisabilité constatée. Ce n'est pas une mesure INP standard ni une garantie que toute section secondaire a fini de charger. « Premier passage » décrit la session, sans prouver l'absence de cache HTTP/disque. Une absence de ressource nouvelle n'exclut pas une activité Firestore déjà ouverte ; le diagnostic n'intercepte pas les requêtes ou leurs contenus.

Pour un tap/clic, le début préfère le `pointerdown` récent ; pour la première saisie, le `keydown` récent. `startSource` précise le point réellement observé. Le retour natif du navigateur est mesuré depuis `popstate`, pas depuis le geste de bord d'écran inaccessible au document. Le retour par le bouton Fermer dispose du début du tap/clic. Les méthodes doivent rester identiques entre deux exports.

## Après publication autorisée séparément

Refaire exactement le même parcours, sur le même PC/téléphone, même recette réelle, même connexion et mêmes modes de cache déclarés. Comparer les exports et les empreintes des modules servis ; conserver aussi la date du déploiement. La vérification du correctif sur Android et sur le catalogue authentifié reste ouverte jusqu'à ces mesures.

Les [mesures en laboratoire et chez l'utilisateur](https://web.dev/articles/lab-and-field-data-differences) répondent à des questions différentes. Le laboratoire isole une cause et permet de vérifier un correctif ; il ne démontre pas que les délais ressentis sur ce téléphone sont résolus.

## État au relais du 27 septembre

L'association Wi-Fi officielle du Xiaomi 13T Pro et Inspect ont permis un premier relevé utilisateur. Trace reçue dans Downloads, qualifiée par le pilote : environ 2018 ms jusqu'à la première capture de fiche complète, puis 680 ms jusqu'à l'éditeur, sur la version déployée d'origine. Ce relevé unique ne prouve pas une médiane, le cache froid/chaud ou input-ready, et n'est pas un après du correctif local. Trace/screenshots/analyse restent hors Git car données réelles.

Le Chrome PC browser2/tab1005985658 a été finalement confirmé par utilisateur. Son onglet reste rattaché au fil pilote ; l'outil de ce fil n'a pas exécuté de nouveau parcours. Il n'autorise pas les pages internes `chrome://` : aucun accès shell/ADB/CDP de substitution ne contourne ce refus. La comparaison après correction doit conserver version, appareil, données, cache déclaré et repère d'utilisabilité.
