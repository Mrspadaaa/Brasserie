// Reconnaissance f3 (2) : À venir du banc carnets, et un brassin du banc calendrier (données simulées, réseau externe coupé).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const [BASE, DOSSIER] = process.argv.slice(2);
const { browser, page } = await ouvrir({ largeur: 1280, hauteur: 800, mobile: false, echelle: 1 });
const boutons = () => page.evaluate(() => [...new Set([...document.querySelectorAll('button, [role=button], [role=switch], a')].map(e => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 50)).filter(Boolean))].slice(-60));
const clic = async (debut) => page.evaluate(d => { const e = [...document.querySelectorAll('button, [role=button]')].find(x => ((x.getAttribute('aria-label') || x.textContent || '').trim()).startsWith(d)); e?.click(); return !!e; }, debut);
try {
  await page.goto(BASE + '?dev-local&preview=carnets', { waitUntil: 'networkidle0' }); await calme(page, 1000);
  console.log('avenir', await clic('À venir')); await calme(page, 800);
  await page.screenshot({ path: `${DOSSIER}/recon-avenir.png` });
  console.log(JSON.stringify(await boutons()));
  await page.goto(BASE + '?dev-local&preview=calendrier', { waitUntil: 'networkidle0' }); await calme(page, 1000);
  console.log('brassin', await clic('Saison de ferme')); await calme(page, 800);
  await page.screenshot({ path: `${DOSSIER}/recon-brassin.png` });
  console.log(JSON.stringify(await boutons()));
} finally { await browser.close(); }
