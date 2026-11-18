// Générateur de pièces piégées 100 % fictives (voie t-pieges, D381).
//   node generer.mjs <dossier>                       -> les 11 pièces fixes
//   node generer.mjs <dossier> --hasard 200 --graine 1 -> 200 pièces tirées au hasard (PRNG à graine)
// Sortie par pièce : <nom>.jpg, <nom>.masque.png, <nom>.verite.json (+ hasard.json en mode hasard).
// Le dossier de sortie est hors dépôt. Aucun appel IA, aucun réseau (Chrome local, canvas 2D).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// ---------- PRNG à graine (jamais Math.random) ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const graineDe = (graine, i) => mulberry32((Math.imul(graine, 1000003) + Math.imul(i + 1, 7919) + 12345) | 0)() * 4294967296 >>> 0;
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];

// ---------- Catalogue fictif (articles inventés de brasserie) ----------
// [nom, unité, prix en centimes]
const CATALOGUE = [
  ['MALT PILSNER 25KG', 'pce', 4850], ['MALT MUNICH 25KG', 'pce', 5200], ['MALT CARAMEL 25KG', 'pce', 5480],
  ['MALT BLE 25KG', 'pce', 4990], ['FLOCONS AVOINE 5KG', 'pce', 2380], ['HOUBLON CASCADE 100G', 'pce', 1290],
  ['HOUBLON SAAZ 100G', 'pce', 1190], ['HOUBLON CITRA VRAC', 'kg', 4200], ['HOUBLON MOSAIC VRAC', 'kg', 4650],
  ['LEVURE US-05 11G', 'pce', 650], ['LEVURE W-34/70 11G', 'pce', 790], ['CAPSULES 26MM X100', 'pce', 590],
  ['BOUTEILLE 33CL CARTON24', 'pce', 3290], ['BOUTEILLE 50CL CARTON12', 'pce', 2450], ['FUT INOX 20L', 'pce', 9800],
  ['JOINT FUT SILICONE', 'pce', 480], ['SODA CAUSTIQUE 1KG', 'pce', 1190], ['STAR-SAN 946ML', 'pce', 3150],
  ['PBW NETTOYANT 2KG', 'pce', 2890], ['DENSIMETRE 0-40', 'pce', 1450], ['REFRACTOMETRE BRIX', 'pce', 3900],
  ['SONDE PH PORTABLE', 'pce', 8950], ['TUYAU SILICONE 10M', 'pce', 2290], ['ROBINET INOX 1/2', 'pce', 1790],
  ['ETIQUETTES A4 X50', 'pce', 1290], ['BOUCHONS LIEGE X50', 'pce', 1590], ['CO2 BOUTEILLE 2KG', 'pce', 4400],
  ['SUCRE BRASSAGE VRAC', 'kg', 340], ['MALT PALE VRAC', 'kg', 190], ['SEL GYPSE VRAC', 'kg', 560],
  ['IRISH MOSS 50G', 'pce', 420], ['ACIDE LACTIQUE 1L', 'pce', 1650], ['THERMOMETRE SONDE', 'pce', 2190],
  ['SAC FILTRANT 40CM', 'pce', 1190], ['CHARBON ACTIF 100G', 'pce', 780], ['EAU DEMINERALISEE', 'l', 85],
  ['ETHANOL 70% SANITISANT', 'l', 640], ['MOUT FRAIS ECHANTILLON', 'l', 310], ['CARTON ENVOI 6 BOUTEILLES', 'pce', 360],
];
const REMISES = ['REMISE FIDELITE', 'REMISE QUANTITE -5%', 'REMISE COUPON', 'REMISE 10% MALTS', 'REMISE CARTE CLUB'];

const fmtC = (c) => (c / 100).toFixed(2);
const frs = (c) => Number((c / 100).toFixed(2));

// ---------- Contenu : articles et lignes visuelles ----------
function buildContent(p) {
  const R = mulberry32(p.contentSeed);
  const arts = [];
  const runStart = p.run ? p.run.start : -1, runEnd = p.run ? p.run.start + p.run.len : -1;
  const remiseSet = new Set(p.remises || []);
  const budget = p.targetLines ? p.targetLines - 2 : Infinity;
  const nItems = p.nArticles ? p.nArticles - 2 : Infinity;
  const [m1, m2, m3] = p.mix;
  let used = 0, remiseK = 0;
  for (let i = 0; i < nItems && used < budget; i++) {
    let name, unit, priceC, qty, nLines, note, type = 'item';
    const remaining = budget - used;
    const lignesLibres = () => {
      const r = R() * (m1 + m2 + m3);
      return r < m1 ? 1 : r < m1 + m2 ? 2 : 3;
    };
    const lignesDeuxOuTrois = () => (m3 > 0 && R() * (m2 + m3) >= m2 ? 3 : 2);
    if (i >= runStart && i < runEnd) {
      type = 'run'; name = 'BIERE BLONDE 33CL'; unit = 'pce'; priceC = 250; qty = 1; nLines = p.run.lines;
      note = 'REF BB-33 LOT 24-0071';
    } else if (remiseSet.has(i)) {
      type = 'remise'; name = REMISES[remiseK++ % REMISES.length]; unit = 'pce'; priceC = -(100 + Math.floor(R() * 1400)); qty = 1; nLines = 1;
    } else {
      const it = pick(R, CATALOGUE);
      name = it[0]; unit = it[1]; priceC = it[2];
      if (unit === 'pce') qty = R() < 0.78 ? 1 : 2 + Math.floor(R() * 11);
      else if (unit === 'kg') qty = Number((0.1 + R() * 9.8).toFixed(3));
      else qty = 1 + Math.floor(R() * 24);
      note = 'REF MP-' + (1000 + Math.floor(R() * 9000)) + ' LOT ' + (24 + Math.floor(R() * 2)) + '-' + (100 + Math.floor(R() * 900));
      const libre = qty === 1 && unit === 'pce';
      const forced = p.forceEvery && i % p.forceEvery === 3;
      nLines = !libre || forced ? lignesDeuxOuTrois() : lignesLibres();
    }
    if (nLines > remaining) {
      if (remaining === 1 && type === 'item') { // il ne reste qu'une ligne : article unitaire
        const it = pick(R, CATALOGUE.filter((c) => c[1] === 'pce'));
        name = it[0]; unit = 'pce'; priceC = it[2]; qty = 1;
      }
      nLines = remaining;
    }
    name = name.slice(0, p.maxName);
    arts.push({ type, name, unit, priceC, qty, nLines, note });
    used += nLines;
  }
  // frais de port : choisi pour que l'arrondi soit non nul (jamais 0)
  const s0 = arts.reduce((s, a) => s + Math.round(a.qty * a.priceC + 1e-9), 0);
  let portC = 700;
  for (let c = 1; c <= 4; c++) if ((s0 + 700 + c) % 5 !== 0) { portC = 700 + c; break; }
  arts.push({ type: 'port', name: 'FRAIS DE PORT', unit: 'pce', priceC: portC, qty: 1, nLines: 1, note: '' });
  const s1 = s0 + portC;
  const m = s1 % 5; // arrondi à 0.05
  const arrC = m <= 2 ? -m : 5 - m;
  arts.push({ type: 'arrondi', name: 'ARRONDI', unit: 'pce', priceC: arrC, qty: 1, nLines: 1, note: '' });
  for (const a of arts) a.amountC = Math.round(a.qty * a.priceC + 1e-9);
  const totalC = arts.reduce((s, a) => s + a.amountC, 0);
  return { arts, totalC, nbLignesArticles: arts.reduce((s, a) => s + a.nLines, 0) };
}

