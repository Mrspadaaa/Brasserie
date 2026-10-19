// Lot 21 · v1b · seconde passe de v1, « Le duel à dose égale » (retenue par le critique, 20.10).
// Les retouches communes (critique/SYNTHESE.md §3) et celles de v1 (§1, §4) :
//   - départ en dry hop ACTIF avec US-05 (K4) ; « après » à un toucher ; la levure au repos se dit, pas de
//     bouton mort ; Verdant et Diamond, non simulées pour un houblon seul, se disent une fois ;
//   - les données restent, l'explication part : la réponse en une ligne, le reste à un toucher ;
//   - sous la phrase, le verdict dans ma 16D et l'équivalence (« il faudrait ~N g/L de Cascade ») ;
//   - « 4MMP, même méthode » et « non départagés » (e2) ; « 75 % : mots et parts d'huile » (u1) ;
//     l'escalier papier → verre (x2) en lignes du duel ; le curseur de mélange (u6) sur le profil ;
//   - une seule marque de borne haute partielle par barre, la plage en pâle ; le résineux de la
//     dégustation une fois, hors de la figure ; aucun code sans mot ; Lafontaine 2018 lu par H, vérifié (K) ;
//   - les trois blocs à un toucher : le défi de ta dégustation (x5), « Tire une bière » (y5), la feuille
//     « preuves » (u5) ;
//   - profils-simules.json régénéré à 4,75 % vol., comparatifs-dryhop.json corrigé (E04 relu).
// v1 reste intacte. Le socle de v1 est importé, pas modifié.
// Usage : node generer.mjs  →  v1b/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CH, C1, MOTEUR, HOPS, QUATRE, STY, PS, LEV, SIMU, VERIF, COURT, JET, ORDRE, etude, SRC, srcNom, fr, plg, esc, conf, ic, pic, pics, hn, alpha, usage, stock,
  barre, lentille, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, LEG_PISTE, page, ecrire, CLIENT, REPO } from '../v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// ---------- les vraies valeurs de chaque houblon (comme v1) ----------
