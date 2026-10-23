# Gates: voie p11-controle-retour — le contrôle D109 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/retour-*/**, work/missions/2026-10-23-maquette-parcours/voies/p11-controle-retour/RESULTAT.md

Scope: un contrôle qui exige, sur chaque outil, une croix de 44 px au moins, icône de 20 px à l'encre, à la même place et dans un en-tête de même hauteur d'un onglet à l'autre (D119), qui ramène toujours à l'étape Houblons (D118) ; il échoue sur la version publiée (d332792c).

- [ ] G1: le contrôle échoue sur la construction rejetée d332792c (« ‹ » de 28 px, gris ; retour selon le chemin ; en-tête qui change)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le témoin positif passe, aux deux largeurs
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-ok --routes=suggerer
  EXPECT: RETOUR OK
  EVIDENCE: pending

- [ ] G3: le retour petit et gris échoue
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-petit --routes=suggerer
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: une croix qui ne ramène pas à l'étape Houblons échoue (D118)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-ailleurs --routes=suggerer
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4b: un en-tête qui saute d'un onglet à l'autre échoue (D119)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-en-tete-saute --routes=biere,suggerer,comparer
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: D109 (avec D118 et D119) est dans la portée des défauts, gardé, sur les outils
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D109');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!['suggerer','comparer','dryhopper','levure','substituer'].every(r=>d.portee.includes(r))||d.script!=='controle-retour.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending

- [ ] G7: le rapport donne les sorties et les mesures sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p11-controle-retour/RESULTAT.md --contient "d332792c,retour-ok,retour-petit,retour-ailleurs,retour-en-tete-saute,28"
  EXPECT: NOTE OK
  EVIDENCE: pending
