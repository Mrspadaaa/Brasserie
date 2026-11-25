import fs from 'node:fs';
let s = fs.readFileSync('build.mjs', 'utf8');
const r = (a, b) => { const k = s.split(a).length - 1; if (k < 1) throw new Error('absent ' + a.slice(0, 60)); s = s.split(a).join(b); };
r("${tete('24 nov. · 1 j', 'noté, 24 nov.', '150 CHF ? lu par l’app', 'attend l’IA', FOND.note, 'Noté')}", "${tete('noté, 24 nov.', '150 CHF ? · lu par l’app', 'attend l’IA', FOND.note, 'Noté')}");
r('m4-tag app', 'm4-tag p4-app');
r(`<div class="p3-h">À acheter <span class="s">si je fais moi-même</span></div>
<div class="p3-l">\${IC_JOINT}<span class="e">Joint de siphon</span><span class="s">prix ?</span></div>`, `<div class="p3-l">\${IC_JOINT}<span class="e"><b>À acheter</b> <span class="s">si je fais moi-même :</span> joint de siphon</span><span class="s">prix ?</span></div>`);
r(`<div class="p3-h">Contacts <span class="s">1</span></div>
<div class="p3-l">`, `<div class="p3-l p4-l1">`);
r(`<span class="e"><b>Entreprise X</b> <span class="s">· sanitaire · exemple</span></span>`, `<span class="e"><b>Contact</b> · Entreprise X <span class="s">· exemple</span></span>`);
r("af = rep(af, 'Manchon", "af = rep(af, 'Plans demandés à la gérance', 'Devis demandé à l’entreprise X');\naf = rep(af, 'Manchon");
fs.writeFileSync('build.mjs', s);
let c = fs.readFileSync('p4.css', 'utf8');
c = c.replace('.p4-lift{position:absolute;left:12px;right:10px;top:440px;', '.p4-lift{position:absolute;left:12px;right:10px;top:416px;');
c += `
/* collisions de classes entre le vocabulaire v0x et M4 */
.m,.n{letter-spacing:0}
.m4-carte.ok{color:#111111;font-weight:400}
.m4-tag.p4-app{background:var(--attbg);color:var(--att)}
.p3-l.p4-l1{border-top:1px solid #EBEBEB;margin-top:4px}
`;
fs.writeFileSync('p4.css', c);
console.log('ok');
