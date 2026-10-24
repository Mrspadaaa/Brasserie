# Gates: voie fl-passe2 — la liste de la fiche, passe 2

OWNS: work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flb3b/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flc8b/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/fld8b/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flu2b/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/fla5b/**, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/fl*b-*, work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flu6-nelson.png, work/missions/2026-10-23-maquette-parcours/voies/fl-passe2/RESULTAT.md

Scope: les cinq candidates refaites selon le verdict du conseil, capturées sur Nelson Sauvin et sur Nugget, tous les contrôles du lot.

- [ ] G1: chaque candidate a sa page, sa NOTE et ses captures Nelson, Nugget et page entière
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/';const ids='flb3b flc8b fld8b flu2b fla5b'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!fs.existsSync(p+i+'/NOTE.md')||!['nelson','nugget','page'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));if(!fs.existsSync(p+'captures/flu6-nelson.png'))mal.push('flu6-nelson');console.log(mal.length?'PASSE2 ECHEC '+mal.join(','):['PASSE2','BIEN'].join('-'));process.exit(mal.length?1:0)"
  EXPECT: PASSE2-BIEN
  EVIDENCE: pending

- [ ] G2: la baseline et les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-fiche-liste flb3b flc8b fld8b flu2b fla5b --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: une question, un seul facteur libre
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils24-fiche-liste flb3b flc8b fld8b flu2b fla5b --page=etat.html
  EXPECT: UNE-QUESTION OK
  EVIDENCE: pending

- [ ] G4: peu de mots au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils24-fiche-liste flb3b flc8b fld8b flu2b fla5b --max=80 --page=etat.html --sans-donnees
  EXPECT: MOTS OK
  EVIDENCE: pending

