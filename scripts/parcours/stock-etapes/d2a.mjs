// D2a — port de la maquette choisie st1-d2a (22.11) : Comparer en rond à droite de la recherche, « ? » rond de la légende, puce de tri dans la barre du rayon
// (plus de ligne « Trié par »), rayon touché encadré avec une encoche. Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge D2A-1,D2A-2,D2A-3,D2A-4`), vert sur l'arbre.
export const passes = ['390-clair', '390-cave'];

const lire = () => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), left: Math.round(b.left), rond: getComputedStyle(e).borderRadius }; };
  const q = document.querySelector('input[name=stock_recherche]');
  const ligneRech = r(q?.closest('label'));
  const eh = document.querySelector('.stock-liste .l1-eh');
  const ligne = [...document.querySelectorAll('.l1e-r')].find((x) => x.querySelector('.l1e-n[aria-pressed=true]'));
  return {
    comparer: r(document.querySelector('[data-comparer]')), rech: ligneRech,
    rangeeComparer: !!document.body.innerText.match(/Comparer une recette\s*\n?\s*Besoin prévu/),
    q: r(document.querySelector('.sx-q')), qTexte: document.querySelector('.sx-q')?.textContent.trim(),
    puce: r(document.querySelector('.stock-liste .sz-pt')), titre: r(eh?.querySelector('h2')),
    trie: /Trié par/.test(document.body.innerText),
    actif: ligne ? { ombre: getComputedStyle(ligne).boxShadow, encoche: getComputedStyle(ligne, '::after').content } : null,
  };
};

export default async function (c) {
  await c.etape('D2A d2a : Comparer en rond, légende ronde, puce de tri, rayon encadré', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(700);
    const a = await c.mesure(lire);
    await c.cap('d2a-repos');
    const cmp = a.comparer; const rech = a.rech;
    c.controle('D2A-1', !!cmp && Math.abs(cmp.w - cmp.h) <= 1 && cmp.w >= 40 && cmp.left > rech.left && Math.abs(cmp.top - rech.top) <= 4 && !a.rangeeComparer,
      `Comparer ${cmp ? `${cmp.w}×${cmp.h} rond ${cmp.rond}, à droite de la recherche (même ligne : ${cmp && Math.abs(cmp.top - rech.top) <= 4})` : 'absent'} ; ancienne rangée « Comparer une recette » : ${a.rangeeComparer}`);
    c.controle('D2A-2', !!a.q && Math.abs(a.q.w - a.q.h) <= 1 && a.q.w <= 34 && a.qTexte === '?', `légende : ${a.q ? `${a.q.w}×${a.q.h}` : 'absente'}, texte « ${a.qTexte} »`);
    c.controle('D2A-3', !!a.puce && !!a.titre && Math.abs(a.puce.top - a.titre.top) <= 14 && !a.trie, `puce de tri ${a.puce ? `top ${a.puce.top}` : 'absente'} / titre du rayon ${a.titre ? `top ${a.titre.top}` : '—'} ; ligne « Trié par » : ${a.trie}`);
    await c.toucher('Malts', { sel: '.l1e-n[data-filtre=Malts]' }); await c.sleep(600);
    const b = await c.mesure(lire);
    await c.cap('d2a-malts');
    c.controle('D2A-4', !!b.actif && b.actif.ombre !== 'none' && b.actif.encoche !== 'none' && b.actif.encoche !== 'normal', `rayon touché : ombre « ${b.actif?.ombre?.slice(0, 40)} », encoche ${b.actif?.encoche}`);
    await c.mesure(() => document.querySelector('[data-comparer]')?.click()); await c.sleep(500);
    const t = await c.texte(); await c.cap('d2a-comparer');
    c.controle('D2A-1', await c.mesure(() => !!document.querySelector('[data-comparer-panneau]')), 'le rond ouvre le panneau de comparaison');
  });
}
