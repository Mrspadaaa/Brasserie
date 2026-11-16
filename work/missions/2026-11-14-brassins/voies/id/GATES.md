# Gates: voie id — Trousse d'identité

OWNS: work/missions/2026-11-14-brassins/outils/identite/

Scope: trousse commune, démo conforme au contrôle d'identité.

- [ ] G1: la démo passe le contrôle d'identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/outils/identite/demo/etat.html
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G2: la trousse porte les jetons des deux thèmes, le chrome et ses captures
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/outils/identite/';const c=fs.readFileSync(d+'identite.css','utf8');const t=fs.readFileSync('src/theme/themes.css','utf8');const v=[...t.matchAll(/--(cave-[0-9]+):\s*([0-9 ]+);/g)].every(m=>c.includes(m[2].trim()));const ok=v&&/data-theme=.?cave/.test(c)&&fs.existsSync(d+'chrome.js')&&fs.existsSync(d+'LISEZMOI.md')&&['demo-390-clair.png','demo-390-cave.png','demo-1280-clair.png'].every(f=>fs.existsSync(d+'demo/'+f));console.log(ok?'TROUSSE OK':'TROUSSE KO')"
  EXPECT: TROUSSE OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR')&&!l.includes('DEFAUTS-RECURRENTS'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
