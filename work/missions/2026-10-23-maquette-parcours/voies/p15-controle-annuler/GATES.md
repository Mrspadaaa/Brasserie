# Gates: voie p15-controle-annuler — le contrôle D120 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/annuler-*/**, work/missions/2026-10-23-maquette-parcours/voies/p15-controle-annuler/RESULTAT.md

Scope: un contrôle qui exige « Annuler » à côté de l'action qui change la recette, sans effet sur elle, sur Substituer, Levure et Dryhopper ; il échoue sur la version publiée (d332792c).

- [ ] G1: la version publiée échoue (Substituer sans Annuler)
  CHECK: node scripts/agents/systeme.mjs echoue "ANNULER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le témoin positif passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs work/refonte-frontend/v4/tournoi/outils/temoins/annuler-ok --routes=substituer
  EXPECT: ANNULER OK
  EVIDENCE: pending

- [ ] G3: sans Annuler, échec
  CHECK: node scripts/agents/systeme.mjs echoue "ANNULER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs work/refonte-frontend/v4/tournoi/outils/temoins/annuler-absent --routes=substituer
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: un Annuler qui change la recette échoue
  CHECK: node scripts/agents/systeme.mjs echoue "ANNULER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs work/refonte-frontend/v4/tournoi/outils/temoins/annuler-qui-change --routes=substituer
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: D120 est dans la portée des défauts, gardé
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D120');const ok=d&&d.verdict==='garde'&&d.tourne==='oui'&&['substituer','levure','dryhopper'].every(r=>d.portee.includes(r))&&d.script==='controle-annuler.mjs';console.log(ok?'PORTEE OK':'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending

- [ ] G7: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p15-controle-annuler/RESULTAT.md --contient "d332792c,annuler-ok,annuler-absent,annuler-qui-change"
  EXPECT: NOTE OK
  EVIDENCE: pending
