# Gates: voie sb-passe2 — Substituer, passe 2

OWNS: work/refonte-frontend/v4/ecran-1/fils24-substituer/sbc1b/**, work/refonte-frontend/v4/ecran-1/fils24-substituer/sbz7b/**, work/refonte-frontend/v4/ecran-1/fils24-substituer/sbb7b/**, work/refonte-frontend/v4/ecran-1/fils24-substituer/sbz6b/**, work/refonte-frontend/v4/ecran-1/fils24-substituer/sbb5b/**, work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sb*b-*, work/missions/2026-10-23-maquette-parcours/voies/sb-passe2/RESULTAT.md

Scope: les cinq candidates refaites selon le verdict du conseil, capturées à 60′ et au whirlpool, tous les contrôles du lot.

- [ ] G1: chaque candidate a sa page, sa NOTE et ses captures à 60′, au whirlpool et en page entière
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-substituer/';const ids='sbc1b sbz7b sbb7b sbz6b sbb5b'.split(' ');const mal=ids.filter(i=>!fs.existsSync(p+i+'/etat.html')||!fs.existsSync(p+i+'/NOTE.md')||!['60','whirlpool','page'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png')));console.log(mal.length?'PASSE2 ECHEC '+mal.join(','):['PASSE2','BIEN'].join('-'));process.exit(mal.length?1:0)"
  EXPECT: PASSE2-BIEN
  EVIDENCE: pending

- [ ] G2: la baseline et les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-substituer sbc1b sbz7b sbb7b sbz6b sbb5b --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G3: une question, un seul facteur libre
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils24-substituer sbc1b sbz7b sbb7b sbz6b sbb5b --page=etat.html --edition
  EXPECT: UNE-QUESTION OK
  EVIDENCE: pending

- [ ] G4: peu de mots au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils24-substituer sbc1b sbz7b sbb7b sbz6b sbb5b --max=80 --page=etat.html --sans-donnees
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: les IBU de chaque ligne sont cohérents
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs work/refonte-frontend/v4/ecran-1/fils24-substituer sbc1b sbz7b sbb7b sbz6b sbb5b
  EXPECT: COHERENCE-IBU OK
  EVIDENCE: pending
