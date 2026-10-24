// v3 · le script du calendrier (lu par generer.mjs et recopié dans la page, après les données).
const $ = (s) => document.querySelector(s);
const q = new URLSearchParams(location.search);
const ORD = P.familles;
const st = { sc: q.get('sc') || 'succ-Galaxy', mom: q.get('mom') || 'dryPost', lev: q.get('lev') || 'us05', jour: q.has('jour') ? Number(q.get('jour')) : 10, dose: Number(q.get('dose')) || 4 };
const ATTENDU = ['floral', 'herbal', 'earthy'];
const f1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? '+' : '−') + String(Math.round(Math.abs(x) * 10) / 10).replace('.', ','));
const hn = (n) => '<span class="hn" data-houblon="' + esc(n) + '" data-couleur="' + COULEUR[n] + '">' + esc(n) + '</span>';
const pt = (n, forme) => '<i class="hpt ' + (forme || 'plein') + '" style="--hc:' + COULEUR[n] + '" aria-hidden="true"></i>';
const vm = (txt, ks) => '<span class="vm" data-nature="mesure" data-source="' + esc([].concat(ks || []).join(' ')) + '">' + txt + '</span>';
const vt = (txt, ks) => '<span class="vm txt" data-nature="mesure" data-source="' + esc([].concat(ks || []).join(' ')) + '">' + txt + '</span>';
const vs = (txt) => '<span class="vs" data-nature="simule">' + txt + '</span>';
const crans = (f, c) => (c - (P.avant[f] || 0)) / P.cran[f];
const unC = (x) => vs('~' + f1(x) + ' cran' + (Math.abs(x) >= 1.95 ? 's' : ''));
const inc = (r, s) => '<span class="inc" data-inconnu="' + esc(r) + '" data-source="' + esc(s || 'H') + '">inconnu</span>';

// ---------- le cas du moteur pour le scénario, le moment et la levure ----------
function casGrille(n) {
  const L = LEVK[st.lev], g = (j) => GR.find((x) => x.n === n && x.m === st.mom && x.d === 4 && x.j === j && x.l === L);
  if (!g(3)) return null;
  const av = Object.fromEntries(ORD.map((f) => [f, [P.avant[f], P.avant[f], P.avant[f]]]));
  const jr0 = st.mom === 'dryActive' ? 2 : 7;
  const jours = Array.from({ length: 11 }, (_, i) => ({ j: i, jr: jr0 + i, p: i === 0 ? av : (g(Math.min(i, 3)) || g(3)).p }));
  return { id: 'grille', titre: n + ' 4 g/L, 3 j', aj: [{ n, d: 4, m: st.mom, j0: jr0, j: 3 }], p: g(3).p, jours, sat: { doseACru_gL: 4, facteur: null }, dr: g(3).dr, drT: {}, conf: { n: g(3).c, pq: [] }, bio: null, grille: true };
}
function casActuel() {
  const s = st.sc;
  if (s.startsWith('seul-')) return st.mom === 'dryPost' && st.lev === 'us05' ? CAS[s] : casGrille(s.slice(5));
  return CAS[s + '-' + st.mom + '-' + st.lev] || null;
}
const nomL = () => LEVN[st.lev];

