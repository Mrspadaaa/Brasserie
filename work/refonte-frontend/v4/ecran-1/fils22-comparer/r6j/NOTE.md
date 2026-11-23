r6j · Les vraies valeurs d'abord (« une meilleur vu de comparaison sur des vrai valeur mais de manière un peu trop ostère » ; « pas de comparaison de houbon 1:1 »).

## Choix portés
- Radar : r2
- Base : effet égal (agrumes)
- Porte : non
- Descripteurs : B

Ce que la page en fait :
- **Radar r2** : un seul radar, le houblon mis en avant plein, avec la bande pâle de sa plage simulée (bas → haut). Les deux autres sont en contour, trait de 3.
- **Effet égal (agrumes)** : sur la ligne de contexte, « agrumes égaux ». La dose est un résultat écrit sur chaque carte, pas un réglage :
  - Cascade 4 g/L (la référence) ;
  - Idaho 7 ~7,5 g/L ;
  - Galaxy ~2,5 g/L.
  
  Le simulé est interpolé linéairement dans la grille (dry hop après fermentation, 3 j, US-05) entre les deux doses qui encadrent : 2–4 g/L pour Galaxy, 4–8 g/L pour Idaho 7.
- **Pas de porte** : Nelson Sauvin n'apparaît nulle part.
- **Descripteurs B** :
  - la bande d'arômes de chaque carte et de chaque fiche dessine une part grise « autres » (`data-role="autres"`, `data-part`). Seul Galaxy la montre : 29 %, cannabis et dank ;
  - la fiche (appui long) l'écrit en clair : « autres : cannabis, dank 29 % » ;
  - les génériques écartés, le seuil de 25 % et le plafond de 33 % sont dans la légende, avec « proposés par le pilote, à corriger par le brasseur ».

## Ce qui tient
- **L'angle, enrichi** : les vraies valeurs passent au premier écran, plus rien d'austère. Une colonne par houblon (la manière de w2), et sous chaque carte, cinq lignes de composés.
  - Les lignes : huile, linalol, géraniol, myrcène, 4MMP. Chaque ligne porte les pictos de ses familles (lien composé → famille de composes-houblon.json) : floral et agrumes pour linalol et géraniol, végétal et résineux pour le myrcène, tropical et baies pour le 4MMP.
  - Chaque cellule montre une barre de plage à l'échelle de la ligne et la plage écrite, à la couleur du houblon.
  - Chaque cellule porte `data-nature="mesure"` et `data-source`. La plage est l'enveloppe des sources « variété » (par exemple H2, hs-cas et H9 pour le linalol de Cascade).
  - Les thiols viennent d'une seule base comparable (Schmidt 2024, H11, LC-MS/MS).
  - L'inconnu se voit : le géraniol de Galaxy est hachuré et écrit « inconnu » (non publié par HPA). Le 4MMP d'Idaho 7, « <10? », est pâle (à confirmer, H11). Celui de Galaxy, « >10 », est ouvert à droite.
