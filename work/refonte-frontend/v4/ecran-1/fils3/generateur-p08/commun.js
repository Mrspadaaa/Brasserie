/* Logique commune de p08 et p09 (lot 3, variantes de p3). Données : D (pack, un scénario),
   PAGE (vue de départ). Aucun chiffre du moteur n'est calculé ici : IBU d'une ligne = IBU du
   pack pour ce moment, mis à l'échelle de la dose (Tinseth est linéaire en masse) ; total =
   somme des lignes ; crans, deltas et fiches viennent tels quels du pack. */
const ACC = '#c2410c';
const NS = 'http://www.w3.org/2000/svg';
const $ = (s, r) => (r || document).querySelector(s);
const ORD = D.familles.map((f) => f.id);
const FAM = Object.fromEntries(D.familles.map((f, i) => [f.id, { ...f, i }]));
const virg = (n, d = 1) => String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',');
const ibuTxt = (v) => (v == null ? null : Math.abs(v) >= 1 || v === 0 ? String(Math.round(v)) : virg(v, 1));

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false && k !== '') e.append(k instanceof Node ? k : String(k));
  return e;
}
function sv(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* ---- Recette : types d'ajout et moments (liste canonique du pack) ---- */
const MOM = Object.fromEntries(D.moments.map((m, i) => [m.code, { ...m, i }]));
const TYPES = ['ébullition', 'whirlpool', 'à froid', 'premier moût'];
const PREMIER = { 'ébullition': 'b60', whirlpool: 'wp', 'à froid': 'dryActive', 'premier moût': 'fwh' };
const EBU = ['b60', 'b30', 'b15', 'b10', 'b5', 'b0'];
function nouvelleLigne(src, id) {
  return { id, nom: src.nom, cle: src.cle, moment: src.moment, g: src.g, g0: src.g, jour: src.jour || null, par: src.par, stock: src.stock, cite: src.cite || [], signaux: src.signaux || null, ajout: !!src.ajout, voie: src.voie ?? null };
}
const typeDe = (l) => MOM[l.moment].type;
function cycleType(l) {
  const t = TYPES[(TYPES.indexOf(typeDe(l)) + 1) % TYPES.length];
  l.moment = PREMIER[t]; l.jour = null;
}
function cycleQuand(l) {
  const t = typeDe(l);
  if (t === 'ébullition') l.moment = EBU[(EBU.indexOf(l.moment) + 1) % EBU.length];
  else if (t === 'à froid') { l.moment = l.moment === 'dryActive' ? 'dryPost' : 'dryActive'; l.jour = null; }
}
/* Texte du moment : le jour (J+3) puis le moment, séparés par un point dessiné en CSS. */
const quandEl = (l) => (l.jour && typeDe(l) === 'à froid' ? [l.jour, h('span', { class: 'sepq' }, MOM[l.moment].quand)] : MOM[l.moment].quand);
/* Recette chargée : on garde la place pour les ajouts (moins de détails autour). */
const compact = (lignes) => lignes.length >= 4;
/* Ce qui distingue chaque série d'un radar (sans calcul du moteur : on lit, on compare). */
function ceQuiDistingueBiere() {
  const n = (i) => FAM[ORD[i]].nom.toLowerCase();
  const hors = ORD.map((id, i) => i).filter((i) => D.profil[i].crans != null && D.profil[i].crans > D.cible[i].bande[1]);
  const ns = ORD.map((id, i) => i).filter((i) => D.profil[i].crans == null);
  return { hors: hors.map((i) => n(i) + ' au-dessus' + (D.profil[i].source === 'dégustation' ? ', dégusté ' + D.degustation : '')), ns: ns.map(n), att: ORD.map((id, i) => i).filter((i) => FAM[ORD[i]].attendue).map(n) };
}
function viseesTxt(visee) {
  return ORD.map((id, i) => [i, visee[id]]).filter(([, v]) => v != null).map(([i, v]) => {
    const p = D.profil[i].crans;
    return FAM[ORD[i]].nom.toLowerCase() + (p == null ? '' : v > p ? ' ↑' : v < p ? ' ↓' : ' =') + (v > D.cible[i].bande[1] ? ' hors style' : '');
  });
}
const deltasVoie = (v) => v.apres.map((a, i) => [FAM[ORD[i]].nom.toLowerCase(), a.delta]).filter(([, d]) => typeof d === 'number' && d !== 0).map(([n, d]) => n + ' ' + (d > 0 ? '+' : '−') + Math.abs(d));
function distingueHoublon(f, hs) {
  const autres = hs.filter((x) => x !== f);
  const seul = ORD.map((id, i) => i).filter((i) => f.niv[i].n > 0 && autres.every((x) => x.niv[i].n < f.niv[i].n)).map((i) => FAM[ORD[i]].nom.toLowerCase());
  const marque = ORD.map((id, i) => i).filter((i) => f.niv[i].n === 2).map((i) => FAM[ORD[i]].nom.toLowerCase());
  return { seul, marque };
}
const quandTxt = (l) => (l.jour && typeDe(l) === 'à froid' ? l.jour : MOM[l.moment].quand);
function ibuLigne(l) {
  const p = l.par && l.par[l.moment];
  return p ? p.ibu * l.g / l.g0 : null;
}
const parG = (l) => { const p = l.par && l.par[l.moment]; return p ? p.g : null; };
const totalIbu = (lignes) => lignes.reduce((s, l) => s + (ibuLigne(l) || 0), 0);
const masse = (lignes) => lignes.reduce((s, l) => s + l.g, 0);

/* ---- Houblons : origine (recette, stock, à racheter, à acheter) ---- */
function origine(nom, lignes) {
  if (lignes.some((l) => l.nom === nom)) return 'recette';
  if (nom in D.stockG) return D.stockG[nom] > 0 ? 'en stock' : 'à racheter';
  return 'à acheter';
}
const ficheDe = (nom) => D.fiches.find((f) => f.nom === nom) || null;

/* ---- Voies (objet 4) : liste du moteur ; un houblon exclu fait reprendre la liste
   recalculée du pack (voiesSansHoublon). ---- */
function cleSans(nom) {
  if (!D.sansHoublon) return null;
  if (D.sansHoublon[nom]) return nom;
  const k = Object.keys(D.sansHoublon).find((x) => nom.startsWith(x + ' ') || x.startsWith(nom));
  return k || null;
}
const utilise = (v, e) => (v.houblons || []).some((hb) => hb === e || hb.startsWith(e + ' ') || e.startsWith(hb + ' '));
function voiesPour(dir, exclus) {
  if (!D.voies) return [];
  let liste = D.voies.slice();
  for (const e of exclus) {
    const k = cleSans(e);
    const sans = k ? D.sansHoublon[k] : null;
    liste = liste.filter((v) => !(sans && sans.retirees.includes(v.rang)) && !utilise(v, e));
    if (sans) for (const n of sans.nouvelles) {
      const nom = n.label.split(' · ')[0].split(' ').slice(1).join(' ');
      if ([...exclus].some((x) => nom.includes(x))) continue;
      liste.splice(Math.min(n.rang - 1, liste.length), 0, { rang: 'n' + n.rang, label: n.label, nouvelle: true, verbe: n.label.split(' ')[0], houblons: [nom], floral: /^(Ajouter|Assembler)/.test(n.label), resine: /^(Remplacer|Diminuer|Retirer)/.test(n.label) });
    }
  }
  if (dir === 'levure') return liste.filter((v) => v.levier && !v.floral && !v.resine);
  return liste.filter((v) => (dir === 'floral' ? v.floral : v.resine));
}

/* ---- Radar commun : 12 axes dans l'ordre du style, échelle du pack (crans 0–4 ou
   citations 0–2). Le 0 est posé sur un petit anneau, jamais au centre ; « non situé »
   (vide) ne trace aucun sommet. ---- */
const TRAITS = [
  { c: '#111', w: 2.2, dash: null, m: 'rond' },
  { c: ACC, w: 2.2, dash: null, m: 'creux' },
  { c: '#5c5c5c', w: 1.6, dash: '5 3', m: 'carre' },
  { c: '#8a8a8a', w: 1.6, dash: '2 3', m: 'tri' },
];
function radar(svg, o) {
  svg.innerHTML = '';
  svg.setAttribute('data-radar', '');
  svg.setAttribute('data-objet', o.objet);
  const N = 12, R = o.R, R0 = R * 0.17, cx = o.cx, cy = o.cy;
  const rad = (v) => R0 + (v / o.max) * (R - R0);
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const P = (i, v) => [cx + Math.cos(ang(i)) * rad(v), cy + Math.sin(ang(i)) * rad(v)];
  const poly = (v) => Array.from({ length: N }, (_, i) => P(i, v).map((x) => x.toFixed(1)).join(',')).join(' ');
  const fond = sv('g', {}, svg);
  if (o.bande) {
    // Zone du style : de 0 au haut de la bande ; au-dessus : anneau extérieur en tirets.
    sv('polygon', { points: poly(o.max), fill: '#fff', stroke: '#bdbdbd', 'stroke-dasharray': '3 3' }, fond);
  }
  for (let v = 0; v <= o.max; v++) sv('polygon', { points: poly(v), fill: 'none', stroke: '#e3e3e3' }, fond);
  for (let i = 0; i < N; i++) {
    const a = P(i, 0), b = P(i, o.max);
    sv('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: o.noms[i].gras ? '#c4c4c4' : '#e3e3e3', 'stroke-width': o.noms[i].gras ? 1.6 : 1 }, fond);
  }
  // Noms des familles autour.
  o.noms.forEach((n, i) => {
    const a = ang(i), q = [cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14)];
    const t = sv('text', { x: q[0], y: q[1] + 4, 'font-size': o.fs || 12, 'text-anchor': Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end', fill: n.acc ? ACC : '#111', 'font-weight': n.gras ? 650 : 400 }, svg);
    t.textContent = n.nom;
    if (n.onclick) { t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0'); t.style.cursor = 'pointer'; t.addEventListener('click', n.onclick); }
  });
  if (o.repere) {
    const a = ang(5.5), rr = rad(o.max - 0.4);
    const t = sv('text', { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr + 4, 'font-size': o.fs || 12, fill: '#6e6e6e', 'text-anchor': 'middle' }, svg);
    t.textContent = o.repere;
  }
  const ordre = [...o.series.entries()].sort((a, b) => (b[1].zone ? 1 : 0) - (a[1].zone ? 1 : 0));
  for (const [k, s] of ordre) {
    const g = sv('g', { 'data-serie': s.nom, 'data-valeurs': s.valeurs.map((v) => (v == null ? '' : v)).join(',') }, svg);
    if (s.cache) { g.setAttribute('opacity', 0.08); }
    else if (o.isole && o.isole !== s.nom && !s.zone) g.setAttribute('opacity', 0.18);
    const tr = s.trait || TRAITS[k % TRAITS.length];
    if (s.zone) {
      // La série « cible » se dessine comme la zone du style.
      const pts = s.valeurs.map((v, i) => P(i, v == null ? 0 : v).map((x) => x.toFixed(1)).join(',')).join(' ');
      sv('polygon', { points: pts, fill: '#e9e9e9', stroke: '#8f8f8f', 'stroke-width': 1.2 }, g);
      continue;
    }
    if (s.losanges) {
      s.valeurs.forEach((v, i) => {
        if (v == null) return;
        const p = P(i, v);
        sv('path', { d: `M${p[0]},${p[1] - 7}L${p[0] + 7},${p[1]}L${p[0]},${p[1] + 7}L${p[0] - 7},${p[1]}Z`, fill: '#fff', stroke: v > (o.bande ? o.bande[1] : 99) ? ACC : '#111', 'stroke-width': 2 }, g);
      });
      continue;
    }
    const v = s.valeurs;
    if (v.every((x) => x != null) && s.rempli) sv('polygon', { points: v.map((x, i) => P(i, x).join(',')).join(' '), fill: tr.c, 'fill-opacity': 0.08, stroke: 'none' }, g);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      if (v[i] == null || v[j] == null) continue;
      const a = P(i, v[i]), b = P(j, v[j]);
      sv('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: tr.c, 'stroke-width': tr.w, 'stroke-dasharray': tr.dash, 'stroke-linecap': 'round' }, g);
    }
    v.forEach((x, i) => {
      if (x == null) {
        if (s.nonSitue) { const p = P(i, o.max * 0.5); sv('circle', { cx: p[0], cy: p[1], r: 5, fill: 'none', stroke: '#8a8a8a', 'stroke-dasharray': '2 2' }, g); }
        return;
      }
      const p = P(i, x), r = 4.2;
      const hors = o.bande && x > o.bande[1];
      const c = hors && k === 0 ? ACC : tr.c;
      if (tr.m === 'rond') sv('circle', { cx: p[0], cy: p[1], r, fill: s.creux && s.creux[i] ? '#fff' : c, stroke: c, 'stroke-width': 2 }, g);
      else if (tr.m === 'creux') sv('circle', { cx: p[0], cy: p[1], r, fill: '#fff', stroke: c, 'stroke-width': 2 }, g);
      else if (tr.m === 'carre') sv('rect', { x: p[0] - r + 0.5, y: p[1] - r + 0.5, width: 2 * r - 1, height: 2 * r - 1, fill: '#fff', stroke: c, 'stroke-width': 1.8 }, g);
      else sv('path', { d: `M${p[0]},${p[1] - r - 1}L${p[0] + r},${p[1] + r - 1}L${p[0] - r},${p[1] + r - 1}Z`, fill: '#fff', stroke: c, 'stroke-width': 1.8 }, g);
    });
  }
}
