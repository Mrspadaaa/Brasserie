# Gates: voie d126-lsz — le levier levure dans Suggérer, série lsz

OWNS: work/refonte-frontend/v4/ecran-1/fils24-petits-choix/lsz[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/lsz*, work/missions/2026-10-23-maquette-parcours/voies/d126-lsz/RESULTAT.md

Scope: quatre concepts v0 de la série lsz, avec leur chaleur, leurs deux captures et la baseline.

- [ ] G1: chaque concept a sa page, sa NOTE avec sa chaleur, et ses deux captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-petits-choix/';const ids='lsz1 lsz2 lsz3 lsz4'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['repos','toucher'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'SERIE ECHEC '+mal.join(','):['SERIE','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: SERIE-BIEN-4
  EVIDENCE: pending

- [ ] G2: la baseline tient sur chaque concept
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-petits-choix lsz1 lsz2 lsz3 lsz4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: le rapport donne une ligne par concept
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/d126-lsz/RESULTAT.md --contient "lsz1,lsz2,lsz3,lsz4,chaleur"
  EXPECT: NOTE OK
  EVIDENCE: pending
