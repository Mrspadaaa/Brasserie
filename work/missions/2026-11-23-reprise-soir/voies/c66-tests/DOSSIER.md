# Dossier c66-tests — règles tirées du test en ligne du tour 66 (voies/critique-66/RESULTAT.md)

Lignes : `grep -n "^| C66-\|^| C65-[456] " work/missions/BUGS.md`. Port D451 greffe passe 2 : maquette work/missions/2026-11-24-carnet-personas/maquettes2/v01.html (règle n° 1).
- R51 (C66-1, B) : après Retirer (ou Déplacer) depuis une feuille, l'Annuler est VISIBLE et touchable au-dessus de la feuille et rend l'article ; toucher Annuler ne ferme pas seulement la feuille.
- R52 (C66-2, B) : un prix à paliers (Brau : 0,1044 CHF/g, 0,08 CHF/g dès 1 000 g) donne un CHF/kg chiffré (80) sur la carte, au tableau et dans « Selon la quantité » ; jamais « ? CHF/kg » quand la page donne un prix.
- R53 (C66-3, C65-5, B) : un seul classement au kilo pour tout le carnet : rang, ✓/case verte, barres et compromis disent le même gagnant (le moins cher au kilo rendu à quantité égale).
- R54 (C66-4, B) : le bouton Choisir annonce le prix du conditionnement COCHÉ (1 kg → 62,20), jamais celui d'un autre (6,70).
- R55 (C66-5, B, règle n° 1) : Comparer suit v01 : lignes égales repliées en une ligne, ✓ du meilleur sur chaque ligne qui diffère, pas seulement le prix. Plus C66-6..8 et C65-4/C65-6 (m) : voir BUGS.md.
Code : src/ui/carnets/{TableauCarnet,ArticlesCarnet,CarteArticle,FicheArticle,FeuilleCartes,Comparer,Choisir,PrixPastille}.tsx, tableauRegles.ts, src/domain/carnets/prixUnitaire.ts, prixRendu.ts.