const qtyStr = (a) => (a.unit === 'kg' ? a.qty.toFixed(3) : String(a.qty));

// ---------- Mise en page : lignes visuelles ----------
function mkLayout(p, content) {
  const W = p.W, lh = p.lh, fs = p.fs, mx = Math.max(24, Math.round(W * 0.05));
  const cw = fs * 0.6;
  const lines = [];
  const push = (art, cells, extra) => lines.push(Object.assign({ art, cells }, extra || {}));
  const firstLine = [];
  const totalTxt = fmtC(content.totalC);
  const tva = fmtC(Math.round((content.totalC * 81) / 1081));
  if (p.kind === 'ticket') {
    const c = W / 2;
    push(null, [{ t: 'BRASSERIE FICTIVE SA', x: c, a: 'c', bold: true }]);
    push(null, [{ t: 'Route de la Houblonniere 12', x: c, a: 'c' }]);
    push(null, [{ t: '1000 Lausanne - Suisse', x: c, a: 'c' }]);
    push(null, [{ t: 'TVA CHE-000.000.000', x: c, a: 'c' }]);
    push(null, [{ t: 'Ticket 004821  03.11.2026 14:32', x: c, a: 'c' }]);
    push(null, [{ t: 'Caisse 2 - Vendeur Anna', x: c, a: 'c' }]);
    const sep = '-'.repeat(Math.floor((W - 2 * mx) / cw));
    push(null, [{ t: sep, x: mx, a: 'l' }]);
    push(null, [{ t: 'ARTICLE', x: mx, a: 'l', bold: true }, { t: 'MONTANT CHF', x: W - mx, a: 'r', bold: true }]);
    push(null, [{ t: sep, x: mx, a: 'l' }]);
    content.arts.forEach((a, rank) => {
      firstLine[rank] = lines.length;
      const fill = p.zebra && rank % 2 === 1;
      const amt = { t: fmtC(a.amountC), x: W - mx, a: 'r' };
      const q = { t: qtyStr(a) + (a.unit === 'pce' ? '' : ' ' + a.unit) + ' x ' + fmtC(a.priceC), x: mx + 2 * cw, a: 'l' };
      if (a.nLines === 1) push(rank, [{ t: a.name, x: mx, a: 'l' }, amt], { fill });
      else if (a.nLines === 2) { push(rank, [{ t: a.name, x: mx, a: 'l' }], { fill }); push(rank, [q, amt], { fill }); }
      else {
        push(rank, [{ t: a.name, x: mx, a: 'l' }], { fill });
        push(rank, [{ t: a.note, x: mx + 2 * cw, a: 'l', grey: true }], { fill });
        push(rank, [q, amt], { fill });
      }
    });
    push(null, [{ t: sep, x: mx, a: 'l' }]);
    push(null, [{ t: 'TOTAL TTC CHF', x: mx, a: 'l', bold: true }, { t: totalTxt, x: W - mx, a: 'r', bold: true }]);
    push(null, [{ t: 'dont TVA 8.1 %', x: mx, a: 'l' }, { t: tva, x: W - mx, a: 'r' }]);
    push(null, [{ t: 'PAIEMENT CARTE', x: mx, a: 'l' }, { t: totalTxt, x: W - mx, a: 'r' }]);
    push(null, [{ t: sep, x: mx, a: 'l' }]);
    push(null, [{ t: 'MERCI DE VOTRE VISITE', x: c, a: 'c' }]);
    push(null, [{ t: 'Brasserie Fictive SA', x: c, a: 'c' }]);
  } else {
    const xq = W * 0.6, xu = W * 0.615, xp = W * 0.8, xm = W - mx;
    push(null, [{ t: 'BRASSERIE FICTIVE SA', x: mx, a: 'l', bold: true }]);
    push(null, [{ t: 'Route de la Houblonniere 12 - 1000 Lausanne', x: mx, a: 'l' }]);
    push(null, [{ t: 'TVA CHE-000.000.000', x: mx, a: 'l' }]);
    push(null, [{ t: 'FACTURE No 2026-0412', x: mx, a: 'l', bold: true }, { t: 'Date : 03.11.2026', x: xm, a: 'r' }]);
    push(null, [{ t: 'Client : Brasserie Exemple Sarl', x: mx, a: 'l' }, { t: 'Echeance : 03.12.2026', x: xm, a: 'r' }]);
    push(null, [{ t: 'Désignation', x: mx, a: 'l', bold: true }, { t: 'Qté', x: xq, a: 'r', bold: true }, { t: 'Unité', x: xu, a: 'l', bold: true },
      { t: 'PU TTC', x: xp, a: 'r', bold: true }, { t: 'Montant TTC', x: xm, a: 'r', bold: true }], { head: true });
    content.arts.forEach((a, rank) => {
      firstLine[rank] = lines.length;
      const fill = p.zebra && rank % 2 === 1;
      const cols = [{ t: qtyStr(a), x: xq, a: 'r' }, { t: a.unit, x: xu, a: 'l' }, { t: fmtC(a.priceC), x: xp, a: 'r' }, { t: fmtC(a.amountC), x: xm, a: 'r' }];
      if (a.nLines === 1) push(rank, [{ t: a.name, x: mx, a: 'l' }].concat(cols), { fill });
      else if (a.nLines === 2) { push(rank, [{ t: a.name, x: mx, a: 'l' }], { fill }); push(rank, cols, { fill }); }
      else {
        push(rank, [{ t: a.name, x: mx, a: 'l' }], { fill });
        push(rank, [{ t: a.note, x: mx + 20, a: 'l', grey: true, small: true }], { fill });
        push(rank, cols, { fill });
      }
    });
    push(null, [{ t: 'TOTAL TTC', x: xp, a: 'r', bold: true }, { t: totalTxt, x: xm, a: 'r', bold: true }]);
    push(null, [{ t: 'dont TVA 8.1 %', x: xp, a: 'r' }, { t: tva, x: xm, a: 'r' }]);
    push(null, [{ t: 'Paiement à 30 jours net - merci de votre confiance', x: W / 2, a: 'c' }]);
  }
  const top = Math.max(40, Math.round(lh * 1.5));
  const H = top + lines.length * lh + top;
  return { lines, firstLine, top, H };
}

