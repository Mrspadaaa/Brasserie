OK — page « Choix de vues · 24.10 » : sept choix en bandes côte à côte, 96 concepts, 180 captures ; G1 et G2 verts

## Fichiers écrits
- `work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/index.html` (écrite à la main ; feuille de style et visionneuse de `2026-10-24-d121`, thème blanc assumé, sans mode sombre).
- `…/2026-10-24-choix-vues/img/` : 180 images copiées sans retouche (29 Mo), non versionnées.
- `…/2026-10-24-choix-vues/verif-haut.png`, `verif-page.png`, `verif-ordinateur.png` (sorties de `verifier-page.mjs`).
- Rien écrit hors de « Possède ». `git status` : seul le dossier de la page est neuf.

## Critères
- G1 : `PAGE OK (180 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- G2 : `CHOIX-BIEN-180`.
- Captures ouvertes : `verif-haut.png` (`#a-choisir` : les sept liens et le canal de retour dans le premier écran), `verif-ordinateur.png`. `verif-page.png` fait 390 × 15 392 px : illisible entière, donc j'ai pris moi-même des captures de chaque section au téléphone et à 1280 px (Dryhopper, bande défilée, Substituer, pastille, graphes, analyse, panel) et je les ai ouvertes.
- Essais : G1 trois (1 : « Page is too large » ; 2 : deux blocs de plus de 45 mots ; 3 : OK). G2 au premier.

## Mise en page, et pourquoi
La première version (une colonne, toutes les captures à la suite) faisait échouer G1 : la capture pleine page dépasse 16 384 px (limite de Chrome). 180 captures de 775 px de haut ne tiennent pas en une colonne. Choix : au téléphone, une **bande qui défile** par état (une capture de 344 px à la fois, « glisse pour voir la suite ») ; sur ordinateur, trois colonnes en grille. Chaque section a deux bandes dans le même ordre (premier écran | pendant le geste ; à 60′ | au whirlpool ; Nugget | Nelson Sauvin ; au repos | au toucher), la référence en tête de la première, cernée d'ambre. Pastille, levure : la référence est la première capture. Graphes : une bande de 18, chaque graphe en a · b · c. Le panel : deux bandes de 48, dans l'ordre du classement.

## Doutes et limites
- Les verdicts « Après correction » annoncés dans VOIE.md n'existent dans aucun `CRITIQUE.md` (pastille, levure, graphes). J'ai marqué « rejetée, corrigée » psc, lvb, gr1, gr3, gr6 d'après les CRITIQUE.md et les RESULTAT des jeux courts : le critique ne les a pas rejugées. Dit dans le pied de page.
- Poids : 29 Mo d'images. À publier avec copie côté serveur ou à alléger si l'artefact refuse.
- u4 est une page de 3 376 px : seule la tête est montrée (rognée par la mise en page), l'écran entier s'ouvre au toucher.
- Dans la bande « à 60′ / whirlpool », u4 n'a pas d'équivalent au whirlpool ; sa référence est donc seulement dans la première bande.
- La page de la version d'avant n'est pas liée (nouvelle série de sujets) ; deux liens de la page D121 (maquette, côte à côte) sont repris.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `verifier-page.mjs` plafonne une page à 16 384 px de haut au téléphone (capture pleine page) : au-delà d'environ 20 captures de 775 px, passer en bandes défilantes.
LEÇON PROPOSÉE : aucune
