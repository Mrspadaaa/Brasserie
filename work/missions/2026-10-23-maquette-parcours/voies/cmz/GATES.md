# Gates: voie cmz — Comparer depuis la maquette jouable, série cmz

OWNS: work/refonte-frontend/v4/ecran-1/fils25-comparer/cmz1/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cmz2/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cmz3/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cmz4/, work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/, work/missions/2026-10-23-maquette-parcours/voies/cmz/RESULTAT.md

Scope: quatre mini maquettes jouables sur la base jouable, le moment se choisit, hors 16D, ≤ 100 mots.

- [ ] G1: chaque variante a sa page, sa note, ses trois captures, le sélecteur de moment, hors 16D, une greffe nommée, ≤ 100 mots
  CHECK: node work/refonte-frontend/v4/ecran-1/fils25-comparer/outils/variantes.mjs cmz1 cmz2 cmz3 cmz4
  EXPECT: VARIANTES-CMP-4
  EVIDENCE: pending

- [ ] G2: la baseline des pictos au trait
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cmz1 cmz2 cmz3 cmz4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending

- [ ] G3: le moment se choisit vraiment (un toucher change les valeurs comparées)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cmz1 cmz2 cmz3 cmz4 --page=etat.html
  EXPECT: QUAND OK
  EVIDENCE: pending
