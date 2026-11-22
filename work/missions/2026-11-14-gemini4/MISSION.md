# Gemini 4 à la place de 3.8 dans la lecture des factures (14.11)

Ses mots (SPEC, 14.11) : « Plutôt là où 3.8 était utilisé. Je te donne 10chf de budget pour tester ça. Vitesse et précision. Joue aussi avec
le taux de réflexion ». Accord : 10 CHF de Gemini payant, pour ce banc seulement, journalisés.

## État de l'art (L29)
Problème type : choix de modèle par évaluation hors ligne sur un jeu de vérité (exactitude champ par champ, latence p50/p90, coût par pièce),
avec réglage d'un hyperparamètre (niveau de réflexion). Méthode : le banc existant (`scripts/banc-lecture-facture.ts`, skill `banc-lecture`)
sur les pièces à vérité ; réglage choisi sur une moitié, jugé sur l'autre (L20) ; aucune bascule sans gain mesuré.

| Voie | Agent | Modèle | Livrable |
|---|---|---|---|
| g1 | auteur | sonnet | banc Gemini 4 vs 3.8, tableaux justesse / temps / coût, recommandation |
