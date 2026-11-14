# Gates: voie p2a — Passe 2 de s1e

OWNS: work/missions/2026-11-14-brassins/voies/p2a/

Scope: s1e2, s1g prêtes à montrer, six images chacune.

- [ ] G1: chaque variante porte ses six images et sa NOTE
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/p2a';const ok=["s1e2","s1g"].every(i=>{const f=fs.existsSync(d+'/'+i)?fs.readdirSync(d+'/'+i):[];return ['repos-390-clair','geste-390-clair','dryhop-390-clair','liste-390-clair','repos-390-cave','repos-1280-clair'].every(k=>f.includes(i+'-'+k+'.png'))&&f.includes('NOTE.md')});console.log(ok?'PASSE OK':'PASSE KO')"
  EXPECT: PASSE OK
  EVIDENCE: pending

- [ ] G2: le premier écran est mesuré
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/p2a/tests.txt','utf8');console.log(/PANEL (OK|ECHEC)/.test(t)?'MESURE OK':'MESURE KO')"
  EXPECT: MESURE OK
  EVIDENCE: pending
