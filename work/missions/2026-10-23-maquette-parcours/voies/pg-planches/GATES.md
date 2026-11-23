# Gates: voie pg-planches — une page par vue, onze mini maquettes côte à côte

OWNS: work/refonte-frontend/v4/outils/pages/2026-10-24-planche-*/**, work/missions/2026-10-23-maquette-parcours/voies/pg-planches/RESULTAT.md

Scope: les planches de Dryhopper, Substituer, la liste de la fiche et les graphes, lisibles et côte à côte (D126).

- [ ] G1: Dryhopper, lisible et côte à côte
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-dryhopper/index.html --page-lot --captures work/refonte-frontend/v4/outils/pages/2026-10-24-planche-dryhopper/verif && node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-dryhopper/index.html
  EXPECT: PAGE-CHOIX OK
  EVIDENCE: pending

- [ ] G2: Substituer, lisible et côte à côte
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-substituer/index.html --page-lot --captures work/refonte-frontend/v4/outils/pages/2026-10-24-planche-substituer/verif && node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-substituer/index.html
  EXPECT: PAGE-CHOIX OK
  EVIDENCE: pending

- [ ] G3: la liste de la fiche, lisible et côte à côte
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-fiche/index.html --page-lot --captures work/refonte-frontend/v4/outils/pages/2026-10-24-planche-fiche/verif && node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-fiche/index.html
  EXPECT: PAGE-CHOIX OK
  EVIDENCE: pending

- [ ] G4: les graphes, lisibles et côte à côte (six : sa question porte sur six graphes, pas sur des variantes)
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-graphes/index.html --page-lot --captures work/refonte-frontend/v4/outils/pages/2026-10-24-planche-graphes/verif && node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-planche-graphes/index.html --min=5
  EXPECT: PAGE-CHOIX OK
  EVIDENCE: pending
