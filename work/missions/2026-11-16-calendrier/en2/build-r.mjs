// node en2/build-r.mjs : six en-têtes portrait r1…r6 posés sur en/q5-tout.html (base choisie : q5).
// Remplacés : l'en-tête q5 (dans #lhead) et le contenu de la bande des semaines (#fh, gardée, allégée). Le reste est identique.
// Données : en/q-data.json (C caisse, L libre, MV mouvements) — mêmes chiffres que q5.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), EN = path.join(HERE, '..', 'en');
const BASEF = path.join(EN, 'q5-tout.html'), BASE = fs.readFileSync(BASEF, 'utf8');
const { C, L, MV, mois } = JSON.parse(fs.readFileSync(path.join(EN, 'q-data.json'), 'utf8'));
const N = 53, T0 = 1, PB = 31;
const sn = (r) => (r < 8 ? 46 + r : r - 7);
const fmt = (n) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sg = (n) => (n >= 0 ? '+' : '−') + fmt(n);
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const mv = (r) => MV.find((m) => m.r === r);
const HORS = (m) => m.r > 7; // hors de la fenêtre S47-S52 (ceux-là sont dans la frise, nommés)

// ---------- largeurs mesurées dans la police de la page ----------
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const S = new Set(['frigo ', '1 140', 'loupe', ' ', 'mis de côté']);
for (const m of MV) { S.add(m.n + ' '); S.add(sg(m.m)); }
for (const k of MO) S.add(k);
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pg = await nav.newPage(); await pg.goto(pathToFileURL(BASEF).href); await pg.evaluate(() => document.fonts.ready);
const LW = await pg.evaluate((arr) => { const c = document.createElement('canvas').getContext('2d'); const ff = getComputedStyle(document.body).fontFamily; const o = {};
  for (const s of arr) for (const w of [400, 600, 700]) { c.font = `${w} 14px ${ff}`; o[w + '|' + s] = c.measureText(s).width; } return o; }, [...S]);
await nav.close();
const tw = (s, w = 400) => { const v = LW[w + '|' + s]; if (v == null) throw new Error('largeur inconnue : ' + s); return v; };

