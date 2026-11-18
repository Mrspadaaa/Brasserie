// node so/build-tb.mjs : passe b de t1 et t3 (corrections du critique, 16-17.11) → t1b.html, t3b.html. build.mjs et t1…t3 inchangés.
// b : marge de 52 px à droite de la frise et de la bande (le + volant ne cache plus aucune barre) ; toucher = montant sur le nom même,
// sans bulle ni cadre ; teinte unie au lieu des hachures ; noms posés par ordre de montant, sans trou (filet coudé si besoin) ;
// pinceau abaissé de 4 px sous le titre.
// (origine) node so/build.mjs : paysage 844×390, trois en-têtes bas et sobres sur le corps de v8/w3 (vue portrait en large),
// rangées compactes (pas de 24 px). Sur la courbe : seulement quoi et quand (« Six fûts inox · S18 »), montants au toucher.
// t1 : titre posé dans le ciel de la courbe, en haut à gauche. t2 : titre en colonne à gauche, courbe à droite.
// t3 : le 113 posé sur son creux (S24), relié au point ; boutons en haut à droite.
// Données : en/q-data.json (C caisse, L libre, MV mouvements). v8/w3.html lu, jamais écrit.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), M = path.join(HERE, '..');
const { C, L, MV } = JSON.parse(fs.readFileSync(path.join(M, 'en', 'q-data.json'), 'utf8'));
const N = 53, T0 = 1, PB = 31, NW = 13, VW = 844;
const sn = (r) => (r < 8 ? 46 + r : r - 7);
const fmt = (n) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sg = (n) => (n >= 0 ? '+' : '−') + fmt(n);
const mv = (r) => MV.find((m) => m.r === r);
const GRANDS = MV.filter((m) => Math.abs(m.m) >= 900 && m.r > NW).sort((a, b) => Math.abs(b.m) - Math.abs(a.m));
const lab = (m) => `${m.n} · S${sn(m.r)}`;
const W3 = fs.readFileSync(path.join(M, 'v8', 'w3.html'), 'utf8');

// ---- mesures de texte dans la page même (police de l'app) ----
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pg = await nav.newPage(); await pg.setViewport({ width: VW, height: 390 });
await pg.goto(pathToFileURL(path.join(M, 'v8', 'w3.html')).href); await new Promise((r) => setTimeout(r, 400));
const MES = await pg.evaluate((txt, txt2) => {
  const c = document.createElement('canvas').getContext('2d'), ff = getComputedStyle(document.body).fontFamily; c.font = `600 14px ${ff}`;
  const o = {}; for (const t of txt) o[t] = c.measureText(t).width;
  const n = document.querySelector('.q5-n').getBoundingClientRect().width, d = document.querySelector('.q5-t .d').getBoundingClientRect().width;
  const kb = [...document.querySelectorAll('.q5-t .d > *')], CB = kb[kb.length - 1].getBoundingClientRect().right - kb[0].getBoundingClientRect().left;
  return { o, TW: n, CW: d, CB
  , o8: Object.fromEntries(txt2.map((t) => { c.font = `700 14px ${ff}`; return [t, c.measureText(t).width]; })) };
}, [...GRANDS.map(lab), 'S47 – S6'], GRANDS.map((m) => `${m.n} ${sg(m.m)}`));
await nav.close();
const tw = (s) => MES.o[s];
const touche = (m) => `${m.n} ${sg(m.m)}`; const twb = (m) => Math.max(tw(lab(m)), MES.o8[touche(m)] + 2);

