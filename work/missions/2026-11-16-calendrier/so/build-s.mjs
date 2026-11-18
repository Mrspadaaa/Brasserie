// node so/build-s.mjs [s1 s2 s3 s4] : portrait s1…s4 (nuit 16-17.11). Hôte : v8/z2.html (corps gi2/r2-c choisi, bande des semaines,
// carte du creux) ; seul l'en-tête <header class="qh z2"> est remplacé. Sur la courbe : quoi et quand (« Six fûts inox · S18 ») ;
// le montant au toucher (bulle). Données : en/q-data.json. v8/ non modifié. (build.mjs du même dossier appartient à une autre voie : t1…t3.)
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), MIS = path.join(HERE, '..');
const Z2F = path.join(MIS, 'v8', 'z2.html'), Z2 = fs.readFileSync(Z2F, 'utf8');
const { C, L, MV } = JSON.parse(fs.readFileSync(path.join(MIS, 'en', 'q-data.json'), 'utf8'));
const N = 53, T0 = 1, PB = 31, W = 390;
const sn = (r) => (r < 8 ? 46 + r : r - 7);
const fmt = (n) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sg = (n) => (n >= 0 ? '+' : '−') + fmt(n);
const X = (r) => (W * r) / N;
const GR = MV.filter((m) => Math.abs(m.m) >= 900 && m.r > 7).sort((a, b) => Math.abs(b.m) - Math.abs(a.m));
const ICO = { achat: 'i-k17cart', evenement: 'i-fete', vente: 'i-vente', renovation: 'i-outil', charge: 'i-doc' };
const txt = (m) => `${m.n} · S${sn(m.r)}`;
const VARS = process.argv.slice(2); const fait = (n) => !VARS.length || VARS.includes(n);

// ---------- largeurs mesurées dans la police de la page (390 px) ----------
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pg = await nav.newPage(); await pg.setViewport({ width: 390, height: 844 }); await pg.goto(pathToFileURL(Z2F).href); await pg.evaluate(() => document.fonts.ready);
const COURT = { 29: 'Embouteilleuse', 33: 'Fête', 25: 'Six fûts', 23: 'Marché' };
const txtC = (m) => `${COURT[m.r] || m.n} · S${sn(m.r)}`;
const MES = [...GR.map((m) => ['600 14px', txt(m)]), ...GR.map((m) => ['700 14px', txt(m)]), ...GR.map((m) => ['600 14px', m.n]), ...GR.map((m) => ['700 14px', m.n]), ...GR.map((m) => ['600 14px', txtC(m)]), ['800 22px', '113'], ['700 14px', 'S24'], ...GR.map((m) => ['700 14px', 'S' + sn(m.r)]), ['600 14px', 'à dépenser']];
const LW = await pg.evaluate((arr) => { const c = document.createElement('canvas').getContext('2d'); const ff = getComputedStyle(document.body).fontFamily;
  return arr.map(([f, s]) => { c.font = `${f} ${ff}`; return c.measureText(s).width; }); }, MES);
const tw = (f, s) => LW[MES.findIndex((q) => q[0] === f && q[1] === s)];
const TITRE = await pg.evaluate(() => { const r = document.querySelector('.q5-n').getBoundingClientRect(), d = document.querySelector('.q5-t .d').getBoundingClientRect(); return { r: Math.ceil(r.right), d: Math.floor(d.left), dw: Math.ceil(d.width) }; });
await nav.close();

// pièces de l'en-tête z2 reprises telles quelles
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('absent : ' + a); const j = s.indexOf(b, i); if (j < 0) throw new Error('absent : ' + b); return [i, j]; };
const [ha, hb] = cut(Z2, '<header class="qh z2">', '</header>');
const HEAD = Z2.slice(ha, hb + 9);
const [na, nb] = cut(HEAD, '<button type="button" class="q5-n"', '</button>'); const NOMBRE = HEAD.slice(na, nb + 9);
const [da, db] = cut(HEAD, '<span class="d">', '</span></div></header>'); const CTL = HEAD.slice(da, db + 7);
const NOMBRE2 = NOMBRE.replace(/<span>CHF à dépenser ·<\/span><em>S24<\/em>/, '<span>CHF à dépenser · S24</span>');
if (NOMBRE2 === NOMBRE) throw new Error('titre z2 introuvable');

