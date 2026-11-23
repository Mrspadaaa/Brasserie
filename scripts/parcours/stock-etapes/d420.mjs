// D420 — port de la maquette choisie (22.11) : d1a (onglets Articles | Recompter | Courses | Fûts | Matériel, sans « Houblons » ni bascule, ★ en rond,
// Recompter en segment Ingrédients | Autres stocks) et point 2 (pastilles dynamiques : seulement n > 0, une rangée, l'étoile au bout).
// Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge D420-1,D420-2`), vert sur l'arbre. Chaque passe prend la capture, à ouvrir à côté de la maquette.
export const passes = ['390-clair', '390-cave', '1280-clair', '1280-cave'];

const lireOutils = () => {
  const onglets = [...document.querySelectorAll('button')].filter((b) => !(b.textContent.trim() === 'Houblons' && !b.closest('nav'))) // à 1280 le titre du rayon Houblons du mur est un bouton (D422), pas un onglet
    .map((b) => b.textContent.trim()).filter((t) => ['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel', 'Houblons'].includes(t));
  const pu = [...document.querySelectorAll('.sz-pu')].map((b) => { const r = b.getBoundingClientRect(); return { f: b.dataset.f, n: b.querySelector('b')?.textContent.trim(), top: Math.round(r.top), right: Math.round(r.right), vis: r.width > 0 && r.height > 0 }; });
  const et = document.querySelector('.sz-etoile'); const er = et?.getBoundingClientRect();
  return { onglets, pu, vueBtn: document.querySelectorAll('[data-vue-btn]').length,
    etoile: er ? { w: Math.round(er.width), h: Math.round(er.height), left: Math.round(er.left), top: Math.round(er.top), rond: getComputedStyle(et).borderRadius } : null,
    ancienneEtoile: [...document.querySelectorAll('button')].some((b) => /★\s*épinglés/.test(b.textContent)),
    tuiles: document.querySelectorAll('.sz-r-som').length,
    segment: [...document.querySelectorAll('.sz-r-seg [role=tab]')].map((b) => b.textContent.trim()) };
};

export default async function (c) {
  await c.etape('D420-1 d1a : onglets, étoile ronde, Recompter en segment', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(600);
    const a = await c.mesure(lireOutils);
    await c.cap('d1a-articles');
    const ong = a.onglets.join(' | ');
    const bonsOnglets = ['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'].every((o) => a.onglets.includes(o)) && !a.onglets.includes('Houblons');
    const etoileOk = !!a.etoile && Math.abs(a.etoile.w - a.etoile.h) <= 1 && a.etoile.w >= 34 && a.pu.every((p) => p.right <= a.etoile.left) && !a.ancienneEtoile;
    c.controle('D420-1', bonsOnglets && a.vueBtn === 0 && etoileOk, `onglets « ${ong} » ; boutons de bascule ${a.vueBtn} ; ★ ${a.etoile ? `${a.etoile.w}×${a.etoile.h} à droite des pastilles : ${etoileOk}` : 'absente'} ; ancienne pastille ★ épinglés : ${a.ancienneEtoile}`);
    await c.sousOnglet('Recompter'); await c.sleep(500);
    const r = await c.mesure(lireOutils);
    await c.cap('d1a-recompter');
    c.controle('D420-1', r.tuiles === 0 && r.segment.join('|') === 'Ingrédients|Autres stocks', `Recompter : tuiles ${r.tuiles}, segment « ${r.segment.join(' | ')} »`);
    await c.toucher('Autres stocks', { sel: '.sz-r-seg [role=tab]' }); await c.sleep(500);
    const t = await c.texte();
    await c.cap('d1a-recompter-autres');
    c.controle('D420-1', !/Malts\s*\d+\s*\/?/.test(t.split('Autres stocks')[1] ?? '') || /Additifs|Sels|Emballage|Nettoyage/.test(t), `Recompter, Autres stocks : ${/Additifs|Sels|Emballage|Nettoyage/.test(t) ? 'rayons des autres stocks' : 'aucun rayon des autres stocks'}`);
  });
  await c.etape('D420-1c D422 : le catalogue des houblons par le titre du rayon', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(600); await c.chercher('Cryo'); await c.sleep(600);
    const ok = await c.mesure(() => { const b = document.querySelector('button.l1-cat'); if (!b) return false; b.click(); return true; });
    await c.sleep(900);
    const t = await c.texte();
    await c.cap('d1a-catalogue');
    c.controle('D420-1c', ok && /Variétés/.test(t) && /Dégustations/.test(t), `titre du rayon Houblons cliquable : ${ok} ; catalogue ouvert (Variétés, Dégustations) : ${/Variétés/.test(t) && /Dégustations/.test(t)}`);
  });
  await c.etape('D420-2 pastilles dynamiques', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(600);
    const a = await c.mesure(lireOutils);
    await c.cap('d2-pastilles');
    const tops = new Set(a.pu.map((p) => p.top));
    const zeros = a.pu.filter((p) => p.n === '0');
    const max = (c.passe ?? '').startsWith('390') ? 4 : 6;
    c.controle('D420-2', a.pu.length > 0 && tops.size === 1 && zeros.length === 0 && a.pu.length <= max,
      `pastilles ${a.pu.map((p) => `${p.f} ${p.n}`).join(' · ')} ; rangées ${tops.size} ; à 0 : ${zeros.length} ; au plus ${max}`);
    await c.toucher('manque', { sel: '.sz-pu' }).catch(() => {}); await c.sleep(500);
    const b = await c.mesure(lireOutils);
    c.controle('D420-2', b.pu.some((p) => p.f === 'manque'), 'le filtre actif reste montré');
  });
}
