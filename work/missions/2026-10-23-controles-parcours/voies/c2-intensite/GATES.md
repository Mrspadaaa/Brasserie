# Gates: voie c2-intensite — l'intensité et l'usage, sur la maquette jouable

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/usage-parcours-*, work/missions/2026-10-23-controles-parcours/voies/c2-intensite

Scope: un mode --parcours de controle-usage-intensite.mjs contre le moteur en direct, ses témoins, joué sur le parcours, sans toucher au mode actuel.

- [ ] G1: le mode actuel ne change pas
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe q2b --page=etat-b.html
  EXPECT: USAGE-INTENSITE OK
  EVIDENCE: pending

- [ ] G2: le témoin positif passe en mode parcours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-ok --page=etat.html --parcours
  EXPECT: USAGE-INTENSITE OK
  EVIDENCE: pending

- [ ] G3: un usage faux échoue par U1 usage
  CHECK: node scripts/agents/systeme.mjs echoue "U1 usage" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-usage-faux --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: une source de forme longue échoue par U1 source
  CHECK: node scripts/agents/systeme.mjs echoue "U1 source" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-source-longue --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: une intensité absente échoue par I1 absente
  CHECK: node scripts/agents/systeme.mjs echoue "I1 absente" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-sans-intensite --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G6: une intensité loin du moteur échoue par I1 écart
  CHECK: node scripts/agents/systeme.mjs echoue "I1 écart" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-ecart --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G7: joué sur Ma bière, Suggérer et Comparer du parcours, il rend un verdict sans planter
  CHECK: node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs prototypes/houblons-v4/maquettes/parcours ma-biere suggerer comparer --page=etat.html --parcours
  EXPECT: /ma-biere · [\s\S]*suggerer · [\s\S]*comparer · [\s\S]*VERDICT (OK|ECHEC)/
  EVIDENCE: pending

- [ ] G8: la NOTE décrit la table des routes et ce qui reste hors du contrôle
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c2-intensite/NOTE.md --contient "ma-biere,suggerer,comparer,hopRole,cransOf"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G9: les défauts du parcours sont écrits pour les écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c2-intensite/RESULTAT.md --exiger "Défauts du parcours"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G10: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending
