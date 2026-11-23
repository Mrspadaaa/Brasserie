# Gates: voie rca — la recherche avancée, série rca

OWNS: work/refonte-frontend/v4/ecran-1/fils24-recherche/rca[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-recherche/captures/rca*, work/missions/2026-10-23-maquette-parcours/voies/rca/RESULTAT.md

Scope: quatre concepts de recherche avancée, chacun avec un vrai cas et cinq résultats au moins, au trait de la baseline.

- [ ] G1: chaque concept a sa page, sa recherche, cinq résultats, sa NOTE et sa capture
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-recherche/outils/concepts.mjs rca1 rca2 rca3 rca4
  EXPECT: CONCEPTS-BIEN-4
  EVIDENCE: pending

- [ ] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-recherche rca1 rca2 rca3 rca4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending
