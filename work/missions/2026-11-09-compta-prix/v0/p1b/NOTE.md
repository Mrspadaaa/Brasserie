# p1b — Prévisions, tiède : l'escalier de trésorerie

Chaleur : **tiède** (une représentation neuve : la trésorerie comme un escalier, chaque sortie une marche).
Idée : « puis-je acheter ce matériel ? » se lit en deux cartes « Avec / Sans le fermenteur » (2 107,34 contre 2 857,34 CHF fin janvier) ; l'escalier dessous montre où et quand l'argent descend, et le point le plus bas.

## Ce qui est montré
- « Ma trésorerie, 90 jours · jusqu'au 31 janv. ».
- Deux cartes-boutons : **Avec le fermenteur 2 107,34 CHF** (choisie) · Sans le fermenteur 2 857,34 CHF, « fin janvier, estimé ».
- Escalier (0 à 4 000 CHF, nov. / déc. / janv.) : aujourd'hui 4 181,60 → − 60 en retard → ~ 64 → − 400 loyer → − 400 loyer → − 750 fermenteur → − 400 ; point final 2 107,34 « plus bas de la période ».
- Liste numérotée ①②③ : chaque marche avec son solde « après » (→ 4 121,60, → 4 057,34, → 2 857,34) ; le fermenteur en « ? » pointillé (« quand ? »), le système de brassage « hors courbe ».
- Pli « Entrées prévues : aucune › » ; primaire « + Prévoir une sortie ».
- Annexe : « Sans le fermenteur » : la marche devient un fantôme en pointillé bleu, l'escalier finit à 2 857,34 ; la ligne du fermenteur se grise « non compté ».

## Problèmes de l'inventaire
15 (le solde après l'achat, et sans : la question a une réponse), 16 (le simulateur d'investissement existe à l'écran, pas seulement pour l'assistant), 24 (plus d'intitulés : des marches), 86-métier « ne dit pas le mois le plus bas » (le point bas est marqué).
Baseline : horizon (90 j au titre ; 30 j et 12 mois à dire au port, segments ou ⚙), ajouter une prévision, inclure projets (= les cartes), comparer les mois (= l'escalier), liste datée ; budget d'un brassin et projets de matériel passent par la ligne ① à ③ et le +.

## Honnêteté
Tous les paliers sont calculés depuis la fixture (4 181,60 − 60 − 64,26 − 400 × 3 − 750). « ~ » sur le budget du brassin, « ? » pour le fermenteur non daté et le système sans prix, « Entrées prévues : aucune » au lieu de 0,00. Les étiquettes du graphe ont un halo de 3 px couleur du panneau pour rester lisibles sur l'aire : pas un « glowing » de picto, une lisibilité de libellé.

## Boosters UX (boosters-ux)
- avec-sans — comparer ; deux cartes-boutons ; l'escalier et la liste se redessinent (annexe).
- escalier — lire ; graphique en marches, aire remplie, point bas nommé ; marches numérotées retrouvées dans la liste.
- Statique (09.11) : rien de joué, l'état « sans » est dessiné à côté.
- B1 OK · B2 OK (les deux cartes puis l'escalier ; un primaire) · B3 ECHEC (93 mots hors données ; 7 blocs) · B4 OK · B5 non mesuré · B6 OK · B7 OK (après correction : rouge d'alerte texte #A8291F, « ? » en bleu finances) · B8 ~ (pas d'état « solde à confirmer » dessiné) · B9 s.o. · B10 OK · B11 OK (« avec le fermenteur il me reste 2 107 ») · B12 OK · B13 OK (cartes 60 px, lignes 38 px).

## Contrôles
PAGE OK · 1280 OK · COMMUN OK (les 6) · mots 93 (> 60) · panel : remplissage 0,673.

## Tient / casse
- Tient : la question « puis-je acheter ? » a sa réponse avant tout défilement ; le point bas est le vrai chiffre à surveiller.
- Casse : 60 et 64 font des marches invisibles ; sur 12 mois, l'escalier se tasse.
