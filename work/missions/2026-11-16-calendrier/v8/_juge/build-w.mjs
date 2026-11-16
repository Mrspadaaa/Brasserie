// node v8/build-w.mjs : paysage 844×390 de la vue portrait (base.html = corps gi2/r2-c + en-tête r6b), en 3 façons de tenir l'en-tête.
// Le corps est refait par la même chaîne que r2-c (proto sources2 → paliers p1…p4 → g-d1 → gi2 r2-c), sur 13 semaines (S47 – S6)
// au lieu de 6 : même largeur de semaine qu'en portrait (63 px contre 61). Rien d'autre n'y change.
// En-tête : celui de r6b (113 CHF à dépenser · S24, période, retard, plein écran ; courbe bord à bord ; mouvements nommés en entier ;
// fenêtre ; bande solde + mouvement par semaine), élargi à 844 px. La zone sous la courbe est simplifiée : plus de rangée de noms
// ni de « dès S47 » ni de mois collés à la bande ; les noms vont dans la courbe, les mois en haut, « S47 – S6 » dans la fenêtre.
// w1 : tout l'en-tête reste fixe, aplati (courbe 76 px). w2 : il se replie en une ligne au défilement. w3 : il part avec la page,
// la bande reste (comme en portrait). Données : en/q-data.json (C caisse, L libre, MV mouvements), proto sources2 (barres).
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), M = path.join(HERE, '..'), TMP = path.join(HERE, '_w');
fs.mkdirSync(TMP, { recursive: true });
const { C, L, MV, mois } = JSON.parse(fs.readFileSync(path.join(M, 'en', 'q-data.json'), 'utf8'));
const N = 53, T0 = 1, PB = 31, NW = 13, VW = 844, VH = 390;
const sn = (r) => (r < 8 ? 46 + r : r - 7);
const fmt = (n) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sg = (n) => (n >= 0 ? '+' : '−') + fmt(n);
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const mv = (r) => MV.find((m) => m.r === r);
const FIN = sn(NW); // S6

const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();

