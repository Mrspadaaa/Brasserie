# Gates: voie c1-rail — le contrôle du rail, sur la maquette jouable

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/rail-parcours-*, work/missions/2026-10-23-controles-parcours/voies/c1-rail

Scope: un mode --parcours de controle-rail.mjs, ses témoins, joué sur le parcours construit, sans toucher au mode actuel.

- [ ] G1: le mode actuel ne change pas
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/ecran-1/base consolide
  EXPECT: RAIL OK 1/1
  EVIDENCE: pending

- [ ] G2: le témoin positif passe en mode parcours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-ok --page=etat.html --parcours
  EXPECT: RAIL OK 1/1
  EVIDENCE: pending

- [ ] G3: des graduations au repos échouent par D47
  CHECK: node scripts/agents/systeme.mjs echoue D47 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-gradue --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: des pas de 10 minutes échouent par D34
  CHECK: node scripts/agents/systeme.mjs echoue D34 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-pas10 --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: un rail sans loupe échoue par D63
  CHECK: node scripts/agents/systeme.mjs echoue D63 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-sans-loupe --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G6: une ombre au repos échoue par D42
  CHECK: node scripts/agents/systeme.mjs echoue D42 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-ombre --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G7: un bout hors d'atteinte échoue par D69
  CHECK: node scripts/agents/systeme.mjs echoue D69 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-extreme --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G8: une poignée qui saute échoue par D46
  CHECK: node scripts/agents/systeme.mjs echoue D46 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-saccade --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G9: les 22 plaintes sont classées dans la NOTE
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/NOTE.md --exiger "Règles" --contient "D27,D28,D34,D35,D36,D37,D41,D42,D43,D44,D45,D46,D47,D55,D56,D61,D63,D64,D67,D68,D69"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G10: joué sur Ma bière et Dryhopper du parcours, il rend un verdict sans planter
  CHECK: node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours ma-biere dryhopper --page=etat.html --parcours
  EXPECT: /ma-biere · [\s\S]*dryhopper · [\s\S]*VERDICT (OK|ECHEC)/
  EVIDENCE: pending

- [ ] G11: les défauts du parcours sont écrits pour les écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/RESULTAT.md --exiger "Défauts du parcours"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G12: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending
