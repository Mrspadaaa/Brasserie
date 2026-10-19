// Lot 21 · w2 · « Trois plans » (la réponse d'abord, en trois audaces).
// Pour ce que le brasseur veut (plus d'agrumes, de tropical, de floral), la page répond par trois recettes
// complètes, nommées par leur audace, jamais par une note : SAGE (le geste le plus léger qui reste dans ta
// 16D), FRANC (le plus d'effet sans sortir de la 16D), OSÉ (deux houblons ensemble, en fermentation active,
// avec la levure qui biotransforme : le plus d'effet, quitte à sortir du style). Les trois se lisent d'un coup
// d'œil sur une même piste par famille (un repère par plan), puis le plan touché s'ouvre : son profil ~ simulé
// en lignes nommées, ses réglages (dose, jours, levure, 2e houblon), ses risques, ses vraies valeurs.
// Usage : node generer-w2.mjs  →  w2/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../w1/socle-w.mjs';

const { D, ORDRE, HOP, BANDE, CRAN, JET, fr, esc, ic, pic, hop, nomH, alpha, usage, verdict, verdictHtml, conf, V, bandeLog, seg, feuille, pourquoi, preuve, page, ecrire, MOMENT, MOTS_F, COURT, inconnu, STUB_MOT, compacter, JS_DEPLIER, profilLignes, deltaU, rgba } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const AV = D.AVANT;
const ENVIES = ['citrus', 'tropical', 'floral'];
const d = (p, f) => (p[f].inconnu ? null : p[f].crans - AV[f].crans);

// ---------- les trois plans, par une règle écrite ----------
const REGLES = {
  sage: 'le geste le plus léger qui donne au moins un cran et demi sans faire sortir une famille de ta 16D',
  franc: 'un autre houblon, seul, jusqu’à 4 g/L : le plus d’effet sur ta famille sans sortir de ta 16D',
  ose: 'deux houblons ensemble, en fermentation active ou après, avec la levure qui donne le plus d’effet ; il peut sortir du style',
};
function plans(f) {
  const un = D.PROFILS.grille.filter((g) => g.levure === 'US-05' && ['wp', 'dryPost', 'b10'].includes(g.moment) && (g.jours == null || [2, 3].includes(g.jours)) && d(g.profil, f) != null);
  const rang = { dryPost: 0, wp: 1, b10: 2 };
  const sage = un.filter((g) => verdict(g.profil).k === 'dans' && d(g.profil, f) >= 1.5).sort((a, b) => a.dose_gL - b.dose_gL || rang[a.moment] - rang[b.moment] || (a.jours || 0) - (b.jours || 0) || d(b.profil, f) - d(a.profil, f))[0]
    || un.filter((g) => verdict(g.profil).k === 'dans' && g.dose_gL <= 4).sort((a, b) => d(b.profil, f) - d(a.profil, f) || a.dose_gL - b.dose_gL)[0];
  const franc = un.filter((g) => verdict(g.profil).k !== 'hors' && g.houblon !== sage.houblon && g.dose_gL <= 4).sort((a, b) => d(b.profil, f) - d(a.profil, f) || a.dose_gL - b.dose_gL)[0];
  const ose = D.PROFILS.paires.filter((p) => d(p.profil, f) != null).sort((a, b) => d(b.profil, f) - d(a.profil, f))[0];
  const P = (k, g, pa) => ({ k, h: pa ? pa.noms[0] : g.houblon, h2: pa ? pa.noms[1] : '', d: pa ? 2 : g.dose_gL, m: pa ? pa.moment : g.moment, j: pa ? pa.jours : g.jours || 3, l: pa ? pa.levure : g.levure });
  return [P('sage', sage), P('franc', franc), P('ose', null, ose)];
}
const PLANS = Object.fromEntries(ENVIES.map((f) => [f, plans(f)]));
for (const f of ENVIES) console.log(f, JSON.stringify(PLANS[f]));

