// node build.mjs : assemble src/commun.html + src/cN.html -> cN/proto.html (split/join, sans remplacement de chaîne, L26)
import fs from 'node:fs';import path from 'node:path';import url from 'node:url';
const D=path.dirname(url.fileURLToPath(import.meta.url));
const commun=fs.readFileSync(path.join(D,'src/commun.html'),'utf8');
for(const id of ['c1','c2','c3','c4','c5','c6']){
  const src=fs.readFileSync(path.join(D,'src',id+'.html'),'utf8');const P={};
  for(const bloc of src.split('\n@@').map((b,i)=>i?b:b.replace(/^@@/,''))){const nl=bloc.indexOf('\n');P[bloc.slice(0,nl).trim()]=bloc.slice(nl+1);}
  let h=commun;for(const [m,k] of [['<!--TITRE-->','TITRE'],['/*CSS*/','CSS'],['<!--CORPS-->','CORPS'],['<!--APRES-->','APRES'],['<!--JS-->','JS']])h=h.split(m).join((P[k]||'').trim());
  fs.writeFileSync(path.join(D,id,'proto.html'),h);}
console.log('BUILD OK');
