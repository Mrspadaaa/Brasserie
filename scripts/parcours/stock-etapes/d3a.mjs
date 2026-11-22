// D3a — port de la maquette choisie st1-d3a (22.11, 1280) : trois rayons côte à côte (mur) puis, dessous, une table par rayon, côte à côte.
// Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge D3A-1`), vert sur l'arbre.
export const passes = ['1280-clair', '1280-cave'];
const lire = () => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; };
  const rayons = [...document.querySelectorAll('.stock-mur .l1e-r')].map(r);
  const tables = [...document.querySelectorAll('.sz-tables > [data-table]')].map(r);
  return { rayons, tables, nbTables: tables.length };
};
export default async function (c) {
  await c.etape('D3A d3a : trois rayons côte à côte, une table par rayon', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(900);
    const a = await c.mesure(lire);
    await c.cap('d3a-1280');
    const rays = a.rayons; const t = a.tables;
    const cote = rays.length === 3 && rays.every((x) => Math.abs(x.top - rays[0].top) <= 4) && rays[0].left < rays[1].left && rays[1].left < rays[2].left;
    const tabCote = t.length === 3 && t.every((x) => Math.abs(x.top - t[0].top) <= 4) && t[0].left < t[1].left && t[1].left < t[2].left;
    c.controle('D3A-1', cote && tabCote, `rayons côte à côte : ${cote} (${rays.length}) ; une table par rayon côte à côte : ${tabCote} (${t.length})`);
  });
}
