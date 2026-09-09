# Contrôle du calcul jusqu’à l’écran

## Banc et isolation

`npm run test:smoke:hop` compile la vraie application et ses composants avec les adaptateurs de données de `tests/qa/hop-recipe`. Le résultat reste dans `%TEMP%/laffinee-hop-qa-build`, séparé de `dist`. Le serveur écoute uniquement sur la boucle locale. Les requêtes distantes sont bloquées et comptées ; aucune Cloud Function, Firestore réel ou tâche Gemini n’est appelée. Les sauvegardes utilisent le vrai StorageService, relié au dépôt de test persistant entre rechargements.

Le build livré conserve son authentification normale. `check-no-dev-auth.mjs` rejette les marqueurs du banc dans le vrai bundle ; `check-private-research.mjs` vérifie également la séparation des documents privés. Le banc n’est ni une route ni un mode d’accès de l’application déployée. Son répertoire de sortie est contrôlé avant tout nettoyage récursif.

## Parcours exécutés

À 320, 390 et 1280 px, Chrome exécute création, autocomplétion Cascade, modification puis rétablissement du contact, choix SafAle US-05, association explicite d’une référence et d’un COA partiel, les quatre combinaisons des cases, conservation de la prédiction, erreur de confirmation puis reprise idempotente, sauvegarde, rechargement, consultation et variante sans modification de l’original.

Le COA synthétique déclare des pellets T90 et seulement 6–7 % d’alpha. Pour 48 g, l’écran et le moteur doivent donner 2 880–3 360 mg introduits. Les huiles absentes du COA gardent la provenance Hopsteiner ; la forme non précisée de cette référence interdit de transformer son repli documentaire en quantité certaine. Les tests de domaine couvrent séparément le repli quantitatif quand les formes et bases sont compatibles.

Le vrai Worker est utilisé pour une recherche ciblée, une interruption explicite, un changement de contrainte et une navigation pendant une recherche exhaustive. Le contrôle vérifie la terminaison du Worker, la disparition des anciens résultats et l’absence d’écriture ou d’appel distant. La simulation du programme ne lance aucun Worker de recherche.

Le cas Lafontaine vérifie les plages et leur position radiale, les bornes arrondies vers l’extérieur, les unités, les confiances et un axe documenté hors objectif. Les barres chimiques sont comparées aux quantités brutes, dans leurs unités respectives. Aucune valeur inconnue ne produit une barre d’intensité nulle ; une plage pleine ne donne pas de tendance centrale. Deux fixtures explicitement synthétiques vérifient l’affichage des confiances moyenne et élevée : elles ne servent pas à requalifier la confiance scientifique de Lafontaine.

Le contrôle clavier vérifie l’ordre des deux cases. Toutes les pages sont contrôlées pour les débordements horizontaux, erreurs de console et de chargement. Les captures de vue compacte, profil complet, cumul, chimie, détails et lecture seule font l’objet d’une inspection réelle, consignée dans `hop-recipe-visual-review.md`.

## Mesures sur la machine de contrôle

Série du 9 septembre 2026, Chrome headless, après chargement des références :

| Largeur | Mise à jour de vingt ajouts, jusqu’à deux frames | Recherche ciblée du banc | Navigation pendant la recherche |
|---|---:|---:|---:|
| 320 px | 15,6 ms | 132 ms | 31 ms |
| 390 px | 16,4 ms | 121 ms | 32 ms |
| 1280 px | 18,2 ms | 120 ms | 29 ms |

Les simulations et les deux cases provoquent **zéro requête et zéro écriture** après chargement. Aucun appel distant ni erreur de console n’a été observé pendant le parcours. L’objectif de mise à jour inférieur à 500 ms est satisfait sur cette machine ; il ne garantit pas le même temps sur tous les téléphones. Les mesures de recherche concernent le catalogue et les souches sélectionnées du banc, pas l’exploration exhaustive de toutes les levures.

La mesure séparée du moteur avec le catalogue complet (768 variétés, 1 734 levures, 1 775 connaissances, vingt ajouts et treize axes) donne 42,9 ms à froid, une médiane de 20,7 ms et un p95 de 24,0 ms. Le résultat du compagnon passe de 3,68 Mo à 124 ko grâce aux dictionnaires réversibles de sources et d’explications ; aucun résultat ni provenance n’est supprimé.

## Limites des contrôles

Les adaptateurs ne démontrent pas une écriture réelle dans Firestore : les tests d’intégration contrôlent le contrat et le rejeu, le navigateur contrôle confirmation, erreur et reprise. La validation du build déployé vérifie séparément les assets et les accès anonymes. Les captures couvrent Chrome ; Safari et Firefox ne sont pas certifiés par cette série. Une enveloppe expérimentale cohérente et correctement affichée ne remplace pas une validation sensorielle externe.

Les preuves locales reproductibles sont dans `%TEMP%/laffinee-hop-qa-evidence` : `report.json`, captures PNG et diagnostic d’échec éventuel. Elles ne sont pas publiées dans l’hébergement de l’application.
