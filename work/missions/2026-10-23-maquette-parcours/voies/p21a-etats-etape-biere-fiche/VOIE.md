# Voie p21a-etats-etape-biere-fiche — chaque état de ses maquettes choisies (étape hors rail, Ma bière, fiche), joué sur la maquette 24.10

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
appui long, un onglet ou un réglage n'est vérifié nulle part. Ton travail : **pour trois écrans choisis, relever chaque
état que sa maquette choisie montre (gestes compris), le jouer sur la maquette 5345f6ad, et dire ce qui est perdu.**
Le rail de l'étape est relevé par la voie p20 : ne le relève pas (le glisser du moment), mais relève tout le reste de
l'étape.

## Les trois écrans (registre `work/refonte-frontend/v4/choix/ecrans.json`, à lire en entier)
1. **Étape Houblons**, base v4.10 : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html` (et `cas-k2.html`,
   `cas-k3.html`) ; inventaire au repos `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json`. Maquette :
   `prototypes/houblons-v4/maquettes/parcours-5345f6ad/ma-biere/etat.html`.
2. **Ma bière**, base v4.10, onglet Ma bière : `…/base/consolide/biere.html` (et `biere-radar.html`, `biere-absolu.html`) ;
   inventaire `…/base/donnees/inventaire-ma-biere.json`. Maquette : `…/parcours-5345f6ad/biere/etat.html`.
3. **Fiche**, g1 et la fiche courte type Citra cryo : `…/base/consolide/fiche.html` ; inventaire
   `…/base/donnees/inventaire-fiche.json`. Maquette : `…/parcours-5345f6ad/fiche/etat.html`, et la fiche ouverte depuis
   l'étape par l'appui long.

Pour chacun, lis aussi ses mots (SPEC-BRASSEUR § 0 et § 1 ; cherche le nom de l'écran) et ses décisions du 23 et 24.10
(DEFAUTS-RECURRENTS D105 à D124 : la visée D108, la croix D109 et D118, le « ? » D113, le radar d'abord D115, le fil
d'étapes D116, Annuler D120, l'entrée de l'analyse D121). Les captures de sa base sont dans
`work/refonte-frontend/v4/ecran-1/base/captures/` (`consolide-*` : ouvre-les).

## Ce qu'il faut relever, par écran
Chaque état que sa maquette montre : au repos, après chaque toucher (ajout rapide, ×, − / + de dose, « ? », légende,
onglets, visée − / + / bannir, radar, entrée de l'analyse), à l'appui long (fiche), au retour (croix), sur chaque cas
(cas-k2, cas-k3), à 390 px puis à 1280 px si sa base le montre. Ce qu'il y a à l'écran, mesuré (mots, nombres, éléments
marqués). Puis le même état sur la maquette, et le verdict.

## Livrables
1. `work/refonte-frontend/v4/choix/etats/etape.json`, `…/etats/biere.json`, `…/etats/fiche.json` :
   `{ "ecran", "choix", "source", "maj", "etats": [ … ] }`, une entrée par état : `id` (préfixe `etat-etape-`,
   `etat-biere-` ou `etat-fiche-`), `mots` (ses mots, ou la ligne D), `etat` (ce qu'on fait pour l'atteindre), `quoi`
   (ce que sa maquette montre, mesurable), `page_choisie`, `capture_choisie` (existante), `jeu` (page, sélecteur, geste),
   `verdict_5345f6ad` (present, absent ou different), `ecart` (mesuré), `capture_5345f6ad` (existante). Au moins 8 états
   par écran.
2. Les captures : `work/refonte-frontend/v4/choix/etats/captures/` (`<id>-choisie.png`, `<id>-5345f6ad.png`, 390 × 844).
   Ouvre chaque capture avant de rendre un verdict (L12).
3. `RESULTAT.md` : par écran, la table (id, ses mots, choisie, 5345f6ad, écart), **les choix perdus en tête** ; les
   améliorations de la maquette qui ne contredisent pas sa maquette, à part.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/choix/etats/etape.json`, `…/etats/biere.json`, `…/etats/fiche.json`
- `work/refonte-frontend/v4/choix/etats/captures/etat-etape-*`, `…/etat-biere-*`, `…/etat-fiche-*`
- `work/missions/2026-10-23-maquette-parcours/voies/p21a-etats-etape-biere-fiche/RESULTAT.md`
Tes scripts et fichiers de travail : dans `os.tmpdir()`, jamais à la racine ni ailleurs dans le dépôt (L17). La voie
p21b écrit en même temps que toi dans `work/refonte-frontend/v4/choix/etats/` (ses fichiers à elle) ; p20 relève le rail.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : sa maquette choisie fait foi, telle qu'il l'a vue ; rien d'un écran au choix ouvert (Dryhopper,
  Substituer, Levure). Une maquette qui fait autrement est un écart, même si elle paraît mieux : note-le.
- L03 : reprendre tout l'élément ; chaque état, gestes compris. L12 : un effet se mesure, une capture se regarde.
- Puppeteer-core, 390 × 844, tactile (`hasTouch`, `isMobile`), comme les contrôles de `work/refonte-frontend/v4/tournoi/outils/`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : une ligne (états relevés et perdus, par écran).
