// Outils de la voie v3 (vision locale, port 5193, ?dev-local, IA simulée ou réponses enregistrées, réseau externe coupé). Écrit seulement dans ./captures.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const ICI = path.dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json')('puppeteer-core');
export const BASE = `http://localhost:${process.env.PORT_BANC ?? 5193}/`;
export const CAP = path.join(ICI, 'captures'); fs.mkdirSync(CAP, { recursive: true });
export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
export const journal = []; export const log = (s) => { journal.push(s); console.log(s.slice(0, 900)); };
export async function lancer() {
  for (let i = 0; i < 180; i++) { try { if ((await fetch(BASE)).ok) break; } catch {} await dormir(1000); }
  return puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--lang=fr-CH'] });
}
export async function ouvrir(nav, params, L, theme) {
  const p = await nav.newPage(); const t = L < 600;
  await p.setViewport({ width: L, height: t ? 844 : 800, deviceScaleFactor: t ? 2 : 1, isMobile: t, hasTouch: t });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/^(http:\/\/localhost|ws:|data:|blob:)/.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.erreurs = []; p.on('pageerror', (e) => p.erreurs.push(e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED|Failed to load resource|favicon/.test(m.text())) p.erreurs.push(m.text().slice(0, 200)); });
  p.L = L; p.theme = theme; p.setDefaultTimeout(60000);
  await p.goto(BASE + params, { waitUntil: 'networkidle0', timeout: 180000 }); for (let k = 0; k < 3; k++) { const ok = await p.waitForFunction(() => document.body.innerText.length > 80, { timeout: 30000 }).then(() => true, () => false); if (ok) break; p.erreurs.length = 0; await p.reload({ waitUntil: 'networkidle0', timeout: 180000 }); } await dormir(900);
  await poserTheme(p); return p;
}
export const poserTheme = (p) => p.evaluate((t) => { document.documentElement.setAttribute('data-theme', t); document.documentElement.classList.toggle('dark', t === 'cave'); }, p.theme);
export async function el(p, texte, { label = false, exact = false, sel = 'button, a, [role=button], [role=menuitem], [role=tab], [role=switch], summary, label, [role=radio], [role=option]', dernier = false } = {}) {
  const h = await p.evaluateHandle((t, parLabel, ex, s, der) => {
    const v = (e) => (parLabel ? (e.getAttribute('aria-label') ?? '') : (e.innerText ?? e.textContent ?? '')).replace(/[\u00a0\u202f]/g, ' ').trim();
    const els = [...document.querySelectorAll(s)].filter((e) => (ex ? v(e) === t : v(e).includes(t)) && e.getClientRects().length > 0);
    return (der ? els.at(-1) : els[0]) ?? null;
  }, texte, label, exact, sel, dernier);
  return h.asElement();
}
export async function toucher(p, texte, o = {}) {
  const e = await el(p, texte, o); if (!e) { log(`  introuvable : ${texte}`); return false; }
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  if (p.L < 600) { try { await e.tap(); } catch { await e.click(); } } else await e.click();
  await dormir(o.ms ?? 700); return true;
}
export async function saisir(p, selecteur, valeur, { tab = true } = {}) {
  const e = await p.$(selecteur); if (!e) { log(`  champ introuvable : ${selecteur}`); return false; }
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await e.click({ clickCount: 3 }); await p.keyboard.press('Backspace'); if (valeur !== '') await p.keyboard.type(String(valeur), { delay: 5 });
  if (tab) await p.keyboard.press('Tab'); await dormir(400); return true;
}
export async function capture(p, nom, { plein = false } = {}) {
  await poserTheme(p); await dormir(250);
  const f = path.join(CAP, `${nom}-${p.L}-${p.theme}.png`); await p.screenshot({ path: f, fullPage: plein }); return path.basename(f);
}
export const texte = (p, sel = 'body') => p.evaluate((s) => (document.querySelector(s)?.innerText ?? '').replace(/[\u00a0\u202f]/g, ' '), sel);
export const champs = (p) => p.evaluate(() => [...document.querySelectorAll('input, select, textarea')].filter((e) => e.getClientRects().length).map((e) => `${e.getAttribute('aria-label') ?? e.name ?? e.placeholder}=${e.value}`));
export const boutons = (p) => p.evaluate(() => [...document.querySelectorAll('button, [role=button], summary')].filter((e) => e.getClientRects().length).map((e) => (e.getAttribute('aria-label') || e.innerText || '').trim().slice(0, 50)).filter(Boolean));
/** Ouvre la feuille Dépense d'un banc `?dev-local&depense=<etat>` (Actions rapides › Entrer une facture). */
export async function feuilleDepense(nav, etat, L, theme, { attendreFinal = true } = {}) {
  const p = await ouvrir(nav, `?dev-local&depense=${etat}`, L, theme);
  await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800);
  await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 });
  if (attendreFinal) await p.waitForFunction((e) => document.body.dataset.apercu === e, { timeout: 60000 }, etat).catch(() => log(`  apercu ${etat} non signalé`));
  await dormir(700); return p;
}
export function ecrireJournal(nom) { fs.writeFileSync(path.join(ICI, `${nom}.log`), journal.join('\n')); }
