import { sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
export const texte = (page) => page.evaluate(() => document.body.innerText);
export const outils = (page, cdp) => {
  const tap = async (t, s = 'button,a,[role=button],[role=tab],[role=option],[role=menuitem],[role=radio],label,li', centrer = true) => { const r = await ou(page, t, s, centrer); if (!r) { log('INTROUVABLE', t); return null; } await toucher(cdp, r.x, r.y); await sleep(700); return r; };
  const nav = async (t) => { const r = await ou(page, t, 'nav button, nav a, button'); await toucher(cdp, r.x, r.y); await sleep(2200); };
  const soldes = async (nom) => {
    const s = {};
    await nav('Calendrier');
    s.depenser = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /CHF à dépenser/.test(x.getAttribute('aria-label') || '')); return b ? b.getAttribute('aria-label') : null; });
    await nav('Finances');
    const t = await texte(page); s.caisse = (/En caisse\n([^\n]+)\n([^\n]+)/.exec(t) || []).slice(1).join(' | ');
    s.synthese = (/Entré\n([^\n]+)\nDépensé\n([^\n]+)/.exec(t) || []).slice(1).join(' / ');
    await tap('Solde et paramètres financiers'); await sleep(1500);
    await photo(page, nom + '-solde', true);
    s.parametres = (await texte(page)).slice(0, 1200).replace(/\n/g, ' ¦ ');
    await page.keyboard.press('Escape'); await sleep(600);
    log(nom, s); return s;
  };
  const plus = async () => { await tap('Plus : saisie'); await sleep(900); };
  return { tap, nav, soldes, plus, b: (f) => boutons(page, f) };
};
