# Gates: voie ph-donnees — les mots hors familles les plus fréquents

OWNS: work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/donnees/**, work/missions/2026-10-23-maquette-parcours/voies/ph-donnees/RESULTAT.md

Scope: les 24 mots hors des 12 familles les plus fréquents du catalogue, comptés depuis les fiches.

- [ ] G1: le relevé existe, trié, avec des exemples
  CHECK: node -e "const j=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/donnees/mots-hors16d.json','utf8'));const m=j.mots||[];const tri=m.every((x,i)=>i===0||m[i-1].houblons>=x.houblons);const ex=m.every(x=>x.mot&&x.houblons>0&&Array.isArray(x.exemples)&&x.exemples.length);console.log(m.length>=16&&tri&&ex?['MOTS','RELEVES',m.length].join('-'):'RELEVE ECHEC '+m.length+' tri '+tri+' exemples '+ex);process.exit(m.length>=16&&tri&&ex?0:1)"
  EXPECT: MOTS-RELEVES
  EVIDENCE: pending