// ---------- la grille et les paires (compactes) ----------
const G = {};
for (const g of D.PROFILS.grille) G[[g.houblon, g.moment, g.dose_gL, g.jours ?? '', g.levure].join('|')] = { p: compacter(g.profil), c: g.confiance, d: g.drapeaux };
const pk = (a, b, m, l) => [a, b].sort().join('+') + '|' + m + '|' + l;
const PA = {};
for (const p of D.PROFILS.paires) PA[pk(p.noms[0], p.noms[1], p.moment, p.levure)] = { p: compacter(p.profil), ap: Object.fromEntries(p.noms.map((n) => [n, ORDRE.map((f) => p.apports[n][f])])), fs: ORDRE.map((f) => p.facteur[f]), c: p.confiance, d: p.drapeaux };
const profilDe = (s) => (s.h2 ? D.paire(s.h, s.h2, s.m, s.l) : D.point(s.h, s.m, s.d, s.m.startsWith('dry') ? s.j : null, s.l));

// ---------- l'écran ----------
const NOMS = { sage: 'Sage', franc: 'Franc', ose: 'Osé' };
const AUDACE = { sage: 1, franc: 2, ose: 3 };
const TEINTE = { sage: '#2f6b4f', franc: '#16161a', ose: '#6a2c91' };
const carte = (p, i) => `<button type="button" class="w2-plan" data-role="reglage" data-reglage="plan" data-v="${i}" aria-checked="${i === 1}" style="--pl:${TEINTE[p.k]}" data-k="${p.k}">
  <span class="w2-pt"><b>${NOMS[p.k]}</b><span class="w2-au" aria-label="audace ${AUDACE[p.k]} sur 3">${[1, 2, 3].map((n) => `<i class="${n <= AUDACE[p.k] ? 'on' : ''}"></i>`).join('')}</span></span>
  <span class="w2-rec" data-role="${p.h2 ? 'ajout' : 'recette'}"></span>
  <span class="w2-vd"></span><span class="w2-ch"></span><span class="w2-ri"></span></button>`;
const f0 = 'citrus';
const corps = `
  ${S.tete('Trois plans')}
  <div class="w2-envie"><span class="w2-lab">Ta 16D, plus de</span>${seg('objectif', 'Ce que tu veux', ENVIES.map((f) => ({ v: f, h: pic(f, 16) + MOTS_F[f] })), f0, 'w2-envies')}</div>
  <section class="w2-plans" data-role="objectif" aria-label="Les trois plans">${PLANS[f0].map(carte).join('')}</section>
  <section class="w2-duel" data-role="simulation" aria-label="Les trois plans sur une même piste">
    <div class="w2-dt">${conf('simule')}<span class="w2-dl">${['sage', 'franc', 'ose'].map((k) => `<span class="w2-lk" style="--pl:${TEINTE[k]}"><i class="w2-mk">${NOMS[k][0]}</i>${NOMS[k].toLowerCase()}</span>`).join('')}<span class="w2-lk"><i class="w2-av"></i>ta bière</span><span class="w2-lk"><i class="w2-zz"></i>ta 16D</span></span></div>
    <div id="duel"></div>
  </section>
  <section class="w2-det" aria-label="Le plan choisi">
    <h2 class="w2-h2" id="det-t"></h2>
    <div class="w2-regs" id="regs"></div>
    <div class="w2-sim" data-role="simulation">
      <div class="w2-sim-t">${conf('simule')}<span class="w2-st" id="det-vd"></span><span class="w2-cf" id="det-cf" data-nature="simule"></span></div>
      ${profilLignes(D.point('Citra', 'dryPost', 1, 2).profil, AV, { id: 'prof' })}
      <p class="w2-note">${pic('resin', 14)}Résineux déjà au-dessus : ta dégustation du 18.10.</p>
    </div>
    <div class="w2-k5" id="det-k5" hidden></div>
    <div class="w2-bio" data-role="biotransformation" id="det-bio"></div>
    <ul class="w2-vrais" id="det-vrais"></ul>
    <div class="w2-act">${pourquoi('preuve-plans')}</div>
  </section>
  <p class="w2-pied">${conf('simule')}<span>${STUB_MOT}</span><span>· ta 16D, Nugget 60′</span>${alpha('Nugget')}</p>`;

