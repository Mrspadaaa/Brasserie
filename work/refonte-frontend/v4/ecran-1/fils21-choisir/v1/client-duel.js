// v1 · le script du duel (lu par generer.mjs et recopié dans la page, après les données).
const $ = (s) => document.querySelector(s);
const ORD = P.familles;
const q = new URLSearchParams(location.search);
const st = { A: q.get('a') || 'Citra', B: q.get('b') || 'Cascade', ens: q.has('ens'), mom: q.get('mom') || 'dryPost', lev: q.get('lev') || 'us05' };
const ouverts = new Set((q.get('ouvert') || '').split(',').filter(Boolean));
const ATTENDU = ['floral', 'herbal', 'earthy'];
const f1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? '+' : '−') + String(Math.round(Math.abs(x) * 10) / 10).replace('.', ','));
const hn = (n) => '<span class="hn" data-houblon="' + esc(n) + '" data-couleur="' + COULEUR[n] + '">' + esc(n) + '</span>';
const pt = (n, forme) => '<i class="hpt ' + (forme || 'plein') + '" style="--hc:' + COULEUR[n] + '" aria-hidden="true"></i>';
const pics = (fs, z) => '<span class="pis">' + fs.map((f) => pic(f, z || 16)).join('') + '</span>';
const srcs = (ks) => (ks || []).map((k) => SRCN[k] || k).join(' ; ');
const vt = (txt, ks) => '<span class="vm txt" data-nature="mesure" data-source="' + esc((ks || []).join(' ')) + '">' + txt + '</span>';
const vm = (txt, ks) => '<span class="vm" data-nature="mesure" data-source="' + esc((ks || []).join(' ')) + '">' + txt + '</span>';

