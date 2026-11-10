# p1c — Prévisions, chaud : trois mois en colonnes, l'achat se pose du doigt

Chaleur : **chaude** (forme libre : les colonnes côte à côte de s5a, les blocs de couleur de la Dépense).
Idée : un mois = une colonne ; chaque sortie est un bloc dont la hauteur est le montant, dans la couleur de sa catégorie ; en bas, la fin du mois. Le fermenteur se pose dans le mois qu'on veut (nov. / déc. / janv. / pas) et les fins de mois se recalculent : « quand puis-je l'acheter ? » se lit colonne par colonne.

## Ce qui est montré
- « Trois mois devant · en caisse 4 181,60 ».
- Nov. (reste 21 j) : sort − 524,26 ; blocs ~ 64,26 Pale Ale (jaune), 60,00 Solde atelier 2025 (violet, cadre rouge « en retard »), 400,00 Loyer ; fin du mois 3 657,34.
- Déc. : 400,00 Loyer ; fin 3 257,34.
- Janv. : « Système de brassage · prix ? » hachuré, 750,00 Fermenteur (bleu), 400,00 Loyer ; fin **2 107,34** (le plus bas, en bleu).
- Carte pointillée « Fermenteur · devis 750,00 · acheté en [nov.] [déc.] [janv.] [pas] ».
- Pli « Ventes prévues : aucune › » ; primaire « + Prévoir une sortie ».
- Annexe : posé en décembre → Déc. − 1 150, fin 2 507,34 (le plus bas), Janv. remonte à 2 107,34 fin de période.

## Problèmes de l'inventaire
15 et 16 (le matériel se place et montre son effet), 24 (plus d'intitulés), 26 (le projet vit dans la prévision), 86-métier (le mois le plus bas se voit).
Baseline : horizon (3 mois ici ; 30 j = la première colonne ; 12 mois à dire au port : défilement horizontal des colonnes), ajouter une prévision, inclure projets (= poser), liste (= les blocs), comparer les mois (= les colonnes). Budget d'un brassin par le +.

## Honnêteté
Hauteurs proportionnelles aux montants de la fixture (400 = 110 px, 750 = 150 px pour tenir), « ~ » sur le brassin, hachures et « prix ? » pour l'idée, « Ventes prévues : aucune ». Le bloc de 60 porte son retard dans un cadre rouge et un mot.

## Boosters UX (boosters-ux)
- colonnes-mois — comparer ; trois colonnes empilées ; le bas de chaque colonne est la réponse.
- poser-achat — ajuster ; segments nov. / déc. / janv. / pas ; le bloc change de colonne, deux fins de mois changent (annexe).
- Statique (09.11) : les deux états sont dessinés côte à côte.
- B1 OK · B2 OK (les colonnes dominent ; un primaire) · B3 ~ (71 mots hors données, le plus près des 60 ; 6 éléments) · B4 OK · B5 non mesuré · B6 OK · B7 OK (bleu matériel assombri #3F63B8 pour 4,5:1 ; segment choisi en bleu finances) · B8 ~ (le « prix ? » hachuré ; pas d'état vide dessiné) · B9 s.o. · B10 OK · B11 OK (« janvier est le mois le plus bas, 2 107 ») · B12 ~ (blocs à 10 px, cartes à 16 px) · B13 OK (segments 28 px).

## Contrôles
PAGE OK · 1280 OK · COMMUN OK (les 6) · mots 71 · panel : remplissage 0,582.

## Tient / casse
- Tient : c'est la seule des trois qui montre les mois les uns à côté des autres, comme s5a ; la couleur parle avant les mots.
- Casse : un mois à 20 sorties ne tient plus en blocs lisibles ; 12 mois demandent un défilement horizontal.
