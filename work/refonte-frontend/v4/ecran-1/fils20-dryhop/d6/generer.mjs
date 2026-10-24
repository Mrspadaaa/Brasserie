// Lot 20 · d6 · Ce que l'outil sait vraiment. La table « faisable / pas faisable » de H §7.5, mise en
// écran : pour chaque question du brasseur, la forme de la réponse (chiffre en plage, sens, drapeau,
// inconnu) en pictos ; un toucher montre la preuve. Les preuves chiffrées et les « inconnu » viennent du
// moteur « pouvoir aromatique » (fils19-choix/donnees/cas-*.json et verifications.json) ; donnees-h.json
// seulement pour ce que le moteur ne sort pas (hop creep, garde, IC, levure). En tête : les quatre
// mesures en bière sur lesquelles le moteur a été rejoué (verifications.json).
// Usage : node generer.mjs → etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { H, N, ENTREE, INC, ico, pic, hop, alpha, legende, legendeBouton, page, detail, fr, esc, srcTxt, HOP, ton, REPO } from '../d4/commun.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const DON = REPO + '/work/refonte-frontend/v4/ecran-1/fils19-choix/donnees/';
const lireCas = (n) => { const c = JSON.parse(fs.readFileSync(DON + n + '.json', 'utf8')); const T = c.textes || {}; const r = (x) => (typeof x === 'string' && T[x] ? T[x] : x); return { c, r, S: c.sources || {} }; };
const VER = lireCas('verifications');
const CAS = Object.fromEntries(['cas-citra', 'cas-cascade', 'cas-galaxy', 'cas-idaho7', 'cas-citra3-galaxy7', 'cas-citra3-idaho7-5', 'cas-citra3-idaho7-5-pomona-actif'].map((n) => [n, lireCas(n)]));
const srcM = (l) => (l || []).map((k) => { const m = String(k).match(/^H(\d+)/); return m ? Number(m[1]) : k; }).filter((v, i, a) => a.indexOf(v) === i);
const nivM = (l, S) => { const n = (l || []).map((k) => ((S || {})[k] || {}).niveau).filter(Boolean); return ['P', 'F', 'S', 'H'].find((x) => n.includes(x)) || 'H'; };
const sig = (x) => { if (x == null) return '?'; const a = Math.abs(x); const d = a >= 10 ? 0 : a >= 1 ? 1 : Math.max(1, -Math.floor(Math.log10(a)) + 1); return fr(Math.round(x * 10 ** d) / 10 ** d, d); };
const pl = (p, u = '', x = false) => (!p ? '?' : (p.min == null ? '< ' + (x ? '×' : '') + sig(p.max) : p.max == null ? '≥ ' + (x ? '×' : '') + sig(p.min) : (x ? '×' : '') + sig(p.min) + '–' + (x ? '×' : '') + sig(p.max)) + (u ? ' ' + u : ''));
const ajout = (cas, nom) => CAS[cas].c.pouvoir.ajouts.find((a) => a.nom === nom);
const drap = (cas, id) => CAS[cas].c.pouvoir.drapeaux.find((d) => d.id === id);
const PQ = (cas, d) => '<span class="pq" data-source="' + esc(srcTxt(srcM(d.sources))) + '" data-niveau="' + nivM(d.sources, CAS[cas].S) + '">' + esc(CAS[cas].r(d.pourquoi)) + '</span>';
const G = (cas, g, u, x = false) => N(pl(g.plage, u, x), srcM(g.sources), g.niveau || nivM(g.sources, CAS[cas].S));
const D6 = H.d6;

