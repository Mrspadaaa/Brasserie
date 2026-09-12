# Équipe Flash élargie — 9 septembre 2026

À la demande du brasseur, Flash dispose de davantage de latitude, en privilégiant le travail parallèle :

- Trois chercheurs pour les achats ; jusqu’à six tentatives de recherche par question si une seconde vague ou un repli est utile.
- Deux relecteurs indépendants et parallèles pour les achats, références documentaires, finances, propositions de champs et situations sensibles. Les questions simples gardent une seule relecture.
- Deux corrections Flash possibles après désaccord ; une seule en mode Approfondi. Pro 3.1 exige toujours le choix explicite de ce mode.
- Jusqu’à 24 appels par question. Chaque appel reste soumis au budget mensuel de 20 CHF. Les plafonds sont des maxima, jamais un objectif à remplir.
- Délai partagé entre les replis : 45 secondes par analyse/recherche Flash, 30 secondes par relecture Flash. Une tentative suivante ne recommence pas le délai. Le délai global existant reste prioritaire.

## Essai réel

Un achat synthétique de Cascade en pellets de 100 g a été testé, sans écriture de stock ou de recette, avec trois chercheurs et deux relecteurs aux rôles distincts.

| Mesure | Résultat |
| --- | --- |
| Modèle | Gemini 3.8 Flash exclusivement |
| Appels | 7, dont 3 recherches et 2 relectures |
| Durée totale | 15,281 secondes |
| Tokens déclarés | 31 283 |
| Requêtes Google déclarées | 4 |
| Coût estimé comptabilisé | 0,135162 CHF |
| Réserve restante pour cet essai | 0 CHF |

Les deux fiches affichées concernaient bien Cascade : SIOS en 100 g et Brewstore par 10 g, présentées comme des formats différents. Les deux relecteurs ont approuvé. L’inspection humaine a ensuite conduit à préciser qu’une unité de commande au poids ne prouve pas un sachet individuel ; cette consigne supplémentaire a été vérifiée localement, sans nouveau test payant.

Le test réel était limité à 10 tentatives, 3 recherches, 32 000 sorties réservées, 120 secondes et 1,50 CHF de provision. Le coût est une estimation conservatrice de l’application, pas une facture Google. Les résultats de durée et de coût décrivent cet essai, sans garantir ceux des questions futures.

Rapport distinct : `.codex-remote-attachments/brewer-flash-expanded-eval/report.json`. Le rapport précédent reste intact. Les deux essais successifs totalisent 0,301795 CHF estimé.

## Vérifications locales

2 905 tests validés : suite complète puis nouveau passage des deux fichiers dont les anciennes fixtures ne prévoyaient qu’un relecteur. Le test finance vérifie désormais les preuves transmises à chacun des deux relecteurs. Tests complémentaires sur les appels concurrents, les deux vagues de recherche, la réutilisation du cache, les corrections et les délais partagés. Aucun appel Gemini dans la suite normale.

Compilation frontend et Functions réussie. Les mécanismes de sélection des vraies fiches, des conditionnements et des URL restent appliqués. Voir [la politique du budget](gemini-budget.md) et [l’évaluation initiale des liens](brewer-shopping-evaluation.md).
