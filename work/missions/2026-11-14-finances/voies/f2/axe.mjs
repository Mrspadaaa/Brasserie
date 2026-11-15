// node axe.mjs <port> : mesure les libellés de l'axe de la frise (aucun ne se recouvre, aucun ne touche une poignée) et capture l'à cheval, 390 et 1280, clair et cave.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const touches = async (page, sel, touche, n) => { await page.focus(sel); for (let i = 0; i < n; i++) await page.keyboard.press(touche); await calme(page, 400); };
const mesure = (page) => page.evaluate(() => {
  const rect = (e) => { const r = e.getBoundingClientRect(); return { g: r.left, d: r.right, h: r.top, b: r.bottom }; };
  const libs = [...document.querySelectorAll('.ops-ax span')].map((e) => ({ t: e.textContent, ...rect(e) }));
  const poignees = [...document.querySelectorAll('.ops-h')].map((e) => rect(e.querySelector('.ops-gp') ?? e));
  const bulle = document.querySelector('.ops-bulle');
  const mal = [];
  for (let i = 0; i < libs.length; i++) for (let j = i + 1; j < libs.length; j++) if (libs[i].g < libs[j].d - 0.5 && libs[j].g < libs[i].d - 0.5) mal.push(`${libs[i].t} / ${libs[j].t}`);
  const axe = document.querySelector('.ops-ax').getBoundingClientRect();
  for (const l of libs) for (const p of poignees) if (l.g < p.d && p.g < l.d && l.h < p.b && p.h < l.b) mal.push(`${l.t} touche une poignée`);
  for (const l of libs) if (l.g < axe.left - 1 || l.d > axe.right + 1) mal.push(`${l.t} sort de la frise`);
  return { libs: libs.map((l) => `${l.t}[${Math.round(l.g)}-${Math.round(l.d)}]`).join(' '), mal, bulle: !!bulle };
});
const r = [];
const ETATS = [
  ['acheval-1', [['Début', 'ArrowLeft', 1]]],
  ['acheval-2', [['Début', 'ArrowLeft', 2]]],
  ['acheval', [['Début', 'ArrowLeft', 3]]],
  ['acheval-4', [['Début', 'ArrowLeft', 4]]],
  ['acheval-5', [['Début', 'ArrowLeft', 5]]],
  ['acheval-6', [['Début', 'ArrowLeft', 6]]],
  ['acheval-large', [['Début', 'ArrowLeft', 14]]],
];
for (const [largeur, mobile, hauteur] of [[390, true, 980], [1280, false, 1100]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
  await page.click('button[aria-label^="Déplier les jours"]'); await calme(page, 500);
  await touches(page, '[role=slider][aria-label=Fin]', 'PageDown', 2); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 2);
  const etat0 = await mesure(page); r.push(`${largeur} ${theme} base: ${etat0.libs} | ${etat0.mal.join(', ') || 'OK'}`);
  let fait = 0;
  for (const [nom, gestes] of ETATS) {
    const [, touche, n] = gestes[0];
    await touches(page, '[role=slider][aria-label=Début]', touche, n - fait); fait = n;
    const m = await mesure(page); r.push(`${largeur} ${theme} ${nom}: ${m.libs} | ${m.mal.join(', ') || 'OK'}`);
    if (nom === 'acheval') { await calme(page, 500); await page.screenshot({ path: `${OUT}acheval-${largeur}-${theme}.png` }); }
  }
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
console.log(r.join('\n'));