// ---------- la preuve : comment les plans sont faits, et ce qu'on sait vraiment ----------
const E04 = (dose) => D.mesureEtude('E04', (m) => m.dose_gL === dose && /OHAI/.test(m.descripteur || ''));
const RC = { Citra: D.rapports('cas-citra.json'), Cascade: D.rapports('cas-cascade.json') };
const feuilles = feuille('preuve-plans', 'Comment les trois plans sont faits', `
  <ul class="w-pvs">${['sage', 'franc', 'ose'].map((k) => `<li class="w2-rg"><b style="color:${TEINTE[k]}">${NOMS[k]}</b> : ${REGLES[k]}.</li>`).join('')}</ul>
  <p class="w2-note">Aucun plan n’est « le bon » : les trois sont lus sur la même piste, tu choisis.</p>
  <h3>${ic('labo', 14)}Ce qui est mesuré</h3>
  <ul class="w-pvs">
    ${preuve(D.mesureEtude('E04', (m) => m.dose_gL === 2 && /linalol, part extraite/.test(m.compose || '')), { quoi: 'part du linalol extraite', qui: 'Cascade 2 g/L', note: '7 % à 16 g/L : plus tu mets, moins chaque gramme rend (saturation)' })}
    ${[2, 3.86, 8, 16].map((x) => preuve(E04(x), { quoi: 'intensité houblonnée, sur 15', qui: 'Cascade ' + fr(x, 2) + ' g/L', mot: 'panel' })).join('')}
    ${preuve(D.mesureEtude('E06', (m) => m.variete === 'Citra' && m.compose === 'linalol'), { note: 'dry hop, dose non indiquée ; le moteur, à 4 g/L, met son centre 2 à 5 fois plus haut' })}
    ${preuve(D.mesureEtude('E08', (m) => m.compose === '4-MMP'), { quoi: '4MMP, contact', qui: 'Eureka! 2,5 g/L' })}
  </ul>
  <h3>${ic('calc', 14)}Calculé : Citra et Cascade, 4 g/L, 3 j</h3>
  ${bandeLog({ compose: 'linalol', familles: ['floral', 'citrus'], ...RC.Citra.linalol, source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra', couleur: HOP.Citra.couleur })}
  ${bandeLog({ compose: 'linalol', familles: ['floral', 'citrus'], ...RC.Cascade.linalol, source: 'moteur pouvoir (fils19 cas-cascade)', qui: 'Cascade', couleur: HOP.Cascade.couleur })}
  ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...RC.Citra['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra', couleur: HOP.Citra.couleur })}
  ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...RC.Cascade['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-cascade)', qui: 'Cascade', couleur: HOP.Cascade.couleur })}
  <h3>${ic('info', 14)}Ce qu’on ne sait pas</h3>
  ${['ordre de deux ajouts', 'synergie entre deux houblons', 'masquage, par un houblon ou par la bière noire', 'perception en stout', 'une mesure qui croise variété, levure et dry hop'].map((t) => `<p class="w-trou">${inconnu(t, 'inconnu')}<span>${t}</span></p>`).join('')}
  <p class="w2-note">${conf('simule')} ${esc(D.PROFILS.mention)}</p>`);

