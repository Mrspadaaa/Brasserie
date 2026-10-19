// Lot 21 · x3 · « La cuve, jour après jour » (chaude : on s'écarte de la baseline pour le temps).
// La question du brasseur : « combinaison de 3j dryhopping Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 […]
// C'est extrêmement complexe à voir ce qui est vraiment faisable ». Une frise de la fermentation (J0 à J18) :
//   - la levure active (J0–J5) puis au repos, en couloir écrit ;
//   - les ajouts en blocs à la couleur du houblon, écrits (« Citra 2 g/L · 3 j ») ; au-delà de 3 j de contact,
//     hachuré : rien de plus mesuré ; le repère 24 h ;
//   - cinq rubans de familles, le profil simulé jour par jour (parJour du moteur), au style : le plafond de la 16D en
//     filet, l'orangé au-dessus, l'enveloppe bas–haut en pâle ;
//   - un curseur à glisser : le jour choisi, ce que la cuve sent ce jour-là (les 12 barres), et les vraies valeurs de ce
//     moment (2 j suffisent, 1 h = 96 h au nez, au-delà de 3 j rien de plus, hop creep, biotransformation).
// Usage : node generateur-x3.mjs  →  x3/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../x1/socle-x.mjs';
import { tableReelle, DUREE } from '../x1/donnees-reelles.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { HB, ORDRE, NOM, COURT, picto, ic, hn, alpha, usage, stock, pt, colonne, lentille, legende, LEGENDE_COMMUNE, page, ecrire } = S;
const RUB = ['citrus', 'tropical', 'berries', 'floral', 'green'];
// Les plans : les cas du moteur qui ont un jour par jour.
const PLANS = [
  { id: 'citra', t: 'Citra', grp: 'seul', cas: { dryPost: { us05: 'K1-citra-dryPost' }, dryActive: { us05: 'K1-citra-dryActive' } } },
  { id: 'cascade', t: 'Cascade', grp: 'seul', cas: { dryPost: { us05: 'K1-cascade-dryPost' }, dryActive: { us05: 'K1-cascade-dryActive' } } },
  { id: 'galaxy', t: 'Galaxy', grp: 'seul', cas: { dryPost: { us05: 'K2-galaxy' } } },
  { id: 'idaho7', t: 'Idaho 7', grp: 'seul', cas: { dryPost: { us05: 'K2-idaho-7' } } },
  { id: 'citra-galaxy', t: 'Citra 3 j, puis Galaxy 7 j', grp: 'suite', cas: { dryPost: { us05: 'K3-citra3-galaxy7' } } },
  { id: 'citra-idaho7', t: 'Citra 3 j, puis Idaho 7 5 j', grp: 'suite', cas: Object.fromEntries([['dryPost', 'apres'], ['dryActive', 'actif']].map(([m, s]) => [m, Object.fromEntries(['us05', 'verdant', 'pomona', 'diamond'].map((l) => [l, 'K4-' + l + '-' + s]))])) },
  ...['galaxy', 'idaho7', 'cascade'].map((k) => ({ id: 'citra+' + k, t: 'Citra + ' + HB[k].nom + ' ensemble', grp: 'ensemble', cas: Object.fromEntries([['dryPost', 'apres'], ['dryActive', 'actif']].map(([m, s]) => [m, Object.fromEntries(['us05', 'pomona', 'verdant'].map((l) => [l, 'K5-citra+' + (k === 'idaho7' ? 'idaho-7' : k) + '-' + s + '-' + l]))])) })),
];
// Les cas utiles, allégés : ajouts, jour par jour (centre, bas, haut des cinq rubans et des 12 familles), biotransformation.
const CAS = {};
for (const p of PLANS) for (const m of Object.keys(p.cas)) for (const id of Object.values(p.cas[m])) {
  const c = S.VSIM.cas.find((x) => x.id === id); if (!c) continue;
  const X = S.CAS.find((x) => x.id === id);
  CAS[id] = { titre: c.titre, ajouts: X.ajoutsX, j0: c.parJour[0].jourRecette,
    jours: X.parJour.map((j) => Object.fromEntries(ORDRE.map((f) => [f, [j.profil[f].bas, j.profil[f].centre, j.profil[f].haut, j.profil[f].hp ? 1 : 0]]))),
    bio: c.biotransformation, confiance: c.confiance && c.confiance.niveau, sat: c.saturation && c.saturation.facteur, drap: (c.drapeaux || []).map((d) => d.id) };
}
const T = tableReelle();
const DEF = { plan: 'citra-idaho7', m: 'dryPost', lv: 'us05', jour: 12 };
const seg = (nom, reglage, opts, actif, cls = '') => `<span class="seg rg ${cls}" role="radiogroup" aria-label="${nom}">${opts.map(([v, t, extra = '']) => `<button role="radio" data-role="reglage" data-reglage="${reglage}" data-v="${v}" aria-checked="${String(v) === String(actif)}" ${extra}>${t}</button>`).join('')}</span>`;
const avant0 = Object.fromEntries(ORDRE.map((f) => [f, S.AVANT[f]]));
const corps = `
  <header class="tete"><h1>Ma cuve, jour après jour</h1>${lentille()}${legende([...LEGENDE_COMMUNE, ['<span class="lg-blk">Citra</span>', 'un ajout, sa dose et ses jours de contact'], ['<span class="lg-hz"></span>', 'au-delà de 3 j de contact : rien de plus mesuré']])}</header>
  <div class="plans">
    <div class="rang"><span class="lab">seul, 4 g/L</span>${seg('Un houblon', 'plan', PLANS.filter((p) => p.grp === 'seul').map((p) => [p.id, p.t]), DEF.plan)}</div>
    <div class="rang"><span class="lab">à deux, 2 + 2 g/L</span>${seg('Deux houblons', 'plan', PLANS.filter((p) => p.grp !== 'seul').map((p) => [p.id, p.t.replace(' ensemble', ''), p.grp === 'ensemble' ? 'data-reglage-cumul="1"' : '']), DEF.plan, 'seg-2')}</div>
    <div class="rang">${seg('Moment', 'moment', [['dryActive', 'en fermentation active'], ['dryPost', 'après fermentation']], DEF.m)}</div>
    <div class="rang">${seg('Levure', 'levure', [['us05', 'US-05'], ['verdant', 'Verdant'], ['pomona', 'Pomona'], ['diamond', 'Diamond']], DEF.lv)}<span class="lv-note" data-role="note-levure"></span></div>
  </div>
  <section class="frise" data-role="simulation" aria-label="La frise de la fermentation">
    <div class="fr-t"><span class="estime">~ simulé</span><span>jour par jour, au style de la 16D</span><span class="conf" data-role="confiance"></span></div>
    <p class="fr-v">${S.vrai('tirets 24 h : l’essentiel est extrait', DUREE[0].src + ' ; Wolfe 2012 [73]', { mot: 'mesuré', cls: 'vv txt' })}</p>
    <div class="fr-g" data-role="frise"></div>
    <label class="curseur"><span class="sr">Jour de fermentation</span><input type="range" min="0" max="18" step="1" value="${DEF.jour}" data-role="reglage" data-reglage="jour" aria-label="Jour de fermentation"></label>
  </section>
  <section class="lecture" data-role="simulation" aria-label="Ce que la cuve sent ce jour-là">
    <div class="lec-t" data-role="lec-t"></div>
    <div class="cols" data-role="barres">${ORDRE.map((f) => colonne(f, avant0[f])).join('')}</div>
    <p class="change" data-role="change"></p>
  </section>
  <section class="ajouts" data-role="ajouts" aria-label="Les houblons du plan"></section>
  <section class="vrai" aria-label="Les vraies valeurs de ce jour"><div class="vrai-t">vraies valeurs, ce jour-là</div><div data-role="vraies"></div></section>`;

