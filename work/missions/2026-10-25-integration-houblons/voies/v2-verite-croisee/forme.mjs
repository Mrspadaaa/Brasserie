import fs from 'node:fs';
const show=(o,d=0,max=2)=>{ if(Array.isArray(o)) return `[${o.length}] `+(o.length?show(o[0],d+1,max):''); if(o&&typeof o==='object'){ if(d>=max) return '{'+Object.keys(o).slice(0,12).join(',')+'}'; return '{'+Object.entries(o).slice(0,14).map(([k,v])=>k+':'+show(v,d+1,max)).join(', ')+'}'; } return JSON.stringify(o)?.slice(0,40); };
for(const f of process.argv.slice(2)){ const j=JSON.parse(fs.readFileSync(f,'utf8')); console.log('==',f); console.log(show(j,0,3)); }
