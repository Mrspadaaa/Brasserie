// gi : g-d1 + une seule idée de cd1 par fichier (i1…i8), puis tout.html. Écrit gi/*.html depuis paliers/g-d1.html.
// Retouche 16.11 (critique) : lien du chariot réparé (i1), résumés à une seule place (i2), date et jours au toucher de la
// semaine (i3, i5), « en retard » dans la feuille qui s'ouvre (i6), titre simple qui masque sa rangée (i8), tout = i1 + i4 + i7 + i8.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const u = (f) => 'file:///' + f.split(path.sep).join('/');
const BASE = u(path.join(HERE, '..', 'paliers', 'g-d1.html'));
const PROTO = u(path.join(HERE, '..', 'c85', 'sources1', 'proto.html'));
const IDEES = {
  i1: 'titres de rangée à gauche, au-dessus de leurs barres',
  i2: 'résumé des rangées de plusieurs choses, à droite du titre',
  i3: 'date de la semaine, au toucher de la semaine',
  i4: 'mouvement de la semaine sous le solde',
  i5: 'jours de travail, au toucher de la semaine',
  i6: '« en retard » dans la feuille qui s’ouvre au toucher de ⏲ 2',
  i7: '« + S47 » : le + dit la semaine visée',
  i8: 'un toucher sur le titre masque la rangée',
};
const TOUT = (process.env.TOUT || 'i1,i4,i7,i8').split(',');

// Comportement des pages (fonction immédiate, globales préfixées) : toucher de semaine, feuille ⏲, masque de rangée.
const SCRIPT = `(function(){var C=window.GI||{},D=document;
function off(){var t=D.querySelector('.gi-tip');if(t)t.remove();D.querySelectorAll('#fh .gi-on').forEach(function(e){e.classList.remove('gi-on')});}
if(C.sem){var wk=D.querySelectorAll('#fh .wk'),lib=D.querySelectorAll('#fh .lib');
function show(k){var was=lib[k].classList.contains('gi-on');off();if(was)return;wk[k].classList.add('gi-on');lib[k].classList.add('gi-on');
var t=D.createElement('div');t.className='k17-tip gi-tip'+(C.semBad&&C.semBad[k]?' gi-bad':'');t.setAttribute('role','status');t.innerHTML=C.sem[k];D.body.appendChild(t);
var r=lib[k].getBoundingClientRect(),fh=D.querySelector('#fh').getBoundingClientRect(),w=t.offsetWidth;
t.style.left=Math.max(8,Math.min(innerWidth-8-w,(r.left+r.right)/2-w/2))+'px';t.style.top=(fh.bottom+6)+'px';}
[wk,lib].forEach(function(L){L.forEach(function(e,k){e.addEventListener('click',function(ev){ev.stopPropagation();show(k);});});});
D.addEventListener('click',off);}
if(C.sheet){var p=D.querySelector('.gd-pill.bad'),h=D.createElement('div');h.className='gi-sh';h.innerHTML=C.sheet;h.hidden=true;D.body.appendChild(h);
function set(o){h.hidden=!o;p.setAttribute('aria-expanded',o?'true':'false');D.body.classList.toggle('gi-sheet',o);}
p.addEventListener('click',function(){set(h.hidden);});h.addEventListener('click',function(e){if(e.target.closest('.k15-h button'))set(false);});}
if(C.masque){D.querySelectorAll('#fb .lane .lt').forEach(function(lt){lt.addEventListener('click',function(e){if(e.target.closest('.k14-pl'))return;
var o=lt.closest('.lane').classList.toggle('k15-off');lt.setAttribute('aria-pressed',o?'true':'false');});});}
})();`;

