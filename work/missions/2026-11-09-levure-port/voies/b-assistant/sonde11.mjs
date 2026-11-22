// BR-82 : analyse source à 390 : « Modifier » coupé, tableau qui sort de l'écran. Mesure le débordement horizontal.
import { ouvrir, etape, cliquer, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 390);
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
await etape(page, 'Eau');
await cliquer(page, 'Analyse source');
await dormir(500);
const mesure = () => page.evaluate(() => {
  const L = window.innerWidth;
  const hors = [...document.querySelectorAll('main *, [role=dialog] *, .recipe-wizard *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.right > L + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed'; })
    .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24) + '@' + Math.round(e.getBoundingClientRect().right));
  return { defilHorizontal: document.documentElement.scrollWidth - L, hors: [...new Set(hors)].slice(0, 10), nHors: hors.length };
});
console.log('analyse ouverte ->', JSON.stringify(await mesure()));
await capture(page, `s11-analyse-ouverte-${largeur}`);
console.log('modifier ->', await cliquer(page, 'Modifier'));
await dormir(1000);
console.log('en édition ->', JSON.stringify(await mesure()));
await capture(page, `s11-analyse-edition-${largeur}`);
await browser.close();
