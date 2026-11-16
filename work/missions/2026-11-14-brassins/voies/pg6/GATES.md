# Gates: voie pg6 — Page six questions

OWNS: work/missions/2026-11-14-brassins/page6/, work/missions/2026-11-14-brassins/voies/pg6/

Scope: une question par écran, lisible, toutes les variantes montrées, rien de tranché remontré.

- [ ] G1: la page passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page6/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg6/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: une question par écran, claire (BR-PAGE)
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-page-claire.mjs work/missions/2026-11-14-brassins/page6/index.html
  EXPECT: PAGE CLAIRE OK 6
  EVIDENCE: pending

- [ ] G3: chaque variante présente avec son repos copié, rien de tranché ni de retiré
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins';const t=fs.readFileSync(M+'/page6/index.html','utf8');const v='gfa gfc gfd g6a g6b e5ga e5gb e3ga e3gb e3gc e3gd e8na e8nb e8nc e8nd e9na e9nb e9nc e9nd'.split(' ');const miss=v.filter(i=>!t.includes('data-variante=\"'+i+'\"')||!fs.existsSync(M+'/page6/img/'+i+'-repos-390-clair.png'));const bad=['gfb-','g6c-','e5nc-','e5nd-','Fable'].filter(x=>t.includes(x));const ids=['fermentation','filtres','creer','carnet','recettes','atelier'].filter(i=>!t.includes('id=\"'+i+'\"'));console.log(!miss.length&&!bad.length&&!ids.length?'CONTENU OK':'CONTENU KO '+miss.concat(bad,ids).join(' '))"
  EXPECT: CONTENU OK
  EVIDENCE: pending
