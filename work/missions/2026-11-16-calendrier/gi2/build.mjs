// gi2 (16.11 soir) : assemblage choisi = g-d1 + i1 + i3 + i4 + i6 + i8 (jamais i5 ni i7 ; le + volant reste « + »).
// Ses mots : « I1 oui mais aligné et fonction pas à cette endroit pour laisser la place aux vrais info. Le plus de faire dans le
// carré de fêtes, vente, achats ECT.. » ; « I8 oui mais attention c'est pas très clair... » ; « i2 bonne idée mais mal réalisé ».
// choisi-a/b/c : trois façons du carré-bouton (ajouter) et du masque clair. r2-a/b/c : trois façons de refaire i2, sur choisi-a.
// Outil copié de gi/build.mjs (i1, i3, i4, i6 repris tels quels), gi/ non modifié.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const u = (f) => 'file:///' + f.split(path.sep).join('/');
const BASE = u(path.join(HERE, '..', 'paliers', 'g-d1.html'));
const PROTO = u(path.join(HERE, '..', 'c85', 'sources1', 'proto.html'));
// Passe corrigée (critique du 16.11 soir) : choisi-c et r2-b écartés, non reconstruits (fichiers laissés tels quels).
const VERSIONS = {
  'choisi-a': { mots: true, titre: 'carré plein qui ajoute · œil en colonne qui masque · « 4 choses cachées » et trace de ce qui est caché' },
  'choisi-b': { calme: true, titre: 'carré plein qui ajoute · œil en colonne, discret au repos · la trace seule montre ce qui est caché' },
  'r2-a': { mots: true, r2: 'colonne', titre: 'choisi-a + résumé neutre « nombre · solde » confirmés, S47 – S52' },
  'r2-c': { mots: true, r2: 'jauge', titre: 'choisi-a + solde en étiquette neutre remplie depuis la gauche, comparable entre rangées' },
};

const SCRIPT = `(function(){var C=window.GI||{},D=document;
function off(){var t=D.querySelector('.gi-tip');if(t)t.remove();D.querySelectorAll('#fh .gi-on').forEach(function(e){e.classList.remove('gi-on')});}
if(C.sem){var wk=D.querySelectorAll('#fh .wk'),lib=D.querySelectorAll('#fh .lib');
function show(k){var was=lib[k].classList.contains('gi-on');off();if(was)return;wk[k].classList.add('gi-on');lib[k].classList.add('gi-on');
var t=D.createElement('div');t.className='k17-tip gi-tip';t.setAttribute('role','status');t.innerHTML=C.sem[k];D.body.appendChild(t);
var r=lib[k].getBoundingClientRect(),fh=D.querySelector('#fh').getBoundingClientRect(),w=t.offsetWidth;
t.style.left=Math.max(8,Math.min(innerWidth-8-w,(r.left+r.right)/2-w/2))+'px';t.style.top=(fh.bottom+6)+'px';}
[wk,lib].forEach(function(L){L.forEach(function(e,k){e.addEventListener('click',function(ev){ev.stopPropagation();show(k);});});});
D.addEventListener('click',off);}
if(C.sheet){var p=D.querySelector('.gd-pill.bad'),h=D.createElement('div');h.className='gi-sh';h.innerHTML=C.sheet;h.hidden=true;D.body.appendChild(h);
function set(o){h.hidden=!o;p.setAttribute('aria-expanded',o?'true':'false');D.body.classList.toggle('gi-sheet',o);}
p.addEventListener('click',function(){set(h.hidden);});h.addEventListener('click',function(e){if(e.target.closest('.k15-h button'))set(false);});}
function masque(l,o){l.classList.toggle('k15-off',o);l.classList.remove('k14-ouv');var c=l.querySelector('.g2-c');c.setAttribute('aria-expanded','false');
l.querySelectorAll('[data-g2-masque]').forEach(function(b){b.setAttribute('aria-pressed',o?'true':'false');b.setAttribute('aria-label',(o?'Réafficher ':'Masquer ')+l.dataset.nom);});}
D.querySelectorAll('#fb .lane').forEach(function(l){var lt=l.querySelector('.lt'),c=lt.querySelector('.g2-c');
c.addEventListener('click',function(e){e.stopPropagation();if(l.classList.contains('k15-off'))masque(l,false);var o=l.classList.toggle('k14-ouv');c.setAttribute('aria-expanded',o?'true':'false');});
lt.addEventListener('click',function(e){var m=e.target.closest('[data-g2-masque]');if(l.classList.contains('k15-off')){masque(l,false);return;}if(m)masque(l,true);});});
})();`;

