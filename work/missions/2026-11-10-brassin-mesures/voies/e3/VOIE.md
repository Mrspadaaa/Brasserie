# Voie e3 — captures côte à côte des cinq choix portés (mission 2026-11-10-brassin-mesures)

- Agent : executant · Modèle : sonnet · Plafond : 40 tours · Décideur : pilote
- Lis : `../p3/RESULTAT.md` (ce qui est porté, DEMANDE EXECUTANT s'il y en a), `../vj/jour.mjs` (script qui joue la journée), la page
  `../../page-v3/index.html` (options 1C, 2B, 2C, 3C, 4C, 5C ; images `../../page-v3/img/`).
- Banc : worktree `C:/Users/mrspa/AppData/Local/Temp/p3-wt` (branche p3/choix, sha 8c795048), Vite en arrière-plan sur un port libre,
  `?dev-local`, puis arrêté à la fin.

## Objectif
Pour chacune des options portées, capture de l'app à 390 tactile, clair puis cave, au même état que l'image de la page v3, et une planche
côte à côte (page à gauche, app à droite). Ouvre chaque planche ; écris dans RESULTAT.md, par option, « pareil » ou l'écart vu.

## Contrôles
- La ligne « Tests » : sans objet ; le tableau option / pareil-ou-écart dans `tests.txt` de cette voie (comme `--reporter=dot > …/e3/tests.txt`).

## Possède
`work/missions/2026-11-10-brassin-mesures/voies/e3/**`. Rien dans `src/`, ni commit, aucune donnée réelle.

## Rendre
`RESULTAT.md` tenu au fil (après chaque option). Réponse finale : une ligne.

## Reprise (pilote) — agent sonnet
Le parcours de `../vj/jour.mjs` n'atteint pas l'ensemencement ni la clôture : utilise `../c3/banc-fin2.mjs` et `../c3/banc-jour.mjs`
(ils y arrivent : captures `../c3/captures/apres/clair-fin2-*`), adaptés à p3-wt. Compare les 5 options restantes (1C, 2C, 3C, 4C, 5C).
