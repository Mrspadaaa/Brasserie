r6f · Même amertume, quel arôme ? (Comparer à IBU égal : 10 IBU à 10′, stout 16D, 20 L, US-05).

## Choix portés
- Radar : r2
- Base : IBU égal
- Porte : non
- Descripteurs : B

## Ce que j'ai fait de l'angle
- **La dose est le résultat.** Chaque carte donne la dose qui fait 10 IBU à 10′ : Cascade 42 g (2,1 g/L), Idaho 7 22 g (1,1 g/L), Galaxy 16 g (0,8 g/L), d'après `egalites.ibuEgal`.
- **J'ai ajouté l'huile mise en cuve** : dose × huile totale des fiches. On obtient Cascade 1,5–5,2, Galaxy 1,5–4,1 et Idaho 7 1,1–2,2 mL/hL. Le brasseur voit d'un coup ce que l'IBU égal cache : Galaxy met 2,6 fois moins de houblon que Cascade, mais autant d'huile. Idaho 7 en met deux fois moins.
- **Le radar montre l'apport**, pas la bière entière : ce que chacun ajoute à ta stout, ~ simulé, en crans de ta 16D (au style) ou en points (absolu). La bière de base porte un pic résineux commun aux trois ; il écrasait les silhouettes et ne dit rien du choix.
- **L'intervalle est propre à l'angle.** La bande pâle donne la même chose pour un lot au bas et au haut de l'α de ses fiches : un α plus bas demande plus de houblon, donc plus d'arôme. Pour Galaxy, l'α du lot (17,2 %) sort de ses fiches (11–16 %) : toute sa bande est au-dessus de son trait.
- **Le verdict est honnête** : « ≈ même nez à 10 IBU ». Tous les écarts entre les trois restent sous le seuil d'écart du style (un quart de bande, `echelle.parFamille.seuilEcart`). Le plus grand est le tropical : Galaxy +9,0, Idaho 7 +2,9 points, soit 6,1 points contre un seuil de 7,5. La leçon pour le brasseur : à 10′ et 10 IBU, le choix ne se joue pas au nez. Le pont ouvre donc Dryhopper avec le houblon mis en avant.
- **Sa demande, tirée de la dégustation du 18.10** (« trop résineuse, je la veux plus floral »), est dans les barres : floral ↑ et résineux ↓ en tête, et « déjà au-dessus de ta 16D » en orangé. Dans le radar, la zone de la 16D (la place qui reste) fait une encoche à Résineux, écrit en orangé.

## Ce qui tient
- Premier écran : la question, une ligne de contexte fixée (Stout 16D, 20 L · +10 IBU · 10′ · US-05) et trois cartes. Chaque carte donne, dans l'ordre, le nom, l'α du lot (≠ s'il sort des fiches), le rôle en mot (pâle s'il est déduit de l'α), les grammes puis les g/L, la barre des mots des fiches au code couleur avec ses trois pictos, et l'huile en cuve. Viennent ensuite la lecture (Radar | Barres, Au style | Absolu), le verdict ~ simulé et le radar r2. On compte 78 mots.
- Seul facteur libre : la variété. Toucher une carte la met en avant : elle devient pleine sur le radar avec sa bande, ses barres sont pleines, et elle part au pont. L'appui long ouvre la vraie fiche g1.
- **Barres de l5b** (Radar | Barres, la variante 3 de Comparer) : une piste par famille, trois barres de houblon, moustache de l'α des fiches, zone pâle de ce que la 16D laisse encore. Un inconnu est hachuré, jamais zéro ; melon et pépins sont inconnus pour les trois, et Noyau pour Cascade.
- **Les quatre acquis** : le radar au repos ; la chimie, le panel OSU et les vraies valeurs à un toucher.
  - **Chimie « dans le cône »** : six composés, chacun avec le picto de sa famille et la source par cellule. Les manques s'écrivent « inconnu » ou « non détecté » (Galaxy : géraniol, 3MH).
  - **Panel OSU** (H22) : sans molette ; la dose de Cascade à 10 IBU y est marquée, avec « ici à cru 24 h, pas à 10′ ».
  - **Vraies valeurs à la manière de v1** : α, β et huile, en barres sur une même échelle, avec le trait de l'α du lot et chaque source avec son année.
- **Option B** : la carte Galaxy porte une part grise « autres » de 29 % (cannabis, dank). La fiche de Galaxy la reprend : la ligne « sans famille » y devient la barre et « autres 29 % cannabis, dank ». La légende dit les réglages : mots trop vagues écartés, seuil 25 %, plafond 33 %, « proposés par le pilote, à corriger par le brasseur ». Cascade et Idaho 7 n'ont pas de part « autres » ; la fiche de Cascade dit « mot trop vague, écarté : fruité ». Nelson Sauvin n'est pas montré (porte : non).
- **Écart à la base v4.9** : le radar trace l'apport simulé, plus les citations des fiches, et la bande vient de l'α des fiches, plus de leur accord. Les cartes remplacent les bandes d'IBU, puisque l'IBU est le facteur fixé. Le stock n'est montré que dans la fiche (icône) : `comparer-stout` n'a pas de quantité en stock, seulement « α de la fiche de stock ».

## Ce qui casse
- Cascade et Galaxy (bordeaux et violet, les couleurs des lots 20–21) se distinguent mal en contour sur le radar ; le houblon plein aide.
- À 10 IBU, tous les apports sont faibles (moins d'un cran) : le radar a dû passer à une échelle de 0 à 1,1 cran, et la bande de Galaxy en tropical touche le bord.
- La dose d'IBU égal sort d'un taux d'utilisation fixe (`ibuParGramme`, 20 L, DI 1,066, 60 min) ; aucune incertitude sur l'IBU lui-même.
- L'apport à 0,81 g/L (Galaxy) est interpolé entre 0 et 1 g/L : sous la grille, la forme est supposée linéaire.
- Le panel OSU parle d'un dry hop, pas d'un ajout à 10′ : il est montré pour la forme dose → nez, et le dit.
- Correspondance composé → famille : ce sont des constantes du générateur, reprises de `composes-houblon.json` (familles, « sens seulement »), qui n'est pas dans `comparer-stout`.
- Option A : sans effet ici, puisque seul Nelson Sauvin change et qu'il n'est pas montré.

## Contrôles (GATES.md de la voie)
- COMMUN OK (sans MOTS) ; MOTS OK (78 ≤ 80) ; UNE-QUESTION OK (1 groupe libre : houblon) ; ACQUIS OK (4/4 : radar au repos ; chimie, osu, valeurs à un toucher) ; ALPHA OK ; SANS-FAMILLE OK au seuil 0,25 (Galaxy 29 %).
- Pire contraste : 5,69:1, « Barres » (bouton de lecture non choisi).

## Fichiers
- `generer.mjs` (écrit `etat.html`) ; `captures.mjs` (écrit `../captures/r6f-*.png`). Requêtes : `?focus=Galaxy`, `?abs`, `?vue=barres`, `?ouvre=chimie|osu|valeurs`, `?legende`.
