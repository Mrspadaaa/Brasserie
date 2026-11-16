OK — Recettes v0 : 4 genres (lignée, recherche, carnet court, ▶ en un toucher), 1280 sur r1c

## Avant de dessiner (5 lignes)
1. Ce qu'il a dit : « Recettes : aucune … Ça resoud aucune de mes problématique » et « pas très compact, pas super convaincu quand il y aura des dizaines de recette » (15.11).
2. Ce qu'on en lit : ranger autrement les mêmes champs ne sert à rien ; il veut retrouver sans réfléchir, voir ses versions, brasser vite, sur un carnet qui grossira (PROBLEMES n° 1, 3, 4, 5, 8, 9).
3. Les 4 genres : r1a une recette = une lignée (versions) ; r1b la recherche en mots de brasseur, index au bord ; r1c le carnet court qui s'archive de lui-même ; r1d brasser en un toucher, comme une liste de lecture.
4. Au repos : r1a des chaînes de versions ; r1b un grand champ de question et un index vertical ; r1c six cartes du moment et un tiroir d'archives ; r1d des rangées à disque ▶ et un lecteur en bas.
5. Données : 5 recettes réelles (DONNEES-COMMUNES) et 30 d'exemple, fictives, dites telles dans chaque NOTE.md.

## Fichiers écrits (tous dans voies/r1/)
- `capture.mjs` (plan r1a à r1d ; 1280 sur r1a et r1c), `tests.txt`
- `r1a/etat.html`, `NOTE.md`, 6 PNG (passe de fin : chip de style retiré quand il répète le nom)
- `r1b/etat.html`, `NOTE.md`, 5 PNG
- `r1c/etat.html`, `NOTE.md`, 6 PNG (froide, carnet court)
- `r1d/etat.html`, `NOTE.md`, 5 PNG (tiède, ▶ en un toucher)

## Critères (sorties dans tests.txt)
- G1 : `SERIE OK`
- G2 : `IDENTITE OK 4/4` (premier essai : r1a et r1d à 6 % hors palette, dû aux chips de style répétant le nom ; retirés, 0 perte d'information)
- G3 : `NOTE OK 4`

## Captures (toutes ouvertes)
- r1c : `r1c/r1c-repos-390-clair.png`, `-geste-`, `-recette-`, `-vide-390-clair.png`, `r1c-repos-390-cave.png`, `r1c-repos-1280-clair.png`
- r1d : `r1d/r1d-repos-390-clair.png`, `-geste-`, `-recette-`, `-vide-390-clair.png`, `r1d-repos-390-cave.png`
- r1a, r1b : voir leurs dossiers (r1a 1280 faite).

## Meilleure : r1c
Elle répond le plus droit à « des dizaines de recettes » : 6 cartes à l'écran, le reste rangé seul, la recherche fouille tout. r1d est la plus neuve (▶ = lot), à greffer sur r1c (Rebrasser ▶ sur la carte).
Défauts connus : r1c à 1280, ligne d'état de la Stout coupée (« 5,… ») en grille de trois ; r1c geste et r1d recette laissent un bas d'écran vide.

Prédiction : « Le carnet court, oui, c'est enfin compact ; le ▶ de r1d je le veux aussi, mais pas qu'il crée un lot par erreur. »

DÉCISION À PRENDRE : aucune dans le contrat ; deux réglages à lui montrer en variantes si r1c ou r1d est retenue : seuil d'archivage (6 mois ?) et ▶ au toucher ou à l'appui long.
CONNAISSANCE : `controle-identite.mjs` compte chaque chip `.id-style` (teintes lime, yellow, violet… hors palette) : une liste avec un chip par rangée dépasse 5 % ; un chip qui répète le nom est à retirer de toute façon.
LEÇON PROPOSÉE : aucune.
