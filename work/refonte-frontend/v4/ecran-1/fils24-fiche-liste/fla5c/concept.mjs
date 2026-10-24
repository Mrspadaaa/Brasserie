import { PAGE } from './page.mjs';
// fla5c · tiède · passe 3 légère de fla5b (critique PASSE2 : l'étape garde son en-tête ; la question et le contexte vivent dans la fiche).
// Reprend fla5b, passe 2 de fla5 (verdict du conseil fl, point 5) : au style, en mots, remis à l'endroit.
// Le radar g1 d'abord, à sa taille. Puis les étagères face à la stout 16D ; la plus pleine passe en tête, en grosses
// tuiles (greffe flc8) : sur Nelson Sauvin, « Le style n'en dit rien » (vin blanc, groseille à maquereau, raisin…).
// Aucun compteur en gros chiffre ; une étagère vide ne s'affiche pas. « (classé) » devient « rangé par le
// fournisseur ». La source « ta dégustation 18.10 » et le sens des étagères passent derrière le « ? ».
const RESINEUX_TROP = 'resin';
const SOMBRE = { berries: 1, spice: 1, resin: 1 }, PALE = { herbal: 1 };
const ZONES = [
  ['attendu', 'Ta stout 16D les attend', '#1d1d1b'],
  ['trop', 'Déjà trop marqué dans ta bière', '#c2410c'],
  ['tolere', 'Le style les tolère, faibles', '#bdbdb9'],
  ['hors', 'Le style n\'en dit rien', 'repeating-linear-gradient(0deg,#6b6b68 0 4px,#fff 4px 7px)'],
];

