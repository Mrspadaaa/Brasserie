// Relance 1 de s3 (critique VERDICT-v6, s3) : rien d'ellipsé (« déjà » sur la ligne du nom, le détail entier) ; le menu s'ouvre
// dessous tant qu'il y reste une rangée, au-dessus seulement sinon ; plus de pavé vide sous le champ ouvert. Split/join (L26).
// Usage : node relance1.cjs (réécrit patch.mjs), puis node patch.mjs.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'patch.mjs');
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('ancre ' + n + ' : ' + a.slice(0, 60)); s = s.split(a).join(b); };
rep(`<span class="p7s3-l1">'+marque(o.nom,t)+'</span><span class="p7s3-l2">'+l2+'</span></span>'+
    (f?'<span class="p7s3-deja">déjà '+kgTxt(f.kg)+' kg</span>':'')+(act?ENT7:'')+'</button>';}`,
`<span class="p7s3-l1"><span>'+marque(o.nom,t)+'</span>'+(f?'<span class="p7s3-deja">déjà '+kgTxt(f.kg)+' kg</span>':'')+'</span><span class="p7s3-l2">'+l2+'</span></span>'+
    (act?ENT7:'')+'</button>';}`);
rep(`// La place du menu : dessous s'il y tient au-dessus du clavier (300 px du bas au doigt ; le vrai clavier, s'il réduit la vue), sinon du
// côté le plus grand ; sa hauteur tient dans ce qui se voit, sous l'en-tête collant.`,
`// La place du menu : dessous, au-dessus du clavier (300 px du bas au doigt ; le vrai clavier, s'il réduit la vue), sa hauteur plafonnée
// à cet espace et le reste qui défile dedans ; les lignes du ticket restent visibles (D212). Au-dessus seulement s'il ne reste pas une
// rangée dessous (critique v6).`);
rep(`m.style.maxHeight='none';var h=m.scrollHeight,dessous=bas-c.bottom-8,dessus=c.top-hd-8,haut=h>dessous&&dessus>dessous;
  m.classList.toggle('p7s3-haut',haut);m.style.maxHeight=Math.max(96,haut?dessus:dessous)+'px';`,
`var dessous=bas-c.bottom-8,dessus=c.top-hd-8,haut=dessous<54&&dessus>dessous;
  m.classList.toggle('p7s3-haut',haut);m.style.maxHeight=Math.max(54,haut?dessus:dessous)+'px';`);
rep(`  if(on){placer7(m);var a=m.querySelector('.p7s3-act');if(a)a.scrollIntoView({block:'nearest'});}
  puces();}`,
`  puces();if(on){placer7(m);var a=m.querySelector('.p7s3-act');if(a)a.scrollIntoView({block:'nearest'});}}`);
rep(`  // Ouvert, les sacs habituels laissent leur place vide (le menu passe dessus ; rien ne bouge dessous).`,
`  // Ouvert, les sacs habituels se replient (pas de pavé vide sous le champ) ; le menu passe sur ce qui suit.`);
rep(`pu.classList.toggle('p7s3-garde',on&&hab.length>0);`, ``);
rep(`.r4b-puces.p7s3-garde{display:block;height:32px}\n`, ``);
rep(`.p7s3-l1{font-size:16px;color:var(--t0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:20px}`,
`.p7s3-l1{display:flex;align-items:center;flex-wrap:wrap;gap:2px 8px;font-size:16px;color:var(--t0);line-height:20px}`);
rep(`.p7s3-l2{font-size:14px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:18px}`,
`.p7s3-l2{font-size:14px;color:var(--t2);line-height:18px}`);
rep(`.p7s3-deja{flex-shrink:0;height:24px;`, `.p7s3-deja{flex-shrink:0;height:20px;`);
fs.writeFileSync(f, s);
console.log('patch.mjs : relance 1 posée');
