# Voie p20-inventaire-rail — chaque fonction du rail de sa base, jouée sur sa base et sur la maquette 24.10

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md`, sections « Suite (24.10, matin) » et « Décisions »)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un inventaire joué, un contrôle, ses témoins)
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, sur la maquette 24.10 (construction 5345f6ad), mot pour mot : « Ça a bien avancé mais le rail par exemple à
perdu en fonctionnalités et certaines de mes choix ont été perdue » (SPEC-BRASSEUR § 1, « Des fonctions et des choix
perdus » ; DEFAUTS-RECURRENTS, D124). Avant, sur le même rail : « Le rail c'est toujours n'importe quoi. Il y a un vrai
historique dessus » (D123).

Cause : l'inventaire de l'étape (`work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json`) ne relève que
l'état au repos (une ligne « etape-frise »). Les fonctions du rail, qui ne se voient que pendant et après un geste, n'y
sont pas ; CHOIX OK et RAIL OK restent verts sur une maquette qui les a perdues.

Ton travail : **relever toutes les fonctions du rail de sa base v4.10, les jouer sur sa base puis sur la maquette
5345f6ad, et écrire le contrôle qui les rejoue.** C'est le rail de l'étape Houblons (la frise verticale du brassin), pas
Dryhopper (écran au choix ouvert : rien n'en vient, règle n° 1).

## Sources (toutes à lire ; l'historique du rail est là)
- Sa base jouable : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html`, et à côté `cas-ebu45.html`,
  `cas-ebu120.html`, `cas-ebu200.html`, `cas-k2.html`, `cas-k3.html`. Ouvre-les dans Chrome (puppeteer-core, 390 × 844,
  tactile) et joue chaque geste avant d'écrire quoi que ce soit.
- Le brief du rail : `work/refonte-frontend/v4/ecran-1/base/BRIEF-RAIL.md` (ses mots du 18.10, la loupe, les segments).
- Ses mots, mot pour mot : `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (cherche rail, slider, glisser, loupe, échelle,
  whirlpool, J+, levure, ébullition, 120, 200, 45).
- Les défauts du rail, chacun une fonction à garder : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, lignes D27, D28,
  D34 à D37 (et D37 révisé), D41 à D47, D55, D56, D61 bis, D64, D69, D111, D123. Lis chaque ligne en entier.
- Les captures de sa base (avant, pendant, après) : `work/refonte-frontend/v4/ecran-1/base/captures/` : `v4-geste-*`,
  `consolide-glisser-60-*`, `consolide-glisser-120-*`, `consolide-nugget-*-pendant.png` (10, 35, 55, p14-620, wp75),
  `consolide-motueka-35-nugget-35-pendant.png`, `consolide-nugget-15-motueka-40-pendant.png`, `consolide-cas-ebu*`,
  `consolide-ebullition-*`, `brasseur-1-nugget-35-*`. Ouvre chacune en image.
- Les contrôles existants, pour réemployer leur façon de jouer le geste (ne les modifie pas) :
  `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs`, `controle-geste-etape.mjs`,
  `prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs`.
- La maquette rejetée, déjà rassemblée : `prototypes/houblons-v4/maquettes/parcours-5345f6ad/` (pages de route
  `ma-biere/etat.html`, `ma-biere/cas-ebu45.html`, `ma-biere/cas-ebu120.html`, `ma-biere/cas-k3.html` ; servie en
  `file://`). La maquette en cours : `prototypes/houblons-v4/maquettes/parcours/` (mêmes routes ; lecture seule).

## Ce qu'il faut relever (au moins, et tout ce que tu trouves en plus)
Au repos, pendant le geste (doigt tenu, à plusieurs positions), après le lâcher, et geste interrompu :
- la loupe : au repos aucune graduation ; pendant, le segment sous le doigt s'ouvre et révèle ses graduations, les autres
  se resserrent ; au lâcher tout se referme (mesure le rapport sous le doigt / au loin) ;
- chaque segment et son échelle : ébullition par 5′ de la durée à 0′ ; whirlpool en °C (100 à 60 par 5) et sa durée
  réglable sur la carte ; la levure comme étape ; fermentation et post-fermentation en J+0 à J+14 ; repères écrits ;
- la carte pendant le geste (repliée, nom gardé, translation seule, étiquette du moment qui suit, ombre seulement
  pendant) ; après (accrochée à la tranche, IBU de la ligne et total recalculés au lâcher, mots du moment : « à froid »,
  « aucun IBU », « whirlpool », J+n et son réglage − / +) ;
