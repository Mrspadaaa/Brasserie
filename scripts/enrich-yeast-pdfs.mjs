import { readFile, writeFile } from 'node:fs/promises';
import { compact, sha } from './yeast-catalogue/fetch.mjs';
import { observation, catalogueHash, PARSER_VERSION } from './yeast-catalogue/parse.mjs';
const base = '.codex-remote-attachments/yeast-catalogue/pdf/';
const rows = JSON.parse(await readFile('src/data/yeastCatalogueBootstrap.json', 'utf8'));
const coverage = JSON.parse(await readFile('docs/research/yeast-catalogue/coverage.json', 'utf8'));
const norm = s => compact(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const read = async (id, kind) => JSON.parse(await readFile(base + id + '.' + kind + '.json', 'utf8'));
function attach(meta, name, code, pairs, page, year, existing) {
  const source = { title: `${meta.name} — catalogue des cultures`, author: meta.name, year, kind: 'manufacturer', reference: meta.url, locator: `Page ${page}` };
  const facts = pairs.map(([label,value])=>observation(label,value,source)).filter(Boolean);
  let row = existing;
  if (!row) {
    const id = `yeast-${meta.id}-${norm(code || name).slice(0,85)}`;
    row = rows.find(r=>r.id===id);
    if (!row) { row = { id, kind: 'yeast', name: `${meta.name} · ${name}`, betaLyase: 'unknown', source,
      catalogue: { manufacturer: meta.name, productId: `${meta.url}#${code || name}`, productCode: code || null, aliases: [name,...(code?[code]:[])], categories: [], status: 'listed', facts: [], documents: [], retrievals: [], publishedAt: null, pageUpdatedAt: null, parserVersion: PARSER_VERSION, contentSha256:'', gaps: ['Rendement de libération des thiols et intensités sensorielles non calibrés.'] } }; rows.push(row); }
  }
  const c = row.catalogue;
  c.facts = [...new Map([...c.facts,...facts].map(f=>[JSON.stringify(f),f])).values()];
  c.documents = [...new Map([...c.documents,{title:source.title,url:meta.url}].map(d=>[d.url,d])).values()];
  const receipt = { url: meta.url, retrievedAt: meta.retrievedAt, sha256: meta.sha256, etag: meta.etag, lastModified: meta.lastModified };
  c.retrievals = [...new Map([...c.retrievals,receipt].map(r=>[r.url,r])).values()];
  if(c.facts.some(f=>f.key==='temperature'))c.gaps=c.gaps.filter(s=>s!=='Fenêtre de fermentation non extraite.');
  if(c.facts.some(f=>f.key==='pof'))c.gaps=c.gaps.filter(s=>s!=='Statut POF non documenté dans les champs extraits.');
  c.contentSha256 = catalogueHash(c); return row;
}
const summaries=[];
{
  const meta=JSON.parse(await readFile(base+'omega.json')), columns=await read('omega','columns'), codes=new Set();
  for(const col of columns){
    const lines=col.text.split('\n'), headers=lines.flatMap((line,i)=>{const m=/^(?!Parent Strain)(.*?)\b(OYL[-‑–]\d{3}(?:DRY)?)\s*$/.exec(line);return m?[{i,name:compact(m[1].replace(/HZY1[+-]/g,''))||compact(lines[i-1]),code:m[2].replace(/[‑–]/g,'-')}]:[]});
    for(let i=0;i<headers.length;i++){
      const h=headers[i], block=lines.slice(h.i+1,headers[i+1]?.i??lines.length), pairs=[];
      for(const line of block){const m=/^(Flocculation|Attenuation|Temperature Range|Alcohol Tolerance|Diastatic|Phenolic)\s+(.+)$/.exec(line);if(m)pairs.push([m[1],m[2]]);}
      if(block[0]==='POF-')pairs.push(['POF','negative']);
      if(block.slice(0,3).some(s=>s==='Thiolized'))pairs.push(['Biotransformation','Thiolized — technologie fabricant ; rendement non quantifié']);
      if(!pairs.length)continue;
      const found=rows.find(r=>r.catalogue.manufacturer==='Omega Yeast'&&norm(r.catalogue.productCode??'')===norm(h.code));
      attach(meta,h.name,h.code,pairs,col.page,null,found);codes.add(h.code);
    }
  }
  summaries.push({id:'omega-pdf',manufacturer:meta.name,records:codes.size,source:meta.url,limitation:'Plages fabricant, sans étalonnage sensoriel. Année de publication non indiquée.'});
}
{
  const meta=JSON.parse(await readFile(base+'doemens.json')), tables=await read('doemens','tables'), codes=new Set();
  for(let page=3;page<=5;page++)for(const row of tables[page].flat()){
    const code=compact(row[0]).replace(/-\s+/g,''), kind=compact(row[1]);
    if(!code||!kind||code==='STRAIN'||kind==='YEAST TYP')continue;
    attach(meta,code,code,[['Type',kind],['Form','Cultures liquides et sur gélose disponibles']],page+1,2026);codes.add(code);
  }
  summaries.push({id:'doemens-pdf',manufacturer:meta.name,records:codes.size,source:meta.url,limitation:'Inventaire des pages 4–6 ; les descriptions détaillées suivantes restent à transcrire.'});
}
{
  const meta=JSON.parse(await readFile(base+'maurivin.json')), tables=await read('maurivin','tables'), codes=new Set();
  for(const row of tables[2].filter(t=>t[0]?.length===11).flat()){
    const name=compact(row[0]);if(!name||name==='Strains')continue;
    attach(meta,name,name,[['Application','Vin'],['Styles',compact(row[1])+' (W : blanc ; R : rouge ; S : effervescent ; Rosè : rosé)']],3,2025);codes.add(name);
  }
  summaries.push({id:'maurivin-pdf',manufacturer:meta.name,records:codes.size,source:meta.url,limitation:'Barres graphiques qualitatives non converties en coefficients. Fiches détaillées à consolider.'});
}
{
  const meta=JSON.parse(await readFile(base+'vlb.json')), pages=await read('vlb','text');let active=false,category='',count=0;
  for(const line of pages[0].split('\n')){
    if(/^(Bottom fermenting|Top fermenting|Yeast for low alcohol|Special yeast)/.test(line)){active=true;category=line;continue;}
    if(!active)continue;
    const m=/^(Rh|He-Bru|Nr\. \d+|SMA-S|1901|St\.F\.|H 06|160 obg\.|O\.K\.3|68 obg\.|W\.T\.O\.9|AA 13|CA|Saccharomyces dairensis|Saccharomyces rosei|Saccharomycodes ludwigii|Brettanomyces bruxellensis|ET 1\/6)\s+(.+)$/.exec(line);
    if(!m)continue;
    attach(meta,m[1],m[1],[['Application',category],['Flavour Profile',m[2]]],1,2023);count++;
  }
  summaries.push({id:'vlb-pdf',manufacturer:meta.name,records:count,source:meta.url,limitation:'Liste publique partielle, explicitement non exhaustive de la banque VLB.'});
}
{
  const meta=JSON.parse(await readFile(base+'whc.json')), pages=await read('whc','text'), products=rows.filter(r=>r.catalogue.manufacturer==='WHC Lab'&&r.form==='sèche');let matched=0;
  for(const row of products){
    const short=row.catalogue.aliases[0].split(':')[0].replace(/ German Lager$/,'');
    const needle=norm(short);if(needle.length<3)continue;
    for(let page=2;page<pages.length;page++){
      const lines=pages[page].split('\n'), start=lines.findIndex(s=>norm(s.replace(/ Strain Fermentation Temperature$/,''))===needle);if(start<0)continue;
      let end=start+1;while(end<lines.length&&!/^[A-Z][A-Z &™®-]{3,}$/.test(lines[end]))end++;
      const block=lines.slice(start,end).join('\n'), pairs=[];
      const t=block.match(/\d+°C to \d+°C/);if(t)pairs.push(['Temperature',t[0]]);
      const a=block.match(/(\d+%)\s+(\d+% to \d+%|\d+\+%)/);if(a){pairs.push(['Alcohol Tolerance',a[1]]);pairs.push(['Attenuation',a[2]]);}
      const species=block.match(/(?:Saccharomyces|Lachancea)\s+[a-z]+/);if(species)pairs.push(['Species',species[0]]);
      if(pairs.length){attach(meta,short,row.catalogue.productCode,pairs,page+1,2026,row);matched++;}break;
    }
  }
  summaries.push({id:'whc-pdf',manufacturer:meta.name,records:matched,source:meta.url,limitation:'Données des produits secs uniquement ; aucun transfert automatique aux présentations liquides.'});
}
// TYB extraction is kept as an inventory even when complex table geometry prevents safe number assignment.
{
  const meta=JSON.parse(await readFile(base+'yeast-bay.json')), pages=await read('yeast-bay','text'), codes=new Set();
  for(let page=0;page<pages.length;page++)for(const code of pages[page].match(/WLP\d{4}/g)??[]){
    if(codes.has(code))continue;codes.add(code);
    const existing=rows.find(r=>r.id==='white-labs-'+code.toLowerCase());
    attach(meta,existing?.name??code,code,[],page+1,2025,existing);
  }
  summaries.push({id:'yeast-bay-pdf',manufacturer:meta.name,records:codes.size,source:meta.url,limitation:'Identifiants WLP reliés aux fiches White Labs quand présents ; géométrie de certaines tables ambiguë, valeurs non inférées.'});
}
coverage.pdfSupplements=summaries;coverage.records=rows.length;
await writeFile('src/data/yeastCatalogueBootstrap.json',JSON.stringify(rows.sort((a,b)=>a.id.localeCompare(b.id)),null,2)+'\n');
await writeFile('docs/research/yeast-catalogue/coverage.json',JSON.stringify(coverage,null,2)+'\n');
console.log(JSON.stringify({records:rows.length,pdf:summaries},null,2));
