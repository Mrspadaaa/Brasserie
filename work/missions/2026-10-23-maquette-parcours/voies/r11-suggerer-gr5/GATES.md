# Gates: voie r11-suggerer-gr5 — les traits de gr5 dans Suggérer

OWNS: prototypes/houblons-v4/parcours/src/ecrans/suggerer/**, prototypes/houblons-v4/maquettes/parcours-suggerer/**, work/refonte-frontend/v4/choix/etats/suggerer.json, work/missions/2026-10-23-maquette-parcours/voies/r11-suggerer-gr5/RESULTAT.md

Scope: les lectures b et c de gr5 rendues dans Suggérer, sans perdre un état de q2b.

- [ ] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-suggerer
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: les deux états de gr5 tiennent sur sa page gr5 (témoin)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs --choisie --ecran=suggerer
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: tous les états de Suggérer tiennent sur la maquette, gr5 compris
  CHECK: node -e "const j=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/choix/etats/suggerer.json','utf8'));const ids=j.etats.map(e=>e.id);const m=['etat-sugg-gr5-cran','etat-sugg-gr5-crans-comptes'].filter(i=>!ids.includes(i));if(m.length){console.log('GR5 ABSENTS '+m.join(','));process.exit(1)}" && node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-suggerer --ecran=suggerer
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: son choix et la baseline
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-suggerer --ecran=suggerer && node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-suggerer suggerer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending
