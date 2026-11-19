OK — 17 problèmes, 2 bloquants

# k1 — test d'écran, tour 1 (critique Opus)

Portée : captures APRÈS correctif des défauts « corrigé » par un vrai changement de code (t1, r1, a1, a2, b1, s1, c1, x1, y1, z1), plus les défauts renvoyés au pilote par b1 et c1. « Déjà corrigé », « ouvert » et « écarté » non jugés. Captures ouvertes : r1 apres-390-cave-fiche-us05 ; t1 palette-loupe-390-clair, palette-cmdk-390-clair ; a1 m4-teinte-390-cave, mv7-miel-390-cave, m4-mv8-390-cave, pi1-br19-390-cave, br11-dext-390-cave ; a2 fin-390-identite-nom-long, fin-390-nolo-cave, fin-390-identite-pose ; b1 mesures-cave-390, courbe-cave-390, og-2-5-clair-1280 ; c1 c1-caisse-390-clair-haut, c1-caisse-390-cave-bas ; s1 m390-cave-fiche-admiral, m390-cave-houblons-index, m390-cave-sources-modeles ; x1 br5-63-390-cave, br6-kg-390-cave, br6-litre-390-cave, br98-liste-390-cave, br98-liste-1280-cave ; y1 apres-masque-wizard-390x660-cave-etape1, apres-gouttiere-css-390x660-cave, masque-390x660-cave-2-arret ; z1 lactose-cave-390, potentiel-cave-390.

## Problèmes

