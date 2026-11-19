// Banc z1 (port 3110, fixtures SIMULÉES du mode ?preview=brew, aucune donnée réelle). Usage :
//   node scripts/with_server.mjs --server "npx vite --port 3110 --strictPort" --port 3110 -- node work/missions/2026-11-19-bugs-ecrans/voies/z1/banc/jouer.mjs <scénario>
// Scénarios : fiche | malts | assistant | tout. Écrit captures/<nom>.png et captures/<nom>.txt (texte visible).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.WITH_SERVER_PORTS ?? 3110;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const scenario = process.argv[2] ?? 'tout';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const journal = [];

async function vue(nom, query, largeur, theme, action) {
  const page = await browser.newPage();
  const mobile = largeur < 600;
  await page.setViewport({ width: largeur, height: mobile ? 800 : 900, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.push(`${nom} pageerror ${String(e?.message ?? e).slice(0, 140)}`));
  await page.setRequestInterception(true);
  page.on('request', (r) => (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(r.url()) || /^(data|blob|about):/i.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('theme', t); localStorage.setItem('affinee-theme', t); } catch { /* ignore */ } }, theme);
  await page.goto(`http://localhost:${PORT}/?${query}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => (document.querySelector('#root')?.children.length ?? 0) > 0 && !/Chargement de la brasserie/.test(document.body.innerText), { timeout: 240000 }).catch(() => journal.push(`${nom} : racine non prête`));
  await dormir(2500);
  await page.evaluate((t) => { document.documentElement.dataset.theme = t === 'clair' ? 'light' : 'dark'; document.documentElement.classList.toggle('dark', t !== 'clair'); }, theme);
  if (action) await action(page);
  await dormir(700);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: false });
  fs.writeFileSync(path.join(SORTIE, `${nom}.txt`), await page.evaluate(() => document.body.innerText));
  await page.close();
}
export const cliquer = (t) => async (page) => {
  await page.evaluate((x) => { const b = [...document.querySelectorAll('button, summary, a')].find((e) => (e.textContent || '').trim().includes(x) || (e.getAttribute('aria-label') || '').includes(x)); b?.scrollIntoView({ block: 'center' }); b?.click(); }, t);
};

const ecrans = {
  fiche: (th, l) => vue(`fiche-${th}-${l}`, 'preview=brew&view=recette', l, th),
  malts: (th, l) => vue(`malts-${th}-${l}`, 'preview=brew&view=assistant&malts=maquette', l, th),
  potentiel: (th, l) => vue(`potentiel-${th}-${l}`, 'preview=brew&view=recette', l, th, cliquer('Potentiel aromatique')),
  detail: (th, l) => vue(`detail-${th}-${l}`, 'preview=brew&view=recette', l, th, cliquer('Détail des ajouts et IBU')),
  lactose: (th, l) => vue(`lactose-${th}-${l}`, 'preview=brew&view=assistant&malts=sucre', l, th, async (page) => {
    const champ = await page.$('input[placeholder^="Nom"]');
    if (champ) { await champ.focus(); await dormir(300); await page.keyboard.type('Lactose 1', { delay: 40 }); await dormir(400); await page.keyboard.press('Enter'); }
    await dormir(1200);
    if (l < 600) await page.evaluate(() => { document.querySelector('[data-sel]:last-of-type')?.scrollIntoView({ block: 'center' }); });
  }),
  gestes: async (th, l) => {
    for (const geste of ['Exporter', 'Dupliquer', 'Préparer un brassin', 'Estimer', 'relire']) {
      await vue(`geste-${geste.replace(/\W/g, '')}-${th}-${l}`, 'preview=brew&view=recette', l, th, async (page) => {
        await cliquer(geste)(page);
        await dormir(1200);
        journal.push(`${geste} ${th} ${l} : ${(await page.evaluate(() => [...document.querySelectorAll('[role=dialog],[role=status],[role=alertdialog]')].map((e) => e.innerText.slice(0, 200)).join(' | ')))}`);
      });
    }
  },
  menuplus: (th, l) => vue(`menuplus-${th}-${l}`, 'preview=brew&view=recette', l, th, async (page) => {
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((e) => !(e.textContent || '').trim() && e.getBoundingClientRect().width >= 40 && getComputedStyle(e).position !== 'static' || e.closest('[class*="floating"]')); (b[b.length - 1] ?? null)?.click(); });
    await dormir(900);
  }),
  assistant: (th, l) => vue(`assistant-${th}-${l}`, 'preview=brew&view=assistant', l, th),
};
for (const [nom, f] of Object.entries(ecrans)) {
  if (scenario !== 'tout' && scenario !== nom) continue;
  for (const th of ['clair', 'cave']) for (const l of [1280, 390]) await f(th, l);
}
fs.writeFileSync(path.join(SORTIE, `journal-${scenario}.txt`), journal.join('\n'));
await browser.close();
console.log(journal.length ? journal.join('\n') : 'BANC OK');
