# p5u — Prévisions, 12 mois : avant et après, l'un sous l'autre (chaude)

Idée : deux graphes sur le même temps au lieu de deux courbes superposées. En haut l'année prévue ; en bas la même année avec les
coups durs (ici les trois ensemble). On compare d'un regard vertical : la marche du frigo recule, le socle se creuse.

## En une phrase (B11)
« Avec les trois coups durs, le frigo recule de cinq mois, à septembre, et il me reste 517,60 fin octobre au lieu de 2 167,60. »

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
- Boosters : `mensuel` (curseur « Je dégage ») ; `horizon` (12 mois) ; `coup-dur` (trois bascules « Et si ») ; le graphe. Statique : les trois ensemble, puis la panne seule.
- B1 OK · B2 OK (un primaire ; le mois du frigo est le plus gros mot ; jugé sur la capture nette) · B3 OK (60 mots au plus, compte dans RESULTAT) · B4 OK · B5 non mesuré
- B6 ECHEC (5 tailles : 12, 13, 14, 18, 20) · B7 OK (`controle-contraste`) · B8 ~ (pas d'état « rien de dégagé » ni « réserve à sec ») · B9, B10 s.o. · B12 OK · B13 lu au CSS, non mesuré.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS OK · COMMUN OK. Captures `-1280` ouvertes.

## Tient / casse
- Tient : aucune courbe ne se superpose ; la réserve entamée (au plus bas 504,00) se voit et tient.
- Casse : chaque graphe n'a que 170 px de haut ; « déjà » et « encore » ne sont pas écrits ; pas de bande des mois.
