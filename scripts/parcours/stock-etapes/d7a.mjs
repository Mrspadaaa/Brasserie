// D7a — port de la maquette choisie st1-d7a (22.11, 390) : les sucres ont leur groupe « Sucres » au bout du rang Malts (après Spéciaux),
// pots dorés à points ; la liste s'intitule « Malts et sucres ». Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge D7A-1`), vert sur l'arbre.
export const passes = ['390-clair', '390-cave'];
const lire = () => {
  const ordre = [...document.querySelectorAll('.stock-mur .l1e-r[data-f=f0] [data-groupe], .stock-mur [data-groupe]')].map((g) => g.getAttribute('data-groupe'));
  const g = document.querySelector('.stock-mur [data-groupe=sucres]');
  const pots = g ? [...g.querySelectorAll('svg.l1e-b')].map((e) => !!e.querySelector('pattern')) : [];
  const dernierMalt = ordre.filter((x) => ['base', 'caramel', 'torrefies', 'speciaux', 'sucres'].includes(x));
  const titre = (document.querySelector('.stock-liste')?.textContent ?? '').match(/Malts( et sucres)?\s*\d+/)?.[0] ?? null;
  return { groupe: !!g, mot: g?.querySelector('.l1e-w')?.getAttribute('data-long') ?? null, total: g?.querySelector('.l1e-t')?.textContent ?? null, pots, auBout: dernierMalt[dernierMalt.length - 1] === 'sucres' && dernierMalt[dernierMalt.length - 2] === 'speciaux', titre };
};
export default async function (c) {
  await c.etape('D7A d7a : le groupe Sucres au bout du rang Malts', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(700);
    const a = await c.mesure(lire);
    await c.cap('d7a-mur');
    c.controle('D7A-1', a.groupe && a.pots.length >= 2 && a.pots.every(Boolean) && a.auBout && !!a.titre && /sucres/.test(a.titre),
      `groupe « ${a.mot} » (${a.total}) après Spéciaux : ${a.auBout} ; pots à points : ${a.pots.length} (${a.pots.every(Boolean)}) ; liste titrée « ${a.titre} » (attendu « Malts et sucres N »)`);
  });
}
