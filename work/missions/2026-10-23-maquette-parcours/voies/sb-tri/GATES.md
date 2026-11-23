# Gates: voie sb-tri — tri du panel v0 de Substituer

OWNS: work/refonte-frontend/v4/ecran-1/fils24-substituer/critique/**, work/missions/2026-10-23-maquette-parcours/voies/sb-tri/RESULTAT.md

Scope: le niveau du panel mesuré, une critique par série, la synthèse (classement, candidates, greffes).

- [ ] G1: la synthèse a ses trois sections
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils24-substituer/critique/SYNTHESE.md --contient "## Classement,## Candidates,## Greffes"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: le classement nomme les 48 concepts
  CHECK: node -e "const t=require('fs').readFileSync('work/refonte-frontend/v4/ecran-1/fils24-substituer/critique/SYNTHESE.md','utf8');const ids='sba1 sba2 sba3 sba4 sba5 sba6 sba7 sba8 sbb1 sbb2 sbb3 sbb4 sbb5 sbb6 sbb7 sbb8 sbc1 sbc2 sbc3 sbc4 sbc5 sbc6 sbc7 sbc8 sbd1 sbd2 sbd3 sbd4 sbd5 sbd6 sbd7 sbd8 sbz1 sbz2 sbz3 sbz4 sbz5 sbz6 sbz7 sbz8 sbu1 sbu2 sbu3 sbu4 sbu5 sbu6 sbu7 sbu8'.split(' ');const manque=ids.filter(i=>!t.includes(i));console.log(manque.length?'CLASSEMENT ECHEC '+manque.join(','):['CLASSEMENT','BIEN'].join('-'));process.exit(manque.length?1:0)"
  EXPECT: CLASSEMENT-BIEN
  EVIDENCE: pending

- [ ] G3: le rapport donne la mesure du panel
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/sb-tri/RESULTAT.md --contient "PANEL,médiane,Candidates"
  EXPECT: NOTE OK
  EVIDENCE: pending
