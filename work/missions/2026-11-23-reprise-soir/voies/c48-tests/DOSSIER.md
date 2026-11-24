# Dossier c48-tests — règles tirées du test de son carnet « chambre froide » (voies/critique-48/RESULTAT.md)

Lignes complètes : `grep -n "^| C48-" work/missions/BUGS.md`.
Règles (une règle couvre tous les cas semblables, pas seulement l'exemple vu) :
- R1 (C48-1) : un article dont la page publie un prix (même hors TVA) a un prix dans l'app ; un article lu sans prix avant une amélioration de la lecture se voit proposer « Relire » (geste du brasseur, jamais automatique sur ses données).
- R2 (C48-2, C48-6, et TOUT libellé de colonne ou de ligne des tableaux du Carnet : Comparer, tableau du carnet, feuille Articles) : jamais coupé au milieu d'un mot à 390 px ; s'il ne tient pas, il passe à la ligne entre deux mots ou prend un libellé court entier (« Dim. int. », pas « Dimensio. »).
- R3 (C48-3) : un seul classement des critères pour un carnet ; Articles et Comparer disent le même ordre et le même critère en tête.
- R4 (C48-4) : un encadré de synthèse (« Compromis ») ne répète aucune valeur déjà dans le tableau ; il dit ce que le tableau ne dit pas (ce qu'on gagne, ce qu'on perd) ou il disparaît.
- R5 (C48-5, avec E47-5) : les caractéristiques retenues mettent d'abord ce qui décide (température de service, volume, matière, énergie, compatibilité) ; aucune caractéristique publiée sur la page parmi celles-ci n'est perdue quand on en garde 10.

Code : src/ui/carnets/ (Comparer.tsx, TableauCarnet.tsx, ArticlesCarnet.tsx, FicheArticle.tsx, comparer-compact.css…), src/domain/carnets/, functions/src/lienIA.ts, lireLien.ts, lienLibelles.ts. Voie précédente sur ces fichiers : voies/e47/RESULTAT.md (E47-5 caractéristiques).
