# Voie c1 — tri du panel du compagnon (s1 à s3)

- Mission : 2026-11-14-compagnon
- Agent : critique
- Modèle : opus (Fable interdit jusqu'à nouvel ordre)
- Niveau : conception
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : s1, s2, s3
- Décideur en cas de doute : pilote

## Objectif
Classer les 12 mini maquettes du compagnon comme le brasseur les jugerait, garder 3 candidates diverses avec leurs greffes, et lister les défauts de chacune, dans `SYNTHESE.md`.

## Entrées
- `work/missions/2026-11-14-compagnon/DOSSIER.md` — la question, la base, les exigences.
- `work/missions/2026-11-14-compagnon/ANALYSE.md` — les défauts de l'écran actuel.
- `work/missions/2026-11-14-compagnon/voies/s1`, `voies/s2`, `voies/s3` — pour chaque variante `<id>-clair.png`, `<id>-cave.png`, `NOTE.md`. Ouvrir chaque `-clair.png` en plein format ; les `-cave.png` des 3 candidates au moins.
- `work/missions/2026-11-14-compagnon/analyse/cap/planche-390-clair.png` — l'écran actuel.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-compagnon/critique`

## Consignes
Charger `boosters-ux` et `impeccable`. Question ouverte d'abord, sur chaque variante : « combien et quels problèmes ? » (liste numérotée, D344), puis le classement 1 à 12, sans rejet (le brasseur voit tout). Garder 3 candidates **diverses** (pas trois déclinaisons d'une même idée) ; pour chacune, les greffes à prendre ailleurs, même dans les plus extravagantes. Juger comme le brasseur : verdict et geste d'abord, peu de texte, premier plan léger, détail à un toucher, aucun nom de modèle ou de fournisseur, vrais nombres. Signaler tout écart aux données du dossier (un nombre faux, une unité absente). Aucun sous-agent.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Aucun nom de modèle ni de fournisseur d'IA à l'écran ; virgule décimale ; deux thèmes.
- Rien appliqué sans cases cochées puis validation ; hors ligne : question gardée ; trois modes ; remise à zéro confirmée ; « Mes conversations ».
- Ton avis est indicatif (L27) : tu classes, tu ne caches rien.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `critique/SYNTHESE.md` : classement 1 à 12 (id, une ligne), candidates (3 ids) avec greffes, défauts numérotés par variante, défauts communs à corriger en passe 2.
- `critique/RESULTAT.md` tenu au fil ; images ouvertes listées.
- Tests : aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-compagnon/outils/controle-synthese.mjs > work/missions/2026-11-14-compagnon/critique/tests.txt`.
Réponse finale au pilote : une ligne (les 3 candidates).
