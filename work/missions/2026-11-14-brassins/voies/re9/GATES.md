# Gates: voie re9 — e9 à l'identité

OWNS: work/missions/2026-11-14-brassins/voies/re9/

Scope: e9a, e9b, e9c, e9d conformes au contrôle d'identité, images refaites.

- [ ] G1: chaque variante passe le contrôle d'identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/e9
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G2: chaque variante charge la trousse et ses images sont plus récentes que son etat.html et que la trousse
  CHECK: node -e "const fs=require('fs'),V='work/missions/2026-11-14-brassins/voies/e9';const k=fs.statSync('work/missions/2026-11-14-brassins/outils/identite/identite.css').mtimeMs;const bad=['e9a','e9b','e9c','e9d'].flatMap(x=>{const h=V+'/'+x+'/etat.html';const t=fs.readFileSync(h,'utf8');const m=Math.max(fs.statSync(h).mtimeMs,k);const o=fs.readdirSync(V+'/'+x).filter(f=>f.endsWith('.png')).filter(f=>fs.statSync(V+'/'+x+'/'+f).mtimeMs<m).map(f=>x+'/'+f);return t.includes('identite.css')?o:[x+':sans trousse',...o]});console.log(bad.length?'RHABILLE KO '+bad.join(' '):'RHABILLE OK')"
  EXPECT: RHABILLE OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR')&&!l.includes('DEFAUTS-RECURRENTS'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
