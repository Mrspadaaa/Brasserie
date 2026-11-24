# Dossier c52-tests — règles tirées du test en ligne du tour 52 (voies/critique-52/RESULTAT.md)

Lignes complètes : `grep -n "^| C52-\|^| C50-4 " work/missions/BUGS.md`.
Règles (une règle couvre tous les cas semblables, pas seulement l'exemple vu) :
- R12 (C50-4 rouvert au tour 52) : deux articles d'un même carnet listent leurs caractéristiques dans le MÊME ordre (critère, puis ce qui décide), y compris des fiches lues ou relues par le serveur (chemin complet lireLien → fiche affichée), y compris des lectures anciennes déjà enregistrées (son carnet, lecture du 21.11).
- R13 (C52-1) : la jauge à côté d'une valeur du critère est pleine quand le critère est tenu (une plage « 0 à 8 °C » tient « Température à 4 °C » ; des dimensions qui tiennent), et un état distinct quand on ne sait pas ; jamais l'aspect d'une valeur nulle pour une valeur lue.
- R14 (C52-2) : une pastille ou une colonne de prix montre le prix seul, ou un prix unitaire entier (« 10,40 CHF/L ») ; jamais une autre grandeur glissée dans le prix (« 520 / 50 L / CHF »).
- R15 (C52-3) : sur la ligne Offre d'une fiche, le vendeur et le prix sont séparés (espace, séparateur ou ligne) dans tous les états (avec prix, sans prix, avec Relire).

Code : src/ui/carnets/ (FicheArticle.tsx, Comparer.tsx, TableauCarnet.tsx, ArticlesCarnet.tsx, CarteArticle.tsx, PrixPastille.tsx…), src/domain/carnets/, functions/src/lienIA.ts, lireLien.ts, lienLibelles.ts. Voies précédentes : voies/c50-tests/RESULTAT.md, voies/c50-fix/RESULTAT.md.
