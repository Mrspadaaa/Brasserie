// BR-105 : le radar « Profil ionique » : une étiquette sort-elle du cadre du svg ? Mesure chaque <text> contre le rectangle du svg.
import { ouvrir, etape, cliquer, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const theme = process.argv[3] ?? 'clair';
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, theme });
await etape(page, 'Eau');
if (largeur < 600) { await cliquer(page, '2. Sels'); await dormir(800); }
await dormir(800);
const r = await page.evaluate(() => {
  const out = [];
  for (const svg of document.querySelectorAll('svg')) {
    const R = svg.getBoundingClientRect();
    const textes = [...svg.querySelectorAll('text')];
    if (textes.length < 4 || R.width < 100) continue;
    const coupes = textes.filter((t) => { const b = t.getBoundingClientRect(); return b.width > 0 && (b.left < R.left - 0.5 || b.right > R.right + 0.5 || b.top < R.top - 0.5 || b.bottom > R.bottom + 0.5); })
      .map((t) => `${t.textContent.trim()}@${Math.round(t.getBoundingClientRect().top - R.top)}/${Math.round(R.bottom - t.getBoundingClientRect().bottom)}`);
    out.push({ w: Math.round(R.width), h: Math.round(R.height), nTextes: textes.length, coupes });
  }
  return out;
});
console.log(`${largeur} ${theme} svg à étiquettes ->`, JSON.stringify(r));
await page.evaluate(() => { const s = [...document.querySelectorAll('svg')].find((v) => v.querySelectorAll('text').length >= 4 && v.getBoundingClientRect().width > 100); s?.scrollIntoView({ block: 'center' }); });
await dormir(500);
await capture(page, `s15-radar-${largeur}-${theme}`);
await browser.close();
