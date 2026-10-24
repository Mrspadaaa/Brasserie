// Commun des variantes u1–u6 (fils21-choisir, 19.10.2026, nuit). Copié dans chaque dossier par extraire.mjs.
// Trois natures, jamais mêlées :
//   mesuré  : une valeur publiée, avec sa source (data-nature="mesure" data-source) ;
//   calculé : la chaîne charge → part retrouvée → rapport au seuil, en plage, sur des valeurs mesurées
//             (data-nature="simule" data-type="calcul", signe « ≈ ») ;
//   simulé  : la couche de lecture « faux profil » (data-nature="simule" data-type="profil", signe « ~ »).
// Une borne inconnue reste null : elle se dessine en hachures, jamais en zéro.
(function () {
  const D = window.DATA;
  const FAM = Object.fromEntries(D.familles.map((f) => [f.id, f]));
  const NUIT = '#12100E';

  // ---------- Pictos des 12 familles (16 × 16), couleur du code des arômes ----------
  const P = {
    citrus: (c) => `<circle cx="8" cy="8" r="6.6" fill="${c}"/><circle cx="8" cy="8" r="5" fill="none" stroke="${NUIT}" stroke-opacity=".45" stroke-width=".9"/><path d="M8 3v10M3 8h10M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="${NUIT}" stroke-opacity=".5" stroke-width=".9"/>`,
    tropical: (c) => `<path d="M8 5.6 6 1.2M8 5.6 8 .8M8 5.6l2-4.4M8 5.6 4.4 2.6M8 5.6l3.6-3" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="8" cy="10.4" rx="4.3" ry="5" fill="${c}"/><path d="M5 8.4l6 5M11 8.4l-6 5M4.6 11l3-2.6M11.4 11l-3-2.6" stroke="${NUIT}" stroke-opacity=".4" stroke-width=".8"/>`,
    stoneFruit: (c) => `<circle cx="8" cy="9.2" r="5.8" fill="${c}"/><path d="M8 3.6c-1.8 2.6-1.8 8.4 0 11.2" stroke="${NUIT}" stroke-opacity=".45" stroke-width="1" fill="none"/><path d="M8 3.6c1.2-2 3.8-2.2 4.6-1.6-.9 1.6-3 2.2-4.6 1.6z" fill="${c}"/>`,
    pomeFruit: (c) => `<path d="M8 5.2C5 3.2 1.8 5.2 2.4 9.2 3 13.2 6 15.4 8 14c2 1.4 5-.8 5.6-4.8.6-4-2.6-6-5.6-4z" fill="${c}"/><path d="M8 5.2 9.2 1.6" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`,
    berries: (c) => `<circle cx="5.2" cy="10.4" r="3.1" fill="${c}"/><circle cx="10.8" cy="10.4" r="3.1" fill="${c}"/><circle cx="8" cy="5.6" r="3.1" fill="${c}"/><circle cx="4.4" cy="9.6" r=".8" fill="#fff" fill-opacity=".45"/><circle cx="10" cy="9.6" r=".8" fill="#fff" fill-opacity=".45"/><circle cx="7.2" cy="4.8" r=".8" fill="#fff" fill-opacity=".45"/>`,
    melon: (c) => `<path d="M1.2 5.6a6.8 6.8 0 0 0 13.6 0z" fill="${c}"/><path d="M2.8 5.6a5.2 5.2 0 0 0 10.4 0" fill="none" stroke="${NUIT}" stroke-opacity=".35"/><circle cx="6" cy="8" r=".7" fill="${NUIT}" fill-opacity=".6"/><circle cx="8" cy="9" r=".7" fill="${NUIT}" fill-opacity=".6"/><circle cx="10" cy="8" r=".7" fill="${NUIT}" fill-opacity=".6"/>`,
    floral: (c) => [0, 72, 144, 216, 288].map((a) => { const r = (a - 90) * Math.PI / 180; return `<circle cx="${(8 + 3.6 * Math.cos(r)).toFixed(2)}" cy="${(8 + 3.6 * Math.sin(r)).toFixed(2)}" r="2.9" fill="${c}"/>`; }).join('') + `<circle cx="8" cy="8" r="1.7" fill="${NUIT}" fill-opacity=".55"/>`,
    herbal: (c) => `<path d="M8 15V2.4" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="5.2" cy="6" rx="2.8" ry="1.4" transform="rotate(-35 5.2 6)" fill="${c}"/><ellipse cx="10.8" cy="8" rx="2.8" ry="1.4" transform="rotate(35 10.8 8)" fill="${c}"/><ellipse cx="5.2" cy="11" rx="2.8" ry="1.4" transform="rotate(-35 5.2 11)" fill="${c}"/>`,
    resin: (c) => `<path d="M8 .8 12.6 6.6H10.4L14 11.8H2L5.6 6.6H3.4z" fill="${c}"/><rect x="7" y="11.8" width="2" height="3.4" fill="${c}"/>`,
    spice: (c) => { let d = ''; for (let i = 0; i < 16; i++) { const r = (i * 22.5 - 90) * Math.PI / 180, R = i % 2 ? 2.6 : 7; d += (i ? 'L' : 'M') + (8 + R * Math.cos(r)).toFixed(2) + ' ' + (8 + R * Math.sin(r)).toFixed(2); } return `<path d="${d}z" fill="${c}"/><circle cx="8" cy="8" r="1.4" fill="${NUIT}" fill-opacity=".5"/>`; },
    green: (c) => `<path d="M3 15C3 10 2 6 .8 3.6 3.4 6 4.6 10 4.8 15zM7.2 15C7 9 7.6 4.6 8.6 1 9.4 5 9.4 10 8.8 15zM11 15c.4-4.4 1.8-8 4.2-10.4C13.6 8 12.8 11 12.6 15z" fill="${c}"/>`,
    earthy: (c) => `<path d="M.8 14.4C2.6 8.4 13.4 8.4 15.2 14.4z" fill="${c}"/><path d="M3.4 12.4h9.2M5.2 10.6h5.6" stroke="${NUIT}" stroke-opacity=".4" stroke-width=".9"/><circle cx="11.6" cy="5.6" r="1.6" fill="${c}"/>`,
  };
  function picto(f, taille = 14, titre = true) {
    const fa = FAM[f]; if (!fa) return '';
    return `<svg data-famille="${f}" viewBox="0 0 16 16" width="${taille}" height="${taille}" role="img" aria-label="${fa.nom}">${titre ? `<title>${fa.nom}</title>` : ''}${P[f](fa.c)}</svg>`;
  }

  // ---------- Nombres à la française ----------
  const NB = ' ';
  function fmt(x, sig = 2) {
    if (x == null || !isFinite(x)) return '?';
    const a = Math.abs(x);
    let s;
    if (a >= 100) s = Math.round(x).toString();
    else if (a >= 10) s = (Math.round(x * 10) / 10).toString();
    else if (a >= 1) s = (Math.round(x * 10) / 10).toString();
    else if (a === 0) s = '0';
    else s = Number(x.toPrecision(sig)).toString();
    const [e, d] = s.split('.');
    const ent = e.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return d ? ent + ',' + d : ent;
  }
  const fmtR = (x) => (x == null ? '?' : '×' + fmt(x));
  function fmtPlage(lo, hi, unite = '', r = false) {
    const f = r ? fmtR : fmt;
    if (lo == null && hi == null) return 'inconnu';
    if (lo == null) return 'au plus ' + f(hi) + (unite ? ' ' + unite : '') + ', borne basse inconnue';
    if (hi == null) return 'au moins ' + f(lo) + (unite ? ' ' + unite : '') + ', borne haute inconnue';
    if (lo === hi) return f(lo) + (unite ? ' ' + unite : '');
    return f(lo) + '–' + (r ? fmt(hi) : f(hi)) + (unite ? ' ' + unite : '');
  }
  const geo = (lo, hi) => (lo != null && hi != null && lo > 0 && hi > 0 ? Math.sqrt(lo * hi) : null);

  // ---------- Sources et feuille de détail ----------
  function srcChip(ids) {
    const l = [...new Set([].concat(ids || []).filter(Boolean))];
    const COURT = { 'outil-substitution': 'outil', 'moteur-pouvoir': 'moteur', 'profil-simule': 'profil', 'ych-profil': 'YCH', 'ibu-pack': 'IBU', 'pilote-19-10': 'pilote' };
    return l.map((id) => `<button class="src" data-src="${id}" aria-label="Source ${id}">${COURT[id] || (id.length > 9 ? id.slice(0, 8) + '…' : id)}</button>`).join(' ');
  }
  function ouvrirFeuille(titre, html) {
    fermerFeuille();
    const v = document.createElement('div'); v.className = 'voile'; v.onclick = fermerFeuille;
    const f = document.createElement('section'); f.className = 'feuille'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', titre);
    f.innerHTML = `<div class="poignee"></div><button class="fermer" aria-label="Fermer">✕</button><h3>${titre}</h3>${html}`;
    f.querySelector('.fermer').onclick = fermerFeuille;
    document.body.append(v, f);
  }
  function fermerFeuille() { document.querySelectorAll('.voile, .feuille').forEach((e) => e.remove()); }
  function htmlSource(id) {
    const s = D.sources[id];
    if (!s) return `<p>Source ${id} : non trouvée dans les données.</p>`;
    const niv = { P: 'publié avec comité de lecture', F: 'fiche ou document de fabricant', S: 'secondaire', H: 'hypothèse ou calcul du pilote' }[s.n] || '';
    const url = s.url && /^https?:/.test(s.url) ? `<a class="lien" href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/^https?:\/\//, '').slice(0, 60)}…</a>` : (s.url ? `<span class="mono">${s.url}</span>` : '');
    return `<p><b class="t1">${id}</b> · ${niv}${s.a ? ' · ' + s.a : ''}</p><p>${s.t}</p><p>${url}</p>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-src]');
    if (b && b.classList.contains('src')) { e.preventDefault(); e.stopPropagation(); ouvrirFeuille('Source', htmlSource(b.dataset.src)); }
  }, true);

  // ---------- La chaîne de calcul (même chaîne que le moteur du pilote, réécrite pour la page) ----------
  const HC = ['myrcene', 'humulene', 'caryophyllene', 'farnesene'];
  const TERP = ['myrcene', 'linalol', 'geraniol', 'humulene', 'caryophyllene', 'farnesene'];
  const THIOL = ['4MMP', '3MH', '3M4MP'];
  const NOMC = { myrcene: 'myrcène', linalol: 'linalol', geraniol: 'géraniol', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', '4MMP': '4MMP', '3MH': '3MH', '3M4MP': '3M4MP', citronellol: 'citronellol' };
  const FAMC = {};
  for (const l of D.liens) (FAMC[l.c] = FAMC[l.c] || []).push(...l.fam.filter((f) => !(FAMC[l.c] || []).includes(f)));
  FAMC.citronellol = ['floral', 'citrus'];
  const unite = (c) => (THIOL.includes(c) ? 'ng/L' : 'µg/L');

  // moment : 'b' + minutes (b60, b10…), 'b0' fin d'ébullition, 'wp', 'dryActive', 'dryPost'
  function transfert(c, moment) {
    const T = (lo, hi, base, src, inconnu) => ({ lo, hi, base, src, inconnu: inconnu || null });
    const dry = moment === 'dryActive' || moment === 'dryPost';
    const min = /^b(\d+)$/.test(moment) ? Number(moment.slice(1)) : null;
    const tardif = moment === 'wp' || min === 0;
    if (c === 'linalol') {
      if (dry) return T(0.07, 1.0, 'dry hop : enveloppe des bases publiées, 7 % (huile hydrodistillée, forte dose) à 100 % (base huile)', ['H30', 'H31', 'H32', 'H22']);
      if (tardif) return T(0.60, 0.63, 'ajout tardif (fin d’ébullition, whirlpool)', ['H30']);
      return T(null, 0.63, 'à l’ébullition : part non mesurée ; au plus celle d’un ajout tardif [H]', ['H30', 'H'], 'borne basse non mesurée');
    }
    if (c === 'geraniol') {
      if (dry) return T(0.03, 1.2, 'dry hop : enveloppe des bases publiées (3 % à 120 %)', ['H30', 'H31', 'H32', 'H22']);
      return T(null, 0.10, 'à chaud : −90 % entre moût et bière, passage du houblon au moût non chiffré', ['H30'], 'borne basse non chiffrée');
    }
    if (HC.includes(c)) {
      if (moment === 'dryPost') return T(0.006, 0.034, 'hydrocarbures en dry hop : 0,6–3,4 % de la teneur', ['H30', 'H31', 'H32', 'H22']);
      if (moment === 'dryActive') return T(null, 0.034, 'fermentation active : le CO₂ emporte le myrcène, perte non chiffrée', ['H30', 'H31', 'H33'], 'perte par le CO₂ non chiffrée');
      return T(null, 0.01, 'à chaud : moins de 1 % retrouvé', ['H30'], 'borne basse non chiffrée');
    }
    if (c === '4MMP') {
      if (dry) return T(0.70, 0.70, 'dry hop statique : ≈ 70 %', ['H11']);
      if (tardif) return T(0.77, 0.77, 'whirlpool à 90 °C : −23 % (durée à confirmer)', ['H13']);
      if (min === 60) return T(0.09, 0.09, '60 min à 100 °C : −91 %', ['H13']);
      if (min != null && min < 60) return T(0.09, 1.0, 'mesuré après 60′ seulement : entre −91 % et aucune perte [H]', ['H13', 'H'], 'perte avant 60′ non mesurée');
    }
    if (c === '3MH') {
      if (dry) return T(0.70, 0.70, 'dry hop : 70 % supposé par Hopsteiner', ['H11']);
      return T(null, null, 'à chaud : le 3MH augmente (libéré des précurseurs), non chiffré', ['H13'], 'augmente à chaud, non chiffré');
    }
    return T(null, null, 'aucun taux de transfert publié', ['H'], 'aucun taux de transfert dans H');
  }

  function teneur(h, c) { return TERP.includes(c) ? h.f[c] : h.thiols[c]; }
  // Charge introduite : terpène µg/L = dose × huile (mL/100 g) × part (%) × densité × 100 ; thiol ng/L = dose × teneur (µg/kg).
  function charge(h, c, dose, opts = {}) {
    const t = teneur(h, c);
    if (!t) return { lo: null, hi: null, raison: 'non relevé' };
    const tt = opts.baseCommune && t.baseCommune ? t.baseCommune : t;
    if (THIOL.includes(c)) return { lo: tt.lo != null ? dose * tt.lo : null, hi: tt.hi != null ? dose * tt.hi : null, raison: t.raison || null, src: tt.src };
    const O = h.huile;
    if (!O) return { lo: null, hi: null, raison: 'huile non relevée' };
    const lo = O.lo != null && t.lo != null ? dose * O.lo * t.lo * 0.86 * 100 : null;
    const hi = O.hi != null && t.hi != null ? dose * O.hi * t.hi * 0.89 * 100 : null;
    return { lo, hi, raison: t.raison || (O.lo == null || O.hi == null ? 'huile : borne inconnue' : null), src: [...(O.src || []), ...(t.src || [])] };
  }
  function seuil(c) { return D.seuils[c] || null; }
  // Concentration en bière et rapport au seuil, en plage. auMoins : borne basse partielle (un terme inconnu).
  function conc(h, c, dose, moment, opts) {
    const C = charge(h, c, dose, opts), T = transfert(c, moment);
    return { lo: C.lo != null && T.lo != null ? C.lo * T.lo : null, hi: C.hi != null && T.hi != null ? C.hi * T.hi : null, C, T };
  }
  function rapport(cc, c) {
    const S = seuil(c);
    if (!S || S.lo == null) return { lo: null, hi: null, ctr: null, S: null, inconnu: 'aucun seuil publié' };
    const lo = cc.lo != null ? cc.lo / S.hi : null, hi = cc.hi != null ? cc.hi / S.lo : null;
    return { lo, hi, ctr: geo(lo, hi), S, auMoins: !!cc.auMoins };
  }
  // Plusieurs ajouts : concentrations additionnées composé par composé (ordre, synergie, masquage inconnus).
  function concSomme(ajouts, c) {
    let lo = 0, hi = 0, loInc = false, hiInc = false, n = 0;
    for (const a of ajouts) {
      const k = conc(a.h, c, a.dose, a.moment);
      if (k.lo == null) loInc = true; else lo += k.lo;
      if (k.hi == null) hiInc = true; else hi += k.hi;
      n++;
    }
    return { lo: loInc && lo === 0 ? null : lo, hi: hiInc ? null : hi, auMoins: loInc && lo > 0 };
  }
  const COMPS = [...TERP, ...THIOL];
  function familles(ajouts) {
    const R = {};
    for (const c of COMPS) R[c] = rapport(concSomme(ajouts, c), c);
    const out = {};
    for (const f of D.familles) {
      const cs = COMPS.filter((c) => (FAMC[c] || []).includes(f.id));
      if (!cs.length) { out[f.id] = { lo: null, hi: null, ctr: null, dominant: null, inconnu: 'aucun composé marqueur relié à cette famille dans H', cite: ajouts.some((a) => a.h.familles?.[f.id]?.n > 0) }; continue; }
      const connus = cs.filter((c) => R[c].lo != null || R[c].hi != null);
      if (!connus.length) { out[f.id] = { lo: null, hi: null, ctr: null, dominant: cs[0], inconnu: cs.map((c) => NOMC[c]).join(', ') + ' : ' + (seuil(cs[0])?.lo == null ? 'aucun seuil publié' : 'teneur ou transfert inconnu'), cite: ajouts.some((a) => a.h.familles?.[f.id]?.n > 0) }; continue; }
      // Comme le moteur : le signal d'une famille est le rapport au seuil de son marqueur dominant (plus grand
      // repère central, sinon plus grande borne connue). Les autres marqueurs non chiffrés restent nommés.
      const score = (c) => R[c].ctr ?? R[c].lo ?? R[c].hi ?? 0;
      const dom = connus.reduce((a, b) => (score(b) > score(a) ? b : a));
      const nonChiffres = cs.filter((c) => c !== dom && (R[c].lo == null || R[c].hi == null)).map((c) => NOMC[c]);
      out[f.id] = { lo: R[dom].lo, hi: R[dom].hi, ctr: R[dom].ctr, dominant: dom, R: R[dom], marqueurs: cs, nonChiffres, auMoins: R[dom].auMoins };
    }
    return { familles: out, composes: R };
  }

  // ---------- La couche simulée : « faux profil » (convention de lecture, pas une mesure) ----------
  // Points 0–10 : 2 au seuil (×1), +2,5 par facteur 10 (loi de Fechner, convention de la maquette), bornés à 0 et 10.
  const pts = (R) => (R == null ? null : Math.max(0, Math.min(10, 2 + 2.5 * Math.log10(R))));
  function profilSimule(ajouts) {
    const { familles: F, composes } = familles(ajouts);
    const out = {};
    for (const [f, v] of Object.entries(F)) out[f] = { ...v, p: { lo: v.lo != null ? pts(v.lo) : null, hi: v.hi != null ? pts(v.hi) : null, ctr: v.ctr != null ? pts(v.ctr) : null } };
    return { familles: out, composes };
  }

  // ---------- IBU (calcul du pack : Tinseth, 20 L, DI 1,066) ----------
  const BIG = 1.65 * Math.pow(0.000125, 0.066);
  function ibuParGramme(alpha, moment) {
    if (alpha == null) return null;
    if (moment === 'wp') return 0.26 / 17.2 * alpha; // pack : Galaxy whirlpool 0,26 IBU/g à α 17,2 %
    const m = /^b(\d+)$/.exec(moment); if (!m) return 0;
    const t = Number(m[1]);
    return BIG * (1 - Math.exp(-0.04 * t)) / 4.15 * (alpha / 100) * 1000 / 20;
  }

  // ---------- Tirages : « 100 bières possibles » (convention : log-uniforme dans chaque enveloppe publiée,
  // seuil tiré parmi les seuils publiés). Déterministe (graine). Une borne inconnue ne se tire pas. ----------
  function prng(seed) { let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function tirer(h, c, dose, moment, n = 100, seed = 'x', verrous = {}) {
    const r = prng(seed + h.id + c + dose + moment);
    const lu = (lo, hi, fixe) => (lo === hi ? lo : fixe ? Math.sqrt(lo * hi) : Math.exp(Math.log(lo) + r() * (Math.log(hi) - Math.log(lo))));
    const t = teneur(h, c), T = transfert(c, moment), S = seuil(c), O = h.huile;
    const manque = [];
    if (!t || t.lo == null || t.hi == null) manque.push('teneur');
    if (TERP.includes(c) && (!O || O.lo == null || O.hi == null)) manque.push('huile');
    if (T.lo == null || T.hi == null) manque.push('transfert');
    if (!S || S.lo == null) manque.push('seuil');
    if (manque.length) return { vals: null, manque };
    const vals = [];
    for (let i = 0; i < n; i++) {
      const part = lu(t.lo, t.hi, verrous.part);
      const ch = THIOL.includes(c) ? dose * part : dose * lu(O.lo, O.hi, verrous.huile) * part * lu(0.86, 0.89, verrous.huile) * 100;
      const tr = lu(T.lo, T.hi, verrous.transfert);
      let s;
      if (verrous.seuil) s = Math.sqrt(S.lo * S.hi);
      else { const e = S.liste[Math.floor(r() * S.liste.length)]; s = lu(e.p[0], e.p[1] ?? e.p[0], false); }
      vals.push(ch * tr / s);
    }
    vals.sort((a, b) => a - b);
    return { vals, manque: [] };
  }
  const quantile = (v, q) => v[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))];

  // ---------- Petits outils DOM ----------
  function h(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  }
  // Échelle logarithmique : x(R) entre a et b (puissances de 10).
  const logX = (R, a, b, w) => (Math.log10(Math.max(R, a)) - Math.log10(a)) / (Math.log10(b) - Math.log10(a)) * w;

  window.A = { D, FAM, picto, fmt, fmtR, fmtPlage, geo, srcChip, ouvrirFeuille, fermerFeuille, htmlSource, transfert, charge, conc, concSomme, rapport, seuil, familles, profilSimule, pts, ibuParGramme, tirer, quantile, h, logX, NOMC, FAMC, unite, TERP, THIOL, COMPS };
})();
