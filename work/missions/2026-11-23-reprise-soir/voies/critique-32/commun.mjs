import { sleep, photo, log, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import fs from 'node:fs';
export const court = (e) => `${e.duree} | ${e.cadre?.split(' | ')[0]} | axe ${e.axe} | auj ${e.auj.length} | rognes ${e.rognes.join(';') || 0}`;
export const outils = (page, cdp) => {
  const pas = async (nom, f, demi = true) => { if (f) await f(); await sleep(1300); await photo(page, nom, demi); const e = await etat(page); log(nom, court(e)); return e; };
  const tap = async (t, s = 'button,[role=button],[role=tab],[role=option],[role=menuitem]') => { const r = await ou(page, t, s); if (!r) { log('introuvable', t); return null; } await toucher(cdp, r.x, r.y); await sleep(700); return r; };
  const duree = async (d) => { await tap('· période, liste, tri et filtre'); await tap(d); await page.keyboard.press('Escape'); };
  // toutes les choses de la frise (aria), pour prouver qu'aucune vraie donnée n'a bougé
  const instantane = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((a) => /, S\d+/.test(a) && !/ZZ TEST/.test(a)).sort());
  const barre = (n = 'ZZ TEST — barre') => page.evaluate((n) => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => (x.getAttribute('aria-label') || '').startsWith(n) && x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right, t: r.top, b: r.bottom, a: e.getAttribute('aria-label') }; }, n);
  return { pas, tap, duree, instantane, barre };
};
export const ecrire = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 1));
export const periode = async (page, cdp, tap, du, au) => {
  await tap('Période : ');
  if (du === 'Tout') { await tap('Tout', '[role=dialog] button'); }
  else for (const [a, v] of [['Du', du], ['Au', au]]) { const c = await page.evaluate((a) => { const e = [...document.querySelectorAll('input')].find((x) => x.getAttribute('aria-label')?.startsWith(a) && x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, a); if (!c) { console.log('champ introuvable', a); continue; } await toucher(cdp, c.x, c.y); await sleep(300); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type(v, { delay: 30 }); await page.keyboard.press('Enter'); await sleep(700); }
  await tap('Fermer', '[role=dialog] button'); await sleep(1500); await page.evaluate(() => scrollTo(0, 0));
};