// ---------- le calendrier ----------
function calendrier(c) {
  const N = c.jours.length - 1, jr0 = c.jours[0].jr, x = (t) => (t / N) * 100;
  const tete = '<div class="cal-j"><span></span><span class="cal-jt">' + c.jours.filter((d) => d.j % 2 === 0 || d.j === st.jour).map((d) => '<span class="' + (d.j === st.jour ? 'on' : '') + '" style="left:' + x(d.j) + '%">J' + d.jr + '</span>').join('') + '</span></div>';
  const lignes = c.aj.map((a, k) => {
    const t0 = a.j0 - jr0, t1 = t0 + a.j, utile = Math.min(a.j, 3);
    const reps = REP.map((r, ri) => '<i class="cal-r' + (ri === 1 ? ' bas' : '') + '" style="left:' + x(t0 + r.j) + '%">' + (k === 0 ? '<span data-nature="mesure" data-source="' + esc(r.src.join(' ')) + '">' + r.t + '</span>' : '') + '</i>').join('');
    return '<div class="cal-l"><span class="cal-n">' + hn(a.n) + '<span class="mono">' + fr(a.d) + ' g/L</span><span class="mono">' + a.j + ' j de contact</span></span><span class="cal-t" aria-label="' + esc(a.n) + ' du J' + a.j0 + ' au J' + (a.j0 + a.j) + '">'
      + '<i class="cal-b" style="left:' + x(t0) + '%;width:' + (x(t0 + utile) - x(t0)) + '%;--hc:' + COULEUR[a.n] + '"></i>'
      + (a.j > 3 ? '<i class="cal-h" style="left:' + x(t0 + 3) + '%;width:' + (x(t1) - x(t0 + 3)) + '%;--hc:' + COULEUR[a.n] + '" data-nature="mesure" data-source="H73" aria-label="jours ' + 4 + ' à ' + a.j + ' : rien de mesuré en plus"></i>' : '')
      + reps + '<i class="cal-cur" style="left:' + x(st.jour) + '%"></i></span></div>';
  }).join('');
  // Par jour : les deux familles qui bougent le plus, leur centre simulé jour après jour.
  const fin = c.jours[N].p, f2 = ORD.filter((f) => f !== 'resin').sort((a, b) => crans(b, fin[b][1]) - crans(a, fin[a][1])).slice(0, 2);
  const maxY = 70, y = (v) => Math.min(66, (v / maxY) * 66);
  const pj = '<div class="pj-s" data-role="simulation"><span class="pj-t">~ simulé, jour après jour</span><div class="pj" aria-label="Le centre simulé, jour après jour"><i class="pj-z" data-role="zone" style="--zh:' + y(P.bande[f2[0]][1]) + 'px"></i>' + c.jours.map((d) => f2.map((f, k) => '<i class="pj-p' + (k ? ' t' : '') + '" data-nature="simule" style="--b:' + P.tons[f].base + ';left:' + x(d.j) + '%;bottom:' + y(d.p[f][1]) + 'px" aria-label="' + COURT_[f] + ' J' + d.jr + ' : ~' + fr(d.p[f][1]) + '"></i>').join('')).join('') + '</div>'
    + '<div class="pj-k">' + f2.map((f, k) => '<span>' + pic(f, 14) + esc(COURT_[f]) + (k ? ' (carré)' : ' (rond)') + '</span>').join('') + '<span class="gris">~ centre simulé, sur 100</span></div></div>';
  const dr = (id) => c.dr.includes(id);
  const flags = [
    c.aj.some((a) => a.j > 3) ? '<span class="flag">' + ic('sablier', 14) + '<span><b>' + c.aj.filter((a) => a.j > 3).map((a) => esc(a.n) + ' ' + a.j + ' j').join(', ') + '</b> : ' + vt('au-delà de 3 j, pas d’arôme mesuré en plus ; végétal et hop creep', 'H73') + '</span></span>' : '',
    c.aj.length > 1 ? '<span class="flag">' + ic('inconnu', 14) + '<span>Ordre des ajouts, synergie, masquage : ' + inc('ordre, synergie, masquage', 'H H67 H72') + ' ; le moteur additionne.</span></span>' : '',
    dr('hop-creep') ? '<span class="flag">' + ic('levure', 14) + '<span>Hop creep si la levure est encore vivante : refermentation, atténuation, diacétyle (' + vt('+0,92 % vol. à 10 g/L, 7 j', 'H68') + ').</span></span>' : '',
  ].join('');
  return tete + lignes + pj + '<div class="cal-f">' + flags + '</div>';
}

