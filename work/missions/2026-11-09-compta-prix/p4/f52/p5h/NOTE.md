# p5h — Prévisions : le plafond (tiède)

Idée : retourner la question. Ce qui sort **s'empile** en couches, chacune commence à sa date et court jusqu'à fin janvier ; le trait
noir est ce que j'ai (4 181,60). Si la pile dépasse le trait, il manque : 892,66. Le pointillé vert est le plafond avec les ventes.

## Ce qui change par rapport à p4a
- Les étiquettes sont **dans** les couches (une couche est large : la place ne manque plus), le frigo se voit à sa taille.
- Le prochain brassin est nommé une fois (64,26), relié à ses deux couches fines par un trait brun.
- Pas de second chemin : sans le frigo, sa couche disparaît et tout descend.

## En une phrase (B11)
« Ce qui sort d'ici fin janvier dépasse ce que j'ai de 892,66, surtout à cause du frigo ; avec les ventes ça passe de 232,34. »

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
- B3 OK — 58 mots hors données (60 au plus) ; 4 blocs : titre et horizon, bascules, graphe, pied.
- B4 OK — une étiquette touche ce qu'elle nomme. B5 non mesuré.
- B6 ECHEC — 5 tailles au premier écran (12, 13, 14, 18, 20) pour 3 demandées ; rien sous 12 px (mesuré : 0).
- B7 OK — `controle-contraste` sans échec ; chaque couleur a son nom sur le graphe.
- B8 ~ — un seul état ; pas d'état « solde à confirmer ».
- B9, B10 s.o. (statique, aucune saisie). B11 : voir « En une phrase ». B12 OK — `controle-standard` sans échec.
- B13 lu au CSS, non mesuré : bascules et segment 28 px, primaire 32 px.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS 58 ·
COMMUN : couleurs, survol, blocs, contraste, standard, parlant, brutes OK. Captures ouvertes : `-haut`, `-1280`.

## Tient / casse
- Tient : le poids de chaque sortie se compare d'un regard ; la réponse est au croisement du trait.
- Casse : l'escalier est à l'envers de celui qu'il a aimé (il monte) ; le temps n'occupe que la moitié gauche ; pas d'état « sans le frigo » dessiné.
