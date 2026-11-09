// Verdict final A-a : l'étiquette « style 59–79 » (et « 63,3 EBC › ») du repère EBC reste-t-elle entière à l'écran et dans son cadre ?
import { ouvrir, etape, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 390);
const theme = process.argv[3] ?? 'clair';
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, theme });
await etape(page, 'Malts');
await dormir(800);
const r = await page.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('.fer-zl, .fer-ebcl')) {
    const b = e.getBoundingClientRect();
    const cadre = (e.closest('.fer-reps') || e.parentElement).getBoundingClientRect();
    const sc = e.closest('.fer-reps');
    out.push({ t: e.textContent.trim().slice(0, 24), gauche: Math.round(b.left), droite: Math.round(b.right), ecran: window.innerWidth, cadreG: Math.round(cadre.left), cadreD: Math.round(cadre.right),
      horsEcran: b.right > window.innerWidth + 0.5 || b.left < -0.5, horsCadre: b.right > cadre.right + 0.5 || b.left < cadre.left - 0.5 });
  }
  return out;
});
console.log(largeur, theme, JSON.stringify(r));
await page.evaluate(() => document.querySelector('[data-role="reps"]')?.scrollIntoView({ block: 'center' }));
await dormir(400);
await capture(page, `s18-ebc-${largeur}-${theme}`);
await browser.close();
