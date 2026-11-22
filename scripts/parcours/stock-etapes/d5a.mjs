// D5a — port de la maquette choisie st2-d5a (22.11, 390) : la fiche d'un article. Besoin et prix en deux pastilles ; Stock et Seuil à − et + ;
// « Modifier la fiche » : une ligne repliée qui ouvre une feuille par-dessus la fiche. Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge D5A-1,D5A-2,D5A-3`), vert sur l'arbre.
export const passes = ['390-clair', '390-cave', '1280-clair'];
const lire = () => {
  const vu = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
  const q = (s) => document.querySelector(s);
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; };
  const pb = q('[data-pav-besoin]'); const pp = q('[data-pav-prix]');
  return {
    pavs: !!pb && !!pp, memeLigne: !!pb && !!pp && Math.abs(r(pb).top - r(pp).top) <= 4,
    qrow: !!q('.sfp-qrow'), besoinDetailVisible: vu(q('[data-stock-besoin]')),
    stock: { moins: vu(q('[data-rg=stock] [data-moins]')), plus: vu(q('[data-rg=stock] [data-plus]')), champ: q('#stock-compte')?.value ?? null },
    seuil: { moins: vu(q('[data-rg=seuil] [data-moins]')), plus: vu(q('[data-rg=seuil] [data-plus]')), champ: q('#stock-min')?.value ?? null },
    ordre: (() => { const g = q('.sfp-reglage'); const h = q('[data-ce-qui-a-bouge]'); return !!g && (innerWidth >= 900 || !h || g.getBoundingClientRect().top < h.getBoundingClientRect().top); })(),
    pasDeLigneCorriger: !q('.sfp-pasr') && !q('.sfp-cors'),
    motif: vu(q('[data-motif]')),
    modif: vu(q('[data-modif]')), feuille: vu(q('#stock-edit')), nomVu: vu(q('#stock-label')),
    pageDerriere: vu(q('[data-fiche-page]')),
    feuilleBox: r(q('#stock-edit')), ecran: { w: innerWidth, h: innerHeight },
  };
};
export default async function (c) {
  await c.etape('D5A d5a : pastilles, − +, feuille', async () => {
    await c.demarrer(); await c.versStocks(); await c.chercher('Cryo');
    await c.ouvrirFiche(c.fx.ids.nomCryo); await c.sleep(500);
    const a = await c.mesure(lire);
    await c.cap('d5a-repos');
    c.controle('D5A-1', a.pavs && a.memeLigne && !a.qrow && !a.besoinDetailVisible && a.pasDeLigneCorriger && a.ordre,
      `deux pastilles besoin/prix sur une ligne : ${a.pavs && a.memeLigne} ; plus de « 1 Pck en stock » : ${!a.qrow} ; détail du besoin replié : ${!a.besoinDetailVisible} ; plus de rangée −100…+100 : ${a.pasDeLigneCorriger} ; Stock et Seuil avant « Ce qui a bougé » : ${a.ordre}`);
    // les gestes : + sur le stock, puis le motif apparaît ; − sur le seuil (aucun reste aucun) puis + (seuil 1)
    // un geste impossible (l'ancienne fiche n'a pas ces boutons) fait échouer le contrôle, pas l'étape : le rouge sur tour9 se prouve
    const geste = async (sel) => { try { await c.toucherSel(sel); await c.sleep(250); return true; } catch { return false; } };
    const g1 = await geste('[data-rg=stock] [data-plus]'); const g2 = await geste('[data-rg=seuil] [data-plus]');
    const b = await c.mesure(lire);
    await c.cap('d5a-gestes');
    c.controle('D5A-2', g1 && g2 && a.stock.moins && a.stock.plus && a.seuil.moins && a.seuil.plus && b.stock.champ !== a.stock.champ && b.seuil.champ === '1' && b.motif,
      `boutons − + sur Stock et Seuil : ${a.stock.moins && a.stock.plus && a.seuil.moins && a.seuil.plus} ; stock ${a.stock.champ} → ${b.stock.champ} ; seuil « ${a.seuil.champ} » → « ${b.seuil.champ} » ; motif demandé après le geste : ${b.motif}`);
    const g3 = await geste('[data-modif]'); await c.sleep(150);
    const d = await c.mesure(lire);
    await c.cap('d5a-feuille');
    c.controle('D5A-3', g3 && a.modif && !a.feuille && d.feuille && d.nomVu && d.pageDerriere && d.feuilleBox && d.feuilleBox.top + d.feuilleBox.h >= d.ecran.h - 2 && d.feuilleBox.h < d.ecran.h,
      `ligne « Modifier la fiche » repliée : ${a.modif && !a.feuille} ; feuille ouverte au toucher : ${d.feuille} (nom visible ${d.nomVu}, bas de l'écran ${JSON.stringify(d.feuilleBox)}) ; la fiche reste derrière : ${d.pageDerriere}`);
  });
}
