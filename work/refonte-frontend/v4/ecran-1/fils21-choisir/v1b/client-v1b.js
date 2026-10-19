// v1b · le script de la page (lu par generer.mjs et recopié après les données).
const $ = (s) => document.querySelector(s);
const ORD = P.familles;
const q = new URLSearchParams(location.search);
const st = { A: q.get('a') || 'Citra', B: q.get('b') || 'Cascade', mom: q.get('mom') || 'dryActive', lev: q.get('lev') || 'us05', mix: Number(q.get('mix') || 0), tir: 0, fam: q.get('famille') || null, defi: q.has('defi'), tirage: q.has('tirage') };
if (q.has('tir')) st.tir = Number(q.get('tir'));
const ouverts = new Set((q.get('ouvert') || '').split(',').filter(Boolean));
const ATTENDU = ['floral', 'herbal', 'earthy'];
const f1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? '+' : '−') + String(Math.round(Math.abs(x) * 10) / 10).replace('.', ','));
const hn = (n) => '<span class="hn" data-houblon="' + esc(n) + '" data-couleur="' + COULEUR[n] + '">' + esc(n) + '</span>';
const pt = (n, forme) => '<i class="hpt ' + (forme || 'plein') + '" style="--hc:' + COULEUR[n] + '" aria-hidden="true"></i>';
const pics = (fs, z) => '<span class="pis">' + fs.map((f) => pic(f, z || 16)).join('') + '</span>';
const fx = (f, t) => '<span class="fx" style="color:' + P.tons[f].texte + '">' + pic(f, 14) + esc(t || COURT_[f].toLowerCase()) + '</span>';
const srcs = (ks) => (ks || []).map((k) => SRCN[k] || k).join(' ; ');
const vm = (txt, ks) => '<span class="vm" data-nature="mesure" data-source="' + esc([].concat(ks || []).join(' ')) + '">' + txt + '</span>';
const vt = (txt, ks) => '<span class="vm txt" data-nature="mesure" data-source="' + esc([].concat(ks || []).join(' ')) + '">' + txt + '</span>';
const vs = (txt) => '<span class="vs" data-nature="simule">' + txt + '</span>';
const inc = (r, s) => '<span class="inc" data-inconnu="' + esc(r) + '" data-source="' + esc(s || 'H') + '">inconnu</span>';
const crU = (x) => f1(x) + ' cran' + (Math.abs(x) >= 1.95 ? 's' : '');
const actif = () => st.mom === 'dryActive';

// ---------- le simulé : la grille (un houblon), les paires (deux ensemble) ----------
// Après fermentation, la levure est au repos : le moteur ne la fait pas jouer, on lit US-05.
const levS = () => (actif() ? st.lev : 'us05');
const levU = () => (actif() && (st.lev === 'us05' || st.lev === 'pomona') ? st.lev : 'us05');
const un = (n, d) => GR.find((x) => x.n === n && x.m === st.mom && x.d === (d || 4) && x.l === LEVK[levU()]);
const paire = () => PA.find((x) => ((x.n[0] === st.A && x.n[1] === st.B) || (x.n[0] === st.B && x.n[1] === st.A)) && x.m === st.mom && x.l === LEVK[levS()]);
const levOK = (k) => (k === 'us05' || k === 'pomona' ? true : k === 'verdant' ? st.mix === 1 : false);
const dC = (f, c) => (c - (AV[f].c || 0)) / P.cran[f];
const sort = (p, f) => p[f][1] > P.bande[f][1];
const nul = (p, f) => p[f][0] === 0 && p[f][1] === 0 && p[f][2] === 0;
function profilMix() {
  if (st.mix === 1) { const g = paire(); return g ? { nom: st.A + ' + ' + st.B + ', 2 + 2 g/L', p: g.p, g } : null; }
  const n = st.mix === 0 ? st.A : st.B, g = un(n); return g ? { nom: n + ' 4 g/L', p: g.p, g } : null;
}

