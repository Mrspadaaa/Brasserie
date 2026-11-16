# Gates: voie gf — Greffes s4a × s6c

OWNS: work/missions/2026-11-14-brassins/voies/gf/

Scope: 4 greffes statiques, repos, geste et cave, à l'identité de l'app.

- [ ] G1: 4 greffes, chacune avec repos, geste, cave et NOTE.md (chaleur, idée, éléments au premier écran)
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/gf';const v=fs.readdirSync(d).filter(x=>/^gf[a-d]$/.test(x));const ok=v.length===4&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);const n=fs.readFileSync(d+'/'+x+'/NOTE.md','utf8');return ['repos-390-clair','geste-390-clair','repos-390-cave'].every(k=>f.some(y=>y.includes(k)))&&/froide|tiède|chaude/.test(n)&&/Idée/.test(n)&&/premier écran/i.test(n)})&&v.some(x=>fs.readdirSync(d+'/'+x).some(y=>y.includes('1280')));console.log(ok?'GREFFES OK':'GREFFES KO '+v.join(','))"
  EXPECT: GREFFES OK
  EVIDENCE: pending

- [ ] G2: chaque greffe passe le contrôle d'identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/gf
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR')&&!l.includes('DEFAUTS-RECURRENTS'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
