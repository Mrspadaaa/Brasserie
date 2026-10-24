// Lot 15, série p : génère p1 à p6 (pages statiques autonomes) depuis donnees/c1, c1b, c2, c3.json.
// Usage : node gen15.mjs [p1 p2 …]
import fs from 'node:fs';
const ROOT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const DIR = ROOT + '/work/refonte-frontend/v4/ecran-1/fils15-s5-complexe';
const PICTOS = fs.readFileSync(DIR + '/pictos-familles.html', 'utf8').match(/<svg id="pictos" [^>]*>[\s\S]*?<\/svg>/)[0];
const PACK = JSON.parse(fs.readFileSync(ROOT + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));
const S1 = PACK.scenarios.S1;
const cas = (id) => JSON.parse(fs.readFileSync(DIR + '/donnees/' + id + '.json', 'utf8'));

// ---------- Vocabulaire ----------
const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const F = {
  citrus: ['Agrumes', 'agrumes', '#d9b414', '#7a6200'], tropical: ['Fruits tropicaux', 'tropical', '#ee9b2f', '#8a4e00'],
  melon: ['Melon', 'melon', '#6fc09b', '#2f6b5f'], stoneFruit: ['Fruits à noyau', 'noyau', '#e88d68', '#8a3f22'],
  pomeFruit: ['Fruits à pépins', 'pépins', '#a3bd38', '#5a6a14'], berries: ['Petits fruits', 'petits fruits', '#9b3f74', '#6e2a52'],
  floral: ['Floral', 'floral', '#bf86d6', '#7a3f9b'], herbal: ['Herbacé aromatique', 'herbacé', '#3f8a5f', '#2b5f41'],
  resin: ['Boisé et résineux', 'résineux', '#2f6b5f', '#1f5247'], spice: ['Épicé', 'épicé', '#7a4e3a', '#5a3626'],
  green: ['Végétal vert', 'végétal', '#6aa33a', '#41691f'], earthy: ['Terreux', 'terreux', '#9a8a66', '#5f5236'],
};
const HOP = {
  'Golding': '#0072B2', 'Motueka': '#009E73', 'Aurum': '#CC79A7', 'East Kent Goldings': '#56B4E9', 'Columbus': '#E1D23A',
  'Citra cryo': '#882255', 'Nelson Sauvin': '#332288', 'Galaxy': '#999933', 'Hallertau Blanc': '#44AA99', 'Nugget': '#3a3a42',
  'Celeia': '#117733', 'Target': '#AA4499', 'Pekko': '#6699CC', 'HBC 472': '#3F9FD8', 'HBC 630': '#5c6bc0', 'Idaho 7': '#1b7f8c',
  'Cascade': '#b8336a', 'Hallertau (US)': '#2e8b57', 'Mount Hood': '#7b68ee', 'Aurora': '#4682b4', 'Saaz (CZ)': '#6b8e23',
  'Sasquatch': '#0072B2', 'Bravo': '#CC79A7', 'Sonnet': '#56B4E9', 'Barbe Rouge': '#882255',
};
const MOM = {
  b60: { t: '60′', c: '#5d4037' }, b10: { t: '10′', c: '#a1887f' }, wp: { t: 'whirlpool', c: '#1e88e5' },
  dryActive: { t: 'à cru, fermentation active', c: '#43a047' }, dryPost: { t: 'à cru, après fermentation', c: '#00897b' },
  levure: { t: 'levure', c: '#8e24aa' },
};
const VERDICT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune', inconnu: 'Inconnu' };
const r1 = (x) => Math.round((x + (x >= 0 ? 1e-9 : -1e-9)) * 10) / 10;
const fr = (x) => { const v = r1(x); const s = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(1).replace('.', ','); return (v < 0 ? '−' : '') + s; };
const sg = (x) => (x > 0 ? '+' : '') + fr(x);
const fT = (x) => r1(x).toFixed(1).replace('.', ',');
const pct = (x) => (Math.round(x * 100) / 100) + '%';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// La dégustation de S1 (résineux « marqué », 66–100) situe le résineux de c1, c1b et c2 (même recette).
const TAST = (() => { const b = S1.tolerance.biere.find((x) => x.family === 'resin'); const t = S1.tolerance.familles.find((x) => x.family === 'resin'); return { v: b.valeur, e: b.ecart, plage: b.ecartPlage, abs: [b.plage.min, b.plage.max], T: t.T }; })();
const apresTast = (v) => { const s = S1.voies.find((x) => x.label === v.libelle); const r = s && (s.ecartsApres || []).find((e) => e.family === 'resin'); return r ? { e: r.ecart, v: r.valeur } : null; };

// ---------- Modèle d'un cas ----------
function modele(id) {
  const d = cas(id);
  const tast = d.situee && ['c1', 'c1b', 'c2'].includes(id);
  const objs = d.objectifs.map((o) => ({ f: o.famille, sens: o.crans > 0 ? 1 : -1, cran: o.cran, largeur: o.largeur, bande: o.bande, visee: o.visee,
    avant: o.maBiere && o.maBiere.central != null ? o.maBiere.central : null, tast: tast && o.famille === 'resin' && o.crans < 0 }))
    .sort((a, b) => b.sens - a.sens || ORDRE.indexOf(a.f) - ORDRE.indexOf(b.f));
  const voies = d.voies.map((v, i) => ({ ...v, n: i + 1 }));
  const visees = new Set(objs.map((o) => o.f));
  for (const v of voies) {
    v.mom = v.actions[0] ? v.actions[0].momentId : 'levure';
    v.extras = v.tout.filter((t) => !visees.has(t.famille) && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille)).map((t) => {
      const niv = v.fiches.flatMap((h) => h.familles).filter((x) => x.famille === t.famille).map((x) => x.niveau);
      const hs = v.horsStyle.some((h) => h.family === t.famille) || (tast && t.famille === 'resin' && t.effet > 0);
      return { f: t.famille, e: t.effet, c: t.crans, w: t.bande[1] - t.bande[0], niv: t.effet < 0 ? 'baisse' : niv.includes('marqué') ? 'marqué' : niv.includes('cité') ? 'cité' : 'sans fiche', hs };
    });
    v.ecarte = (v.conflits || []).some((c) => /exclu par tes goûts/.test(c));
    v.ibuHors = (v.conflits || []).some((c) => /IBU/.test(c));
  }
  const slots = ORDRE.filter((f) => voies.some((v) => v.extras.some((x) => x.f === f)));
  // Verdict : meilleure voie houblon (hors levure) ; atteint, approche (moitié du chemin), aucune.
  for (const o of objs) {
    if (!d.situee) { o.verdict = 'inconnu'; continue; }
    const cand = voies.filter((v) => v.type !== 'levure' && !v.ecarte && v.effet[o.f] && v.effet[o.f].etabli);
    const A = o.tast ? TAST.v : o.avant;
    let best = null;
    for (const v of cand) { const e = v.effet[o.f].central; if (!best || (o.sens > 0 ? e > best.e : e < best.e)) best = { v, e }; }
    if (!best) { o.verdict = 'aucune'; continue; }
    const B = A + best.e;
    o.best = best; o.A = A; o.B = B;
    const atteint = o.sens > 0 ? B >= o.visee : B <= o.visee;
    o.verdict = atteint ? 'atteint' : Math.abs(B - o.visee) <= Math.abs(A - o.visee) / 2 ? 'approche' : 'aucune';
  }
  return { id, d, objs, voies, slots, tast };
}

// Effet d'une voie sur un objectif, au style : unités (crans, ou T pour le résineux dégusté) et texte.
function effet(m, o, v) {
  const x = v.effet[o.f];
  if (!x || !x.etabli || x.central == null) return null;
  const e = x.central;
  if (o.tast) { const ap = apresTast(v); return { e, u: e / TAST.T, txt: ap ? fT(TAST.e) + ' → ' + fT(ap.e) + ' T' : sg(e / TAST.T) + ' T', court: ap ? fT(TAST.e) + ' → ' + fT(ap.e) + ' T' : sg(e / TAST.T) + ' T', ea: TAST.e, ep: ap ? ap.e : '' }; }
  const seuil = 0.25 * o.largeur, n = Math.round(e / o.cran);
  const txt = Math.abs(e) < seuil || n === 0 ? '≈' : (n > 0 ? '+' : '−') + Math.abs(n) + ' cran' + (Math.abs(n) > 1 ? 's' : '');
  const hs = v.horsStyle.some((h) => h.family === o.f);
  return { e, u: e / o.cran, txt, court: txt, ea: m.d.situee ? 0 : '', ep: m.d.situee ? (hs ? '' : 0) : '', hs };
}

