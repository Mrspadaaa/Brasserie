# Gates: voie a2 — Test d'écran des brassins

OWNS: work/missions/2026-11-14-brassins/voies/a2-ecran/

Scope: verdict « combien et quels problèmes » sur les captures a1.

- [ ] G1: VERDICT.md commence par le compte et porte la section pour les maquettes
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/a2-ecran/VERDICT.md','utf8');console.log(/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&t.includes('## Pour les maquettes')?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending

- [ ] G2: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split('\n').filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
