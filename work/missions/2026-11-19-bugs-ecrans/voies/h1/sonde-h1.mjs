// Voie h1 : Stocks › Houblons › fiche Nelson Sauvin (T3B-5) et Sources et modèles (T3B-4). dev-local, Firestore coupé.
// usage : node scripts/with_server.mjs --server "npm run dev" --port 3108 --env PORT=3108 -- node work/missions/2026-11-19-bugs-ecrans/voies/h1/sonde-h1.mjs <avant|apres>
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const req = createRequire(import.meta.url);
const puppeteer = req(join(process.cwd(), 'node_modules', 'puppeteer-core'));
const ici = dirname(fileURLToPath(import.meta.url));
const port = (process.env.WITH_SERVER_PORTS ?? '3108').split(',')[0];
const etat = process.argv[2] || 'apres';
const out = join(ici, 'captures');
mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const attendre = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const CFG = { m390: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, d1280: { width: 1280, height: 800 } };
const rapport = {};
for (const [nom, vp] of Object.entries(CFG).filter(([n]) => !process.env.CFGS || process.env.CFGS.split(',').includes(n))) {
  for (const theme of (process.env.THEMES || 'clair,cave').split(',')) {
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
    const capter = async tag => { await p.waitForFunction(() => !/Chargement de/.test(document.body.innerText), { timeout: 90000 }).catch(() => {}); await attendre(500); await p.screenshot({ path: join(out, `h1-${etat}-${nom}-${theme}-${tag}.png`), fullPage: nom === 'm390' }); };
    const cle = `${nom}-${theme}`;
    // T3B-5 : la fiche Nelson Sauvin
    await cliquer('Houblons'); await p.waitForSelector('section[aria-label="Houblons"]', { timeout: 90000 }).catch(() => {}); await attendre(1000);
    await p.evaluate(() => document.querySelector('[placeholder^="Nom, alias"]')?.focus());
    await p.keyboard.type('Nelson Sauvin'); await attendre(900);
    await cliquer('Nelson Sauvin'); await attendre(1500);
    await capter('fiche-nelson');
    const fiche = await p.evaluate(() => (document.querySelector('[role="dialog"]')?.innerText ?? document.body.innerText));
    writeFileSync(join(out, `h1-${etat}-${cle}-fiche-nelson.txt`), fiche);
    const mesure = await p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const r = d?.getBoundingClientRect(); const lignes = [...(d?.querySelectorAll('article p, article summary span') ?? [])].filter(e => e.getClientRects().length).map(e => ({ t: (e.textContent || '').trim().slice(0, 32), px: getComputedStyle(e).fontSize })); const mod = [...(d?.querySelectorAll('button') ?? [])].find(b => /Modifier la variété/.test(b.textContent || ''))?.getBoundingClientRect(); const nom = [...(d?.querySelectorAll('p') ?? [])].find(b => /Arômes/.test(b.textContent || ''))?.getBoundingClientRect(); return { dialogueLargeur: r && Math.round(r.width), modifierX: mod && Math.round(mod.right), aromesX: nom && Math.round(nom.left), lignes }; });
    rapport[cle] = { fiche: fiche.slice(0, 1400), mesure };
    await p.keyboard.press('Escape'); await attendre(600);
    await p.evaluate(() => { const x = document.querySelector('[role="dialog"] button[aria-label*="Fermer"]'); x?.click(); }); await attendre(600);
    // T3B-4 : Sources et modèles
    await cliquer('Sources'); await attendre(1500);
    await capter('sources-repos');
    const repos = await p.evaluate(() => [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] button')].filter(b => b.getClientRects().length).map(b => (b.textContent || '').trim().replace(/\s+/g, ' ')));
    // ouvrir « Gérer les sources et les modèles » (mobile) puis compter les boutons visibles
    await p.evaluate(() => { const s = [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] > details > summary')].find(x => /Gérer/.test(x.textContent || '')); s?.click(); });
    await attendre(600);
    await p.evaluate(() => { const s = [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] summary')].find(x => /Ajouter des références/.test(x.textContent || '')); if (s) s.parentElement.open = true; });
    await attendre(600);
    const ouvert =await p.evaluate(() => [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] button')].filter(b => b.getClientRects().length).map(b => (b.textContent || '').trim().replace(/\s+/g, ' ')));
    await capter('sources-ouvert');
    // k2 : contraste (WCAG) de chaque texte visible de la page Sources, ouverte ; ceux sous 4,5 sont listés.
    const contraste = await p.evaluate(() => {
      const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const rgba = s => { const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; return [m[0], m[1], m[2], m[3] ?? 1]; };
      const fond = el => { let e = el; while (e) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0.5) return c; e = e.parentElement; } return [255, 255, 255, 1]; };
      const faibles = []; let n = 0;
      document.querySelectorAll('section[aria-label="Connaissances du houblon"] p, section[aria-label="Connaissances du houblon"] a, section[aria-label="Connaissances du houblon"] summary, section[aria-label="Connaissances du houblon"] label').forEach(el => {
        if (!el.getClientRects().length || !(el.textContent || '').trim()) return;
        const fg = rgba(getComputedStyle(el).color), bg = fond(el); n++;
        const l1 = lum(fg), l2 = lum(bg), r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (r < 4.5) faibles.push({ texte: el.textContent.trim().slice(0, 60), ratio: +r.toFixed(2) });
      });
      return { mesures: n, faibles };
    });
    // k2 : les 4 replis de la page ont le même habillage (classe du repli et du titre)
    const habillage = await p.evaluate(() => [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] > details > summary')].map(x => ({ titre: x.textContent.trim().slice(0, 40), couleur: getComputedStyle(x).color, fond: getComputedStyle(x.parentElement).backgroundColor, taille: getComputedStyle(x).fontSize, bordure: getComputedStyle(x.parentElement).borderTopWidth })));
    // k2 : preuve demandée 4 — « Ajouter des références… » ouvert, chacun de ses sous-replis ouvert, défilement compris (390)
    for (let passe = 0; passe < 3; passe++) { await p.evaluate(() => { const aj = [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] > details')].find(d => /Ajouter des références/.test(d.querySelector('summary')?.textContent || '')); aj?.querySelectorAll('details').forEach(d => { d.open = true; }); }); await attendre(500); }
    await capter('ajouts-ouverts');   // la page entière en tranches : voir ajouts-h1.mjs (le conteneur défile ; ici, la fenêtre seule)
    const ajouts = await p.evaluate(() => [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] > details')].filter(d => /Ajouter des références/.test(d.querySelector('summary')?.textContent || '')).flatMap(d => [...d.querySelectorAll('button')].map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))));
    await p.evaluate(() => { const aj = [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] > details')].find(d => /Ajouter des références/.test(d.querySelector('summary')?.textContent || '')); aj?.querySelectorAll('details').forEach(d => { d.open = false; }); });
    await attendre(400);
    // tout déplier : le total de boutons atteignables
    // Les replis ne montent leur contenu qu'ouverts : on ouvre par passes (le repli ouvert fait apparaître ses enfants).
    for (let passe = 0; passe < 4; passe++) { await p.evaluate(() => document.querySelectorAll('section[aria-label="Connaissances du houblon"] details').forEach(d => { d.open = true; })); await attendre(500); }
    await capter('sources-tout-deplie');
    const tout = await p.evaluate(() => [...document.querySelectorAll('section[aria-label="Connaissances du houblon"] button')].filter(b => b.getClientRects().length).map(b => (b.textContent || '').trim().replace(/\s+/g, ' ')));
    rapport[cle].sources = { repos, ouvert, toutDeplie: tout.length, tout, contraste, habillage, ajouts };
    await ctx.close();
  }
}
await browser.close();
writeFileSync(join(out, `h1-${etat}-rapport.json`), JSON.stringify(rapport, null, 1));
for (const [k, v] of Object.entries(rapport)) console.log(k, 'repos', v.sources.repos.length, 'ouvert', v.sources.ouvert.length, 'toutDeplié', v.sources.toutDeplie);
console.log(rapport['m390-clair']?.fiche);
