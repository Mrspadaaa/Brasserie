# Dossier c54-tests — règles tirées du test en ligne du tour 54 (voies/critique-54/RESULTAT.md)

Lignes complètes : `grep -n "^| C54-\|^| C53-4 " work/missions/BUGS.md`.
- R19 (C53-4 rouvert : unité rognée au bord) : dans la colonne prix du TABLEAU du carnet, seulement le prix ; le prix unitaire (« 10,40 CHF/L ») reste entier dans Articles et Comparer, qui ont la place. Rien n'est rogné au bord d'une cellule.
- R20 (C54-1) : une seule fonction nomme une marche de courbe (« <nom> + 1 autre −159,95 ») ; l'en-tête du Calendrier et Finances › Prévisions l'utilisent toutes deux ; jamais « 2 mouvements » sans nom.
- R21 (C54-2) : les groupes de R16 se reconnaissent par mots-clés, pas par une liste de noms exacts : énergie (puissance, tension, branchement, étape, phase, consommation, kWh, W, V) ; froid (fluide, frigorigène, réfrigérant, quantité de frigorigène, refroidissement, température) ; dimensions (dimension, hauteur, largeur, profondeur, porte) ; un nom inconnu va dans le groupe de son mot-clé, sinon après les groupes.
- R22 (C54-3) : une jauge a le même sens partout (fiche, feuille Articles, Comparer) : petit à gauche, grand à droite ; « la plus haute » toujours du même côté.

Code : Carnet : src/ui/carnets/ (TableauCarnet.tsx, FicheArticle.tsx, ArticlesCarnet.tsx, Comparer.tsx), src/domain/carnets/, functions/src/lien* (ordre et groupes posés par c53-fix-carnet : voies/c53-fix-carnet/RESULTAT.md). Courbes : src/ui/calendrier/entete/Courbe.tsx, src/ui/finance/ (Prévisions ; fonction posée par c53-fix-courbe : voies/c53-fix-courbe/RESULTAT.md).
