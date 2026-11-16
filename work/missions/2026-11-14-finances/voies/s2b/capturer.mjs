// Voie s2b : captures de la feuille « Projet matériel » (m3pm-d) au banc. Aucune donnée réelle (jeu ?dev-local&finance-demo, Firebase coupé par le lanceur).
// Usage : node work/missions/2026-11-14-finances/voies/s2b/capturer.mjs <largeur> <clair|cave> [port=3000]
// Produit dans voies/s2b/cap/ : p-<largeur>-<thème>-ouvert.png (projet « Fermenteur supplémentaire », étape « À étudier »), …-apres.png (après le geste : toucher « Prêt à acheter »),
//   …-neuf.png (« Ajouter un projet »), et, à 390 clair, cote-<…>.png (la maquette m3pm-d à gauche, l'app à droite).
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const VOIE = dirname(fileURLToPath(import.meta.url)), CAP = join(VOIE, 'cap');
mkdirSync(CAP, { recursive: true });
const largeur = Number(process.argv[2] ?? 390), theme = process.argv[3] ?? 'clair', port = process.argv[4] ?? '3000';
const nom = (etat) => join(CAP, `p-${largeur}-${theme}-${etat}.png`);
const mobile = largeur < 700;
const { browser, page, journal } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: mobile ? 2 : 1 });
const clic = (re, sel = 'button,[role=tab],a') => page.evaluate((src, s) => { const r = new RegExp(src); const e = [...document.querySelectorAll(s)].find((x) => x.offsetParent && r.test(x.textContent.trim())); e?.click(); return !!e; }, re.source, sel);
try {
  await page.goto(`http://localhost:${port}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await clic(/^Finances$/, 'nav button, nav a, [role=tab], button'); await calme(page, 1200);
  await clic(/^Prévisions/, '[role=tab],button'); await calme(page, 1200);
  if (!(await clic(/Mes projets de matériel/))) await clic(/achats? de matériel pas compt/); await calme(page, 900);
  const trouve = await clic(/Fermenteur supplémentaire/); await calme(page, 1200);
  if (!trouve) { await page.screenshot({ path: join(CAP, 'debug.png') }); console.log(await page.evaluate(() => [...document.querySelectorAll('button,[role=tab]')].filter((e) => e.offsetParent).map((e) => e.textContent.trim().slice(0, 30)).join(' | '))); }
  if (!trouve) throw new Error('projet « Fermenteur supplémentaire » introuvable');
  await page.screenshot({ path: nom('ouvert') });
  await clic(/^Prêt à acheter/, '.pjd-ent'); await calme(page, 600);
  await page.screenshot({ path: nom('apres') });
  const mesures = await page.evaluate(() => {
    const h = (s) => [...document.querySelectorAll(s)].map((e) => Math.round(e.getBoundingClientRect().height));
    const sheet = document.querySelector('.pjd-sheet')?.getBoundingClientRect();
    return { feuille: sheet && { w: Math.round(sheet.width), h: Math.round(sheet.height), haut: Math.round(sheet.top) }, ronds: h('button.pjd-o'), entetes: h('.pjd-ent'), pilules: h('.pjd-a'), pied: h('.pjd-btn'), interrupteur: h('.pjd-sw'),
      debord: document.documentElement.scrollWidth > innerWidth, titre: document.querySelector('.pjd-titre')?.value };
  });
  console.log('mesures', JSON.stringify(mesures));
  await clic(/^Fermer$/, 'button[aria-label=Fermer]').catch(() => {});
  await page.evaluate(() => document.querySelector('.pjd-x')?.click()); await calme(page, 600);
  await clic(/Ajouter un projet/, 'button, [aria-label]'); await calme(page, 900);
  await page.evaluate(() => document.querySelector('button[aria-label="Ajouter un projet"]')?.click()); await calme(page, 900);
  await page.screenshot({ path: nom('neuf') });
  if (largeur === 390 && theme === 'clair') {
    const b64 = (f) => readFileSync(f).toString('base64');
    const maq = resolve(VOIE, '..', 'm3', 'm3pm-d', 'm3pm-d.png');
    const p2 = await browser.newPage(); await p2.setViewport({ width: 840, height: 900, deviceScaleFactor: 1 });
    await p2.setContent(`<body style="margin:0;display:flex;gap:12px;background:#888;font:12px sans-serif"><figure style="margin:0;color:#fff">maquette m3pm-d<br><img style="width:390px" src="data:image/png;base64,${b64(maq)}"></figure><figure style="margin:0;color:#fff">app (Fermenteur, étape « À étudier »)<br><img style="width:390px" src="data:image/png;base64,${b64(nom('ouvert'))}"></figure></body>`);
    await p2.screenshot({ path: join(CAP, 'cote-390-clair.png'), fullPage: true }); await p2.close();
  }
  console.log('PAGE', journal.erreurs.length ? 'ERREURS ' + journal.erreurs.join(' ; ') : 'OK', '| bloquées', journal.bloquees.length);
} finally { await browser.close(); }