// ---------- courbe ----------
function courbe({ W = 366, yT, yB, x0 = 4, pw = W - 8, ymax = 7600, id, poids }) {
  const cum = [0]; for (let r = 0; r < N; r++) cum.push(cum[r] + (poids ? poids(r) : 1));
  const X = (r) => x0 + pw * cum[r] / cum[N], Y = (v) => yT + (yB - yT) * (1 - v / ymax);
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
const haut = (c, m) => c.Y(m.m > 0 ? C[m.r] : C[m.r - 1]); // haut du saut (sur la caisse)
const bas = (c, m) => c.Y(Math.min(L[m.r - 1], L[m.r])); // bas du saut (sur le libre)
const dot = (c) => `<circle cx="${c.cx(PB).toFixed(1)}" cy="${c.Y(L[PB]).toFixed(1)}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`;
const dotBox = (c) => ({ x: c.cx(PB) - 8, y: c.Y(L[PB]) - 8, w: 16, h: 16 });
const tint = (c, ra = 20, rb = PB + 1) => `<rect x="${c.X(ra).toFixed(1)}" y="${c.yT}" width="${(c.X(rb) - c.X(ra)).toFixed(1)}" height="${c.yB - c.yT}" fill="var(--bad)" opacity=".08"/>`;
const moisBas = (c, y) => mois.filter((m) => m.r > 1 && m.k % 3 === 2).map((m) => `<line class="ob" x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${c.yB}" y2="${c.yB + 4}" stroke="var(--line2)" stroke-width="1.5"/><text x="${(c.X(m.r) + 3).toFixed(1)}" y="${y}" class="t14">${MO[m.k]}</text>`).join('');
const moisHaut = (c, y0, saute = (x) => false) => { const out = [], box = []; for (const m of mois.filter((q) => q.r > 1 && q.k % 3 === 2)) { const x = c.X(m.r) + 3; if (saute(x)) continue; out.push(`<line class="ob" x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${y0}" y2="${y0 + 5}" stroke="var(--line2)" stroke-width="1.5"/><text x="${x.toFixed(1)}" y="${y0 + 12}" class="t14">${MO[m.k]}</text>`); box.push({ x: c.X(m.r) - 1, y: y0, w: tw(MO[m.k]) + 5, h: 15 }); } return { svg: out.join(''), box }; };

// ---------- placeur : étiquette posée dans le ciel (au-dessus de la caisse) ou sous le libre, reliée par un fil vertical ----------
function placeur(c, cadre, obst) {
  const pris = obst.map((o) => ({ ...o }));
  const hit = (b) => b.x < cadre.x0 || b.x + b.w > cadre.x1 || b.y < cadre.y0 || pris.some((o) => b.x < o.x + o.w + 6 && o.x < b.x + b.w + 6 && b.y < o.y + o.h + 1 && o.y < b.y + b.h + 1);
  const zone = (xa, xb) => { const r0 = Math.max(T0, c.wk(xa - 1)), r1 = Math.min(N - 1, c.wk(xb + 1)); let mC = -1e9, mL = 1e9; for (let r = r0; r <= r1; r++) { mC = Math.max(mC, C[r]); mL = Math.min(mL, L[r]); } return { sky: c.Y(mC) - 3, under: c.Y(mL) + 3 }; };
  // it : { xa, w, h, top, bot, sides, pen, xs? }
  function poser(it) {
    let best = null; const h = it.h || 16;
    const xs = it.xs ? it.xs.map((x) => ({ x, adj: false })) : (() => { const a = []; for (let x = it.xa - it.w + 3; x <= it.xa - 3; x += 2) a.push({ x, adj: false }); if (!it.cov) a.push({ x: it.xa + 4, adj: true }, { x: it.xa - it.w - 4, adj: true }); return a; })();
    for (const { x: x0, adj } of xs) { const x = Math.max(cadre.x0, Math.min(cadre.x1 - it.w, x0)); if (!adj && (it.xa < x - 1 || it.xa > x + it.w + 1)) continue; if (adj && it.xa > x - 2 && it.xa < x + it.w + 2) continue; const z = zone(x, x + it.w);
      for (const side of it.sides) {
        if (side === 'sky') { for (let y = Math.floor(Math.min(z.sky, (adj ? it.top + h / 2 - 8 : it.top) - 2) - h); y >= cadre.y0; y--) { const b = { x, y, w: it.w, h }, ya = adj ? y + h / 2 : y + h, lead = it.top - ya; const lb = lead > 6 ? { x: it.xa - 1, y: ya + (adj ? 0 : 2), w: 2, h: lead - (adj ? 2 : 4) } : null; if (hit(b) || (lb && hit(lb))) continue;
          const s = lead + (it.pen?.[side] || 0) + 0.12 * Math.abs(x + it.w / 2 - it.xa); if (!best || s < best.s) best = { x, y, side, lb, s, h }; break; } }
        else { for (let y = Math.ceil(Math.max(z.under, (adj ? it.bot - h / 2 + 8 : it.bot) + 2)); y + h <= cadre.yU; y++) { const b = { x, y, w: it.w, h }, ya = adj ? y + h / 2 : y, lead = ya - it.bot; const lb = lead > 6 ? { x: it.xa - 1, y: it.bot + 2, w: 2, h: lead - (adj ? 2 : 4) } : null; if (hit(b) || (lb && hit(lb))) continue;
          const s = lead + (it.pen?.[side] || 0) + 0.12 * Math.abs(x + it.w / 2 - it.xa); if (!best || s < best.s) best = { x, y, side, lb, s, h }; break; } }
      } }
    if (best) { pris.push({ x: best.x, y: best.y, w: it.w, h: best.h }); if (best.lb) pris.push(best.lb); }
    return best;
  }
  return { poser, pris, hit, zone, snap: () => pris.map((o) => ({ ...o })), reset: (sn) => { pris.length = 0; pris.push(...sn.map((o) => ({ ...o }))); } };
}
// légende libre (sans fil) : place libre la plus proche du creux, dans le ciel ou sous le libre
function legende(c, P, w, h = 16, essai = false) { let best = null; const ax = c.cx(30), ay = c.Y(C[31]);
  for (let x = 0; x + w <= 366; x += 2) { const z = P.zone(x, x + w);
    for (let y = 0; y + h <= c.yB - 1; y++) { if (!(y + h <= z.sky || y >= z.under)) continue; const b = { x, y, w, h }; if (P.hit(b)) continue; const d = Math.hypot(x + w / 2 - ax, (y + h / 2 - ay) * 1.5); if (!best || d < best.d) best = { x, y, d }; } }
  if (best && !essai) P.pris.push({ x: best.x, y: best.y, w, h }); return best; }
const fil = (x, lb, colv) => (lb ? `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${lb.y.toFixed(1)}" y2="${(lb.y + lb.h).toFixed(1)}" stroke="var(${colv})" stroke-width="1" stroke-dasharray="2 2"/>` : '');
const wNom = (m) => tw(m.n + ' ') + tw(sg(m.m), 700), wMt = (m) => tw(sg(m.m), 700);
const txtNom = (x, y, m, nom = true) => `<text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tn">${nom ? m.n + ' ' : ''}<tspan class="${m.m > 0 ? 'tp' : 'tm'}">${sg(m.m)}</tspan><title>${m.n} ${sg(m.m)}, S${sn(m.r)}</title></text>`;
const wFrigo = 16 + tw('frigo ') + tw('1 140', 700);
const txtFrigo = (c, x, y) => `<rect x="${x.toFixed(1)}" y="${(y + 2).toFixed(1)}" width="12" height="12" fill="url(#${c.id}h)" stroke="var(--fin)" stroke-width="1.5"/><text x="${(x + 16).toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tfn">frigo <tspan class="tf">1 140</tspan><title>Mis de côté pour le frigo : 1 140</title></text>`;
// nomme une liste de mouvements : nom entier, sinon montant seul, sinon rien (la marque du saut reste)
function nommer(c, P, liste, { penSky = 8, penUnder = 20, montantSeul = true } = {}) {
  let out = ''; const res = [];
  for (const m of liste) {
    if (m === 'frigo') { const w2 = Math.max(16 + tw('frigo '), tw('1 140', 700)), e1 = legende(c, P, wFrigo, 16, true), e2 = legende(c, P, w2, 31, true);
      let b = e1 && (!e2 || e1.d + 40 <= e2.d) ? legende(c, P, wFrigo) : null; if (b) { out += txtFrigo(c, b.x, b.y); res.push('frigo (légende)'); continue; }
      b = e2 ? legende(c, P, w2, 31) : null; if (b) { out += `<rect x="${b.x.toFixed(1)}" y="${(b.y + 2).toFixed(1)}" width="12" height="12" fill="url(#${c.id}h)" stroke="var(--fin)" stroke-width="1.5"/><text x="${(b.x + 16).toFixed(1)}" y="${(b.y + 12).toFixed(1)}" class="tfn">frigo</text><text x="${b.x.toFixed(1)}" y="${(b.y + 28).toFixed(1)}" class="tf">1 140<title>Mis de côté pour le frigo : 1 140</title></text>`; res.push('frigo (légende 2 lignes)'); } else res.push('(absent) frigo'); continue; }
    const xa = c.X(m.r), sides = m.m > 0 ? ['sky', 'under'] : ['under', 'sky'], pen = m.m > 0 ? { under: penUnder } : { sky: penSky };
    let b = P.poser({ xa, w: wNom(m), top: haut(c, m), bot: bas(c, m), sides, pen }), nom = true;
    if (!b && montantSeul) { b = P.poser({ xa, w: wMt(m), top: haut(c, m), bot: bas(c, m), sides, pen }); nom = false; }
    if (b) { out += fil(xa, b.lb, col(m)) + txtNom(b.x, b.y, m, nom); res.push((nom ? m.n : '(montant) ' + m.n) + ' ' + sg(m.m)); } else res.push('(marque) ' + m.n);
  }
  return { svg: out, res };
}

// essais d'ordres (graine fixe) : garde l'ordre qui nomme le plus, pondéré par l'importance (causes du creux et frigo d'abord)
const POIDS = (m) => (m === 'frigo' ? 60 : m.r === 29 ? 100 : m.r === 25 ? 80 : m.r === 20 ? 70 : m.r === 40 ? 50 : m.r === 33 ? 25 : (m.m > 0 ? 3 : 2) + Math.abs(m.m) / 300);
function nommerMieux(c, P, liste, opts, essais = 500) {
  const s0 = P.snap(); let best = null, g = 7;
  const rnd = () => ((g = (g * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < essais; k++) { const ord = k === 0 ? liste.slice() : liste.slice().sort(() => rnd() - 0.5); P.reset(s0); const r = nommer(c, P, ord, opts);
    let sc = 0; ord.forEach((m, i) => { const t = r.res[i]; if (t.startsWith('(absent)') || t.startsWith('(marque)')) return; sc += POIDS(m) * (t.startsWith('(montant)') ? 0.3 : 1); });
    if (!best || sc > best.sc) best = { sc, r, pris: P.snap() }; }
  P.reset(best.pris); return best.r; }
// ---------- pièces de l'en-tête q5 (gardées) ----------
const ICO = (n, extra = '') => `<svg class="ico"${extra}><use href="#i-${n}"></use></svg>`;
const per = () => `<button type="button" class="q-per" data-booster="periode" data-pg-periode="6" aria-label="Période : 6 semaines (3 mois, 6 mois, An)">6 sem.${ICO('bas')}</button>`;
const ret = () => `<button type="button" class="q-pil bad" data-booster="retards" aria-label="2 en retard">${ICO('k15ret')}2</button>`;
const plein = `<button type="button" class="q-pil nu" data-plein aria-label="Plein écran">${ICO('plein')}</button>`;
const nombre = `<button type="button" class="q5-n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24 : détail"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button>`;
const titre = (cls = '') => `<div class="q5-t ${cls}">${nombre}<span class="d">${per()}${ret()}${plein}</span></div>`;
const brosse = (c, top, h, left = 0) => `<div class="q-brosse" data-booster="fenetre-semaines" data-pinceau="corps" aria-label="Fenêtre : S47 à S52" style="left:${(left + c.X(1)).toFixed(1)}px;width:${(c.X(7) - c.X(1)).toFixed(1)}px;top:${top}px;height:${h}px"><i></i><i></i></div>`;
const brosseBox = (c) => ({ x: c.X(1) - 5, y: -50, w: c.X(7) - c.X(1) + 10, h: 400 });

// ---------- bande des semaines (gardée : solde et mouvement de chaque semaine ; sans dates ni mois) ----------
const SEM = [47, 48, 49, 50, 51, 52].map((s, k) => ({ s, sol: L[k + 1], mv: [-148, 120, -20, 988, -56, 486][k] }));
const pers = `<svg class="ico rb-pers" aria-hidden="true"><use href="#i-pers"></use></svg>`;
const idee = `<i class="k13-id rb-idee" data-idee-sem="50" role="button" aria-label="Idée du carnet : Bière au sapin"><svg class="ico"><use href="#i-idee"></use></svg></i>`;
const aria = (w) => `S${w.s} : libre en fin de semaine ${fmt(w.sol)} ; mouvement ${sg(w.mv)}${w.s === 50 ? ' ; manque 2 j de présence ; idée du carnet' : ''}`;
const tipTxt = (w) => `S${w.s} · <b class="${w.mv > 0 ? 'p' : 'n'}">${sg(w.mv)}</b> · libre ${fmt(w.sol)}${w.s === 50 ? ' · manque 2 j' : ''}`;
const bande = {
  // deux chiffres, sans date : solde puis mouvement
  deux: (inv = false) => `<div class="fh rb rb-deux" id="fh" data-bande-semaines aria-label="Bande des semaines : libre et mouvement"><div class="rb-g">${SEM.map((w) => {
    const s = `<span class="s">${fmt(w.sol)}${w.s === 50 ? pers : ''}</span>`, m = `<span class="m ${w.mv > 0 ? 'p' : 'n'}">${sg(w.mv)}${w.s === 50 ? idee : ''}</span>`;
    return `<button type="button" class="rb-c${inv ? ' inv' : ''}" data-libre-sem="${w.s}" aria-label="${aria(w)}">${inv ? m + s : s + m}</button>`; }).join('')}</div></div>`,
  // une ligne : le solde, le mouvement en jauge sous le chiffre ; le chiffre du mouvement au toucher
  jauge: () => `<div class="fh rb rb-jauge" id="fh" data-bande-semaines aria-label="Bande des semaines : libre, mouvement en jauge"><div class="rb-g">${SEM.map((w) =>
    `<button type="button" class="rb-c" data-libre-sem="${w.s}" data-tip="${tipTxt(w).replace(/"/g, '&quot;')}" aria-label="${aria(w)}"><span class="s">${fmt(w.sol)}${w.s === 50 ? pers + idee : ''}</span><i class="j ${w.mv > 0 ? 'p' : 'n'}" style="width:${Math.round(4 + 44 * Math.abs(w.mv) / 988)}px"></i></button>`).join('')}</div></div>`,
  // une ligne : le mouvement seul ; le solde au toucher
  mvt: () => `<div class="fh rb rb-mvt" id="fh" data-bande-semaines aria-label="Bande des semaines : mouvement ; libre au toucher"><div class="rb-g">${SEM.map((w) =>
    `<button type="button" class="rb-c" data-libre-sem="${w.s}" data-tip="${tipTxt(w).replace(/"/g, '&quot;')}" aria-label="${aria(w)}"><span class="m ${w.mv > 0 ? 'p' : 'n'}">${sg(w.mv)}${w.s === 50 ? pers + idee : ''}</span></button>`).join('')}</div></div>`,
};
const CSS_R = `
.qh .tfn{font-size:14px;font-weight:400;fill:var(--fin);paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.qh .t14{stroke-width:4px;stroke-linejoin:round}
#fh.rb{height:auto!important;padding:0 12px}#fh.rb .fg{display:none}
.rb-g{display:grid;grid-template-columns:repeat(6,1fr)}
.rb-c{all:unset;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:14px;line-height:16px;font-variant-numeric:tabular-nums;white-space:nowrap;cursor:pointer;color:var(--ink);min-height:32px;position:relative}
.rb-c .s{font-weight:600;display:inline-flex;align-items:center}.rb-c .m{font-weight:700;display:inline-flex;align-items:center}.rb-c .p{color:var(--ok)}.rb-c .n{color:var(--bad)}
.rb-c .ico{width:14px;height:14px;stroke-width:2.2}.rb-pers{color:var(--bad);margin-left:1px}.rb-idee{display:inline-flex;color:var(--att);margin-left:1px}.rb-idee .ico{width:14px;height:14px}
.rb-c.inv .s{font-weight:400;color:var(--mut)}
.rb-jauge .rb-c{min-height:22px;gap:2px}.rb-jauge .j{display:block;height:3px;border-radius:2px}.rb-jauge .j.p{background:var(--ok)}.rb-jauge .j.n{background:var(--bad)}
.rb-mvt .rb-c{min-height:22px}
.rb-on{background:var(--s2);border-radius:6px}
.r-tip{position:fixed;z-index:40;background:var(--sheet);color:var(--ink);border:1.5px solid var(--line2);border-radius:10px;padding:5px 10px;font-size:14px;line-height:18px;white-space:nowrap;box-shadow:0 6px 16px -6px rgba(0,0,0,.35);font-variant-numeric:tabular-nums}
.r-tip .p{color:var(--ok)}.r-tip .n{color:var(--bad)}`;
const TIP_JS = `var D=document;function off(){var t=D.querySelector('.r-tip');if(t)t.remove();D.querySelectorAll('.rb-on').forEach(function(e){e.classList.remove('rb-on')});}
D.querySelectorAll('#fh [data-tip]').forEach(function(b){b.addEventListener('click',function(ev){ev.stopPropagation();var was=b.classList.contains('rb-on');off();if(was)return;b.classList.add('rb-on');
var t=D.createElement('div');t.className='r-tip';t.setAttribute('role','status');t.innerHTML=b.dataset.tip;D.body.appendChild(t);var r=b.getBoundingClientRect(),f=D.querySelector('#fh').getBoundingClientRect();
t.style.left=Math.max(8,Math.min(innerWidth-8-t.offsetWidth,(r.left+r.right)/2-t.offsetWidth/2))+'px';t.style.top=(f.bottom+6)+'px';});});D.addEventListener('click',off);`;

