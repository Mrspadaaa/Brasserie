# gr5 — Les traits de Suggérer (« ce système de petit bar »)

Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (`outils/extraire.mjs`, lecture seule de `prototypes/`, feuille `assets/style.css` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, `data-source`, `aria-label`, `data-crans`, `data-valeurs`, `data-inconnues`) ou, pour la fiche, dans les mots sourcés de Nugget (`pack-fiches`, via `fils24-fiche-liste/fla1/commun/donnees.mjs`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.

## Les trois lectures
- **5a tel qu'il est** : Suggestions (reprise r4, q2b) : cartes d'objectif, lentilles, « même effet sur tes objectifs », quatre voies (Motueka, Aurum, East Kent Goldings, Columbus) ; sous chaque picto, un trait par cran du style.
- **5b le cran au doigt** : le doigt sur un picto → « Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka » (`data-crans` de la case).
- **5c les crans comptés** : au repos, chaque picto montre aussi ses crans vides jusqu'au plus grand de la liste (2) : le trait plein ou demi, puis le vide ; on compte sans légende. Même bulle au doigt.

Ce qui casse : les traits restent petits (h-1,5) ; les crans vides, cerclés d'un pixel, sont fins à 390 px.

Captures (`../captures/`, 390 × 844 tactile) : gr5-repos.png (premier écran), gr5-toucher.png (5b, Agrumes de Motueka), gr5-toucher-c.png (5c), gr5-page.png (page entière).

## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte.
