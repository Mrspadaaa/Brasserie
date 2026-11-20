// f9 : banc des 3 états (port 5196). Usage : PORT_BANC=5196 node banc.mjs <prefixe>
import fs from 'node:fs';
import path from 'node:path';
import { lancer, page, toucher, trouver, texte, haut, attendre, ICI } from '../v6/outil.mjs';
const pre = process.argv[2] ?? 'ap';
const CAP = path.join(ICI, '..', 'f9', 'captures');
const J = [];
const cap = async (p, nom) => { await p.evaluate(() => document.activeElement?.blur?.()).catch(() => {}); await p.screenshot({ path: path.join(CAP, `${nom}.png`) }); J.push(`capture ${nom}.png`); };
const nav = await lancer();
try {
  for (const th of ['clair', 'sombre']) {
    /* n° 3 : glissé du doigt sur le titre de Comparer */
    const q = await page(nav, `&theme=${th}&ouvrir=ventilation`, 390);
    await toucher(q, 'Comparer', { sel: 'button, a, [role="button"]', ms: 1200 }); await haut(q);
    const h = await q.evaluate(() => { const e = [...document.querySelectorAll('h1, h2')].find((x) => x.getClientRects().length); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await q.touchscreen.touchStart(h[0], h[1]); for (let i = 1; i <= 8; i++) { await q.touchscreen.touchMove(h[0] - i * 25, h[1] + 2); await attendre(16); } await q.touchscreen.touchEnd(); await attendre(700);
    const m = await q.evaluate(() => ({
      page: document.scrollingElement.scrollWidth <= innerWidth, sw: document.scrollingElement.scrollWidth, iw: innerWidth,
      decales: [...document.querySelectorAll('*')].filter((e) => e.scrollLeft > 0 && !e.classList.contains('cn-tableau-zone')).map((e) => `${e.tagName}.${e.className.toString().slice(0, 20)}:${e.scrollLeft}`),
      debord: [...document.querySelectorAll('div')].filter((e) => !e.classList.contains('cn-tableau-zone') && /auto|scroll/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth + 1).map((e) => `${e.tagName}.${e.className.toString().slice(0, 20)} sw${e.scrollWidth} cw${e.clientWidth}`)
    }));
    J.push(`[n3 ${th}] page scrollWidth<=innerWidth : ${m.page} (${m.sw}/${m.iw}) ; décalés hors tableau : ${JSON.stringify(m.decales)} ; débords : ${JSON.stringify(m.debord)}`);
    await cap(q, `${pre}-comparer-390-${th}-glisse`);
    /* n° 2 : Choisir, liste sous le cadre */
    await toucher(q, 'Choisir', { sel: 'button', exact: true, ms: 1500 });
    const lst = await q.evaluate(() => [...document.querySelectorAll('.cn-choisir .cn-article')].map((e) => {
      const tx = e.querySelector('.cn-article-tx').getBoundingClientRect(); const d = e.querySelector('.cn-droite').getBoundingClientRect();
      const hs = e.querySelector('.cn-hors-seuil'); const hr = hs?.getBoundingClientRect();
      const chevauche = hr ? hr.left < tx.right - 0.5 && hr.right > tx.left : false;
      return `${(e.querySelector('.cn-article-tx b')?.innerText ?? '').replace(/\s+/g, ' ')} | tx w${Math.round(tx.width)} h${Math.round(tx.height)} | droite w${Math.round(d.width)} | hors ${hs ? `« ${hs.innerText.replace(/\s+/g, ' ')} »` : '-'} chevauche:${chevauche}`;
    }));
    J.push(`[n2 ${th}]\n  ${lst.join('\n  ')}`);
    await q.evaluate(() => document.querySelector('.cn-choisir .cn-article')?.scrollIntoView({ block: 'center' })); await attendre(300);
    await cap(q, `${pre}-choisir-390-${th}-liste`);
    await q.close();
    /* n° 1 : choisi, à 390 et 1280 */
    for (const L of [390, 1280]) {
      const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
      await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]', ms: 1200 });
      await toucher(p, 'Choisir', { sel: 'button', exact: true, ms: 1500 });
      const b = await trouver(p, 'Choisir chez', { sel: 'button' });
      if (!b) { J.push(`[n1 ${L} ${th}] Choisir chez introuvable`); await p.close(); continue; }
      await b.evaluate((e) => e.scrollIntoView({ block: 'center' })); if (L < 600) await b.tap(); else await b.click(); await attendre(2000);
      const crit = (await texte(p)).split('\n').filter((l) => /Critère/.test(l)).map((l) => l.trim()).join(' / ');
      J.push(`[n1 ${L} ${th}] ${crit}`);
      await p.evaluate(() => document.querySelector('.cn-raisons')?.scrollIntoView({ block: 'center' })); await attendre(300);
      await cap(p, `${pre}-choisi-${L}-${th}`);
      await p.close();
    }
  }
} finally { await nav.close(); fs.writeFileSync(path.join(CAP, `journal-${pre}.txt`), J.join('\n')); console.log(J.join('\n')); }
