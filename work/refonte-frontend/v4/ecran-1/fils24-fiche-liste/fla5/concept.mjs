// fla5 · tiède · au style, en mots : les mots du houblon rangés face à la stout 16D (BJCP 2021 : terreux, herbacé
// ou floral attendus) et à ta dégustation (résineux trop marqué, 18.10). Un toucher sur « absolu » remet les mots
// dans l'ordre des fiches, sans le style.
const RESINEUX_TROP = 'resin';
export default {
  id: 'fla5', titre: 'Au style, en mots', chaleur: 'tiède', hop: 'nugget',
  etats: [{ nom: 'absolu', hop: 'nugget', geste: async (pg) => { await pg.tap('[data-role="fiche"]:not([hidden]) [data-fla5-e="absolu"]'); } }, { nom: 'nelson-sauvin', hop: 'nelson-sauvin' }],
  css: (p) => `
.${p}-tete{display:flex;align-items:center;gap:6px}
.${p}-ver{flex:1;font-size:14px;line-height:1.35;margin:0}.${p}-ver b{font-size:22px;display:inline-block;min-width:26px}
.${p}-ok{color:#1d1d1b}.${p}-alr{color:#c2410c;font-size:14px}
.${p}-lent{display:inline-flex;border:1px solid #cfcfcb;border-radius:999px;padding:2px;margin:2px 0 6px}.${p}-lent button{border:0;background:none;border-radius:999px;padding:3px 11px;font-size:13px;color:#4a4a47}.${p}-lent [aria-checked="true"]{background:#1d1d1b;color:#fff}
.${p}-z{display:grid;grid-template-columns:8px 1fr;gap:0 10px;margin:0 0 8px}
.${p}-zb{border-radius:4px}
.${p}-zt{font-size:13px;color:#3a3a38;margin:0 0 2px;display:flex;justify-content:space-between}
.${p}-zt span{color:#5d5d5a}
.${p}-ws{display:flex;flex-wrap:wrap;gap:4px 6px}
.${p}-w{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:4px 10px 4px 7px;font-size:16px;font-weight:600;border:1.5px solid transparent}
.${p}-w small{font-size:12px;font-weight:500;color:#4a4a47}
.${p}-pk{display:inline-flex;background:#fff;border-radius:50%;padding:2px}
.${p}-wh{border:1.5px dashed #9a9a96;background:#fff}
.${p}-wa{border-color:#c2410c;color:#c2410c}
.${p}-abs [data-zone]{display:none}.${p}-abs .${p}-tout{display:grid}.${p}-tout{display:none}
`,
  fiche: (h, S) => {
    const p = 'fla5'; const SOMBRE = { berries: 1, spice: 1, resin: 1 }, PALE = { herbal: 1 };
    const zone = (w) => (!w.f ? 'hors' : w.f === RESINEUX_TROP ? 'trop' : S.ATTENDUES_16D.includes(w.f) ? 'attendu' : 'tolere');
    const chip = (w, alerte) => `<span class="${p}-w${w.f ? '' : ' ' + p + '-wh'}${alerte ? ' ' + p + '-wa' : ''}"${w.f ? ` data-famille="${w.f}" style="background:${S.JETONS[w.f][w.classeSeul || PALE[w.f] || alerte ? 'fond' : 'base'] }"` : ''}>${w.f ? '<span class="' + p + '-pk">' + S.picto(w.f, 14) + '</span>' : ''}<span${w.f && !alerte ? ` style="color:${w.classeSeul || PALE[w.f] ? S.JETONS[w.f].texte : SOMBRE[w.f] ? '#fff' : '#1d1d1b'}"` : ''}>${w.m}${w.classeSeul ? ' (classé)' : ''}</span><small${w.f && !w.classeSeul && !alerte && SOMBRE[w.f] ? ' style="color:#fff"' : w.f && !w.classeSeul && !alerte && !PALE[w.f] ? ' style="color:#1d1d1b"' : ''}>${w.n}/${h.N}</small></span>`;
    const Z = [
      ['attendu', 'Ta stout 16D les attend', 'terreux, herbacé, floral', '#1d1d1b'],
      ['trop', 'Déjà trop marqué dans ta bière', 'ta dégustation 18.10', '#c2410c'],
      ['tolere', 'Le style les tolère, faibles', 'zone basse', '#bdbdb9'],
      ['hors', 'Le style n\'en dit rien', 'hors des 12', 'repeating-linear-gradient(0deg,#9a9a96 0 4px,#fff 4px 7px)'],
    ];
    const blocs = Z.map(([k, t, s, c]) => { const ws = h.mots.filter((w) => zone(w) === k); return ws.length ? `<div class="${p}-z" data-zone="${k}"><span class="${p}-zb" style="background:${c}"></span><div><p class="${p}-zt">${t}<span>${s}</span></p><div class="${p}-ws">${ws.map((w) => chip(w, k === 'trop')).join('')}</div></div></div>` : ''; }).join('');
    const na = h.mots.filter((w) => zone(w) === 'attendu').length, nt = h.mots.filter((w) => zone(w) === 'trop').length;
    return `<div class="${p}-tete">${S.radar(h, { r: 50, pad: 10, labels: false })}
      <p class="${p}-ver" data-role="fiche-arome"><span class="${p}-ok"><b>${na}</b> mots que ta stout attend</span><br><span class="${p}-alr"><b>${nt}</b> déjà trop marqués chez toi</span><br><span style="font-size:12px;color:#4a4a47">sur ${h.mots.length} mots, ${h.N > 1 ? h.N + ' fiches' : '1 fiche'}</span></p></div>
      <span class="${p}-lent" role="radiogroup" aria-label="Lecture des mots"><button role="radio" data-fla5-e="style" aria-checked="true">au style</button><button role="radio" data-fla5-e="absolu" aria-checked="false">absolu</button></span>
      <div class="${p}-zs">${blocs}<div class="${p}-z ${p}-tout"><span class="${p}-zb" style="background:#1d1d1b"></span><div><p class="${p}-zt">Tous les mots, par fiches<span>sans le style</span></p><div class="${p}-ws">${h.mots.map((w) => chip(w, false)).join('')}</div></div></div></div>`;
  },
  js: (p) => `document.querySelectorAll('[data-fla5-e]').forEach(function(b){b.addEventListener('click',function(){var g=b.parentNode;g.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-checked',String(x===b));});g.nextElementSibling.classList.toggle(P+'-abs',b.getAttribute('data-fla5-e')==='absolu');});});`,
};
