# Prévisions : le métier, c'est « prévoir, anticiper »

Ses mots (09.11, pendant cette voie) : « Analyse le business, c'est pas très bien fait et d'écrit » ; « C'est plutôt, prévision,
anticipation ECT... ».
Ma lecture (L01, étroite) : il parle de l'écran Prévisions de ce lot. Le brief le réduisait à « puis-je acheter le frigo ? ». L'écran
sert à voir venir. Le frigo n'est qu'une des questions. À verser dans SPEC-BRASSEUR par le pilote (je n'écris que dans `p4/f52/`).

## 1. Ce que « prévoir » veut dire pour lui, dans l'ordre de sa décision
1. **Vais-je manquer d'argent, et quand ?** Le chiffre qui compte est le **point le plus bas** et sa date, pas le solde de fin de période.
2. **Qu'est-ce qui sort, quand, et à quel point c'est sûr ?** Une facture en retard, un loyer, le budget calculé d'un brassin et un
   projet en devis ne pèsent pas pareil.
3. **Qu'est-ce qui rentre ?** C'est son seul levier, et c'est ce qui manque aujourd'hui.
4. **Qu'est-ce que je dois préparer maintenant ?** Anticiper, c'est une date pour agir (commander, déclarer), pas seulement une date de paiement.
5. **Et si… ?** J'achète le frigo, je repousse le fermenteur, je brasse un brassin de plus.

## 2. Ce que l'app fait aujourd'hui, et pourquoi ça ne répond pas
Lu dans le code de ce worktree et dans `INVENTAIRE-CODE.md` (§ 3, problèmes 12, 15, 16, 24).
| Constat | Preuve | Effet |
|---|---|---|
| La prévision ne fait que descendre : les entrées n'existent que pour une facture de vente impayée ou un plan « à recevoir » saisi à la main | `src/domain/finance/forecast.ts` ; inventaire l. 86 | « Puis-je acheter ? » répond toujours non ; « le meilleur mois » n'a pas de sens. `materielFutur.ts:213` l'écrit lui-même en avertissement |
| Rien ne dit à quel point un montant est sûr | `ForecastItem.source` existe (`invoice`, `recurring`, `brew`, `equipment`, `trend`) mais l'écran en fait quatre intitulés (problème 24) | Un devis et une facture en retard se lisent pareil |
| Le solde affiché est celui de la fin, pas le plus bas | inventaire l. 86 | On peut finir positif et passer à sec entre deux |
| Un brassin est vu comme une dépense | `brewForecast.ts` pose ses sorties, rien ne pose la bière qu'il donnera | Brasser paraît seulement coûter |
| L'impôt bière, la TVA, les impôts du canton n'ont pas d'échéance | problème 12 ; inventaire l. 86 | Ce qui se déclare n'est pas anticipé |
| Le brief des maquettes réduit l'écran au frigo | `BRIEF-PASSE4.md` | p4a et p5a à p5f dessinent deux chemins de sorties, sans rentrée |

## 3. Le modèle proposé
**a. Chaque flux porte sa certitude, et elle se dessine.**
| Certitude | Ce que c'est | Dans l'exemple | Dessin |
|---|---|---|---|
| Dû | facture reçue, retard | atelier 60,00 ; loyer du 25.11 (« à payer » 460,00) | plein |
| Sûr | revient à date fixe | loyers du 25.12 et du 25.01 | plein, contour |
| Calculé | sort d'un brassin planifié : recette, stock, dernière facture | Pale Ale du 20.11 : 57,42 puis impôt 6,84 | plein, « ~ » sur la date estimée |
| Envisagé | projet : devis ou idée | frigo 3 000,00 (exemple) ; fermenteur 750,00 (devis) ; système de brassage (prix ?) | pointillé |
| Attendu | une rentrée qu'on espère | marché 720,00 ; Pale Ale vendue 405,00 | hachuré vert |

**b. Deux lignes, pas une.** « Sans vente » (rien ne rentre : dû, sûr, calculé et projets comptés) et « avec les ventes »
(les rentrées attendues en plus). Entre les deux, la fourchette. **On décide sur la ligne du bas, on espère sur celle du haut.**
Avec le frigo : − 892,66 sans vente (à sec le 25.01), + 232,34 avec les ventes. Sans le frigo : 2 107,34 et 3 232,34.

**c. Les rentrées attendues, de la plus sûre à la moins sûre.**
1. On me doit : factures de vente non payées (le code les compte déjà).
2. Bière en cave prête à vendre : stock de produit fini × la grille de prix.
3. Brassin planifié : litres nets × format × prix, à partir de la date où la bière est vendable. Pale Ale du 20.11 : 27 L nets,
   81 bouteilles de 33 cl à 5,00 = 405,00, vers le 15.01 (exemple).
4. Habitude : un marché comme celui de novembre (720,00), s'il le planifie.
Chacune reste « estimé », hachurée, et se retire d'un toucher (bascule « Ventes »).

**d. Un brassin est un cycle d'argent, pas une dépense.** Pale Ale du 20.11 : 57,42 avant le brassage, 6,84 d'impôt vers le 18.12,
puis environ 405,00 qui rentrent vers la mi-janvier. Avancer 64,26 pour récupérer 405,00 en huit semaines : c'est ce qu'il anticipe quand
il décide de brasser.

**e. Un achat de matériel se juge sur la ligne du bas.**
- Peut-il ? Si le point bas sans vente reste au-dessus de zéro après l'achat. Frigo le 15.11 : non, il manque 892,66 le 25.01.
- Quand ? La première date où la ligne du bas tient. Sur 90 jours, aucune. Le plus sûr : **après le 15.01, une fois les deux ventes
  encaissées** (4 382,34 en caisse, 1 150,00 encore à sortir, il reste 232,34). Avant, c'est un pari de 892,66.
- À quelle condition ? Sans le fermenteur, il ne manque que 142,66.
- Passer le creux se compte sur le **prix** (892,66 ÷ 5,00 = 179 bouteilles encaissées). Rembourser le frigo se compte sur la
  **marge** (5,00 − 7,51 × 0,33 = 2,52 ; 3 000 ÷ 2,52 = 1 191 bouteilles, 393 L, quatre mois de production). `PLAN-METIER.md` (P3) le dit déjà.
- Ce qu'il change : usure 600,00 CHF/an (5 ans, exemple), le litre passe de 7,51 à 8,01 CHF/L.

**f. Anticiper, c'est une date pour agir.** Commander le malt avant le brassage, les bouteilles avant le conditionnement, déclarer
l'impôt bière après la sortie de cave, payer le loyer le 25. Les délais (7 jours avant le brassage, 21 jours jusqu'au conditionnement)
sont la proposition P5 du plan, non confirmée : je ne les ai dessinés que comme dates estimées (« ~ »).

