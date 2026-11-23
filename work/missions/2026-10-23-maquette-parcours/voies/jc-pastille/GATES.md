# Gates: voie jc-pastille — la pastille « ~ simulé » de Comparer

OWNS: work/refonte-frontend/v4/ecran-1/fils24-pastille/**, work/missions/2026-10-23-maquette-parcours/voies/jc-pastille/RESULTAT.md

Scope: 3 mini maquettes de la pastille « ~ simulé » de Comparer, avec leurs captures au repos et au toucher.

- [ ] G1: chaque mini maquette a sa page, sa NOTE et ses captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-pastille/';const ids='psa psb psc'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!fs.existsSync(p+i+'/NOTE.md')||!['repos','toucher'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'JEU ECHEC '+mal.join(','):['JEU','BIEN'].join('-'));process.exit(mal.length?1:0)"
  EXPECT: JEU-BIEN
  EVIDENCE: pending

- [ ] G2: la baseline et les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-pastille psa psb psc --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending
