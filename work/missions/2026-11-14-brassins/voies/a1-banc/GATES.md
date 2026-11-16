# Gates: voie a1 — Banc local des brassins

OWNS: work/missions/2026-11-14-brassins/voies/a1-banc/

Scope: banc à fixtures fictives, captures des trois écrans, inventaire fonctionnel.

- [ ] G1: au moins 24 captures, 390 et 1280, clair et cave
  CHECK: node -e "const f=require('fs').readdirSync('work/missions/2026-11-14-brassins/voies/a1-banc/captures').filter(x=>x.endsWith('.png'));const ok=f.length>=24&&['390','1280','clair','cave'].every(k=>f.some(x=>x.includes(k)));console.log(ok?'CAPTURES OK '+f.length:'CAPTURES KO '+f.length)"
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G2: TROUS.md porte les trois sections
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md','utf8');console.log(['## Existe','## Manque','## Raccord jour de brassage'].every(s=>t.includes(s))?'TROUS OK':'TROUS KO')"
  EXPECT: TROUS OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split('\n').filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
