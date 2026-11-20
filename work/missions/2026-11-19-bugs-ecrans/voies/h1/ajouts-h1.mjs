// k2, preuve 4 : Stocks › Houblons › Sources, « Ajouter des références, des études et des modèles » ouvert, chacun de ses sous-replis ouvert,
// la page entière (le conteneur qui défile est déplié le temps de la capture), en tranches de 900 px, 390 tactile, clair et cave. dev-local, Firestore coupé.
// usage : node scripts/with_server.mjs --server "npm run dev" --port 3107 --env PORT=3107 -- node work/missions/2026-11-19-bugs-ecrans/voies/h1/ajouts-h1.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const req = createRequire(import.meta.url);
const puppeteer = req(join(process.cwd(), 'node_modules', 'puppeteer-core'));
const ici = dirname(fileURLToPath(import.meta.url));
const port = (process.env.WITH_SERVER_PORTS ?? '3107').split(',')[0];
const out = join(ici, 'captures');
mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const attendre = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const vp = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const rapport = {};
for (const theme of ['clair', 'cave']) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setRequestInterception(true);
  p.on('request', r => { if (/firestore\.googleapis\.com|firebaseio\.com|firebasestorage|cloudfunctions\.net|generativelanguage|aiplatform/.test(r.url())) r.abort(); else r.continue(); });
  await p.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  await p.setViewport(vp);
  await p.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('nav', { timeout: 120000 }).catch(() => {});
  await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await attendre(800);
  await p.evaluate(() => { const b = [...document.querySelectorAll('nav button, nav a, button')].find(x => /^\s*Stocks?\s*$/i.test(x.textContent || '') || /Stocks?/.test(x.getAttribute('aria-label') || '')); b?.click(); });
  await p.waitForFunction(() => !/Chargement de l’écran/.test(document.body.innerText), { timeout: 90000 }).catch(() => {});
  await attendre(900);
  const cliquer = async prefixe => { for (let i = 0; i < 4; i++) { const ok = await p.evaluate(o => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim().replace(/\s+/g, ' ').startsWith(o)); if (b) b.click(); return !!b; }, prefixe); if (ok) break; await attendre(1500); } await attendre(1500); };
  await cliquer('Houblons'); await attendre(1000);
  await cliquer('Sources'); await attendre(1500);
  // ouvrir « Ajouter des références… », puis tous ses sous-replis par passes (un repli ouvert monte ses enfants)
  for (let passe = 0; passe < 4; passe++) {
    await p.evaluate(() => {
      const aj = [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] > details')].find(d => /Ajouter des références/.test(d.querySelector('summary')?.textContent || ''));
      if (!aj) return;
      if (!aj.open) aj.open = true;
      aj.querySelectorAll('details').forEach(d => { if (!d.closest('[data-role="classe-thiols"]')) d.open = true; });
    });
    await attendre(600);
  }
  // déplier le conteneur qui défile : tous les ancêtres de la section perdent leur hauteur fixe et leur défilement
  const hauteur = await p.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Connaissances du houblon"]');
    for (let e = sec; e && e !== document.documentElement; e = e.parentElement) { e.style.overflow = 'visible'; e.style.height = 'auto'; e.style.maxHeight = 'none'; }
    document.documentElement.style.height = 'auto'; document.body.style.height = 'auto'; document.body.style.overflow = 'visible';
    const nav = document.querySelector('nav[aria-label*="rincipal"], nav');
    void nav;
    return Math.ceil(document.documentElement.scrollHeight);
  });
  await attendre(800);
  const total = await p.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  const tranche = 900;
  const nb = Math.min(Math.ceil(total / tranche), 8);
  for (let i = 0; i < nb; i++) {
    await p.screenshot({ path: join(out, `h1-apres-m390-${theme}-ajouts-ouverts${i === 0 ? '' : '-' + i}.png`), clip: { x: 0, y: i * tranche, width: 390, height: Math.min(tranche, total - i * tranche) }, captureBeyondViewport: true });
  }
  const boutons = await p.evaluate(() => [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] button')].filter(b => b.getClientRects().length).map(b => (b.textContent || '').trim().replace(/\s+/g, ' ')));
  rapport[theme] = { hauteur, total, tranches: nb, boutons };
  await ctx.close();
}
await browser.close();
writeFileSync(join(out, 'h1-apres-ajouts-rapport.json'), JSON.stringify(rapport, null, 1));
console.log(JSON.stringify(rapport, null, 1));
