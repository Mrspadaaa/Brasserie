# Dossier c58-tests — règles tirées du test en ligne du tour 58 (voies/critique-58/RESULTAT.md)

Lignes complètes : `grep -n "^| C58-\|^| C56-3 \|^| C50-5 \|^| C55-2 " work/missions/BUGS.md`.
- R31 (C58-2, BLOQUANT, régression du correctif C56-3) : un nombre n'est JAMAIS coupé ni restylé à l'intérieur (« 50 L », « 20 mm » : chiffres d'un seul tenant, même taille) ; nombre et unité insécables ; titres, liens retour, liste des carnets, variantes. Tester le texte rendu ET le balisage (aucun élément ne s'ouvre au milieu d'un nombre).
- R32 (C50-5 rouvert, sa réponse « Oui ») : le compromis dit ce qu'on GAGNE et ce qu'on PERD (les deux), avec ou sans critère.
- R33 (C55-2 retombé) : un critère affiché (« 50 L ») classe les articles ; ce que l'aperçu promet est ce qui est créé.
- R34 : les autres constats C58 (voir les lignes), chacun en règle générale.
Code : src/ui/carnets/, src/domain/carnets/, functions/src/carnetIA.ts. Voies précédentes : voies/c56-tests/, voies/c56-fix/RESULTAT.md.