const centre = (a, b) => (a != null && b != null ? (a + b) / 2 : null);
const YCH = { // Panel Yakima Chief sur houblon broyé, T-90, 0–100 (H §1.1 et §7.1 [1] [2] [3]) : Galaxy non distribué par YCH.
  Citra: { citrus: 92, tropical: 78 }, Cascade: { citrus: 85, tropical: 73 }, 'Idaho 7': { citrus: 97, tropical: 93 },
};
function valeurs(nom) {
  const H = HOPS[nom], V = CH.varietes[H.cle];
  const aj = MOTEUR(H.cas).pouvoir.ajouts.find((x) => x.nom === nom);
  const t = (k) => { const p = aj.composes[k].teneur; return { min: p.plage.min, c: p.plage.central, max: p.plage.max, src: p.sources, base: p.base }; };
  const lots = (k) => (V.lots || []).filter((l) => l.composes && l.composes[k] != null).map((l) => ({ id: l.id, v: l.composes[k], an: l.recolte, src: l.sources }));
  const mmp = V.composes['4MMP'].valeurs.find((v) => v.portee === 'variété');
  const rap = (k, bc) => { const c = aj.composes[k]; const r = (bc && c.baseCommune && c.baseCommune.rapport) ? c.baseCommune.rapport : c.rapport; const p = r && (r.plage || r); return p ? { min: p.min, c: p.central, max: p.max, bc: !!(bc && c.baseCommune && c.baseCommune.rapport) } : null; };
  return {
    niveaux: HOPS[nom].niveaux,
    ych: YCH[nom] ? { min: YCH[nom].citrus, c: YCH[nom].citrus, max: YCH[nom].citrus, src: ['H1', 'H2', 'H3'], base: 'panel Yakima Chief sur houblon broyé, T-90, agrumes sur 100 (tropical ' + YCH[nom].tropical + ')', lots: [] } : { min: null, c: null, max: null, src: ['H'], base: 'pas de profil YCH publié', lots: [], inconnu: true },
    thiols: { min: mmp.plage[0], c: centre(mmp.plage[0], mmp.plage[1]), max: mmp.plage[1], src: mmp.sources, base: mmp.texte, lots: lots('4MMP') },
    linalol: { ...t('linalol'), lots: lots('linalol') },
    farnesene: { ...t('farnesene'), lots: lots('farnesene') },
    myrcene: { ...t('myrcene'), lots: lots('myrcene') },
    huile: { min: aj.huile.plage.min, c: aj.huile.plage.central, max: aj.huile.plage.max, src: aj.huile.sources, base: aj.huile.base, lots: (V.lots || []).filter((l) => l.huile != null).map((l) => ({ id: l.id, v: l.huile, an: l.recolte, src: l.sources })) },
    moteur: { thiols: rap('4MMP', true), linalol: rap('linalol'), myrcene: rap('myrcene') },
    panel: (V.panel || []).map((p) => ({ texte: p.texte, src: p.sources })),
  };
}
const DATA = Object.fromEntries(QUATRE.map((n) => [n, valeurs(n)]));
// Les lignes du duel, du papier au cône (l'escalier de x2) : les mots, le panel sur houblon broyé, puis par gramme.
const ROWS = [
  { id: 'ych', fams: ['citrus'], nom: 'Houblon frotté', tag: '', unite: 'agrumes sur 100, panel YCH', papier: true },
  { id: 'thiols', fams: ['tropical', 'berries'], nom: 'Tropicaux, baies', tag: '4MMP, même méthode', unite: 'µg/kg' },
  { id: 'linalol', fams: ['floral', 'citrus'], nom: 'Floral, agrumes', tag: 'linalol', unite: '% huile' },
  { id: 'farnesene', fams: ['green', 'herbal'], nom: 'Végétal, herbacé', tag: 'farnésène', unite: '% huile' },
  { id: 'myrcene', fams: ['resin', 'green'], nom: 'Résineux, végétal', tag: 'myrcène', unite: '% huile' },
  { id: 'huile', fams: [], nom: 'Huile', tag: '', unite: 'mL/100 g' },
];
// « Notre outil » : la substitution calculée v1 du pack (Citra cryo, la fiche de la variété Citra).
const SUBST = {};
for (const f of lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons) {
  const sc = f.substitutsCalcules; if (!sc) continue;
  const de = f.name === 'Citra cryo' ? 'Citra' : f.name;
  for (const r of [...(sc.remplacants || []), ...(sc.enStock || [])]) if (QUATRE.includes(de) && QUATRE.includes(r.name) && r.name !== de) SUBST[de + '|' + r.name] = { score: r.score, c: r.composantes, palier: r.palier };
}
const SRCN = Object.fromEntries(Object.keys(SRC).map((k) => [k, srcNom(k) + ' · ' + (SRC[k].niveau || '')]));

// ---------- le simulé : la grille (un houblon) et les paires (deux ensemble), avec le drapeau « haut partiel » ----------
const r4 = (ap) => Object.fromEntries(ORDRE.map((f) => { const a = ap[f]; return [f, [Math.round(a[0] * 10) / 10, Math.round(a[1] * 10) / 10, Math.round(a[2] * 10) / 10, a[5] ? 1 : 0]]; }));
const GR = SIMU.grille.filter((g) => QUATRE.includes(g.nom) && (g.moment === 'dryActive' || g.moment === 'dryPost') && g.jours === 3 && (g.dose_gL === 1 || g.dose_gL === 4)).map((g) => ({ n: g.nom, m: g.moment, d: g.dose_gL, l: g.levure, p: r4(g.apres), c: g.confiance }));
const PA = SIMU.grillePaires.filter((g) => g.noms.every((n) => QUATRE.includes(n))).map((g) => ({ n: g.noms, m: g.moment, l: g.levure, p: r4(g.apres), fs: g.facteurSaturation, c: g.confiance }));
const AV = Object.fromEntries(ORDRE.map((f) => [f, { c: SIMU.biere.avant[f].centre, inconnu: !!SIMU.biere.avant[f].inconnu, source: SIMU.biere.avant[f].source }]));
const DEG = SIMU.biere.degustation;
// La courbe du moteur (PROFIL-SIMULE.md §3) : points = P × x ÷ (x + K), P = 26 × (3,86 + K) ÷ 3,86.
const KC = Object.fromEntries(ORDRE.map((f) => [f, f === 'citrus' ? 4.5 : f === 'herbal' || f === 'green' ? 16 : 5.6]));
const COURBE = { K: KC, P: Object.fromEntries(ORDRE.map((f) => [f, (26 * (3.86 + KC[f])) / 3.86])) };
const LEVN = Object.fromEntries(Object.entries(LEV).map(([k, id]) => [k, CH.levures[id].nom]));
const LEVF = Object.fromEntries(Object.entries(LEV).map(([k, id]) => { const L = CH.levures[id]; return [k, { nom: L.nom, esters: L.esters, gc: L.geraniolCitronellol, betaLyase: L.betaLyase, notes: L.notes, src: L.sources }]; }));

