# Gates: voie p4-dryhopper — Dryhopper (a1) et l'étape Levure, jouables

OWNS: prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/parcours/src/ecrans/levure/**, prototypes/houblons-v4/maquettes/parcours-p4/**, work/missions/2026-10-23-maquette-parcours/voies/p4-dryhopper/RESULTAT.md

Scope: a1 portée en React dans le socle, le moment calculé en direct à chaque geste, D95 corrigé, puis l'étape Levure qui inscrit l'ajout dans la recette.

- [ ] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p4
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: pending

- [ ] G6: les acquis de Dryhopper sont là : geste, frise, valeurs, levure (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK
  EVIDENCE: pending

- [ ] G7: l'α du houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: pending

- [ ] G8: tout simulé est marqué (D94)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-lisible.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: LISIBLE OK
  EVIDENCE: pending

- [ ] G9: le rail fait bouger le simulé, une vraie valeur à côté (D95, rouge sur a1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-simulation.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: SIMULATION OK
  EVIDENCE: pending

- [ ] G10: l'étape Levure : un seul facteur libre, la levure (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p4 levure --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : levure\)/
  EVIDENCE: pending

- [ ] G11: l'étape Levure : la levure fait bouger le simulé, la biotransformation se voit (D96)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-cumul-levure.mjs prototypes/houblons-v4/maquettes/parcours-p4 levure --page=etat.html
  EXPECT: CUMUL OK
  EVIDENCE: pending

- [ ] G12: l'étape Levure : tout simulé est marqué, et elle garde les exigences de toute l'app
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p4 levure --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G13: les gestes de Dryhopper et de Levure jouent, l'ajout est inscrit dans la recette
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p4 --etape=dryhopper --etape=levure
  EXPECT: ETAPE OK (levure)
  EVIDENCE: pending

- [ ] G14: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p4 --ponts
  EXPECT: PONTS OK
  EVIDENCE: pending

- [ ] G15: le pouvoir des composés tient (D85)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/pouvoir.test.ts && echo POUVOIR OK
  EXPECT: POUVOIR OK
  EVIDENCE: pending

- [ ] G16: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: pending

- [ ] G17: les NOTE disent la base, les écarts, les contrôles écartés et ce qu'il faudra brancher
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/src/ecrans/dryhopper/NOTE.md --contient "## Base,## Idées reprises,## Écarts,## Pour l'app,controle-moments,D96"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G18: le rapport nomme les captures ouvertes, à côté de a1, à 390 et à 1280 px, et le temps d'un recalcul
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p4-dryhopper/RESULTAT.md --contient "390,1280,a1,levure,ms"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G19: le rail de Dryhopper tient ses plaintes (D35 loupe sans chevauchement, D46 pouce continu, D47 seuls les crans du segment sous le doigt), y compris à 45′ et 120′
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html --parcours
  EXPECT: RAIL OK
  EVIDENCE: pending
