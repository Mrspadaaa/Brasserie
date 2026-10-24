# Gates: voie p24-controle-etats — le contrôle qui rejoue chaque état de ses maquettes choisies

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs, work/refonte-frontend/v4/choix/etats/*.json, work/refonte-frontend/v4/choix/ecrans.json, work/missions/2026-10-23-maquette-parcours/voies/p24-controle-etats/RESULTAT.md

Scope: chaque état relevé complété (voulu, verif), le contrôle qui les rejoue sur une maquette et sur ses maquettes choisies, branché dans le registre des choix.

- [ ] G1: chaque état a « voulu », et chaque état non voulu une verif complète
  CHECK: node -e "const fs=require('fs');let mal=[],n=0;for(const e of ['etape','biere','fiche','suggerer','comparer','acquis']){const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/etats/'+e+'.json','utf8'));for(const s of j.etats){if(!('voulu' in s)){mal.push(s.id);continue}if(s.voulu)continue;n++;const v=s.verif||{};if(!v.route||!v.page_choisie||!v.selecteur_choisie||!v.geste||!Array.isArray(v.attendu)||!v.attendu.length)mal.push(s.id)}}console.log(!mal.length&&n>=60?['VERIF','BIEN',n].join('-'):'VERIF ECHEC '+n+' '+mal.join(','));process.exit(!mal.length&&n>=60?0:1)"
  EXPECT: VERIF-BIEN
  EVIDENCE: pending

- [ ] G2: ses maquettes choisies passent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs --choisie
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: la maquette 5345f6ad échoue
  CHECK: node scripts/agents/systeme.mjs echoue "ETATS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-5345f6ad
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le registre des choix échoue désormais sur 5345f6ad
  CHECK: node scripts/agents/systeme.mjs echoue "CHOIX ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-5345f6ad
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: le registre seul reste valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre
  EXPECT: REGISTRE OK
  EVIDENCE: pending

- [ ] G6: le câblage tient
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending
