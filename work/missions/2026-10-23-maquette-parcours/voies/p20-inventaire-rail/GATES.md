# Gates: voie p20-inventaire-rail — chaque fonction du rail de sa base, et son contrôle

OWNS: work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json, work/refonte-frontend/v4/ecran-1/base/captures/rail-inventaire/**, work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/fonctions-rail-*/**, work/missions/2026-10-23-maquette-parcours/voies/p20-inventaire-rail/RESULTAT.md

Scope: l'inventaire joué des fonctions du rail de l'étape dans sa base v4.10, leur verdict sur la maquette 5345f6ad, et le contrôle qui les rejoue.

- [ ] G1: l'inventaire a au moins 18 fonctions complètes, captures existantes, verdicts rendus
  CHECK: node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json','utf8'));const f=j.fonctions||[];const champs=['id','mots','quoi','etat','page_base','capture_base','jeu','verdict_5345f6ad','capture_5345f6ad','controle'];const mal=f.filter(x=>champs.some(c=>!x[c])||!fs.existsSync(x.capture_base)||!fs.existsSync(x.capture_5345f6ad)||!['present','absent','different'].includes(x.verdict_5345f6ad)||!/^rail-/.test(x.id));console.log(f.length>=18&&!mal.length?['INVENTAIRE','BIEN',f.length].join('-'):'INVENTAIRE ECHEC '+f.length+' '+mal.map(x=>x.id).join(','));process.exit(f.length>=18&&!mal.length?0:1)"
  EXPECT: INVENTAIRE-BIEN
  EVIDENCE: pending

- [ ] G2: le contrôle passe sur sa base v4.10
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs work/refonte-frontend/v4/ecran-1/base/consolide --page=index.html
  EXPECT: FONCTIONS-RAIL OK
  EVIDENCE: pending

- [ ] G3: le contrôle échoue sur la maquette 5345f6ad
  CHECK: node scripts/agents/systeme.mjs echoue "FONCTIONS-RAIL ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs prototypes/houblons-v4/maquettes/parcours-5345f6ad
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le témoin sans loupe échoue
  CHECK: node scripts/agents/systeme.mjs echoue "FONCTIONS-RAIL ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins/fonctions-rail-sans-loupe --page=index.html
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: D124 est dans la portée des défauts, gardé, sur Ma bière
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D124');const ok=d&&d.verdict==='garde'&&d.tourne==='oui'&&d.portee.includes('ma-biere');console.log(ok?['PORTEE','BIEN'].join('-'):'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE-BIEN
  EVIDENCE: pending

- [ ] G6: le câblage et les témoins du système tiennent
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending

- [ ] G7: le rapport donne la table des fonctions et les sorties sur la base, sur 5345f6ad et sur le témoin
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p20-inventaire-rail/RESULTAT.md --contient "5345f6ad,base v4.10,fonctions-rail-sans-loupe,loupe,whirlpool,J+,cas-ebu200,cas-k3"
  EXPECT: NOTE OK
  EVIDENCE: pending
