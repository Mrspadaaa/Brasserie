# p5j — Prévisions : trois mois (tiède)

Idée : le temps en trois colonnes larges (novembre, décembre, janvier) au lieu de 83 jours serrés. D'en haut, ce qui sort en tranches
étiquetées ; en bas, ce qui reste : bleu = sûr, vert hachuré = si les ventes rentrent. Sous zéro en janvier : ce qui manque sans vente.

## Ce qui change par rapport à p4a
- Les tranches sont larges : le nom, la date et le montant tiennent dedans. Le frigo occupe sa vraie part de novembre.
- Les deux réponses sont posées dans le vide que le frigo laisse.
- Les ventes font remonter la colonne suivante (pointillé vert entre deux mois).
- Dans la langue de g6 (blocs empilés, hachures) et de ses tuiles par mois.

## En une phrase (B11)
« Le frigo prend presque tout novembre ; en janvier il manque 892,66 sans vente, il reste 232,34 si elles rentrent. »

## Le métier dessiné (voir `../METIER.md`)
Deux lignes au lieu d'une : « sans vente » (plein) et « avec les ventes » (hachuré vert, exemple). Avec le frigo : − 892,66 le 25.01
sans vente, + 232,34 avec les ventes. Le prochain brassin : 64,26 (57,42 le 20.11, impôt 6,84 vers le 18.12).

## Honnêteté
Fixture : 4 181,60, atelier 60,00, loyers 400,00, brassin 64,26, fermenteur 750,00 (devis, janv.). Exemple, souligné en pointillé et
nommé une fois (« 0,00 : exemple », la convention de c3a) : frigo 3 000,00, marché 720,00 le 12.12, Pale Ale vendue 405,00 vers le 15.01.
« ~ » devant une date estimée. Le système de brassage, sans prix, n'entre dans aucun total.

## Boosters UX (boosters-ux)
- Boosters : `horizon` (choisir, segment) ; `compter` ou `avant-apres` (comparer, bascules ou deux cartes) ; le graphe (lire). Statique : rien de joué.
- B1 OK — chaque décision a son contrôle ; l'effet d'une bascule est dessiné seulement en mots (pas d'état à côté).
- B2 OK — un primaire (« Prévoir ») ; la réponse est le plus gros chiffre du graphe (20 px). Jugé sur la capture nette ; `-flou.png` produit, non regardé.
- B3 OK — 60 mots hors données (60 au plus) ; 4 blocs : titre et horizon, bascules, graphe, pied.
- B4 OK — une étiquette touche ce qu'elle nomme. B5 non mesuré.
- B6 ECHEC — 5 tailles au premier écran (12, 13, 14, 18, 20) pour 3 demandées ; rien sous 12 px (mesuré : 0).
- B7 OK — `controle-contraste` sans échec ; chaque couleur a son nom sur le graphe.
- B8 ~ — un seul état ; pas d'état « solde à confirmer ».
- B9, B10 s.o. (statique, aucune saisie). B11 : voir « En une phrase ». B12 OK — `controle-standard` sans échec.
- B13 lu au CSS, non mesuré : bascules et segment 28 px, primaire 32 px.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS 60 ·
COMMUN : couleurs, survol, blocs, contraste, standard, parlant, brutes OK. Captures ouvertes : `-haut`, `-1280`.

## Tient / casse
- Tient : trois regards, un par mois ; la part de chaque sortie.
- Casse : janvier montre deux mondes à la fois (le reste hachuré au-dessus de zéro, le manque dessous) ; la date exacte du passage sous zéro n'est qu'en mots ; pas d'état « sans le frigo ».
