// Lot 21 · runtime commun des ladders e1, e2, e3 (navigateur). Il lit DONNEES (embarqué par le
// générateur : houblons, comparatifs mesurés, moteur « pouvoir », profil simulé de profils-simules.json).
// Briques : pictos au <symbol> de la page, nombres en français, pastilles de réglage qui changent de
// valeur au toucher, piste logarithmique du « calculé » (bande jamais effacée), piste de l'« estimé »
// devant la zone de la 16D (jamais rognée : une borne au-delà sort par une flèche), feuille des preuves
// (plan 2), animation des reclassements (seulement après un geste).
const D = DONNEES;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const pic = (f, s = 14) => '<svg class="pi" width="' + s + '" height="' + s + '" data-famille="' + f + '" role="img" aria-label="' + D.NOM[f] + '"><use href="#p-' + f + '"/></svg>';
const ICO = (id) => D.ICO[id] || '';
function fr(x, d) {
  if (x == null || !Number.isFinite(x)) return '';
  const a = Math.abs(x);
  const k = d != null ? d : a >= 10 ? 0 : a >= 1 ? 1 : a >= 0.1 ? 2 : 3;
  let s = (Math.round(a * 10 ** k) / 10 ** k).toFixed(k);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  const [e, dec] = s.split('.');
  return (x < 0 ? '−' : '') + e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? ',' + dec : '');
}
const fx = (x) => (x == null ? '?' : '×' + fr(x));
const tx = (t) => (typeof t === 'string' && /^§\d+$/.test(t) ? D.SIM_TEXTES[t] || t : t);

// ---------- le profil simulé ----------
// a = [bas, centre, haut, crans, largeur, hautPartiel] ; d = après − avant (au centre).
function simP(a, d, f) {
  if (!a || !a.length || (a[1] === 0 && a[2] === 0)) return { inconnu: 'non simulé : ni fiche ni composé pour ce goût' };
  const E = D.ECHELLE[f];
  return { bas: a[0], centre: a[1], haut: a[2], crans: a[3], largeur: a[4], hp: !!a[5], delta: d, hors: a[3] === 4, dcr: Math.abs(d) < E.seuilEcart ? null : Math.round(d / E.cran) };
}
const crTxt = (n) => (n == null ? '≈ sans écart' : (n > 0 ? '+' : '−') + Math.abs(n) + ' cran' + (Math.abs(n) > 1 ? 's' : ''));
// Les drapeaux du simulé, en mots (les identifiants de grille[] et grillePaires[]).
const DRAP = {
  'hors-du-style': 'sort de la 16D', amertume: 'surtout de l’amertume', 'hop-creep': 'hop creep : risque', saturation: 'saturation : 4–8 g/L', 'saturation-partagee': 'saturation partagée',
  'geraniol-citronellol': 'géraniol → citronellol : hors du cas', 'biotransformation-geraniol': 'bio-transfo : géraniol → citronellol', 'biotransformation-thiols': 'bio-transfo : thiols des précurseurs',
  'duree-longue': 'au-delà de 3 j : rien de mesuré en plus', ordre: 'ordre : inconnu', synergie: 'synergie : inconnue', masquage: 'masquage : inconnu', 'biere-noire': 'bière noire : non documentée',
};