const css = `
  .rang { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .plans { display: flex; flex-direction: column; gap: 6px; }
  .lab { font-size: 12px; color: var(--gris); min-width: 62px; }
  .seg-2 { flex-wrap: wrap; gap: 4px; background: none; padding: 0; flex: 1 1 100%; max-width: 100%; }
  .seg-2 button { font-size: 12px; background: var(--piste); }
  .lv-note { font-size: 12px; color: var(--gris); }
  .seg button:disabled { cursor: default; text-decoration: line-through; }
  .frise { position: relative; display: flex; flex-direction: column; gap: 4px; }
  .fr-t { display: flex; align-items: baseline; gap: 8px; font-size: 13px; }
  .conf { margin-left: auto; font-size: 12px; color: var(--gris); }
  .fr-v { font-size: 12px; }
  .fr-v .vv.txt { font-size: 12px; }
  .fr-g { position: relative; display: grid; grid-template-columns: 76px 1fr; row-gap: 2px; margin-top: 18px; }
  .fr-l { font-size: 12px; display: flex; align-items: center; gap: 3px; height: var(--h, 30px); color: var(--t, var(--encre)); white-space: nowrap; }
  .fr-p { position: relative; height: var(--h, 30px); }
  .fr-axe span { position: absolute; top: 0; transform: translateX(-50%); font: 500 12px/14px var(--mono); color: var(--gris); }
  .lane { position: absolute; top: 3px; bottom: 3px; border-radius: 4px; display: flex; align-items: center; padding: 0 5px; font-size: 12px; white-space: nowrap; overflow: hidden; }
  .lane.lev-a { background: #efe6f7; color: #4b2a66; } .lane.lev-r { background: var(--doux); color: var(--gris); }
  .blk { position: absolute; top: 2px; height: 22px; border-radius: 4px; color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; padding: 0 5px; white-space: nowrap; overflow: visible; z-index: 2; }
  .blk .hz { position: absolute; top: 0; bottom: 0; right: 0; background: repeating-linear-gradient(135deg, rgba(255,255,255,.75) 0 2px, transparent 2px 5px); border-radius: 0 4px 4px 0; }
  .blk .t24 { position: absolute; top: -3px; bottom: -3px; width: 0; border-left: 1.5px dashed var(--encre); }
  .rub { position: absolute; inset: 0; overflow: visible; }
  .cur { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px solid var(--encre); z-index: 5; pointer-events: none; }
  .cur::before { content: attr(data-j); position: absolute; top: -16px; left: -16px; width: 32px; text-align: center; font: 600 12px var(--mono); background: var(--encre); color: #fff; border-radius: 4px; }
  .curseur { display: block; margin-left: 76px; }
  .curseur input { width: 100%; height: 32px; accent-color: #16161a; touch-action: none; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .bio-m { position: absolute; top: 1px; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px; background: #fff; padding: 0 3px; border-radius: 4px; box-shadow: 0 0 0 1px #c9b3dd; z-index: 4; }
  .lecture { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .lec-t { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; font-size: 13px; }
  .lec-t b { font-size: 15px; }
  .cols { padding: 14px 2px 0; }
  .change { font-size: 13px; line-height: 1.4; }
  .change .dl { white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; margin-right: 8px; }
  .ajouts { display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .aj { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-height: 24px; }
  .vrai { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .vrai-t { font-size: 12px; font-weight: 600; color: var(--gris); }
  .vr { display: grid; grid-template-columns: 22px 1fr; align-items: center; column-gap: 6px; min-height: 26px; font-size: 13px; }
  .vr-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .vr-s { font-size: 12px; color: var(--gris); }
  .lg-blk { display: inline-block; background: #184078; color: #fff; font-size: 12px; padding: 0 4px; border-radius: 4px; }
  .lg-hz { display: inline-block; width: 24px; height: 12px; background: #184078 repeating-linear-gradient(135deg, rgba(255,255,255,.75) 0 2px, transparent 2px 5px); border-radius: 2px; }`;

