# p5l — Prévisions : l'escalier et ses pistes (chaude)

Idée : l'escalier de p4a reste **nu** (deux chiffres seulement). Dessous, une piste par nature sur le même axe de temps : Atelier,
Matériel, Brassin, Loyer, Ventes. Chaque marche de l'escalier a la couleur de sa piste ; la piste donne le montant et la date. Les
étiquettes ne se chevauchent plus parce que deux sorties proches ne sont jamais sur la même piste.

## Ce qui change par rapport à p4a
- L'info est sur le graphe, mais rangée : à gauche, le total de chaque piste répond seul (« Brassin 64,26 », « Loyer 3 × 400,00 »).
- La piste Brassin montre le cycle : acheté le 20.11, impôt vers le 18.12, vendable vers le 15.01.
- La piste Loyer dit « à payer », « prévu », et laquelle des échéances passe sous zéro.
- Le système de brassage (idée, sans prix) a sa place sur la piste Matériel.

## En une phrase (B11)
« − 892,66 sans vente, à sec le 25.01 ; + 232,34 avec les ventes ; le brassin coûte 64,26 et le frigo est la grande marche du 15.11. »

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
- Tient : le temps reste proportionnel, comme dans p1b ; rien ne se chevauche ; chaque question a sa piste.
- Casse : il faut descendre de l'escalier à la piste par la couleur ; le passage sous zéro est petit sur le graphe (36 px de haut).