// ---------- Géométrie (rotation, perspective, recadrage / fond) ----------
function geometrie(p, W, H) {
  const th = (Math.abs(p.rot) * Math.PI) / 180;
  let padX = 0, padY = 0;
  if (th > 0 || p.k > 0 || p.table) {
    padX = Math.ceil((H / 2) * Math.sin(th) + (W * p.k) / 2 + 12);
    padY = Math.ceil((W / 2) * Math.sin(th) + 12);
    if (p.table) { padX += Math.round(W * 0.14); padY += Math.round(p.lh * 3 + 40); }
  }
  return { padX, padY, Dw: W + 2 * padX, Dh: H + 2 * padY, bg: padX || padY ? p.table || 'clair' : null };
}

// ---------- Effets : positions résolues en pixels ----------
function resolveEffets(p, content, lay) {
  const W = p.W, lh = p.lh, top = lay.top, L = lay.lines.length;
  const stains = (p.stains || []).map((s) => {
    let cy;
    if (s.line != null) cy = top + (s.line + 0.5 + (s.dy || 0)) * lh;
    else if (s.art != null) cy = top + (lay.firstLine[Math.min(s.art, content.arts.length - 1)] + 0.5 + (s.dy || 0)) * lh;
    else cy = top + s.yFrac * L * lh;
    return { cx: s.fx * W, cy, rw: (s.wFrac * W) / 2, rh: (s.hLines * lh) / 2, alpha: s.alpha, seed: s.seed, mode: s.mode || 'fixe', ligne: s.line != null ? s.line : s.art != null ? lay.firstLine[Math.min(s.art, content.arts.length - 1)] : Math.floor(((cy - top) / lh)) };
  });
  const fades = (p.fades || []).map((f) => ({ cx: f.fx * W, cy: top + f.yFrac * L * lh, rw: f.wFrac * W / 2, rh: f.hLines * lh / 2, alpha: f.alpha }));
  const pli = p.pli ? { y: top + p.pli.line * lh, tilt: p.pli.tilt, line: p.pli.line } : null;
  return { stains, fades, pli };
}

