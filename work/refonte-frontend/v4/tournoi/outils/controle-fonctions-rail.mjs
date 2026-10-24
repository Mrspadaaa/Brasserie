// D124 (24.10, voie p20) : « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes
// choix ont été perdue » (maquette 24.10). Avant, sur le même rail : « Le rail c'est toujours n'importe quoi. Il y a un
// vrai historique dessus » (D123).
// Ce contrôle rejoue chaque FONCTION du rail de l'étape Houblons de sa base v4.10 (la frise verticale du brassin), au
// doigt (390 × 844, tactile), et dit pour chacune si la page construite la garde. Les fonctions, leurs mots et leur
// défaut d'origine (D27 à D69, D111, D123) sont dans `ecran-1/base/donnees/inventaire-rail.json` : il ne joue que celles
// dont `controle` vaut « controle-fonctions-rail » (le côté froid de la voie p19 est joué par controle-geste-etape).
// Il ne lit que ce qui se voit : textes visibles et leur place, graduations (traits fins), hauteur de la carte, ombre,
// boutons. Seule la poignée [data-role="glisser-moment"] (la base et la maquette l'ont) et les libellés accessibles
// des boutons servent de prise. Aucun mot du brasseur n'est lu dans le code.
// Usage : node controle-fonctions-rail.mjs <dossier> [--page=index.html] [--seul=id,id] [--capture=<dossier>]
//   --page=index.html : sa base (les pages cas-*.html sont à côté) ; sans option : une maquette construite
//   (<dossier>/ma-biere/etat.html et ma-biere/cas-*.html, sinon à la racine).
//   --capture=<dossier> : prend aussi les captures de chaque état (nom + « -base.png » ou « -5345f6ad.png »,
//   selon --suffixe=). Les critères n'en passent pas.
// Sortie : une ligne par fonction (« rail-… OK » ou « rail-… ECHEC : écart mesuré »), puis FONCTIONS-RAIL OK (n/n) ou
// FONCTIONS-RAIL ECHEC (k/n). Une page attendue absente est un échec de la fonction qui la demande.
// Témoins : base v4.10 → OK ; temoins/fonctions-rail-sans-loupe (la loupe retirée) → ECHEC ; maquette 5345f6ad → ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const opt = (n, d) => { const a = args.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const pageArg = opt('page', '');
const seuls = opt('seul', '') ? opt('seul', '').split(',') : null;
const dossierCapture = opt('capture', '');
const suffixe = opt('suffixe', pageArg ? 'base' : '5345f6ad');
const ici = path.dirname(fileURLToPath(import.meta.url));
const inventaire = path.resolve(ici, '../../ecran-1/base/donnees/inventaire-rail.json');
const attente = (ms) => new Promise((r) => setTimeout(r, ms));

function fichierPage(cle) {
  if (pageArg) return path.join(dir, cle === 'etat' ? pageArg : cle + '.html');
  const rac = fs.existsSync(path.join(dir, 'ma-biere')) ? path.join(dir, 'ma-biere') : dir;
  return path.join(rac, cle === 'etat' ? 'etat.html' : cle + '.html');
}

