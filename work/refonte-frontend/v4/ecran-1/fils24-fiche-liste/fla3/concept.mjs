// fla3 · tiède · la note de dégustation : les mots des fiches composés en une seule phrase, en grand, dans l'ordre où
// les fiches les disent ; la taille dit combien de fiches le disent, le trait sous le mot dit sa famille (pointillé :
// hors des 12). Le radar passe avant, en vignette à côté du nom.
export default {
  id: 'fla3', titre: 'La note de dégustation', chaleur: 'tiède', hop: 'nelson-sauvin',
  etats: [{ nom: 'motueka', hop: 'motueka' }, { nom: 'citra-cryo', hop: 'citra-cryo' }],
  entete: (h, S) => {
    const p = 'fla3';
    return `<header class="${p}-hd"><div class="${p}-hg">
      <h2>${S.esc(h.nom)} <span class="${p}-rep" aria-hidden="true">⊙</span></h2>
      <div data-role="fiche-alpha" class="${p}-al">α ${h.alpha.variete ? h.alpha.variete + " " : ""}<b>${S.fmt(h.alpha.min)}–${S.fmt(h.alpha.max)} %</b> <span>lot ${S.fmt(h.lot)} %</span></div>
      <div class="${p}-tags"><span class="${p}-us" data-role="usage">${h.usage}</span>${h.stock ? `<span class="${p}-st">${h.stock} g</span>` : `<span class="${p}-st ${p}-vide">épuisé</span>`}</div></div>
      <div class="${p}-rv">${S.radar(h, { r: 46, pad: 14, labels: false })}</div>
      <button class="${p}-x" data-role="fermer-fiche" aria-label="Fermer">✕</button></header>`;
  },
  css: (p) => `
.${p}-hd{display:flex;align-items:flex-start;gap:6px;position:relative}.${p}-hg{flex:1;min-width:0}
.${p}-hd h2{font-size:24px;margin:2px 0 0;letter-spacing:-.01em}.${p}-rep{font-size:16px;color:#6b6b68;font-weight:400}
.${p}-al{font-size:17px;margin-top:2px}.${p}-al b{font-size:21px}.${p}-al span{font-size:13px;color:#5d5d5a}
.${p}-tags{display:flex;gap:6px;margin-top:5px;align-items:center}.${p}-us{font-size:13px;border:1px solid #bdbdb9;border-radius:999px;padding:1px 9px;margin-left:0}
.${p}-st{font-size:12px;border:1px solid #c4c4c0;border-radius:4px;padding:0 4px;color:#4a4a47}.${p}-vide{border-style:dashed}
.${p}-rv{flex:none;margin-top:-4px}
.${p}-x{width:34px;height:34px;border-radius:50%;border:0;background:#ececea;font-size:16px;flex:none}
.${p}-cap{font-size:13px;color:#4a4a47;margin:10px 0 2px;display:flex;justify-content:space-between;border-top:1px solid #e6e6e3;padding-top:8px}
.${p}-note{font-family:Georgia,"Iowan Old Style","Times New Roman",serif;line-height:1.18;margin:6px 0 4px;color:#1d1d1b}
.${p}-w{text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:6px;text-decoration-skip-ink:none}
.${p}-g{font-size:var(--g);font-weight:700;letter-spacing:-.02em}.${p}-p{font-size:var(--p)}
.${p}-h{text-decoration-style:dotted;text-decoration-color:#8a8a86;text-decoration-thickness:3px}
.${p}-gen{font-style:italic;color:#5d5d5a}
.${p}-sep{color:#9a9a96;font-size:var(--p)}
.${p}-un{font-family:system-ui,sans-serif;font-size:11px;font-weight:600;background:#1d1d1b;color:#fff;border-radius:4px;padding:1px 4px;vertical-align:super;margin-left:3px}
.${p}-cle{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:#4a4a47;margin:12px 0 0;align-items:center}
.${p}-cle i{display:inline-block;width:18px;height:0;border-bottom:3px dotted #8a8a86;vertical-align:3px;margin-right:3px}
.${p}-fams{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;font-size:13px}.${p}-fams span{display:inline-flex;align-items:center;gap:3px}
`,
  fiche: (h, S) => {
    const p = 'fla3';
    const dits = h.mots.filter((w) => !w.classeSeul);
    const premier = dits.reduce((m, w) => (w.premier > (m?.premier || 0) ? w : m), null);
    const grand = (w) => w.n === h.N && h.N > 1 || (h.N === 1 && w === premier);
    const w = (x) => `<span class="${p}-w ${grand(x) ? p + '-g' : p + '-p'}${x.f ? '' : ' ' + p + '-h'}${x.gen ? ' ' + p + '-gen' : ''}"${x.f ? ` style="text-decoration-color:${S.JETONS[x.f].base}"` : ''}>${x.m}</span>${x === premier ? `<span class="${p}-un">1er</span>` : ''}`;
    const g = dits.filter(grand), pt = dits.filter((x) => !grand(x));
    const phrase = g.map(w).join('<span class="' + p + '-sep">, </span>') + (pt.length ? '<span class="' + p + '-sep"> — </span>' + pt.map(w).join('<span class="' + p + '-sep">, </span>') : '') + '<span class="' + p + '-sep">.</span>';
    const fams = [...new Set(h.mots.filter((x) => x.f).map((x) => x.f))];
    const classes = h.mots.filter((x) => x.classeSeul);
    return `<p class="${p}-cap" data-role="fiche-arome"><span>Ce que disent ${h.N > 1 ? 'les ' + h.N + ' fiches' : 'sa fiche'}</span><span>${h.N > 1 ? 'grand : ' + h.N + '/' + h.N : '1/1'}</span></p>
      <p class="${p}-note" style="--g:${dits.length <= 6 ? 54 : dits.length <= 9 ? 42 : 34}px;--p:${dits.length <= 6 ? 34 : dits.length <= 9 ? 27 : 23}px">${phrase}</p>
      ${classes.length ? `<p class="${p}-cle">Classé aussi : ${classes.map((x) => x.m).join(', ')}</p>` : ''}
      <div class="${p}-fams">${fams.map((f) => `<span data-famille="${f}">${S.picto(f, 15)}<span style="color:${S.JETONS[f].texte}">${S.NOM[f]}</span></span>`).join('')}${h.mots.some((x) => !x.f) ? `<span><i style="display:inline-block;width:18px;border-bottom:3px dotted #8a8a86;margin-right:3px"></i>hors des 12</span>` : ''}</div>`;
  },
};