function courbe({ x0 = 0, pw = VW, yT, yB, ymax, id }) {
  const X = (r) => x0 + pw * r / N, Y = (v) => yT + (yB - yT) * (1 - v / ymax);
  let lib = '', cai = '', dn = '';
  for (let r = T0; r < N; r++) { const a = X(r).toFixed(1), b = X(r + 1).toFixed(1); lib += (r === T0 ? 'M' : 'L') + a + ' ' + Y(L[r]).toFixed(1) + 'L' + b + ' ' + Y(L[r]).toFixed(1); cai += (r === T0 ? 'M' : 'L') + a + ' ' + Y(C[r]).toFixed(1) + 'L' + b + ' ' + Y(C[r]).toFixed(1); }
  for (let r = N - 1; r >= T0; r--) dn += 'L' + X(r + 1).toFixed(1) + ' ' + Y(L[r]).toFixed(1) + 'L' + X(r).toFixed(1) + ' ' + Y(L[r]).toFixed(1);
  const defs = `<defs><pattern id="${id}h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)" opacity=".5"/></pattern></defs>`;
  const fond = `<path d="${lib}L${X(N).toFixed(1)} ${yB}L${X(T0).toFixed(1)} ${yB}Z" fill="var(--area)"/><path d="${cai}${dn}Z" fill="var(--fin)" opacity=".13"/>`
    + `<line x1="${x0}" x2="${x0 + pw}" y1="${yB}" y2="${yB}" stroke="var(--line2)" stroke-width="1"/>`;
  const traits = `<path d="${cai}" fill="none" stroke="var(--mut)" stroke-width="1.5"/><path d="${lib}" fill="none" stroke="var(--fin)" stroke-width="2.5"/>`;
  // haut et bas des traits sur un intervalle de x (semaines touchées, voisines comprises)
  const span = (a, b, pad = 3) => { let top = 1e9, bot = -1e9; for (let r = T0; r < N; r++) { if (X(r + 1) < a - pad || X(r) > b + pad) continue; top = Math.min(top, Y(Math.max(C[r], L[r]))); bot = Math.max(bot, Y(Math.min(C[r], L[r]))); } return { top, bot }; };
  return { X, Y, defs, fond, traits, span, cx: (r) => (X(r) + X(r + 1)) / 2, x0, pw, yT, yB, id };
}
const col = (m) => (m.m > 0 ? '--ok' : '--bad');
const jump = (c, m) => `<line x1="${c.X(m.r).toFixed(1)}" x2="${c.X(m.r).toFixed(1)}" y1="${c.Y(C[m.r - 1]).toFixed(1)}" y2="${c.Y(C[m.r]).toFixed(1)}" stroke="var(${col(m)})" stroke-width="3" stroke-linecap="round"/>`;
const inter = (a, b, gx = 0, gy = 0) => a.x < b.x + b.w + gx && b.x < a.x + a.w + gx && a.y < b.y + b.h + gy && b.y < a.y + a.h + gy;
const H = 17; // boîte d'un nom (14 px)
// place chaque nom au plus près de son saut, dans le ciel ou sous le trait, sans toucher un autre nom ni un obstacle
// segments des deux traits (paliers et marches) sur un intervalle de x : un nom ne les touche pas (2 px de marge), entre eux il peut se poser
function traits(c, x0, x1) { const iv = [];
  for (let r = T0; r < N; r++) { const a = c.X(r), b = c.X(r + 1); if (b < x0 - 2 || a > x1 + 2) continue;
    for (const S of [C, L]) { iv.push([c.Y(S[r]) - 3, c.Y(S[r]) + 3]); if (r > T0 && a >= x0 - 3 && a <= x1 + 3) iv.push([Math.min(c.Y(S[r - 1]), c.Y(S[r])) - 3, Math.max(c.Y(S[r - 1]), c.Y(S[r])) + 3]); } }
  return iv; }