// ---- les quatre formes de réponse ----
const TYPES = [
  { id: 'plage', mot: 'plage', g: ico('j-plage', 14) },
  { id: 'sens', mot: 'sens', g: ico('j-sens', 14) },
  { id: 'drapeau', mot: 'drapeau', g: ico('j-drapeau', 14) },
  { id: 'inconnu', mot: 'inconnu', g: '<i class="hach" aria-hidden="true"></i>' },
];
// La question, dans les mots du brasseur, avec ses houblons (appui long : la fiche).
const hopA = (k) => '<span class="hbx">' + hop(k) + alpha(k, { court: true }) + '</span>';
const Q = {
  citra: () => hopA('citra') + '<span>dry hop</span>',
  'galaxy-idaho7': () => hopA('galaxy') + hopA('idaho7'),
  'citra-cascade': () => hop('citra') + '<span class="op">plus fort</span>' + hopA('cascade'),
  'citra3-galaxy7': () => hop('citra') + ENTREE('3j') + '<span class="op">+</span>' + hop('galaxy') + ENTREE('7j'),
  'citra3-idaho5': () => hop('citra') + ENTREE('3j') + '<span class="op">+</span>' + hop('idaho7') + ENTREE('5j'),
  duree: () => ENTREE('3j, 5j, 7j'),
  '16d': () => '<span>pouvoir</span>' + N('16D', [39], 'S'),
  ic: () => '<span>intervalle de confiance</span>',
  synergie: () => '<span>synergie</span>',
  levure: () => ico('j-levure', 14) + '<span>thiols</span>',
  creep: () => ico('j-jauge', 14) + '<span>hop creep</span>',
  semaines: () => '<span>semaines</span>',
};
// La preuve (plan 2) : d'abord le moteur, puis H pour ce que le moteur ne sort pas.
const C = (n) => CAS[n].c.pouvoir;
const HC = H.hopCreep;
const PREUVE = {
  citra: () => { const a = ajout('cas-citra', 'Citra'); return [['huile', G('cas-citra', a.chargeHuile, 'mL/hL')], ['linalol', G('cas-citra', a.composes.linalol.charge, 'µg/L')], ['4MMP ÷ seuil', G('cas-citra', a.composes['4MMP'].rapport, '', true)], ['cas', '<span class="src" data-source="moteur" data-niveau="H">' + esc(CAS['cas-citra'].c.titre) + '</span>']]; },
  'galaxy-idaho7': () => { const g = ajout('cas-galaxy', 'Galaxy'), i = ajout('cas-idaho7', 'Idaho 7'); return [['Galaxy, huile', G('cas-galaxy', g.chargeHuile, 'mL/hL')], ['Idaho 7, linalol', G('cas-idaho7', i.composes.linalol.charge, 'µg/L')], ['thiols', N(esc(g.classeHopsteiner.map((k) => k.texte).join(' ; ')), [11], 'P')], ['panel', INC('aucun panel entraîné', [21, 29], 'S')]]; },
  'citra-cascade': () => { const a = ajout('cas-citra', 'Citra'), b = ajout('cas-cascade', 'Cascade'); return [['4MMP ÷ seuil, Citra', N(pl(a.composes['4MMP'].baseCommune.rapport.plage, '', true), srcM(a.composes['4MMP'].baseCommune.rapport.sources), 'H')], ['Cascade', N(pl(b.composes['4MMP'].baseCommune.rapport.plage, '', true), srcM(b.composes['4MMP'].baseCommune.rapport.sources), 'H')], ['base', '<span class="src" data-source="[11]" data-niveau="P">' + esc(CAS['cas-citra'].r(a.composes['4MMP'].baseCommune.base)) + '</span>'], [N('panel à 4 g/L', [21], 'S'), N(esc(H.citraCascade.panelOSU.dh.v), [21], 'S')]]; },
  'citra3-galaxy7': () => { const p = C('cas-citra3-galaxy7'); return [['linalol cumulé', G('cas-citra3-galaxy7', p.composes.linalol.charge, 'µg/L')], ['contact', N(esc(p.contact.texte), ['moteur'], 'H')], ['ordre', PQ('cas-citra3-galaxy7', drap('cas-citra3-galaxy7', 'ordre'))], ['synergie', INC('aucune pondération', [67, 72], 'P')]]; },
  'citra3-idaho5': () => { const a = C('cas-citra3-idaho7-5-pomona-actif').ajouts.find((x) => x.nom === 'Idaho 7'); const d = a.drapeaux.find((x) => x.id === 'geraniol-citronellol'); const i = ajout('cas-idaho7', 'Idaho 7'); return [['Idaho 7, géraniol', G('cas-idaho7', i.composes.geraniol.teneur, '% de l\'huile')], ['Pomona, actif', '<b>' + esc(d.statut) + '</b><br>' + PQ('cas-citra3-idaho7-5-pomona-actif', d)]]; },
  duree: () => { const a = C('cas-citra3-idaho7-5').ajouts.find((x) => x.nom === 'Idaho 7'); const d = a.drapeaux.find((x) => x.id === 'duree-longue'); return [[N('au-delà de 3 j', [73], 'S'), PQ('cas-citra3-idaho7-5', d)], [N('hop creep, 7 j', HC.j7_10gL.src, HC.j7_10gL.niv), N('+' + fr(HC.j7_10gL.v[0]) + ' % vol. à 10 g/L', HC.j7_10gL.src, HC.j7_10gL.niv)]]; },
  '16d': () => { const p = C('cas-citra'); return [['moteur', N(esc(p.pouvoir.faceAuStyle.statut), ['moteur'], 'H') + '<br><span class="pq" data-source="moteur" data-niveau="H">' + esc(CAS['cas-citra'].r(p.pouvoir.faceAuStyle.texte)) + '</span>'], [N('×' + p.pouvoir.facteurEleve.valeur, ['moteur'], 'H'), '<span class="pq" data-source="moteur" data-niveau="H">' + esc(p.pouvoir.facteurEleve.convention) + ' : convention à valider</span>'], ['bière noire', PQ('cas-citra', drap('cas-citra', 'biere-noire'))], ['alcool', N(esc(H.seuils.alcool.v), H.seuils.alcool.src, H.seuils.alcool.niv)]]; },
  ic: () => { const v = VER.c.verifications; return [[N('Cascade 2015', [23], 'P'), N(esc(H.d5.etalonnage.v), H.d5.etalonnage.src, 'P')], ['rejoué', N(v.filter((x) => !/sous la mesure/.test(x.verdict)).length + ' mesures sur ' + v.length + ' encadrées', ['moteur'], 'H')], [N('IC 95 %', [23], 'P'), INC('aucune validation hors Cascade 2015', [23], 'P')]]; },
  synergie: () => [['moteur', PQ('cas-citra3-galaxy7', drap('cas-citra3-galaxy7', 'synergie'))]],
  levure: () => { const t = H.d4.voies.thiols; return [['conversion', N(fr(t.conversion.v[0]) + '–' + fr(t.conversion.v[1]) + ' %', t.conversion.src, t.conversion.niv) + ' <span class="src">' + esc(t.conversion.base) + '</span>'], ['IRC7', N(esc(t.irc7.v), t.irc7.src, t.irc7.niv)], ['Citra', N(esc(C('cas-citra3-idaho7-5-pomona-actif').ajouts.find((x) => x.nom === 'Citra').drapeaux.find((x) => x.id === 'thiols-precurseurs').statut), ['moteur'], 'H')], ['houblon réel', INC('rendement non mesuré', [41], 'P')]]; },
  creep: () => { const d = drap('cas-citra3-idaho7-5', 'hop-creep'); return [['statut', '<b>' + esc(d.statut) + '</b>'], [N('2 j', HC.j2.src, HC.j2.niv), N('+' + fr(HC.j2.v[0]) + ' % vol.', HC.j2.src, HC.j2.niv)], [N('7 j, 10 g/L', HC.j7_10gL.src, HC.j7_10gL.niv), N('+' + fr(HC.j7_10gL.v[0]) + ' % vol.', HC.j7_10gL.src, HC.j7_10gL.niv)], ['condition', N(esc(HC.levureVivante.v), HC.levureVivante.src, HC.levureVivante.niv)], ['Galaxy, Idaho 7', INC('non trouvé', [68], 'P')]]; },
  semaines: () => [['moteur', PQ('cas-citra', drap('cas-citra', 'vieillissement'))]],
};

