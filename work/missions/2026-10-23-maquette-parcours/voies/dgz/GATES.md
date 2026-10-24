# Gates: voie dgz — Dryhopper avec ses retours, série dgz

OWNS: work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/dgz[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/captures/dgz[1-4]*, work/missions/2026-10-23-maquette-parcours/voies/dgz/RESULTAT.md

Scope: quatre mini maquettes de Dryhopper, p4b2f en base, chacune avec sa greffe nommée.

- [ ] G1: chaque variante a sa page, sa greffe, sa NOTE et sa capture
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/outils/variantes.mjs dgz1 dgz2 dgz3 dgz4
  EXPECT: VARIANTES-BIEN-4
  EVIDENCE: pending

- [ ] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes dgz1 dgz2 dgz3 dgz4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending
