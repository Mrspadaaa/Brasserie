import { lancer, page, taper, attendre } from './outil.mjs';
const nav = await lancer();
try {
  for (const [nom, txt] of [['vide', ''], ['un', 'frigo'], ['deux', 'autre projet, sans rapport : un frigo de garde pour 20 fûts']]) {
    const p = await page(nav, '&theme=clair&ouvrir=ventilation&ia=lent', 390);
    if (txt) await taper(p, txt, { envoyer: false }); await attendre(1200);
    console.log(nom, JSON.stringify(await p.evaluate(() => {
      let e = document.elementFromPoint(355, 765); while (e && getComputedStyle(e).position !== 'fixed' && e !== document.body) e = e.parentElement;
      const r = e?.getBoundingClientRect(); const f = document.querySelector('.cn-champ-zone form').getBoundingClientRect();
      return { fab: e && [e.tagName, e.className.toString().slice(0, 80), Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], formTop: Math.round(f.top), rangs: [...document.querySelectorAll('.cn-champ-zone .cn-vadans')].map((v) => Math.round(v.getBoundingClientRect().bottom)) };
    })));
    await p.close();
  }
} finally { await nav.close(); }
