# Gates: voie x1 — test d'écran FN-30 à FN-42

OWNS: work/missions/2026-11-14-finances/voies/x3

Scope: test d'écran de la version qui corrige les trois constats graves sur l'argent, avant sa mise en ligne.

- [ ] G1: le verdict existe et compte ses bloquants
  CHECK: node -e "const t=require('fs').readFileSync(process.argv[1],'utf8');process.stdout.write(/^OK — \d+ problèmes?, \d+ bloquants?/.test(t)&&/Bloquants : \d+/.test(t)?'VERDICT OK':'VERDICT ECHEC')" work/missions/2026-10-31-ecran-depense/avant-deploiement/b36f66ef/VERDICT.md
  EXPECT: VERDICT OK
  EVIDENCE: pending

- [ ] G2: le banc répond
  CHECK: node -e "fetch('http://localhost:3000/').then(r=>console.log(r.status===200?'BANC OK':'BANC ECHEC')).catch(()=>console.log('BANC ECHEC'))"
  EXPECT: BANC OK
  EVIDENCE: pending
