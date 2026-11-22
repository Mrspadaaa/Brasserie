// CAL-FRISE-PRIX : le cadre de période de la courbe joué au doigt (390×844 tactile) sur le build du tag tour8 + fixture ZZ TEST.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const [SRC, BUILD, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(path.join(SRC, 'package.json'));
const puppeteer = require('puppeteer-core');
const { fixtureCalendrier } = await import(pathToFileURL(path.join(SRC, 'scripts/parcours/fixtures/calendrier.mjs')).href);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let f = path.join(BUILD, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, 'index.html'); r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); });
await new Promise((o) => srv.listen(0, '127.0.0.1', o));
const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const log = []; const L = (s) => { log.push(s); console.log(s); };
try {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const fx = fixtureCalendrier(new Date().toISOString().slice(0, 10));
  await p.evaluateOnNewDocument((j) => { if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', j); }, JSON.stringify(fx.entrees));
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  const cdp = await p.createCDPSession();
  const cap = (n) => p.screenshot({ path: path.join(OUT, `${n}.png`) });
  await p.goto(url, { waitUntil: 'networkidle0' }); await sleep(2500);
  // vers le Calendrier (toucher réel)
  const c = await p.evaluate(() => { const b = [...document.querySelectorAll('nav button, nav a')].find((x) => x.textContent.trim().startsWith('Calendrier')); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.touchscreen.tap(c[0], c[1]); await sleep(2500);
  const etat = () => p.evaluate(() => {
    const cad = document.querySelector('.ent-cadre'); const crb = cad?.parentElement; const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left * 10) / 10, Math.round(r.right * 10) / 10, Math.round(r.top), Math.round(r.bottom)]; };
    const per = [...document.querySelectorAll('button')].find((b) => /période/.test(b.getAttribute('aria-label') ?? '') && b.getBoundingClientRect().width > 0);
    const ban = [...document.querySelectorAll('body *')].find((e) => /Enregistrement sur le serveur|Synchronisation en attente|Actualisation des données/.test(e.textContent ?? '') && e.children.length < 3 && e.getBoundingClientRect().height > 0);
    return { lab: cad?.getAttribute('aria-label'), glisse: cad?.getAttribute('data-glisse') ?? null, tir: document.querySelector('[data-cadre-tirage]')?.textContent ?? null, cadre: R(cad), courbe: R(crb), deb: R(document.querySelector('[data-poignee=debut]')), fin: R(document.querySelector('[data-poignee=fin]')), per: per ? (per.getAttribute('aria-label') + ' | ' + per.textContent.trim()).slice(0, 80) : null, entTop: R(document.querySelector('[data-calendrier-entete]'))?.[2], ban: ban ? ban.textContent.trim().slice(0, 50) + ' h=' + Math.round(ban.getBoundingClientRect().height) : null, scrollY };
  });
  const e0 = await etat(); L('DEPART ' + JSON.stringify(e0)); await cap('00-depart');
  if (!e0.cadre) throw new Error('pas de cadre sur la courbe');
  const yC = (e0.courbe[2] + e0.courbe[3]) / 2;
  const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 8, radiusY: 8 }];
  /** Un geste au doigt : x0 → x1 en `pas` pas de 16 ms, puis `tenir` ms au bout ; trace l'état à chaque pas. */
  async function geste(nom, x0, x1, { pas = 16, tenir = 0, y = yC } = {}) {
    const av = await etat();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y) }); await sleep(50);
    const tr = [];
    for (let k = 1; k <= pas; k++) {
      const x = x0 + ((x1 - x0) * k) / pas;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x, y) });
      await sleep(16);
      const e = await etat(); tr.push({ x: Math.round(x), cad: e.cadre, tir: e.tir, g: e.glisse });
    }
    if (tenir) { for (let t = 0; t < tenir; t += 250) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x1 + (t % 500 ? 0.4 : -0.4), y) }); await sleep(250); const e = await etat(); tr.push({ x: Math.round(x1), t, cad: e.cadre, tir: e.tir }); } }
    await cap(`${nom}-pendant`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(80); const ap80 = await etat(); await sleep(600); const ap = await etat(); await cap(`${nom}-apres`);
    L(`\n## ${nom} : doigt ${Math.round(x0)}→${Math.round(x1)}${tenir ? ` puis tenu ${tenir} ms` : ''}`);
    L(`avant : ${av.lab} | cadre ${av.cadre} | ${av.per}`);
    L('trace : ' + tr.map((s) => `${s.x}${s.t !== undefined ? '+' + s.t : ''}:[${s.cad?.[0]},${s.cad?.[1]}]${s.tir ? '«' + s.tir + '»' : ''}${s.g ? '' : '(g-)'}`).join(' '));
    L(`lâché +80 ms : ${ap80.lab} | cadre ${ap80.cadre}`);
    L(`après : ${ap.lab} | cadre ${ap.cadre} | prises deb ${ap.deb} fin ${ap.fin} | ${ap.per} | entTop ${ap.entTop} | bandeau ${ap.ban}`);
    return { av, tr, ap };
  }
  const mil = (z) => (z[0] + z[1]) / 2;
  // 1. glisser la fenêtre (poignée de début, seule prise qui déplace) de 60 px à droite, puis la ramener
  let e = await etat();
  await geste('g1-glisser-droite', mil(e.deb), mil(e.deb) + 60);
  e = await etat(); await geste('g2-glisser-gauche', mil(e.deb), mil(e.deb) - 60);
  // 2. étirer la fin vers la droite puis la gauche
  e = await etat(); await geste('g3-fin-etirer', mil(e.fin), Math.min(370, mil(e.fin) + 50));
  e = await etat(); await geste('g4-fin-raccourcir', mil(e.fin), mil(e.fin) - 50);
  // 3. étirer le début (vers la gauche) : la durée devrait-elle changer ?
  e = await etat(); await geste('g5-debut-vers-gauche', mil(e.deb), mil(e.deb) - 40);
  // 4. mauvais bord : doigt posé 2 px dans le cadre près de chaque bord
  e = await etat(); await geste('g6-bord-gauche-dedans', e.cadre[0] + 2, e.cadre[0] + 42);
  e = await etat(); await geste('g7-bord-droit-dedans', e.cadre[1] - 2, e.cadre[1] - 42);
  // 5. reculer au bord gauche (tenu 1,5 s), avancer au bord droit (tenu 1,5 s)
  e = await etat(); await geste('g8-reculer-au-bord', mil(e.deb), 6, { tenir: 1500 });
  e = await etat(); await geste('g9-avancer-fin-au-bord', mil(e.fin), 386, { tenir: 1500 });
  e = await etat(); L('\nFIN ' + JSON.stringify(e));
  // 6. rechargement : la période tient-elle ?
  await p.reload({ waitUntil: 'networkidle0' }); await sleep(2500);
  const c2 = await p.evaluate(() => { const b = [...document.querySelectorAll('nav button, nav a')].find((x) => x.textContent.trim().startsWith('Calendrier')); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.touchscreen.tap(c2[0], c2[1]); await sleep(2500);
  L('RECHARGE ' + JSON.stringify(await etat())); await cap('99-recharge');
  L('erreurs page : ' + (errs.join(' | ') || 'aucune'));
} finally { fs.writeFileSync(path.join(OUT, 'trace.txt'), log.join('\n')); await nav.close(); srv.close(); }
