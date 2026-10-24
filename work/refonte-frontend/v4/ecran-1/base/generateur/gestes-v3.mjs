// Parcours joués sur la base v3 (radar unique, fiche du houblon) : appui long, table des moments, ajout depuis la fiche, survol à 1280, Comparer agrandi, balayage de voie. Captures v3-*.png dans base/captures/.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const OUT = path.join(BASE, 'captures');
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async (f, mobile = true) => {
  const p = await b.newPage();
  const err = [];
  p.on('pageerror', (e) => err.push(String(e.message)));
  await p.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1280, height: 900, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(path.join(BASE, 'consolide', f)).href, { waitUntil: 'networkidle0' });
  await w(300);
  p.err = err;
  return p;
};
const fiche = (p) => p.evaluate(() => { const f = document.querySelector('[data-role="fiche"]'); return f ? { nom: f.querySelector('.f-nom').textContent, mots: f.innerText.split(/\s+/).filter((x) => /[\p{L}\p{N}]/u.test(x)).length, table: [...f.querySelectorAll('.f-m')].map((m) => m.innerText.replace(/\s+/g, ' ')).join(' | ') } : null; });
const ibu = (p) => p.$eval('#ibu', (e) => e.textContent);

// 1. Étape : appui long sur Nugget (650 ms), table des moments touchée, résumé IBU au-dessus.
{
  const p = await ouvrir('index.html');
  const n = await p.$('[data-role="ligne-houblon"] [data-houblon]');
  const t = await n.touchStart(); await w(300);
  await p.screenshot({ path: path.join(OUT, 'v3-fiche-1-appui-300ms.png') });
  await w(350); await t.end(); await w(450);
  console.log('appui long index :', JSON.stringify(await fiche(p)), '| IBU', await ibu(p));
  await p.screenshot({ path: path.join(OUT, 'v3-fiche-2-ouverte.png') });
  const m = (await p.$$('.f-m'))[1];
  await m.tap(); await w(600);
  console.log('table touchée (10′) :', JSON.stringify(await fiche(p)), '| IBU', await ibu(p), '| ligne :', await p.$eval('[data-role="ligne-houblon"] [data-role="quand"]', (e) => e.textContent));
  await p.screenshot({ path: path.join(OUT, 'v3-fiche-3-moment-10.png') });
  const s = await p.$('.f-repli'); await s.tap(); await w(400);
  await p.screenshot({ path: path.join(OUT, 'v3-fiche-4-styles.png') });
  await (await p.$('[data-role="fermer-fiche"]')).tap(); await w(400);
  console.log('fermée :', !(await fiche(p)), '| masqués restants', await p.$$eval('.sous-fiche', (e) => e.length), '| erreurs', p.err.join(' ; ') || 0);
  await p.close();
}
// 2. Ajout proposé : appui long sur Motueka, « Ajouter à 10′ » depuis la fiche.
{
  const p = await ouvrir('index.html');
  const n = await p.$('[data-role="ajout-rapide"] [data-houblon]');
  const t = await n.touchStart(); await w(650); await t.end(); await w(450);
  console.log('fiche Motueka :', JSON.stringify(await fiche(p)), '| lignes', await p.$$eval('[data-role="ligne-houblon"]', (e) => e.length));
  await p.screenshot({ path: path.join(OUT, 'v3-fiche-5-propose.png') });
  const a = await p.$('.f-ajouter'); await a.tap(); await w(600);
  console.log('après Ajouter :', JSON.stringify(await fiche(p)), '| lignes', await p.$$eval('[data-role="ligne-houblon"]', (e) => e.length), '| IBU', await ibu(p), '| erreurs', p.err.join(' ; ') || 0);
  await p.close();
}
// 3. Survol long à l'ordinateur.
{
  const p = await ouvrir('index.html', false);
  const r = await (await p.$('[data-role="ligne-houblon"] [data-houblon]')).boundingBox();
  await p.mouse.move(r.x + 10, r.y + r.height / 2, { steps: 4 }); await w(900);
  console.log('survol 1280 :', JSON.stringify(await fiche(p)));
  await p.screenshot({ path: path.join(OUT, 'v3-fiche-6-survol-1280.png') });
  await p.close();
}
// 4. Comparer : appui long sur un en-tête, puis toucher un petit radar l'agrandit.
{
  const p = await ouvrir('comparer-radar.html');
  await (await p.$$('.pm'))[1].tap(); await w(400);
  console.log('agrandi :', await p.$$eval('svg[data-radar]', (s) => s.map((x) => Math.round(x.getBoundingClientRect().width)).join(',')), '| compacts', await p.$$eval('.pm.compact', (e) => e.length));
  await p.screenshot({ path: path.join(OUT, 'v3-comparer-agrandi.png') });
  await p.close();
  const q = await ouvrir('comparer.html');
  const n = await q.$('.col [data-houblon]');
  const t = await n.touchStart(); await w(650); await t.end(); await w(450);
  console.log('fiche depuis Comparer :', JSON.stringify(await fiche(q)), '| erreurs', q.err.join(' ; ') || 0);
  await q.screenshot({ path: path.join(OUT, 'v3-fiche-7-comparer.png') });
  await q.close();
}
// 5. Suggestions : balayage du radar d'une voie à l'autre (geste de p08), capturé à mi-geste.
{
  const p = await ouvrir('suggestions-radar.html');
  const avant = await p.$eval('svg[data-objet="voies"] [data-serie^="après"]', (e) => e.getAttribute('data-serie'));
  const r = await (await p.$('svg[data-objet="voies"]')).boundingBox();
  const x0 = r.x + r.width * 0.75, y0 = r.y + r.height * 0.5;
  const t = await p.touchscreen.touchStart(x0, y0);
  for (let i = 1; i <= 8; i++) { await t.move(x0 - i * 12, y0 + 2); await w(30); }
  await w(120);
  await p.screenshot({ path: path.join(OUT, 'v3-balayage-1-mi-geste.png') });
  for (let i = 9; i <= 16; i++) { await t.move(x0 - i * 12, y0 + 2); await w(20); }
  await t.end(); await w(900);
  const apres = await p.$eval('svg[data-objet="voies"] [data-serie^="après"]', (e) => e.getAttribute('data-serie'));
  console.log('balayage :', avant, '→', apres, '| puce', await p.$eval('.puces-v [aria-pressed="true"]', (e) => e.textContent), '| erreurs', p.err.join(' ; ') || 0);
  await p.screenshot({ path: path.join(OUT, 'v3-balayage-2-apres.png') });
  await (await p.$('.puces-v .chip[aria-pressed="false"]')).tap(); await w(900);
  console.log('puce :', await p.$eval('svg[data-objet="voies"] [data-serie^="après"]', (e) => e.getAttribute('data-serie')));
  await p.close();
}
await b.close();
