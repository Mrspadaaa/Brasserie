# Gates: voie p1-ma-biere — Ma bière, la fiche et Substituer, jouables

OWNS: prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**, prototypes/houblons-v4/parcours/src/ecrans/biere/**, prototypes/houblons-v4/parcours/src/ecrans/fiche/**, prototypes/houblons-v4/parcours/src/ecrans/substituer/**, prototypes/houblons-v4/maquettes/parcours-p1/**, work/missions/2026-10-23-maquette-parcours/voies/p1-ma-biere/RESULTAT.md

Scope: Ma bière (étape Houblons), sa fiche au long appui et Substituer en porte, en React dans le socle, calculés en direct, avec leurs gestes joués.

- [ ] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p1
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: Ma bière garde ce qu'il a validé (D79)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-ma-biere.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: MA-BIERE OK
  EVIDENCE: pending

- [ ] G6: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: pending

- [ ] G7: l'appui long ouvre la fiche, courte et complète (D25)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --pages=etat.html
  EXPECT: FICHE OK
  EVIDENCE: pending

- [ ] G8: la fiche parle le langage de la page (D93)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche-baseline.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: FICHE-BASELINE OK
  EVIDENCE: pending

- [ ] G9: un houblon aux mots hors familles le montre (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: SANS-FAMILLE OK
  EVIDENCE: pending

- [ ] G10: Substituer garde les exigences de toute l'app
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p1 substituer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G11: les gestes de Ma bière, de la fiche et de Substituer jouent, état vérifié
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p1 --etape=ma-biere --etape=fiche --etape=substituer
  EXPECT: ETAPE OK (substituer)
  EVIDENCE: pending

- [ ] G12: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p1 --ponts
  EXPECT: PONTS OK
  EVIDENCE: pending

- [ ] G13: les tolérances du moteur tiennent (D54)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/tolerance.test.ts && echo TOLERANCE OK
  EXPECT: TOLERANCE OK
  EVIDENCE: pending

- [ ] G14: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: pending

- [ ] G15: les NOTE disent la base, les écarts et ce qu'il faudra brancher
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/src/ecrans/ma-biere/NOTE.md --contient "## Base,## Idées reprises,## Écarts,## Pour l'app"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G16: le rapport nomme les captures ouvertes, à 390 et à 1280 px
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p1-ma-biere/RESULTAT.md --contient "390,1280,fiche,substituer"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G17: l'étape Houblons reprend la base v4.10, élément par élément (D105)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json
  EXPECT: REPRISE OK
  EVIDENCE: pending

- [ ] G18: l'onglet Ma bière reprend la base v4.10, élément par élément (D105)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p1 biere --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json
  EXPECT: REPRISE OK
  EVIDENCE: pending

- [ ] G19: l'onglet Ma bière garde les exigences de toute l'app
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p1 biere --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G20: les gestes de l'onglet Ma bière jouent (bannir, objectifs vers Suggérer)
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p1 --etape=biere
  EXPECT: ETAPE OK (biere)
  EVIDENCE: pending

- [ ] G21: l'étape Houblons est conforme à son choix (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=etape-houblons
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G22: l'onglet Ma bière est conforme à son choix (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=ma-biere
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G23: le rail de l'étape Houblons tient ses plaintes (D27, D35, D36, D37, D46, D47, D69), y compris à 45′ et 120′
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html --parcours
  EXPECT: RAIL OK
  EVIDENCE: pending

- [ ] G24: la fiche reprend g1, élément par élément (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=fiche
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G25: l'étape Houblons, l'onglet Ma bière et la fiche ont la teinte de ses maquettes (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=fiche
  EXPECT: TEINTE OK
  EVIDENCE: pending
