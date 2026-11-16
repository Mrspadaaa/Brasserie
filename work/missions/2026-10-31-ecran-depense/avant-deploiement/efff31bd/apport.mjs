// node apport.mjs : FN-11 et FN-12 — apport 500 avec motif, Enregistrer, puis sa fiche (banc local).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const sortie = {};
for (const [L, M, T] of [[390, true, 'clair'], [1280, false, 'cave']]) {
  const cfg = `${L}-${T === 'cave' ? 'sombre' : 'clair'}`;
  const { browser, page } = await ouvrir({ largeur: L, hauteur: M ? 844 : 900, mobile: M, echelle: 1 });
  await page.goto('http://localhost:3000/?dev-local&finance-demo'); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), T); await page.reload(); await calme(page, 1800);
  const clic = (src, sel = 'button,[role=tab]') => page.evaluate((src, sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length && new RegExp(src).test(x.textContent.replace(/\s+/g, ' ').trim())); e?.scrollIntoView({ block: 'center' }); e?.click(); return e ? e.textContent.trim().slice(0, 80) : false; }, src, sel);
  const tape = async (sel, v) => { await page.focus(sel); await page.keyboard.type(v, { delay: 20 }); await page.evaluate((s) => document.querySelector(s)?.blur(), sel); await calme(page, 500); };
  const cap = async (n) => { await calme(page, 600); await page.screenshot({ path: `${OUT}${n}-${cfg}.png` }); const d = [...await page.$$('[role=dialog]')].length; sortie[`${n}-${cfg}`] = await page.evaluate(() => ([...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).at(-1) ?? document.querySelector('main')).innerText.replace(/\n+/g, ' / ').slice(0, 1200)); };
  await clic('^Finances$', 'nav button, nav a, [role=tab]'); await calme(page, 1000); await clic('^Opérations'); await calme(page, 1000);
  await clic('^Apport ou prélèvement privé'); await calme(page, 900);
  await tape('[role=dialog] [aria-label="Montant (CHF)"]', '500'); await tape('[role=dialog] [aria-label="Motif"]', 'Apport pour le malt');
  await clic('^Enregistrer'); await calme(page, 1800); await cap('apport-enr');
  sortie[`ligne-${cfg}`] = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((e) => e.getClientRects().length && /pport pour le malt|Apport privé|De ta poche/.test(e.textContent)); b[0]?.scrollIntoView({ block: 'center' }); b[0]?.click(); return b.map((x) => x.textContent.slice(0, 80)).join(' || ') || false; });
  await calme(page, 900); await cap('fiche-apport');
  await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].at(-1); const s = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (s) s.scrollTop = s.scrollHeight; }); await cap('fiche-apport-bas');
  await browser.close();
}
writeFileSync(OUT + 'apport.json', JSON.stringify(sortie, null, 1)); console.log(JSON.stringify(sortie, null, 1).slice(0, 3500));
