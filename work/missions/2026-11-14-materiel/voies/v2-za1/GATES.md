# Gates: voie v2-za1 — zq1 apaisée

OWNS: work/missions/2026-11-14-materiel/v2/za1/, work/missions/2026-11-14-materiel/voies/v2-za1/

Scope: une variante, sept images, une NOTE.

- [ ] G1: sept images et la NOTE
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-materiel/v2/za1/';const m=['repos-390','geste-390','traiter-390','ajout-390','vide-390','repos-cave-390','repos-1280'].filter(f=>!fs.existsSync(d+'za1-'+f+'.png'));if(!fs.existsSync(d+'NOTE.md'))m.push('NOTE');console.log(m.length?'VARIANTE ECHEC '+m:'VARIANTE OK')"
  EXPECT: VARIANTE OK
  EVIDENCE: pending
