# gr2 — Les barres en absolu (faible, moyen, marqué)

Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (`outils/extraire.mjs`, lecture seule de `prototypes/`, feuille `assets/style.css` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, `data-source`, `aria-label`, `data-crans`, `data-valeurs`, `data-inconnues`) ou, pour la fiche, dans les mots sourcés de Nugget (`pack-fiches`, via `fils24-fiche-liste/fla1/commun/donnees.mjs`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.

## Les trois lectures
- **2a tel qu'il est** : Ma bière, Barres, après « Absolu » (lentille sur Absolu, en-tête faible · moyen · marqué).
- **2b le mot sous le doigt** : « Floral · faible · le 16D va jusqu'à moyen · ~ prévu » (palier lu à la position du rond, par tiers de barre ; haut du style lu au bout de la zone).
- **2c au style, l'absolu au doigt** : la section reste au style (lentille Au style). Le doigt tenu sur une famille remplace sa seule barre par sa barre absolue et dit « en absolu : marqué · le 16D va jusqu'à faible · dégusté 18.10 » ; doigt levé, elle revient. Une lecture sans changer de mode.

Ce qui casse : 2c ne montre l'absolu que d'une famille à la fois.

Captures (`../captures/`, 390 × 844 tactile) : gr2-repos.png (premier écran), gr2-toucher.png (2b, Floral), gr2-toucher-c.png (2c, Résineux tenu), gr2-page.png (page entière).

## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte.