function placer(c, obst, liste, x1 = VW - 2) {
  const cands = new Map();
  for (const m of liste) { const t = lab(m), w = tw(t), xa = c.X(m.r), ya = c.Y(C[m.r - 1]), yb = c.Y(C[m.r]), j0 = Math.min(ya, yb), j1 = Math.max(ya, yb), out = [];
    const xs = [[xa + 5, 'r'], [xa - 5 - w, 'l']]; for (let x = xa - w + 8; x <= xa - 8; x += 3) xs.push([x, 'c']);
    for (const [x, k] of xs) { if (x < c.x0 + 2 || x + w > x1) continue; const s = c.span(x, x + w), iv = traits(c, x, x + w);
      for (let y = c.yT; y + H <= c.yB - 1; y += 1) { const sky = y + H <= s.top - 2, und = y >= s.bot + 2; if (iv.some(([p, q]) => y < q && p < y + H)) continue; const entre = !sky && !und;
        const b = { x, y, w, h: H }; if (obst.some((o) => inter(b, o, 4, 1))) continue;
        const cy = y + H / 2, dv = cy < j0 ? j0 - cy : cy > j1 ? cy - j1 : 0;
        if (dv > 46) continue;
        let lb = null; if (k !== 'c' && dv > 3) { const up = cy < j0, ya2 = up ? cy : j1 + 1, yb2 = up ? j0 - 1 : cy; lb = { x: xa - 1, y: ya2, w: 2, h: yb2 - ya2, coude: [xa, up ? j0 : j1, cy, k === 'r' ? x : x + w] }; if (obst.some((o) => inter(lb, o, 0, 0))) continue; }
        else if (k === 'c' && dv > 3) { const y0 = y + H < j0 ? y + H + 1 : j1 + 2, y1 = y + H < j0 ? j0 - 2 : y - 1; lb = { x: xa - 1, y: Math.min(y0, y1), w: 2, h: Math.abs(y1 - y0) }; if (obst.some((o) => inter(lb, o, 0, 0))) continue; }
        out.push({ b, lb, k, cost: (k === 'c' ? 4 + 1.5 * dv + 0.12 * Math.abs(x + w / 2 - xa) : dv > 3 ? 3 + 1.5 * dv : 0) + (und ? 2 : 0) + (entre ? 3 : 0) }); } }
    out.sort((p, q) => p.cost - q.cost); cands.set(m, out.slice(0, 500)); if (process.env.DBG) console.log(c.id, t, out.length, out.slice(0, 3).map((q) => q.k + Math.round(q.b.x) + ',' + q.b.y).join(' ')); }
  // recherche en faisceau : chaque nom posé ou laissé au toucher ; on garde les 500 meilleurs états (montant² puis coût)
  const ok = (q, o) => !(inter(q.b, o.b, 10, 2) || (q.lb && inter(q.lb, o.b, 2, 0)) || (o.lb && inter(o.lb, q.b, 2, 0)));
  const div = (arr) => { const vu = new Set(), r = []; for (const q of arr) { const k = Math.round(q.b.x / 6) + ':' + Math.round(q.b.y / 3); if (vu.has(k)) continue; vu.add(k); r.push(q); if (r.length >= 160) break; } return r; };
  // par ordre de montant, sans trou : on cherche le plus long préfixe posable (K noms), puis, pour ce K, la pose de moindre coût
  // (séparation et évaluation, 400 000 nœuds au plus) ; les plus petits passent au toucher.
  const CS = liste.map((m) => div(cands.get(m))); let sol = null;
  for (let K = liste.length; K >= 1 && !sol; K--) { let nds = 0, bestC = Infinity, bestCh = null; const ch = [];
    const dfs = (i, cost) => { if (++nds > 400000 || cost >= bestC) return; if (i === K) { bestC = cost; bestCh = ch.slice(); return; }
      for (const q of CS[i]) { if (ch.every((o) => ok(q, o))) { ch.push(q); dfs(i + 1, cost + q.cost); ch.pop(); } } };
    dfs(0, 0); if (process.env.DBG) console.log(c.id, "K", K, nds, !!bestCh, CS.map((a) => a.length).join(",")); if (bestCh) sol = bestCh; }
  const best = { ch: new Map(liste.map((m, i) => [m, (sol || [])[i]]).filter(([, q]) => q)) };
  const etats = [{ score: (sol || []).length, cost: 0 }];
  const out = [], res = [];
  for (const m of liste) { const q = best.ch.get(m), t = lab(m), xa = c.X(m.r);
    if (!q) { const a = cands.get(m)[0]; res.push('(au toucher) ' + t);
      if (a) out.push(`<g class="so-alt" data-so-alt="${m.r}" style="display:none">${a.lb ? (a.lb.coude ? coude(a.lb, m) : `<line x1="${xa.toFixed(1)}" x2="${xa.toFixed(1)}" y1="${a.lb.y.toFixed(1)}" y2="${(a.lb.y + a.lb.h).toFixed(1)}" stroke="var(${col(m)})" stroke-width="2" stroke-dasharray="3 2"/>`) : ''}<text x="${a.b.x.toFixed(1)}" y="${(a.b.y + 13).toFixed(1)}" class="so-l">${t}</text></g>`);
      continue; }
    const lead = q.lb && q.lb.coude ? coude(q.lb, m) : q.lb ? `<line x1="${xa.toFixed(1)}" x2="${xa.toFixed(1)}" y1="${q.lb.y.toFixed(1)}" y2="${(q.lb.y + q.lb.h).toFixed(1)}" stroke="var(${col(m)})" stroke-width="2" stroke-dasharray="3 2"/>` : '';
    out.push(`<g class="so-mv" data-so-mv="${m.r}" data-so-nom="${m.r}" role="button" tabindex="0" aria-label="${m.n}, S${sn(m.r)} : ${sg(m.m)}">${lead}<rect x="${(q.b.x - 3).toFixed(1)}" y="${(q.b.y - 3).toFixed(1)}" width="${(q.b.w + 6).toFixed(1)}" height="${H + 6}" fill="transparent"/><text x="${q.b.x.toFixed(1)}" y="${(q.b.y + 13).toFixed(1)}" class="so-l">${t}</text></g>`);
    res.push(t); }
  return { svg: out.join(''), res, score: etats[0].score, cost: etats[0].cost };
}
const coude = (lb, m) => { const [xa, yj, cy, xe] = lb.coude; return `<path d="M${xa.toFixed(1)} ${yj.toFixed(1)}V${cy.toFixed(1)}H${(xe + (xe > xa ? -2 : 2)).toFixed(1)}" fill="none" stroke="var(${col(m)})" stroke-width="2" stroke-dasharray="3 2"/>`; };
const ICO = (n) => `<svg class="ico"><use href="#i-${n}"></use></svg>`;
const BOUT = `<span class="d"><button type="button" class="q-per" data-booster="periode" data-pg-periode="13" aria-label="Période : 3 mois, S47 à S6 (6 sem., 6 mois, An)">3 mois${ICO('bas')}</button><button type="button" class="q-pil bad" data-booster="retards" aria-label="2 en retard">${ICO('k15ret')}2</button><button type="button" class="q-pil nu" data-plein aria-label="Plein écran">${ICO('plein')}</button></span>`;
const NOMBRE = (cls = '') => `<button type="button" class="q5-n ${cls}" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24 : détail"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button>`;
const brosse = (c, t) => `<div class="q-brosse" data-booster="fenetre-semaines" data-pinceau="corps" aria-label="Fenêtre : S47 à S6" style="left:${c.X(1).toFixed(1)}px;width:${(c.X(NW + 1) - c.X(1)).toFixed(1)}px;top:${t}px;height:${c.yB - t + 1}px"><i></i><i></i></div>`;
const fenetre = (c) => `<text x="${(c.X(1) + 8).toFixed(1)}" y="${c.yB - 5}" class="so-f">S47 – S6</text>`;
const dot = (c) => `<circle cx="${c.cx(PB).toFixed(1)}" cy="${c.Y(L[PB]).toFixed(1)}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`;
const tint = (c) => `<rect x="${c.X(20).toFixed(1)}" y="${c.yT}" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${c.yB - c.yT}" fill="var(--bad)" opacity=".07"/>`;
const zone = (c) => `<rect class="rb-z" x="${c.X(20).toFixed(1)}" y="${c.yT}" width="${(c.X(PB + 1) - c.X(20)).toFixed(1)}" height="${c.yB - c.yT}" fill="transparent"/>`;
const maxC = Math.max(...C.slice(T0, N), ...L.slice(T0, N));

