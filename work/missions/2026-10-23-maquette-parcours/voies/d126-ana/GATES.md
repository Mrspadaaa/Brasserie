# Gates: voie d126-ana — l'entrée de l'analyse depuis l'étape Houblons, série ana

OWNS: work/refonte-frontend/v4/ecran-1/fils24-petits-choix/ana[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/ana*, work/missions/2026-10-23-maquette-parcours/voies/d126-ana/RESULTAT.md

Scope: quatre concepts v0 de la série ana, avec leur chaleur, leurs deux captures et la baseline.

- [ ] G1: chaque concept a sa page, sa NOTE avec sa chaleur, et ses deux captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-petits-choix/';const ids='ana1 ana2 ana3 ana4'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['repos','toucher'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'SERIE ECHEC '+mal.join(','):['SERIE','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: SERIE-BIEN-4
  EVIDENCE: pending

- [ ] G2: la baseline tient sur chaque concept
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-petits-choix ana1 ana2 ana3 ana4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: le rapport donne une ligne par concept
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/d126-ana/RESULTAT.md --contient "ana1,ana2,ana3,ana4,chaleur"
  EXPECT: NOTE OK
  EVIDENCE: pending