// ===== Lecture injectée : ce qui est visible et sa place =====
function lireEtat() {
  const vis = (e) => {
    for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false;
    }
    return true;
  };
  const rect = (b) => ({ t: b.top, b: b.bottom, l: b.left, r: b.right });
  const poignees = [...document.querySelectorAll('[data-role="glisser-moment"]')].filter((s) => { const b = s.getBoundingClientRect(); return b.width > 0 && b.height > 0 && vis(s); });
  const hs = poignees.map((s) => {
    const b = s.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: (s.getAttribute('aria-valuetext') || s.textContent || '').replace(/\s+/g, ' ').trim() };
  });
  const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter(vis);
  const textes = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const tx = n.textContent.replace(/\s+/g, ' ').trim();
    if (!tx || tx.length > 24) continue;
    const e = n.parentElement;
    if (!vis(e)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const b = r.getBoundingClientRect();
    if (b.width < 1 || b.height < 1 || b.bottom < 0 || b.top > innerHeight || b.left > 385) continue;
    if (e.closest('.sr-only, [class*="sr-only"]')) continue;
    textes.push({ tx, ...rect(b), poignee: poignees.some((p, k) => p.contains(e) && tx === hs[k].t), carte: lignes.findIndex((l) => l.contains(e)) });
  }
  // Un nombre et son « ′ » écrits dans deux nœuds voisins se lisent ensemble.
  for (let i = textes.length - 1; i > 0; i--) {
    const c = textes[i], p = textes[i - 1];
    if (/^(′|°C)$/.test(c.tx) && /^[0-9]+$/.test(p.tx) && Math.abs(c.t - p.t) < 4 && c.l - p.r < 8 && c.l - p.r > -3) { p.tx += c.tx; p.r = c.r; textes.splice(i, 1); }
  }
  const ticks = [];
  for (const e of document.querySelectorAll('body *')) {
    const b = e.getBoundingClientRect();
    if (b.width < 4 || b.width > 30 || b.height <= 0 || b.height > 3 || b.left > 80 || b.top < 95 || b.bottom > innerHeight || !vis(e)) continue;
    ticks.push({ y: (b.top + b.bottom) / 2, l: b.left, r: b.right });
  }
  ticks.sort((a, c) => a.y - c.y);
  const cartes = lignes.map((l) => {
    const b = l.getBoundingClientRect();
    const tous = [l, ...l.querySelectorAll('*')];
    const lignesTxt = l.innerText.split('\n').map((x) => x.trim()).filter(Boolean);
    const nom = lignesTxt.find((x) => !/^(\d+\s*[′']|\d+\s*°C|J\+\d+|\d+ j)$/.test(x)) || '';
    const m = /(\d+(?:[.,]\d+)?)\s*IBU/.exec(l.innerText);
    return { nom, t: b.top, h: b.height, l: b.left, txt: l.innerText.replace(/\s+/g, ' '), ibu: m ? Number(m[1].replace(',', '.')) : null, ombre: tous.some((e) => getComputedStyle(e).boxShadow !== 'none') };
  });
  // Les repères de la frise : première occurrence du texte entier, hors poignée.
  const lab = {};
  const cle = { 'Ébullition': 'ebu', '0′': 'zero', 'whirlpool': 'wp', 'fermentation': 'ferm', 'post-fermentation': 'post' };
  for (const t of textes) if (!t.poignee && t.carte < 0 && cle[t.tx] && !(cle[t.tx] in lab)) lab[cle[t.tx]] = (t.t + t.b) / 2;
  // L'IBU total : le nombre qui suit « IBU » dans la bande du haut.
  let total = null;
  const hauts = [];
  const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while ((n = w2.nextNode())) {
    const tx = n.textContent.replace(/\s+/g, ' ').trim();
    if (!tx || !n.parentElement || !vis(n.parentElement)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const b = r.getBoundingClientRect();
    if (b.top >= 40 && b.top < 100 && b.width > 0) hauts.push(tx);
  }
  const k = hauts.indexOf('IBU');
  if (k >= 0) { const v = hauts.slice(k + 1).find((x) => /^\d+$/.test(x)); if (v) total = Number(v); }
  const sel = String(getSelection());
  return { hs, textes, ticks, cartes, lab, total, sel, haut: innerHeight };
}

const GRAD = /^(\d+)\s*′$|^(\d+)\s*°C$|^J\+(\d+)$/;
const gradsEcrites = (e) => e.textes.filter((t) => !t.poignee && t.l < 140 && GRAD.test(t.tx) && t.tx !== '0′' && !(e.lab.ebu != null && Math.abs((t.t + t.b) / 2 - e.lab.ebu) < 14 && t.l > 100));
const nombre = (tx) => { const m = /(\d+)/.exec(tx || ''); return m ? Number(m[1]) : null; };
const mediane = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// ===== Le doigt =====
class Doigt {
  constructor(page, cdp, x, y) { this.page = page; this.cdp = cdp; this.x = x; this.y = y; }
  async envoyer(type, y) { await this.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x: this.x, y, id: 1 }] }); }
  async poser() { await this.envoyer('touchStart', this.y); }
  async vers(y) { this.y = y; await this.envoyer('touchMove', y); }
  async lacher() { await this.envoyer('touchEnd', this.y); }
  async annuler() { await this.envoyer('touchCancel', this.y); }
}
async function ouvrir(nav, cle, hauteur = 844) {
  const f = fichierPage(cle);
  if (!fs.existsSync(f)) throw new Error('page absente : ' + path.relative(process.cwd(), f).replace(/\\/g, '/'));
  const page = await nav.newPage();
  await page.setViewport({ width: 390, height: hauteur, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'load', timeout: 30000 });
  let e = null;
  for (let i = 0; i < 50; i++) { e = await page.evaluate(lireEtat); if (e.hs.length) break; await attente(100); }
  await attente(500);
  e = await page.evaluate(lireEtat);
  if (!e.hs.length) { await page.close(); throw new Error('aucune poignée [data-role="glisser-moment"] visible : le moment ne se glisse pas'); }
  const cdp = await page.createCDPSession();
  return { page, cdp, f };
}
const lire = (p) => p.page.evaluate(lireEtat);
async function prise(p, k = 0) { const e = await lire(p); const h = e.hs[k]; if (!h) throw new Error('pas de poignée n° ' + (k + 1)); return new Doigt(p.page, p.cdp, h.x, h.y); }
let numCapture = 0;
async function photo(p, nom) {
  if (!dossierCapture) return;
  fs.mkdirSync(dossierCapture, { recursive: true });
  await p.page.screenshot({ path: path.join(dossierCapture, nom + '-' + suffixe + '.png') });
  numCapture++;
}
// Descend (ou monte) pas à pas jusqu'à ce que `but(état, doigt)` soit vrai ; rend l'état, ou lève si le bout est atteint.
async function aller(p, d, but, { pas = 3, sens = 1, max = 900, decrit = 'la cible', echec = '' } = {}) {
  const vus = [];
  for (let i = 0; i < max; i++) {
    const y = d.y + sens * pas;
    if (y > p.page.viewport().height - 6 || y < 4) break;
    await d.vers(y);
    await attente(14);
    const e = await lire(p);
    const t = e.hs.length ? e.hs.reduce((a, c) => (Math.abs(c.y - y) < Math.abs(a.y - y) ? c : a)).t : '';
    if (t && vus[vus.length - 1] !== t) vus.push(t);
    if (but(e, t)) { await attente(320); return await lire(p); }
  }
  if (echec) await photo(p, echec);
  throw new Error('le doigt n\'atteint jamais ' + decrit + ' (le repère a lu : ' + vus.slice(0, 8).join(' ; ') + (vus.length > 8 ? '…' : '') + ')');
}
const segDoigt = (e, y) => {
  const L = e.lab;
  if (L.post != null && y > L.post - 4) return 'p';
  if (L.ferm != null && y > L.ferm - 4) return 'f';
  if (L.wp != null && y > L.wp - 4) return 'w';
  return 'e';
};
const butEbu = (m) => (e, t) => new RegExp('^' + m + '\\s*′$').test(t) && !/J\+/.test(t);
const butWp = (n) => (e, t) => (n ? new RegExp('^' + n + '\\s*°C$').test(t) : /°C/.test(t));
const butJour = (seg, n) => (e, t) => { const m = /^J\+(\d+)$/.exec(t); if (!m || (n != null && Number(m[1]) !== n)) return false; const h = e.hs.find((x) => x.t === t); return h && segDoigt(e, h.y) === seg; };

// ===== Les scénarios joués une fois, lus par plusieurs fonctions =====
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const cache = new Map();
const scen = (nom, f) => { if (!cache.has(nom)) cache.set(nom, f().then((v) => ({ v }), (e) => ({ e }))); return cache.get(nom).then((r) => { if (r.e) throw r.e; return r.v; }); };

// Repos de l'étape, puis ébullition : fluidité, 35′ tenu, lâcher, 20′, lâcher.
const A = () => scen('ebullition', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const o = {};
    o.repos = await lire(p);
    await photo(p, 'repos');
    const d = await prise(p);
    await d.poser();
    await d.vers(d.y + 3); await attente(300);
    o.pendant = await aller(p, d, butEbu(35), { decrit: '35′', echec: 'ebullition-35-pendant' });
    o.yDoigt35 = d.y;
    await photo(p, 'ebullition-35-pendant');
    await d.lacher(); await attente(700);
    o.apres35 = await lire(p);
    await photo(p, 'ebullition-35-apres');
    // Deuxième lâcher, à 20′.
    const d2 = await prise(p);
    await d2.poser();
    o.pendant20 = await aller(p, d2, butEbu(20), { decrit: '20′' });
    await d2.lacher(); await attente(700);
    o.apres20 = await lire(p);
    return o;
  } finally { await p.page.close(); }
});

// Fluidité : le doigt descend de 6 px dix fois ; la poignée le suit.
const Fl = () => scen('fluide', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const d = await prise(p);
    await d.poser();
    await d.vers(d.y + 4); await attente(320);
    let e0 = await lire(p);
    const ref = { h: e0.hs[0].y, f: d.y };
    let prec = ref.h, bouge = 0, ecartMax = 0;
    for (let i = 0; i < 10; i++) {
      await d.vers(d.y + 6); await attente(40);
      const e = await lire(p);
      const hy = e.hs.length ? e.hs[0].y : prec;
      if (Math.abs(hy - prec) > 0.5) bouge++;
      ecartMax = Math.max(ecartMax, Math.abs((hy - ref.h) - (d.y - ref.f)));
      prec = hy;
    }
    await d.lacher();
    return { bouge, ecartMax };
  } finally { await p.page.close(); }
});

