# gr1 — Les barres l5b de Ma bière, au style

Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (`outils/extraire.mjs`, lecture seule de `prototypes/`, feuille `assets/style.css` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, `data-source`, `aria-label`, `data-crans`, `data-valeurs`, `data-inconnues`) ou, pour la fiche, dans les mots sourcés de Nugget (`pack-fiches`, via `fils24-fiche-liste/fla1/commun/donnees.mjs`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.

## Les trois lectures
- **1a tel qu'il est** : Ma bière, Barres, Au style (reprise r2, `parcours-biere/biere/etat.html`). La lentille marche : elle bascule sur la vue absolue figée.
- **1b le mot sous le doigt** : le doigt sur une famille → « Agrumes · à peine · ~ prévu », « Résineux · au-dessus du 16D ×2,8 · dégusté 18.10 », « Noyau · non situé : inconnu, pas zéro ». La ligne touchée se cerne.
- **1c le haut du style, un trait** : au repos, un trait noir au haut de la zone du style sur chaque barre, sans mot (repère, pas légende) ; au doigt, la barre se remplit jusqu'au rond à la couleur de la famille, et la bulle, sur une ligne, dit « Agrumes · ~4 % du haut du 16D » (« Résineux · ×2,8 du haut du 16D · dégusté 18.10 »).

Passe 2 (CRITIQUE.md, rejet de 1c) : le mot « haut du 16D » écrit au repos est retiré ; il n'est plus dit que dans la bulle.

Ce qui tient : c'est le DOM de la maquette. À l'étape, les mêmes barres sont en deux colonnes : la lecture retenue s'y appliquera, elle n'est pas montrée ici.

Captures (`../captures/`, 390 × 844 tactile) : gr1-repos.png (premier écran), gr1-toucher.png (1b, Agrumes), gr1-toucher-c.png (1c, Agrumes), gr1-page.png (page entière).

## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte. Rejoué après la passe 2 (gr1, gr3, gr6) : COMMUN OK.