// ---------- en bière, mesuré : dose connue d'abord, « dose non publiée » une fois ----------
const E02 = etude('E02'), E03 = etude('E03'), E06 = etude('E06'), E01 = etude('E01'), E04 = etude('E04');
const lin = (e, v) => e && e.mesures.find((m) => m.variete === v && m.compose === 'linalol');
const kish = CH.varietes['beermaverick-cascade'].mesuresEnBiere.find((m) => m.id === 'kishimoto-linalol');
const tch = E02 ? E02.mesures.filter((m) => m.compose === 'linalol' && !/témoin/.test(m.variete)) : [];
const pl = (x) => Math.max(0, Math.min(100, ((Math.log10(x) - 1) / 2) * 100));
const SEUILS = CH.seuils.linalol.valeurs.map((v) => v.plage[0]);
const dot = (p) => { const col = p.hop ? HOPS[p.hop].couleur : '#8a8a96'; const m = p.min != null ? `<i class="dp-b" style="left:${pl(p.min)}%;width:${pl(p.max) - pl(p.min)}%;--hc:${col}"></i>` : `<i class="dp-p" style="left:${pl(p.v)}%;--hc:${col}"></i>`; const v = p.min != null ? fr(p.min) + '–' + fr(p.max) : fr(p.v); return `<div class="dp-l"><span class="dp-n">${p.hop ? hn(p.hop) : esc(p.nom)}${p.cond ? `<small>${esc(p.cond)}${p.verif ? ' · <b class="averif">à vérifier</b>' : ''}</small>` : ''}</span><span class="dp-t">${m}</span><span class="vm dp-v" data-nature="mesure" data-source="${esc(p.src)}">${v}</span><span class="dp-src">${esc(p.src)}</span></div>`; };
const connus = [
  { nom: 'Cascade', hop: 'Cascade', v: kish.plage[0], cond: '2 g/L, moût refroidi', src: kish.sources[0] },
  tch.length && { nom: '5 tchèques', min: Math.min(...tch.map((m) => m.valeur)), max: Math.max(...tch.map((m) => m.valeur)), cond: 'même huile visée, 30 j', src: 'E02' },
  E03 && { nom: 'Idaho 7', hop: 'Idaho 7', v: lin(E03, 'Idaho-7').valeur * 1000, cond: 'au pitch, semi-quantifié', src: 'E03', verif: true },
].filter(Boolean);
const e06 = E06 ? [['Citra', 'Citra'], ['Centennial'], ['Nelson Sauvin'], ['témoin (sans houblon)']].map(([v, hop]) => { const m = lin(E06, v); return m && { nom: v.replace(' (sans houblon)', ', sans houblon'), hop, v: m.valeur, src: 'E06' }; }).filter(Boolean) : [];
const biere = `
  <section class="carte" aria-label="En bière, ce qui est mesuré">
    <h2>${pics(['floral', 'citrus'], 16)}Linalol en bière ${conf('mesure')}<small>µg/L</small></h2>
    <div class="dp">
      <div class="dp-ax mono" aria-hidden="true">${[10, 30, 100, 300, 1000].map((m) => `<span style="left:${pl(m)}%">${m}</span>`).join('')}</div>
      <div class="dp-z"><i class="dp-s" style="left:0;width:${pl(Math.max(...SEUILS))}%"></i></div>
      <div class="dp-g">dose connue</div>
      ${connus.map(dot).join('')}
      <div class="dp-g">E06, dose non publiée</div>
      ${e06.map(dot).join('')}
    </div>
    <details class="det"><summary>${ic('info', 14)}Lire ces points ${ic('bas2', 14)}</summary><div class="det-c">
      <span>Pâle : les seuils publiés du linalol, de ${fr(Math.min(...SEUILS))} à ${fr(Math.max(...SEUILS))} µg/L (H §8.1). Doses et bières diffèrent : ces points ne se classent pas.</span>
      ${E01 ? `<span>E01 : cinq bières de Citra et d’autres, ${esc(E01.mesures[0].valeur)} µg/L (résumé).</span>` : ''}
      <span>Le moteur place le centre du linalol de Citra 2 à 5 fois au-dessus de ces mesures (PROFIL-SIMULE.md).</span></div></details>
    <div class="trou">${ic('inconnu', 14)}<span><b>Citra contre Cascade, même dose, même bière : aucune étude.</b> Galaxy : rien de chiffré en bière.</span></div>
  </section>`;

