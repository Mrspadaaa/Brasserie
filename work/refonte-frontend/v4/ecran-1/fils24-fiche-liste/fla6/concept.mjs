// fla6 · chaude · la roue des mots : au centre le radar g1, autour un anneau des familles, et dehors la couronne des
// mots, une part par mot (plus épaisse quand les deux fiches le disent). Les mots sans famille ont leur part, en
// pointillé : la roue ne les cache pas, elle les montre pour ce qu'ils sont.
export default {
  id: 'fla6', titre: 'La roue des mots', chaleur: 'chaude', hop: 'nelson-sauvin',
  etats: [{ nom: 'nugget', hop: 'nugget' }, { nom: 'motueka', hop: 'motueka' }],
  entete: (h, S) => { const p = 'fla6'; return `<header class="${p}-hd"><button class="${p}-x" data-role="fermer-fiche" aria-label="Fermer">✕</button><h2>${S.esc(h.nom)} <span class="${p}-rep" aria-hidden="true">⊙</span></h2><p class="${p}-hl"><span data-role="fiche-alpha">α ${h.alpha.variete ? h.alpha.variete + " " : ""}<b>${S.fmt(h.alpha.min)}–${S.fmt(h.alpha.max)} %</b> <small>lot ${S.fmt(h.lot)} %</small></span><span class="${p}-us" data-role="usage">${h.usage}</span>${h.stock ? `<span class="${p}-stock">${h.stock} g</span>` : `<span class="${p}-stock ${p}-vide">épuisé</span>`}</p></header>`; },
  css: (p) => `
.${p}-hd{text-align:center;position:relative;padding-top:2px}.${p}-hd h2{font-size:26px;margin:0;letter-spacing:-.01em}.${p}-hd .${p}-x{position:absolute;right:0;top:0}
.${p}-hl{display:flex;justify-content:center;align-items:center;gap:8px;margin:2px 0 0;font-size:16px}.${p}-hl b{font-size:19px}.${p}-hl small{font-size:13px;color:#5d5d5a}
.${p}-us{font-size:13px;border:1px solid #bdbdb9;border-radius:999px;padding:1px 9px;margin-left:0}
.${p}-roue{display:block;margin:-2px auto 0;overflow:visible}
.${p}-pie{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#4a4a47;margin:2px 0 0;gap:8px;flex-wrap:wrap}
.${p}-pie span{display:inline-flex;align-items:center;gap:4px}
.${p}-k{display:inline-block;width:14px;height:10px;border-radius:2px;border:1.5px dashed #8a8a86}
`,
  fiche: (h, S) => {
    const p = 'fla6', W = 362, H = 392, cx = W / 2, cy = 190;
    const r0 = 64, r1 = 90, r2 = 116, r2b = 134;
    // Ordre : par famille (ordre du radar), les sans-famille ensemble à la fin ; un mot = une part égale.
    const ord = [...S.ORDRE_RADAR.flatMap((f) => h.mots.filter((w) => w.f === f)), ...h.mots.filter((w) => !w.f)];
    const n = ord.length, gap = 0.012;
    const a = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
    const arc = (ra, rb, t0, t1) => { const L = t1 - t0 > Math.PI ? 1 : 0; const P = (r, t) => (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); return `M${P(rb, t0)} A${rb} ${rb} 0 ${L} 1 ${P(rb, t1)} L${P(ra, t1)} A${ra} ${ra} 0 ${L} 0 ${P(ra, t0)} Z`; };
    let s = `<svg class="${p}-roue" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Roue des mots de ${S.esc(h.nom)}">`;
    // Anneau des familles (groupes contigus).
    let i = 0;
    while (i < n) { const f = ord[i].f; let j = i; while (j < n && ord[j].f === f) j++;
      const t0 = a(i) + gap, t1 = a(j) - gap, tm = (t0 + t1) / 2;
      if (f) { s += `<path d="${arc(r0, r1, t0, t1)}" fill="${S.JETONS[f].base}"/>`;
        s += `<svg data-famille="${f}" x="${cx + (r0 + r1) / 2 * Math.cos(tm) - 8}" y="${cy + (r0 + r1) / 2 * Math.sin(tm) - 8}" width="16" height="16" viewBox="0 0 24 24" aria-label="${S.NOM[f]}"><rect x="-2" y="-2" width="28" height="28" rx="14" fill="#fff"/><use href="#p-${f}"/></svg>`; }
      else s += `<path d="${arc(r0, r1, t0, t1)}" fill="#c9c9c5" stroke="#1d1d1b" stroke-width="1.4" stroke-dasharray="3 3"/>`;
      i = j; }
    // Couronne des mots.
    ord.forEach((w, k) => {
      const t0 = a(k) + gap, t1 = a(k + 1) - gap, tm = (t0 + t1) / 2, rb = w.n === h.N && h.N > 1 ? r2b : r2;
      s += w.f ? `<path d="${arc(r1 + 3, rb, t0, t1)}" fill="${S.JETONS[w.f].base}" fill-opacity="${w.classeSeul ? 0.25 : 0.7}" stroke="${S.JETONS[w.f].base}" stroke-width="1.4"${w.classeSeul ? ' stroke-dasharray="2 2"' : ''}/>`
        : `<path d="${arc(r1 + 3, rb, t0, t1)}" fill="#9a9a96" stroke="#1d1d1b" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      const cos = Math.cos(tm), sin = Math.sin(tm), rl = rb + 8;
      const x = cx + rl * cos, y = cy + rl * sin + (sin > 0.3 ? 12 : sin < -0.3 ? -2 : 5);
      const anc = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
      const big = w.n === h.N && h.N > 1;
      const parts = w.m.length > 12 && w.m.includes(' ') ? [w.m.slice(0, w.m.indexOf(' ')), w.m.slice(w.m.indexOf(' ') + 1)] : [w.m];
      parts.forEach((t, q) => { s += `<text x="${x.toFixed(1)}" y="${(y + q * 15 - (sin < -0.3 ? (parts.length - 1) * 15 : 0)).toFixed(1)}" text-anchor="${anc}" font-size="${big ? 16 : 13}" font-weight="${big ? 700 : 500}" fill="${w.f ? S.JETONS[w.f].texte : '#1d1d1b'}"${w.gen ? ' font-style="italic"' : ''}>${t}${q === parts.length - 1 && w.classeSeul ? '*' : ''}</text>`; });
    });
    s += '</svg>';
    // Le radar g1 au centre de la roue.
    const rad = S.radar(h, { r: 48, pad: 4, labels: false, cls: p + '-mil' });
    return `<div style="position:relative">${s}<div style="position:absolute;left:${cx - 52}px;top:${cy - 52}px;width:104px;height:104px;display:flex;align-items:center;justify-content:center">${rad}</div></div>
      <p class="${p}-pie" data-role="fiche-arome"><span>un mot = une part · large : ${h.N > 1 ? h.N + '/' + h.N + ' fiches' : '1/1 fiche'}</span><span><i class="${p}-k"></i> hors des 12</span>${h.mots.some((w) => w.classeSeul) ? '<span>* classé</span>' : ''}</p>`;
  },
};
