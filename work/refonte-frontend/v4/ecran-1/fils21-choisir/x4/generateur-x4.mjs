// Lot 21 · x4 · « Le conseiller » (chaude : la réponse d'abord, la preuve à un toucher).
// Les questions du brasseur, mot pour mot ou presque, en puces. Pour chacune : une phrase de réponse, dans son
// langage, chiffres vrais et simulés marqués ; trois plans nommés par leur audace (sage, franc, osé), jamais par
// une note ; chacun avec sa recette, ce qu'il fait à la 16D (simulé) et ses vraies valeurs. Toucher un plan : la
// 16D se redessine en haut. « Preuve » : les mesures publiées, les sources et les trous.
// Usage : node generateur-x4.mjs  →  x4/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../x1/socle-x.mjs';
import { tableReelle, BIERE, DUREE, TROUS, IBU_BIERE } from '../x1/donnees-reelles.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { HB, ORDRE, NOM, COURT, picto, ic, hn, alpha, usage, stock, pt, colonne, lentille, legende, LEGENDE_COMMUNE, page, ecrire, fr, fx } = S;
const T = tableReelle();
const G = S.grilleCompacte();
const MO = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
const LVN = { us05: 'US-05', verdant: 'Verdant', pomona: 'Pomona', diamond: 'Diamond' };
// Un plan : sa recette et son profil simulé (grille ou cas du moteur).
const depuisG = (k) => { const a = G[k]; return a && Object.fromEntries(ORDRE.map((f, i) => [f, { bas: a[4 * i], centre: a[4 * i + 1], haut: a[4 * i + 2], hp: !!a[4 * i + 3] }])); };
function plan(audace, spec) {
  let prof, ajouts, lv, cas = null;
  if (spec.cas) { cas = S.CAS.find((c) => c.id === spec.cas); prof = cas.apres; ajouts = cas.ajoutsX; lv = cas.levureX; }
  else { prof = depuisG([spec.h, spec.m, spec.dose, S.SEC(spec.m) ? spec.j : '', spec.lv].join('|')); ajouts = [{ h: spec.h, dose: spec.dose, moment: spec.m, jours: S.SEC(spec.m) ? spec.j : null, jourDebut: spec.m === 'dryActive' ? 2 : spec.m === 'dryPost' ? 7 : null }]; lv = spec.lv; }
  if (!prof) throw new Error('plan sans profil : ' + JSON.stringify(spec));
  const hors = ORDRE.filter((f) => S.AVANT[f].centre <= S.ZONES[f].bande[1] && prof[f].centre > S.ZONES[f].bande[1]);
  const gains = ORDRE.map((f) => ({ f, d: Math.round((prof[f].centre - S.AVANT[f].centre) / S.ZONES[f].cran) })).filter((x) => x.d >= 1).sort((a, b) => b.d - a.d);
  const ibu = ajouts.filter((a) => !S.SEC(a.moment)).map((a) => T.ibu[a.h + '|' + a.moment + '|' + a.dose]).filter(Boolean);
  const bio = cas && cas.biotransformation && cas.biotransformation.actif ? cas.biotransformation : null;
  return { audace, ajouts, lv, prof, hors, gains, ibu: ibu.length ? ibu.reduce((t, x) => ({ v: t.v + x.v, min: t.min + x.min, max: t.max + x.max, src: x.src }), { v: 0, min: 0, max: 0 }) : null,
    sat: cas && cas.saturation && cas.saturation.facteur ? cas.saturation.facteur : null, bio: bio ? (bio.parAjout || []).map((a) => a.citronellol_ugL).filter(Boolean).reduce((t, c) => [t[0] + c.bas, t[1] + c.centre, t[2] + c.haut], [0, 0, 0]) : null,
    deux: new Set(ajouts.map((a) => a.h)).size >= 2, suite: ajouts.length >= 2 && ajouts[0].jourDebut !== ajouts[1].jourDebut };
}
const P = (k, m, dose, j = 3, lv = 'us05') => ({ h: k, m, dose, j, lv });
const v = (k, m, f, dose = 4, j = 3) => depuisG([k, m, dose, S.SEC(m) ? j : '', 'us05'].join('|'))[f].centre;
const R1 = (x) => Math.round(x);
const mmpCitra = S.VSIM.cas.find((c) => c.id === 'K1-citra-dryPost').mesures.find((m) => m.compose === '4MMP' && m.houblon === 'Citra').rapportBaseCommune.plage;
const mmpCascade = S.VSIM.cas.find((c) => c.id === 'K1-cascade-dryPost').mesures.find((m) => m.compose === '4MMP' && m.houblon === 'Cascade').rapportBaseCommune.plage;
const k3 = S.CAS.find((c) => c.id === 'K3-citra3-galaxy7');
const ibu60 = T.ibu['citra|b60|4'], ibu10 = T.ibu['citra|b10|4'];
// Les questions et leurs réponses : chaque chiffre vient des données ; « ~ » marque le simulé.
const Q = [
  { id: 'cascade', q: '« Citra ou Cascade en dry hop ? »',
    rep: `Sur le papier, presque pareils (agrumes ${vv('92 contre 85', 'YCH, panel sur houblon broyé [1] [2]', 'panel')}). En dry hop, Citra porte ${vv('≈ ×2 d’huile', 'H §1.1 [1] [2] [7]', 'fiche')} et bien plus de ${picto('tropical', 14)}4MMP : à 4 g/L il sort ta 16D (agrumes ${ss('~' + R1(v('citra', 'dryPost', 'citrus')))} contre ${ss('~' + R1(v('cascade', 'dryPost', 'citrus')))}), Cascade non.`,
    plans: [plan('sage', P('cascade', 'dryPost', 2)), plan('franc', P('cascade', 'dryPost', 4)), plan('osé', P('citra', 'dryPost', 4))],
    preuve: ['4MMP au seuil, 4 g/L : Citra ' + '×' + fx(mmpCitra.min, 'bas') + '–' + fx(mmpCitra.max, 'haut') + ', Cascade ×' + fx(mmpCascade.min, 'bas') + '–' + fx(mmpCascade.max, 'haut') + ' (moteur, base commune)', 'Citra en bière : ' + BIERE.citra[0].txt + ' (' + BIERE.citra[0].src + ')', 'trou : ' + TROUS[0]] },
  { id: 'moment', q: '« Pourquoi à 10′ pas à 60′ ? »',
    rep: `À 60′, l’arôme part en vapeur (${picto('tropical', 14)}${vv('4MMP −91 %', 'Kishimoto 2008 [13]', 'publié')}) et l’amertume reste : 4 g/L de Citra ajoutent ${vv('~' + ibu60.v + ' IBU', ibu60.src, 'calcul')}, ta 16D passe de ${R1(IBU_BIERE.v)} à ${R1(IBU_BIERE.v + ibu60.v)} pour 50–70. À 10′, il reste de l’arôme (agrumes ${ss('~' + R1(v('citra', 'b10', 'citrus')))} contre ${ss('~' + R1(v('citra', 'b60', 'citrus')))}), avec ${vv('+' + ibu10.v + ' IBU', ibu10.src, 'calcul')}.`,
    plans: [plan('sage', P('citra', 'b10', 1)), plan('franc', P('citra', 'wp', 2)), plan('osé', P('citra', 'b10', 4))],
    preuve: ['IBU de ma stout : ' + fr(IBU_BIERE.v) + ' (calcul de l’app, c1)', 'linalol retrouvé : 60–63 % en ajout tardif, 44–82 % en dry hop (Gahr 2019 [30], Tusha 2022 [31])', 'à 60′, aucun taux de transfert publié pour l’arôme : la borne basse est inconnue'] },
  { id: 'galaxy', q: '« 3 j Citra, puis 7 j Galaxy ? »',
    rep: `Faisable, mais Galaxy n’apporte rien de mesuré après ses 3 premiers jours (${vv('l’essentiel en 2 j', DUREE[0].src, 'mesuré')}). Ensemble, les deux font ${ss('~' + Math.round(k3.saturation.facteur.citrus * 100) + ' %')} de la somme des deux seuls en agrumes : la cuve sature. L’ordre et la synergie : ${'<span class="inc" data-inconnu><i class="hach"></i>inconnus</span>'}.`,
    plans: [plan('sage', P('citra', 'dryPost', 2)), plan('franc', { cas: 'K3-citra3-galaxy7' }), plan('osé', { cas: 'K5-citra+galaxy-apres-us05' })],
    preuve: ['Galaxy : ' + BIERE.galaxy[0].detail, 'au-delà de 3 j : pas d’arôme mesuré en plus (Wolfe 2012 [73])', 'hop creep : +0,92 % vol. à 10 g/L, 7 j (Young, Fox 2025 [68])'] },
  { id: 'idaho7', q: '« 3 j Citra, puis 5 j Idaho 7 ? »',
    rep: `Faisable. En fermentation active avec Pomona, le géraniol d’Idaho 7 peut passer en citronellol (${vv('« medium »', 'Escarpment Labs, Pomona [51]', 'fiche')}) : un peu moins de floral, un peu plus d’agrumes ${ss('~')}. Après fermentation, la levure ne fait presque plus rien. Idaho 7 n’a qu’${vv('une seule étude en bière', 'recherche J (E03)', 'publié')}.`,
    plans: [plan('sage', P('idaho7', 'dryPost', 2)), plan('franc', { cas: 'K4-us05-apres' }), plan('osé', { cas: 'K4-pomona-actif' })],
    preuve: ['Idaho 7 en bière : ' + BIERE.idaho7[0].txt + ', ' + BIERE.idaho7[0].detail + ' (' + BIERE.idaho7[0].src + ', à vérifier)', 'thiols libérés : 0,01–0,35 % sur précurseur synthétique (Christiaens 2025 [42])', 'le moteur donne Idaho 7 probablement trop bas : 3MH et 3M4MP connus en somme seulement'] },
  { id: 'ensemble', q: '« Deux houblons ensemble ? »',
    rep: `Deux houblons dans le même dry hop partagent la saturation : c’est la dose totale qui compte (${vv('zone 4–8 g/L', 'Lafontaine, Shellhammer 2018 [22]', 'publié')}). À 2 + 2 g/L, chacun apporte moins que seul ${ss('~')} ; la synergie et le masquage sont ${'<span class="inc" data-inconnu><i class="hach"></i>inconnus</span>'}.`,
    plans: [plan('sage', { cas: 'K5-citra+cascade-apres-us05' }), plan('franc', { cas: 'K5-citra+idaho-7-apres-us05' }), plan('osé', { cas: 'K5-citra+galaxy-apres-us05' })],
    preuve: ['Cascade, 2 → 16 g/L : linalol extrait 23 % → 7 % (Lafontaine 2018, E04)', 'aucune étude ne mesure deux variétés ensemble à dose égale', TROUS[3]] },
  { id: 'levure', q: '« Quelle levure pour mon dry hop ? »',
    rep: `La levure n’agit que si le houblon entre pendant la fermentation active. Pomona : géraniol → citronellol ${vv('« medium »', 'Escarpment Labs [51]', 'fiche')} ; Verdant : thiols libérés, ampleur ${'<span class="inc" data-inconnu><i class="hach"></i>inconnue</span>'} ; Diamond : plus de thiols mesurés, fruité perçu le plus faible. ${vv('Aucune mesure ne croise variété, levure et dry hop', 'recherche J', 'publié')}.`,
    plans: [plan('sage', { cas: 'K4-us05-apres' }), plan('franc', { cas: 'K4-pomona-actif' }), plan('osé', { cas: 'K4-verdant-actif' })],
    preuve: ['thiols libérés : 0,01–0,35 % sur précurseur synthétique (Christiaens 2025 [42])', 'Verdant et Diamond : même convention dans le moteur (0,1 %) ; l’écart de Diamond est un drapeau, pas un chiffre', 'hop creep : il faut une levure vivante (Young, Fox 2025 [68])'] },
];
function vv(t, src, mot) { return `<span class="vv" data-nature="mesure" data-source="${S.esc(src)}">${t}<span class="mot-c mot-${mot}">${mot}</span></span>`; }
function ss(t) { return `<span class="vs" data-nature="simule">${t}</span>`; }
const DEF = { q: 'cascade', p: 1 };
const corps = `
  <header class="tete"><h1>Ta question</h1>${lentille()}${legende([...LEGENDE_COMMUNE, ['sage · franc · osé', 'trois plans nommés par leur audace, pas une note']])}</header>
  <div class="qs" role="radiogroup" aria-label="Les questions">${Q.map((x) => `<button class="qb" role="radio" data-role="reglage" data-reglage="${x.id === 'ensemble' ? 'ajout-cumule' : x.id === 'levure' ? 'levure' : 'question'}" data-v="${x.id}" aria-checked="${x.id === DEF.q}">${x.q}</button>`).join('')}</div>
  <section class="rep" aria-live="polite"><p class="rep-t" data-role="reponse"></p></section>
  <section class="apercu" data-role="simulation" aria-label="Ma 16D avec ce plan">
    <div class="ap-t"><span class="estime">~ simulé</span><span>ma 16D avec le plan</span><b data-role="ap-plan"></b></div>
    <div class="cols" data-role="barres">${ORDRE.map((f) => colonne(f, S.AVANT[f])).join('')}</div>
  </section>
  <section class="plans" data-role="plans" aria-label="Trois plans"></section>
  <div class="rp"><button class="rp-s" data-role="repli" aria-expanded="false" aria-controls="preuve">${ic('livre', 14)}<span>La preuve : mesures, sources, trous</span><svg class="chev" width="12" height="12" aria-hidden="true"><use href="#i-chev-r-12"/></svg></button><div class="preuve" id="preuve" hidden data-role="preuve"></div></div>
  <div class="choix" data-role="choix"></div>`;

