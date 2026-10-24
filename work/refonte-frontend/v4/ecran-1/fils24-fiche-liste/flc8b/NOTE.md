# flc8b · les mots tamponnés, passe 2

- Chaleur : chaude (la forme de flc8 reste libre ; la baseline et le cadre g1 sont rétablis).
- Origine : flc8 (série c, v0), candidate n° 2 du conseil rapide (`conseil-fl/verdict.md`, point 2). flc8 reste intact.
- Houblon au premier écran : Nelson Sauvin. Les quatre autres se choisissent dans l'étape, derrière la feuille. C'est le seul facteur libre (`data-libre="houblon"`).
- Générateur : `flc8b/generer.mjs` (`--captures` refait les captures), sur le commun `flc1/commun-c.mjs`.

## Les retouches, et ce qu'on mesure sur la capture
| retouche du verdict | fait | mesure |
|---|---|---|
| les 10 cases « personne » en une ligne | une ligne « aucune fiche » : Floral ? Herbacé ? … (picto pâle, « ? ») | `flc8b-page.png`, Nelson Sauvin : 10 familles sur la ligne, aucune tuile hachurée |
| en-tête g1 | nom, stock en badge, « double usage », ✕ rond, α et sa jauge | `flc8b-nelson.png` |
| pied g1 | ♡ ⊘, Comparer, Styles › Huiles › Sources › Substituts › | `flc8b-page.png` |
| l'étape derrière la feuille | « ‹ Houblons 3/7 », « 16D hypothèse », la feuille à bord de 24 px par-dessus | `flc8b-nelson.png` |
| radar avant, à sa taille, étiqueté | rayon de 84 px sur toute la largeur (366 px de dessin), chaque axe porte sa famille et ses fiches (« Agrumes 1/2 », « Melon? ») ; placé avant les tuiles | capture : du haut 222 à 420 px CSS environ |
| tampons d'au moins 12 px | police à 12 px, « 16D » et « hors des 12 » aussi à 12 px | CSS `.flc8b-tp` |
| « lot 9,6 % hors de ses fiches » | gardé, avec le trait du lot en orangé sur la jauge | `flc8b-nelson.png` |
| un seul α, celui de g1, police du thème | plage de la fiche la plus récente, en gros (Source Sans, pas la mono) ; puis le lot | Nelson Sauvin : α 12–14 % (Hopsteiner 2025), lot 9,6 % ; Nugget : 11–14 %, lot 13 % |
| greffe : un picto par mot hors des 12 (M09) | **non faite** : pas de planche de pictos pour vin blanc, raisin, groseille ou fruité ; un picto inventé sans planche relirait M09 à l'envers. Elle attend une planche de pictos. | — |

En plus, pour G3 : la question « Que sent Nelson Sauvin, d'après ses 2 fiches ? » et la ligne de contexte « ta Stout 16D · houblon brut, avant tout moment ». La fiche décrit le cône, pas un moment de la bière.

## Chaque nombre, recompté sur les captures
Les comptes viennent de `pack-fiches.json`.
- **Nelson Sauvin** (`flc8b-nelson.png`, `flc8b-page.png`) :
  - α 12–14 % (Hopsteiner 2025) ; lot 9,6 %, sous la plage 10–14 % de ses deux fiches ; stock 100 g ; 2 fiches.
  - Radar : Agrumes 1/2 et Épicé 1/2, les 10 autres « ? ».
  - Tuiles : vin blanc, fruité, groseille à maquereau et raisin à 2/2 (BM 2023 et HS 2025), sauvignon blanc à 1/2 (BM 2023).
  - Agrumes 1/2 et Épicé 1/2 sont rangés par le fournisseur (HS 2025).
  - Aucune fiche pour 10 familles.
- **Nugget** (`flc8b-nugget.png`) :
  - α 11–14 %, lot 13 %, épuisé ; 4 fiches.
  - Radar : Résineux, Tropicaux, Floral et Herbacé à 2/4 ; Agrumes, Terreux et Épicé à 1/4.
  - Tuiles : herbacé 2/4 (BM 2023, HS 2025 rangé), floral 1/4 (HS 2025), géranium 1/4, terreux 1/4, boisé 2/4 (HS US ?, YCH ?), ananas 2/4 (BM 2023, HS 2025), agrumes 1/4, résineux 1/4, gingembre 1/4 (hors des 12).

## Ce qui tient, ce qui casse
- **Tient** : on retrouve le cadre g1 entier, et Nelson Sauvin reste « incroyable » en trois secondes : quatre tuiles pleine largeur, tamponnées deux fois, sous un radar presque vide qui le reconnaît.
- **Casse** :
  - Sur Nelson Sauvin, le radar pleine taille repousse les tuiles à mi-écran : seules trois tuiles et demie tiennent au premier écran.
  - Le choix du houblon déborde à droite (Cascade se découvre en faisant défiler).
  - 78 mots au premier écran, près du plafond de 80.

## Contrôles (flc8b seule, depuis la racine)
- G2 : `controle-commun.mjs … flc8b --page=etat.html --sans=mots` : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant et brutes sont OK. **COMMUN OK**.
- G3 : `controle-une-question.mjs … flc8b --page=etat.html` : « libres : houblon · contexte : base, moment ». **UNE-QUESTION OK (1 groupe libre : houblon)**.
- G4 : `mots-premier-ecran.mjs … flc8b --max=80 --page=etat.html --sans-donnees` : 78 mots hors données. **MOTS OK**.

## Captures
`captures/flc8b-nelson.png`, `captures/flc8b-nugget.png`, `captures/flc8b-page.png`.

Autres états : `-nugget-page`, `-cascade`, `-absolu`, `-legende`, et `-fiche-g1` (appui long réel sur Nelson Sauvin).
