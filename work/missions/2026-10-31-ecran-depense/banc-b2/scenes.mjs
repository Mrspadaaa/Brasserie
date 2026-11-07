// Banc B2 (Dépense) pour le critique : ouvre chaque état SIMULÉ de « Nouvelle dépense » (`apercuDev.ts`, `?dev-local&depense=<état>`) sur le build
// figé, servi par interception sur localhost:4319 (aucun serveur ; `?dev-local` n'ouvre que sur localhost), à 390 tactile et 1280, clair et cave.
// Capture au repos de chaque état + mesures (débordement, valeurs brutes, console). Les gestes se jouent ensuite avec `ouvrirEtat` (exporté).
// Usage : node scenes.mjs <dossier construit> <sortie> [état…]      (sans état : tous)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
export const ETATS = ['3', '2', 'date', 'port', 'port-sans-montant', 'tout-port', '5', 'difficile', '6', '8', '9', 'commande', 'familles', 'renovation', 's6',
  'qr-confirme', 'qr-contredit', 'qr-partiel', 'qr-illisible', 'qr-ecart', 'qr-invalide', 'qr-sans', 'qr-lecture', 'qr-pdf', 'qr-non-verifie'];
export const MODES = { t390: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, pc1280: { width: 1280, height: 800, deviceScaleFactor: 1 } };
export const dormir = ms => new Promise(r => setTimeout(r, ms));

/** Une page sur l'état `etat`, feuille ouverte (Actions rapides → Entrer une facture), au mode et au thème donnés. */
export async function ouvrirEtat(nav, construit, etat, mode = 't390', theme = 'clair') {
  const p = await nav.newPage();
  await p.setViewport(MODES[mode]);
  p.journal = [];
  p.on('console', c => { if (c.type() === 'error') p.journal.push(c.text().slice(0, 160)); });
  p.on('pageerror', e => p.journal.push('PAGE ' + e.message.slice(0, 160)));
  await p.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  await p.setRequestInterception(true);
  p.on('request', r => {
    const u = new URL(r.url());
    if (u.host !== 'localhost:4319') return r.abort();
    let f = path.join(construit, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(construit, 'index.html');
    r.respond({ status: 200, contentType: TYPES[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await p.goto(`http://localhost:4319/?dev-local&depense=${encodeURIComponent(etat)}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('[aria-label="Actions rapides"]'), { timeout: 120000 });
  await p.click('[aria-label="Actions rapides"]');
  await p.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Entrer une facture/.test(b.textContent)).click());
  await p.waitForFunction(e => document.body.dataset.apercu === e, { timeout: 45000 }, etat);
  await p.evaluate(() => document.fonts.ready); await dormir(800);
  return p;
}

/** Débordement horizontal, valeurs brutes à l'écran (NaN, undefined…), erreurs de console. */
export const mesurer = p => p.evaluate(() => {
  const w = innerWidth, t = document.body.innerText;
  return { debordement: document.scrollingElement.scrollWidth > w + 1, bruts: [...new Set(t.match(/\b(NaN|undefined|Infinity|null)\b/g) ?? [])] };
});

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [construit, sortie, ...choisis] = process.argv.slice(2);
  fs.mkdirSync(sortie, { recursive: true });
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const mesures = {};
  for (const etat of choisis.length ? choisis : ETATS) for (const mode of Object.keys(MODES)) for (const theme of ['clair', 'cave']) {
    const nom = `${etat}-${mode}-${theme}`;
    try {
      const p = await ouvrirEtat(nav, construit, etat, mode, theme);
      await p.screenshot({ path: path.join(sortie, `${nom}.png`) });
      mesures[nom] = { ...(await mesurer(p)), console: p.journal };
      await p.close();
    } catch (e) { mesures[nom] = { erreur: String(e.message).slice(0, 200) }; }
    console.log(nom, JSON.stringify(mesures[nom]).slice(0, 160));
  }
  fs.writeFileSync(path.join(sortie, 'mesures.json'), JSON.stringify(mesures, null, 1));
  await nav.close();
}