// ================= 1. corps sur 13 semaines : même chaîne que gi2/r2-c =================
let src = fs.readFileSync(path.join(M, 'c85', 'sources2', 'proto.html'), 'utf8');
if (!src.includes('R=[T0,T0+5]')) throw new Error('proto : fenêtre initiale introuvable');
fs.writeFileSync(path.join(TMP, 'proto13.html'), src.replace('R=[T0,T0+5]', `R=[T0,T0+${NW - 1}]`));
// 844×600 : le proto ne passe pas en « land » (colonne) ; il pose 13 semaines sur 844 px
await p.setViewport({ width: VW, height: 600, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await p.goto(pathToFileURL(path.join(TMP, 'proto13.html')).href); await new Promise((r) => setTimeout(r, 700));
const p0 = await p.evaluate(() => { const c = document.documentElement.cloneNode(true); c.querySelectorAll('script').forEach((s) => s.remove()); return '<!doctype html>\n' + c.outerHTML; });
await p.evaluate(() => document.querySelector('[data-k15-maint]').click()); await new Promise((r) => setTimeout(r, 300));
const sheet = await p.evaluate(() => document.querySelector('.k15-f').outerHTML);
fs.writeFileSync(path.join(TMP, 'p0.html'), p0);
await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await p.goto(pathToFileURL(path.join(TMP, 'p0.html')).href); await new Promise((r) => setTimeout(r, 300));
const style = (id, css) => p.evaluate((id, css) => { const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s); }, id, css);
// --- paliers/build.mjs p1…p4 et g-d1, repris tels quels ---
await style('pg-p1', `
#head.head{align-items:center;gap:6px;padding:4px 8px 2px 12px!important;min-height:46px}
#head .big{flex:0 1 auto;gap:6px;padding:0}
#head .big b{font-size:32px!important;height:44px;letter-spacing:-1px}
#head .big b .chf{font-size:15px;margin:0 0 7px 4px}
#head .big>button{flex:none;min-height:44px;padding:0}
#head .k14-ph{white-space:nowrap}
#head .k14-s{font-size:15px}
#head .big .chev{margin-left:0}
#head .k15-now{position:static!important;order:1;margin-left:auto;height:30px;padding:0 9px 0 6px}
#head .hbtn{order:2;border:0;width:36px;height:44px;margin-right:-4px}`);
await p.evaluate(() => {
  const h = document.querySelector('#head'); h.removeAttribute('style');
  h.querySelector('.k15-now').removeAttribute('style');
  const ph = h.querySelector('.k14-ph'); [...ph.childNodes].forEach((c) => { if (c.nodeType === 3) c.remove(); });
  ph.querySelector('.k14-s').innerHTML = '<i class="k14-pt"></i>S24';
  h.querySelector('[data-plus]').setAttribute('aria-label', '113 CHF à dépenser sans passer sous 0 (S24) : déplier le détail');
});
await style('pg-p2', `
body:not(.plus):not(.land) #rng.rng{display:none}
.pg-per{flex:none;height:30px;display:inline-flex;align-items:center;gap:1px;padding:0 4px 0 9px;border:1.5px solid var(--line2);border-radius:15px;font-size:14px;font-weight:700;white-space:nowrap}
.pg-per .ico{width:16px;height:16px}`);
await p.evaluate(() => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pg-per'; b.setAttribute('data-pg-periode', '13');
  b.setAttribute('aria-label', 'Période : 3 mois (6 sem., 6 mois, An ; trier les rangées)');
  b.innerHTML = '3 mois<svg class="ico"><use href="#i-bas"></use></svg>';
  document.querySelector('#head .big').after(b);
});
await style('pg-p3', `
#leg.leg{display:none}
#fh .fg:has(>.mb),#fh .fg:has(>.sig){display:none}
#fh .wk b{white-space:nowrap;letter-spacing:-.2px}
#fh .wk .pg-mo{font-weight:600;color:var(--mut);margin-right:3px}
#fh .wk.now .pg-mo{color:var(--ink)}
#fh .lib{padding-bottom:4px;height:30px}
#fh .lib.pg-man{flex-direction:row;gap:1px}
#fh .lib.pg-man .ico{width:15px;height:15px;stroke-width:2.4;color:var(--bad)}`);
await p.evaluate(() => {
  for (const [sem, mo] of [['47', 'nov.'], ['50', 'déc.']]) { const b = document.querySelector(`#fh .wk[data-sem="${sem}"] b`); const s = document.createElement('span'); s.className = 'pg-mo'; s.textContent = mo; b.prepend(s); }
  const l = document.querySelector('#fh .lib[data-libre-sem="50"]'); l.classList.add('pg-man'); l.insertAdjacentHTML('beforeend', '<svg class="ico"><use href="#i-pers"></use></svg>'); l.setAttribute('aria-label', 'Libre en fin de S50 : 5 120 ; manque 2 j de présence');
  document.querySelector('.k15-out').setAttribute('data-pg-menu', 'periode');
});
await style('pg-p4', `
#fb .lane .lt.pg-in{position:absolute;top:2px;height:36px;align-items:center;padding-bottom:0;z-index:2}
#fb .lane .lt.pg-in .k14-pl{align-self:center;margin-bottom:0}`);
const p4 = await p.evaluate(() => {
  const fb = document.querySelector('#fb'), W = fb.getBoundingClientRect().width, X0 = fb.getBoundingClientRect().left, res = [];
  for (const lane of fb.querySelectorAll('.lane')) {
    const lt = lane.querySelector('.lt'), lr = lane.querySelector('.lr'), lrT = lr.getBoundingClientRect().top;
    const occ = [...lr.querySelectorAll('.bar, .lbl')].map((e) => e.getBoundingClientRect()).filter((b) => b.width && b.top < lrT + 40 && b.bottom > lrT).map((b) => [b.left - X0 - 6, b.right - X0 + 6]).sort((a, b) => a[0] - b[0]);
    if (!occ.length) { res.push(lane.dataset.voie + ':vide'); continue; }
    lt.style.width = 'max-content'; const tw = lt.getBoundingClientRect().width + 2; lt.style.width = ''; let x = 0; const spans = [];
    for (const [a, b] of occ) { if (a > x) spans.push([x, a]); x = Math.max(x, b); } if (x < W) spans.push([x, W]);
    const s = spans.find(([a, b]) => a === 0 && b - a >= tw); // paysage : le titre reste à gauche, comme en portrait
    if (!s) { res.push(lane.dataset.voie + ':sans-place'); continue; }
    const pos = s[0] === 0 ? 0 : s[1] === W ? W - tw : s[0];
    const dy = lt.getBoundingClientRect().height;
    lt.classList.add('pg-in'); lt.style.left = pos.toFixed(1) + 'px'; lt.style.width = tw.toFixed(1) + 'px';
    for (const c of lane.children) { if (c !== lt && getComputedStyle(c).position === 'absolute' && c.style.top) c.style.top = (parseFloat(c.style.top) - dy) + 'px'; }
    res.push(lane.dataset.voie + ':' + pos.toFixed(0) + '+' + tw.toFixed(0));
  }
  return res;
});
await style('pg-gd1', `
#head{display:none!important}
.gd-hd{height:46px;display:flex;align-items:center;gap:8px;padding:0 10px}
.gd-hd .n{font-size:30px;font-weight:800;color:var(--fin);letter-spacing:-1px;white-space:nowrap}.gd-hd .n small{font-size:15px;color:var(--mut);margin-left:3px;letter-spacing:0}
.gd-hd .s{font-size:14px;color:var(--mut);display:flex;align-items:center;gap:2px;white-space:nowrap}.gd-hd .s b{color:var(--fin)}
.gd-hd .s .ico{width:16px;height:16px}
.gd-hd .r{margin-left:auto;display:flex;gap:6px}
.gd-pill{height:32px;min-width:32px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:3px;border:1.5px solid var(--line2);color:var(--ink);padding:0 7px;font-weight:700;font-size:15px}
.gd-pill.bad{border-color:var(--bad);color:var(--bad);background:var(--badbg)}.gd-pill .ico{width:18px;height:18px}
.gd-ch{position:absolute;left:4px;top:4px;z-index:3;height:26px;border-radius:13px;background:var(--ink);color:var(--bg);font-size:14px;font-weight:700;padding:0 4px 0 9px;display:flex;align-items:center;white-space:nowrap}
.gd-ch .ico{width:16px;height:16px}`);
await p.evaluate(() => {
  document.querySelector('#head').insertAdjacentHTML('beforebegin', '<header class="gd-hd"><button type="button" class="n" data-plus aria-label="113 CHF à dépenser sans passer sous 0 (S24) : déplier le détail">113<small>CHF</small></button><span class="s">sans passer sous 0 ·&nbsp;<b>S24</b><svg class="ico"><use href="#i-bas"></use></svg></span><span class="r"><button type="button" class="gd-pill bad" data-k15-maint aria-label="Maintenant : 2 en retard"><svg class="ico"><use href="#i-k15ret"></use></svg>2</button><button type="button" class="gd-pill" data-plein aria-label="Plein écran"><svg class="ico"><use href="#i-plein"></use></svg></button></span></header>');
  document.querySelector('#mini').insertAdjacentHTML('beforeend', '<button type="button" class="gd-ch" data-pg-periode="13" aria-label="Période : 3 mois">3 mois<svg class="ico"><use href="#i-bas"></use></svg></button>');
});
// --- gi2/build.mjs appliquer (r2-c : mots, jauge), repris ; seuls changent les comptes et soldes, refaits sur S47 – S6 ---
// Même règle que r2-c : ce qui est confirmé et chiffré dans la fenêtre. Brassins : coût au début ; Ventes : sans le Café du Pont
// (prévu) ni les 3 fûts (pas chiffrés) ; Papiers : une échéance de loyer par mois (déc., janv., févr.), l'assurance (S1), les factures.
const SOM = {
  brassage: [3, '−556', 556, 'Blonde d’automne −148, Porter d’hiver −176 et IPA houblon à cru −232'],
  vente: [2, '+900', 900, 'Auberge du Lac +260 et Noël privés +640 ; sans le Café du Pont, prévu, ni les 3 fûts à La Cigogne, pas chiffrés'],
  charge: [5, '−1 986', 1986, 'loyers de décembre, janvier et février −1 200, assurance −380, factures −312 et −94'],
};
const CACHE = { brassage: 3, evenement: 2, vente: 4, achat: 2, renovation: 0, activite: 3, charge: 5 };
await p.evaluate((SOM, CACHE, FIN) => {
  const css = (id, t) => { const s = document.createElement('style'); s.id = 'g2-' + id; s.textContent = t; document.head.appendChild(s); };
  const lane = (v) => document.querySelector(`#fb .lane[data-voie="${v}"]`);
  const svg = (d, cl = '') => `<svg class="ico ${cl}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const PLUS = '<path d="M12 5v14M5 12h14"/>';
  const OEIL = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>';
  const OEIL_X = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/>';
  for (const v of ['brassage', 'evenement']) { const lt = lane(v).querySelector('.lt'); lt.classList.remove('pg-in'); lt.removeAttribute('style'); lt.classList.add('gi1-t'); }
  css('i1', `#fb .lane .lt.gi1-t{height:18px;padding-bottom:0;align-items:center}
#fb .lane[data-voie=brassage]{padding-top:5px}
#fb .lane[data-voie=evenement] .lt.gi1-t{height:26px;margin-top:-26px;position:relative;z-index:2;width:max-content;padding-bottom:3px;align-items:flex-end}
#fb .lane[data-voie=brassage] .k18-ln{top:116px!important}
#fb .lane:is([data-voie=achat],[data-voie=renovation],[data-voie=activite],[data-voie=charge])>.lt{height:23px}
#fb .lane>.lt{width:max-content!important;box-sizing:border-box}`);
  css('i4', `#fh{height:55px}`);
  css('sem', `.k17-tip.gi-tip{--c:var(--line2)}.k17-tip.gi-tip b{font-weight:800}`);
  css('sheet', `.q-pil.bad[aria-expanded=true]{box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px var(--bad)}body.gi-sheet #fab{display:none}`);
  const rects = {};
  document.querySelectorAll('#fb .lane').forEach((l) => {
    const lt = l.querySelector('.lt'), nom = [...lt.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()).textContent.trim();
    l.dataset.nom = nom;
    const Lr = l.getBoundingClientRect();
    rects[l.dataset.voie] = [...l.querySelectorAll('.lr .bar')].map((b) => { const r = b.getBoundingClientRect(); return ['b', r.left - Lr.left, r.width]; })
      .concat([...l.querySelectorAll('.k17-p .k18-r')].map((b) => { const r = b.getBoundingClientRect(); return ['p', r.left - Lr.left + r.width / 2, 0]; }));
    lt.querySelector('.k14-pl')?.remove(); lt.querySelector('small')?.remove();
    const b = document.createElement('button'); b.type = 'button'; b.className = 'g2-c'; b.setAttribute('aria-label', 'Ajouter dans ' + nom); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = `<span class="g2-q">${svg(PLUS)}</span>`; lt.querySelector('i').replaceWith(b);
    lt.removeAttribute('role'); lt.removeAttribute('aria-pressed');
    const tn = [...lt.childNodes].find((k) => k.nodeType === 3 && k.textContent.trim()); const nm = document.createElement('span'); nm.className = 'g2-nm'; nm.textContent = nom; tn.replaceWith(nm);
    const n = CACHE[l.dataset.voie], cache = n ? n + (n > 1 ? ' choses cachées' : ' chose cachée') : 'vide, cachée';
    lt.insertAdjacentHTML('beforeend', `<button type="button" class="g2-oe" data-g2-masque aria-pressed="false" aria-label="Masquer ${nom}">${svg(OEIL, 'g2-o1')}${svg(OEIL_X, 'g2-o0')}</button><span class="g2-ca">${cache}</span>`);
    const rail = document.createElement('div'); rail.className = 'g2-rail'; rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = rects[l.dataset.voie].map(([k, x, w]) => k === 'b' ? `<i style="left:${x.toFixed(1)}px;width:${w.toFixed(1)}px"></i>` : `<b style="left:${(x - 4).toFixed(1)}px"></b>`).join('');
    lt.after(rail);
  });
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
#fb .g2-rail b{position:absolute;top:1px;width:8px;height:8px;border-radius:50%;background:color-mix(in srgb,var(--c) 65%,transparent)}`);
  // (r2-c fixait Achats et Activités à 34 px : une rangée en 6 semaines ; en 13 semaines elles en ont deux, la hauteur du proto reste)
  const MAX = Math.max(...Object.values(SOM).map((s) => s[2]));
  for (const [v, [n, t, a, det]] of Object.entries(SOM)) {
    const lt = lane(v).querySelector('.lt');
    const lab = `${lane(v).dataset.nom}, confirmé de S47 à S${FIN} : ${n} choses, solde ${t} (${det})`;
    lt.insertAdjacentHTML('beforeend', `<span class="g2-r" role="note" aria-label="${lab}" style="--w:${Math.round(a / MAX * 100)}%"><span class="g2-rm">${t}</span></span>`);
  }
  const leg = document.createElement('p'); leg.className = 'g2-leg'; leg.textContent = `solde confirmé S47 – S${FIN}`;
  lane('brassage').querySelector('.lt').appendChild(leg);
  css('r2', `#fb .lt .g2-r{margin-left:2px;flex:none;display:flex;align-items:center;height:22px;padding:0 5px;box-sizing:border-box;border-radius:6px;background:var(--s2);box-shadow:inset 0 0 0 1px var(--line2);font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--ink);align-self:center}
#fb .lt .g2-rm{font-weight:600}
#fb .lane.k15-off .lt .g2-r{display:none}
#fb .lt .g2-leg{margin:0 0 0 8px;font-size:14px;font-weight:400;color:var(--mut);white-space:nowrap}
#fb .lane.k15-off .lt .g2-leg{display:none}
#fb .lt .g2-r{position:relative;overflow:hidden;width:64px;justify-content:flex-end;padding-right:6px}
#fb .lt .g2-r::before{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--w);background:color-mix(in srgb,var(--ink) 24%,transparent)}
#fb .lt .g2-rm{position:relative}`);
}, SOM, CACHE, FIN);
const corps = await p.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
fs.writeFileSync(path.join(TMP, 'corps13.html'), corps);
console.log('corps 13 semaines', corps.length, '· titres p4', p4.join(' '));

