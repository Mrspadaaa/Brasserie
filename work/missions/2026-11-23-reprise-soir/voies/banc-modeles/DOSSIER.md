# Dossier banc-modeles (D453, accord du brasseur 25.11 : plafond 0,50 CHF)

Base : voies/c70-ia/RESULTAT.md (banc existant scripts/banc-rangement.ts, 16 phrases neuves avec attendus : 8 réglage, 8 tenues à part ; un appel 3.8 = 0,0094 CHF observé ; cause du défaut : carnet du même sujet ; champ « sujet » ajouté).
1. Ajoute au banc l'option --modele lite|flash38|hydrogen (mêmes noms de modèles que functions/src/lienIA.ts et carnetIA.ts ; vérifie-les dans le code). Même consigne, même schéma pour les trois.
2. Passes : les 16 phrases × 3 modèles, AVEC et SANS un carnet ZZ du même sujet dans le contexte (cas qui a échoué), dans la limite du plafond : estime le coût par modèle après les 2 premiers appels de chacun, et réduis (8 tenues à part seulement) si le total dépasse 0,50 CHF. Chaque appel au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl. Aucune donnée réelle envoyée (carnets fictifs ZZ).
3. Tableau au RESULTAT : par modèle, justesse sur les tenues à part (genre, chemin, titre court, carnet visé), coût par appel, temps par appel.
4. Recommandation : le moins cher qui range aussi juste (à ±1 phrase) que le meilleur sur les tenues à part. Ne change PAS le modèle de production : le pilote décide. Fixtures des réponses du modèle recommandé dans tests/fixtures/banc-modeles/.
5. Commit par CHEMINS. Pas de déploiement.
Ligne rendue : « BANC lite x/8, flash38 y/8, hydrogen z/8 (tenues) ; coût total <CHF> ; recommandé <modèle> <hash> ».
