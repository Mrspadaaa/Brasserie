# Gates: voie p2c — Passe 2 de s3b

OWNS: work/missions/2026-11-14-brassins/voies/p2c/

Scope: s3b2 prêtes à montrer, six images chacune.

- [ ] G1: chaque variante porte ses six images et sa NOTE
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/p2c';const ok=["s3b2"].every(i=>{const f=fs.existsSync(d+'/'+i)?fs.readdirSync(d+'/'+i):[];return ['repos-390-clair','geste-390-clair','dryhop-390-clair','liste-390-clair','repos-390-cave','repos-1280-clair'].every(k=>f.includes(i+'-'+k+'.png'))&&f.includes('NOTE.md')});console.log(ok?'PASSE OK':'PASSE KO')"
  EXPECT: PASSE OK
  EVIDENCE: pending

- [ ] G2: le premier écran est mesuré
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/p2c/tests.txt','utf8');console.log(/PANEL (OK|ECHEC)/.test(t)?'MESURE OK':'MESURE KO')"
  EXPECT: MESURE OK
  EVIDENCE: pending
