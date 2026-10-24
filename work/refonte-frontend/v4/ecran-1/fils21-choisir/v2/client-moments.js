// v2 · le script du chemin des moments (lu par generer.mjs et recopié dans la page, après les données).
const $ = (s) => document.querySelector(s);
const q = new URLSearchParams(location.search);
const ORD = P.familles;
const st = { dose: Number(q.get('dose')) || 4, m: q.get('m') || 'dryActive', min: Number(q.get('min')) || 60, ens: q.has('ens'), lev: q.get('lev') || 'us05', fam: q.get('fam') || 'citrus' };
const ATTENDU = ['floral', 'herbal', 'earthy'];
const f1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? '+' : '−') + String(Math.round(Math.abs(x) * 10) / 10).replace('.', ','));
const hn = (n) => '<span class="hn" data-houblon="' + esc(n) + '" data-couleur="' + COULEUR[n] + '">' + esc(n) + '</span>';
const pt = (n, forme) => '<i class="hpt ' + (forme || 'plein') + '" style="--hc:' + COULEUR[n] + '" aria-hidden="true"></i>';
const vm = (txt, ks) => '<span class="vm" data-nature="mesure" data-source="' + esc([].concat(ks || []).join(' ')) + '">' + txt + '</span>';
const vt = (txt, ks) => '<span class="vm txt" data-nature="mesure" data-source="' + esc([].concat(ks || []).join(' ')) + '">' + txt + '</span>';
const crans = (f, c) => (c - (P.avant[f] || 0)) / P.cran[f];
const unC = (x) => '<span class="vs" data-nature="simule">~' + f1(x) + ' cran' + (Math.abs(x) >= 1.95 ? 's' : '') + '</span>';
const sec = (m) => m === 'dryActive' || m === 'dryPost';
const LIB = Object.fromEntries(MOMENTS.map((x) => [x[0], x]));
const A_M = { b60: 'à 60′', b10: 'à 10′', wp: 'au whirlpool', dryActive: 'en dry hop actif', dryPost: 'en dry hop après' };

// ---------- l'amertume : Tinseth, comme le moteur (99,9 IBU pour Citra 4 g/L à 60′) ----------
const tinseth = (dose, a, t) => dose * 1000 * (a / 100) * 1.65 * Math.pow(0.000125, OG - 1) * (1 - Math.exp(-0.04 * t)) / 4.15;
function ibu(n, m) {
  const A = ALPHAS[n];
  if (m === 'b60') return { v: tinseth(st.dose, A.valeur, st.min), min: tinseth(st.dose, A.min, st.min), max: tinseth(st.dose, A.max, st.min) };
  if (m === 'b10') return { v: tinseth(st.dose, A.valeur, 10), min: tinseth(st.dose, A.min, 10), max: tinseth(st.dose, A.max, 10) };
  if (m === 'wp') { const r = IBU[n].wp; return { v: (r.v * st.dose) / 4, min: (r.min * st.dose) / 4, max: (r.max * st.dose) / 4 }; }
  return null;
}
function rangIBU() {
  const H = 64, px = (v) => Math.min(H, (v * H) / 200), top = BASE.bande[1];
  const cel = (m) => {
    const vs = ['Citra', 'Cascade'].map((n) => [n, ibu(n, m)]);
    if (!vs[0][1]) return '<button type="button" class="cel" data-m="' + m + '" data-role="reglage" aria-label="Amertume en dry hop : non calculée"><span class="ib"><i class="ib-z" data-role="zone" style="--zb:' + px(BASE.bande[0]) + 'px;--zh:' + (px(top) - px(BASE.bande[0])) + 'px"></i><i class="ib-b" style="--h:' + px(BASE.ibu) + 'px;--hb:' + px(BASE.ibu) + 'px;--hx:0px;--hc:#9a9aa6"><i class="base"></i></i></span><span class="inc" data-inconnu="IBU du dry hop non calculé (humulinones non reprises)" data-source="moteur">inconnu</span></button>';
    const bars = vs.map(([n, r], i) => { const tot = BASE.ibu + r.v; return '<i class="ib-b ' + (i ? 'contour' : '') + '" data-nature="mesure" data-source="calcul Tinseth (α ' + (n === 'Citra' ? 'des fiches' : 'du lot') + ')" style="--h:' + px(tot).toFixed(1) + 'px;--hb:' + px(BASE.ibu).toFixed(1) + 'px;--hx:' + Math.max(0, px(tot) - px(top)).toFixed(1) + 'px;--hc:' + COULEUR[n] + '" aria-label="' + n + ' : +' + Math.round(r.v) + ' IBU, ta bière ' + Math.round(tot) + ' IBU"><i class="base"></i><i class="x"></i></i>'; }).join('');
    const lab = vs.map(([n, r]) => '<span class="vm' + (BASE.ibu + r.v > top ? ' hst' : '') + '" data-nature="mesure" data-source="calcul Tinseth">+' + Math.round(r.v) + '</span>').join('');
    return '<button type="button" class="cel" data-m="' + m + '" data-role="reglage" aria-label="Amertume à ' + LIB[m][1] + '"><span class="ib"><i class="ib-z" data-role="zone" style="--zb:' + px(BASE.bande[0]) + 'px;--zh:' + (px(top) - px(BASE.bande[0])) + 'px"></i>' + bars + '</span><span class="ib-v">' + lab + '<span class="gris">IBU</span></span></button>';
  };
  return '<span class="mx-n"><span class="pis">' + ic('goutte', 14) + '</span><b>Amertume</b><small class="mono">IBU ajoutés</small></span>' + MOMENTS.map(([m]) => cel(m)).join('');
}

