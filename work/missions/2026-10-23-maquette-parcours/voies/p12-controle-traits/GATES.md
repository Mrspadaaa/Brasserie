# Gates: voie p12-controle-traits — le contrôle D110 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/traits-*/**, work/missions/2026-10-23-maquette-parcours/voies/p12-controle-traits/RESULTAT.md

Scope: un contrôle joué qui exige que les traits de q2b restent muets au repos et disent, au toucher, leur famille et leur valeur près du picto ; il échoue sur la version publiée (d332792c).

- [ ] G1: le contrôle échoue sur la construction rejetée d332792c (rien au toucher)
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le témoin positif passe, aux deux largeurs
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-ok
  EXPECT: TRAITS OK
  EVIDENCE: pending

- [ ] G3: les traits muets au toucher échouent
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-muets
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le sens écrit en permanence échoue (cockpit)
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-bavards
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: une feuille qui couvre l'écran échoue
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-feuille
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G6: D110 est dans la portée des défauts, gardé, sur Suggérer
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D110');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!d.portee.includes('suggerer')||d.script!=='controle-traits.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G7: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending

- [ ] G8: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p12-controle-traits/RESULTAT.md --contient "d332792c,traits-ok,traits-muets,traits-bavards,traits-feuille"
  EXPECT: NOTE OK
  EVIDENCE: pending
