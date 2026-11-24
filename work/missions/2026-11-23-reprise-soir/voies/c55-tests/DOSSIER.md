# Dossier c55-tests — règles tirées du test en ligne du tour 55 (voies/critique-55/RESULTAT.md)

Lignes complètes : `grep -n "^| C55-" work/missions/BUGS.md`. C50-5 (compromis de sa maquette g01-8) reste hors voie.
- R23 (C55-1) : dans Comparer, un libellé de ligne ne déborde jamais sur sa valeur (« Branchement1N~/PE ») : il passe à la ligne entre deux mots ou prend un libellé court entier ; toute colonne de libellés du Carnet.
- R24 (C55-2) : ce que l'aperçu du rangement promet (« Ce qui compte · … », critère, ordre des articles) est exactement ce qui est créé ; sinon l'aperçu ne le promet pas.
- R25 (C55-3) : toute valeur chiffrée affichée porte son unité (en-tête de Comparer, cellules, jauges), une seule fois.
- R26 (C55-4) : les lignes de Comparer suivent l'ordre de la fiche ; les lignes d'offre (prix, dispo, vendeur) restent groupées ensemble, jamais au milieu des caractéristiques.

Code : src/ui/carnets/ (Comparer.tsx, comparer-compact.css, apercu du rangement : apercuCarnet.tsx…), src/domain/carnets/, functions/src/carnetIA.ts (rangement), functions/src/lien*. Voies précédentes : voies/c54-tests/, voies/c54-fix/RESULTAT.md.
