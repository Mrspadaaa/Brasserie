# Gates: voie d126-lsa — le levier levure dans Suggérer, série lsa

OWNS: work/refonte-frontend/v4/ecran-1/fils24-petits-choix/lsa[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/lsa*, work/missions/2026-10-23-maquette-parcours/voies/d126-lsa/RESULTAT.md

Scope: quatre concepts v0 de la série lsa, avec leur chaleur, leurs deux captures et la baseline.

- [ ] G1: chaque concept a sa page, sa NOTE avec sa chaleur, et ses deux captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-petits-choix/';const ids='lsa1 lsa2 lsa3 lsa4'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['repos','toucher'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'SERIE ECHEC '+mal.join(','):['SERIE','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: SERIE-BIEN-4
  EVIDENCE: pending

- [ ] G2: la baseline tient sur chaque concept
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-petits-choix lsa1 lsa2 lsa3 lsa4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: le rapport donne une ligne par concept
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/d126-lsa/RESULTAT.md --contient "lsa1,lsa2,lsa3,lsa4,chaleur"
  EXPECT: NOTE OK
  EVIDENCE: pending
