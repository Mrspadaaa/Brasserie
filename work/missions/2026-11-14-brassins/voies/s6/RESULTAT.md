OK — G3 en trois variantes : z1 pur, colonne des jours, rendez-vous du houblon

## Fichiers écrits (voies/s6/ seulement)
- `s6a/etat.html`, `s6a/NOTE.md` ; froide. z1 en ébullition, pièce pour pièce : le compteur J+5 (−1 j / +1 j), la piste des rendez-vous et la table « Gestes » à cocher. Montre aussi la liste.
- `s6b/etat.html`, `s6b/NOTE.md` ; tiède. La colonne des jours fait la courbe : une barre de densité par jour avance vers la voie verte de la FG, et chaque geste se coche à son jour. Le relevé m2 se fait sur place. Montre aussi la cave et le 1280.
- `s6c/etat.html`, `s6c/NOTE.md` ; chaude, G3 mêlé à G4. Le compte à rebours « 1 j » du dry hop, deux colonnes houblon en couleurs de familles et la fenêtre « actif » sur la densité.
- `capture.mjs` : captures puppeteer-core, 390 × 844 tactile, ×2 ; 1280 × 800.
- `tests.txt` : sortie des CHECK.

## Critères (rejoués depuis la racine)
- G1 : `SERIE OK`
- G2 : `ETATS OK`
- G3 : `HORS OK`

## Captures (toutes ouvertes)
- `s6a/s6a-repos-390-clair.png`, `s6a/s6a-geste-390-clair.png` (feuille densité m2), `s6a/s6a-liste-390-clair.png`
- `s6b/s6b-repos-390-clair.png`, `s6b/s6b-geste-390-clair.png` (curseur sur place), `s6b/s6b-repos-390-cave.png`, `s6b/s6b-repos-1280-clair.png`
- `s6c/s6c-repos-390-clair.png`, `s6c/s6c-geste-390-clair.png` (Citra « ajouté », −100 g)

Deux corrections ont été recapturées sans être rouvertes :
- `s6b-repos-1280` : la barre du jour est réalignée sur la colonne ;
- `s6c-geste` : le libellé est raccourci.

## Défauts connus, pour la passe 2
- s6b : la voie FG est étroite, parce que l'échelle va de 1,062 à 1,010. À 1280, le bas de la colonne des cuves reste vide.
- s6a et s6b : à 390, la page défile d'environ 20 à 90 px sous le pied.
- Les unités en mono gardent l'espace large de z1 (« 100  g »).
- Boosters B2 à B13 non mesurés (permis en v0).

## Prédiction
Il prendra s6c pour le houblon qui parle enfin brasseur et s6b pour l'idée « la liste est la courbe » ; s6a lui paraîtra trop proche de ce qu'il a déjà vu.

DÉCISION À PRENDRE : la règle « stable » est dessinée en 3 jours à 0,001 près dans la bande (jury J14, « à sourcer au port », L29).

CONNAISSANCE : les arômes de Citra et Mosaic sont dans `src/data/hopBeerMaverickFiches.json` (champ `aroma`, de 0 à 5), et leurs plages d'α dans `hopDatabaseBootstrap.json` (kasperg3). Une maquette peut montrer les familles sans rien inventer.

LEÇON PROPOSÉE : aucune
