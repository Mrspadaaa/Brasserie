// fla7 · chaude · le cône : chaque bractée du cône porte un mot des fiches. Sa couleur est celle de sa famille ;
// sans famille, elle reste grise au trait pointillé, mais aussi grande. Le cône se lit de haut en bas, du mot le plus
// dit au moins dit ; « * » : classé par une fiche, pas senti (bractée pâle).
const SOMBRE = { berries: 1, spice: 1, resin: 1 }, PALE = { herbal: 1 };
const PLANS = { 4: [1, 2, 1], 5: [1, 2, 2], 6: [1, 2, 2, 1], 7: [1, 2, 3, 1], 8: [1, 2, 3, 2], 9: [1, 2, 3, 2, 1], 10: [1, 2, 3, 3, 1], 11: [1, 2, 3, 3, 2], 12: [1, 2, 3, 3, 2, 1] };

export default {
  id: 'fla7', titre: 'Le cône des mots', chaleur: 'chaude', hop: 'citra-cryo',
  etats: [{ nom: 'nelson-sauvin', hop: 'nelson-sauvin' }, { nom: 'nugget', hop: 'nugget' }],
  css: (p) => `
.${p}-bd{display:flex;gap:6px;align-items:flex-start;margin:0 0 -2px}
.${p}-bd p{margin:6px 0 0;font-size:13px;color:#4a4a47;line-height:1.4;flex:1}
.${p}-bd b{color:#1d1d1b}
.${p}-cone{display:block;margin:0 auto;overflow:visible}
`,
  fiche: (h, S) => {
    const p = 'fla7', W = 362, ws = h.mots;
    const rangs = PLANS[Math.min(12, Math.max(4, ws.length))];
    const dispo = 470, pas = Math.min(112, (dispo - 40) / (rangs.length + 0.35)), BH = pas * 1.32, top = 26;
    const H = Math.round(top + pas * (rangs.length - 1) + BH + 6);
    let s = `<path d="M${W / 2} 2 C ${W / 2 + 6} 10, ${W / 2 - 4} 18, ${W / 2} ${top + 6}" fill="none" stroke="#3f8a5f" stroke-width="3" stroke-linecap="round"/>`;
    let k = 0;
    rangs.forEach((nb, r) => {
      const y = top + r * pas;
      const larg = rangs.length > 2 ? 1 - Math.abs(r - (rangs.length - 1) * 0.55) / rangs.length * 0.5 : 1;
      const bw = Math.min((W + (nb - 1) * 14) / nb - 2, 190 * larg), tot = nb * bw - (nb - 1) * 14, x0 = (W - tot) / 2;
      for (let q = 0; q < nb && k < ws.length; q++, k++) {
        const w = ws[k], x = x0 + q * (bw - 14), cx = x + bw / 2, big = (w.n === h.N && h.N > 1) || (h.N === 1 && w.premier);
        const pale = !w.f || w.classeSeul || PALE[w.f];
        const fill = !w.f ? '#e1e1de' : S.JETONS[w.f][pale ? 'fond' : 'base'];
        const st = !w.f ? '#1d1d1b' : pale ? S.JETONS[w.f].base : '#ffffff';
        const ink = w.f && !pale && SOMBRE[w.f] ? '#ffffff' : w.f && pale ? S.JETONS[w.f].texte : '#1d1d1b';
        const d = `M${x + 4} ${y + 10} C ${x + 6} ${y - 6}, ${x + bw - 6} ${y - 6}, ${x + bw - 4} ${y + 10} C ${x + bw - 2} ${y + BH * 0.55}, ${cx + 16} ${y + BH - 10}, ${cx} ${y + BH} C ${cx - 16} ${y + BH - 10}, ${x + 2} ${y + BH * 0.55}, ${x + 4} ${y + 10} Z`;
        s += `<path d="${d}" fill="${fill}" stroke="${st}" stroke-width="${big ? 2.8 : 1.8}"${w.f && !w.classeSeul ? '' : ' stroke-dasharray="4 3"'}/>`;
        const parts = w.m.length > 11 && w.m.includes(' ') ? [w.m.slice(0, w.m.indexOf(' ')), w.m.slice(w.m.indexOf(' ') + 1)] : [w.m];
        const fs = Math.round((big ? (w.m.length > 11 ? 17 : 21) : 15) * Math.min(1.12, pas / 92));
        const ty = y + 16 + fs;
        parts.forEach((t, i) => { s += `<text x="${cx}" y="${ty + i * (fs + 1)}" text-anchor="middle" font-size="${fs}" font-weight="${big ? 700 : 520}" fill="${ink}"${w.gen ? ' font-style="italic"' : ''}>${t}${i === parts.length - 1 && w.classeSeul ? '*' : ''}</text>`; });
        s += `<text x="${cx}" y="${ty + parts.length * (fs + 1) + 2}" text-anchor="middle" font-size="12" fill="${ink}">${w.n}/${h.N}</text>`;
        if (w.f) s += `<circle cx="${x + 20}" cy="${y + 13}" r="9.5" fill="#fff"/><svg data-famille="${w.f}" x="${x + 13}" y="${y + 6}" width="14" height="14" viewBox="0 0 24 24" aria-label="${S.NOM[w.f]}"><use href="#p-${w.f}"/></svg>`;
      }
    });
    const hors = ws.filter((w) => !w.f).length;
    return `<div class="${p}-bd">${S.radar(h, { r: 40, pad: 6, labels: false })}<p data-role="fiche-arome"><b>${ws.length} mots</b>, ${h.N > 1 ? h.N + ' fiches' : '1 fiche'}. En haut, les plus dits.<br><b>${hors}</b> grises au pointillé : sans famille, hors du radar.${ws.some((w) => w.classeSeul) ? '<br>* classé par la fiche, pas senti.' : ''}</p></div>
      <svg class="${p}-cone" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cône des mots de ${S.esc(h.nom)}">${s}</svg>`;
  },
};