const css = `
  .w2-envie { display: flex; align-items: center; gap: 6px; }
  .w2-lab { font-size: 14px; font-weight: 700; white-space: nowrap; }
  .w2-envies button { padding: 0 9px 0 6px; }
  .w2-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; align-items: stretch; }
  .w2-plan { display: flex; flex-direction: column; align-items: stretch; gap: 6px; text-align: left; padding: 8px 7px 9px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.14), inset 0 3px 0 var(--pl); min-width: 0; }
  .w2-plan[aria-checked="true"] { box-shadow: inset 0 0 0 2px var(--pl), 0 2px 8px rgba(0,0,0,.18); }
  .w2-pt { display: flex; align-items: center; justify-content: space-between; }
  .w2-pt b { font-size: 16px; color: var(--pl); }
  .w2-au { display: inline-flex; gap: 2px; } .w2-au i { width: 6px; height: 12px; border-radius: 2px; background: #dcdce3; } .w2-au i.on { background: var(--pl); }
  .w2-rec { display: flex; flex-direction: column; gap: 3px; font-size: 14px; }
  .w2-rec .w-hop { gap: 3px; flex-wrap: wrap; } .w2-rec .hn { font-size: 14px; }
  .w2-rec .w2-dm { display: flex; flex-wrap: wrap; gap: 2px 6px; align-items: center; font-size: 12px; }
  .w2-rec .w2-dm .mono { font-size: 12px; font-weight: 600; }
  .w2-vd .w-vd { font-size: 12px; white-space: normal; align-items: flex-start; } .w2-vd .w-vd .ic { margin-top: 1px; }
  .w2-ch { display: flex; flex-direction: column; gap: 2px; }
  .w2-ch .w-ch { font-size: 12px; } .w2-ch .w-ch b { font-size: 12px; }
  .w2-ri { display: flex; flex-wrap: wrap; gap: 3px; }
  .w2-tag { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600; padding: 1px 5px 1px 3px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait2); color: var(--gris); white-space: nowrap; }
  .w2-tag.risque { color: var(--acc); box-shadow: inset 0 0 0 1px var(--acc); }
  .w2-tag.bio { color: #6a2c91; box-shadow: inset 0 0 0 1px #6a2c91; }
  .w2-duel { display: flex; flex-direction: column; gap: 4px; }
  .w2-dt { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w2-dl { display: inline-flex; gap: 8px; flex-wrap: wrap; }
  .w2-lk { display: inline-flex; align-items: center; gap: 3px; }
  .w2-mk { width: 16px; height: 16px; border-radius: 50%; background: var(--pl); color: #fff; font: 700 12px/16px var(--sans); text-align: center; font-style: normal; display: inline-block; }
  .w2-av { width: 2px; height: 14px; background: var(--encre); display: inline-block; }
  .w2-zz { width: 14px; height: 12px; background: rgba(217,180,20,.2); border-right: 1.5px solid #856e0c; display: inline-block; }
  .w2-dr { display: grid; grid-template-columns: 16px 64px 1fr; align-items: center; gap: 6px; height: 26px; }
  .w2-dn { font-size: 12px; font-weight: 600; color: var(--t); }
  .w2-tr { position: relative; height: 22px; }
  .w2-tr::before { content: ''; position: absolute; left: 0; right: 0; top: 10px; height: 2px; background: #ececf1; }
  .w2-tz { position: absolute; left: 0; top: 4px; height: 14px; background: var(--z); border-right: 1.5px solid var(--t); }
  .w2-tv { position: absolute; top: 2px; width: 2px; height: 18px; background: var(--encre); }
  .w2-tm { position: absolute; top: 3px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: var(--pl); color: #fff; font: 700 12px/16px var(--sans); text-align: center; transition: left .25s; box-shadow: 0 0 0 1.5px #fff; }
  .w2-tm.hors { box-shadow: 0 0 0 2px var(--acc); }
  .w2-tm.dep::after { content: '›'; position: absolute; right: -9px; top: -1px; color: var(--acc); font-weight: 700; }
  body.abs .w2-tm { left: var(--a) !important; }
  .w2-det { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px 12px; border-radius: 8px; box-shadow: inset 0 0 0 2px var(--pl, #16161a); }
  .w2-h2 { font-size: 16px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .w2-regs { display: flex; flex-direction: column; gap: 6px; }
  .w2-rgl { display: grid; grid-template-columns: 58px 1fr; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .w2-regs .w-seg { flex-wrap: wrap; border-radius: 8px; } .w2-regs .w-seg button { border-radius: 8px; min-height: 30px; padding: 0 9px; }
  .w2-regs .w-seg button[aria-disabled="true"] { color: #8b8b95; text-decoration: line-through; }
  .w2-sim { display: flex; flex-direction: column; gap: 6px; }
  .w2-sim-t { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w2-st .w-vd { font-size: 14px; } .w2-cf { margin-left: auto; }
  .w2-note { font-size: 12px; color: var(--gris); display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .w2-k5 { display: flex; flex-direction: column; gap: 5px; padding: 8px 10px; border-radius: 8px; background: #f6f6f9; font-size: 12px; }
  .w2-k5 h3 { font-size: 14px; display: flex; align-items: center; gap: 6px; }
  .w2-kl { display: grid; grid-template-columns: 16px 80px 1fr 74px; gap: 6px; align-items: center; }
  .w2-kb { display: flex; height: 12px; } .w2-kb i { display: block; height: 12px; }
  .w2-kv { font: 600 12px var(--mono); text-align: right; }
  .w2-bio { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; }
  .w2-vrais { list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
  .w2-vrais li { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .w2-vrais .w-v { font-size: 12px; font-weight: 600; }
  .w2-act { display: flex; gap: 8px; }
  .w2-rg { font-size: 14px; }
  .w2-pied { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
`;