function page(n, quoi, css, header, band, js = '') {
  let h = BASE.replace(/<title>[^<]*<\/title>/, `<title>${n} · ${quoi} (base q5-tout)</title>`);
  const a = h.indexOf('<header class="qh q5">'), b = h.indexOf('</header>', a) + 9; if (a < 0) throw new Error('q5 absent');
  h = h.slice(0, a) + header + h.slice(b);
  const fa = h.indexOf('<div class="fh" id="fh">'), fb = h.indexOf('<div class="fb" id="fb">'); if (fa < 0 || fb < fa) throw new Error('fh absent');
  h = h.slice(0, fa) + band + h.slice(fb);
  const i = h.indexOf('</style>'); h = h.slice(0, i) + `\n/* ${n} : ${quoi} */\n` + CSS_R + '\n' + css + '\n' + h.slice(i);
  const j = h.lastIndexOf('</body>'); h = h.slice(0, j) + (js ? `<script>(function(){${js}})();</script>` : '') + h.slice(j);
  fs.writeFileSync(path.join(HERE, n + '.html'), h);
}
const NOTE = {};
const CAUSES = [mv(29), mv(25), mv(20)];
const GRANDS = MV.filter((m) => Math.abs(m.m) >= 900 && HORS(m));

// ---------- r1 : les noms dans les vides — chaque grand mouvement nommé en entier, posé dans le ciel ou sous le libre ----------
{
  const H = 124, c = courbe({ yT: 4, yB: 106, id: 'r1' });
  const P = placeur(c, { x0: 0, x1: 366, y0: 0, yU: c.yB - 1 }, [brosseBox(c), dotBox(c)]);
  const liste = ['frigo', ...CAUSES, mv(40), mv(42), mv(33), mv(23), mv(38)];
  const nm = nommerMieux(c, P, liste);
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse sur l'année ; mouvements nommés">${c.defs}${tint(c)}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${nm.svg}${dot(c)}${moisBas(c, 120)}</svg>`;
  page('r1', 'les noms dans les vides', `.r1-g{position:relative;height:${H}px}.r1-g>svg{position:absolute;left:0;top:0}`,
    `<header class="qh r1">${titre()}<div class="r1-g">${svg}${brosse(c, c.yT - 2, c.yB - c.yT + 3)}</div></header>`, bande.deux());
  NOTE.r1 = nm.res;
}

