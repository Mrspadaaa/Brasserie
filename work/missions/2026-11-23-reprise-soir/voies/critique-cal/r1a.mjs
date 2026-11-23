import { ouvrir, sleep, photo, log, taper, boutons, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
log('R1 départ', await etat(page));
const champs = await page.evaluate(() => [...document.querySelectorAll('input,textarea,[contenteditable]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName, type: e.type, val: e.value ?? e.textContent, aria: e.getAttribute('aria-label'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
log('champs', champs);
const du = champs.find((c) => /01\.01\.2026/.test(c.val)); const au = champs.find((c) => /19\.11\.2026/.test(c.val));
if (du && au) {
  await toucher(cdp, du.x, du.y); await sleep(300);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type('01.01.2024'); await page.keyboard.press('Enter'); await sleep(800);
  await photo(page, 'R1-01-du', true);
  const au2 = await page.evaluate(() => { const e = [...document.querySelectorAll('input')].filter((x) => x.getBoundingClientRect().width > 0).pop(); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, v: e.value }; });
  await toucher(cdp, au2.x, au2.y); await sleep(300);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type('31.12.2027'); await page.keyboard.press('Enter'); await sleep(1000);
  log('champs après', await page.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.value)));
  await photo(page, 'R1-02-plage4ans');
}
lacher();