1. b1 / BR-114 (renvoyé 1) / og-2-5-clair-1280 / le résumé « Densité OG 2,500 · 0 relevé » affiche la valeur que le message rouge vient de refuser (« elle ne s'enregistre pas ») : valeur fausse à l'écran. / bloquant
2. b1 / og-2-5-clair-1280 / « 0 relevé » dans le résumé Densité, et « Densité au fil du brassin · 2 mesures enregistrées » plus bas sur la même feuille : un des deux chiffres est faux. / bloquant
3. b1 / BR-114 / og-2-5-clair-1280 / le champ « Densité finale » montre « 1.012 » au point, juste sous le message qui dit « la densité s'écrit avec sa virgule, 1,048 ». L'écran se contredit. / gênant
4. b1 / BR-115 (renvoyé 3) / mesures-cave-390 et og-2-5-clair-1280 / le même fait est dit trois fois : « 57,9 L pour 19,8 L brassés », « 57,9 L non répartis » (même carte Bouteilles), puis encore sous « Conditionné ». Une seule alerte suffit. / gênant
5. c1 / AM-69 (renvoyé 1) / c1-caisse-390-clair-haut (et c1-caisse-390-cave-bas) / la rangée « Mon mois · Encaisser 11,90 CHF » est posée sur une bande blanche qui tranche sur le gris de la feuille ; en cave, la bande est plus sombre que la feuille. On dirait une pièce rapportée. / détail
6. a2 / TE-14 / fin-390-nolo-cave / « Recette actuelle : à compléter — relation de fermentation limitée absente pour cette souche et ce procédé » : « à compléter » renvoie le brasseur à une donnée qu'il ne peut pas saisir. C'est un manque du moteur, pas une action. / gênant
7. a2 / TE-15 / fin-390-nolo-cave / sous le repli « Hypothèses du calcul », « Plage de simulation » et l'encadré « Eau proposée · Empâtage 8,9 L + rinçage 17,4 L · 17,9 L à chaud · Ratio atteint 5,2 L/kg… » restent à découvert, suivis de 6 replis. Le bloc NOLO reste un cockpit (« pas de cockpit »). / gênant
8. a2 / TE-15 / fin-390-nolo-cave / le chevron du repli « Hypothèses du calcul · densité 1,019 · atténuation 13–17 % » touche le texte. / détail
9. a2, x1 / TL-30, BR-5 / fin-390-identite-nom-long, br5-63-390-cave / le « + » flottant recouvre la fin de « Suivant — Malts/sucres » et de « Suivant — Eau et sels » (390). Doute : captures peut-être antérieures à b4c92eb73 (y1 apres-masque-wizard-390x660-cave-etape1 montre « Suivant — Paliers » libre). / gênant
10. x1 / BR-6 / br6-litre-390-cave / au repos, le « + » cache l'onglet « Historique » de l'atelier houblons (« Histo… »). Le masquage au défilement (y1) ne joue pas au repos. / gênant
11. a1 / MV-7 / mv7-miel-390-cave / deux gestes pour le même mot : « + Miel ↵ » dans le champ et « + Créer « Miel » (stock à zéro) · sucre : à l'ébullition ». Rien ne dit ce que fait le premier : en grain, ou en sucre ? / gênant
12. a1 / MV-8 / m4-mv8-390-cave / la coriandre reste une ligne « empâtage · 1 % du grain ». Elle est comptée dans « Grain 8,05 kg » et rend l'EBC « — » (« 1 couleur à renseigner »). L'alerte dit qu'elle « serait comptée comme du grain » alors qu'elle l'est déjà. Le « + » mord le bord de l'alerte. / gênant
13. a1 / M-4 / m4-teinte-390-cave / la pastille de couleur du « Malt noir » (ligne et carte détail) est noire sur fond noir : on ne la voit pas en cave. / détail
14. s1 / TE-49 / m390-cave-fiche-admiral / « Référence variété · Confiance faible » répété trois fois (α, β, huiles), et l'α « 11–15 % du houblon » affiché deux fois (en tête, puis dans « Composition · Admiral »). / gênant
15. s1 / TE-49 / m390-cave-fiche-admiral / trois lignes de texte pour la classe « Thiol impact » (« Elle concerne les thiols libres du houblon ; ce n'est ni un rendement de levure ni une intensité prédite en bière. ») : trop de texte en tête de fiche (connu hors voie, yeast.ts). / gênant
16. s1 / BR-110 / m390-cave-houblons-index / le titre « Houblons » répète l'onglet actif juste au-dessus. Le compte est dit deux fois : « 136 références aucun lot », puis « 136 fiche(s) disponibles. », avec un « (s) ». / détail
17. x1 / BR-5 / br5-63-390-cave / la poignée orange ↔ couvre l'étiquette de durée (« :18′ » coupé). / détail

Combien : 17 (2 bloquants, 10 gênants, 5 détails)

## Doutes (non comptés)

- b1 / mesures-cave-390 : la pastille verte « alcool 6,4 % » est posée à côté de « 0 relevé ». Un alcool affiché comme un fait, sans FG mesurée.
- a2 / fin-390-nolo-cave : « rinçage 17,4 L · 17,9 L à chaud ». Deux volumes voisins, et on ne sait pas ce qu'est le second.
- a1 / mv7-miel, br11-dext, m4-teinte (390 cave) : OG « — » avec 8 à 10,5 kg de grain, sans curseur sur « style 1,060–1,085 ». Probablement le banc (« PPG — · fiche ») ; à vérifier.
- a1 / pi1-br19-390-cave : « Caramünch II 32,5 kg » en fermentation pour 5 kg de grain. Absurde comme brassin, mais c'est la fixture du banc.
- y1 / apres-gouttiere-css-390x660-cave : barre du bas « Accueil · Stocks · Brassins · Finances · Calendrier », sans icônes ni onglet actif, différente de celle de l'app (s1 m390-cave-houblons-index). Aucun « + » n'est visible, donc la gouttière ne se juge pas sur cette capture.

## DEMANDE EXECUTANT (preuves absentes)

- x1 / BR-98 : br98-liste-390-cave et br98-liste-1280-cave ne montrent pas la liste « Houblon pour ce style ». Capturer la liste ouverte (390 cave, 1280 clair) : α ou « α non publié », arômes, puis source et forme.
- z1 / TL-26, TL-12 : lactose-cave-390 et potentiel-cave-390 sont en thème clair, et aucune ligne Lactose « ne fermente pas » n'est visible. Recapturer en vrai thème cave, ligne Lactose à l'écran (390 et 1280).
- t1 / LR1-NOTE-5 : palette-loupe-390-clair montre « Rien pour « 17,50 Cascade » », et palette-cmdk-390-clair « Rien pour « Versandkosten » » (aucune écriture locale). Rejouer avec une écriture « ZZ TEST » de 17,50, puis capturer le résultat trouvé.
- b1 / RL-13 : aucune capture du bloc de notes « OG 1,031 · 11,3 % AA · 27,5 °C · 22,8 L ». En capturer une, à 390 cave.