// ---------- le profil du jour, l'ajout cumulé ----------
function profil(c) {
  const d = c.jours[Math.min(st.jour, c.jours.length - 1)];
  const fams = ORD.filter((f) => Math.abs(crans(f, d.p[f][1])) >= 0.25 || ATTENDU.includes(f));
  const S = [{ cle: 'seul', nom: c.titre, res: d.p }];
  const b = barres(fams, S, P, COURT_, pic).replace('--n:' + fams.length, '--n:' + (fams.length > 5 ? Math.ceil(fams.length / 2) : fams.length));
  const ens = st.sc.startsWith('ens-') ? '<div data-role="ajout">' + ic('plus2', 14) + c.aj.map((a) => hn(a.n) + ' <span class="mono">' + fr(a.d) + ' g/L</span>').join(' + ') + ', même dry hop, 3 j · dose totale ' + vm(fr(c.sat.doseACru_gL) + ' g/L', 'saisie') + (c.sat.facteur && c.sat.facteur.citrus != null ? ' · saturation partagée : l’ensemble vaut ' + vs('~' + Math.round(c.sat.facteur.citrus * 100) + ' %') + ' de la somme des deux seuls (agrumes)' : '') + '</div>' : '';
  const ap = c.apports && c.apports.length > 1 ? '<p class="gris petit">Ce que chacun apporte, tropical : ' + c.apports.map((a) => esc(a.n) + ' ' + vs('~' + fr(a.apport.tropical)) + ' (seul ' + vs('~' + fr(a.seul.tropical)) + ')').join(' · ') + ', points sur 100.</p>' : '';
  return '<div class="sim-t">Dans ta 16D, au J' + d.jr + ' <span class="cf-mot cf-simule">' + ic('simul', 12) + '<span>simulé</span></span><small class="gris">confiance ' + esc(c.conf.n) + '</small></div>' + ens
    + '<div class="sb-leg"><span class="gris">barre : ma bière au J' + d.jr + ' · pâle : la 16D · orangé : au-delà · chiffre : l’écart, en crans de la 16D</span></div>' + b + ap + '<p class="src-l">~ ' + esc(SIMMENTION) + '</p>';
}
function reponse(c) {
  if (!c) { $('#reponse').innerHTML = '<b>' + esc(nomL()) + '</b>, ' + (st.mom === 'dryActive' ? 'fermentation active' : 'après fermentation') + ' : ce scénario n’est pas simulé. ' + (st.lev === 'diamond' ? 'Diamond : « le plus de thiols mesurés, le fruité perçu le plus faible » (Samia 2026).' : 'Le moteur simule US-05 et Pomona, Verdant en ajout cumulé.'); return; }
  const N = c.jours.length - 1, fin = c.jours[N].p;
  const f = ORD.filter((x) => x !== 'resin').sort((a, b) => crans(b, fin[b][1]) - crans(a, fin[a][1]))[0];
  const v = c.jours.map((d) => d.p[f][1]), lo = v[0], hi = v[N];
  const k = v.findIndex((x) => x - lo >= 0.95 * (hi - lo));
  const longs = c.aj.filter((a) => a.j > 3);
  $('#reponse').innerHTML = '<b>Tout se joue dans les premiers jours de chaque ajout</b> : ' + esc(COURT_[f].toLowerCase()) + ' ' + vs('~' + fr(lo) + ' → ~' + fr(hi)) + ' sur 100, ' + vs('~95 % atteints au J' + c.jours[k].jr) + ' ; ensuite plus rien.' + (longs.length ? ' ' + longs.map((a) => esc(a.n) + ' ' + a.j + ' j').join(', ') + ' : les jours 4 à ' + longs[0].j + ' n’ajoutent rien de mesuré.' : '');
}

// ---------- la levure et la biotransformation ----------
function bio(c) {
  const L = LEVF[st.lev], act = st.mom === 'dryActive';
  const B = c && c.bio;
  let sim = '';
  if (B && B.actif) {
    const g = B.geraniolCitronellol, t = B.rendementThiolsPct;
    sim = '<span><span class="gris">Simulé, par convention :</span> géraniol → citronellol ' + vs('~' + Math.round(g.centre * 100) + ' %') + ' (haut ' + Math.round(g.haut * 100) + ' %) ; thiols libérés ' + vs('~' + fr(t.centre) + ' % des précurseurs') + ' (haut ' + fr(t.haut) + ' %)' + (B.parAjout || []).filter((p) => p.citronellol_ugL).map((p) => ' ; ' + esc(p.ajout) + ' : citronellol ' + vs('~' + fr(p.citronellol_ugL.centre) + ' µg/L')).join('') + '.</span>';
  }
  return '<div data-role="biotransformation"><b>' + ic('levure', 14) + ' Biotransformation · ' + esc(L.nom) + ' · ' + (act ? 'fermentation active' : 'après fermentation') + '</b>'
    + (act ? '' : '<span>Après fermentation, la levure est retombée : le simulé ne compte aucune biotransformation ; la levure n’y change rien.</span>')
    + '<span><span class="gris">Esters (fiche) :</span> ' + vt(esc(L.esters), L.src) + '</span>'
    + '<span><span class="gris">Géraniol → citronellol :</span> ' + (L.gc ? vt('« ' + esc(L.gc) + ' » (fiche)', L.src) : inc('non publié', L.src.join(' ')) + ' non publié') + '</span>'
    + '<span><span class="gris">Thiols (β-lyase) :</span> ' + vt(esc(L.betaLyase), L.src) + '</span>'
    + (L.notes && L.notes.length ? '<span><span class="gris">Mesuré :</span> ' + vt(esc(L.notes.join(' ')), L.src) + '</span>' : '')
    + sim + '<span><span class="gris">Rendement sur houblon réel :</span> ' + inc('rendement', 'H42') + '</span></div>';
}

