# Gates: voie leg — la légende sous les pastilles, série leg

OWNS: work/refonte-frontend/v4/ecran-1/fils24-legendes/leg[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-legendes/captures/leg[1-4]*, work/missions/2026-10-23-maquette-parcours/voies/leg/RESULTAT.md

Scope: quatre mini maquettes de la légende juste sous les pastilles, en pictos, pour une carte du rail et une ligne d'ajout.

- [ ] G1: chaque variante a sa page, sa légende en pictos, sa NOTE et sa capture
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-legendes/outils/legendes.mjs leg1 leg2 leg3 leg4
  EXPECT: LEGENDES-BIEN-4
  EVIDENCE: pending

- [ ] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-legendes leg1 leg2 leg3 leg4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending
