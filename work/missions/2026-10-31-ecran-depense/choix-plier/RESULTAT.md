OK — page « tout plier, déplier » sur D : 5 options en 20 mini maquettes, E proposée

R3-PLIER OK — 5 options — choix-plier/index.html

Voie r3-plier, 02.11, agent concepteur (Opus). Je n'ai touché ni au code de l'app ni aux données réelles. Aucun commit, aucun serveur Vite.
J'ai chargé le skill `boosters-ux`. Je n'ai pas chargé `impeccable` : la forme de la page est celle de `choix-sousfamilles`, déjà acceptée (e-t12).

## Fichiers écrits (tous sous `choix-plier/`)

- `index.html` : la page de choix.
  - En tête : `#a-choisir` et `[data-choix="plier"]`.
  - A est la référence (`data-reference`, badge « son choix D »). B, C, D et E sont des `data-variante`.
  - Visionneuse `dialog`, et une sous-grille qui aligne les vues.
- `maquettes/*.html` : 20 pages statiques à 390 px.
  - Plus `mesure-a-renovation.html` (critère 3).
  - Plus 10 `mesure-pied-*.html`, qui mesurent le chevauchement dans le pied.
- `img/*.png` : les 20 captures, à l'échelle ×2.
- `outils/gen.mjs` : reprend tel quel le balisage de D de `choix-sousfamilles/outils/gen.mjs`.
  - Il compile la feuille avec la configuration Tailwind de l'app (`tw.config.mjs`, `entree.css`, sortie `app.css`).
  - Il écrit `tailles.json` (hauteurs, et mesures du pied) et `donnees.json` (nombres tirés des données).
- `outils/sf.css` : les règles de D, copiées sans changement.
- `outils/pl.css` : les seules règles neuves, préfixées `pl-` (L26).
- `outils/page.cjs` et `outils/page.css` : la page.
- `outils/mesure-a.mjs` : le critère 3. Il produit `controle/mesure-a-cote-a-cote.png`.
- `controle/mesure-a-renovation.png`, `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`.

## Les options (seul varie le geste « tout » et ce qu'il montre)

D reste tel quel :
- même ligne de sous-groupe ;
- un toucher ouvre un groupe ;
- une ligne seule n'a pas de chevron ;
- une ligne à vérifier ouvre son groupe d'office.

Règle commune, la même dans les cinq options : **« tout plier » ne ferme pas un groupe qui porte une ligne à vérifier** (Désinfectant, avec le « 2 Stk » déduit en jaune). Depuis un état mêlé, un geste à bascule déplie tout. Une bande à une seule sous-famille (Consommables) n'a pas de geste.

Le double chevron (lucide chevrons-right ou chevrons-down) est le seul signe neuf. Il reprend le trait du chevron des sous-groupes : » veut dire plié, ⌄⌄ veut dire tout déplié.

