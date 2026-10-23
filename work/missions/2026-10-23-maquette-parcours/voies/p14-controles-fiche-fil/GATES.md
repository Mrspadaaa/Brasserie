# Gates: voie p14-controles-fiche-fil — D115, D116 et leurs témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs, work/refonte-frontend/v4/tournoi/outils/controle-fiche-radar.mjs, work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/fiche-radar-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/stepper-*/**, work/missions/2026-10-23-maquette-parcours/voies/p14-controles-fiche-fil/RESULTAT.md

Scope: deux contrôles (le radar avant la liste dans la fiche, le fil d'étapes de l'app en tête de l'étape Houblons), chacun en échec sur la version publiée d332792c.

- [ ] G1: l'étape de la version publiée n'a pas le fil d'étapes de l'app (en-tête maison, « hypothèse »)
  CHECK: node scripts/agents/systeme.mjs echoue "STEPPER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le témoin du vrai fil d'étapes passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs work/refonte-frontend/v4/tournoi/outils/temoins/stepper-ok
  EXPECT: STEPPER OK
  EVIDENCE: pending

- [ ] G3: l'en-tête maison avec « hypothèse » échoue
  CHECK: node scripts/agents/systeme.mjs echoue "STEPPER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs work/refonte-frontend/v4/tournoi/outils/temoins/stepper-hypothese
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le rapport donne les sorties de D115 et D116 sur d332792c et les témoins, et les appels rejoués
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p14-controles-fiche-fil/RESULTAT.md --contient "D115,D116,d332792c,fiche-radar-ok,fiche-radar-bas,stepper-ok,stepper-hypothese,appel"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G5: D115 et D116 sont dans la portée des défauts, gardés
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const a=p.defauts.find(x=>x.id==='D115'),b=p.defauts.find(x=>x.id==='D116');const ok=a&&b&&a.verdict==='garde'&&b.verdict==='garde'&&a.portee.includes('fiche')&&b.portee.includes('ma-biere');console.log(ok?'PORTEE OK':'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending
