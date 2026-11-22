// f9 : mesures du banc (port 5196). Usage : PORT_BANC=5196 node mesure.mjs
import { lancer, page, toucher, trouver, attendre, haut } from '../v6/outil.mjs';
const nav = await lancer();
try {
  const q = await page(nav, '&theme=clair&ouvrir=ventilation', 390);
  await toucher(q, 'Comparer', { sel: 'button, a, [role="button"]', ms: 1200 }); await haut(q);
  const larges = await q.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; })
    .slice(0, 25).map((e) => `${e.tagName}.${e.className.toString().slice(0, 40)} L${Math.round(e.getBoundingClientRect().left)} R${Math.round(e.getBoundingClientRect().right)} sw${e.scrollWidth} cw${e.clientWidth} ox:${getComputedStyle(e).overflowX}`));
  console.log('COMPARER larges:\n' + larges.join('\n'));
  const sc = await q.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX)).map((e) => `${e.tagName}.${e.className.toString().slice(0, 40)} sw${e.scrollWidth} cw${e.clientWidth}`));
  console.log('defilables: ' + sc.join(' | '));
  await toucher(q, 'Choisir', { sel: 'button', exact: true, ms: 1500 });
  const art = await q.evaluate(() => [...document.querySelectorAll('.cn-choisir .cn-article')].map((e) => [...e.children].map((c) => `${c.className.toString().slice(0, 30)} x${Math.round(c.getBoundingClientRect().left)} w${Math.round(c.getBoundingClientRect().width)} sw${c.scrollWidth}`).join(' ; ')));
  console.log('CHOISIR articles:\n' + art.join('\n'));
  await q.close();
} finally { await nav.close(); }
