# Graphiques aromatiques et diagnostics NOLO — 9 septembre 2026

## Corrections

- La seconde extraction demande immédiatement le volume et la densité du moût récupéré. Les ingrédients du brassin neuf ne deviennent pas des mesures des drêches. Une densité et un volume permettent un plafond physique ; ils ne rendent pas automatiquement applicable la régression LA-01 sur moût neuf.
- Le radar relie uniquement les valeurs centrales fournies par le moteur lorsque leurs plages ne traversent pas toutes les classes sensorielles existantes. Les axes inconnus restent des interruptions. Sans point exploitable, aucun profil n'est dessiné.
- Les plages se lisent dans des barres à deux bornes, avec incertitude large en gris. Une comparaison volontaire conserve aussi les plages larges ; aucune borne maximale ne devient une intensité centrale.
- La jauge NOLO affiche zéro, la cible et le maximum de l'échelle. L'intervalle conserve sa largeur réelle, sans largeur minimale artificielle. L'arrondi vers l'extérieur préserve les franchissements de cible et les décimaux exacts.
- Les formules, coefficients, versions scientifiques et données enregistrées ne changent pas.

## Vérifications

La livraison a été contrôlée dans un assemblage isolé préservant les changements déjà publiés des autres domaines. Les modifications mobiles encore en cours dans le répertoire partagé sont restées hors de cet assemblage. La comparaison des bundles a permis de retrouver un changement partagé du plafond du compagnon ; les autres écarts de reconstruction provenaient des fins de ligne et noms minifiés.

- Suite combinée : 3 052 tests réussis et un dépassement de délai dans le fuzz de saisie de l'eau pendant les compilations. Les 11 tests de ce fichier repassent séparément, assertions intactes ; le cas concerné termine en 17,4 s au lieu de dépasser 30 s sous charge.
- Régressions finales ciblées : 27 tests réussis (graphes, conservation d'une variante, diagnostic NOLO, inconnue contre zéro et arrondis).
- Parcours navigateur sur les composants réels compilés, adaptateurs de test isolés : création, simulation, quatre combinaisons des cases, COA partiel, persistance, rechargement, consultation, comparaison, annulation et navigation.
- Deux pilotes fournis uniquement à l'exécution locale : huit procédés, données manquantes de seconde extraction, saisie des mesures, retour au procédé initial, résultats avant/après traitement et fidélité aux sorties brutes.
- Largeurs 320, 390 et 1 280 px : captures inspectées, absence de débordement et d'erreur console. Banc synthétique à douze axes : douze points, aucune collision ni étiquette hors cadre. Ce banc ne constitue pas une validation scientifique des intensités.
- Vingt ajouts : 12,7 à 13,5 ms dans le parcours houblon sur la machine de contrôle. Zéro requête distante et zéro écriture pendant les simulations après chargement des références.

Les captures, copies temporaires des recettes et résultats bruts restent hors du dépôt public et du bundle de production. Aucun appel Gemini payant n'est utilisé. Ces vérifications établissent la fidélité de l'affichage ; elles n'ajoutent pas de précision scientifique au modèle aromatique.
