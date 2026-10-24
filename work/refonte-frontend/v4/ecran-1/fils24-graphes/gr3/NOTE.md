# gr3 — Le radar m4 de Ma bière et sa grille

Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (`outils/extraire.mjs`, lecture seule de `prototypes/`, feuille `assets/style.css` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, `data-source`, `aria-label`, `data-crans`, `data-valeurs`, `data-inconnues`) ou, pour la fiche, dans les mots sourcés de Nugget (`pack-fiches`, via `fils24-fiche-liste/fla1/commun/donnees.mjs`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.

## Les trois lectures
- **3a tel qu'il est** : Ma bière, après « Radar » : radar m4 (dégustation en bleu, zone grise du 16D, « ? » hachurés) et la grille pas senti · faible · moyen · marqué.
- **3b le sommet au doigt** : le doigt sur le radar → le rayon de la famille se trace à sa couleur, sa ligne de grille se cerne ; bulle « Résineux · marqué, au-dessus du 16D · dégusté 18.10 » ou « Agrumes · pas goûté : inconnu, pas zéro · le 16D va jusqu'à ~faible » (lu sur l'aria-label du radar et le contour de la zone).
- **3c la grille au doigt** : m4 tel quel au repos ; le doigt sur une ligne de la grille trace le rayon de sa famille sur le radar, cerne la ligne et dit « Floral · pas goûté : inconnu, pas zéro · le 16D va jusqu'à ~moyen ».

Passe 2 (CRITIQUE.md, rejet de 3c) : la lentille ajoutée au radar et le mot « 16D » écrit sur la zone sont retirés (m4 ne change pas ; « Pas besoin d'écrire la légende »). Une lentille en mode Radar serait une question à part, en mini maquette. Sous les trois, « le même profil, à l'étape » : le profil de l'étape figé, qui porte la lentille au style (D75), comme en gr4.

Captures (`../captures/`, 390 × 844 tactile) : gr3-repos.png (premier écran), gr3-toucher.png (3b, Résineux), gr3-toucher-c.png (3c, Floral), gr3-page.png (page entière).

## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte. Rejoué après la passe 2 (gr1, gr3, gr6) : COMMUN OK.
