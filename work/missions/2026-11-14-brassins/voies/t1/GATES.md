# Gates: voie t1 — Tri du panel v0

OWNS: work/missions/2026-11-14-brassins/voies/t1/

Scope: classement des 15, 3 candidates, greffes, défauts par variante, mesure du panel.

- [ ] G1: SYNTHESE.md complète, les 15 ids classés
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/t1/SYNTHESE.md','utf8');const ids=['s1','s2','s3'].flatMap(s=>'abcde'.split('').map(l=>s+l));const ok=['## Classement','## Candidates','## Greffes','## Défauts par variante'].every(h=>t.includes(h))&&ids.every(i=>t.includes(i));console.log(ok?'SYNTHESE OK':'SYNTHESE KO')"
  EXPECT: SYNTHESE OK
  EVIDENCE: pending

- [ ] G2: le panel est mesuré
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/t1/panel.txt','utf8');console.log(/PANEL (OK|ECHEC)/.test(t)?'MESURE OK':'MESURE KO')"
  EXPECT: MESURE OK
  EVIDENCE: pending
