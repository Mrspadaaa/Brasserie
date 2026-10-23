# Gates: voie p13-controles-etape — D111, D112, D113 et leurs témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs, work/refonte-frontend/v4/tournoi/outils/controle-appui.mjs, work/refonte-frontend/v4/tournoi/outils/controle-legende.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/geste-etape-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/appui-etape-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/legende-etape-*/**, work/missions/2026-10-23-maquette-parcours/voies/p13-controles-etape/RESULTAT.md, work/refonte-frontend/v4/tournoi/outils/controle-profil-ouvre.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/profil-*/**

Scope: trois contrôles de l'étape Houblons (le glisser replié et lisible, un retour pendant l'appui long, un « ? » près de chaque groupe d'icônes), chacun en échec sur la version publiée d332792c.

- [ ] G1: le glisser de la version publiée échoue (carte entière, chevauchements)
  CHECK: node scripts/agents/systeme.mjs echoue "GESTE-ETAPE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le glisser de sa base v4.10 passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs work/refonte-frontend/v4/ecran-1/base/consolide --page=index.html
  EXPECT: GESTE-ETAPE OK
  EVIDENCE: pending

- [ ] G3: le témoin aux étiquettes qui se chevauchent échoue
  CHECK: node scripts/agents/systeme.mjs echoue "GESTE-ETAPE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs work/refonte-frontend/v4/tournoi/outils/temoins/geste-etape-chevauche
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le rapport donne, pour chaque contrôle, ses sorties sur la base, sur d332792c et sur ses témoins, et les appels rejoués
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p13-controles-etape/RESULTAT.md --contient "D111,D112,D113,d332792c,base v4.10,appel"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G5: D111, D112 et D113 sont dans la portée des défauts, gardés, sur l'étape
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const ok=['D111','D112','D113'].every(i=>{const d=p.defauts.find(x=>x.id===i);return d&&d.verdict==='garde'&&d.tourne==='oui'&&d.portee.includes('ma-biere')});console.log(ok?'PORTEE OK':'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE OK
  EVIDENCE: pending

- [ ] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: pending

- [ ] G7: le bloc du profil qui ne s'ouvre que par son « › » échoue (D121)
  CHECK: node -e "const fs=require('fs');const s=fs.existsSync('work/refonte-frontend/v4/tournoi/outils/controle-profil-ouvre.mjs')?'controle-profil-ouvre.mjs':'controle-geste-etape.mjs';const r=require('child_process').spawnSync(process.execPath,['scripts/agents/systeme.mjs','echoue','PROFIL ECHEC','--','node','work/refonte-frontend/v4/tournoi/outils/'+s,'work/refonte-frontend/v4/tournoi/outils/temoins/profil-chevron-seul'],{encoding:'utf8'});process.stdout.write(r.stdout+r.stderr)"
  EXPECT: ECHOUE OK
  EVIDENCE: pending
