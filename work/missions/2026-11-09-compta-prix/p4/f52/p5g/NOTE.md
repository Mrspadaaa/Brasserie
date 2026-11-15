# p5g — Prévisions : le socle (froide)

Idée : garder l'escalier de p1b et de p4a, mais **un seul chemin**. Le frigo n'est plus un second escalier : c'est un socle de 3 000
posé au sol, que l'escalier doit franchir. Là où il s'y enfonce (25.01), le creux est rouge : il manque 892,66.

## Ce qui change par rapport à p4a
- Un chemin au lieu de deux ; plus de pastilles numérotées ni de liste : chaque marche porte son montant et son nom, sa date est dessous.
- **Une marche par sortie, de largeur égale** (pas un jour = un pixel) : c'est ce qui laisse la place aux étiquettes. Les dates sont écrites.
- Les deux cartes de p1b gardées (sans / avec le frigo). Le prochain brassin est une étiquette dans le vide du graphe.
- Les ventes attendues : une barre hachurée qui remonte le dernier palier (+ 1 125,00), pas un second chemin.

## En une phrase (B11)
« Avec le frigo je passe sous son socle le 25.01, il me manque 892,66 ; avec les ventes il reste 232,34. »

## Le métier dessiné (voir `../METIER.md`)
Deux lignes au lieu d'une : « sans vente » (plein) et « avec les ventes » (hachuré vert, exemple). Avec le frigo : − 892,66 le 25.01
sans vente, + 232,34 avec les ventes. Le prochain brassin : 64,26 (57,42 le 20.11, impôt 6,84 vers le 18.12).

## Honnêteté
Fixture : 4 181,60, atelier 60,00, loyers 400,00, brassin 64,26, fermenteur 750,00 (devis, janv.). Exemple, souligné en pointillé et
nommé une fois (« 0,00 : exemple », la convention de c3a) : frigo 3 000,00, marché 720,00 le 12.12, Pale Ale vendue 405,00 vers le 15.01.
« ~ » devant une date estimée. Le système de brassage, sans prix, n'entre dans aucun total.

## Boosters UX (boosters-ux)
- Boosters : `horizon` (choisir, segment) ; `compter` ou `avant-apres` (comparer, bascules ou deux cartes) ; le graphe (lire). Statique : rien de joué.
- B1 OK — chaque décision a son contrôle ; l'effet d'une bascule est dessiné (état « sans le frigo » à côté).
- B2 OK — un primaire (« Prévoir ») ; la réponse est le plus gros chiffre du graphe (20 px). Jugé sur la capture nette ; `-flou.png` produit, non regardé.
- B3 OK — 59 mots hors données (60 au plus) ; 4 blocs : titre et horizon, bascules, graphe, pied.
- B4 OK — une étiquette touche ce qu'elle nomme. B5 non mesuré.
- B6 ECHEC — 5 tailles au premier écran (12, 13, 14, 18, 20) pour 3 demandées ; rien sous 12 px (mesuré : 0).
- B7 OK — `controle-contraste` sans échec ; chaque couleur a son nom sur le graphe.
- B8 ~ — état « sans le frigo » dessiné ; pas d'état « solde à confirmer ».
- B9, B10 s.o. (statique, aucune saisie). B11 : voir « En une phrase ». B12 OK — `controle-standard` sans échec.
- B13 lu au CSS, non mesuré : bascules et segment 28 px, primaire 32 px.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS 59 ·
COMMUN : couleurs, survol, blocs, contraste, standard, parlant, brutes OK. Captures ouvertes : `-haut`, `-1280`.

## Tient / casse
- Tient : la réponse se lit sans comparer deux courbes ; le creux rouge est large parce que les marches sont égales.
- Casse : le temps n'est plus proportionnel ; les ventes ne sont qu'à la fin (on ne voit pas quand elles rentrent) ; le coin haut gauche reste chargé (trois étiquettes).