// ---------- courbe (libre bleu, caisse grise, hachures = mis de côté), sauts des grands mouvements ----------
function courbe(yT, yB, ymax, id) {
  const Y = (v) => yT + (yB - yT) * (1 - v / ymax);
  let lib = '', cai = '', dn = '';
  for (let r = T0; r < N; r++) { const a = X(r).toFixed(1), b = X(r + 1).toFixed(1);
    lib += (r === T0 ? 'M' : 'L') + a + ' ' + Y(L[r]).toFixed(1) + 'L' + b + ' ' + Y(L[r]).toFixed(1);
    cai += (r === T0 ? 'M' : 'L') + a + ' ' + Y(C[r]).toFixed(1) + 'L' + b + ' ' + Y(C[r]).toFixed(1); }
  for (let r = N - 1; r >= T0; r--) dn += 'L' + X(r + 1).toFixed(1) + ' ' + Y(L[r]).toFixed(1) + 'L' + X(r).toFixed(1) + ' ' + Y(L[r]).toFixed(1);
  const defs = `<defs><pattern id="${id}h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)" opacity=".5"/></pattern></defs>`;
  const xa = X(20), xb = X(PB + 1), yTi = Math.max(yT, Y(C[19]) - 2);
  const fond = `<rect x="0" y="${yT}" width="${X(T0).toFixed(1)}" height="${yB - yT}" fill="var(--s2)"/>`
    + `<rect x="${xa.toFixed(1)}" y="${yTi.toFixed(1)}" width="${(xb - xa).toFixed(1)}" height="${(yB - yTi).toFixed(1)}" fill="var(--bad)" opacity=".07"/>`
    + `<path d="${lib}L${X(N).toFixed(1)} ${yB}L${X(T0).toFixed(1)} ${yB}Z" fill="var(--area)"/><path d="${cai}${dn}Z" fill="var(--fin)" opacity=".13"/>`
    + `<line class="ob" x1="0" x2="${W}" y1="${yB}" y2="${yB}" stroke="var(--line2)" stroke-width="1"/>`
    + `<path class="ob" d="${cai}" fill="none" stroke="var(--mut)" stroke-width="1.5"/><path class="ob" d="${lib}" fill="none" stroke="var(--fin)" stroke-width="2.5"/>`;
  const sauts = GR.map((m) => `<line class="ob q-mk" x1="${X(m.r).toFixed(1)}" x2="${X(m.r).toFixed(1)}" y1="${Y(C[m.r - 1]).toFixed(1)}" y2="${Y(C[m.r]).toFixed(1)}" stroke="var(${m.m > 0 ? '--ok' : '--bad'})" stroke-width="3" stroke-linecap="round"/>`).join('');
  const dx = (X(PB) + X(PB + 1)) / 2, dy = Y(L[PB]);
  const dot = `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`;
  const creux = `<rect class="rb-z" x="${xa.toFixed(1)}" y="${yTi.toFixed(1)}" width="${(xb - xa).toFixed(1)}" height="${(yB - yTi).toFixed(1)}" fill="transparent"/>`;
  return { Y, yT, yB, defs, fond, sauts, dot, creux, dx, dy, id };
}