// ---------- Fonction exécutée dans Chrome (canvas 2D) ----------
async function pageRender(spec) {
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const R = mulberry(spec.seed);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rgb = (c, a) => (a === undefined ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const W = spec.W, H = spec.H, lh = spec.lh, top = spec.top;
  const TWO_PI = Math.PI * 2;

  // --- feuille à plat ---
  const flat = mk(W, H);
  const g = flat.getContext('2d');
  g.fillStyle = rgb(spec.paper);
  g.fillRect(0, 0, W, H);
  if (spec.photo) { // marbrures du papier
    const nb = Math.round((W * H) / 90000);
    for (let i = 0; i < nb; i++) {
      const cx = R() * W, cy = R() * H, r = 120 + R() * 380, dark = R() < 0.5, al = 0.025 + R() * 0.04;
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, dark ? 'rgba(60,50,40,' + al + ')' : 'rgba(255,255,255,' + al + ')');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    }
  }
  // rangées grisées et en-tête
  spec.lines.forEach((ln, i) => {
    if (ln.fill || ln.head) { g.fillStyle = rgb(ln.head ? spec.headColor : spec.zebraColor); g.fillRect(0, top + i * lh, W, lh); }
  });
  // texte
  g.textBaseline = 'middle';
  spec.lines.forEach((ln, i) => {
    const y = top + i * lh + lh / 2 + spec.fs * 0.04;
    const v = spec.photo ? Math.round((R() - 0.5) * spec.inkVar) : 0;
    for (const c of ln.cells) {
      const size = c.small ? Math.round(spec.fs * 0.85) : spec.fs;
      g.font = (c.bold ? 'bold ' : '') + size + 'px ' + spec.family;
      g.textAlign = c.a === 'r' ? 'right' : c.a === 'c' ? 'center' : 'left';
      const iv = clamp(spec.ink + v + (c.grey ? 45 : 0), 0, 255);
      g.fillStyle = 'rgb(' + iv + ',' + iv + ',' + clamp(iv + 4, 0, 255) + ')';
      g.globalAlpha = spec.photo ? 0.86 + R() * 0.14 : 1;
      g.fillText(c.t, c.x, y);
    }
  });
  g.globalAlpha = 1;

  // --- masque à plat : une couleur unique par ligne visuelle (n = rang + 1 ; r = n&255, g = n>>8) ---
  const maskFlat = mk(W, H);
  const mg = maskFlat.getContext('2d');
  mg.fillStyle = 'rgb(0,0,0)'; mg.fillRect(0, 0, W, H);
  spec.lines.forEach((ln, i) => {
    const n = i + 1;
    mg.fillStyle = 'rgb(' + (n & 255) + ',' + ((n >> 8) & 255) + ',0)';
    mg.fillRect(0, top + i * lh, W, lh);
  });

  // --- défauts de la feuille (sur le papier, donc déformés avec lui) ---
  const blob = (cx, cy, rx, ry, alpha, S) => {
    const n = 56, amp = [], ph = [];
    for (let j = 0; j < 4; j++) { amp.push(0.05 + S() * 0.16); ph.push(S() * TWO_PI); }
    const path = (sc) => {
      g.beginPath();
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * TWO_PI; let r = 1;
        for (let j = 0; j < 4; j++) r += amp[j] * Math.sin((j + 2) * a + ph[j]);
        const x = cx + rx * sc * r * Math.cos(a), y = cy + ry * sc * r * Math.sin(a);
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
    };
    g.globalCompositeOperation = 'multiply';
    g.filter = 'blur(' + (1 + Math.min(4, ry * 0.04)).toFixed(1) + 'px)';
    path(1); g.fillStyle = 'rgba(190,150,105,' + alpha * 0.6 + ')'; g.fill();
    g.lineWidth = Math.max(1.5, ry * 0.05); g.strokeStyle = 'rgba(120,80,40,' + Math.min(0.55, alpha * 0.9) + ')'; g.stroke();
    path(0.6); g.fillStyle = 'rgba(160,115,70,' + alpha * 0.25 + ')'; g.fill();
    const d = 2 + Math.floor(S() * 4);
    for (let q = 0; q < d; q++) {
      const a = S() * TWO_PI, dist = 1.05 + S() * 0.5, rr = (0.06 + S() * 0.12) * ry;
      g.beginPath(); g.ellipse(cx + rx * dist * Math.cos(a), cy + ry * dist * Math.sin(a), rr * 1.1, rr, 0, 0, TWO_PI);
      g.fillStyle = 'rgba(160,115,70,' + alpha * 0.6 + ')'; g.fill();
    }
    g.filter = 'none';
    g.globalCompositeOperation = 'source-over';
  };
  if (spec.wash) { // décoloration / lavis sur toute la hauteur
    g.globalCompositeOperation = 'multiply';
    const ph = R() * 6;
    for (let y = 0; y < H; y += 20) {
      const k = 0.75 + 0.25 * Math.sin(y / 180 + ph) + 0.2 * (R() - 0.5);
      const lg = g.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, rgb(spec.wash.color, spec.wash.alpha * k));
      lg.addColorStop(0.5, rgb(spec.wash.color, spec.wash.alpha * k * (0.7 + 0.5 * R())));
      lg.addColorStop(1, rgb(spec.wash.color, spec.wash.alpha * k * (0.7 + 0.5 * R())));
      g.fillStyle = lg; g.fillRect(0, y, W, Math.min(20, H - y));
    }
    g.globalCompositeOperation = 'source-over';
  }
  for (const f of spec.fades) { // encre effacée par plaques
    g.save(); g.translate(f.cx, f.cy); g.scale(f.rw, f.rh);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    rg.addColorStop(0, rgb(spec.paper, f.alpha)); rg.addColorStop(0.7, rgb(spec.paper, f.alpha * 0.7)); rg.addColorStop(1, rgb(spec.paper, 0));
    g.fillStyle = rg; g.fillRect(-1, -1, 2, 2); g.restore();
  }
  for (const s of spec.stains) blob(s.cx, s.cy, s.rw, s.rh, s.alpha, mulberry(s.seed));
  if (spec.pli) { // pli en travers : bande sombre puis claire, légèrement inclinée
    g.save(); g.translate(0, spec.pli.y); g.rotate(Math.atan2(spec.pli.tilt, W));
    const t = Math.max(14, Math.round(lh * 0.6));
    const lg = g.createLinearGradient(0, -t, 0, t);
    lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.4, 'rgba(0,0,0,0.30)'); lg.addColorStop(0.49, 'rgba(0,0,0,0.42)');
    lg.addColorStop(0.52, 'rgba(255,255,255,0.6)'); lg.addColorStop(0.62, 'rgba(255,255,255,0.22)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(-20, -t, W + 40, 2 * t);
    g.restore();
  }
  if (spec.corner) { // coin replié : le coin laisse voir la table, le rabat montre le dos du papier
    const s = spec.corner.size;
    g.save();
    if (spec.corner.where === 'bl') { g.translate(W, H); g.rotate(Math.PI); }
    g.beginPath(); g.moveTo(W - s, 0); g.lineTo(W, 0); g.lineTo(W, s); g.closePath(); g.fillStyle = rgb(spec.tableColor); g.fill();
    const lg = g.createLinearGradient(W - s * 0.1, s * 0.1, W - s * 0.55, s * 0.55);
    lg.addColorStop(0, rgb(spec.backColor)); lg.addColorStop(1, rgb(spec.paper.map((x) => clamp(x - 22, 0, 255))));
    g.beginPath(); g.moveTo(W - s, 0); g.lineTo(W, s); g.lineTo(W - s, s); g.closePath(); g.fillStyle = lg; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(W - s, 0); g.lineTo(W, s); g.stroke();
    g.restore();
  }

  // --- déformation (même fonction pour la photo et le masque) ---
  const Dw = spec.Dw, Dh = spec.Dh;
  let photo, mask;
  const geo = spec.padX > 0 || spec.padY > 0 || spec.rot !== 0 || spec.k !== 0;
  if (!geo) { photo = flat; mask = maskFlat; }
  else {
    const srcP = g.getImageData(0, 0, W, H).data;
    const srcM = mg.getImageData(0, 0, W, H).data;
    let bgD = null;
    if (spec.bg) { // table
      const bc = mk(Dw, Dh), b = bc.getContext('2d');
      const base = spec.tableColor;
      b.fillStyle = rgb(base); b.fillRect(0, 0, Dw, Dh);
      const dark = spec.bg === 'sombre';
      const nb = Math.min(1400, Math.round((Dw * Dh) / 5000));
      for (let i = 0; i < nb; i++) {
        const x = R() * Dw, y = R() * Dh, len = 60 + R() * 260;
        b.strokeStyle = R() < 0.5 ? 'rgba(0,0,0,' + (0.02 + R() * 0.04) + ')' : 'rgba(255,230,200,' + (dark ? 0.015 + R() * 0.025 : 0.03 + R() * 0.04) + ')';
        b.lineWidth = 1 + R() * 2; b.beginPath(); b.moveTo(x, y); b.lineTo(x + len, y + (R() - 0.5) * 6); b.stroke();
      }
      const vg = b.createRadialGradient(Dw / 2, Dh / 2, Math.min(Dw, Dh) * 0.25, Dw / 2, Dh / 2, Math.max(Dw, Dh) * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.4)');
      b.fillStyle = vg; b.fillRect(0, 0, Dw, Dh);
      bgD = b.getImageData(0, 0, Dw, Dh).data;
    }
    const th = (spec.rot * Math.PI) / 180, co = Math.cos(th), si = Math.sin(th), k = spec.k;
    const outP = new Uint8ClampedArray(Dw * Dh * 4), outM = new Uint8ClampedArray(Dw * Dh * 4);
    const fill0 = [spec.tableColor[0], spec.tableColor[1], spec.tableColor[2]];
    for (let Y = 0; Y < Dh; Y++) {
      const dy = Y + 0.5 - Dh / 2;
      for (let X = 0; X < Dw; X++) {
        const dx = X + 0.5 - Dw / 2;
        const u = dx * co + dy * si, v = -dx * si + dy * co;
        const sc = 1 - (k * v) / H;
        const sx = u / sc + W / 2 - 0.5, sy = v + H / 2 - 0.5;
        const o = (Y * Dw + X) * 4;
        // masque : plus proche voisin, couleurs exactes ; hors feuille = noir
        const ix = Math.round(sx), iy = Math.round(sy);
        if (ix >= 0 && ix < W && iy >= 0 && iy < H) {
          const q = (iy * W + ix) * 4; outM[o] = srcM[q]; outM[o + 1] = srcM[q + 1]; outM[o + 2] = srcM[q + 2];
        }
        outM[o + 3] = 255;
        // photo : bilinéaire, bord adouci d'un pixel, fond de table au-delà
        const cov = clamp(sx + 0.5, 0, 1) * clamp(W - 0.5 - sx, 0, 1) * clamp(sy + 0.5, 0, 1) * clamp(H - 0.5 - sy, 0, 1);
        let r, gg, bb;
        if (cov > 0) {
          const xa = clamp(Math.floor(sx), 0, W - 1), xb = Math.min(xa + 1, W - 1), ya = clamp(Math.floor(sy), 0, H - 1), yb = Math.min(ya + 1, H - 1);
          const fx = clamp(sx - xa, 0, 1), fy = clamp(sy - ya, 0, 1);
          const i00 = (ya * W + xa) * 4, i10 = (ya * W + xb) * 4, i01 = (yb * W + xa) * 4, i11 = (yb * W + xb) * 4;
          const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
          r = srcP[i00] * w00 + srcP[i10] * w10 + srcP[i01] * w01 + srcP[i11] * w11;
          gg = srcP[i00 + 1] * w00 + srcP[i10 + 1] * w10 + srcP[i01 + 1] * w01 + srcP[i11 + 1] * w11;
          bb = srcP[i00 + 2] * w00 + srcP[i10 + 2] * w10 + srcP[i01 + 2] * w01 + srcP[i11 + 2] * w11;
        }
        if (cov < 1) {
          const br = bgD ? bgD[o] : fill0[0], bg2 = bgD ? bgD[o + 1] : fill0[1], bb2 = bgD ? bgD[o + 2] : fill0[2];
          if (cov > 0) { r = r * cov + br * (1 - cov); gg = gg * cov + bg2 * (1 - cov); bb = bb * cov + bb2 * (1 - cov); }
          else { r = br; gg = bg2; bb = bb2; }
        }
        outP[o] = r; outP[o + 1] = gg; outP[o + 2] = bb; outP[o + 3] = 255;
      }
    }
    photo = mk(Dw, Dh); photo.getContext('2d').putImageData(new ImageData(outP, Dw, Dh), 0, 0);
    mask = mk(Dw, Dh); mask.getContext('2d').putImageData(new ImageData(outM, Dw, Dh), 0, 0);
  }
  const maskUrl = mask.toDataURL('image/png');
  if (geo) { flat.width = 0; maskFlat.width = 0; mask.width = 0; }

  // --- lumière, ombre, flou, bruit : sur la photo seulement ---
  let final = photo;
  if (spec.photo) {
    const p2 = photo.getContext('2d');
    if (spec.shade.kind !== 'none') {
      const ang = spec.shade.angle, dxn = Math.cos(ang), dyn = Math.sin(ang);
      const half = (Math.abs(dxn) * Dw + Math.abs(dyn) * Dh) / 2;
      const lg = p2.createLinearGradient(Dw / 2 - dxn * half, Dh / 2 - dyn * half, Dw / 2 + dxn * half, Dh / 2 + dyn * half);
      const v = Math.round(255 * (1 - spec.shade.strength));
      lg.addColorStop(0, 'rgb(255,255,255)'); lg.addColorStop(1, 'rgb(' + v + ',' + v + ',' + v + ')');
      p2.globalCompositeOperation = 'multiply'; p2.fillStyle = lg; p2.fillRect(0, 0, Dw, Dh);
      if (spec.shade.kind === 'ombre') { // ombre portée d'un téléphone sur un côté
        const m = 90, lay = mk(Dw + 2 * m, Dh + 2 * m), l2 = lay.getContext('2d');
        l2.fillStyle = 'rgb(255,255,255)'; l2.fillRect(0, 0, lay.width, lay.height);
        const sw = Dw * 0.5, sh = Math.min(Dh * 0.55, Dw * 2.2);
        const cx = (spec.shade.side === 'left' ? -Dw * 0.02 : Dw * 1.02) + m, cy = Dh * spec.shade.yFrac + m;
        l2.save(); l2.translate(cx, cy); l2.rotate(spec.shade.tilt);
        const rr = 60; l2.beginPath();
        l2.moveTo(-sw / 2 + rr, -sh / 2); l2.arcTo(sw / 2, -sh / 2, sw / 2, sh / 2, rr); l2.arcTo(sw / 2, sh / 2, -sw / 2, sh / 2, rr);
        l2.arcTo(-sw / 2, sh / 2, -sw / 2, -sh / 2, rr); l2.arcTo(-sw / 2, -sh / 2, sw / 2, -sh / 2, rr); l2.closePath();
        l2.fillStyle = 'rgba(0,0,0,' + spec.shade.dark + ')'; l2.fill(); l2.restore();
        const bl = mk(Dw + 2 * m, Dh + 2 * m), b2 = bl.getContext('2d');
        b2.filter = 'blur(' + Math.max(8, Math.round(Dw * 0.03)) + 'px)'; b2.drawImage(lay, 0, 0);
        p2.drawImage(bl, -m, -m);
        lay.width = 0; bl.width = 0;
      }
      p2.globalCompositeOperation = 'source-over';
    }
    if (spec.blur > 0) { // flou gaussien : marges prolongées pour ne pas assombrir les bords
      const m = Math.ceil(spec.blur * 4);
      const big = mk(Dw + 2 * m, Dh + 2 * m), b = big.getContext('2d');
      b.drawImage(photo, m, m);
      b.drawImage(photo, 0, 0, Dw, 1, m, 0, Dw, m); b.drawImage(photo, 0, Dh - 1, Dw, 1, m, Dh + m, Dw, m);
      b.drawImage(photo, 0, 0, 1, Dh, 0, m, m, Dh); b.drawImage(photo, Dw - 1, 0, 1, Dh, Dw + m, m, m, Dh);
      b.drawImage(photo, 0, 0, 1, 1, 0, 0, m, m); b.drawImage(photo, Dw - 1, 0, 1, 1, Dw + m, 0, m, m);
      b.drawImage(photo, 0, Dh - 1, 1, 1, 0, Dh + m, m, m); b.drawImage(photo, Dw - 1, Dh - 1, 1, 1, Dw + m, Dh + m, m, m);
      const bl = mk(Dw + 2 * m, Dh + 2 * m), c = bl.getContext('2d');
      c.filter = 'blur(' + spec.blur + 'px)'; c.drawImage(big, 0, 0);
      final = mk(Dw, Dh); final.getContext('2d').drawImage(bl, -m, -m);
      big.width = 0; bl.width = 0;
    }
    if (spec.noise > 0) { // bruit de capteur
      const fc = final.getContext('2d'), id = fc.getImageData(0, 0, Dw, Dh), d = id.data, s2 = spec.noise * 2;
      for (let i = 0; i < d.length; i += 4) {
        const n = (R() + R() + R() - 1.5) * s2;
        d[i] += n + (R() - 0.5) * s2 * 0.3; d[i + 1] += n + (R() - 0.5) * s2 * 0.3; d[i + 2] += n + (R() - 0.5) * s2 * 0.3;
      }
      fc.putImageData(id, 0, 0);
    }
  }
  const jpg = final.toDataURL('image/jpeg', spec.jpeg);
  return { w: Dw, h: Dh, jpg: jpg.slice(jpg.indexOf(',') + 1), mask: maskUrl.slice(maskUrl.indexOf(',') + 1) };
}

