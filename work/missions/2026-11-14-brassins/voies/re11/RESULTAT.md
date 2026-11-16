OK — e11a à e11d rhabillées à l'identité de l'app, images refaites, G1 à G3 verts

## Variantes
- [x] e11a : chrome de l'app (en-tête, sous-onglets, barre du bas) via la trousse ; compteurs 4 / 5 ajoutés dans les segments de l'app ; le + de l'app élargi et nommé « Brassin » / « Recette » ; cartes en `id-carte` avec filet de couleur sémantique (hop, water, alert, cuivre), pastilles d'état `id-pastille`, filtres `id-puce`, boutons de l'app (une seule primaire : Confirmer FG), styles `id-style` aux teintes de l'app ; menu du + en panneau de l'app sur voile. Phrase-réponse en `id-display` 28/600. · écart restant : à côté de liste-remplie-390-clair, même en-tête, même barre, mêmes rayons et encres ; reste propre à la variante le filet de couleur à gauche et les boutons d'action dans les cartes (l'app met un lien « Voir les mesures »).
- [x] e11b : en-tête et barre du bas de l'app, sous-onglets dans le dock (idée gardée), + flottant retiré ; la tête « 2 gestes » prend la couleur d'action de l'app (noir en clair, paille en cave), tuiles water / alert, frise en hop / attention / water, semaine en `id-panneau` ; 1280 : tête en colonne collante à gauche, dock centré au-dessus de la barre du bas. · écart restant : la tête pleine noire (paille en cave) n'a pas d'équivalent dans l'app ; le dock flotte au-dessus de la barre du bas (l'app a ses sous-onglets en haut) — c'est l'idée. À 1280, le dock reste en bas (v0 : en haut à droite).
- [x] e11c : chrome de l'app ; « Houblons » en pastille hop dans l'en-tête de l'app ; onglets soulignés remplacés par la barre de segments de l'app (avec compteurs) ; tuiles de cuve pleines en hop / alert hachuré / water / EBC cuivre, valeurs en `id-reading-grand` ; le + de l'app scindé « + Brassin | éclair » ; la saisie rapide devient une feuille de l'app (poignée, rayon 24, ×), tuiles teintées `--area-*`. · écart restant : les tuiles pleines restent bien plus colorées que la liste de l'app (c'est l'idée du tableau des cuves).
- [x] e11d : chrome de l'app (en-tête, barre du bas) ; intercalaires au bord droit en jetons (Brassins `--area-production`, Recettes `--hop`, Atelier `--area-agenda`, Volumes `--water`), texte vertical 14/600, compteurs en pastille mono 12 ; l'actif s'élargit, prend la teinte de la page (`/ .1`) et porte le + de l'app (36 px, rayon 10) ; page teintée par une couche fixe ; phrase en `id-display` 28/600, Citra et Mosaic en pastille inversée ; agenda en `id-carte` rayon 16, points sémantiques (alert, water, hop, attention, water, cuivre, cave-600), une seule primaire (Brasser), NEIPA du 15.11 encadré ; recettes en `id-carte` à filet 4 px, `id-style` pour l'American Pale Ale ; geste : `id-voile` et tiroir `id-panneau` (rayon 16 0 0 16) collé à l'intercalaire Brassins, libellés + recette, + idée, saisie rapide au bord des inactifs. · écart restant : à côté de liste-remplie-390-clair, même en-tête, même barre du bas, mêmes cartes et encres ; restent propres à la variante les intercalaires colorés (l'app a ses sous-onglets en haut) et la teinte de page — c'est l'idée.

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e11/e11d/etat.html` (réécrit sur la trousse) ; PNG e11d ×4 (repos clair et cave, geste, recettes).
- `work/missions/2026-11-14-brassins/voies/e11/e11a/etat.html`, `e11b/etat.html`, `e11c/etat.html` (réécrits sur la trousse).
- `work/missions/2026-11-14-brassins/voies/e11/capture.mjs` : plan enrichi d'un `repos-390-cave` pour e11a, e11c, e11d.
- PNG régénérés (mêmes noms + cave) : e11a ×4, e11b ×5 (dont 390 cave et 1280 clair), e11c ×4.
- `re11/tests.txt` (sortie des CHECK), ce fichier. Aucune suite Vitest (rien dans `src/`).

## Critères (sortie décisive, `re11/tests.txt`)
- G1 : `IDENTITE OK 4/4`.
- G2 : `RHABILLE OK`.
- G3 : `HORS OK`.

## Captures ouvertes
e11a-repos-390-clair, e11a-geste-390-clair, e11b-repos-390-clair, e11b-repos-390-cave, e11c-repos-390-clair (dans `voies/e11/<id>/`)., e11d-repos-390-clair, e11d-repos-390-cave, e11d-geste-390-clair, e11d-recettes-390-clair
Non ouvertes (à regarder) : e11a recettes et cave, e11b geste, recettes et 1280, e11c geste, recettes et cave.

Prédiction : « Là ça ressemble à l'app » pour e11a et e11c ; e11b peut encore lui paraître « une affiche » par sa tête pleine. e11d : « ah, le classeur », lisible comme un écran de l'app.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la couleur d'action de l'app (`--ebc-straw`) est noire en clair et paille en cave ; une tête « pleine » qui la prend avec
`--sur-paille` pour l'encre reste lisible dans les deux thèmes (e11b). Le contrôle d'identité lit `rgba(r,g,b,a)` sur ses seuls canaux :
une teinte `rgb(var(--jeton) / .1)` passe.
LEÇON PROPOSÉE : aucune.