// ---------- les réglages : une pastille par grandeur, le toucher passe à la valeur suivante ----------
const REG = {
  dose: { vals: () => [1, 2, 4, 8], lab: (v) => fr(v) + ' g/L', aria: 'Dose' },
  moment: { vals: (E) => (E.part ? ['dryPost', 'dryActive'] : ['dryPost', 'dryActive', 'wp', 'b10', 'b60']), lab: (v) => D.MOMENTS[v], aria: 'Moment' },
  jours: { vals: () => [1, 2, 3, 5, 7], lab: (v) => v + ' j', aria: 'Jours de contact' },
  levure: { vals: (E) => (E.part ? ['fermentis-us05', 'lalbrew-pomona', 'lalbrew-verdant-ipa'] : ['fermentis-us05', 'lalbrew-pomona']), lab: (v) => D.LEVURES[v], aria: 'Levure' },
};
const icoReg = (k, v) => (k === 'dose' ? ICO('goutte') : k === 'jours' ? ICO('temps') : k === 'levure' ? ICO('levure') : /^dry/.test(v) ? ICO('cuve') : v === 'wp' ? ICO('whirl') : ICO('ebu'));
function chipReglage(k, E, fixe) {
  const R = REG[k], vals = R.vals(E), v = E[k], i = vals.indexOf(v);
  const off = fixe || (k === 'jours' && !/^dry/.test(E.moment));
  return '<button type="button" class="rg' + (off ? ' off' : '') + '" data-role="reglage" data-reglage="' + k + '"' + (off ? ' aria-disabled="true"' : '') + ' aria-label="' + R.aria + ' : ' + esc(fixe || R.lab(v)) + (off ? ', fixé' : '. Toucher pour la valeur suivante') + '">' + icoReg(k, v) + '<span>' + esc(fixe || R.lab(v)) + '</span>' + (off ? '' : '<span class="pts" aria-hidden="true">' + vals.map((x, j) => '<i' + (j === i ? ' class="on"' : '') + '></i>').join('') + '</span>') + '</button>';
}
function suivant(k, E) { const vals = REG[k].vals(E); const i = vals.indexOf(E[k]); E[k] = vals[(i + 1) % vals.length]; E.dernier = k + ':' + E[k]; }
function brillerReglage(k) { const b = $('[data-reglage="' + k + '"]'); if (b) { b.classList.remove('change'); void b.offsetWidth; b.classList.add('change'); } }
function norme(E) { // une paire n'existe qu'en dry hop, 2 + 2 g/L, 3 j ; un houblon seul : US-05 ou Pomona
  if (E.part && !/^dry/.test(E.moment)) E.moment = 'dryPost';
  if (!REG.levure.vals(E).includes(E.levure)) E.levure = 'fermentis-us05';
}

// ---------- « Pourquoi ? » en une phrase ----------
function pourquoi(E) {
  const p = (E.dernier && D.POURQUOI[E.dernier]) || D.POURQUOI.defaut;
  return '<p class="pq" data-role="pourquoi">' + ICO('pourquoi') + '<span>' + esc(p[0]) + (p[1] ? ' <span class="src">' + esc(p[1]) + '</span>' : '') + '</span></p>';
}
// La biotransformation se voit : géraniol → citronellol (Pomona) ou thiols des précurseurs (Verdant), en fermentation active.
function bioLigne(E) {
  if (E.levure === 'fermentis-us05' && E.moment !== 'dryActive') return '';
  const t = E.moment !== 'dryActive' ? 'hors du cas documenté après fermentation : rien de simulé' : E.levure === 'lalbrew-pomona' ? 'géraniol → citronellol, simulé à 50 % au centre (0–87 %) ; documenté pour Pomona, ampleur inconnue' : E.levure === 'lalbrew-verdant-ipa' ? 'thiols des précurseurs, simulés à 0,1 % (0,01–0,35 %), rendement sur houblon réel non mesuré' : 'US-05 : non publiée, rien de simulé';
  return '<p class="pq bio-l" data-role="biotransformation">' + pic('floral', 14) + ICO('fleche') + pic('citrus', 14) + '<span><b>Bio-transfo</b> : ' + esc(t) + '</span></p>';
}
function bioBadge(dr) {
  if (!dr) return '';
  const g = dr.includes('biotransformation-geraniol'), t = dr.includes('biotransformation-thiols');
  if (!g && !t) return '';
  return '<span class="bio" data-role="biotransformation" role="img" aria-label="Biotransformation simulée : ' + (g ? 'géraniol en citronellol' : '') + (g && t ? ' et ' : '') + (t ? 'thiols des précurseurs' : '') + '">' + (g ? pic('floral', 12) + ICO('fleche') + pic('citrus', 12) : pic('tropical', 12)) + '<span>bio-transfo</span></span>';
}

