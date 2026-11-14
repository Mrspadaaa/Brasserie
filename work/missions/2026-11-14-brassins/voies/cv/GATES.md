# Gates: voie cv — Couverture de l'onglet Brassins

OWNS: work/missions/2026-11-14-brassins/voies/cv/

Scope: une ligne par vue, la maquette qui la traite, les groupes sans maquette.

- [ ] G1: le compte en tête, les quatre sous-onglets, les groupes
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md','utf8');const ok=/^OK — \d+ vues, \d+ traitées, \d+ partielles, \d+ sans maquette/.test(t)&&['Brassins','Recettes','Atelier','Volumes'].every(k=>t.includes(k))&&t.includes('## Sans maquette, groupées');console.log(ok?'COUVERTURE OK':'COUVERTURE KO')"
  EXPECT: COUVERTURE OK
  EVIDENCE: pending

- [ ] G2: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