// ---------- Morceaux communs ----------
const ICON = {
  stock: '<svg class="stk" width="16" height="16" viewBox="0 0 18 18" aria-label="En stock"><rect x="2" y="5" width="14" height="11" rx="2" fill="#16161a"/><path d="M5 10.5 L8 13 L13 8" stroke="#fff" stroke-width="2" fill="none"/><rect x="4" y="2" width="10" height="3" rx="1" fill="#16161a"/></svg>',
  achat: '<svg class="stk" width="16" height="16" viewBox="0 0 18 18" aria-label="À acheter"><path d="M1 3 H4 L6 12 H14 L16 5 H5" fill="none" stroke="#16161a" stroke-width="2"/><circle cx="7" cy="15" r="1.6" fill="#16161a"/><circle cx="13" cy="15" r="1.6" fill="#16161a"/></svg>',
  manque: '<svg class="stk" width="16" height="16" viewBox="0 0 18 18" aria-label="Stock insuffisant"><rect x="2" y="5" width="14" height="11" rx="2" fill="none" stroke="#16161a" stroke-width="2"/><rect x="2" y="11" width="14" height="5" rx="1" fill="#16161a"/><rect x="4" y="2" width="10" height="3" rx="1" fill="#16161a"/></svg>',
};
const stockIco = (s) => (s === 'suffisant' ? ICON.stock : s === 'à acheter' ? ICON.achat : ICON.manque);
const MOMICO = {
  b60: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5 H12 V11 A2 2 0 0 1 10 13 H4 A2 2 0 0 1 2 11 Z" fill="currentColor"/><path d="M4 3 C4 2 5 2 5 1 M7 3 C7 2 8 2 8 1 M10 3 C10 2 11 2 11 1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  b10: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5 H12 V11 A2 2 0 0 1 10 13 H4 A2 2 0 0 1 2 11 Z" fill="currentColor"/><path d="M7 3 C7 2 8 2 8 1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  wp: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 7 m-5 0 a5 5 0 1 0 10 0 a3.5 3.5 0 1 0 -7 0 a2 2 0 1 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  dryActive: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="8" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="9" r="1.2" fill="currentColor"/><circle cx="8.5" cy="6.5" r="1" fill="currentColor"/><circle cx="6.5" cy="5" r=".8" fill="currentColor"/></svg>',
  dryPost: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="8" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 9 H9" stroke="currentColor" stroke-width="1.5"/></svg>',
  levure: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><ellipse cx="5.8" cy="8.4" rx="4.6" ry="4.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5.4" cy="8.6" r="1.5" fill="currentColor"/><path d="M9 5.2 C9.6 4.2 10.4 3.4 11.4 3.1" stroke="currentColor" stroke-width="1.3" fill="none"/><circle cx="11.3" cy="2.9" r="2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
};
const picto = (f, size = 18, cls = '', extra = '') => `<svg class="pi ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" ${extra} aria-label="${F[f][0]}"><use href="#p-${f}"/></svg>`;
function extraHtml(x) {
  const desc = F[x.f][0] + (x.e > 0 ? ' en plus' : ' en moins') + (x.niv === 'marqué' ? ', marqué dans les fiches' : x.niv === 'cité' ? ', cité par une fiche' : '') + (x.hs ? ', hors du style' : '');
  return `<span class="x ${x.niv === 'marqué' ? 'm' : x.niv === 'cité' ? 'c' : x.niv === 'baisse' ? 'b' : 's'}${x.hs ? ' hs' : ''}" title="${esc(desc)}"><svg data-role="extra" data-famille="${x.f}" width="18" height="18" viewBox="0 0 24 24" aria-label="${esc(desc)}"><use href="#p-${x.f}"/></svg></span>`;
}
function extrasSlots(m, v) {
  return `<span class="xs">${m.slots.map((f) => { const x = v.extras.find((y) => y.f === f); return x ? extraHtml(x) : '<span class="x vide"></span>'; }).join('')}</span>`;
}
// Biotransformation : signaux « possibles » en tendance hachurée, sans chiffre.
function bioHtml(v) {
  const s = (v.bio || []).flatMap((b) => b.signaux);
  if (!s.length) return '';
  const pos = (id) => s.find((x) => x.id === id && x.statut === 'possible');
  const parts = [];
  if (pos('geraniol-citronellol')) parts.push(`<span class="bio-s" title="${esc(pos('geraniol-citronellol').titre)} (possible)">${picto('floral', 15, '', 'data-famille="floral"')}<svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5 H9 M6 2 L9 5 L6 8" fill="none" stroke="#5b5b66" stroke-width="1.6" stroke-dasharray="2 1.5"/></svg>${picto('citrus', 15, '', 'data-famille="citrus"')}</span>`);
  if (pos('thiols')) parts.push(`<span class="bio-s" title="${esc(pos('thiols').titre)} (possible)">${picto('tropical', 15, '', 'data-famille="tropical"')}${picto('berries', 15, '', 'data-famille="berries"')}</span>`);
  if (pos('hop-creep')) parts.push(`<span class="bio-s" title="${esc(pos('hop-creep').titre)} (possible)"><svg width="16" height="16" viewBox="0 0 16 16" aria-label="Hop creep possible"><circle cx="5" cy="11" r="2.2" fill="none" stroke="#16161a" stroke-width="1.4"/><circle cx="10" cy="8" r="1.8" fill="none" stroke="#16161a" stroke-width="1.4"/><circle cx="7" cy="4" r="1.4" fill="none" stroke="#16161a" stroke-width="1.4"/><path d="M13 13 V3 M11 5 L13 3 L15 5" stroke="#16161a" stroke-width="1.4" fill="none"/></svg><span class="hc">hop creep</span></span>`);
  const nonEv = s.filter((x) => x.statut !== 'possible').length;
  return `<span class="bio" data-role="bio" aria-label="Biotransformation : ${s.filter((x) => x.statut === 'possible').map((x) => esc(x.titre)).join(' ; ')}${nonEv ? ' ; ' + nonEv + ' signal(s) non évaluable(s)' : ''}">${parts.join('')}${nonEv ? '<span class="bio-s ne" title="non évaluable">?</span>' : ''}</span>`;
}
const pastilles = (v) => {
  const hs = v.actions.length ? v.actions.map((a) => a.houblon) : [];
  if (!hs.length) return `<span class="pas lev" style="--h:${MOM.levure.c}"></span>`;
  return hs.map((h) => `<span class="pas" style="--h:${HOP[h] || '#555'}"></span>`).join('');
};
function nomVoie(v) {
  const a = v.actions;
  if (v.type === 'levure' && !a.length) return v.levureVers || v.libelle.replace(/^Changer de levure : /, '');
  if (v.type === 'remplacer à IBU égal') return a[0].houblon + ' ' + fr(a[0].grammes) + ' g';
  if (v.type === 'diminuer') return a[0].houblon + ' ' + fr(a[0].avant) + ' → ' + fr(a[0].grammes) + ' g';
  return a.map((x) => x.houblon).join(' + ');
}
function geste(v) {
  const a = v.actions, m = v.mom, g = a.map((x) => fr(x.grammes)).join(' + ');
  const ou = m === 'b60' || m === 'b10' ? 'à ' + MOM[m].t : m === 'wp' ? 'au whirlpool' : MOM[m].t;
  if (v.type === 'levure' && !a.length) return { k: 'levure', t: 'Changer de levure' };
  if (v.type === 'remplacer à IBU égal') return { k: 'rempl-' + m, t: 'Remplacer ' + (v.libelle.match(/Remplacer (.+?) par/) || [, ''])[1] + ' ' + ou };
  if (v.type === 'diminuer') return { k: 'dim-' + m, t: 'Diminuer ' + ou };
  if (v.type === 'retirer') return { k: 'ret-' + m, t: 'Retirer ' + ou };
  if (v.type === 'assemblage') return { k: 'ass-' + m + g, t: 'Assembler ' + g + ' g ' + ou };
  return { k: 'aj-' + m + g, t: g + ' g ' + ou };
}
function grouper(voies) {
  const gs = [];
  for (const v of voies) { const k = v.ecarte ? 'ecarte' : geste(v).k; let G = gs.find((x) => x.k === k); if (!G) { G = { k, t: v.ecarte ? null : geste(v).t, mom: v.mom, voies: [] }; gs.push(G); } G.voies.push(v); }
  return gs;
}

const CSS_BASE = `
  :root { --encre: #16161a; --gris: #5b5b66; --gris2: #6e6e78; --trait: #dcdce3; --fond: #f6f6f9; --acc: #c2410c;
    --atteint: #15803d; --approche: #4f46e5; --aucune: #475569; --inconnu: #6b7280; --gut: 22px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  [hidden] { display: none !important; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 8px 16px 24px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 8px; height: 36px; }
  .retour { width: 28px; height: 28px; position: relative; flex: none; }
  .retour::before { content: ''; position: absolute; left: 10px; top: 9px; width: 9px; height: 9px; border-left: 2px solid var(--encre); border-bottom: 2px solid var(--encre); transform: rotate(45deg); }
  .seg { display: flex; background: #ececf1; border-radius: 16px; padding: 2px; flex: 1; }
  .seg button { flex: 1; height: 28px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 650; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .outils { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
  .outils .seg { flex: none; }
  .outils .seg button { padding: 0 12px; }
  .lentille button[aria-checked="true"] { color: #fff; background: var(--encre); }

  /* Réponses : une rangée par objectif, sa piste au style */
  .reps { display: flex; flex-direction: column; gap: 6px; }
  .obj { border-radius: 16px; padding: 8px 10px 8px; background: color-mix(in srgb, var(--c) 15%, #fff); }
  .obj .l1 { display: flex; align-items: center; gap: 8px; min-height: 26px; }
  .obj .nom { font-size: 14px; font-weight: 750; color: var(--cf); }
  .rep { margin-left: auto; font-size: 19px; font-weight: 800; letter-spacing: -.01em; display: inline-flex; align-items: baseline; gap: 5px; }
  .rep small { font-size: 13px; font-weight: 700; }
  .v-atteint { color: var(--atteint); } .v-approche { color: var(--approche); } .v-aucune { color: var(--aucune); } .v-inconnu { color: var(--inconnu); }
  .hors { position: absolute; left: 4px; top: 50%; transform: translateY(-50%); z-index: 2; height: 24px; padding: 0 8px; border-radius: 12px; background: #fff; font-size: 12px; font-weight: 750; color: var(--aucune); box-shadow: inset 0 0 0 1.5px var(--aucune); white-space: nowrap; flex: none; }
  .mp { position: relative; height: 18px; margin: 6px 0 2px; border-radius: 9px; background: rgba(255,255,255,.85); }
  .mp .zone { position: absolute; top: 0; bottom: 0; left: var(--s0); width: var(--s1); border-radius: 9px; background: repeating-linear-gradient(90deg, transparent 0 calc(33.333% - 1px), rgba(255,255,255,.95) calc(33.333% - 1px) 33.333%), color-mix(in srgb, var(--c) 42%, #fff); }
  .mp .vi { position: absolute; top: -4px; bottom: -4px; left: var(--s); border-left: 2.5px dashed var(--encre); }
  .mp .moi { position: absolute; top: 2px; width: 14px; height: 14px; margin-left: -7px; left: var(--s); border-radius: 50%; background: var(--encre); box-shadow: 0 0 0 2px #fff; }
  .mp .moi.hs { background: var(--acc); }
  .mp .pl { position: absolute; top: 4px; height: 10px; left: var(--s0); width: var(--s1); border-radius: 5px; background: color-mix(in srgb, var(--acc) 30%, #fff); box-shadow: inset 0 0 0 1.2px var(--acc); }
  .mp .bv { position: absolute; top: 1px; width: 16px; height: 16px; margin-left: -8px; left: var(--s); border-radius: 50%; background: var(--h); box-shadow: 0 0 0 2px #fff, 0 2px 5px rgba(0,0,0,.3); }
  .mp .ns { position: absolute; inset: 0; border-radius: 9px; background: repeating-linear-gradient(135deg, transparent 0 4px, rgba(107,114,128,.35) 4px 6px); display: grid; place-items: center; font-size: 12px; font-weight: 800; color: var(--inconnu); }
  .mp .ns span { background: #fff; padding: 0 6px; border-radius: 6px; }

  /* Voies */
  .groupe { display: flex; align-items: center; gap: 6px; height: 28px; font-size: 13px; font-weight: 750; position: relative; }
  .groupe .t { display: inline-flex; align-items: center; gap: 5px; background: #fff; padding: 2px 8px 2px 6px; border-radius: 9px; box-shadow: inset 0 0 0 1.5px var(--mc); color: var(--mf, var(--encre)); }
  .groupe .t svg { color: var(--mc); }
  .rang { position: relative; padding: 0 0 8px 8px; }
  .rang::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 10px; width: 4px; border-radius: 2px; background: var(--mc); }
  .lbl { position: relative; display: flex; align-items: center; gap: 4px; min-height: 22px; font-size: 14px; }
  .lbl b { font-weight: 700; background: rgba(255,255,255,.92); padding: 0 5px; border-radius: 6px; white-space: nowrap; }
  .lbl .stk { flex: none; margin-left: 4px; }
  .pas { width: 12px; height: 12px; border-radius: 50%; background: var(--h); flex: none; box-shadow: 0 0 0 2px #fff; }
  .pas + .pas { margin-left: -6px; }
  .pas.lev { border-radius: 4px; }
  .xs { display: inline-flex; gap: 2px; margin-left: auto; }
  .x { position: relative; width: 20px; height: 20px; display: grid; place-items: center; border-radius: 50%; flex: none; }
  .x.vide { width: 12px; }
  .x svg { display: block; }
  .x.c svg use { opacity: .38; }
  .x.b { background: #fff; box-shadow: inset 0 0 0 1.5px #b5b5c0; }
  .x.b svg { transform: scale(.8); }
  .x.b::after { content: ''; position: absolute; right: -3px; bottom: 0; width: 9px; height: 4px; border-radius: 2px; background: var(--encre); box-shadow: 0 0 0 1.5px #fff; }
  .x.s svg use { opacity: .75; }
  .x.hs { box-shadow: 0 0 0 2px var(--acc); }
  .bio { display: inline-flex; gap: 3px; align-items: center; padding: 1px 5px; border-radius: 10px; background: repeating-linear-gradient(135deg, #fff 0 4px, #e5e5ec 4px 7px); box-shadow: inset 0 0 0 1.2px #a3a3ad; margin-left: 4px; }
  .bio-s { display: inline-flex; align-items: center; gap: 1px; }
  .bio-s .pi use { opacity: .6; }
  .bio-s.ne { font-size: 12px; font-weight: 800; color: var(--gris2); }
  .conf { flex: none; }
  .ecarte .lbl b { text-decoration: line-through; color: var(--gris2); }
  .ecarte .bars, .ecarte .ln { opacity: .45; }
  .abs-only { display: none; }
  body.abs .abs-only { display: inline; }
  body.abs .sty-only { display: none; }
  details { border-radius: 14px; background: var(--fond); padding: 10px 12px; }
  summary { font-size: 14px; font-weight: 700; cursor: pointer; }
  details ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  details .src { color: var(--gris2); font-size: 12px; }
  .cle { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--gris); flex-wrap: wrap; }
  .cle span { display: inline-flex; align-items: center; gap: 3px; }
`;

