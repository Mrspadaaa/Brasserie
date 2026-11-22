import fs from 'fs';
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/';
const css=fs.readFileSync(R+'as/src/as-gestes.css','utf8'),js=fs.readFileSync(R+'as/src/as-gestes.js','utf8');
for(const [src,dst] of [['se/z2s.html','as/cal.html'],['se/z2s-paysage.html','as/cal-paysage.html']]){
 let s=fs.readFileSync(R+src,'utf8');
 const t0=s.indexOf('<title>'),t1=s.indexOf('</title>');s=s.slice(0,t0+7)+'as · calendrier jouable : base z2s et ses gestes du 17.11'+s.slice(t1);
 const vue=src.includes('paysage')?'paysage':'portrait';s=s.split('<html lang="fr">').join('<html lang="fr" data-vue="'+vue+'">');
 const h=s.indexOf('</head>');s=s.slice(0,h)+'<style id="as-gestes">'+css+'</style>'+s.slice(h);
 const b=s.lastIndexOf('</body>');s=s.slice(0,b)+'<script id="as-gestes-js">'+js+'</script>'+s.slice(b);
 fs.writeFileSync(R+dst,s);fs.writeFileSync(R+'as/pub/'+vue+'.html',s);console.log(dst,s.length);
}