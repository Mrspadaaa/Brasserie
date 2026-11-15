OK — s7a, s7b, s7c rhabillées à la trousse d'identité, 13 captures refaites

## Variantes
- [x] s7a : feuille de l'app (poignée, rayon 24, en-tête « NEIPA · LOT-019 ») posée sur l'onglet Brassins ; titre-réponse en `id-display` 28/600 ; onglets de moment en `id-segments` ; colonnes houblon en panneaux rayon 16 avec barre de famille (agrumes, baies) ; graphe recoloré (passé `cave-850`, actif `hop/.14`, bande FG au style du curseur m2, consigne de cuve en teintes `hop`/`attention`/`water`) ; boutons `id-btn` (une primaire) ; 1280 : feuille élargie en trois colonnes, rail « Mes cuves ». · écart restant : la feuille 1280 dépasse les 42rem de Sheet.tsx (élargie pour garder le poste en trois colonnes).
- [x] s7b : fiche en feuille sur la liste ; les quatre blocs de couleur deviennent une colonne teintée au jeton (paille, `attention`, `water`, `hop`) avec filet de 3 px ; « Demain » en `id-display`, autres réponses en `id-title` ; barres en encre courante ; saisie (geste) = seconde feuille avec `id-segments`, lecture 28 et curseur m2 de la trousse ; liste « 3 décisions » sous en-tête, sous-onglets et barre du bas de l'app. · écart restant : les réponses 2 à 4 passent de 27 px à 18 px (échelle), l'idée « réponses en gros » ne tient plus que par « Demain ».
- [x] s7c : l'affiche noire devient un panneau de l'app ; moitiés Citra/Mosaic en teintes de famille (aplat 16 %/12 %, barre pleine 4 px) ; grammes et densité en `id-reading-grand` 28 ; tuiles cuve et garde teintées `hop`/`water` ; pied en feuille. · écart restant : l'effet « affiche » (aplats pleins, 56 px) est volontairement perdu ; Mosaic garde 6 pictos + « +2 » en pastilles de 20 px.

Rien de changé aux textes ni aux chiffres (Mosaic : 6 pictos + « +2 », comme avant).

## Fichiers écrits
`voies/s7/s7a|s7b|s7c/source.html` (réécrits sur la trousse), `etat.html` et PNG régénérés par `voies/s7/faire.mjs` (inchangé) ; `voies/rs7/tests.txt`, ce fichier.
Nouvelles captures (noms au format de la série) : `s7b-repos-390-cave`, `s7b-repos-1280-clair`, `s7c-repos-1280-clair`.

## Critères (tests.txt, rejoués depuis la racine)
- G1 : `IDENTITE OK 3/3`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).
- Cibles : `faire.mjs` compte 19 à 34 éléments sous 44 px par page : ce sont les composants de la trousse (en-tête, segments, `id-btn`) dont la zone de 44 px est portée par `::after`, invisible à sa mesure ; le dessin garde l'échelle compacte de l'app.

## Captures (`work/missions/2026-11-14-brassins/voies/s7/`)
- Ouvertes : `s7a/s7a-repos-390-clair.png`, `s7a-repos-390-cave.png`, `s7a-geste-390-clair.png`, `s7a-repos-1280-clair.png` ; `s7b/s7b-repos-390-clair.png`, `s7b-geste-390-clair.png`, `s7b-liste-390-clair.png`, `s7b-repos-1280-clair.png` ; `s7c/s7c-repos-390-clair.png`, `s7c-repos-390-cave.png`.
- Retouches mineures non revues à l'image après coup : étiquette « 1,018 » déplacée et toast en sans (s7a), mono retiré des lignes de la liste (s7b liste).
- Non ouvertes (contexte) : `s7b/s7b-repos-390-cave.png`, `s7c/s7c-geste-390-clair.png`, `s7c/s7c-repos-1280-clair.png`.
- Repos comparé à l'app (`a1-banc/captures/fiche-fermentation-390-clair.png`) : même feuille, même en-tête de feuille 14/600, mêmes boutons et pied. Écart restant : la fiche de l'app est une liste de champs, ici panneaux teintés et graphe.

## Prédiction
« Là ça ressemble à l'app » ; il prendra s7a ou s7c, et trouvera s7b plus pâle qu'avant.

DÉCISION À PRENDRE : aucune (largeur de feuille s7a à 1280 signalée ci-dessus).
CONNAISSANCE : Citra = couleurs de la famille agrumes (#d9b414), Mosaic = baies (#9b3f74), dans `src/data/hopV4/jetons-familles.json` ; `faire.mjs` réécrit les trois `etat.html` à chaque appel : toute capture doit être refaite dans le même appel, sinon G2 tombe.
LEÇON PROPOSÉE : aucune.