// ---------- le duel : une échelle « qui en a le plus », de ÷30 à ×30, centrée sur « pareil » ----------
const pd = (r) => Math.max(0, Math.min(100, 50 + (Math.log10(r) / Math.log10(30)) * 50));
function ecart(a, b) {
  const lo = a.min != null && b.max != null ? a.min / b.max : null;
  const hi = a.max != null && b.min != null ? a.max / b.min : null;
  const c = a.c != null && b.c != null ? a.c / b.c : null;
  return { lo, hi, c };
}
function libelle(e) {
  const passe = (e.lo == null || e.lo < 1) && (e.hi == null || e.hi > 1);
  if (e.c == null) {
    if (e.lo != null && e.lo >= 1) return st.A + ' ≥×' + fr(e.lo);
    if (e.hi != null && e.hi <= 1) return st.B + ' ≥×' + fr(1 / e.hi);
    return 'inconnu';
  }
  if (e.c >= 0.8 && e.c <= 1.25) return '≈ pareil';
  const qui = e.c >= 1 ? st.A : st.B, k = e.c >= 1 ? e.c : 1 / e.c;
  return qui + ' ×' + fr(k) + (passe ? ' ?' : '');
}
function piste2(e) {
  const l = e.lo == null ? 0 : pd(e.lo), r = e.hi == null ? 100 : pd(e.hi);
  const qui = e.c != null ? (e.c >= 1 ? st.A : st.B) : e.lo != null && e.lo >= 1 ? st.A : st.B;
  const k = [1 / 10, 1 / 3, 3, 10].map((x) => '<i class="dt-k" style="left:' + pd(x) + '%"></i>').join('');
  const lab = 'écart ' + (e.lo == null ? 'de presque rien' : 'de ×' + fr(e.lo)) + ' à ' + (e.hi == null ? 'sans borne' : '×' + fr(e.hi)) + ', ' + st.A + ' sur ' + st.B;
  return '<span class="dt"><i class="dt-g"></i>' + k + '<i class="dt-0"></i><i class="db' + (e.lo == null ? ' ouv-g' : '') + (e.hi == null ? ' ouv-d' : '') + '" data-role="incertitude" data-nature="mesure" data-source="fiches (rapport des plages publiées)" aria-label="' + esc(lab) + '" style="left:' + l + '%;width:' + Math.max(1.5, r - l) + '%;--dc:' + COULEUR[qui] + '">' + (e.c != null ? '<b style="left:' + ((pd(e.c) - l) / Math.max(1.5, r - l)) * 100 + '%"></b>' : '') + '</i></span>';
}
function detail(r) {
  const xs = [st.A, st.B].map((n) => H[n][r.id]);
  const max = Math.max(...xs.flatMap((o) => [o.max, o.min, ...o.lots.map((l) => l.v)]).filter((x) => x != null)) * 1.15;
  return [st.A, st.B].map((n) => {
    const o = H[n][r.id];
    const lo = o.min == null ? 0 : o.min, hi = o.max == null ? max : o.max;
    const lots = o.lots.length ? '<div class="lots" aria-hidden="true"><span class="pl" style="left:' + (lo / max) * 100 + '%;width:' + ((hi - lo) / max) * 100 + '%;--hc:' + COULEUR[n] + '"></span>' + o.lots.map((l) => '<i style="left:' + (l.v / max) * 100 + '%;--hc:' + COULEUR[n] + '"></i>').join('') + '</div>'
      + '<div>' + o.lots.length + (o.lots.length > 1 ? ' lots mesurés' : ' lot mesuré') + ' (un point par lot) : ' + o.lots.map((l) => vm(fr(l.v), l.src) + ' <span class="gris">' + esc(l.id + (l.an ? ', ' + l.an : '')) + '</span>').join(' · ') + '</div>' : '<div class="gris">Aucun lot mesuré dans le dépôt.</div>';
    return '<div class="hrow">' + pt(n, n === st.A ? 'plein' : 'contour') + hn(n) + ' ' + vm(plg(o.min, o.max), o.src) + ' ' + r.unite + '</div><div class="gris">' + esc(o.base || '') + ' — ' + esc(srcs(o.src)) + '</div>' + lots;
  }).join('');
}
function rangMots() {
  const na = H[st.A].niveaux, nb = H[st.B].niveaux;
  const deux = ORD.filter((f) => na[f] > 0 && nb[f] > 0), oa = ORD.filter((f) => na[f] > 0 && !(nb[f] > 0)), ob = ORD.filter((f) => nb[f] > 0 && !(na[f] > 0));
  return '<div class="dr" data-row="mots"><div class="dr-1"><span class="dr-n">Mots des fiches</span><span class="dr-x">' + (deux.length ? 'pareil' : 'rien en commun') + '</span></div>'
    + '<div class="mots"><span class="g" aria-label="seulement ' + esc(st.B) + '">' + pics(ob, 14) + '</span><span class="m" data-nature="mesure" data-source="pack-fiches">' + pics(deux, 14) + esc(deux.map((f) => COURT_[f].toLowerCase()).join(', ') || 'aucune') + '</span><span class="d" aria-label="seulement ' + esc(st.A) + '">' + pics(oa, 14) + '</span></div>'
    + '<div class="dr-d"><div>Familles citées par les fiches : au milieu, les deux ; à gauche, ' + esc(st.B) + ' seul ; à droite, ' + esc(st.A) + ' seul. Les fiches disent quelles familles, pas combien.</div></div></div>';
}
function rangs() {
  return rangMots() + ROWS.map((r) => {
    const a = H[st.A][r.id], b = H[st.B][r.id], e = ecart(a, b);
    return '<div class="dr' + (ouverts.has(r.id) ? ' ouvert' : '') + '" data-row="' + r.id + '" role="button" tabindex="0" aria-expanded="' + ouverts.has(r.id) + '">'
      + '<div class="dr-1"><span class="dr-n">' + (r.fams.length ? pics(r.fams, 16) : '') + esc(r.nom) + '<small>' + esc(r.tag) + '</small></span><span class="dr-x">' + esc(libelle(e)) + '</span></div>'
      + '<div class="dr-2"><span class="dr-v b">' + vm(plg(b.min, b.max), b.src) + '</span>' + piste2(e) + '<span class="dr-v a">' + vm(plg(a.min, a.max), a.src) + '</span></div>'
      + '<div class="dr-d"><div class="gris">' + esc(r.unite) + (r.note ? ' · ' + esc(r.note) : '') + '</div>' + detail(r) + '</div></div>';
  }).join('');
}