| Option | Geste | Touchers pour tout déplier | Ce qu'il coûte |
|---|---|---|---|
| **A, D tel quel** (réf.) | un groupe à la fois | 8 (7 depuis l'état mêlé) | rien |
| **B, en-tête de bande** | point, nom, compte et » de l'en-tête : un toucher plie ou déplie cette bande | 2 (un par bande) | rien en hauteur ; l'en-tête colle déjà en haut (`p3c.css`), donc le geste reste sous les yeux quand on défile |
| **C, bouton du pied** | « » Tout » à côté de Catégorie \| Papier, pour toute la dépense | 1 | avec un point au pied, Confirmer sort de l'écran (mesures ci-dessous) |
| **D, Catégorie ×2** | « Catégorie » allumé porte » ; le toucher une seconde fois bascule | 1 | 19 px de plus dans le pied ; le geste est le moins visible des quatre |
| **E, Plié \| Déplié** (proposée, mon avis) | un segment avec ses deux mots, dans l'en-tête de la feuille, entre le titre et le justificatif | 1 | un segment de 28 px dans l'en-tête, rien en hauteur ; à l'état mêlé, aucun des deux n'est allumé |

**Proposée : E.**
- Ce sont ses mots (« plier, déplier »), et l'état se lit sans icône. Son refus « Les icône sont pas parlant du tout » ne peut pas revenir.
- L'en-tête ne défile pas.
- Le pied reste à Catégorie \| Papier, au point courant et à Confirmer : aucun chevauchement.
- Son prix : la commande est en haut, loin du pouce.

**Vues** de chaque option, toutes à 390 × 844 et défilées jusqu'aux bandes :
1. Tout plié, en clair et en sombre.
2. Tout déplié.
3. Peinture et sols ouvert à la main (état mêlé).

La commande du geste est cerclée en bleu (`pl-vise`), comme dans `choix-captures`.

**Données, toutes fictives.**
- La pièce : Brico Fictif SA, 18.10.2026, 562,10 sur 24 lignes.
- Consommables et Rénovation sont ceux de D : 21,40 ; 454,70, avec 16 lignes, 25 Stk et 7 sous-familles.
- Nettoyage grandit, comme le demande VOIE : 86,00 sur 6 lignes (1 Kg + 6 Stk).
  - CIP alcalin : 2 lignes, 22,40.
  - Désinfectant : 2 lignes, 30,20, dont une unité déduite.
  - Détergent : 2 lignes, 33,40.
- Contrôle : 86,00 + 21,40 + 454,70 = 562,10. Les 8 groupes pliables sont 6 en Rénovation et 2 en Nettoyage.
- Les sommes sont calculées par `gen.mjs`.
- Grep des noms de ses pièces sur `maquettes/` et `index.html` : 0 fichier.

## Critères et sorties

1. `controle-page-choix.mjs … --min=3` → `plier : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, puis `PAGE-CHOIX OK (1 choix)`.
2. `verifier-page.mjs … --page-lot --captures …/controle` → `PAGE OK (20 images chargées, lisible à 390 et 1280 px, sans erreur)`. Ses trois captures sont écrites à la racine de `choix-plier/`, pas dans `controle/`, comme pour `choix-sousfamilles`.
3. `outils/mesure-a.mjs` compare la bande Rénovation de A, tout pliée, à `choix-sousfamilles/img/d-renovation.png`. Sortie :
   - `IDENTIQUE OK (hors du groupe ouvert : 0 pixels d'un niveau sur 255, 1 au-delà, dans le pointillé du pied de liste)` ;
   - en haut, de 0 à « Peinture et sols » : 56 rangées de pixels, 0 différent ;
   - en bas, après le groupe : 442 rangées, 1 pixel différent, en (137, 257) px CSS, écart de 8/255 sur le coin pointillé de « + Ajouter une ligne » ;
   - la ligne « Peinture et sols », fermée chez A et ouverte chez D, est hors comparaison.

   Témoin : D, re-rendu avec sa propre feuille, donne 0 pixel d'écart avec sa capture. Le pixel restant vient donc du tramage du pointillé, qui dépend de sa hauteur dans la page, pas du dessin.
   Le seuil est écrit dans le script : 0 pixel au-delà d'un niveau dans la bande, 2 au plus dans le pied de liste.
4. `controle-choix` est sans objet : l'écran Dépense n'est pas dans `ecrans.json` (`grep -ci depense` → 0). La base est D, de `choix-sousfamilles`, retouche e-t12 comprise. Elle est reprise au pixel (critère 3).

Mesure du pied, avec un point courant posé (`mesure-pied-*`, bord droit de la dernière commande contre 382 px) :

| Option | Avec « ① Date » | Avec « ① Spray unité » |
|---|---|---|
| A, B, E | 382 | 385 |
| C | 414 (+32) | 453 (+71) |
| D | 382 | 404 (+22) |

Avec un point long, A dépasse déjà de 3 px aujourd'hui : le point courant est `flex-none` dans `Pied.tsx`. C est la seule option qui pousse Confirmer hors de l'écran avec un point court.

## Captures ouvertes (L12)

- `img/b-mele.png` : deux en-têtes cerclés, Rénovation et Nettoyage.
  - Première version : Consommables portait » à tort, alors qu'il n'a qu'une sous-famille.
  - J'ai corrigé `bandePliable`, puis tout régénéré.
- `img/c-plie.png` et `img/c-deplie.png` : « » Tout » devient « ⌄⌄ Tout ». En vue déplié, les lignes de Rénovation passent sous le pied.
- `img/d-plie.png` et `img/d-mele.png` : « Catégorie » porte ».
  - Première version : le cercle était coupé par l'`overflow-hidden` du segment.
  - Je l'ai déplacé sur le groupe.
- `img/e-mele.png` : aucun segment allumé. `img/e-plie-sombre.png` : « Plié » allumé, lisible en sombre.
- `img/b-plie-sombre.png` : cercle éclairci (`#7fb2de`), lisible.
- `controle/mesure-a-cote-a-cote.png` : A plié et D ouvert, côte à côte.
- `controle-ordinateur.png` : les cinq colonnes. Le lieu du geste se distingue sans lire : rien, deux en-têtes, pied à droite du segment, segment, en-tête de feuille.
- `controle-haut.png` et `controle-page.png` : deux options par rangée à 390 px, sans débordement.
  - Le texte « ⌄⌄ » s'affichait mal, en indices.
  - J'ai réécrit la tête de B sans ce glyphe, puis rejoué les critères 1 et 2.

Non ouvertes : `a-plie`, `a-deplie`, `a-mele`, `b-plie`, `b-deplie`, `c-mele`, `c-plie-sombre`, `d-deplie`, `d-plie-sombre`, `e-plie`, `e-deplie`. Elles ont le même balisage que les vues ouvertes, seul l'état change. Je les ai vues en vignette dans `controle-ordinateur.png`.

## Doutes

- **La règle de bascule depuis l'état mêlé.** Pour B, C et D, j'ai choisi « déplie tout ». On pourrait aussi vouloir « replie tout » après avoir vérifié un groupe à la main. Seule E laisse les deux. C'est un goût : à trancher par son choix, ou en variante au port.
- **« Tout plier » qui ne ferme pas Désinfectant.** C'est la règle de D, et elle est dite dans la page. S'il veut un vrai « tout fermé », il le dira devant la vue 1.
- **La feuille compilée suit `src/`.** Une autre voie (port de D, sans doute r4-port-d) modifie en ce moment `src/ui/depense/p3c.css`, `Liste.tsx`, `groupes.ts` et `ExpenseSheet.tsx`. Je ne les ai pas modifiés.
  - Une première compilation donnait 840 pixels d'un niveau sur 255 dans l'en-tête de bande. La dernière en donne 0.
  - Une régénération plus tard peut bouger encore, d'un niveau au plus.
- **Le pictogramme dans la page.** Dans les maquettes, le double chevron est un SVG lucide net. Dans le texte de la page, il est écrit « » » ou « double chevron ».
- **Cibles.** B : 28 px de haut, toute la zone gauche de l'en-tête. C et D : 32 px. E : 28 px par segment. Tout est conforme à DESIGN.md (24 px au moins). Le bouton « Rattacher les n » des malts vit dans la même bande : dans B, il reste hors de la zone du geste, mais je ne l'ai pas dessiné (aucun malt dans la pièce).

Prédiction : « E c'est clair, je vois si c'est plié. Mais B c'est pratique aussi quand je suis dans la bande, les deux ? »

DÉCISION À PRENDRE : la règle depuis l'état mêlé (déplie tout ou replie tout) pour B, C et D, si l'une d'elles est choisie. Elle se règle au port, ou par une variante.

CONNAISSANCE : une unité déduite (« repris », jaune pointillé) n'est pas un point du pied. `ExpenseSheet.tsx` l. 640 l'écarte des `chips` ; le pied n'en montre pas. Et dans `Pied.tsx`, le point courant est `flex-none` : avec Catégorie \| Papier et Confirmer, un point de plus de 100 px environ (« ① Spray unité ») déborde déjà de 3 px à 390 px.

LEÇON PROPOSÉE : aucune.