// ---------- r2 : la rive basse — les sorties nommées sous la courbe, en escalier ; les entrées dans le ciel ----------
{
  const H = 135, yB = 100, c = courbe({ yT: 2, yB, id: 'r2' });
  const mh = moisHaut(c, 2, (x) => x < c.X(7) + 6);
  const P = placeur(c, { x0: 0, x1: 366, y0: 0, yU: yB - 1 }, [brosseBox(c), dotBox(c), ...mh.box]);
  const ent = nommerMieux(c, P, [mv(40), mv(33), mv(23), mv(38)], { penUnder: 99 });
  // rive basse : deux rangs sous la ligne du zéro ; fil vertical depuis le bas du saut
  // toutes les combinaisons (rang × côté) sont essayées : le plus de noms posés, puis les fils les plus courts
  const rangs = [yB + 3, yB + 19];
  const R = [...CAUSES, 'frigo', mv(42)].map((m) => { const fr = m === 'frigo', xa = fr ? c.cx(30) : c.X(m.r), w = fr ? wFrigo : wNom(m), y0 = fr ? c.Y(L[31]) + 2 : bas(c, m) + 2;
    const opts = [null]; for (const y of rangs) for (const x of [xa + 4, xa - w - 4, xa - w / 2]) { if (x < 0 || x + w > 366) continue; const cov = x < xa && xa < x + w, fy = cov ? y - 1 : y + 8; opts.push({ x, y, w, h: 16, fy, lb: { x: xa - 1, y: y0, w: 2, h: fy - y0 } }); }
    return { m, fr, xa, y0, opts }; });
  const inter = (a, b, g = 0) => a.x < b.x + b.w + g && b.x < a.x + a.w + g && a.y < b.y + b.h && b.y < a.y + a.h;
  let best = null;
  (function rec(i, pris, n, cout) { if (i === R.length) { if (!best || n > best.n || (n === best.n && cout < best.cout)) best = { n, cout, pris: pris.slice() }; return; }
    for (const o of R[i].opts) { if (o && pris.some((p) => p && (inter(o, p, 6) || inter(o.lb, p) || inter(p.lb, o)))) continue; pris.push(o); rec(i + 1, pris, n + (o ? 1 : 0), cout + (o ? o.fy - R[i].y0 + Math.abs(o.x + o.w / 2 - R[i].xa) * 0.1 : 0)); pris.pop(); } })(0, [], 0, 0);
  let rive = ''; const resR = [];
  R.forEach((it, i) => { const o = best.pris[i]; if (!o) { resR.push('(absent) ' + (it.fr ? 'frigo' : it.m.n)); return; } const cv = it.fr ? '--fin' : col(it.m);
    rive += `<line x1="${it.xa.toFixed(1)}" x2="${it.xa.toFixed(1)}" y1="${it.y0.toFixed(1)}" y2="${o.fy.toFixed(1)}" stroke="var(${cv})" stroke-width="1" stroke-dasharray="2 2"/>` + (it.fr ? txtFrigo(c, o.x, o.y) : txtNom(o.x, o.y, it.m));
    resR.push((it.fr ? 'frigo' : it.m.n) + ' (rive)'); });
  const ciel = nommer(c, P, R.filter((it, i) => !best.pris[i] && !it.fr).map((it) => it.m), { penSky: 0 }); rive += ciel.svg; resR.push(...ciel.res.map((x) => x + ' (ciel)'));
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse ; entrées nommées au-dessus, sorties sous la courbe" style="overflow:visible">${c.defs}${tint(c)}${c.fond}${mh.svg}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${ent.svg}${rive}${dot(c)}</svg>`;
  page('r2', 'la rive basse', `.r2-g{position:relative;height:${H}px}.r2-g>svg{position:absolute;left:0;top:0}`,
    `<header class="qh r2">${titre()}<div class="r2-g">${svg}${brosse(c, 18, yB - 16)}</div></header>`, bande.jauge(), TIP_JS);
  NOTE.r2 = [...ent.res, ...resR];
}

