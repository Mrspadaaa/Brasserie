// Voie w1 : sonde du chemin du testeur au banc. Usage : node sonde.mjs <22|24|25|26|filtres> [390|1280] [clair|cave]
// Banc : http://localhost:3000/?dev-local&finance-demo (déjà lancé, ne pas relancer). Aucune donnée réelle.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const RACINE = process.cwd();
const DOSSIER = path.join(RACINE, 'work/missions/2026-11-14-finances/voies/w1');
const CAP = path.join(DOSSIER, 'cap');
fs.mkdirSync(CAP, { recursive: true });
const L = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const URL_BANC = 'http://localhost:3000/?dev-local&finance-demo';
const cas = process.argv[2] ?? '22';
const largeur = Number(process.argv[3] ?? 390);
const theme = process.argv[4] ?? 'clair';
const mobile = largeur < 700;
const { browser, page, journal } = await L.ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
const sortie = [];
const dit = (m) => { sortie.push(m); };
const cliquer = (texte, { mode = 'exact', aria = false, nth = 0, racine = 'body' } = {}) => page.evaluate((texte, mode, aria, nth, racine) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const r = document.querySelector(racine) ?? document.body;
  const els = [...r.querySelectorAll('button,[role="button"],[role="tab"],a,[role="menuitem"],summary')].filter((x) => x.getClientRects().length > 0);
  const hits = els.filter((x) => { const v = norm(aria ? x.getAttribute('aria-label') : x.innerText); return mode === 'exact' ? v === texte : v.includes(texte); });
  const e = hits[nth]; if (!e) return 'absent'; if (e.disabled) return 'desactive'; e.click(); return 'ok';
}, texte, mode, aria, nth, racine);
const etape = async (t, o) => { const r = await cliquer(t, o); if (r !== 'ok') throw new Error(`« ${t} » ${r}`); await L.calme(page, 800); };
const shot = async (nom) => { await L.calme(page, 500); const f = `${nom}-${largeur}-${theme}.png`; await page.screenshot({ path: path.join(CAP, f) }); dit(`capture ${f}`); };
const champ = async (sel, valeur) => { await page.click(sel, { clickCount: 3 }); await page.keyboard.type(valeur); await page.keyboard.press('Tab'); };
const texte = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => e.innerText.replace(/\s+/g, ' ').trim()), sel);
const aller = async (vue, url = URL_BANC) => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme);
  await page.reload({ waitUntil: 'domcontentloaded' }); await L.calme(page, 1500);
  await etape('Finances'); if (vue) await etape(vue);
};
try {
  if (cas === '22') {
    await aller('Prévisions');
    dit('avant : ' + JSON.stringify(await texte('.prv-depart')));
    await shot('22-avant');
    const a = await cliquer('+'); if (a !== 'ok') await etape('prévision', { mode: 'contains', aria: true }); else await L.calme(page, 900);
    await shot('22-feuille');
    await champ('input[placeholder^="Loyer"]', 'ZZ TEST prévision');
    await champ('input[aria-label="Montant (CHF)"]', '7');
    await etape('Enregistrer', { racine: '[role=dialog]' }); await L.calme(page, 1500);
    dit('après : ' + JSON.stringify(await texte('.prv-depart')));
    dit('sorties : ' + JSON.stringify(await texte('.prv-sw, .prv-seule, .prv')).slice(0, 400));
    await shot('22-apres');
  }
  if (cas === 'filtres') {
    await aller('Opérations');
    await etape('Filtres', { mode: 'contains' });
    dit('panneau : ' + JSON.stringify(await texte('.ops-panneau .ops-chip, .ops-panneau .ops-cap')));
    await page.evaluate(() => document.querySelector('.ops-panneau')?.scrollIntoView({ block: 'center' }));
    await shot('fn22-filtres');
  }
  if (cas === '23') {
    await aller('Prévisions');
    const plus = await cliquer('+'); if (plus !== 'ok') await etape('prévision', { mode: 'contains', aria: true }); else await L.calme(page, 900);
    await champ('input[placeholder^="Loyer"]', 'ZZ TEST — Prévision');
    await champ('input[aria-label="Montant (CHF)"]', '7');
    await page.evaluate(() => document.querySelector('.pvc-fin')?.scrollIntoView({ block: 'center' }));
    dit('légende : ' + JSON.stringify(await texte('.pvc-fin')));
    await shot('fn23-legende');
  }
  if (cas === '24') {
    await aller('Prévisions');
    dit('cartes : ' + JSON.stringify(await texte('.prv-sw button')));
    await shot('fn24-cartes');
    const r = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Fermenteur.*−?750/.test(x.innerText.replace(/\s+/g, ' '))); if (b) { b.click(); return 'ok'; } const t = [...document.querySelectorAll('svg *')].find(x => /Fermenteur/.test(x.textContent || '')); if (t) { t.dispatchEvent(new MouseEvent('click', { bubbles: true })); return 'svg'; } return 'absent'; });
    await L.calme(page, 900); dit('ouverture fiche : ' + r);
    dit('titre fiche : ' + JSON.stringify(await texte('.prv-fiche-tete h3')));
    dit('limites : ' + JSON.stringify(await texte('.prv-lim')));
    await shot('fn25-26-fiche');
    await page.evaluate(() => document.querySelector('.prv-lim')?.scrollIntoView({ block: 'center' }));
    await shot('fn25-limites');
  }
  if (cas === 'dump') {
    await aller(process.argv[5] || 'Prévisions');
    dit(JSON.stringify(await texte('button')).slice(0, 2500));
    await shot('dump');
  }
} catch (e) { dit('ECHEC : ' + e.message); await shot(`${cas}-echec`).catch(() => {}); }
dit('erreurs page : ' + (journal.erreurs.slice(0, 3).join(' | ') || 'aucune'));
await browser.close();
console.log(sortie.join('\n'));
