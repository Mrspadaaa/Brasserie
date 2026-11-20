import fs from 'fs';
const ordre=['r','r2','e1','v1','v2','f1','f2','f3','f4b','f4c','v3','f6a','f6b','f8','v4','v5a','v5b','v6','v7','f9','f10','f11','f12'];
const tri=JSON.parse(fs.readFileSync('TRI-TOUT.json','utf8'));
const fin={};for(const x of tri)fin[x.id]={id:x.id,ligne:x.ligne,hist:[['tri',x.verdict,(x.preuve||'')+' '+(x.raison||'')]]};
const re=/^\s*[-|]?\s*\|?\s*((?:[A-Z][A-Z0-9]*-)+(?:NOTE-)?\d+)\s*\|\s*([^|]+)\|([^|]*)\|?/;
for(const v of ordre){const f=`voies/${v}/RESULTAT.md`;if(!fs.existsSync(f))continue;
 for(const l of fs.readFileSync(f,'utf8').split('\n')){const m=l.match(re);if(!m)continue;const id=m[1];
  (fin[id]??={id,hist:[],neuf:true}).hist.push([v,m[2].trim(),m[3].trim()]);}}
const cat=h=>{const t=h[1].toLowerCase();
 if(/gemini/.test(t))return'gemini';if(/^corrig|^corrige|^ok/.test(t))return'corrige';if(/^pr[ée]sent|regression|partiel/.test(t))return'present';
 if(/^[ée]cart|^obsol|^doublon|caduc/.test(t))return'ecarte';if(/ouvert|choix/.test(t))return'ouvert';if(/en-ligne|non-jou|non jou|non.tranch|non conclu/.test(t))return'a-voir';if(/^ia$/.test(t))return'gemini';return'?';};
const out=Object.values(fin).map(x=>{const h=x.hist[x.hist.length-1];return{...x,der:h[0],cat:cat(h),verdict:h[1]}});
const c={};out.forEach(x=>{const k=(x.neuf?'neuf-':'')+x.cat;c[k]=(c[k]||0)+1});console.log(c);
fs.writeFileSync('FINAL.json',JSON.stringify(out,null,1));
for(const k of ['?','a-voir','present'])out.filter(x=>x.cat==k).forEach(x=>console.log(k,x.id,x.der,x.verdict.slice(0,60)));