// largeurs de texte dans la police de la page
const S = new Set(['1 140', ' ', 'mis de côté', 'S47 – S' + FIN]);
for (const m of MV) { S.add(m.n + ' '); S.add(m.n); S.add(sg(m.m)); }
for (const k of MO) S.add(k);
const LW = await p.evaluate((arr) => { const c = document.createElement('canvas').getContext('2d'); const ff = getComputedStyle(document.body).fontFamily; const o = {};
  for (const s of arr) for (const w of [400, 600, 700]) { c.font = `${w} 14px ${ff}`; o[w + '|' + s] = c.measureText(s).width; } return o; }, [...S]);
const tw = (s, w = 400) => { const v = LW[w + '|' + s]; if (v == null) throw new Error('largeur inconnue : ' + s); return v; };
const LW2 = await p.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); const ff = getComputedStyle(document.body).fontFamily; const m = (f, s) => { c.font = f + ' ' + ff; return c.measureText(s).width; };
  return { TW: m('800 24px', '113') + 4 + m('500 14px', 'CHF à dépenser ·') + 4 + m('700 14px', 'S24'), CW: m('700 14px', '3 mois') + 12 + 16 + 4 + (12 + 16 + 2 + m('700 14px', '2') + 3) + 4 + 26 }; });
const { TW, CW } = LW2; console.log('titre', TW.toFixed(0), 'px · boutons', CW.toFixed(0), 'px');