// ---------- la réponse, le verdict dans ta 16D, l'équivalence ----------
const pd = (r) => Math.max(0, Math.min(100, 50 + (Math.log10(r) / Math.log10(30)) * 50));
function ecart(a, b) {
  const lo = a.min != null && b.max != null ? a.min / b.max : null;
  const hi = a.max != null && b.min != null ? a.max / b.min : null;
  const c = a.c != null && b.c != null ? a.c / b.c : null;
  return { lo, hi, c };
}
function lecture(e, r) {
  if (r && r.id === 'ych' && e.c != null && e.c >= 0.8 && e.c <= 1.25) return { t: '≈ pareil', cls: 'eg' };
  const aD = e.lo != null && e.lo >= 1, bD = e.hi != null && e.hi <= 1;
  if (aD) return { t: st.A + ' devant ×' + fr(e.lo) + (e.hi != null ? '–' + fr(e.hi) : '+'), cls: 'a', qui: st.A, k: e.c != null ? e.c : e.lo };
  if (bD) return { t: st.B + ' devant ×' + fr(1 / e.hi) + (e.lo != null && e.lo > 0 ? '–' + fr(1 / e.lo) : '+'), cls: 'b', qui: st.B, k: e.c != null ? 1 / e.c : 1 / e.hi };
  if (e.c == null && e.lo == null && e.hi == null) return { t: 'inconnu', cls: 'nd' };
  return { t: 'non départagés', cls: 'nd' };
}
function reponse() {
  const decides = ROWS.filter((r) => !r.papier).map((r) => ({ r, l: lecture(ecart(H[st.A][r.id], H[st.B][r.id]), r) })).filter((x) => x.l.qui);
  const top = (n) => decides.filter((x) => x.l.qui === n).sort((a, b) => b.l.k - a.l.k)[0];
  const a = top(st.A), b = top(st.B);
  const dit = (n, x, p) => '<b>' + esc(n) + ' ×' + fr(x.l.k) + '</b> en <span class="fx">' + pics(x.r.fams, 14) + esc(x.r.tag.split(',')[0] + p) + '</span>';
  const na = H[st.A].niveaux, nb = H[st.B].niveaux, deux = ORD.some((f) => na[f] > 0 && nb[f] > 0);
  $('#reponse').innerHTML = (deux ? 'Mêmes mots, pas le même cône' : 'Ni les mêmes mots, ni le même cône') + (a || b ? ' : ' + (a && b ? dit(st.A, a, ',') + ' ' + dit(st.B, b, '.') : a ? dit(st.A, a, '.') : dit(st.B, b, '.')) : '.');
}
function verdict() {
  const ga = un(st.A), gb = un(st.B);
  if (!ga || !gb) { $('#verdict').innerHTML = '<span class="vd-t">~ Dans ta 16D :</span> ' + inc('pas simulé', 'moteur') + ' pour ce réglage.'; $('#egal').innerHTML = ''; return; }
  const fam = ORD.filter((f) => f !== 'resin');
  const ligne = (n, g, fin) => { const s = fam.filter((f) => sort(g.p, f)); return '<b>' + esc(n) + '</b> ' + (s.length ? '<span class="hst">sort</span> en ' + s.map((f, i) => fx(f) + ' ' + vs('~' + f1(dC(f, g.p[f][1])) + (i < s.length - 1 ? ',' : ' crans' + fin))).join(' ') : '<span>reste' + fin + '</span>'); };
  $('#verdict').innerHTML = '<span class="vd-t">~ Dans ta 16D :</span> ' + ligne(st.A, ga, ' ;') + ' ' + ligne(st.B, gb, '.');
  // L'équivalence (y3) : la dose du second houblon qui égalerait le premier, par la courbe du moteur.
  const g1 = un(st.B, 1); const cibles = fam.filter((f) => sort(ga.p, f) && ga.p[f][1] > gb.p[f][1]);
  const liste = (cibles.length ? cibles : fam.filter((f) => ga.p[f][1] - gb.p[f][1] > 5).slice(0, 2)).slice(0, 2);
  if (!liste.length || !g1) { $('#egal').innerHTML = ''; return; }
  const eq = liste.map((f) => {
    const Pf = COURBE.P[f], K = COURBE.K[f], av = AV[f].c || 0, It = ga.p[f][1] - av, I1 = g1.p[f][1] - av;
    if (nul(g1.p, f) || I1 <= 0.05 || It >= Pf * 0.98) return { f, d: null };
    const x1 = (K * I1) / (Pf - I1), d = (K * It) / (Pf - It) / x1;
    return { f, d: d > 16 ? null : d };
  });
  $('#egal').innerHTML = 'Pour égaler <b>' + esc(st.A) + ' 4 g/L :</b> <b>' + esc(st.B) + '</b> ' + eq.map((x, i) => (x.d == null ? vs('~jamais') : vs('~' + fr(x.d, 1) + ' g/L') + (x.d > 8 ? ' <span class="gris">(prolongée)</span>' : '')) + ' en ' + fx(x.f, COURT_[x.f].toLowerCase() + (i < eq.length - 1 ? ',' : '.'))).join(' ');
}

