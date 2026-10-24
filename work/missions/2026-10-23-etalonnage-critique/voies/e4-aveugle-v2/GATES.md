# Gates: e4-aveugle-v2

OWNS: work/refonte-frontend/v4/etalonnage/reponses-v2.json

Scope: un critique neuf, avec le portrait version 2, passe la moitié B (items pairs) ; la note est calculée par le pilote.

- [x] G1: une réponse valide pour chaque item pair
  CHECK: node -e "const fs=require('fs');const cle=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/cle.json','utf8')).items.filter(i=>i.moitie==='B');const r=new Map(JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/reponses-v2.json','utf8')).reponses.map(x=>[x.eid,x]));const bad=cle.filter(i=>{const x=r.get(i.eid);return !x||!(i.type==='paire'?['A','B']:['aime','mitige','rejette']).includes(x.reponse)||!x.phrase});console.log(bad.length?'REPONSES ECHEC '+bad.map(i=>i.eid).join(' '):'REPONSES COMPLETES '+cle.length);process.exit(bad.length?1:0)"
  EXPECT: REPONSES COMPLETES
  EVIDENCE: automatic-evidence=v1; definition-sha256=dd390b8d0dd48ea84408b4e2e6ddfcebdd8da029eed7c810369edc320d3194d2; exit=0; EXPECT=matched; output-sha256=69b9374af9265c3ae50d6e056a0b1d16d26fdad025d00ebf6630428ab6d13fcb; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