const chrome = () => `
  <div class="barre"><button class="retour" aria-label="Retour"></button>
    <div class="seg" role="radiogroup" aria-label="Partie"><button role="radio" aria-checked="false">Ma bière</button><button role="radio" aria-checked="true">Suggestions</button><button role="radio" aria-checked="false">Comparer</button></div></div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">Barres</button><button role="radio" aria-checked="false">Radar</button></div></div>`;
const SCRIPT = `<script>
  document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  document.querySelectorAll('[data-ouvre]').forEach((b) => b.addEventListener('click', () => {
    const c = document.getElementById(b.dataset.ouvre); c.hidden = !c.hidden; b.setAttribute('aria-expanded', String(!c.hidden));
  }));
</script>`;
function page(m, titre, commentaire, css, corps) {
  return `<!doctype html>
<html lang="fr" data-cas="${m.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
<style>${CSS_BASE}${css}</style>
</head>
<body>
${PICTOS}
<main class="ecran">${chrome()}
${corps}
</main>
${SCRIPT}
</body>
</html>
`;
}

// Mini piste au style d'un objectif : zone du style à 62 %, l'au-dessus en T (8 T).
function miniPiste(m, o) {
  const [lo, hi] = o.bande;
  const sx = (v) => (v <= hi ? 62 * (v - lo) / (hi - lo) : 62 + (v - hi) / 3 * 0);
  let h = `<div class="mp" data-role="piste" data-famille="${o.f}"><div class="zone" data-role="zone" style="--s0:0%;--s1:62%;--a0:${pct(lo)};--a1:${pct(hi - lo)}"></div>`;
  if (!m.d.situee) return h + `<div class="ns"><span>non situé</span></div></div>`;
  if (o.tast) {
    const p = (t) => 62 + clamp(t, 0, 8) * 4.75;
    h += `<div class="pl" style="--s0:${pct(p(TAST.plage[0]))};--s1:${pct(p(TAST.plage[1]) - p(TAST.plage[0]))};--a0:${pct(TAST.abs[0])};--a1:${pct(TAST.abs[1] - TAST.abs[0])}"></div>`;
    h += `<div class="vi" style="--s:62%;--a:${pct(o.visee)}"></div><div class="moi hs" style="--s:${pct(p(TAST.e))};--a:${pct(TAST.v)}"></div>`;
    if (o.best) { const ap = apresTast(o.best.v); if (ap) h += `<div class="bv" style="--h:${HOP[o.best.v.actions[0].houblon]};--s:${pct(p(ap.e))};--a:${pct(ap.v)}"></div>`; }
    return h + '</div>';
  }
  h += `<div class="vi" style="--s:${pct(sx(o.visee))};--a:${pct(o.visee)}"></div><div class="moi" style="--s:${pct(sx(o.avant))};--a:${pct(o.avant)}"></div>`;
  if (o.best) h += `<div class="bv" style="--h:${HOP[o.best.v.actions[0].houblon]};--s:${pct(sx(Math.min(o.B, hi)))};--a:${pct(o.B)}"></div>`;
  return h + '</div>';
}
const CSS_MP_ABS = `
  body.abs .mp .zone, body.abs .mp .pl { left: var(--a0); width: var(--a1); background-image: none; }
  body.abs .mp .vi, body.abs .mp .moi, body.abs .mp .bv { left: var(--a); }
`;
function reponses(m, opts = {}) {
  return `<div class="reps">${m.objs.map((o) => {
    const v = o.verdict;
    const mot = v === 'aucune' ? 'Aucune<small>voie houblon</small>' : VERDICT[v];
    const hors = v === 'aucune' && (m.d.horsModele || []).some((h) => h.famille === o.f) ? `<button class="hors" onclick="document.getElementById('hh').open=true;document.getElementById('hh').scrollIntoView({behavior:'smooth'})">Hors houblon ›</button>` : '';
    return `<section class="obj" data-role="objectif" data-famille="${o.f}" style="--c:${F[o.f][2]};--cf:${F[o.f][3]}" aria-label="${(o.sens > 0 ? 'Plus ' : 'Moins ') + F[o.f][1]} : ${VERDICT[v]}">
      <div class="l1">${picto(o.f, 22)}<span class="nom">${(o.sens > 0 ? 'Plus ' : 'Moins ') + F[o.f][1]}</span><span class="rep v-${v}" data-role="reponse" data-famille="${o.f}" data-verdict="${v}">${mot}</span></div>
      ${opts.sansPiste ? hors : miniPiste(m, o).replace(/<\/div>$/, hors + '</div>')}</section>`;
  }).join('')}</div>`;
}
function plis(m) {
  const ibu = m.voies.map((v) => `${nomVoie(v)} (${MOM[v.mom].t}) ${fr(v.ibu.after)}`).join(' · ');
  let h = `<details><summary>IBU après chaque voie (ma bière ${fr(m.d.ibu)} ; style ${m.d.bandeIbu.join('–')})</summary><ul><li>${ibu}</li></ul></details>`;
  const bio = m.voies.filter((v) => (v.bio || []).length);
  if (bio.length) h += `<details><summary>Biotransformation (sans chiffre)</summary><ul>${bio.map((v) => v.bio.map((b) => `<li><b>${b.houblon}, ${b.moment}</b> : ${b.signaux.map((s) => s.titre + ' (' + s.statut + ')').join(' ; ')}</li>`).join('')).join('')}</ul></details>`;
  for (const hm of m.d.horsModele || []) h += `<details id="hh"><summary>Hors houblon · ${F[hm.famille][1]} (${hm.pistes.length} pistes)</summary><ul>${hm.pistes.map((p) => `<li><b>${p.titre}</b> : ${p.action} <span class="src">${p.preuve}</span></li>`).join('')}</ul></details>`;
  return h;
}

// Intensité au style d'après le moteur (tout[].crans) ; usage du houblon (fiches[].role).
const cransAttr = (v, f) => { const t = v.tout.find((x) => x.famille === f); return t && t.crans != null ? ` data-crans="${t.crans}"` : ''; };
const cransTxt = (x) => { if (Math.abs(x.e) < 0.25 * x.w) return '≈'; const n = Math.round(x.c); return n === 0 ? '≈' : (n > 0 ? '+' : '−') + Math.abs(n); };
function extraPill(x) {
  const desc = F[x.f][0] + ' ' + (x.e > 0 ? '+' : '−') + fr(Math.abs(x.c)).replace('−', '') + ' cran' + (x.niv === 'marqué' ? ', marqué dans les fiches' : x.niv === 'cité' ? ', cité par une fiche' : '') + (x.hs ? ', hors du style' : '');
  return `<span class="xp ${x.niv === 'marqué' ? 'm' : x.niv === 'cité' ? 'c' : x.niv === 'baisse' ? 'b' : 's'}${x.hs ? ' hs' : ''}" data-famille="${x.f}" data-crans="${x.c}" title="${esc(desc)}" style="--c:${F[x.f][2]};--cf:${F[x.f][3]}"><svg data-role="extra" data-famille="${x.f}" width="16" height="16" viewBox="0 0 24 24" aria-label="${esc(desc)}"><use href="#p-${x.f}"/></svg><em>${cransTxt(x)}</em></span>`;
}
const USAGE_ICO = {
  amer: (plein) => `<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.2 C9 5, 12 7, 12 9.5 A5 5 0 0 1 2 9.5 C2 7, 5 5, 7 1.2 Z" fill="${plein ? '#16161a' : '#fff'}" stroke="#16161a" stroke-width="1.4"/></svg>`,
  arome: (plein) => `<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9 C4 4, 10 4, 12 9" fill="none" stroke="#16161a" stroke-width="2" ${plein ? '' : 'stroke-dasharray="2 1.6"'}/><circle cx="7" cy="10.5" r="2" fill="${plein ? '#16161a' : '#fff'}" stroke="#16161a" stroke-width="1.3"/></svg>`,
};
function usageHtml(v) {
  return v.fiches.map((h) => {
    const u = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle', plein = src === 'fournisseur';
    const ico = u === 'amérisant' ? USAGE_ICO.amer(plein) : u === 'aromatique' ? USAGE_ICO.arome(plein) : u === 'double' ? USAGE_ICO.amer(plein) + USAGE_ICO.arome(plein) : '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="#8a8f99" stroke-width="1.4" stroke-dasharray="2 1.5"/></svg>';
    const t = h.houblon + ' : ' + (u === 'double' ? 'double usage' : u) + (plein ? ' (fournisseur)' : u === 'inconnu' ? '' : ' (déduit de l’α, règle à valider)');
    return `<span class="usage${plein ? '' : ' regle'}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${esc(h.houblon)}" title="${esc(t)}" aria-label="${esc(t)}">${ico}</span>`;
  }).join('');
}
const CSS_INT = `
  .usage { display: inline-flex; align-items: center; gap: 0; padding: 1px 3px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px #c9c9d3; flex: none; }
  .usage.regle { opacity: .55; box-shadow: inset 0 0 0 1px #d9d9e0; }
  .ext { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
  .xp { display: inline-flex; align-items: center; gap: 2px; height: 22px; padding: 0 6px 0 3px; border-radius: 11px; background: color-mix(in srgb, var(--c) 18%, #fff); }
  .xp em { font-style: normal; font-size: 12px; font-weight: 800; color: var(--cf); }
  .xp.c { background: color-mix(in srgb, var(--c) 8%, #fff); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 30%, #fff); }
  .xp.c svg use { opacity: .45; } .xp.c em { opacity: .7; }
  .xp.b { background: #fff; box-shadow: inset 0 0 0 1.2px #b5b5c0; }
  .xp.b em { color: var(--gris); }
  .xp.hs { box-shadow: inset 0 0 0 2px var(--acc); }
  .xp.hs em { color: var(--acc); }
`;

