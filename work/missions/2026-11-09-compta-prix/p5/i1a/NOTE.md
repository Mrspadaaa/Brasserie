# i1a — Impôt bière de l'année, froid : le total, puis chaque brassin sur sa bande

Chaleur : **froide** (la baseline « total + liste des brassins », dans la langue de p2b).
Idée : le total de l'année en tête (256,00 – 260,49 CHF, taux plein), découpé sur une barre aux trois bandes du barème (légère 33,76 · normale 156,98 · forte 60,77 · hachures « densité à noter » 4,49 – 8,98) ; dessous, chaque brassin porte la pastille de sa bande et son impôt.

## Ce qui est montré
- Clients › Impôt bière · année « 2026 ⌄ » (le sélecteur d'année de la baseline, en pilule).
- Carte réponse : 1 026,6 L · 6 brassins · « taux plein » ; barre empilée aux proportions des litres ; légende qui nomme chaque couleur.
- Par brassin : 6 lignes (pastille, nom, °P · L, impôt, ›) ; la Pale Ale de septembre hachurée, « densité à noter », 4,49 – 8,98 ; « janv. – août : exemple ».
- Quand (régime annuel) : déclarer 20 janv. 2027, payer 30 janv. 2027 · À qui : OFDF, par Taxas · réduction petit brasseur : à confirmer ›.
- Comprendre le barème ⌄ · liens Taxas, Directives OFDF · primaire « Copier pour Taxas » (bleu finances).
- Annexe : la ligne « Pale Ale de septembre » touchée ouvre **sa feuille p2b, telle qu'il l'a choisie**, fil « ‹ Impôt bière 2026 ».

## Problèmes de l'inventaire
12 (la « réserve » reliée : quand, à qui), 13 (le total dit « taux plein », la densité manquante reste une fourchette), 14 (un seul barème, celui de `BAREME_IMPOT_BIERE`, dessiné en bandes). Baseline gardée : année, total, liste, réduction, Comprendre, Copier, Taxas, Directives.

## Honnêteté
Pale Ale de septembre : fixture (26,6 L conditionnés, densité absente → 4,49 – 8,98, jamais 0). Brassins de janvier à août : « exemple », marqués sous la liste. Taux plein dit ; réduction « à confirmer ». Dates déduites de la règle 20 j / 30 j « si régime annuel ».

## Boosters
total-bandes (barre empilée + légende), pastilles de bande sur les lignes, hachures = inconnu.
B1 OK · B2 OK (le total domine ; un primaire) · B3 OK (58 mots hors données, lignes exclues) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (hachures nommées) · B9 s.o. · B10 OK · B11 OK · B12 OK · B13 OK (lignes 44 px, pilule 28 px, primaire 32 px).

## Contrôles
PAGE OK · 1280 OK · MOTS 58 · PANEL OK (série) · COMMUN OK (couleurs, survol, blocs, contraste, standard, parlant, brutes). Statique.

## Tient / casse
Tient : c'est l'écran d'aujourd'hui, mais la barre dit d'un coup d'où vient l'impôt et chaque ligne ouvre p2b. Casse : au-delà de 8 brassins, la liste pousse Quand / À qui sous le pli.
