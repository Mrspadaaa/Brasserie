// Lot 21 · x1–x5 · les VRAIES valeurs des pages, à côté du profil simulé du moteur (donnees/profils-simules.json) :
// les houblons (stock du prototype, fiches g1, huile de H §1.1), et, pour chaque cas du brief, les sorties du moteur
// « pouvoir aromatique » (fils19-choix/donnees : rapport au seuil du linalol et du 4MMP, IBU à chaud), ce qui reste à
// chaque moment (H §8.2) et les mesures en bière de Cascade (verifications.json). Aucune valeur simulée ici.
// Remplace le stub de l'auteur (stub-profils.mjs, retiré le 19.10 quand le moteur profil-simule a rendu son fichier).
// Usage : node reelles.mjs  →  x1/valeurs-reelles.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ICI, '../../../../../..');
const lire = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8'));
const E19 = 'work/refonte-frontend/v4/ecran-1/fils19-choix/donnees/';
const PROTO = lire('prototypes/houblons-v4/data/proto-data.json');
const FH = lire('work/refonte-frontend/v4/ecran-1/fils20-dryhop/d1/fiches-h.json').fiches;
const PF = lire('prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const CVC = lire(E19 + 'citra-contre-cascade.json');
const VERIF = lire(E19 + 'verifications.json');
const H = lire('work/refonte-frontend/v4/ecran-1/fils20-dryhop/donnees-h.json');
const r1 = (x) => Math.round(x * 10) / 10;

// ---------- les houblons ----------
const STOCK = Object.fromEntries(PROTO.stock.map((s) => [s.key, s]));
const fiche = (cle) => FH.find((f) => f.key === cle) || PF.find((f) => f.key === cle);
const HOUBLONS = {
  citra: { nom: 'Citra', cle: 'beermaverick-citra', couleur: '#184078', lotCle: 'beermaverick-citra:cryo', huile: [1, 3], huileSrc: 'YCH, fiche Citra T-90 [1]' },
  cascade: { nom: 'Cascade', cle: 'beermaverick-cascade', couleur: '#781838', lotCle: 'beermaverick-cascade', huile: [0.5, 2], huileSrc: 'YCH, fiche Cascade [2]' },
  galaxy: { nom: 'Galaxy', cle: 'beermaverick-galaxy', couleur: '#681878', lotCle: 'beermaverick-galaxy', huile: [2.6, 3.3], huileSrc: 'Hop Products Australia, Galaxy [26]' },
  idaho7: { nom: 'Idaho 7', cle: 'beermaverick-idaho-7', couleur: '#e80030', lotCle: 'beermaverick-idaho-7', huile: [1, 3], huileSrc: 'YCH, fiche Idaho 7 [3]' },
  nugget: { nom: 'Nugget', cle: 'beermaverick-nugget', couleur: '#2b68da', lotCle: 'beermaverick-nugget', huile: [0.9, 3.3], huileSrc: 'Beer Maverick 2023, Hopsteiner 2025' },
};
const plageFiches = (f) => { const s = f.alpha.sources; return [Math.min(...s.map((x) => x.min)), Math.max(...s.map((x) => x.max))]; };
for (const h of Object.values(HOUBLONS)) {
  const f = fiche(h.cle), s = STOCK[h.lotCle];
  h.alphaFiches = plageFiches(f);
  h.alphaFichesSrc = f.alpha.sources.map((x) => x.source + ' ' + x.annee).join(', ');
  h.lot = s ? { alpha: s.alpha, forme: s.form === 'unknown' ? null : s.form, grammes: s.grams, de: s.alphaFrom } : null;
  h.horsFiches = !!(h.lot && !h.lot.forme && (h.lot.alpha < h.alphaFiches[0] || h.lot.alpha > h.alphaFiches[1]));
  h.usage = f.role.value; h.usageSource = /^fournisseur/.test(f.role.source) ? 'fournisseur' : 'règle';
  // Par gramme (H §1.1, donnees-h.json du lot 20) : huile, linalol, farnésène, 4MMP libre, chacun avec ses sources.
  const D = H.houblons[{ citra: 'citra', cascade: 'cascade', galaxy: 'galaxy', idaho7: 'idaho7' }[Object.keys(HOUBLONS).find((k) => HOUBLONS[k] === h)]];
  if (D) {
    const env = (xs) => { xs = Array.isArray(xs) ? xs : [xs]; if (xs.some((x) => x.inconnu)) return { inconnu: true, raison: xs.find((x) => x.inconnu).raison };
      const lo = xs.map((x) => x.v[0]).filter((x) => x != null), hi = xs.map((x) => x.v[1]).filter((x) => x != null);
      return { min: lo.length ? Math.min(...lo) : null, max: hi.length ? Math.max(...hi) : null, inf: xs.some((x) => x.inf) ? '>' : null, sup: xs.find((x) => x.sup) ? xs.find((x) => x.sup).sup : null, src: [...new Set(xs.flatMap((x) => x.src))] }; };
    h.parGramme = { huile: env(D.huile_mL100g), linalol: env(D.linalol_pct), farnesene: env(D.farnesene_pct), mmp4: env(D.mmp4_ugkg) };
  }
}
const MOMENTS = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
const LEVURES = { us05: 'SafAle US-05', verdant: 'LalBrew Verdant IPA', pomona: 'LalBrew Pomona', diamond: 'LalBrew Diamond' };
const SEC = (m) => m === 'dryActive' || m === 'dryPost';

// ---------- les mesures liées à chaque cas ----------
const SRC_STOCK = 'stock du prototype (proto-data.json)';
function mesuresHoublon(k, dose) {
  const h = HOUBLONS[k], m = [];
  if (h.lot) m.push({ id: 'alpha-lot', houblon: k, quoi: 'α du lot', valeur: h.lot.alpha, unite: '%', forme: h.lot.forme, source: SRC_STOCK + ', ' + h.lot.de });
  m.push({ id: 'alpha-fiches', houblon: k, quoi: 'α des fiches', plage: h.alphaFiches, unite: '%', note: h.lot && h.lot.forme === 'cryo' ? 'pellets' : null, source: h.alphaFichesSrc });
  m.push({ id: 'huile', houblon: k, quoi: 'huile totale', plage: h.huile, unite: 'mL/100 g', source: h.huileSrc });
  if (dose != null) m.push({ id: 'charge', houblon: k, quoi: 'huile apportée', plage: [r1(h.huile[0] * dose), r1(h.huile[1] * dose)], unite: 'mL/hL', source: 'calcul : huile × dose (H §7.4)' });
  return m;
}
const moteur = (f) => lire(E19 + f + '.json').pouvoir;
const rap = (p, c) => { const x = p.composes[c]; return x && x.rapport && x.rapport.plage ? { min: x.rapport.plage.min, max: x.rapport.plage.max, central: x.rapport.plage.central } : null; };
function mesuresMoteur(fichier, label) {
  const p = moteur(fichier);
  return [['linalol', 'linalol', ['floral', 'citrus']], ['4MMP', '4MMP', ['tropical', 'berries']]].map(([c, nom, fam]) => { const r = rap(p, c);
    return r ? { id: 'rapport-' + c, compose: nom, familles: fam, quoi: 'rapport au seuil', rapport: r, source: 'moteur « pouvoir aromatique », ' + label + ' (fils19-choix/donnees/' + fichier + '.json)' }
      : { id: 'rapport-' + c, compose: nom, familles: fam, quoi: 'rapport au seuil', inconnu: true, raison: 'rapport non calculable : teneur non publiée', source: 'moteur « pouvoir aromatique » (' + fichier + '.json)' }; });
}
function mesuresMoment(h, moment) {
  const r = CVC.table.find((x) => x.moment === moment)[h], out = [];
  for (const [c, nom, fam] of [['linalol', 'linalol', ['floral', 'citrus']], ['4MMP', '4MMP', ['tropical', 'berries']]]) {
    const x = r.composes[c] && r.composes[c].rapport && r.composes[c].rapport.plage;
    out.push(x ? { id: 'rapport-' + c, compose: nom, familles: fam, quoi: 'rapport au seuil', rapport: { min: x.min, max: x.max, central: x.central }, source: 'moteur « pouvoir aromatique », citra-contre-cascade.json, ' + MOMENTS[moment] }
      : { id: 'rapport-' + c, compose: nom, familles: fam, quoi: 'rapport au seuil', inconnu: true, raison: 'aucun taux publié pour ce moment', source: 'moteur « pouvoir aromatique », citra-contre-cascade.json' });
  }
  if (r.amertume && r.amertume.ibu) out.push({ id: 'ibu', quoi: 'IBU apportés', valeur: Math.round(r.amertume.ibu.valeur), plage: [Math.round(r.amertume.ibu.min), Math.round(r.amertume.ibu.max)], unite: 'IBU', source: 'moteur « pouvoir aromatique », amertume, α ' + r.amertume.alpha.source });
  return out;
}
const PERTE = {
  b60: { texte: '4MMP −91 % en 60 min à 100 °C', source: 'Kishimoto 2008 [13]', valeur: -91, unite: '%' },
  wp: { texte: '4MMP −23 % à 90 °C', source: 'Kishimoto 2008 [13]', valeur: -23, unite: '%' },
  b10: { texte: 'linalol 60–63 % retrouvé en ajout tardif', source: 'Gahr 2019 [30]', plage: [60, 63], unite: '%' },
  dryPost: { texte: 'linalol 44–82 % retrouvé en dry hop', source: 'Gahr 2019 [30], Tusha 2022 [31]', plage: [44, 82], unite: '%' },
  dryActive: { texte: 'le CO₂ emporte le myrcène ; aucun % publié', source: 'Haslbeck 2017 [33]' },
};
const MESURE_CASCADE = VERIF.verifications.filter((v) => v.houblon === 'Cascade').map((v) => ({ id: 'biere-' + v.id, compose: v.compose, quoi: 'mesuré en bière', texte: v.texte, plage: [v.mesure.min, v.mesure.max], unite: v.unite, source: v.sources.map((s) => (VERIF.sources[s] ? VERIF.sources[s].titre.split(',')[0] + ' ' + VERIF.sources[s].annee : s)).join(', ') + ' [' + v.sources.map((s) => s.replace('H', '')).join(', ') + ']' }));
const mh = (ajouts) => [...new Set(ajouts.map((a) => a[0]))].flatMap((k) => mesuresHoublon(k, ajouts.filter((a) => a[0] === k).reduce((t, a) => t + a[1], 0)));
const M = {};
for (const h of ['citra', 'cascade']) for (const m of Object.keys(MOMENTS)) M['k1-' + h + '-' + m] = [...mh([[h, 4]]), ...mesuresMoment(h, m), { id: 'perte', quoi: 'ce qui reste', ...PERTE[m] }, ...(h === 'cascade' && SEC(m) ? MESURE_CASCADE : [])];
for (const [h, f] of [['citra', 'cas-citra'], ['galaxy', 'cas-galaxy'], ['idaho7', 'cas-idaho7'], ['cascade', 'cas-cascade']]) M['k2-' + h] = [...mh([[h, 4]]), ...mesuresMoteur(f, HOUBLONS[h].nom + ' 4 g/L')];
M['k3-citra-galaxy'] = [...mh([['citra', 2], ['galaxy', 2]]), ...mesuresMoteur('cas-citra3-galaxy7', 'Citra 3 j puis Galaxy 7 j')];
M['k3-citra-idaho7'] = [...mh([['citra', 2], ['idaho7', 2]]), ...mesuresMoteur('cas-citra3-idaho7-5', 'Citra 3 j puis Idaho 7 5 j')];
M['k5-pomona-actif'] = mesuresMoteur('cas-citra3-idaho7-5-pomona-actif', 'Citra puis Idaho 7, Pomona, en fermentation active');

fs.writeFileSync(path.join(ICI, 'valeurs-reelles.json'), JSON.stringify({ _: 'Vraies valeurs des pages x1–x5 (lot 21) : houblons, mesures du moteur « pouvoir aromatique », de H et du stock. Aucune valeur simulée.', houblons: HOUBLONS, moments: MOMENTS, levures: LEVURES, mesures: M }, null, 1));
console.log('écrit x1/valeurs-reelles.json : ' + Object.keys(M).length + ' cas');