const css = `
  .qs { display: flex; flex-wrap: wrap; gap: 6px; }
  .qb { min-height: 32px; padding: 4px 10px; border-radius: 16px; background: var(--piste); font-size: 13px; color: var(--encre); text-align: left; }
  .qb[aria-checked="true"] { background: var(--encre); color: #fff; font-weight: 600; }
  .rep { background: var(--doux); border-radius: 8px; padding: 10px 12px; }
  .rep-t { font-size: 16px; line-height: 1.45; }
  .rep-t .vv { font: 600 16px var(--sans); white-space: normal; display: inline; }
  .rep-t .vv .mot-c { margin-left: 3px; }
  .rep-t .vs { font-size: 14px; }
  .rep-t svg.pi { display: inline-block; vertical-align: -2px; margin-right: 2px; }
  .apercu { display: flex; flex-direction: column; gap: 4px; }
  .ap-t { display: flex; align-items: baseline; gap: 6px; font-size: 13px; flex-wrap: wrap; }
  .cols { padding: 14px 2px 0; }
  .plans { display: flex; flex-direction: column; gap: 8px; }
  .pl { display: grid; grid-template-columns: 1fr; gap: 4px; padding: 8px 10px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait2); text-align: left; width: 100%; }
  .pl[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .pl-t { display: flex; align-items: center; gap: 6px; }
  .au { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; }
  .au i { display: inline-block; width: 7px; height: 14px; border-radius: 2px; background: var(--trait2); }
  .au i.on { background: var(--encre); }
  .pl-r { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 13px; }
  .pl-h { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
  .pl-s { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 13px; }
  .pl-s .dl { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .pl-v { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 12px; }
  .pl .ok { margin-left: auto; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
  .dans { color: var(--gris); font-size: 12px; }
  .preuve li { margin-left: 16px; }
  .choix { position: sticky; bottom: 0; z-index: 20; background: #fff; box-shadow: 0 -6px 16px -8px rgba(0,0,0,.25); border-radius: 8px 8px 0 0; padding: 8px 10px; font-size: 13px; display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; }`;

