# Gates: voie t4-ecran — test d'écran du port

OWNS: work/missions/2026-11-14-materiel/critique/ECRAN-PORT.md, work/missions/2026-11-14-materiel/voies/t4-ecran/

Scope: problèmes numérotés, conforme, verdict.

- [ ] G1: les trois sections et un verdict
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/critique/ECRAN-PORT.md','utf8');const ok=['## Problèmes','## Conforme','## Verdict'].every(s=>t.includes(s))&&/DEPLOYABLE|A CORRIGER/.test(t);console.log(ok?'ECRAN OK':'ECRAN ECHEC')"
  EXPECT: ECRAN OK
  EVIDENCE: pending
