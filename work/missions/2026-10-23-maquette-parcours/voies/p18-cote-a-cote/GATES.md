# Gates: voie p18-cote-a-cote — l'outil de captures et la page côte à côte

OWNS: prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs, work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/**, work/missions/2026-10-23-maquette-parcours/voies/p18-cote-a-cote/RESULTAT.md

Scope: un outil qui capture sa base et la maquette aux mêmes états (douze), et la page qui les montre côte à côte, lisible au téléphone.

- [ ] G1: l'outil produit les douze états des deux côtés sur la construction de Comparer à jour
  CHECK: node -e "const r=require('child_process').spawnSync(process.execPath,['prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs','prototypes/houblons-v4/maquettes/parcours-p3','--sortie=work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/img'],{encoding:'utf8',timeout:900000});const e=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/img/etats.json','utf8'));const n=(e.etats||e).length;const fs=require('fs');const ok=n>=12&&(e.etats||e).every(x=>fs.existsSync('work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/img/'+x.nom+'-maquette.png'));console.log(ok?'COTE-A-COTE OK '+n:'COTE-A-COTE ECHEC '+n+' '+(r.stdout||'').slice(-300));process.exit(ok?0:1)"
  EXPECT: COTE-A-COTE OK
  EVIDENCE: pending

- [ ] G2: la page est lisible (PUBLIER.md)
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html --page-lot
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: la page nomme chaque état et les défauts qu'il touche
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html --contient "a-choisir,D107,D108,D110,D111,D115,D116,D117,D119,D120,D121,etape-glisser-base.png,comparer-maquette.png"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G4: le rapport nomme les captures ouvertes et ce qui ne se joue pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p18-cote-a-cote/RESULTAT.md --contient "etats.json,ouvert,390"
  EXPECT: NOTE OK
  EVIDENCE: pending
