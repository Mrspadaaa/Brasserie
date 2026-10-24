// Lot 18 (#142, #133) · deux baselines sur q2b repris : l3 · Étiquette et l4 · Instrument.
// Point de départ : fils15-s5-complexe/q2b/generateur-q2b.mjs (même contenu, mêmes données c1.json),
// le jeu d'icônes v3 duo (fils17-standard/v3/planche.html), les tons des familles (jetons-familles.json)
// et la fiche g1 de la base (base/generateur/fiche.js, pack-fiches.json). Aucun chiffre recopié à la main.
// Écrit l3/etat-b.html, l3/planche.html, l4/etat-b.html, l4/planche.html.
// Usage : node generateur-baseline.mjs
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const E1 = REPO + '/work/refonte-frontend/v4/ecran-1';
const OUT = E1 + '/fils18-baseline';
const C = JSON.parse(fs.readFileSync(E1 + '/fils15-s5-complexe/donnees/c1.json', 'utf8'));
const PACK = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));
const FICHES = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-fiches.json', 'utf8')).fichesHoublons;
const JET = JSON.parse(fs.readFileSync(E1 + '/fils17-standard/jetons-familles.json', 'utf8'));
const V3 = fs.readFileSync(E1 + '/fils17-standard/v3/planche.html', 'utf8');

const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
const COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const COUL = Object.fromEntries(Object.entries(JET).map(([f, j]) => [f, j.base]));
const ALERTE = '#c2410c';
const OBJ = ['floral', 'citrus', 'resin'];
const ATTENDUES = PACK.styles['16D'].order.filter((f) => PACK.styles['16D'].families[f].status === 'attendue');
const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
const BANDE = {}, AVANT = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANT[t.famille] = t.avant; }
const bande = (f) => BANDE[f] || [0, 30];
const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange; // résineux dégusté, 66–100
const r1 = (x) => Math.round(x * 10) / 10;
const p = (x) => r1(x) + '%';
const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
const sg = (x) => (x > 0 ? '+' : '') + fr(x);
const cl = (x) => Math.max(0, Math.min(100, x));
const crTxt = (c) => (c > 0 ? '+' : '') + fr(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// Luminance relative (WCAG) : choisit l'encre ou le blanc sur un aplat de famille.
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function zone(f) {
  if (f === 'resin') return null;
  const a = AVANT[f]; if (a == null) return undefined;
  const [b0, b1] = bande(f), c = cran(f);
  const rS0 = (b1 - a) / c / 3 * 100, lS0 = (a - b0) / c / 3 * 100, rA0 = (b1 - a) / 50 * 100, lA0 = (a - b0) / 50 * 100;
  return { rS: cl(rS0), lS: cl(lS0), rA: cl(rA0), lA: cl(lA0), rS0, lS0, rA0, lA0 };
}
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${COUL[f]};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;
function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };
const V = C.voies.map((v, i) => {
  const extras = v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille));
  return { n: i + 1, v, extras, hs: new Set((v.horsStyle || []).map((x) => x.family)) };
});
const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '' };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '' };
  if (v.type.startsWith('remplacer') || v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  return { nom: v.actions[0].houblon, q: '' };
};

// ---------- les fiches g1 (pack-fiches), comme base/generateur/build.mjs (ficheH) ----------
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const ROLE_DE = {}, VOIE_DE = {};
for (const X of V) for (const h of X.v.fiches || []) if (!ROLE_DE[h.houblon]) ROLE_DE[h.houblon] = { v: h.role, src: h.roleSource };
for (const X of V) if (X.v.actions.length === 1 && !VOIE_DE[X.v.actions[0].houblon]) VOIE_DE[X.v.actions[0].houblon] = X;
function ficheH(nom) {
  const f = FICHES.find((x) => x.name === nom); if (!f) return null;
  const comp = (f.huiles && f.huiles.composants) || {};
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  const de = f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null;
  return {
    nom: f.name, cle: f.key, origine: f.origin || null, role: ROLE_DE[nom] || null,
    alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc),
    lot: de === 'fiche de stock' || de === 'lu sur l’article' ? f.alpha.retenu.value : null,
    beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
    huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: (f.aromes || []).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: a.mots || [], premier: a.premier || [] })),
    sansFamille: f.motsSansFamille || [],
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
    subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [],
    subsCalc: ((f.substitutsCalcules && f.substitutsCalcules.remplacants) || []).slice(0, 5).map((x) => x.name),
    subsRaison: f.substitutsRaison || null,
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    voie: VOIE_DE[nom] || null,
  };
}
const NOMS_FICHE = [...new Set(V.flatMap((X) => (X.v.fiches || []).map((h) => h.houblon)))].filter((n) => FICHES.some((f) => f.name === n));

