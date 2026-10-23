# Gates: a1-audit-defauts

OWNS: work/refonte-frontend/v4/tournoi/outils/portee-defauts.json, work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md, work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/RESULTAT.md

Scope: audit, défaut par défaut, des contrôles du registre sur les pages au format actuel ; aucun script modifié.

- [ ] G1: une entrée par ligne D de DEFAUTS-COURT, avec les mêmes ids
  CHECK: node -e "const fs=require('fs');const ids=[...fs.readFileSync('work/refonte-frontend/v4/DEFAUTS-COURT.md','utf8').matchAll(/^\| (D[^|]+?) \|/gm)].map(m=>m[1].trim());const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/tournoi/outils/portee-defauts.json','utf8'));const vus=new Set(j.defauts.map(d=>d.id));const manque=ids.filter(i=>!vus.has(i));console.log(manque.length?'PORTEE ECHEC manque '+manque.join(' '):'PORTEE COMPLETE '+ids.length);process.exit(manque.length?1:0)"
  EXPECT: PORTEE COMPLETE
  EVIDENCE: pending

- [ ] G2: chaque entrée a ses champs, des valeurs du vocabulaire, et une sortie quand le script tourne
  CHECK: node -e "const j=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/tournoi/outils/portee-defauts.json','utf8'));const P=['tout-ecran','rail','radar','comparer','fiche','carte-houblon','suggestions','recette','ma-biere','dryhopper','levure','picto','donnees','page-lot'];const bad=j.defauts.filter(d=>!d.controle||!Array.isArray(d.portee)||!d.portee.length||d.portee.some(p=>!P.includes(p))||!['oui','non','sans-script','jury'].includes(d.tourne)||!['garde','a-adapter','caduc','jury'].includes(d.verdict)||(d.tourne==='oui'&&!d.resultat)||(d.verdict==='caduc'&&!d.remplace_par));console.log(bad.length?'CHAMPS ECHEC '+bad.map(d=>d.id).join(' '):'CHAMPS OK '+j.defauts.length);process.exit(bad.length?1:0)"
  EXPECT: CHAMPS OK
  EVIDENCE: pending

- [ ] G3: l'audit a ses sections et son bilan
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md --contient "## À adapter,## Caducs,## Portée par sujet,dryhopper,comparer"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G4: les scripts de D4 (remplissage), D69 (rail) et D94 (lisible) sont jugés sur une page actuelle
  CHECK: node -e "const j=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/tournoi/outils/portee-defauts.json','utf8'));const k=['D4','D69','D94'].map(i=>j.defauts.find(d=>d.id===i));const bad=k.filter(d=>!d||!['oui','non'].includes(d.tourne)||!d.resultat);console.log(bad.length?'JUGES ECHEC':'JUGES OK');process.exit(bad.length?1:0)"
  EXPECT: JUGES OK
  EVIDENCE: pending
