# Voie p24-controle-etats — le contrôle qui rejoue chaque état de ses maquettes choisies

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md`, section « D124 »)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle joué, ses témoins)
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : p21a, p21b (leurs relevés sont faits)
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
D124 : « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes choix ont été perdue ».
CHOIX OK restait vert parce que ses inventaires ne relèvent que l'état au repos. Les voies p21a et p21b ont relevé 113
états de ses maquettes choisies, joués sur la maquette 5345f6ad : `work/refonte-frontend/v4/choix/etats/{etape,biere,
fiche,suggerer,comparer,acquis}.json` (lis leurs RESULTAT.md : `../p21a-etats-etape-biere-fiche/RESULTAT.md`,
`../p21b-etats-suggerer-comparer-acquis/RESULTAT.md`). Ton travail : **le contrôle qui rejoue ces états, pour qu'une
perte ne passe plus jamais inaperçue** (L13 : il échoue sur 5345f6ad avant toute correction).

## 1. Compléter chaque état (dans les six JSON, sans rien retirer)
Pour chaque état, ajoute :
- `voulu` : la ligne D qui a voulu l'écart (D109 croix, D113 « ? », D115 radar d'abord, D116 fil d'étapes, D121, D74
  pictos, D107 Comparer r6a + x3b…) quand l'écart est voulu par lui ; sinon « ». Un écart voulu n'est pas rejoué. Lis les
  colonnes `ecart` et les sections « Voulus par lui » des deux RESULTAT.md ; dans le doute, « » (l'état sera rejoué).
- `verif` (pour chaque état non voulu, `present` compris, pour qu'il ne se perde pas demain) :
  `{ "route": "ma-biere|biere|fiche|suggerer|comparer|…", "page_choisie": "<chemin de sa page>", "selecteur_choisie":
  "<sélecteur dans sa page>", "geste": "repos|toucher|appui-long|survol|onglet|reglage", "attendu": ["mot ou nombre",
  …], "interdit": ["…"] }`. `attendu` : 2 à 6 mots ou nombres **mesurés sur sa maquette choisie** après le geste
  (« Hopsteiner 2025 », « 11–14 % », « pas senti », « J+3 », « aucun IBU », « Changer de levure »…), lus dans le texte
  visible ; `interdit` : les mots qu'elle n'a pas et que la maquette a mis à la place quand il le faut (« dry hop » à
  l'étape, « ? IBU »).
- Le **contrat de la maquette** : dans une maquette construite, l'élément déclencheur d'un état porte
  `data-etat="<id>"` (par exemple `data-etat="etat-fiche-sources"` sur le bouton « Sources › ») ; pour un état « repos »,
  l'élément qui le montre. C'est ce que les concepteurs poseront à la reprise.

## 2. Le contrôle
`work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`, puppeteer-core, 390 × 844 tactile (1280 × 800 pour un état
qui le demande) :
- `node controle-etats.mjs <dossier construit> [--ecran=fiche] [--etats=<dossier des JSON>]` : pour chaque état non
  voulu, ouvre `<dossier>/<route>/etat.html` (ou la page de cas citée par l'état), cherche `[data-etat="<id>"]`, joue le
  geste, et vérifie que chaque mot de `attendu` est visible et qu'aucun de `interdit` ne l'est. Sortie : une ligne par
  état (`etat-… OK` ou `etat-… ECHEC : …`), puis `ETATS OK (n/n)` ou `ETATS ECHEC (k/n)`.
- `--choisie` : le témoin positif ; joue chaque état sur `page_choisie` avec `selecteur_choisie` → `ETATS OK`.
- Un sélecteur absent, un geste sans effet, un mot manquant : échec de l'état, avec la mesure.

## 3. Le brancher
- `work/refonte-frontend/v4/choix/ecrans.json` : ajoute dans `controles` de chaque écran choisi
  `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs {dossier} --ecran=<etape|biere|fiche|suggerer|comparer>`,
  et pour l'écran `etape-houblons` aussi `work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs {dossier}`
  et `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs {dossier} --froid` (écrits par p20 et p19 ; s'ils
  manquent quand tu finis, écris-le dans RESULTAT.md). Ne change rien d'autre du registre.
- Les acquis (`acquis.json`) se rejouent sur l'écran où chacun vit (`verif.route`).

## Témoins
- `--choisie` → `ETATS OK` ;
- `prototypes/houblons-v4/maquettes/parcours-5345f6ad` → `ETATS ECHEC` (au moins les états absents) ;
- `node controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-5345f6ad` → `CHOIX ECHEC` (il passait).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`
- `work/refonte-frontend/v4/choix/etats/*.json` (ajouts `voulu` et `verif` seulement)
- `work/refonte-frontend/v4/choix/ecrans.json` (les lignes `controles` seulement)
- `work/missions/2026-10-23-maquette-parcours/voies/p24-controle-etats/RESULTAT.md`
Scripts de travail : `os.tmpdir()`. La voie p20 écrit `controle-fonctions-rail.mjs` et `inventaire-rail.json` : ne les
touche pas.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : sa maquette choisie fait foi ; rien d'un écran au choix ouvert. L12 : un effet se mesure.
- M10 : échappements écrits par l'outil d'édition, puis `node scripts/agents/systeme.mjs cablage` ; le jeton attendu ne
  figure pas dans la commande d'un critère. L26 : script client dans une fonction immédiate.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : une ligne (états rejoués, voulus, sorties sur ses maquettes et sur 5345f6ad).