// Whirlpool : 85 °C tenu, lâcher, 70 °C, lâcher, réglage de la durée.
const W = () => scen('whirlpool', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const o = {};
    const d = await prise(p);
    await d.poser();
    try { o.pendant = await aller(p, d, butWp(85), { decrit: 'une température de whirlpool (85 °C)', echec: 'whirlpool-85-pendant' }); }
    catch (x) { await d.lacher(); await attente(700); await photo(p, 'whirlpool-85-apres'); throw x; }
    await photo(p, 'whirlpool-85-pendant');
    await d.lacher(); await attente(700);
    o.apres85 = await lire(p);
    await photo(p, 'whirlpool-85-apres');
    const d2 = await prise(p);
    await d2.poser();
    o.pendant70 = await aller(p, d2, butWp(70), { decrit: '70 °C', sens: 1 });
    await d2.lacher(); await attente(700);
    o.apres70 = await lire(p);
    // La durée du whirlpool, sur la carte.
    o.duree = await p.page.evaluate(() => {
      const bs = [...document.querySelectorAll('[data-role="ligne-houblon"] button, [data-role="ligne-houblon"] [role="button"]')].filter((b) => /whirlpool|durée/i.test(b.getAttribute('aria-label') || ''));
      const plus = bs.find((b) => /plus|\+|augmenter/i.test(b.getAttribute('aria-label') || ''));
      const moins = bs.find((b) => /moins|−|-|réduire/i.test(b.getAttribute('aria-label') || ''));
      const lire = () => { const l = document.querySelector('[data-role="ligne-houblon"]'); const m = /(\d+)\s*min/.exec(l ? l.innerText : ''); return m ? Number(m[1]) : null; };
      const avant = lire();
      if (plus) plus.click();
      return { boutons: bs.length, avant, plus: !!plus, moins: !!moins, lire };
    }).then(async (r) => {
      await attente(300);
      const apres = await p.page.evaluate(() => { const l = document.querySelector('[data-role="ligne-houblon"]'); const m = /(\d+)\s*min/.exec(l ? l.innerText : ''); return m ? Number(m[1]) : null; });
      return { boutons: r.boutons, avant: r.avant, apres, plus: r.plus, moins: r.moins };
    });
    await photo(p, 'whirlpool-duree');
    return o;
  } finally { await p.page.close(); }
});

// À froid : J+3 tenu en fermentation, lâcher, réglage −/+, J+9, post-fermentation J+10.
const F = () => scen('froid', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const o = {};
    o.avant = await lire(p);
    const d = await prise(p);
    await d.poser();
    try { o.pendantF3 = await aller(p, d, butJour('f', 3), { decrit: 'J+3 de la fermentation', echec: 'fermentation-j3-pendant' }); }
    catch (x) { await d.lacher(); await attente(700); await photo(p, 'fermentation-j3-apres'); throw x; }
    await photo(p, 'fermentation-j3-pendant');
    await d.lacher(); await attente(700);
    o.apresF3 = await lire(p);
    await photo(p, 'fermentation-j3-apres');
    o.reglage = await p.page.evaluate(() => {
      const bs = [...document.querySelectorAll('[data-role="ligne-houblon"] button')].filter((b) => /jour/i.test(b.getAttribute('aria-label') || ''));
      const plus = bs.find((b) => /plus/i.test(b.getAttribute('aria-label') || ''));
      const moins = bs.find((b) => /moins/i.test(b.getAttribute('aria-label') || ''));
      const lire = () => { const m = /J\+(\d+)/.exec(document.querySelector('[data-role="ligne-houblon"]')?.innerText || ''); return m ? Number(m[1]) : null; };
      const a = lire();
      if (plus) plus.click();
      return { a, plus: !!plus, moins: !!moins };
    });
    await attente(300);
    o.reglage.b = await p.page.evaluate(() => { const m = /J\+(\d+)/.exec(document.querySelector('[data-role="ligne-houblon"]')?.innerText || ''); return m ? Number(m[1]) : null; });
    await p.page.evaluate(() => { const b = [...document.querySelectorAll('[data-role="ligne-houblon"] button')].find((x) => /jour/i.test(x.getAttribute('aria-label') || '') && /moins/i.test(x.getAttribute('aria-label') || '')); if (b) b.click(); });
    await attente(200);
    await p.page.evaluate(() => { const b = [...document.querySelectorAll('[data-role="ligne-houblon"] button')].find((x) => /jour/i.test(x.getAttribute('aria-label') || '') && /moins/i.test(x.getAttribute('aria-label') || '')); if (b) b.click(); });
    await attente(300);
    o.reglage.c = await p.page.evaluate(() => { const m = /J\+(\d+)/.exec(document.querySelector('[data-role="ligne-houblon"]')?.innerText || ''); return m ? Number(m[1]) : null; });
    // Deuxième lâcher, plus bas, dans la post-fermentation.
    const d2 = await prise(p);
    await d2.poser();
    o.pendantP10 = await aller(p, d2, butJour('p', 10), { decrit: 'J+10 de la post-fermentation', echec: 'post-fermentation-j10-pendant' });
    await photo(p, 'post-fermentation-j10-pendant');
    await d2.lacher(); await attente(700);
    o.apresP10 = await lire(p);
    await photo(p, 'post-fermentation-j10-apres');
    return o;
  } finally { await p.page.close(); }
});

// Un geste interrompu (touchcancel) rend la carte.
const I = () => scen('interrompu', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const o = { avant: await lire(p) };
    const d = await prise(p);
    await d.poser();
    await d.vers(d.y + 6); await attente(100);
    await d.vers(d.y + 100); await attente(300);
    o.pendant = await lire(p);
    await photo(p, 'interrompu-pendant');
    await d.annuler(); await attente(800);
    o.apres = await lire(p);
    await photo(p, 'interrompu-apres');
    return o;
  } finally { await p.page.close(); }
});

// Les cas de durée d'ébullition : 45′, 120′, 200′.
const E = (n) => scen('ebu' + n, async () => {
  const p = await ouvrir(nav, 'cas-ebu' + n);
  try {
    const o = { repos: await lire(p) };
    await photo(p, 'ebullition-' + n + '-repos');
    const d = await prise(p);
    await d.poser();
    // Vers le haut : jusqu'à la durée, jamais au-delà.
    let haut = null, vus = [];
    for (let i = 0; i < 400; i++) {
      const y = d.y - 3;
      if (y < 6) break;
      await d.vers(y); await attente(14);
      const e = await lire(p);
      const t = e.hs.length ? e.hs[0].t : '';
      if (t && vus[vus.length - 1] !== t) vus.push(t);
      if (nombre(t) === n && /′/.test(t)) { haut = e; break; }
    }
    o.vus = vus;
    await attente(320);
    if (haut) o.haut = await lire(p);
    await photo(p, 'ebullition-' + n + '-pendant-haut');
    await d.lacher(); await attente(700);
    o.apres = await lire(p);
    await photo(p, 'ebullition-' + n + '-apres');
    // Sans page ouverte à fond : un doigt qui part de la durée ne monte pas plus haut.
    return o;
  } finally { await p.page.close(); }
});