- **Ajouté à l'angle : le myrcène**. La stout est « trop résineuses » (dégustation du 18.10) : le marqueur du résineux devait être sous les yeux.
- **Ajouté : la lecture « dose »** (`data-lecture`, l'affichage seul change). Le calcul, écrit dans la légende :
  - charge = dose d'effet égal × huile × part ;
  - g/L × mL/100 g = mL/hL ;
  - × % / 100 × 10 = µL/L ;
  - µg/kg × g/L = ng/L.
  
  Les valeurs sont marquées « ≈ » et « Calculé », jamais `mesure`. Elles disent ce qui entre dans la cuve, pas ce qui reste en bière. Ce qu'elles apprennent : à agrumes égaux, Idaho 7 charge le plus de géraniol (≈0,38–2,3 µL/L contre ≈0,02–0,52 pour Cascade), mais aussi le plus de myrcène (≈30–124).
- **La réponse en une phrase, calculée** sur le simulé (plus grand gain floral, plus grand gain résineux) : « Plus floral, Idaho 7, mais plus résineux ~ ». Les vraies valeurs à ta dose disent la même chose : on peut y croire, sans plus (plages larges).
- **Le simulé ensuite**, mêmes colonnes, en barres de l5b :
  - les trois familles attendues par la 16D (floral, herbacé, terreux) en gras et en tête, puis tropicaux et baies ;
  - zone de la 16D en pâle, trait noir pour ta stout avant, barre avant → après, trait fin pour la plage (bas–haut) ;
  - orangé au-dessus de la 16D (Galaxy en tropicaux ; Idaho 7 en baies) ;
  - le résineux, « déjà hors », montre seulement ce que chaque houblon ajoute ;
  - au style par défaut, absolu à un toucher.
  
  Les agrumes sont retirés des lignes : égaux par construction, ils sont dans le contexte.
- **Radar r2** (`data-acquis="radar"`) :
  - 12 axes, dans l'ordre de la base v4.9 ;
  - zone de la 16D, ta stout avant en trait noir ;
  - le houblon mis en avant plein, avec sa plage ;
  - un dépassement est marqué d'un point orangé ;
  - l'inconnu du houblon mis en avant est hachuré, avec « ? » sur l'axe : pépins et melon pour les trois, noyau pour Cascade.
- **Panel OSU** (`data-acquis="osu"`, mesuré, H22) :
  - sans molette : les courbes agrumes et herbacé/thé de 0 à 16 g/L, la zone 4–8 g/L ;
  - un trait par houblon à sa dose d'effet égal ;
  - « Cascade seulement » et « Idaho 7, Galaxy : courbe non mesurée ».
- **En bière, mesuré**, à un toucher (`data-acquis="valeurs"`, `aria-controls`) :
  - Cascade : linalol 56,9 µg/L et géraniol 82,8 µg/L (H12), 3MH 67–141 ng/L et 4MMP 5,8–10,4 ng/L (H20) ;
  - Idaho 7 : linalol 38 ± 13 µg/L (E03, à vérifier) ;
  - Galaxy : « aucune mesure chiffrée en bière ».
  
  Suivent la phrase « ces points ne se classent pas entre eux » et la liste des sources du cône.
- **Baseline gardée** :
  - α en tête (le lot ; Galaxy « 17,2%≠ », hors de ses fiches 11–16 %), puis le rôle en mot (« mixte » souligné en pointillé : déduit de l'α, à valider), les arômes en couleur, les pictos au trait et la dose ;
  - le stock en icône seulement (Cascade et Galaxy, α « fiche de stock ») ;
  - la légende derrière « ? » ;
  - l'appui long (ou le survol de 800 ms) ouvre la fiche g1 courte : α du lot et des fiches, rôle, bande d'arômes avec « autres », silhouette, familles « n/m fiche », « 9 non décrites (inconnu, pas zéro) », aimer / exclure.
- **Un seul facteur libre** : les trois cartes (`data-libre="houblon"`). Un toucher met un houblon en avant : radar plein, pont « Doser <houblon> dans Dryhopper ».

## Ce qui casse
- Le premier écran est à 79 mots sur 80. Pour tenir, plusieurs choses ont été retirées :
  - l'unité « % huile » (devenue un « % » collé à la valeur, expliqué dans la légende) ;
  - « Stout » dans le contexte (le titre le dit) ;
  - les nombres du résineux ;
  - la ligne agrumes.
- Le radar r2 au style est chargé : la plage simulée du houblon en avant couvre presque tout. C'est honnête (« il faut que ça se voie »), mais les trois contours se lisent mieux que la bande.
- Les plages du simulé (traits fins) se recouvrent toutes : la réponse en une phrase repose sur les centres. Le « ~ » le dit, pas plus.
- La lecture « dose » multiplie des plages indépendantes. Le linalol de Cascade y couvre ×31.
- Le % d'huile est une aire GC, pas un volume : la charge en µL/L est un ordre de grandeur (écrit dans la légende).
- Rôle « mixte » d'Idaho 7 et de Galaxy : règle v1, à valider. Galaxy 17,2 % est hors de ses fiches (signalé par r6e).
- Couleur d'Idaho 7 : bleu pétrole (#17659a) au lieu du rouge du lot 21 (#e80030). Le rouge se confondait avec le bordeaux de Cascade sur le radar. À aligner si le pilote garde le rouge ailleurs.
- `data-valeurs` du radar : un axe inconnu y vaut 0 (le contrôle exige un nombre) ; `data-inconnu` le dit et le dessin le hachure.
- Le stock d'Idaho 7 n'est pas montré : α « lu sur l'article », sans quantité.

## Contrôles (22.10, sur `etat.html`)
- COMMUN OK (sans MOTS) : COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT et BRUTES OK.
- MOTS OK (79 mots, 80 au plus).
- UNE-QUESTION OK (1 groupe libre : houblon) ; contexte : bière, base, moment, levure.
- ACQUIS OK (4/4) : radar, chimie et OSU au repos, valeurs à un toucher.
- ALPHA OK (3 houblons).
- SANS-FAMILLE OK au seuil de 0,25 (Galaxy 29 %).

**Pire contraste** : 4,96:1, « agrumes » (ton texte de la famille) dans la légende du panel OSU, sur 86 textes mesurés.

## Fichiers
- `generer.mjs` écrit `etat.html`. Il lit `donnees/comparer-stout.json`, et dans composes-houblon.json seulement les titres des sources et les liens composé → famille. Il emprunte les pictos et les icônes au socle de v1 (l8g).
- Captures :
  - `captures/r6j-390.png`, `r6j-premier-ecran.png` ;
  - `r6j-fiche-390.png` (appui long sur Galaxy) ;
  - `r6j-toucher-390.png` (Idaho 7 en avant, « En bière » ouvert) ;
  - `r6j-dose-390.png`, `r6j-legende-390.png`.