// ---------- la dose : le panel de Lafontaine 2018, la part extraite, le simulé ----------
function dose(c) {
  const nd = DOSES.length, H = 110, y = (v) => (v / 15) * H;
  const i4 = DOSES.indexOf(3.86), i8 = DOSES.indexOf(8);
  const z = '<i class="dz-z" style="left:calc(' + (i4 / nd) * 100 + '% + 2px);width:calc(' + ((i8 - i4 + 1) / nd) * 100 + '% - 4px)"></i>';
  const tons = [['#16161a', 'g'], ['#5b5b66', ''], ['#5b5b66', 'o']];
  const cols = DOSES.map((d, i) => '<span class="dz-c">' + SER.map((s, k) => s.v[i] == null ? '' : '<i class="dz-b ' + tons[k][1] + '" data-nature="mesure" data-source="E04" style="--b:' + tons[k][0] + ';height:' + y(s.v[i]).toFixed(1) + 'px" aria-label="' + esc(s.nomJ) + ' à ' + fr(d) + ' g/L : ' + fr(s.v[i]) + ' sur 15"></i>').join('') + '</span>').join('');
  const tot = c ? c.sat.doseACru_gL : 4;
  const xs = '<div class="dz-x" style="--nd:' + nd + '">' + DOSES.map((d) => '<span class="' + (Math.abs(d - tot) < 0.3 ? 'on' : '') + '">' + fr(d) + '</span>').join('') + '</div>';
  const vals = '';
  const nomS = (s, k) => (s.famille == null ? 'intensité globale (OHAI)' : k === 1 ? 'la série qui monte' : 'la série qui plafonne');
  const key = '<div class="dz-k">' + SER.map((s, k) => '<span><i class="' + tons[k][1] + '" style="--b:' + tons[k][0] + '"></i>' + esc(nomS(s, k)) + (s.famille ? ' : « ' + esc(s.nomJ) + ' » selon J <b class="averif">à vérifier</b>' : '') + ' : ' + s.v.map((v) => (v == null ? '?' : vm(fr(v), 'E04'))).join(' → ') + ' sur 15</span>').join('') + '</div>';
  const ex = EXTR.length ? '<p class="petit">Part extraite de l’huile, mesurée : ' + [...new Set(EXTR.map((e) => e.c))].map((nm) => esc(nm) + ' ' + EXTR.filter((e) => e.c === nm).map((e) => vm(fr(e.v) + ' %', 'E04') + ' à ' + fr(e.d) + ' g/L').join(' → ')).join(' ; ') + '. Chaque gramme de plus rend moins.</p>' : '';
  // Le simulé, à la dose choisie, pour le premier houblon du scénario.
  const n = c ? c.aj[0].n : 'Citra', L = LEVK[st.lev];
  const g = (dd) => GR.find((x) => x.n === n && x.m === st.mom && x.d === dd && x.j === 3 && x.l === L);
  const sim = '<div class="sim" data-role="simulation"><div class="sim-t">' + hn(n) + ' seul, à la dose choisie <span class="cf-mot cf-simule">' + ic('simul', 12) + '<span>simulé</span></span></div><div class="regl" role="group" aria-label="La dose">' + [1, 2, 4, 8].map((dd) => '<button type="button" class="chip" data-dose="' + dd + '" data-role="reglage" aria-pressed="' + (dd === st.dose) + '">' + dd + ' g/L</button>').join('') + '</div>'
    + (g(st.dose) ? '<p class="ecart">' + ['citrus', 'tropical', 'herbal'].map((f) => '<span class="fx">' + pic(f, 14) + esc(COURT_[f]) + ' ' + unC(crans(f, g(st.dose).p[f][1])) + '</span>').join(' · ') + (st.dose > 1 && g(st.dose / 2) ? ' ; le double de ' + fr(st.dose / 2) + ' g/L : agrumes ' + unC(crans('citrus', g(st.dose).p.citrus[1]) - crans('citrus', g(st.dose / 2).p.citrus[1])) + ' de plus seulement.' : '.') + '</p>' : '<p class="gris petit">' + esc(nomL()) + ' : pas simulé pour un houblon seul.</p>') + '</div>';
  return '<div class="dz" style="--nd:' + nd + '">' + z + cols + '</div>' + xs + vals + key + '<p class="petit">' + vt(esc(NOTE_E04), 'E04 H22') + ' <b class="averif">à vérifier</b></p>' + ex + '<p class="gris petit">Pointillés : la zone 4–8 g/L. Gras : ta dose totale à cru (' + fr(tot) + ' g/L).</p>' + sim;
}

