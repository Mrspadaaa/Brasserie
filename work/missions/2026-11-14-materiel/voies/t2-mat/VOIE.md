# Voie t2-mat — verdict de passe 2, Stocks › Matériel

- Mission : 2026-11-14-materiel
- Agent : critique (en Opus : Fable interdit)
- Modèle : opus
- Niveau : jugement
- Plafond : 30 tours
- Dépend de : p2-r1, p2-r2, p2-z1, p2-z2, p2-u1, p2-u2
- Décideur en cas de doute : pilote

## Objectif
Avant de montrer au brasseur : pour chacune des 12 variantes v1, « combien et quels problèmes ? » (liste numérotée), et un verdict
MONTRABLE ou A REPRENDRE (seulement pour un défaut bloquant : chiffre faux, texte coupé ou illisible, chevauchement, cible < 44 px
sur un geste principal, coque différente de l'app, cave illisible). M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- Planches : `M/critique/v1-montage-{repos,geste,traiter,ajout,vide}.png` (ouvre-les d'abord), puis les images de chaque variante
  `M/v1/{r,z,u}/<id>/<id>-*.png` (dont `repos-cave-390` et `repos-1280`) et leur NOTE.md (§ Passe 2).
- Ton tri précédent : `M/critique/SYNTHESE.md` (défauts v0 : vérifie qu'ils sont corrigés).
- `M/BRIEF-AUTEUR.md` §1 à §6. Date du jour 14.11.2026.

## Possède
- `M/critique/VERDICT-V1.md`, `M/voies/t2-mat/`. Rien d'autre.

## Consignes
`M/critique/VERDICT-V1.md` : `### <id>` pour les 12 (rq1–4, zq1–4, uq1–4) : verdict `MONTRABLE` ou `A REPRENDRE`, puis P1…Pn (état,
zone, ce qu'on voit, correction). Puis `## Classement` (12, une ligne chacun) et `## Une phrase par variante` (son idée, 12 mots au
plus, pour la page de choix).

## Critères
`GATES.md` ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale : une ligne (montrables, à reprendre).
