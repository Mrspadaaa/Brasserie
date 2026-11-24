# Dossier c56-tests — règles tirées du test en ligne du tour 56 (voies/critique-56/RESULTAT.md) et de sa réponse C50-5

Lignes complètes : `grep -n "^| C56-\|^| C50-5 " work/missions/BUGS.md`.
- R27 (C56-1, C56-2, C56-3, et C52-3 vérifié à tort) : aucun texte du Carnet ne déborde de sa boîte ni n'est coupé par le bord d'une carte (vendeur et prix, légende de jauge) ; un nombre n'est jamais séparé de son unité en fin de ligne (« 250 g », « 50 L » insécables) : variantes, titres, liens retour, liste des carnets. Le test mesure le texte (scrollWidth > clientWidth, ou espace insécable présent), pas seulement la boîte.
- R28 (C56-4, C56-5) : le rangement par l'IA ne conclut pas « l'IA n'a pas répondu » avant son vrai délai (aiTask répond en ~3 s) ; un échec donne UN seul avis, avec son Relire.
- R29 (C56-6) : les lignes d'offre (prix, dispo, vendeur) restent groupées, même quand une ligne classe le carnet par un critère (la ligne du critère vient avant ou après l'offre, jamais au milieu).
- R30 (C50-5, sa réponse « Oui » du 24.11) : le compromis de Comparer dit ce qu'on gagne et ce qu'on perd entre les articles (écart de prix contre écart sur le critère ou ce qui distingue, ex. « +289,77 CHF pour 4,06 m³ au lieu de 2,6 »), avec ou sans critère ; il ne recopie pas seulement le tableau.

Code : src/ui/carnets/ (FicheArticle.tsx, Comparer.tsx, ArticlesCarnet.tsx, CarnetOuvert.tsx, ListeCarnets.tsx, bandeauxCarnet.tsx, EtatIA.tsx…), src/domain/carnets/ (compromis, rangement), functions/src/carnetIA.ts. Voies précédentes : voies/c55-tests/, voies/c55-fix/RESULTAT.md.
