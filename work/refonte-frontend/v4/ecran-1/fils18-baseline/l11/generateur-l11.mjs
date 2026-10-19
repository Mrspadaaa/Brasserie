// Lot 18 · l11 · En plus : q2b pour le brasseur expert. Génère l11/etat-b.html et l11/planche.html depuis
// fils15-s5-complexe/donnees/c1.json (via ../l10/commun-l10-l11.mjs). Usage : node generateur-l11.mjs
// En plus (et pourquoi, dans NOTE.md), tout lu dans c1 ou les fiches : la fiche technique de la recette
// (style, IBU dans sa bande, levure) ; dans chaque réponse, ma bière, l'après de la meilleure voie et la
// visée en chiffres sur une mini-piste ; l'IBU de chaque voie (chiffre et jauge dans la bande du style) ;
// les crans exacts au bout des barres et en barres continues dans les cases ; « hors du style » chiffré ;
// les raisons d'un « estimé » ; la biotransformation détaillée, signal par signal, avec ses sources ;
// les trois combinaisons du moteur (ensemble) ; l'IBU de toutes les voies en un graphe ; les pistes hors
// houblon avec leur niveau de preuve ; les notes du moteur. La fiche ajoute β et huiles par source.
import {
  C, D18, BASE, TEXTE, FOND, OBJ, OB, NOM, COURT, ORDRE, V, MEMES, GESTES, slotsDe, nomVoie, momentDe, MOMENT, pill, usage, STOCK,
  couloirs, fonds, VIS, caseFam, reponses, MOT, BIO, bioPictos, IBU, HORS, FICHES, voieDe, stockDe, roue, reglette, replis, actions, motsHTML,
  picto, ic, jc, SYMBOLES, noteAlpha, fr, sg, p, recente, plageF, nbF, ROLE_MOT, mots, esc, page, ecrire, LENTILLE_JS, ATTENDUES, DEG, cran,
} from '../l10/commun-l10-l11.mjs';

const OUT = D18 + '/l11';
const AJOUTEES = [1, 15];
const MONO = 'ui-monospace, "Cascadia Mono", "SF Mono", Consolas, monospace';
// L'écart exact au bout de la barre, en crans du style (tout[].crans).
const lab = (c) => (Math.abs(c) < 0.05 ? '0' : sg(c));
let nRepli = 0;
const nid = (s) => s + '-' + ++nRepli;

// ---------- chrome : les onglets, la lentille, la vue en icônes ----------
const tete = `
  <div class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('i-chev-l')}</a>
    <div class="seg" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg vue" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true" aria-label="Barres">${jc('j-barres')}</button><button role="radio" aria-checked="false" aria-label="Radar">${jc('j-radar')}</button></div>
  </div>
  <div class="spec" role="img" aria-label="Ma recette : style 16D, IBU ${fr(IBU.biere)} dans la bande ${IBU.bande.join('–')}, levure ${C.levure.name}, Nugget ${C.ajouts[0].grammes} g à 60′">
    <span class="sp code">${C.style}</span>
    <span class="sp">IBU<b>${fr(IBU.biere)}</b>${jaugeIbu(IBU.biere, { W: 40, sans: true })}</span>
    <span class="sp">${jc('j-levure')}<b>${C.levure.name.replace(/^SafAle\s+/, '').replace(/\s*\(.*$/, '')}</b></span>
  </div>`;

// La jauge d'IBU dans la bande du style (L4) : bande 50–70, ma bière en trait, la voie en point.
function jaugeIbu(v, o = {}) {
  const W = o.W || 40, lo = IBU.bande[0] - 5, hi = IBU.bande[1] + 5, x = (u) => Math.round((2 + (Math.max(lo, Math.min(hi, u)) - lo) / (hi - lo) * (W - 4)) * 10) / 10;
  return `<svg class="jib" width="${W}" height="12" viewBox="0 0 ${W} 12" aria-hidden="true"><rect x="${x(IBU.bande[0])}" y="4" width="${x(IBU.bande[1]) - x(IBU.bande[0])}" height="4" rx="2" fill="#dcdcd4"/><rect x="${x(IBU.biere) - 0.75}" y="1" width="1.5" height="10" fill="#16161a"/>${o.sans ? '' : `<circle cx="${x(v)}" cy="6" r="3" fill="${v > IBU.bande[1] || v < IBU.bande[0] ? '#c2410c' : '#16161a'}" stroke="#fff" stroke-width="1"/>`}</svg>`;
}