// ---------- icônes : lucide-react 1.39.0 et le jeu v3 duo, une seule épaisseur rendue par langage ----------
const ICO = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/>',
  equal: '<path d="M5 9h14"/><path d="M5 15h14"/>',
  fleche: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  bulles: '<path d="M7.001 15.085A1.5 1.5 0 0 1 9 16.5"/><circle cx="18.5" cy="8.5" r="3.5"/><circle cx="7.5" cy="16.5" r="5.5"/><circle cx="7.5" cy="4.5" r="2.5"/>',
};
for (const id of ['goutte', 'arome', 'stock', 'manque', 'achat', 'ebu', 'whirl', 'cuve-a', 'cuve-p', 'levure', 'barres', 'radar']) {
  const m = V3.match(new RegExp('<symbol id="j-' + id + '"[^>]*>([\\s\\S]*?)</symbol>'));
  ICO[id] = m[1];
}
const PICTOS_V3 = ORDRE.map((f) => V3.match(new RegExp('<symbol id="p-' + f + '"[^>]*>[\\s\\S]*?</symbol>'))[0]).join('\n');
// Les mêmes silhouettes au trait « currentColor » : l'aplat de famille d'Étiquette les porte en encre ou en blanc.
const PICTOS_Q = PICTOS_V3.replace(/id="p-/g, 'id="q-').replace(/stroke="#[0-9a-f]{6}"/g, 'stroke="currentColor"');
const TAILLES = { plus: 16, check: 16, x: 16, chevL: 16, heart: 16, ban: 16 };
const taille = (id) => TAILLES[id] || 14;
function symboles(W) {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  ${PICTOS_V3}
  ${PICTOS_Q}
  ${Object.entries(ICO).map(([id, d]) => `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${r1(24 / taille(id) * W * 1000) / 1000}" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`).join('\n  ')}
  <pattern id="hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><rect width="1.6" height="5" fill="#9a9aa2"/></pattern>
</svg>`;
}
const ic = (id, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" width="${taille(id)}" height="${taille(id)}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

// ======================================================================================
function construire(L) {
  const E = L.id === 'l3';
  // Étiquette : l'aplat de famille porte son picto en encre (fond clair) ou en blanc (fond foncé).
  const surAplat = (f) => (contraste(COUL[f], '#ffffff') >= 4.5 ? '#ffffff' : '#1a1714');
  const picto = (f, w = 16, attrs = '', plein = false) => `<svg class="pi" width="${w}" height="${w}" ${attrs} aria-label="${NOM[f]}"${plein ? ` style="color:${surAplat(f)}"` : ''}><use href="#${plein ? 'q' : 'p'}-${f}"/></svg>`;

  const STOCK = { suffisant: ['en stock', 'stock'], 'à acheter': ['à acheter', 'achat'], manque: ['stock insuffisant', 'manque'] };
  const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK[v.stock][0]}">${ic(STOCK[v.stock][1])}</span>`);
  const MOMENT = {
    b60: ['60′', 'ebu', 'à 60′'], b10: ['10′', 'ebu', 'à 10′'], wp: ['whirlpool', 'whirl', 'au whirlpool'],
    dryActive: ['actif', 'cuve-a', 'dry hop en fermentation active'], dryPost: ['après', 'cuve-p', 'dry hop après fermentation'], levure: ['levure', 'levure', 'levure : toute la fermentation'],
  };
  const pill = (id) => { const [t, i, lg] = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${ic(i)}<span>${t}</span></span>`; };
  const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
  // L'usage (v3) : attesté par le fournisseur sur une pastille ; déduit de l'α au trait seul, marqué α.
  const USAGE_IC = { amérisant: ic('goutte'), aromatique: ic('arome'), double: ic('goutte') + ic('arome'), inconnu: '<b class="inc">?</b>' };
  function usage(h) {
    const u = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle';
    const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
    return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${esc(h.houblon)}" role="img" aria-label="${esc(h.houblon)} : ${u}, ${dit}">${USAGE_IC[u] || USAGE_IC.inconnu}</span>`;
  }
  const usages = (v) => (v.fiches || []).map(usage).join('');
  const aFiche = (n) => NOMS_FICHE.includes(n);
  const nomH = (n) => (aFiche(n) ? `<span class="hn" data-houblon="${esc(n)}">${n}</span>` : `<span class="hn">${n}</span>`);
  const nomLigne = (v) => {
    if (v.levureVers) return `<span class="hn">${v.levureVers}</span>`;
    return v.actions.map((a) => nomH(a.houblon)).join('<span class="et"> + </span>');
  };

  // ---------- barres divergentes (s5) ----------
  function pctBar(f, e) {
    const s = Math.abs(e) / cran(f) / 3 * 100, a = Math.abs(e) / 50 * 100;
    return { s: Math.min(s, 100), a: Math.min(a, 100), ds: s > 100, da: a > 100 };
  }
  function hsSeg(f, b, side) {
    const z = zone(f); let s0, s1, a0, a1;
    if (z) { const zs = side === 'r' ? z.rS : z.lS, za = side === 'r' ? z.rA : z.lA; s0 = Math.min(zs, b.s); s1 = Math.max(0, b.s - zs); a0 = Math.min(za, b.a); a1 = Math.max(0, b.a - za); }
    else { s0 = Math.max(0, b.s - 5); s1 = Math.min(5, b.s); a0 = Math.max(0, b.a - 5); a1 = Math.min(5, b.a); }
    return `<i class="hs" style="--s0:${p(s0)};--s1:${p(s1)};--a0:${p(a0)};--a1:${p(a1)}"></i>`;
  }
  function bar(X, f, e, side, lab = '') {
    const b = pctBar(f, e), n = niv(X.v, f, e);
    let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}" style="--c:${COUL[f]};--f:${JET[f].fond};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
    if (X.hs.has(f)) h += hsSeg(f, b, side);
    if (lab) h += `<span class="lab-i" style="--s:${p(b.s)};--a:${p(b.a)}">${lab}</span>`;
    return h;
  }
  const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" aria-label="${NOM[f]} : effet non établi"></i>`;
  function zt(f, side) { const z = zone(f); if (!z) return ''; return ztEl(f, side === 'r' ? z.rS0 : z.lS0, side === 'r' ? z.rA0 : z.lA0); }
  const crOf = (X, f) => { const t = X.v.tout.find((x) => x.famille === f); return t && t.crans != null ? t.crans : null; };
  const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));
  function couloirs(X, avecLab = false) {
    const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
    const lab = (f) => (avecLab && crOf(X, f) != null ? arr(crOf(X, f)) : '');
    if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
    else if (e.floral.central >= 0) ra = zt('floral', 'r') + bar(X, 'floral', e.floral.central, 'r', lab('floral'));
    else { ra = zt('floral', 'r'); la = zt('floral', 'l') + bar(X, 'floral', e.floral.central, 'l'); }
    rb = zt('citrus', 'r') + (e.citrus.etabli ? bar(X, 'citrus', e.citrus.central, 'r', lab('citrus')) : inconnu('citrus'));
    lb = e.resin.etabli ? bar(X, 'resin', e.resin.central, 'l') : inconnu('resin');
    return `<div class="bars"><div class="m re"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><div class="g"></div><div class="m fl"><div class="ln a">${ra}</div><div class="ln b">${rb}</div></div></div>`;
  }

  // ---------- une case par famille : picto + jauge d'un trait par cran du style ----------
  function jauge(c, hors) {
    const n = Math.abs(c) < 0.5 ? 0 : Math.min(4, Math.round(Math.abs(c)));
    if (E) return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${n ? Array.from({ length: n }, () => '<i></i>').join('') : '<i class="pt"></i>'}</span>`;
    // Instrument : quatre graduations, allumées jusqu'au cran (couleur de la famille, orangé hors du style).
    return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${Array.from({ length: 4 }, (_, k) => `<i${k < n ? ' class="on"' : ''}></i>`).join('')}</span>`;
  }
  function caseFam(X, f, obj) {
    const t = X.v.tout.find((x) => x.famille === f);
    if (obj) {
      const e = X.v.effet[f];
      if (!e.etabli) return `<span class="cf o ne" data-famille="${f}" aria-label="${NOM[f]} : effet non établi">${picto(f, 14)}<span class="jg ne"><i></i></span></span>`;
      const c = t ? t.crans : 0, n = niv(X.v, f, e.central);
      return `<span class="cf o ${n}${e.central < 0 ? ' moins' : ''}" data-famille="${f}" data-crans="${c}" aria-label="${NOM[f]} ${sg(e.central)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}" style="--c:${COUL[f]};--f:${JET[f].fond};--t:${JET[f].texte}">${picto(f, 14, '', E && n === 'mq')}${jauge(c, X.hs.has(f))}</span>`;
    }
    if (!t || Math.abs(t.effet) < 0.5) return '<span class="cf vide"></span>';
    const n = niv(X.v, f, t.effet);
    return `<span class="cf ${n}${t.effet < 0 ? ' moins' : ''}" data-role="extra" data-famille="${f}" data-crans="${t.crans}" aria-label="${NOM[f]} ${sg(t.effet)} (${crTxt(t.crans)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}" style="--c:${COUL[f]};--f:${JET[f].fond};--t:${JET[f].texte}">${picto(f, 14, '', E && n === 'mq')}${jauge(t.crans, X.hs.has(f))}</span>`;
  }
  const casesVoie = (X, slots) => `<span class="cases"><span class="objs">${OBJ.map((f) => caseFam(X, f, true)).join('')}</span><span class="exs">${slots.map((f) => caseFam(X, f, false)).join('')}</span></span>`;

  // ---------- biotransformation ----------
  function bioPill(X) {
    const sig = (X.v.bio || []).flatMap((h) => h.signaux); if (!sig.length) return '';
    const has = (id) => sig.find((s) => s.id === id);
    const pf = (f) => picto(f, 14, `data-famille="${f}"`);
    let pic = '';
    if (has('geraniol-citronellol')) pic += `<span class="bt" title="${esc(has('geraniol-citronellol').titre)} (${has('geraniol-citronellol').statut})">${pf('floral')}${ic('fleche')}${pf('citrus')}</span>`;
    if (has('thiols')) pic += `<span class="bt" title="${esc(has('thiols').titre)} (${has('thiols').statut})">${pf('tropical')}${pf('berries')}</span>`;
    if (has('hop-creep')) pic += `<span class="bt mot" title="${esc(has('hop-creep').titre)} (${has('hop-creep').statut})">${ic('bulles')}<span>creep</span></span>`;
    const liste = sig.map((s) => `<li><b>${s.titre}</b> · ${s.statut}. <span class="src">${s.pourquoi}</span></li>`).join('');
    return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée">${pic}</summary><ul>${liste}</ul></details>`;
  }

  // ---------- haut de page ----------
  const seg = (cls, label, items) => `<div class="seg ${cls}" role="radiogroup" aria-label="${label}">${items.map(([t, on, attr = '', icn = '']) => `<button role="radio" aria-checked="${on}" ${attr}>${icn}<span>${t}</span></button>`).join('')}</div>`;
  const IBU_MIN = C.bandeIbu[0], IBU_MAX = C.bandeIbu[1];
  const cartouche = () => {
    // L4 (jauge à bande) : l'IBU de ma recette dans la bande du style, sur une étiquette de bière.
    const d0 = IBU_MIN - 10, d1 = IBU_MAX + 10, x = (v) => r1((v - d0) / (d1 - d0) * 64);
    return `<div class="cartouche">
      <span class="ct-nom">${C.recette}</span><span class="ct-style" data-role="style" data-code="${C.style}">${C.style}</span>
      <span class="ct-ibu" role="img" aria-label="IBU de ma recette : ${fr(C.ibu)}, bande du style ${IBU_MIN}–${IBU_MAX}"><b>${fr(C.ibu)}</b><small>IBU</small>
        <svg width="64" height="12" viewBox="0 0 64 12" aria-hidden="true"><rect x="0" y="5" width="64" height="2" fill="#1a1714"/><rect x="${x(IBU_MIN)}" y="2" width="${r1(x(IBU_MAX) - x(IBU_MIN))}" height="8" fill="#1a1714" fill-opacity=".22"/><rect x="${r1(x(C.ibu) - 1.5)}" y="0" width="3" height="12" fill="#1a1714"/></svg></span>
    </div>`;
  };
  const tete = () => `
  <header class="haut">
    <div class="barre">
      <a class="retour" href="#" aria-label="Retour">${ic('chevL')}</a>
      ${seg('nav', 'Partie', [['Ma bière', false], ['Suggestions', true], ['Comparer', false]])}
    </div>
    ${E ? cartouche() : ''}
    <div class="outils">
      ${seg('lentille', 'Lecture des familles', [['Au style', true, 'data-e="style"'], ['Absolu', false, 'data-e="absolu"']])}
      ${seg('vue', 'Vue', [['Barres', true, '', ic('barres')], ['Radar', false, '', ic('radar')]])}
    </div>
  </header>`;

  function meilleure(f, sens) {
    const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
    return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
  }
  // Étiquette : la cible en barre épaisse sur l'aplat ; Instrument : un cadran gradué en crans du style.
  function cible(frac, visee) {
    const w = 92, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
    return `<svg class="cible" width="${w}" height="16" viewBox="0 0 ${w} 16" aria-hidden="true"><rect x="0" y="3" width="${w}" height="10" fill="#ffffff"/><rect x="0" y="3" width="${b}" height="10" fill="#1a1714"/><rect x="${x - 1}" y="0" width="3" height="16" fill="#1a1714"/><rect x="${x}" y="3" width="1" height="10" fill="#ffffff"/></svg>`;
  }
  // Cadran : demi-cercle de 0 à max crans ; zone du style (base pâle), au-delà orangé fin, visée en
  // trait d'encre, aiguille de la meilleure voie à la couleur de la famille. Aucune position inventée.
  function cadran(f, o) {
    const W = 104, H = 58, cx = 52, cy = 52, R = 42;
    const ang = (v) => Math.PI * (1 - Math.max(0, Math.min(o.max, v)) / o.max);
    const pt = (v, r) => [r1((cx + r * Math.cos(ang(v))) * 10) / 10, r1((cy - r * Math.sin(ang(v))) * 10) / 10];
    const arc = (a, b, r) => { const [x0, y0] = pt(a, r), [x1, y1] = pt(b, r); return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`; };
    let s = `<svg class="cadran" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
    s += `<path d="${arc(0, o.max, R)}" fill="none" stroke="#c9c9c4" stroke-width="1"/>`;
    s += `<path d="${arc(o.z0, Math.min(o.max, o.z1), R - 4)}" fill="none" stroke="${COUL[f]}" stroke-opacity=".28" stroke-width="7"/>`;
    if (o.z1 < o.max) s += `<path d="${arc(o.z1, o.max, R - 4)}" fill="none" stroke="${ALERTE}" stroke-width="1.5"/>`;
    if (o.mb) s += `<path d="${arc(o.mb[0], o.mb[1], R - 4)}" fill="none" stroke="${ALERTE}" stroke-width="7"/>`;
    for (let v = 0; v <= o.max + 1e-9; v += o.pas) { const maj = Math.abs(v / o.maj - Math.round(v / o.maj)) < 1e-6; const [a, b] = pt(v, R + 1), [c, d] = pt(v, R + (maj ? 7 : 4)); s += `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#55555b" stroke-width="${maj ? 1.2 : 0.8}"/>`; }
    const [vx0, vy0] = pt(o.visee, R - 12), [vx1, vy1] = pt(o.visee, R + 7);
    s += `<line x1="${vx0}" y1="${vy0}" x2="${vx1}" y2="${vy1}" stroke="#141416" stroke-width="2" stroke-dasharray="2.5 2"/>`;
    const [nx, ny] = pt(o.aiguille, R - 2);
    s += `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${COUL[f]}" stroke-width="2.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="#141416"/>`;
    return s + '</svg>';
  }
  function reponses() {
    const fl = meilleure('floral', 1), ci = meilleure('citrus', 1);
    const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
    const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
    const dFl = verd('floral', vFl), dCi = verd('citrus', vCi);
    const MOT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };
    const re = meilleure('resin', -1);
    const dRe = DEG.min + re.v.effet.resin.central <= OB.resin.visee ? 'atteint' : 'aucune';
    const frFl = fl.v.effet.floral.central / OB.floral.cran, frCi = ci.v.effet.citrus.central / OB.citrus.cran;
    const hh = `<button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon${ic('chevR')}</button>`;
    // Instrument : l'écart de la meilleure voie, écrit en crans du style à côté du cadran.
    const lecture = (x) => `<span class="lec" aria-hidden="true">${(x > 0 ? '+' : '') + fr(x)}</span>`;
    const crRes = (v) => v / OB.resin.cran; // résineux, en crans du style (bande 0–30, cran 10)
    const cadRe = cadran('resin', { max: 10, pas: 1, maj: 5, z0: 0, z1: bande('resin')[1] / OB.resin.cran, visee: crRes(OB.resin.visee), mb: [crRes(DEG.min), crRes(DEG.max)], aiguille: crRes(DEG.min + re.v.effet.resin.central) });
    const cadFl = cadran('floral', { max: 3, pas: 0.25, maj: 1, z0: 0, z1: (bande('floral')[1] - OB.floral.maBiere.central) / OB.floral.cran, visee: 1, aiguille: frFl });
    const cadCi = cadran('citrus', { max: 3, pas: 0.25, maj: 1, z0: 0, z1: (bande('citrus')[1] - OB.citrus.maBiere.central) / OB.citrus.cran, visee: 1, aiguille: frCi });
    const sceau = (f, alerte = false) => `<span class="sceau" style="--sc:${contraste(COUL[f], '#1a1714') >= 4.5 ? '#1a1714' : '#ffffff'}">${picto(f, 18)}${alerte ? '<i class="alerte"></i>' : ''}</span>`;
    // avant : sous le titre (Instrument : le cadran) ; apres : sous la réponse (la cible, « Hors houblon »).
    const tuile = (f, titre, verdict, avant, apres, label, extra = '') => `
    <section class="tuile ${f}" data-role="objectif" data-famille="${f}" aria-label="${esc(label)}" style="--c:${COUL[f]};--t:${JET[f].texte};--f:${JET[f].fond};--sur:${surAplat(f)}">
      ${E ? sceau(f, f === 'resin') + `<span class="nom">${titre}</span>` : `<span class="nom"><span class="pa">${picto(f, 16)}${f === 'resin' ? '<i class="alerte"></i>' : ''}</span>${titre}</span>`}
      ${avant}
      <div class="rep v-${verdict}" data-role="reponse" data-famille="${f}" data-verdict="${verdict}">${MOT[verdict]}${extra}</div>
      ${apres}
    </section>`;
    const lFl = `Plus floral : la meilleure voie, ${nomVoie(fl.v).nom}, ${MOT[dFl].toLowerCase()} la visée (${fr(OB.floral.maBiere.central)} → ${fr(vFl)}, visée ${fr(OB.floral.visee)}) ; ${fr(frFl)} cran sur 1`;
    const lCi = `Plus agrumes : la meilleure voie, ${nomVoie(ci.v).nom}, ${MOT[dCi].toLowerCase()} la visée (${fr(OB.citrus.maBiere.central)} → ${fr(vCi)}, visée ${fr(OB.citrus.visee)}) ; ${fr(frCi)} cran sur 1`;
    const lRe = 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène';
    return `
  <div class="reps">
    ${E ? tuile('resin', 'Moins résineux', dRe, '', hh, lRe, '<small>voie houblon</small>') : tuile('resin', 'Moins résineux', dRe, `<div class="cad">${cadRe}</div>`, hh, lRe, '<small>voie houblon</small>')}
    ${E ? tuile('floral', 'Plus floral', dFl, '', cible(frFl / 1.15, 1 / 1.15), lFl) : tuile('floral', 'Plus floral', dFl, `<div class="cad">${cadFl}${lecture(frFl)}</div>`, '', lFl)}
    ${E ? tuile('citrus', 'Plus agrumes', dCi, '', cible(frCi / 1.7, 1 / 1.7), lCi) : tuile('citrus', 'Plus agrumes', dCi, `<div class="cad">${cadCi}${lecture(frCi)}</div>`, '', lCi)}
  </div>`;
  }
  // Le graphique : deux demi-pistes sans fond ; ma bière au rail central ; visées en tirets.
  function fonds() {
    const flS = viseeS('floral'), flA = viseeA('floral'), ciA = viseeA('citrus');
    const fo0 = cl((DEG.min - OB.resin.visee) / 50 * 100);
    // Instrument : une graduation fine par cran du style (3 à droite, 1 à gauche) ou par 10 points en absolu.
    const grad = E ? '' : [1, 2, 3].map((k) => `<i class="grad sty-only" style="--x:${p(k / 3 * 100)}"></i>`).join('') + [1, 2, 3, 4, 5].map((k) => `<i class="grad abs-only" style="--x:${p(k * 20)}"></i>`).join('');
    const gradG = E ? '' : `<i class="grad g sty-only" style="--x:100%"></i><i class="grad g abs-only" style="--x:${p(10 / (50 / 3) * 100)}"></i>`;
    return `
    <div class="fonds">
      <div class="moitie re" data-role="piste" data-famille="resin">
        <i class="flou" style="--s0:100%;--s1:0%;--a0:${p(fo0)};--a1:${p(100 - fo0)}"></i>${gradG}
      </div>
      <div class="gut"></div>
      <div class="moitie fl" data-role="piste" data-famille="floral">
        <i class="ov" data-role="piste" data-famille="citrus"></i>${grad}
        <i class="vl" style="--s:${p(flS)};--a:${p(flA)}"></i>
        <i class="vl" style="--s:${p(viseeS('citrus'))};--a:${p(ciA)}"></i>
      </div>
    </div>
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce v gauche-v">${ic('chevL')}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v sty-only" style="--s:${p(flS)}">visée</span>
        <span class="puce pv abs-only" style="--a:${p(flA)}" data-famille="floral">${picto('floral', 14)}</span><span class="puce pv abs-only" style="--a:${p(ciA)}" data-famille="citrus">${picto('citrus', 14)}</span></div>
    </div>`;
  }
  function details() {
    const ib = V.map((X) => nomVoie(X.v).nom + ' ' + MOMENT[momentDe(X.v)][0] + ' ' + fr(X.v.ibu.after)).join(' · ');
    const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)} <span class="src">${x.preuve}</span></li>`).join('')).join('');
    return `
  <details class="pli">
    <summary>IBU après chaque voie (ma bière ${fr(C.ibu)} ; style ${C.bandeIbu.join('–')})</summary>
    <ul><li>${ib}</li></ul>
  </details>
  <details class="pli" id="hh">
    <summary>Hors houblon · résineux (${C.horsModele[0].pistes.length} pistes)</summary>
    <ul>${hh}</ul>
  </details>`;
  }

  // ---------- la fiche g1 (contenu de la base), dans le langage ----------
  const NR = 'non renseigné';
  const nbF = (v) => String(v).replace('.', ',');
  const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
  const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
  const ROLE_MOT = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'double usage' };
  const libMoment = (c) => (c === 'fwh' ? 'premier moût' : c === 'wp' ? 'whirlpool' : /^dry/.test(c) ? 'à froid' : c.slice(1) + '′');
  const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
  function reglette(F, a) {
    const W = E ? 92 : 132, x = (v) => r1(2 + Math.max(0, Math.min(1, v / 25)) * (W - 4));
    let s = `<svg class="f-reglette" width="${W}" height="14" viewBox="0 0 ${W} 14" aria-hidden="true">`;
    s += E ? `<rect x="2" y="5" width="${W - 4}" height="4" fill="#1a1714" fill-opacity=".14"/>` : `<rect x="2" y="7" width="${W - 4}" height="1" fill="#8b8b90"/>` + [0, 5, 10, 15, 20, 25].map((v) => `<rect x="${r1(x(v) - 0.5)}" y="${v % 25 ? 5 : 3}" width="1" height="${v % 25 ? 5 : 9}" fill="#8b8b90"/>`).join('');
    for (const src of F.alpha) s += `<rect x="${r1(x(src.min) - 1)}" y="${E ? 3 : 5}" width="${r1(Math.max(3, x(src.max) - x(src.min) + 2))}" height="${E ? 8 : 5}" fill="${src === a ? '#1a1714' : '#a7a7ad'}"/>`;
    if (F.lot != null) s += `<rect x="${r1(x(F.lot) - 1.5)}" y="0" width="3" height="14" fill="#141416" stroke="#ffffff" stroke-width="1"/>`;
    return s + '</svg>';
  }
  function roue(F) {
    const W = 340, H = 226, cx = 170, cy = 113, R = 74;
    const par = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
    const of = (F.aromes[0] || {}).of || 1;
    const ang = (i) => (-90 + i * 30) * Math.PI / 180;
    const P = (i, r) => [r1(cx + r * Math.cos(ang(i))), r1(cy + r * Math.sin(ang(i)))];
    let s = `<svg class="f-roue" data-radar data-objet="fiche" data-axes="${ROUE.join(',')}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Roue des arômes de ${esc(F.nom)}, au nombre de fiches">`;
    // Secteur hachuré : famille non décrite (inconnue, jamais un zéro).
    ROUE.forEach((f, i) => { if (par[f] && par[f].n) return; const [x0, y0] = P(i - 0.5, R), [x1, y1] = P(i + 0.5, R); s += `<path d="M${cx} ${cy}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z" fill="url(#hach)" fill-opacity=".55"/>`; });
    for (let k = 1; k <= of; k++) s += `<circle cx="${cx}" cy="${cy}" r="${r1(R * k / of)}" fill="none" stroke="${E ? '#1a1714' : '#b9b9b4'}" stroke-opacity="${E ? 0.35 : 1}" stroke-width="${E ? 1.5 : 0.8}"/>`;
    ROUE.forEach((f, i) => { const [x, y] = P(i, R); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${COUL[f]}" stroke-width="${E ? 2.5 : 1.2}"/>`; });
    const vals = ROUE.map((f) => (par[f] ? par[f].n / of : 0));
    const pts = vals.map((v, i) => P(i, R * v));
    const inconnues = ROUE.filter((f) => !par[f] || !par[f].n);
    s += `<g data-serie="${esc(F.nom)}" data-valeurs="${vals.map((v) => r1(v * 100) / 100).join(',')}" data-inconnues="${inconnues.join(',')}"><path d="M${pts.map((q) => q.join(' ')).join('L')}Z" fill="#141416" fill-opacity="${E ? 0.16 : 0.08}" stroke="#141416" stroke-width="${E ? 3 : 1.5}" stroke-linejoin="round"/></g>`;
    ROUE.forEach((f, i) => { const [x, y] = pts[i]; s += vals[i] ? `<circle cx="${x}" cy="${y}" r="${E ? 4.5 : 3}" fill="#141416"/>` : `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" stroke="#141416" stroke-width="1.2" data-inconnu="${f}"/>`; });
    ROUE.forEach((f, i) => {
      const [x, y] = P(i, R + 12), a = par[f], c = Math.cos(ang(i));
      const anc = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
      const dy = Math.sin(ang(i)) > 0.5 ? 11 : Math.sin(ang(i)) < -0.5 ? -2 : 4;
      const conn = a && a.n;
      s += `<text x="${x}" y="${r1(y + dy)}" text-anchor="${anc}" class="${conn ? 'lb' : 'lb nd'}">${COURT[f]}${conn ? (of > 1 ? `<tspan class="nm"> ${a.n}/${of}</tspan>` : '') : '?'}</text>`;
    });
    return s + '</svg>';
  }
  const caseF = (f, n, sep) => `<i class="c${n >= 2 ? ' m' : n === 1 ? ' ci' : ''}${sep ? ' sep' : ''}" data-famille="${f}" style="--c:${COUL[f]};--f:${JET[f].fond}" aria-hidden="true"></i>`;
  function fiche(F) {
    const a = recente(F.alpha), role = F.role ? ROLE_MOT[F.role.v] || F.role.v : null;
    const regle = F.role && /^règle/.test(F.role.src || '');
    const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : NR;
    const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
    const of = (F.aromes[0] || {}).of || 0;
    const ordre = [...ATTENDUES, ...ORDRE.filter((f) => !ATTENDUES.includes(f))];
    const decrites = ordre.filter((f) => par[f] && par[f].n > 0), nd = ordre.filter((f) => !par[f] || !par[f].n);
    const fichesTxt = (x) => (x.of === 1 ? '' : x.n + '/' + x.of);
    const seule = of === 1 ? ((F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] || '') : '';
    // Au plus 100 mots : les mots sans famille au-delà de 4 se comptent (« +6 »), la liste reste dans Sources.
    const sans = F.sansFamille.map((s) => s.mot);
    const sansTxt = sans.length > 4 ? sans.slice(0, 4).join(', ') + ' +' + (sans.length - 4) : sans.join(', ');
    const lignes = decrites.map((f) => {
      const x = par[f], cpt = fichesTxt(x), prem = x.n === 1 && (x.premier || []).length ? 'nommé en premier' : '';
      const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
      const motsTxt = mots.length > 5 ? mots.slice(0, 5).join(', ') + ' +' + (mots.length - 5) : mots.join(', ');
      return `<div class="f-lab">${caseF(f, x.n)}<span class="f-lab-t"><span class="f-lab-n" style="--t:${JET[f].texte}">${COURT[f]}</span>${[cpt, prem].filter(Boolean).length ? ' <span class="f-cpt">' + [cpt, prem].filter(Boolean).join(' · ') + '</span>' : ''}</span>${mots.length ? `<span class="f-lab-mots">${motsTxt}</span>` : ''}</div>`;
    }).join('');
    const dem = OBJ.map((f) => { const x = par[f], sens = OB[f].crans > 0 ? '+' : '−'; return `<span class="f-dem-i"><b>${sens} ${COURT[f]}</b> ${x && x.n ? (x.of === 1 ? '1 seule fiche' : x.n + '/' + x.of) : 'inconnu'}</span>`; }).join('');
    const X = F.voie, moment = X ? libMoment(X.v.actions[0].momentId) : null;
    const st = X ? `<span class="stk" role="img" aria-label="${STOCK[X.v.stock][0]}">${ic(STOCK[X.v.stock][1])}</span>` : '';
    const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
    const rg = (n, v) => `<div class="f-rg"><span class="f-rg-n">${n}</span><span class="f-rg-v">${v}</span></div>`;
    const tags = (l) => `<div class="tags">${l.map((t) => `<span class="tag-f">${t}</span>`).join('')}</div>`;
    const SECTIONS = [
      ['styles', 'Styles', (F.styles.length ? tags(F.styles) : `<p class="f-txt">${F.stylesRaison || NR}</p>`) + (F.stylesSrc.length ? `<p class="f-txt">${F.stylesSrc.join(' ; ')}</p>` : '')],
      ['huiles', 'Huiles', (F.huiles.length ? F.huiles.map((s) => rg('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')).join('') : rg('totale', NR)) + F.composants.map((c) => rg(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || NR)).join('')],
      ['sources', 'Sources', F.alpha.map((s) => rg('α ' + srcTxt(s), plageF(s) + ' %')).join('') + (F.lot != null ? rg('α mon lot', nbF(F.lot) + ' %') : '') + (F.beta.length ? F.beta.map((s) => rg('β ' + srcTxt(s), plageF(s) + ' %')).join('') : rg('β', NR))
        + `<p class="f-txt">Origine : ${F.origine || NR}</p>` + F.aromes.filter((x) => x.n > 0).map((x) => `<p class="f-txt"><b>${COURT[x.f]}${x.of === 1 ? '' : ' ' + x.n + '/' + x.of}</b> ${x.auteurs.join(', ') || NR}</p>`).join('')
        + (sans.length ? `<p class="f-txt">Sans famille : ${F.sansFamille.map((s) => s.mot + ' (' + s.source + ')').join(', ')}</p>` : '') + (F.desc.length ? tags(F.desc) : '')],
      ['subs', 'Substituts', F.subs.length ? tags(F.subs) : F.subsCalc.length ? tags(F.subsCalc) + `<p class="f-txt">Remplaçants calculés depuis les fiches du dépôt, à valider.</p>` : `<p class="f-txt">${F.subsRaison || NR}</p>`],
    ];
    return `<template data-fiche="${esc(F.nom)}"><section class="f-fiche" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(F.nom)}">
  <div class="f-poignee" aria-hidden="true"></div>
  <header class="f-tete"><h2 class="f-nom">${F.nom}</h2>${st}<button class="f-fermer" data-role="fermer-fiche" aria-label="Fermer la fiche de ${esc(F.nom)}">${ic('x')}</button></header>
  <div class="f-ab">
    <span class="f-alpha" data-role="fiche-alpha" aria-label="Acides alpha ${txt}${a ? ' (' + srcTxt(a) + ')' : ''}${F.lot != null && a ? ', mon lot ' + nbF(F.lot) + ' %' : ''}"><span class="f-grec">α</span><b class="f-aa">${txt}</b>${a && F.lot != null ? `<span class="f-lot">lot ${nbF(F.lot)} %</span>` : ''}</span>
    ${a ? reglette(F, a) : ''}
    ${role ? `<span class="f-role${regle ? ' regle' : ''}" aria-label="Rôle : ${role}${F.role.src ? ', ' + esc(F.role.src) : ''}">${role}</span>` : ''}
  </div>
  ${/cryo$/i.test(F.nom) ? `<p class="f-note">α : plages de ${F.nom.replace(/\s*cryo$/i, '')} en pellets ; la fiche du cryo manque.</p>` : ''}
  <div class="f-labels" data-role="fiche-labels">
    <div class="f-bande" role="img" aria-label="Les familles citées par les fiches de ${esc(F.nom)}"><span class="f-bande-c">${ordre.map((f, i) => caseF(f, par[f] ? par[f].n : 0, i === ATTENDUES.length)).join('')}</span>${seule ? `<span class="f-seule">1 seule fiche : ${seule}</span>` : ''}</div>
    ${lignes}
    ${sans.length ? `<p class="f-lab-sans">sans famille : ${sansTxt}</p>` : ''}
    ${nd.length ? `<p class="f-lab-nd">${nd.length} non décrite${nd.length > 1 ? 's' : ''} : ${nd.map((f) => COURT[f]).join(', ')}</p>` : ''}
  </div>
  <div class="f-arome" data-role="fiche-arome">${roue(F)}<p class="f-dem" data-role="demande">${dem}</p></div>
  <div class="f-actions">
    <span class="f-gout" role="group" data-role="gout" aria-label="Mon goût pour ${esc(F.nom)} : neutre"><button class="f-g" aria-pressed="false" aria-label="Aimer ${esc(F.nom)}">${ic('heart')}</button><button class="f-g" aria-pressed="false" aria-label="Exclure ${esc(F.nom)}">${ic('ban')}</button></span>
    ${moment ? `<button class="f-act f-ajouter" aria-pressed="false" aria-label="Ajouter ${esc(F.nom)} à ${moment}">${ic('plus')}<span>Ajouter à ${moment}</span></button>` : ''}
    <button class="f-act f-comparer" data-voie-cible="${X ? X.n : ''}" aria-label="Comparer ${esc(F.nom)} à d'autres houblons">Comparer</button>
  </div>
  <div class="f-replis" role="group" aria-label="Détail de la fiche">${SECTIONS.map(([id, t]) => `<button class="f-repli" aria-expanded="false" data-sec="${id}">${t}</button>`).join('')}</div>
  ${SECTIONS.map(([id, t, h]) => `<section class="f-sec" data-sec="${id}" aria-label="${t}" hidden>${h}</section>`).join('')}
</section></template>`;
  }

  // ======================= etat-b.html =======================
  const AJOUTEES = [1, 15];
  const groupesEffet = [];
  for (const X of V) { const k = JSON.stringify(X.v.effet); const g = groupesEffet.find((x) => x.k === k); if (g) g.voies.push(X); else groupesEffet.push({ k, voies: [X] }); }
  const memes = groupesEffet.filter((g) => g.voies.length > 1);
  const seuls = new Set(groupesEffet.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
  const slotsDe = (xs) => ORDRE.filter((f) => !OBJ.includes(f) && xs.some((X) => X.extras.some((t) => t.famille === f)));
  const ajc = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}">${ic('plus', 'i-plus')}${ic('check', 'i-check')}</button>`; };
  const ligne = (X, slots, cls = '') => {
    const { q } = nomVoie(X.v);
    const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
    const carte = X.v.actions.some((a) => aFiche(a.houblon)) ? ' data-role="ajout-rapide"' : '';
    return `<div class="vr${cls}" data-voie="${X.n}"${carte}>
        <div class="l1">${usages(X.v)}<b class="nm">${nomLigne(X.v)}</b><span class="gr">${dose}${stockMarque(X.v)}</span>${bioPill(X)}${ajc(X)}</div>
        ${casesVoie(X, slots)}
      </div>`;
  };
  const blocMeme = (g, gi) => {
    const slots = slotsDe(g.voies);
    const sig = (X) => X.extras.map((t) => t.famille).join();
    const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
    const dose = g.voies[0].v.actions[0].grammes + ' g';
    return `<div class="groupe meme"><span class="t">${ic('equal')}${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${dose}</span>${pill(momentDe(g.voies[0].v))}</div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab">${ord.map((X, i) => ligne(X, slots, i && sig(ord[i - 1]) !== sig(X) ? ' coupe-l' : '')).join('')}</div>`;
  };
  const GESTES = [
    { t: 'Assembler 5 + 5 g', ic: ic('arome'), mo: 'b10', est: true, voies: [6, 8] },
    { t: 'Remplacer ' + C.ajouts.map((a) => (FICHES.find((f) => f.key === a.houblon) || {}).name).join(), ic: ic('goutte'), mo: 'b60', voies: [12, 13, 14] },
    { t: 'Dry hop', ic: ic('arome'), mo: 'dryActive', est: true, voies: [15] },
    { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
  ].map((g) => ({ ...g, voies: g.voies.filter((n) => seuls.has(n)) })).filter((g) => g.voies.length);
  const blocGeste = (g) => {
    const xs = g.voies.map((n) => V[n - 1]), slots = slotsDe(xs);
    return `<div class="groupe geste"><span class="t">${g.ic}${g.t}</span>${pill(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>
    ${xs.map((X) => `<div class="tab seul">${ligne(X, slots)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;
  };
  const corps = `${tete()}${reponses()}
  <div class="graph">${fonds()}
    ${memes.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="#">${E ? '' : ic('chevR', 'cmp-i')}<span>Comparer</span> <b class="nb">(${AJOUTEES.length})</b></a>`;
  const fiches = NOMS_FICHE.map((n) => fiche(ficheH(n))).join('\n');
  // Mots de chaque fiche (≤ 100, D25) : estimation sur le texte rendu, sections repliées exclues.
  for (const n of NOMS_FICHE) {
    const h = fiche(ficheH(n)).replace(/<section class="f-sec"[\s\S]*?<\/section>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
    const m = h.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    if (m > 95) console.log('  ' + L.id + ' fiche ' + n + ' : ' + m + ' mots (estimation)');
  }
  // L'abécédaire de la planche : les vrais composants de la page, isolés.
  const X1 = V[0], X15 = V[14];
  const tuiles = reponses().match(/<section class="tuile floral"[\s\S]*?<\/section>/)[0];
  L.abc = `
    <div class="abc">
      <section class="ab"><h3>surfaces</h3><div class="sw">${L.surfaces.map(([n, c]) => `<span class="s"><i style="background:${c}"></i><small>${n}<br>${c}</small></span>`).join('')}</div></section>
      <section class="ab"><h3>texte</h3><div class="tx">${L.textes.map(([cls, t, d]) => `<span class="t ${cls}">${t}</span><small>${d}</small>`).join('')}</div></section>
      <section class="ab demi"><h3>objectif</h3><div class="reps un">${tuiles}</div></section>
      <section class="ab demi"><h3>familles</h3><div class="fam">
        <span class="it">${caseFam(X1, 'citrus', true)}<small>marqué</small></span>
        <span class="it">${caseFam(X1, 'tropical', false)}<small>cité</small></span>
        <span class="it">${caseFam(V[11], 'resin', true)}<small>baisse</small></span>
        <span class="it">${caseFam(X15, 'citrus', true)}<small>hors du style</small></span>
        <span class="it">${caseFam(V[8], 'floral', true)}<small>inconnu</small></span>
      </div>
      <h3>actions</h3><div class="act">${ajc({ ...X1, n: 0 })}${ajc(X1)}${usages(V[2].v)}${usages(X1.v)}${pill('b10')}${pill('dryActive')}${stockMarque(V[1].v)}</div>
      <h3>bouton</h3><a class="cmp statique" href="#">${E ? '' : ic('chevR', 'cmp-i')}<span>Comparer</span> <b class="nb">(2)</b></a></section>
      <section class="ab"><h3>pistes au style</h3><div class="graph mini-g"><div class="fonds"><div class="moitie re"></div><div class="gut"></div><div class="moitie fl"><i class="vl" style="--s:${p(viseeS('floral'))};--a:${p(viseeA('floral'))}"></i></div></div>
        <div class="rangee">${couloirs(X15, false)}</div></div></section>
    </div>`;
  return `<!doctype html>
<html lang="fr" data-cas="c1" data-langage="${L.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${L.titre}</title>
<!-- Lot 18 · ${L.titre} · q2b repris (c1) dans le langage ${L.id}. Généré par l3/generateur-baseline.mjs depuis
     fils15-s5-complexe/donnees/c1.json, pack-fiches.json et le jeu v3 duo. ${L.commentaire} -->
<style>${CSS_COMMUN}${L.css}</style>
</head>
<body>
${symboles(L.W)}
<main class="ecran">${corps}
</main>
<div id="fiche-racine"></div>
${fiches}
<script>${JS}</script>
</body>
</html>
`;
}

// ---------- structure commune (positions de q2b), sans peau ----------
const CSS_COMMUN = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { flex: none; }
  .ic { display: block; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 8px 16px 88px; display: flex; flex-direction: column; gap: 12px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 8px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; flex: none; color: inherit; }
  .seg { display: flex; }
  .seg button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; }
  .barre .seg { flex: 1; } .barre .seg button { flex: 1; }
  .outils { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; }
  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tuile { display: flex; flex-direction: column; position: relative; overflow: hidden; }
  .nom { display: flex; align-items: center; gap: 4px; }
  .pa, .sceau { position: relative; display: inline-flex; flex: none; }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 9px; height: 9px; border-radius: 50%; background: var(--acc); }
  .rep small { display: block; }
  .hh-b { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; align-self: flex-start; }
  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; }
  .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .grad { position: absolute; top: 0; bottom: 0; width: 0; left: var(--x); }
  .re .grad { left: auto; right: var(--x); }
  .tetes { position: relative; display: flex; height: 34px; margin-top: 2px; }
  .tetes .m { flex: 1; position: relative; }
  .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; border: 4.25px solid transparent; }
  .puce { position: absolute; top: 11px; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px; }
  .puce.gauche-v { left: 4px; }
  .fl .puce.v { left: calc(var(--s) - 21px); }
  .fl .puce.pv { left: calc(var(--a) - 12px); }
  .abs-only { display: none !important; }
  body.abs .abs-only { display: inline-flex !important; }
  body.abs i.abs-only { display: block !important; }
  body.abs .sty-only { display: none !important; }
  .groupe { position: relative; display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 4px; z-index: 2; }
  .groupe > span.t { display: inline-flex; gap: 5px; align-items: center; white-space: nowrap; }
  .mo { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; font-variant-numeric: tabular-nums; flex: none; }
  .bars { position: relative; display: flex; }
  .bars .m { position: relative; flex: 1; }
  .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; }
  .zt { position: absolute; width: var(--s); }
  .zt::after { content: ''; position: absolute; }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; }
  .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; min-width: 3px; width: var(--s); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; } .re .bar { right: 0; }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 50%; margin-top: -3px; right: 2px; border: 3px solid transparent; border-left: 5px solid #fff; }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; }
  .re .hs { left: auto; right: var(--s0); }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; left: calc(var(--s) + 5px); white-space: nowrap; z-index: 3; }
  body.abs .lab-i { left: calc(var(--a) + 5px); }
  .tab { position: relative; z-index: 3; }
  .l1 { display: flex; align-items: center; gap: 5px; min-height: 30px; }
  .nm { display: inline-flex; flex-wrap: wrap; align-items: baseline; }
  .gr { display: inline-flex; align-items: center; gap: 3px; }
  .stk, .us { display: inline-flex; align-items: center; flex: none; }
  .ajc { margin-left: auto; width: 30px; height: 30px; position: relative; flex: none; display: inline-flex; align-items: center; justify-content: center; }
  .ajc .i-check, .ajc[aria-pressed="true"] .i-plus { display: none; }
  .ajc[aria-pressed="true"] .i-check { display: block; }
  .cases { display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; }
  .objs, .exs { display: inline-flex; gap: 3px; }
  .cf { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; position: relative; }
  .cf .pi { display: block; }
  .jg { display: inline-flex; align-items: flex-end; }
  .rangee { position: relative; padding: 2px 0 10px; }
  details.bio { display: inline-block; position: static; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; }
  .bt.mot span { margin-left: 2px; }
  details.bio[open] ul { position: absolute; left: 6px; right: 6px; z-index: 6; padding: 10px 12px 10px 26px; display: flex; flex-direction: column; gap: 6px; }
  details.pli summary { cursor: pointer; }
  details.pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; }
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
  [data-houblon], [data-role="ajout-rapide"] { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .hn[data-houblon] { cursor: default; }

  /* La fiche : feuille du bas au téléphone, bulle à côté de la colonne à l'ordinateur. */
  .f-voile { position: fixed; inset: 0; z-index: 19; background: rgba(0,0,0,.38); }
  .f-fiche { position: fixed; z-index: 20; overflow: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px; }
  .f-fiche.f-feuille { left: 0; right: 0; bottom: 0; max-height: calc(100% - 64px); max-width: 390px; margin: 0 auto; padding: 6px 16px 16px; }
  .f-fiche.f-bulle { width: 372px; max-height: calc(100% - 16px); padding: 12px 16px 16px; }
  .f-bulle .f-poignee { display: none; }
  .f-poignee { width: 40px; height: 4px; margin: 0 auto; flex: none; }
  .f-tete { display: flex; align-items: center; gap: 6px; }
  .f-fermer { margin-left: auto; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .f-ab { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 5px; }
  .f-labels { display: flex; flex-direction: column; gap: 6px; }
  .f-bande { display: flex; align-items: center; gap: 8px; }
  .f-bande-c { display: inline-flex; gap: 2px; }
  .f-bande-c .c { width: 20px; height: 14px; }
  .f-bande-c .c.sep { margin-left: 6px; }
  .f-lab { display: grid; grid-template-columns: 16px auto 1fr; align-items: baseline; column-gap: 6px; }
  .f-lab .c { width: 14px; height: 10px; align-self: center; }
  .f-arome { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .f-dem { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .f-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .f-gout { display: inline-flex; gap: 4px; }
  .f-g { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; }
  .f-act { height: 32px; display: inline-flex; align-items: center; gap: 4px; padding: 0 12px; white-space: nowrap; }
  .f-replis { display: flex; gap: 6px; flex-wrap: wrap; }
  .f-repli { height: 28px; padding: 0 10px; }
  .f-sec { display: flex; flex-direction: column; gap: 4px; }
  .f-sec[hidden] { display: none; }
  .f-rg { display: flex; justify-content: space-between; gap: 8px; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag-f { padding: 2px 6px; }
  .src-ligne.f-source { outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

// ---------- les gestes : lentille, « + », appui long et survol long (D25, D49), comme base/generateur/fiche.js ----------
const JS = `
  document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
  const compter = () => { document.querySelector('.cmp .nb').textContent = '(' + document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length + ')'; };
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); compter(); }));

  const APPUI_MS = 500, SURVOL_MS = 750, REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const racine = document.getElementById('fiche-racine');
  const FI = { nom: null, mode: null, epingle: false, tFerme: null, source: null };
  const tpl = (nom) => document.querySelector('template[data-fiche="' + CSS.escape(nom) + '"]');
  const CARTE = '[data-role="ajout-rapide"]', COMMANDE = 'button, input, select, textarea, a, summary, details, [role="button"], [data-role="ajouter-comparer"]';
  function zoneHoublon(t) {
    if (!t || !t.closest || racine.contains(t)) return null;
    const e = t.closest('[data-houblon]');
    if (e) return tpl(e.dataset.houblon) ? { el: e, zone: e.closest(CARTE) || e } : null;
    const c = t.closest(CARTE); if (!c) return null;
    const cmd = t.closest(COMMANDE); if (cmd && c.contains(cmd)) return null;
    const n = [...c.querySelectorAll('[data-houblon]')].find((x) => tpl(x.dataset.houblon));
    return n ? { el: n, zone: c } : null;
  }
  function placerBulle(fe) {
    const col = document.querySelector('.ecran').getBoundingClientRect();
    const r = FI.source && FI.source.isConnected ? FI.source.getBoundingClientRect() : { top: 80 };
    let x = col.right + 16; if (x + fe.offsetWidth > innerWidth - 8) x = Math.max(8, col.left - fe.offsetWidth - 16);
    fe.style.left = x + 'px'; fe.style.top = Math.max(8, Math.min(innerHeight - fe.offsetHeight - 8, r.top - 60)) + 'px';
  }
  function ouvrir(nom, o) {
    const t = tpl(nom); if (!t) return;
    const deja = FI.nom != null;
    FI.nom = nom; FI.mode = o.mode; FI.source = o.source || null; if (!deja) FI.epingle = !!o.epingle;
    clearTimeout(FI.tFerme);
    const fe = t.content.firstElementChild.cloneNode(true);
    fe.classList.add('f-' + o.mode);
    if (o.mode === 'feuille') fe.setAttribute('aria-modal', 'true');
    const voile = o.mode === 'feuille' ? Object.assign(document.createElement('div'), { className: 'f-voile' }) : null;
    if (voile) voile.addEventListener('click', fermer);
    racine.replaceChildren(...[voile, fe].filter(Boolean));
    brancher(fe);
    if (o.mode === 'bulle') placerBulle(fe);
    document.querySelectorAll('.f-source').forEach((e) => e.classList.remove('f-source'));
    const src = FI.source && (FI.source.closest('.vr') || FI.source); if (src) src.classList.add('f-source');
    if (!deja && o.anim !== false && !REDUIT) fe.animate(o.mode === 'feuille' ? [{ transform: 'translateY(30%)' }, { transform: 'none' }] : [{ opacity: 0.6, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function fermer() { if (FI.nom == null) return; FI.nom = null; FI.epingle = false; clearTimeout(FI.tFerme); racine.replaceChildren(); document.querySelectorAll('.f-source').forEach((e) => e.classList.remove('f-source')); }
  function brancher(fe) {
    fe.querySelector('[data-role="fermer-fiche"]').addEventListener('click', (e) => { e.stopPropagation(); fermer(); });
    fe.querySelectorAll('.f-g').forEach((b) => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; fe.querySelectorAll('.f-g').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', String(on)); }));
    const aj = fe.querySelector('.f-ajouter'); if (aj) aj.addEventListener('click', () => aj.setAttribute('aria-pressed', String(aj.getAttribute('aria-pressed') !== 'true')));
    const cp = fe.querySelector('.f-comparer');
    cp.addEventListener('click', () => { const b = document.querySelector('[data-voie="' + cp.dataset.voieCible + '"] [data-role="ajouter-comparer"]'); if (b) { b.setAttribute('aria-pressed', 'true'); compter(); } fermer(); });
    fe.querySelectorAll('.f-repli').forEach((b) => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-expanded') !== 'true';
      fe.querySelectorAll('.f-repli').forEach((x) => x.setAttribute('aria-expanded', 'false'));
      fe.querySelectorAll('.f-sec').forEach((s) => { s.hidden = !(on && s.dataset.sec === b.dataset.sec); });
      b.setAttribute('aria-expanded', String(on));
      if (on) fe.querySelector('.f-sec[data-sec="' + b.dataset.sec + '"]').scrollIntoView({ block: 'nearest' });
    }));
  }
  let APPUI = null, AVALE = 0;
  document.addEventListener('click', (e) => { if (performance.now() < AVALE) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', (e) => { if ((APPUI && APPUI.type !== 'mouse') || performance.now() < AVALE) e.preventDefault(); });
  function annuler() { const a = APPUI; APPUI = null; if (a) { clearTimeout(a.timer); a.el.classList.remove('appui'); } }
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    AVALE = 0;
    if (racine.contains(e.target)) { if (FI.mode === 'bulle') FI.epingle = true; return; }
    if (FI.nom != null && FI.mode === 'bulle') fermer();
    if (APPUI) annuler();
    const z = zoneHoublon(e.target); if (!z) return;
    const a = { el: z.el, x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType, actif: false };
    APPUI = a; z.el.classList.add('appui');
    a.timer = setTimeout(() => {
      if (APPUI !== a) return;
      a.actif = true; AVALE = performance.now() + 15000; try { navigator.vibrate && navigator.vibrate(8); } catch (x) {}
      a.el.classList.remove('appui');
      ouvrir(a.el.dataset.houblon, { source: a.el, mode: a.type === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille' });
    }, APPUI_MS);
  }, true);
  document.addEventListener('pointermove', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif && Math.hypot(e.clientX - APPUI.x, e.clientY - APPUI.y) > 10) annuler(); }, true);
  function relacher() { const a = APPUI; if (!a) return; if (!a.actif) { annuler(); return; } APPUI = null; AVALE = performance.now() + 400; }
  document.addEventListener('pointerup', (e) => { if (APPUI && e.pointerId === APPUI.id) relacher(); }, true);
  document.addEventListener('pointercancel', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif) annuler(); }, true);
  document.addEventListener('touchend', () => { if (APPUI && APPUI.actif) relacher(); }, true);
  document.addEventListener('touchmove', (e) => { if (APPUI && APPUI.actif) e.preventDefault(); }, { passive: false });
  let SURVOL = null;
  function finSurvol() { if (SURVOL) { clearTimeout(SURVOL.timer); SURVOL.el.classList.remove('survol'); SURVOL = null; } }
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (racine.contains(e.target)) { clearTimeout(FI.tFerme); return; }
    const z = zoneHoublon(e.target);
    if (!z) { if (SURVOL && SURVOL.zone.contains(e.target)) finSurvol(); return; }
    if (SURVOL && SURVOL.el === z.el && SURVOL.zone === z.zone) return;
    finSurvol();
    const el = z.el, nom = el.dataset.houblon;
    if (FI.nom === nom) { clearTimeout(FI.tFerme); SURVOL = { el, zone: z.zone }; return; }
    el.classList.add('survol');
    SURVOL = { el, zone: z.zone, timer: setTimeout(() => { el.classList.remove('survol'); if (FI.mode === 'feuille' && FI.nom != null) return; ouvrir(nom, { source: el, mode: 'bulle' }); }, SURVOL_MS) };
  });
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const vers = e.relatedTarget;
    if (SURVOL && SURVOL.zone.contains(e.target) && !(vers && SURVOL.zone.contains(vers))) finSurvol();
    if (FI.nom != null && FI.mode === 'bulle' && !FI.epingle) {
      const hv = vers && zoneHoublon(vers);
      if (!(vers && racine.contains(vers)) && !(hv && hv.el.dataset.houblon === FI.nom)) { clearTimeout(FI.tFerme); FI.tFerme = setTimeout(() => { if (!FI.epingle) fermer(); }, 650); }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && FI.nom != null) { e.preventDefault(); fermer(); return; }
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { const a = document.activeElement, z = a && zoneHoublon(a); if (z) { e.preventDefault(); ouvrir(z.el.dataset.houblon, { source: z.el, mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true }); } }
  });
  { const m = location.search.match(/[?&]fiche=([^&]+)/); if (m) { const nom = decodeURIComponent(m[1]); const s = [...document.querySelectorAll('[data-houblon]')].find((x) => x.dataset.houblon === nom); ouvrir(nom, { source: s, mode: innerWidth >= 700 ? 'bulle' : 'feuille', anim: false, epingle: true }); } }
`;

// ======================= les deux peaux =======================
import { CSS_L3, CSS_L4 } from './peaux.mjs';
const LANGS = [
  { id: 'l3', nom: 'Étiquette', titre: 'Étiquette · Suggestions', W: 2, css: CSS_L3, commentaire: 'Bandeaux de couleur francs, gros chiffres, badges ronds, titres condensés (Bahnschrift) ; trait d\'icône 2 px.',
    surfaces: [['papier', '#fbf6ea'], ['carte', '#ffffff'], ['encre', '#1a1714'], ['action', '#f2c14e'], ['aplat', COUL.resin], ['alerte', ALERTE]],
    textes: [['cd t1', 'Approche', 'verdict · Bahnschrift condensé 24/800'], ['cd t2', 'Nelson Sauvin', 'houblon · condensé 18/700'], ['t3', 'voie houblon', 'secondaire · 13, #5c554a']] },
  { id: 'l4', nom: 'Instrument', titre: 'Instrument · Suggestions', W: 1.25, css: CSS_L4, commentaire: 'Filets fins, chiffres tabulaires, cadrans et graduations ; la couleur seulement pour les données ; trait d\'icône 1,25 px.',
    surfaces: [['face', '#f1f1ee'], ['cadran', '#ffffff'], ['encre', '#141416'], ['filet', '#c4c4be'], ['donnée', COUL.floral], ['alerte', ALERTE]],
    textes: [['t1', 'Approche', 'verdict · Segoe UI 14/700 capitales'], ['t2', '+1,6  10 g  63,2', 'mesure · mono tabulaire 12,5/600'], ['t3', 'voie houblon', 'secondaire · 12, #55555b']] },
];
const PLANCHE_CSS = `
  .pl { max-width: 390px; margin: 0 auto; padding: 10px 12px 20px; display: flex; flex-direction: column; gap: 12px; }
  .pl h1 { font-size: 15px; font-weight: 800; display: flex; align-items: baseline; gap: 8px; }
  .pl h1 small { font-size: 12px; font-weight: 400; }
  .minis { display: flex; gap: 8px; }
  .mini { width: 172px; overflow: hidden; position: relative; flex: none; box-shadow: 0 0 0 1px rgba(0,0,0,.25); }
  .mini iframe { border: 0; width: 390px; transform: scale(.44); transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  .m1 { height: 743px; } .m1 iframe { height: 1688px; }
  .col { display: flex; flex-direction: column; gap: 8px; }
  .m2 { height: 367px; } .m2 iframe { height: 834px; }
  .abc { display: flex; flex-wrap: wrap; gap: 10px 8px; }
  .ab { width: 100%; display: flex; flex-direction: column; gap: 6px; }
  .ab.demi { width: calc(50% - 4px); }
  .ab h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
  .sw { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
  .sw .s { display: flex; flex-direction: column; gap: 3px; }
  .sw i { height: 26px; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.18); }
  .sw small, .ab small { font-size: 12px; line-height: 1.15; }
  .tx { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; align-items: baseline; }
  .reps.un { grid-template-columns: 1fr; }
  .fam { display: flex; flex-wrap: wrap; gap: 6px 10px; }
  .fam .it, .act { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .fam .it { flex-direction: column; gap: 3px; }
  .mini-g { padding: 4px 0; }
  .cmp.statique { position: static; transform: none; width: calc(100% - 6px); max-width: 100%; margin-top: 2px; }
  .reps.un .tuile { min-height: 0; }
  .ab.demi .act { gap: 5px; }
`;
for (const L of LANGS) {
  const html = construire(L);
  const f = OUT + '/' + L.id + '/etat-b.html';
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  console.log('écrit ' + L.id + '/etat-b.html (' + html.length + ' o)');
  const T = L.id === 'l3' ? '.t1 { font: 800 24px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; } .t2 { font: 700 18px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; } .t3 { font-size: 13px; color: var(--gris); } .pl h1 { font-family: var(--cond); font-stretch: 75%; text-transform: uppercase; font-size: 20px; }'
    : '.t1 { font: 700 14px/1 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .04em; } .t2 { font: 600 12.5px/1 var(--mono); white-space: pre; } .t3 { font-size: 12px; color: var(--gris); }';
  const planche = `<!doctype html>
<html lang="fr" data-langage="${L.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planche · ${L.nom}</title>
<!-- Lot 18 · planche de ${L.id} · ${L.nom} : q2b repris en mini (premier et deuxième écran ; la fiche de Nelson Sauvin
     ouverte par l'appui long ; la lecture absolue), puis l'abécédaire tiré des vrais composants. Généré par l3/generateur-baseline.mjs. -->
<style>${CSS_COMMUN}${L.css}${PLANCHE_CSS}${T}</style>
</head>
<body>
${symboles(L.W)}
<main class="pl">
  <h1>${L.id} · ${L.nom} <small>q2b repris, c1</small></h1>
  <div class="minis">
    <div class="mini m1"><iframe src="etat-b.html" title="Suggestions, deux écrans" scrolling="no"></iframe></div>
    <div class="col">
      <div class="mini m2"><iframe src="etat-b.html?fiche=${encodeURIComponent('Nelson Sauvin')}" title="Fiche de Nelson Sauvin ouverte" scrolling="no"></iframe></div>
      <div class="mini m2"><iframe src="etat-b.html?abs" title="Lecture absolue" scrolling="no"></iframe></div>
    </div>
  </div>
  ${L.abc}
</main>
</body>
</html>
`;
  fs.writeFileSync(OUT + '/' + L.id + '/planche.html', planche);
  console.log('écrit ' + L.id + '/planche.html (' + planche.length + ' o)');
}
