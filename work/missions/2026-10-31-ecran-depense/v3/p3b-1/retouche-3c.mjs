#!/usr/bin/env node
// Retouches 3c de la série p3b (critique, VERDICTS-v3 : « Corrections communes ») sur les trois etat.html, par split/join
// (aucune regex, L26). Chaque remplacement doit trouver sa cible au moins une fois, sinon RETOUCHE ECHEC.
// Usage : node work/missions/2026-10-31-ecran-depense/v3/p3b-1/retouche-3c.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const V3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fautes = [];
const NAVI = {
  Bord: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  Finances: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  Brassins: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>',
  Stocks: '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85M7 16.5l5-3M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3M17 16.5l4.74-2.85M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15M12 8l4.74-2.85M12 13.5V8"/>',
  Clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};
function remplacer(txt, avant, apres, nom) {
  const morceaux = txt.split(avant);
  if (morceaux.length < 2) { fautes.push(nom); return txt; }
  return morceaux.join(apres);
}
for (const i of [1, 2, 3]) {
  const P = `p3b${i}`, f = path.join(V3, `p3b-${i}`, 'etat.html');
  let t = fs.readFileSync(f, 'utf8');
  // 4. La navigation de l'annexe Finances : celle de l'app (BottomNav : icônes lucide 16 px, 44 px, barre de 2 px sur l'onglet actif).
  const d = t.indexOf('  var NAV='), fin = t.indexOf('\n', d);
  if (d < 0) fautes.push(`${P} NAV`);
  else {
    const navi = 'var ' + P + 'NAVI=' + JSON.stringify(NAVI) + ';';
    const nav = `  ${navi}\n  var NAV='<nav class="${P}-nav" aria-label="Navigation principale"><div class="${P}-navi">'+['Bord','Finances','Brassins','Stocks','Clients'].map(function(t){var on=t==='Finances';return '<span class="'+(on?'${P}-on':'')+'"'+(on?' aria-current="page"':'')+'>'+(on?'<i></i>':'')+'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+${P}NAVI[t]+'</svg>'+t+'</span>'}).join('')+'</div></nav>';`;
    t = t.slice(0, d) + nav + t.slice(fin);
  }
  t = remplacer(t, '</style></head>', `.${P}-nav{display:block;height:44px}\n.${P}-navi{max-width:448px;margin:0 auto;display:flex;height:100%}\n.${P}-nav span{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:500;color:var(--t1)}\n.${P}-nav span.${P}-on{color:var(--t0);font-weight:600;background:var(--okf)}\n.${P}-nav span i{position:absolute;top:0;left:50%;width:32px;margin-left:-16px;height:2px;border-radius:9px;background:currentColor}\n.${P}-nm.${P}-nmw{flex-wrap:wrap;white-space:normal;row-gap:0}\n.${P}-nm.${P}-nmw b{flex:none;max-width:100%}\n</style></head>`, `${P} css`);
  // Le trait des icônes : 1,5 px rendu, quel que soit le viewBox (20 ou 24).
  t = remplacer(t, "s.setAttribute('stroke-width',(30/(+s.getAttribute('width')||20)).toFixed(3))", "s.setAttribute('stroke-width',((+((s.getAttribute('viewBox')||'0 0 20 20').split(' ')[2]))*1.5/(+s.getAttribute('width')||20)).toFixed(3))", `${P} trait`);
  // 2. Pendant la lecture, ni « Déjà payé » ni « À payer » ne sont choisis : les deux gris.
  t = remplacer(t, `class="${P}-lb ${P}-lon" aria-pressed="true"`, `class="${P}-lb" aria-pressed="false"`, `${P} lecture`);
  if (i === 1) {
    // 1. Le mot « mouture » sur chaque sous-ligne ; « rattacher » en mot ; réglée : « mouture ✓ ».
    t = remplacer(t, `var etq=et==='att'?'<span class="p3b1-cv" style="background:var(--okf);color:var(--ok)">✓ rattachée</span>':et==='svc'?'<span class="p3b1-cv">service</span>':prem?'<span class="p3b1-sup">mouture</span>':'<span class="p3b1-sup p3b1-vd" aria-label="mouture à rattacher">'+ico('mout',14)+'</span>';`,
      `var etq=et==='att'?'<span class="p3b1-cv" style="background:var(--okf);color:var(--ok)">mouture ✓</span>':et==='svc'?'<span class="p3b1-cv">mouture · service</span>':'<span class="p3b1-sup">mouture</span>';`, 'p3b1 mouture');
    const fleche = `aria-label="Rattacher à '+lg(l[9].p)[3]+'"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M10 16V5M6 9l4-4 4 4"/></svg></button>'`;
    t = remplacer(t, fleche, `aria-label="Rattacher à '+lg(l[9].p)[3]+'">rattacher</button>'`, 'p3b1 rattacher');
    t = remplacer(t, '.p3b1-mo1{min-width:24px;border:1.5px dashed var(--attt);color:var(--attt);font-weight:600;padding:0}', '.p3b1-mo1{min-width:24px;border:1.5px dashed var(--attt);color:var(--attt);font-weight:600;padding:0 8px}', 'p3b1 mo1');
    // 3. « LALLEMAND Windsor » en entier : le nom ne se coupe plus, la pastille passe à la ligne.
    t = remplacer(t, `+'<span class="p3b1-nm"><b>'+l[3]+'</b>'+pills+'</span>'`, `+'<span class="p3b1-nm'+(l[9].conv?' p3b1-nmw':'')+'"><b>'+l[3]+'</b>'+pills+'</span>'`, 'p3b1 windsor');
    // 4. Greffe p3a-1 : les numéros des points à côté de leur compte.
    t = remplacer(t, `+'<b>'+n+'</b>'+mot+(k==='mout'&&dt?' <span class="p3b1-m">+1,50</span>':'')+'</button>'}`,
      `+'<b>'+n+'</b>'+mot+(k==='mout'&&dt?' <span class="p3b1-m">+1,50</span>':'')+num(k)+'</button>'}\n  function num(k){var q=k==='bis'?[['p4','4'],['p6','6']]:k==='precis'?[['p5','5']]:k==='mout'?[['p3','3']]:[];return q.filter(function(x){return !PTS[x[0]]}).map(function(x){return '<span class="p3b1-no p3b1-nin p3b1-nmin">'+x[1]+'</span>'}).join('')}`, 'p3b1 numeros');
    t = remplacer(t, '</style></head>', '.p3b1-nmin{width:16px;height:16px;font-size:12px;margin-left:2px}\n</style></head>', 'p3b1 css num');
  }
  if (i === 3) {
    t = remplacer(t, `aria-label="Ligne '+m[0]+' · mouture de '+lg(m[9].p)[3]+'">↳'+chf(montant(m))+(e==='att'?'✓':'')+'</button>'`,
      `aria-label="Ligne '+m[0]+' · mouture de '+lg(m[9].p)[3]+'">↳ <span class="p3b3-mw">mouture</span> '+chf(montant(m))+(e==='att'?' ✓':'')+'</button>'`, 'p3b3 mouture');
    t = remplacer(t, '</style></head>', '.p3b3-mw{font-family:var(--sans)}\n</style></head>', 'p3b3 css');
  }
  fs.writeFileSync(f, t);
}
console.log(fautes.length ? 'RETOUCHE ECHEC ' + fautes.join(', ') : 'RETOUCHE OK 3 pages');
process.exit(fautes.length ? 1 : 0);