function entete(v) {
  const HH = 82, YT = 0, YB = 81, TH = 22, NH = 28; let c, svgW = VW, obst = [], html = '', extra = '', res;
  if (v === 't1') { // titre dans le ciel, en haut à gauche ; boutons à droite
    // le ciel doit laisser passer le titre (0–30) au-dessus du trait, sous le titre et sous les boutons
    let ym = maxC; const tb = { x: 0, y: 0, w: MES.TW + 16, h: TH }, cb = { x: VW - MES.CW - 6, y: 0, w: MES.CW + 6, h: TH };
    const k = (y) => courbe({ yT: YT, yB: YB, ymax: y, id: 'x' });
    while (k(ym).span(tb.x, tb.x + tb.w, 0).top < TH + 2 || k(ym).span(cb.x, cb.x + cb.w, 0).top < TH + 2) ym += 10;
    c = courbe({ yT: YT, yB: YB, ymax: ym, id: 't1' });
    obst = [tb, cb, { x: c.X(1) - 6, y: TH + 4, w: c.X(NW + 1) - c.X(1) + 12, h: 200 }, { x: c.cx(PB) - 8, y: c.Y(L[PB]) - 8, w: 16, h: 16 }];
    const pl = placer(c, obst, GRANDS); res = pl.res;
    html = `<div class="q5-t">${NOMBRE()}${BOUT}</div>${brosse(c, TH + 5)}`;
    extra = pl.svg;
  } else if (v === 't2') { // colonne de titre à gauche, courbe à droite
    const X0 = 166; c = courbe({ x0: X0, pw: VW - X0, yT: YT, yB: YB, ymax: maxC * 1.02, id: 't2' });
    obst = [{ x: c.X(1) - 6, y: 0, w: c.X(NW + 1) - c.X(1) + 12, h: 200 }, { x: c.cx(PB) - 8, y: c.Y(L[PB]) - 8, w: 16, h: 16 }];
    const pl = placer(c, obst, GRANDS); res = pl.res;
    html = `<div class="so-col">${NOMBRE('so-n2')}${BOUT}</div>${brosse(c, c.yT)}`;
    extra = `<line x1="${X0 - 6}" x2="${X0 - 6}" y1="6" y2="${HH - 6}" stroke="var(--line)" stroke-width="1"/>` + pl.svg;
  } else { // t3 : une seule ligne à gauche (chiffre et boutons) ; tout le ciel de droite reste aux mouvements
    const tb = { x: 0, y: 0, w: 12 + MES.TW + 12 + MES.CB + 8, h: TH }; // rangée réelle : marge, chiffre, 12 px, boutons, 8 px
    let ym = maxC;
    while (courbe({ yT: YT, yB: YB, ymax: ym, id: 'x' }).span(tb.x, tb.x + tb.w, 0).top < TH + 2) ym += 10;
    c = courbe({ yT: YT, yB: YB, ymax: ym, id: 't3' });
    obst = [tb, { x: c.X(1) - 6, y: TH + 4, w: c.X(NW + 1) - c.X(1) + 12, h: 200 }, { x: c.cx(PB) - 8, y: c.Y(L[PB]) - 8, w: 16, h: 16 }];
    const pl = placer(c, obst, GRANDS); res = pl.res;
    html = `<div class="q5-t so-t3l">${NOMBRE()}${BOUT}</div>${brosse(c, TH + 5)}`;
    extra = pl.svg;
  }
  const GR = MV.filter((m) => Math.abs(m.m) >= 900 && m.r > NW);
  const svg = `<svg width="${svgW}" height="${HH}" viewBox="0 0 ${svgW} ${HH}" data-booster="mouvements" role="img" aria-label="Libre et caisse de l'année ; mouvements nommés et datés ; fenêtre S47 à S6">${c.defs}${tint(c)}${c.fond}${c.traits}${GR.map((m) => `<g class="so-mv" data-so-mv="${m.r}" role="button" aria-label="${m.n}, S${sn(m.r)} : ${sg(m.m)}">${jump(c, m)}<rect x="${(c.X(m.r) - 8).toFixed(1)}" y="${Math.min(c.Y(C[m.r - 1]), c.Y(C[m.r])).toFixed(1)}" width="16" height="${Math.abs(c.Y(C[m.r - 1]) - c.Y(C[m.r])).toFixed(1)}" fill="transparent"/></g>`).join('')}${zone(c)}${extra}${dot(c)}${fenetre(c)}</svg>`;
  return { HH, res, html: `<header class="qh wq so ${v}">${svg}${html}</header>` };
}

