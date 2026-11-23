// D3b — port de la maquette choisie st1-d3b (22.11, 390) : le rond « ? » ouvre une bulle de cinq lignes sous lui (seuil, épuisé, à compter, sachets, échelle resserrée),
// plus de légende en bandeau par rangée. Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge D3B-1`), vert sur l'arbre.
export const passes = ['390-clair', '390-cave'];
const lire = () => {
  const q = document.querySelector('.sx-q'); const b = document.querySelector('#sv-leg-bulle');
  const rq = q?.getBoundingClientRect(); const rb = b && !b.hidden ? b.getBoundingClientRect() : null;
  return { q: !!q, ouvert: !!rb, items: b ? [...b.querySelectorAll('.sv-li > span')].map((x) => x.textContent.trim()).filter(Boolean) : [],
    sousLe: rb && rq ? rb.top >= rq.bottom - 2 && rb.left < 80 && rb.right <= innerWidth : false, large: rb ? Math.round(rb.width) : 0,
    anciennes: document.querySelectorAll('[id^=sv-leg-f]').length };
};
export default async function (c) {
  await c.etape('D3B d3b : la bulle de légende', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(700);
    const a = await c.mesure(lire);
    await c.mesure(() => document.querySelector('.sx-q')?.click()); await c.sleep(400);
    const b = await c.mesure(lire);
    await c.cap('d3b-legende');
    c.controle('D3B-1', !a.ouvert && b.ouvert && b.sousLe && b.items.join('|') === 'seuil|épuisé|à compter|sachets|échelle resserrée' && b.anciennes === 0,
      `fermée au repos : ${!a.ouvert} ; ouverte sous le « ? » : ${b.sousLe} (${b.large} px) ; lignes « ${b.items.join(' | ')} » ; anciens bandeaux par rangée : ${b.anciennes}`);
  });
}
