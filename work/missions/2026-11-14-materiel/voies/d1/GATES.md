# Gates: voie d1 — domaine du matériel

OWNS: work/missions/2026-11-14-materiel/voies/d1/  (code : worktree materiel-port, src/domain/equipment/ et tests/unit/equipmentSchedule.test.ts, déclarés dans VOIE.md)

Scope: domaine pur et ses tests, typé, commité dans le worktree.

- [ ] G1: les tests du domaine passent
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/voies/d1/tests.txt','utf8');const p=/Tests\s+(\d+) passed/.exec(t);const f=/failed/.test(t);console.log(p&&!f&&+p[1]>=12?'TESTS OK '+p[1]:'TESTS ECHEC')"
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: le module existe et est commité
  CHECK: node -e "const cp=require('child_process');const o=cp.execSync('git -C C:/Users/mrspa/AppData/Local/Temp/materiel-port log --oneline -5 -- src/domain/equipment').toString();console.log(o.trim()?'COMMIT OK':'COMMIT ECHEC')"
  EXPECT: COMMIT OK
  EVIDENCE: pending
