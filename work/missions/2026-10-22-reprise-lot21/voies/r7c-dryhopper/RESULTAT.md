OK — huit concepts Dryhopper, vraies valeurs d'abord, un seul facteur libre : le moment

## Fichiers écrits (dans Possède)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c1/etat.html` … `c8/etat.html`
- `serie-c/generer.mjs` (les huit concepts), `serie-c/commun.mjs` (données, rail, barres, page), `serie-c/captures.mjs`
- `serie-c/NOTE.md` ; `serie-c/captures/` (48 PNG) ; `serie-c/captures/travail/err.mjs` (erreurs JS au chargement)
- `git status` : rien hors de `serie-c/` et de ce fichier (le `pistes-l5f.png` à la racine existait déjà).

## Concepts (id · chaleur · ce qu'il montre · geste · vraie valeur · levure)
- c1 · froide · L'écran de la carte, avec la preuve mesurée du moment en tête · rail par 5′ · E03 : linalol d'Idaho 7 38 µg/L (×3,8–9,5 le seuil), myrcène 85 µg/L ; E04 : agrumes 1,9 → 5,8 sur 15 ; E07 · dernière étape
- c2 · froide · y1b : face à ta stout, jauge d'amertume, dock fixé sous le pouce et jalonné des études, la valeur dans la bulle · dock · E03, E04, E07, E09 · pont
- c3 · tiède · Le brassin à la verticale : sept mesures épinglées à leur heure, le simulé sous le pouce · rail vertical · E07, E09, E03 ×2, E04, E08, E10 · dernière étape
- c4 · tiède · La courbe de contact : extraction, passage en 2 j, jury, et le floral simulé jour par jour sur le même axe · rail et curseur de jour · E05 (linalol 43,1 → 39,5 % de l'huile), E08, E10 · pont
- c5 · tiède · Idaho 7 mesuré une seule fois : quatre composés face au seuil, en échelle log ; ailleurs, l'inconnu hachuré ; radar simulé · rail · E03 et seuils E06 · dernière étape
- c6 · tiède · Le jury d'abord : notes sur 15, sans houblon puis après 24 h, et les puces des autres jurys · rail · E04 (intensité 3 → 8,1, agrumes 1,9 → 5,8, herbacé 2,5 → 5,7) · pont
- c7 · tiède · La table des preuves : 4 colonnes alignées sur le rail ; la mesure en haut, l'ajout simulé floral et résineux en bas · rail aligné · E07, E09, E03, E04 · dernière étape
- c8 · tiède · Face au témoin : vraies bières sans puis avec houblon ; puis la chaîne x3b « Ma bière → + Idaho 7 → levure › » · rail · E02 (25 → 83–323 µg/L), E06 (moment non publié), E03 · pont

Levure : 4 concepts en dernière étape (c1, c3, c5, c7) et 4 en pont (c2, c4, c6, c8). Descripteurs : option A (rien de
visible pour Idaho 7 : aucun mot déplacé).

## Sorties décisives
- G1 : `COMMUN OK`
- G2 : `UNE-QUESTION OK (1 groupe libre : moment)`
- G3 : `EXISTENT OK 17` ; G4 : `NOTE OK` ; G5 : `NOTE OK`
- Joués une fois et recopiés dans la NOTE :
  - D99 : `ACQUIS ECHEC 32 problème(s)`. Contrôle taillé pour Comparer ; c5 : 1/4, chimie au repos.
  - MOTS : `MOTS ECHEC 8/8`, de 90 à 132 mots.

## Captures ouvertes et regardées
Dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/` :
- premier écran : c1-390.png, c2-390.png, c3-390.png, c4-390.png, c5-390.png, c6-390.png, c7-390.png, c8-390.png ;
- autres états : c4-60-390.png, c5-apres-390.png, c8-apres-390.png, c1-fiche-390.png (fiche g1 à l'appui long).
Les autres états (-60, -apres, -j1, -pleine, -fiche) sont générés pour chaque concept, mais pas tous ouverts.

## Prédiction
« c7 et c3, c'est l'idée : je vois enfin où sont les vraies mesures et que l'actif garde le floral avec moins de
résineux. Mais encore trop de texte, et Idaho 7 n'est mesuré qu'une fois ? »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : `comparatifs-dryhop.json` ne contient qu'une mesure d'Idaho 7 : E03, au pitch, S-04, 14 j, dose non
publiée, colonnes à vérifier. Aucun chiffre ne compare le whirlpool au dry hop (E09 n'existe qu'en figure). La grille
simulée, à 4 g/L et US-05, donne en fermentation active floral ~+22 et résineux ~+14 ; après fermentation, floral ~+23
et résineux ~+20. L'actif répond donc à « trop résineuse, je la veux plus florale ». À confronter au brasseur, ou à une
mesure.

LEÇON PROPOSÉE : L26 vaut aussi pour le JavaScript. Le `JS_COMMUN` de `socle-w.mjs` déclare des globales (`cle`,
`legende`, `geo`…). Une variante qui l'importe et déclare `const cle` casse tout le rendu (« Identifier 'cle' has
already been declared »), et le contrôle statique ne le voit pas. Il faut préfixer aussi les noms globaux du script, et
charger chaque page avec un écouteur `pageerror` avant la première capture. Autre piège : un sélecteur
`[class$="-x"]` rate un élément qui porte plusieurs classes.
