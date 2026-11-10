// Reconnaissance de l'étape Houblons (banc ?dev-local&etape=houblons) : captures pleine page + textes. Voie b-houblons.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import fs from 'node:fs';
const port = process.env.PORT ?? '5654', tag = process.argv[2] ?? 'recon';
const out = new URL('./capt/', import.meta.url).pathname.replace(/^\/(\w):/, '$1:');
for (const [largeur, mobile] of [[390, true], [1280, false]]) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: largeur === 390 ? 844 : 900, mobile });
  try {
    await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
    await calme(page, 1500);
    for (const theme of ['clair', 'cave']) {
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await calme(page, 300);
      await page.screenshot({ path: `${out}${tag}-${largeur}-${theme}.png`, fullPage: true });
    }
    const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth,
      boutons: [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter(Boolean).slice(0, 60),
      h: [...document.querySelectorAll('h1,h2,h3')].map((h) => h.innerText.trim()).slice(0, 40) }));
    fs.writeFileSync(`${out}${tag}-${largeur}.json`, JSON.stringify({ info, erreurs: journal.erreurs.slice(0, 5) }, null, 1));
  } finally { await browser.close(); }
}
