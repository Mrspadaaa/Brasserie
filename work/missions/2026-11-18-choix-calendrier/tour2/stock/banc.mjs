// Lot stock, tour 2 (vision du 19.11) : APP-ENTETE-COLLE côté Stocks, Courses n° 2 et 3, pastille n° 6.
// Banc : vite --port 5602, Firebase factice, ?dev-local (données de démonstration locales). Mesures au DOM, quelques captures.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const DOS = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-18-choix-calendrier/tour2/stock';
const APP = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const req = createRequire(APP + '/package.json');
const puppeteer = req('puppeteer-core');
const PORT = 5602;
const URL0 = `http://localhost:${PORT}/?dev-local`;
const dormir = ms => new Promise(r => setTimeout(r, ms));
const FACTICE = { VITE_FIREBASE_API_KEY: 'AIzaSyBancFactice00000000000000000000000', VITE_FIREBASE_PROJECT_ID: 'demo-banc', VITE_FIREBASE_AUTH_DOMAIN: 'demo-banc.firebaseapp.com', VITE_FIREBASE_APP_ID: '1:1:web:1', VITE_FIREBASE_STORAGE_BUCKET: 'demo-banc.appspot.com', VITE_FIREBASE_MESSAGING_SENDER_ID: '1', VITE_USE_FIREBASE_EMULATORS: 'false' };
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: APP, shell: true, env: { ...process.env, ...FACTICE } });
await new Promise((res, rej) => { let t = ''; const f = d => { t += d; if (/ready in|Local:/.test(t)) res(); }; vite.stdout.on('data', f); vite.stderr.on('data', f); setTimeout(() => rej(new Error('vite: ' + t.slice(-400))), 90000); });
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars'] });
const VUES = [
  { id: '390', vp: { width: 390, height: 660, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
  { id: '844', vp: { width: 844, height: 340, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true } },
  { id: '1280', vp: { width: 1280, height: 800, deviceScaleFactor: 1 } }
];
const CAPT = new Set(['390-clair-art-400', '390-clair-courses', '844-cave-art-400', '844-clair-recompter-300', '1280-cave-courses', '390-cave-art-bas']);
const mesures = [];
process.on('uncaughtException', e => { console.error(e); spawn('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { shell: true }); setTimeout(() => process.exit(1), 1500); });
const erreurs = [];
{ const p0 = await nav.newPage(); await p0.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 120000 }); await dormir(12000); await p0.close(); }
for (const v of VUES) for (const theme of ['clair', 'cave']) {
  const tag = `${v.id}-${theme}`;
  const page = await nav.newPage();
  page.on('pageerror', e => erreurs.push(`${tag} pageerror ${e.message.slice(0, 160)}`));
  await page.setViewport(v.vp);
  await page.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  await page.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dormir(mesures.length === 0 ? 20000 : 4000);
  const cliquer = async (re) => page.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button,a,[role="tab"]')].find(x => r.test((x.textContent ?? '').trim()) && x.getBoundingClientRect().width > 0); b?.click(); return !!b; }, re);
  const cap = async (nom) => { if (CAPT.has(`${tag}-${nom}`)) await page.screenshot({ path: `${DOS}/${tag}-${nom}.png` }); };
  const injecter = () => page.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts');
    const M = (cat, name, cur, min, unit) => ({ id: 'ZZ-' + name, ref: 'ZZ-' + name.replace(/W/g, ''), name: 'ZZ TEST — ' + name, category: cat, unit, currentStock: cur, minStock: min, reorder: cur <= min, supplier: cat === 'Houblon' ? 'Hopsteiner' : 'Brau-Rauchshop' });
    const l = [];
    ['Pilsner', 'Pale Ale', 'Maris Otter', 'Weizen', 'Avoine', 'Munich', 'Vienne', 'Carapils', 'Caramunich', 'Melanoidin', 'Biscuit', 'Chocolat', 'Orge grillée', 'Seigle'].forEach((n, i) => l.push(M('Malt', n, i % 3 === 0 ? 0 : i, 10, 'kg')));
    ['Citra', 'Idaho 7', 'Nelson Sauvin', 'Motueka', 'Sabro', 'Magnum', 'Mosaic', 'Saaz'].forEach((n, i) => l.push(M('Houblon', n, i % 2 ? 50 : 300, 200, 'g')));
    ['US-05', 'Verdant', 'Windsor', 'Belle Saison'].forEach((n, i) => l.push(M('Levure', n, i, 2, 'sachet')));
    ['Gypse', 'Lactose', 'Protofloc', 'Acide lactique'].forEach((n, i) => l.push(M('Additif', n, i * 20, 100, 'g')));
    l.push(M('Emballage', 'Bouteille 33cl', 240, 300, 'pièce'), M('Emballage', 'Capsule 26mm', 900, 500, 'pièce'));
    l.forEach(it => StorageService.addStockItem('rawMaterials', it));
    return l.length;
  });
  let injectes; for (let essai = 0; essai < 3 && injectes === undefined; essai++) { try { injectes = await injecter(); } catch (e) { erreurs.push(`${tag} injection ${String(e.message).slice(0, 100)}`); await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); await dormir(6000); } }
  mesures.push({ tag, k: 'injection', n: injectes ?? 'aucun' });
  await dormir(800);
  await cliquer('Stocks$'); await dormir(2500);
  await cliquer('^Articles$'); await dormir(1500);
  const lire = (k) => page.evaluate((k) => {
    const entete = [...document.querySelectorAll('header, [role="banner"]')].find(e => /L.Affinée/.test(e.textContent ?? '')) ?? [...document.querySelectorAll('body *')].find(e => (e.textContent ?? '').trim().startsWith("L'Affinée") && e.getBoundingClientRect().height > 20);
    const def = document.querySelector('[data-testid="stock-defile"]');
    const items = def ? [...def.querySelectorAll('[data-index]')] : [];
    const rects = items.map(i => i.getBoundingClientRect()).filter(r => r.height > 0);
    const visibles = rects.filter(r => r.bottom > 0 && r.top < innerHeight).length;
    const interieurs = [...document.querySelectorAll('.stocks-screen *')].filter(e => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2; }).map(e => (e.className?.toString?.() ?? '').slice(0, 40));
    const pil = [...document.querySelectorAll('p[role="status"]')].find(p => /Compagnon hors connexion/.test(p.textContent ?? ''));
    const manque = [...document.querySelectorAll('button')].find(b => /^manque/.test((b.textContent ?? '').trim()));
    return { k, scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight, enteteTop: entete ? Math.round(entete.getBoundingClientRect().top) : null,
      lignesRendues: items.length, lignesVisibles: visibles, hautPremiere: rects.length ? Math.round(Math.min(...rects.map(r => r.top))) : null, basDerniere: rects.length ? Math.round(Math.max(...rects.map(r => r.bottom))) : null,
      defileInterne: interieurs, pastilleCompagnon: pil ? Math.round(pil.getBoundingClientRect().top) : null, manque: manque?.textContent?.trim() };
  }, k);
  mesures.push({ tag, ...(await lire('art-repos')) });
  await page.evaluate(() => window.scrollTo(0, 400)); await dormir(800);
  mesures.push({ tag, ...(await lire('art-400')) }); await cap('art-400');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await dormir(1200);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await dormir(800);
  mesures.push({ tag, ...(await lire('art-bas')) }); await cap('art-bas');
  // Recompter : les outils restent collés en haut de la fenêtre.
  await page.evaluate(() => window.scrollTo(0, 0)); await dormir(300);
  await cliquer('^Recompter$'); await dormir(1200);
  await page.evaluate(() => window.scrollTo(0, 300)); await dormir(600);
  mesures.push({ tag, k: 'recompter-300', scrollY: await page.evaluate(() => Math.round(scrollY)), rechercheTop: await page.evaluate(() => { const s = document.querySelector('input[type="search"], [role="searchbox"]'); return s ? Math.round(s.getBoundingClientRect().top) : null; }), colle: await page.evaluate(() => { const c = document.querySelector('.stocks-screen .sticky'); if (!c) return null; const r = c.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), parentH: Math.round(c.parentElement.getBoundingClientRect().height) }; }) });
  await cap('recompter-300');
  await cliquer('^Étagère$'); await dormir(600);
  // Courses
  await page.evaluate(() => window.scrollTo(0, 0)); await dormir(300);
  await cliquer('^Courses$'); await dormir(1500);
  mesures.push({ tag, k: 'courses', ...(await page.evaluate(() => {
    const rep = document.querySelector('[data-testid="commande-repliee"]'); const zone = rep?.parentElement;
    const t = zone?.textContent ?? '';
    const l = rep?.querySelector('button');
    const span = l?.querySelector('span');
    return { replie: l?.textContent?.trim(), rien: (t.match(/Rien à commander/g) ?? []).length, aCommander: (t.match(/à commander/g) ?? []).length, avant: (t.match(/avant S\d+/g) ?? []).length,
      coupe: span ? span.scrollWidth > span.clientWidth + 1 : null, bandeau: document.querySelector('[data-testid="courses-horizon"]')?.textContent?.trim() ?? null, defile: zone ? getComputedStyle(zone).overflowY : null };
  })) });
  await cap('courses');
  await page.close();
}
writeFileSync(`${DOS}/mesures.json`, JSON.stringify({ mesures, erreurs }, null, 1));
await nav.close();
vite.kill(); spawn('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { shell: true });
console.log(JSON.stringify(mesures.map(m => ({ tag: m.tag, k: m.k, y: m.scrollY, e: m.enteteTop, docH: m.docH, rend: m.lignesRendues, vis: m.lignesVisibles, h1: m.hautPremiere, bas: m.basDerniere, int: m.defileInterne?.length, pil: m.pastilleCompagnon, manque: m.manque, rech: m.rechercheTop, colle: m.colle, rep: m.replie, rien: m.rien, ac: m.aCommander, av: m.avant, coupe: m.coupe, band: m.bandeau })), null, 0).replace(/\},\{/g, '},\n{'));
console.log('erreurs', erreurs.length, erreurs.slice(0, 5));
process.exit(0);
