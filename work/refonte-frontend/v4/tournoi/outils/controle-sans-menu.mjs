// D350 (02.11, soir) : « éviter les dropdown sur mobile, ça nécessite 2 actions » (sa capture de pa1b, l'unité « g ⌄ » entourée).
// À 390 tactile, chaque état d'une maquette : aucun <select>, aucun rôle de menu, et aucun bouton replié qui n'ouvre qu'une liste de choix
// (au moins deux boutons de choix, sans champ de saisie : un plateau qui s'ouvre a des champs, un menu n'en a pas).
// Usage : node controle-sans-menu.mjs <etat.html> [--etats repos,a,b,c,d,e,f] [--theme cave]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : defaut; };
const fichier = path.resolve(args[0] ?? '');
const etats = option('--etats', 'repos,a,b,c,d,e,f').split(',');
const theme = option('--theme', null);

const CHOIX = '[aria-pressed],[role=option],[role=radio],[role=menuitemradio],input[type=radio],[data-choix]';
const SAISIE = 'input:not([type=radio]):not([type=checkbox]),textarea,[contenteditable=true]';

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const menus = [];
try {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  for (const etat of etats) {
    const url = `${pathToFileURL(fichier).href}?etat=${etat}${theme ? `&theme=${theme}` : ''}`;
    await p.goto(url, { waitUntil: 'load' });
    const visibles = () => p.evaluate((CHOIX, SAISIE) => {
      const vu = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const tous = [...document.querySelectorAll('*')];
      tous.forEach((e, i) => { e.dataset.smI = String(i); });
      return {
        natifs: [...document.querySelectorAll('select,[aria-haspopup],[role=combobox],[role=listbox],[role=menu]')].filter(vu)
          .map((e) => (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40)),
        replies: [...document.querySelectorAll('[aria-expanded=false]')].filter(vu).map((e) => e.dataset.smI),
        choix: [...document.querySelectorAll(CHOIX)].filter(vu).map((e) => e.dataset.smI),
        saisie: [...document.querySelectorAll(SAISIE)].filter(vu).map((e) => e.dataset.smI),
      };
    }, CHOIX, SAISIE);
    const avant = await visibles();
    for (const n of avant.natifs) menus.push(`${etat} · menu natif « ${n} »`);
    // D350 : un bouton qui porte un chevron se lit comme un menu ; D351 : « ✓ au centime » sur un état sûr ; D352 : unités alignées.
    const vus = await p.evaluate((etat) => {
      const vu = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const out = [];
      for (const b of document.querySelectorAll('button,[role=button]')) {
        if (!vu(b)) continue;
        const chev = /[⌄▾▼]/.test(b.textContent) || [...b.querySelectorAll('path,polyline')].some((x) => /^m?\s*6[ ,]9[ ,]+6[ ,]6[ ,]+6[ ,]?-6/i.test((x.getAttribute('d') || x.getAttribute('points') || '').trim()));
        if (chev) out.push(`${etat} · bouton à chevron « ${(b.getAttribute('aria-label') || b.textContent).replace(/\s+/g, ' ').trim().slice(0, 30)} »`);
      }
      if (!['d'].includes(etat)) {
        for (const e of document.querySelectorAll('body *')) {
          if (e.children.length > 2 || !vu(e)) continue;
          const t = e.textContent.replace(/\s+/g, ' ').trim();
          if (/au centime/i.test(t) && /✓|✔/.test(t + (e.querySelector('svg') ? '✓' : '')) && t.length < 30) { out.push(`${etat} · « ${t} » sur une ligne sûre`); break; }
        }
      }
      // Quantités avec unité, feuilles de texte de la liste (hors champs) : bord droit de l'unité, par bloc de famille.
      const re = /^\d[\d\s,.]*\s?(Kg|kg|g|sachets?|pièces?|L|Stk)$/;
      const feuilles = [...document.querySelectorAll('body *')].filter((e) => vu(e) && !e.closest('input,button[role=radio],[role=radiogroup]') && re.test(e.textContent.replace(/\s+/g, ' ').trim()) && ![...e.children].some((c) => re.test(c.textContent.replace(/\s+/g, ' ').trim())));
      const bords = feuilles.map((e) => Math.round(e.getBoundingClientRect().right));
      if (etat === "repos" && bords.length >= 2) { const ecart = Math.max(...bords) - Math.min(...bords); if (ecart > 3) out.push(`${etat} · unités pas alignées : bords droits ${[...new Set(bords)].sort((a, b) => a - b).join(', ')} px (écart ${ecart})`); }
      return out;
    }, etat);
    menus.push(...vus);
    for (const id of avant.replies) {
      await p.goto(url, { waitUntil: 'load' });
      const base = await visibles();
      const libelle = await p.evaluate((id) => {
        const e = document.querySelector(`[data-sm-i="${id}"]`); if (!e) return null;
        const t = (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        e.click(); return t;
      }, id);
      if (libelle === null || libelle.length > 24) continue; // une rangée qui ouvre son plateau n'est pas un menu
      await new Promise((r) => setTimeout(r, 150));
      const apres = await p.evaluate((CHOIX, SAISIE) => {
        const vu = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
        const id = (e) => e.dataset.smI ?? 'neuf';
        return {
          choix: [...document.querySelectorAll(CHOIX)].filter(vu).map(id),
          saisie: [...document.querySelectorAll(SAISIE)].filter(vu).map(id),
        };
      }, CHOIX, SAISIE);
      const neufsChoix = apres.choix.filter((x) => x === 'neuf' || !base.choix.includes(x)).length;
      const neufsSaisie = apres.saisie.filter((x) => x === 'neuf' || !base.saisie.includes(x)).length;
      if (neufsChoix >= 2 && neufsSaisie === 0) menus.push(`${etat} · « ${libelle} » ouvre ${neufsChoix} choix : deux touchers`);
    }
  }
} finally {
  await nav.close();
}
const uniques = [...new Set(menus)];
if (uniques.length) {
  console.log(`MENU ECHEC (${uniques.length}) — ${path.basename(path.dirname(fichier))}`);
  for (const m of uniques) console.log(`  - ${m}`);
  process.exit(1);
}
console.log(`MENU OK — ${path.basename(path.dirname(fichier))} : aucun menu déroulant à 390 (${etats.length} états)`);