// ---------- la piste du « calculé » : rapport au seuil, en log, la bande jamais effacée ----------
// p = [min, max, central, auMoins] ; lo, hi : décades de la piste.
function laneLog(p, o = {}) {
  const lo = o.lo ?? -3, hi = o.hi ?? 4, W = hi - lo;
  const pos = (x) => ((Math.log10(x) - lo) / W) * 100;
  const cl = (v) => Math.max(0, Math.min(100, v));
  let h = '<div class="ll' + (o.cls ? ' ' + o.cls : '') + '" style="--c:' + (o.c || '#16161a') + '">';
  for (let d = lo; d <= hi; d++) h += '<i class="ll-t' + (d === 0 ? ' s1' : d === 1 ? ' s10' : '') + '" style="left:' + pos(10 ** d).toFixed(2) + '%"></i>';
  if (o.ticks) for (let d = lo; d <= hi; d++) if ((d < 0 && d % 2 === 0) || d === 0 || d === 1 || (d > 1 && d % 2 === 1)) h += '<span class="ll-tx' + (d === 1 ? ' x10' : d === 0 ? ' x1' : '') + '" style="left:' + pos(10 ** d).toFixed(2) + '%">' + (d === 0 ? 'seuil' : '×' + fr(10 ** d)) + '</span>';
  if (!p || (p[0] == null && p[1] == null)) return h + '<span class="ll-inc"><i class="hach"></i>' + esc(o.inconnu || 'inconnu') + '</span></div>';
  const a = p[0] == null ? 0 : cl(pos(p[0])), b = p[1] == null ? 100 : cl(pos(p[1]));
  const ratio = p[0] && p[1] ? p[1] / p[0] : null;
  h += '<i class="ll-b' + (p[0] == null ? ' ouvert-g' : '') + (p[1] == null ? ' ouvert-d' : '') + '" data-role="incertitude" data-nature="mesure" data-source="' + esc(o.source || 'moteur') + '" style="left:' + a.toFixed(2) + '%;width:' + Math.max(1.5, b - a).toFixed(2) + '%" role="img" aria-label="rapport au seuil de ' + (p[0] == null ? 'borne basse inconnue' : fx(p[0])) + ' à ' + (p[1] == null ? 'borne haute inconnue' : fx(p[1])) + (ratio ? ', une plage de ×' + fr(ratio) : '') + '"></i>';
  if (p[2] != null) h += '<i class="ll-c" style="left:' + cl(pos(p[2])).toFixed(2) + '%"></i>';
  if (o.bornes !== false) {
    const g = p[0] == null ? '?' : fx(p[0]), d = p[1] == null ? '?' : fx(p[1]);
    if (b - a < 30) h += '<span class="ll-g nb" style="left:' + Math.min(a, 62).toFixed(2) + '%">' + g + ' à ' + d + '</span>';
    else h += '<span class="ll-g nb" style="left:' + a.toFixed(2) + '%">' + g + '</span><span class="ll-d nb" style="left:' + b.toFixed(2) + '%">' + d + '</span>';
  }
  return h + '</div>';
}