// Plusieurs houblons : le premier descend par pas de 10 px ; les autres ne sautent ni ne se chevauchent.
const K = () => scen('k3', async () => {
  const p = await ouvrir(nav, 'cas-k3');
  try {
    const o = { repos: await lire(p), pas: [] };
    await photo(p, 'k3-repos');
    const d = await prise(p);
    await d.poser();
    await d.vers(d.y + 4); await attente(300);
    const suivre = async () => {
      const e = await lire(p);
      const h = e.hs.length ? e.hs.reduce((a, c) => (Math.abs(c.y - d.y) < Math.abs(a.y - d.y) ? c : a)) : null;
      return { e, t: h ? h.t : '', y: d.y };
    };
    o.pas.push(await suivre());
    let n = 0;
    while (d.y < 640 && n < 60) {
      await d.vers(d.y + 10); await attente(45);
      o.pas.push(await suivre());
      n++;
      if (n === 12) await photo(p, 'k3-pendant');
    }
    await d.lacher(); await attente(700);
    o.apres = await lire(p);
    await photo(p, 'k3-apres');
    return o;
  } finally { await p.page.close(); }
});

// Les deux bouts du rail, de la durée d'ébullition à J+14, écrans de 844 et 620 px.
const X = (h) => scen('extremes' + h, async () => {
  const p = await ouvrir(nav, 'cas-k3', h);
  try {
    const o = {};
    const e0 = await lire(p);
    const bas = e0.hs.length - 1;
    // Le houblon du haut descend jusqu'au bas de l'écran.
    const d = await prise(p, 0);
    await d.poser();
    let vus = [];
    for (let i = 0; i < 400; i++) {
      const y = d.y + 3;
      if (y > h - 6) break;
      await d.vers(y); await attente(12);
      const e = await lire(p);
      const hh = e.hs.length ? e.hs.reduce((a, c) => (Math.abs(c.y - y) < Math.abs(a.y - y) ? c : a)) : null;
      if (hh && vus[vus.length - 1] !== hh.t) vus.push(hh.t);
      if (hh && hh.t === 'J+14') { o.jMax = true; break; }
    }
    o.vusBas = vus;
    await attente(250);
    if (h === 844) await photo(p, 'k3-extreme-bas');
    await d.lacher(); await attente(500);
    await p.page.close();
    // Le houblon du bas monte jusqu'en haut.
    const p2 = await ouvrir(nav, 'cas-k3', h);
    try {
      const e1 = await lire(p2);
      const d2 = await prise(p2, e1.hs.length - 1);
      await d2.poser();
      const dur = nombre((e1.textes.find((t) => t.tx === 'Ébullition') || {}).tx);
      vus = [];
      let max = null;
      for (let i = 0; i < 400; i++) {
        const y = d2.y - 3;
        if (y < 4) break;
        await d2.vers(y); await attente(12);
        const e = await lire(p2);
        const hh = e.hs.length ? e.hs.reduce((a, c) => (Math.abs(c.y - y) < Math.abs(a.y - y) ? c : a)) : null;
        if (hh && vus[vus.length - 1] !== hh.t) vus.push(hh.t);
        if (hh && /^\d+\s*′$/.test(hh.t)) max = Math.max(max || 0, nombre(hh.t));
        if (hh && /^\d+\s*′$/.test(hh.t) && nombre(hh.t) >= 60) { o.hautOk = true; break; }
      }
      o.vusHaut = vus;
      if (h === 844) await photo(p2, 'k3-extreme-haut');
      await d2.lacher();
    } finally { await p2.page.close().catch(() => {}); }
    return o;
  } finally { await p.page.close().catch(() => {}); }
});

// Les gestes de la carte : dose, type, retrait, clavier, ajout touché.
const G = () => scen('carte', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const o = { avant: await lire(p) };
    const clic = (...sels) => p.page.evaluate((sels) => { for (const sel of sels) { const b = document.querySelector(sel); if (b) { b.click(); return true; } } return false; }, sels);
    // Ajout proposé, touché : sa ligne se pose sur le rail.
    o.ajout = { trouve: await clic('[data-role="ajout-rapide-plus"]', '[data-role="ajout-rapide"]') };
    await attente(700);
    o.apresAjout = await lire(p);
    await photo(p, 'ajout-pose');
    // Dose.
    o.dose = { trouve: await clic('[data-role="dose-plus"], [data-role="ligne-houblon"] button[aria-label^="Ajouter 2 g"], [data-role="ligne-houblon"] button[aria-label$="de plus"]') };
    await attente(400);
    o.apresDose = await lire(p);
    // Type d'ajout.
    o.type = { trouve: await clic('[data-role="ligne-houblon"] [data-role="type-ajout"]') };
    await attente(500);
    o.apresType = await lire(p);
    await photo(p, 'type-ajout');
    // Retrait de la dernière ligne.
    o.retrait = { trouve: await clic('[data-role="ligne-houblon"] [data-role="retirer"], [data-role="ligne-houblon"] .corbeille') };
    await attente(500);
    o.apresRetrait = await lire(p);
    return o;
  } finally { await p.page.close(); }
});
const C = () => scen('clavier', async () => {
  const p = await ouvrir(nav, 'etat');
  try {
    const o = { avant: await lire(p) };
    o.focus = await p.page.evaluate(() => {
      const s = document.querySelector('[data-role="glisser-moment"]');
      const el = s.matches('[role="slider"], button, [tabindex]') ? s : s.querySelector('button, [tabindex], [role="slider"]');
      if (!el) return false;
      el.focus();
      return document.activeElement === el;
    });
    await p.page.keyboard.press('ArrowDown'); await attente(500);
    o.apres = await lire(p);
    await p.page.keyboard.press('ArrowDown'); await attente(500);
    o.apres2 = await lire(p);
    await photo(p, 'clavier');
    return o;
  } finally { await p.page.close(); }
});