// ---------- les trois seuls (moteur, rapport au seuil) ----------
function k2() {
  const L = [['thiols', ['tropical', 'berries'], 'Tropical, cassis', '4MMP'], ['linalol', ['floral', 'citrus'], 'Floral, agrumes', 'linalol'], ['myrcene', ['resin', 'green'], 'Résineux, vert', 'myrcène']];
  const formes = ['plein', 'contour', 'plein'];
  return '<div class="sb-leg">' + ['Citra', 'Galaxy', 'Idaho 7'].map((n) => '<span>' + pt(n) + hn(n) + '</span>').join('') + '<span class="gris">pâle : la 16D jusqu’à ×10 (règle du moteur) · tirets : le seuil</span></div>' + axeLog([0.01, 1, 10, 100, 1000])
    + L.map(([k, fams, nom, tag]) => '<div class="mo-l"><span class="lab"><b>' + pics(fams, 14) + esc(nom) + '</b><small>' + esc(tag) + '</small></span>' + piste({ bandes: ['Citra', 'Galaxy', 'Idaho 7'].map((n, i) => { const r = RAP[n][k]; return r ? { min: r.min, max: r.max, c: r.c, couleur: COULEUR[n], forme: formes[i], src: 'moteur « pouvoir aromatique » (' + n + ' 4 g/L, après, 3 j)', label: n + ' : ' + facteur(r.min) + ' à ' + facteur(r.max) } : null; }).filter(Boolean) }) + '</div>').join('')
    + '<p class="src-l">' + vt('Rapport au seuil, pas une intensité perçue. Galaxy : 4MMP sans borne haute publiée ; Idaho 7 : sans borne basse.', 'H11') + '</p>';
}
const pics = (fs, z) => '<span class="pis">' + fs.map((f) => pic(f, z || 16)).join('') + '</span>';

function rendre() {
  const c = casActuel();
  document.querySelectorAll('[data-sc]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sc === st.sc)));
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mom === st.mom)));
  document.querySelectorAll('[data-lev]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lev === st.lev)));
  const noms = c ? c.aj.map((a) => a.n) : [];
  document.querySelectorAll('.hv').forEach((v) => v.classList.toggle('actif', noms.includes(v.dataset.voie)));
  reponse(c);
  if (c) {
    $('#cal').innerHTML = calendrier(c);
    $('#jour').max = c.jours.length - 1; if (st.jour > c.jours.length - 1) st.jour = c.jours.length - 1; $('#jour').value = st.jour;
    $('#jour-v').textContent = 'J' + c.jours[st.jour].jr;
    $('#sim').innerHTML = profil(c);
  } else {
    $('#cal').innerHTML = '<div class="trou">' + ic('inconnu', 14) + '<span><b>Pas simulé :</b> ' + esc(nomL()) + ', ' + (st.mom === 'dryActive' ? 'fermentation active' : 'après fermentation') + ', pour ce scénario. Change de levure ou de moment.</span></div>';
    $('#sim').innerHTML = ''; $('#jour-v').textContent = '';
  }
  $('#bio').innerHTML = bio(c);
  $('#dose').innerHTML = dose(c);
  $('#k2').innerHTML = k2();
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-sc]'); if (s) { st.sc = s.dataset.sc; rendre(); return; }
  const m = e.target.closest('[data-mom]'); if (m) { st.mom = m.dataset.mom; rendre(); return; }
  const l = e.target.closest('[data-lev]'); if (l) { st.lev = l.dataset.lev; rendre(); return; }
  const d = e.target.closest('[data-dose]'); if (d) { st.dose = Number(d.dataset.dose); rendre(); return; }
});
$('#jour').addEventListener('input', (e) => { st.jour = Number(e.target.value); rendre(); });
rendre();