// ================= 2. en-tête r6b élargi (aides reprises de en2/build-rb.mjs) =================
function courbe({ W = VW, yT, yB, x0 = 0, pw = W, ymax = 9733, id }) {
  const X = (r) => x0 + pw * r / N, Y = (v) => yT + (yB - yT) * (1 - v / ymax);
  const wk = (x) => { let r = 0; while (r < N - 1 && X(r + 1) <= x) r++; return r; };
  let lib = '', cai = '', dn = '';
  for (let r = T0; r < N; r++) { const a = X(r).toFixed(1), b = X(r + 1).toFixed(1); lib += (r === T0 ? 'M' : 'L') + a + ' ' + Y(L[r]).toFixed(1) + 'L' + b + ' ' + Y(L[r]).toFixed(1); cai += (r === T0 ? 'M' : 'L') + a + ' ' + Y(C[r]).toFixed(1) + 'L' + b + ' ' + Y(C[r]).toFixed(1); }
  for (let r = N - 1; r >= T0; r--) dn += 'L' + X(r + 1).toFixed(1) + ' ' + Y(L[r]).toFixed(1) + 'L' + X(r).toFixed(1) + ' ' + Y(L[r]).toFixed(1);
  const defs = `<defs><pattern id="${id}h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)" opacity=".5"/></pattern></defs>`;
  const fond = `<rect x="${x0}" y="${yT}" width="${(X(T0) - x0).toFixed(1)}" height="${yB - yT}" fill="var(--s2)"/>`
    + `<path d="${lib}L${X(N).toFixed(1)} ${yB}L${X(T0).toFixed(1)} ${yB}Z" fill="var(--area)"/><path class="ob ob-f" d="${cai}${dn}Z" fill="url(#${id}h)"/>`
    + `<line class="ob" x1="${x0}" x2="${x0 + pw}" y1="${yB}" y2="${yB}" stroke="var(--line2)" stroke-width="1"/>`;
  const traits = `<path class="ob" d="${cai}" fill="none" stroke="var(--mut)" stroke-width="1.5"/><path class="ob" d="${lib}" fill="none" stroke="var(--fin)" stroke-width="2.5"/>`;
  return { X, Y, wk, defs, fond, traits, cx: (r) => (X(r) + X(r + 1)) / 2, x0, pw, yT, yB, id };
}
const col = (m) => (m.m > 0 ? '--ok' : '--bad');
const jump = (c, m, w = 3) => `<line class="ob q-mk" x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${c.Y(C[m.r - 1]).toFixed(1)}" y2="${c.Y(C[m.r]).toFixed(1)}" stroke="var(${col(m)})" stroke-width="${w}" stroke-linecap="round"><title>${m.n} ${sg(m.m)}</title></line>`;
const haut = (c, m) => c.Y(m.m > 0 ? C[m.r] : C[m.r - 1]);
const bas = (c, m) => c.Y(Math.min(L[m.r - 1], L[m.r]));
const dot = (c) => `<circle cx="${c.cx(PB).toFixed(1)}" cy="${c.Y(L[PB]).toFixed(1)}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`;
const dotBox = (c) => ({ x: c.cx(PB) - 8, y: c.Y(L[PB]) - 8, w: 16, h: 16 });
function placeur(c, cadre, obst) {
  const pris = obst.map((o) => ({ ...o }));
  const hit = (b) => b.x < cadre.x0 || b.x + b.w > cadre.x1 || b.y < cadre.y0 || pris.some((o) => b.x < o.x + o.w + 6 && o.x < b.x + b.w + 6 && b.y < o.y + o.h + 1 && o.y < b.y + b.h + 1);
  const zone = (xa, xb) => { const r0 = Math.max(T0, c.wk(xa - 1)), r1 = Math.min(N - 1, c.wk(xb + 1)); let mC = -1e9, mL = 1e9; for (let r = r0; r <= r1; r++) { mC = Math.max(mC, C[r]); mL = Math.min(mL, L[r]); } return { sky: c.Y(mC) - 3, under: c.Y(mL) + 3 }; };
  return { pris, hit, zone };
}
const fil = (x, lb, colv) => (lb ? `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${lb.y.toFixed(1)}" y2="${(lb.y + lb.h).toFixed(1)}" stroke="var(${colv})" stroke-width="1" stroke-dasharray="2 2"/>` : '');
const wNom = (m) => tw(m.n + ' ') + tw(sg(m.m), 700), wMt = (m) => tw(sg(m.m), 700);
const txtNom = (x, y, m, nom = true) => `<text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tn">${nom ? m.n + ' ' : ''}<tspan class="${m.m > 0 ? 'tp' : 'tm'}">${sg(m.m)}</tspan><title>${m.n} ${sg(m.m)}, S${sn(m.r)}</title></text>`;
// étiquette en deux lignes (build-rb) : le nom dessus, le montant dessous
const wSt = (m) => Math.max(tw(m.n, 400), wMt(m));
const txtSt = (x, y, m) => `<text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tn">${m.n}<tspan x="${x.toFixed(1)}" dy="16" class="${m.m > 0 ? 'tp' : 'tm'}">${sg(m.m)}</tspan><title>${m.n} ${sg(m.m)}, S${sn(m.r)}</title></text>`;
const wLeg = 16 + tw('1 140', 700) + tw(' ') + tw('mis de côté');
const hRect = (c, x, y) => `<rect x="${x.toFixed(1)}" y="${(y + 2).toFixed(1)}" width="12" height="12" fill="url(#${c.id}h)" stroke="var(--fin)" stroke-width="1.5"/>`;
const LEGT = '<title>1 140 mis de côté pour le frigo (Frigo −1 800, S35)</title>';
const txtLeg = (c, x, y) => hRect(c, x, y) + `<text x="${(x + 16).toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tfn"><tspan class="tf">1 140</tspan> mis de côté${LEGT}</text>`;
const PB2 = (m) => (m === 'leg' ? 65 : m.r === 29 ? 100 : m.r === 25 ? 90 : m.r === 33 ? 85 : m.r === 20 ? 80 : 60);
// recherche en faisceau (build-rb) : ici une seule forme, le nom entier sur une ligne (la largeur le permet)
function placerFaisceau(c, cadre, obst, liste, { K = 1200, penEntSous = 30, penSorCiel = 12 } = {}) {
  const P = placeur(c, cadre, obst);
  const cands = (m) => {
    const out = [];
    if (m === 'leg') { const ax = c.cx(30), ay = c.Y(C[31]);
      for (let x = cadre.x0; x + wLeg <= cadre.x1; x += 3) { const z = P.zone(x, x + wLeg);
        for (let y = cadre.y0; y + 16 <= cadre.yU; y += 2) { if (!(y + 16 <= z.sky || y >= z.under)) continue; const b = { x, y, w: wLeg, h: 16 }; if (P.hit(b)) continue;
          out.push({ f: 'leg', b, lb: null, cost: Math.hypot(x + wLeg / 2 - ax, (y + 8 - ay) * 1.5) * 0.15 }); } }
      return out; }
    const xa = c.X(m.r), top = haut(c, m), bot = bas(c, m), ent = m.m > 0;
    for (const [f, w, h] of [['nom', wNom(m), 16], ['deux', wSt(m), 32]]) {
    const xs = []; for (let x = xa - w + 3; x <= xa - 3; x += 4) xs.push([x, false]); xs.push([xa + 4, true], [xa - w - 4, true]);
    for (const [x, adj] of xs) { if (x < cadre.x0 || x + w > cadre.x1) continue; const z = P.zone(x, x + w);
      if (adj) for (let y = Math.ceil(Math.min(top, bot) - h / 2); y <= Math.floor(Math.max(top, bot) - h / 2 + 4); y += 1) { const b = { x, y, w, h }; if (y + h > cadre.yU || !(y + h <= z.sky || y >= z.under) || P.hit(b)) continue;
        out.push({ f, b, lb: null, side: y >= z.under ? 'under' : 'sky', cost: 6 + 0.12 * Math.abs(x + w / 2 - xa) + (ent && y >= z.under ? 10 : 0) + (!ent && y + h <= z.sky ? 6 : 0) }); }
      let ns = 0; for (let y = Math.floor(Math.min(z.sky, adj ? top + h / 2 + 6 : top - 2) - h); y >= cadre.y0 && ns < 3; y -= 2) { const b = { x, y, w, h }, ya = adj ? y + h / 2 : y + h, lead = top - ya; if (adj && lead < -6) continue;
        const lb = lead > 6 ? { x: xa - 1, y: ya + (adj ? 0 : 2), w: 2, h: lead - (adj ? 2 : 4) } : null; if (P.hit(b) || (lb && P.hit(lb))) continue;
        ns++; y -= 10; out.push({ f, b, lb, side: 'sky', cost: Math.max(0, lead) + (ent ? 0 : penSorCiel) + 0.12 * Math.abs(x + w / 2 - xa) + (adj ? 4 : 0) }); }
      let nu = 0; for (let y = Math.ceil(Math.max(z.under, adj ? bot - h / 2 - 6 : bot + 2)); y + h <= cadre.yU && nu < 3; y += 2) { const b = { x, y, w, h }, ya = adj ? y + h / 2 : y, lead = ya - bot; if (adj && lead < -6) continue;
        const lb = lead > 6 ? { x: xa - 1, y: bot + 2, w: 2, h: lead - (adj ? 2 : 4) } : null; if (P.hit(b) || (lb && P.hit(lb))) continue;
        nu++; y += 10; out.push({ f, b, lb, side: 'under', cost: Math.max(0, lead) + (ent ? penEntSous : 0) + 0.12 * Math.abs(x + w / 2 - xa) + (adj ? 4 : 0) }); }
    }
    }
    return out; };
  const inter = (a, b, gx, gy) => a.x < b.x + b.w + gx && b.x < a.x + a.w + gx && a.y < b.y + b.h + gy && b.y < a.y + a.h + gy;
  let etats = [{ ch: [], score: 0, cost: 0 }];
  for (const m of liste) { const cs = cands(m), wgt = PB2(m), nx = []; if (process.env.DBG && m !== 'leg' && m.r === 33) { const xa = c.X(33); console.log('fête', c.id, 'cands', cs.length, 'xa', xa.toFixed(0), 'top', haut(c, m).toFixed(0), 'bot', bas(c, m).toFixed(0), 'yB', c.yB, 'C', C.slice(31, 42).join(','), 'L', L.slice(31, 42).join(',')); }
    for (const e of etats) { nx.push({ ch: [...e.ch, null], score: e.score, cost: e.cost });
      for (const q of cs) { let ok = true;
        for (const o of e.ch) { if (!o) continue; if (inter(q.b, o.b, 8, 2) || (q.lb && inter(q.lb, o.b, 0, 0)) || (o.lb && inter(o.lb, q.b, 0, 0))) { ok = false; break; } }
        if (ok) nx.push({ ch: [...e.ch, q], score: e.score + wgt * (q.f === 'deux' ? 0.9 : 1), cost: e.cost + q.cost }); } }
    nx.sort((a, b) => b.score - a.score || a.cost - b.cost); etats = nx.slice(0, K); }
  const best = etats[0]; let svg = ''; const res = [];
  liste.forEach((m, i) => { const q = best.ch[i];
    if (m === 'leg') { if (!q) { res.push('(absent) 1 140 mis de côté'); return; } svg += txtLeg(c, q.b.x, q.b.y); res.push('1 140 mis de côté'); return; }
    if (!q) { res.push('(marque seule) ' + m.n); return; }
    svg += fil(c.X(m.r), q.lb, col(m)) + (q.f === 'deux' ? txtSt(q.b.x, q.b.y, m) : txtNom(q.b.x, q.b.y, m)); res.push((q.f === 'deux' ? '(deux lignes) ' : '') + m.n + ' ' + sg(m.m)); });
  return { svg, res, boxes: best.ch.filter(Boolean).flatMap((q) => (q.lb ? [q.b, q.lb] : [q.b])) };
}
const GRANDS = MV.filter((m) => Math.abs(m.m) >= 900 && m.r > NW);
const LISTE = [mv(29), mv(33), mv(25), mv(20), mv(40), mv(42), mv(38), 'leg', mv(23)]; // la fête tôt : le faisceau la garde
const ICO = (n) => `<svg class="ico"><use href="#i-${n}"></use></svg>`;
const titre = `<div class="q5-t"><button type="button" class="q5-n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24 : détail"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button><span class="d"><button type="button" class="q-per" data-booster="periode" data-pg-periode="13" aria-label="Période : 3 mois, S47 à S${FIN} (6 sem., 6 mois, An)">3 mois${ICO('bas')}</button><button type="button" class="q-pil bad" data-booster="retards" aria-label="2 en retard">${ICO('k15ret')}2</button><button type="button" class="q-pil nu" data-plein aria-label="Plein écran">${ICO('plein')}</button></span></div>`;
// mois en haut de la courbe (loin de la bande) : un trait court et le nom, au-dessus du haut de la courbe
const moisHaut = (c, yb) => mois.filter((m) => m.r > 1 && m.k % 3 === 2).map((m) => `<line x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${yb - 12}" y2="${c.yT}" stroke="var(--line2)" stroke-width="1.5"/><text x="${(c.X(m.r) + 4).toFixed(1)}" y="${yb}" class="t14">${MO[m.k]}</text>`).join('');
const moisBox = (c) => mois.filter((m) => m.r > 1 && m.k % 3 === 2).map((m) => ({ x: c.X(m.r) - 2, y: 30, w: tw(MO[m.k]) + 8, h: 18 }));
// la fenêtre dit ce qu'elle couvre, juste au-dessus de la bande
const fenetre = (c) => `<text x="${(c.X(1) + 8).toFixed(1)}" y="${c.yB - 5}" class="tf">S47 – S${FIN}<title>La bande dessous : S47 à S${FIN}</title></text>`;
const brosse = (c, t = c.yT - 1) => `<div class="q-brosse" data-booster="fenetre-semaines" data-pinceau="corps" aria-label="Fenêtre : S47 à S${FIN}" style="left:${c.X(1).toFixed(1)}px;width:${(c.X(NW + 1) - c.X(1)).toFixed(1)}px;top:${t}px;height:${c.yB - t + 1}px"><i></i><i></i></div>`;
const CAUSES = [mv(29), mv(25), mv(20)];
const carteB = `<div class="rb-carte" role="status" aria-label="Le creux de S24 : ses causes"><div class="rb-ch">S13 → S24 · <b>113</b> à dépenser</div>`
  + CAUSES.slice().reverse().map((m) => `<div class="rb-l"><span class="w">S${sn(m.r)}</span><span class="nm">${m.n}</span><b class="n">${sg(m.m)}</b></div>`).join('')
  + `<div class="rb-l"><span class="w"><i class="hh"></i></span><span class="nm">Mis de côté pour le frigo</span><b class="f">1 140</b></div></div>`;