// ---------- s5 sur un cas (p1, p2, p3, p6) ----------
// Une ligne par voie ; au centre ma bière ; une voie par objectif ; ce qui monte à droite, ce qui baisse à gauche ;
// plein dans le sens voulu, creux à contre-sens ; non établi hachuré.
function s5(m, opt) {
  const R = opt.R, L = opt.L, AR = opt.AR, AL = opt.AL;
  const N = m.objs.length;
  const lane = (o, v, cote) => {
    const ef = effet(m, o, v);
    const voulu = o.sens > 0 ? 'd' : 'g';
    if (!ef) return cote === voulu ? `<i class="ln inc" data-role="effet" data-famille="${o.f}" data-ecart-avant="${o.tast ? TAST.e : m.d.situee ? 0 : ''}" data-ecart-apres="" style="--c:${F[o.f][2]}"></i>` : '<i class="ln"></i>';
    const c = ef.e > 0 ? 'd' : 'g';
    if (c !== cote) return '<i class="ln"></i>';
    const sc = cote === 'd' ? R : L, asc = cote === 'd' ? AR : AL;
    const w = clamp(Math.abs(ef.u) / sc * 100, 0.8, 100), wa = clamp(Math.abs(ef.e) / asc * 100, 0.8, 100);
    const deb = Math.abs(ef.u) > sc;
    return `<i class="ln"><b class="bar${c !== voulu ? ' contre' : ''}${deb ? ' deb' : ''}${ef.hs ? ' hs' : ''}" data-role="effet" data-famille="${o.f}"${cransAttr(v, o.f)} data-ecart-avant="${ef.ea}" data-ecart-apres="${ef.ep}" style="--c:${F[o.f][2]};--s:${pct(w)};--a:${pct(wa)}"></b>${v.__lab ? `<em class="val" style="--s:${pct(w)};--a:${pct(wa)};--cf:${F[o.f][3]}"><span class="sty-only">${ef.court}</span><span class="abs-only">${sg(ef.e)}</span></em>` : ''}</i>`;
  };
  const rang = (v) => {
    const extrasG = opt.extrasGauche ? `<span class="xg">${m.slots.map((f) => { const x = v.extras.find((y) => y.f === f); return x ? extraHtml(x) : '<span class="x vide"></span>'; }).join('')}</span>` : '';
    const conf = v.ecarte ? `<svg class="conf" width="16" height="16" viewBox="0 0 16 16" aria-label="${esc(v.conflits.join(' '))}"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#16161a" stroke-width="1.6"/><path d="M3.5 12.5 L12.5 3.5" stroke="#16161a" stroke-width="1.6"/></svg>`
      : v.ibuHors ? `<svg class="conf" width="16" height="16" viewBox="0 0 16 16" aria-label="${esc(v.conflits.join(' '))}"><path d="M8 1.5 L15 14 H1 Z" fill="#c2410c"/><path d="M8 6 V9.5" stroke="#fff" stroke-width="1.8"/><circle cx="8" cy="11.8" r="1" fill="#fff"/></svg>`
      : (v.conflits || []).length ? `<svg class="conf" width="16" height="16" viewBox="0 0 16 16" aria-label="${esc(v.conflits.join(' '))}"><path d="M8 1.5 L15 14 H1 Z" fill="#8a8f99"/><path d="M8 6 V9.5" stroke="#fff" stroke-width="1.8"/><circle cx="8" cy="11.8" r="1" fill="#fff"/></svg>` : '';
    return `<div class="rang${v.ecarte ? ' ecarte' : ''}" data-voie="${v.n}" style="--mc:${MOM[v.mom].c}">
      <div class="lbl">${pastilles(v)}<b>${nomVoie(v)}</b>${opt.plus ? usageHtml(v) + (STKM[v.stock] && v.actions.length ? STKM[v.stock] : '') : ''}${conf}${opt.plus ? '' : bioHtml(v)}${opt.extrasGauche || opt.plus ? '<span class="xs"></span>' : extrasSlots(m, v)}${opt.plus ? `<button class="add2" data-role="ajouter-comparer" aria-pressed="${AJOUTEES.includes(v.n)}" aria-label="${AJOUTEES.includes(v.n) ? 'Retirer de' : 'Ajouter à'} Comparer : ${esc(nomVoie(v))}">${PLUS}${COCHE}</button>` : stockIco(v.stock)}</div>
      <div class="bars" style="--n:${N}">${extrasG}<div class="m g">${m.objs.map((o) => lane(o, v, 'g')).join('')}</div><div class="gt"></div><div class="m d">${m.objs.map((o) => lane(o, v, 'd')).join('')}</div></div>${opt.plus && (v.extras.length || (v.bio || []).length) ? `<div class="ext">${v.extras.map(extraPill).join('')}${bioHtml(v)}</div>` : ''}
    </div>`;
  };
  // Fonds : zone du style, visées, colonne de ma bière.
  const viseeLines = m.objs.filter((o) => m.d.situee && o.visee != null).map((o) => {
    if (o.tast) return `<div class="vl g" style="--s:${pct(TAST.e / L * 100)};--a:${pct((TAST.v - o.visee) / AL * 100)};--cf:${F[o.f][3]}"></div>`;
    const gap = Math.abs(o.visee - o.avant);
    return `<div class="vl ${o.sens > 0 ? 'd' : 'g'}" style="--s:${pct(gap / o.cran / (o.sens > 0 ? R : L) * 100)};--a:${pct(gap / (o.sens > 0 ? AR : AL) * 100)};--cf:${F[o.f][3]}"></div>`;
  }).join('');
  const zoneG = m.objs.find((o) => o.tast) ? `<div class="flou" style="--s0:${pct(TAST.plage[0] / L * 100)};--s1:${pct((TAST.plage[1] - TAST.plage[0]) / L * 100)}"></div><div class="zone g" data-role="zone" style="--s:${pct(100 - TAST.e / L * 100)};--a:${pct(100 - (TAST.v - 30) / AL * 100)}"></div>` : '';
  const zoneD = m.d.situee ? `<div class="zone d" data-role="zone" style="--s:100%;--a:100%"></div>` : '';
  const groupes = grouper(m.voies.filter((v) => !opt.cacher || !opt.cacher.includes(v.n)));
  for (const G of groupes) G.voies.forEach((v, i) => { v.__lab = i === 0; });
  const corps = groupes.map((G) => {
    const t = G.k === 'ecarte' ? `<span class="t" style="--mc:#16161a"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#16161a" stroke-width="1.6"/><path d="M3.5 12.5 L12.5 3.5" stroke="#16161a" stroke-width="1.6"/></svg>Écartées${m.d.bannis.filter((b) => b.type === 'famille').map((b) => picto(b.id, 16)).join('')}</span>`
      : `<span class="t" style="--mc:${MOM[G.mom].c}">${MOMICO[G.mom]}${G.t}${G.voies.some((v) => v.estime) ? ' <span class="est">estimé</span>' : ''}</span>`;
    return `<div class="groupe">${t}</div>${G.voies.map(rang).join('')}`;
  }).join('');
  const tete = `<div class="tete"><div class="m g">${m.objs.filter((o) => o.sens < 0).map((o) => picto(o.f, 18)).join('')}${opt.extrasGauche ? '<span class="autres">autres</span>' : ''}<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M9 2 L4 6 L9 10" fill="none" stroke="#16161a" stroke-width="2"/></svg></div><div class="gt">${opt.sansBiere ? '' : `<span class="biere-l">${m.d.situee ? 'ma bière' : 'ma bière ?'}</span>`}</div><div class="m d"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2 L8 6 L3 10" fill="none" stroke="#16161a" stroke-width="2"/></svg>${m.objs.filter((o) => o.sens > 0).map((o) => picto(o.f, 18)).join('')}</div></div>`;
  return `<div class="graph${m.d.situee ? '' : ' ns'}">
    <div class="fonds"><div class="moitie g" ${opt.pisteG ? `data-role="piste" data-famille="${opt.pisteG}"` : ''}>${zoneG}${viseeLines.split('</div>').filter((x) => x.includes('vl g')).map((x) => x + '</div>').join('')}</div><div class="gt"></div><div class="moitie d">${zoneD}${viseeLines.split('</div>').filter((x) => x.includes('vl d')).map((x) => x + '</div>').join('')}</div></div>
    ${tete}${corps}<div style="height:6px"></div></div>`;
}
const CSS_S5 = `
  .graph { position: relative; }
  .fonds { position: absolute; inset: 30px 0 0 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; border-radius: 12px; overflow: hidden; background: #f4f4f7; }
  .graph .gt { width: var(--gut); flex: none; position: relative; }
  .fonds .gt::before { content: ''; position: absolute; top: 0; bottom: 0; left: 8px; width: 6px; border-radius: 3px; background: var(--encre); }
  .graph.ns .fonds .gt::before { background: repeating-linear-gradient(180deg, var(--inconnu) 0 5px, transparent 5px 9px); }
  .moitie .zone { position: absolute; top: 0; bottom: 0; }
  .moitie .zone.g { left: 0; width: var(--s); background: color-mix(in srgb, #2f6b5f 30%, #fff); }
  .moitie .zone.d { left: 0; width: var(--s); background: color-mix(in srgb, #bf86d6 12%, #fff); }
  .moitie .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(90deg, color-mix(in srgb, #2f6b5f 22%, transparent), transparent); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px dashed var(--cf); }
  .vl.d { left: var(--s); } .vl.g { right: var(--s); }
  body.abs .vl.d { left: var(--a); } body.abs .vl.g { right: var(--a); }
  body.abs .moitie .zone { width: var(--a); }
  body.abs .moitie .flou { display: none; }
  .tete { position: relative; display: flex; height: 30px; align-items: center; }
  .tete .m { flex: 1; display: flex; align-items: center; gap: 3px; }
  .tete .m.g { justify-content: flex-end; padding-right: 4px; }
  .tete .m.d { padding-left: 4px; }
  .tete .autres { font-size: 12px; font-weight: 700; color: var(--gris); margin-right: 2px; }
  .biere-l { position: absolute; top: 4px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 700; background: var(--encre); color: #fff; padding: 2px 8px; border-radius: 10px; white-space: nowrap; z-index: 2; }
  .graph.ns .biere-l { background: var(--inconnu); }
  .groupe { padding-left: 6px; }
  .bars { position: relative; display: flex; height: calc(var(--n) * 13px + (var(--n) - 1) * 2px + 4px); }
  .bars .m { position: relative; flex: 1; display: flex; flex-direction: column; gap: 2px; padding-top: 2px; }
  .ln { position: relative; height: 13px; display: block; }
  .bar { position: absolute; top: 2px; height: 9px; width: var(--s); background: var(--c); min-width: 3px; }
  .m.d .bar { left: 0; border-radius: 0 4px 4px 0; }
  .m.g .bar { right: 0; border-radius: 4px 0 0 4px; }
  body.abs .bar { width: var(--a); }
  .bar.contre { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.deb.m, .m.d .bar.deb { border-radius: 0; }
  .m.d .bar.deb { width: calc(100% - 8px); }
  .m.d .bar.deb::after { content: ''; position: absolute; right: -6px; top: -2px; border: 6px solid transparent; border-right: 0; border-left: 6px solid var(--c); }
  .bar.hs { box-shadow: 0 0 0 1.5px var(--acc); }
  .m.d .bar.hs::before { content: ''; position: absolute; right: 0; top: -2px; bottom: -2px; width: 4px; background: var(--acc); border-radius: 2px; }
  .ln.inc::before { content: ''; position: absolute; top: 2px; height: 9px; width: 22px; border-radius: 3px; background: repeating-linear-gradient(135deg, #fff 0 2px, color-mix(in srgb, var(--c) 70%, #888) 2px 4px); }
  .m.d .ln.inc::before { left: 0; } .m.g .ln.inc::before { right: 0; }
  .val { position: absolute; top: 0; font-style: normal; font-size: 12px; font-weight: 750; color: var(--cf); white-space: nowrap; background: rgba(255,255,255,.92); padding: 0 4px; border-radius: 5px; line-height: 13px; }
  .m.d .val { right: 0; } .m.g .val { left: 0; }
  .xg { position: absolute; right: calc(50% + var(--gut) / 2 + 4px); top: -2px; display: flex; flex-direction: row-reverse; gap: 2px; }
  .est { font-weight: 600; color: var(--gris2); }
`;

// ---------- Les pages ----------
const out = (n, html) => { fs.mkdirSync(DIR + '/' + n, { recursive: true }); fs.writeFileSync(DIR + '/' + n + '/etat-b.html', html); console.log('ÉCRIT ' + n); };
const cleS5 = (m) => `<div class="cle"><span>${extraHtml({ f: m.slots[0] || 'tropical', e: 1, niv: 'marqué', hs: false }).replace(/data-role="extra" /, '')}marqué</span><span>${extraHtml({ f: m.slots[0] || 'tropical', e: 1, niv: 'cité', hs: false }).replace(/data-role="extra" /, '')}cité</span></div>`;

