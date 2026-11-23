/** Explicit maintenance import; never called by the client or npm test. Public factual
 * names/statistics only. No prose descriptions or images are republished. */
import { writeFile } from 'node:fs/promises';
const retrievedAt = '2026-09-09';
const decode = s => s.replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n))
  .replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&rsquo;/g,'’').replace(/&ndash;/g,'–').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const range = s => { const m=s?.match(/([0-9]+(?:\.[0-9]+)?)\s*%?\s*[-–]\s*([0-9]+(?:\.[0-9]+)?)/);return m && +m[1]<=+m[2] ? {min:+m[1],max:+m[2]} : null; };
const get = async url => {const r=await fetch(url);if(!r.ok)throw Error(url+': '+r.status);return r.text();};
const bjcpSource = reference => ({title:'2021 Beer Style Guidelines',author:'BJCP',year:2021,kind:'review',reference});
const judgment={title:'Correspondances de formulation L’Affinée',author:'L’Affinée',year:2026,kind:'judgment',reference:'L’Affinée — styles 2026-09-09',locator:'Suggestions de départ, pas coefficients sensoriels ni obligation de concours.'};
const aliasByCode = {
  '10A':['Hefeweisse','Hefeweizen','Hefeweissbier','Hefeweißbier','Weizenbier','Weissbiere'],
  '10B':['Dunkelweizen','Dunkelweissbier'], '10C':['Weizenbock'], '24A':['Witbier','Blanche belge'],
  '25B':['Saison'], '26C':['Tripel'], '21C':['NEIPA','Hazy IPA','Juicy IPA'], '21A':['West Coast IPA'], '05D':['Pils','Pilsner','German Pilsner'],
  '03B':['Pilsner','Czech Pilsner'], '04A':['Helles'], '20C':['Russian Imperial Stout'], '16A':['Milk Stout'], '15B':['Irish Dry Stout'], '11C':['ESB'],
  '27A-historical-beer-piwo-grodziskie':['Grodziskie','Grätzer'], '27A-historical-beer-sahti':['Sahti'],
};
const suggestions = (code,name,family) => {
  code=code.replace(/^(\d)([A-Z])$/, '0$1$2');
  let mash='infusion', fermentation='ale', hop='free', water;
  if (['01A','01B','02A','02B','02C','03A','03B','03C','03D','04A','04B','04C','05A','05C','05D','06A','06B','06C','07A','08A','08B','09A','09B','09C'].includes(code) || /Lager Styles/.test(family)) {mash='lager';fermentation='lager';hop='lager';}
  if (['10A','10B','10C'].includes(code)) {mash='froment';fermentation='ale';water='10A';}
  if (code==='24A') {mash='froment';fermentation='ale';water='24A';}
  if (code==='25B') {mash='sec';fermentation='saison';hop='saison';water='25B';}
  if (code==='21C') {mash='corps';fermentation='neipa';hop='hazy';water='21C';}
  if (code==='21A') {hop='westcoast';water='21A';}
  if (code==='18B') {hop='pale';water='18B';}
  if (['26B','26C','26D'].includes(code)) {mash='sec';fermentation='belge';}
  if (['20A','20B','20C','16A','16B','16C','16D','15B'].includes(code)) {mash='corps';hop='stout';}
  if (code==='20C') {mash='imperiale';fermentation='imperiale';}
  if (['01A','05B','05D','04A','06C','08B','10A','11C','13C','15B','16A','20C','18B','21A','21B','21C','23A','23G','24A','24C','25B','26C','26D'].includes(code)) water=code;
  // Wild/mixed/historical methods need an explicit plan; no default lager/ale fermentation.
  if (/^(23|27|28|29|30|31|32|33|34)/.test(code)) return {source:judgment,...(water?{water}:{})};
  return {mash,fermentation,hop,...(water?{water}:{}),source:judgment};
};
const styles=[];
for(let first=1;first<=34;first+=3) {
  const pages=await Promise.all(Array.from({length:Math.min(3,35-first)},(_,i)=>first+i).map(async n=>({n,html:await get('https://www.bjcp.org/style/2021/'+n+'/')})));
  for(const {n,html} of pages) {
    const chunks=[...html.matchAll(/<h1 class="entry-title">([\s\S]*?)<\/h1>([\s\S]*?)(?=<h1 class="entry-title">|<aside|$)/g)];
    for(const m of chunks) {
      const head=decode(m[1]),code=head.match(/^(\d+[A-Z])\./)?.[1];if(!code)continue;
      const reference=m[1].match(/href="([^"]+)"/)?.[1]; if(!reference)throw Error('Missing BJCP URL');
      const name=head.replace(/^\d+[A-Z]\.\s*/,'');
      const id=slug(reference.split('/').filter(Boolean).at(-1));
      const stats={};
      for(const k of ['OG','FG','ABV','IBU','SRM']) {const raw=m[2].match(new RegExp('<h3>'+k+'</h3>[\\s\\S]*?<p>([\\s\\S]*?)</p>'))?.[1];const r=range(decode(raw??''));if(r)stats[k.toLowerCase()]=r;}
      styles.push({id,code,name,aliases:aliasByCode[code+'-'+id]??aliasByCode[code.replace(/^(\d)([A-Z])$/, '0$1$2')]??[],family:'BJCP '+n,stats,source:bjcpSource(reference),suggestions:suggestions(code,name,'BJCP '+n)});
    }
  }
}
if(styles.length<110 || !styles.some(s=>s.name==='Weizenbock'))throw Error('Incomplete BJCP collection: '+styles.length);
const provisionalPage=await get('https://www.bjcp.org/provisional-styles/');
const provisional=[];
for(const m of provisionalPage.matchAll(/<h3 class="entry-title"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>/g)){
  const html=await get(m[1]);const stats={};
  for(const k of ['OG','FG','ABV','IBU','SRM']) {const r=range(decode(html.match(new RegExp('<h3>'+k+'</h3>[\\s\\S]*?<p>([\\s\\S]*?)</p>'))?.[1]??''));if(r)stats[k.toLowerCase()]=r;}
  provisional.push({id:slug(decode(m[2])),code:'provisional',name:decode(m[2]).replace(/^\d+[A-Z]\.\s*/,''),aliases:['Burton Ale'],family:'BJCP provisoire',stats,
    source:{title:'Provisional Styles',author:'BJCP',year:null,kind:'review',reference:m[1],locator:'Consulté le '+retrievedAt}});
}
const baUrl='https://www.brewersassociation.org/edu/brewers-association-beer-style-guidelines/';
const baHtml=await get(baUrl);
if(!baHtml.includes('2026'))throw Error('BA edition not confirmed');
const baSource={title:'2026 Beer Style Guidelines',author:'Brewers Association',year:2026,kind:'review',reference:baUrl};
const ba=[];
const families=[...baHtml.matchAll(/<h1 class='center-content'>([^<]+)<\/h1>/g)].map(m=>({index:m.index,name:decode(m[1])}));
const baCorrespondences={
  'South German-Style Hefeweizen':'10A','South German-Style Kristal Weizen':'10A',
  'German-Style Leichtes Weizen':'10A','South German-Style Bernsteinfarbenes Weizen':'10A',
  'South German-Style Dunkel Weizen':'10B','South German-Style Weizenbock':'10C','Bamberg-Style Weiss Rauchbier':'10A',
  'Belgian-Style Witbier':'24A','Classic French & Belgian-Style Saison':'25B','Specialty Saison':'25B',
  'Belgian-Style Tripel':'26C','Belgian-Style Quadrupel':'26D','Belgian-Style Dubbel':'26B',
  'American-Style Imperial Stout':'20C','British-Style Imperial Stout':'20C',
  'Juicy or Hazy India Pale Ale':'21C','West Coast-Style India Pale Ale':'21A','American-Style India Pale Ale':'21A'
};
for(const m of baHtml.matchAll(/<div class="beer-style">([\s\S]*?)<\/ul><\/div>/g)){
  const body=m[1],code=body.match(/class="list-with-heading" id="(\d+)"/)?.[1],name=decode(body.match(/<li>([\s\S]*?)<\/li>/)?.[1]??'');
  if(!code||!name)throw Error('BA style parse error');
  const stats={};
  for(const [k,term] of [['og','Original Gravity'],['fg','Apparent Extract/Final Gravity'],['ibu','Bitterness'],['srm','Color SRM'],['abv','Alcohol by Weight']]){
    let raw=decode(body.match(new RegExp('<strong>'+term+'[^<]*</strong>([\\s\\S]*?)</li>'))?.[1]??'');
    if(k==='abv')raw=raw.match(/\(([^)]+)\)/)?.[1]??''; // Volume, NOT alcohol by weight.
    const r=range(raw);if(r)stats[k]=r;
  }
  const family=families.filter(f=>f.index<m.index).at(-1)?.name;
  if(!family)throw Error('BA family missing: '+name);
  // Crosswalk is an editable formulation judgment, never a claim of equivalence.
  const mapped=baCorrespondences[name];
  const guide=mapped?suggestions(mapped,name,family):family==='Lager Styles'?suggestions('',name,family):{source:judgment};
  ba.push({id:'ba-'+code,code,name,aliases:[],family,stats,source:{...baSource,reference:baUrl+'#'+code},suggestions:guide});
}
if(ba.length<120)throw Error('Incomplete BA collection: '+ba.length);
const guides=[
 {id:'styles-bjcp-2021',kind:'styleGuide',name:'Styles bière BJCP 2021',version:'2026-09-09.1',enabled:true,edition:'BJCP 2021',retrievedAt,attribution:'Données factuelles d’après BJCP 2021 ; suggestions propres à L’Affinée.',source:bjcpSource('https://www.bjcp.org/style/guidelines-2021/'),styles},
 {id:'styles-bjcp-provisional',kind:'styleGuide',name:'Compléments provisoires BJCP',version:'2026-09-09.1',enabled:true,edition:'BJCP provisoire — consulté 2026',retrievedAt,attribution:'Données factuelles BJCP, édition provisoire ; année de chaque fiche non attestée conservée inconnue.',source:{...bjcpSource('https://www.bjcp.org/provisional-styles/'),year:2026,locator:'Inventaire relevé en 2026, pas date de publication des fiches.'},styles:provisional},
 {id:'styles-ba-2026',kind:'styleGuide',name:'Styles bière Brewers Association 2026',version:'2026-09-09.1',enabled:true,edition:'BA 2026',retrievedAt,attribution:'Based on Brewers Association 2026 Beer Style Guidelines with changes. Used with permission of Brewers Association.',source:baSource,styles:ba}
];
await writeFile('src/data/brewingStylesBootstrap.json',JSON.stringify(guides,null,2)+'\n');
console.log(JSON.stringify(guides.map(g=>({id:g.id,count:g.styles.length}))));
