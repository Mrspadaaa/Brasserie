# p5q — Prévisions, 12 mois : avant, après (froide)

Idée : un coup dur ne se lit que contre le plan. Le plan reste en pointillé gris derrière ; l'année avec le coup dur est en bleu ; le
retard est un trait rouge sur la barre du frigo (d'avril à juillet), l'écart de fin d'année est écrit en bas.

## En une phrase (B11)
« La panne de février me coûte 800,00 : le frigo passe d'avril à juillet et je finis l'année avec 1 367,60 au lieu de 2 167,60. »

## Le métier dessiné (voir `../METIER.md` § 7 à § 9)
Ses mots : « Refait en avec ces nouvelles informations. J'aime beaucoup la vue type graph, celle de base ». Lecture : le graphe de
trésorerie dans le temps (p1b, p4a, p5g ; sur l'année p5o), pas le Gantt ni les tuiles. Les nouvelles informations : étaler un achat à
300,00 par mois (« déjà 1 567,60 », « encore 1 432,40 », frigo en avril) et les trois genres de coup dur :
panne 800,00 en février (juillet, fin octobre 1 367,60) ; contrôle d'électricité 350,00 en mars (mai, 1 817,60) ; fonds de rénovation
+ 50,00 par mois dès janvier (mai, 1 667,60) ; les trois ensemble (septembre, 517,60, réserve au plus bas 504,00).

## Honnêteté
Fixture : 4 181,60, dû 460,00, charges fixes 468,00, fermenteur 750,00. Exemple, souligné en pointillé : 300,00 par mois (son chiffre),
la réserve de trois mois de charges (1 404,00), le frigo 3 000,00, et les trois coups durs (montants et mois choisis par moi).

## Boosters UX (boosters-ux)
- Boosters : `mensuel` (curseur « Je dégage ») ; `horizon` (12 mois) ; `coup-dur` (trois bascules « Et si ») ; le graphe. Statique : panne, puis contrôle d'électricité.
- B1 OK · B2 OK (un primaire ; le mois du frigo est le plus gros mot ; jugé sur la capture nette) · B3 OK (60 mots au plus, compte dans RESULTAT) · B4 OK · B5 non mesuré
- B6 ECHEC (5 tailles : 12, 13, 14, 18, 20) · B7 OK (`controle-contraste`) · B8 ~ (pas d'état « rien de dégagé » ni « réserve à sec ») · B9, B10 s.o. · B12 OK · B13 lu au CSS, non mesuré.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS OK · COMMUN OK. Captures `-1280` ouvertes.

## Tient / casse
- Tient : ce que le coup dur change saute aux yeux (une marche rouge, un trait rouge).
- Casse : deux courbes superposées, le reproche qu'il faisait à p4a ; « déjà » et « encore » ne sont pas écrits.