// ---- la table ----
const L = D6.lignes;
const compte = Object.fromEntries(TYPES.map((t) => [t.id, L.filter((l) => l.forme[t.id]).length]));
const cell = (l, t) => { const f = l.forme[t.id]; return '<span class="c' + (f ? ' on c-' + f : '') + '">' + (f ? t.g : '') + '</span>'; };
const lignes = L.map((l, i) => '<div class="q" data-detail="q-' + l.id + '"><span class="qt">' + Q[l.id]() + '</span>' + TYPES.map((t) => cell(l, t)).join('') + '<button type="button" class="qo" data-detail="q-' + l.id + '" aria-label="Preuve : ' + esc(l.q) + '">' + ico('i-chev-r', 16) + '</button></div>').join('');
const tete = '<div class="q th"><span class="qt"><span class="n mono" data-source="H §7.5" data-niveau="H">' + L.length + '</span><span class="gris">questions</span></span>' + TYPES.map((t) => '<span class="c tc">' + t.g + '<span>' + t.mot + '</span><span class="n mono" data-source="H §7.5" data-niveau="H">' + compte[t.id] + '</span></span>').join('') + '<span class="qo"></span></div>';

// ---- vérifié sur des bières mesurées ----
const XV = (x) => { const a = 1, b = 1000; return Math.max(0, Math.min(150, ((Math.log10(Math.max(x, a)) - Math.log10(a)) / (Math.log10(b) - Math.log10(a))) * 150)); };
const FAM = { linalol: 'floral', geraniol: 'floral', '4MMP': 'tropical', '3MH': 'citrus' };
const ver = VER.c.verifications.map((v) => {
  const vals = [v.mesure, v.calcul, v.calculBaseCommune].filter(Boolean).flatMap((p) => [p.min, p.max]).filter((x) => x != null && x > 0);
  const a0 = Math.min(...vals) / 3, b0 = Math.max(...vals) * 3;
  const XV = (x) => Math.max(0, Math.min(150, ((Math.log10(Math.max(x, a0)) - Math.log10(a0)) / (Math.log10(b0) - Math.log10(a0))) * 150));
  const ok = !/sous la mesure/.test(v.verdict);
  const c = v.calculBaseCommune || v.calcul, f = FAM[v.compose] || 'floral';
  const bande = (p, cls, st) => (p && (p.min != null || p.max != null) ? '<i class="' + cls + '" style="left:' + XV(p.min ?? a0).toFixed(1) + 'px;width:' + Math.max(3, XV(p.max ?? b0) - XV(p.min ?? a0)).toFixed(1) + 'px;' + (st || '') + '"></i>' : '');
  return '<div class="vr" data-detail="v-' + v.id + '"><span class="sg' + (ok ? '' : ' non') + '">' + ico(ok ? 'v-jeu' : 'v-non', 14) + '</span><span class="vn">' + pic(f) + N(esc(v.compose.replace('geraniol', 'géraniol')), srcM(v.sources), 'P') + '</span>'
    + '<span class="vt" role="img" aria-label="' + esc(v.texte + ' ; calcul : ' + v.verdict) + '"><i class="ax"></i>' + bande(c, 'vc', 'background:' + ton(f, 'fond') + ';box-shadow:inset 0 0 0 1.5px ' + ton(f, 'base')) + bande(v.mesure, 'vm') + '</span></div>';
}).join('');

