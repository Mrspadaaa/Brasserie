# Gates: voie p2-suggerer — Suggérer (q2b), jouable

OWNS: prototypes/houblons-v4/parcours/src/ecrans/suggerer/**, prototypes/houblons-v4/maquettes/parcours-p2/**, work/missions/2026-10-23-maquette-parcours/voies/p2-suggerer/RESULTAT.md

Scope: l'écran Suggérer de q2b (base v4.10), « Quel houblon ajouter à ma bière ? », avec D78 à D82, en React dans le socle, calculé en direct, qui ouvre Comparer avec les houblons cochés.

- [ ] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p2
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: un seul facteur libre, le houblon (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: pending

- [ ] G6: les extras hors objectif se voient (D76)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-autres-ajouts.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --pages=etat.html
  EXPECT: AUTRES OK
  EVIDENCE: pending

- [ ] G7: la piste l5b sous chaque objectif (D92)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-piste-objectif.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: PISTE OK
  EVIDENCE: pending

- [ ] G8: cinq candidats au premier écran, sans gros blocs (D84)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-place-voies.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: PLACE OK
  EVIDENCE: pending

- [ ] G9: ce qu'il a validé de Ma bière tient sur l'écran (D79)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-ma-biere.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: MA-BIERE OK
  EVIDENCE: pending

- [ ] G10: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: pending

- [ ] G11: les gestes de Suggérer jouent (dont D80 en direct : intensité en crans, usage), et « Comparer les 3 » ouvre Comparer avec les choisis
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p2 --etape=suggerer
  EXPECT: ETAPE OK (suggerer)
  EVIDENCE: pending

- [ ] G12: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p2 --ponts
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

- [ ] G15: la NOTE dit la base, les écarts, les contrôles écartés et ce qu'il faudra brancher
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/src/ecrans/suggerer/NOTE.md --contient "## Base,## Idées reprises,## Écarts,## Pour l'app,controle-moments,controle-cumul-levure"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G16: le rapport nomme les captures ouvertes, à 390 et à 1280 px
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p2-suggerer/RESULTAT.md --contient "390,1280,suggerer,q2b"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G17: Suggérer reprend q2b, élément par élément (D105)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees/inventaire-q2b.json
  EXPECT: REPRISE OK
  EVIDENCE: pending