const PAGES = {
  p1() {
    const m = modele('c1');
    const c = 's5 sur c1 (trois objectifs). Une voie (rangée fine) par objectif ; au centre ma bière ; à droite ce qui monte (floral, agrumes, en crans du style), à gauche ce qui baisse (résineux, en T, situé par la dégustation de S1, 66–100 ; plein = sens voulu, creux = contre-sens). Ce que la voie ajoute d’autre : pictos des familles, pleins si les fiches disent « marqué », pâles si « cité », barrés d’un trait si la famille baisse, cerclés d’orangé si hors du style. Moment : bande de couleur et en-tête de groupe. Biotransformation de la voie 15 : signaux « possibles » hachurés, sans chiffre.';
    out('p1', page(m, 's5 sur trois objectifs', c, CSS_S5 + CSS_MP_ABS, reponses(m) + cleS5(m) + s5(m, { R: 2.2, L: 8, AR: 30, AL: 60 }) + plis(m)));
  },
  p2() {
    const m = modele('c2');
    const c = 's5 sur c2 (floral et tropical, même sens). Rien ne baisse : la moitié gauche reçoit ce que la voie ajoute d’autre (pictos des familles, depuis ma bière vers la gauche, pleins si « marqué », pâles si « cité », cerclés d’orangé si hors du style : le résineux, déjà trop marqué à la dégustation). À droite, les deux objectifs en crans du style.';
    out('p2', page(m, 's5 même sens', c, CSS_S5 + CSS_MP_ABS, reponses(m) + cleS5(m) + s5(m, { R: 2.2, L: 2.2, AR: 35, AL: 35, extrasGauche: true }) + plis(m)));
  },
  p3() {
    const m = modele('c3');
    const c = 's5 sur c3 (lager 3B, levure LalBrew Diamond sans profil : ma bière non située). Les variations restent connues : elles partent d’un centre « ma bière ? » hachuré ; aucune visée, aucun zéro. Plein = sens voulu, creux = contre-sens. IBU 26 sous la bande 30–45 (orangé).';
    const ibu = `<div class="cle"><span style="font-size:13px;font-weight:750;color:var(--acc)"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 L15 14 H1 Z" fill="#c2410c"/></svg>IBU ${fr(m.d.ibu)}</span><span>style ${m.d.bandeIbu.join('–')}</span><span style="margin-left:auto">${MOMICO.levure.replace('currentColor', '#8e24aa').replace('currentColor', '#8e24aa')} levure sans profil</span></div>`;
    out('p3', page(m, 's5 lager non située', c, CSS_S5 + CSS_MP_ABS, ibu + reponses(m) + cleS5(m) + s5(m, { R: 2, L: 2, AR: 20, AL: 20 }) + plis(m)));
  },
  p6() {
    const m = modele('c1b');
    const c = 's5 avec des bannis (c1b : épicé et Citra bannis). Les bannis en tête ; les voies qui citent l’épicé restent listées, barrées, dans « Écartées », avec leur conflit en picto ; Citra et Citra cryo ne sont plus cherchés. Le reste comme p1.';
    const ban = `<div class="cle bannis"><b style="font-size:13px">Bannis</b>${m.d.bannis.map((b) => b.type === 'famille' ? `<span class="ban">${picto(b.id, 18)}</span>` : `<span class="ban txt">${b.nom}</span>`).join('')}</div>`;
    const css = `.ban { position: relative; display: inline-flex; align-items: center; height: 24px; padding: 0 6px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1.5px #16161a; font-size: 13px; font-weight: 700; color: var(--encre); }
      .ban::after { content: ''; position: absolute; left: 4px; right: 4px; top: 50%; height: 2px; background: #16161a; transform: rotate(-30deg); }
      .bannis { gap: 6px; }`;
    out('p6', page(m, 's5 avec des bannis', c, CSS_S5 + CSS_MP_ABS + css, ban + reponses(m) + cleS5(m) + s5(m, { R: 2.2, L: 8, AR: 30, AL: 60 }) + plis(m)));
  },
};
// ---------- p4 · s5 généralisé : une ligne divergente par objectif, empilées, par voie ----------
const CSS_P4 = `
  .reps.compact .obj { padding: 6px 10px; }
  .frise { display: flex; gap: 6px; align-items: center; }
  .frise .mo { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 9px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--mc); color: var(--mc); font-size: 13px; font-weight: 800; }
  .frise .mo b { color: var(--encre); }
  .frise .mo .ml { color: var(--encre); font-weight: 750; }
  .bio .hc { font-size: 12px; font-weight: 750; color: var(--encre); margin-left: 2px; white-space: nowrap; }
  .carte { position: relative; border-radius: 18px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--trait), 0 6px 14px -12px rgba(0,0,0,.35); padding: 12px 10px 10px 14px; overflow: hidden; }
  .carte::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--mc); }
  .carte .lbl { margin-bottom: 4px; }
  .mch { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px; border-radius: 11px; background: color-mix(in srgb, var(--mc) 16%, #fff); color: var(--mc); font-size: 12px; font-weight: 800; white-space: nowrap; flex: none; }
  .mch span { color: var(--encre); }
  .lane { display: grid; grid-template-columns: 20px 1fr 62px; align-items: center; gap: 4px; height: 28px; }
  .tr { position: relative; height: 18px; border-radius: 9px; background: #f1f1f5; }
  .tr::before { content: ''; position: absolute; left: 50%; top: -3px; bottom: -3px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: var(--encre); z-index: 2; }
  .tr .zone { position: absolute; top: 0; bottom: 0; left: var(--s0); width: var(--s1); background: color-mix(in srgb, var(--c) 28%, #fff); border-radius: 7px; }
  .tr .vt { position: absolute; top: -3px; bottom: -3px; left: var(--s); border-left: 2px dashed var(--cf); }
  .tr .bar { position: absolute; top: 4px; height: 10px; border-radius: 5px; background: var(--c); left: var(--s0); width: var(--s1); z-index: 1; }
  .tr .bar.contre { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .tr .bar.hs { box-shadow: 0 0 0 1.5px var(--acc); }
  .tr .inc { position: absolute; top: 4px; height: 10px; width: 24px; border-radius: 3px; background: repeating-linear-gradient(135deg, #fff 0 2px, color-mix(in srgb, var(--c) 70%, #888) 2px 4px); }
  .tr .inc.d { left: 50%; } .tr .inc.g { right: 50%; }
  .lane .v { font-size: 13px; font-weight: 750; color: var(--cf); white-space: nowrap; text-align: right; }
  body.abs .tr .zone, body.abs .tr .bar { left: var(--a0); width: var(--a1); }
  body.abs .tr .vt { left: var(--a); }
  .plus { height: 40px; margin-top: 4px; border-radius: 20px; background: var(--encre); color: #fff; font-size: 14px; font-weight: 750; }
  .cartes { display: flex; flex-direction: column; gap: 10px; }
`;
function laneP4(m, o, v) {
  const sc = o.tast ? 8 : 2.2, asc = o.tast ? 60 : 40;
  const X = (u) => 50 + clamp(u / sc, -1, 1) * 50, XA = (p) => 50 + clamp(p / asc, -1, 1) * 50;
  const [lo, hi] = o.bande;
  let z0, z1, za0, za1, vt, vta;
  if (o.tast) { const top = (TAST.v - 27.6) / TAST.T; z0 = X(-top - 3); z1 = X(-top); za0 = XA(-TAST.v); za1 = XA(30 - TAST.v); vt = z1; vta = za1; }
  else { z0 = X((lo - o.avant) / o.cran); z1 = X((hi - o.avant) / o.cran); za0 = XA(lo - o.avant); za1 = XA(hi - o.avant); vt = X((o.visee - o.avant) / o.cran); vta = XA(o.visee - o.avant); }
  const ef = effet(m, o, v);
  let bar;
  if (!ef) bar = `<i class="inc ${o.sens > 0 ? 'd' : 'g'}" data-role="effet" data-famille="${o.f}" data-ecart-avant="${o.tast ? TAST.e : 0}" data-ecart-apres=""></i>`;
  else {
    const a = X(ef.u), aa = XA(ef.e);
    bar = `<i class="bar${Math.sign(ef.e) !== o.sens ? ' contre' : ''}${ef.hs ? ' hs' : ''}" data-role="effet" data-famille="${o.f}"${cransAttr(v, o.f)} data-ecart-avant="${ef.ea}" data-ecart-apres="${ef.ep}" style="--s0:${pct(Math.min(50, a))};--s1:${pct(Math.max(Math.abs(a - 50), 0.8))};--a0:${pct(Math.min(50, aa))};--a1:${pct(Math.max(Math.abs(aa - 50), 0.8))}"></i>`;
  }
  const val = ef ? `<span class="sty-only">${ef.txt}</span><span class="abs-only">${sg(ef.e)}</span>` : '';
  return `<div class="lane" style="--c:${F[o.f][2]};--cf:${F[o.f][3]}">${picto(o.f, 16)}<div class="tr" data-role="piste" data-famille="${o.f}"><i class="zone" data-role="zone" style="--s0:${pct(z0)};--s1:${pct(z1 - z0)};--a0:${pct(za0)};--a1:${pct(za1 - za0)}"></i><i class="vt" style="--s:${pct(vt)};--a:${pct(vta)}"></i>${bar}</div><span class="v">${val}</span></div>`;
}
function carteP4(m, v) {
  const g = v.actions.map((a) => fr(a.grammes)).join(' + ');
  return `<article class="carte" data-voie="${v.n}" style="--mc:${MOM[v.mom].c}">
    <div class="lbl"><span class="mch">${MOMICO[v.mom]}<span>${MOM[v.mom].t.replace('à cru, fermentation active', 'à cru actif').replace('à cru, après fermentation', 'à cru après')}</span></span>${pastilles(v)}<b>${nomVoie(v)}</b>${v.actions.length && v.type !== 'remplacer à IBU égal' && v.type !== 'diminuer' ? `<span class="q">${g} g</span>` : ''}${bioHtml(v)}<span class="xs">${v.extras.map(extraHtml).join('')}</span>${stockIco(v.stock)}</div>
    ${m.objs.map((o) => laneP4(m, o, v)).join('')}</article>`;
}
PAGES.p4 = function () {
  const m = modele('c1');
  const c = 's5 généralisé sur c1 : une carte par voie, une ligne divergente par objectif (ma bière au centre, la zone du style et la visée sur chaque ligne ; crans, ou T pour le résineux dégusté) ; le moment en bande et en pastille ; ce que la voie ajoute d’autre en pictos. Les 3 premières voies visibles, les 14 autres à un toucher, rangées par moment.';
  const parMom = ['b10', 'b60', 'wp', 'dryActive', 'dryPost', 'levure'].map((k) => ({ k, vs: m.voies.filter((v) => v.mom === k) })).filter((x) => x.vs.length);
  const frise = `<div class="frise">${parMom.map((x) => `<span class="mo" style="--mc:${MOM[x.k].c}" title="${MOM[x.k].t}">${MOMICO[x.k]}<b>${x.vs.length}</b></span>`).join('')}</div>`;
  const vis = m.voies.slice(0, 3), reste = m.voies.slice(3);
  const resteHtml = parMom.map((x) => { const vs = x.vs.filter((v) => reste.includes(v)); return vs.length ? `<div class="groupe"><span class="t" style="--mc:${MOM[x.k].c}">${MOMICO[x.k]}${MOM[x.k].t}</span></div>${vs.map((v) => carteP4(m, v)).join('')}` : ''; }).join('');
  const corps = reponses(m) + frise + `<div class="cartes">${vis.map((v) => carteP4(m, v)).join('')}</div>
    <button class="plus" data-ouvre="reste" aria-expanded="false">${reste.length} autres voies</button><div id="reste" class="cartes" hidden>${resteHtml}</div>` + plis(m);
  out('p4', page(m, 's5 généralisé', c, CSS_S5 + CSS_P4 + `.lbl .q { font-size: 13px; color: var(--gris); white-space: nowrap; } .lbl b { white-space: normal; }`, corps));
};