// ---------- placeur : boîte hors de la courbe (caisse, libre, hachures, sauts) et des obstacles ; fil pointillé si elle s'écarte ----------
function interdits(c, x0, x1) {
  const iv = [];
  for (let r = T0; r < N; r++) { const a = X(r), b = X(r + 1); if (b < x0 - 2 || a > x1 + 2) continue;
    iv.push([c.Y(C[r]) - 3, c.Y(C[r]) + 3], [c.Y(L[r]) - 3.5, c.Y(L[r]) + 3.5]);
    if (r > T0 && a >= x0 - 3 && a <= x1 + 3) { for (const S of [C, L]) iv.push([Math.min(c.Y(S[r - 1]), c.Y(S[r])) - 3, Math.max(c.Y(S[r - 1]), c.Y(S[r])) + 3]); } }
  return iv;
}
const touche = (a, b, px = 4, py = px) => a.x < b.x + b.w + px && b.x < a.x + a.w + px && a.y < b.y + b.h + py && b.y < a.y + a.h + py;
function placer(c, items, obst, { libre = 70, strict = false } = {}) {
  const pris = obst.map((o) => ({ ...o, ob: true })); const out = [];
  for (const it0 of items) for (const it of [it0, ...(it0.deux ? [{ ...it0, w: it0.deux, h: 31, lignes: 2 }] : [])]) {
    if (out.some((p) => p === it0 || p.m === it0.m && p.m)) break;
    const { w, h, xr } = it; const ya = it.ya ?? Math.min(c.Y(C[it.r - 1]), c.Y(C[it.r])), yb = it.yb ?? Math.max(c.Y(C[it.r - 1]), c.Y(C[it.r]));
    let best = null;
    const essai = (x, y, mode, k) => {
      if (x < 4 || x + w > W - 4 || y < 3 || y + h > c.yB - 3) return;
      const b = { x, y, w, h };
      if (it.zone === 'haut' && y + h > ya + 2) return; if (it.zone === 'bas' && y < yb - 2) return;
      if (interdits(c, x, x + w).some(([p, q]) => y < q && p < y + h)) return;
      if (pris.some((o) => (o.ob ? touche(b, o, 2) : touche(b, o, 14, 3)))) return;
      const gv = y + h < ya ? ya - (y + h) : y > yb ? y - yb : 0, gh = xr < x ? x - xr : xr > x + w ? xr - x - w : 0;
      const autres = GR.filter((m) => { if (m.r === it.r || X(m.r) <= x - 4 || X(m.r) >= x + w + 4) return false; if (strict) return true; const p = Math.min(c.Y(C[m.r - 1]), c.Y(C[m.r])) - 12, q = Math.max(c.Y(C[m.r - 1]), c.Y(C[m.r])) + 12; return y < q && p < y + h; }).length;
      if ((mode !== 'cote' && autres > 0) || (mode === 'libre' && Math.hypot(gv, gh) > (it.rayon || 40))) return;
      const s = (mode === 'libre' ? Math.hypot(gv, gh) * 1.2 + 8 : gv * 1.2) + k * 5 + autres * 30 + (mode === 'pile' ? 5 + Math.abs(x + w / 2 - xr) * 0.08 : 0);
      if (!best || s < best.s) best = { ...b, s, mode };
    };
    for (let y = 1; y < c.yB; y++) {
      for (let k = 0; k < 4; k++) { essai(xr + 6 + k * 5, y, 'cote', k); essai(xr - 6 - w - k * 5, y, 'cote', k); }
      for (let x = xr - w + 14; x <= xr - 14; x += 3) essai(x, y, 'pile', 0);
      for (let x = 4; x <= W - w - 4; x += 3) if (Math.abs(x + w / 2 - xr) < w / 2 + libre) essai(x, y, 'libre', 0);
    }
    if (!best) { if (!it0.deux || it.lignes) console.log('  sans place : ' + (it.id || txt(it.m))); continue; }
    pris.push(best); out.push({ ...it, b: best, ya, yb });
  }
  return out;
}
function fil(p, col) {
  const { b, xr, ya, yb } = p; const px = Math.max(b.x + 2, Math.min(b.x + b.w - 2, xr));
  let x1 = xr, y1, x2 = px, y2;
  if (b.y + b.h < ya) { y1 = ya; y2 = b.y + b.h; } else if (b.y > yb) { y1 = yb; y2 = b.y; }
  else { y1 = y2 = Math.max(ya, Math.min(yb, b.y + b.h / 2)); x2 = xr < b.x ? b.x : b.x + b.w; }
  if (Math.hypot(x2 - x1, y2 - y1) < 5) return '';
  return `<line x1="${x1.toFixed(1)}" x2="${x2.toFixed(1)}" y1="${y1.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(${col})" stroke-width="1.2" stroke-dasharray="2 2"/>`;
}
const hit = (m, b, pad = 8) => `<rect class="so-hit" onclick="" tabindex="0" data-mv data-i="${m.r}" data-nom="${txt(m)}" data-m="${sg(m.m)}" role="button" aria-label="${m.n}, S${sn(m.r)} : ${sg(m.m)} CHF" x="${(b.x - 2).toFixed(1)}" y="${(b.y - pad).toFixed(1)}" width="${(b.w + 4).toFixed(1)}" height="${(b.h + 2 * pad).toFixed(1)}" fill="transparent"/>`;
const hitSaut = (c, m) => hit(m, { x: X(m.r) - 9, y: Math.min(c.Y(C[m.r - 1]), c.Y(C[m.r])), w: 18, h: Math.abs(c.Y(C[m.r - 1]) - c.Y(C[m.r])) }, 6);
const lbl = (p, cls) => p.lignes ? `<text x="${p.b.x.toFixed(1)}" y="${(p.b.y + 12.5).toFixed(1)}" data-l="${p.m.r}" class="${cls}">${p.m.n}<tspan x="${p.b.x.toFixed(1)}" dy="15">S${sn(p.m.r)}</tspan></text>`
  : `<text x="${p.b.x.toFixed(1)}" y="${(p.b.y + 12.5).toFixed(1)}" data-l="${p.m.r}" class="${cls}">${txt(p.m)}</text>`;
