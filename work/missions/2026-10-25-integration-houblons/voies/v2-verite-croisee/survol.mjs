import fs from 'node:fs';
const d='src/data/hopSources/';
const fichiers=fs.readdirSync(d).filter(f=>!f.startsWith('beeranalytics-'));
for(const f of fichiers){
  const j=JSON.parse(fs.readFileSync(d+f,'utf8'));
  const fiches=j.fiches||[];
  const champs=new Set(); const listes=new Set(); let avecId=0; const cles=new Set();
  for(const x of fiches){ Object.keys(x).forEach(k=>cles.add(k)); Object.keys(x.champs||{}).forEach(c=>champs.add(c)); Object.keys(x.listes||{}).forEach(c=>listes.add(c)); if(x.varietyId) avecId++; }
  console.log(f, 'fiches',fiches.length,'avecId',avecId);
  console.log('  champs:',[...champs].join(','));
  console.log('  listes:',[...listes].join(','));
  console.log('  cles:',[...cles].join(','));
}
