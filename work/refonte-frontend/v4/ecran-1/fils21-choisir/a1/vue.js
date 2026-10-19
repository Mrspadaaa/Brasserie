// Lot 21 · série a · dans la page : la lecture du vrai profil simulé (window.P, tranche de
// profils-simules.json) et les briques de dessin. Rien n'est calculé ici : chaque nombre simulé vient du
// moteur (grille, paires, cas) ; chaque vraie valeur vient de window.R (reel.mjs) ou des mesures[] du moteur.
(function (W) {
  const R = W.R, T = W.T, P = W.P;
  const J = T.J, NOM = T.NOM, COURT = T.COURT, H = R.houblons, L = R.levures;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fr1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',').replace('-', '−');
  const fr0 = (x) => String(Math.round(x)).replace('-', '−');
  const frx = (x) => (x == null ? '?' : x < 0.1 ? String(+x.toPrecision(1)).replace('.', ',') : x < 10 ? fr1(x) : fr0(x));
  const sgn = (x, f = fr0) => (x > 0.5 ? '+' : x < -0.5 ? '' : '±') + f(x);
  const picto = (f, s = 14) => `<svg class="pi" width="${s}" height="${s}" data-famille="${f}" role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
  const ico = (id, s = 14) => (T.ICO[id] ? T.ICO[id].replace(/width="\d+" height="\d+"/, `width="${s}" height="${s}"`).replace(/stroke-width="[\d.]+"/, `stroke-width="${Math.round(36 / s * 1000) / 1000}"`) : '');
  const sim = (txt, o = {}) => `<span class="sv${o.cls ? ' ' + o.cls : ''}" data-nature="simule"${o.aria ? ` aria-label="${esc(o.aria)}"` : ''}>~${txt}</span>`;
  const mes = (txt, src, o = {}) => `<span class="mv${o.cls ? ' ' + o.cls : ''}" data-nature="mesure" data-source="${esc(src)}"${o.aria ? ` aria-label="${esc(o.aria)}"` : ''}>${txt}</span>`;
  const CONF = { mesure: 'mesuré', fournisseur: 'fournisseur', panel: 'panel', estime: 'estimé', inconnu: 'inconnu', etude: 'étude', simule: 'simulé' };
  const conf = (k, txt) => `<span class="cf cf-${k}" data-confiance="${k}">${txt || CONF[k]}</span>`;
  const CONFIANCE = { bonne: 'confiance bonne', moyenne: 'confiance moyenne', faible: 'confiance faible' };
  const confiance = (c) => { const n = c && typeof c === 'object' ? c.niveau : c; return CONFIANCE[n] || n || ''; };
  const MOTIF = ['m-plein', 'm-raye', 'm-point'];
  const texte = (s) => String(s || '').replace(/§\d+/g, (r) => P.textes[r] || r);

  // ---------- la lecture du fichier du moteur ----------
  const FMT = P.format;
  const lire = (v) => (Array.isArray(v) ? Object.fromEntries(FMT.map((k, i) => [k, v[i]])) : v);
  const top = (f) => P.style.zone[f][1];
  const cran = (f) => top(f) / 3;
  const LEV = { us05: 'fermentis-us05', pomona: 'lalbrew-pomona', verdant: 'lalbrew-verdant-ipa', diamond: 'lalbrew-diamond' };
  const MOM = { actif: 'dryActive', apres: 'dryPost' };
  const seul = (q) => P.grille.find((g) => g.nom === q.nom && g.moment === q.moment && g.dose_gL === q.dose && (q.jours == null ? g.jours == null : g.jours === q.jours) && g.levure === LEV[q.levure || 'us05']) || null;
  const paire = (q) => P.paires.find((p) => p.moment === q.moment && p.levure === LEV[q.levure || 'us05'] && ((p.noms[0] === q.a && p.noms[1] === q.b) || (p.noms[0] === q.b && p.noms[1] === q.a))) || null;
  const cas = (id) => P.cas.find((c) => c.id === id) || null;
  const apportsDe = (e) => e.apports || (e.apportsParHoublon ? Object.fromEntries(e.apportsParHoublon.map((h) => [h.houblon, h.apport])) : null);
  // Le profil d'une famille, prêt à dessiner. e : une entrée (grille, paire, cas) ; o.ref : la même avec
  // US-05, pour séparer la part de la levure ; o.ordre : l'ordre des houblons dans la pile.
  function profil(e, o = {}) {
    const out = {};
    const ap = apportsDe(e), apr = o.ref ? apportsDe(o.ref) : ap;
    const noms = e.noms || (e.apportsParHoublon ? e.apportsParHoublon.map((h) => h.nom) : [e.nom]);
    const cles = e.houblons || (e.apportsParHoublon ? e.apportsParHoublon.map((h) => h.houblon) : [e.houblon]);
    for (const f of P.ordre) {
      const a = lire(P.biere.avant[f]), x = lire(e.apres[f]);
      const rien = x.bas === 0 && x.centre === 0 && x.haut === 0;
      let parts = [], bio = 0;
      if (ap) { cles.forEach((k, i) => parts.push({ nom: noms[i], v: apr[k][f] })); if (o.ref) bio = cles.reduce((s, k) => s + ap[k][f] - apr[k][f], 0); }
      else if (e.delta) parts.push({ nom: e.nom, v: typeof e.delta[f] === 'object' ? e.delta[f].centre : e.delta[f] });
      if (o.ordre) parts.sort((p, q) => o.ordre.indexOf(p.nom) - o.ordre.indexOf(q.nom));
      const seuls = e.seuls ? Object.values(e.seuls).reduce((s, v) => s + v[f], 0) : e.apportsParHoublon ? e.apportsParHoublon.reduce((s, h) => s + h.seul[f], 0) : null;
      out[f] = {
        f, bas: x.bas, centre: x.centre, haut: x.haut, crans: x.crans, largeur: x.largeur, partiel: !!(x.hautPartiel && (x.hautPartiel === 1 || x.hautPartiel.length)), rien,
        avant: a.centre, avantSource: a.source, parts, bio, somme: seuls != null ? a.centre + seuls : null, top: top(f), cran: cran(f),
        horsStyle: x.centre > top(f), delta: x.centre - a.centre,
      };
    }
    return out;
  }

  // ---------- la bande d'incertitude, sur une échelle logarithmique (D94 L3) ----------
  function bandeLog(r, o = {}) {
    const W0 = o.w || 168, lo = o.lo != null ? o.lo : -3, hi = o.hi != null ? o.hi : 4, X = (v) => ((Math.log10(Math.max(10 ** lo, Math.min(10 ** hi, v))) - lo) / (hi - lo)) * W0;
    const c0 = r.centre != null ? r.centre : r.central;
    const a = r.min != null ? X(r.min) : 0, b = r.max != null ? X(r.max) : W0, c = c0 != null ? X(c0) : null;
    const ticks = [-3, -2, -1, 0, 1, 2, 3, 4].filter((p) => p >= lo && p <= hi).map((p) => 10 ** p).map((v) => `<i class="bl-t${v === 1 ? ' un' : ''}" style="left:${X(v).toFixed(1)}px"></i>`).join('');
    const txt = '×' + frx(r.min) + '–' + frx(r.max);
    return `<span class="bl" style="--w:${W0}px" aria-label="${esc((o.aria || 'Rapport au seuil') + ' : de ×' + frx(r.min) + ' à ×' + frx(r.max) + (c0 != null ? ', centre ×' + frx(c0) : ''))}">
      <span class="bl-p"><i class="bl-ax"></i>${ticks}<i class="bl-b${r.min == null ? ' ouv-g' : ''}${r.max == null ? ' ouv-d' : ''}" data-role="incertitude" style="left:${a.toFixed(1)}px;width:${Math.max(6, b - a).toFixed(1)}px"></i>${c != null ? `<i class="bl-c" style="left:${c.toFixed(1)}px"></i>` : ''}<span class="bl-s" style="left:${X(1).toFixed(1)}px">${o.seuil === false ? '' : 'seuil'}</span></span>
      <span class="bl-n">${mes(txt, o.src || 'moteur', { cls: 'bl-v' })}</span></span>`;
  }

  // Un axe log commun à plusieurs bandes : de la plus petite borne à la plus grande, le seuil (×1) dedans.
  function axeLog(plages) { const v = plages.flatMap((p) => [p.min, p.max]).filter((x) => x != null && x > 0); if (!v.length) return { lo: -3, hi: 4 }; return { lo: Math.max(-3, Math.min(-0.5, Math.floor(Math.log10(Math.min(...v)) * 2) / 2 - 0.5)), hi: Math.min(4, Math.max(0.5, Math.ceil(Math.log10(Math.max(...v)) * 2) / 2 + 0.3)) }; }

  // ---------- une famille en ligne : le nom se lit, la plage se voit, la part de chacun en motif ----------
  // Échelle au style : 0 à 5 crans du style (la zone va de 0 à 3) ; absolu : 0 à 100. Une borne au-delà de
  // l'échelle n'est pas rognée : la plage sort en flèche et sa valeur s'écrit à droite.
  function ligne(f, x, o = {}) {
    const W0 = o.w || 176, len = o.lentille || 'style', max = len === 'style' ? x.cran * 5 : 100;
    const X = (v) => Math.max(0, Math.min(W0, v / max * W0));
    const zone = X(x.top), base = X(x.avant);
    let p = base, segs = '';
    x.parts.forEach((q, i) => { const e = X(x.avant + x.parts.slice(0, i + 1).reduce((s, r) => s + r.v, 0)); if (e - p > 0.3) segs += `<i class="hl-s ${MOTIF[i]}" style="left:${p.toFixed(1)}px;width:${(e - p).toFixed(1)}px"></i>`; p = e; });
    const pc = X(x.centre);
    if (pc - p > 0.6) segs += `<i class="hl-s m-bio" data-role="biotransformation" style="left:${p.toFixed(1)}px;width:${(pc - p).toFixed(1)}px"></i>`;
    const over = x.centre > x.top ? `<i class="hl-x" style="left:${zone.toFixed(1)}px;width:${Math.max(1.5, pc - zone).toFixed(1)}px"></i>` : '';
    const somme = o.somme && x.somme != null && x.somme - x.centre > 0.5 ? `<i class="hl-som" style="left:${pc.toFixed(1)}px;width:${Math.max(2, X(x.somme) - pc).toFixed(1)}px" aria-hidden="true"></i>` : '';
    const repere = (o.reperes || []).filter((r) => r.v != null).map((r) => `<i class="hl-r ${r.cls || ''}" style="left:${X(r.v).toFixed(1)}px" aria-hidden="true"></i>`).join('');
    const sort = x.haut > max ? '<i class="hl-fl" aria-hidden="true"></i>' : '';
    const w = x.rien ? '' : `<i class="hl-w" style="left:${X(x.bas).toFixed(1)}px;width:${Math.max(1, X(x.haut) - X(x.bas)).toFixed(1)}px"></i>${sort}`;
    const inc = x.rien ? '<i class="hl-inc">rien de simulé</i>' : '';
    const v = x.rien ? '<span class="hl-v inc">pas une absence</span>' : `<span class="hl-v">${sim(fr0(x.centre), { aria: NOM[f] + ' : ' + fr0(x.centre) + ' sur 100, de ' + fr0(x.bas) + ' à ' + fr0(x.haut) + (x.partiel ? ' au moins' : '') + ' (simulé)' })}<span class="hl-pl" data-nature="simule" aria-label="plage simulée">${fr0(x.bas)}–${fr0(x.haut)}${x.partiel ? '+' : ''}</span></span>`;
    return `<div class="hl${x.horsStyle ? ' hors' : ''}" data-famille="${f}" style="--c:${J[f].base};--t:${J[f].texte};--z:${J[f].fond};--w:${W0}px">
      <span class="hl-n">${picto(f, 16)}<span class="hl-m">${COURT[f]}</span></span>
      <span class="hl-p"><i class="hl-z" data-role="zone" style="width:${zone.toFixed(1)}px"></i><i class="hl-a${x.avantSource === 'dégustation' ? ' deg' : ''}" style="width:${base.toFixed(1)}px"></i>${segs}${over}${somme}${w}${repere}${inc}</span>
      ${v}</div>`;
  }

  // ---------- une famille en colonne (barres de l5b, enrichies) ----------
  const HC = 100;
  function colonne(f, x, o = {}) {
    const len = o.lentille || 'style', max = len === 'style' ? x.cran * 5 : 100, h = (v) => Math.max(0, Math.min(HC, v / max * HC));
    const zone = h(x.top), base = h(x.avant);
    let y = base, segs = '';
    x.parts.forEach((q, i) => { const e = h(x.avant + x.parts.slice(0, i + 1).reduce((s, r) => s + r.v, 0)); if (e - y > 0.3) segs += `<i class="vb-s ${MOTIF[i]}" style="bottom:${y.toFixed(1)}px;height:${(e - y).toFixed(1)}px"></i>`; y = e; });
    const yc = h(x.centre);
    if (yc - y > 0.6) segs += `<i class="vb-s m-bio" data-role="biotransformation" style="bottom:${y.toFixed(1)}px;height:${(yc - y).toFixed(1)}px"></i>`;
    const over = x.centre > x.top ? `<i class="vb-x" style="bottom:${zone.toFixed(1)}px;height:${Math.max(1.5, yc - zone).toFixed(1)}px"></i>` : '';
    const ghost = o.avant != null ? `<i class="vb-g" style="bottom:0;height:${h(o.avant).toFixed(1)}px"></i>` : '';
    const w = x.rien ? '' : `<i class="vb-w" style="bottom:${h(x.bas).toFixed(1)}px;height:${Math.max(1, h(x.haut) - h(x.bas)).toFixed(1)}px"></i>${x.haut > max ? '<i class="vb-fl" aria-hidden="true"></i>' : ''}`;
    const inc = x.rien ? '<i class="vb-inc" style="bottom:0">?</i>' : '';
    const val = fr0(x.centre);
    const lab = x.rien ? '<span class="vb-v inc">rien</span>' : `<span class="sv vb-v" data-nature="simule" aria-label="${NOM[f]} : ${val} sur 100, de ${fr0(x.bas)} à ${fr0(x.haut)} (simulé)">${o.tilde === false ? '' : '~'}${val}</span>`;
    return `<span class="vb${x.horsStyle ? ' hors' : ''}" data-famille="${f}" data-centre="${x.centre}" style="--c:${J[f].base};--t:${J[f].texte};--z:${J[f].fond}">
      <span class="vb-p" style="--hc:${HC}px"><i class="vb-z" data-role="zone" style="height:${zone.toFixed(1)}px"></i>${ghost}<i class="vb-a${x.avantSource === 'dégustation' ? ' deg' : ''}" style="height:${base.toFixed(1)}px"></i>${segs}${over}${w}${inc}</span>
      ${picto(f, 16)}${lab}</span>`;
  }

  // ---------- un houblon : nom, usage en mot, α (lot d'abord, sinon fiches), stock ----------
  const USAGE = { aromatique: 'arôme', 'amérisant': 'amer', double: 'mixte', inconnu: 'inconnu' };
  const parNom = Object.fromEntries(Object.values(H).map((h) => [h.nom, h]));
  const hop = (n) => parNom[n] || H[n];
  function usage(n) { const h = hop(n), u = h.usage; return `<span class="us${u.src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u.u}" data-source="${u.src}" aria-label="${esc(h.nom)} : ${u.u}, ${u.src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider'}">${USAGE[u.u] || u.u}</span>`; }
  function alpha(n) {
    const A = hop(n).alpha;
    if (A.lot != null) return `<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" role="img" aria-label="α du lot en stock : ${fr1(A.lot)} %${A.horsFiches ? ', hors des plages de ses fiches (' + A.fiches.join('–') + ' %)' : ''}">${fr1(A.lot)}%${A.horsFiches ? '<span class="dif" aria-hidden="true">≠</span>' : ''}</span>`;
    return `<span class="al af" data-role="alpha" data-source="fiches" data-nature="mesure" role="img" aria-label="α de ses fiches : ${A.fiches.join('–')} % (${esc(A.src)}) ; pas de lot en stock">${T.LIVRE}${fr1(A.fiches[0])}–${fr1(A.fiches[1])}%</span>`;
  }
  const stock = (n) => `<span class="stk" role="img" aria-label="${T.STOCK_MOT[hop(n).stock]}">${T.STOCK_ICO_HTML[hop(n).stock]}</span>`;
  const nom = (n, tag = 'b') => `<${tag} class="hn" data-houblon="${esc(hop(n).nom)}">${esc(hop(n).nom)}</${tag}>`;
  const motif = (i) => `<i class="sw ${MOTIF[i] || 'm-plein'}" aria-hidden="true"></i>`;
  // Un composé → la famille de son plus grand poids (table des correspondances du moteur).
  const FAM_COMPOSE = { linalol: 'floral', 'géraniol': 'floral', '4MMP (4MSP)': 'tropical', '3MH (3SH)': 'citrus', '3M4MP (3S4MP)': 'citrus', 'myrcène': 'green', 'humulène': 'resin', 'caryophyllène': 'spice' };
  const HOPS = Object.values(H).filter((h) => h.id !== 'nugget').map((h) => h.nom);
  // Les vraies valeurs liées d'un cas du moteur : rapports au seuil de la recette (ou de chaque ajout).
  function rapports(c) {
    if (!c) return [];
    const rec = c.mesures.filter((m) => m.type === 'compose' && m.ajout === 'recette' && m.rapport && m.rapport.plage);
    const src = rec.length ? rec : c.mesures.filter((m) => m.type === 'compose' && m.rapport && m.rapport.plage);
    return src.map((m) => ({ compose: m.nom, famille: FAM_COMPOSE[m.nom] || 'floral', plage: m.rapport.plage, lecture: texte(m.rapport.lecture), source: (m.source || []).join(', '), houblon: m.houblon || 'la recette' }));
  }

  W.V = { R, P, H, L, J, NOM, COURT, esc, fr1, fr0, frx, sgn, picto, ico, sim, mes, conf, CONFIANCE, confiance, texte, lire, top, cran, LEV, MOM, seul, paire, cas, profil, rapports, bandeLog, axeLog, ligne, colonne, usage, alpha, stock, nom, motif, MOTIF, hop, FAM_COMPOSE, HOPS };
})(window);