const sansNom = (c, P) => GR.filter((m) => !P.some((p) => p.m === m)).map((m) => hitSaut(c, m)).join('');

// ---------- page ----------
const BUL_JS = `var H=document.querySelector('header.qh'),b=document.createElement('div');b.className='so-bul';b.hidden=true;H.appendChild(b);
function off(){b.hidden=true;H.querySelectorAll('[data-o]').forEach(function(l){var t=l.hasAttribute('data-tag')?l.querySelector('.so-tag'):l;t.textContent=l.dataset.o;l.removeAttribute('data-o');l.removeAttribute('transform');l.classList.remove('so-on','n','p');if(l.hasAttribute('data-tag')){var r=l.querySelector('rect');r.setAttribute('width',r.dataset.w);r.setAttribute('x',r.dataset.x);t.setAttribute('x',t.dataset.x);}});}
H.addEventListener('click',function(e){var t=e.target.closest('[data-mv]');off();if(!t)return;e.stopPropagation();var d=t.dataset,sg=d.m.charAt(0)==='+'?'p':'n',l=H.querySelector('[data-l="'+d.i+'"]');
if(l){var W=H.offsetWidth-4;if(l.hasAttribute('data-tag')){var x=l.querySelector('.so-tag'),r=l.querySelector('rect');l.dataset.o=x.textContent;r.dataset.w=r.getAttribute('width');r.dataset.x=r.getAttribute('x');x.dataset.x=x.getAttribute('x');x.textContent=d.m;var w=x.getComputedTextLength()+10;r.setAttribute('width',w);x.setAttribute('x',+r.dataset.x+w/2);}
else{l.dataset.o=l.textContent;l.textContent=d.nom.split(' · ')[0]+'  '+d.m;}l.classList.add('so-on',sg);var bb=l.getBBox();if(bb.x+bb.width>W)l.setAttribute('transform','translate('+(W-bb.x-bb.width)+' 0)');return;}
b.innerHTML='<span>'+d.nom+'</span><b class="'+sg+'">'+d.m+'</b>';b.hidden=false;var hr=H.getBoundingClientRect(),q=t.getBoundingClientRect(),w2=b.offsetWidth;b.style.left=Math.max(4,Math.min(hr.width-4-w2,q.left+q.width/2-w2/2-hr.left))+'px';b.style.top=Math.max(2,q.top-hr.top-36)+'px';});
document.addEventListener('click',function(e){if(!H.contains(e.target))off();});`;
const CSS_COMMUN = `.qh{position:relative}.qh>svg{position:absolute;left:0;top:0}
.qh .so-l{font-size:14px;font-weight:600;fill:var(--ink);paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.so-hit{cursor:pointer;outline:none}
.so-bul{position:absolute;z-index:6;display:flex;gap:8px;align-items:baseline;white-space:nowrap;background:var(--bg,#fff);border:1.5px solid var(--line2);border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.16);padding:5px 10px;font-size:15px;color:var(--ink)}
.so-bul[hidden]{display:none}.qh text.so-on{font-weight:800}.qh text.so-on.n{fill:var(--bad)}.qh text.so-on.p{fill:var(--ok)}.qh g.so-on .so-l{font-weight:700}.so-bul b{font-weight:800}.so-bul b.n{color:var(--bad)}.so-bul b.p{color:var(--ok)}
#fh.rb{margin-top:2px}`;
function page(n, quoi, header, css) {
  let h = Z2.slice(0, ha) + header + Z2.slice(hb + 9);
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${n} · ${quoi} (so, corps gi2/r2-c)</title>`);
  const zi = h.indexOf('/* z2 : '); if (zi < 0) throw new Error('css z2 absente'); const ze = h.indexOf('</style>', zi);
  h = h.slice(0, zi) + `/* ${n} : ${quoi} */\n${CSS_COMMUN}\n${css}\n` + h.slice(ze);
  const j = h.lastIndexOf('</body>'); h = h.slice(0, j) + `<script>(function(){${BUL_JS}})();</script>` + h.slice(j);
  fs.writeFileSync(path.join(HERE, n + '.html'), h);
}
const brosse = (top, h) => `<div class="q-brosse" data-booster="fenetre-semaines" data-pinceau="corps" aria-label="Fenêtre : S47 à S52" style="left:${X(1).toFixed(1)}px;width:${(X(7) - X(1)).toFixed(1)}px;top:${top.toFixed(1)}px;height:${h.toFixed(1)}px"><i></i><i></i></div>`;
const svgOf = (H, inner, label) => `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-booster="mouvements" role="img" aria-label="${label}">${inner}</svg>`;
const OB_TITRE = (wR = TITRE.r) => [{ x: 0, y: 0, w: wR + 4, h: 30 }, { x: TITRE.d - 4, y: 0, w: W - TITRE.d + 4, h: 30 }];
const OB_BROSSE = { x: X(1) - 6, y: 0, w: X(7) - X(1) + 12, h: 300 };
const obDot = (c) => ({ x: c.dx - 8, y: c.dy - 8, w: 16, h: 16 });
const titre = (nb = NOMBRE) => `<div class="q5-t">${nb}${CTL}</div>`;
const rapport = (n, P) => console.log(n, P.map((p) => p.m ? txt(p.m) : p.id).join(' | '));

function regle(n, yTs, besoin, poser, { yMin = 92, yMax = 140, haut = 33 } = {}) {
  const log = console.log; console.log = () => {};
  try { for (let yB = yMin; yB <= yMax; yB += 2) for (const yT of [].concat(yTs)) for (let ymax = 7400; ymax <= 10800; ymax += 200) {
    if ((yB - yT) * 7145 / ymax < 82) continue; const c = courbe(yT, yB, ymax, n); if (c.Y(7258) < haut || c.Y(5900) < haut) continue; const r = poser(c);
    if (process.env.DBG && ymax <= 8000) log(n, yT, yB, ymax, (r.P0 || []).length, GR.filter((m) => !r.P.some((p) => p.m === m)).map((m) => m.n).join(","));
    if (besoin(r)) { console.log = log; console.log(n, 'yT', yT, 'yB', yB, 'ymax', ymax); return { c, ...r }; } } }
  finally { console.log = log; }
  throw new Error(n + ' : aucun réglage');
}
const ont = (P, k) => GR.slice(0, k).every((m) => P.some((p) => p.m === m));

// ---------- géométrie commune s1, s3, s4 (rang de titre, courbe 30 → 126, plafond 7 600) ----------
const G = () => courbe(30, 126, 7600, 'g'); const HG = 128;
const ITEMS = (larg, extra = {}) => GR.slice(0, 4).map((m) => ({ m, r: m.r, xr: X(m.r), w: larg(m), h: 16, ...extra }));

// ---------- s1 : quatre noms et leur semaine, le reste au doigt ----------
if (fait('s1')) { const c = G(); const P = placer(c, ITEMS((m) => tw('600 14px', txt(m))), [...OB_TITRE(), OB_BROSSE, obDot(c)], { strict: true }); rapport('s1', P);
  const inner = c.defs + c.fond + c.sauts + c.creux + P.map((p) => fil(p, '--mut')).join('') + c.dot + P.map((p) => lbl(p, 'so-l')).join('') + sansNom(c, P) + P.map((p) => hit(p.m, p.b)).join('');
  page('s1', 'quatre noms et leur semaine, le reste au doigt', `<header class="qh s1">${svgOf(HG, inner, 'Libre et caisse ; les quatre grands mouvements nommés avec leur semaine ; le montant au toucher')}${brosse(c.Y(5900), c.yB - c.Y(5900) + 1)}${titre()}</header>`,
    `.qh.s1{margin:0;height:${HG}px}.s1 .q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}`); }

// ---------- s4 : le sens par la couleur (sortie rouge, rentrée verte), sans montant ----------
if (fait('s4')) { const c = G(); const P = placer(c, ITEMS((m) => tw('700 14px', txt(m))), [...OB_TITRE(), OB_BROSSE, obDot(c)], { strict: true }); rapport('s4', P);
  const inner = c.defs + c.fond + c.sauts + c.creux + P.map((p) => fil(p, p.m.m > 0 ? '--ok' : '--bad')).join('') + c.dot + P.map((p) => lbl(p, 'so-l ' + (p.m.m > 0 ? 'so-p4' : 'so-n4'))).join('') + sansNom(c, P) + P.map((p) => hit(p.m, p.b)).join('');
  page('s4', 'le sens par la couleur', `<header class="qh s4">${svgOf(HG, inner, 'Libre et caisse ; sorties nommées en rouge, rentrées en vert, avec leur semaine ; le montant au toucher')}${brosse(c.Y(5900), c.yB - c.Y(5900) + 1)}${titre(NOMBRE2)}</header>`,
    `.qh.s4{margin:0;height:${HG}px}.s4 .q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}