// ---------- la piste de l'« estimé » : la zone de la 16D en pâle, l'orangé au-delà, rien de rogné ----------
// Au style, la piste couvre le domaine de la famille (0–45, ou 0–82,5 pour floral, herbacé, terreux) ;
// en absolu, 0–100. Une borne haute au-delà de la piste sort par une flèche : la plage n'est pas coupée.
function pisteEstime(p, f, o = {}) {
  if (!p || p.inconnu) return '<span class="pe inc' + (o.cls ? ' ' + o.cls : '') + '" role="img" aria-label="estimé inconnu : ' + esc(p ? p.inconnu : 'pas de donnée') + '"><i class="hach"></i></span>';
  const Ech = D.ECHELLE[f], z = Ech.bande[1], S = Ech.domaine[1];
  const s = (v) => Math.max(0, Math.min(100, (v / S) * 100)), a = (v) => Math.max(0, Math.min(100, v));
  const J = D.J[f];
  const xl = (k) => Math.max(k(z), k(p.bas)), xw = (k) => Math.max(0, k(p.haut) - xl(k));
  const st = '--b:' + J.base + ';--zf:' + J.fond + ';--zs:' + s(z) + '%;--za:' + a(z) + '%;--bs:' + s(p.bas) + '%;--ws:' + (s(p.haut) - s(p.bas)) + '%;--ba:' + a(p.bas) + '%;--wa:' + (a(p.haut) - a(p.bas)) + '%;--cs:' + s(p.centre) + '%;--ca:' + a(p.centre) + '%;--xls:' + xl(s) + '%;--xws:' + xw(s) + '%;--xla:' + xl(a) + '%;--xwa:' + xw(a) + '%';
  return '<span class="pe' + (p.hors ? ' hors' : '') + (o.cls ? ' ' + o.cls : '') + '" style="' + st + '" role="img" aria-label="estimé ' + fr(p.bas, 0) + ' à ' + fr(p.haut, 0) + (p.hp ? ' ou plus' : '') + ' points, repère ' + fr(p.centre, 0) + (p.hors ? ', au-dessus de la zone de la 16D' : ', dans la zone de la 16D') + '">'
    + '<i class="pe-z" data-role="zone"></i><i class="pe-b' + (p.hp ? ' hp' : '') + '"></i><i class="pe-x"></i><i class="pe-c"></i>' + (p.haut > S ? '<i class="pe-dep seul-style"></i>' : '') + (p.haut > 100 ? '<i class="pe-dep seul-absolu"></i>' : '') + '</span>';
}
const crHTML = (n) => (n == null ? '<span class="u">≈ sans écart</span>' : '<span class="nb">~' + (n > 0 ? '+' : '−') + Math.abs(n) + '</span><span class="u"> cran' + (Math.abs(n) > 1 ? 's' : '') + '</span>');
const valEstime = (p) => (!p || p.inconnu ? '<span class="ve inc">inconnu</span>' : '<b class="ve' + (p.hors ? ' xs' : '') + '" data-nature="simule" aria-label="estimé, simulé"><span class="seul-style">' + crHTML(p.dcr) + '</span><span class="seul-absolu"><span class="nb">~' + fr(p.centre, 0) + '</span><span class="u"> pts</span></span></b>');
const plageEstime = (p) => '~' + fr(p.bas, 0) + ' à ' + fr(p.haut, 0) + (p.hp ? '+' : '');

// ---------- rangs : deux options que la donnée ne départage pas partagent leur rang ----------
// Règle du dépôt (style-bands.json, track.overlapIndiscernable) : un recouvrement d'au moins la moitié
// de la plus étroite des deux plages = « ≈ ». list triée par repère ; bande(x) → [bas, haut].
function indiscernables(a, b) {
  if (!a || !b) return false;
  const o = Math.min(a[1], b[1]) - Math.max(a[0], b[0]), w = Math.min(a[1] - a[0], b[1] - b[0]);
  return w <= 0 ? o >= 0 : o >= 0.5 * w;
}
function rangs(list, bande) {
  const out = [];
  list.forEach((x, i) => {
    const b = bande(x);
    if (!b) { out.push({ rang: null, egal: false }); return; }
    const prev = i > 0 ? bande(list[i - 1]) : null;
    if (prev && out[i - 1].rang && indiscernables(prev, b)) { out.push({ rang: out[i - 1].rang, egal: true }); out[i - 1].egal = true; }
    else out.push({ rang: i + 1, egal: false });
  });
  return out;
}

