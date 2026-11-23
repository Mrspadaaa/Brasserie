# Gates: voie dh4a — Dryhopper, passe 4 sur a1

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4a*/**, work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/captures/p4a*, work/missions/2026-10-23-maquette-parcours/voies/dh4a/RESULTAT.md

Scope: 6 variantes de la passe 4 de Dryhopper sur a1, avec leur chaleur, leurs captures et tous les contrôles du lot.

- [ ] G1: chaque variante a sa page, sa NOTE avec sa chaleur, et ses trois captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/';const ids='p4a1 p4a2 p4a3 p4a4 p4a5 p4a6'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['premier-ecran','pendant','apres'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'PASSE ECHEC '+mal.join(','):['PASSE','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: PASSE-BIEN
  EVIDENCE: pending

- [ ] G2: la baseline et les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4 p4a1 p4a2 p4a3 p4a4 p4a5 p4a6 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: une question, un seul facteur libre (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4 p4a1 p4a2 p4a3 p4a4 p4a5 p4a6 --page=etat.html
  EXPECT: UNE-QUESTION OK
  EVIDENCE: pending

- [ ] G4: peu de mots au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4 p4a1 p4a2 p4a3 p4a4 p4a5 p4a6 --max=80 --page=etat.html --sans-donnees
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: le rapport donne une ligne par variante
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/dh4a/RESULTAT.md --contient "p4a1,p4a2,p4a3,p4a4,p4a5,p4a6,chaleur,a1"
  EXPECT: NOTE OK
  EVIDENCE: pending
