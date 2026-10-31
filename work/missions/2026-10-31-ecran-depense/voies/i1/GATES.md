# Gates: voie i1 — inventaire et captures

OWNS: work/missions/2026-10-31-ecran-depense/inventaire/, work/missions/2026-10-31-ecran-depense/voies/i1/RESULTAT.md

Scope: l'inventaire de l'écran actuel et ses captures sur les fixtures.

- [ ] G1: l'inventaire couvre la fiche, les articles et les trois onglets
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/inventaire/inventaire-depense.md --contient "Nouvelle dépense,Articles,Entrées,Prévision,Tout,ExpenseSheet.tsx"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: au moins huit captures existent
  CHECK: node -e "const n=require('fs').readdirSync('work/missions/2026-10-31-ecran-depense/inventaire',{recursive:true}).filter(f=>String(f).endsWith('.png')).length; console.log(n>=8?'CAPTURES OK '+n:'CAPTURES ECHEC '+n); process.exit(n>=8?0:1)"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