// ---- rangées compactes : repose chaque rangée sur des pistes de 24 px (au navigateur, au chargement) ----
const COMPACT_JS = `(function(){var P=24,D=document;
function lay(){D.querySelectorAll('#fb .lane').forEach(function(l){var lt=l.querySelector('.lt'),lr=l.querySelector('.lr'),pd=l.querySelector('.k18-pd');if(!lr)return;
var X=lr.getBoundingClientRect().left,W=lr.clientWidth,tr=[],it=[];
function libre(t,a,b){var o=tr[t]||[];for(var i=0;i<o.length;i++)if(a<o[i][1]&&o[i][0]<b)return false;return true;}
function poser(a,b,k){for(var t=0;;t++){var ok=true;for(var q=0;q<k;q++)if(!libre(t+q,a,b)){ok=false;break;}if(ok){for(q=0;q<k;q++)(tr[t+q]=tr[t+q]||[]).push([a,b]);return t;}}}
var bars=[].slice.call(lr.querySelectorAll(':scope>.bar')).sort(function(a,b){return a.offsetLeft-b.offsetLeft;});
var tw=0;if(lt){lt.classList.remove('pg-in');lt.style.left='';lt.style.width='';lt.classList.add('so-lt');tw=lt.scrollWidth;(tr[0]=tr[0]||[]).push([0,tw+8]);lt.style.top='0px';}
bars.forEach(function(b){var x=b.offsetLeft,w=b.offsetWidth,lb=b.querySelector('.lbl'),lw=0,k=b.classList.contains('dj')?2:1,ops=[];if(lb){var rg=D.createRange();rg.selectNodeContents(lb);lw=Math.ceil(rg.getBoundingClientRect().width);}
 if(lb){if((lw+18<=w&&!(b.classList.contains('k-brassage')&&k<2))||b.classList.contains('fixe'))ops.push(['in',x,x+w]);ops.push(['ri',x,x+w+8+lw]);ops.push(['le',x-8-lw,x+w]);}else ops.push([null,x,x+w]);
 ops=ops.filter(function(o){return o[1]>=-2&&o[2]<=W+2;});if(!ops.length)ops=[[lb?'in':null,x,x+w]];var best=null;
 ops.forEach(function(o){var t=0;for(;;t++){var ok=true;for(var q=0;q<k;q++)if(!libre(t+q,o[1]-2,o[2]+2)){ok=false;break;}if(ok)break;}if(!best||t<best.t)best={o:o,t:t};});
 for(var q=0;q<k;q++)(tr[best.t+q]=tr[best.t+q]||[]).push([best.o[1]-2,best.o[2]+2]);
 if(lb&&best.o[0]){lb.classList.remove('in','ri','le');lb.classList.add(best.o[0]);}
 b.style.top=(best.t*P+1)+'px';b.dataset.top=best.t*P+1;b.style.height=(k*P-2)+'px';b.classList.add('so-k'+k);});
var ps=pd?[].slice.call(pd.querySelectorAll('.k17-p')):[];
ps.forEach(function(p){var c=parseFloat(p.style.left),n=p.querySelector('.k18-n'),nw=n?n.getBoundingClientRect().width+3:0,o=[[c-13,c+13+nw+2,0],[c-13-nw-2,c+13,1]],bt=null;o.forEach(function(q){for(var t=0;;t++)if(libre(t,q[0],q[1]))break;if(!bt||t<bt.t)bt={q:q,t:t};});(tr[bt.t]=tr[bt.t]||[]).push([bt.q[0],bt.q[1]]);if(bt.q[2])p.classList.add('so-ng');p.style.top=(bt.t*P+1)+'px';});
var n=Math.max(1,tr.length);lr.style.height=(n*P)+'px';if(pd){pd.style.cssText='position:absolute;left:'+lr.offsetLeft+'px;top:0;width:'+W+'px;height:0';}
l.querySelectorAll('.k18-ln').forEach(function(ln){var id=ln.dataset.k18Lien,b=lr.querySelector('[data-chose="'+id+'"]'),p=pd&&pd.querySelector('[data-k17-p="c:'+id+'"]');if(!b||!p)return;
 var cx=parseFloat(p.style.left)+lr.offsetLeft,cy=parseFloat(p.style.top)+12,bx=b.offsetLeft+lr.offsetLeft,bt=b.offsetTop,bb=bt+b.offsetHeight;
 var y0=cy>bb?bb:cy,y1=cy>bb?cy:bt;ln.style.setProperty('top',y0+'px','important');ln.style.height=Math.max(0,y1-y0)+'px';ln.style.left=Math.min(cx,bx)+'px';ln.style.width=Math.abs(bx-cx)+'px';});
});}
lay();window.addEventListener('load',lay);})();`;
const COMPACT_CSS = `
/* rangées compactes : pistes de 24 px, titre de rangée posé à gauche dans la première piste libre */
#fb .lane{padding:0!important;margin:0!important;min-height:24px;box-shadow:inset 0 1px 0 var(--line)}
#fb .lane:first-of-type{box-shadow:none}
#fb .lane .lt.so-lt{position:absolute!important;left:0;height:24px!important;margin:0!important;padding:0!important;display:flex;align-items:center;gap:4px;z-index:2;width:max-content}
#fb .lane .lt.so-lt .g2-leg{display:none}
#fb .lane .lt.so-lt .g2-c{width:24px;height:24px;min-height:0}
#fb .lane .lt.so-lt .g2-q{width:20px;height:20px}
#fb .lane .lt.so-lt .g2-oe{width:26px;height:24px;min-height:0}
#fb .lane .lt.so-lt .g2-r{height:22px}
#fb .lr{margin:0!important}
#fb .bar.so-k1{height:22px!important;min-height:0!important}
#fb .bar.so-k2{height:46px!important}
#fb .bar.so-k1>.lbl{top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;margin-top:0!important;margin-bottom:0!important;line-height:18px!important;height:18px!important;padding-top:0!important;padding-bottom:0!important}
#fb .k17-p{flex-direction:row!important;gap:3px!important;transform:translateX(-11px)!important;height:22px;align-items:center!important}
#fb .k18-r{width:22px!important;height:22px!important}
#fb .k17-p.so-ng{flex-direction:row-reverse!important;transform:translateX(calc(-100% + 11px))!important}
#fb .k17-p .ico{width:14px;height:14px}
`;
// ---- toucher un nom : son montant ----
const MV_JS = `(function(){var D=document,H=D.querySelector('header.qh'),MV=${JSON.stringify(Object.fromEntries(GRANDS.map((m) => [m.r, [touche(m), m.m > 0 ? 'p' : 'n']])))};
function off(){H.querySelectorAll('.so-on').forEach(function(t){t.textContent=t.dataset.o;t.classList.remove('so-on','p','n');t.removeAttribute('transform');});H.querySelectorAll('.so-alt').forEach(function(g){g.style.display='none';});H.querySelectorAll('.so-hid').forEach(function(t){t.classList.remove('so-hid');});}
H.addEventListener('click',function(e){var g=e.target.closest('[data-so-mv]');off();if(!g)return;e.stopPropagation();var r=g.dataset.soMv,v=MV[r],lg=H.querySelector('[data-so-nom="'+r+'"] text');
if(!lg){var al=H.querySelector('[data-so-alt="'+r+'"]');if(!al)return;al.style.display='';lg=al.querySelector('text');}
lg.dataset.o=lg.dataset.o||lg.textContent;lg.textContent=v[0];lg.classList.add('so-on',v[1]);var bb=lg.getBBox(),Wd=H.clientWidth-4;if(bb.x+bb.width>Wd)lg.setAttribute('transform','translate('+(Wd-bb.x-bb.width)+' 0)');
var a=lg.getBoundingClientRect();H.querySelectorAll('svg text').forEach(function(t){if(t===lg)return;var q=t.getBoundingClientRect();if(q.left<a.right+4&&a.left<q.right+4&&q.top<a.bottom&&a.top<q.bottom)(t.closest('g.so-mv')||t).classList.add('so-hid');});});
D.addEventListener('click',function(e){if(!H.contains(e.target))off();});})();`;
// ---- marge du + : la frise et la bande s'arrêtent 52 px avant le bord droit ; positions en px remises à l'échelle une fois ----
const GOUT_JS = `(function(){var D=document,lr=D.querySelector('#fb .lr');if(!lr)return;var W0=lr.clientWidth;D.body.classList.add('so-gout');var k=lr.clientWidth/W0;
D.querySelectorAll('#fb [style]').forEach(function(e){['left','width'].forEach(function(p){var v=e.style[p];if(v&&/px$/.test(v))e.style[p]=(parseFloat(v)*k)+'px';});});})();`;

