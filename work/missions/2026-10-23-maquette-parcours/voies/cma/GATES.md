# Gates: voie cma — Comparer depuis la maquette jouable, série cma

OWNS: work/refonte-frontend/v4/ecran-1/fils25-comparer/cma1/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cma2/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cma3/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cma4/, work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/, work/missions/2026-10-23-maquette-parcours/voies/cma/RESULTAT.md

Scope: quatre mini maquettes jouables sur la base jouable, le moment se choisit, hors 16D, ≤ 100 mots.

- [ ] G1: chaque variante a sa page, sa note, ses trois captures, le sélecteur de moment, hors 16D, une greffe nommée, ≤ 100 mots
  CHECK: node work/refonte-frontend/v4/ecran-1/fils25-comparer/outils/variantes.mjs cma1 cma2 cma3 cma4
  EXPECT: VARIANTES-CMP-4
  EVIDENCE: pending

- [ ] G2: la baseline des pictos au trait
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cma1 cma2 cma3 cma4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending

- [ ] G3: le moment se choisit vraiment (un toucher change les valeurs comparées)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cma1 cma2 cma3 cma4 --page=etat.html
  EXPECT: QUAND OK
  EVIDENCE: pending
