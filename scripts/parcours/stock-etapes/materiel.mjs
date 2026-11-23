// V5 — Matériel : le nom d'un appareil ne se coupe pas entre un nombre et son unité (STC-16 : « Fermenteur 120 / L »).
// Rouge sur tour8, vert sur l'arbre. Se joue aux quatre passes : le défaut est le même à 390 et à 1280 (cellule de 180 px).
export const passes = ['390-clair', '390-cave', '1280-clair', '1280-cave'];

export default async function (c) {
  await c.etape('STC-16 Matériel : « Fermenteur 120 L » sur une seule ligne', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Matériel'); await c.sleep(700);
    // où le nom tombe : le nombre et l'unité, chacun mesuré par un Range sur le texte (la ligne se lit à sa position verticale)
    const m = await c.mesure(() => {
      const re = /(\d+)[\s ]+(L)(?![\p{L}\d])/u;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const trouves = [];
      while (w.nextNode()) {
        const n = w.currentNode; const t = n.textContent ?? ''; const r = re.exec(t); if (!r) continue;
        const e = n.parentElement; const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) continue;
        const fin = r.index + r[0].length;
        const a = document.createRange(); a.setStart(n, r.index + r[1].length - 1); a.setEnd(n, r.index + r[1].length);
        const u = document.createRange(); u.setStart(n, fin - 1); u.setEnd(n, fin);
        const ra = a.getBoundingClientRect(); const ru = u.getBoundingClientRect();
        trouves.push({ texte: t.replace(/ /g, '␣').trim(), insecable: / /.test(r[0]), memeLigne: Math.abs(ra.top - ru.top) < 3, celluleW: Math.round(e.closest('.mt-c, .mt-ar, .mt-r')?.getBoundingClientRect().width ?? b.width), balise: e.className || e.tagName });
      }
      return trouves;
    });
    await c.cap('materiel-fermenteur');
    if (!m.length) throw new Error('aucun nom « … 120 L » dans Matériel (la fixture a « ZZ TEST Fermenteur 120 L »)');
    const coupes = m.filter((x) => !x.memeLigne);
    c.controle('STC-16', coupes.length === 0,
      `${m.length} nom(s) avec nombre et unité : ${m.map((x) => `« ${x.texte} » (${x.balise}, cellule ${x.celluleW} px, ${x.insecable ? 'espace insécable' : 'espace simple'}, ${x.memeLigne ? 'sur une ligne' : 'COUPÉ'})`).join(' ; ')}`);
  });
}
