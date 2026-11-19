// Sonde s1 : ouvre Stocks (dev-local, Firestore coupé), lit titres, onglets, noms ; capture clair/cave 390 et 1280.
// usage : node sonde.mjs <port> <sous-dossier> [onglet]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const req = createRequire(import.meta.url);
const puppeteer = req(join(process.cwd(), 'node_modules', 'puppeteer-core'));
const ici = dirname(fileURLToPath(import.meta.url));
const [port, sous = 'captures', onglet = ''] = process.argv.slice(2);
const out = join(ici, sous);
mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const attendre = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const CFG = { m390: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, d1280: { width: 1280, height: 800 } };
for (const [nom, vp] of Object.entries(CFG).filter(([n])=>!process.env.CFGS||process.env.CFGS.split(',').includes(n))) {
  for (const theme of (process.env.THEMES||'clair,cave').split(',')) {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.setRequestInterception(true);
    p.on('request', r => { if (/firestore\.googleapis\.com|firebaseio\.com|firebasestorage|cloudfunctions\.net|generativelanguage|aiplatform/.test(r.url())) r.abort(); else r.continue(); });
    const err=[];p.on('pageerror',e=>err.push('PAGEERR '+e.message.slice(0,200)));p.on('console',m=>{if(m.type()==='error')err.push('CONSOLE '+m.text().slice(0,160));});
    await p.setViewport(vp);
    await p.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await p.waitForSelector('nav', { timeout: 120000 }).catch(() => {});
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await attendre(800);
    // ouvrir Stocks par le bouton de navigation
    await p.evaluate(() => { const b = [...document.querySelectorAll('nav button, nav a, button')].find(x => /^\s*Stocks?\s*$/i.test(x.textContent || '') || /Stocks?/.test(x.getAttribute('aria-label') || '')); b?.click(); });
    await p.waitForFunction(() => !/Chargement de l’écran/.test(document.body.innerText), { timeout: 90000 }).catch(() => {});
    await attendre(900);
    const cliquer = async (prefixe) => { for (let i = 0; i < 4; i++) { const ok = await p.evaluate(o => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim().replace(/\s+/g, ' ').startsWith(o)); if (b) b.click(); return !!b; }, prefixe); if (ok) break; await attendre(1500); } await attendre(1500); };
    const capter = async (tag) => { await p.waitForFunction(() => !/Chargement de/.test(document.body.innerText), { timeout: 90000 }).catch(() => {}); await attendre(500); await p.screenshot({ path: join(out, nom + '-' + theme + '-' + tag + '.png'), fullPage: nom === 'm390' }); };
    await cliquer('Houblons'); await p.waitForSelector('section[aria-label="Houblons"]', { timeout: 90000 }).catch(() => {}); await attendre(1000);
    await capter('houblons-index');
    await cliquer('Admiral'); await attendre(1200); await capter('fiche-admiral');
    await p.keyboard.press('Escape'); await attendre(600);
    await p.evaluate(() => { const x = document.querySelector('[role="dialog"] button[aria-label*="Fermer"], [role="dialog"] button'); x?.click(); }); await attendre(600);
    await cliquer('Sources'); await attendre(1500); await capter('sources-modeles');
    const lu = await p.evaluate(() => ({
      nav: [...document.querySelectorAll('nav button, nav a')].map(b => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean),
      titres: [...document.querySelectorAll('h1, h2, h3, [role="heading"]')].map(h => `${h.tagName}:${(h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80)}`),
      onglets: [...document.querySelectorAll('[role="tab"]')].map(t => (t.textContent || '').trim().replace(/\s+/g, ' ')),
      titreDoc: document.title,
    }));
    console.log(nom, theme, JSON.stringify(lu), 'ERR:', JSON.stringify(err.slice(0,4)), 'TEXTE:', JSON.stringify((await p.evaluate(()=>document.body.innerText)).slice(0,160)));
        await ctx.close();
  }
}
await browser.close();