const js = `${JS_DEPLIER}
const G = ${JSON.stringify(G)}, PA = ${JSON.stringify(PA)};
const AV = SIM.AV;
const PLANS = ${JSON.stringify(PLANS)};
const NOMS = ${JSON.stringify(NOMS)}, TEINTE = ${JSON.stringify(TEINTE)};
const MOMENT = ${JSON.stringify(MOMENT)};
const HOPS = ${JSON.stringify(Object.fromEntries(D.VALEURS.houblons.map((h) => [h, { alpha: S.alpha(h), usage: S.usage(h), nom: S.nomH(h), stock: HOP[h].stock, couleur: HOP[h].couleur, huile: fr(HOP[h].huileH.min) + '–' + fr(HOP[h].huileH.max), huileSrc: HOP[h].huileH.src, mmp: D.MMP4[h] || null }])))};
const DOSES = ${JSON.stringify(D.VALEURS.doses)}, JOURS = ${JSON.stringify(D.VALEURS.jours)};
const $ = (s) => document.querySelector(s);
const pk = (a, b, m, l) => [a, b].sort().join('+') + '|' + m + '|' + l;
const ST = { envie: 'citrus', plan: 1, plans: JSON.parse(JSON.stringify(PLANS.citrus)) };
function profilDe(s) {
  if (s.h2) { const x = PA[pk(s.h, s.h2, s.m, s.l)]; return x ? { p: deplier(x.p), c: x.c, d: x.d, pa: x } : null; }
  const g = G[cle(s.h, s.m, s.d, s.m.startsWith('dry') ? s.j : '', s.l)]; return g ? { p: deplier(g.p), c: g.c, d: g.d } : null;
}
const momHtml = (m) => '<span class="w-mo" data-role="moment" data-moment="' + m + '" aria-label="Moment : ' + MOMENT[m].lg + '">' + ICO(MOMENT[m].ic, 12) + '<span>' + MOMENT[m].t + '</span></span>';
const gr = (s) => (s.h2 ? 2 * 2 * 20 : s.d * 20);
function risques(s, r) {
  const t = [];
  if (s.m === 'dryActive') t.push('<span class="w2-tag risque">' + ICO('risque', 12) + 'hop creep</span>');
  const dose = s.h2 ? 4 : s.m.startsWith('dry') ? s.d : 0;
  if (dose >= 4) t.push('<span class="w2-tag">' + ICO('huile', 12) + 'saturation</span>');
  if (s.m === 'dryActive' && (s.l === 'Pomona' || s.l === 'Verdant' || s.l === 'Diamond')) t.push('<span class="w2-tag bio">' + ICO('bio', 12) + 'biotransfo</span>');
  if (s.h2) t.push('<span class="w2-tag"><i class="w-hach"></i>synergie ?</span>');
  return t.join('');
}
function recette(s) {
  const h = '<span class="w-hop">' + HOPS[s.h].nom + HOPS[s.h].alpha + '</span>' + (s.h2 ? '<span class="w-hop"><span>+</span>' + HOPS[s.h2].nom + HOPS[s.h2].alpha + '</span>' : '');
  return h + '<span class="w2-dm"><span class="mono">' + (s.h2 ? '2 + 2' : String(s.d).replace('.', ',')) + ' g/L</span>' + momHtml(s.m) + (s.m.startsWith('dry') ? '<span class="mono">' + s.j + ' j</span>' : '') + '<span>' + s.l + '</span></span>';
}
function rendre() {
  const f = ST.envie, cartes = document.querySelectorAll('.w2-plan');
  const R = ST.plans.map((s) => profilDe(s));
  cartes.forEach((c, i) => {
    const s = ST.plans[i], r = R[i]; if (!r) return;
    c.setAttribute('aria-checked', String(i === ST.plan));
    c.querySelector('.w2-rec').innerHTML = recette(s);
    c.querySelector('.w2-rec').dataset.role = s.h2 ? 'ajout' : 'recette';
    const vd = verdict(r.p); c.querySelector('.w2-vd').innerHTML = '<span class="w-vd ' + vd.k + '" data-nature="simule">' + ICO(vd.k === 'hors' ? 'risque' : vd.k === 'bord' ? 'cible' : 'ok', 14) + '<span>~ ' + (vd.k === 'hors' ? 'sort' : vd.k === 'bord' ? 'au bord' : 'dans ta 16D') + '</span>' + vd.f.slice(0, 2).map((x) => PIC(x, 14)).join('') + '</span>';
    const x = r.p[f].inconnu ? null : r.p[f].crans - AV[f].crans;
    c.querySelector('.w2-ch').innerHTML = '<span class="w-ch" data-famille="' + f + '">' + PIC(f, 14) + '<b data-nature="simule">~ ' + deltaU(x) + '</b></span>';
    c.querySelector('.w2-ri').innerHTML = risques(s, r);
  });
  // les trois sur une même piste, famille par famille
  const fams = ORD.filter((x) => AV[x].centre <= SIM.B[x][1] && R.some((r) => r && !r.p[x].inconnu && Math.abs(r.p[x].crans - AV[x].crans) >= 0.5)).sort((a, b) => (a === f ? -1 : b === f ? 1 : 0)).slice(0, 7);
  const W = 240, px = W / 5;
  $('#duel').innerHTML = fams.map((x) => {
    const zone = (SIM.B[x][1] - SIM.B[x][0]) / SIM.C[x] * px, av = Math.min(5, AV[x].crans) * px;
    const marks = R.map((r, i) => { if (!r) return ''; const c = r.p[x].crans, s = Math.min(5, Math.max(0, c)) * px, a = Math.min(100, r.p[x].centre) / 100 * W, h = r.p[x].centre > SIM.B[x][1] && AV[x].centre <= SIM.B[x][1];
      return '<i class="w2-tm' + (h ? ' hors' : '') + (c > 5 ? ' dep' : '') + '" data-nature="simule" style="left:' + (s + (i - 1) * 3) + 'px;--a:' + (a + (i - 1) * 3) + 'px;--pl:' + TEINTE[ST.plans[i].k] + '" aria-label="' + NOMS[ST.plans[i].k] + ' : ~ ' + String(c).replace('.', ',') + ' crans">' + NOMS[ST.plans[i].k][0] + '</i>'; }).join('');
    return '<div class="w2-dr" style="--z:' + SIM.Z[x] + ';--t:' + SIM.T[x] + '">' + PIC(x, 16) + '<span class="w2-dn">' + SIM.COURT[x] + '</span><span class="w2-tr" style="width:' + W + 'px"><i class="w2-tz" style="width:' + zone + 'px"></i><i class="w2-tv" style="left:' + av + 'px"></i>' + marks + '</span></div>';
  }).join('');
  detail(R);
}
function detail(R) {
  const i = ST.plan, s = ST.plans[i], r = R[i]; if (!r) return;
  document.querySelector('.w2-det').style.setProperty('--pl', TEINTE[s.k]);
  $('#det-t').innerHTML = '<span style="color:' + TEINTE[s.k] + '">' + NOMS[s.k] + '</span><span class="w2-sep">·</span>' + HOPS[s.h].nom + (s.h2 ? ' + ' + HOPS[s.h2].nom : '') + HOPS[s.h].usage;
  // réglages du plan : ce qui se passe si tu t'en écartes
  const segH = (reg, lab, items, actif) => '<div class="w2-rgl"><span>' + lab + '</span><span class="w-seg" role="radiogroup" data-reglage="' + reg + '">' + items.map((x) => '<button type="button" role="radio" data-role="reglage" data-reglage="' + reg + '" data-v="' + x.v + '" aria-checked="' + (String(x.v) === String(actif)) + '" aria-disabled="' + !x.ok + '">' + x.t + '</button>').join('') + '</span></div>';
  const ok = (st) => !!profilDe({ ...s, ...st });
  let h = '';
  if (!s.h2) {
    h += segH('dose', 'dose', DOSES.map((x) => ({ v: x, t: x + ' g/L', ok: ok({ d: x }) })), s.d);
    if (s.m.startsWith('dry')) h += segH('jours', 'jours', JOURS.map((x) => ({ v: x, t: x + ' j', ok: ok({ j: x }) })), s.j);
    h += segH('moment', 'moment', ['b10', 'wp', 'dryActive', 'dryPost'].map((x) => ({ v: x, t: MOMENT[x].court, ok: ok({ m: x }) })), s.m);
    h += segH('levure', 'levure', [['US-05', 'dryPost'], ['US-05', 'dryActive'], ['Pomona', 'dryActive']].map(([l, m]) => ({ v: l + '|' + m, t: l + (m === 'dryActive' ? ' actif' : ' après'), ok: ok({ l, m }) })), s.l + '|' + s.m);
  } else {
    h += segH('ajout-cumule', '+ houblon', Object.keys(HOPS).filter((x) => x !== s.h).map((x) => ({ v: x, t: x, ok: ok({ h2: x }) })), s.h2);
    h += segH('moment', 'moment', ['dryActive', 'dryPost'].map((x) => ({ v: x, t: MOMENT[x].court, ok: ok({ m: x }) })), s.m);
    h += segH('levure', 'levure', ['US-05', 'Pomona', 'Verdant'].map((x) => ({ v: x, t: x, ok: ok({ l: x }) })), s.l);
  }
  $('#regs').innerHTML = h;
  majProfil($('#prof'), r.p, AV);
  $('#prof').querySelectorAll('.w-col').forEach((c) => c.classList.toggle('cible', c.dataset.famille === ST.envie));
  $('#det-vd').innerHTML = verdictHtml(r.p);
  $('#det-cf').textContent = '~ confiance ' + (r.c || '?') + ' · ' + gr(s) + ' g pour 20 L';
  // ajout cumulé : ce que chacun apporte (toute la largeur)
  $('#det-k5').hidden = !r.pa;
  if (r.pa) {
    const [a, b] = Object.keys(r.pa.ap);
    const top = ORD.map((x, k) => ({ x, k, t: (r.pa.ap[a][k] || 0) + (r.pa.ap[b][k] || 0) })).filter((y) => y.t > 0.5).sort((m, n) => n.t - m.t).slice(0, 4);
    $('#det-k5').innerHTML = '<h3>' + ICO('cumul', 14) + 'Ensemble : ce que chacun apporte</h3>' + top.map((y) => '<div class="w2-kl">' + PIC(y.x, 16) + '<span class="w2-dn" style="color:' + SIM.T[y.x] + '">' + MOTS_F[y.x] + '</span><span class="w2-kb"><i data-nature="simule" style="width:' + (r.pa.ap[a][y.k] * 2.4) + 'px;background:' + HOPS[a].couleur + '"></i><i data-nature="simule" style="width:' + (r.pa.ap[b][y.k] * 2.4) + 'px;background:' + HOPS[b].couleur + '"></i></span><b class="w2-kv" data-nature="simule">~ +' + Math.round(y.t) + ' pts</b></div>').join('')
      + '<p class="w2-note"><i style="width:10px;height:10px;background:' + HOPS[a].couleur + ';display:inline-block;border-radius:2px"></i>' + a + ' <i style="width:10px;height:10px;background:' + HOPS[b].couleur + ';display:inline-block;border-radius:2px"></i>' + b + ' · ensemble, ' + Math.round((r.pa.fs[ORD.indexOf(ST.envie)] || 1) * 100) + ' % de la somme de chacun seul (saturation partagée, ~ simulé) · synergie, masquage, ordre : inconnus</p>';
  }
  // biotransformation
  $('#det-bio').innerHTML = ICO('bio', 16) + (s.m !== 'dryActive' ? '<span class="w-inc"><i class="w-hach"></i>biotransformation : ' + (s.m.startsWith('dry') ? 'après fermentation, hors du cas documenté' : 'pas de levure au contact') + '</span>'
    : s.l === 'Pomona' ? '<b>Pomona en actif</b>' + PIC('floral', 16) + ICO('fleche', 12) + PIC('citrus', 16) + '<span>géraniol → citronellol, ~ 50 % au centre (convention, H41)</span>'
    : s.l === 'Verdant' ? '<b>Verdant en actif</b>' + PIC('tropical', 16) + '<span>thiols libérés ~ 0,1 % (<span class="w-v mono" data-nature="mesure" data-source="H42">0,01–0,35 %</span>, précurseur de synthèse)</span>'
    : '<span class="w-inc"><i class="w-hach"></i>' + s.l + ' en actif : biotransformation non publiée, centre 0 (pas une preuve d’absence)</span>');
  // les vraies valeurs du plan
  const hs = [s.h, s.h2].filter(Boolean);
  $('#det-vrais').innerHTML = hs.map((x) => '<li>' + HOPS[x].nom + HOPS[x].alpha + ICO('huile', 12) + '<span>huile</span><span class="w-v mono" data-nature="mesure" data-source="fiches : ' + HOPS[x].huileSrc + '">' + HOPS[x].huile + ' mL/100 g</span>' + (HOPS[x].mmp ? PIC('tropical', 12) + '<span>4MMP</span><span class="w-v mono" data-nature="mesure" data-source="' + HOPS[x].mmp.src + '">' + HOPS[x].mmp.txt + ' µg/kg</span>' : '<span class="w-inc"><i class="w-hach"></i>4MMP inconnu</span>') + '</li>').join('')
    + (s.m === 'dryActive' ? '<li>' + ICO('risque', 12) + '<span>hop creep</span><span class="w-v mono" data-nature="mesure" data-source="H35 · Klimczak 2023">+0,39 % vol. en 2 j</span></li>' : '');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b || b.getAttribute('aria-disabled') === 'true') return;
  const k = b.dataset.reglage, v = b.dataset.v, s = ST.plans[ST.plan];
  if (k === 'objectif') { ST.envie = v; ST.plans = JSON.parse(JSON.stringify(PLANS[v])); document.querySelectorAll('[data-reglage="objectif"] [role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else if (k === 'plan') ST.plan = Number(v);
  else if (k === 'dose') s.d = Number(v); else if (k === 'jours') s.j = Number(v); else if (k === 'moment') s.m = v; else if (k === 'levure') { const [l, m] = v.split('|'); s.l = l; if (m) s.m = m; } else if (k === 'ajout-cumule') s.h2 = v;
  rendre();
});
const q = new URLSearchParams(location.search);
if (q.get('envie')) { ST.envie = q.get('envie'); ST.plans = JSON.parse(JSON.stringify(PLANS[ST.envie])); document.querySelectorAll('[data-reglage="objectif"] [role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.v === ST.envie))); }
if (q.get('plan')) ST.plan = Number(q.get('plan'));
if (q.get('l')) ST.plans[ST.plan].l = q.get('l');
if (q.get('m')) ST.plans[ST.plan].m = q.get('m');
rendre();
`;

ecrire(path.join(ICI, 'etat.html'), page({
  titre: 'w2 · Trois plans',
  commentaire: 'Lot 21 · w2 : trois recettes nommées par leur audace (sage, franc, osé), lues sur une même piste par famille ; le plan touché s’ouvre et se règle ; profil ~ simulé (' + STUB_MOT + ').',
  corps, css, js, feuilles, demande: [{ f: 'citrus', s: 1 }],
  sim: { Z: Object.fromEntries(ORDRE.map((f) => [f, rgba(JET[f].base, 0.2)])), T: Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte])), COURT },
}));