const vraiP = (t, src, mot, cls = 'vv') => `<span class="${cls}" data-nature="mesure" data-source="${S.esc(src)}">${t}${mot ? `<span class="mot-c mot-${mot}">${mot}</span>` : ''}</span>`;
const nAud = { sage: 1, franc: 2, 'osé': 3 };
function carte(qid, i, p) {
  const recette = p.ajouts.map((a, j) => `${j && p.suite ? '<span class="gris">puis</span>' : j ? '<span class="gris">+</span>' : ''}<span class="pl-h" data-voie="${a.h}">${pt(a.h)}${hn(a.h)}${alpha(a.h, { fiches: false })}${usage(a.h)}<span>${a.dose} g/L · ${MO[a.moment]}${a.jours ? ' · ' + a.jours + ' j' : ''}</span></span>`).join('');
  const lv = p.ajouts.some((a) => S.SEC(a.moment)) ? `<span class="gris">${LVN[p.lv]}</span>` : '';
  const gains = p.gains.slice(0, 3).map((x) => `<span class="dl" data-nature="simule">${picto(x.f, 14)}${COURT[x.f]} ~ +${x.d} cran${x.d > 1 ? 's' : ''}</span>`).join('');
  const style = p.hors.length ? `<span class="xs">hors du style : ${p.hors.map((f) => COURT[f]).join(', ')}</span>` : '<span class="dans">~ dans la 16D</span>';
  const huile = p.ajouts.filter((a, j, xs) => xs.findIndex((y) => y.h === a.h) === j).map((a) => { const d = p.ajouts.filter((y) => y.h === a.h).reduce((t, y) => t + y.dose, 0); return vraiP(HB[a.h].nom + ' ' + fr(HB[a.h].huile[0] * d) + '–' + fr(HB[a.h].huile[1] * d) + ' mL/hL', HB[a.h].huileSrc + ' ; huile × dose', 'calcul'); }).join('');
  const ibu = p.ibu ? vraiP(R1(IBU_BIERE.v) + ' → ' + R1(IBU_BIERE.v + p.ibu.v) + ' IBU', p.ibu.src, 'calcul') + (IBU_BIERE.v + p.ibu.v > 70 ? '<span class="xs">trop amer</span>' : '') : '';
  const sat = p.sat ? `<span data-nature="simule">~ agrumes ${Math.round(p.sat.citrus * 100)} % de la somme</span>` : '';
  const bio = p.bio ? `<span data-role="biotransformation" class="pl-r">${picto('floral', 12)}${ic('fleche', 12)}${picto('citrus', 12)}<span data-nature="simule">~${Math.round(p.bio[1])} µg/L de citronellol (0 à ${Math.round(p.bio[2])})</span></span>` : '';
  const aj = p.deux ? ' data-role="ajout"' : '';
  return `<button class="pl" data-role="reglage" data-reglage="plan" data-q="${qid}" data-i="${i}" aria-pressed="false"${aj}>
    <span class="pl-t"><span class="au">${[1, 2, 3].map((n) => `<i class="${n <= nAud[p.audace] ? 'on' : ''}"></i>`).join('')}${p.audace}</span>${style}<span class="ok" data-role="ok"></span></span>
    <span class="pl-r">${recette}${lv}</span>
    <span class="pl-s">${gains || '<span class="dl" data-nature="simule">~ presque rien ne bouge</span>'}${sat}</span>
    ${bio}<span class="pl-v">${huile}${ibu}</span></button>`;
}
const PROF = {}; for (const x of Q) x.plans.forEach((p, i) => { PROF[x.id + '|' + i] = Object.fromEntries(ORDRE.map((f) => [f, p.prof[f]])); });
const js = `
${S.JS_SIM}
const D = window.DONNEES; const ST = ${JSON.stringify(DEF)};
function rendre() {
  document.querySelectorAll('.qs [data-v]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === ST.q)));
  const Q = D.q[ST.q];
  document.querySelector('[data-role="reponse"]').innerHTML = Q.rep;
  document.querySelector('[data-role="plans"]').innerHTML = Q.cartes.join('');
  document.querySelector('[data-role="preuve"]').innerHTML = '<ul>' + Q.preuve.map((x) => '<li data-nature="mesure" data-source="' + x.replace(/"/g, '&quot;') + '">' + x + '</li>').join('') + '</ul>';
  const p = D.prof[ST.q + '|' + ST.p];
  document.querySelectorAll('[data-col]').forEach((c) => SIMX.poser(c, c.dataset.col, p[c.dataset.col]));
  document.querySelector('[data-role="ap-plan"]').textContent = ['sage', 'franc', 'osé'][ST.p];
  document.querySelectorAll('[data-reglage="plan"]').forEach((b) => { const on = Number(b.dataset.i) === ST.p; b.setAttribute('aria-pressed', String(on)); b.querySelector('[data-role="ok"]').innerHTML = on ? '<svg class="ic" width="14" height="14" aria-hidden="true"><use href="#i-check-14"/></svg>affiché' : 'voir'; });
  document.querySelector('[data-role="choix"]').innerHTML = '<b>Ton plan</b><span>' + ['sage', 'franc', 'osé'][ST.p] + '</span><span class="gris">' + D.q[ST.q].resume[ST.p] + '</span>';
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-reglage]'); if (!b) return;
  if (b.closest('.qs')) { ST.q = b.dataset.v; ST.p = 1; }
  if (b.dataset.reglage === 'plan') ST.p = Number(b.dataset.i);
  rendre(); });
document.querySelector('[data-role="repli"]').addEventListener('click', (e) => { const b = e.currentTarget, o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(o)); document.getElementById('preuve').hidden = !o; });
const q = new URLSearchParams(location.search); if (q.get('q')) ST.q = q.get('q'); if (q.get('p')) ST.p = Number(q.get('p')); if (q.has('preuve')) setTimeout(() => document.querySelector('[data-role="repli"]').click(), 0);
rendre();`;
const resume = (p) => p.ajouts.map((a) => HB[a.h].nom + ' ' + a.dose + ' g/L ' + MO[a.moment] + (a.jours ? ' ' + a.jours + ' j' : '')).join(p.suite ? ' puis ' : ' + ') + (p.ajouts.some((a) => S.SEC(a.moment)) ? ' · ' + LVN[p.lv] : '') + ' · ' + (p.hors.length ? 'hors du style' : 'dans la 16D') + ' (simulé)';
const donnees = { prof: PROF, q: Object.fromEntries(Q.map((x) => [x.id, { rep: x.rep, cartes: x.plans.map((p, i) => carte(x.id, i, p)), preuve: x.preuve, resume: x.plans.map(resume) }])) };
ecrire(path.join(ICI, 'etat.html'), page({ titre: 'x4 · Le conseiller', commentaire: 'Lot 21 · x4 : la question du brasseur, une réponse en une phrase (vrai et simulé marqués), trois plans sage, franc, osé avec leur effet simulé sur la 16D et leurs vraies valeurs, la preuve à un toucher.', css, corps, js, donnees }));
