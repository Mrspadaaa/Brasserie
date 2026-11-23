# Gates: voie p21a-etats-etape-biere-fiche — chaque état de l'étape (hors rail), de Ma bière et de la fiche choisies

OWNS: work/refonte-frontend/v4/choix/etats/etape.json, work/refonte-frontend/v4/choix/etats/biere.json, work/refonte-frontend/v4/choix/etats/fiche.json, work/refonte-frontend/v4/choix/etats/captures/etat-etape-*, work/refonte-frontend/v4/choix/etats/captures/etat-biere-*, work/refonte-frontend/v4/choix/etats/captures/etat-fiche-*, work/missions/2026-10-23-maquette-parcours/voies/p21a-etats-etape-biere-fiche/RESULTAT.md

Scope: le relevé joué des états de trois maquettes choisies, leur verdict sur la maquette 5345f6ad, en captures côte à côte.

- [ ] G1: trois relevés d'au moins 8 états complets, captures existantes, verdicts rendus
  CHECK: node -e "const fs=require('fs');const champs=['id','mots','etat','quoi','page_choisie','capture_choisie','jeu','verdict_5345f6ad','capture_5345f6ad'];let r=[];for(const [e,p] of [['etape','etat-etape-'],['biere','etat-biere-'],['fiche','etat-fiche-']]){const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/etats/'+e+'.json','utf8'));const s=j.etats||[];const mal=s.filter(x=>champs.some(c=>!x[c])||!x.id.startsWith(p)||!fs.existsSync(x.capture_choisie)||!fs.existsSync(x.capture_5345f6ad)||!['present','absent','different'].includes(x.verdict_5345f6ad));if(s.length<8||mal.length)r.push(e+' '+s.length+' '+mal.map(x=>x.id).join(','))}console.log(r.length?'ETATS ECHEC '+r.join(' ; '):['ETATS','BIEN'].join('-'));process.exit(r.length?1:0)"
  EXPECT: ETATS-BIEN
  EVIDENCE: pending

- [ ] G2: le rapport donne les trois tables et les choix perdus
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p21a-etats-etape-biere-fiche/RESULTAT.md --contient "5345f6ad,base v4.10,Étape Houblons,Ma bière,g1,perdu"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la voie
  CHECK: node -e "const {execSync}=require('child_process');const s=execSync('git status --short --untracked-files=all',{encoding:'utf8'}).split(/\r?\n/).filter(Boolean).map(l=>l.slice(3).trim());const hors=s.filter(f=>/^(loupe|capture|essai|test|tmp)[^/]*\.(png|html|mjs|js)$/i.test(f)&&!f.includes('/'));console.log(hors.length?'RACINE ECHEC '+hors.join(','):['RACINE','PROPRE'].join('-'));process.exit(hors.length?1:0)"
  EXPECT: RACINE-PROPRE
  EVIDENCE: pending