// ---------- le duel ----------
function piste2(e, l) {
  const g = e.lo == null ? 0 : pd(e.lo), d = e.hi == null ? 100 : pd(e.hi);
  const qui = l.qui || (e.c != null && e.c < 1 ? st.B : st.A);
  const k = [1 / 10, 1 / 3, 3, 10].map((x) => '<i class="dt-k" style="left:' + pd(x) + '%"></i>').join('');
  return '<span class="dt"><i class="dt-g"></i>' + k + '<i class="dt-0"></i><i class="db' + (l.cls === 'nd' ? ' raye' : '') + (e.lo == null ? ' ouv-g' : '') + (e.hi == null ? ' ouv-d' : '') + '" data-role="incertitude" data-nature="mesure" data-source="fiches (rapport des plages publiées)" style="left:' + g + '%;width:' + Math.max(1.5, d - g) + '%;--dc:' + COULEUR[qui] + '">' + (e.c != null ? '<b style="left:' + ((pd(e.c) - g) / Math.max(1.5, d - g)) * 100 + '%"></b>' : '') + '</i></span>';
}
function detail(r) {
  const xs = [st.A, st.B].map((n) => H[n][r.id]);
  const max = Math.max(...xs.flatMap((o) => [o.max, o.min, ...o.lots.map((l) => l.v)]).filter((x) => x != null)) * 1.15 || 1;
  return [st.A, st.B].map((n) => {
    const o = H[n][r.id];
    if (o.inconnu) return '<div class="hrow">' + hn(n) + ' ' + inc(o.base, o.src.join(' ')) + ' <span class="gris">' + esc(o.base) + '</span></div>';
    const lo = o.min == null ? 0 : o.min, hi = o.max == null ? max : o.max;
    const lots = o.lots.length ? '<div class="lots" aria-hidden="true"><span class="pl" style="left:' + (lo / max) * 100 + '%;width:' + ((hi - lo) / max) * 100 + '%;--hc:' + COULEUR[n] + '"></span>' + o.lots.map((l) => '<i style="left:' + (l.v / max) * 100 + '%;--hc:' + COULEUR[n] + '"></i>').join('') + '</div><div>' + o.lots.length + ' lot' + (o.lots.length > 1 ? 's' : '') + ' mesuré' + (o.lots.length > 1 ? 's' : '') + ', un point par lot : ' + o.lots.map((l) => vm(fr(l.v), l.src) + ' <span class="gris">' + esc(l.id) + '</span>').join(' · ') + '</div>' : '';
    return '<div class="hrow">' + hn(n) + ' ' + vm(plg(o.min, o.max), o.src) + ' ' + esc(r.unite) + '</div><div class="gris">' + esc(o.base || '') + ' — ' + esc(srcs(o.src)) + '</div>' + lots;
  }).join('');
}
function rangMots() {
  const na = H[st.A].niveaux, nb = H[st.B].niveaux;
  const deux = ORD.filter((f) => na[f] > 0 && nb[f] > 0), oa = ORD.filter((f) => na[f] > 0 && !(nb[f] > 0)), ob = ORD.filter((f) => nb[f] > 0 && !(na[f] > 0));
  return '<div class="dr" data-row="mots"><div class="dr-1"><span class="dr-n">Fiches</span><span class="dr-x eg">' + (deux.length ? 'pareil' : 'rien en commun') + '</span></div>'
    + '<div class="mots"><span class="g">' + pics(ob, 14) + '</span><span class="m" data-nature="mesure" data-source="pack-fiches">' + pics(deux, 14) + esc(deux.map((f) => COURT_[f].toLowerCase()).join(', ') || '—') + '</span><span class="d">' + pics(oa, 14) + '</span></div></div>';
}
function rangs() {
  return rangMots() + ROWS.map((r) => {
    const a = H[st.A][r.id], b = H[st.B][r.id], e = ecart(a, b), l = (a.inconnu || b.inconnu) ? { t: 'inconnu', cls: 'nd' } : lecture(e, r);
    const v = (o) => (o.inconnu ? inc(o.base, o.src.join(' ')) : vm(plg(o.min, o.max), o.src));
    return '<div class="dr' + (ouverts.has(r.id) ? ' ouvert' : '') + (r.papier ? ' papier' : '') + '" data-row="' + r.id + '" role="button" tabindex="0" aria-expanded="' + ouverts.has(r.id) + '">'
      + '<div class="dr-1"><span class="dr-n">' + (r.fams.length ? pics(r.fams, 14) : '') + esc(r.nom) + (r.tag ? '<small>' + esc(r.tag) + '</small>' : '') + '</span><span class="dr-x ' + l.cls + '">' + esc(l.t) + '</span></div>'
      + '<div class="dr-2"><span class="dr-v b">' + v(b) + '</span>' + ((a.inconnu || b.inconnu) ? '<span class="dt"><i class="dt-g"></i><i class="dt-0"></i></span>' : piste2(e, l)) + '<span class="dr-v a">' + v(a) + '</span></div>'
      + '<div class="dr-d"><div class="gris">' + esc(r.unite) + '</div>' + detail(r) + '</div></div>';
  }).join('');
}

