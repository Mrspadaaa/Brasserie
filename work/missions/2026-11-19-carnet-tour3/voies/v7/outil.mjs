// Outils de la voie v4 (rejeu local, port 5187). Repris de voies/f2/captures.mjs. Écrit seulement dans ./captures.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
export const PORT = process.env.PORT_BANC ?? '5197';
export const CAP = path.join(ICI, 'captures');
fs.mkdirSync(CAP, { recursive: true });
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
export const journal = [];
export const log = (s) => { journal.push(s); };

export async function serveurPret() {
  for (let i = 0; i < 180; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return; } catch { /* pas encore */ }
    await attendre(1000);
  }
  throw new Error('serveur absent');
}
export async function lancer() {
  await serveurPret();
  return puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--lang=fr-CH'] });
}
export async function page(nav, params, largeur, { racine = false } = {}) {
  const p = await nav.newPage();
  const tactile = largeur < 600;
  await p.setViewport({ width: largeur, height: tactile ? 844 : 800, deviceScaleFactor: tactile ? 2 : 1, isMobile: tactile, hasTouch: tactile });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/googleapis|firebase|gstatic|google\.com|firebaseio/.test(new URL(r.url()).hostname) ? r.abort() : r.continue()));
  p.on('pageerror', (e) => journal.push(`pageerror ${params}: ${e.message}`));
  const url = racine ? `http://localhost:${PORT}/${params}` : `http://localhost:${PORT}/?preview=carnets${params}`;
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 180000 });
  await attendre(900);
  return p;
}
export async function trouver(p, texte, { label = false, exact = false, sel = 'button, a, [role="button"], [role="menuitem"], [role="tab"], summary, label' } = {}) {
  const h = await p.evaluateHandle((t, parLabel, ex, s) => {
    const els = [...document.querySelectorAll(s)];
    const v = (e) => (parLabel ? (e.getAttribute('aria-label') ?? '') : (e.innerText ?? e.textContent ?? '')).replace(/[\u00a0\u202f]/g, ' ').trim();
    return els.find((e) => (ex ? v(e) === t : v(e).includes(t)) && e.getClientRects().length > 0) ?? null;
  }, texte, label, exact, sel);
  return h.asElement();
}
export async function toucher(p, texte, opts = {}) {
  const el = await trouver(p, texte, opts);
  if (!el) { journal.push(`introuvable : ${texte}`); return false; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  try { await el.tap(); } catch { await el.click(); }
  await attendre(opts.ms ?? 800);
  return true;
}
/** Tape dans le champ du carnet (textarea ou input visible le plus bas), puis Ajouter/Entrée. */
export async function taper(p, txt, { envoyer = true, attente = 2500 } = {}) {
  const champ = await p.evaluateHandle(() => {
    const els = [...document.querySelectorAll('textarea, input[type="text"], input:not([type]), input[type="url"]')].filter((e) => e.getClientRects().length > 0 && !e.disabled);
    return els[els.length - 1] ?? null;
  });
  const el = champ.asElement();
  if (!el) { journal.push(`champ introuvable pour « ${txt} »`); return false; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  try { await el.tap(); } catch { await el.click(); }
  await attendre(300);
  await el.evaluate((e) => { e.focus(); });
  await p.keyboard.type(txt, { delay: 2 });
  await attendre(400);
  if (envoyer) {
    /* le bouton d'envoi du champ lui-même (jamais la puce « Ajouter » d'une proposition) */
    const bouton = (await p.evaluateHandle((c) => {
      let n = c.parentElement;
      for (let i = 0; i < 4 && n; i++, n = n.parentElement) {
        const b = [...n.querySelectorAll('button')].find((x) => /^(Ajouter|Ranger|Envoyer)$/.test((x.innerText || '').trim()) && x.getClientRects().length);
        if (b) return b;
      }
      return null;
    }, el)).asElement();
    if (bouton) { try { await bouton.tap(); } catch { await bouton.click(); } } else await p.keyboard.press('Enter');
    await attendre(attente);
  }
  return true;
}
export const texte = async (p) => (await p.evaluate(() => document.body.innerText)).replace(/[\u00a0\u202f]/g, ' ');
export const verifier = async (p, nom, attendus, absents = []) => {
  const t = await texte(p);
  for (const a of attendus) journal.push(`${t.includes(a) ? 'VU' : 'ABSENT'} [${nom}] « ${a} »`);
  for (const a of absents) journal.push(`${t.includes(a) ? 'PRESENT-A-TORT' : 'BIEN-ABSENT'} [${nom}] « ${a} »`);
  return t;
};
export const haut = (p) => p.evaluate(() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0; });
export async function capture(p, nom, { plein = false } = {}) {
  await p.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
  await p.screenshot({ path: path.join(CAP, `${nom}.png`), fullPage: plein });
  journal.push(`capture ${nom}.png`);
}
export async function captureSansBlur(p, nom, { plein = false } = {}) {
  await p.screenshot({ path: path.join(CAP, `${nom}.png`), fullPage: plein });
  journal.push(`capture ${nom}.png`);
}
export async function boutons(p) {
  return p.evaluate(() => [...document.querySelectorAll('button, [role="button"], a')].filter((e) => e.getClientRects().length > 0)
    .map((e) => `${(e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)}${e.getAttribute('aria-label') ? ` [${e.getAttribute('aria-label')}]` : ''}`).filter(Boolean));
}
export function ecrireJournal(nom) {
  fs.writeFileSync(path.join(CAP, `${nom}.txt`), journal.join('\n'));
  console.log(journal.join('\n'));
}
