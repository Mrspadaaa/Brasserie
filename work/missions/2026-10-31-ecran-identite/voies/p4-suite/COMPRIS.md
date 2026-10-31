# COMPRIS — p4-suite

## Objectif
Faire terminer `npm test -- --maxWorkers=2` sans « heap out of memory ». Trouver le geste de la graine 42 du singe de l'atelier de
l'eau où la mémoire s'emballe, nommer la cause (défaut de l'app ou du harnais), la corriger à la cause avec un test rouge avant.
Trouver aussi quel fichier `tests/integration/hopV55*` épuise le tas quand il tourne seul, nommer et corriger.

## Écrit dans
`tests/integration/monkey.test.tsx` (harnais seulement), `src/ui/SaltSolver.tsx` et les fichiers water que la cause désigne,
les `hopV55*` que la cause désigne, `vitest.config.ts` seulement si mesuré, tests neufs, ce dossier. Sondes dans ce dossier ou le
scratchpad.

## Fini quand
G1 à G8 de GATES.md : singe seul vert (6 graines), non réduit (42 et 99, 250 gestes, 251 lignes), hopV55 intégration verts, tsc, build,
suite entière verte, RESULTAT.md avec le geste, TEMOIN AVANT, hopV55, Fichiers touchés.

## Ne fait pas
Ne réduit pas le singe (graine, geste, assertion, plafond). Ne touche pas aux fichiers des autres voies (`src/ui/identite/`,
`src/ui/finance/`, `purchaseEntry`, `stockLineMatching`, tests identite/depense), ni `functions/.env`, `.codex/`, manifeste, `work/refonte-frontend/`.
Pas de commit, pas de stash, pas de Gemini, pas d'installation.

## Doutes
La cause peut être le harnais (journal, écouteur) ou l'app (valeur extrême). Le tas peut monter par accumulation sur toute la
séquence plutôt que par un seul geste. Les hopV55 peuvent être lourds par nature (catalogue).