**g. Un horizon, une question.** 30 jours : ce que je dois payer. 90 jours : est-ce que je tiens, puis-je acheter. 12 mois : la saison
(quand brasser, les impôts de l'année). Le même graphe ne répond pas aux trois ; les six maquettes dessinent le 90 jours.

## 4. Les chiffres de l'exemple (vérifiés au centime)
| Date | Flux | Montant | Reste sans vente | Reste avec les ventes |
|---|---|---|---|---|
| 09.11 | départ | | 4 181,60 | 4 181,60 |
| 09.11 | atelier, retard | − 60,00 | 4 121,60 | 4 121,60 |
| 15.11 | frigo (exemple) | − 3 000,00 | 1 121,60 | 1 121,60 |
| 20.11 | brassin, achats | − 57,42 | 1 064,18 | 1 064,18 |
| 25.11 | loyer | − 400,00 | 664,18 | 664,18 |
| 12.12 | marché (exemple) | + 720,00 | 664,18 | 1 384,18 |
| ~18.12 | impôt bière du brassin | − 6,84 | 657,34 | 1 377,34 |
| 25.12 | loyer | − 400,00 | 257,34 | 977,34 |
| ~15.01 | Pale Ale vendue (exemple) | + 405,00 | 257,34 | 1 382,34 |
| 25.01 | loyer | − 400,00 | − 142,66 | 982,34 |
| janv. | fermenteur (devis) | − 750,00 | − 892,66 | 232,34 |
Fixture : 4 181,60, 60,00, 400,00, 64,26 (57,42 + 6,84), 750,00, 720,00 (la vente de novembre). Hors fixture, donc « exemple » : le
frigo, la date du marché de décembre, la vente de la Pale Ale (81 × 5,00, grille d'exemple), les dates en « ~ ».

## 5. Ce qui manque pour le faire (au pilote)
- `buildForecast` : une source `attendu` pour les rentrées estimées, séparée des engagements ; le point bas et sa date sur les deux lignes.
- Le brassin planifié rend aussi sa rentrée (litres nets × format × tarif, date vendable) : il faut une durée « brassage → vendable ».
- `mesurerAchat` : le meilleur moment se cherche sur la ligne du bas ; s'il n'existe pas, rendre la condition (montant à encaisser avant, et date).
- Le stock de bière finie valorisé au prix de vente n'existe nulle part aujourd'hui (à vérifier dans les stocks).

## 6. Ce que je lui montre, et ce que j'attends de lui
Six représentations du même modèle (`p5g` à `p5l`). Ses choix ouverts, en axes de variantes :
- les ventes attendues dans le graphe : oui (hachuré, bascule « Ventes ») ou non ;
- la tête de l'écran : deux cartes sans / avec le frigo (p5g) ou trois bascules et la réponse sur le graphe (les cinq autres) ;
- le frigo : une marche (p5i à p5l), une couche (p5h) ou un socle à franchir (p5g).

## 7. Étaler un achat : « si je fais 300 par mois »
Ses mots (09.11, sur la capture de p5g) : « Ça me plaît bien mais ça montre pas trop comment étalé les frais à venir pour l'achat de
frigo, par exemple.. SI par exemple je fais 300chf par mois, combien je peux mettre pour prendre mon frigo, combien je dois économiser.
Ça serait plus un type de diagramme de Gantt ».
Problème d'école : l'épargne par objectif (« sinking fund », enveloppes) et le fonds de secours compté en mois de charges fixes. Pas de
bibliothèque : une boucle de douze mois en centimes suffit. Décision : la règle ci-dessous, dans la question « 12 mois ».
| Grandeur | Règle | Exemple |
|---|---|---|
| Ce que je dégage par mois | ventes − dépenses courantes ; il le règle (curseur). Plus tard : médiane de ses mois complets | 300,00 (son chiffre) |
| Réserve | N mois de charges fixes, à ne pas entamer | 3 × 468,00 = 1 404,00 |
| Libre aujourd'hui | trésorerie − dû − réserve | 4 181,60 − 460,00 − 1 404,00 = 2 317,60 |
| Ce que je peux mettre | le libre, moins ce qui est déjà promis à un projet plus avancé (fermenteur 750,00) | 1 567,60 |
| Ce que je dois économiser | prix − ce que je peux mettre | 3 000,00 − 1 567,60 = 1 432,40 |
| Quand | premier mois où la somme est là | 5 mois à 300,00 : avril |
| Pour une date voulue | reste ÷ mois restants | en janvier : 716,20 par mois |
L'ordre des projets compte : frigo d'abord, il passe en février et le fermenteur glisse à avril. Le « 90 jours » (deux lignes, § 3) et
le « 12 mois » (un rythme) ne s'additionnent pas : les 300 remplacent les ventes attendues, ils ne s'y ajoutent pas.

## 8. Les coups durs : « qu'est-ce que ça fait à mon année »
Ses mots : « Aussi si j'ai un coup dire, une panne d'un système, qu'est-ce que ca fait à mon année, j'ai un système qui laché, j'ai un
contrôle d'électricité, fond de rénovation qui augmente ECT... C'est des exemples generalise ».
Problème d'école : le test de résistance (un choc, on rejoue le plan). Deux genres seulement :
- **Une dépense d'un coup** (panne, contrôle électrique) : la réserve la paie ; ce que je dégage sert d'abord à refaire la réserve ; les
  projets glissent de « montant ÷ ce que je dégage » mois. Panne de 800,00 en février : frigo d'avril à juillet, fin octobre 1 367,60 au lieu de 2 167,60.
- **Une charge qui augmente** (fonds de rénovation) : elle baisse ce que je dégage, tous les mois. + 50,00 par mois : 250,00 dégagés,
  le frigo demande six mois au lieu de cinq (mai), et la réserve de trois mois monte de 150,00.
Ce que l'écran doit dire d'un coup dur : de combien chaque projet glisse, ce qu'il reste en fin d'année, et si la réserve suffit (sinon
le manque, en rouge). Les montants des coups durs sont des exemples ; il les choisit.

## 9. Les trois coups durs, chiffrés (pour p5p à p5u)
Ses mots, après p5m à p5o : « Refait en avec ces nouvelles informations. J'aime beaucoup la vue type graph, celle de base ».
Règle retenue : la réserve reste à 1 404,00 tant qu'il ne la règle pas ; un coup dur la creuse, les mois suivants la refont d'abord.
| Cas (exemples) | Frigo | Retard | Libre fin octobre | Réserve au plus bas |
|---|---|---|---|---|
| Plan, 300,00 par mois | avril | | 2 167,60 | 1 404,00 |
| Panne, 800,00 en février | juillet | + 3 mois | 1 367,60 | 604,00 |
| Contrôle d'électricité, 350,00 en mars | mai | + 1 mois | 1 817,60 | 1 054,00 |
| Fonds de rénovation, + 50,00 par mois dès janvier | mai | + 1 mois | 1 667,60 | 1 404,00 |
| Les trois ensemble | septembre | + 5 mois | 517,60 | 504,00 |
Mensualité selon le mois voulu (il manque 1 432,40) : janvier 716,20 ; avril 300,00 ; juillet 200,00 ; septembre 150,00.
Calcul : `plan2()` dans `dessins-pu.mjs`, en centimes ; le tableau en sort.

## Limites
Rien de joué dans l'app : ce sont des maquettes. Les délais, la date d'impôt et la durée avant vente sont estimés. Le calcul actuel
de l'app n'a pas été rejoué sur la fixture ; les chiffres viennent des briefs et du tableau ci-dessus.
