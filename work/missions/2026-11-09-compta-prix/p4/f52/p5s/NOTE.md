# p5s — Prévisions, 12 mois : l'escalier qui monte (tiède)

Idée : l'escalier de p1b qu'il a aimé, sur l'année et à l'envers : **une marche de 300 par mois** qui monte, une grande marche qui
descend à chaque achat. La pile « déjà / encore » à gauche. Une charge qui augmente se voit : les marches rétrécissent.

## En une phrase (B11)
« Cinq marches de 300 et j'atteins la barre : frigo en avril ; avec le fonds de rénovation, mes marches passent à 250 et c'est mai. »

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
- Boosters : `mensuel` (curseur « Je dégage ») ; `horizon` (12 mois) ; `coup-dur` (trois bascules « Et si ») ; le graphe. Statique : plan, puis fonds de rénovation avec le plan en pointillé.
- B1 OK · B2 OK (un primaire ; le mois du frigo est le plus gros mot ; jugé sur la capture nette) · B3 OK (60 mots au plus, compte dans RESULTAT) · B4 OK · B5 non mesuré
- B6 ECHEC (5 tailles : 12, 13, 14, 18, 20) · B7 OK (`controle-contraste`) · B8 ~ (pas d'état « rien de dégagé » ni « réserve à sec ») · B9, B10 s.o. · B12 OK · B13 lu au CSS, non mesuré.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS OK · COMMUN OK. Captures `-1280` ouvertes.

## Tient / casse
- Tient : l'étalement se compte (une marche = un mois) ; même forme que le 90 jours.
- Casse : entre 300 et 250 la différence de marche est petite (3 px) ; elle se lit surtout sur la bande du bas et sur le mois.
