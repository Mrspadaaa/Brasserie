// Captures du tour 2 de la voie ct4a (critique k4, 20.11) : banc local port 3110, fixtures SIMULÉES, copie des bancs de voies/ct4a/banc (non modifiés).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 --timeout 120 -- node <ce fichier> [jourj|mesures|saisie|conduite]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.WITH_SERVER_PORTS ?? 3110;
const BANC = `http://localhost:${PORT}/work/missions/2026-11-19-bugs-ecrans/voies/ct4a/banc`;
const APP = `http://localhost:${PORT}/?preview=brew&view=brassage&levure=seche-sans-quantite&stage=boil-0`;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const filtre = process.argv[2] ?? '';
const FORMATS = [[390, 800], [844, 340], [1280, 900]].filter((f) => !process.argv[3] || String(f[0]) === process.argv[3]);
// Paysage bas : la feuille est plus haute que l'écran, on défile jusqu'à la courbe comme le brasseur.
const versCourbe = async (page) => { await page.evaluate(() => { document.querySelector('[data-graphe]')?.scrollIntoView({ block: 'start' }); }); await dormir(400); };

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const journal = [];
async function vue(nom, url, [largeur, hauteur], theme, action) {
  const page = await browser.newPage();
  const mobile = largeur < 900;
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.push(`${nom} pageerror ${String(e?.message ?? e).slice(0, 160)}`));
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* ignoré */ } }, theme);
  await page.setRequestInterception(true);
  page.on('request', (r) => (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(r.url()) || /^(data|blob|about):/i.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => (document.body.innerText || '').trim().length > 60, { timeout: 240000 }).catch(() => journal.push(`${nom} : racine vide`));
  await dormir(3000);
  // Vite recharge la page quand il optimise une dépendance au premier chargement : on rejoue le geste après la navigation.
  for (let essai = 0; essai < 4; essai += 1) {
    try { await action(page, nom); break; } catch (e) {
      if (essai === 3) throw e;
      journal.push(`${nom} : page rechargée, nouvel essai`);
      await page.waitForFunction(() => (document.body.innerText || '').trim().length > 60, { timeout: 120000 }).catch(() => {});
      await dormir(3000);
    }
  }
  await page.close();
}
async function prise(page, nom) {
  await dormir(600);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: false });
  journal.push(`${nom} : ok`);
}
// Fait défiler jusqu'à la plus petite feuille de texte qui contient `texte` (centrée) et rend son texte.
const aller = async (page, texte) => page.evaluate((t) => {
  const tous = [...document.querySelectorAll('body *')].filter((e) => (e.textContent || '').includes(t) && ![...e.children].some((c) => (c.textContent || '').includes(t)));
  const cible = tous[0];
  if (!cible) return null;
  cible.scrollIntoView({ block: 'center' });
  return (cible.closest('li, section, div')?.innerText || cible.innerText || '').slice(0, 200).replace(/\s+/g, ' ');
}, texte);
const cliquer = (re) => async (page) => {
  await page.evaluate((src) => { const r = new RegExp(src); const b = [...document.querySelectorAll('button')].find((e) => r.test(e.getAttribute('aria-label') || e.textContent || '')); b?.scrollIntoView({ block: 'center' }); b?.click(); }, re);
  await dormir(800);
};

const feuille = async (page) => page.evaluate(() => { const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)); s.forEach((e) => { e.scrollTop = e.scrollHeight; }); });

for (const theme of ['clair', 'cave']) {
  for (const f of FORMATS) {
    const l = f[0];
    if (!filtre || filtre === 'jourj') {
      await vue(`jourj-ensemencement-${l}-${theme}`, APP, f, theme, async (page, nom) => {
        journal.push(`${nom} tuile : ${await page.evaluate(() => { const ok = (e) => /cible 18/.test(e.textContent || '') && (e.textContent || '').includes('à écrire'); const c = [...document.querySelectorAll('body *')].filter((e) => ok(e) && ![...e.children].some(ok))[0]; c?.scrollIntoView({ block: 'center' }); return c ? c.innerText.replace(/\s+/g, ' ') : null; })}`);
        await prise(page, nom);
      });
      await vue(`jourj-sortir-${l}-${theme}`, APP, f, theme, async (page, nom) => {
        journal.push(`${nom} ligne : ${await aller(page, 'Sortir la levure')}`);
        await prise(page, nom);
      });
    }
    if (!filtre || filtre === 'mesures') {
      await vue(`mesures-${l === 844 ? '844-' : ''}${theme}${l === 844 ? '' : `-${l}`}`.replace(/^mesures-844-(clair|cave)$/, 'mesures-844-$1'), `${BANC}/banc.html?theme=${theme}`, f, theme, async (page, nom) => { if (l === 844) await versCourbe(page); await prise(page, nom); });
      await vue(`mesures-auj-${theme}-${l}`, `${BANC}/banc.html?theme=${theme}&auj=1`, f, theme, async (page, nom) => { if (l === 844) await versCourbe(page); await prise(page, nom); });
    }
    if (!filtre || filtre === 'saisie') {
      await vue(`saisie-${l === 844 ? '844-' : ''}${theme}${l === 844 ? '' : `-${l}`}`.replace(/^saisie-844-(clair|cave)$/, 'saisie-844-$1'), `${BANC}/banc.html?theme=${theme}`, f, theme, async (page, nom) => { await cliquer('Mesurer')(page); await feuille(page); await prise(page, nom); });
    }
    if ((!filtre || filtre === 'conduite') && l !== 844) {
      const url = `${BANC}/recap.html?theme=${theme}&qty=none`;
      const ouvrirConduite = async (page) => {
        await cliquer('^Levure')(page);
        await page.evaluate(() => { const b = [...document.querySelectorAll('b')].find((e) => (e.textContent || '').includes('Conduite · température × jours')); const chev = b?.parentElement?.querySelector('.lv-chev'); if (chev?.getAttribute('data-ouvert') === 'false') b.closest('button, summary, [role=button]')?.click(); });
        await dormir(700);
      };
      await vue(`conduite-replie-${l}-${theme}`, url, f, theme, async (page, nom) => {
        await ouvrirConduite(page);
        journal.push(`${nom} : ${await aller(page, 'Conduite · température × jours')}`);
        const interdits = await page.evaluate(() => ['Vide = inconnu', 'Pas une fin de fermentation attestée', 'Jours de début suivants vs brouillon'].filter((t) => document.body.innerText.includes(t)));
        journal.push(`${nom} interdits visibles au repos : ${JSON.stringify(interdits)}`);
        await prise(page, nom);
      });
      await vue(`conduite-deplie-${l}-${theme}`, url, f, theme, async (page, nom) => {
        await ouvrirConduite(page);
        const n = await page.evaluate(() => { let k = 0; document.querySelectorAll('details').forEach((d) => { if (/Décalage des phases suivantes|fin de consigne/.test(d.querySelector('summary')?.textContent || '')) { d.open = true; k += 1; } }); return k; });
        journal.push(`${nom} : ${n} pli(s) ouvert(s)`);
        // Le pli le plus bas défile au centre : les deux plis se suivent dans la phase active.
        await aller(page, 'Ce que « fin de consigne » veut dire');
        await prise(page, nom);
      });
    }
  }
}
console.log(journal.join('\n'));
await browser.close();
