// node capturer.mjs <port> : cap/<état>-<largeur>-<thème>.png — Compagnon m4ia-c au banc ?dev-local&finance-demo (Gemini jamais appelé : « Envoyer » ouvre le chat, rien ne part).
// États : feuille (repos), coche (loyer décoché + tout l'historique), chat (après « Envoyer »), prev (Prévisions : sans bande). 390 tactile et 1280 ; clair et cave.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const r = [];
for (const [largeur, mobile, hauteur] of [[390, true, 844], [1280, false, 900]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 3500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 3500);
  const clic = async (re, sel = 'button,[role=tab]') => page.evaluate((src, s) => { const e = [...document.querySelectorAll(s)].find((x) => x.offsetParent && new RegExp(src).test(x.textContent.trim())); e?.click(); return !!e; }, re.source, sel);
  await clic(/^Finances$/, 'nav button, nav a, [role=tab]'); await calme(page, 1200);
  await clic(/^Opérations/); await calme(page, 1200);
  const shot = async (n) => { await calme(page, 800); await page.screenshot({ path: `${OUT}${n}-${largeur}-${theme}.png` }); r.push(`${n}-${largeur}-${theme}`); };
  const ouverte = await page.evaluate(() => { const e = document.querySelector('.finance-assistant'); e?.scrollIntoView(); e?.click(); return e?.textContent; }); await calme(page, 900);
  r.push(`puce: ${ouverte}`);
  await shot('feuille');
  const etat = await page.evaluate(() => ({ pastilles: [...document.querySelectorAll('[data-pastille]')].map((p) => `${p.textContent}:${p.getAttribute('aria-pressed')}`), vise: document.querySelector('[data-vise]')?.getAttribute('data-pile'), q: document.querySelector('#cpg-question')?.value, h: [...document.querySelectorAll('.cpg-pl,.cpg-pri,.cpg-mode select')].map((e) => Math.round(e.getBoundingClientRect().height)) }));
  r.push(`état ${largeur} ${theme}: ${JSON.stringify(etat)}`);
  await page.evaluate(() => { document.querySelector('[data-pastille=aPayer]')?.click(); document.querySelector('[data-pastille=toutHistorique]')?.click(); }); await shot('coche');
  await clic(/^Envoyer$/); await calme(page, 1200); await shot('chat');
  const chat = await page.evaluate(() => [...document.querySelectorAll('textarea')].map((t) => t.value).find((v) => /Contexte choisi/.test(v)) ?? null);
  r.push(`chat ${largeur} ${theme}: ${chat ? chat.slice(0, 200).replace(/\n/g, ' / ') : 'AUCUNE question préremplie'}`);
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
writeFileSync(new URL('./capturer.txt', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), r.join('\n'));
console.log(r.join('\n'));
