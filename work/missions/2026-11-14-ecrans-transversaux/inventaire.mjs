// Inventaire au banc local des écrans transversaux : en-tête (recherche, ⋮, période, thème), menu du +, barre du bas.
// 390 tactile et 1280, clair et cave. Serveur vite sur 3020, ?dev-local. Sortie : captures/ et inventaire.json.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json');
const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE || 'http://localhost:3020/?dev-local';
const OUT = new URL('./captures/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const dormir = ms => new Promise(r => setTimeout(r, ms));
const MODES = [{ id: '390', w: 390, h: 844, t: true }, { id: '1280', w: 1280, h: 800, t: false }];
const THEMES = ['clair', 'cave'];
const res = [];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });

async function charger(p, theme) {
  for (let i = 0; i < 3; i++) {
    try {
      await p.goto(BASE, { waitUntil: 'domcontentloaded' });
      await p.evaluate(t => localStorage.setItem('laffinee.theme', t), theme);
      await p.goto(BASE, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 90000 });
      break;
    } catch (e) { console.error('charge', e.message); }
  }
  await dormir(2500);
}
const visibles = p => p.evaluate(() => [...document.querySelectorAll('button,a,[role=menuitem],[role=option],select,input')]
  .filter(e => e.offsetParent !== null).map(e => (e.getAttribute('aria-label') || e.innerText || e.placeholder || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 70)));
async function cliquer(p, re, zone) {
  return p.evaluate((src, flags, zone) => {
    const r = new RegExp(src, flags); const z = (zone && document.querySelector(zone)) || document;
    const el = [...z.querySelectorAll('button,a,[role=menuitem],[role=tab],[role=option]')].find(b => b.offsetParent !== null && r.test((b.getAttribute('aria-label') || b.innerText || '').replace(/\s+/g, ' ').trim()));
    if (el) { el.click(); return true; } return false;
  }, re.source, re.flags, zone);
}
const mesures = p => p.evaluate(() => {
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const header = document.querySelector('header');
  const navb = document.querySelector('nav[aria-label="Navigation principale"]');
  const boutonsHeader = header ? [...header.querySelectorAll('button,a')].filter(e => e.offsetParent !== null).map(e => ({ l: (e.getAttribute('aria-label') || e.innerText).trim().slice(0, 40), ...box(e) })) : [];
  const boutonsNav = navb ? [...navb.querySelectorAll('button,a')].map(e => ({ l: (e.getAttribute('aria-label') || e.innerText).trim().slice(0, 30), cur: e.getAttribute('aria-current'), ...box(e) })) : [];
  const fab = [...document.querySelectorAll('button')].find(b => /^Actions rapides/.test(b.getAttribute('aria-label') || '') && b.offsetParent !== null);
  return { vw: innerWidth, vh: innerHeight, header: box(header), nav: box(navb), fab: box(fab), boutonsHeader, boutonsNav, html: document.documentElement.dataset.theme };
});
const cap = (p, nom) => p.screenshot({ path: `${OUT}${nom}.png` });

