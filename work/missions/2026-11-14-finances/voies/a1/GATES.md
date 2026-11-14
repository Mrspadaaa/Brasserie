# Gates: voie a1 — Annuel : une pièce non classée n'est plus une perte ferme

OWNS: src/ui/finance/annuel, work/missions/2026-11-14-finances/voies/a1

Scope: dans Annuel, une pièce non classée sort du dépensé ferme en segment hachuré « à classer », la tête attend, un renvoi mène au classement.

- [ ] G1: le contrôle ANNUEL passe sur le banc
  CHECK: node work/missions/2026-11-14-finances/voies/a1/controle-annuel.mjs 3000
  EXPECT: ANNUEL OK
  EVIDENCE: pending

- [ ] G2: le témoin rouge du code actuel est gardé
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/a1/temoin-head.txt "ANNUEL ECHEC" TEMOIN
  EXPECT: TEMOIN OK
  EVIDENCE: pending

- [ ] G3: les tests finances passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/a1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending
