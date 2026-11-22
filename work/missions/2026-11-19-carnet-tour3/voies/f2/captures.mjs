// Captures de la voie f2 (tour 3) : banc ?preview=carnets (fixture « ZZ TEST — … », IA simulée), 390 tactile et 1280, clair et sombre.
// Usage : node captures.mjs <port>. Écrit seulement dans ./captures.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const PORT = process.argv[2] ?? '3117';
const BASE = `http://localhost:${PORT}/?preview=carnets`;
const CAP = path.join(ICI, 'captures');
fs.mkdirSync(CAP, { recursive: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const journal = [];

async function serveurPret() {
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return; } catch { /* pas encore */ }
    await attendre(1000);
  }
  throw new Error('serveur absent');
}
async function page(nav, params, largeur) {
  const p = await nav.newPage();
  const tactile = largeur < 600;
  await p.setViewport({ width: largeur, height: tactile ? 844 : 800, deviceScaleFactor: tactile ? 2 : 1, isMobile: tactile, hasTouch: tactile });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/googleapis|firebase|gstatic|google\.com|firebaseio/.test(new URL(r.url()).hostname) ? r.abort() : r.continue()));
  p.on('pageerror', (e) => journal.push(`pageerror ${params}: ${e.message}`));
  await p.goto(`${BASE}${params}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await attendre(900);
  return p;
}
async function toucher(p, texte, { label = false } = {}) {
  const h = await p.evaluateHandle((t, parLabel) => {
    const els = [...document.querySelectorAll('button, a, [role="button"], [role="menuitem"], summary')];
    return els.find((e) => (parLabel ? (e.getAttribute('aria-label') ?? '') : (e.textContent ?? '')).includes(t) && e.offsetParent !== null) ?? null;
  }, texte, label);
  const el = h.asElement();
  if (!el) { journal.push(`introuvable : ${texte}`); return false; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  try { await el.tap(); } catch { await el.click(); }
  await attendre(700);
  return true;
}
const texte = async (p) => (await p.evaluate(() => document.body.innerText)).replace(/[\u00a0\u202f]/g, ' ');
const verifier = async (p, nom, attendus, absents = []) => {
  const t = await texte(p);
  for (const a of attendus) journal.push(`${t.includes(a) ? 'VU' : 'ABSENT'} [${nom}] « ${a} »`);
  for (const a of absents) journal.push(`${t.includes(a) ? 'PRESENT-A-TORT' : 'BIEN-ABSENT'} [${nom}] « ${a} »`);
};
const haut = (p) => p.evaluate(() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0; });

const ETATS = {
  /* PCN-120, 121, 133 : la liste, « Coller un lien », la ligne « va dans » */
  liste: async (nav, q, l) => { const p = await page(nav, q, l); await verifier(p, 'liste', ['Carnets']); return p; },
  /* PCN-109, 154 : Frigo choisi, son plan dans À venir : la pastille R47 seule, pas de « Dans À venir depuis » sous le choix */
  frigo: async (nav, q, l) => {
    const p = await page(nav, `${q}&lien-retient=a-venir`, l); await haut(p);
    await verifier(p, 'frigo', ['À venir · '], ['Dans À venir depuis']);
    journal.push(`mesure [frigo] ${JSON.stringify(await p.evaluate(() => ({ pastilles: [...document.querySelectorAll('.cn-pastille-lien')].map((e) => e.innerText), statut: document.querySelector('.cn-tete .cn-pastille')?.innerText })))}`);
    return p;
  },
  /* PCN-151 : plan payé, la pastille dit « Réalisé le … » */
  realise: async (nav, q, l) => {
    const p = await page(nav, `${q}&lien-retient=realise`, l); await haut(p);
    journal.push(`mesure [realise] ${JSON.stringify(await p.evaluate(() => ({ statut: document.querySelector('.cn-tete .cn-pastille')?.innerText })))}`);
    return p;
  },
  /* PCN-124 : Stocks › Matériel, Réalisés avec vignette */
  realises: async (nav, q, l) => {
    const p = await page(nav, `${q}&realise=1`, l);
    journal.push(`mesure [realises] vignettes=${await p.evaluate(() => document.querySelectorAll('[data-vignette-realise]').length)}`);
    return p;
  },
  /* PCN-118, 106, 136, 164 : Comparer de la Ventilation */
  comparer: async (nav, q, l) => {
    const p = await page(nav, `${q}&ouvrir=ventilation`, l);
    if (!(await toucher(p, 'Comparer'))) await toucher(p, 'Comparer', { label: true });
    await haut(p);
    await verifier(p, 'comparer', ['Ce qui compte', 'puis le débit', 'sous votre minimum de 1', 'Compromis'], ['Compromis : la 2e']);
    return p;
  }
};

await serveurPret();
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--lang=fr-CH'] });
try {
  for (const [id, jouer] of Object.entries(ETATS)) {
    for (const largeur of [390, 1280]) {
      for (const theme of ['clair', 'sombre']) {
        const q = theme === 'sombre' ? '&theme=sombre' : '&theme=clair';
        let p;
        try { p = await jouer(nav, q, largeur); } catch (e) { journal.push(`reprise ${id}-${largeur}-${theme} : ${e.message.slice(0, 80)}`); p = await jouer(nav, q, largeur); }
        await p.evaluate(() => document.activeElement?.blur?.());
        await p.screenshot({ path: path.join(CAP, `${id}-${largeur}-${theme}.png`) });
        await p.close();
      }
    }
  }
} finally {
  await nav.close();
  fs.writeFileSync(path.join(CAP, 'journal.txt'), journal.join('\n'));
  console.log(journal.join('\n'));
}
