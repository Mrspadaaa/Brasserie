import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const markdown=readFileSync('docs/research/fermentation/report-source.md','utf8');
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inline=s=>escape(s).replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>');
const blocks=markdown.trim().split(/\r?\n\r?\n/).map(block=>{
 if(block.startsWith('# ')){const [title,...rest]=block.split(/\r?\n/);return '<header><p class="brand">L’Affinée · notes de recherche</p><h1>'+inline(title.slice(2))+'</h1><p class="date">'+inline(rest.join(' '))+'</p></header>';}
 if(block.startsWith('## '))return '<h2>'+inline(block.slice(3))+'</h2>';
 return '<p>'+inline(block.replace(/\r?\n/g,' '))+'</p>';
}).join('\n');
const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Recherche sur la fermentation brassicole : arômes de levure, paliers, phénols, thiols, maturation et modèles documentés."><title>Fermentation et arômes — L’Affinée</title><style>'+
':root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#12100e;color:#d8cec5;font:17px/1.65 system-ui,sans-serif}main{max-width:820px;margin:auto;padding:38px 24px 80px}header{padding:20px 0 30px;border-bottom:2px solid #f2c14e;margin-bottom:32px}.brand{font-weight:650;color:#f2c14e;margin:0}h1{font-size:clamp(32px,5vw,50px);line-height:1.13;letter-spacing:-.035em;color:#f5f0ea;margin:20px 0}h2{color:#f5f0ea;font-size:25px;line-height:1.25;margin:45px 0 16px}p{margin:15px 0}.date{font-size:14px;color:#b7a89b}a{color:#8ab9d4;text-underline-offset:3px;overflow-wrap:anywhere}a:focus-visible{outline:2px solid #f2c14e;outline-offset:4px}footer{border-top:1px solid #574a42;margin-top:40px;padding-top:20px;color:#b7a89b;font-size:14px}@media print{:root{color-scheme:light}body{background:white;color:#24211e;font-size:11pt}main{max-width:none;padding:0}h1,h2{color:#24211e}a{color:#235570}header{break-after:avoid}h2{break-after:avoid}p{orphans:3;widows:3}.brand,.date,footer{color:#514537}}'+
'</style></head><body><main>'+blocks+'<footer>Les références et les limites font partie du résultat. Les paramètres applicatifs se révisent dans l’Index de L’Affinée.</footer></main></body></html>\n';
mkdirSync('public/research',{recursive:true});writeFileSync('public/research/fermentation-2026.html',html);
console.log('Rapport de recherche généré : '+Buffer.byteLength(html)+' octets.');