// ---------- r3 : tout au doigt — la plus grande courbe, des montants seuls ; un toucher nomme ----------
{
  const H = 124, yB = 113, c = courbe({ yT: 2, yB, id: 'r3' });
  const mh = moisHaut(c, 2, (x) => x < c.X(7) + 6);
  const P = placeur(c, { x0: 0, x1: 366, y0: 0, yU: yB - 1 }, [brosseBox(c), dotBox(c), ...mh.box]);
  let lab = ''; const res = [];
  for (const m of [...CAUSES, 'frigo', ...GRANDS.filter((q) => !CAUSES.includes(q))]) {
    if (m === 'frigo') { const r = nommer(c, P, ['frigo']); lab += r.svg; res.push(...r.res); continue; }
    const xa = c.X(m.r), b = P.poser({ xa, w: wMt(m), top: haut(c, m), bot: bas(c, m), sides: m.m > 0 ? ['sky', 'under'] : ['under', 'sky'], pen: m.m > 0 ? { under: 20 } : { sky: 4 } });
    if (b) { lab += fil(xa, b.lb, col(m)) + `<g class="r3-t" data-r="${m.r}">${txtNom(b.x, b.y, m, false)}</g>`; res.push('montant ' + m.n); } else res.push('(marque) ' + m.n);
  }
  // éventail : la fenêtre de la courbe s'ouvre sur les six colonnes de la bande
  const fan = `<path d="M${c.X(1).toFixed(1)} ${yB}L0 ${H}L366 ${H}L${c.X(7).toFixed(1)} ${yB}Z" fill="var(--fin)" opacity=".10"/><path d="M${c.X(1).toFixed(1)} ${yB}L0 ${H}M${c.X(7).toFixed(1)} ${yB}L366 ${H}" stroke="var(--fin)" stroke-width="1" opacity=".55" fill="none"/>`;
  const zone = `<rect class="r3-z" x="${c.X(20).toFixed(1)}" y="${c.yT}" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${yB - c.yT}" fill="transparent"/>`;
  const curseur = `<g class="r3-cur"><line x1="${c.cx(29).toFixed(1)}" x2="${c.cx(29).toFixed(1)}" y1="${(c.Y(C[28]) + 2).toFixed(1)}" y2="${yB}" stroke="var(--ink)" stroke-width="1.5"/><circle cx="${c.cx(29).toFixed(1)}" cy="${c.Y(L[29]).toFixed(1)}" r="5" fill="var(--bad)" stroke="var(--halo)" stroke-width="2"/></g>`;
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse ; toucher la courbe nomme les mouvements">${c.defs}${tint(c)}${c.fond}${mh.svg}${c.traits}${GRANDS.map((m) => jump(c, m, 4)).join('')}${lab}${dot(c)}${fan}${curseur}${zone}</svg>`;
  const carte = `<div class="r3-carte" role="status" aria-label="Le creux de S24 : ses causes"><div class="r3-h">S13 → S24 · <b>113</b> à dépenser</div>`
    + CAUSES.slice().reverse().map((m) => `<div class="r3-l"><span class="w">S${sn(m.r)}</span><span class="nm">${m.n}</span><b class="n">${sg(m.m)}</b></div>`).join('')
    + `<div class="r3-l"><span class="w"><i class="hh"></i></span><span class="nm">Frigo, mis de côté</span><b class="f">1 140</b></div></div>`;
  page('r3', 'tout au doigt', `.r3-g{position:relative;height:${H}px}.r3-g>svg{position:absolute;left:0;top:0}.r3-z{cursor:pointer}
.r3-cur{display:none}.r3-on .r3-cur{display:inline}.r3-carte{display:none;position:fixed;left:96px;z-index:40;background:var(--sheet);color:var(--ink);border:1.5px solid var(--line2);border-radius:12px;padding:6px 10px 7px;font-size:14px;line-height:20px;box-shadow:0 8px 20px -8px rgba(0,0,0,.4);font-variant-numeric:tabular-nums;min-width:230px}
.r3-on .r3-carte{display:block}.r3-h{color:var(--mut);margin-bottom:2px}.r3-h b{color:var(--fin)}.r3-l{display:grid;grid-template-columns:34px 1fr auto;gap:6px;white-space:nowrap}.r3-l .w{color:var(--mut)}.r3-l .n{color:var(--bad)}.r3-l .f{color:var(--fin)}
.r3-l .hh{display:inline-block;width:12px;height:12px;margin-right:4px;vertical-align:-1px;border:1.5px solid var(--fin);background:repeating-linear-gradient(45deg,var(--fin) 0 2px,transparent 2px 5px)}
#fh.rb-fan{border-top:0}`,
    `<header class="qh r3">${titre()}<div class="r3-g">${svg}${brosse(c, 18, yB - 16)}</div></header>`, bande.deux().replace('class="fh rb rb-deux"', 'class="fh rb rb-deux rb-fan"') + carte,
    `var D=document,B=D.body;function pos(){var c=D.querySelector('.r3-carte'),f=D.querySelector('#fh').getBoundingClientRect();c.style.top=(f.bottom+6)+'px';}
D.querySelector('.r3-z').addEventListener('click',function(e){e.stopPropagation();pos();B.classList.toggle('r3-on');});D.addEventListener('click',function(){B.classList.remove('r3-on');});`);
  NOTE.r3 = res;
}

