# Dossier c61-tests — règles tirées du test en ligne du tour 61 (voies/critique-61/RESULTAT.md)

Lignes complètes : `grep -n "^| C61-\|^| C59-6 \|^| C59-8 " work/missions/BUGS.md`.
- R43 (C61-1, BLOQUANT) : aucune surface du Carnet (liste des carnets, aperçu, À venir, Calendrier, pastilles) ne montre un prix sans sa quantité ou son unité (« dès 0,10 CHF ») ; même règle que R39/R41 de la voie prix-houblon2 (commit c303d2223), sur TOUTES les surfaces (grep des endroits qui affichent un prix de carnet).
- R44 (C61-2, BLOQUANT, régression de LE-1) : « Lecture de lien interrompue [Reprendre] » ne s'affiche QUE pour une lecture réellement interrompue (fermée avant la fin), jamais après une lecture finie ; et regarder un carnet n'écrit toujours rien (test espion de LE-1 vert).
- R45 (C59-8 rouvert) : sur un houblon, l'alpha s'appelle « Alpha » et passe en tête, sur toutes les surfaces (fiche, tableau, Comparer, carte).
- R46 : C59-6 et les autres C61 (voir lignes), chacun en règle générale.
Code : src/ui/carnets/, src/domain/carnets/, voie LE-1 : work/missions/2026-11-24-carnet-personas/lecture-ecrit/RESULTAT.md.
