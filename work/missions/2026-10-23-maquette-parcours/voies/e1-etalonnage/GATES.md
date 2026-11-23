# Gates: voie e1-etalonnage — ses derniers verdicts versés, l'épreuve rejouée

OWNS: work/refonte-frontend/v4/etalonnage/jeu.json, work/refonte-frontend/v4/etalonnage/epreuve/**, work/missions/2026-10-23-maquette-parcours/voies/e1-etalonnage/RESULTAT.md

Scope: le jeu d'étalonnage enrichi de ses verdicts du 23 et 24.10, l'épreuve et l'étalonnage rejoués.

- [ ] G1: le jeu reste valide et a grandi
  CHECK: node -e "const j=require('./work/refonte-frontend/v4/etalonnage/jeu.json');const n=(j.items||j.verdicts||j).length;console.log(n>65?['JEU','BIEN',n].join('-'):'JEU ECHEC '+n);process.exit(n>65?0:1)"
  EXPECT: JEU-BIEN
  EVIDENCE: pending

- [ ] G2: le rapport donne les taux des deux moitiés et le seuil
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/e1-etalonnage/RESULTAT.md --contient "moitié A,moitié B,seuil,%"
  EXPECT: NOTE OK
  EVIDENCE: pending
