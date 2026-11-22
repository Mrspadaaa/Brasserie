// node en2/build-rb.mjs : passe b (corrections du critique, 16.11 soir) : r6b, r2b, r5b sur en/q5-tout.html. Aides reprises de build-r.mjs.
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
// ================= corrections (passe b) =================
// mots mesurés en plus (noms seuls, pour les étiquettes en deux lignes)
const nav2 = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pg2 = await nav2.newPage(); await pg2.goto(pathToFileURL(BASEF).href); await pg2.evaluate(() => document.fonts.ready);
Object.assign(LW, await pg2.evaluate((arr) => { const c = document.createElement('canvas').getContext('2d'); const ff = getComputedStyle(document.body).fontFamily; const o = {};
  for (const s of arr) for (const w of [400, 700]) { c.font = `${w} 14px ${ff}`; o[w + '|' + s] = c.measureText(s).width; } return o; }, [...MV.map((m) => m.n), 'dès ', 'S47', 'loupe ', '×2,4', 'mars', 'Fête de', 'village']));
await nav2.close();
// légende de la hachure : « 1 140 mis de côté » (le frigo à payer en S35 se lit à part : « Frigo −1 800 »)
const wLeg = 16 + tw('1 140', 700) + tw(' ') + tw('mis de côté'), wLeg2 = Math.max(16 + tw('1 140', 700), tw('mis de côté'));
const hRect = (c, x, y) => `<rect x="${x.toFixed(1)}" y="${(y + 2).toFixed(1)}" width="12" height="12" fill="url(#${c.id}h)" stroke="var(--fin)" stroke-width="1.5"/>`;
const LEGT = '<title>1 140 mis de côté pour le frigo (Frigo −1 800, S35)</title>';
const txtLeg = (c, x, y) => hRect(c, x, y) + `<text x="${(x + 16).toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tfn"><tspan class="tf">1 140</tspan> mis de côté${LEGT}</text>`;
const txtLeg2 = (c, x, y) => hRect(c, x, y) + `<text x="${(x + 16).toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tf">1 140<tspan x="${x.toFixed(1)}" dy="16" class="tfn">mis de côté</tspan>${LEGT}</text>`;
// étiquette en deux lignes : le nom entier dessus, le montant dessous
const wSt = (m) => Math.max(tw(m.n, 400), wMt(m));
const txtSt = (x, y, m) => `<text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tn">${m.n}<tspan x="${x.toFixed(1)}" dy="16" class="${m.m > 0 ? 'tp' : 'tm'}">${sg(m.m)}</tspan><title>${m.n} ${sg(m.m)}, S${sn(m.r)}</title></text>`;
// nomme : nom entier sur une ligne, sinon en deux lignes, sinon le montant seul
function nommerB(c, P, liste, { penSky = 8, penUnder = 20 } = {}) {
  let out = ''; const res = [];
  for (const m of liste) {
    if (m === 'leg') { let b = legende(c, P, wLeg, 16, true), b2 = legende(c, P, wLeg2, 31, true);
      if (b && (!b2 || b.d <= b2.d + 40)) { b = legende(c, P, wLeg); out += txtLeg(c, b.x, b.y); res.push('leg'); }
      else if (b2) { b2 = legende(c, P, wLeg2, 31); out += txtLeg2(c, b2.x, b2.y); res.push('leg (2 lignes)'); } else res.push('(absent) leg');
      continue; }
    const xa = c.X(m.r), sides = m.m > 0 ? ['sky', 'under'] : ['under', 'sky'], pen = m.m > 0 ? { under: penUnder } : { sky: penSky };
    let b = P.poser({ xa, w: wNom(m), top: haut(c, m), bot: bas(c, m), sides, pen }), f = 'nom';
    if (!b) { b = P.poser({ xa, w: wSt(m), h: 32, top: haut(c, m), bot: bas(c, m), sides, pen }); f = 'deux'; }
    if (!b) { b = P.poser({ xa, w: wMt(m), top: haut(c, m), bot: bas(c, m), sides, pen }); f = 'montant'; }
    if (b) { out += fil(xa, b.lb, col(m)) + (f === 'deux' ? txtSt(b.x, b.y, m) : txtNom(b.x, b.y, m, f === 'nom')); res.push((f === 'nom' ? '' : '(' + f + ') ') + m.n + ' ' + sg(m.m)); } else res.push('(marque) ' + m.n);
  }
  return { svg: out, res };
}
const PB2 = (m) => (m === 'leg' ? 65 : m.r === 29 ? 100 : m.r === 25 ? 90 : m.r === 20 ? 80 : [40, 33, 38, 23, 42].includes(m.r) ? 60 : 3);
function nommerMieuxB(c, P, liste, opts, essais = 700) {
  const s0 = P.snap(); let best = null, g = 11;
  const rnd = () => ((g = (g * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < essais; k++) { const ord = k === 0 ? liste.slice() : liste.slice().sort(() => rnd() - 0.5); P.reset(s0); const r = nommerB(c, P, ord, opts);
    let sc = 0; ord.forEach((m, i) => { const t = r.res[i]; if (t.startsWith('(absent)') || t.startsWith('(marque)')) return; sc += PB2(m) * (t.startsWith('(montant)') ? 0.25 : t.startsWith('(deux)') || t.includes('2 lignes') ? 0.9 : 1); });
    if (!best || sc > best.sc) best = { sc, r, pris: P.snap() }; }
  P.reset(best.pris); return best.r; }

// placement global (recherche en faisceau) : chaque mouvement essaie toutes les places valides (ciel ou sous le libre ;
// nom entier, deux lignes, montant), on garde les K meilleurs ensembles : le plus de noms entiers, puis les fils les plus courts.
function placerFaisceau(c, cadre, obst, liste, { K = 900, penEntSous = 30, penSorCiel = 12, legZone = null } = {}) {
  const P = placeur(c, cadre, obst);
  const cands = (m) => {
    const out = [];
    if (m === 'leg') { const ax = c.cx(30), ay = c.Y(C[31]);
      for (const [f, w, h] of [['leg', wLeg, 16], ['leg2', wLeg2, 31]]) for (let x = cadre.x0; x + w <= cadre.x1; x += 3) { if (legZone && (x < legZone[0] || x + w > legZone[1])) continue; const z = P.zone(x, x + w);
        for (let y = cadre.y0; y + h <= cadre.yU; y += 2) { if (!(y + h <= z.sky || y >= z.under)) continue; const b = { x, y, w, h }; if (P.hit(b)) continue;
          out.push({ f, b, lb: null, cost: Math.hypot(x + w / 2 - ax, (y + h / 2 - ay) * 1.5) * 0.15 + (f === 'leg2' ? 6 : 0) }); } }
      return out; }
    const xa = c.X(m.r), top = haut(c, m), bot = bas(c, m), ent = m.m > 0;
    for (const [f, w, h] of [['nom', wNom(m), 16], ['deux', wSt(m), 32], ['montant', wMt(m), 16]]) {
      const xs = []; for (let x = xa - w + 3; x <= xa - 3; x += 5) xs.push([x, false]); xs.push([xa + 4, true], [xa - w - 4, true]);
      for (const [x, adj] of xs) { if (x < cadre.x0 || x + w > cadre.x1) continue; const z = P.zone(x, x + w);
        let ns = 0; for (let y = Math.floor(Math.min(z.sky, adj ? top + h / 2 + 6 : top - 2) - h); y >= cadre.y0 && ns < 2; y -= 2) { const b = { x, y, w, h }, ya = adj ? y + h / 2 : y + h, lead = top - ya; if (adj && lead < -6) continue;
          const lb = lead > 6 ? { x: xa - 1, y: ya + (adj ? 0 : 2), w: 2, h: lead - (adj ? 2 : 4) } : null; if (P.hit(b) || (lb && P.hit(lb))) continue;
          ns++; y -= 14; out.push({ f, b, lb, side: 'sky', cost: Math.max(0, lead) + (ent ? 0 : penSorCiel) + 0.12 * Math.abs(x + w / 2 - xa) + (adj ? 4 : 0) }); }
        let nu = 0; for (let y = Math.ceil(Math.max(z.under, adj ? bot - h / 2 - 6 : bot + 2)); y + h <= cadre.yU && nu < 2; y += 2) { const b = { x, y, w, h }, ya = adj ? y + h / 2 : y, lead = ya - bot; if (adj && lead < -6) continue;
          const lb = lead > 6 ? { x: xa - 1, y: bot + 2, w: 2, h: lead - (adj ? 2 : 4) } : null; if (P.hit(b) || (lb && P.hit(lb))) continue;
          nu++; y += 14; out.push({ f, b, lb, side: 'under', cost: Math.max(0, lead) + (ent ? penEntSous : 0) + 0.12 * Math.abs(x + w / 2 - xa) + (adj ? 4 : 0) }); }
      } }
    return out; };
  const FAC = { nom: 1, deux: 0.9, montant: 0.25, leg: 1, leg2: 0.95 };
  const inter = (a, b, gx, gy) => a.x < b.x + b.w + gx && b.x < a.x + a.w + gx && a.y < b.y + b.h + gy && b.y < a.y + a.h + gy;
  let etats = [{ ch: [], score: 0, cost: 0 }];
  for (const m of liste) { const cs = cands(m), wgt = PB2(m), nx = [];
    for (const e of etats) { nx.push({ ch: [...e.ch, null], score: e.score, cost: e.cost });
      for (const q of cs) { let ok = true;
        for (const o of e.ch) { if (!o) continue; if (inter(q.b, o.b, 6, 1) || (q.lb && inter(q.lb, o.b, 0, 0)) || (o.lb && inter(o.lb, q.b, 0, 0))) { ok = false; break; } }
        if (ok) nx.push({ ch: [...e.ch, q], score: e.score + wgt * FAC[q.f], cost: e.cost + q.cost }); } }
    nx.sort((a, b) => b.score - a.score || a.cost - b.cost); etats = nx.slice(0, K); }
  const best = etats[0]; let svg = ''; const res = [];
  liste.forEach((m, i) => { const q = best.ch[i];
    if (m === 'leg') { if (!q) { res.push('(absent) leg'); return; } svg += q.f === 'leg' ? txtLeg(c, q.b.x, q.b.y) : txtLeg2(c, q.b.x, q.b.y); res.push(q.f === 'leg' ? 'leg' : 'leg (2 lignes)'); return; }
    if (!q) { res.push('(marque) ' + m.n); return; }
    svg += fil(c.X(m.r), q.lb, col(m)) + (q.f === 'deux' ? txtSt(q.b.x, q.b.y, m) : txtNom(q.b.x, q.b.y, m, q.f === 'nom'));
    res.push((q.f === 'nom' ? '' : '(' + q.f + ') ') + m.n + ' ' + sg(m.m) + (q.side === 'under' && m.m > 0 ? ' [sous]' : q.side === 'sky' && m.m < 0 ? ' [ciel]' : '')); });
  return { svg, res };
}
// repère de semaine : « dès S47 » (une ligne, sous la fenêtre) ; les mois de l'axe sans « déc. » qu'il recouvrirait
const wDes = tw('dès ') + tw('S47', 700);
const des = (x, y) => `<text x="${x.toFixed(1)}" y="${y}" class="t14">dès <tspan class="rb-s47">S47</tspan><title>La bande dessous : S47 à S52</title></text>`;
const moisBasB = (c, y) => mois.filter((m) => m.r > 1 && m.k % 3 === 2 && m.k !== 11).map((m) => `<line class="ob" x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${c.yB}" y2="${c.yB + 4}" stroke="var(--line2)" stroke-width="1.5"/><text x="${(c.X(m.r) + 3).toFixed(1)}" y="${y}" class="t14">${MO[m.k]}</text>`).join('') + des(2, y);
// carte du creux au toucher (greffe de r3)
const carteB = `<div class="rb-carte" role="status" aria-label="Le creux de S24 : ses causes"><div class="rb-ch">S13 → S24 · <b>113</b> à dépenser</div>`
  + CAUSES.slice().reverse().map((m) => `<div class="rb-l"><span class="w">S${sn(m.r)}</span><span class="nm">${m.n}</span><b class="n">${sg(m.m)}</b></div>`).join('')
  + `<div class="rb-l"><span class="w"><i class="hh"></i></span><span class="nm">Mis de côté pour le frigo</span><b class="f">1 140</b></div></div>`;
const zoneB = (c, y0 = c.yT) => `<rect class="rb-z" x="${c.X(20).toFixed(1)}" y="${y0}" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${c.yB - y0}" fill="transparent"/>`;
const CSS_B = `.rb-s47{font-weight:700;fill:var(--fin)}
[data-theme="cave"] .qh pattern rect{opacity:.9}
.rb-z{cursor:pointer}.rb-carte{display:none;position:fixed;left:50%;transform:translateX(-50%);z-index:40;background:var(--sheet);color:var(--ink);border:1.5px solid var(--line2);border-radius:12px;padding:6px 10px 7px;font-size:14px;line-height:20px;box-shadow:0 8px 20px -8px rgba(0,0,0,.4);font-variant-numeric:tabular-nums;min-width:250px}
.rb-on .rb-carte{display:block}.rb-ch{color:var(--mut);margin-bottom:2px}.rb-ch b{color:var(--fin)}.rb-l{display:grid;grid-template-columns:34px 1fr auto;gap:6px;white-space:nowrap}.rb-l .w{color:var(--mut)}.rb-l .n{color:var(--bad)}.rb-l .f{color:var(--fin)}
.rb-l .hh{display:inline-block;width:12px;height:12px;vertical-align:-1px;border:1.5px solid var(--fin);background:repeating-linear-gradient(45deg,var(--fin) 0 2px,transparent 2px 5px)}
`;
const CARTE_JS = `var D=document,B=D.body;function pos(){var c=D.querySelector('.rb-carte'),f=D.querySelector('#fh').getBoundingClientRect();c.style.top=(f.bottom+6)+'px';}
D.querySelector('.rb-z').addEventListener('click',function(e){e.stopPropagation();pos();B.classList.toggle('rb-on');});D.addEventListener('click',function(){B.classList.remove('rb-on');});`;
const LISTE = [...CAUSES, mv(40), mv(33), mv(38), mv(42), mv(23), 'leg'];

// ---------- pose à la main (le placeur automatique ne trouve pas mieux : places mesurées dans en2/CORRECTIONS.md) ----------
// f : 'nom' (une ligne), 'deux' (nom / montant), 'trois' (nom coupé en deux / montant), 'montant' ; al : 'start' | 'end'
// fil vertical seulement si l'étiquette couvre l'abscisse du saut : du bord de l'étiquette au bout du saut
function lab(c, m, f, x, y, { al = 'start', lignes = null } = {}) {
  const xa = c.X(m.r), cl = m.m > 0 ? 'tp' : 'tm', T = `<title>${m.n} ${sg(m.m)}, S${sn(m.r)}</title>`;
  let w, h, txt; const ax = al === 'end' ? 'text-anchor="end" ' : '';
  if (f === 'nom') { w = wNom(m); h = 16; txt = al === 'end' ? `<text ${ax}x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tn">${m.n} <tspan class="${cl}">${sg(m.m)}</tspan>${T}</text>` : txtNom(x, y, m); }
  else if (f === 'montant') { w = wMt(m); h = 16; txt = `<text ${ax}x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="${cl}">${sg(m.m)}${T}</text>`; }
  else { const L2 = lignes || [m.n]; w = Math.max(...L2.map((s) => tw(s)), wMt(m)); h = 16 * (L2.length + 1);
    txt = `<text ${ax}x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" class="tn">${L2.map((s, i) => (i ? `<tspan ${ax}x="${x.toFixed(1)}" dy="16">${s}</tspan>` : s)).join('')}<tspan ${ax}x="${x.toFixed(1)}" dy="16" class="${cl}">${sg(m.m)}</tspan>${T}</text>`; }
  const x0 = al === 'end' ? x - w : x, top = haut(c, m), bot = bas(c, m);
  let fl = '';
  if (xa >= x0 + 2 && xa <= x0 + w - 2) { if (y + h <= top) { if (top - (y + h) > 4) fl = `<line x1="${xa.toFixed(1)}" x2="${xa.toFixed(1)}" y1="${(y + h + 1).toFixed(1)}" y2="${(top - 2).toFixed(1)}" stroke="var(${col(m)})" stroke-width="1" stroke-dasharray="2 2"/>`; }
    else if (y >= bot && y - bot > 4) fl = `<line x1="${xa.toFixed(1)}" x2="${xa.toFixed(1)}" y1="${(bot + 2).toFixed(1)}" y2="${(y - 1).toFixed(1)}" stroke="var(${col(m)})" stroke-width="1" stroke-dasharray="2 2"/>`; }
  return fl + txt;
}
const R = (r) => mv(r);
const axeB = (c, yt, yb) => mois.filter((m) => m.r > 1 && m.k % 3 === 2 && m.k !== 11).map((m) => `<line class="ob" x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${yt}" y2="${yt + 4}" stroke="var(--line2)" stroke-width="1.5"/><text x="${(c.X(m.r) + 3).toFixed(1)}" y="${yb}" class="t14">${MO[m.k]}</text>`).join('') + des(2, yb);

// ---------- r6b : bord à bord ; Fête et Six fûts sur une rive sous le zéro, Festival collé à son pic, Mariage et Frigo sous la courbe à droite ----------
{
  const H = 152, yB = 120, c = courbe({ W: 390, x0: 0, pw: 390, yT: 2, yB, ymax: 9733, id: 'r6b' });
  const P = (r) => c.X(r);
  const L6 = [
    lab(c, R(29), 'nom', P(29) - wNom(R(29)) + 4, 31),            // Embouteilleuse, ciel
    lab(c, R(40), 'deux', P(40) - 3, 31, { al: 'end' }),            // Festival, collé à gauche de son pic
    lab(c, R(20), 'nom', P(20) - 7 - wNom(R(20)), 71),             // Hotte, sous le libre, à gauche de sa marche
    txtLeg2(c, 60, 88),                                             // 1 140 mis de côté (hachure)
    lab(c, R(42), 'nom', P(42) - 13, 69),                           // Frigo, sous le libre
    lab(c, R(38), 'nom', P(38) + 4, 92),                            // Mariage, à droite de sa marche
    lab(c, R(25), 'nom', P(25) - wNom(R(25)) + 4, 121),             // Six fûts inox, rive sous le zéro
    lab(c, R(33), 'nom', P(33) - 3, 121),                           // Fête de village, rive sous le zéro
  ].join('');
  const tintB = `<rect x="${c.X(20).toFixed(1)}" y="32" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${yB - 32}" fill="var(--bad)" opacity=".08"/>`;
  const svg = `<svg width="390" height="${H}" viewBox="0 0 390 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse, bord à bord ; mouvements nommés">${c.defs}${tintB}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${zoneB(c, 32)}${L6}${dot(c)}${axeB(c, yB + 17, 150)}</svg>`;
  page('r6b', 'bord à bord, corrigé', `.qh.r6b{margin:0;height:${H}px}.r6b>svg{position:absolute;left:0;top:0}.r6b .q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}` + CSS_B,
    `<header class="qh r6b">${svg}${brosse(c, 32, yB - 31)}${titre()}</header>`, bande.deux() + carteB, CARTE_JS);
  NOTE.r6b = ['Embouteilleuse (ciel)', 'Festival (deux lignes, collé au pic)', 'Hotte', '1 140 mis de côté (deux lignes)', 'Frigo', 'Mariage', 'Six fûts inox (rive)', 'Fête de village (rive)', '(marque) Marché de printemps'];
}

// ---------- r2b : la rive basse ; Fête de village sur la rive, la bande en une ligne de mouvements (le libre au toucher) ----------
{
  const H = 135, yB = 100, c = courbe({ yT: 2, yB, ymax: 7600, id: 'r2b' });
  const mh = moisHaut(c, 2, (x) => x < c.X(7) + 6);
  const P = (r) => c.X(r), r1 = yB + 3, r2 = yB + 19;
  const L2 = [
    des(2, r1 + 12),
    lab(c, R(20), 'nom', P(20) - wNom(R(20)) + 3, r1),             // Hotte, rive 1
    lab(c, R(33), 'nom', Math.max(P(29) + 6, P(33) - wNom(R(33)) + 3), r1), // Fête de village, rive 1 (laisse passer les fils de la rive 2)
    lab(c, R(25), 'nom', P(25) - wNom(R(25)) + 3, r2),             // Six fûts inox, rive 2
    lab(c, R(29), 'nom', P(25) + 9, r2),                            // Embouteilleuse, rive 2
    txtLeg2(c, 58, 53),                                             // 1 140 mis de côté, sous le libre à gauche
    lab(c, R(42), 'nom', P(40) + 2, 45),                            // Frigo, sous le libre à droite
    lab(c, R(40), 'deux', P(40) + 4, 63),                           // Festival, à droite de sa marche
    lab(c, R(23), 'montant', P(23) + 3, 11),                        // +910 au-dessus de son pic
    lab(c, R(38), 'montant', P(38) - wMt(R(38)) + 1, 22),           // +1 100 au-dessus de sa marche
  ].join('');
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse ; sorties et fête nommées sous la courbe" style="overflow:visible">${c.defs}${tint(c)}${c.fond}${mh.svg}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${zoneB(c)}${L2}${dot(c)}</svg>`;
  page('r2b', 'la rive basse, corrigée', `.r2b-g{position:relative;height:${H}px}.r2b-g>svg{position:absolute;left:0;top:0}` + CSS_B,
    `<header class="qh r2b">${titre()}<div class="r2b-g">${svg}${brosse(c, 18, yB - 16)}</div></header>`, bande.mvt() + carteB, TIP_JS + CARTE_JS.replace('var D=document,B=D.body;', 'var B=D.body;'));
  NOTE.r2b = ['Hotte (rive)', 'Fête de village (rive)', 'Six fûts inox (rive)', 'Embouteilleuse (rive)', '1 140 mis de côté (deux lignes)', 'Frigo', 'Festival (deux lignes)', '(montant) Marché de printemps', '(montant) Mariage'];
}

// ---------- r5b : la loupe dite en mots ; le libre revenu dans la bande ----------
{
  const H = 124, c = courbe({ yT: 4, yB: 106, id: 'r5b', poids: (r) => (r >= 18 && r <= 33 ? 2.4 : 1) });
  const xl = c.X(18), xr = c.X(34), P = (r) => c.X(r);
  const loupe = `<rect x="${xl.toFixed(1)}" y="${c.yT}" width="${(xr - xl).toFixed(1)}" height="${c.yB - c.yT}" fill="var(--bad)" opacity=".07"/>`;
  const L5 = [
    lab(c, R(29), 'nom', P(29) - wNom(R(29)) + 3, 3),               // Embouteilleuse, ciel
    lab(c, R(33), 'trois', P(33) - 36, 9, { lignes: ['Fête de', 'village'] }), // Fête de village en trois lignes, dans le ciel du creux
    lab(c, R(20), 'nom', P(20) - wNom(R(20)) + 9, 69),             // Hotte, sous le libre
    lab(c, R(25), 'nom', P(25) - wNom(R(25)) + 3, 88),             // Six fûts inox, sous le libre
    lab(c, R(42), 'deux', P(42) - 6, 49),                           // Frigo, sous le libre à droite
    lab(c, R(40), 'nom', P(40) - 34, 86),                           // Festival, sous le libre
  ].join('');
  let grad = ''; for (let r = 1; r < N; r++) { const big = r >= 18 && r <= 33; grad += `<line x1="${c.X(r).toFixed(1)}" x2="${c.X(r).toFixed(1)}" y1="${c.yB}" y2="${c.yB + (big ? 3 : 2)}" stroke="var(--line2)" stroke-width="1"/>`; }
  const xm = c.X(16) + 3 + tw('mars') + 8, xj = c.X(29) + 3, wl = tw('loupe ') + tw('×2,4', 700);
  const lp = `<text x="${((xm + xj - 4) / 2 - wl / 2).toFixed(1)}" y="120" class="t14" style="fill:var(--bad)">loupe <tspan font-weight="700">×2,4</tspan><title>S11 à S26 élargies 2,4 fois</title></text>`;
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" data-booster="mouvements" role="img" aria-label="Libre et caisse ; S11 à S26 en loupe ×2,4">${c.defs}${loupe}${c.fond}${c.traits}${GRANDS.map((m) => jump(c, m, 3)).join('')}${zoneB(c)}${L5}${dot(c)}${grad}${axeB(c, c.yB, 120)}${lp}</svg>`;
  page('r5b', 'la loupe sur le creux, corrigée', `.r5b-g{position:relative;height:${H}px}.r5b-g>svg{position:absolute;left:0;top:0}` + CSS_B,
    `<header class="qh r5b">${titre()}<div class="r5b-g">${svg}${brosse(c, c.yT - 2, c.yB - c.yT + 3)}</div></header>`, bande.deux() + carteB, CARTE_JS);
  NOTE.r5b = ['Embouteilleuse (ciel)', 'Fête de village (trois lignes)', 'Hotte', 'Six fûts inox', 'Frigo (deux lignes)', 'Festival', '(marque) Mariage', '(marque) Marché de printemps', '(au toucher) 1 140 mis de côté : carte du creux'];
}
fs.writeFileSync(path.join(HERE, 'rb-place.json'), JSON.stringify(NOTE, null, 1));
for (const [k, v] of Object.entries(NOTE)) console.log(k, v.join(' | '));
