# Gates: voie d131-pha — les pictos hors 16D, série pha

OWNS: work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/pha[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/captures/pha*, work/missions/2026-10-23-maquette-parcours/voies/d131-pha/RESULTAT.md

Scope: quatre jeux de quinze pictos et du picto « en plus », au trait, chacun montré en version courte et textuelle dans deux vraies cartes, avec légende et mot précis.

- [ ] G1: chaque jeu a sa page, ses quinze pictos et le picto « en plus », sa légende, son mot précis, sa NOTE et ses deux captures
  CHECK: node -e "const fs=require('fs');const p='work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/';const ids=['pha1','pha2','pha3','pha4'];const mal=ids.filter(i=>{const f=p+i+'/etat.html';if(!fs.existsSync(f))return true;const t=fs.readFileSync(f,'utf8');const n=new Set([...t.matchAll(/data-mot=\"([^\"]+)\"/g)].map(m=>m[1])).size;return n<16||!t.includes('data-mot=\"en-plus\"')||!t.includes('data-role=\"legende\"')||!t.includes('data-role=\"precis\"')||!/chaleur/i.test(fs.existsSync(p+i+'/NOTE.md')?fs.readFileSync(p+i+'/NOTE.md','utf8'):'')||!['planche','carte'].every(c=>fs.existsSync(p+'captures/'+i+'-'+c+'.png'))});console.log(mal.length?'JEUX ECHEC '+mal.join(','):['JEUX','BIEN',ids.length].join('-'));process.exit(mal.length?1:0)"
  EXPECT: JEUX-BIEN-4
  EVIDENCE: pending

- [ ] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d pha1 pha2 pha3 pha4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: pending