// ---------- la feuille des preuves (plan 2) ----------
const PV = () => $('[data-role="preuves"]'), PVV = () => $('[data-role="preuves-voile"]');
function ouvrirPreuves(titre, corps) {
  const s = PV();
  s.innerHTML = '<div class="fi-poignee" aria-hidden="true"></div><div class="pr-t"><span>' + titre + '</span><button type="button" data-role="fermer-preuves" aria-label="Fermer les preuves">' + ICO('x') + '</button></div>' + corps;
  s.hidden = false; PVV().hidden = false; document.body.classList.add('pv-ouvert');
  s.scrollTop = 0;
  s.querySelector('[data-role="fermer-preuves"]').focus({ preventScroll: true });
}
function fermerPreuves() { const s = PV(); if (!s || s.hidden) return; s.hidden = true; PVV().hidden = true; document.body.classList.remove('pv-ouvert'); }
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-role="fermer-preuves"]') || e.target === PVV()) { fermerPreuves(); return; }
  const vf = e.target.closest('[data-voir-fiche]');
  if (vf) { const n = vf.dataset.voirFiche; fermerPreuves(); const src = document.querySelector('[data-houblon="' + CSS.escape(n) + '"]'); ouvrirFiche(n, { source: src, mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true }); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerPreuves(); });