// ---------- dans ta 16D : le moteur (rapport au seuil, en plage) ----------
const MOT = [['thiols', ['tropical', 'berries'], 'Tropical, cassis', '4MMP'], ['linalol', ['floral', 'citrus'], 'Floral, agrumes', 'linalol'], ['myrcene', ['resin', 'green'], 'Résineux, vert', 'myrcène']];
function lecture(r) {
  if (!r) return 'inconnu';
  if (r.min != null && r.min > 10) return '<span class="hst">hors de la 16D</span>';
  if (r.c != null && r.c > 10) return '<span class="hst">peut-être hors de la 16D</span>';
  if (r.max != null && r.max < 1) return 'sous le seuil';
  if (r.min != null && r.min > 1) return 'au-dessus du seuil';
  return 'autour du seuil';
}
function moteur() {
  return axeLog([0.01, 1, 10, 100, 1000]) + MOT.map(([k, fams, nom, tag]) => {
    const bs = [[st.A, 'plein'], [st.B, 'contour']].map(([n, forme]) => { const r = H[n].moteur[k]; return r ? { min: r.min, max: r.max, c: r.c, couleur: COULEUR[n], forme, src: 'moteur « pouvoir aromatique » (fils19-choix, ' + n + ' 4 g/L, après, 3 j' + (r.bc ? ', base commune' : '') + ')', label: n + ' : ' + facteur(r.min) + ' à ' + facteur(r.max) } : null; }).filter(Boolean);
    return '<div class="mo-l"><span class="lab"><b>' + pics(fams, 14) + esc(nom) + '</b><small>' + esc(tag) + '</small></span>' + piste({ bandes: bs }) + '<span class="verdict hors-abs">' + [st.A, st.B].map((n) => esc(n) + ' : ' + lecture(H[n].moteur[k])).join(' · ') + '</span></div>';
  }).join('');
}

