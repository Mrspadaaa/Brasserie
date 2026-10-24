# Gates: voie p21b-etats-suggerer-comparer-acquis — chaque état de Suggérer et de Comparer choisis, et ses acquis

OWNS: work/refonte-frontend/v4/choix/etats/suggerer.json, work/refonte-frontend/v4/choix/etats/comparer.json, work/refonte-frontend/v4/choix/etats/acquis.json, work/refonte-frontend/v4/choix/etats/captures/etat-sugg-*, work/refonte-frontend/v4/choix/etats/captures/etat-comp-*, work/refonte-frontend/v4/choix/etats/captures/etat-acquis-*, work/missions/2026-10-23-maquette-parcours/voies/p21b-etats-suggerer-comparer-acquis/RESULTAT.md

Scope: le relevé joué des états de Suggérer (q2b) et de Comparer (r6a, x3b), et de ses acquis, leur verdict sur la maquette 5345f6ad, en captures côte à côte.

- [ ] G1: trois relevés complets (8 états pour Suggérer, 10 pour Comparer, 12 acquis ou choix), captures existantes, verdicts rendus
  CHECK: node -e "const fs=require('fs');const champs=['id','mots','etat','quoi','page_choisie','capture_choisie','jeu','verdict_5345f6ad','capture_5345f6ad'];let r=[];for(const [e,p,n] of [['suggerer','etat-sugg-',8],['comparer','etat-comp-',10],['acquis','etat-acquis-',12]]){const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/etats/'+e+'.json','utf8'));const s=j.etats||[];const mal=s.filter(x=>champs.some(c=>!x[c])||!x.id.startsWith(p)||!fs.existsSync(x.capture_choisie)||!fs.existsSync(x.capture_5345f6ad)||!['present','absent','different'].includes(x.verdict_5345f6ad));if(s.length<n||mal.length)r.push(e+' '+s.length+' '+mal.map(x=>x.id).join(','))}console.log(r.length?'ETATS ECHEC '+r.join(' ; '):['ETATS','BIEN'].join('-'));process.exit(r.length?1:0)"
  EXPECT: ETATS-BIEN
  EVIDENCE: pending

- [ ] G2: le rapport donne les tables et les choix perdus
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p21b-etats-suggerer-comparer-acquis/RESULTAT.md --contient "5345f6ad,q2b,r6a,x3b,acquis,perdu"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la voie
  CHECK: node -e "const {execSync}=require('child_process');const s=execSync('git status --short --untracked-files=all',{encoding:'utf8'}).split(/\r?\n/).filter(Boolean).map(l=>l.slice(3).trim());const hors=s.filter(f=>/^(loupe|capture|essai|test|tmp)[^/]*\.(png|html|mjs|js)$/i.test(f)&&!f.includes('/'));console.log(hors.length?'RACINE ECHEC '+hors.join(','):['RACINE','PROPRE'].join('-'));process.exit(hors.length?1:0)"
  EXPECT: RACINE-PROPRE
  EVIDENCE: pending