// ---------- Pièces fixes (11) ----------
const PAPIER_BLANC = [236, 234, 226];
function baseTicket(extra) {
  return Object.assign({
    kind: 'ticket', W: 700, lh: 28, nArticles: 135, contentSeed: 7, mix: [1, 0, 0], forceEvery: 8,
    run: { start: 44, len: 6, lines: 1 }, remises: [20, 57, 84, 110], zebra: false, paper: PAPIER_BLANC, ink: 38,
    photo: true, stains: [], fades: [], wash: null, pli: null, corner: null, blur: 0, rot: 0, k: 0,
    shade: { kind: 'gradient', strength: 0.1, angle: 0.7 }, table: null, noise: 3, jpeg: 0.8,
  }, extra);
}
function piecesFixes() {
  const R = mulberry32(2026);
  const taches = (lines, n) => lines.map((line, i) => ({ line, fx: 0.25 + R() * 0.5, wFrac: 0.3 + R() * 0.25, hLines: 3, alpha: 0.35 + R() * 0.15, seed: 100 + i + n }));
  const totale = [];
  for (let line = 6; line < 200; line += 12) totale.push({ line, dy: R() - 0.5, fx: 0.1 + R() * 0.8, wFrac: 0.2 + R() * 0.4, hLines: 2 + R() * 3, alpha: 0.2 + R() * 0.3, seed: 500 + line });
  const fades = [];
  for (let i = 0; i < 8; i++) fades.push({ fx: R(), yFrac: (i + 0.5) / 8, wFrac: 0.5, hLines: 14, alpha: 0.35 });
  return [
    ['papier-gris', baseTicket({ paper: [185, 185, 185], ink: 50, shade: { kind: 'none', strength: 0, angle: 0 } })],
    ['tache-jonctions', baseTicket({ stains: taches([25, 50, 75, 100], 0) })],
    ['tache-totale', baseTicket({ wash: { color: [225, 200, 150], alpha: 0.4 }, fades, stains: totale })],
    ['flou-leger', baseTicket({ blur: 1.2 })],
    ['flou-fort', baseTicket({ blur: 2.5 })],
    ['ombre', baseTicket({ shade: { kind: 'ombre', strength: 0.45, angle: 0.3, side: 'left', yFrac: 0.35, tilt: 0.18, dark: 0.7 } })],
    ['penche', baseTicket({ rot: 2.5, k: 0.04, table: 'clair' })],
    ['pli', baseTicket({ pli: { line: 80, tilt: 14 }, corner: { size: 90, where: 'tr' }, table: null, tableForCorner: 'clair' })],
    ['fond-table', baseTicket({ table: 'sombre', rot: 0.6 })],
    ['tout', baseTicket({ blur: 1.2, rot: 1.5, k: 0.03, table: 'clair', noise: 4, stains: taches([50], 9).map((s) => Object.assign(s, { alpha: 0.5, wFrac: 0.45 })),
      shade: { kind: 'ombre', strength: 0.3, angle: 0.5, side: 'right', yFrac: 0.45, tilt: -0.15, dark: 0.55 } })],
    ['facture-zebre', {
      kind: 'facture', W: 1240, lh: 32, targetLines: 300, contentSeed: 11, mix: [0.6, 0.4, 0], forceEvery: 8,
      run: { start: 44, len: 6, lines: 1 }, remises: [20, 57, 84, 110, 150, 210], zebra: true, paper: [255, 255, 255], ink: 25,
      photo: false, stains: [], fades: [], wash: null, pli: null, corner: null, blur: 0, rot: 0, k: 0,
      shade: { kind: 'none', strength: 0, angle: 0 }, table: null, noise: 0, jpeg: 0.8,
    }],
  ].map(([nom, p], i) => ({ nom, p: Object.assign(p, { seed: 9000 + i, preset: true }) }));
}

