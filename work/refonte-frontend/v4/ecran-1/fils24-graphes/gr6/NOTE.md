# gr6 — Le radar r2 de Comparer

Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (`outils/extraire.mjs`, lecture seule de `prototypes/`, feuille `assets/style.css` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, `data-source`, `aria-label`, `data-crans`, `data-valeurs`, `data-inconnues`) ou, pour la fiche, dans les mots sourcés de Nugget (`pack-fiches`, via `fils24-fiche-liste/fla1/commun/donnees.mjs`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.

## Les trois lectures
- **6a tel qu'il est** : Comparer (reprise r5) : critère floral, « ★ Idaho 7 devant Cascade ~+0,4 cran », lentille, radar r2 (Idaho 7 plein, Cascade et Galaxy en contour, zone verte de ta 16D, pictos des familles), puis les trois colonnes.
- **6b un houblon à la fois** : le doigt sur un tracé ou une colonne → les autres s'effacent ; « Galaxy seul · au-dessus du 16D : tropicaux, résineux · inconnu : herbacé, terreux, pépins, melon » (`data-valeurs` comparées au contour de la zone, `data-inconnues`).
- **6c l'axe au doigt** : le doigt sur un axe → son rayon se trace ; « Floral · Idaho 7 › Cascade › Galaxy · tous dans ta 16D » (rang au rayon sur l'axe).

Ce qui casse : doigt au nord, la bulle couvre le haut du radar.

Captures (`../captures/`, 390 × 844 tactile) : gr6-repos.png (premier écran), gr6-toucher.png (6b, Galaxy), gr6-toucher-c.png (6c, Floral), gr6-page.png (page entière).

## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte.
