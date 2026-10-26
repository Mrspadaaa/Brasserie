# Critique de la page de choix m5 (Dryhopper : amertume à froid, hop creep, limites)

Critique calibrée sur le portrait v2 (`fils21-choisir/critique/PORTRAIT.md`), non étalonnée sur ce genre de page (L27) :
je signale et je classe, je ne rejette rien ; tout lui est montré. Regardé : les 9 captures de `img/`, les recadrages de la
zone (`%TEMP%/m5/zoom-*.png`), la page rendue à 390 et 1280 px (`PAGE OK`), `capturer.mjs` (tailles, fonction `plage()`),
`fidelite.json` et `x1-amertume-creep/RESULTAT.md`.

## Ce qui tient pour toutes
- **Sa zone est respectée** : chaque ajout est dans le rectangle qu'il a barré (x 19–202 sous la bande IBU), rien d'existant
  n'est caché (`FIDELE OK`, 348 → 348 nœuds). Le rail descend de 10 à 18 px, les 12 familles restent au-dessus du pied.
- **Aucun chevauchement** à 390 px : les puces de la 2ᵉ rangée (B, C) finissent à x ≈ 165, « possible, non chiffrée » commence
  à x 204 ; en D les pictos sous les colonnes (y ≈ 462) restent au-dessus du rail (y ≈ 482) ; en F la bande « creep moyen »
  est entre la légende et le rail, sans toucher ni l'une ni l'autre.
- **Aucune valeur fausse ni inventée** : 22 / 28 / 34 = 22,3 / 27,9 / 34,0 arrondis ; plein 22,3–26,3 (Cascade seul), hachuré
  jusqu'à 34,0 (vérifié dans `plage()` : deltas −5,6/−1,6 et −5,6/+6,1 autour du centre) ; limites 20,6/5, 13,5/5, 27,5/30,
  24,4/30 = x1. « moyen » est la convention de x1, pas un chiffre publié ; il n'est jamais rendu par un nombre : correct.
  L'ampleur du creep pour ce brassin reste « ? » : honnête (D65, D94).
- **Pas de cockpit** : 5 à 8 mots ajoutés au premier plan, sources et ordres de grandeur à un toucher
  ([[pas-de-cockpit]]). L'écran de HEAD est déjà à 98 mots (a2 : rouge sur HEAD pour 96) ; aucune variante n'aggrave
  vraiment, mais aucune ne répare.
- **Texte petit** : tout ce qui est ajouté est à 12 px (puces, chiffres mono, étiquettes grises de D) ou 13 px (E). C'est
  le plancher des pictos (« lecture à 12 px »), et plus petit que les légendes voisines du graphe (« levure active », ≈ 15 px).
  Lisible sur la capture ×2 ; au téléphone, D est celle qui le sent le plus.

## Classement (de la meilleure à la moins bonne)
1. **D · trois mini graphes** — la seule qui répond à ses trois mots sans un mot de plus : la plage à cheval sur le 28 dit
   « on ne sait pas si ça monte, Cascade seul fait baisser », la jauge dit « moyen », quatre colonnes disent qui passe la
   ligne (portrait § 1.2 : « Les bar de ce type sont plus informative donc meilleur »).
2. **B · trois puces** — son propre exemple, lisible en trois secondes, en mots ; moins riche que D (« ±6 » cache que
   Cascade seul fait baisser).
3. **F · le creep sur la frise** — la bonne idée de placement (le creep sur « après », à côté de « levure finie »), mais
   la bande orange flotte comme une étiquette d'alerte posée là ; le reste est B sans sa puce.
4. **E · en légende du dessin** — propre et dans le ton des légendes grises, mais c'est trois lignes de texte : la moins
   visuelle ; « à froid 22–34 » demande de deviner que c'est l'amertume.
