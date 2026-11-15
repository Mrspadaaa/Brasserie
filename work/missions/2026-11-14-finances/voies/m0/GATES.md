# Gates: voie m0 — captures d'aujourd'hui

OWNS: work/missions/2026-11-14-finances/voies/m0

Scope: les 13 sous-vues capturées ouvertes à 390, ou leur absence dite.

- [ ] G1: chaque clé a sa capture ou une ligne qui dit pourquoi
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-finances/voies/m0';const r=fs.existsSync(d+'/RESULTAT.md')?fs.readFileSync(d+'/RESULTAT.md','utf8'):'';const m=['fi','do','ar','ap','fo','pa','mo','pr','pm','im','bb','pf','ia'].filter(k=>!fs.existsSync(d+'/cap/'+k+'.png')&&!new RegExp('^\\W*'+k+' ?:','m').test(r));console.log(m.length?'CAPTURES ECHEC '+m.join(' '):'CAPTURES OK')"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
