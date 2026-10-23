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