.qh .so-n4{fill:var(--bad);font-weight:700}.qh .so-p4{fill:var(--ok);font-weight:700}`); }

// ---------- s3 : la semaine en étiquette teintée du sens, le nom à côté ----------
if (fait('s3')) { const c = G(); const wS = (m) => tw('700 14px', 'S' + sn(m.r)) + 8;
  const P = placer(c, ITEMS((m) => tw('600 14px', m.n) + 4 + wS(m), { h: 16 }), [...OB_TITRE(), OB_BROSSE, obDot(c)], { strict: true }); rapport('s3', P);
  const tag = (p) => { const x = p.b.x + p.b.w - wS(p.m), y = p.b.y; return `<g data-l="${p.m.r}" data-tag><text x="${p.b.x.toFixed(1)}" y="${(y + 13.5).toFixed(1)}" class="so-l">${p.m.n}</text><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${wS(p.m).toFixed(1)}" height="18" rx="5" transform="translate(0 -1)" fill="var(${p.m.m > 0 ? '--ok' : '--bad'})"/><text x="${(x + wS(p.m) / 2).toFixed(1)}" y="${(y + 13.5).toFixed(1)}" text-anchor="middle" class="so-tag">S${sn(p.m.r)}</text></g>`; };
  const inner = c.defs + c.fond + c.sauts + c.creux + P.map((p) => fil(p, '--mut')).join('') + c.dot + P.map(tag).join('') + sansNom(c, P) + P.map((p) => hit(p.m, p.b)).join('');
  page('s3', 'la semaine en étiquette', `<header class="qh s3">${svgOf(HG, inner, 'Libre et caisse ; quatre grands mouvements : le nom, et la semaine en étiquette teintée du sens ; le montant au toucher')}${brosse(c.Y(5900), c.yB - c.Y(5900) + 1)}${titre(NOMBRE2)}</header>`,
    `.qh.s3{margin:0;height:${HG}px}.s3 .q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}
.qh .so-tag{font-size:14px;font-weight:700;fill:#fff}`); }

