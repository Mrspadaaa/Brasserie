# Gates: voie rpa — r6a++, série rpa

OWNS: work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/rpa[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/captures/rpa[1-4]*, work/missions/2026-10-23-maquette-parcours/voies/rpa/RESULTAT.md

Scope: quatre mini maquettes de r6a++, r6a en base, chacune avec sa greffe nommée.

- [ ] G1: chaque variante a sa page, sa greffe, sa NOTE et sa capture
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/outils/variantes.mjs rpa1 rpa2 rpa3 rpa4
  EXPECT: VARIANTES-BIEN-4
  EVIDENCE: pending

- [ ] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-r6a-plus rpa1 rpa2 rpa3 rpa4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending
