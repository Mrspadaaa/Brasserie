# Gates: voie r6-substituer — Substituer de u4, tous ses états

OWNS: prototypes/houblons-v4/parcours/src/ecrans/substituer/**, prototypes/houblons-v4/maquettes/parcours-substituer/**, work/refonte-frontend/v4/choix/etats/substituer.json, work/refonte-frontend/v4/choix/etats/captures/etat-subst-*, work/missions/2026-10-23-maquette-parcours/voies/r6-substituer/RESULTAT.md

Scope: l'inventaire joué de u4, puis l'écran Substituer de la maquette rendu comme u4, marqué data-etat, honnête, sans régression.

- [ ] G1: l'inventaire de u4 a au moins 8 états complets, verdicts et verif
  CHECK: node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/etats/substituer.json','utf8'));const s=j.etats||[];const mal=s.filter(x=>!x.id||!x.id.startsWith('etat-subst-')||!fs.existsSync(x.capture_choisie||'')||!['present','absent','different'].includes(x.verdict_5345f6ad)||!('voulu' in x)||(!x.voulu&&!(x.verif&&Array.isArray(x.verif.attendu)&&x.verif.attendu.length)));console.log(s.length>=8&&!mal.length?['SUBST','BIEN',s.length].join('-'):'SUBST ECHEC '+s.length+' '+mal.map(x=>x.id).join(','));process.exit(s.length>=8&&!mal.length?0:1)"
  EXPECT: SUBST-BIEN
  EVIDENCE: pending

- [ ] G2: la maquette se construit dans sa sortie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-substituer
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G3: chaque état de u4 se rejoue sur l'écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-substituer --ecran=substituer
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: Annuler tient (D120)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-substituer
  EXPECT: ANNULER OK
  EVIDENCE: pending

- [ ] G5: les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-substituer substituer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G6: la teinte de ses maquettes et les types tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-substituer
  EXPECT: TEINTE OK
  EVIDENCE: pending

- [ ] G7: les types tiennent
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G8: le rapport donne l'inventaire, les états rendus et leurs captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r6-substituer/RESULTAT.md --contient "u4,data-etat,capture,choisie,5345f6ad,Annuler"
  EXPECT: NOTE OK
  EVIDENCE: pending