// ---------- s2 : la courbe du libre seule ; chaque grand mouvement est un point posé dessus, nommé avec sa semaine ----------
if (fait('s2')) { const yT = 30, yB = 118, ymax = 5800, Y = (v) => yT + (yB - yT) * (1 - v / ymax), H = 120;
  let lib = ''; for (let r = T0; r < N; r++) lib += (r === T0 ? 'M' : 'L') + X(r).toFixed(1) + ' ' + Y(L[r]).toFixed(1) + 'L' + X(r + 1).toFixed(1) + ' ' + Y(L[r]).toFixed(1);
  const xa = X(20), xb = X(PB + 1), mx = (r) => (X(r) + X(r + 1)) / 2;
  const fond = `<rect x="0" y="${yT}" width="${X(T0).toFixed(1)}" height="${yB - yT}" fill="var(--s2)"/><rect x="${xa.toFixed(1)}" y="${Y(L[19]).toFixed(1)}" width="${(xb - xa).toFixed(1)}" height="${(yB - Y(L[19])).toFixed(1)}" fill="var(--bad)" opacity=".07"/>`
    + `<path d="${lib}L${X(N).toFixed(1)} ${yB}L${X(T0).toFixed(1)} ${yB}Z" fill="var(--area)"/><line class="ob" x1="0" x2="${W}" y1="${yB}" y2="${yB}" stroke="var(--line2)" stroke-width="1"/><path class="ob" d="${lib}" fill="none" stroke="var(--fin)" stroke-width="2.5"/>`;
  const pt = (m) => `<circle cx="${mx(m.r).toFixed(1)}" cy="${Y(L[m.r]).toFixed(1)}" r="4.5" fill="var(${m.m > 0 ? '--ok' : '--bad'})" stroke="var(--halo)" stroke-width="1.5"/>`;
  // posées à la main sur les marges mesurées (libre seul : le ciel au-dessus du trait est dégagé)
  const POSE = { 29: { x: 148, y: 54 }, 40: { xd: 290, y: 33 }, 42: { x: 306, y: 76 }, 33: { x: 252, y: 96 } };
  const P = GR.filter((m) => POSE[m.r]).map((m) => { const w = tw('600 14px', txt(m)), q = POSE[m.r]; return { m, b: { x: q.xd ? q.xd - w : q.x, y: q.y, w, h: 16 } }; });
  const fil2 = (p) => { const x = mx(p.m.r), y = Y(L[p.m.r]); const yb = p.b.y + p.b.h, px = Math.max(p.b.x + 3, Math.min(p.b.x + p.b.w - 3, x));
    const y2 = y > yb ? yb + 1 : p.b.y - 1, y1 = y > yb ? y - 5 : y + 5; return Math.abs(y2 - y1) < 4 ? '' : `<line x1="${x.toFixed(1)}" x2="${px.toFixed(1)}" y1="${y1.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--mut)" stroke-width="1.2" stroke-dasharray="2 2"/>`; };
  const dot = `<circle cx="${mx(PB).toFixed(1)}" cy="${Y(L[PB]).toFixed(1)}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`;
  const creux = `<rect class="rb-z" x="${xa.toFixed(1)}" y="${Y(L[19]).toFixed(1)}" width="${(xb - xa).toFixed(1)}" height="${(yB - Y(L[19])).toFixed(1)}" fill="transparent"/>`;
  const pts = GR.map(pt).join(''), hitPt = GR.filter((m) => !POSE[m.r]).map((m) => hit(m, { x: mx(m.r) - 9, y: Y(L[m.r]) - 9, w: 18, h: 18 }, 4)).join('');
  const inner = fond + creux + P.map(fil2).join('') + pts + dot + P.map((p) => `<text x="${p.b.x.toFixed(1)}" y="${(p.b.y + 12.5).toFixed(1)}" data-l="${p.m.r}" class="so-l">${txt(p.m)}</text>`).join('') + hitPt + P.map((p) => hit(p.m, p.b)).join('');
  rapport('s2', P);
  page('s2', 'la courbe du libre seule, un point par mouvement', `<header class="qh s2">${svgOf(H, inner, 'Libre seul ; chaque grand mouvement est un point sur le libre, nommé avec sa semaine ; le montant au toucher')}${brosse(32, yB - 31)}${titre()}</header>`,
    `.qh.s2{margin:0;height:${H}px}.s2 .q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3}`); }
console.log('so/s* écrit', TITRE);