const CARTE_JS = `var D=document,B=D.body;function pos(){var c=D.querySelector('.rb-carte'),f=D.querySelector('#fh').getBoundingClientRect();c.style.top=(f.bottom+6)+'px';}
D.querySelector('.rb-z').addEventListener('click',function(e){e.stopPropagation();pos();B.classList.toggle('rb-on');});D.addEventListener('click',function(){B.classList.remove('rb-on');});`;
// bande : solde puis mouvement, une colonne par semaine (13), alignée sur la frise
const SEM = Array.from({ length: NW }, (_, k) => { const r = k + 1; return { r, s: sn(r), sol: L[r], mv: r === 1 ? -148 : L[r] - L[r - 1] }; });
const pers = `<svg class="ico rb-pers" aria-hidden="true"><use href="#i-pers"></use></svg>`;
const idee = `<i class="k13-id rb-idee" data-idee-sem="50" role="button" aria-label="Idée du carnet : Bière au sapin"><svg class="ico"><use href="#i-idee"></use></svg></i>`;
const aria = (w) => `S${w.s} : libre en fin de semaine ${fmt(w.sol)} ; mouvement ${sg(w.mv)}${w.s === 50 ? ' ; manque 2 j de présence ; idée du carnet' : ''}`;
const bande = `<div class="fh rb rb-deux" id="fh" data-bande-semaines aria-label="Bande des semaines S47 à S${FIN} : libre et mouvement"><div class="rb-g">${SEM.map((w) =>
  `<button type="button" class="rb-c" data-libre-sem="${w.s}" aria-label="${aria(w)}"><span class="s">${fmt(w.sol)}${w.s === 50 ? pers : ''}</span><span class="m ${w.mv > 0 ? 'p' : 'n'}">${sg(w.mv)}${w.s === 50 ? idee : ''}</span></button>`).join('')}</div></div>`;