// ---------- r4 : le genre se voit — pastille de genre (couleurs des rangées) sur chaque mouvement, nom entier à côté ----------
{
  const H = 124, c = courbe({ yT: 4, yB: 106, id: 'r4' });
  const P = placeur(c, { x0: 0, x1: 366, y0: 0, yU: c.yB - 1 }, [brosseBox(c), dotBox(c)]);
  const ICG = { achat: 'k17cart', evenement: 'fete', vente: 'k17bout', renovation: 'outil', charge: 'doc' };
  const pastille = (cx, cy, m) => `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="8.5" fill="var(--e-${m.t})" stroke="var(--halo)" stroke-width="1.5"/><use href="#i-${ICG[m.t]}" x="${(cx - 6).toFixed(1)}" y="${(cy - 6).toFixed(1)}" width="12" height="12" fill="none" stroke="var(--bg)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  // la pastille remplace le trait du saut : posée au milieu du saut, sur la courbe ; le nom entier est posé à côté, dans le vide
  const disc = []; for (const m of GRANDS) { const x = c.X(m.r), a = c.Y(C[m.r - 1]), b = c.Y(C[m.r]); const ys = [(a + b) / 2, Math.min(a, b) - 4, Math.max(a, b) + 4, Math.min(a, b) - 12, Math.max(a, b) + 12]; const y = ys.find((y) => disc.every((d) => Math.hypot(d.x - x, d.y - y) >= 19)) ?? ys[0]; disc.push({ m, x, y }); }
  for (const d of disc) P.pris.push({ x: d.x - 10, y: d.y - 10, w: 20, h: 20 });
  const nm = nommerMieux(c, P, ['frigo', ...CAUSES, mv(40), mv(42), mv(33), mv(23), mv(38)]);
  let out = nm.svg + disc.map((d) => pastille(d.x, d.y, d.m)).join(''); const res = nm.res;
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse ; mouvements avec leur genre">${c.defs}${tint(c)}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 2.5)).join('')}${out}${dot(c)}${moisBas(c, 120)}</svg>`;
  page('r4', 'le genre se voit', `.r4-g{position:relative;height:${H}px}.r4-g>svg{position:absolute;left:0;top:0}`,
    `<header class="qh r4">${titre()}<div class="r4-g">${svg}${brosse(c, c.yT - 2, c.yB - c.yT + 3)}</div></header>`, bande.deux(true));
  NOTE.r4 = res;
}