5. **C · pastilles d'alerte** — la gravité par la couleur se lit, mais « amer ±? » ne dit rien, et les pictos blanchis sur
   orange perdent leur couleur de famille (D33 ter / D40 ter : une case de famille porte la couleur des arômes, pas l'alerte).

## Par variante : ce qu'il dirait, et le défaut à corriger avant de montrer
- **A · l'actuel** — référence, identique à sa capture (`a2/img/sans-visee-dryhopper.png`, mêmes valeurs, ★ comprise). Rien.
- **B · trois puces** — « pas mal, simple, mais ±6 ça me dit pas si ça monte ou si ça descend ». Défaut : « ±6 » est
  symétrique alors que Cascade seul donne −5,6 à −1,6 et que le + vient des essais Centennial ; écrire « 28 → 22–34 »
  (ou la plage de D) plutôt que « ± ». Non bloquant.
- **C · pastilles d'alerte** — « amer ±? c'est quoi ça ??? et les pictos en blanc on les reconnaît plus ». Défaut **à
  corriger avant de montrer** : « ±? » est un symbole vide (D94 « très difficile à comprendre ») : y mettre la plage
  « 22–34 » ; garder les pictos dans leur couleur de famille et porter l'alerte par le fond ou la bordure seuls.
- **D · trois mini graphes** — « D vachement bien, la plage autour du 28 c'est parlant, les colonnes aussi, mais les
  petits mots gris et les pictos sont petits ». Défauts, non bloquants : étiquettes « amer ? / creep / limite » à 12 px
  gris clair (`--cave-400`), les plus pâles de l'écran : passer à 13 px et au gris des légendes voisines ; « moyen » en
  orange d'alerte alors que RESULTAT dit réserver l'orange à ce qui dépasse (choisir une teinte intermédiaire ou le noir).
- **D · ouvert au toucher** — « très bien, il y a les intervalles et la source » (portrait § 3.4). Défaut, non bloquant :
  la feuille « Amertume » fait ≈ 50 mots (D73 : 45 sur une fiche) ; la phrase « 27,9 à chaud → Cascade 22,3 à 26,3 (−5,6 à
  −1,6) ; avec Centennial 22,3 à 34,0 (jusqu'à +6,1) » répète ce que la plage légendée montre déjà : garder les nombres,
  retirer la répétition. Les feuilles Hop creep et Limites sont justes et courtes.
- **E · en légende du dessin** — « ok, mais c'est du texte, D le montre mieux ». Défaut : « à froid » sans « amer » ni
  « IBU » : écrire « amer à froid » ; sinon rien à corriger.
- **F · le creep sur la frise** — « le creep sur après c'est logique, mais pourquoi il y a un truc orange qui flotte là ? ».
  Défaut, non bloquant : la bande hachurée bordée se lit comme une étiquette d'alerte « sortie de nulle part »
  (portrait § 4) : la poser sur le segment « après » du rail lui-même (même hauteur que le rail, sans bordure), ou la
  fondre dans la frise comme la bosse de levure.

## Greffes
- La bande du creep sur « après » (F) → D, à la place de la jauge, ou en plus (le concepteur le propose déjà).
- Le mot « moyen » à côté de la jauge (B) → déjà en D ; garder.
- « 28 → 22–34 » en chiffres (E, D) → B et C, à la place de « ±6 » et « ±? ».
- La gravité par la couleur de fond (C) → les colonnes de D la portent déjà (orange = dépasse) ; ne pas étendre à « moyen ».

## Défauts bloquants
- **C** : « amer ±? » (symbole vide) et pictos blanchis. À corriger avant de montrer ; la variante reste dans la page.
- Aucun autre : pas de chevauchement, pas de valeur fausse, pas de cockpit.

Ce que je ne sais pas : le geste (un toucher ouvre la feuille) n'est vu qu'en capture fixe pour D ; B, C et E disent
s'ouvrir sans capture ouverte. Et sa tolérance aux 12 px gris de D au téléphone : à voir sur l'appareil.
