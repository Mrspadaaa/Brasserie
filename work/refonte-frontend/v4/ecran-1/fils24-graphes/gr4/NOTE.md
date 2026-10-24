# gr4 — Le radar h4 de la fiche (Nugget)

Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (`outils/extraire.mjs`, lecture seule de `prototypes/`, feuille `assets/style.css` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, `data-source`, `aria-label`, `data-crans`, `data-valeurs`, `data-inconnues`) ou, pour la fiche, dans les mots sourcés de Nugget (`pack-fiches`, via `fils24-fiche-liste/fla1/commun/donnees.mjs`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.

## Les trois lectures
- **4a tel qu'il est** : la fiche g1 de Nugget ouverte par l'appui long (reprise r3, `parcours-fiche/fiche/etat.html`) : α, radar h4, flèches « + Floral 2/4 − Résineux 2/4 ».
- **4b les mots des fiches au doigt** : le doigt sur un rayon → « Floral · 2 fiches sur 4 (floral, géranium) » ; « Melon · ses fiches n'en disent rien : inconnu, pas zéro ».
- **4c face à ma bière** : au repos, les rayons de ses deux objectifs (floral, résineux) tracés à leur couleur ; au doigt, « Résineux · ma bière en a trop, dégusté 18.10 · Nugget 2/4 (boisé, résineux) ».

Sous les trois, « sous la fiche : l'étape » : le profil de l'étape figé, là où s'ouvre la fiche ; il porte la lentille au style (D75), que la fiche n'a pas.

Ce qui casse : 4c lit les flèches de la fiche comme ses objectifs de Ma bière (+ floral, − résineux), comme les boutons de Ma bière.

Captures (`../captures/`, 390 × 844 tactile) : gr4-repos.png (premier écran), gr4-toucher.png (4b, Floral), gr4-toucher-c.png (4c, Résineux), gr4-page.png (page entière).

## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte.