- l'ébullition à 45′, 120′, 200′ (rail qui commence à la durée, rien au-delà, durée lue avec son renvoi, sans −/+) ;
- plusieurs houblons (cas-k3, cas-k2) : rien ne saute ni ne se chevauche, l'échelle respectée en passant sur un autre ;
- la fluidité (la carte suit le doigt), le geste interrompu qui rend la carte, les ajouts proposés hors du rail ;
- tout autre geste ou état de sa base sur le rail (réglage de dose, ×, appui long depuis le rail, etc.).

## Livrables
1. `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json` : `{ "maj", "source", "fonctions": [ … ] }`,
   une entrée par fonction : `id` (préfixe `rail-`), `mots` (ses mots exacts, ou la ligne D citée), `defaut` (Dnn ou « »),
   `quoi` (ce que fait sa base, mesurable), `etat` (repos, pendant, apres, interrompu), `page_base`, `capture_base`
   (chemin existant, prise par toi ou déjà dans base/captures), `jeu` (comment la jouer : page, poignée, trajet du doigt,
   mesure), `verdict_5345f6ad` (present, absent ou different), `ecart` (ce qui manque ou diffère, mesuré),
   `capture_5345f6ad` (chemin existant), `controle` (`controle-fonctions-rail` ou, pour le côté froid déjà contrôlé par
   la voie p19, `controle-geste-etape --froid`). Au moins 18 fonctions.
2. Les captures : `work/refonte-frontend/v4/ecran-1/base/captures/rail-inventaire/` (base et maquette, même état, même
   nom suivi de `-base.png` et `-5345f6ad.png`). Ouvre chaque capture avant de rendre un verdict (L12).
3. Le contrôle `work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs` : lit `inventaire-rail.json` et
   joue chaque fonction dont `controle` vaut `controle-fonctions-rail`, au doigt (390 × 844, tactile).
   `node controle-fonctions-rail.mjs <dossier> [--page=index.html]` : `--page=index.html` = sa base (pages `cas-*.html`
   à côté) ; sans option = une maquette construite (pages `ma-biere/etat.html`, `ma-biere/cas-*.html`). Une page
   attendue absente est un échec de la fonction qui la demande. Sortie : une ligne par fonction (`rail-… OK` ou
   `rail-… ECHEC : écart mesuré`), puis `FONCTIONS-RAIL OK (n/n)` ou `FONCTIONS-RAIL ECHEC (k/n)`.
4. Un témoin `work/refonte-frontend/v4/tournoi/outils/temoins/fonctions-rail-sans-loupe/` (sa base copiée, la loupe
   retirée) → ECHEC.
5. La ligne D124 de `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` (écrite par le pilote, `tourne`
   à `non`) : passe `tourne` à `oui` et écris son `resultat` (sorties sur la base, 5345f6ad, témoin) quand le contrôle
   échoue bien sur 5345f6ad. Ne touche à aucune autre ligne.
6. `RESULTAT.md` : la table des fonctions (id, ses mots, base, 5345f6ad, écart), les fonctions perdues en tête, les
   sorties du contrôle sur la base, sur 5345f6ad et sur le témoin ; `LEÇON PROPOSÉE : …` s'il y a lieu.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json`
- `work/refonte-frontend/v4/ecran-1/base/captures/rail-inventaire/**`
- `work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/fonctions-rail-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D124 seulement
- `work/missions/2026-10-23-maquette-parcours/voies/p20-inventaire-rail/RESULTAT.md`
Fichiers de travail : dans `os.tmpdir()`, jamais à la racine (L17). `controle-geste-etape.mjs` appartient à la voie
p19 (en même temps que toi) : ne le modifie pas.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : sa base fait foi, telle qu'elle est ; rien d'un écran au choix ouvert (Dryhopper). Si la maquette fait
  mieux que sa base sur un point, note-le dans `ecart`, mais le verdict reste celui de la base.
- L03 : reprendre tout l'élément ; chaque état, gestes compris. L12 : un effet se mesure, une capture se regarde.
- L26 : script client dans une fonction immédiate, pas de `String.replace` pour assembler du code.
- M10 : échappements écrits avec l'outil d'édition, puis `node scripts/agents/systeme.mjs cablage` ; le jeton attendu ne
  figure pas dans la commande d'un critère.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : une ligne (nombre de fonctions, nombre perdues, sorties du contrôle).
