# Gates: voie s1-lecons — tri des leçons et savoirs proposés

OWNS: work/missions/2026-10-23-maquette-parcours/voies/s1-lecons/RESULTAT.md

Scope: chaque proposition des voies classée, pour que le pilote l'applique à la signature.

- [ ] G1: les cinq classes sont là
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/s1-lecons/RESULTAT.md --contient "## Déjà couvertes,## À fusionner,## Nouvelles leçons,## Savoirs durables,## Sans suite"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: chaque voie qui propose est citée
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-10-23-maquette-parcours/voies/';const r=fs.readFileSync(d+'s1-lecons/RESULTAT.md','utf8');const v=fs.readdirSync(d).filter(x=>x!=='s1-lecons'&&fs.existsSync(d+x+'/RESULTAT.md')&&/LEÇON PROPOSÉE :|CONNAISSANCE :/.test(fs.readFileSync(d+x+'/RESULTAT.md','utf8')));const m=v.filter(x=>!r.includes('['+x+']'));console.log(m.length?'TRI ECHEC '+m.join(', '):['TRI','COMPLET'].join('-'));process.exit(m.length?1:0)"
  EXPECT: TRI-COMPLET
  EVIDENCE: pending
