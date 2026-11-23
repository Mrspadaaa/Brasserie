import { demarrer, ouvrirLigne } from '../../../../../../missions/2026-10-31-ecran-depense/banc-b2/aide-b2.mjs';
const { nav, ouvrir } = await demarrer();
const p = await ouvrir('3', 't390', 'clair');
await ouvrirLigne(p, 'Weizenmalz');
const o = await p.evaluate(() => {
  const a = [...document.querySelectorAll('[data-dp-ligne]')].find((a) => a.querySelector('summary')?.innerText.includes('Weizenmalz'));
  return { summary: a.querySelector('summary').outerHTML.slice(0, 2500), corps: a.querySelector('details').outerHTML.slice(a.querySelector('summary').outerHTML.length + 20, 7000) };
});
console.log(o.summary); console.log('=====CORPS'); console.log(o.corps);
await nav.close();
