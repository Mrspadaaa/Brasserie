OK — quatre légendes sous les pastilles, en pictos : au doigt, bande en pictos, mots des fiches, trié par ton

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-legendes/legz1/{etat.html,NOTE.md,style.css}` — « Au doigt » (tiède) : la
  bande est une piste, une ligne fixe juste dessous lit la case tenue (picto au ton, famille, 2/4, mots des fiches) ;
  13ᵉ repère ◇. Le geste marche dans la page (toucher Floral → « Floral 2/4 géranium · floral » ; glisser → Résineux ;
  Motueka Melon → « 0/2 — »).
- `…/legz2/{etat.html,NOTE.md,style.css}` — « La bande en pictos » (chaude) : les 12 cases sont les 12 pictos au ton
  vif / pâle / gris ; clé d'une ligne au « ? » avec trois pictos pris dans la bande et le ◇.
- `…/legz3/{etat.html,NOTE.md,style.css}` — « Les mots des fiches » (chaude) : sous la bande, chaque famille présente
  avec son picto et les mots réels des fiches, les absentes en pictos gris, puis ◇.
- `…/legz4/{etat.html,NOTE.md,style.css}` — « Trié par ton » (chaude) : trois groupes ouverts par la case même (vive,
  pâle, grise), pictos et noms ; on lit combien de familles sont fortes.
- `…/captures/legz1.png` à `legz4.png` (390 × 844, densité 2), toutes ouvertes et regardées.
- Base : la maquette du soir rendue par Chrome et figée telle quelle (DOM, `style.css` copié), seule la légende
  change ; pictos = symboles de la planche standard en trait `currentColor` (`pz-<famille>`), aucun dessin neuf ;
  données de `pack-fiches.json` (Nugget 2/4, Motueka 2/2, ◇ gingembre · resiny, ◇ mojito · fruité). Script de
  construction dans le scratchpad (hors dépôt).

## Critères
- G1 `node work/refonte-frontend/v4/ecran-1/fils24-legendes/outils/legendes.mjs legz1 legz2 legz3 legz4` →
  `LEGENDES-BIEN-4`.
- G2 `node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-legendes legz1 legz2 legz3 legz4 --page=etat.html`
  → `TRAIT OK` (14, 42, 36, 36 pictos, 0 faute).
- Joués une fois, hors GATES : `controle-commun.mjs … --page=etat.html --sans=mots,fiche,legende` → `COMMUN OK`
  (raisons des `--sans` dans chaque NOTE : page figée sans parcours.js pour la fiche ; état ouvert demandé par le brief
  pour la légende ; v0 pour les mots). Deux corrections au premier passage : contraste « agrumes » 4,34:1 (legz3, panneau
  blanc), rayon 6 px (legz4, 8 px) ; le ton pâle est passé de couleur mélangée à `opacity .5` du jeton (STANDARD S2).
  `controle-panel.mjs` sur les quatre captures : remplissage médian 0,56, 0 sous 0,50 ; `PANEL ECHEC` sur la seule
  diversité (0,93) : les quatre pages sont le même écran repris tel quel, comme le brief le demande.
- `git status --short` : rien hors de « Possède » (`pistes-l5f.png` à la racine est antérieur à la voie).

## Prédiction
Il dit « legz3 c'est ça, on voit vraiment ce que le houblon donne » et garde la lecture au doigt de legz1 comme
geste (« mais ça prend une ligne »), trouve legz2 « trop chargé, on lit plus la bande » et legz4 « trop haut ».

DÉCISION À PRENDRE : aucune (la lecture au repos de legz1 contre « légende derrière un ? » D89 est un axe de variantes,
pas un choix à bloquer).

CONNAISSANCE : une maquette figée s'obtient en rendant la construction (`parcours-sortie/*/etat.html`) dans Chrome,
en retirant `parcours.js` et en sérialisant le DOM avec `style.css` copié : fidèle au pixel, statique, et les
symboles `p-<famille>` restent disponibles ; la fiche à l'appui long n'y marche plus (D25 à `--sans`).

LEÇON PROPOSÉE : aucune.