// ---- plan 2 ----
let details = '';
for (const l of L) details += detail('q-' + l.id, '<span data-source="saisie" data-niveau="entrée">' + esc(l.q) + '</span>', [['dit', '<span class="pq" data-source="H §7.5" data-niveau="H">' + esc(l.dit) + '</span>'], ...PREUVE[l.id]()]);
for (const v of VER.c.verifications) details += detail('v-' + v.id, esc(v.compose) + ' · ' + esc(v.houblon), [['mesuré', N(esc(v.texte), srcM(v.sources), 'P')], ['calcul', N(pl(v.calcul, v.unite), ['moteur'], 'H')], ...(v.calculBaseCommune ? [['base commune', N(pl(v.calculBaseCommune, v.unite), ['moteur'], 'H')]] : []), ['verdict', '<b>' + esc(v.verdictBaseCommune || v.verdict) + '</b>']]);

const LEGENDE = legende([
  [TYPES[0].g, 'plage : chiffre en plage, de la plus petite à la plus grande source'],
  ['<span class="c on c-ordre" style="width:22px;height:18px">' + TYPES[0].g + '</span>', 'ordre de grandeur seulement (précurseur synthétique)'],
  [TYPES[1].g, 'sens : le moteur dit dans quel sens, pas combien'],
  [TYPES[2].g, 'drapeau : un risque ou une condition, sans chiffre pour ce brassin'],
  [TYPES[3].g, 'inconnu : aucune étude ; jamais zéro'],
  ['<span class="sg">' + ico('v-jeu', 14) + '</span>', 'le calcul du moteur encadre la mesure en bière'],
  ['<span class="sg non">' + ico('v-non', 14) + '</span>', 'le calcul reste sous la mesure'],
  ['<i class="lg-vm"></i>', 'mesuré en bière'],
  ['<i class="lg-vc"></i>', 'calculé par le moteur'],
]);
const corps = '<main class="ecran">'
  + '<div class="barre"><button class="retour" type="button" aria-label="Retour">' + ico('i-chev-l', 16) + '</button><h1>Ce que l\'outil sait</h1>' + legendeBouton() + '</div>'
  + '<section class="carte tab" aria-label="Questions du brasseur">' + tete + lignes + '</section>'
  + '<section class="carte ver" aria-label="Le moteur rejoué sur des bières mesurées"><div class="sec-t">' + ico('j-loupe', 14) + '<span>rejoué en bière</span></div>' + ver + '</section>'
  + '</main>' + LEGENDE + details;

