// fla4 · tiède · des mots aux familles : les mots à gauche, en grand ; un fil part de chacun vers sa famille, à
// droite. Les mots sans famille n'ont pas de fil : ils restent dans la colonne des mots, rien ne les efface.
export default {
  id: 'fla4', titre: 'Des mots aux familles', chaleur: 'tiède', hop: 'nugget',
  etats: [{ nom: 'nelson-sauvin', hop: 'nelson-sauvin' }, { nom: 'cascade', hop: 'cascade' }],
  css: (p) => `
.${p}-tete4{display:flex;align-items:center;gap:8px;margin:0 0 2px}
.${p}-tete4 p{flex:1;margin:0;font-size:13px;color:#4a4a47;line-height:1.35}
.${p}-tete4 b{color:#1d1d1b}
.${p}-fil{display:block;margin:4px auto 0;overflow:visible}
`,
  fiche: (h, S) => {
    const p = 'fla4'; const SOMBRE = { berries: 1, spice: 1, resin: 1, herbal: 1 };
    const dits = h.mots;
    const RH = dits.length > 9 ? 31 : 38, W = 362, H = dits.length * RH + 14;
    const fams = [...new Set(dits.filter((w) => w.f).map((w) => w.f))];
    // Ordre des familles : la position moyenne de leurs mots (moins de croisements).
    const moy = (f) => { const ix = dits.map((w, i) => (w.f === f ? i : null)).filter((i) => i != null); return ix.reduce((a, b) => a + b, 0) / ix.length; };
    fams.sort((a, b) => moy(a) - moy(b));
    const nodes = [...fams, ...(dits.some((w) => !w.f) ? [null] : [])];
    const FH = Math.min(46, (H - 10) / Math.max(nodes.length, 1));
    const y0 = (H - FH * nodes.length) / 2;
    const fy = (f) => y0 + FH * nodes.indexOf(f) + FH / 2;
    let s = `<svg class="${p}-fil" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Les mots de ${S.esc(h.nom)} et leurs familles">`;
    dits.forEach((w, i) => {
      const y = 7 + RH * i + RH / 2, big = w.n === h.N && h.N > 1 || w.premier;
      const fs = big ? (w.m.length > 14 ? 17 : 20) : (w.m.length > 16 ? 14 : 16);
      const col = w.classeSeul ? '#6b6b68' : '#1d1d1b';
      s += `<text x="186" y="${y + fs * 0.35}" text-anchor="end" font-size="${fs}" font-weight="${big ? 700 : 520}" fill="${col}"${w.gen ? ' font-style="italic"' : ''}>${w.m}${w.classeSeul ? ' (classé)' : ''}</text>`;
      s += `<text x="194" y="${y + 4}" font-size="11" fill="#4a4a47">${w.n}/${h.N}</text>`;
      if (w.f) {
        const c = S.JETONS[w.f].base, yf = fy(w.f);
        s += `<path d="M218 ${y} C 246 ${y}, 236 ${yf}, 262 ${yf}" fill="none" stroke="${c}" stroke-opacity="${w.classeSeul ? 0.5 : 0.62}" stroke-width="${w.classeSeul ? 3 : 5 + 5 * w.n}"${w.classeSeul ? ' stroke-dasharray="3 3"' : ''} stroke-linecap="butt"/>`;
      } else s += `<path d="M218 ${y} h10" stroke="#9a9a96" stroke-width="2" stroke-dasharray="2 3"/>`;
    });
    nodes.forEach((f) => {
      const y = fy(f);
      if (f) s += `<rect x="256" y="${y - FH / 2 + 2}" width="106" height="${FH - 4}" rx="8" fill="${S.JETONS[f].base}"/><circle cx="273" cy="${y}" r="11" fill="#fff"/><svg data-famille="${f}" x="264" y="${y - 9}" width="18" height="18" viewBox="0 0 24 24" aria-label="${S.NOM[f]}"><use href="#p-${f}"/></svg><text x="288" y="${y + 5}" font-size="14" font-weight="700" fill="${SOMBRE[f] ? '#ffffff' : '#1d1d1b'}">${S.NOM[f]}</text>`;
      else s += `<circle cx="273" cy="${y}" r="8" fill="none" stroke="#8a8a86" stroke-width="2" stroke-dasharray="3 3"/><text x="286" y="${y + 5}" font-size="13" fill="#4a4a47">sans famille</text>`;
    });
    s += '</svg>';
    const nd = S.ORDRE.filter((f) => !h.radar[f].level).length;
    const hors = dits.filter((w) => !w.f).length;
    return `<div class="${p}-tete4">${S.radar(h, { r: 44, pad: 8, labels: false })}
      <p data-role="fiche-arome"><b>${dits.length} mots</b> dans ${h.N > 1 ? 'ses ' + h.N + ' fiches' : 'sa fiche'} ; <b>${hors}</b> sans famille, que le radar ne dessine pas.<br>${nd} familles non décrites : « ? » hachuré.</p></div>${s}`;
  },
};