const NOTE = {};
for (const v of ['t1', 't3']) {
  const e = entete(v);
  let h = W3.replace(/<title>[^<]*<\/title>/, `<title>so ${v} · paysage 844×390 · en-tête bas, rangées compactes</title>`);
  const a = h.indexOf('<header class="qh wq w3">'), b = h.indexOf('</header>', a) + 9; if (a < 0) throw new Error('en-tête w3 absent');
  h = h.slice(0, a) + e.html + h.slice(b);
  const css = `<style id="so-${v}">
.qh.wq.so{height:${e.HH}px!important}
.qh.wq.so .q5-t{height:22px;top:0!important}.qh.wq.so .q5-n{height:22px;line-height:22px}.qh.wq.so .q5-n b{font-size:21px}.qh.wq.so .q-per,.qh.wq.so .q-pil{height:22px}.qh.wq.so .q5-n.so-n3{height:28px;line-height:28px}.qh.wq.so .q5-n.so-n3 b{font-size:26px}
.so-l{font-size:14px;font-weight:600;fill:var(--ink)}
.so-mv{cursor:pointer}
.qh.wq.so .q5-t{pointer-events:none}.qh.wq.so .q5-t>*,.qh.wq.so .q5-t .d>*{pointer-events:auto}.qh.wq.so .q5-t .d{pointer-events:none}
.so-f{font-size:14px;font-weight:700;fill:var(--fin)}
.so-l{paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.so-mv,.so-mv:focus,.so-mv:focus-visible{outline:none}
.qh text.so-on{font-weight:700}.qh text.so-on.n{fill:var(--bad)}.qh text.so-on.p{fill:var(--ok)}.qh .so-hid{opacity:0}
body.so-gout #fb{padding-right:52px!important}body.so-gout #fh .rb-g{margin-right:52px}
.so-col{position:absolute;left:12px;top:0;width:150px;display:flex;flex-direction:column;gap:3px;z-index:3}
.qh.wq.so .so-col .q5-n.so-n2{height:auto;line-height:1.15;display:grid;grid-template-columns:auto auto;column-gap:4px;row-gap:0;height:auto;line-height:1.1;align-items:baseline;justify-content:start;padding:0}
.qh.wq.so .so-col .q5-n.so-n2 b{grid-column:1/3;font-size:28px;line-height:36px}
.so-col .d{margin:0;display:flex;gap:4px}
.so-col .q-per{padding:0 6px 0 9px}
.qh.wq.so .q5-t.so-t3l{right:auto!important}.q5-t.so-t3l .d{margin-left:12px}
.q5-n.so-n3{position:absolute;z-index:3;padding:0}
${COMPACT_CSS}
</style>`;
  const ci = h.lastIndexOf('</head>'); h = h.slice(0, ci) + css + h.slice(ci);
  const j = h.lastIndexOf('</body>'); h = h.slice(0, j) + `<script>${GOUT_JS}</script><script>${COMPACT_JS}</script><script>${MV_JS}</script>` + h.slice(j);
  h = h.replace(/<title>so ${v} /, `<title>so ${v}b `); fs.writeFileSync(path.join(HERE, v + 'b.html'), h);
  NOTE[v] = e.res; console.log(v, e.HH, e.res.join(' | '));
}
