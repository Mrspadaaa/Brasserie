OK — Comparer à IBU égal (10 IBU à 10′) : dose résultat, huile en cuve, radar r2, option B

## Fichiers écrits (tous dans « Possède »)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/generer.mjs` : écrit `etat.html`, à partir de `donnees/comparer-stout.json` seulement.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/NOTE.md` : choix portés, ce que j'ai fait de l'angle, ce qui tient et ce qui casse.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/captures.mjs` : puppeteer à 390 px ; appui long réel de 700 ms pour la fiche.
- Captures dans `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` :
  - r6f-390.png
  - r6f-premier-ecran.png
  - r6f-fiche-390.png
  - r6f-toucher-390.png
  - r6f-absolu-390.png
  - r6f-osu-390.png
  - r6f-valeurs-390.png
  - r6f-barres-390.png
- `git status --short` : aucun fichier hors de la voie.

## Critères (rejoués depuis la racine, dernière passe)
- G1 : `COMMUN OK`. Sur 11 contrôles (MOTS sauté), le dernier échec était STANDARD S2 : la couleur d'un houblon sous un `data-famille`. Corrigé en passant les tons de famille en variables CSS.
- G2 : `r6f 78 mots` puis `MOTS OK`. Il y en avait 106, puis 101, au départ. J'ai passé les barres derrière la lecture « Radar | Barres » (la variante 3 de Comparer), mis le pied de page dans la légende et raccourci le pont.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`, avec le radar au repos ; la chimie, le panel OSU et les vraies valeurs à un toucher.
- G5 : `ALPHA OK`
- G6 : `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)` : Galaxy à 29 %.
- G7 : `EXISTENT OK 7`
- G8 : `NOTE OK`
- G9 : `NOTE OK`.
- Essais : 2 pour G1 et 2 pour G2 (avec un essai intermédiaire à 101 mots) ; 1 pour chacun des autres.

## Captures ouvertes et jugées
- r6f-premier-ecran.png
- r6f-390.png
- r6f-fiche-390.png : la vraie fiche de Galaxy, avec « autres 29 % cannabis, dank » dessiné.
- r6f-toucher-390.png : la chimie ouverte, Galaxy mis en avant.
- r6f-barres-390.png
- r6f-absolu-390.png
- r6f-osu-390.png
- r6f-valeurs-390.png

Défauts vus sur les captures, puis corrigés :
- titre tronqué ;
- radar trop petit ;
- « 1 cran » collé à « Végétal » ;
- hachures masquées par la zone ;
- étiquettes du panel OSU rognées ;
- unité qui débordait sur la barre dans les vraies valeurs ;
- année de source fausse à l'affichage (« Beer Maverick · Hopsteiner 2025 ») ;
- cartes mal alignées.

## Ce que la variante apporte
- **La dose est le résultat** : Cascade 42 g, Idaho 7 22 g, Galaxy 16 g pour 20 L.
- **L'huile mise en cuve** (dose × huile des fiches) montre ce que l'IBU égal cache : Galaxy met 2,6 fois moins de houblon que Cascade, mais autant d'huile (1,5–4,1 contre 1,5–5,2 mL/hL).
- **Le radar trace l'apport ~ simulé**, et non la bière entière, dont le pic résineux est commun aux trois.
- **La bande est propre à l'angle** : la même chose pour un lot au bas ou au haut de l'α de ses fiches.
- **Le verdict est chiffré** : « ≈ même nez à 10 IBU ». Tous les écarts restent sous le seuil d'écart du style ; le plus grand est le tropical, 6,1 points pour un seuil de 7,5.
- **La demande de la dégustation du 18.10** (floral ↑, résineux ↓) est en tête des barres.
- Le pont ouvre Dryhopper avec le houblon mis en avant.

## Prédiction de la réaction du brasseur
« Pas mal, les grammes à IBU égal et l'huile c'est parlant, mais Cascade et Galaxy se confondent sur le radar, et si c'est le même nez à 10′, montre-moi direct à cru. »

## Doutes et limites
- Galaxy a un α de lot de 17,2 %, hors de ses fiches (11–16 %). Il est marqué ≠, et sa bande d'intervalle est entièrement au-dessus de son point.
- L'apport de Galaxy à 0,81 g/L est interpolé entre 0 et 1 g/L : sous la grille, la forme est supposée linéaire.
- L'IBU par gramme est une constante du moteur (20 L, DI 1,066) : aucune incertitude sur l'IBU lui-même.
- Le panel OSU décrit un dry hop, pas un ajout à 10′ ; la page le dit.
- La correspondance composé → famille (linalol → floral, etc.) est recopiée de `composes-houblon.json` en constante du générateur : ce fichier n'est pas dans `comparer-stout`.
- Le stock n'est montré que dans la fiche : `comparer-stout` n'a pas de quantité.
- Option A : sans effet ici, puisque Nelson Sauvin n'est pas montré.
- Les couleurs de Cascade (#781838) et de Galaxy (#681878) sont proches. Elles sont gardées pour la règle « un houblon garde sa couleur partout » (D83 S1).

DÉCISION À PRENDRE : Cascade (#781838) et Galaxy (#681878) se distinguent mal en contour sur un radar r2. Options : (a) garder les couleurs (D83 S1) et compter sur le houblon plein ; (b) éclaircir Galaxy dans tout l'outil ; (c) ajouter un repère de forme par houblon (rond, carré, triangle) aux sommets. Recommandation : (c), réversible et sans toucher à l'identité des couleurs ; à router au pilote.

CONNAISSANCE : À 10 IBU à 10′ dans la stout 16D, le moteur donne des écarts d'arôme entre Cascade, Idaho 7 et Galaxy tous sous le seuil d'écart du style (le plus grand : tropical, 6,1 points pour un seuil de 7,5). À IBU égal, Galaxy met 16 g et Cascade 42 g pour 20 L, mais autant d'huile en cuve : 1,5–4,1 contre 1,5–5,2 mL/hL. L'IBU égal égalise presque l'huile ; le choix se joue à cru, pas à 10′.

LEÇON PROPOSÉE : Compter les mots du premier écran avant de placer les blocs : un pied de page et un deuxième graphique au repos ont coûté 26 mots (106 au premier jet). Mettre d'emblée le deuxième rendu derrière la lecture « Radar | Barres » et les notes de méthode dans la légende. Contrôle : `mots-premier-ecran.mjs` dès le premier rendu.
