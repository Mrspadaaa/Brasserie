# Dossier c50-tests — règles tirées du test en ligne du tour 50 (voies/critique-50/RESULTAT.md)

Lignes complètes : `grep -n "^| C50-" work/missions/BUGS.md`. C50-5 (compromis) est HORS de cette voie : la phrase vient de sa maquette choisie g01-8 (règle n° 1), à lui montrer s'il faut la changer.
Règles (une règle couvre tous les cas semblables, pas seulement l'exemple vu) :
- R6 (C50-1, bloquant) : « Non publié : X » / « Aucune valeur lue pour : X » n'est JAMAIS dit quand X est présent parmi les caractéristiques lues, sous un synonyme, une plage ou une autre unité (température « de 0 °C » / « à 8 °C », volume en m³ ou L…). Une seule source de vérité de « lu » pour la fiche, Comparer et la feuille Articles.
- R7 (C50-2) : la colonne du tableau et la ligne d'un article dans la feuille Articles montrent le critère du carnet ; sans valeur lue pour le critère, une caractéristique qui DISTINGUE les articles ; jamais une valeur identique pour tous.
- R8 (C50-3, C50-6) : caractéristiques synonymes fusionnées en une (Type de refroidissement / Refroidissement ; Fluide frigorigène / Type de réfrigérant ; Tension / Branchement électrique ; « Température de » + « Température à » → une plage) ; unités normalisées, une seule fois (« 242 L », jamais « 242 l L » ni « l »).
- R9 (C50-4) : toutes les fiches d'un même carnet listent les caractéristiques dans le même ordre (celui de la décision : critère, puis ce qui décide), pas l'ordre de la page.
- R10 (C50-7) : une caractéristique oui/non s'écrit « Induction : non » (ou « pas d'induction »), jamais « pas : Induction ».
- R11 (C50-8, C50-9) : à 390 px, aucun contrôle (interrupteur « Veiller », gestes) poussé hors de l'écran ou coupé par un libellé long ; la ligne Offre d'une fiche garde la disponibilité sur une ligne, prix et gestes alignés, avec ou sans « Relire ».

Code : src/ui/carnets/ (FicheArticle.tsx, Comparer.tsx, TableauCarnet.tsx, ArticlesCarnet.tsx, CarteArticle.tsx…), src/domain/carnets/, functions/src/lienIA.ts, lireLien.ts, lienLibelles.ts. Voies précédentes : voies/c48-tests/RESULTAT.md, voies/c48-fix/RESULTAT.md.
