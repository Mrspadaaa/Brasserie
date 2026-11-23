# Gates: voie r7-batterie — la maquette commune, batterie au vert

OWNS: prototypes/houblons-v4/parcours/src/**, prototypes/houblons-v4/parcours/outils/parcours-complet.mjs, prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs, prototypes/houblons-v4/parcours/outils/batterie.mjs, prototypes/houblons-v4/maquettes/parcours/**, work/missions/2026-10-23-maquette-parcours/voies/r7-batterie/RESULTAT.md

Scope: la construction commune des six reprises passe la batterie entière, sans perdre un état ni une fonction du rail.

- [ ] G1: la batterie entière passe
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK
  EVIDENCE: pending

- [ ] G2: chaque état de ses maquettes choisies se rejoue sur la construction commune
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: le rail de sa base, sur la construction commune
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: FONCTIONS-RAIL OK
  EVIDENCE: pending

- [ ] G4: le côté froid, sur la construction commune
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs prototypes/houblons-v4/maquettes/parcours --froid
  EXPECT: GESTE-ETAPE OK (froid
  EVIDENCE: pending

- [ ] G5: le rapport donne chaque échec, sa cause et sa correction
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r7-batterie/RESULTAT.md --contient "FICHE,MOTS,RAIL,RETOUR,PONTS,Idaho 7,DÉCISION"
  EXPECT: NOTE OK
  EVIDENCE: pending
