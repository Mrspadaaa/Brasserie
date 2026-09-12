# Recherche et achats avec Flash — 9 septembre 2026

Budget choisi et enregistré : **20 CHF par mois**, partagé par les tâches IA. Auto et Rapide utilisent Flash pour l’analyse, les recherches, la synthèse, la relecture indépendante et une correction éventuelle. Approfondi conserve Pro uniquement sur sélection explicite ; ses recherches utilisent aussi Flash.

Un achat mobilise deux chercheurs Flash en parallèle, une lecture HTTP des fiches produit puis une synthèse et une relecture. Deux appels Google Search maximum par question, replis compris. Un échec récupérable peut laisser une couverture partielle ; les erreurs de budget, d’accès et l’annulation arrêtent le traitement.

## Essai réel limité

Scénario synthétique : acheter du Cascade en pellets, sachet de 100 g, en Suisse. Aucun client, facture, mouvement de stock ou recette réelle transmis ou modifié.

| Mesure | Résultat |
| --- | --- |
| Modèle | Gemini 3.8 Flash, exclusivement |
| Appels réels | 5 : analyse, 2 recherches parallèles, synthèse, relecture |
| Durée | 18,052 secondes |
| Tokens déclarés | 27 874 |
| Requêtes Google déclarées | 6 au total |
| Coût estimé comptabilisé | 0,166633 CHF, recherches comprises |
| Réserve non réglée | 0 CHF |

L’évaluation limitait les tentatives à 6, les appels avec recherche à 2, les sorties réservées à 20 000 tokens et la provision à 1 CHF. Cette provision est une estimation conservatrice de l’application, pas une garantie de facture Google : le nombre de recherches internes n’est pas bornable côté client. Voir [la politique de budget](gemini-budget.md).

Le conseil a trouvé la [fiche SIOS du sachet Cascade 100 g](https://www.sios.ch/Cascade-USA-100-g-Hopfenpellets-Typ-90), une offre Brewstore par 10 g et une offre Sevibräu au gramme. Une quantité vendue au détail n’est pas présentée comme un sachet scellé de 100 g. Prix et disponibilités restent ceux annoncés lors du contrôle.

## Défaut découvert et correction

Le premier résultat contenait aussi des fiches de sucre, de copeaux et une variante linguistique du même article parmi les cartes, alors que le texte du conseil ne les recommandait pas. Le contrôle initial « URL produit vérifiée » ne suffisait donc pas.

Le conseil sélectionne désormais explicitement `productUrls`, avec les produits exacts en premier. Le serveur vérifie ces URL et n’affiche que les fiches sélectionnées ; la relecture contrôle leur pertinence, variété et conditionnement. Le contrôle d’évaluation refuse maintenant les cartes hors sujet dans ce scénario.

La correction a été vérifiée en rejouant les cinq réponses originales sans en modifier le contenu et en relisant les fiches publiques. Le replay conserve exactement trois offres Cascade, sans nouvelle génération IA. Il vérifie le filtrage avec les réponses enregistrées ; il ne constitue pas un second essai réel du nouveau prompt.

## Validation finale

- 2 880 tests locaux réussis dans 181 fichiers ; les tests ordinaires ne contactent pas Gemini.
- Compilation frontend et Functions réussie ; rapport de recherche privé exclu du bundle public.
- Aperçu du vrai composant à 390 px : aucune largeur débordante, zones tactiles de plus de 119 px, conditionnement/prix/stock daté lisibles, aucune erreur console.
- URL SIOS ouverte dans le navigateur : titre Cascade USA 100 g, référence HH0151100 et bouton d’achat présents. Aucun achat effectué.
- Functions et Hosting déployés ; contrôle du 9 septembre à 17:54 UTC : page HTTP 200, JavaScript publié identique au build, endpoints IA refusant les requêtes sans authentification (401), aucun appel IA supplémentaire.
- Rapport réel original : `.codex-remote-attachments/brewer-shopping-flash-eval/report.json` ; replay distinct : `replay-verified.json` dans le même dossier. Aucun secret dans ces rapports.

Limite de validation : le parcours authentifié d’un utilisateur sur le site publié n’a pas fait l’objet d’un nouvel achat ou d’une nouvelle question IA. Les stocks changent ; une page bloquée ou illisible ne devient jamais une offre vérifiée.