// ---------- les réponses, chiffrées : ma bière, l'après de la meilleure voie, la visée ----------
const R = reponses();
// La mini-piste d'une réponse (L1) : la bande du style (cadre), la plage de ma bière (trait gris),
// ma bière (trait d'encre), l'après de la meilleure voie (barre de la famille), la visée (tirets,
// son chiffre au-dessus) ; sous la piste, ma bière → après. Résineux : ma dégustation hachurée.
function miniPiste(f) {
  const r = R[f], W = 100, H = 36;
  const max = f === 'resin' ? 100 : Math.max(r.bande[1], r.plage.max, r.apres, r.visee);
  const x = (u) => Math.round((2 + Math.max(0, Math.min(max, u)) / max * (W - 4)) * 10) / 10;
  const cx = (u, w) => Math.max(w / 2, Math.min(W - w / 2, x(u)));
  const hid = 'mp-' + f, y0 = 14;
  let s = `<svg class="mp" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><pattern id="${hid}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#9a9aa4" stroke-width="1.2"/></pattern></defs>`;
  s += `<rect x="${x(0)}" y="${y0}" width="${x(r.bande[1]) - x(0)}" height="8" rx="2" fill="#fff" stroke="#a9a9a0" stroke-width="1"/>`;
  if (f === 'resin') {
    s += `<rect x="${x(r.deg.min)}" y="${y0 - 2}" width="${x(r.deg.max) - x(r.deg.min)}" height="12" rx="2" fill="url(#${hid})" stroke="#16161a" stroke-width="1.5"/>`;
    s += `<line x1="${x(r.visee)}" y1="${y0 - 3}" x2="${x(r.visee)}" y2="${y0 + 11}" stroke="#16161a" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    s += `<text x="${cx(r.visee, 16)}" y="10" font-size="12" text-anchor="middle" fill="#16161a" font-weight="700">${fr(r.visee)}</text><text x="${W}" y="35" font-size="12" text-anchor="end" fill="#16161a">${r.deg.min}–${r.deg.max}</text>`;
  } else {
    s += `<rect x="${x(r.plage.min)}" y="${y0 + 3}" width="${x(r.plage.max) - x(r.plage.min)}" height="2" fill="#8a8a94"/>`;
    s += `<rect x="${x(r.avant)}" y="${y0}" width="${Math.max(2, x(r.apres) - x(r.avant))}" height="8" rx="2" fill="${BASE[f]}"/>`;
    s += `<rect x="${x(r.avant) - 1}" y="${y0 - 3}" width="2" height="14" fill="#16161a"/>`;
    s += `<line x1="${x(r.visee)}" y1="${y0 - 3}" x2="${x(r.visee)}" y2="${y0 + 11}" stroke="#16161a" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    s += `<text x="${cx(r.visee, 26)}" y="10" font-size="12" text-anchor="middle" fill="#16161a" font-weight="700">${fr(r.visee)}</text><text x="0" y="35" font-size="12" fill="#16161a">${fr(r.avant)}→${fr(r.apres)}</text>`;
  }
  return s + '</svg>';
}
const rep = (f, titre, extra = '') => {
  const r = R[f], nom = nomVoie(r.X.v).nom;
  const lbl = f === 'resin' ? `Moins résineux : ma dégustation ${r.deg.min}–${r.deg.max}, visée ${fr(r.visee)} ; la meilleure voie houblon, ${nom} (${fr(r.X.v.effet.resin.central)}), ne l'y ramène pas`
    : `${titre} : ma bière ${fr(r.avant)} (plage ${fr(r.plage.min)}–${fr(r.plage.max)}), après ${nom} ${fr(r.apres)}, visée ${fr(r.visee)} : ${MOT[r.verdict].toLowerCase()}`;
  return `<section class="tuile" data-role="objectif" data-famille="${f}" aria-label="${lbl}" style="--t:${TEXTE[f]};--fd:${FOND[f]}">
      <span class="nom">${picto(f, 14)}${titre}</span>
      <div class="rep" data-role="reponse" data-famille="${f}" data-verdict="${r.verdict}">${MOT[r.verdict]}</div>
      ${miniPiste(f)}${extra}
    </section>`;
};
const reps = `
  <div class="reps">
    ${rep('resin', 'Moins résineux', `<button class="hh-b" onclick="var b=document.querySelector('[aria-controls=hh-c]');if(b.getAttribute('aria-expanded')!=='true')b.click();document.getElementById('hh').scrollIntoView({behavior:'smooth'})">Hors houblon${ic('i-chev-r')}</button>`)}
    ${rep('floral', 'Plus floral')}
    ${rep('citrus', 'Plus agrumes')}
  </div>`;

// ---------- la ligne d'une voie : usage, nom, stock, IBU chiffré et jaugé, « + » ; puis les cases ----------
// Une case : le picto, puis l'intensité en barre continue (0 à 4 crans, un trait de graduation par cran).
const barreCrans = (c, hs) => `<span class="bc${c < 0 ? ' bas' : ''}${hs ? ' xs' : ''}"><i style="--w:${Math.round(Math.min(4, Math.abs(c)) / 4 * 100)}%"></i></span>`;
const caseX = (X, f, obj, vide) => caseFam(X, f, obj, { corps: (c, hs) => barreCrans(c, hs), vide });
const casesVoie = (X, slots) => `<span class="cases"><span class="objs">${OBJ.map((f) => caseX(X, f, true)).join('')}</span><span class="exs">${slots.map((f) => caseX(X, f, false)).join('')}</span></span>`;
const ajc = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}">${ic(on ? 'i-check' : 'i-plus')}</button>`; };
const noms = (v) => (v.levureVers ? `<b class="nm">${v.levureVers}</b>` : v.actions.map((a) => `<b class="nm" data-houblon="${a.houblon}">${a.houblon}</b>`).join('<span class="et">+</span>'));
const stockM = (v) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK[v.stock][0]}">${jc(STOCK[v.stock][1])}</span>`);
const ibuV = (X) => `<span class="ib" role="img" aria-label="IBU de la recette avec cette voie : ${fr(X.v.ibu.after)} (${sg(X.v.ibu.drift)}), style ${IBU.bande.join('–')}">${jaugeIbu(X.v.ibu.after)}<b>${fr(X.v.ibu.after)}</b></span>`;
function horsStyle(X) {
  // L'après du moteur (tout[].apres) ; sans présence établie avant, l'après est l'apport (horsStyle[].why).
  const hs = X.v.tout.filter((t) => X.hs.has(t.famille)).map((t) => ({ ...t, val: t.apres != null ? t.apres : (t.avant || 0) + t.effet }));
  if (!hs.length) return '';
  return `<div class="xs-l" role="note" aria-label="Hors du style : ${hs.map((t) => NOM[t.famille] + ' ' + fr(t.val) + ' pour une bande de 0 à ' + t.bande[1]).join(', ')}">${jc('j-alerte')}<span class="xs-t">hors du style</span>${hs.map((t) => `<span class="xs-f" data-famille="${t.famille}">${picto(t.famille, 14)}<b>${fr(t.val)}</b><i>/${t.bande[1]}</i></span>`).join('')}</div>`;
}
function estime(X) {
  if (!X.v.estime || !(X.v.estimePourquoi || []).length) return '';
  const id = nid('est');
  return `<span class="est-w"><button class="est" data-repli aria-expanded="false" aria-controls="${id}">${jc('j-approx')}estimé${ic('i-chev-b', 16, 'chev')}</button><span class="est-c" id="${id}" hidden>${X.v.estimePourquoi.map(esc).join(' ')}</span></span>`;
}
// La biotransformation détaillée : un signal par ligne, son effet en pictos, son statut, ses sources à un toucher.
function bioDetail(X) {
  if (!(X.v.bio || []).length) return '';
  const pf = (f) => picto(f, 14, `data-famille="${f}"`);
  const fig = { 'geraniol-citronellol': `${pf('floral')}${ic('j-fleche', 12, 'fl')}${pf('citrus')}`, thiols: `${pf('tropical')}${pf('berries')}`, 'hop-creep': jc('j-cuve-a') };
  const id = nid('bio');
  return `<div class="bio" data-role="bio" aria-label="Biotransformation possible en dry hop actif, ampleur non quantifiée">
      ${BIO.map((s) => `<div class="bio-l"><span class="bio-f">${fig[s.id] || ''}</span><b>${esc(s.titre.split(' : ')[0])}</b><span class="st">${s.statut}</span><span class="nsrc">${s.sources.length} src</span></div>`).join('')}
      <button class="bio-b" data-repli aria-expanded="false" aria-controls="${id}">Pourquoi et sources${ic('i-chev-b', 16, 'chev')}</button>
      <ul class="bio-c" id="${id}" hidden>${BIO.map((s) => `<li><b>${esc(s.titre)}</b> ${esc(s.pourquoi)}<br><span class="src">${s.sources.map(esc).join(' ; ')}</span></li>`).join('')}</ul>
    </div>`;
}
function ligne(X, slots, cls = '') {
  const { q } = nomVoie(X.v);
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g</span>' : q ? `<span class="q">${q}</span>` : '';
  const carte = X.v.levureVers ? '' : ' data-role="ligne-houblon"';
  const levure = X.v.levureVers ? `<span class="q">${esc(C.levure.name.replace(/^SafAle\s+/, '').replace(/\s*\(.*$/, ''))} →</span>` : '';
  return `<div class="vr${cls}" data-voie="${X.n}"${carte}>
        <div class="l1"><span class="vg">${levure}${noms(X.v)}${(X.v.fiches || []).map((h) => usage(h)).join('')}${dose}${stockM(X.v)}</span>${X.v.levureVers ? '' : ibuV(X)}${ajc(X)}</div>
        ${casesVoie(X, slots)}
        ${horsStyle(X)}${estime(X)}${bioDetail(X)}
      </div>`;
}

