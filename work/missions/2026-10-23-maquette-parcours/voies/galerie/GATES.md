# Gates: voie galerie — toutes les créations, et Dryhopper

OWNS: work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/**, work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-tout/**, work/missions/2026-10-23-maquette-parcours/voies/galerie/RESULTAT.md

Scope: deux pages dans sa disposition ; chaque mini maquette du dépôt dans la galerie, chaque mini maquette de Dryhopper dans sa page.

- [ ] G1: chaque mini maquette est dans l'inventaire et la galerie, chaque Dryhopper dans sa page
  CHECK: node work/missions/2026-10-23-maquette-parcours/voies/galerie/couverture.mjs
  EXPECT: COUVERTURE OK
  EVIDENCE: pending

- [ ] G2: la galerie se lit à 390 et 1280 px, ses images chargées
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/index.html --page-lot
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: la page Dryhopper se lit à 390 et 1280 px, ses images chargées
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-tout/index.html --page-lot
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: les deux pages tiennent dans un artefact (120 fichiers, 60 Mo, 15 Mo par fichier)
  CHECK: node work/missions/2026-10-23-maquette-parcours/voies/galerie/poids.mjs
  EXPECT: POIDS OK
  EVIDENCE: pending