function appliquer(V, X) {
  const css = (id, t) => { const s = document.createElement('style'); s.id = 'g2-' + id; s.textContent = t; document.head.appendChild(s); };
  const lane = (v) => document.querySelector(`#fb .lane[data-voie="${v}"]`);
  const GI = {};
  const svg = (d, cl = '') => `<svg class="ico ${cl}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const PLUS = '<path d="M12 5v14M5 12h14"/>';
  const OEIL = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>';
  const OEIL_X = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/>';
  const CHEV = '<path d="M6 9l6 6 6-6"/>';
  const COCHE = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
  // ---- i1 (gi/build.mjs), sans la colonne de + : titres à gauche, alignés, largeur au plus juste
  for (const v of ['brassage', 'evenement']) { const lt = lane(v).querySelector('.lt'); lt.classList.remove('pg-in'); lt.removeAttribute('style'); lt.classList.add('gi1-t'); }
  css('i1', `#fb .lane .lt.gi1-t{height:18px;padding-bottom:0;align-items:center}
#fb .lane[data-voie=brassage]{padding-top:5px}
#fb .lane[data-voie=evenement] .lt.gi1-t{height:26px;margin-top:-26px;position:relative;z-index:2;width:max-content;padding-bottom:3px;align-items:flex-end}
#fb .lane[data-voie=brassage] .k18-ln{top:116px!important}
#fb .lane:is([data-voie=achat],[data-voie=renovation],[data-voie=activite],[data-voie=charge])>.lt{height:23px}
#fb .lane>.lt{width:max-content!important;box-sizing:border-box}`);
  // ---- i3 : date au toucher de la semaine
  GI.sem = ['16 – 22 nov.', '23 – 29 nov.', '30 nov. – 6 déc.', '7 – 13 déc.', '14 – 20 déc.', '21 – 27 déc.'].map((d, k) => `<span><b>S${47 + k}</b></span><span>${d}</span>`);
  // ---- i4 : mouvement de la semaine sous le solde
  const MVT = ['−148', '+120', '−20', '+988', '−56', '+486'];
  document.querySelectorAll('#fh .lib').forEach((b, k) => {
    if (b.classList.contains('pg-man')) { const n = document.createElement('span'); n.className = 'gi4-n'; while (b.firstChild) n.appendChild(b.firstChild); b.appendChild(n); }
    const s = document.createElement('small'); s.className = 'gi4'; s.textContent = MVT[k]; b.appendChild(s);
    b.setAttribute('aria-label', b.getAttribute('aria-label') + ' ; mouvement ' + MVT[k]);
  });
  css('i4', `#fh{height:55px}#fh .wk{padding-top:1px;line-height:17px}
#fh .wk b{height:17px}#fh .wk .k13-id{vertical-align:top;height:17px}
#fh .lib{height:34px;line-height:1.05;justify-content:flex-start;padding-top:1px}
#fh .lib.pg-man{flex-direction:column;gap:0}
#fh .lib .gi4-n{display:flex;align-items:center;gap:1px}
body #fh .lib small.gi4{display:block;font-size:14px;font-weight:500;color:var(--mut);line-height:16px}`);
  css('sem', `#fh .wk.gi-on,#fh .lib.gi-on{background:color-mix(in srgb,var(--ink) 8%,transparent)}#fh .wk.gi-on{border-radius:8px 8px 0 0}#fh .lib.gi-on{border-radius:0 0 8px 8px}
.k17-tip.gi-tip{--c:var(--line2)}.k17-tip.gi-tip b{font-weight:800}`);
  // ---- i6 : « en retard » dans la feuille de la pastille
  GI.sheet = X.sheet;
  css('sheet', `.gd-hd .gd-pill.bad[aria-expanded=true]{box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px var(--bad)}body.gi-sheet #fab{display:none}`);

  // ---- le carré devient le bouton d'ajout ; la colonne de + disparaît
  const N = { brassage: 2, evenement: 1, vente: 4, achat: 1, renovation: 0, activite: 1, charge: 3 };
  const rects = {};
  document.querySelectorAll('#fb .lane').forEach((l) => {
    const lt = l.querySelector('.lt'), nom = [...lt.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()).textContent.trim();
    l.dataset.nom = nom;
    // traces de ce que contient la rangée (pour le pli) : x relatif à la rangée
    const L = l.getBoundingClientRect();
    rects[l.dataset.voie] = [...l.querySelectorAll('.lr .bar')].map((b) => { const r = b.getBoundingClientRect(); return ['b', r.left - L.left, r.width]; })
      .concat([...l.querySelectorAll('.k17-p .k18-r')].map((b) => { const r = b.getBoundingClientRect(); return ['p', r.left - L.left + r.width / 2, 0]; }));
    lt.querySelector('.k14-pl')?.remove(); lt.querySelector('small')?.remove();
    const b = document.createElement('button'); b.type = 'button'; b.className = 'g2-c'; b.setAttribute('aria-label', 'Ajouter dans ' + nom); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = `<span class="g2-q">${svg(PLUS)}</span>`; lt.querySelector('i').replaceWith(b);
    lt.removeAttribute('role'); lt.removeAttribute('aria-pressed');
    const tn = [...lt.childNodes].find((k) => k.nodeType === 3 && k.textContent.trim()); const nm = document.createElement('span'); nm.className = 'g2-nm'; nm.textContent = nom; tn.replaceWith(nm);
    const n = N[l.dataset.voie], cache = n ? n + (n > 1 ? ' choses cachées' : ' chose cachée') : 'vide, cachée';
    lt.insertAdjacentHTML('beforeend', `<button type="button" class="g2-oe" data-g2-masque aria-pressed="false" aria-label="Masquer ${nom}">${svg(OEIL, 'g2-o1')}${svg(OEIL_X, 'g2-o0')}</button>` + (V.mots ? `<span class="g2-ca">${cache}</span>` : ''));
    // trace de b (greffe) : où tombent les choses cachées, sous le titre de la rangée cachée
    const rail = document.createElement('div'); rail.className = 'g2-rail'; rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = rects[l.dataset.voie].map(([k, x, w]) => k === 'b' ? `<i style="left:${x.toFixed(1)}px;width:${w.toFixed(1)}px"></i>` : `<b style="left:${(x - 4).toFixed(1)}px"></b>`).join('');
    lt.after(rail);
  });
  // carré plein : 28 px de cible, 20 px dessinés, une colonne ; les yeux dans une colonne fixe (titres à largeur commune)
  const W = Math.ceil(Math.max(...[...document.querySelectorAll('#fb .lt .g2-nm')].map((e) => e.getBoundingClientRect().width)));
  css('car', `#fb .lane .lt{gap:4px}
#fb .lt .g2-nm{display:inline-block;min-width:${W}px}
#fb .lt .g2-c{all:unset;box-sizing:border-box;flex:none;width:28px;height:28px;margin:-5px -1px -5px -4px;display:grid;place-items:center;cursor:pointer;align-self:center;-webkit-tap-highlight-color:transparent}
#fb .lane>.lt:not(.gi1-t){align-items:center}
#fb .lt .g2-q{width:20px;height:20px;border-radius:5px;display:grid;place-items:center;background:var(--c);color:var(--bg)}
#fb .lt .g2-q .ico{width:14px;height:14px;stroke-width:2.8;transition:transform .15s}
#fb .lane.k14-ouv .g2-q .ico{transform:rotate(45deg)}
#fb .lane.k14-ouv .g2-q{outline:2px solid var(--c);outline-offset:2px}
body:has(#fb .lane.k14-ouv) #fab{display:none}
#fb .lane.k14-ouv .ps i{opacity:1}#fb .lane.k14-ouv .ps i::before{content:"";position:absolute;inset:0 4px;border:1.5px dashed color-mix(in srgb,var(--c) 70%,transparent);border-radius:7px;background:color-mix(in srgb,var(--c) 7%,transparent)}
#fb .lane[data-voie=renovation]{padding-bottom:9px}
#fb .lane:is([data-voie=achat],[data-voie=activite])>.lr{height:34px!important}
body #fab{bottom:70px!important}
#fb .lane.k15-off .g2-q{opacity:.5}
#fb .lane.k15-off .lt .g2-nm{color:var(--mut)}
#fb .lt .g2-ca{display:none;font-size:14px;font-weight:400;color:var(--mut);white-space:nowrap;margin-left:2px}
#fb .lane.k15-off .lt .g2-ca{display:inline}
#fb .lane.k15-off>.lr,#fb .lane.k15-off .k17-p,#fb .lane.k15-off .k18-ln,#fb .lane.k15-off .k18-pd,#fb .lane.k15-off .ps{display:none!important}
#fb .lane.k15-off>.lt{position:static!important;left:auto!important;margin-top:0!important;height:26px;align-items:center}
#fb .lt .g2-oe{all:unset;box-sizing:border-box;flex:none;width:28px;height:28px;margin:-5px -6px -5px -2px;display:grid;place-items:center;color:var(--mut);cursor:pointer;align-self:center}
#fb .lt .g2-oe .ico{width:17px;height:17px;stroke-width:1.8}
#fb .lt .g2-oe .g2-o0,#fb .lane.k15-off .lt .g2-oe .g2-o1{display:none}#fb .lane.k15-off .lt .g2-oe .g2-o0{display:block}
#fb .lane.k15-off .lt .g2-oe{color:var(--ink)}
#fb .g2-rail{display:none;position:relative;height:10px;margin:2px 0 8px}
#fb .lane.k15-off .g2-rail{display:block}
#fb .g2-rail i{position:absolute;top:2px;height:6px;border-radius:3px;background:color-mix(in srgb,var(--c) 50%,transparent)}
#fb .g2-rail b{position:absolute;top:1px;width:8px;height:8px;border-radius:50%;background:color-mix(in srgb,var(--c) 65%,transparent)}`
  + (V.calme ? `
#fb .lane:not(.k15-off) .lt .g2-oe{color:color-mix(in srgb,var(--mut) 72%,var(--bg))}
#fb .lane:not(.k15-off) .lt .g2-oe .ico{width:15px;height:15px;stroke-width:1.6}` : ''));

  // ---- i2 refait (sur choisi-a). Une règle : ce qui est confirmé et chiffré, de S47 à S52 (dit une fois, en bas).
  // Ventes : sans le Café du Pont (prévu) ni les 3 fûts à La Cigogne (sans montant). Papiers : le loyer compte une échéance (déc.).
  const SOM = { brassage: [2, '−324', 324, 'Blonde d’automne −148 et Porter d’hiver −176'], vente: [2, '+900', 900, 'Auberge du Lac +260 et Noël privés +640 ; sans le Café du Pont, prévu, ni les 3 fûts à La Cigogne, pas chiffrés'], charge: [3, '−806', 806, 'loyer de décembre −400, factures −312 et −94'] };
  const MAX = 900;
  if (V.r2) {
    for (const [v, [n, t, a, det]] of Object.entries(SOM)) {
      const lt = lane(v).querySelector('.lt');
      const lab = `${lane(v).dataset.nom}, confirmé de S47 à S52 : ${n} choses, solde ${t} (${det})`;
      if (V.r2 === 'colonne') lt.insertAdjacentHTML('beforeend', `<span class="g2-r" role="note" aria-label="${lab}"><span class="g2-rn">${n}</span><span class="g2-rp">·</span><span class="g2-rm">${t}</span></span>`);
      if (V.r2 === 'jauge') lt.insertAdjacentHTML('beforeend', `<span class="g2-r" role="note" aria-label="${lab}" style="--w:${Math.round(a / MAX * 100)}%"><span class="g2-rm">${t}</span></span>`);
    }
    const leg = document.createElement('p'); leg.className = 'g2-leg';
    leg.textContent = V.r2 === 'colonne' ? 'nombre · solde, S47 – S52' : 'solde confirmé S47 – S52';
    lane('brassage').querySelector('.lt').appendChild(leg);
    css('r2', `#fb .lt .g2-r{margin-left:2px;flex:none;display:flex;align-items:center;height:22px;padding:0 5px;box-sizing:border-box;border-radius:6px;background:var(--s2);box-shadow:inset 0 0 0 1px var(--line2);font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--ink);align-self:center}
#fb .lt .g2-rn{font-weight:600;color:var(--mut)}#fb .lt .g2-rp{color:var(--mut);font-weight:400;padding:0 3px}#fb .lt .g2-rm{font-weight:600}
#fb .lane.k15-off .lt .g2-r{display:none}
#fb .lt .g2-leg{margin:0 0 0 8px;font-size:14px;font-weight:400;color:var(--mut);white-space:nowrap}
#fb .lane.k15-off .lt .g2-leg{display:none}`
    + (V.r2 === 'jauge' ? `
#fb .lt .g2-r{position:relative;overflow:hidden;width:54px;justify-content:flex-end;padding-right:6px}
#fb .lt .g2-r::before{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--w);background:color-mix(in srgb,var(--ink) 24%,transparent)}
#fb .lt .g2-rm{position:relative}` : ''));
  }
  return GI;
}
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto(PROTO, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 600));
await p.evaluate(() => document.querySelector('[data-k15-maint]').click()); await new Promise((r) => setTimeout(r, 300));
const sheet = await p.evaluate(() => document.querySelector('.k15-f').outerHTML);
const only = process.argv[2];
for (const [n, V] of Object.entries(VERSIONS).filter(([n]) => !only || only.split(',').includes(n))) {
  await p.goto(BASE, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 200));
  const GI = await p.evaluate(appliquer, V, { sheet });
  let html = await p.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
  const k = html.lastIndexOf('</body>'); html = html.slice(0, k) + '<script>window.GI=' + JSON.stringify(GI) + ';</script><script>' + SCRIPT + '</script>' + html.slice(k);
  const t0 = html.indexOf('<title>'), t1 = html.indexOf('</title>', t0);
  fs.writeFileSync(path.join(HERE, n + '.html'), html.slice(0, t0) + '<title>' + n + ' · g-d1 + i1 i3 i4 i6 i8 · ' + V.titre + html.slice(t1));
  console.log('écrit', n);
}
await nav.close();