export default {
  id: 'fla5c', titre: 'Au style, en mots (passe 3)', chaleur: 'tiède', hop: 'nelson-sauvin',
  etats: [
    { nom: 'nelson', hop: 'nelson-sauvin' },
    { nom: 'nugget', hop: 'nugget' },
    { nom: 'nugget-absolu', hop: 'nugget', geste: async (pg) => { await pg.tap('.fla5c-feuille [data-fla5c-e="absolu"]'); } },
    { nom: 'nelson-aide', hop: 'nelson-sauvin', geste: async (pg) => { await pg.tap('.fla5c-feuille .fla5c-aideb'); } },
  ],
  css: (p) => `
.${p}-rz{display:flex;justify-content:center;margin:0 0 2px}
.${p}-bar{display:flex;align-items:center;gap:8px;margin:0 0 8px}
.${p}-lens{display:inline-flex;border:1px solid #cfcfcb;border-radius:999px;padding:2px}.${p}-lens button{border:0;background:none;border-radius:999px;padding:3px 11px;font-size:13px;color:#4a4a47}.${p}-lens [aria-checked="true"]{background:#1d1d1b;color:#fff}
.${p}-nf{flex:1;font-size:12px;color:#4a4a47;text-align:right}
.${p}-aideb{width:26px;height:26px;border-radius:50%;border:1px solid #bdbdb9;background:none;font-size:13px;color:#4a4a47;padding:0;flex:none}
.${p}-aide{font-size:13px;color:#3a3a38;background:#f6f6f4;border-radius:8px;padding:6px 10px;margin:0 0 8px}
.${p}-z{display:grid;grid-template-columns:6px 1fr;gap:0 10px;margin:0 0 10px}
.${p}-zb{border-radius:4px}
.${p}-zt{font-size:13px;color:#3a3a38;margin:0 0 4px;font-weight:600}
.${p}-ws{display:flex;flex-wrap:wrap;gap:5px 6px}
.${p}-w{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:4px 10px 4px 6px;font-size:16px;font-weight:600;border:1.5px solid transparent}
.${p}-w small{font-size:12px;font-weight:500}
.${p}-pk{display:inline-flex;background:#fff;border-radius:50%;padding:2px}
.${p}-wh{border:2px dashed #1d1d1b;background:#fff}
.${p}-wa{border-color:#c2410c;color:#c2410c}
.${p}-un{font-size:12px;font-weight:600;background:#1d1d1b;color:#fff;border-radius:4px;padding:1px 5px;margin-left:8px;vertical-align:4px;letter-spacing:0}
.${p}-t b .${p}-un{display:inline-block;font-size:12px;line-height:16px;vertical-align:5px}
.${p}-rf{font-size:12px;font-weight:500;color:#4a4a47}
.${p}-tu{display:grid;grid-template-columns:1fr 1fr;gap:6px;grid-auto-flow:dense}
.${p}-t{border-radius:8px;padding:8px 10px 9px;min-height:66px;display:flex;flex-direction:column;justify-content:space-between;border:2px solid transparent}
.${p}-t b{font-size:22px;line-height:1.1;letter-spacing:-.01em}.${p}-t.${p}-lg b{font-size:19px}
.${p}-t span{font-size:12px;display:flex;align-items:center;gap:4px}
.${p}-th{border:2.5px dashed #1d1d1b;background:#fff}
.${p}-t2{grid-column:span 2}
.${p}-abs [data-zone]{display:none}.${p}-abs .${p}-tout{display:grid}.${p}-tout{display:none}
`,
  fiche: (h, S) => {
    const p = 'fla5c';
    const zone = (w) => (!w.f ? 'hors' : w.f === RESINEUX_TROP ? 'trop' : S.ATTENDUES_16D.includes(w.f) ? 'attendu' : 'tolere');
    const couleurs = (w, alerte) => {
      if (!w.f) return { bg: '#fff', ink: '#1d1d1b' };
      if (alerte || w.classeSeul || PALE[w.f]) return { bg: S.JETONS[w.f].fond, ink: alerte ? '#c2410c' : S.JETONS[w.f].texte };
      return { bg: S.JETONS[w.f].base, ink: SOMBRE[w.f] ? '#fff' : '#1d1d1b' };
    };
    const premier = h.mots.filter((w) => !w.classeSeul).reduce((m, w) => (w.premier > (m ? m.premier : 0) ? w : m), null);
    const un = (w) => (w === premier ? `<span class="${p}-un">1er</span>` : '');
    const rang = (w) => (w.classeSeul ? `<span class="${p}-rf">rangé par le fournisseur</span>` : '');
    const chip = (w, alerte) => { const c = couleurs(w, alerte);
      return `<span class="${p}-w${w.f ? '' : ' ' + p + '-wh'}${alerte ? ' ' + p + '-wa' : ''}"${w.f ? ` data-famille="${w.f}"` : ''} style="background:${c.bg}">${w.f ? '<span class="' + p + '-pk">' + S.picto(w.f, 14) + '</span>' : ''}<span style="color:${c.ink}">${w.m}</span>${un(w)}<small style="color:${c.ink}">${w.n}/${h.N}</small>${rang(w)}</span>`; };
    const tuile = (w, alerte) => { const c = couleurs(w, alerte);
      return `<div class="${p}-t${w.f ? '' : ' ' + p + '-th'}${w.m.length > 16 ? ' ' + p + '-t2' : ''}${w.m.length > 11 ? ' ' + p + '-lg' : ''}"${w.f ? ` data-famille="${w.f}"` : ''} style="background:${c.bg}${alerte ? ';border-color:#c2410c' : ''}">
        <b style="color:${c.ink}">${w.m}${un(w)}</b><span style="color:${c.ink}">${w.f ? '<span class="' + p + '-pk">' + S.picto(w.f, 13) + '</span>' + S.NOM[w.f] + ' · ' : 'hors des 12 · '}${w.n}/${h.N}${w.classeSeul ? ' · rangé par le fournisseur' : ''}</span></div>`; };
    // Étagères non vides ; la plus pleine (somme des fiches qui disent ses mots) en tête, en tuiles.
    const poids = (k) => h.mots.filter((w) => zone(w) === k && !w.classeSeul).reduce((s, w) => s + w.n, 0);
    const pleines = ZONES.filter(([k]) => h.mots.some((w) => zone(w) === k));
    const tete = [...pleines].sort((a, b) => poids(b[0]) - poids(a[0]))[0];
    const ordre = [tete, ...pleines.filter((z) => z !== tete)];
    const blocs = ordre.map(([k, t, c], i) => { const ws = h.mots.filter((w) => zone(w) === k);
      return `<div class="${p}-z" data-zone="${k}"><span class="${p}-zb" data-role="zone" style="background:${c}"></span><div><p class="${p}-zt">${t}</p>${i === 0 ? `<div class="${p}-tu">${ws.map((w) => tuile(w, k === 'trop')).join('')}</div>` : `<div class="${p}-ws">${ws.map((w) => chip(w, k === 'trop')).join('')}</div>`}</div></div>`; }).join('');
    return { haut: `<div class="${p}-rz">${S.radar(h, { r: 62, pad: 40, fs: 12 })}</div>`, bas: `<div class="${p}-zs">${blocs}<div class="${p}-z ${p}-tout"><span class="${p}-zb" style="background:#1d1d1b"></span><div><p class="${p}-zt">Tous les mots, par fiches</p><div class="${p}-ws">${h.mots.map((w) => chip(w, false)).join('')}</div></div></div></div>` };
  },
  page: PAGE,
};
