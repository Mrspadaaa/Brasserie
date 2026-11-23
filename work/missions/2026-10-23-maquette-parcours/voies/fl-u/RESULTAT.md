OK — huit concepts v0 de la liste de la fiche (série u), COMMUN OK, PANEL OK

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flu1/` … `flu8/` : `etat.html` et `NOTE.md` (chaleur, idée, ce qui tient, ce qui casse, sorties des contrôles).
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flu<n>-premier-ecran.png`, `flu<n>-page.png`, `flu<n>-absolu.png` (lentille sur absolu), plus `flu1-appui-long.png` (fiche courte ouverte par l'appui long sur le nom). Tout est capturé à 390 × 844, DPR 2.
- Générateur et scripts de capture dans le scratchpad (os.tmpdir), rien à la racine. `git status` ne montre que mes dossiers flu*.

## Les concepts, une ligne chacun
Chaque concept affiche sa chaleur dans sa NOTE.
- flu1, chaleur froide : une ligne par famille (picto, nom, 4 crans, mots), rangée du plus dit au moins dit, avec une barre « stout ». Tient : g1 se lit d'un coup. Casse : peu de surprise.
- flu2, chaleur froide : des cartes de famille en couleur pleine, sur deux colonnes, avec l'étiquette « attendu en stout ». Tient : le code couleur devient la liste. Casse : l'orangé plein rappelle l'alerte, et les étiquettes du radar sont serrées.
- flu3, chaleur tiède : « En face de ta stout », la colonne brune du BJCP 16D (floral, herbal, earthy) reliée aux mots de Nugget, puis « Nugget en dit plus ». Tient : l'au style devient la lecture. Casse : les mots du BJCP sont en anglais, et le 16D reste une hypothèse.
- flu4, chaleur tiède : « Ce que le radar ne dessine pas », en quatre tuiles (mots par pointe, hors des 12, personne n'en parle, les fiches ne disent pas pareil). Tient : les désaccords entre fiches sont une information vraie et neuve. Casse : la tuile des désaccords est la plus écrite.
- flu5, chaleur tiède : « Précis ou vague », 6 mots précis sur 16 en grosses pastilles, les noms de famille répétés en petit, le rien en « ? ». Tient : on voit qu'une fiche est floue ou riche. Casse : le tri précis / vague est notre règle, à faire valider.
- flu6, chaleur chaude : les mots au bout des rayons, chaque pointe du radar portant ses mots. Tient : radar et mots se lisent ensemble. Casse : écart voulu à D115, et les étiquettes Agrumes et Tropicaux se touchent.
- flu7, chaleur chaude : les mouillettes de parfumeur, une bande par famille trempée selon les fiches (24 px par fiche), avec une agrafe « stout » et des bandes blanches « ? ». Tient : une image forte qui se compare d'un coup d'œil. Casse : le radar est petit et sans étiquettes.
- flu8, chaleur chaude : une entrée de dictionnaire, avec un sens numéroté par famille, les mots en italique fiche par fiche, l'étiquette « stout » et le radar en figure dans la marge. Tient : une typographie distincte, et tout tient au premier écran. Casse : beaucoup de texte (D73).

## Sorties décisives
- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun.mjs … flu1 … flu8 --page=etat.html --sans=mots`. Tous les contrôles passent : couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende, parlant et valeurs brutes, d'où `COMMUN OK`. Le contrôle des mots est sauté, comme le prévoit le contrat.
- Panel : `controle-panel.mjs` sur les 8 premiers écrans donne « remplissage médian 0,74, 0 sous 0,50 · ressemblance moyenne 0,89 · paires presque identiques 0/28 », d'où `PANEL OK`.
- G3 : `NOTE OK`.
- Captures ouvertes et regardées : les 8 premiers écrans et les pages, à côté du plancher g1 (`base/captures/consolide-fiche-390.png`), l'état absolu de flu3 et l'appui long de flu1. Deux premières versions ont été refaites : flu6 avait ses pictos décalés et un vide en haut, et flu2 un problème de contraste sur la carte Herbacé.

## Prédiction
« flu5 et flu3 très bien, flu2 donne vraiment bien en couleur, flu7 original mais le radar trop petit, flu8 trop de texte. »

DÉCISION À PRENDRE :
- `controle-choix.mjs` attend une maquette construite (routes `<dossier>/<route>/etat.html`) et ne s'applique pas à un concept isolé. Le contour de g1 est repris tel quel ; la liste est le facteur libre. À rejouer à l'intégration.
- Dans flu6, la liste est posée sur le radar et non dessous (D115). C'est à lui de dire si l'écart vaut.
- Sur le pilote : j'ai suivi sa consigne et n'ai lu du brief que trois sections. Les données ont été prises directement dans `pack-fiches.json` et `style-bands.json`, et le plancher dans le registre (fiche g1).

CONNAISSANCE : Nugget, d'après pack-fiches.json, a 16 mots dans ses 4 fiches, dont 6 précis (ananas, litchi, noix de coco, pineapple, géranium, gingembre). Tous les mots précis sauf « pineapple » viennent de Beer Maverick, et les autres fiches répètent le nom de la famille. La boutique Hopsteiner US cite le résineux, que la fiche variété Hopsteiner ne cite pas. Pour la 16D, le BJCP nomme terreux, herbacé et floral, tous optionnels.

LEÇON PROPOSÉE : `controle-fiche` (D25) exige qu'un toucher court sur un houblon n'ouvre pas la fiche. Une page dont l'état est « fiche ouverte » échoue donc par construction : la base `consolide/fiche.html` elle-même donne FICHE ECHEC. Ici, la fiche g1 est la feuille de la page, et l'appui long sur le nom ouvre la fiche courte. Il faut écrire cette convention dans le brief des lots de fiche, ou donner au contrôle un mode « --fiche-ouverte ».
