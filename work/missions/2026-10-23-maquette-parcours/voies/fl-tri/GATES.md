# Gates: voie fl-tri — tri du panel v0 de la liste de la fiche

OWNS: work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/critique/**, work/missions/2026-10-23-maquette-parcours/voies/fl-tri/RESULTAT.md

Scope: le niveau du panel mesuré, une critique par série, la synthèse (classement, candidates, greffes).

- [ ] G1: la synthèse a ses trois sections
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/critique/SYNTHESE.md --contient "## Classement,## Candidates,## Greffes"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: le classement nomme les 48 concepts
  CHECK: node -e "const t=require('fs').readFileSync('work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/critique/SYNTHESE.md','utf8');const ids='fla1 fla2 fla3 fla4 fla5 fla6 fla7 fla8 flb1 flb2 flb3 flb4 flb5 flb6 flb7 flb8 flc1 flc2 flc3 flc4 flc5 flc6 flc7 flc8 fld1 fld2 fld3 fld4 fld5 fld6 fld7 fld8 flz1 flz2 flz3 flz4 flz5 flz6 flz7 flz8 flu1 flu2 flu3 flu4 flu5 flu6 flu7 flu8'.split(' ');const manque=ids.filter(i=>!t.includes(i));console.log(manque.length?'CLASSEMENT ECHEC '+manque.join(','):['CLASSEMENT','BIEN'].join('-'));process.exit(manque.length?1:0)"
  EXPECT: CLASSEMENT-BIEN
  EVIDENCE: pending

- [ ] G3: le rapport donne la mesure du panel
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/fl-tri/RESULTAT.md --contient "PANEL,médiane,Candidates"
  EXPECT: NOTE OK
  EVIDENCE: pending
