// Assemble p6-b2 depuis v5/m1/b.html, par split/join (L26) ; chaque morceau remplacé doit exister une fois.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const lit = (n) => fs.readFileSync(path.join(ICI, n), 'utf8');
let s = fs.readFileSync(path.join(ICI, '../../v5/m1/b.html'), 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${n} × « ${a.slice(0, 70)} »`); s = s.split(a).join(b); };
rep('<title>r4e-b — Malts/sucres 2/7 · tout se change sur la ligne : barre tirée, moment qui tourne (31.10)</title>',
  '<title>p6-b2 — Malts/sucres 2/7 · la barre de chaque ligne porte la masse (D219, 31.10)</title>');
rep('<body data-concept="r4e-b">', '<body data-concept="p6-b2">');
rep('</style>', lit('p6b2.css') + '</style>');
// La barre : la zone tirée garde data-role="part-ligne" (lu tel quel par controle-volee) ; le curseur de masse la remplit.
const debut = s.indexOf('function barreHtml(f,i){'), fin = s.indexOf('function annHtml(i)');
if (debut < 0 || fin < debut) throw new Error('barreHtml introuvable');
s = s.slice(0, debut) + lit('p6b2-barre.js') + s.slice(fin);
rep(`      (f.fam==='grain'?barreHtml(f,i):'')+'</span>'+`, `      barreHtml(f,i)+'</span>'+`);
// majPart ne pose plus la part en aria sur la zone (le slider dit la masse) ; maj() pose barre, pouce et aria de chaque ligne.
rep(`  var k=q('[data-pl="'+i+'"]');if(k){k.setAttribute('aria-valuenow',partN(f));k.setAttribute('aria-valuetext',partN(f)+' % du grain');}\n`, '');
rep(`  var po=q('[data-po="'+i+'"]');if(po)po.style.left=(grainKg()?f.kg/grainKg()*100:0)+'%';}`, `}`);
rep(`var br=q('[data-bar="'+i+'"]');if(br)br.style.width=(grainKg()?f.kg/grainKg()*100:0)+'%';`, `majCur(i);`);
// Le geste : toutes les barres (grain et autres), au cran ; sucres et fruits sur leur plage.
const g0 = s.indexOf('var tire=null;'), g1 = s.indexOf('var rg=q(\'[data-role="regle"]\');');
if (g0 < 0 || g1 < g0) throw new Error('geste introuvable');
s = s.slice(0, g0) + lit('p6b2-geste.js') + s.slice(g1);
rep(`if(e.target.closest('.r4d-kgl,.r4e-mf,.r4e-ebc,[data-role="part-ligne"]'))return;`, `if(e.target.closest('.r4d-kgl,.r4e-mf,.r4e-ebc,.r4e-bw'))return;`);
const k0 = s.indexOf(`  if(t.dataset.role==='part-ligne'){`), k1 = s.indexOf(`  if(t.dataset.ebcl!=null){if(e.key==='Enter')`);
if (k0 < 0 || k1 < k0) throw new Error('clavier introuvable');
s = s.slice(0, k0) + lit('p6b2-clavier.js') + s.slice(k1);
fs.writeFileSync(path.join(ICI, 'etat.html'), s);
console.log('p6-b2 assemblé');
