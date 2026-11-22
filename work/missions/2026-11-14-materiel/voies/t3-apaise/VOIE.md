# Voie t3-apaise — verdict des variantes apaisées de zq1

- Mission : 2026-11-14-materiel
- Agent : critique (en Opus : Fable interdit)
- Modèle : opus
- Niveau : jugement
- Plafond : 30 tours
- Dépend de : v2-za1, v2-za2, v2-za3, v2-za4
- Décideur en cas de doute : pilote

## Objectif
Ses mots (15.11) : « zq1 Le fil du temps — J'aime bien mais un peu "stressant" c'est le plus pratique mais le plus anxiogène ».
Juger za1–za4 contre zq1 (sa base) : laquelle est vraiment plus calme sans perdre le « pratique » ? Pour chacune, « combien et
quels problèmes ? ». M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- Planches (d'abord) : `M/critique/v2-montage-{repos,geste,traiter,ajout,vide,repos-1280}.png` (zq1 puis za1–za4).
- Images : `M/v2/<id>/<id>-*.png` (dont `repos-cave-390`), NOTE.md ; base `M/v1/z/zq1/`.
- `M/BRIEF-APAISE.md`, `M/BRIEF-AUTEUR.md` §1 à §5.

## Possède
- `M/critique/VERDICT-V2.md`, `M/voies/t3-apaise/`. Rien d'autre.

## Consignes
`M/critique/VERDICT-V2.md` : `### <id>` pour za1–za4 : verdict `MONTRABLE` ou `A REPRENDRE` (bloquant seulement : chiffre faux,
texte coupé, chevauchement, cible < 44 px sur un geste principal, coque différente, cave illisible, ou variante trop proche de zq1
pour qu'il voie la différence), « plus calme que zq1 : oui/non, pourquoi », puis P1…Pn avec correction. Puis `## Classement` et
`## Une phrase par variante` (12 mots au plus).

## Critères
`GATES.md` ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale : une ligne.
