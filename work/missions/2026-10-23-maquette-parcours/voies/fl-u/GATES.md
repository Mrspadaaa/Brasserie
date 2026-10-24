# Gates: voie fl-u — la liste de la fiche, série u

OWNS: work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flu[1-8]/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flu*, work/missions/2026-10-23-maquette-parcours/voies/fl-u/RESULTAT.md

Scope: huit concepts v0 de la série u, avec leur chaleur, leurs captures et la baseline.

- [ ] G1: chaque concept a sa page, sa NOTE avec sa chaleur, et ses deux captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/';const ids='flu1 flu2 flu3 flu4 flu5 flu6 flu7 flu8'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['premier-ecran','page'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'SERIE ECHEC '+mal.join(','):['SERIE','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: SERIE-BIEN
  EVIDENCE: pending

- [ ] G2: la baseline tient sur chaque concept
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-fiche-liste flu1 flu2 flu3 flu4 flu5 flu6 flu7 flu8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: le rapport donne une ligne par concept
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/fl-u/RESULTAT.md --contient "flu1,flu2,flu3,flu4,flu5,flu6,flu7,flu8,chaleur"
  EXPECT: NOTE OK
  EVIDENCE: pending
