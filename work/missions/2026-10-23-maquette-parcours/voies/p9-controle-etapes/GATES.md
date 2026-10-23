# Gates: voie p9-controle-etapes — le contrôle D107 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-*/**, work/missions/2026-10-23-maquette-parcours/voies/p9-controle-etapes/RESULTAT.md

Scope: un contrôle qui exige, sur Comparer, les valeurs de chaque houblon à 60′, 10′ et au dry hop, visibles ensemble, et une référence aux mêmes étapes ; il échoue sur la version publiée (d332792c).

- [ ] G1: le contrôle échoue sur la construction rejetée d332792c (un seul moment)
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le témoin positif passe, aux deux largeurs
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-ok
  EXPECT: COMPARER-ETAPES OK
  EVIDENCE: pending

- [ ] G2b: le témoin positif avec le houblon de la recette en référence passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-ok-houblon
  EXPECT: COMPARER-ETAPES OK
  EVIDENCE: pending

- [ ] G3: le témoin à un seul moment échoue
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-un-moment
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le dry hop caché derrière un toucher échoue
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-cache
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: les étapes sans référence échouent
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-sans-reference
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G6: les étapes sur deux écrans échouent
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-trop-haut
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G7: D107 est dans la portée des défauts, gardé, sur Comparer
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D107');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!d.portee.includes('comparer')||d.script!=='controle-comparer-etapes.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G8: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending

- [ ] G9: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p9-controle-etapes/RESULTAT.md --contient "d332792c,comparer-etapes-ok,comparer-etapes-un-moment,comparer-etapes-cache,comparer-etapes-sans-reference,comparer-etapes-trop-haut"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G10: le panel OSU au premier écran, titre gras, échoue (D114)
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-panel-haut
  EXPECT: ECHOUE OK
  EVIDENCE: pending