// ---------- le profil simulé, l'ajout cumulé, la levure ----------
// Le vrai profil simulé (donnees/profils-simules.json) : la grille pour un houblon seul (US-05 et Pomona),
// les paires pour l'ajout cumulé (US-05, Pomona, Verdant). Ce que la grille ne simule pas reste « inconnu ».
const crans = (f, c) => (c - (P.avant[f] || 0)) / P.cran[f];
const unC = (x) => '<span class="vs" data-nature="simule">~' + f1(x) + ' cran' + (Math.abs(x) >= 1.95 ? 's' : '') + '</span>';
let famDet = q.get('famille') || null;
function series() {
  const L = LEVK[st.lev];
  if (st.ens) { const g = PAIRES.find((x) => ((x.n[0] === st.A && x.n[1] === st.B) || (x.n[0] === st.B && x.n[1] === st.A)) && x.m === st.mom && x.l === L); return g ? [{ cle: 'seul', nom: st.A + ' + ' + st.B, res: g.p, g }] : []; }
  const un = (n) => GRILLE.find((x) => x.n === n && x.m === st.mom && x.d === 4 && x.j === 3 && x.l === L);
  const a = un(st.A), b = un(st.B);
  return a && b ? [{ cle: 'a', nom: st.A, res: a.p, g: a }, { cle: 'b', nom: st.B, res: b.p, g: b }] : [];
}
function detailFam(S, f) {
  const max = Math.max(100, ...S.map((s) => s.res[f][2]));
  const pos = (x) => Math.min(100, (x / max) * 100);
  const band = (s) => { const [lo, c, hi] = s.res[f]; return '<div class="fd-l"><span class="fd-n">' + (s.cle === 'seul' ? esc(s.nom) : pt(s.nom, s.cle === 'a' ? 'plein' : 'contour') + hn(s.nom)) + '</span><span class="fd-t"><i class="fd-z" style="width:' + pos(P.bande[f][1]) + '%"></i><i class="fd-b ' + s.cle + '" data-role="incertitude" data-nature="simule" style="left:' + pos(lo) + '%;width:' + Math.max(1, pos(hi) - pos(lo)) + '%;--hc:' + (s.cle === 'seul' ? '#5b5b66' : COULEUR[s.nom]) + '"><b style="left:' + ((pos(c) - pos(lo)) / Math.max(1, pos(hi) - pos(lo))) * 100 + '%"></b></i></span><span class="fd-v mono" data-nature="simule">~' + fr(c) + ' <small>(' + fr(lo) + '–' + fr(hi) + ')</small></span></div>'; };
  return '<div class="fdet" data-role="simulation"><b>' + pic(f, 16) + ' ' + esc(COURT_[f]) + ' : ~ points sur 100, simulés</b>' + S.map(band).join('')
    + '<span class="gris">Pâle : la 16D, de ' + P.bande[f][0] + ' à ' + P.bande[f][1] + ' points. Avant : ' + fr(P.avant[f] || 0) + ' (' + esc(P.avantSource[f]) + '). La bande va du bas au haut simulés, sans rognure : son haut peut dépasser 100.</span></div>';
}
function sim() {
  const S = series();
  const nomL = LEVN[st.lev];
  $('#sim-ctx').textContent = (st.ens ? st.A + ' + ' + st.B + ' ensemble, 2 + 2 g/L' : '4 g/L chacun') + ' · ' + (st.mom === 'dryActive' ? 'fermentation active' : 'après fermentation') + ' · 3 j · ' + nomL;
  if (!S.length) {
    $('#sim').innerHTML = '<div class="trou">' + ic('inconnu', 14) + '<span><b>' + esc(nomL) + ' : pas simulé ici.</b> Le moteur simule US-05 et Pomona pour un houblon seul, et Verdant pour un ajout cumulé ; ' + esc(nomL === 'LalBrew Diamond' ? 'Diamond : « le plus de thiols mesurés, le fruité perçu le plus faible » (Samia 2026), écrit, pas simulé.' : 'essaie « ensemble ».') + '</span></div>';
    $('#ecart').innerHTML = ''; $('#ajout').innerHTML = ''; return;
  }
  const fams = ORD.filter((f) => S.some((s) => Math.abs(crans(f, s.res[f][1])) >= 0.25) || ATTENDU.includes(f));
  const leg = '<div class="sb-leg">' + (st.ens ? '<span>' + ic('plus2', 12) + hn(st.A) + ' + ' + hn(st.B) + ', une barre</span>' : '<span>' + pt(st.A, 'plein') + hn(st.A) + ' : barre pleine</span><span>' + pt(st.B, 'contour') + hn(st.B) + ' : en contour</span>') + '<span class="gris">pâle : la 16D · orangé : au-delà</span></div>';
  $('#sim').innerHTML = leg + barres(fams, S.map((s) => ({ ...s })), P, COURT_, pic) + (famDet && fams.includes(famDet) ? detailFam(S, famDet) : '<p class="gris petit">Un toucher sur une famille : ses bornes, sans rognure.</p>');
  const g = $('#sim .sbars'); if (g) g.style.setProperty('--n', fams.length > 5 ? Math.ceil(fams.length / 2) : fams.length);
  document.querySelectorAll('#sim .sb').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === famDet)));
  const hors = (s, f) => s.res[f][1] > P.bande[f][1];
  let t;
  if (!st.ens) {
    const d = fams.map((f) => [f, crans(f, S[0].res[f][1]) - crans(f, S[1].res[f][1])]).filter(([, x]) => Math.abs(x) >= 0.25).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3);
    const ha = fams.filter((f) => hors(S[0], f) && !hors(S[1], f) && f !== 'resin');
    t = '<b>' + esc(st.A) + '</b> plutôt que ' + esc(st.B) + ' : ' + (d.length ? d.map(([f, x]) => esc(COURT_[f].toLowerCase()) + ' ' + unC(x)).join(' · ') : '<span class="vs" data-nature="simule">~ moins d’un cran d’écart</span>') + (ha.length ? ' ; <span class="hst">~ ' + esc(st.A) + ' sort de la 16D en ' + esc(ha.map((f) => COURT_[f].toLowerCase()).join(', ')) + ', pas ' + esc(st.B) + '</span>' : '') + '.';
  } else {
    const d = fams.map((f) => [f, crans(f, S[0].res[f][1])]).filter(([, x]) => Math.abs(x) >= 0.25).sort((x, y) => y[1] - x[1]).slice(0, 3);
    const fs = S[0].g.fs || {};
    t = '<b>Ensemble</b>, 2 + 2 g/L : ' + d.map(([f, x]) => esc(COURT_[f].toLowerCase()) + ' ' + unC(x)).join(' · ') + (fs.citrus != null ? ' ; la saturation partagée garde <span class="vs" data-nature="simule">~' + Math.round(fs.citrus * 100) + ' %</span> de la somme des deux seuls (agrumes)' : '') + '.';
  }
  $('#ecart').innerHTML = t;
  $('#ajout').innerHTML = st.ens ? '<div data-role="ajout">' + ic('plus2', 14) + hn(st.A) + ' <span class="mono">2 g/L</span> + ' + hn(st.B) + ' <span class="mono">2 g/L</span>, même dry hop, 3 j · dose totale <span class="vm" data-nature="mesure" data-source="saisie">4 g/L</span>, dans la zone ' + vm(BIO.sat.zone.join('–') + ' g/L', BIO.sat.sources) + ' (Cascade seulement) · synergie, masquage : <span class="inc" data-inconnu="synergie" data-source="' + esc(BIO.synergie.sources.join(' ')) + '">inconnu</span></div>' : '';
}
function bio() {
  const L = BIO.levures[st.lev], act = st.mom === 'dryActive';
  const lignes = [
    ['Esters (fiche)', vt(esc(L.esters), L.src)],
    ['Géraniol → citronellol', L.gc ? vm('« ' + esc(L.gc) + ' »', L.src) : '<span class="inc" data-inconnu="non publié" data-source="' + esc(L.src.join(' ')) + '">inconnu</span> non publié'],
    ['Thiols (β-lyase)', vt(esc(L.betaLyase), L.src)],
  ];
  if (L.notes && L.notes.length) lignes.push(['Mesuré', vt(esc(L.notes.join(' ')), L.src)]);
  return '<div data-role="biotransformation"><b>' + ic('levure', 14) + ' Biotransformation · ' + esc(L.nom) + '</b>'
    + (act ? '<span>En fermentation active, la levure travaille le houblon. Le simulé compte, par convention : géraniol → citronellol 50 % pour Pomona, 0 % pour les autres (haut 87 %, H41) ; 3MH libéré 0,1 % des précurseurs pour Verdant et Diamond (0,01–0,35 %, H42).</span>' : '<span>Après fermentation, la levure est retombée : le simulé ne compte aucune biotransformation ; la levure n’y change rien.</span>')
    + lignes.map(([k, v]) => '<span><span class="gris">' + k + ' :</span> ' + v + '</span>').join('')
    + '<span><span class="gris">Linalol :</span> ' + vt(esc(BIO.linalol.texte), BIO.linalol.sources) + '</span>'
    + '<span><span class="gris">Rendement sur houblon réel :</span> <span class="inc" data-inconnu="rendement" data-source="H42">inconnu</span> ' + vt(esc(BIO.thiols.texte.split(';')[0]), BIO.thiols.sources) + '</span>'
    + (act ? '<span><span class="gris">Hop creep :</span> ' + vt(esc(BIO.creep.texte), BIO.creep.sources) + '</span>' : '') + '</div>';
}
function reponse() {
  const na = H[st.A].niveaux, nb = H[st.B].niveaux;
  const deux = ORD.filter((f) => na[f] > 0 && nb[f] > 0).map((f) => COURT_[f].toLowerCase());
  const sur = ROWS.map((r) => ({ r, e: ecart(H[st.A][r.id], H[st.B][r.id]) })).filter(({ e }) => (e.lo != null && e.lo >= 1) || (e.hi != null && e.hi <= 1));
  const cote = (pourA) => sur.filter(({ e }) => (pourA ? e.lo != null && e.lo >= 1 : e.hi != null && e.hi <= 1)).map(({ r, e }) => ({ r, k: e.c != null ? (pourA ? e.c : 1 / e.c) : pourA ? e.lo : 1 / e.hi, min: e.c == null })).sort((x, y) => y.k - x.k)[0];
  const a = cote(true), b = cote(false);
  const dit = (n, x) => '<b>' + esc(n) + ' ' + (x.min ? '≥' : '') + '×' + fr(x.k) + '</b> en <span class="fx">' + (x.r.fams.length ? pics(x.r.fams, 14) : '') + esc(x.r.nom.toLowerCase()) + '</span>' + (x.r.tag ? ' (' + esc(x.r.tag) + ')' : '');
  const debut = deux.length ? 'Mêmes mots (' + esc(deux.join(', ')) + '), pas le même cône' : 'Pas les mêmes mots, ni le même cône';
  $('#reponse').innerHTML = (a || b) ? debut + ' : ' + [a && dit(st.A, a), b && dit(st.B, b)].filter(Boolean).join(', ') + ', à dose égale.' : 'À dose égale, aucun écart sûr entre ' + esc(st.A) + ' et ' + esc(st.B) + ' dans leurs fiches.';
}
function rendre() {
  reponse();
  $('#titre').innerHTML = hn(st.A) + ' ou ' + hn(st.B) + ', à 4 g/L ?';
  $('#ax-a').textContent = st.A; $('#ax-b').textContent = st.B;
  $('#ax-pa').style.setProperty('--hc', COULEUR[st.A]); $('#ax-pb').style.setProperty('--hc', COULEUR[st.B]);
  document.querySelectorAll('.hc').forEach((c) => { const n = c.dataset.h, r = n === st.A ? 'a' : n === st.B ? 'b' : ''; c.setAttribute('aria-pressed', String(!!r)); if (r) c.dataset.roleDuel = r; else delete c.dataset.roleDuel; });
  $('#rows').innerHTML = rangs();
  $('#moteur').innerHTML = moteur();
  document.querySelectorAll('[data-ens]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.ens === '1') === st.ens)));
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mom === st.mom)));
  document.querySelectorAll('[data-lev]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lev === st.lev)));
  sim();
  $('#bio').innerHTML = bio();
}
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-h]');
  if (c) { const n = c.dataset.h; if (n === st.B) { st.B = st.A; st.A = n; } else if (n !== st.A) st.B = n; rendre(); return; }
  if (e.target.closest('[data-swap]')) { [st.A, st.B] = [st.B, st.A]; rendre(); return; }
  const en = e.target.closest('[data-ens]'); if (en) { st.ens = en.dataset.ens === '1'; rendre(); return; }
  const mo = e.target.closest('[data-mom]'); if (mo) { st.mom = mo.dataset.mom; rendre(); return; }
  const lv = e.target.closest('[data-lev]'); if (lv) { st.lev = lv.dataset.lev; rendre(); return; }
  const sb = e.target.closest('#sim .sb[data-f]');
  if (sb) { famDet = famDet === sb.dataset.f ? null : sb.dataset.f; sim(); return; }
  const dr = e.target.closest('.dr[data-row]');
  if (dr && !e.target.closest('.dr-d') && !e.target.closest('[data-houblon]')) { const id = dr.dataset.row; if (ouverts.has(id)) ouverts.delete(id); else ouverts.add(id); dr.classList.toggle('ouvert'); dr.setAttribute('aria-expanded', String(ouverts.has(id))); }
});
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.dr[data-row]')) { e.preventDefault(); e.target.click(); } });
rendre();
