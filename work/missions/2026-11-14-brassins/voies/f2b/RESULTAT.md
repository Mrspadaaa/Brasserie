OK — 4 bloquants de c4b corrigés (s6c, s7a, s7c), 26 non bloquants, 20 images refaites

## Bloquants (VERDICT c4b)
- [x] s6c n° 1 : « ébullition » et « WP » grisés, hachurés, `aria-disabled`, colonnes rétrécies ; seuls « actif » et « après » restent vifs. Aucune coche, parce que la recette du lot ne dit rien d'un houblon d'ébullition ou de WP (règle s7a n° 3).
- [x] s6c n° 2 : « FG 1,010–1,014 » est placé à gauche de J+5 (fin à x 228). Les traits J+5 et J+6 s'arrêtent sous la bande, et plus rien ne passe sur le texte.
- [x] s7a n° 1 : la pastille « stable » occupe sa propre ligne (inline-flex, 36 px) et contient les 3 cases et « 0/3 ». Le « / » orphelin, qui était le « 0/3 » débordant, a disparu.
- [x] s7c n° 1 : « ↑ 1,058 · J+1 » est passé à droite du trait (x 96) et « 1,018 » sous le trait, à gauche du point. Le trait J+5 commence sous l'étiquette.

## Non bloquants faits (une ligne de CSS ou de texte)
- s6c : 3 picto Citra sur J+5 marqué « fait » au geste ; 4 toast « Stock Citra −100 g · Annuler » ; 5 pistes grises jusqu'à 5 sous les barres d'arômes ; 6 bande FG à l'échelle de la courbe (1,014 à 1,010) ; 7 retour de 44 px et pied « Mesurer / Note » en vrais boutons avec icône ; 8 « éch. 20,5 °C » ; 9 fond « actif » limité à sa fenêtre, en aplat plein ; espaces fines (« 100 g », « 10–16 % », « 1 j »).
- s7a : 2 titre « Repos 21 °C lundi · garde dès que stable » ; « Dry hop fait · 14.11 » espacé ; 3 onglets passés grisés, sans coche ; 4 « hier 1,018 · éch. 20,5 » ; 5 J+9 retiré de l'axe ; 7 « Replanifier » à côté de « Brasser » (1280).
- s7c : 2 « + densité » et « Relever » sur les cadrans ; 3 ligne 1,030 coupée avant le gros 1,018 ; 4 critère « stable : 3 relevés à ±0,001 » sous les cases ; 5 « +2 » sur Mosaic et « Ajouté auj. » sur les deux tuiles ; 6 toast en bas, en-tête gardé ; 8 cave dessinée (`s7c-repos-390-cave.png`).
- s6a : 3 « décaler le plan » devant −1 j / +1 j ; 5 espaces fines ; 6 « taper la valeur » sous 1,016 ; 7 « 6 j de retard » au lieu de « −6 j », en-tête « 2 en cours · 1 à brasser ».
- s6b : 5 « 3 relevés à ±0,001 dans la bande » ; espaces fines.
- s7b : 3 « provisoire » en ligne de texte, sans pastille ; 4 « ? » insécable ; 6 LOT-019 dans l'en-tête.

## Non faits (plus qu'une ligne, ou un choix de goût)
- s6a 1, 2 et 8 ; s6b 1 à 4 et 6 à 8 : composition de la colonne, voie FG, 1280 à remplir. Le double tiret de s6b n° 8 n'a pas été retrouvé dans le code.
- s6c : aucun.
- s7a 6 : remplir le bas du 1280 (mise en page).
- s7b 1, 2, 5, 7, 8 et 9 : axe, rythme, choix d'une teinte, liste, pied, repère.
- s7c 7 : la feuille m2 depuis la tuile Cuve est à dessiner. s7c 8 : le 1280 n'est pas dessiné.
- Les doutes de c4b (cave et 1280 des deux meilleures par série) restent ouverts. Seul s7c a gagné une cave.

## Fichiers
- `f2b/corriger.mjs` et `f2b/corriger2.mjs` : remplacements exacts, chacun vérifié (`CORRIGER OK`, `CORRIGER2 OK`). `f2b/planche.mjs` : planches de contrôle, écrites dans le dossier temporaire. Copie d'avant : `%TEMP%/f2b-avant/`.
- Modifiés : `s6/s6a|s6b|s6c/etat.html` ; `s7/s7a|s7b|s7c/source.html` et `etat.html` (assemblés par `faire.mjs`) ; toutes les PNG de s6 et s7.

## Critères (`tests.txt`)
G1 COCHE OK 4 · G2 IMAGES OK · G3 HORS OK. Autres sorties :
- `controle-panel` : 19 captures, PANEL OK ;
- `faire.mjs` : cibles < 44 px à 0 sur les 10 captures s7.

## Captures (toutes ouvertes, seules ou en planche)
- s6c-repos et s6c-geste ;
- s7a-repos (390 clair et cave, 1280) et s7a-geste ;
- s7c-repos (clair et cave) et s7c-geste ;
- s6a : repos, geste et liste ;
- s6b : repos (clair et cave, 1280) et geste ;
- s7b : repos, geste et liste.

Prédiction : « Là c'est propre, plus rien ne se marche dessus ; s7c et s7a, je regarde. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un `display:revert` sur une classe d'état (`.x-g2`) écrase le `display` de son composant (pastille inline-flex rendue inline, contenu débordé). Au basculement d'état, donner le `display` du composant, pas `revert`.
