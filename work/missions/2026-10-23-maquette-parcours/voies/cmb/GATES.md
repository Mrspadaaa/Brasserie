# Gates: voie cmb — Comparer depuis la maquette jouable, série cmb

OWNS: work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb1/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb2/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb3/, work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb4/, work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/, work/missions/2026-10-23-maquette-parcours/voies/cmb/RESULTAT.md

Scope: quatre mini maquettes jouables sur la base jouable, le moment se choisit, hors 16D, ≤ 100 mots.

- [ ] G1: chaque variante a sa page, sa note, ses trois captures, le sélecteur de moment, hors 16D, une greffe nommée, ≤ 100 mots
  CHECK: node work/refonte-frontend/v4/ecran-1/fils25-comparer/outils/variantes.mjs cmb1 cmb2 cmb3 cmb4
  EXPECT: VARIANTES-CMP-4
  EVIDENCE: pending

- [ ] G2: la baseline des pictos au trait
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cmb1 cmb2 cmb3 cmb4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending

- [ ] G3: le moment se choisit vraiment (un toucher change les valeurs comparées)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs work/refonte-frontend/v4/ecran-1/fils25-comparer cmb1 cmb2 cmb3 cmb4 --page=etat.html
  EXPECT: QUAND OK
  EVIDENCE: pending
