import { ouvrir } from '../../../../../../missions/2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
for (const largeur of [390, 1280]) {
  const { nav, p } = await ouvrir(process.env.TEMP + '/ferm-apres', { etat: 'huit', largeur });
  const out = await p.evaluate(() => {
    const t = [...document.querySelectorAll('h1,h2')].map((h) => h.outerHTML.slice(0, 400));
    const nav = [...document.querySelectorAll('nav, [role="tablist"], ol')].map((n) => n.outerHTML.slice(0, 900));
    const ret = [...document.querySelectorAll('button')].find((b) => /^Retour$/.test(b.textContent.trim()));
    const lac = [...document.querySelectorAll('[data-sel]')].find((l) => /Lactose/.test(l.textContent));
    const r = ret?.getBoundingClientRect();
    return { t, nav: nav.slice(0, 2), pied: ret?.parentElement?.parentElement?.outerHTML.slice(0, 900), piedY: r && [r.top, r.bottom, innerHeight], lac: lac?.outerHTML.slice(0, 700) };
  });
  console.log('######', largeur, JSON.stringify(out, null, 1));
  await nav.close();
}