// ---------- Pièces au hasard ----------
const AREA_SOUPLE = 5.0e6;
function tirerPiece(graine, i) {
  const R = mulberry32(graineDe(graine, i));
  const W = 500 + Math.floor(R() * 801);
  const kind = W >= 900 && R() < 0.6 ? 'facture' : 'ticket';
  const photo = kind === 'ticket' ? true : R() < 0.5;
  let N = 40 + Math.floor(R() * 261);
  const mix = pick(R, [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0.5, 0], [0.4, 0.4, 0.2], [0.2, 0.5, 0.3], [0.6, 0.3, 0.1]]);
  const aEff = mix[0] + 2 * mix[1] + 3 * mix[2] + 0.35;
  const lhMaxLarg = Math.min(34, Math.floor(W / 18));
  // densité : la hauteur de ligne est tirée d'abord, le nombre d'articles est borné ensuite pour garder des fichiers raisonnables
  let lh = 18 + Math.floor(R() * (lhMaxLarg - 18 + 1));
  if (W * lh * N * aEff * 1.1 > AREA_SOUPLE) { // un tirage sur deux garde le nombre d'articles, l'autre garde la densité
    if (R() < 0.5) lh = Math.max(18, Math.min(lh, Math.floor(AREA_SOUPLE / (W * N * aEff * 1.1))));
    N = Math.max(40, Math.min(N, Math.floor(AREA_SOUPLE / (W * lh * aEff * 1.1))));
  }
  // papier : du blanc au beige puis au gris foncé
  const ancres = [[246, 245, 240], [232, 218, 190], [205, 205, 200], [150, 148, 142]];
  const pos = R() * 3, a0 = Math.min(2, Math.floor(pos)), t = pos - a0;
  const paper = ancres[a0].map((v, c) => Math.round(v + (ancres[a0 + 1][c] - v) * t));
  const lum = 0.299 * paper[0] + 0.587 * paper[1] + 0.114 * paper[2];
  const ink = Math.round(Math.max(22, Math.min(60, lum * 0.2)));
  // taches : y compris sur des lignes et sur des jonctions probables (tous les 20 à 30 articles)
  const stainP = 20 + Math.floor(R() * 11);
  const nSt = Math.floor(R() * 7);
  const stains = [];
  for (let s = 0; s < nSt; s++) {
    const r = R(), base = { fx: 0.1 + R() * 0.8, wFrac: 0.1 + R() * 0.6, hLines: 1 + R() * 5, alpha: 0.12 + R() * 0.48, seed: Math.floor(R() * 1e9) };
    if (r < 0.4) { const mMax = Math.max(1, Math.floor((N - 2) / stainP)); stains.push(Object.assign(base, { mode: 'jonction', art: Math.min(N - 3, stainP * (1 + Math.floor(R() * mMax))), dy: (R() - 0.5) * 0.6 })); }
    else if (r < 0.7) stains.push(Object.assign(base, { mode: 'ligne', yFrac: R(), snapLine: true }));
    else stains.push(Object.assign(base, { mode: 'libre', yFrac: R() }));
  }
  const wash = R() < 0.12 ? { color: [225, 200, 150], alpha: 0.15 + R() * 0.35 } : null;
  const fades = [];
  if (R() < 0.1) { const nf = 3 + Math.floor(R() * 6); for (let f = 0; f < nf; f++) fades.push({ fx: R(), yFrac: R(), wFrac: 0.3 + R() * 0.4, hLines: 6 + R() * 12, alpha: 0.2 + R() * 0.25 }); }
  const roll = R();
  let blur = R() < 0.3 ? 0 : Number((R() * 3).toFixed(1));
  let rot = R() < 0.25 ? 0 : Number((R() * 8 - 4).toFixed(2));
  let k = R() < 0.4 ? 0 : Number((R() * 0.08).toFixed(3));
  let shadeKind = roll < 0.3 ? 'none' : roll < 0.75 ? 'gradient' : 'ombre';
  let table = R() < 0.55 ? null : R() < 0.45 ? 'clair' : 'sombre';
  let noise = Number((0.5 + R() * 4.5).toFixed(1));
  const shade = { kind: shadeKind, strength: shadeKind === 'ombre' ? 0.25 + R() * 0.3 : 0.05 + R() * 0.3, angle: R() * 6.283,
    side: R() < 0.5 ? 'left' : 'right', yFrac: 0.15 + R() * 0.7, tilt: (R() - 0.5) * 0.5, dark: 0.45 + R() * 0.3 };
  let pli = R() < 0.2 ? { line: 5 + Math.floor(R() * 60), tilt: Math.round((R() - 0.5) * 2 * lh * 0.8), snapFrac: true } : null;
  let corner = R() < 0.15 ? { size: Math.round(Math.min(W * 0.14, 60 + R() * 70)), where: R() < 0.5 ? 'tr' : 'bl' } : null;
  const zebra = R() < 0.4;
  let run = null;
  if (R() < 0.7) {
    const len = 3 + Math.floor(R() * 6);
    const lines = (() => { const r = R() * (mix[0] + mix[1] + mix[2]); return r < mix[0] ? 1 : r < mix[0] + mix[1] ? 2 : 3; })();
    run = { start: 3 + Math.floor(R() * Math.max(1, N - len - 8)), len, lines };
  }
  const nRem = 1 + Math.floor(R() * 5), remises = [];
  for (let r = 0; r < nRem; r++) {
    const idx = 2 + Math.floor(R() * Math.max(1, N - 6));
    if (run && idx >= run.start - 1 && idx <= run.start + run.len) continue;
    if (!remises.includes(idx)) remises.push(idx);
  }
  if (remises.length === 0) remises.push(1); // au moins une remise négative (l'indice 1 est avant toute suite)
  if (!photo) { rot = 0; k = 0; table = null; shade.kind = 'none'; noise = 0; blur = R() < 0.2 ? 0.6 : 0; corner = null; pli = null; }
  return {
    kind, W, lh, nArticles: N, contentSeed: Math.floor(R() * 1e9), mix, forceEvery: 0, run, remises: remises.sort((x, y) => x - y), zebra, paper, ink,
    photo, stains, fades, wash, pli, corner, blur, rot, k, shade, table, noise, jpeg: 0.8, seed: Math.floor(R() * 1e9), stainP,
  };
}