function entete(id, ch, sur = false) {
  // ch : hauteur de la courbe. Rangées : titre (0–30), mois (30–46), courbe (48 → 48+ch), 4 px.
  // sur : comme r6b, le titre est posé sur le ciel de la courbe (courbe dès 6 px), les mois en haut du ciel là où il est libre.
  const yT = sur ? 6 : 48, yB = yT + ch, H = yB + 4, c = courbe({ yT, yB, id });
  const tint = `<rect x="${c.X(20).toFixed(1)}" y="${yT}" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${ch}" fill="var(--bad)" opacity=".08"/>`;
  const zone = `<rect class="rb-z" x="${c.X(20).toFixed(1)}" y="${yT}" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${ch}" fill="transparent"/>`;
  const obst = [{ x: c.X(1) - 6, y: 0, w: c.X(NW + 1) - c.X(1) + 12, h: 400 }, dotBox(c)]; let mh;
  let tb = [];
  if (sur) { tb = [{ x: 0, y: 0, w: TW + 18, h: 32 }, { x: VW - CW - 18, y: 0, w: CW + 18, h: 32 }]; obst.push(...tb); }
  else obst.push(...moisBox(c));
  const pl = placerFaisceau(c, { x0: 2, x1: VW - 2, y0: sur ? yT + 1 : 31, yU: yB - 3 }, obst, LISTE); // les noms peuvent monter dans la rangée des mois, entre les mois
  if (sur) { const P = placeur(c, { x0: 0, x1: VW, y0: 0 }, []); const pris = [...tb, ...pl.boxes, { x: c.X(1) - 6, y: c.yT, w: c.X(NW + 1) - c.X(1) + 12, h: 400 }], out = [];
    for (const m of mois.filter((q) => q.r > 1 && q.k % 3 === 2)) { const b = { x: c.X(m.r) - 2, y: yT, w: tw(MO[m.k]) + 8, h: 17 };
      if (pris.some((o) => b.x < o.x + o.w + 4 && o.x < b.x + b.w + 4 && b.y < o.y + o.h && o.y < b.y + b.h)) continue; if (P.zone(b.x, b.x + b.w).sky < b.y + b.h + 2) continue;
      pris.push(b); out.push(`<line x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${yT}" y2="${yT + 16}" stroke="var(--line2)" stroke-width="1.5"/><text x="${(c.X(m.r) + 4).toFixed(1)}" y="${yT + 13}" class="t14">${MO[m.k]}</text>`); }
    mh = out.join(''); }
  else mh = moisHaut(c, 43);
  const svg = `<svg width="${VW}" height="${H}" viewBox="0 0 ${VW} ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse de l'année ; mouvements nommés ; fenêtre S47 à S${FIN}">${c.defs}${tint}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${zone}${pl.svg}${dot(c)}${mh}${fenetre(c)}</svg>`;
  return { H, c, res: pl.res, mois: (mh.match(/class="t14">[^<]*/g) || []).map((t) => t.slice(12)), html: `<header class="qh wq ${id}">${svg}${brosse(c, sur ? 33 : c.yT - 1)}${titre}</header>` };
}
// fine ligne repliée (w2) : le chiffre, la courbe en miniature avec sa fenêtre, les mêmes boutons
function replie() {
  const W = 300, h = 28, c = courbe({ W, pw: W, yT: 2, yB: h - 2, id: 'w2m' });
  let lib = ''; for (let r = T0; r < N; r++) lib += (r === T0 ? 'M' : 'L') + c.X(r).toFixed(1) + ' ' + c.Y(L[r]).toFixed(1) + 'L' + c.X(r + 1).toFixed(1) + ' ' + c.Y(L[r]).toFixed(1);
  const sv = `<svg width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" aria-hidden="true"><path d="${lib}L${c.X(N).toFixed(1)} ${h - 2}L${c.X(T0).toFixed(1)} ${h - 2}Z" fill="var(--area)"/><path d="${lib}" fill="none" stroke="var(--fin)" stroke-width="2"/><rect x="${c.X(1).toFixed(1)}" y="1" width="${(c.X(NW + 1) - c.X(1)).toFixed(1)}" height="${h - 2}" rx="4" fill="color-mix(in srgb,var(--fin) 10%,transparent)" stroke="var(--fin)" stroke-width="1.5"/><circle cx="${c.cx(PB).toFixed(1)}" cy="${c.Y(L[PB]).toFixed(1)}" r="3.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="1.5"/></svg>`;
  return `<div class="w2-pl" aria-hidden="true">${titre.replace('class="q5-t"', 'class="q5-t w2-t"').replace('<span class="d">', `<button type="button" class="w2-sp" aria-label="Remonter à la courbe">${sv}</button><span class="d">`)}</div>`;
}