// ---------- dans ta 16D : le mélange au doigt, les barres de l5b ----------
const PX = 11, AB = 0.55, HT = 60, cl = (x, a, b) => Math.max(a, Math.min(b, x));
function famsStables() {
  const ga = un(st.A), gb = un(st.B), pm = profilMix(), ps = [ga, gb, pm].filter(Boolean).map((g) => g.p);
  return ORD.filter((f) => f !== 'resin' && (ATTENDU.includes(f) || ps.some((p) => Math.abs(dC(f, p[f][1])) >= 0.25)));
}
function rand(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const graine = () => { const s = [st.A, st.B, st.mom, levS(), st.mix].join('|'); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h; };
function tirages(p, fams) {
  const R = rand(graine()), out = [];
  for (let k = 0; k < st.tir; k++) { const b = {}; for (const f of fams) { const [a, c, h] = p[f]; const u = R(); if (h <= a) { b[f] = c; continue; } const F = (c - a) / (h - a); b[f] = u < F ? a + Math.sqrt(u * (h - a) * (c - a)) : h - Math.sqrt((1 - u) * (h - a) * (h - c)); } out.push(b); }
  return out;
}
function barresB(fams, pr, tir) {
  return '<div class="sbars" style="--n:' + (fams.length > 5 ? Math.ceil(fams.length / 2) : fams.length) + '">' + fams.map((f) => {
    const cr = P.cran[f], top = P.bande[f][1], av = AV[f].c || 0, [lo, c, hi, part] = pr[f];
    const style = '--b:' + P.tons[f].base + ';--t:' + P.tons[f].texte + ';--f:' + P.tons[f].fond;
    const zone = '<i class="sb-zone" data-role="zone" style="--zs:' + 3 * PX + 'px;--za:' + (top * AB).toFixed(1) + 'px"></i>';
    if (nul(pr, f)) return '<button type="button" class="sb" data-f="' + f + '" style="' + style + '" aria-label="' + COURT_[f] + ' : rien de simulé"><span class="sb-z">' + zone + '<i class="sb-inc"></i></span>' + pic(f, 16) + '<span class="sb-n">' + COURT_[f] + '</span><span class="sb-v">' + inc('rien de simulé', 'profils-simules §1') + '</span></button>';
    const y = (v) => cl((v / cr) * PX, 0, HT), ya = (v) => cl(v * AB, 0, HT);
    const plus = (hi / cr) * PX > HT || part ? ' plus' : '', plusA = hi * AB > HT || part ? ' plus' : '';
    const hs = cl((c / cr) * PX, 2, HT), ha = cl(c * AB, 2, HT), xs = Math.max(0, hs - 3 * PX);
    const pts = tir.map((b) => '<i class="tb' + (b[f] > top ? ' hors' : '') + '" style="--ty:' + y(b[f]).toFixed(1) + 'px;--tya:' + ya(b[f]).toFixed(1) + 'px"></i>').join('');
    return '<button type="button" class="sb" data-f="' + f + '" style="' + style + '" aria-label="' + COURT_[f] + ' : ~' + crU(dC(f, c)) + ', le détail">'
      + '<span class="sb-z">' + zone + '<i class="sb-pl' + plus + '" data-plusa="' + (plusA ? 1 : 0) + '" style="--pb:' + y(lo).toFixed(1) + 'px;--ph:' + Math.max(1, y(hi) - y(lo)).toFixed(1) + 'px;--pba:' + ya(lo).toFixed(1) + 'px;--pha:' + Math.max(1, ya(hi) - ya(lo)).toFixed(1) + 'px"></i>'
      + '<i class="sb-b seul" data-nature="simule" style="--hs:' + hs.toFixed(1) + 'px;--ha:' + ha.toFixed(1) + 'px;--xs:' + xs.toFixed(1) + 'px"><i></i></i>'
      + (AV[f].inconnu ? '' : '<i class="sb-av" style="--av:' + y(av).toFixed(1) + 'px;--ava:' + ya(av).toFixed(1) + 'px"></i>') + pts + '</span>'
      + pic(f, 16) + '<span class="sb-n">' + COURT_[f] + '</span><span class="sb-v' + (c > top ? ' hst' : '') + '" data-nature="simule">~' + crU(dC(f, c)) + '</span></button>';
  }).join('') + '</div>';
}
function detailFam(pr, f, nom) {
  const [lo, c, hi, part] = pr[f], max = Math.max(100, hi), pos = (x) => Math.min(100, (x / max) * 100);
  return '<div class="fdet" data-role="simulation"><b>' + pic(f, 16) + ' ' + esc(COURT_[f]) + ' ~ : ' + esc(nom) + '</b><div class="fd-l"><span class="fd-t"><i class="fd-z" style="width:' + pos(P.bande[f][1]) + '%"></i><i class="fd-b" data-role="incertitude" data-nature="simule" style="left:' + pos(lo) + '%;width:' + Math.max(1, pos(hi) - pos(lo)) + '%"><b style="left:' + ((pos(c) - pos(lo)) / Math.max(1, pos(hi) - pos(lo))) * 100 + '%"></b></i></span><span class="fd-v mono" data-nature="simule">~' + fr(c) + ' <small>(' + fr(lo) + '–' + fr(hi) + (part ? '+' : '') + ')</small></span></div>'
    + '<span class="gris">Sur 100 ; la 16D : 0 à ' + P.bande[f][1] + ' ; ta bière avant : ' + (AV[f].inconnu ? 'inconnue' : '~' + fr(AV[f].c)) + '.' + (part ? ' « + » : le haut publié manque pour un composé.' : '') + '</span></div>';
}
function mixUI() {
  $('#mix-a').textContent = st.A + ' 4 g/L'; $('#mix-b').textContent = st.B + ' 4 g/L';
  $('#mix-p').style.left = (st.mix * 50) + '%';
  $('#mix').setAttribute('aria-valuenow', String(st.mix)); $('#mix').setAttribute('aria-valuetext', st.mix === 1 ? 'ensemble, 2 + 2 g/L' : (st.mix === 0 ? st.A : st.B) + ' 4 g/L');
  document.querySelectorAll('.mix-l span').forEach((s, i) => s.classList.toggle('on', i === st.mix));
}
function sim() {
  mixUI();
  const pr = profilMix(), fams = famsStables();
  $('#sim-ctx').textContent = '';
  if (!pr) { $('#sim').innerHTML = '<p class="gris petit">' + inc('pas simulé', 'moteur') + ' : ' + esc(LEVN[st.lev]) + ' pour ce mélange.</p>'; $('#ajout').innerHTML = ''; $('#resine').innerHTML = ''; return; }
  const tir = tirages(pr.p, fams);
  $('#sim').innerHTML = barresB(fams, pr.p, tir) + '<div class="sb-leg"><b>' + esc(pr.nom) + '</b><span class="gris">' + (actif() ? 'actif, ' + esc(LEVN[st.mix === 1 ? levS() : levU()]) : 'après') + ', 3 j · pâle : la 16D, orangé : au-delà</span></div>' + (st.fam && fams.includes(st.fam) ? detailFam(pr.p, st.fam, pr.nom) : '');
  document.querySelectorAll('#sim .sb').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === st.fam)));
  $('#ajout').innerHTML = st.mix === 1 ? '<div data-role="ajout">' + ic('plus2', 14) + hn(st.A) + ' + ' + hn(st.B) + ', même dry hop · la saturation partagée garde ' + vs('~' + Math.round((pr.g.fs.citrus || 0) * 100) + ' %') + ' des agrumes des deux seuls · synergie, masquage : ' + inc('synergie, masquage', 'H67 H72') + '</div>' : '';
  $('#resine').innerHTML = pic('resin', 14) + ' Résineux : ta dégustation (« ' + esc(DEG.citation.split(',')[0]) + ' ») le met déjà au-delà de la 16D ; ce dry hop ' + vs('~' + crU(dC('resin', pr.p.resin[1]) - dC('resin', AV.resin.c))) + '.';
  // Le défi de ta dégustation (x5) et le tirage (y5), à un toucher.
  const out = fams.filter((f) => sort(pr.p, f));
  const dF = dC('floral', pr.p.floral[1]);
  $('#defi').innerHTML = '<div class="defi">'
    + '<div class="df">' + fx('floral', 'plus floral') + '<b>' + (dF >= 1 ? 'atteint' : 'pas encore') + '</b>' + vs('~' + crU(dF)) + '</div>'
    + '<div class="df">' + fx('resin', 'moins résineux') + '<b>hors houblon</b><span>le houblon en ajoute ' + vs('~' + crU(dC('resin', pr.p.resin[1]) - dC('resin', AV.resin.c))) + '</span></div>'
    + '<div class="df">' + ic('goutte', 14) + '<span>amertume ' + vm(IBU.bande.join('–') + ' IBU', 'H39') + '</span><b>dans la zone</b><span>' + vm(fr(IBU.v) + ' IBU', 'c1 : Nugget 60′') + ' avant ; dry hop : ' + inc('IBU du dry hop non calculé', 'moteur') + '</span></div>'
    + '<div class="df">' + ic('aucune', 14) + '<span>dans la 16D</span><b>' + (out.length ? out.length + ' débordent' : 'tout tient') + '</b><span>' + out.map((f) => esc(COURT_[f].toLowerCase())).join(', ') + '</span></div></div>';
  const n = st.tir, horsF = fams.map((f) => [f, tir.filter((b) => b[f] > P.bande[f][1]).length]).filter(([, k]) => k > 0).sort((a, b) => b[1] - a[1]);
  $('#tirage').innerHTML = '<p class="petit">' + (n ? vs('~ ' + n + ' bière' + (n > 1 ? 's' : '') + ' tirée' + (n > 1 ? 's' : '')) + ' dans la plage du moteur : hors de la 16D, ' + (horsF.length ? horsF.map(([f, k]) => esc(COURT_[f].toLowerCase()) + ' ' + k + ' sur ' + n).join(', ') : 'aucune') + '.' : 'Chaque toucher tire une bière possible, un point par famille.') + ' L’étendue du possible, pas une probabilité mesurée.</p>';
}
function bio() {
  const L = LEVF[st.mix === 1 ? levS() : levU()];
  if (!actif()) { $('#bio').innerHTML = ''; return; }
  $('#bio').innerHTML = '<div data-role="biotransformation"><b>' + ic('levure', 14) + ' Biotransformation · ' + esc(L.nom) + '</b>'
    + '<span><span class="gris">Esters :</span> ' + vt(esc(L.esters), L.src) + '</span>'
    + '<span><span class="gris">Géraniol → citronellol :</span> ' + (L.gc ? vt('« ' + esc(L.gc) + ' »', L.src) + ' ; le simulé compte ' + vs('~50 %') : inc('non publié', L.src.join(' ')) + ' non publié') + '</span>'
    + '<span><span class="gris">Thiols :</span> ' + vt(esc(L.betaLyase), L.src) + ' ; rendement réel ' + inc('rendement', 'H42') + '</span>'
    + '<span><span class="gris">Hop creep :</span> ' + vt(esc(BIO.creep.texte.split(';')[0]), BIO.creep.sources) + '</span></div>';
}
function reglages() {
  $('#regl-t').textContent = (actif() ? 'actif, ' + LEVN[st.mix === 1 ? levS() : levU()].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', '') : 'après') + ', 3 j';
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mom === st.mom)));
  const ks = actif() ? Object.keys(LEVK).filter(levOK) : [];
  document.querySelectorAll('#levs [data-lev]').forEach((x) => { x.hidden = !ks.includes(x.dataset.lev); x.setAttribute('aria-pressed', String(x.dataset.lev === (st.mix === 1 ? st.lev : levU()))); });
  $('#levs').hidden = !actif();
  $('#lev-n').textContent = actif() ? (st.mix === 1 ? 'Diamond : pas encore simulée.' : st.lev === 'verdant' ? 'Verdant : simulée seulement ensemble (le mélange au milieu) ; seul, la page lit US-05.' : 'Verdant, Diamond : pas encore simulées pour un houblon seul.') : 'Après fermentation, la levure est au repos : le moteur ne la compte pas.';
}
// ---------- le moteur et le panel (comme v1) ----------
const MOT = [['thiols', ['tropical', 'berries'], 'Tropicaux, baies', '4MMP'], ['linalol', ['floral', 'citrus'], 'Floral, agrumes', 'linalol'], ['myrcene', ['resin', 'green'], 'Résineux, végétal', 'myrcène']];
function lectureM(r) { if (!r) return 'inconnu'; if (r.min != null && r.min > 10) return '<span class="hst">hors de la 16D</span>'; if (r.c != null && r.c > 10) return '<span class="hst">peut-être hors de la 16D</span>'; if (r.max != null && r.max < 1) return 'sous le seuil'; if (r.min != null && r.min > 1) return 'au-dessus du seuil'; return 'autour du seuil'; }
function moteur() {
  $('#moteur').innerHTML = '<div class="sb-leg"><span>' + pt(st.A) + hn(st.A) + ' : bande pleine</span><span>' + pt(st.B, 'contour') + hn(st.B) + ' : en contour</span></div>' + axeLog([0.01, 1, 10, 100, 1000]) + MOT.map(([k, fams, nom, tag]) => {
    const bs = [[st.A, 'plein'], [st.B, 'contour']].map(([n, forme]) => { const r = H[n].moteur[k]; return r ? { min: r.min, max: r.max, c: r.c, couleur: COULEUR[n], forme, src: 'moteur « pouvoir aromatique », ' + n + ' 4 g/L', label: n + ' : ' + facteur(r.min) + ' à ' + facteur(r.max) } : null; }).filter(Boolean);
    return '<div class="mo-l"><span class="lab"><b>' + pics(fams, 14) + esc(nom) + '</b><small>' + esc(tag) + '</small></span>' + piste({ bandes: bs }) + '<span class="verdict hors-abs">' + [st.A, st.B].map((n) => esc(n) + ' : ' + lectureM(H[n].moteur[k])).join(' · ') + '</span></div>';
  }).join('') + '<p class="src-l">Rapport au seuil, pas une intensité perçue ; pâle : la 16D jusqu’à ×10 (règle du moteur, à valider).</p>';
}
function panel() {
  $('#panel').innerHTML = [st.A, st.B].map((n) => { const p = H[n].panel.find((x) => /4 g\/L|OSU/.test(x.texte)); return '<div class="pn">' + pt(n) + hn(n) + '<span class="pn-t">' + (p ? vt(esc(p.texte.replace(/^.*?:\s*/, '').replace(new RegExp('^' + n + '\\s*'), '')), p.src) : inc('aucun panel entraîné trouvé', 'H') + ' aucun panel entraîné') + '</span></div>'; }).join('') + '<p class="src-l">' + esc(SRCN.H21 || 'H21') + ', lu sur un biplot.</p>';
}
function outil() {
  const s = SUBST[st.A + '|' + st.B] || SUBST[st.B + '|' + st.A];
  $('#outil').innerHTML = s ? 'Notre outil : ' + vm(s.score + ' %', 'pack-fiches, substitution calculée v1') + ' proches, mots ' + vm(s.c.arome + ',', 'pack-fiches') + ' parts d’huile ' + vm(s.c.huiles + '.', 'pack-fiches') : 'Notre outil : ' + inc('pas de score pour cette paire', 'pack-fiches') + '.';
}
function rendre() {
  $('#titre').innerHTML = hn(st.A) + ' ou ' + hn(st.B) + ' à 4 g/L ?';
  $('#ax-a').textContent = 'plus de ' + st.A; $('#ax-b').textContent = 'plus de ' + st.B;
  document.querySelectorAll('.hc').forEach((c) => { const n = c.dataset.h, r = n === st.A ? 'a' : n === st.B ? 'b' : ''; c.setAttribute('aria-pressed', String(!!r)); if (r) c.dataset.roleDuel = r; else delete c.dataset.roleDuel; });
  reglages(); reponse(); verdict(); outil();
  $('#rows').innerHTML = rangs();
  sim(); bio(); moteur(); panel();
  $('#defi').hidden = !st.defi; $('#tirage').hidden = !st.tirage;
  document.querySelector('[data-bloc="defi"]').setAttribute('aria-expanded', String(st.defi));
  document.querySelector('[data-bloc="tirage"]').setAttribute('aria-expanded', String(st.tirage));
}
const reinit = () => { st.tir = 0; };
// ---------- les gestes ----------
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-h]');
  if (c) { const n = c.dataset.h; if (n === st.B) { st.B = st.A; st.A = n; } else if (n !== st.A) st.B = n; reinit(); rendre(); return; }
  if (e.target.closest('#regl-b')) { const r = $('#regl'); r.scrollIntoView({ block: 'center', behavior: REDUIT ? 'auto' : 'smooth' }); r.classList.remove('vu'); void r.offsetWidth; r.classList.add('vu'); return; }
  const mo = e.target.closest('[data-mom]'); if (mo) { st.mom = mo.dataset.mom; reinit(); rendre(); return; }
  const lv = e.target.closest('[data-lev]'); if (lv) { st.lev = lv.dataset.lev; reinit(); rendre(); return; }
  const bl = e.target.closest('[data-bloc]');
  if (bl) { if (bl.dataset.bloc === 'defi') st.defi = !st.defi; else { st.tirage = true; st.tir = Math.min(20, st.tir + 1); } rendre(); return; }
  const sb = e.target.closest('#sim .sb[data-f]'); if (sb) { st.fam = st.fam === sb.dataset.f ? null : sb.dataset.f; sim(); return; }
  const dr = e.target.closest('.dr[data-row]');
  if (dr && !e.target.closest('.dr-d') && !e.target.closest('[data-houblon]')) { const id = dr.dataset.row; if (ouverts.has(id)) ouverts.delete(id); else ouverts.add(id); dr.classList.toggle('ouvert'); dr.setAttribute('aria-expanded', String(ouverts.has(id))); }
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.dr[data-row]')) { e.preventDefault(); e.target.click(); }
  if (e.target && e.target.id === 'mix' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); st.mix = Math.max(0, Math.min(2, st.mix + (e.key === 'ArrowRight' ? 1 : -1))); reinit(); rendre(); }
});
// Le mélange au doigt : on glisse de l'un à l'autre ; trois positions simulées (seul, ensemble 2 + 2 g/L, l'autre seul),
// le profil suit le doigt pendant le geste.
(() => {
  const m = $('#mix'); let tient = false;
  const pos = (x) => { const r = m.querySelector('.mix-t').getBoundingClientRect(); return Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * 2); };
  const suivre = (x) => { const p = pos(x); if (p !== st.mix) { st.mix = p; reinit(); reglages(); verdict(); sim(); bio(); } };
  m.addEventListener('pointerdown', (e) => { tient = true; m.classList.add('tenu'); suivre(e.clientX); });
  document.addEventListener('pointermove', (e) => { if (tient) suivre(e.clientX); });
  const fin = () => { tient = false; m.classList.remove('tenu'); };
  document.addEventListener('pointerup', fin); document.addEventListener('pointercancel', fin);
})();
// Un toucher court qui n'a pas reçu son clic (Chrome mobile, juste après un glissé) le reçoit quand même ;
// jamais après un appui long (la fiche), jamais si le doigt a bougé.
(() => {
  let d = null, clic = 0;
  document.addEventListener('click', () => { clic = performance.now(); }, true);
  document.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') d = { t: performance.now(), x: e.clientX, y: e.clientY, el: e.target }; }, true);
  document.addEventListener('pointerup', (e) => {
    if (!d || e.pointerType !== 'touch') return;
    const ok = performance.now() - d.t < 450 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10 && !e.target.closest('#mix'), el = d.el, t0 = performance.now(); d = null;
    if (ok) setTimeout(() => { if (clic < t0 && el.isConnected) el.click(); }, 90);
  }, true);
})();
// La feuille « preuves » (u5).
(() => {
  const F = $('#preuve'), V = document.querySelector('[data-role="preuve-voile"]'), B = document.querySelector('[data-role="preuve-bouton"]');
  const ouvrirP = (on) => { F.hidden = !on; V.hidden = !on; B.setAttribute('aria-expanded', String(on)); };
  B.addEventListener('click', () => ouvrirP(F.hidden)); V.addEventListener('click', () => ouvrirP(false));
  F.querySelector('[data-role="preuve-fermer"]').addEventListener('click', () => ouvrirP(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !F.hidden) ouvrirP(false); });
  if (q.has('preuves')) ouvrirP(true);
})();
if (q.has('reglages')) $('#regl').scrollIntoView({ block: 'center' });
// Ce que la page affiche, pour la preuve du geste (jouer-v1b.mjs).
window.__releve = () => ({
  duel: st.A + ' contre ' + st.B, reglage: $('#regl-t').textContent, melange: $('#mix').getAttribute('aria-valuetext'),
  reponse: $('#reponse').innerText.trim(), verdict: $('#verdict').innerText.replace(/\s+/g, ' ').trim(), egal: $('#egal').innerText.replace(/\s+/g, ' ').trim(),
  barres: Object.fromEntries([...document.querySelectorAll('#sim .sb[data-f]')].map((b) => { const x = b.querySelector('.sb-b'); return [b.dataset.f, { valeur: (b.querySelector('.sb-v') || {}).innerText || '', hauteur: x ? Math.round(x.getBoundingClientRect().height) : 0 }]; })),
  ajout: ($('#ajout').innerText || '').replace(/\s+/g, ' ').trim(),
});
rendre();
