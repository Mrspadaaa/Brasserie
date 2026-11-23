# Gates: voie r1-etape — l'étape Houblons de la base v4.10, son rail tel quel et tous ses états

OWNS: prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**, prototypes/houblons-v4/parcours/src/ecrans/fiche/gestes.ts, prototypes/houblons-v4/parcours/vite.config.ts, prototypes/houblons-v4/parcours/src/main.tsx, prototypes/houblons-v4/parcours/src/donnees/**, prototypes/houblons-v4/maquettes/parcours-etape/**, work/missions/2026-10-23-maquette-parcours/voies/r1-etape/RESULTAT.md

Scope: les 39 fonctions du rail de sa base rendues, et chaque état perdu de l'étape (D123, D124), marqués data-etat, sans régression.

- [ ] G1: la maquette se construit dans sa sortie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-etape
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: chaque fonction du rail de sa base se rejoue
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs prototypes/houblons-v4/maquettes/parcours-etape
  EXPECT: FONCTIONS-RAIL OK
  EVIDENCE: pending

- [ ] G3: le rail côté froid est celui de sa base
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs prototypes/houblons-v4/maquettes/parcours-etape --froid
  EXPECT: GESTE-ETAPE OK (froid
  EVIDENCE: pending

- [ ] G4: le geste d'ébullition de sa base tient (D111)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs prototypes/houblons-v4/maquettes/parcours-etape
  EXPECT: GESTE-ETAPE OK
  EVIDENCE: pending

- [ ] G5: chaque état de l'étape se rejoue
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-etape --ecran=etape
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G6: l'étape est conforme à son choix (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-etape --ecran=etape-houblons
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G7: les exigences de toute l'app et le rail ancien tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-etape ma-biere --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G8: les types tiennent
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G10: la teinte de ses maquettes tient (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-etape
  EXPECT: TEINTE OK
  EVIDENCE: pending

- [ ] G9: le rapport liste les fonctions et états rendus avec leurs captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r1-etape/RESULTAT.md --contient "data-etat,capture,loupe,whirlpool,J+,cas-ebu200,5345f6ad"
  EXPECT: NOTE OK
  EVIDENCE: pending
