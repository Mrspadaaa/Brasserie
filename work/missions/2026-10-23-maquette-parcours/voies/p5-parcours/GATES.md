# Gates: voie p5-parcours — le parcours entier, joué et capturé

OWNS: prototypes/houblons-v4/parcours/outils/parcours-complet.mjs, work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/**

Scope: le parcours de la carte joué d'un bout à l'autre dans une seule session, état et écran vérifiés après chaque geste, au téléphone et à l'ordinateur, avec une capture par étape.

- [ ] G1: le parcours entier joue, au téléphone et à l'ordinateur
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --captures work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures
  EXPECT: PARCOURS OK
  EVIDENCE: pending

- [ ] G2: le parcours des ponts joue encore sur la maquette intégrée
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts
  EXPECT: PONTS OK
  EVIDENCE: pending

- [ ] G3: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: pending

- [ ] G4: les captures des étapes existent, aux deux largeurs
  CHECK: node scripts/agents/systeme.mjs existent work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/01-ma-biere-390.png work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/01-ma-biere-1280.png
  EXPECT: EXISTENT OK
  EVIDENCE: pending

- [ ] G5: le rapport décrit chaque capture et chaque défaut
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/RESULTAT.md --contient "390,1280,ma-biere,suggerer,comparer,dryhopper,levure,substituer,recalcul"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G6: chaque écran de la maquette intégrée est conforme à ses choix ; les choix ouverts sont nommés (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: CHOIX OK
  EVIDENCE: pending