for (const m of MODES) for (const th of THEMES) {
  const k = `${m.id}-${th}`;
  const p = await nav.newPage();
  await p.setViewport({ width: m.w, height: m.h, isMobile: m.t, hasTouch: m.t, deviceScaleFactor: 1 });
  const o = { mode: m.id, theme: th, etats: {} };
  await charger(p, th);
  o.repos = await mesures(p); await cap(p, `${k}-repos`);

  // Barre du bas : chaque onglet (l'écran sert de fond ; on juge la barre et l'en-tête)
  for (const tab of ['Bord', 'Finances', 'Brassins', 'Stocks', 'Clients']) {
    const ok = await cliquer(p, new RegExp('^' + tab + '$'), 'nav[aria-label="Navigation principale"]'); await dormir(1200);
    o.etats['nav-' + tab] = { ok, ...(await mesures(p)) }; await cap(p, `${k}-nav-${tab}`);
  }
  await cliquer(p, /^Bord$/, 'nav[aria-label="Navigation principale"]'); await dormir(1000);

  // Recherche : vide, résultats, aucun résultat
  o.etats['recherche-ouvre'] = await cliquer(p, /^Rechercher/); await dormir(800);
  await cap(p, `${k}-recherche-vide`); o.etats['recherche-vide'] = await visibles(p);
  await p.keyboard.type('ipa'); await dormir(900); await cap(p, `${k}-recherche-ipa`); o.etats['recherche-ipa'] = await visibles(p);
  await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.type('zzqx'); await dormir(800);
  await cap(p, `${k}-recherche-rien`); o.etats['recherche-rien'] = await p.evaluate(() => document.body.innerText.match(/Aucun[^\n]{0,80}/)?.[0] || null);
  await p.keyboard.press('Escape'); await dormir(500);
  // ⌘K / Ctrl+K au clavier (1280)
  if (!m.t) { await p.keyboard.down('Control'); await p.keyboard.press('k'); await p.keyboard.up('Control'); await dormir(600); o.etats['ctrlK'] = await p.evaluate(() => !!document.querySelector('[aria-label="Recherche universelle"]')); await p.keyboard.press('Escape'); await dormir(400); }

  // Menu ⋮ : contenu, puis chaque entrée ouverte une à une
  const avant = new Set(await visibles(p));
  await cliquer(p, /^Menu$/); await dormir(700); await cap(p, `${k}-menu`);
  const entrees = (await visibles(p)).filter(t => !avant.has(t));
  o.etats['menu'] = entrees;
  for (const e of entrees) {
    if (/Déconnexion|Se déconnecter|Saisir au nom|Période/i.test(e)) continue;
    await charger(p, th);
    await cliquer(p, /^Menu$/); await dormir(600);
    const esc = e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ok = await cliquer(p, new RegExp('^' + esc)); await dormir(1500);
    const nom = e.replace(/[^A-Za-zÀ-ÿ0-9]+/g, '-').slice(0, 30);
    await cap(p, `${k}-menu-${nom}`);
    o.etats['menu-' + e] = { ok, texte: await p.evaluate(() => document.body.innerText.slice(0, 600)) };
  }

  // Période (si visible dans l'en-tête)
  await charger(p, th);
  if (await cliquer(p, /^(Tout l'historique|Ce mois|Mois dernier|Exercice)/, 'header')) { await dormir(600); await cap(p, `${k}-periode`); o.etats['periode'] = true; await p.keyboard.press('Escape'); }

  // Thème
  await charger(p, th);
  o.etats['theme-bascule'] = await p.evaluate(() => { const b = document.querySelector('[data-theme-toggle]'); if (!b) return null; const a = document.documentElement.dataset.theme; b.click(); return { avant: a, apres: document.documentElement.dataset.theme, label: b.getAttribute('aria-label') }; });
  await dormir(500); await cap(p, `${k}-theme-bascule`);

  // Menu du + sur le Bord, puis chaque entrée
  await charger(p, th);
  const ouv = await cliquer(p, /^Actions rapides/); await dormir(700); await cap(p, `${k}-plus`);
  o.etats['plus'] = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].filter(e => e.offsetParent !== null).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 70)));
  for (const e of o.etats['plus'] || []) {
    await charger(p, th); await cliquer(p, /^Actions rapides/); await dormir(600);
    const debut = e.split(' ').slice(0, 2).join(' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ok = await cliquer(p, new RegExp('^' + debut)); await dormir(1800);
    const nom = debut.replace(/[^A-Za-zÀ-ÿ0-9]+/g, '-');
    await cap(p, `${k}-plus-${nom}`);
    o.etats['plus-' + e] = { ok, texte: await p.evaluate(() => document.body.innerText.slice(0, 400)) };
  }
  if (!ouv) o.etats['plus'] = 'introuvable';
  res.push(o); console.error(k, 'menu', o.etats['menu'], 'plus', o.etats['plus']);
  await p.close();
}
fs.writeFileSync(new URL('./inventaire.json', import.meta.url), JSON.stringify(res, null, 1));
await nav.close();
