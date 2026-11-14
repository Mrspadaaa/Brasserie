// Captures de Finances au banc local (?dev-local&finance-demo=reel) : 390 tactile et 1280, clair et cave.
import { ouvrir, calme } from '../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const PORT = process.argv[2] ?? '3000'; const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const ONGLETS = ['Synthèse', 'Opérations', 'Prévisions', 'Annuel'];
async function clicRole(page, texte) {
  return page.evaluate((t) => { const els=[...document.querySelectorAll('[role=tab],button,a')].filter(e=>e.offsetParent && e.textContent.trim().replace(/\s+/g,' ')===t); if(!els.length) return false; els[0].click(); return true; }, texte);
}
const rapport = [];
for (const [largeur, mobile] of [[390, true], [1280, false]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: largeur < 500 ? 844 : 900, mobile, echelle: largeur < 500 ? 2 : 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  const nav = await page.evaluate(() => { const b=[...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e=>/^Finances$/.test(e.textContent.trim())); if(b){b.click();return true} return false; });
  await calme(page, 1200);
  for (const o of ONGLETS) {
    const ok = await clicRole(page, o); await calme(page, 1200);
    const f = `${OUT}${o.normalize('NFD').replace(/[^\w]/g,'').toLowerCase()}-${largeur}-${theme}.png`;
    await page.screenshot({ path: f, fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    rapport.push(`${o} ${largeur} ${theme} nav=${nav} clic=${ok} h=${h}`);
  }
  rapport.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0,3).join(' | ')}`);
  await browser.close();
}
console.log(rapport.join('\n'));
