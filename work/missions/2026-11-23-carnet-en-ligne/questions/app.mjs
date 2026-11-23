// Ouvre la vraie app (build de port-carnet, fixture du banc carnet, ?dev-local) à 390 px pour dessiner les variantes par-dessus.
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..');
const PORT_CARNET = path.resolve(RACINE, '..', 'port-carnet');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
// Copie figée du build de test (HEAD de port-carnet = tour 12) : les lots reconstruisent os.tmpdir()/affinee-e2e en parallèle.
const BUILD = process.env.Q_BUILD || path.join(os.tmpdir(), 'affinee-e2e', 'HEAD');
const FIXTURE = path.join(os.tmpdir(), 'affinee-e2e', 'fixture-carnet-2026-11-23.json');
const PORT = 4331;
const URL0 = `http://127.0.0.1:${PORT}/?dev-local&finance-demo=parcours-carnet`;
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ouvrir() {
  let deja = false; try { deja = (await fetch(`http://127.0.0.1:${PORT}/`)).ok; } catch {}
  const srv = deja ? null : spawn(`npx vite preview --config scripts/parcours/vite.parcours.config.mjs --outDir "${BUILD}" --host 127.0.0.1 --port ${PORT} --strictPort`, { cwd: PORT_CARNET, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break; } catch {} await attendre(500); }
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const fx = fs.readFileSync(FIXTURE, 'utf8');
  const entrees = JSON.stringify(JSON.parse(fx).entrees);
  const fermer = async () => { await nav.close(); if (srv && !process.env.GARDER) try { spawn('taskkill', ['/pid', String(srv.pid), '/T', '/F'], { shell: true }); } catch {} };
  return { nav, entrees, fermer };
}

export async function page(nav, entrees, { h = 844 } = {}) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument((j) => {
    if (!localStorage.getItem('parcours-carnet:fixture')) localStorage.setItem('parcours-carnet:fixture', j);
    localStorage.setItem('laffinee.theme', 'clair');
  }, entrees);
  p.on('pageerror', (e) => console.error('PAGEERROR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text().slice(0, 200)); });
  await p.goto(URL0, { waitUntil: 'networkidle2' });
  try { await p.waitForSelector('nav button', { timeout: 60000 }); } catch (e) { await p.screenshot({ path: path.join(os.tmpdir(), 'q-echec.png') }); throw e; }
  return p;
}

export async function toucher(p, selecteur, texte) {
  const ok = await p.evaluate((s, t) => {
    const re = t ? new RegExp(t) : null;
    const els = [...document.querySelectorAll(s)].filter((e) => !re || re.test((e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ')));
    const el = els.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[0];
    if (!el) return null; el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(); return { x: r.x + Math.min(r.width / 2, 40), y: r.y + r.height / 2 };
  }, selecteur, texte);
  if (!ok) throw new Error(`introuvable : ${selecteur} ${texte}`);
  await attendre(250);
  await p.touchscreen.tap(ok.x, ok.y);
  await attendre(500);
}

export async function carnets(p) {
  await toucher(p, 'nav button', 'Brassins');
  await toucher(p, 'button', '^Atelier');
  await p.waitForSelector('[data-carnets][data-vue="liste"]', { timeout: 30000 });
  await attendre(500);
}
export async function unCarnet(p, titre) {
  await toucher(p, '[data-carnets] *', titre);
  await p.waitForSelector('[data-carnets][data-vue="carnet"]', { timeout: 15000 });
  await attendre(600);
}

/** Écrit dans un champ React (setter natif + événement input). */
export async function saisir(p, sel, val) {
  await p.evaluate((s, v) => {
    const el = document.querySelector(s);
    const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
    set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, val);
  await attendre(600);
}
