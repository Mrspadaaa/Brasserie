// Sonde : imprime le balisage des éléments utiles de l'étape Fermentescibles (build figé, état « huit »).
import { ouvrir } from '../../../../../../missions/2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const { nav, p } = await ouvrir(process.env.TEMP + '/ferm-apres', { etat: process.argv[2] || 'huit' });
const out = await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const sel = q('[data-etape="fermentescibles"] [data-sel]');
  const pl = [...document.querySelectorAll('[data-etape="fermentescibles"] *')].find((e) => /empâtage/.test(e.textContent) && e.tagName === 'BUTTON' && e.closest('[data-sel]') == null);
  return { ligne: sel?.outerHTML.slice(0, 2500), bouton: pl?.outerHTML.slice(0, 600), plateau: pl?.closest('section,div[class*="r4b"],div')?.parentElement?.outerHTML.slice(0, 1800), champ: q('[data-role="ajout"]')?.parentElement?.parentElement?.outerHTML.slice(0, 1500), alerte: q('.fer-alerte')?.outerHTML };
});
for (const [k, v] of Object.entries(out)) console.log('==== ' + k + '\n' + v);
await nav.close();
