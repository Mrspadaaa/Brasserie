# Gates: voie fl-z — la liste de la fiche, série z

OWNS: work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flz[1-8]/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flz*, work/missions/2026-10-23-maquette-parcours/voies/fl-z/RESULTAT.md

Scope: huit concepts v0 de la série z, avec leur chaleur, leurs captures et la baseline.

- [ ] G1: chaque concept a sa page, sa NOTE avec sa chaleur, et ses deux captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/';const ids='flz1 flz2 flz3 flz4 flz5 flz6 flz7 flz8'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['premier-ecran','page'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'SERIE ECHEC '+mal.join(','):['SERIE','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: SERIE-BIEN
  EVIDENCE: pending

- [ ] G2: la baseline tient sur chaque concept
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-fiche-liste flz1 flz2 flz3 flz4 flz5 flz6 flz7 flz8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: le rapport donne une ligne par concept
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/fl-z/RESULTAT.md --contient "flz1,flz2,flz3,flz4,flz5,flz6,flz7,flz8,chaleur"
  EXPECT: NOTE OK
  EVIDENCE: pending