// ===== Les fonctions =====
const dernier = (a) => a[a.length - 1];
const espaces = (ts) => ts.slice(1).map((t, i) => t.y - ts[i].y);
const proches = (e, y, r) => e.ticks.filter((t) => Math.abs(t.y - y) <= r);
const sel = (e, y) => String(e.sel || '');
const FN = {
  // --- Au repos
  'rail-repos-etapes': async () => {
    const { repos: e } = await A();
    const L = e.lab, noms = ['ebu', 'zero', 'wp', 'ferm', 'post'], lib = { ebu: 'Ébullition', zero: '0′', wp: 'whirlpool', ferm: 'fermentation', post: 'post-fermentation' };
    const manque = noms.filter((k) => L[k] == null).map((k) => lib[k]);
    if (manque.length) return ['repères absents du rail : ' + manque.join(', ')];
    const mal = noms.slice(1).filter((k, i) => L[k] <= L[noms[i]]).map((k) => lib[k]);
    return mal.length ? ['repères hors d\'ordre : ' + mal.join(', ')] : [];
  },
  'rail-levure-etape': async () => {
    const { repos: e } = await A();
    const L = e.lab;
    if (L.wp == null || L.ferm == null) return ['repères whirlpool ou fermentation absents'];
    const entre = e.textes.filter((t) => !t.poignee && t.carte < 0 && (t.t + t.b) / 2 > L.wp + 6 && (t.t + t.b) / 2 < L.ferm - 6 && t.tx.length > 3);
    return entre.length ? [] : ['aucune levure sur le rail entre whirlpool (y ' + Math.round(L.wp) + ') et fermentation (y ' + Math.round(L.ferm) + ')'];
  },
  'rail-repos-sans-graduation': async () => {
    const { repos: e } = await A();
    const g = gradsEcrites(e);
    const pb = [];
    if (g.length) pb.push(g.length + ' graduation(s) écrite(s) au repos (' + g.slice(0, 4).map((x) => x.tx).join(', ') + ')');
    if (e.ticks.length) pb.push(e.ticks.length + ' trait(s) de graduation au repos');
    return pb;
  },
  'rail-ebullition-renvoi': async () => {
    const p = await ouvrir(nav, 'etat');
    try {
      const r = await p.page.evaluate(() => {
        const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
        let tx = null;
        const wk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let nd; (nd = wk.nextNode());) if (/^Ébullition\s*$/.test(nd.textContent) && nd.parentElement && vis(nd.parentElement)) { tx = nd.parentElement; break; }
        if (!tx) return { ligne: false };
        let ligne = tx;
        const y = tx.getBoundingClientRect().top;
        while (ligne.parentElement && Math.abs(ligne.parentElement.getBoundingClientRect().top - y) < 12 && ligne.parentElement.getBoundingClientRect().height < 60) ligne = ligne.parentElement;
        const inter = [...ligne.querySelectorAll('a, button, [role="button"], [role="link"], [data-action]')].filter(vis);
        const reglage = [...ligne.querySelectorAll('input, [role="spinbutton"]')].length + inter.filter((b) => /moins|plus|[−+]/i.test((b.getAttribute('aria-label') || '') + b.textContent)).length;
        const clic = ligne.closest('a, button, [role="link"], [role="button"]');
        return { ligne: true, renvoi: inter.length + (clic ? 1 : 0), reglage, texte: ligne.innerText.replace(/\s+/g, ' ') };
      });
      const pb = [];
      if (!r.ligne) return ['aucune ligne « Ébullition » sur le rail'];
      if (!r.renvoi) pb.push('« ' + r.texte + ' » sans renvoi vers l\'endroit où l\'ébullition se règle (aucun lien ni bouton dans la ligne)');
      if (r.reglage) pb.push('un champ ou des −/+ règlent l\'ébullition sur le rail (« C\'est defini ailleur »)');
      return pb;
    } finally { await p.page.close(); }
  },
  'rail-ajouts-hors-rail': async () => {
    const { repos: e } = await A();
    const L = e.lab;
    if (L.post == null) return ['repère post-fermentation absent'];
    const pb = [];
    const dedans = e.textes.filter((t) => !t.poignee && t.carte < 0 && /^\d+\s*′$/.test(t.tx) && t.tx !== '0′' && (t.t + t.b) / 2 > (L.ebu || 0) - 4 && (t.t + t.b) / 2 < L.post + 8 && !(Math.abs((t.t + t.b) / 2 - (L.ebu || -99)) < 14));
    if (dedans.length) pb.push('minute orpheline sur le rail : ' + dedans.map((x) => x.tx).join(', '));
    const dessous = e.textes.filter((t) => t.carte < 0 && /^\d+\s*′$/.test(t.tx) && t.t > L.post + 20);
    if (!dessous.length) pb.push('aucun ajout proposé avec son moment suggéré sous le rail');
    return pb;
  },
  'rail-ajout-pose': async () => {
    const { avant, ajout, apresAjout } = await G();
    if (!ajout.trouve) return ['aucun ajout proposé à toucher'];
    const pb = [];
    if (apresAjout.cartes.length !== avant.cartes.length + 1) pb.push('un toucher sur l\'ajout laisse ' + apresAjout.cartes.length + ' ligne(s) sur le rail (avant ' + avant.cartes.length + ')');
    else {
      const h = apresAjout.hs.map((x) => x.t);
      if (!h.some((t) => /^10\s*′$/.test(t))) pb.push('la ligne ajoutée ne se pose pas à son moment suggéré (10′) : repères ' + h.join(', '));
    }
    return pb;
  },
  // --- Pendant le geste, dans l'ébullition
  'rail-loupe-ouvre': async () => {
    const { repos, pendant } = await A();
    const pb = [];
    if (repos.ticks.length) pb.push(repos.ticks.length + ' trait(s) de graduation au repos');
    const g = gradsEcrites(pendant);
    if (pendant.ticks.length < 6) pb.push('le doigt posé à 35′ : ' + pendant.ticks.length + ' graduation(s) visible(s) (6 au moins)');
    if (g.length < 2) pb.push('moins de 2 minutes écrites autour du doigt (' + g.map((x) => x.tx).join(', ') + ')');
    return pb;
  },
  'rail-loupe-rapport': async () => {
    const { pendant: e, yDoigt35: y } = await A();
    // Les écarts entre graduations voisines (moins de 30 px : on ne compte pas le saut d'un segment à l'autre).
    const paires = e.ticks.slice(1).map((t, i) => ({ g: t.y - e.ticks[i].y, m: (t.y + e.ticks[i].y) / 2 })).filter((q) => q.g > 0.5 && q.g <= 30);
    const sous = paires.filter((q) => Math.abs(q.m - y) <= 35).map((q) => q.g), loin = paires.filter((q) => Math.abs(q.m - y) > 50).map((q) => q.g);
    if (!sous.length || !loin.length) return ['pas assez de graduations sous le doigt (' + sous.length + ' écarts) et au loin (' + loin.length + ' écarts) pour mesurer le rapport'];
    const a = Math.max(...sous), b = Math.min(...loin);
    return a / b >= 2.8 ? [] : ['sous le doigt ' + a.toFixed(1) + ' px par graduation, au loin ' + b.toFixed(1) + ' px : rapport ×' + (a / b).toFixed(1) + ' (×3 au moins : le grossissement doit se voir)'];
  },
  'rail-ebullition-reguliere': async () => {
    const { pendant: e, yDoigt35: y } = await A();
    const t = [...e.ticks].sort((a, c) => Math.abs(a.y - y) - Math.abs(c.y - y)).slice(0, 5).sort((a, c) => a.y - c.y);
    if (t.length < 5) return ['moins de 5 graduations autour du doigt (' + t.length + ')'];
    const d = espaces(t), m = d.reduce((s, x) => s + x, 0) / d.length, sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / d.length);
    return sd / m <= 0.25 ? [] : ['graduations voisines du doigt irrégulières : écarts ' + d.map((x) => x.toFixed(0)).join(', ') + ' px (écart-type / moyenne ' + (sd / m).toFixed(2) + ' > 0,25)'];
  },
  'rail-carte-puce': async () => {
    const { pendant: e } = await A();
    const c = e.cartes[0];
    if (!c) return ['la carte tenue est introuvable'];
    const pb = [];
    if (c.h > 48) pb.push('la carte tenue garde ' + Math.round(c.h) + ' px de haut pendant le geste (une puce : 48 px au plus)');
    if (!/nugget/i.test(c.txt)) pb.push('la carte repliée ne garde pas le nom du houblon');
    if (e.sel) pb.push('du texte est sélectionné pendant le geste (« ' + e.sel.slice(0, 20) + ' »)');
    return pb;
  },
  'rail-bulle-moment': async () => {
    const { pendant: e, yDoigt35: y } = await A();
    const h = e.hs[0];
    if (!h) return ['plus de repère du moment pendant le geste'];
    const pb = [];
    if (Math.abs(h.y - y) > 24) pb.push('l\'étiquette du moment (« ' + h.t + ' ») est à ' + Math.round(Math.abs(h.y - y)) + ' px du doigt');
    if (nombre(h.t) !== 35) pb.push('l\'étiquette lit « ' + h.t + ' » au lieu de la tranche sous le doigt (35′)');
    return pb;
  },
  'rail-carte-ombre': async () => {
    const { repos, pendant, apres35 } = await A();
    const pb = [];
    if (repos.cartes.some((c) => c.ombre)) pb.push('une ombre sur la carte au repos (« Pourquoi celui choisi à de l\'ombre ? »)');
    if (!pendant.cartes.some((c) => c.ombre)) pb.push('aucune ombre sur la carte qui suit le doigt');
    if (apres35.cartes.some((c) => c.ombre)) pb.push('une ombre sur la carte après le lâcher');
    return pb;
  },
  'rail-fluide': async () => {
    const f = await Fl();
    const pb = [];
    if (f.bouge < 9) pb.push('sur 10 pas de 6 px, la poignée ne bouge que ' + f.bouge + ' fois (9 au moins)');
    if (f.ecartMax > 4) pb.push('la poignée s\'écarte du doigt de ' + f.ecartMax.toFixed(1) + ' px (4 au plus)');
    return pb;
  },
  'rail-ibu-au-lacher': async () => {
    const { repos, pendant, apres35 } = await A();
    const pb = [];
    if (repos.total == null) return ['l\'IBU total n\'est pas lisible dans la bande du haut'];
    if (pendant.total !== repos.total) pb.push('l\'IBU total change pendant le geste (' + repos.total + ' → ' + pendant.total + ') : recalcul à la volée');
    if (apres35.total === repos.total) pb.push('l\'IBU total ne se recalcule pas au lâcher (' + repos.total + ' → ' + apres35.total + ')');
    const c0 = repos.cartes[0], c1 = apres35.cartes[0];
    if (c0 && c1 && c0.ibu === c1.ibu) pb.push('l\'IBU de la ligne ne se recalcule pas au lâcher (' + c0.ibu + ' → ' + c1.ibu + ')');
    return pb;
  },
  'rail-ibu-ecart': async () => {
    const { repos, apres35 } = await A();
    // Au lâcher, l'écart du total s'écrit au-dessus de l'IBU (« −10 »), pour voir ce que le déplacement a changé.
    const chip = apres35.textes.filter((t) => t.t < 80 && t.l < 200 && /^[−+–-][0-9]+$/.test(t.tx));
    if (repos.total == null || apres35.total == null) return ['l\'IBU total n\'est pas lisible dans la bande du haut'];
    const attendu = apres35.total - repos.total;
    if (!chip.length) return ['aucun écart écrit au-dessus du total au lâcher (le total passe de ' + repos.total + ' à ' + apres35.total + ' sans « ' + (attendu > 0 ? '+' : '−') + Math.abs(attendu) + ' »)'];
    return Number(chip[0].tx.replace('−', '-').replace('–', '-')) === attendu ? [] : ['l\'écart écrit (« ' + chip[0].tx + ' ») n\'est pas celui du total (' + attendu + ')'];
  },
  'rail-ebullition-pas5': async () => {
    const { apres35, apres20 } = await A();
    const m1 = apres35.hs[0] && nombre(apres35.hs[0].t), m2 = apres20.hs[0] && nombre(apres20.hs[0].t);
    const pb = [];
    if (m1 == null || m2 == null || m1 % 5 || m2 % 5) pb.push('lâchers à « ' + (apres35.hs[0] || {}).t + ' » et « ' + (apres20.hs[0] || {}).t + ' » : pas des multiples de 5′');
    if (m1 === m2) pb.push('deux lâchers donnent le même moment');
    const i1 = apres35.cartes[0] && apres35.cartes[0].ibu, i2 = apres20.cartes[0] && apres20.cartes[0].ibu;
    if (i1 === i2) pb.push('deux lâchers donnent le même IBU de ligne (' + i1 + ')');
    return pb;
  },
  'rail-geste-interrompu': async () => {
    const { avant, pendant, apres } = await I();
    const pb = [];
    const a = avant.cartes[0], b = apres.cartes[0];
    if (!b) return ['la carte a disparu après l\'interruption'];
    if (Math.abs(a.t - b.t) > 2) pb.push('après un touchcancel la carte est à ' + Math.round(b.t) + ' px au lieu de ' + Math.round(a.t) + ' px');
    if (apres.hs[0] && avant.hs[0] && apres.hs[0].t !== avant.hs[0].t) pb.push('le moment a changé (« ' + avant.hs[0].t + ' » → « ' + apres.hs[0].t + ' »)');
    if (apres.ticks.length) pb.push(apres.ticks.length + ' graduation(s) restent ouvertes après l\'interruption');
    if (b.ombre) pb.push('l\'ombre reste après l\'interruption');
    if (pendant.ticks.length === 0 && pendant.cartes[0] && pendant.cartes[0].h >= avant.cartes[0].h - 1) pb.push('rien ne se passait pendant le geste interrompu');
    return pb;
  },
  'rail-loupe-referme': async () => {
    const { apres35: e } = await A();
    const g = gradsEcrites(e), pb = [];
    if (g.length) pb.push(g.length + ' graduation(s) écrite(s) après le lâcher (' + g.slice(0, 4).map((x) => x.tx).join(', ') + ')');
    if (e.ticks.length) pb.push(e.ticks.length + ' trait(s) de graduation après le lâcher');
    const c = e.cartes[0];
    if (c && c.h <= 48) pb.push('la carte reste repliée (' + Math.round(c.h) + ' px) après le lâcher');
    return pb;
  },
  // --- Whirlpool
  'rail-whirlpool-echelle': async () => {
    const { pendant: e } = await W();
    const g = gradsEcrites(e), pb = [];
    const c = g.filter((x) => /°C/.test(x.tx)).map((x) => nombre(x.tx));
    if (c.length < 3) pb.push('moins de 3 températures écrites autour du doigt (' + g.map((x) => x.tx).join(', ') + ')');
    if (c.some((x) => x % 5)) pb.push('des températures hors des pas de 5 : ' + c.join(', '));
    if (c.some((x) => x < 60 || x > 100)) pb.push('des températures hors de 100 à 60 °C : ' + c.join(', '));
    if (e.ticks.length < 6) pb.push(e.ticks.length + ' graduation(s) autour du doigt dans le whirlpool (6 au moins)');
    return pb;
  },
  'rail-whirlpool-lache': async () => {
    const { apres85, apres70 } = await W();
    const pb = [];
    const t1 = apres85.hs[0] && apres85.hs[0].t, t2 = apres70.hs[0] && apres70.hs[0].t;
    if (!/°C/.test(t1 || '') || !/°C/.test(t2 || '')) pb.push('lâchers à « ' + t1 + ' » et « ' + t2 + ' » : pas deux réglages en °C');
    else if (t1 === t2) pb.push('deux lâchers dans le whirlpool donnent le même réglage (' + t1 + ')');
    const c = apres85.cartes[0];
    if (c && !/whirlpool/i.test(c.txt)) pb.push('la carte lâchée au whirlpool ne le dit pas');
    return pb;
  },
  'rail-whirlpool-duree': async () => {
    const { duree: d } = await W();
    const pb = [];
    if (!d.boutons) return ['aucun réglage de la durée du whirlpool sur la carte (− / +)'];
    if (d.avant == null) pb.push('la durée du whirlpool (min) n\'est pas écrite sur la carte');
    else if (d.apres === d.avant) pb.push('« + » ne change pas la durée du whirlpool (' + d.avant + ' min)');
    return pb;
  },
  'rail-loupe-suit-segment': async () => {
    const w = await W();
    const e = w.pendant;
    const g = gradsEcrites(e), pb = [];
    const mins = g.filter((x) => /′/.test(x.tx));
    if (!g.some((x) => /°C/.test(x.tx))) pb.push('le doigt dans le whirlpool : aucune graduation en °C');
    if (mins.length) pb.push('le doigt dans le whirlpool, mais ' + mins.length + ' graduation(s) d\'ébullition restent ouvertes (' + mins.slice(0, 3).map((x) => x.tx).join(', ') + ')');
    return pb;
  },
  // --- À froid
  'rail-froid-jours': async () => {
    const { pendantF3: e, apresF3 } = await F();
    const g = gradsEcrites(e).filter((x) => /^J\+/.test(x.tx)).map((x) => nombre(x.tx)).sort((a, c) => a - c);
    const pb = [];
    if (g.length < 3) pb.push('moins de 3 jours écrits autour du doigt en fermentation (' + g.length + ')');
    else if (g.slice(1).some((x, i) => x - g[i] !== 1 && x - g[i] !== 2)) pb.push('jours irréguliers : ' + g.join(', '));
    const t = apresF3.hs[0] && apresF3.hs[0].t;
    if (!/^J\+\d+$/.test(t || '')) pb.push('après le lâcher le moment se lit « ' + t + ' » au lieu de J+n');
    return pb;
  },
  'rail-froid-reglage-jour': async () => {
    const { reglage: r } = await F();
    const pb = [];
    if (!r.plus || !r.moins) return ['aucun réglage − / + du jour (J+n) sur la carte à froid'];
    if (r.b !== r.a + 1) pb.push('« + » passe J+' + r.a + ' à J+' + r.b + ' au lieu de J+' + (r.a + 1));
    if (r.c !== r.a - 1) pb.push('« − » deux fois depuis J+' + r.b + ' donne J+' + r.c + ' au lieu de J+' + (r.a - 1));
    return pb;
  },
  'rail-froid-aucun-ibu': async () => {
    const { avant, apresF3 } = await F();
    const c = apresF3.cartes[0], pb = [];
    if (!c || !/aucun IBU/i.test(c.txt)) pb.push('la ligne à froid ne dit pas « aucun IBU » (carte : « ' + (c ? c.txt.slice(0, 80) : '?') + ' »)');
    if (!/à froid/i.test(c ? c.txt : '')) pb.push('la ligne à froid ne dit pas « à froid »');
    if (avant.total != null && apresF3.total != null && apresF3.total >= avant.total) pb.push('l\'IBU total ne baisse pas quand le houblon passe à froid (' + avant.total + ' → ' + apresF3.total + ')');
    return pb;
  },
  'rail-post-segment': async () => {
    const { apresF3, apresP10 } = await F();
    const pb = [];
    const c = apresP10.cartes[0], L = apresP10.lab;
    if (L.post == null || !c) return ['repère post-fermentation ou carte introuvable'];
    if (c.t < L.post - 4) pb.push('la ligne lâchée en post-fermentation se pose au-dessus de son repère (y ' + Math.round(c.t) + ' contre ' + Math.round(L.post) + ')');
    const c1 = apresF3.cartes[0], L1 = apresF3.lab;
    if (c1 && L1.post != null && c1.t + c1.h > L1.post + 4) pb.push('la ligne de la fermentation passe sous le repère de la post-fermentation');
    const t = apresP10.hs[0] && apresP10.hs[0].t;
    if (!/^J\+10$/.test(t || '')) pb.push('lâché à J+10 de la post-fermentation, le moment se lit « ' + t + ' »');
    return pb;
  },
  // --- Durées d'ébullition
  'rail-ebu45': async () => ebu(45),
  'rail-ebu120': async () => ebu(120),
  'rail-ebu200': async () => ebu(200),
  // --- Plusieurs houblons
  'rail-k3-sans-chevauchement': async () => {
    const o = await K();
    const pb = [];
    for (const { e, y, t } of o.pas) {
      const lis = e.textes.filter((x) => !x.poignee && x.carte !== 0 && x.t > 95 && x.l < 300);
      for (let i = 0; i < lis.length; i++) for (let j = i + 1; j < lis.length; j++) {
        const a = lis[i], c = lis[j];
        if (a.carte >= 0 && a.carte === c.carte) continue;
        const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.b, c.b) - Math.max(a.t, c.t);
        if (ox > 2 && oy > 2) pb.push('« ' + a.tx + ' » sur « ' + c.tx + ' » (' + Math.round(ox) + '×' + Math.round(oy) + ' px, doigt à ' + t + ')');
      }
    }
    return [...new Set(pb)].slice(0, 4);
  },
  'rail-k3-sans-saut-cote': async () => {
    const o = await K();
    const pb = [];
    const noms = o.repos.cartes.slice(1).map((c) => c.nom);
    for (const nom of noms) {
      let prec = null;
      for (const { e, t } of o.pas) {
        const x = e.textes.find((q) => q.tx === nom && q.carte >= 0);
        if (!x) continue;
        if (prec && Math.abs(x.l - prec.l) > 8) { pb.push('« ' + nom + ' » saute de ' + Math.round(Math.abs(x.l - prec.l)) + ' px de côté quand le doigt passe à ' + t); break; }
        prec = x;
      }
    }
    return pb;
  },
  'rail-k3-echelle-respectee': async () => {
    const o = await K();
    const pb = [];
    const mins = o.pas.map((p) => (/^\d+\s*′$/.test(p.t) ? nombre(p.t) : null));
    let hautMax = null;
    for (let i = 0; i < mins.length; i++) {
      if (mins[i] == null) continue;
      if (hautMax != null && mins[i] > hautMax) { pb.push('le moment tenu remonte de ' + hautMax + '′ à ' + mins[i] + '′ en descendant'); break; }
      if (hautMax != null && hautMax - mins[i] > 10) { pb.push('le moment tenu saute de ' + hautMax + '′ à ' + mins[i] + '′ en un pas de 10 px'); break; }
      hautMax = mins[i];
    }
    if (mins.every((m) => m == null)) pb.push('le repère ne lit jamais de minutes d\'ébullition (' + o.pas.slice(0, 5).map((p) => p.t).join(', ') + ')');
    const noms = o.repos.cartes.slice(1).map((c) => c.nom);
    for (const nom of noms) {
      let prec = null;
      for (const { e, t } of o.pas) {
        if (!/^[0-9]+ ?′$/.test(t)) continue;
        const x = e.textes.find((q) => q.tx === nom && q.carte >= 0);
        if (!x) continue;
        if (prec && Math.abs(x.t - prec.t) > 24) { pb.push('« ' + nom + ' » bondit de ' + Math.round(Math.abs(x.t - prec.t)) + ' px quand le doigt passe à ' + t); break; }
        prec = x;
      }
    }
    return pb;
  },
  'rail-extremes': async () => {
    const pb = [];
    for (const h of [844, 620]) {
      const o = await X(h);
      if (!o.jMax) pb.push('écran de ' + h + ' px : le doigt, de la durée d\'ébullition, n\'atteint pas J+14 (le repère a lu : ' + o.vusBas.slice(-4).join(' ; ') + ')');
      if (!o.hautOk) pb.push('écran de ' + h + ' px : le houblon le plus bas ne remonte pas jusqu\'à la durée d\'ébullition (le repère a lu : ' + o.vusHaut.slice(-4).join(' ; ') + ')');
    }
    return pb;
  },
  // --- Gestes de la carte
  'rail-dose': async () => {
    const o = await G();
    if (!o.dose.trouve) return ['aucun bouton « + » de dose sur la carte'];
    const a = o.apresAjout.cartes[0], b = o.apresDose.cartes[0];
    return a && b && a.txt !== b.txt ? [] : ['« + » ne change ni la dose ni l\'IBU de la carte'];
  },
  'rail-type-ajout': async () => {
    const o = await G();
    if (!o.type.trouve) return ['aucun bouton du type d\'ajout (ébullition ⟳) sur la carte'];
    const a = o.apresDose.cartes[0], b = o.apresType.cartes[0];
    return a && b && a.txt !== b.txt ? [] : ['le type d\'ajout ne change pas au toucher'];
  },
  'rail-retirer': async () => {
    const o = await G();
    if (!o.retrait.trouve) return ['aucun bouton « × » pour retirer le houblon de la recette'];
    return o.apresRetrait.cartes.length < o.apresType.cartes.length ? [] : ['« × » ne retire pas la ligne du rail'];
  },
  'rail-clavier': async () => {
    const o = await C();
    if (!o.focus) return ['la poignée du moment ne prend pas le focus (aucun bouton ni slider à focaliser)'];
    const t0 = o.avant.hs[0].t, t1 = o.apres.hs[0] && o.apres.hs[0].t, t2 = o.apres2.hs[0] && o.apres2.hs[0].t;
    return t1 && t1 !== t0 && t2 && t2 !== t1 ? [] : ['flèche bas sur la poignée : « ' + t0 + ' » → « ' + t1 + ' » → « ' + t2 + ' » : le moment ne change pas au clavier'];
  },
};
async function ebu(n) {
  const o = await E(n);
  const pb = [];
  const ligne = o.repos.textes.find((t) => /^Ébullition$/.test(t.tx) && !t.poignee);
  const dur = o.repos.textes.filter((t) => t.carte < 0 && !t.poignee && ligne && Math.abs((t.t + t.b) / 2 - (ligne.t + ligne.b) / 2) < 10 && /^\d+$/.test(t.tx.replace(/′/, '')) && t.l > ligne.l).map((t) => nombre(t.tx));
  if (!ligne) pb.push('aucune ligne « Ébullition » sur le rail');
  else if (!dur.includes(n)) pb.push('la ligne « Ébullition » ne lit pas ' + n + '′ (lit ' + (dur.join(', ') || 'rien') + ')');
  const e = o.haut;
  if (!e) pb.push('le doigt, parti du repère à 60′, ne monte pas jusqu\'à ' + n + '′ (le repère a lu : ' + o.vus.slice(-5).join(' ; ') + ')');
  else {
    const g = gradsEcrites(e).filter((x) => /′/.test(x.tx)).map((x) => nombre(x.tx));
    if (g.some((x) => x > n)) pb.push('des graduations au-delà de ' + n + '′ : ' + g.filter((x) => x > n).join(', '));
    if (e.ticks.length < 4) pb.push('rail ouvert vers ' + n + '′ : ' + e.ticks.length + ' graduation(s) seulement');
  }
  const mx = Math.max(0, ...o.vus.map((t) => (/′/.test(t) ? nombre(t) : 0)));
  if (mx > n) pb.push('le repère monte à ' + mx + '′, au-delà de la durée ' + n + '′');
  return pb;
}

// ===== Lancement =====
const inv = JSON.parse(fs.readFileSync(inventaire, 'utf8'));
const aJouer = (inv.fonctions || []).filter((f) => f.controle === 'controle-fonctions-rail' && (!seuls || seuls.includes(f.id)));
let ok = 0;
try {
  for (const f of aJouer) {
    let pb;
    try { pb = FN[f.id] ? await FN[f.id]() : ['aucune règle jouée pour cette fonction dans le contrôle']; }
    catch (e) { pb = [String(e && e.message || e)]; }
    if (!pb.length) { ok++; console.log(f.id + ' OK'); } else console.log(f.id + ' ECHEC : ' + pb.join(' ; '));
  }
} finally {
  await nav.close();
}
if (ok === aJouer.length && aJouer.length) console.log('FONCTIONS-RAIL OK (' + ok + '/' + aJouer.length + ')');
else { console.log('FONCTIONS-RAIL ECHEC (' + ok + '/' + aJouer.length + ')'); process.exit(1); }
