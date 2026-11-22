# Voie f5 — correction chirurgicale après la critique v4 (tour 1 sur 3), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, puis `../v4/RESULTAT.md` § Problèmes (9 numérotés, captures dans `../v4/captures/` et `../f2/captures/` :
ouvrir chaque capture citée avant de corriger). Liste figée (L18) : corriger les 9, chacun prouvé seul ; rien d'autre.
Priorité : n° 1 (« autre projet, sans rapport : … » proposé en critère « Ce qui compte » du Frigo : la phrase de renvoi n'est
jamais un critère ; voir le correctif PCN-126 de 982f2d370) et n° 2 (bulle G8 de PCN-103 encore coupée par « et… » : les deux façons
entières, à 390 et 1280). Pour les redites (n° 5, 6, 9) et la densité (n° 7) : sa maquette retenue (port du carnet, g05/g5/h05,
`work/missions/2026-11-17-port-carnet/MISSION.md`) décide ; retirer une redite, jamais une information (L27).
Possède : src/ui/carnets/*, src/domain/carnets/*, src/ui/finance/UpgradeWorkspace.tsx, leurs CSS et tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict (corrige/ecarte + référence) | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f5/tests-rouge.txt` puis `> voies/f5/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f5/tests-final.txt` vert ; tsc.
- Captures 390 et 1280, clair et sombre, de chaque problème corrigé (réutiliser le banc de `../v4/` ou `../f2/captures.mjs`, port 5188),
  ouvertes avant de conclure, dans `voies/f5/captures/` ; serveur arrêté (port libre).
- Commit par chemins, `git show --stat HEAD` vérifié (fichiers de test non suivis compris : `git status --short tests`).
- Plafond : à 170 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
