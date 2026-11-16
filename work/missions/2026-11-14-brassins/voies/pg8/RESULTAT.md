OK — page8 « La feuille Brasser : laquelle ? », 4 versions d1d d1b d1a d1c, critères verts

## Fichiers écrits
- `work/missions/2026-11-14-brassins/page8/index.html` (styles, barre et script repris de page7 par split/join ; corps neuf).
- `work/missions/2026-11-14-brassins/page8/img/` : les 21 PNG de d1a à d1d (mêmes noms) et `sa-capture-c2a-geste.jpg`.
- `voies/pg8/build-page8.mjs` (assemble la page), `voies/pg8/capture.mjs` (captures et mesures de l'écran #brasser), `tests.txt`, ce fichier.
- Note : `/work/missions/**` est ignoré par .gitignore (ligne 104) : le pilote ajoute page8 avec `git add -f` s'il la commite.

## Critères (sorties dans tests.txt)
- G1 : `PAGE OK (1 images chargées, lisible à 390 et 1280 px, sans erreur)`
- G2 : `PAGE CLAIRE OK 1`
- G3 : `CONTENU OK`
- capture.mjs sur l'écran #brasser (verifier-page ne mesure que l'accueil) : débord 0, aucun texte < 14 px, aucun bloc > 45 mots, repos à 356 px (390) et 438 px (1280), aucune erreur ; « Je prends » sur d1d → barre « Feuille Brasser : d1d ».

## Page
- Accueil (≈ 30 mots) : ses mots du 15.11 et sa capture en vignette, « Noté : Créer c2a, Recettes r2a (en cours dans l'app) », gros bouton vers `#brasser`.
- Écran : « Ce qui ne va pas aujourd'hui » (Sam. 21 sans raison, Plus tard sans date, la cuve à part, Demain sur le dry hop) à côté de sa capture ; la ligne du fictif une fois (Pils en bouteille mar. 17) ; `data-ask` « Laquelle garder : l'agenda, le damier, ta feuille, le grand jour, ou aucune ? » avec « Aucune » ; les 4 versions dans l'ordre de kd1, titre en mots, id en petit, repos 390 clair en pleine colonne, `data-change` ≤ 20 mots repris des NOTE, rangée geste / loin / conflit / cave (et 1280 pour d1d), chaque geste nommé.
- Choix de mise en page : le repos est rogné en haut (le flou de la liste derrière la feuille, 128 à 394 px selon la version) pour que la feuille de d1d se lise au premier écran ; un toucher ouvre l'image entière.

## Captures (toutes ouvertes)
- `voies/pg8/verif/ecran-390-clair.png`, `ecran-390-cave.png`, `ecran-1280-clair.png`, `ecran-390-clair-pris.png`, `page-390-clair.png`, `page-1280-clair.png` ; `voies/pg8/verif-haut.png` (accueil, cave), `verif-page.png`, `verif-ordinateur.png`.
- Au premier écran à 390 : la question et la feuille de d1d (en-tête, stock, début de l'agenda) se lisent, dans les deux thèmes.

## Prédiction
« Là je vois ce qui n'allait pas et les quatre façons ; je prends l'agenda. »

DÉCISION À PRENDRE : aucune (la page n'est pas publiée ; le pilote la publie).
CONNAISSANCE : `verifier-page --page-lot` ne mesure que l'accueil ; un écran par ancre se mesure à part (capture.mjs de pg8). Une image `loading="lazy"` d'une section cachée bloque `img.decode()` dans puppeteer : passer `loading = 'eager'` avant.
LEÇON PROPOSÉE : aucune