const css = `
  .barre .leg-b { margin-left: auto; }
  .tab { padding: 0 6px 4px 10px; }
  .q { display: grid; grid-template-columns: 1fr repeat(4, 42px) 18px; align-items: center; min-height: 32px; column-gap: 2px; cursor: pointer; }
  .q + .q { border-top: 1px solid var(--trait); }
  .qt { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 5px; font-size: 14px; min-width: 0; padding: 3px 0; }
  .qt .hb { font-size: 14px; }
  .op { color: var(--gris); font-size: 12px; }
  .c { justify-self: center; width: 28px; height: 22px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); }
  .c.on { background: var(--piste); }
  .c.c-ordre { background: #fff; box-shadow: inset 0 0 0 1px var(--trait2); color: var(--gris); }
  .c .hach { width: 16px; height: 10px; }
  .th { min-height: 48px; cursor: default; }
  .th .qt { font-size: 12px; gap: 4px; }
  .th .qt .n { font-size: 16px; font-weight: 600; }
  .tc { height: 44px; width: 42px; flex-direction: column; gap: 1px; font-size: 12px; color: var(--gris); }
  .tc .n { color: var(--encre); font-weight: 600; }
  .qo { width: 18px; height: 24px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .ver { padding: 4px 10px 8px; display: flex; flex-direction: column; gap: 2px; }
  .ver .sec-t { min-height: 28px; color: var(--encre); font-size: 14px; }
  .vr { display: grid; grid-template-columns: 18px 96px 1fr; column-gap: 6px; align-items: center; min-height: 28px; cursor: pointer; }
  .vr + .vr { border-top: 1px solid var(--trait); }
  .sg { display: inline-flex; color: var(--encre); }
  .sg.non { color: var(--gris); }
  .vn { font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
  .vt { position: relative; height: 14px; width: 150px; justify-self: end; }
  .ax { position: absolute; left: 0; right: 0; top: 6px; height: 2px; border-radius: 2px; background: var(--piste); }
  .vc { position: absolute; top: 3px; height: 8px; border-radius: 2px; }
  .vm { position: absolute; top: 0; height: 14px; border-radius: 2px; box-shadow: inset 0 0 0 2px var(--encre); min-width: 4px; z-index: 1; }
  .lg-vm { width: 14px; height: 14px; border-radius: 2px; box-shadow: inset 0 0 0 2px #16161a; display: inline-block; }
  .lg-vc { width: 30px; height: 8px; border-radius: 2px; background: #f3e8f7; box-shadow: inset 0 0 0 1.5px #bf86d6; display: inline-block; }
  .pq { font-size: 12px; }
`;
fs.writeFileSync(path.join(ici, 'etat.html'), page({ titre: 'Ce que l\'outil sait', css, corps, script: '', fiches: ['citra', 'cascade', 'galaxy', 'idaho7'].map((k) => HOP[k].cle) }));
console.log('écrit d6/etat.html', JSON.stringify(compte));
