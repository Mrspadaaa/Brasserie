# Dossier c53-tests — règles tirées du test en ligne du tour 53 (voies/critique-53/RESULTAT.md)

Lignes complètes : `grep -n "^| C53-" work/missions/BUGS.md`.
Règles (une règle couvre tous les cas semblables, pas seulement l'exemple vu) :
- R16 (C53-1, C53-2, C53-3) : les caractéristiques se rangent PAR GROUPES, comme un acheteur ou un brasseur les lit, jamais par ordre alphabétique à l'intérieur d'un groupe de mesures : acides ensemble (alpha, bêta, cohumulone) ; huiles (totales, puis chaque huile par part décroissante) ; dimensions ensemble (extérieures, intérieures, puis porte : hauteur et largeur côte à côte) ; énergie ensemble (puissance, consommation, tension) ; même ordre pour deux articles du même genre. La carte (résumé) reprend la tête de la fiche (houblon : alpha, récolte, huiles totales), jamais une caractéristique qui ne sert pas à choisir.
- R17 (C53-4) : un prix unitaire (« 10,40 CHF/L ») ou un montant avec son unité n'est jamais coupé entre le nombre et l'unité, dans toute colonne ou pastille du Carnet.
- R18 (C53-5) : sur la courbe de Finances › Prévisions (et toute courbe qui a des bulles d'événements), chaque marche notable porte une étiquette avec son nom et son montant, posée sur SA marche ; deux événements le même jour : « <nom> + 1 autre −159,95 » comme au tour 52 ; un préfixe n'est jamais doublé (« ZZ TEST — ZZ TEST — achat »).

Code : Carnet : src/ui/carnets/, src/domain/carnets/, functions/src/lienIA.ts, lireLien.ts, lienLibelles.ts (ordre posé par c52-fix : voies/c52-fix/RESULTAT.md). Courbe : src/ui/finance/ (Prévisions), src/ui/calendrier/entete/Courbe.tsx (K51-1 : voies/rouges/RESULTAT.md). Goût du brasseur : cerveau/brasseur/penser-brasseur.md (α, rôle, arômes d'abord).