// ---------- r5 : la loupe sur le creux — S11 à S26 élargis pour nommer ses causes sur leurs sauts ----------
{
  const H = 136, c = courbe({ yT: 4, yB: 118, id: 'r5', poids: (r) => (r >= 18 && r <= 33 ? 2.4 : 1) });
  const xl = c.X(18), xr = c.X(34);
  const P = placeur(c, { x0: 0, x1: 366, y0: 0, yU: c.yB - 1 }, [brosseBox(c), dotBox(c)]);
  const loupe = `<rect x="${xl.toFixed(1)}" y="${c.yT}" width="${(xr - xl).toFixed(1)}" height="${c.yB - c.yT}" fill="var(--bad)" opacity=".07"/><path d="M${xl.toFixed(1)} ${c.yB + 7}V${c.yB + 1}H${xr.toFixed(1)}V${c.yB + 7}" fill="none" stroke="var(--bad)" stroke-width="1.5"/>`;
  const nm = nommerMieux(c, P, [...CAUSES, mv(23), mv(33), mv(40), mv(42), mv(38), 'frigo']);
  // semaines de la loupe : graduation fine sous l'axe (on voit qu'elles sont plus larges)
  let grad = ''; for (let r = 1; r < N; r++) { const big = r >= 18 && r <= 33; grad += `<line x1="${c.X(r).toFixed(1)}" x2="${c.X(r).toFixed(1)}" y1="${c.yB}" y2="${c.yB + (big ? 3 : 2)}" stroke="var(--line2)" stroke-width="1"/>`; }
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse ; S11 à S26 en loupe">${c.defs}${loupe}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${nm.svg}${dot(c)}${grad}${moisBas(c, 132)}</svg>`;
  page('r5', 'la loupe sur le creux', `.r5-g{position:relative;height:${H}px}.r5-g>svg{position:absolute;left:0;top:0}`,
    `<header class="qh r5">${titre()}<div class="r5-g">${svg}${brosse(c, c.yT - 2, c.yB - c.yT + 3)}</div></header>`, bande.mvt(), TIP_JS);
  NOTE.r5 = nm.res;
}