// ---------- Fabrication d'une pièce ----------
const AIRE_MAX = 7.0e6;
function preparer(nom, p0) {
  const p = JSON.parse(JSON.stringify(p0));
  p.fs = Math.round(p.lh * 0.7);
  const mx = Math.max(24, Math.round(p.W * 0.05));
  p.maxName = p.kind === 'ticket'
    ? Math.max(12, Math.min(40, Math.floor((p.W - 2 * mx) / (p.fs * 0.6)) - 11))
    : Math.max(12, Math.min(40, Math.floor((p.W * 0.58 - mx) / (p.fs * 0.68))));
  let content, lay, geo;
  for (let essai = 0; essai < 8; essai++) {
    content = buildContent(p);
    lay = mkLayout(p, content);
    geo = geometrie(p, p.W, lay.H);
    if (p.preset || geo.Dw * geo.Dh <= AIRE_MAX || p.nArticles <= 40) break;
    p.nArticles = Math.max(40, Math.floor(p.nArticles * 0.85));
    if (p.run && p.run.start > p.nArticles - 12) p.run.start = Math.max(3, p.nArticles - 12);
    p.remises = p.remises.filter((x) => x < p.nArticles - 3);
    if (p.remises.length === 0) p.remises.push(1);
    p.stains.forEach((s) => { if (s.art != null) s.art = Math.min(s.art, p.nArticles - 3); });
  }
  // positions résolues (lignes) pour les taches « sur une ligne » et le pli
  p.stains.forEach((s) => { if (s.snapLine) { s.line = Math.floor(s.yFrac * lay.lines.length); s.dy = 0; } });
  if (p.pli && p.pli.snapFrac) p.pli.line = Math.min(lay.lines.length - 2, p.pli.line);
  const eff = resolveEffets(p, content, lay);
  const tableNom = p.table || p.tableForCorner || 'clair';
  const tableColor = tableNom === 'sombre' ? [34, 26, 20] : [168, 150, 126];
  const paper = p.paper;
  const spec = {
    seed: p.seed, W: p.W, H: lay.H, lh: p.lh, fs: p.fs, top: lay.top, family: p.kind === 'ticket' ? "'Courier New', monospace" : 'Arial, sans-serif',
    paper, ink: p.ink, inkVar: 24, photo: p.photo, jpeg: p.jpeg,
    zebraColor: paper.map((x) => Math.round(x * 0.9)), headColor: paper.map((x) => Math.round(x * 0.82)),
    backColor: paper.map((x) => Math.min(255, x + 10)), tableColor,
    lines: lay.lines.map((l) => ({ cells: l.cells, fill: !!l.fill, head: !!l.head })),
    stains: eff.stains, fades: eff.fades, wash: p.wash, pli: eff.pli, corner: p.corner,
    padX: geo.padX, padY: geo.padY, Dw: geo.Dw, Dh: geo.Dh, bg: geo.bg, rot: p.rot, k: p.k,
    shade: p.shade, blur: p.blur, noise: p.noise,
  };
  const verite = {
    piece: nom, fournisseur: 'Brasserie Fictive SA', type: p.kind === 'ticket' ? 'ticket' : 'facture',
    convention: 'articles dans l\'ordre ; lignes[i] = rang (base 0) de l\'article de la ligne visuelle i, ou null (en-tête, totaux) ; masque : ligne i = couleur n=i+1, r=n&255, g=(n>>8)&255, b=0',
    articles: content.arts.map((a) => ({ name: a.name, quantity: a.qty, unit: a.unit, price: frs(a.priceC), amountTTC: frs(a.amountC) })),
    articlesLignes: content.arts.map((a) => a.nLines),
    totalTTC: frs(content.totalC),
    lignes: lay.lines.map((l) => l.art),
    lignesTexte: lay.lines.map((l) => l.cells.map((c) => c.t).join(' | ')),
    params: Object.assign({}, p, { stains: eff.stains.map((s) => ({ cx: Math.round(s.cx), cy: Math.round(s.cy), rw: Math.round(s.rw), rh: Math.round(s.rh), alpha: Number(s.alpha.toFixed(2)), mode: s.mode, ligne: s.ligne })) }),
  };
  return { spec, verite, p, geo, lay };
}

