# Gates: voie legz — la légende sous les pastilles, série legz

OWNS: work/refonte-frontend/v4/ecran-1/fils24-legendes/legz[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-legendes/captures/legz[1-4]*, work/missions/2026-10-23-maquette-parcours/voies/legz/RESULTAT.md

Scope: quatre mini maquettes de la légende juste sous les pastilles, en pictos, pour une carte du rail et une ligne d'ajout.

- [ ] G1: chaque variante a sa page, sa légende en pictos, sa NOTE et sa capture
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-legendes/outils/legendes.mjs legz1 legz2 legz3 legz4
  EXPECT: LEGENDES-BIEN-4
  EVIDENCE: pending

- [ ] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-legendes legz1 legz2 legz3 legz4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending
