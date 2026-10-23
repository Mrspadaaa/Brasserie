# Gates: voie p6-critique — l'avis du critique sur le parcours

OWNS: work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md

Scope: un avis par écran de la maquette jouable, en défauts vérifiables, chaque rejet appuyé sur SPEC ou DEFAUTS.

- [ ] G1: un avis pour chacun des sept écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md --contient "ma-biere :,fiche :,suggerer :,comparer :,dryhopper :,levure :,substituer :"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: l'avis porte sur les captures du parcours aux deux largeurs
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md --contient "-390.png,-1280.png,r6a"
  EXPECT: NOTE OK
  EVIDENCE: pending
