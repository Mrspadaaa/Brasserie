# Gates: voie r8-publication — la section « lot 22 » de la page des fils de fer

OWNS: work/refonte-frontend/v4/outils/page-nuit/faire-lot22.mjs, work/refonte-frontend/v4/outils/page-nuit/lot22.json, work/refonte-frontend/v4/outils/page-nuit/site/index.html, work/refonte-frontend/v4/outils/page-nuit/site/img/**, work/missions/2026-10-22-reprise-lot21/voies/r8-publication/RESULTAT.md

Scope: lot22.json au format d'ajouter-lot, seize images existantes, section t119-lot22 ajoutée à la copie locale de la page.

- [x] G1: le script produit lot22.json et chaque image existe
  CHECK: node work/refonte-frontend/v4/outils/page-nuit/faire-lot22.mjs
  EXPECT: lot22.json · 16 images
  EVIDENCE: automatic-evidence=v1; definition-sha256=991edc6ac307dbeb42830aafee6a915871f8be7c67013216f506dea82513f513; exit=0; EXPECT=matched; output-sha256=fd73c7dc02f702e82719650f7e9aee097b9bf7b6188340a40eca0a726db3a4d3; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: lot22.json a ses sept puces, ses seize images et son ancre
  CHECK: node -e "const j=require('./work/refonte-frontend/v4/outils/page-nuit/lot22.json'); const ok=j.ticket===119 && j.ancre==='t119-lot22' && j.puces.length===7 && j.images.length===16 && j.images.every(([f])=>require('fs').existsSync(f)); console.log(ok ? 'LOT22 OK' : 'LOT22 ECHEC'); process.exit(ok ? 0 : 1)"
  EXPECT: LOT22 OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7d5eb16bd43a7ffa0c6b0a7c0b508694228384e43ddc3956811b0bb1da03dd69; exit=0; EXPECT=matched; output-sha256=9877a7ef15df8afd4c86ed66dc1b7467d90158210ac9467041890a981212312f; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la copie locale de la page porte la section du lot 22, en tête, avec ses seize images présentes
  CHECK: node -e "const fs=require('fs'); const d='work/refonte-frontend/v4/outils/page-nuit/site/'; const h=fs.readFileSync(d+'index.html','utf8'); const s=(h.match(/<section id=.t119-lot22.>[\s\S]*?<\/section>/)||[''])[0]; const imgs=[...s.matchAll(/src=.(img\/[^'\x22]+)/g)].map(m=>m[1]); const premier=h.indexOf('<section')===h.indexOf('<section id=\x22t119-lot22\x22'); const ok=s && imgs.length===16 && imgs.every(f=>fs.existsSync(d+f)) && premier; console.log(ok ? 'SECTION OK' : 'SECTION ECHEC ' + imgs.length); process.exit(ok ? 0 : 1)"
  EXPECT: SECTION OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=be910d246507b7ad247e7a7a80fbdc007340bccba74b54d218b97aa1ed87db48; exit=0; EXPECT=matched; output-sha256=2859601719be29775fd64a7ba1cc41ab0d02db7c6f67578c2185df8246fb5f77; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