// ---------- p5 · s4 sur c1 : cascade à trois objectifs, voies posées ensemble ----------
const CSS_P5 = `
  .ens { display: flex; gap: 6px; flex-wrap: wrap; }
  .ens button { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border-radius: 15px; background: #f0f0f4; font-size: 13px; font-weight: 700; }
  .ens button[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .ens button[aria-pressed="true"] .pas { box-shadow: 0 0 0 2px var(--encre); }
  .cas { border-radius: 16px; padding: 8px 10px 6px; background: color-mix(in srgb, var(--c) 14%, #fff); }
  .cas .l1 { display: flex; align-items: center; gap: 8px; }
  .cas .nom { font-size: 14px; font-weight: 750; color: var(--cf); }
  .casc { position: relative; margin-top: 4px; padding-left: 24px; }
  .casc .fond { position: absolute; left: 24px; right: 0; top: 0; bottom: 0; border-radius: 8px; background: rgba(255,255,255,.6); }
  .casc .zone { position: absolute; top: 0; bottom: 0; left: var(--s0); width: var(--s1); border-radius: 8px 0 0 8px; background: repeating-linear-gradient(90deg, transparent 0 calc(33.333% - 1px), rgba(255,255,255,.9) calc(33.333% - 1px) 33.333%), color-mix(in srgb, var(--c) 38%, #fff); }
  .casc .vi { position: absolute; top: 0; bottom: 0; left: var(--s); border-left: 2.5px dashed var(--encre); }
  .casc .r { position: relative; height: 32px; }
  .casc .cb { position: absolute; left: -24px; top: 7px; width: 18px; height: 18px; border-radius: 6px; background: var(--h); display: grid; place-items: center; }
  .casc .cb::after { content: ''; width: 8px; height: 4px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: translateY(-1px) rotate(-45deg); }
  .casc .b { position: absolute; top: 8px; height: 16px; left: var(--s0); width: max(3px, var(--s1)); border-radius: 4px; }
  .casc .b.biere { background: #16161a; }
  .casc .b.hs { background: color-mix(in srgb, var(--acc) 28%, #fff); box-shadow: inset 0 0 0 1.5px var(--acc); }
  .casc .b.pas { background: var(--c); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c) 60%, #000); }
  .casc .b.inc { width: 26px; background: repeating-linear-gradient(135deg, #fff 0 3px, color-mix(in srgb, var(--c) 60%, #888) 3px 5px); }
  .casc .b.man { background: repeating-linear-gradient(135deg, rgba(255,255,255,.95) 0 4px, rgba(71,85,105,.32) 4px 7px); box-shadow: inset 0 0 0 1.5px var(--aucune); }
  .casc .lab { position: absolute; top: 8px; font-size: 12px; font-weight: 750; white-space: nowrap; background: rgba(255,255,255,.9); padding: 0 5px; border-radius: 6px; line-height: 16px; display: flex; gap: 4px; }
  .casc .lab.d { left: calc(var(--s) + 5px); } .casc .lab.g { right: calc(100% - var(--s) + 5px); }
  .casc .lab .q { font-weight: 600; color: var(--gris); }
  body.abs .casc .zone, body.abs .casc .b { left: var(--a0); width: max(3px, var(--a1)); }
  body.abs .casc .b.inc { width: 26px; }
  body.abs .casc .vi { left: var(--a); }
  body.abs .casc .lab.d { left: calc(var(--a) + 5px); } body.abs .casc .lab.g { right: calc(100% - var(--a) + 5px); }
  .autres { border-radius: 16px; padding: 8px 10px; background: #f6f6f9; display: flex; flex-direction: column; gap: 4px; }
  .autres .ar { display: flex; align-items: center; gap: 6px; min-height: 30px; }
  .autres .ar .xs { margin-left: 0; }
  .autres .eq { font-size: 15px; font-weight: 800; width: 18px; text-align: center; }
  .ibu-e { margin-left: auto; font-size: 13px; font-weight: 750; }
  .liste .lbl { flex-wrap: wrap; row-gap: 2px; }
  .liste .rang { padding-bottom: 6px; border-bottom: 1px solid #ececf1; }
  .liste .box { width: 18px; height: 18px; border-radius: 6px; box-shadow: inset 0 0 0 2px var(--h); flex: none; }
  .ch { font-size: 12px; font-weight: 750; height: 20px; padding: 0 6px; border-radius: 10px; display: inline-flex; align-items: center; gap: 3px; background: color-mix(in srgb, var(--c) 18%, #fff); color: var(--cf); }
  .ch.ne { background: repeating-linear-gradient(135deg, #fff 0 3px, #e3e3ea 3px 5px); color: var(--gris); }
  .effs { display: flex; gap: 4px; width: 100%; padding-left: 22px; }
`;
PAGES.p5 = function () {
  const m = modele('c1');
  const ens = m.d.ensemble;
  const E = ens[0];
  const vs = E.voies.map((n) => m.voies[n - 1]);
  const c = 's4 sur c1 : une cascade par objectif (agrumes, floral, résineux), face à la zone du style (62 % de la piste ; au-dessus en T) ; les voies cochées s’empilent d’après « ensemble » du cas (' + E.libelles.join(' + ') + ' : ' + E.tout.filter((t) => t.visee).map((t) => F[t.famille][1] + ' ' + fr(t.apres)).join(', ') + ', IBU ' + fr(E.ibu) + ') ; le résineux est situé par la dégustation (S1). Ce que l’ensemble ajoute d’autre : pictos, par voie et en somme.';
  const chips = `<div class="ens">${ens.map((e, i) => `<button aria-pressed="${i === 0}">${e.voies.map((n) => { const v = m.voies[n - 1]; return pastilles(v) + MOMICO[v.mom]; }).join('<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1 V9 M1 5 H9" stroke="currentColor" stroke-width="2"/></svg>')}</button>`).join('')}</div>`;
  const ext = (t) => t.tout.find ? null : null;
  const cascade = (o, first) => {
    const [lo, hi] = o.bande;
    const sx = (v) => 62 * (v - lo) / (hi - lo);
    const tot = E.tout.find((t) => t.famille === o.f);
    let rows = '', fondExtra = '';
    if (o.tast) {
      const p = (t) => 62 + clamp(t, 0, 8) * 4.75;
      let cur = TAST.e, cura = TAST.v;
      rows += `<div class="r"><i class="b hs" style="--s0:${pct(p(TAST.plage[0]))};--s1:${pct(p(TAST.plage[1]) - p(TAST.plage[0]))};--a0:${pct(TAST.abs[0])};--a1:${pct(TAST.abs[1] - TAST.abs[0])}"></i><span class="lab g" style="--s:${pct(p(TAST.plage[0]))};--a:${pct(TAST.abs[0])}">${first ? 'Ma bière ' : ''}<span style="color:var(--acc)"><span class="sty-only">+${fT(TAST.e)} T</span><span class="abs-only">${TAST.abs.join('–')}</span></span></span></div>`;
      for (const v of vs) {
        const ef = effet(m, o, v);
        if (!ef) { rows += `<div class="r" data-voie="${v.n}"><span class="cb" style="--h:${HOP[v.actions[0].houblon]}"></span><i class="b inc" data-role="effet" data-famille="${o.f}" data-ecart-avant="${fT(cur)}" data-ecart-apres="" style="--s0:${pct(p(cur) - 3)};--s1:26px;--a0:${pct(cura - 3)};--a1:26px"></i></div>`; continue; }
        const ap = apresTast(v), nxt = ap ? ap.e : cur + ef.u, nxta = ap ? ap.v : cura + ef.e;
        rows += `<div class="r" data-voie="${v.n}"><span class="cb" style="--h:${HOP[v.actions[0].houblon]}"></span><i class="b pas" data-role="effet" data-famille="${o.f}" data-ecart-avant="${TAST.e}" data-ecart-apres="${nxt}" style="--s0:${pct(p(nxt))};--s1:${pct(p(cur) - p(nxt))};--a0:${pct(nxta)};--a1:${pct(cura - nxta)}"></i><span class="lab g" style="--s:${pct(p(nxt))};--a:${pct(nxta)}"><span class="sty-only">${fT(TAST.e)} → ${fT(nxt)} T</span><span class="abs-only">${sg(ef.e)}</span></span></div>`;
        cur = nxt; cura = nxta;
      }
      rows += `<div class="r"><i class="b man" style="--s0:62%;--s1:${pct(p(cur) - 62)};--a0:${pct(o.visee)};--a1:${pct(cura - o.visee)}"></i><span class="lab g" style="--s:62%;--a:${pct(o.visee)}">Manque</span></div>`;
      fondExtra = `<i class="vi" style="--s:62%;--a:${pct(o.visee)}"></i>`;
    } else {
      let cur = o.avant;
      rows += `<div class="r"><i class="b biere" style="--s0:0%;--s1:${pct(sx(cur))};--a0:0%;--a1:${pct(cur)}"></i>${first ? `<span class="lab d" style="--s:${pct(sx(cur))};--a:${pct(cur)}">Ma bière</span>` : ''}</div>`;
      for (const v of vs) {
        const ef = effet(m, o, v);
        const h = HOP[v.actions[0].houblon];
        if (!ef) { rows += `<div class="r" data-voie="${v.n}"><span class="cb" style="--h:${h}"></span><i class="b inc" data-role="effet" data-famille="${o.f}" data-ecart-avant="0" data-ecart-apres="" style="--s0:${pct(sx(cur))};--a0:${pct(cur)}"></i></div>`; continue; }
        const nxt = cur + ef.e;
        rows += `<div class="r" data-voie="${v.n}"><span class="cb" style="--h:${h}"></span><i class="b pas" data-role="effet" data-famille="${o.f}" data-ecart-avant="0" data-ecart-apres="0" style="--s0:${pct(sx(Math.min(cur, nxt)))};--s1:${pct(Math.abs(sx(nxt) - sx(cur)))};--a0:${pct(Math.min(cur, nxt))};--a1:${pct(Math.abs(ef.e))}"></i><span class="lab d" style="--s:${pct(sx(Math.max(cur, nxt)))};--a:${pct(Math.max(cur, nxt))}">${first ? `${nomVoie(v)} <span class="q">${MOM[v.mom].t}</span>` : ''}<span class="sty-only">${ef.txt}</span><span class="abs-only">${sg(ef.e)}</span></span></div>`;
        cur = nxt;
      }
      // Total : la valeur d'« ensemble » (convention du moteur).
      const fin = tot ? tot.apres : cur;
      if (o.sens > 0 && fin < o.visee) rows += `<div class="r"><i class="b man" style="--s0:${pct(sx(fin))};--s1:${pct(sx(o.visee) - sx(fin))};--a0:${pct(fin)};--a1:${pct(o.visee - fin)}"></i><span class="lab d" style="--s:${pct(sx(o.visee))};--a:${pct(o.visee)}">Manque</span></div>`;
      fondExtra = `<i class="vi" style="--s:${pct(sx(o.visee))};--a:${pct(o.visee)}"></i>`;
    }
    const zone = o.tast ? `<i class="zone" data-role="zone" style="--s0:0%;--s1:62%;--a0:0%;--a1:30%"></i>` : `<i class="zone" data-role="zone" style="--s0:0%;--s1:62%;--a0:${pct(lo)};--a1:${pct(hi - lo)}"></i>`;
    const vEns = (() => { if (o.tast) return 'aucune'; const fin = tot ? tot.apres : o.avant; return (o.sens > 0 ? fin >= o.visee : fin <= o.visee) ? 'atteint' : Math.abs(fin - o.visee) <= Math.abs(o.avant - o.visee) / 2 ? 'approche' : 'aucune'; })();
    const mot = vEns === 'aucune' ? 'Aucune<small>voie houblon</small>' : VERDICT[vEns];
    const hors = vEns === 'aucune' && (m.d.horsModele || []).some((h) => h.famille === o.f) ? `<button class="hors" onclick="document.getElementById('hh').open=true;document.getElementById('hh').scrollIntoView({behavior:'smooth'})">Hors houblon ›</button>` : '';
    return `<section class="cas" data-role="objectif" data-famille="${o.f}" style="--c:${F[o.f][2]};--cf:${F[o.f][3]}">
      <div class="l1">${picto(o.f, 20)}<span class="nom">${(o.sens > 0 ? 'Plus ' : 'Moins ') + F[o.f][1]}</span><span class="rep v-${vEns}" data-role="reponse" data-famille="${o.f}" data-verdict="${vEns}">${mot}</span></div>
      <div class="casc"><div class="fond" data-role="piste" data-famille="${o.f}">${zone}${fondExtra}${hors}</div>${rows}</div></section>`;
  };
  // Ce que l'ensemble ajoute d'autre : par voie cochée, puis la somme d'« ensemble ».
  const visees = new Set(m.objs.map((o) => o.f));
  const extE = E.tout.filter((t) => !visees.has(t.famille) && Math.abs(t.effet) >= 0.5).map((t) => ({ f: t.famille, e: t.effet, niv: t.effet < 0 ? 'baisse' : 's', hs: false }));
  const autres = `<div class="autres">${vs.map((v) => `<div class="ar" data-voie="${v.n}"><span class="cb-s" style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${HOP[v.actions[0].houblon]}"></span>${MOMICO[v.mom].replace(/currentColor/g, MOM[v.mom].c)}<span class="xs">${v.extras.map(extraHtml).join('')}</span></div>`).join('')}
    <div class="ar"><span class="eq">=</span><span class="xs">${extE.map((x) => extraHtml(x).replace(/data-role="extra" data-famille="[^"]+" /, '')).join('')}</span><span class="ibu-e">IBU ${fr(E.ibu)}</span></div></div>`;
  const liste = `<div class="liste">${m.voies.filter((v) => !E.voies.includes(v.n)).map((v) => `<div class="rang" data-voie="${v.n}" style="--mc:${MOM[v.mom].c}"><div class="lbl"><span class="box" style="--h:${v.actions[0] ? HOP[v.actions[0].houblon] : MOM.levure.c}"></span>${pastilles(v)}<b>${nomVoie(v)}</b><span class="mch" style="--mc:${MOM[v.mom].c};font-size:12px;font-weight:800;color:${MOM[v.mom].c}">${MOM[v.mom].t}</span>${bioHtml(v)}<span class="xs">${v.extras.map(extraHtml).join('')}</span>${stockIco(v.stock)}
      <span class="effs">${m.objs.map((o) => { const ef = effet(m, o, v); return ef ? `<span class="ch" style="--c:${F[o.f][2]};--cf:${F[o.f][3]}">${picto(o.f, 13)}${ef.txt}</span>` : `<span class="ch ne">${picto(o.f, 13)}non établi</span>`; }).join('')}</span></div></div>`).join('')}</div>`;
  const ensPlus = ens.slice(1).map((e) => `<li>${e.libelles.join(' + ')} : ${e.tout.map((t) => F[t.famille][1] + ' ' + sg(t.effet)).join(', ')} ; IBU ${fr(e.ibu)}</li>`).join('');
  const corps = chips + m.objs.map((o, i) => cascade(o, i === 0)).join('') + autres + `<div class="groupe"><span class="t" style="--mc:#16161a">Autres voies à cocher</span></div>` + liste + `<details><summary>Autres ensembles</summary><ul>${ensPlus}</ul></details>` + plis(m);
  out('p5', page(m, 's4 à trois objectifs', c, CSS_S5 + CSS_P4 + CSS_P5, corps));
};
// ---------- p4b · p4 d'après le brasseur : les moments sans toucher, un « + » vers Comparer ----------
const STKM = {
  suffisant: '<svg class="stk-m" width="12" height="12" viewBox="0 0 18 18" aria-label="en stock"><rect x="2" y="5" width="14" height="11" rx="2" fill="#6e6e78"/><path d="M5 10.5 L8 13 L13 8" stroke="#fff" stroke-width="2.4" fill="none"/></svg>',
  'à acheter': '<svg class="stk-m" width="12" height="12" viewBox="0 0 18 18" aria-label="à acheter"><path d="M1 3 H4 L6 12 H14 L16 5 H5" fill="none" stroke="#6e6e78" stroke-width="2.4"/><circle cx="7" cy="15" r="1.8" fill="#6e6e78"/><circle cx="13" cy="15" r="1.8" fill="#6e6e78"/></svg>',
  manque: '<svg class="stk-m" width="12" height="12" viewBox="0 0 18 18" aria-label="stock insuffisant"><rect x="2" y="5" width="14" height="11" rx="2" fill="none" stroke="#6e6e78" stroke-width="2.4"/><rect x="2" y="11" width="14" height="5" rx="1" fill="#6e6e78"/></svg>',
};
const PLUS = '<svg class="ic-p" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2 V14 M2 8 H14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const COCHE = '<svg class="ic-c" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const AJOUTEES = [1, 15];
const MOMLAB = { b10: '10′', b60: '60′', wp: 'whirlpool', dryActive: 'à cru, fermentation active', dryPost: 'à cru, après fermentation', levure: 'levure' };
const CSS_P4B = `
  .ecran { padding-bottom: 76px; }
  .frise a { text-decoration: none; }
  .sec { display: flex; flex-direction: column; gap: 8px; scroll-margin-top: 8px; }
  .sec-t { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .sec-t .t { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 10px 0 8px; border-radius: 13px; background: var(--mc); color: #fff; font-size: 13px; font-weight: 800; }
  .sec-t .t svg { color: #fff; }
  .carte .lbl { padding-right: 40px; }
  .carte .q { display: inline-flex; align-items: center; gap: 3px; }
  .stk-m { flex: none; opacity: .9; }
  .add { position: absolute; right: 8px; top: 8px; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: var(--encre); box-shadow: inset 0 0 0 2px var(--encre); z-index: 3; }
  .add .ic-c { display: none; }
  .add[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .add[aria-pressed="true"] .ic-c { display: block; } .add[aria-pressed="true"] .ic-p { display: none; }
  .carte.choisie { box-shadow: inset 0 0 0 2px var(--encre), 0 6px 14px -12px rgba(0,0,0,.35); }
  .encore { align-self: flex-start; display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px 0 9px; border-radius: 15px; background: color-mix(in srgb, var(--mc) 14%, #fff); color: var(--mc); font-size: 13px; font-weight: 800; box-shadow: inset 0 0 0 1.5px var(--mc); }
  .encore b { color: var(--encre); }
  .cmp { position: fixed; left: 50%; transform: translateX(-50%); bottom: 12px; width: min(358px, calc(100% - 32px)); height: 48px; border-radius: 24px; background: var(--encre); color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 24px -10px rgba(0,0,0,.55); z-index: 10; }
  .cmp .pas { box-shadow: 0 0 0 2px var(--encre); }
`;
function carteP4b(m, v) {
  const on = AJOUTEES.includes(v.n);
  const g = v.actions.map((a) => fr(a.grammes)).join(' + ');
  const dose = v.actions.length && v.type !== 'remplacer à IBU égal' && v.type !== 'diminuer' ? `<span class="q">${g} g${STKM[v.stock] || ''}</span>` : v.actions.length ? `<span class="q">${STKM[v.stock] || ''}</span>` : '';
  return `<article class="carte${on ? ' choisie' : ''}" data-voie="${v.n}" style="--mc:${MOM[v.mom].c}">
    <button class="add" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer de' : 'Ajouter à'} Comparer : ${esc(nomVoie(v))}">${PLUS}${COCHE}</button>
    <div class="lbl"><span style="color:${MOM[v.mom].c};display:inline-flex" aria-hidden="true">${MOMICO[v.mom]}</span>${pastilles(v)}<b>${nomVoie(v)}</b>${usageHtml(v)}${dose}</div>
    ${m.objs.map((o) => laneP4(m, o, v)).join('')}${v.extras.length || (v.bio || []).length ? `<div class="ext">${v.extras.map(extraPill).join('')}${bioHtml(v)}</div>` : ''}</article>`;
}
const SCRIPT_P4B = `<script>
  const majCmp = () => { const n = document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length; document.querySelector('.cmp b').textContent = '(' + n + ')'; };
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.closest('.carte').classList.toggle('choisie', on); majCmp();
  }));
</script>`;
PAGES.p4b = function () {
  const m = modele('c1');
  const ordreMom = ['b10', 'b60', 'wp', 'dryActive', 'dryPost', 'levure'];
  const parMom = ordreMom.map((k) => ({ k, vs: m.voies.filter((v) => v.mom === k) })).filter((x) => x.vs.length);
  const frise = `<div class="frise">${parMom.map((x) => `<a class="mo" href="#m-${x.k}" style="--mc:${MOM[x.k].c}" title="${MOM[x.k].t}">${MOMICO[x.k]}<span class="ml">${x.k === 'dryActive' || x.k === 'dryPost' ? 'à cru' : MOMLAB[x.k]}</span><b>×${x.vs.length}</b></a>`).join('')}</div>`;
  const sections = parMom.map((x) => {
    const [best, ...reste] = x.vs; // la première du moteur dans ce moment
    const lab = x.k === 'dryActive' ? 'dry hop' : MOMLAB[x.k];
    return `<section class="sec" id="m-${x.k}" style="--mc:${MOM[x.k].c}"><div class="sec-t"><span class="t">${MOMICO[x.k]}${lab}</span></div>${carteP4b(m, best)}
      ${reste.length ? `<button class="encore" data-ouvre="plus-${x.k}" aria-expanded="false">${PLUS}<b>${reste.length}</b> autre${reste.length > 1 ? 's' : ''}</button><div id="plus-${x.k}" class="cartes" hidden>${reste.map((v) => carteP4b(m, v)).join('')}</div>` : ''}</section>`;
  }).join('');
  const choisies = AJOUTEES.map((n) => m.voies[n - 1]);
  const barre = `<a class="cmp" data-role="comparer" href="comparer.html">${choisies.map(pastilles).join('')}Comparer <b>(${choisies.length})</b></a>`;
  const c = 'p4 d’après le brasseur (« manque peut être dry hop, bio transfo, levure. et la panier, à la place plutôt un + qui ajoute le houblon à la comparaison ») : au premier niveau, la première voie du moteur de chaque moment de c1 (10′ : voie 1 ; 60′ : 12 ; dry hop en fermentation active : 15, avec sa biotransformation hachurée ; levure : 16), le reste rangé par moment à un toucher ; la frise mène aux moments. À droite de chaque carte, un « + » ajoute la voie à Comparer (✓ une fois ajoutée ; voies 1 et 15 déjà ajoutées) ; le stock n’est plus qu’une marque passive près des grammes ; la barre « Comparer (n) » mène à comparer.html.';
  const html = page(m, 'Voies par moment', c, CSS_S5 + CSS_P4 + CSS_P4B + CSS_INT + `.lbl .q { font-size: 13px; color: var(--gris); white-space: nowrap; } .lbl b { white-space: normal; }`, reponses(m) + frise + sections + plis(m) + barre).replace('</body>', SCRIPT_P4B + '\n</body>');
  out('p4b', html);
  fs.writeFileSync(DIR + '/p4b/comparer.html', comparerP4b(m, choisies));
  console.log('ÉCRIT p4b/comparer.html');
};

// ---------- p1b · p1 d'après le brasseur : sans l'en-tête « ma bière », un « + » vers Comparer ----------
PAGES.p1b = function () {
  const m = modele('c1');
  const choisies = AJOUTEES.map((n) => m.voies[n - 1]);
  const c = 'p1 d’après le brasseur (« bien aussi, mais manque assi quelque bouton et le "ma bière" en haut sert é rien ») : plus d’en-tête « ma bière » au-dessus des voies (le rail de ma bière reste dans le graphique) ; à droite de chaque voie, un « + » ajoute la voie à Comparer (✓ une fois ajoutée ; voies 1 et 15 déjà ajoutées), le stock n’est plus qu’une marque passive près du nom ; la barre « Comparer (n) » mène à comparer.html. Tous les moments restent visibles en défilant (10′, 60′, dry hop en fermentation active avec sa biotransformation, levure).';
  const css = `.ecran { padding-bottom: 76px; }
    .add2 { flex: none; width: 28px; height: 28px; margin-left: 4px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: var(--encre); box-shadow: inset 0 0 0 2px var(--encre); }
    .add2 .ic-c { display: none; }
    .add2[aria-pressed="true"] { background: var(--encre); color: #fff; }
    .add2[aria-pressed="true"] .ic-c { display: block; } .add2[aria-pressed="true"] .ic-p { display: none; }
    .lbl .stk-m { margin-left: 2px; flex: none; }
    .lbl b { white-space: normal; min-width: 0; line-height: 1.15; }
    .lbl .xs { flex-shrink: 0; }
    .cmp { position: fixed; left: 50%; transform: translateX(-50%); bottom: 12px; width: min(358px, calc(100% - 32px)); height: 48px; border-radius: 24px; background: var(--encre); color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 24px -10px rgba(0,0,0,.55); z-index: 10; }
    .cmp .pas { box-shadow: 0 0 0 2px var(--encre); }
    .tete { height: 24px; }`;
  const script = `<script>
  const majCmp = () => { const n = document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length; document.querySelector('.cmp b').textContent = '(' + n + ')'; };
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); majCmp(); }));
</script>`;
  const barre = `<a class="cmp" data-role="comparer" href="comparer.html">${choisies.map(pastilles).join('')}Comparer <b>(${choisies.length})</b></a>`;
  const html = page(m, 's5 avec boutons', c, CSS_S5 + CSS_MP_ABS + css + CSS_INT + `.rang .ext { padding-left: 4px; }`, reponses(m) + cleS5(m) + s5(m, { R: 2.2, L: 8, AR: 30, AL: 60, plus: true, sansBiere: true }) + plis(m) + barre).replace('</body>', script + '\n</body>');
  out('p1b', html);
  fs.writeFileSync(DIR + '/p1b/comparer.html', comparerP4b(m, choisies));
  console.log('ÉCRIT p1b/comparer.html');
};

// Comparer : les voies ajoutées côte à côte, au style, et « ensemble » [1, 15].
function comparerP4b(m, choisies) {
  const E = m.d.ensemble.find((e) => e.voies.join() === AJOUTEES.join());
  const visees = new Set(m.objs.map((o) => o.f));
  const fams = [...m.objs.map((o) => o.f), ...ORDRE.filter((f) => !visees.has(f) && (choisies.some((v) => v.extras.some((x) => x.f === f)) || E.tout.some((t) => t.famille === f && Math.abs(t.effet) >= 0.5)))];
  const objDe = (f) => m.objs.find((o) => o.f === f) || { f, sens: 0, cran: 10, largeur: 30, bande: [0, 30], avant: (m.voies[0].tout.find((t) => t.famille === f) || {}).avant ?? null };
  // Position au style : bande du style 0–70 %, au-dessus 70–100 % (30 points) ; absolu : valeur en %.
  const sx = (o, v) => { const [lo, hi] = o.bande; return v <= hi ? 70 * Math.max(0, v - lo) / (hi - lo) : 70 + Math.min(v - hi, 30); };
  const crans = (o, e) => { const n = Math.round(e / o.cran); return Math.abs(e) < 0.25 * o.largeur || n === 0 ? '≈' : (n > 0 ? '+' : '−') + Math.abs(n) + ' cran' + (Math.abs(n) > 1 ? 's' : ''); };
  const cell = (f, e, niv) => {
    const o = objDe(f);
    const zone = `<i class="zone" data-role="zone" style="--s0:0%;--s1:70%;--a0:${pct(o.bande[0])};--a1:${pct(o.bande[1] - o.bande[0])}"></i>`;
    if (o.tast) {
      const moi = `<i class="moi hs" style="--s:96%;--a:${pct(TAST.v)}"></i>`;
      return `<div class="cel" style="--c:${F[f][2]};--cf:${F[f][3]}"><div class="tk">${zone}${moi}${e == null ? '<i class="inc"></i>' : ''}</div><span class="v">${e == null ? 'non établi' : sg(e)}</span></div>`;
    }
    if (e == null) return `<div class="cel" style="--c:${F[f][2]};--cf:${F[f][3]}"><div class="tk">${zone}${o.avant != null ? `<i class="moi" style="--s:${pct(sx(o, o.avant))};--a:${pct(o.avant)}"></i>` : ''}<i class="inc"></i></div><span class="v">non établi</span></div>`;
    const av = o.avant, ap = av != null ? av + e : null, hs = ap != null && ap > o.bande[1];
    const a = av != null ? sx(o, av) : 0, b = ap != null ? sx(o, ap) : 0;
    return `<div class="cel" style="--c:${F[f][2]};--cf:${F[f][3]}"><div class="tk">${zone}${av != null ? `<i class="bar ${niv || ''}${hs ? ' hs' : ''}" style="--s0:${pct(Math.min(a, b))};--s1:${pct(Math.max(Math.abs(b - a), 1))};--a0:${pct(Math.min(av, ap))};--a1:${pct(Math.max(Math.abs(e), 1))}"></i><i class="moi" style="--s:${pct(a)};--a:${pct(av)}"></i>` : ''}</div><span class="v${hs ? ' alerte' : ''}"><span class="sty-only">${crans(o, e)}</span><span class="abs-only">${sg(e)}</span></span></div>`;
  };
  const niveau = (v, f) => { const n = v.fiches.flatMap((h) => h.familles).filter((x) => x.famille === f).map((x) => x.niveau); return n.includes('marqué') ? 'm' : n.includes('cité') ? 'c' : 's'; };
  const colonne = (v) => {
    const vals = fams.map((f) => { const t = v.tout.find((x) => x.famille === f); const etab = visees.has(f) ? (v.effet[f] && v.effet[f].etabli ? v.effet[f].central : null) : (t ? t.effet : undefined); return etab === undefined ? '<div class="cel vide"></div>' : cell(f, etab, niveau(v, f)); }).join('');
    return `<section class="col" data-voie="${v.n}" style="--mc:${MOM[v.mom].c}"><div class="ct">${pastilles(v)}<b>${nomVoie(v)}</b><span class="mch">${MOMICO[v.mom]}<span>${MOM[v.mom].t.replace('à cru, fermentation active', 'à cru actif')}</span></span><span class="ibu">IBU ${fr(v.ibu.after)}</span></div>
      <div class="xs">${v.extras.map(extraHtml).join('')}${bioHtml(v)}</div>${vals}</section>`;
  };
  const colE = `<section class="col ens"><div class="ct"><b>Ensemble</b>${choisies.map(pastilles).join('')}${choisies.map((v) => `<span style="color:${MOM[v.mom].c};display:inline-flex">${MOMICO[v.mom]}</span>`).join('')}<span class="ibu">IBU ${fr(E.ibu)}</span></div><div class="xs">${E.tout.filter((t) => !visees.has(t.famille) && Math.abs(t.effet) >= 0.5).map((t) => extraHtml({ f: t.famille, e: t.effet, niv: t.effet < 0 ? 'baisse' : 's', hs: t.apres > 30 }).replace(/data-role="extra" /, '')).join('')}</div>
    ${fams.map((f) => { const t = E.tout.find((x) => x.famille === f); return t ? cell(f, t.effet, 's') : cell(f, null); }).join('')}</section>`;
  const lignes = `<div class="rangs">${fams.map((f) => `<div class="rl">${picto(f, 20)}${visees.has(f) ? `<i class="sens">${objDe(f).sens > 0 ? '▲' : '▼'}</i>` : ''}</div>`).join('')}</div>`;
  const css = `
    .grille { display: grid; grid-template-columns: 30px repeat(3, 1fr); gap: 6px; align-items: start; }
    .rangs { padding-top: 152px; display: flex; flex-direction: column; }
    .rl { height: 44px; display: flex; align-items: center; gap: 1px; }
    .rl .sens { font-style: normal; font-size: 12px; color: var(--gris); }
    .col { border-radius: 16px; background: #f6f6f9; padding: 8px 6px 4px; position: relative; }
    .col::before { content: ''; position: absolute; left: 10px; right: 10px; top: 0; height: 4px; border-radius: 0 0 3px 3px; background: var(--mc); }
    .col.ens { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
    .ct { height: 78px; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 3px; align-items: center; }
    .ct b { font-size: 14px; font-weight: 800; width: 100%; line-height: 1.1; }
    .ct .pas { order: -1; }
    .mch { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 6px; border-radius: 10px; background: color-mix(in srgb, var(--mc) 16%, #fff); color: var(--mc); font-size: 12px; font-weight: 800; white-space: nowrap; }
    .mch span { color: var(--encre); }
    .ibu { font-size: 12px; color: var(--gris2); white-space: nowrap; }
    .col .xs { height: 66px; margin: 0; display: flex; flex-wrap: wrap; gap: 3px; align-content: flex-start; align-items: center; }
    .col .bio { flex-wrap: wrap; row-gap: 2px; }
    .col .bio { margin-left: 0; }
    .cel { height: 44px; display: flex; flex-direction: column; justify-content: center; gap: 3px; }
    .tk { position: relative; height: 14px; border-radius: 7px; background: #fff; }
    .tk .zone { position: absolute; top: 0; bottom: 0; left: var(--s0); width: var(--s1); border-radius: 7px 0 0 7px; background: color-mix(in srgb, var(--c) 30%, #fff); }
    .tk .bar { position: absolute; top: 2px; height: 10px; left: var(--s0); width: var(--s1); border-radius: 5px; background: var(--c); }
    .tk .bar.c { background: color-mix(in srgb, var(--c) 45%, #fff); box-shadow: inset 0 0 0 1.2px var(--c); }
    .tk .bar.hs::after { content: ''; position: absolute; right: -1px; top: -2px; bottom: -2px; width: 4px; border-radius: 2px; background: var(--acc); }
    .tk .moi { position: absolute; top: 1px; width: 12px; height: 12px; margin-left: -6px; left: var(--s); border-radius: 50%; background: var(--encre); box-shadow: 0 0 0 2px #fff; z-index: 2; }
    .tk .moi.hs { background: var(--acc); }
    .tk .inc { position: absolute; top: 2px; height: 10px; left: 30%; width: 40%; border-radius: 4px; background: repeating-linear-gradient(135deg, #fff 0 2px, #b8bec8 2px 4px); }
    .cel .v { font-size: 12px; font-weight: 750; color: var(--cf); white-space: nowrap; }
    .cel .v.alerte { color: var(--acc); }
    .cel.vide { height: 44px; }
    body.abs .tk .zone, body.abs .tk .bar { left: var(--a0); width: var(--a1); }
    body.abs .tk .moi { left: var(--a); }
    .note-e { font-size: 12px; color: var(--gris2); }
  `;
  const commentaire = 'Comparer (p4b) : les voies ajoutées depuis Suggestions (1 : Motueka 10 g à 10′ ; 15 : Motueka 20 g à cru en fermentation active) côte à côte, puis « ensemble » [1, 15] de c1 (IBU ' + fr(E.ibu) + '). Une ligne par famille qui bouge, avec son picto (objectifs en tête, ▲ ▼ pour le sens voulu) ; au style : la zone du style à 70 % de chaque piste, ma bière (point), la voie (barre pleine si les fiches disent « marqué », pâle si « cité »), orangé si elle sort du style ; absolu à un toucher. Le résineux, situé par la dégustation (66–100), n’a d’effet établi dans aucune des trois.';
  const corps = `<div class="grille">${lignes}${choisies.map(colonne).join('')}${colE}</div>
    <p class="note-e">Ensemble : convention du moteur (apports additionnés, moments différents).</p>`;
  const chromeC = chrome().replace('<button role="radio" aria-checked="true">Suggestions</button><button role="radio" aria-checked="false">Comparer</button>', '<a role="radio" aria-checked="false" href="etat-b.html" style="flex:1;display:grid;place-items:center;height:28px;border-radius:14px;font-size:13px;color:var(--gris);text-decoration:none">Suggestions</a><button role="radio" aria-checked="true">Comparer</button>');
  return `<!doctype html>
<html lang="fr" data-cas="${m.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Comparer les voies</title>
<!-- ${commentaire} -->
<style>${CSS_BASE}${css}</style>
</head>
<body>
${PICTOS}
<main class="ecran">${chromeC}
${corps}
</main>
${SCRIPT}
</body>
</html>
`;
}
for (const n of (process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES))) if (PAGES[n]) PAGES[n]();