// Les blocs de la feuille : mesuré (comparatifs, lots, panels), calculé (moteur), estimé (simulé), fiches.
const motC = (k) => ({ mesure: '<span class="mc mc-mesure">mesuré</span>', calcule: '<span class="mc mc-calcule">calculé</span>', estime: '<span class="mc mc-estime">estimé ~</span>', inconnu: '<span class="mc mc-inconnu"><i class="hach"></i>inconnu</span>', panel: '<span class="mc mc-calcule">panel</span>' }[k]);
const FAM_DE = { 'linalol': 'floral', 'géraniol': 'floral', 'nérol': 'floral', 'myrcène': 'resin', 'limonène': 'citrus', 'humulène': 'herbal', 'β-caryophyllène': 'spice', 'α-humulène': 'herbal' };
function blocMesure(nom) {
  const L = D.MESURES_HOP[nom] || [], M = D.MOTEUR[nom];
  let h = '<div class="pr-b"><h3>' + motC('mesure') + ' en bière, dans les études publiées</h3>';
  if (!L.length) h += '<p class="pr-l"><i class="hach"></i><span>Aucune mesure en bière de ' + esc(nom) + ' dans les ' + D.ETUDES.length + ' études lues.</span></p>';
  for (const e of L) {
    h += '<div class="pr-et"><p class="pr-src"><b>' + esc(e.etude) + '</b> · ' + esc(e.ref) + ' · niveau ' + esc(e.niveau) + ' · ' + esc(e.conditions) + '</p>';
    for (const m of e.mesures.slice(0, 8)) {
      const fam = m.famille || FAM_DE[m.quoi];
      h += '<p class="pr-l">' + (fam ? pic(fam, 14) : '') + '<span>' + esc(m.quoi) + (m.dose != null ? ' à ' + fr(m.dose) + ' g/L' : '') + '</span> <b class="nb" data-nature="mesure" data-source="' + esc(e.etude) + '">' + (typeof m.valeur === 'number' ? fr(m.valeur) + (m.ecart != null ? ' ± ' + fr(m.ecart) : '') : esc(m.valeur)) + '</b> <span class="src">' + esc(m.unite || '') + '</span>' + (m.av ? ' <span class="av">à vérifier</span>' : '') + (m.fig ? ' <span class="fig">lu sur une figure</span>' : '') + '</p>';
    }
    h += '</div>';
  }
  if (M && M.lots && M.lots.length) {
    const hu = M.huile.plage, vals = M.lots.map((l) => l.huile).filter((x) => x != null);
    if (vals.length) {
      const max = Math.max(4, ...vals, hu ? hu[1] : 0), pos = (v) => (v / max) * 100;
      h += '<p class="pr-src">Huile : un point par lot (certificats) ; la bande grise, la plage publiée de la variété.</p><div class="dots" role="img" aria-label="huile de ' + vals.length + ' lots : ' + vals.map((v) => fr(v)).join(', ') + ' mL/100 g">' + (hu ? '<i class="dots-b" style="left:' + pos(hu[0]) + '%;width:' + (pos(hu[1]) - pos(hu[0])) + '%"></i>' : '') + vals.map((v) => '<i class="dot" data-nature="mesure" data-source="certificat de lot" style="left:' + pos(v) + '%"></i>').join('') + '<span class="dots-0 nb">0</span><span class="dots-1 nb">' + fr(max) + ' mL/100 g</span></div>';
    }
  }
  if (M && M.panel && M.panel.length) for (const p of M.panel) h += '<p class="pr-l">' + motC('panel') + '<span>' + esc(p.texte) + ' <span class="src">' + esc(p.sources.join(', ')) + '</span></span></p>';
  return h + '</div>';
}
const plage = (p) => (!p ? '?' : p[0] == null ? '≤ ' + fr(p[1]) : p[1] == null ? '≥ ' + fr(p[0]) : p[0] === p[1] ? fr(p[0]) : fr(p[0]) + '–' + fr(p[1]));
function blocCalcule(nom, f, moment, dose) {
  const M = D.MOTEUR[nom], k = dose + '|' + moment;
  let h = '<div class="pr-b"><h3>' + motC('calcule') + ' ' + esc(nom) + ' : ' + pic(f, 14) + ' ' + esc(D.NOM[f]) + ', rapport au seuil</h3>';
  if (!M) return h + '<p class="pr-l"><i class="hach"></i><span>Inconnu : composés de ' + esc(nom) + ' non publiés dans composes-houblon.json.</span></p></div>';
  const dK = [2, 4, 8].includes(dose) ? dose : dose < 2 ? 2 : 4;
  const x = M.sig[dK + '|' + moment] && M.sig[dK + '|' + moment][f];
  const hu = M.huile;
  h += '<p class="pr-l"><span>huile</span> <b class="nb" data-nature="mesure" data-source="' + esc(hu.sources.join(', ')) + '">' + plage(hu.plage) + '</b> <span class="src">mL/100 g · ' + esc(hu.sources.join(', ')) + '</span></p>';
  if (!x || !x[0]) return h + '<p class="pr-l"><i class="hach"></i><span>Inconnu : ' + esc((x && x[3]) || 'pas de marqueur chiffré') + '.</span></p>' + laneLog(null, { ticks: true, inconnu: 'inconnu, pas zéro' }) + '</div>';
  const t = M.teneurs[x[1]];
  if (t) h += '<p class="pr-l">' + pic(f, 14) + '<span>' + esc(t.nom) + ' dans le houblon</span> <b class="nb" data-nature="mesure" data-source="' + esc(t.sources.join(', ')) + '">' + plage(t.plage) + '</b> <span class="src">' + esc(t.unite) + ' · ' + esc(t.sources.join(', ')) + '</span></p>';
  h += '<p class="pr-src">À ' + fr(dK) + ' g/L' + (dK !== dose ? ' (le moteur n’a que 2, 4, 8 g/L)' : '') + ', ' + esc(D.MOMENTS_LONG[moment]) + ' : ' + esc(t ? t.nom : x[1]) + ' ' + (x[0][0] == null ? 'borne basse inconnue' : fx(x[0][0])) + ' à ' + (x[0][1] == null ? 'borne haute inconnue' : fx(x[0][1])) + ' le seuil. Les seuils publiés varient de ×10 à ×80 selon la source : la bande le montre.</p>';
  h += laneLog(x[0], { ticks: true, c: D.J[f].base, source: 'moteur pouvoir aromatique' }) + '<p class="pr-src">Trait noir : le seuil. Trait orangé, ×10 : au-delà, le moteur lit « hors du style » (convention à valider).</p>';
  if (x[2]) h += '<p class="pr-src">Sur la base commune (Hopsteiner 2024, une méthode, 97 variétés) :</p>' + laneLog(x[2], { c: D.J[f].texte, source: 'H11' });
  return h + '</div>';
}
function blocEstime(p, f, ent, extra = '', qui = '') {
  let h = '<div class="pr-b" data-role="simulation"><h3>' + motC('estime') + (qui ? ' <b class="qui">' + esc(qui) + '</b>' : ' profil simulé') + ' : ' + pic(f, 14) + ' ' + esc(D.NOM[f]) + '</h3>';
  if (!p || p.inconnu) return h + '<p class="pr-l"><i class="hach"></i><span>Inconnu : ' + esc(p ? p.inconnu : 'pas de donnée') + ' (jamais zéro).</span></p></div>';
  const z = D.ECHELLE[f].bande[1];
  h += '<p class="pr-l"><b class="nb" data-nature="simule">' + plageEstime(p) + ' pts</b><span class="src">repère ~' + fr(p.centre, 0) + ' pts ; ' + crTxt(p.dcr) + ' depuis ma bière ; confiance ' + esc(ent ? ent.c : '?') + (p.largeur && p.largeur !== 'inconnu' ? ' ; largeur ×' + fr(p.largeur) : ' ; largeur inconnue (bas nul)') + '</span></p>';
  h += '<div class="pe-l">' + pisteEstime(p, f, { cls: 'large' }) + '</div><p class="pr-src">Zone de la 16D : 0–' + z + ' pts (BJCP 2021 : ' + (z === 55 ? 'attendue, faible et facultative' : 'non décrite') + ').' + (p.hp ? ' « + » : borne haute partielle, des composés n’ont pas de borne publiée ; le vrai haut peut être plus haut.' : '') + '</p>';
  if (ent && ent.dr) h += '<div class="pr-dr">' + ent.dr.filter((d) => DRAP[d]).map((d) => '<span class="drp' + (/inconnu/.test(DRAP[d]) ? ' inc' : '') + (d === 'hors-du-style' ? ' xs' : '') + '">' + esc(DRAP[d]) + '</span>').join('') + '</div>';
  if (extra) h += extra;
  h += '<p class="pr-src">Profil simulé (moteur « profil-simule ») : forme des fiches, force du moteur, nuances des composés ; le repère est une convention à valider, pas une mesure.</p>';
  return h + '</div>';
}
function blocFiches(nom) {
  const H = D.HOPS[nom];
  const l = (H.fiches || []).map(([f, n, of, lv]) => '<span class="pr-f">' + pic(f, 14) + '<span>' + esc(D.COURT[f]) + '</span> <span class="nb">' + n + '/' + of + '</span>' + (lv === 2 ? ' <span class="src">marqué</span>' : '') + '</span>').join('');
  return '<div class="pr-b"><h3>Ses fiches citent</h3><div class="pr-fs">' + (l || '<span class="src">aucune famille</span>') + '</div><button type="button" class="fi-b" data-voir-fiche="' + esc(nom) + '">Voir la fiche ' + ICO('chev') + '</button></div>';
}

// ---------- l'animation d'un reclassement (FLIP), seulement après un geste ----------
function flip(conteneur, rendre) {
  const avant = new Map($$('[data-k]', conteneur).map((e) => [e.dataset.k, e.getBoundingClientRect().top]));
  rendre();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const e of $$('[data-k]', conteneur)) {
    const t0 = avant.get(e.dataset.k); const t1 = e.getBoundingClientRect().top;
    if (t0 == null) { e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 }); continue; }
    if (Math.abs(t0 - t1) > 2) e.animate([{ transform: 'translateY(' + (t0 - t1) + 'px)' }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
}