// ---------- les groupes (q2b), têtes en bandeau d'encre, IBU du groupe en plage ----------
const ibuPlage = (xs) => { const a = xs.map((X) => X.v.ibu.after); const lo = Math.min(...a), hi = Math.max(...a); return lo === hi ? fr(lo) : fr(lo) + '–' + fr(hi); };
const blocMeme = (g) => {
  const slots = slotsDe(g.voies);
  const sig = (X) => X.extras.map((t) => t.famille).join();
  const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
  return `<div class="gh" aria-label="${g.voies.length} voies au même effet sur tes objectifs, ${g.voies[0].v.actions[0].grammes} g à ${MOMENT[momentDe(g.voies[0].v)][0]}, IBU ${ibuPlage(g.voies)}">${jc('j-egal')}<b>×${g.voies.length}</b><span>${g.voies[0].v.actions[0].grammes} g</span>${pill(momentDe(g.voies[0].v))}<span class="gi">IBU<b>${ibuPlage(g.voies)}</b></span></div>
    <div class="rangee">${couloirs(g.voies[0], { lab: true, labResin: true, labFn: lab })}</div>
    <div class="tab">${ord.map((X, i) => ligne(X, slots, i && sig(ord[i - 1]) !== sig(X) ? ' coupe-l' : '')).join('')}</div>`;
};
const AVANT = (X) => (X.v.actions[0].avant != null ? X.v.actions[0].avant : null);
const blocGeste = (g) => {
  const slots = slotsDe(g.voies);
  const t = g.mo === 'b60' ? `${g.t}<b class="ghn">${AVANT(g.voies[0])} g</b>` : g.t;
  return `<div class="gh">${g.ic ? jc(g.ic) : ''}<span class="ght">${t}</span>${pill(g.mo)}<span class="gi">IBU<b>${ibuPlage(g.voies)}</b></span></div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X, slots)}<div class="rangee in">${couloirs(X, { lab: true, labResin: true, labFn: lab })}</div></div>`).join('')}`;
};

const tetes = `
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce v gauche-v">${ic('i-chev-l', 16)}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i>${[1, 2, 3].map((k) => `<i class="tk sty-only" style="--s:${p(k / 3 * 100)}"></i>`).join('')}<span class="puce v sty-only" style="--s:${p(VIS.flS)}">visée</span>
        <span class="puce pv abs-only" style="--a:${p(VIS.flA)}">${picto('floral', 14)}</span><span class="puce pv abs-only" style="--a:${p(VIS.ciA)}">${picto('citrus', 14)}</span></div>
    </div>`;

// ---------- en plus, sous la liste : les combinaisons, l'IBU de toutes les voies, hors houblon, notes ----------
function combos() {
  const vise = (f) => OB[f].visee;
  const mb = (t, f) => {
    if (!t) return `<span class="cb-f" data-famille="${f}">${picto(f, 14)}<i class="cb-na">non établi</i></span>`;
    const max = Math.max(t.bande[1], t.apres || 0, vise(f) || 0) * 1.05, W = 70;
    const x = (u) => Math.round((Math.max(0, Math.min(max, u)) / max) * W * 10) / 10;
    const hors = t.apres != null && t.apres > t.bande[1];
    return `<span class="cb-f" data-famille="${f}" aria-label="${NOM[f]} ${t.apres != null ? fr(t.apres) : sg(t.effet)}, style 0–${t.bande[1]}${hors ? ', hors du style' : ''}">${picto(f, 14)}<svg width="${W}" height="10" viewBox="0 0 ${W} 10" aria-hidden="true"><rect x="0" y="3" width="${x(t.bande[1])}" height="4" rx="2" fill="#dcdcd4"/><rect x="0" y="1" width="${Math.max(2, x(t.apres != null ? t.apres : t.effet))}" height="8" rx="2" fill="${hors ? '#c2410c' : BASE[f]}"/><line x1="${x(vise(f))}" y1="0" x2="${x(vise(f))}" y2="10" stroke="#16161a" stroke-width="1.5" stroke-dasharray="2 2"/></svg><b class="${hors ? 'xs-n' : ''}">${t.apres != null ? fr(t.apres) : sg(t.effet)}</b></span>`;
  };
  return `<section class="bloc" aria-label="Combiner deux voies">
    <h3>${jc('j-egal')}Combiner</h3>
    ${C.ensemble.map((e) => `<div class="cb">
      <div class="cb-t"><span class="nv">${e.voies[0]}</span><span class="cb-n">${nomVoie(V[e.voies[0] - 1].v).nom} ${MOMENT[momentDe(V[e.voies[0] - 1].v)][0]}</span><span class="et">+</span><span class="nv">${e.voies[1]}</span><span class="cb-n">${nomVoie(V[e.voies[1] - 1].v).nom} ${MOMENT[momentDe(V[e.voies[1] - 1].v)][0]}</span><span class="ib">${jaugeIbu(e.ibu)}<b>${fr(e.ibu)}</b></span></div>
      <div class="cb-l">${['floral', 'citrus'].map((f) => mb(e.tout.find((t) => t.famille === f), f)).join('')}</div>
    </div>`).join('')}
  </section>`;
}
function graphIbu() {
  // Un point par voie, empilés quand ils se touchent ; plein : déjà dans Comparer.
  const W = 340, H = 104, lo = 45, hi = 75, x = (u) => 10 + (u - lo) / (hi - lo) * (W - 20), base = 70, pas = 8.5;
  const pts = V.map((X) => ({ n: X.n, v: X.v.ibu.after })).sort((a, b) => a.v - b.v);
  const piles = []; const pos = pts.map((q) => { const xx = x(q.v); let pl = piles.find((p0) => Math.abs(p0.x - xx) < 9); if (!pl) { pl = { x: xx, n: 0 }; piles.push(pl); } pl.n++; return { ...q, cx: pl.x, y: base - (pl.n - 1) * pas }; });
  let s = `<svg class="gib" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="IBU de la recette après chaque voie : de ${fr(pts[0].v)} à ${fr(pts[pts.length - 1].v)} ; ma bière ${fr(IBU.biere)} ; style ${IBU.bande.join('–')}">`;
  s += `<rect x="${x(IBU.bande[0])}" y="${base + 7}" width="${x(IBU.bande[1]) - x(IBU.bande[0])}" height="6" rx="2" fill="#dcdcd4"/>`;
  s += `<line x1="${x(IBU.biere)}" y1="6" x2="${x(IBU.biere)}" y2="${base + 14}" stroke="#16161a" stroke-width="2"/>`;
  for (const q of pos) s += `<circle cx="${Math.round(q.cx * 10) / 10}" cy="${q.y}" r="4" fill="${AJOUTEES.includes(q.n) ? '#16161a' : '#fff'}" stroke="#16161a" stroke-width="1.5"/>`;
  for (const t of [IBU.bande[0], 60, IBU.bande[1]]) s += `<text x="${x(t)}" y="${base + 30}" font-size="12" text-anchor="middle" fill="#55555f">${t}</text>`;
  s += `<text x="${x(IBU.biere) - 6}" y="14" font-size="12" text-anchor="end" fill="#16161a" font-weight="700">${fr(IBU.biere)}</text>`;
  return s + '</svg>';
}
const blocIbu = `<section class="bloc" aria-label="IBU après chaque voie">
    <h3>${jc('j-goutte')}IBU après chaque voie<span class="pg">${fr(Math.min(...V.map((X) => X.v.ibu.after)))}–${fr(Math.max(...V.map((X) => X.v.ibu.after)))} · style ${IBU.bande.join('–')}</span></h3>
    ${graphIbu()}
  </section>`;
const blocHors = `<section class="bloc" id="hh" aria-label="Hors houblon, résineux">
    <button class="pli-b" data-repli aria-expanded="false" aria-controls="hh-c">${picto('resin', 14)}Hors houblon · résineux<span class="pg">${HORS.length} pistes</span>${ic('i-chev-b', 16, 'chev')}</button>
    <ul id="hh-c" hidden>${HORS.map((x) => `<li><b>${esc(x.titre)}</b><span class="pv-t${/hypoth/.test(x.preuve) ? ' hyp' : ''}">${esc(x.preuve)}</span><span class="act">${esc(x.action)}</span></li>`).join('')}</ul>
  </section>
  <section class="bloc notes" aria-label="Notes du moteur">${C.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</section>`;

// ---------- la fiche, en plus : α, β et huiles par source ; les mots des fiches visibles ----------
function plages(F) {
  const rang = (nom, arr, unite, max) => {
    if (!arr.length) return '';
    const W = 48, x = (u) => Math.round((2 + Math.min(1, u / max) * (W - 4)) * 10) / 10, s0 = recente(arr);
    const lo = Math.min(...arr.map((s) => s.min)), hi = Math.max(...arr.map((s) => s.max));
    const bars = arr.map((s, i) => `<rect x="${x(s.min)}" y="${2 + i * 5}" width="${Math.max(3, x(s.max) - x(s.min))}" height="4" rx="2" fill="${s === s0 ? '#16161a' : '#9a9aa4'}"/>`).join('');
    return `<div class="f-pl" aria-label="${nom} ${plageF({ min: lo, max: hi })} ${unite}, ${arr.map((s) => s.src + (s.an ? ' ' + s.an : '') + ' ' + plageF(s)).join(' ; ')}"><span class="f-pn">${nom}</span><svg width="${W}" height="${4 + arr.length * 5}" viewBox="0 0 ${W} ${4 + arr.length * 5}" aria-hidden="true"><rect x="2" y="0" width="${W - 4}" height="${4 + arr.length * 5}" rx="2" fill="#f1f1ec"/>${bars}</svg><b>${plageF({ min: lo, max: hi })}</b><span class="f-u">${unite}</span></div>`;
  };
  return `<div class="f-pls">${rang('β', F.beta, '%', 15)}${rang('huile', F.huiles, 'mL', 4)}</div>`;
}
function fiche(F) {
  const a = recente(F.alpha), role = F.role ? ROLE_MOT[F.role.v] || F.role.v : null, regle = F.role && /^règle/.test(F.role.src);
  const st = stockDe(F.nom);
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const decrites = ORDRE.filter((f) => par[f] && par[f].n > 0);
  const cas = (f, n, sep) => `<i class="c${n >= 2 ? ' m' : n === 1 ? ' ci' : ''}${sep ? ' sep' : ''}" data-famille="${f}" style="--b:${BASE[f]};--fd:${FOND[f]}"></i>`;
  let budget = 30; // mots des fiches visibles, au plus (≤ 100 mots dans la fiche, D25)
  const lignes = decrites.map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of, prem = x.n === 1 && x.premier.length ? 'nommé en premier' : '';
    let w = mots(x); const tout = w.join(', ');
    const nb = (s) => s.split(/\s+/).length;
    const garde = []; for (const m of w) { if (budget - nb(m) < 0) break; budget -= nb(m); garde.push(m); }
    const coupe = garde.length < w.length;
    return `<div class="f-lab" data-explique="${f}"${coupe ? ` title="${esc(tout)}"` : ''}>${cas(f, x.n)}<span class="f-lt"><b>${COURT[f]}</b>${cpt ? `<span class="f-n">${cpt}</span>` : ''}${prem ? `<span class="f-pr">${prem}</span>` : ''}</span><span class="f-m">${esc(garde.join(', '))}${coupe ? ' …' : ''}</span></div>`;
  }).join('');
  const sans = F.sansFamille || [];
  const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : 'non renseigné';
  const html = `<section class="f-fiche" data-role="fiche" data-fiche="${esc(F.nom)}" role="dialog" aria-label="Fiche de ${esc(F.nom)}" tabindex="-1" hidden>
    <div class="f-poignee" aria-hidden="true"></div>
    <header class="f-tete"><h2>${esc(F.nom)}</h2>${F.origine ? `<span class="f-or">${esc(F.origine)}</span>` : ''}${st ? `<span class="stk" role="img" aria-label="${STOCK[st][0]}">${jc(STOCK[st][1])}</span>` : ''}<button class="f-fermer" data-role="fermer-fiche" aria-label="Fermer la fiche de ${esc(F.nom)}">${ic('i-x')}</button></header>
    <div class="f-ab">
      <span class="f-alpha" data-role="fiche-alpha" aria-label="Acides alpha ${txt}${a ? ' (' + a.src + (a.an ? ' ' + a.an : '') + ')' : ''}${F.lot != null ? ', mon lot ' + nbF(F.lot) + ' %' : ''}"><i>α</i><b>${txt}</b>${F.lot != null ? `<span class="f-lot">lot ${nbF(F.lot)} %</span>` : ''}</span>
      ${a ? reglette(F, { W: 70 }) : ''}
      ${role ? `<span class="f-role${regle ? ' regle' : ''}" aria-label="Rôle : ${role}${regle ? ', déduit de l\'α, à valider' : ', attesté par le fournisseur'}">${role}${regle ? '<i>α</i>' : ''}</span>` : ''}
    </div>
    ${plages(F)}
    ${noteAlpha(F) ? `<p class="f-note">${noteAlpha(F)}</p>` : ''}
    <div class="f-labels" data-role="fiche-labels">
      <div class="f-bande" role="img" aria-label="Les familles citées par les fiches de ${esc(F.nom)}">${ORDRE.map((f, i) => cas(f, par[f] ? par[f].n : 0, i === ATTENDUES.length)).join('')}<span class="f-seule">${of === 1 ? '1 seule fiche' : of + ' fiches'}</span></div>
      ${lignes}
      ${sans.length ? `<p class="f-sans">sans famille : ${esc(sans.slice(0, 4).map((s) => s.mot).join(', '))}${sans.length > 4 ? ' …' : ''}</p>` : ''}
    </div>
    <div class="f-arome" data-role="fiche-arome">${roue(F, { W: 350, H: 226, R: 70, fond: '#f1f1ec', anneau: '#d4d4cc' })}</div>
    ${actions(F)}
    ${replis(F)}
  </section>`;
  const n = motsHTML(html);
  console.log('  fiche ' + F.nom + ' : ~' + n + ' mots');
  return html;
}
const fiches = `<div id="fiches"><div class="f-voile" hidden></div>${Object.values(FICHES).map(fiche).join('')}</div>`;

const CSS = `
  :root { --encre: #16161a; --gris: #55555f; --gris2: #66666f; --trait: #d4d4cc; --papier: #fafaf6; --piste: #ececea; --acc: #c2410c; --gut: 22px; --mono: ${MONO}; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: var(--papier); }
  /* Le papier millimétré du carnet de labo : un quadrillage de 8 px sur la page. */
  body { background: var(--papier); background-image: linear-gradient(rgba(22,22,26,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(22,22,26,.045) 1px, transparent 1px); background-size: 8px 8px; color: var(--encre); font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  b, .q, .num { font-variant-numeric: tabular-nums; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 16px 84px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 6px; height: 34px; }
  .retour { width: 26px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); margin-left: -6px; flex: none; }
  .seg { display: flex; background: #fff; border-radius: 4px; padding: 2px; box-shadow: inset 0 0 0 1px var(--trait); flex: 1; }
  .seg button { flex: 1; height: 26px; border-radius: 2px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; }
  .seg button[aria-checked="true"] { background: var(--encre); color: #fff; font-weight: 650; }
  .outils { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .outils .seg { flex: none; }
  .outils .lentille button { padding: 0 10px; }
  .outils .vue button { width: 34px; }
  .spec { display: flex; align-items: stretch; height: 26px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); border-radius: 2px; }
  .sp { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 0 6px; font-size: 12px; color: var(--gris); white-space: nowrap; }
  .sp.code { flex: none; padding: 0 10px; background: var(--encre); color: #fff !important; border-radius: 2px 0 0 2px; }
  .sp + .sp { box-shadow: -1px 0 0 var(--trait); }
  .sp .q { color: var(--gris); }
  .sp b { font: 700 12px/1 var(--mono); color: var(--encre); }
  .sp.code { font: 700 12px/1 var(--mono); color: var(--encre); }

  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .tuile { border-radius: 4px; padding: 7px 6px 6px; display: flex; flex-direction: column; gap: 3px; background: var(--fd); box-shadow: inset 0 0 0 1px rgba(22,22,26,.12); position: relative; }
  .tuile .nom { display: flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; color: var(--t); white-space: nowrap; }
  .rep { font-size: 18px; font-weight: 800; line-height: 1.05; letter-spacing: -.01em; color: var(--encre); }
  .mp { margin-top: 1px; }
  .mp text { font-family: var(--mono); }
  .hh-b { margin-top: 2px; height: 24px; padding: 0 5px 0 7px; border-radius: 12px; background: #fff; font-size: 12px; font-weight: 700; color: var(--t); display: inline-flex; align-items: center; gap: 1px; box-shadow: inset 0 0 0 1px var(--t); align-self: flex-start; white-space: nowrap; }
  .hh-b svg { margin: 0 -3px 0 -2px; }

  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; }
  .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9.5px; width: 3px; border-radius: 2px; background: var(--encre); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--encre); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(270deg, rgba(47,107,95,.2), rgba(47,107,95,.03)); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; display: flex; height: 32px; }
  .tetes .m { flex: 1; position: relative; }
  .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; height: 1.5px; background: var(--encre); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4.25px solid transparent; }
  .g-ax::before { left: -4px; border-right: 6px solid var(--encre); border-left: 0; }
  .d-ax::after { right: -4px; border-left: 6px solid var(--encre); border-right: 0; }
  .tk { position: absolute; top: 0; width: 1.5px; height: 9px; background: var(--encre); left: var(--s); }
  .puce { position: absolute; top: 12px; font-size: 12px; font-weight: 700; padding: 0 6px; height: 18px; border-radius: 9px; white-space: nowrap; background: var(--encre); color: #fff; display: inline-flex; align-items: center; gap: 1px; }
  .puce svg { margin: 0 -2px 0 -3px; }
  .puce.gauche-v { left: 4px; padding-left: 2px; }
  .fl .puce.v { left: calc(var(--s) - 20px); }
  .fl .puce.pv { left: calc(var(--a) - 11px); padding: 0 3px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .abs-only { display: none !important; }
  body.abs .abs-only { display: inline-flex !important; }
  body.abs .sty-only { display: none !important; }

  /* Les têtes de groupe : un bandeau d'encre, comme l'en-tête d'un tableau. */
  .gh { position: relative; z-index: 3; display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 4px 0 7px; border-radius: 2px; background: var(--encre); color: #fff; font-size: 13px; font-weight: 700; align-self: stretch; }
  .gh .mo { background: #fff; color: var(--encre); box-shadow: none; }
  .ght { white-space: nowrap; }
  .ghn { font: 700 13px/1 var(--mono); margin-left: 5px; }
  .gi { margin-left: auto; display: inline-flex; align-items: baseline; gap: 4px; font-size: 12px; font-weight: 500; color: #d9d9e0; }
  .gi + .gi { margin-left: 4px; }
  .gi b { font: 700 13px/1 var(--mono); color: #fff; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px 0 5px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px #b9b9b0; font-size: 12px; font-weight: 700; white-space: nowrap; color: var(--encre); }
  .bars { position: relative; display: flex; height: 32px; }
  .bars .m { position: relative; flex: 1; }
  .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 10px; }
  .ln.a { top: 0; } .ln.b { top: 16px; }
  .zt { position: absolute; bottom: -4px; height: 2.5px; width: var(--s); background: rgba(22,22,26,.18); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2.5px; height: 8px; border-radius: 1px; background: var(--c); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; }
  .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; border-radius: 0 4px 4px 0; } .re .bar { right: 0; border-radius: 4px 0 0 4px; }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  .re .hs { left: auto; right: var(--s0); border-radius: 4px 0 0 4px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -3px; left: min(calc(var(--s) + 4px), calc(100% - 38px)); font: 700 12px/16px var(--mono); white-space: nowrap; background: var(--papier); padding: 0 3px; z-index: 3; box-shadow: 0 0 0 1px var(--papier); }
  .lab-i.g { left: auto; right: min(calc(var(--s) + 4px), calc(100% - 38px)); }
  body.abs .lab-i { left: min(calc(var(--a) + 4px), calc(100% - 38px)); } body.abs .lab-i.g { left: auto; right: min(calc(var(--a) + 4px), calc(100% - 38px)); }

  /* Le tableau des voies : des cellules blanches à filets, les chiffres en chasse fixe. */
  .tab { position: relative; z-index: 3; margin: 0 0 10px; border-radius: 2px; background: #fff; box-shadow: 0 0 0 1px var(--trait); }
  .tab.seul { margin: 0 0 2px; background: none; box-shadow: none; z-index: auto; }
  .tab.seul > .vr { background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; position: relative; z-index: 3; }
  .tab.seul .rangee.in { padding: 8px 0 10px; }
  .vr { padding: 5px 6px 5px 7px; }
  .vr + .vr { border-top: 1px solid var(--trait); }
  .vr.coupe-l { border-top: 1.5px solid #a9a9a0; }
  .vr.f-source { box-shadow: inset 3px 0 0 var(--encre); }
  .l1 { display: flex; align-items: center; gap: 6px; min-height: 26px; }
  .vg { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 1px 5px; }
  .nm { font-size: 14px; font-weight: 700; line-height: 1.15; }
  .nm.appui, .nm.survol { background: var(--piste); border-radius: 2px; }
  .et { color: var(--gris); font-weight: 600; }
  .q { font: 400 12px/1 var(--mono); color: var(--gris); white-space: nowrap; }
  .us { order: -1; display: inline-flex; align-items: center; gap: 0; height: 20px; padding: 0 4px; border-radius: 10px; background: var(--piste); color: var(--encre); }
  .us.deduit { background: none; padding: 0 1px; color: var(--gris); }
  .us .al { font: italic 700 12px/1 -apple-system, system-ui, sans-serif; margin-left: 1px; color: var(--gris); }
  .stk { display: inline-flex; color: var(--gris); }
  .ib { display: inline-flex; align-items: center; gap: 4px; flex: none; }
  .ib b { font: 700 12px/1 var(--mono); min-width: 28px; text-align: right; }
  .ajc { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); flex: none; }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .cases { display: flex; align-items: flex-start; gap: 6px; margin-top: 3px; }
  .objs, .exs { display: inline-flex; gap: 2px; }
  .objs { padding-right: 6px; border-right: 1px dashed #b9b9b0; }
  [data-famille="citrus"] { --fd: ${FOND.citrus}; } [data-famille="tropical"] { --fd: ${FOND.tropical}; } [data-famille="melon"] { --fd: ${FOND.melon}; }
  [data-famille="stoneFruit"] { --fd: ${FOND.stoneFruit}; } [data-famille="pomeFruit"] { --fd: ${FOND.pomeFruit}; } [data-famille="berries"] { --fd: ${FOND.berries}; }
  [data-famille="floral"] { --fd: ${FOND.floral}; } [data-famille="herbal"] { --fd: ${FOND.herbal}; } [data-famille="resin"] { --fd: ${FOND.resin}; }
  [data-famille="spice"] { --fd: ${FOND.spice}; } [data-famille="green"] { --fd: ${FOND.green}; } [data-famille="earthy"] { --fd: ${FOND.earthy}; }
  .cf { width: 24px; height: 30px; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; position: relative; }
  .cf .pi { width: 20px; height: 20px; padding: 3px; border-radius: 50%; background: var(--fd); }
  .cf.ci .pi, .cf.sf .pi { background: none; }
  .cf.o .pi { box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.8px var(--encre); }
  .cf.ne .pi { opacity: .35; }
  .cf.vide::after { content: ''; width: 4px; height: 4px; border-radius: 2px; background: #d6d6d0; margin-top: 8px; }
  .cf.moins::before { content: ''; position: absolute; left: -1px; top: -1px; width: 7px; height: 2.5px; border-radius: 2px; background: var(--encre); box-shadow: 0 0 0 1px #fff; z-index: 1; }
  /* L'intensité exacte : une barre continue de 0 à 4 crans, un trait par cran. */
  .bc { position: relative; width: 22px; height: 5px; border-radius: 2px; background: repeating-linear-gradient(90deg, transparent 0 4.5px, #c8c8c0 4.5px 5.5px); box-shadow: inset 0 0 0 1px #d4d4cc; }
  .bc i { position: absolute; left: 0; top: 0; bottom: 0; width: var(--w); min-width: 2px; background: var(--encre); border-radius: 2px; }
  .bc.bas i { background: #fff; box-shadow: inset 0 0 0 1.2px var(--encre); }
  .bc.xs i { background: var(--acc); }
  .jg.ne i { display: block; width: 14px; height: 5px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .rangee { position: relative; padding: 2px 0 10px; }

  /* En plus, dans la ligne : hors du style chiffré, estimé et sa raison, la biotransformation. */
  .xs-l { display: flex; align-items: center; gap: 5px; margin-top: 4px; height: 22px; padding: 0 6px 0 5px; border-radius: 11px; background: #fdf0ea; color: var(--acc); font-size: 12px; font-weight: 650; align-self: flex-start; width: max-content; }
  .xs-f { display: inline-flex; align-items: center; gap: 2px; }
  .xs-f .pi { width: 14px; height: 14px; }
  .xs-f b { font: 700 12px/1 var(--mono); color: var(--acc); }
  .xs-f i { font: 400 12px/1 var(--mono); font-style: normal; color: var(--acc); }
  .est-w { display: inline-flex; flex-direction: column; margin-top: 4px; }
  .est { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 3px 0 6px; border-radius: 11px; background: var(--piste); font-size: 12px; font-weight: 600; color: var(--gris); align-self: flex-start; }
  .est .chev, .bio-b .chev, .pli-b .chev { color: var(--gris); transition: transform .15s; }
  [aria-expanded="true"] > .chev { transform: rotate(180deg); }
  .est-c { font-size: 12px; color: var(--gris); padding: 4px 2px 0; }
  .est-c[hidden], .bio-c[hidden], #hh-c[hidden] { display: none; }
  .bio { margin-top: 6px; display: flex; flex-direction: column; gap: 2px; padding: 5px 6px; border-radius: 4px; background: repeating-linear-gradient(135deg, #fff 0 4px, #f1f1ec 4px 7px); box-shadow: inset 0 0 0 1px #c8c8c0; }
  .bio-l { display: flex; align-items: center; gap: 6px; min-height: 22px; font-size: 12px; }
  .bio-f { display: inline-flex; align-items: center; gap: 1px; width: 48px; flex: none; background: #fff; border-radius: 8px; padding: 1px 2px; }
  .bio-f .fl { width: 12px; height: 12px; color: var(--gris); }
  .bio-l b { font-weight: 700; flex: 1; }
  .st { height: 18px; line-height: 18px; padding: 0 6px; border-radius: 9px; background: #fff; box-shadow: inset 0 0 0 1px var(--gris2); font-size: 12px; color: var(--gris); }
  .nsrc { font: 400 12px/1 var(--mono); color: var(--gris); width: 40px; text-align: right; }
  .bio-b { display: inline-flex; align-items: center; gap: 2px; height: 22px; font-size: 12px; font-weight: 650; color: var(--gris); align-self: flex-start; }
  .bio-c { list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 12px; padding: 4px 0 2px; background: #fff; }
  .src { color: var(--gris2); }

  .bloc { background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
  .bloc h3 { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 750; }
  .pg { font: 400 12px/1 var(--mono); color: var(--gris); margin-left: auto; }
  .cb { display: flex; flex-direction: column; gap: 3px; padding-top: 5px; border-top: 1px solid var(--trait); }
  .cb-t { display: flex; align-items: center; gap: 4px; font-size: 13px; flex-wrap: wrap; }
  .nv { font: 700 12px/18px var(--mono); min-width: 18px; height: 18px; border-radius: 9px; text-align: center; box-shadow: inset 0 0 0 1px var(--encre); padding: 0 4px; }
  .cb-n { font-weight: 650; }
  .cb-t .ib { margin-left: auto; }
  .cb-l { display: flex; gap: 14px; }
  .cb-f { display: inline-flex; align-items: center; gap: 4px; }
  .cb-f b { font: 700 12px/1 var(--mono); }
  .cb-f b.xs-n { color: var(--acc); }
  .cb-na { font-size: 12px; color: var(--gris); font-style: normal; }
  .gib text { font-family: var(--mono); }
  .pli-b { display: flex; align-items: center; gap: 5px; width: 100%; min-height: 28px; font-size: 13px; font-weight: 750; text-align: left; }
  .pli-b .pg { margin-left: auto; margin-right: 2px; }
  #hh-c { list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  #hh-c li { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; }
  #hh-c .act { grid-column: 1 / -1; color: var(--gris); font-size: 12px; }
  .pv-t { font-size: 12px; height: 18px; line-height: 18px; padding: 0 6px; border-radius: 9px; background: var(--piste); color: var(--gris); white-space: nowrap; }
  .pv-t.hyp { background: #fff; box-shadow: inset 0 0 0 1px var(--gris2); }
  .notes p { font-size: 12px; color: var(--gris); }

  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 46px; border-radius: 4px; background: var(--encre); color: #fff; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 18px rgba(0,0,0,.24); }

  /* La fiche, en plus : la fiche technique du houblon sur papier millimétré. */
  .f-voile { position: fixed; inset: 0; z-index: 20; background: rgba(22,22,26,.36); }
  .f-fiche { position: fixed; z-index: 21; background: var(--papier); background-image: linear-gradient(rgba(22,22,26,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(22,22,26,.045) 1px, transparent 1px); background-size: 8px 8px; color: var(--encre); overflow-y: auto; overscroll-behavior: contain; padding: 0 14px 14px; display: flex; flex-direction: column; gap: 8px; }
  .f-fiche[hidden] { display: none; }
  .f-feuille { left: 0; right: 0; bottom: 0; max-height: calc(100% - 48px); border-radius: 8px 8px 0 0; box-shadow: 0 -6px 24px rgba(0,0,0,.2); }
  .f-bulle { width: 382px; max-height: calc(100% - 16px); border-radius: 4px; box-shadow: 0 10px 32px rgba(0,0,0,.2), 0 0 0 1px var(--trait); padding-top: 10px; }
  .f-poignee { align-self: center; width: 36px; height: 4px; border-radius: 2px; background: #b9b9b0; margin: 8px 0 0; flex: none; touch-action: none; }
  .f-bulle .f-poignee { display: none; }
  .f-tete { display: flex; align-items: center; gap: 6px; }
  .f-tete h2 { font-size: 19px; font-weight: 800; letter-spacing: -.01em; }
  .f-or { font-size: 12px; color: var(--gris); margin-right: auto; }
  .f-fermer { margin-left: auto; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); flex: none; }
  .f-ab { display: flex; align-items: center; gap: 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; padding: 6px 8px; }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 4px; }
  .f-alpha i { font-style: normal; font-size: 15px; color: var(--gris); }
  .f-alpha b { font: 700 17px/1 var(--mono); }
  .f-lot { font: 400 12px/1 var(--mono); color: var(--gris); }
  .f-role { margin-left: auto; font-size: 12px; height: 22px; line-height: 20px; padding: 0 8px; border-radius: 11px; box-shadow: inset 0 0 0 1px var(--encre); white-space: nowrap; background: #fff; }
  .f-role.regle { box-shadow: none; border: 1px dashed var(--gris2); color: var(--gris); }
  .f-role i { font-style: italic; font-weight: 700; margin-left: 3px; }
  .f-pls { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .f-pl { min-width: 0; display: flex; align-items: center; gap: 4px; background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; padding: 4px 6px; white-space: nowrap; }
  .f-pn { font-size: 13px; color: var(--gris); }
  .f-pl b { font: 700 12px/1 var(--mono); margin-left: auto; }
  .f-u { font: 400 12px/1 var(--mono); color: var(--gris); }
  .f-note { font-size: 12px; color: var(--gris); }
  .f-labels { background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; }
  .f-bande { display: flex; align-items: center; gap: 2px; margin-bottom: 3px; }
  .f-bande .c, .f-lab .c { width: 14px; height: 14px; border-radius: 2px; background: var(--piste); flex: none; }
  .f-bande .c.sep { margin-left: 5px; }
  .c.m { background: var(--b) !important; }
  .c.ci { background: var(--fd) !important; box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-seule { margin-left: auto; font: 400 12px/1 var(--mono); color: var(--gris); }
  .f-lab { display: grid; grid-template-columns: 14px auto 1fr; align-items: baseline; gap: 6px; font-size: 13px; }
  .f-lab .c { align-self: center; }
  .f-lt b { font-weight: 700; }
  .f-n { font: 400 12px/1 var(--mono); color: var(--gris); margin-left: 4px; }
  .f-pr { font-size: 12px; color: var(--gris); margin-left: 4px; }
  .f-m { color: var(--gris); font-size: 12px; }
  .f-sans { font-size: 12px; color: var(--gris); }
  .f-arome { display: flex; justify-content: center; background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; }
  .f-arome text { font-family: -apple-system, system-ui, sans-serif; }
  .f-actions { display: flex; align-items: center; gap: 6px; }
  .f-gout { display: inline-flex; gap: 2px; margin-right: auto; }
  .f-g { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); background: #fff; box-shadow: inset 0 0 0 1px var(--trait); }
  .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .f-act { height: 32px; padding: 0 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--encre); white-space: nowrap; background: #fff; }
  .f-ajouter { background: var(--encre); color: #fff; }
  .f-ajouter[aria-pressed="true"] { background: #fff; color: var(--encre); }
  .f-replis { display: flex; gap: 4px; }
  .f-repli { flex: 1; height: 28px; font-size: 12px; font-weight: 650; color: var(--gris); background: #fff; box-shadow: inset 0 0 0 1px var(--trait); border-radius: 2px; }
  .f-repli[aria-expanded="true"] { color: #fff; background: var(--encre); }
  .f-sec { font-size: 12px; display: flex; flex-direction: column; gap: 3px; background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; padding: 6px 8px; }
  .f-sec[hidden] { display: none; }
  .f-rg { display: flex; justify-content: space-between; gap: 8px; } .f-rg span { color: var(--gris); } .f-rg b { font-family: var(--mono); }
  .f-gris { color: var(--gris); }
  .f-tags { display: flex; flex-wrap: wrap; gap: 4px; } .f-tags span { padding: 1px 7px; border-radius: 9px; background: var(--piste); font-size: 12px; }
`;

const corps = `<main class="ecran">${tete}${reps}
  <div class="graph">${fonds()}${tetes}
    ${MEMES.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${combos()}
  ${blocIbu}
  ${blocHors}
  <a class="cmp" data-role="comparer" href="#">Comparer <b class="nb">(${AJOUTEES.length})</b></a>
</main>
${fiches}`;
ecrire(OUT + '/etat-b.html', page({ titre: 'Suggestions · en plus', commentaire: 'Lot 18 · l11 · En plus (c1). q2b pour le brasseur expert : chiffres, mini-graphes, sources, IBU de chaque voie, biotransformation détaillée, combinaisons ; tout lu dans c1 et les fiches. Appui long ou survol long sur un houblon : sa fiche g1 enrichie. Généré par generateur-l11.mjs.', css: CSS, corps, js: LENTILLE_JS }));

// ======================= planche =======================
const planche = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>l11 · En plus · planche</title>
<style>
  :root { --encre: #16161a; --gris: #55555f; --trait: #d4d4cc; --papier: #fafaf6; --mono: ${MONO}; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--papier); color: var(--encre); }
  body { background-image: linear-gradient(rgba(22,22,26,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(22,22,26,.045) 1px, transparent 1px); background-size: 8px 8px; font: 400 13px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; }
  svg { display: block; flex: none; }
  .pl { width: 390px; margin: 0 auto; padding: 12px 12px 16px; display: flex; flex-direction: column; gap: 12px; }
  h1 { font-size: 15px; font-weight: 800; } h1 span { font-weight: 500; color: var(--gris); }
  .minis { display: flex; gap: 6px; }
  .mini { width: 180px; height: 760px; overflow: hidden; position: relative; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; background: #fff; }
  .mini iframe { width: 390px; height: 1650px; border: 0; transform: scale(.4615); transform-origin: 0 0; position: absolute; left: 0; top: 0; pointer-events: none; }
  .abc { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); border-radius: 2px; padding: 10px; }
  .it { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; }
  .mot { font-size: 12px; color: var(--gris); }
  .sws { display: flex; gap: 4px; } .sw { width: 24px; height: 24px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--trait); }
  .num { font: 700 17px/1 var(--mono); }
  .ajc { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .cf { width: 24px; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
  .cf .pi { width: 20px; height: 20px; padding: 3px; border-radius: 50%; background: ${FOND.floral}; }
  .bc { position: relative; width: 22px; height: 5px; border-radius: 2px; background: repeating-linear-gradient(90deg, transparent 0 4.5px, #c8c8c0 4.5px 5.5px); box-shadow: inset 0 0 0 1px #d4d4cc; }
  .bc i { position: absolute; left: 0; top: 0; bottom: 0; width: 40%; background: var(--encre); border-radius: 2px; }
  .bt-m { display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 14px; border-radius: 4px; background: var(--encre); color: #fff; font-weight: 700; white-space: nowrap; }
  html { min-height: 100%; background-image: linear-gradient(rgba(22,22,26,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(22,22,26,.045) 1px, transparent 1px); background-size: 8px 8px; }
</style></head>
<body>${SYMBOLES}
<main class="pl">
  <h1>l11 · En plus <span>q2b pour le brasseur expert</span></h1>
  <div class="minis">
    <div class="mini"><iframe src="etat-b.html" title="Suggestions, en plus" tabindex="-1"></iframe></div>
    <div class="mini"><iframe src="etat-b.html?fiche=Nelson%20Sauvin" title="Fiche de Nelson Sauvin, en plus" tabindex="-1"></iframe></div>
  </div>
  <div class="abc">
    <div class="it"><span class="sws"><i class="sw" style="background:var(--papier);background-image:linear-gradient(rgba(22,22,26,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(22,22,26,.08) 1px,transparent 1px);background-size:6px 6px"></i><i class="sw" style="background:#fff"></i><i class="sw" style="background:var(--encre)"></i></span><span class="mot">surfaces</span></div>
    <div class="it"><span class="num">62,7</span><span class="mot">texte</span></div>
    <div class="it"><span class="ajc">${ic('i-plus')}</span><span class="mot">action</span></div>
    <div class="it"><span class="cf" data-famille="floral">${picto('floral')}<span class="bc"><i></i></span></span><span class="mot">famille</span></div>
    <div class="it">${miniPiste('floral')}<span class="mot">au style</span></div>
    <div class="it"><span class="bt-m">Comparer <b>(2)</b></span><span class="mot">bouton</span></div>
  </div>
</main>
</body></html>
`;
ecrire(OUT + '/planche.html', planche);
