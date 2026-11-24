import { sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
export const texte = (page) => page.evaluate(() => document.body.innerText);
export const outils = (page, cdp) => {
  const tap = async (t, s = 'button,a,[role=button],[role=tab],[role=option],[role=menuitem],[role=radio],label,li', centrer = true) => { const r = await ou(page, t, s, centrer); if (!r) { log('INTROUVABLE', t); return null; } await toucher(cdp, r.x, r.y); await sleep(700); return r; };
  const nav = async (t) => { const r = await ou(page, t, 'nav button, nav a, button'); await toucher(cdp, r.x, r.y); await sleep(2200); };
  const fermerHaut = async () => { for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 80) { await toucher(cdp, f.x, f.y); await sleep(600); } else break; } };
  const soldes = async (nom) => {
    const s = {};
    await fermerHaut();
    await nav('Calendrier');
    s.depenser = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /CHF à dépenser/.test(x.getAttribute('aria-label') || '')); return b ? b.getAttribute('aria-label') : null; });
    s.cadre = await page.evaluate(() => (document.querySelector('.ent-cadre') || {}).innerText);
    await nav('Finances'); await tap('Synthèse', '[role=tab],button'); await sleep(1500);
    const t = await texte(page); await photo(page, nom + '-synthese');
    s.caisse = (/En caisse\n([^\n]+)\n([^\n]+)/.exec(t) || []).slice(1).join(' | ');
    s.synthese = (/Entré\n([^\n]+)\nDépensé\n([^\n]+)/.exec(t) || []).slice(1).join(' / ');
    s.syntheseTexte = t.slice(0, 700).replace(/\n/g, ' ¦ ');
    if (await tap('Solde et paramètres financiers')) { await sleep(1500); await photo(page, nom + '-solde', true); s.depart = (/Solde de départ[\s\S]{0,60}/.exec(await texte(page)) || [''])[0].replace(/\n/g, ' '); await fermerHaut(); }
    await tap('Opérations', '[role=tab],button'); await sleep(1500);
    const op = await texte(page);
    s.operations = (/payé\n([^\n]+)\nà payer\n([^\n]+)\ndépensé\n([^\n]+)/.exec(op) || []).slice(1).join(' / ');
    s.apports = (/Apports et prélèvements\n([^\n]+)/.exec(op) || [])[1];
    s.zz = op.match(/ZZ TEST[^\n]*/g) || [];
    log(nom, s); return s;
  };
  const plus = async () => { await tap('Plus : saisie'); await sleep(900); };
  return { tap, nav, soldes, plus, fermerHaut, b: (f) => boutons(page, f) };
};
