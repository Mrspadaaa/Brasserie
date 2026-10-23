# Gates: voie p10-controle-visee — le contrôle D108 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/visee-*/**, work/missions/2026-10-23-maquette-parcours/voies/p10-controle-visee/RESULTAT.md

Scope: un contrôle joué qui exige que « + », « − », « × » et « bannir » de Ma bière se dessinent sur la piste de la famille, comme sa base v4.10 ; il échoue sur la version publiée (d332792c).

- [ ] G1: le contrôle échoue sur la construction rejetée d332792c (piste inchangée)
  CHECK: node scripts/agents/systeme.mjs echoue "VISEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: sa base v4.10, balisée, passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs work/refonte-frontend/v4/tournoi/outils/temoins/visee-base
  EXPECT: VISEE OK (6/6
  EVIDENCE: pending

- [ ] G3: la visée qui ne change que le mot échoue
  CHECK: node scripts/agents/systeme.mjs echoue "VISEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs work/refonte-frontend/v4/tournoi/outils/temoins/visee-sans-trace
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le losange du mauvais côté échoue
  CHECK: node scripts/agents/systeme.mjs echoue "VISEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs work/refonte-frontend/v4/tournoi/outils/temoins/visee-mauvais-cote
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: D108 est dans la portée des défauts, gardé, sur Ma bière
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D108');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!d.portee.includes('biere')||d.script!=='controle-visee.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending

- [ ] G7: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p10-controle-visee/RESULTAT.md --contient "d332792c,visee-base,visee-sans-trace,visee-mauvais-cote"
  EXPECT: NOTE OK
  EVIDENCE: pending
