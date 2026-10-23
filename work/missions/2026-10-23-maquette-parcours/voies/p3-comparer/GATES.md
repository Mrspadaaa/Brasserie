# Gates: voie p3-comparer — Comparer (r6a, avec les petites améliorations des autres), jouable

OWNS: prototypes/houblons-v4/parcours/src/ecrans/comparer/**, prototypes/houblons-v4/maquettes/parcours-p3/**, work/missions/2026-10-23-maquette-parcours/voies/p3-comparer/RESULTAT.md

Scope: r6a portée en React dans le socle, calculée en direct, avec les petites améliorations des autres versions, D95 corrigé, avec ses gestes joués et le pont vers Dryhopper.

- [ ] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p3
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: un seul facteur libre, le houblon (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: pending

- [ ] G6: les quatre acquis de Comparer sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: pending

- [ ] G7: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: pending

- [ ] G8: chaque houblon se distingue sur le radar (D77)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-radar-series.mjs prototypes/houblons-v4/maquettes/parcours-p3/comparer/etat.html
  EXPECT: RADAR-SERIES OK
  EVIDENCE: pending

- [ ] G9: tout simulé est marqué (D94)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-lisible.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: LISIBLE OK
  EVIDENCE: pending

- [ ] G10: un réglage fait bouger le simulé, une vraie valeur à côté (D95, rouge sur r6a)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-simulation.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: SIMULATION OK
  EVIDENCE: pending

- [ ] G11: les extras hors objectif se voient (D76)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-autres-ajouts.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --pages=etat.html
  EXPECT: AUTRES OK
  EVIDENCE: pending

- [ ] G12: un houblon aux mots hors familles le montre (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: SANS-FAMILLE OK
  EVIDENCE: pending

- [ ] G13: les 37 éléments notés sont classés et balisés (D104, rouge sur r6a)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: pending

- [ ] G14: les gestes de Comparer jouent, et « Placer » ouvre Dryhopper avec le bon houblon
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p3 --etape=comparer
  EXPECT: ETAPE OK (comparer)
  EVIDENCE: pending

- [ ] G15: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p3 --ponts
  EXPECT: PONTS OK
  EVIDENCE: pending

- [ ] G16: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: pending

- [ ] G17: le rapport nomme les captures ouvertes, à côté de r6a, à 390 et à 1280 px, et les améliorations prises
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p3-comparer/RESULTAT.md --contient "390,1280,r6a,D95,r6n2,r6p"
  EXPECT: NOTE OK
  EVIDENCE: pending
