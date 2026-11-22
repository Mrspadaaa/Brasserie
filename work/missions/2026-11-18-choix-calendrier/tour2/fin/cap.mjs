// Lot fin, tour 2 (19.11). Banc : vite --port 5603, Firebase factice, ?dev-local&finance-demo=reel. Usage : node cap.mjs
// Écrit ici <cas>-<etat>.png et mesures.json. Gestes tactiles (touchscreen) à 390 et 844, souris à 1280.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const req = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json');
const puppeteer = req('puppeteer-core');
const BASE = 'http://localhost:5603/';
const URL0 = BASE + '?dev-local&finance-demo=reel';
const dormir = ms => new Promise(r => setTimeout(r, ms));
const mesures = [];
for (let i = 0; i < 120; i++) { try { const r = await fetch(BASE); if (r.ok) break; } catch { /* attendre */ } await dormir(1000); }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars', '--lang=en-US'] });
const cas = [
  { nom: 'p390-clair', w: 390, h: 660, theme: 'clair', tactile: true },
  { nom: 'p390-cave', w: 390, h: 660, theme: 'cave', tactile: true },
  { nom: 'l844-clair', w: 844, h: 340, theme: 'clair', tactile: true },
  { nom: 'd1280-cave', w: 1280, h: 800, theme: 'cave', tactile: false },
];
for (const c of cas) {
  const ctx = await nav.createBrowserContext();
  const page = await ctx.newPage();
  const log = (k, o) => { const m = { cas: c.nom, k, ...o }; mesures.push(m); console.log(JSON.stringify(m)); };
  try {
    await page.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, c.theme);
    await page.emulate({ viewport: { width: c.w, height: c.h, deviceScaleFactor: 2, isMobile: c.tactile, hasTouch: c.tactile, isLandscape: c.w > c.h }, userAgent: (await nav.userAgent()) + (c.tactile ? ' Mobile' : '') });
    const cap = (etat, clip) => page.screenshot({ path: join(ICI, `${c.nom}-${etat}.png`), ...(clip ? { clip } : {}) });
    const toucherEl = async h => { if (!h) return false; await h.evaluate(e => e.scrollIntoView({ block: 'center' })); await dormir(200); if (c.tactile) await h.tap(); else await h.click(); return true; };
    const parTexte = (sel, re) => page.evaluateHandle((s, r) => [...document.querySelectorAll(s)].find(e => new RegExp(r).test((e.getAttribute('aria-label') || e.textContent || '').trim())) ?? null, sel, re);
    const toucher = async (sel, re) => { const h = await parTexte(sel, re); const el = h.asElement(); return el ? toucherEl(el) : false; };
    const lire = () => page.evaluate(() => ({
      entete: document.querySelector('[aria-label^="Période :"]')?.getAttribute('aria-label') ?? null,
      enteteTexte: document.querySelector('[aria-label^="Période :"]')?.textContent?.trim() ?? null,
      choixPeriode: [...document.querySelectorAll('main [aria-label*="ériode" i], main .ops-pill, main input[type="month"], main [aria-label*="précédent" i], main [aria-label*="suivant" i]')].filter(e => e.getBoundingClientRect().height > 0).map(e => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 40)),
      onglet: document.querySelector('[role="tab"][aria-selected="true"][id^="finance-tab"]')?.textContent ?? null,
      debut: document.querySelector('.ops-h[aria-label="Début"]')?.getAttribute('aria-valuetext') ?? null,
      fin: document.querySelector('.ops-h[aria-label="Fin"]')?.getAttribute('aria-valuetext') ?? null,
      rd: document.querySelector('.ops-fr-rd')?.textContent ?? null,
      actifs: [...document.querySelectorAll('.ops-actif')].map(e => e.textContent?.trim()),
      plage: document.querySelector('.syn-plage')?.textContent ?? null,
    }));

    await page.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => [...document.querySelectorAll('button,a')].some(b => (b.textContent ?? '').includes('Finances')), { timeout: 120000 });
    await dormir(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find(x => (x.textContent ?? '').trim().endsWith('Finances')); b?.click(); });
    await dormir(1200);
    await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find(t => t.textContent?.trim() === 'Synthèse')?.click()); await dormir(800);

    // 1. Synthèse août → nov.
    for (let essai = 0; essai < 3 && !(await page.$('input[aria-label="Du mois"]')); essai++) { await toucher('button', '^Autre période$'); await dormir(1200); }
    const poser = (l, v) => page.evaluate((l, v) => { const i = document.querySelector(`input[aria-label="${l}"]`); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); return true; }, l, v);
    await poser('Au mois', '2026-11'); await dormir(300); await poser('Du mois', '2026-08'); await dormir(900);
    log('syn-plage', await lire());
    const zp = await page.$('.syn-plage');
    if (zp && c.nom === 'p390-clair') { const b = await zp.boundingBox(); await cap('1-syn-plage', { x: 0, y: Math.max(0, b.y - 90), width: c.w, height: b.height + 110 }); }

    // 2. Barre « Autres frais » de la Synthèse → Opérations
    const barre = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.getAttribute('aria-label') ?? '').find(a => /voir ces opérations/.test(a) && /^Autres/.test(a)) ?? [...document.querySelectorAll('button')].map(b => b.getAttribute('aria-label') ?? '').find(a => /voir ces opérations/.test(a) && !/^Matériel/.test(a)) ?? null);
    if (barre) await toucher('button', '^' + barre.replace(/[.*+?^${}()|[\]\\]/g, ch => '\\' + ch) + '$');
    await dormir(1200); await page.evaluate(() => window.scrollTo(0, 0)); await dormir(300);
    log('ops-depuis-syn', { barre, ...(await lire()) });
    await cap('2-ops-depuis-syn');

    // 3. Retirer le filtre, revenir au mois entier, puis tenir la poignée gauche au bord 1,6 s
    await toucher('.ops-actif', '.'); await dormir(500);
    await toucher('.ops-fr-x', '.'); await dormir(800);
    const fr = await page.$('[data-testid="frise"]');
    await fr.evaluate(e => e.scrollIntoView({ block: 'center' })); await dormir(400);
    const avant = await lire();
    const hb = await (await page.$('.ops-h[aria-label="Début"]')).boundingBox();
    const tb = await (await page.$('.ops-tr')).boundingBox();
    const x0 = hb.x + hb.width / 2, y0 = hb.y + hb.height / 2, xBord = tb.x + 2;
    const t0 = Date.now(), serie = [];
    if (c.tactile) {
      await page.touchscreen.touchStart(x0 + 30, y0); await dormir(60);
      // départ un peu dedans (1er nov. + 2 jours) pour que le premier glissé soit vrai, puis le bord
      for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(x0 + 30 + (xBord - x0 - 30) * i / 8, y0); await dormir(25); }
    } else {
      await page.mouse.move(x0, y0); await page.mouse.down(); await dormir(60);
      for (let i = 1; i <= 8; i++) { await page.mouse.move(x0 + (xBord - x0) * i / 8, y0); await dormir(25); }
    }
    const tBord = Date.now();
    for (let i = 0; i < 8; i++) { await dormir(200); serie.push(`${Date.now() - tBord}ms ${await page.evaluate(() => document.querySelector('.ops-h[aria-label="Début"]')?.getAttribute('aria-valuetext'))}`); }
    const bulle = await page.evaluate(() => {
      const b = document.querySelector('.ops-bulle')?.getBoundingClientRect();
      const textes = [...document.querySelectorAll('.ops-fr-rd *, .ops-ax span, .ops-fr-x, .ops-pile, .ops-fr-note')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && (e.textContent ?? '').trim(); });
      const couvre = b ? textes.filter(e => { const r = e.getBoundingClientRect(); return !(r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom); }).map(e => e.textContent.trim().slice(0, 20)) : null;
      return { bulle: b && { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), txt: document.querySelector('.ops-bulle').textContent }, couvre };
    });
    const fb = await fr.boundingBox();
    await cap('3-frise-tenue', { x: 0, y: Math.max(0, fb.y - 40), width: c.w, height: fb.height + 60 });
    if (c.tactile) await page.touchscreen.touchEnd(); else await page.mouse.up();
    await dormir(600);
    const apres = await lire();
    log('frise-bord', { avant: { debut: avant.debut, fin: avant.fin, rd: avant.rd }, serie, ms: Date.now() - t0, bulle, apres: { debut: apres.debut, fin: apres.fin, rd: apres.rd, entete: apres.entete } });
    await cap('4-frise-apres', { x: 0, y: Math.max(0, fb.y - 40), width: c.w, height: fb.height + 60 });
    // 4. Opérations au repos (mois) : un seul choix de période
    await toucher('.ops-fr-x', '.'); await dormir(700); await page.evaluate(() => window.scrollTo(0, 0)); await dormir(300);
    log('ops-repos', await lire());
  } catch (e) { log('erreur', { message: String(e?.message ?? e).slice(0, 300) }); }
  await ctx.close();
}
await nav.close();
writeFileSync(join(ICI, 'mesures.json'), JSON.stringify(mesures, null, 1));