const CSS_E = fs.readFileSync(path.join(HERE, 'entete-r6b.css'), 'utf8');
const SCRIPT_G = (h) => { const i = h.indexOf('<script>window.GI='); return i; };
function page(n, quoi, e, css, js, avant = '') {
  let h = corps.replace(/<title>[^<]*<\/title>/, `<title>v8 ${n} · paysage 844×390 · ${quoi}</title>`);
  const a = h.indexOf('<header class="gd-hd">'); if (a < 0) throw new Error('gd-hd absent');
  h = h.slice(0, a) + e.html + h.slice(a);
  const fa = h.indexOf('<div class="fh" id="fh">'), fb = h.indexOf('<div class="fb" id="fb">'); if (fa < 0 || fb < fa) throw new Error('fh absent');
  h = h.slice(0, fa) + bande + carteB + h.slice(fb);
  const ci = h.lastIndexOf('</head>');
  h = h.slice(0, ci) + `<style id="v8-entete">\n${CSS_E}\n</style><style id="v8-${n}">\n/* ${n} : ${quoi} */\n.rb-g{grid-template-columns:repeat(${NW},1fr)}\n.qh.wq{margin:0;height:${e.H}px}.wq>svg{position:absolute;left:0;top:0}.wq>.q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}\n${css}\n</style>` + h.slice(ci);
  const SCRIPT = `(function(){var C=window.GI||{},D=document;
if(C.sheet){var p=D.querySelector('.q-pil.bad'),h=D.createElement('div');h.className='gi-sh';h.innerHTML=C.sheet;h.hidden=true;D.body.appendChild(h);
function set(o){h.hidden=!o;p.setAttribute('aria-expanded',o?'true':'false');D.body.classList.toggle('gi-sheet',o);}
p.addEventListener('click',function(){set(h.hidden);});h.addEventListener('click',function(e){if(e.target.closest('.k15-h button'))set(false);});}
function masque(l,o){l.classList.toggle('k15-off',o);l.classList.remove('k14-ouv');var c=l.querySelector('.g2-c');c.setAttribute('aria-expanded','false');
l.querySelectorAll('[data-g2-masque]').forEach(function(b){b.setAttribute('aria-pressed',o?'true':'false');b.setAttribute('aria-label',(o?'Réafficher ':'Masquer ')+l.dataset.nom);});}
D.querySelectorAll('#fb .lane').forEach(function(l){var lt=l.querySelector('.lt'),c=lt.querySelector('.g2-c');
c.addEventListener('click',function(e){e.stopPropagation();if(l.classList.contains('k15-off'))masque(l,false);var o=l.classList.toggle('k14-ouv');c.setAttribute('aria-expanded',o?'true':'false');});
lt.addEventListener('click',function(e){var m=e.target.closest('[data-g2-masque]');if(l.classList.contains('k15-off')){masque(l,false);return;}if(m)masque(l,true);});});
})();`;
  const j = h.lastIndexOf('</body>');
  h = h.slice(0, j) + avant + `<script>window.GI=${JSON.stringify({ sheet })};</script><script>${SCRIPT}</script><script>(function(){${CARTE_JS}${js}})();</script>` + h.slice(j);
  fs.writeFileSync(path.join(HERE, n + '.html'), h);
}
const NOTE = {};
// ---- w1 : tout fixe, aplati : titre, mois, courbe 76 px, bande ; rien ne part au défilement ----
{ const e = entete('w1', 98, true);
  page('w1', 'en-tête fixe, titre posé sur la courbe (98 px) comme r6b, toujours visible', e, `.side{position:sticky;top:0;z-index:13;background:var(--bg)}\n#fh{top:${e.H}px}`, '');
  NOTE.w1 = { H: e.H, noms: e.res, mois: e.mois }; }
