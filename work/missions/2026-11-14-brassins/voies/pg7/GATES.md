# Gates: voie pg7 — Page deux questions

OWNS: work/missions/2026-11-14-brassins/page7/, work/missions/2026-11-14-brassins/voies/pg7/

Scope: une question par écran, lisible, toutes les variantes montrées, rien de tranché remontré.

- [ ] G1: la page passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page7/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg7/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: une question par écran, claire (BR-PAGE)
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-page-claire.mjs work/missions/2026-11-14-brassins/page7/index.html
  EXPECT: PAGE CLAIRE OK 2
  EVIDENCE: pending

- [ ] G3: chaque variante présente avec son repos copié, rien de tranché ni de retiré
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins';const t=fs.readFileSync(M+'/page7/index.html','utf8');const v='c2a c1d c1c c2c r1a r2a r1c r1d'.split(' ');const miss=v.filter(i=>!t.includes('data-variante=\"'+i+'\"')||!fs.existsSync(M+'/page7/img/'+i+'-repos-390-clair.png'));const bad=['Fable','c1a-','c1b-','c2b-','c2d-','r1b-','r2b-','r2c-','r2d-'].filter(x=>t.includes(x));const ids=['creer','recettes'].filter(i=>!t.includes('id=\"'+i+'\"'));console.log(!miss.length&&!bad.length&&!ids.length?'CONTENU OK':'CONTENU KO '+miss.concat(bad,ids).join(' '))"
  EXPECT: CONTENU OK
  EVIDENCE: pending
