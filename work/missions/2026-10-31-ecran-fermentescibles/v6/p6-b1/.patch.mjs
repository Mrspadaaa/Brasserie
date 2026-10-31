// Assemble p6-b1 depuis v5/m1/b.html, sans remplacement de chaîne à motif (split/join, L26).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
let s = fs.readFileSync(path.join(ICI, '../../v5/m1/b.html'), 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${n} × « ${a.slice(0, 60)} »`); s = s.split(a).join(b); };
rep('<title>r4e-b — Malts/sucres 2/7 · tout se change sur la ligne : barre tirée, moment qui tourne (31.10)</title>',
  '<title>p6-b1 — Malts/sucres 2/7 · − et + sur la masse de chaque ligne (D219, 31.10)</title>');
rep('<body data-concept="r4e-b">', '<body data-concept="p6-b1">');
rep('</style>', fs.readFileSync(path.join(ICI, 'p6b1.css'), 'utf8') + '</style>');
rep(`'<label class="r4b-kg r4d-kgl" data-tk="'+i+'">`, `'<span class="p6b1-st">'+pmHtml(f,i,-1)+'<label class="r4b-kg r4d-kgl" data-tk="'+i+'">`);
rep(`<small>kg</small></label>'+`, `<small>kg</small></label>'+pmHtml(f,i,1)+'</span>'+`);
// Les boutons, leur pas réel, leur geste.
rep('var IX=', fs.readFileSync(path.join(ICI, 'p6b1-fonctions.js'), 'utf8') + 'var IX=');
rep(`st.r.forEach(function(f,i){masseLigne(i);majPart(i);`, `st.r.forEach(function(f,i){masseLigne(i);majPm(i);majPart(i);`);
rep(`  else if(b.dataset.role==='couleur-ligne'){ouvrirEbc(+b.dataset.cl);}`,
  `  else if(b.dataset.pm!=null){if(Date.now()-st.avaler<500){st.avaler=0;return;}pousser(+b.dataset.pm,+b.dataset.dir);}\n  else if(b.dataset.role==='couleur-ligne'){ouvrirEbc(+b.dataset.cl);}`);
rep('var rg=q(\'[data-role="regle"]\');', fs.readFileSync(path.join(ICI, 'p6b1-tenir.js'), 'utf8') + 'var rg=q(\'[data-role="regle"]\');');
fs.writeFileSync(path.join(ICI, 'etat.html'), s);
console.log('p6-b1 assemblé');
