// Contrôle « un clic, sans défilement » (refonte houblons #119, phase 4).
//
// Besoin du brasseur : « Sur mobile, en un clic, sans scroll, je veux pouvoir choisir
// mon houblon et voir ce que j'ai. » Critère : depuis l'étape Houblons, à 390 × 844,
// 0 ou 1 toucher suffit pour voir au moins 5 houblons du stock (ou tout le stock s'il
// en a moins), chacun avec sa quantité, au premier plan, sans défiler. Aucun houblon
// hors stock ne passe avant eux.
//
// Le contrôle ne connaît pas l'écran : il essaie l'état d'arrivée, puis chaque
// commande visible une à une, depuis un état neuf. Un adaptateur ouvre l'écran à
// tester et fournit le stock (voir scripts/hop-one-tap/).
//
// Usage :
//   node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/qa-bench.mjs [--witness]
//   node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/wireframe.mjs
// Options : --width 390 --height 844 --out <dossier des captures> --max 30
// --witness : l'écran DOIT échouer (témoin négatif). Sortie « WITNESS OK » si c'est le cas.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const repo = process.cwd();
const require = createRequire(path.resolve(repo, 'package.json'));
const puppeteer = require('puppeteer-core');
const adapterPath = arg('adapter');
if (!adapterPath) { console.error('--adapter manquant'); process.exit(2); }
const adapter = await import(pathToFileURL(path.resolve(adapterPath)).href);
const width = Number(arg('width', 390)), height = Number(arg('height', 844));
const maxCandidates = Number(arg('max', 30));
const witness = process.argv.includes('--witness');
const out = path.resolve(arg('out', path.join(process.env.TEMP || '/tmp', 'hop-one-tap')));
fs.mkdirSync(out, { recursive: true });

// En mode production, aucun navigateur n'est lancé : le contrôle s'attache au Chrome QA du brasseur.
const browser = adapter.attach ? null : await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const ctx = adapter.attach ? null : await adapter.setup?.({ repo });
const stock = adapter.stock; // [{ name, pattern?, grams }] : houblons en stock (quantité > 0)
const catalogueOnly = adapter.catalogueOnly ?? []; // noms de houblons absents du stock
const need = Math.min(5, stock.length);

async function fresh() {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width, height, isMobile: width < 500, hasTouch: width < 500, deviceScaleFactor: 2 });
  await adapter.open(page, { width, height, ctx });
  return { context, page, errors };
}

// Ce que l'écran montre sans défiler : houblons du stock au premier plan, avec une quantité sur leur ligne.
async function measure(page) {
  return page.evaluate(({ stock, catalogueOnly }) => {
    const vw = innerWidth, vh = innerHeight;
    const shown = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      if (!(r.width > 0 && r.height > 0) || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      if (r.top < 0 || r.bottom > vh || r.left < 0 || r.right > vw) return false;
      const hit = document.elementFromPoint(Math.min(vw - 1, r.left + Math.min(r.width / 2, 30)), r.top + r.height / 2);
      return !!hit && (hit === e || e.contains(hit) || hit.contains(e)); };
    const leaves = [...document.querySelectorAll('body *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && shown(e));
    const rowOf = (e) => { let r = e; while (r.parentElement && r.parentElement.getBoundingClientRect().height <= 72) r = r.parentElement; return r; };
    const qty = /(^|[^\w])\d+(?:[.,]\d+)?\s?(?:g|kg)(?![\w])/;
    const found = [];
    for (const h of stock) {
      // pattern = source d'expression régulière fournie par l'adaptateur ; sinon le nom, échappé.
      const src = h.pattern ?? h.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
      const re = new RegExp('(^|[^\\p{L}])' + src + '($|[^\\p{L}])', 'iu');
      const el = leaves.find((e) => re.test(e.textContent));
      if (!el) continue;
      const row = rowOf(el);
      found.push({ name: h.name, top: Math.round(el.getBoundingClientRect().top), withQuantity: qty.test(row.innerText) });
    }
    const outside = [];
    for (const n of catalogueOnly) {
      const re = new RegExp('(^|[^\\p{L}])' + n.replace(/ /g, '\\s+') + '($|[^\\p{L}])', 'iu');
      const el = leaves.find((e) => re.test(e.textContent));
      if (el) outside.push({ name: n, top: Math.round(el.getBoundingClientRect().top) });
    }
    return { found, outside, numberInputs: document.querySelectorAll('input[type="number"]').length };
  }, { stock, catalogueOnly });
}

const verdict = (m) => {
  const ok = m.found.filter((f) => f.withQuantity).sort((a, b) => a.top - b.top);
  const lastStock = ok.slice(0, need).at(-1)?.top ?? -1;
  const before = m.outside.filter((o) => o.top < lastStock);
  return { visibleWithQuantity: ok.length, catalogueBefore: before.map((b) => b.name), pass: ok.length >= need && before.length === 0 };
};

// Commandes candidates : visibles à l'arrivée, dans la zone de l'étape (adaptateur), sans liens externes.
async function candidates(page) {
  return page.evaluate((scope, max) => {
    const root = scope ? document.querySelector(scope) : document.body;
    if (!root) return [];
    const vh = innerHeight;
    const els = [...root.querySelectorAll('button, [role="button"], summary, a[href], [role="tab"], [role="menuitem"]')];
    const list = [];
    for (const e of els) {
      const r = e.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0) || r.top < 0 || r.bottom > vh) continue;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!hit || !(hit === e || e.contains(hit))) continue;
      const label = (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      list.push({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), label });
      if (list.length >= max) break;
    }
    return list;
  }, adapter.scope ?? null, maxCandidates);
}