async function fabriquer(page, dossier, nom, p0) {
  const { spec, verite } = preparer(nom, p0);
  const out = await page.evaluate(pageRender, spec);
  fs.writeFileSync(path.join(dossier, nom + '.jpg'), Buffer.from(out.jpg, 'base64'));
  fs.writeFileSync(path.join(dossier, nom + '.masque.png'), Buffer.from(out.mask, 'base64'));
  verite.image = { largeur: out.w, hauteur: out.h };
  fs.writeFileSync(path.join(dossier, nom + '.verite.json'), JSON.stringify(verite, null, 1));
  return { nom, largeur: out.w, hauteur: out.h, articles: verite.articles.length, lignes: verite.lignes.length, params: verite.params };
}

async function main() {
  const args = process.argv.slice(2);
  const dossier = args[0];
  if (!dossier || dossier.startsWith('--')) { console.error('usage : generer.mjs <dossier> [--hasard N] [--graine g]'); process.exit(2); }
  const flag = (n, def) => { const i = args.indexOf(n); if (i < 0) return null; const v = args[i + 1]; return v && !v.startsWith('--') ? Number(v) : def; };
  const nHasard = flag('--hasard', 200);
  const graine = flag('--graine', 1) ?? 1;
  fs.mkdirSync(dossier, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body></body></html>');
    const liste = [];
    if (nHasard === null) {
      for (const { nom, p } of piecesFixes()) { liste.push(await fabriquer(page, dossier, nom, p)); console.log('pièce', nom, liste.at(-1).largeur + 'x' + liste.at(-1).hauteur); }
    } else {
      for (let i = 0; i < nHasard; i++) {
        const nom = 'h' + String(i + 1).padStart(4, '0');
        const p = tirerPiece(graine, i); p.hasard = true;
        liste.push(await fabriquer(page, dossier, nom, p));
        if ((i + 1) % 20 === 0) console.log('pièces', i + 1 + '/' + nHasard);
      }
      fs.writeFileSync(path.join(dossier, 'hasard.json'), JSON.stringify({ graine, n: nHasard, pieces: liste.map((x) => ({ nom: x.nom, largeur: x.largeur, hauteur: x.hauteur, articles: x.articles, lignes: x.lignes, params: x.params })) }, null, 1));
    }
    console.log('GÉNÉRÉ ' + liste.length + ' pièces dans ' + dossier);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
