# Voie p21b-etats-suggerer-comparer-acquis — chaque état de Suggérer (q2b) et de Comparer (r6a, x3b), et ses acquis, joués sur la maquette 24.10

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md`, sections « Décisions » et « Suite (24.10, matin) »)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un relevé joué, en captures côte à côte)
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, sur la maquette 24.10 (construction 5345f6ad), mot pour mot : « Ça a bien avancé mais le rail par exemple à
perdu en fonctionnalités et certaines de mes choix ont été perdue » (SPEC-BRASSEUR § 1 ; DEFAUTS-RECURRENTS, D124).
Règle n° 1 (CLAUDE.md) : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. »

Les inventaires de ses maquettes choisies ne relèvent que l'état au repos ; ce qui ne se voit qu'après un toucher, un
onglet, un « + » ou un réglage n'est vérifié nulle part. Ton travail : **pour Suggérer et Comparer, relever chaque état
que sa maquette choisie montre (gestes compris), le jouer sur la maquette 5345f6ad, et dire ce qui est perdu ; puis
vérifier chacun de ses acquis et de ses choix écrits sur la maquette.**

## Les sources (registre `work/refonte-frontend/v4/choix/ecrans.json`, à lire en entier)
1. **Suggérer**, q2b : `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/q2b/` (NOTE.md, pages `etat*.html`) et son
   intégration dans la base v4.10 `work/refonte-frontend/v4/ecran-1/base/consolide/suggestions-radar.html` ; inventaire
   `…/fils15-s5-complexe/donnees/inventaire-q2b.json` ; captures `…/fils15-s5-complexe/captures/q2b-*`. Maquette :
   `prototypes/houblons-v4/maquettes/parcours-5345f6ad/suggerer/etat.html`.
2. **Comparer**, r6a pour la forme (`work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html`, inventaire
   `…/fils22-comparer/donnees/inventaire-comparer.json`), « avec les quelques petites améliorations des autres versions »
   (`…/fils22-comparer/donnees/elements-notes.json`, 37 éléments notés), et les trois compléments x3b (D107 : étapes 60′,
   10′, dry hop ; état au moment de l'ajout ; référence) : `work/refonte-frontend/v4/ecran-1/fils21-choisir/x3b*/` et
   captures `…/fils21-choisir/captures/x3b-*`. Maquette : `…/parcours-5345f6ad/comparer/etat.html`.
3. **Ses acquis et ses choix écrits** : `cerveau/produit/acquis-valides.md` (chaque ligne), SPEC-BRASSEUR § 0 « Ce qui
   vaut aujourd'hui » (ses choix), et ses décisions du 23 et 24.10 dans DEFAUTS-RECURRENTS D105 à D124 (dont la croix
   D109 et D118, l'en-tête commun D119, les traits D110, le panel OSU replié D114, « ~ simulé » D122). Pour chacun : est-il
   tenu dans la maquette 5345f6ad, sur tous les écrans où il vaut (Comparer, Suggérer, Ma bière, l'étape, la fiche) ?

## Ce qu'il faut relever
Chaque état que sa maquette montre : au repos, après chaque toucher (onglets, cartes d'objectif, « + », « Comparer (n) »,
colonnes au toucher, 4ᵉ colonne, panel OSU, étapes 60′ / 10′ / dry hop, référence, « Placer … », pastilles), au retour
(croix), à 390 px puis à 1280 px si sa maquette le montre. Ce qu'il y a à l'écran, mesuré. Puis le même état sur la
maquette, et le verdict.

## Livrables
1. `work/refonte-frontend/v4/choix/etats/suggerer.json`, `…/etats/comparer.json`, `…/etats/acquis.json` :
   `{ "ecran", "choix", "source", "maj", "etats": [ … ] }`, une entrée par état : `id` (préfixe `etat-sugg-`,
   `etat-comp-` ou `etat-acquis-`), `mots` (ses mots, ou la ligne D), `etat` (ce qu'on fait pour l'atteindre), `quoi`
   (ce que sa maquette montre, mesurable), `page_choisie`, `capture_choisie` (existante), `jeu` (page, sélecteur, geste),
   `verdict_5345f6ad` (present, absent ou different), `ecart` (mesuré), `capture_5345f6ad` (existante). Au moins 8 états
   pour Suggérer, 10 pour Comparer, et une entrée par ligne d'acquis-valides et par choix du § 0.
2. Les captures : `work/refonte-frontend/v4/choix/etats/captures/` (`<id>-choisie.png`, `<id>-5345f6ad.png`, 390 × 844).
   Ouvre chaque capture avant de rendre un verdict (L12).
3. `RESULTAT.md` : par écran, la table (id, ses mots, choisie, 5345f6ad, écart), **les choix perdus en tête** ; les
   améliorations de la maquette qui ne contredisent pas sa maquette, à part.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/choix/etats/suggerer.json`, `…/etats/comparer.json`, `…/etats/acquis.json`
- `work/refonte-frontend/v4/choix/etats/captures/etat-sugg-*`, `…/etat-comp-*`, `…/etat-acquis-*`
- `work/missions/2026-10-23-maquette-parcours/voies/p21b-etats-suggerer-comparer-acquis/RESULTAT.md`
Tes scripts et fichiers de travail : dans `os.tmpdir()`, jamais à la racine ni ailleurs dans le dépôt (L17). La voie
p21a écrit en même temps que toi dans `work/refonte-frontend/v4/choix/etats/` (ses fichiers à elle).

## Exigences transversales (recopiées, L05)
- Règle n° 1 : sa maquette choisie fait foi, telle qu'il l'a vue ; rien d'un écran au choix ouvert (Dryhopper,
  Substituer, Levure). Une maquette qui fait autrement est un écart, même si elle paraît mieux : note-le.
- L03 : reprendre tout l'élément ; chaque état, gestes compris. L12 : un effet se mesure, une capture se regarde.
- L14 : à plusieurs variétés, comparer chaque nombre de la capture à la ligne de sa variété.
- Puppeteer-core, 390 × 844, tactile (`hasTouch`, `isMobile`), comme les contrôles de `work/refonte-frontend/v4/tournoi/outils/`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : une ligne (états relevés et perdus, par écran ; acquis non tenus).