function appliquer(ids, X) {
  const css = (id, t) => { const s = document.createElement('style'); s.id = 'gi-' + id; s.textContent = t; document.head.appendChild(s); };
  const lane = (v) => document.querySelector(`#fb .lane[data-voie="${v}"]`);
  const MVT = ['−148', '+120', '−20', '+988', '−56', '+486'];
  const GI = {};
  for (const id of ids) {
    if (id === 'i1') {
      // Brassins sur sa ligne (20 px + 4 px de marge sous la bande). Le lien du chariot garde son tracé de g-d1 : il descend
      // avec le Porter (top +24). Les 24 px se reprennent sur les lignes de titre d'Achats, Travaux, Activités, Papiers (26 → 23).
      for (const v of ['brassage', 'evenement']) { const lt = lane(v).querySelector('.lt'); lt.classList.remove('pg-in'); lt.removeAttribute('style'); lt.classList.add('gi1-t'); }
      css('i1', `#fb .lane .lt.gi1-t{height:18px;padding-bottom:0;align-items:center}
#fb .lane[data-voie=brassage]{padding-top:5px}
#fb .lane .lt.gi1-t .k14-pl{align-self:center;margin-bottom:0}
#fb .lane[data-voie=evenement] .lt.gi1-t{height:26px;margin-top:-26px;position:relative;z-index:2;width:max-content;padding-bottom:3px;align-items:flex-end}
#fb .lane[data-voie=evenement] .lt.gi1-t .k14-pl{align-self:flex-end;margin-bottom:-3px}
#fb .lane[data-voie=brassage] .k18-ln{top:116px!important}
#fb .lane:is([data-voie=achat],[data-voie=renovation],[data-voie=activite],[data-voie=charge])>.lt{height:23px}
/* 16.11 « + pas aligné ni sur la même ligne » : tous les + dans une colonne, au bout d’un titre de largeur fixe */
#fb .lane>.lt{width:118px!important;box-sizing:border-box}
#fb .lane>.lt .k14-pl{margin-left:auto!important}`);
    }
    if (id === 'i2') {
      // Une seule place : sur la ligne du titre, à droite du titre et de son +. Seulement les rangées de plusieurs choses.
      // Sans i1, Brassins est titré à droite de la Blonde : pas de place sur sa ligne, pas de résumé.
      const SOM = { brassage: '2 · −324', vente: '4 · +900', charge: '3 · −806' };
      for (const [v, t] of Object.entries(SOM)) {
        const lt = lane(v).querySelector('.lt'); if (lt.classList.contains('pg-in') && lt.style.left && parseFloat(lt.style.left) > 100) continue;
        const s = document.createElement('span'); s.className = 'gi2'; s.textContent = t; lt.appendChild(s);
      }
      css('i2', `#fb .lane .lt .gi2{margin-left:10px;font-weight:500;color:var(--mut);font-size:14px;white-space:nowrap;font-variant-numeric:tabular-nums}
#fb .lane .lt.pg-in:has(.gi2){width:max-content!important}`);
    }
    if (id === 'i3') {
      GI.sem = ['16 – 22 nov.', '23 – 29 nov.', '30 nov. – 6 déc.', '7 – 13 déc.', '14 – 20 déc.', '21 – 27 déc.'].map((d, k) => `<span><b>S${47 + k}</b></span><span>${d}</span>`);
    }
    if (id === 'i4') {
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
    }
    if (id === 'i5') {
      const JOURS = [1, 1, 0, 4, 1, 2], man = document.querySelector('#fh .lib.pg-man svg')?.outerHTML || '';
      GI.sem = JOURS.map((j, k) => `<span><b>S${47 + k}</b></span><span>${j} j de travail sur 2</span>` + (j > 2 ? `<span class="bad">${man}manque ${j - 2} j</span>` : ''));
      GI.semBad = JOURS.map((j) => j > 2);
    }
    if (id === 'i6') GI.sheet = X.sheet;
    if (id === 'i7') {
      css('i7', `#fab.fab.fc{gap:0;line-height:1}
#fab.fab.fc .ico{width:20px;height:20px}
body #fab #fabl{display:block!important;font-size:14px;font-weight:800;letter-spacing:-.2px;margin-top:-1px}`);
      document.querySelector('#fab').setAttribute('aria-label', 'Ajouter en S47 · 16 nov.');
    }
    if (id === 'i8') {
      // Titre simple de g-d1. Un toucher masque la rangée (état k15-off de g-d1 : titre gris, carré vide, sans +) ;
      // « 4 masquées » dit ce qui est caché ; un second toucher réaffiche.
      GI.masque = true;
      const N = { brassage: 2, evenement: 1, vente: 4, achat: 1, renovation: 0, activite: 1, charge: 3 };
      document.querySelectorAll('#fb .lane').forEach((l) => {
        const lt = l.querySelector('.lt'), n = N[l.dataset.voie]; lt.setAttribute('aria-label', 'Masquer ou réafficher la rangée ' + lt.textContent.trim());
        if (n) { const s = document.createElement('span'); s.className = 'gi8n'; s.textContent = n + (n > 1 ? ' masquées' : ' masquée'); lt.appendChild(s); }
      });
      css('i8', `#fb .lane .lt .gi8n{display:none}
#fb .lane.k15-off .lt .gi8n{display:inline;margin-left:8px;font-size:14px;font-weight:400;color:var(--mut);white-space:nowrap}
#fb .lane.k15-off>.lr,#fb .lane.k15-off .k17-p,#fb .lane.k15-off .k18-ln,#fb .lane.k15-off .k18-pd,#fb .lane.k15-off .ps{display:none!important}
#fb .lane.k15-off>.lt{position:static!important;left:auto!important;width:auto!important;height:26px}`);
    }
  }
  if (GI.sem) css('sem', `#fh .wk.gi-on,#fh .lib.gi-on{background:color-mix(in srgb,var(--ink) 8%,transparent)}#fh .wk.gi-on{border-radius:8px 8px 0 0}#fh .lib.gi-on{border-radius:0 0 8px 8px}
.k17-tip.gi-tip{--c:var(--line2)}.k17-tip.gi-tip.gi-bad{--c:var(--bad)}.k17-tip.gi-tip b{font-weight:800}`);
  if (GI.sheet) css('sheet', `.gd-hd .gd-pill.bad[aria-expanded=true]{box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px var(--bad)}body.gi-sheet #fab{display:none}`);
  return GI;
}
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
// La feuille « Maintenant » du proto, telle qu'elle s'ouvre au toucher de la pastille (mêmes données que g-d1).
await p.goto(PROTO, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 600));
await p.evaluate(() => document.querySelector('[data-k15-maint]').click()); await new Promise((r) => setTimeout(r, 300));
const sheet = await p.evaluate(() => document.querySelector('.k15-f').outerHTML);
const only = process.argv[2];
const jobs = [...Object.keys(IDEES).map((k) => [k, [k], `${k} · g-d1 + ${IDEES[k]}`]), ['tout', TOUT, 'tout · g-d1 + ' + TOUT.join(', ')]].filter(([n]) => !only || only.split(',').includes(n));
for (const [n, ids, titre] of jobs) {
  await p.goto(BASE, { waitUntil: 'load' });
  const GI = await p.evaluate(appliquer, ids, { sheet });
  let html = await p.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
  if (Object.keys(GI).length) { const k = html.lastIndexOf('</body>'); html = html.slice(0, k) + '<script>window.GI=' + JSON.stringify(GI) + ';</script><script>' + SCRIPT + '</script>' + html.slice(k); }
  const t0 = html.indexOf('<title>'), t1 = html.indexOf('</title>', t0);
  fs.writeFileSync(path.join(HERE, n + '.html'), html.slice(0, t0) + '<title>' + titre + html.slice(t1));
  console.log('écrit', n);
}
await nav.close();
