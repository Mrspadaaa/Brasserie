# Gates: voie d1 — diagnostic lecture, champs, stock, incertitude

OWNS: work/missions/2026-10-31-ecran-depense/diagnostic/d1/, work/missions/2026-10-31-ecran-depense/voies/d1/RESULTAT.md

Scope: le diagnostic prouvé de la lecture d'une facture et de ses liens au stock, et la vérité de sa facture en fixture.

- [ ] G1: le diagnostic répond aux cinq questions et classe chaque défaut
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/diagnostic/d1/DIAGNOSTIC.md --contient "Le chemin d'une lecture,Les champs,La cohérence,Les liens au stock,L'incertitude,inachevé récupérable,86,50"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: la vérité de sa facture a ses 23 lignes et son total
  CHECK: node -e "const v=require('./work/missions/2026-10-31-ecran-depense/diagnostic/d1/verite-facture-372765.json');const l=v.lignes||v.lines;const s=l.reduce((a,x)=>a+Number(x.montant??x.amount),0);console.log(l.length===23&&Math.abs(s-86.5)<0.001?'VERITE OK':'VERITE ECHEC '+l.length+' '+s)"
  EXPECT: VERITE OK
  EVIDENCE: pending

- [ ] G3: la lecture simulée est un JSON valide
  CHECK: node -e "JSON.parse(require('fs').readFileSync('work/missions/2026-10-31-ecran-depense/diagnostic/d1/lecture-simulee-372765.json','utf8'));console.log('SIMULEE OK')"
  EXPECT: SIMULEE OK
  EVIDENCE: pending
