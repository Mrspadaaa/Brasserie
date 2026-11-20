// T3B-10 : l'écart entre la largeur de texte ESTIMÉE par le placement (corps × 0,56 ; mono × 0,6) et la largeur RÉELLE rendue par Chrome (getComputedTextLength).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 -- node <ce fichier> [3110]
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const PORT = process.argv[2] ?? '3110';
const { browser, page } = await ouvrir({ largeur: 390, hauteur: 2300, mobile: true, echelle: 1 });
await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find(e => e.offsetParent && e.textContent.trim().startsWith('Prévisions'))?.click()); await calme(page, 1200);
await page.evaluate(() => [...document.querySelectorAll('button,[role=tab],[role=radio]')].find(e => e.offsetParent && e.textContent.trim().startsWith('12 mois'))?.click()); await calme(page, 1000);
const lignes = await page.evaluate(() => {
  const est = (s, corps, mono) => Math.ceil([...s].length * corps * (mono ? 0.6 : 0.56));
  const defs = [['.prv-tx', 13, false], ['.prv-fin', 16, true], ['.prv-solde', 12, true], ['.prv-et', 13, false], ['.prv-ax', 12, true], ['.prv-nom-ghost', 13, false]];
  return defs.flatMap(([sel, corps, mono]) => [...document.querySelectorAll(`svg.prv-svg ${sel}`)].map(t => {
    const s = t.textContent, reel = Math.round(t.getComputedTextLength()), e = est(s, corps, mono), cs = getComputedStyle(t);
    return `${sel} « ${s} » estimé ${e} réel ${reel} (×${(reel / e).toFixed(2)}) ${cs.fontFamily.slice(0, 40)} ${cs.fontWeight}`;
  }));
});
console.log(lignes.join('\n'));
await browser.close();