// Mode production (adaptateur « attach ») : onglet du brasseur, lecture seule, pas d'état neuf ;
// état d'arrivée puis, au plus, un toucher sur une commande sans écriture (adapter.safeTaps).
if (adapter.attach) {
  let live, page;
  try {
    live = await puppeteer.connect({ browserURL: adapter.browserURL, defaultViewport: null });
    page = await adapter.findPage(live);
  } catch (e) {
    console.log(`PRODUCTION NON JOUÉE : ${e.message.split('\n')[0]} (Chrome QA attendu sur ${adapter.browserURL}, ouvert et connecté par le brasseur)`);
    live?.disconnect();
    process.exit(1);
  }
  try {
    const vp = await page.evaluate(() => [innerWidth, innerHeight]);
    let m = await measure(page);
    let v = verdict(m), label = 'aucun toucher', taps = 0;
    await page.screenshot({ path: path.join(out, 'production-0.png') });
    if (!v.pass) {
      const hit = await page.evaluate((labels) => {
        const b = [...document.querySelectorAll('button, [role="button"], summary')].find((e) => labels.some((l) => (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').startsWith(l)));
        if (b) { b.click(); return (b.getAttribute('aria-label') || b.innerText).trim().slice(0, 60); }
        return null;
      }, adapter.safeTaps);
      if (hit) { await new Promise((r) => setTimeout(r, Number(adapter.settleMs ?? 1200))); m = await measure(page); v = verdict(m); label = hit; taps = 1; await page.screenshot({ path: path.join(out, 'production-1.png') }); }
    }
    const s = `production ${vp.join(' × ')} : ${taps} toucher(s) « ${label} », ${v.visibleWithQuantity} houblons du stock visibles avec quantité (${need} exigés) ; captures ${out}`;
    if (vp[0] > 500) console.log('AVERTISSEMENT : fenêtre de ' + vp[0] + ' px ; le critère se juge à 390 px (mode appareil de Chrome).');
    if (v.pass === !witness) console.log((witness ? 'WITNESS OK ' : 'ONE-TAP OK ') + s);
    else { console.log((witness ? 'WITNESS FAILED ' : 'ONE-TAP FAIL ') + s); process.exitCode = 1; }
  } finally { live.disconnect(); }
  process.exit();
}

const states = [];
let { context, page, errors } = await fresh();
const m0 = await measure(page);
states.push({ taps: 0, label: 'aucun toucher', ...m0, ...verdict(m0) });
await page.screenshot({ path: path.join(out, 'etat-0.png') });
const cands = await candidates(page);
await context.close();
let best = states[0];
if (!best.pass) {
  for (const [i, c] of cands.entries()) {
    ({ context, page, errors } = await fresh());
    await page.mouse.click(c.x, c.y);
    await new Promise((r) => setTimeout(r, Number(adapter.settleMs ?? 900)));
    const m = await measure(page);
    const s = { taps: 1, label: c.label, ...m, ...verdict(m), pageErrors: errors.slice(0, 3) };
    states.push(s);
    if (s.pass || s.visibleWithQuantity > best.visibleWithQuantity) { best = s; await page.screenshot({ path: path.join(out, `etat-1-${i}.png`) }); }
    await context.close();
    if (s.pass) break;
  }
}
await browser.close();
await adapter.teardown?.(ctx);
const report = { adapter: adapterPath, viewport: { width, height }, need, stock: stock.map((s) => s.name), candidates: cands.length, best: { taps: best.taps, label: best.label, visibleWithQuantity: best.visibleWithQuantity, catalogueBefore: best.catalogueBefore }, states: states.map((s) => ({ taps: s.taps, label: s.label, visibleWithQuantity: s.visibleWithQuantity, pass: s.pass })) };
fs.writeFileSync(path.join(out, 'rapport.json'), JSON.stringify(report, null, 2));
const tried = states.length - 1;
const summary = `meilleur état : ${best.taps} toucher(s) « ${best.label} », ${best.visibleWithQuantity} houblons du stock visibles avec quantité (${need} exigés)` +
  (best.catalogueBefore?.length ? `, hors stock avant eux : ${best.catalogueBefore.join(', ')}` : '') + ` ; ${tried} commande(s) essayée(s) sur ${cands.length} ; captures ${out}`;
if (best.pass && !witness) console.log('ONE-TAP OK ' + summary);
else if (!best.pass && witness) console.log('WITNESS OK ' + summary);
else { console.log((witness ? 'WITNESS FAILED (l’écran témoin passe) ' : 'ONE-TAP FAIL ') + summary); process.exitCode = 1; }