const js = `
${S.JS_SIM}
const D = window.DONNEES, HBJ = D.houblons, NOMS = ${JSON.stringify(NOM)}, COURTS = ${JSON.stringify(COURT)}, RUB = ${JSON.stringify(RUB)}, PLANS = D.plans, J = ${JSON.stringify(ORDRE)};
const ST = ${JSON.stringify(DEF)};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fr = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const picto = (f, z = 14) => '<svg class="pi" width="' + z + '" height="' + z + '" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + '"><use href="#p-' + f + '"/></svg>';
const ic = (k, z = 14) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
const vrai = (t, src, mot, cls = 'vv') => '<span class="' + cls + '" data-nature="mesure" data-source="' + esc(src) + '">' + t + (mot ? '<span class="mot-c mot-' + mot + '">' + mot + '</span>' : '') + '</span>';
const inc = (t) => '<span class="inc" data-inconnu><i class="hach"></i>' + t + '</span>';
const NJ = 18;
const plan = () => PLANS.find((p) => p.id === ST.plan);
const casId = () => { const p = plan(), mm = p.cas[ST.m] || p.cas.dryPost; return mm[ST.lv] || null; };
const existe = (pl, m, lv) => { const p = PLANS.find((x) => x.id === pl); return !!(p.cas[m] && p.cas[m][lv]); };
// Le profil d'un jour de fermentation : avant le premier ajout, la bière de base ; ensuite le jour par jour du moteur.
function profilJour(C, j) {
  const i = Math.max(0, Math.min(C.jours.length - 1, j - C.j0));
  const a = j < C.j0 ? null : C.jours[i], p = {};
  for (const f of J) { if (!a) { p[f] = SIMX.AV[f]; continue; } const x = a[f]; p[f] = { bas: x[0], centre: x[1], haut: x[2], hp: !!x[3] }; }
  return p;
}
function rendre() {
  const C = D.cas[casId()];
  document.querySelectorAll('[data-reglage]').forEach((b) => { if (b.tagName === 'INPUT') return; const r = b.dataset.reglage, cur = { plan: ST.plan, moment: ST.m, levure: ST.lv }[r]; b.setAttribute('aria-checked', String(String(cur) === b.dataset.v));
    if (r === 'moment') b.disabled = !PLANS.find((p) => p.id === ST.plan).cas[b.dataset.v]; });
  document.querySelectorAll('[data-reglage="levure"]').forEach((b) => { b.disabled = !existe(ST.plan, ST.m, b.dataset.v) && !existe(ST.plan, 'dryActive', b.dataset.v); });
  if (!C) return;
  const W = document.querySelector('.fr-g').clientWidth - 76, x = (j) => j / NJ * W;
  // la frise
  let h = '<span class="fr-l"></span><span class="fr-p fr-axe" style="--h:14px">' + [0, 3, 6, 9, 12, 15, 18].map((j) => '<span style="left:' + x(j) + 'px">J' + j + '</span>').join('') + '</span>';
  h += '<span class="fr-l">' + ic('levure', 14) + 'levure</span><span class="fr-p" style="--h:26px"><span class="lane lev-a" style="left:0;width:' + x(6) + 'px">active</span><span class="lane lev-r" style="left:' + (x(6) + 2) + 'px;right:0">au repos</span>';
  const actif = ST.m === 'dryActive';
  h += '</span>';
  if (C.bio && C.bio.actif) { h += '<span class="fr-l">' + ic('etincelle', 14) + 'biotransfo</span><span class="fr-p" style="--h:22px">'; const ci = (C.bio.parAjout || []).map((a) => a.citronellol_ugL).filter(Boolean); const tot = ci.reduce((t, c) => [t[0] + c.bas, t[1] + c.centre, t[2] + c.haut], [0, 0, 0]);
    h += '<span class="bio-m" data-role="biotransformation" style="left:' + x(C.j0) + 'px">' + picto('floral', 12) + ic('fleche', 12) + picto('citrus', 12) + (tot[2] > 0 ? '<span data-nature="simule">~' + Math.round(tot[1]) + ' µg/L citronellol</span>' : '<span>' + inc('inconnue') + '</span>') + '</span></span>'; }
  for (const a of C.ajouts) { const k = a.h, deb = a.jourDebut, fin = deb + a.jours, w = x(fin) - x(deb), w3 = a.jours > 3 ? (x(fin) - x(deb + 3)) : 0;
    h += '<span class="fr-l" data-houblon="' + HBJ[k].nom + '">' + D.points[k] + HBJ[k].nom + '</span><span class="fr-p" style="--h:26px"><span class="blk" data-houblon="' + HBJ[k].nom + '" data-couleur="' + HBJ[k].couleur + '" style="left:' + x(deb) + 'px;width:' + w + 'px;background:' + HBJ[k].couleur + '">' + a.dose + ' g/L · ' + a.jours + ' j<i class="t24" style="left:' + (x(deb + 1) - x(deb)) + 'px"></i>' + (w3 ? '<i class="hz" style="width:' + w3 + 'px"></i>' : '') + '</span></span>'; }
  for (const f of RUB) {
    const H = 30, cap = 4.6, PXC = H / cap, cr = SIMX.Z[f].cran, yS = (v) => H - Math.min(cap, v / cr) * PXC, yA = (v) => H - Math.min(100, v) / 100 * H;
    const abs = document.body.classList.contains('abs'), y = abs ? yA : yS;
    const pts = []; for (let j = 0; j <= NJ; j++) pts.push(profilJour(C, j)[f]);
    const ligne = (k) => pts.map((v, j) => (j ? 'L' : 'M') + x(j).toFixed(1) + ',' + y(v[k]).toFixed(1)).join('');
    const aire = (k) => ligne(k) + 'L' + x(NJ).toFixed(1) + ',' + H + 'L0,' + H + 'Z';
    const env = pts.map((v, j) => (j ? 'L' : 'M') + x(j).toFixed(1) + ',' + y(v.haut).toFixed(1)).join('') + pts.slice().reverse().map((v, i) => 'L' + x(NJ - i).toFixed(1) + ',' + y(v.bas).toFixed(1)).join('') + 'Z';
    const plafond = abs ? yA(SIMX.Z[f].bande[1]) : yS(SIMX.Z[f].bande[1]);
    const id = 'cl-' + f;
    h += '<span class="fr-l" data-famille="' + f + '">' + picto(f, 14) + COURTS[f] + '</span><span class="fr-p" style="--h:' + H + 'px"><svg class="rub" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" data-famille="' + f + '" aria-label="' + NOMS[f] + ', jour par jour, simulé" role="img">'
      + '<defs><clipPath id="' + id + '-b"><rect x="0" y="' + plafond + '" width="' + W + '" height="' + (H - plafond) + '"/></clipPath><clipPath id="' + id + '-h"><rect x="0" y="0" width="' + W + '" height="' + plafond + '"/></clipPath></defs>'
      + '<rect x="0" y="' + plafond + '" width="' + W + '" height="' + (H - plafond) + '" fill="' + 'var(--f)' + '" data-role="zone"/>'
      + '<path d="' + ligne('bas') + '" fill="none" stroke="#5b5b66" stroke-width="1" stroke-dasharray="2 2"/>'
      + '<path d="' + aire('centre') + '" fill="var(--b)" clip-path="url(#' + id + '-b)" data-nature="simule"/>'
      + '<path d="' + aire('centre') + '" fill="#c2410c" clip-path="url(#' + id + '-h)"/>'
      + '<line x1="0" x2="' + W + '" y1="' + plafond + '" y2="' + plafond + '" stroke="var(--t)" stroke-width="1.5"/>'
      + '</svg></span>';
  }
  h += '<i class="cur" data-j="J' + ST.jour + '" style="left:' + (76 + x(ST.jour)) + 'px"></i>';
  document.querySelector('[data-role="frise"]').innerHTML = h;
  document.querySelector('[data-role="confiance"]').innerHTML = 'confiance <b>' + (C.confiance || '?') + '</b>';
  // la lecture du jour
  const p = profilJour(C, ST.jour);
  document.querySelectorAll('[data-col]').forEach((c) => SIMX.poser(c, c.dataset.col, p[c.dataset.col]));
  const ct = C.ajouts.map((a) => { const t = ST.jour - a.jourDebut; return D.points[a.h] + HBJ[a.h].nom + ' ' + (t <= 0 ? 'pas encore' : t >= a.jours ? 'retiré après ' + a.jours + ' j' : t + ' j de contact'); }).join(' · ');
  document.querySelector('[data-role="lec-t"]').innerHTML = '<b>J' + ST.jour + '</b><span class="estime">~ ce que la cuve sent</span><span class="gris">' + ct + '</span>';
  const d = J.map((f) => ({ f, d: Math.round((p[f].centre - SIMX.AV[f].centre) / SIMX.Z[f].cran), hors: SIMX.AV[f].centre <= SIMX.Z[f].bande[1] && p[f].centre > SIMX.Z[f].bande[1] })).filter((y) => y.d >= 1).sort((a, b) => b.d - a.d);
  document.querySelector('[data-role="change"]').innerHTML = d.length ? d.slice(0, 4).map((y) => '<span class="dl" data-nature="simule">' + picto(y.f, 14) + COURTS[y.f] + ' ~ <b>+' + y.d + '</b> cran' + (y.d > 1 ? 's' : '') + '</span>').join('') + (d.some((y) => y.hors) ? '<span class="xs">hors du style : ' + d.filter((y) => y.hors).map((y) => COURTS[y.f]).join(', ') + '</span>' : '<span class="dl">dans la 16D</span>') : '<span class="dl" data-nature="simule">~ rien encore : la bière de base</span>';
  // les houblons du plan : α, usage, stock (et l'ajout cumulé, sur toute la largeur)
  const deux = new Set(C.ajouts.map((a) => a.h)).size >= 2;
  document.querySelector('[data-role="ajouts"]').innerHTML = (deux ? '<div class="aj" data-role="ajout">' : '') + C.ajouts.map((a, i) => '<div class="aj" data-voie="' + (i + 1) + '">' + D.cartes[a.h] + '<span class="vr-s">' + a.dose + ' g/L · ' + a.jours + ' j · J' + a.jourDebut + '</span></div>').join('') + (deux ? '</div>' : '')
    + (C.sat ? '<div class="aj gris" style="font-size:12px"><span data-nature="simule">~ saturation partagée : agrumes ' + Math.round(C.sat.citrus * 100) + ' % de la somme des deux seuls</span> · ordre, synergie, masquage : ' + inc('inconnus') + '</div>' : '');
  // les vraies valeurs de ce jour
  let v = '';
  const enCours = C.ajouts.filter((a) => ST.jour > a.jourDebut && ST.jour - a.jourDebut <= a.jours);
  const t = enCours.length ? Math.min(...enCours.map((a) => ST.jour - a.jourDebut)) : null;
  if (t != null && t <= 2) for (const x of D.duree) v += '<div class="vr">' + ic('sablier', 16) + '<span class="vr-l">' + vrai(esc(x.txt), x.src, x.mot) + '<span class="vr-s">' + esc(x.detail) + '</span></span></div>';
  if (C.ajouts.some((a) => ST.jour - a.jourDebut > 3 && a.jours > 3)) v += '<div class="vr">' + ic('sablier', 16) + '<span class="vr-l">' + vrai('au-delà de 3 j : pas d’arôme mesuré en plus', 'Wolfe 2012 [73] ; Schmidt 2019 (E08)', 'publié', 'vv txt') + '<span class="vr-s">végétal en fonction du temps : ' + inc('inconnu') + '</span></span></div>';
  if (enCours.length && ST.m === 'dryActive' || (ST.jour <= 6 && C.ajouts.some((a) => a.jourDebut < 6))) v += '<div class="vr">' + ic('bulles', 16) + '<span class="vr-l">' + vrai('hop creep : +0,92 % vol.', 'Young, Fox 2025 [68]', 'mesuré') + '<span class="vr-s">à 10 g/L, 7 j, levure ale ; aucun chiffre pour ce brassin</span></span></div>';
  for (const a of C.ajouts.filter((x, i, xs) => xs.findIndex((y) => y.h === x.h) === i)) { const H = D.huile[a.h]; v += '<div class="vr">' + ic('fiole', 16) + '<span class="vr-l">' + HBJ[a.h].nom + ' : ' + vrai(fr(H.v[0] * a.dose) + '–' + fr(H.v[1] * a.dose) + ' mL/hL', H.src + ' ; huile × dose', 'calcul') + '<span class="vr-s">huile apportée</span></span></div>'; }
  if (!v) v = '<div class="vr">' + ic('calendrier', 16) + '<span class="vr-l gris">avant le dry hop : la bière de base, Nugget à 60′</span></div>';
  document.querySelector('[data-role="vraies"]').innerHTML = v;
  // la note de levure
  const n = document.querySelector('[data-role="note-levure"]'); n.textContent = ST.auto ? 'la levure agit en fermentation : passé en active' : ''; ST.auto = false;
}
document.addEventListener('click', (e) => { const b = e.target.closest('button[data-reglage]'); if (!b || b.disabled) return; const r = b.dataset.reglage, v = b.dataset.v;
  if (r === 'plan') { ST.plan = v; const p = plan(); if (!p.cas[ST.m]) ST.m = 'dryPost'; if (!p.cas[ST.m][ST.lv]) ST.lv = 'us05'; }
  if (r === 'moment') { ST.m = v; if (!plan().cas[ST.m][ST.lv]) ST.lv = 'us05'; }
  if (r === 'levure') { ST.lv = v; if (!existe(ST.plan, ST.m, v) && existe(ST.plan, 'dryActive', v)) { ST.m = 'dryActive'; ST.auto = true; } else if (ST.m === 'dryPost' && v !== 'us05' && existe(ST.plan, 'dryActive', v)) { ST.m = 'dryActive'; ST.auto = true; } }
  rendre(); });
const R = document.querySelector('input[data-reglage="jour"]');
R.addEventListener('input', () => { ST.jour = Number(R.value); rendre(); });
addEventListener('resize', rendre);
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
const q = new URLSearchParams(location.search); for (const k of ['plan', 'm', 'lv']) if (q.get(k)) ST[k] = q.get(k); if (q.get('jour')) { ST.jour = Number(q.get('jour')); R.value = ST.jour; }
rendre();`;

const cartes = Object.fromEntries(['citra', 'cascade', 'galaxy', 'idaho7'].map((k) => [k, `${pt(k)}${hn(k)}${alpha(k)}${usage(k)}${stock(k, 2)}`]));
const donnees = { plans: PLANS.map((p) => ({ id: p.id, cas: p.cas })), cas: CAS, houblons: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { nom: h.nom, couleur: h.couleur }])), cartes,
  points: Object.fromEntries(['citra', 'cascade', 'galaxy', 'idaho7'].map((k) => [k, pt(k)])), duree: DUREE, huile: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { v: h.huile, src: h.huileSrc }])), grille: {} };
ecrire(path.join(ICI, 'etat.html'), page({ titre: 'x3 · Ma cuve, jour après jour', commentaire: 'Lot 21 · x3 : la frise de la fermentation, les ajouts en blocs écrits, cinq rubans de familles simulés jour par jour (moteur profil-simule, parJour), un curseur de jour, les vraies valeurs de ce jour.', css, corps, js, donnees }));
