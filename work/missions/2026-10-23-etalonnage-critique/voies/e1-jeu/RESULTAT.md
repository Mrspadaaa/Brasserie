OK — 37 paires, 23 classes de verdicts du brasseur, avec les captures qu'il a jugées

## Fichiers écrits
- `work/refonte-frontend/v4/etalonnage/jeu.json` (60 items, 70 captures distinctes)
- `work/refonte-frontend/v4/etalonnage/JEU.md` (tables, limites, verdicts non pris)
- Générateur jetable : dossier temporaire de la session (rien d'écrit hors Possède).

## Critères (rejoués depuis la racine, premier essai)
- G1 : `JEU OK 37 paires, 23 classes (8 aime, 7 mitige, 8 rejette)`
- G2 : `CAPTURES OK 97` (aucune capture sous 15 ko)
- G3 : `CITATIONS OK 60`
- G4 : `NOTE OK`

## Couverture
- Lots : 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 18, 20, 21, 22, 23.
- Sujets : rail, radar, barres, fiche, Comparer, Dryhopper (y1b, le « quand »), picto, substitution, disposition.
- Picto : f1 contre a1, b1, c1, d1, e1 ; classes f1 (aime), r4 (rejette, la capture barrée de croix qu'il a renvoyée), r4c (rejette).
- Captures ouvertes en image : y1b, x3b, r6n2 (premier écran), planches de série F et A, planche r4 barrée, fiche l8e, fiche v3. Les autres ont été vérifiées par existence et taille, pas toutes ouvertes.

## Doutes et limites
- Lot 4 : son verdict (fiche bon, ma bière moyen, deux autres « n'importe quoi ») visait la page publiée du 18.10. La variante exacte n'est pas archivée ; j'ai pris les captures de la base v3 consolidée (`base/_v3`). Le registre dit que la fiche est celle de la base v3.
- Paires : « A est le meilleur » sur une planche devient A contre chaque B du même lot. Ce n'est pas une phrase « A mieux que B » mot pour mot. Une même préférence pèse sur plusieurs paires (y1b ×4, r6a ×4, f1 ×5, p02 ×3) : à pondérer dans un score.
- Pictos : la capture est la planche de la série, pas la planche des 48 qu'il a vue.
- Verdicts écartés, avec raison, dans JEU.md : fiche Citra cryo v4.9, p4 du lot 15, lot 20 global, « icônes cata », radars des lots 2 et d'avant le lot 7, éléments entourés de l8e.
- Les classes `mitige` sont assignées d'après le verdict mot pour mot (« interessant mais… ») ; le pilote peut contester un rangement (par exemple l5f, d1).

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : la planche refusée que le brasseur a barrée existe en `fils22-picto-epice/captures/planche-refusee-22-10.jpg` ; les captures de lot 4 vues par lui ne sont pas archivées, seule la base v3 consolidée l'est.

LEÇON PROPOSÉE : archiver, au moment où le brasseur répond, la capture ou la page exacte qu'il a jugée (nom de variante compris) à côté de ses mots dans SPEC-BRASSEUR ; sans cela un jeu d'étalonnage doit déduire la capture (lot 4, planche des 48).
