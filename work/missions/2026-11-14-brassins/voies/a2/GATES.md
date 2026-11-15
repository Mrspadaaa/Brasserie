# Gates: voie a2 — Ses problèmes réels

OWNS: work/missions/2026-11-14-brassins/voies/a2/

Scope: deux sections complètes, sourcées.

- [ ] G1: deux sections, quatre sous-sections chacune, au moins 6 genres et 3 citations datées par sujet
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md','utf8');const s=t.split(/^## /m).slice(1);const ok=s.length===2&&s.every(x=>['### Ses problèmes','### Ce que l','### Pourquoi','### Genres'].every(h=>x.includes(h))&&(x.split('### Genres')[1].match(/^\s*\d+\./gm)||[]).length>=6&&(x.match(/\d\d\.\d\d/g)||[]).length>=3);console.log(ok?'PROBLEMES OK':'PROBLEMES KO '+s.length)"
  EXPECT: PROBLEMES OK
  EVIDENCE: pending