// ---------- r6 : bord à bord — l'en-tête dans le ciel de la courbe, plus de ligne de titre ----------
{
  const H = 152, yB = 136, c = courbe({ W: 390, x0: 0, pw: 390, yT: 2, yB, ymax: 9500, id: 'r6' });
  const P = placeur(c, { x0: 2, x1: 388, y0: 0, yU: yB - 1 }, [brosseBox(c), dotBox(c), { x: 0, y: 0, w: 214, h: 30 }, { x: 234, y: 0, w: 156, h: 30 }]);
  const nm = nommerMieux(c, P, ['frigo', ...CAUSES, mv(40), mv(42), mv(33), mv(23), mv(38)]);
  const svg = `<svg width="390" height="${H}" viewBox="0 0 390 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse, bord à bord">${c.defs}${tint(c)}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${nm.svg}${dot(c)}${moisBas(c, 150)}</svg>`;
  page('r6', 'bord à bord, l\'en-tête dans le ciel', `.qh.r6{margin:0;height:${H}px}.r6>svg{position:absolute;left:0;top:0}.r6 .q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}`,
    `<header class="qh r6">${svg}${brosse(c, 32, yB - 31)}${titre()}</header>`, bande.deux());
  NOTE.r6 = nm.res;
}
fs.writeFileSync(path.join(HERE, 'r-place.json'), JSON.stringify(NOTE, null, 1));
console.log('r1…r6 écrits'); for (const [k, v] of Object.entries(NOTE)) console.log(k, v.join(' | '));
