# Gates: voie x2 — constats FN-30 à FN-40 (hors 33, 35, 37)

OWNS: work/missions/2026-11-14-finances/voies/x2

Scope: huit constats moyens et bas du jeu ZZ TEST du 16.11, chacun avec un test rouge puis vert.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/x2/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G3: Opérations reste v6a
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G4: la frise reste s2ap2
  CHECK: node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000
  EXPECT: FRISE OK
  EVIDENCE: pending

- [ ] G5: chaque constat a sa ligne au résultat
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-finances/voies/x2/RESULTAT.md','utf8');const m=['FN-30','FN-31','FN-32','FN-34','FN-36','FN-38','FN-39','FN-40','FN-41','FN-42'].filter(k=>!t.includes(k));console.log(m.length?'RESULTAT ECHEC '+m:'RESULTAT OK')"
  EXPECT: RESULTAT OK
  EVIDENCE: pending
