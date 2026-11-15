# Gates: voie d2a — port de za3

OWNS: work/missions/2026-11-14-materiel/voies/d2a/  (code : worktree materiel-port, chemins déclarés dans VOIE.md)

Scope: port 1:1, tests verts, captures.

- [ ] G1: les tests de la voie passent
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/voies/d2a/tests.txt','utf8');const p=/Tests\s+(\d+) passed/.exec(t);const f=/\d+ failed/.test(t);console.log(p&&!f?'TESTS OK '+p[1]:'TESTS ECHEC')"
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: captures 390 et 1280 présentes
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-materiel/voies/d2a/captures';const f=fs.existsSync(d)?fs.readdirSync(d).filter(x=>x.endsWith('.png')):[];console.log(f.length>=4&&f.some(x=>/1280/.test(x))&&f.some(x=>/cave/.test(x))?'CAPTURES OK '+f.length:'CAPTURES ECHEC')"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