// ---------- la feuille « preuves » (u5) : le mur des mesures, la simulation rejouée, Lafontaine (K), les trous ----------
const COMP = lire(path.join(path.dirname(ici), 'donnees/comparatifs-dryhop.json'));
const MUR = QUATRE.map((n) => {
  const re = new RegExp('^' + n.replace(' ', '[- ]') + '\\b', 'i');
  const pub = COMP.etudes.flatMap((e) => e.mesures.filter((m) => re.test(m.variete || '') && typeof m.valeur === 'number' && /^(µg|ng|mg)\/L$/.test(m.unite)).map((m) => ({ c: m.compose || m.descripteur, v: m.valeur, u: m.unite, e: e.id, verif: /vérifier/.test((m.lecture || '') + ' ' + (m.note || '')) })));
  const ch = (CH.varietes[HOPS[n].cle].mesuresEnBiere || []).map((m) => ({ c: m.compose, v: m.plage[0] === m.plage[1] ? m.plage[0] : m.plage[0] + '–' + m.plage[1], u: m.unite, e: m.sources[0] }));
  return { n, mes: [...ch, ...pub] };
});
const K = E04 ? E04.mesures.filter((m) => m.unite === 'points') : [];
const serieK = (f) => K.filter((m) => m.famille === f).map((m) => fr(m.valeur));
const preuve = `
  <div class="pvx-v" data-role="preuve-voile" hidden></div>
  <section class="pvx" id="preuve" data-role="preuve" role="dialog" aria-label="Les preuves" hidden>
    <div class="leg-t"><span>Les preuves</span><button class="leg-x" data-role="preuve-fermer" aria-label="Fermer les preuves">${ic('x', 18)}</button></div>
    <div class="pvx-s"><h3>Le mur des mesures en bière</h3>
      ${MUR.map((h) => `<div class="pvx-h">${hn(h.n)} ${h.mes.length ? h.mes.map((m) => `<span class="pvx-m"><span class="vm" data-nature="mesure" data-source="${esc(m.e)}">${esc(typeof m.v === 'number' ? fr(m.v) : String(m.v).replace('.', ','))}</span> ${esc(m.u)} ${esc(String(m.c).split(',')[0])} <span class="gris">${esc(m.e)}</span>${m.verif ? ' <b class="averif">à vérifier</b>' : ''}</span>`).join('') : '<span class="inc" data-inconnu="aucune mesure en bière" data-source="J">inconnu</span> rien de chiffré en bière'}</div>`).join('')}
    </div>
    <div class="pvx-s"><h3>La simulation tombe-t-elle juste ?</h3>
      ${VERIF.verifications.map((v) => `<div class="pvx-h"><b>${esc(v.houblon)}, ${esc(v.compose)}</b> : mesuré <span class="vm" data-nature="mesure" data-source="${esc(v.sources.join(' '))}">${fr(v.mesure.min)}${v.mesure.max !== v.mesure.min ? '–' + fr(v.mesure.max) : ''} ${esc(v.unite)}</span>, calculé ${v.calcul.min == null ? '≤ ' + fr(v.calcul.max) : fr(v.calcul.min) + '–' + fr(v.calcul.max)} : <span class="${/sous la mesure/.test(v.verdict) ? 'hst' : ''}">${esc(v.verdict)}</span></div>`).join('')}
    </div>
    <div class="pvx-s"><h3>La saturation, mesurée (Lafontaine 2018, vérifié K)</h3>
      <div class="pvx-h">Cascade, 0 à 16 g/L, 24 h, sur 15 : agrumes <span class="vm" data-nature="mesure" data-source="E04 K">${serieK('citrus').join(' → ')}</span> (ils plafonnent) ; herbacé/thé <span class="vm" data-nature="mesure" data-source="E04 K">${serieK('herbal').join(' → ')}</span> (il monte).</div>
      <div class="pvx-h">Part du linalol extraite : <span class="vm" data-nature="mesure" data-source="E04">23 % à 2 g/L → 7 % à 16 g/L</span>.</div>
    </div>
    <div class="pvx-s"><h3>Les trous</h3>
      <div class="pvx-h">Aucune étude ne mesure Citra contre Cascade en bière à dose égale ; rien de chiffré pour Galaxy ; une seule étude pour Idaho 7 ; rien qui croise variété, levure et dry hop ; l’ordre, la synergie et le masquage de deux dry hops : inconnus.</div>
    </div>
  </section>`;

