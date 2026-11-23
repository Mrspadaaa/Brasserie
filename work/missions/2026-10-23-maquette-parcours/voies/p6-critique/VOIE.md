# Voie p6-critique — l'avis du critique sur le parcours

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 40 tours
- Dépend de : p5-parcours
- Décideur en cas de doute : pilote

## Objectif
Un avis par écran sur la maquette jouable, comme le brasseur la jugerait, en défauts vérifiables. Pas de
classement ni d'étoile (L27 : indicatif tant que tu n'es pas étalonné sur ces écrans).

## Entrées
- Les captures du parcours : `work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/` (à 390 puis à
  1280 px), et son RESULTAT.md.
- **Règle n° 1** : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Le registre de ses
  choix, écran par écran, avec la capture de chacun : `work/refonte-frontend/v4/choix/ecrans.json`. C'est **la** référence de
  chaque écran ; la carte en fil de fer n'en est pas une (D105). Pour Dryhopper, encore ouvert : a1,
  `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/captures/`.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (§ 0 d'abord) et `work/refonte-frontend/v4/DEFAUTS-COURT.md`.
- Les NOTE des écrans : `prototypes/houblons-v4/parcours/src/ecrans/*/NOTE.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md`

## Consignes
1. Pour chaque écran (ma-biere pour l'étape Houblons, biere pour l'onglet Ma bière, fiche, suggerer, comparer, dryhopper, levure, substituer), une ligne :
   « <écran> : ACCEPTÉ » ou « <écran> : REJET ». Suivent ses défauts : capture, endroit, ce qui est faux.
2. Un REJET cite SPEC-BRASSEUR ou DEFAUTS (le numéro D…), sinon c'est une réserve.
3. Pour chaque écran choisi, mets d'abord sa capture du parcours à côté de celle de son choix (registre). Il doit
   reconnaître son écran ; un écart qu'il ne reconnaîtrait pas est un REJET (D105), même si le reste est juste.
4. Juge aussi le parcours : retrouve-t-il, d'un écran à l'autre, sa stout, son houblon, ses couleurs ? Un geste
   fait-il ce qu'il attend ? Comparer est-il bien r6a, à peine amélioré ?
5. Pas de reformulation de goût en défaut : ce que tu préfères n'est pas un défaut.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
`RESULTAT.md` au format de l'agent critique. Réponse finale au pilote : une ligne (nombre d'ACCEPTÉ et de REJET).

## Version D107 à D121 (24.10, nuit) — un nouvel avis, côte à côte

Le brasseur a commenté la version publiée (d332792c) : quinze défauts, D107 à D121 (SPEC-BRASSEUR § 1 ;
DEFAUTS-RECURRENTS, lignes D107 à D121, à lire en entier). La nouvelle version les reprend. Ton avis précédent avait
accepté les huit écrans de d332792c ; la supervision l'a dit (« j'ai publié d332792c sur CHOIX OK et critique ACCEPTÉ,
sans cette comparaison », L03). Cette fois, tu juges **sur la page côte à côte**.

### Entrées
- La page « sa base | la maquette », mêmes états, 390 px : `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/
  index.html` et ses images `img/<état>-base.png`, `img/<état>-maquette.png` (et `-plein`), refaites par le pilote sur
  la construction finale (`prototypes/houblons-v4/maquettes/parcours/`). Ouvre chaque paire en image.
- Les variantes D121 (le bloc du profil de l'étape qui ouvre l'analyse) : voir `prototypes/houblons-v4/parcours/src/
  ecrans/ma-biere/NOTE.md` (section de la reprise de l'étape) et ses captures ; la version en porte une.
- Les NOTE des écrans (`## Écarts` : chaque écart à sa base doit avoir ses mots).
- La batterie du pilote : `node prototypes/houblons-v4/parcours/outils/batterie.mjs --sans-construire` (sa sortie est
  dans MISSION.md, « État de reprise »).

### Consignes
1. Un avis par écran, sous le titre `## Version D107 à D121`, au même format : « <écran> : ACCEPTÉ » ou « <écran> :
   REJET », suivi des défauts (capture, endroit, ce qui est faux), pour ma-biere (étape), biere, fiche, suggerer,
   comparer, dryhopper, levure, substituer.
2. Pour chacun des quinze défauts, une ligne « D1xx : levé » ou « D1xx : pas levé — pourquoi », en regardant la capture
   qui le montre.
3. D121 : dis laquelle des variantes tu montrerais en premier, et ce que le brasseur dira des autres (indicatif, L27).
4. Un écart à sa base sans ses mots est un REJET (règle n° 1, D105, D117). Un REJET cite SPEC ou DEFAUTS ; sinon c'est
   une réserve. Ce que tu préfères n'est pas un défaut.
5. Prédis sa réaction, en une phrase par écran, avec ses mots habituels.
