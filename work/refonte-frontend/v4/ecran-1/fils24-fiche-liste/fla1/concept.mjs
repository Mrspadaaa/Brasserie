// fla1 · froide · la liste g1 retournée : le mot en tête de ligne, la famille après. Les mots hors des 12 familles
// prennent leur ligne comme les autres (rond pointillé « hors radar »), le classement Hopsteiner se dit à part.
export default {
  id: 'fla1', titre: 'La liste g1, le mot d\'abord', chaleur: 'froide', hop: 'nugget',
  etats: [{ nom: 'nelson-sauvin', hop: 'nelson-sauvin' }, { nom: 'motueka', hop: 'motueka' }],
  css: (p) => `
.${p}-rz{display:flex;justify-content:center;margin:-4px 0 0}
.${p}-dem{text-align:center;font-size:13px;color:#3a3a38;margin:-6px 0 6px}.${p}-dem b{font-weight:650}
.${p}-bloc{background:#f4f4f2;border-radius:8px;padding:6px 10px 8px}
.${p}-tt{font-size:13px;color:#4a4a47;margin:2px 0 0;display:flex;justify-content:space-between}
.${p}-gh{display:flex;align-items:center;gap:5px;font-size:13px;color:#4a4a47;margin:8px 0 0}
.${p}-li{display:grid;grid-template-columns:1fr auto 44px;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #e6e6e3}
.${p}-li:last-of-type{border-bottom:0}
.${p}-m{font-size:17px;font-weight:620;letter-spacing:-.005em;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:5px}
.${p}-gen{font-weight:450;color:#4a4a47}
.${p}-un{font-size:12px;font-weight:600;background:#1d1d1b;color:#fff;border-radius:4px;padding:1px 5px;margin-left:6px;vertical-align:2px;text-decoration:none;display:inline-block}
.${p}-fam{display:flex;align-items:center;gap:4px;font-size:13px}
.${p}-ring{width:16px;height:16px;border-radius:50%;border:2px dashed #8a8a86;display:inline-block}
.${p}-n{display:flex;align-items:center;gap:3px;justify-content:flex-end;font-size:12px;color:#4a4a47}.${p}-n i{width:7px;height:7px;border-radius:50%;border:1.5px solid #1d1d1b;display:block}.${p}-n i.${p}-on{background:#1d1d1b}
.${p}-cl{font-size:13px;color:#3a3a38;margin:8px 0 0;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.${p}-nd{font-size:13px;color:#4a4a47;margin:6px 0 0;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
`,
  fiche: (h, S) => {
    const p = 'fla1';
    const dots = (w) => `<span class="${p}-n">${Array.from({ length: h.N }, (_, i) => `<i class="${i < w.n ? p + '-on' : ''}"></i>`).join('')}</span>`;
    const lignes = h.mots.filter((w) => !w.classeSeul);
    const premier = lignes.reduce((m, w) => (w.premier > (m?.premier || 0) ? w : m), null);
    const li = (w) => `<div class="${p}-li"${w.f ? ` data-famille="${w.f}"` : ''}><span class="${p}-m${w.gen ? ' ' + p + '-gen' : ''}" style="text-decoration-color:${w.f ? S.JETONS[w.f].base : '#b8b8b4'}">${w.m}${w === premier ? `<span class="${p}-un">1er</span>` : ''}</span>
      <span class="${p}-fam">${w.f ? `${S.picto(w.f, 16)}<span style="color:${S.JETONS[w.f].texte}">${S.NOM[w.f]}</span>` : ''}</span>${dots(w)}</div>`;
    const hors = lignes.filter((w) => !w.f), dans = lignes.filter((w) => w.f);
    const gh = (t) => `<p class="${p}-gh">${t}</p>`;
    const gHors = hors.length ? gh(`<span class="${p}-ring" aria-hidden="true"></span> hors radar`) + hors.map(li).join('') : '';
    const groupes = hors.length && (!dans.length || hors[0].n >= dans[0].n) ? [gHors, dans.length ? gh('dans le radar') + dans.map(li).join('') : ''] : [dans.map(li).join(''), gHors];
    const classes = h.mots.filter((w) => w.classeSeul);
    const nd = S.ORDRE.filter((f) => !h.radar[f].level);
    const dem = (f) => (h.radar[f].level ? `${h.radar[f].n}/${h.radar[f].of}` : '?');
    return `<div class="${p}-rz">${S.radar(h, { r: h.mots.length > 9 ? 58 : 70, pad: 40, fs: 12 })}</div>
      <p class="${p}-dem"><b>+ Floral</b> ${dem('floral')} &nbsp; <b>− Résineux</b> ${dem('resin')}</p>
      <div class="${p}-bloc" data-role="fiche-arome"><p class="${p}-tt"><span>Mots des ${h.N} fiche${h.N > 1 ? 's' : ''}</span><span>● une fiche</span></p>${groupes.join('')}
      ${classes.length ? `<p class="${p}-cl">Classé aussi : ${classes.map((w) => (w.f ? S.picto(w.f, 14) : `<span class="${p}-ring" aria-hidden="true"></span>`) + ' ' + w.m).join(' · ')}</p>` : ''}
      ${nd.length ? `<p class="${p}-nd">${nd.length} non décrites ${nd.map((f) => S.picto(f, 14)).join('')} ?</p>` : ''}</div>`;
  },
};