// ---------- la page ----------
const carte = (n) => `<button type="button" class="hc" data-voie="${esc(n)}" data-h="${esc(n)}" data-role="reglage" aria-pressed="false" style="--hc:${HOPS[n].couleur}" aria-label="${esc(n)} dans le duel"><span class="hb">${hn(n)}${alpha(n, { plage: HOPS[n].alpha.lot == null })}</span><span class="hc-2">${usage(n)}${stock(n)}</span></button>`;
const corps = `
  ${barre('<span id="titre"></span>')}
  <div class="outils">${lentille()}<button type="button" class="pill" id="regl-b" aria-controls="regl" aria-label="Les réglages du dry hop, avec le profil">${ic('cuveA', 14)}<span id="regl-t"></span>${ic('bas2', 14)}</button></div>
  <p class="reponse" id="reponse"></p>
  <div class="verdict" id="verdict" data-role="simulation"></div>
  <p class="egal" id="egal"></p>
  <div class="hcs" role="group" aria-label="Choisir les deux houblons du duel">${QUATRE.map(carte).join('')}</div>
  <section class="carte duel" aria-label="Le duel : qui en a le plus, à dose égale">
    <p class="sous-t" id="outil"></p>
    <div class="axe-d" aria-hidden="true"><span class="ax-b">${ic('chev-l', 12)}<span id="ax-b"></span></span><span class="ax-0"></span><span class="ax-a"><span id="ax-a"></span>${ic('chev-r', 12)}</span></div>
    <div id="rows"></div>
  </section>
  <section class="carte" id="sim16" aria-label="Dans ta 16D">
    <div class="sim" data-role="simulation">
      <h2 class="sim-h">${conf('simule')}<small id="sim-ctx"></small></h2>
      <div class="mix" id="mix" data-role="reglage" data-reglage="ajout-cumule" role="slider" tabindex="0" aria-label="Le mélange des deux houblons" aria-valuemin="0" aria-valuemax="2" aria-valuenow="0"><div class="mix-t"><i class="mix-r"></i><i class="mix-s s0"></i><i class="mix-s s1"></i><i class="mix-s s2"></i><i class="mix-p" id="mix-p"></i></div><div class="mix-l"><span id="mix-a"></span><span id="mix-m">ensemble, 2 + 2 g/L</span><span id="mix-b"></span></div></div>
<div class="regl-f" id="regl">
    <div class="regl" role="group" aria-label="Le moment du dry hop"><button type="button" class="chip" data-mom="dryActive" data-role="reglage" aria-pressed="true">${ic('cuveA', 14)}fermentation active</button><button type="button" class="chip" data-mom="dryPost" data-role="reglage" aria-pressed="false">${ic('cuveP', 14)}après</button></div>
    <div class="regl" role="group" aria-label="La levure" id="levs">${['us05', 'pomona', 'verdant'].map((k) => `<button type="button" class="chip" data-lev="${k}" data-role="reglage" data-reglage="levure" aria-pressed="${k === 'us05'}">${ic('levure', 14)}${esc(LEVN[k].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', ''))}</button>`).join('')}</div>
    <p class="gris petit" id="lev-n"></p>
  </div>
      <div id="ajout"></div>
      <div id="sim"></div>
      <p class="resine" id="resine"></p>
      <div class="blocs" role="group" aria-label="À un toucher"><button type="button" class="chip" data-bloc="defi" aria-expanded="false">${ic('drapeau', 14)}Le défi de ta dégustation</button><button type="button" class="chip" data-bloc="tirage" aria-expanded="false" id="tire">${ic('simul', 14)}Tire une bière</button><button type="button" class="chip" data-role="preuve-bouton" aria-expanded="false">${ic('flacon', 14)}Preuves</button></div>
      <div id="defi" hidden></div>
      <div id="tirage" hidden></div>
      <div id="bio"></div>
      <details class="det"><summary>${ic('info', 14)}Le profil simulé ${ic('bas2', 14)}</summary><div class="det-c"><span>~ ${esc(SIMU.mention)}</span><span>Conventions à valider (donnees/PROFIL-SIMULE.md) : ancre Cascade 3,86 g/L = 26 points d’agrumes à 4,75 % vol. (H22, K) ; poids des fiches et des composés ; géraniol → citronellol 50 % pour Pomona.</span><span>La barre : le centre ; le pâle : de bas à haut ; « + » : le haut publié manque pour un composé, le vrai haut peut être plus haut.</span></div></details>
    </div>
  </section>
  <section class="carte" aria-label="Le rapport au seuil, calculé">
    <h2>Le rapport au seuil ${conf('calcule')}<small>4 g/L chacun, après, 3 j</small></h2>
    <div id="moteur"></div>
  </section>
  ${biere}
  <section class="carte" aria-label="Goûté par un panel">
    <h2>Goûté à 4 g/L ${conf('panel')}<small>OSU, 12 variétés</small></h2>
    <div id="panel"></div>
  </section>
  ${preuve}
  ${legende([LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, ['Le duel', [li('<span class="lg-d"><i class="c"></i><i class="b"></i></span>', 'bande : de l’écart le plus petit au plus grand'), li('<span class="lg-d"><i class="c"></i><i class="b r"></i></span>', 'rayée : non départagés'), li('<b class="mono">Citra devant ×2,6–16</b>', 'Citra en a 2,6 à 16 fois plus')], true], LEG_PISTE, ['Le profil', [li('<span class="lg-sb"><i class="z"></i><i class="pl"></i><i class="b"></i></span>', 'barre : le centre, pâle : de bas à haut'), li('<span class="lg-sb"><i class="z"></i><i class="b x"></i></span>', 'orangé : au-delà de la 16D'), li('<b class="mono">+</b>', 'haut publié incomplet')], true]])}`;

const client = fs.readFileSync(path.join(ici, 'client-v1b.js'), 'utf8');
const js = `(() => {
${CLIENT({ ...PS, avant: Object.fromEntries(ORDRE.map((f) => [f, AV[f].c])) })}
const H = ${JSON.stringify(DATA)};
const ROWS = ${JSON.stringify(ROWS)};
const SRCN = ${JSON.stringify(SRCN)};
const SUBST = ${JSON.stringify(SUBST)};
const GR = ${JSON.stringify(GR)};
const PA = ${JSON.stringify(PA)};
const AV = ${JSON.stringify(AV)};
const DEG = ${JSON.stringify(DEG)};
const COURBE = ${JSON.stringify(COURBE)};
const LEVK = ${JSON.stringify(LEV)};
const LEVN = ${JSON.stringify(LEVN)};
const LEVF = ${JSON.stringify(LEVF)};
const IBU = ${JSON.stringify({ v: C1.ibu, bande: C1.bandeIbu })};
const BIO = ${JSON.stringify({ linalol: CH.biotransformation.linalol, creep: CH.hopCreep.chiffres.find((c) => /10 g\/L, 7 j/.test(c.texte)), sat: CH.saturation.zone, satSrc: CH.saturation.sources })};
const COULEUR = ${JSON.stringify(Object.fromEntries(QUATRE.map((n) => [n, HOPS[n].couleur])))};
${client}
})();`;

const CSS = fs.readFileSync(path.join(ici, 'v1b.css'), 'utf8');
ecrire(path.join(ici, 'etat.html'), page({ titre: 'Le duel à dose égale', desc: 'Lot 21 · v1b · seconde passe de v1 : le duel à dose égale, départ en dry hop actif (US-05), verdict dans la 16D et équivalence sous la phrase, du papier au cône, le mélange au doigt, défi, tirage et preuves à un toucher. Généré par v1b/generer.mjs.', css: CSS, corps, js }));