// ---------- le simulé : la grille (un houblon), les paires (Citra + Cascade) ----------
const prof = (n, m) => { const L = sec(m) ? LEVK[st.lev] : LEVK.us05; return GR.find((x) => x.n === n && x.m === m && x.d === st.dose && x.j === (sec(m) ? 3 : null) && x.l === L); };
function series(m) {
  if (st.ens && sec(m)) { const g = PA.find((x) => x.m === m && x.l === LEVK[st.lev]); return g ? [{ cle: 'seul', nom: 'Citra + Cascade', res: g.p, g }] : []; }
  const a = prof('Citra', m), b = prof('Cascade', m);
  return a && b ? [{ cle: 'a', nom: 'Citra', res: a.p, g: a }, { cle: 'b', nom: 'Cascade', res: b.p, g: b }] : [];
}
function reponse() {
  const a60 = GR.find((x) => x.n === 'Citra' && x.m === 'b60' && x.d === st.dose && x.l === LEVK.us05), a10 = GR.find((x) => x.n === 'Citra' && x.m === 'b10' && x.d === st.dose && x.l === LEVK.us05);
  const i60 = ibu('Citra', 'b60'), i10 = ibu('Citra', 'b10');
  $('#reponse').innerHTML = '<b>À ' + st.min + '′, l’arôme part, l’amertume reste</b> : Citra ' + st.dose + ' g/L ajoute ' + vm('~' + Math.round(i60.v) + ' IBU', 'calcul Tinseth') + (st.min === 60 && a60 ? ' et ' + unC(crans('citrus', a60.p.citrus[1])) + ' d’agrumes' : '') + '. À 10′ : ' + (a10 ? unC(crans('citrus', a10.p.citrus[1])) + ' d’agrumes' : '') + ' pour ' + vm(Math.round(i10.v) + ' IBU', 'calcul Tinseth') + '.';
}
function courbe() {
  const f = st.fam, maxY = 70, H = 120, y = (v) => Math.min(H, (v / maxY) * H);
  const cols = MOMENTS.map(([m], i) => {
    const S = ['Citra', 'Cascade'].map((n) => [n, prof(n, m)]);
    return '<span class="cb-c" style="left:' + i * 20 + '%">' + S.map(([n, g], k) => g ? '<i class="cb-r" style="--hc:' + COULEUR[n] + ';margin-left:' + (k ? 5 : -5) + 'px;bottom:' + y(g.p[f][0]) + 'px;height:' + Math.max(1, y(g.p[f][2]) - y(g.p[f][0])) + 'px"></i><i class="cb-p ' + (k ? 'contour' : '') + '" data-nature="simule" style="--hc:' + COULEUR[n] + ';left:calc(50% + ' + (k ? 5 : -5) + 'px);bottom:' + y(g.p[f][1]) + 'px" aria-label="' + n + ' à ' + LIB[m][1] + ' : ~' + fr(g.p[f][1]) + ' points"></i>' : '').join('') + '</span>';
  }).join('');
  return '<div class="sim-t">' + pic(f, 16) + esc(COURT_[f]) + ', le même ajout à chaque moment ' + '<span class="cf-mot cf-simule">' + ic('simul', 12) + '<span>simulé</span></span></div>'
    + '<div class="regl" role="group" aria-label="La famille">' + ['citrus', 'tropical', 'floral'].map((x) => '<button type="button" class="chip" data-fam="' + x + '" data-role="reglage" aria-pressed="' + (x === f) + '">' + pic(x, 14) + esc(COURT_[x]) + '</button>').join('') + '</div>'
    + '<div class="courbe" aria-label="' + esc(COURT_[f]) + ' simulé, de 60′ à après fermentation"><i class="cb-z" data-role="zone" style="--zh:' + y(P.bande[f][1]) + 'px"></i>' + cols + '</div>'
    + '<div class="cb-x">' + MOMENTS.map(([m, l]) => '<span>' + l + '</span>').join('') + '</div>'
    + '<p class="gris petit">Point : le centre simulé, sur 100 ; trait : du bas au haut ; ' + pt('Citra') + ' Citra, ' + pt('Cascade', 'contour') + ' Cascade ; pâle : la 16D (0–' + P.bande[f][1] + ').</p>';
}
function bio() {
  const L = LEVF[st.lev], act = st.m === 'dryActive';
  return '<div data-role="biotransformation"><b>' + ic('levure', 14) + ' Biotransformation · ' + esc(L.nom) + '</b>'
    + (act ? '<span>En fermentation active, la levure travaille le houblon. Le simulé compte, par convention : géraniol → citronellol 50 % pour Pomona, 0 % pour les autres ; 3MH libéré 0,1 % des précurseurs pour Verdant et Diamond (H41, H42).</span>' : '<span>Après fermentation, la levure est retombée : le simulé ne compte aucune biotransformation.</span>')
    + '<span><span class="gris">Esters (fiche) :</span> ' + vt(esc(L.esters), L.src) + '</span>'
    + '<span><span class="gris">Géraniol → citronellol :</span> ' + (L.gc ? vt('« ' + esc(L.gc) + ' » (fiche)', L.src) : '<span class="inc" data-inconnu="non publié" data-source="' + esc(L.src.join(' ')) + '">inconnu</span> non publié') + '</span>'
    + '<span><span class="gris">Thiols (β-lyase) :</span> ' + vt(esc(L.betaLyase), L.src) + '</span>'
    + (L.notes && L.notes.length ? '<span><span class="gris">Mesuré :</span> ' + vt(esc(L.notes.join(' ')), L.src) + '</span>' : '')
    + '<span><span class="gris">Rendement sur houblon réel :</span> <span class="inc" data-inconnu="rendement" data-source="H42">inconnu</span></span>'
    + (act ? '<span><span class="gris">Hop creep :</span> ' + vt(esc(BIO.creep.texte), BIO.creep.sources) + '</span>' : '') + '</div>';
}
function moment() {
  const m = st.m, [, lab, icn, long] = LIB[m], W = POURQUOI[m];
  const S = series(m);
  let simH;
  if (!S.length) simH = '<div class="trou">' + ic('inconnu', 14) + '<span><b>' + esc(LEVN[st.lev]) + ' : pas simulé ici.</b> Le moteur simule US-05 et Pomona pour un houblon seul, Verdant pour un ajout cumulé. ' + (st.lev === 'diamond' ? 'Diamond : « le plus de thiols mesurés, le fruité perçu le plus faible » (Samia 2026), écrit, pas simulé.' : '') + '</span></div>';
  else {
    const fams = ORD.filter((f) => S.some((s) => Math.abs(crans(f, s.res[f][1])) >= 0.25) || ATTENDU.includes(f));
    const leg = '<div class="sb-leg">' + (S[0].cle === 'seul' ? '<span>' + ic('plus2', 12) + hn('Citra') + ' + ' + hn('Cascade') + ', une barre</span>' : '<span>' + pt('Citra') + hn('Citra') + ' : pleine</span><span>' + pt('Cascade', 'contour') + hn('Cascade') + ' : en contour</span>') + '<span class="gris">chiffre : l’écart, en crans de la 16D</span></div>';
    let e;
    if (S[0].cle === 'seul') { const fs = S[0].g.fs || {}; e = '<b>Ensemble</b>, 2 + 2 g/L : la dose totale partage la saturation' + (fs.citrus != null ? ', <span class="vs" data-nature="simule">~' + Math.round(fs.citrus * 100) + ' %</span> de la somme des deux seuls en agrumes' : '') + '.'; }
    else { const d = fams.map((f) => [f, crans(f, S[0].res[f][1]) - crans(f, S[1].res[f][1])]).filter(([, x]) => Math.abs(x) >= 0.25).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3); e = '<b>Citra</b> plutôt que Cascade, ' + esc(A_M[m]) + ' : ' + (d.length ? d.map(([f, x]) => esc(COURT_[f].toLowerCase()) + ' ' + unC(x)).join(' · ') : '<span class="vs" data-nature="simule">~ moins d’un cran d’écart</span>') + '.'; }
    simH = leg + barres(fams, S, P, COURT_, pic).replace('--n:' + fams.length, '--n:' + (fams.length > 5 ? Math.ceil(fams.length / 2) : fams.length)) + '<p class="ecart">' + e + '</p>';
  }
  const reg = sec(m) ? '<div class="regl" role="group" aria-label="L’ajout"><button type="button" class="chip" data-ens="0" data-role="reglage" aria-pressed="' + !st.ens + '">chacun seul, ' + st.dose + ' g/L</button><button type="button" class="chip" data-ens="1" data-role="reglage" data-reglage="ajout-cumule" aria-pressed="' + st.ens + '">' + ic('plus2', 14) + 'Citra + Cascade, 2 + 2 g/L</button></div>'
    + '<div class="regl" role="group" aria-label="La levure">' + Object.keys(LEVK).map((k) => '<button type="button" class="chip" data-lev="' + k + '" data-role="reglage" data-reglage="levure" aria-pressed="' + (k === st.lev) + '">' + ic('levure', 14) + esc(LEVN[k].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', '')) + '</button>').join('') + '</div>' : '';
  const aj = st.ens && sec(m) ? '<div data-role="ajout">' + ic('plus2', 14) + hn('Citra') + ' <span class="mono">2 g/L</span> + ' + hn('Cascade') + ' <span class="mono">2 g/L</span>, même dry hop, 3 j · dose totale ' + vm('4 g/L', 'saisie') + ', zone de saturation ' + vm(BIO.sat.join('–') + ' g/L', BIO.satSrc) + ' (Cascade seulement) · synergie, masquage : <span class="inc" data-inconnu="synergie" data-source="H67 H72">inconnu</span></div>' : '';
  $('#moment-t').innerHTML = '<h2 class="mo-t">' + ic(icn, 18) + esc(long) + '</h2><p class="pourquoi"><b>Pourquoi ?</b> ' + esc(W.t) + '</p><div class="pq">' + W.d.map(([v, t]) => '<span>' + v + ' ' + t + '</span>').join('') + '</div>';
  $('#sim-t').innerHTML = 'Dans ta 16D, Citra et Cascade ' + esc(A_M[m]) + ' <span class="cf-mot cf-simule">' + ic('simul', 12) + '<span>simulé</span></span>';
  $('#reg-dry').hidden = !sec(m);
  document.querySelectorAll('[data-ens]').forEach((x) => x.setAttribute('aria-pressed', String((x.dataset.ens === '1') === st.ens)));
  document.querySelectorAll('[data-lev]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.lev === st.lev)));
  $('#moment-c').innerHTML = aj + simH + (sec(m) ? bio() : '') + courbe() + '<p class="src-l">~ ' + esc(SIMMENTION) + '</p>';
    + '<div class="sim" data-role="simulation"><div class="sim-t">Dans ta 16D, Citra et Cascade ' + esc(A_M[m]) + ' <span class="cf-mot cf-simule">' + ic('simul', 12) + '<span>simulé</span></span></div>' + reg + aj + simH + (sec(m) ? bio() : '') + courbe() + '<p class="src-l">~ ' + esc(SIMMENTION) + '</p></div>';
}
function rendre() {
  document.querySelectorAll('[data-dose]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.dose) === st.dose)));
  $('#ibu').innerHTML = rangIBU();
  document.querySelectorAll('.cel[data-m], .mh[data-m]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === st.m)));
  $('#min').textContent = st.min + '′';
  document.querySelector('.mx').classList.toggle('autre-min', st.min !== 60);
  const h = document.querySelector('.mh[data-m="b60"] span'); if (h) h.textContent = st.min + '′';
  $('#min-n').textContent = st.min === 60 ? 'arôme : mesuré à 60′ seulement' : 'arôme à ' + st.min + '′ : non mesuré (seul l’IBU suit)';
  reponse();
  moment();
}
document.addEventListener('click', (e) => {
  const d = e.target.closest('[data-dose]'); if (d) { st.dose = Number(d.dataset.dose); rendre(); return; }
  const m = e.target.closest('[data-m]'); if (m) { st.m = m.dataset.m; rendre(); return; }
  const mi = e.target.closest('[data-min]'); if (mi) { st.min = Math.max(15, Math.min(90, st.min + Number(mi.dataset.min))); rendre(); return; }
  const en = e.target.closest('[data-ens]'); if (en) { st.ens = en.dataset.ens === '1'; rendre(); return; }
  const lv = e.target.closest('[data-lev]'); if (lv) { st.lev = lv.dataset.lev; rendre(); return; }
  const fa = e.target.closest('[data-fam]'); if (fa) { st.fam = fa.dataset.fam; rendre(); return; }
});
rendre();