// ---- w2 : en-tête moyen (courbe 96 px) qui se replie en une ligne (chiffre, mini-courbe, boutons) au défilement ----
{ const e = entete('w2', 100);
  page('w2', 'en-tête (courbe 100 px) replié en une ligne au défilement', e,
    `.w2-pl{position:fixed;left:0;right:0;top:0;z-index:14;height:44px;background:var(--bg);border-bottom:1px solid var(--line);transform:translateY(-100%);visibility:hidden;transition:transform .18s ease-out}
body.w2-pli .w2-pl{transform:none;visibility:visible}
.w2-pl .q5-t{position:absolute;left:12px;right:12px;top:8px}
.w2-sp{all:unset;display:block;margin:0 auto;height:28px;cursor:pointer}.w2-sp svg{display:block}
body.w2-pli #fh{top:44px}`,
    `var H=${e.H};function f(){B.classList.toggle('w2-pli',scrollY>H-44);}addEventListener('scroll',f,{passive:true});f();
D.querySelector('.w2-sp').addEventListener('click',function(){scrollTo({top:0,behavior:'smooth'});});`, replie());
  NOTE.w2 = { H: e.H, noms: e.res }; }
// ---- w3 : comme en portrait : l'en-tête (courbe 116 px) part avec la page, la bande reste en haut ----
{ const e = entete('w3', 124);
  page('w3', 'en-tête (courbe 124 px) qui part avec la page, la bande reste', e, '', '');
  NOTE.w3 = { H: e.H, noms: e.res }; }
fs.writeFileSync(path.join(TMP, 'w-place.json'), JSON.stringify(NOTE, null, 1));
for (const [k, v] of Object.entries(NOTE)) console.log(k, 'en-tête', v.H, 'px ·', v.noms.join(' | '));
await nav.close();
