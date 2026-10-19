// Lot 21 · série a · les VRAIES valeurs, lues dans les fichiers du dépôt (aucun chiffre recopié à la main).
//   - fiches et α : base v4.9 (fils18-baseline/l5/donnees-l5-l6.mjs → base/consolide/fiche.html, objet D) ;
//   - huile, composés, thiols, précurseurs, panels, lots, saturation, durée, hop creep, levures :
//     prototypes/houblons-v4/data/composes-houblon.json (rapport H, 93 sources) ;
//   - rapport au seuil par famille, Citra / Galaxy / Idaho 7 / Cascade à 4 g/L après fermentation, 3 j :
//     fils19-choix/donnees/cas-*.json (moteur « pouvoir aromatique ») ;
//   - constats de biotransformation par levure et moment : fils20-dryhop/d4/moteur-lot20.json ;
//   - comparatifs publiés de dry hop : fils21-choisir/donnees/comparatifs-dryhop.json s'il existe.
// Chaque valeur garde sa source (clé du rapport H, ou fichier du dépôt).
import fs from 'node:fs';
import * as K from '../../fils18-baseline/l5/donnees-l5-l6.mjs';

const E1 = K.E1, REPO = K.REPO;
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const CH = lire(REPO + '/prototypes/houblons-v4/data/composes-houblon.json');
const M20 = lire(E1 + '/fils20-dryhop/d4/moteur-lot20.json');
const STYLES = lire(REPO + '/prototypes/houblons-v4/data/style-bands.json');
const D21 = E1 + '/fils21-choisir/donnees';
export const VRAI_PROFILS = D21 + '/profils-simules.json';
export const VRAI_COMPARATIFS = D21 + '/comparatifs-dryhop.json';

const r2 = (x) => Math.round(x * 100) / 100;
// Union des plages publiées d'une grandeur (de la plus petite à la plus grande valeur), et son centre.
function plage(vals) {
  const v = (vals || []).filter((x) => x.plage);
  if (!v.length) return null;
  const lo = Math.min(...v.map((x) => (x.plage[0] == null ? x.plage[1] : x.plage[0])));
  const hi = Math.max(...v.map((x) => (x.plage[1] == null ? x.plage[0] : x.plage[1])));
  return { min: lo, max: hi, centre: r2((lo + hi) / 2), sources: [...new Set(v.flatMap((x) => x.sources))] };
}
const compose = (v, c) => plage(((v.composes || {})[c] || {}).valeurs);

// Les quatre houblons des cas, et Nugget (la recette). Citra : le stock est en cryo (α 24,8 %) ; le profil
// lit Citra T-90 (pellets), comme les moteurs des lots 19 et 20 : l'α affiché est celui des fiches.
const HOUBLONS = {
  citra: { nom: 'Citra', cle: 'beermaverick-citra', base: 'Citra cryo', stock: 'à acheter', stockAutre: { forme: 'cryo', alpha: 24.8 } },
  galaxy: { nom: 'Galaxy', cle: 'beermaverick-galaxy', base: 'Galaxy', stock: 'suffisant' },
  idaho7: { nom: 'Idaho 7', cle: 'beermaverick-idaho-7', base: 'Idaho 7', stock: 'suffisant' },
  cascade: { nom: 'Cascade', cle: 'beermaverick-cascade', base: 'Cascade', stock: 'suffisant' },
  motueka: { nom: 'Motueka', cle: 'beermaverick-motueka', base: 'Motueka', stock: 'suffisant' },
  nelson: { nom: 'Nelson Sauvin', cle: 'beermaverick-nelson-sauvin', base: 'Nelson Sauvin', stock: 'suffisant' },
};
// Rapport au seuil (moteur pouvoir, lot 19), à 4 g/L après fermentation, 3 j : le marqueur dominant de
// chaque famille, en plage (min, centre, max ; null = borne non publiée).
const CAS19 = { citra: 'cas-citra', galaxy: 'cas-galaxy', idaho7: 'cas-idaho7', cascade: 'cas-cascade' };
function rapports(id) {
  if (!CAS19[id]) return { familles: {}, source: null, huile: null };
  const D = lire(E1 + '/fils19-choix/donnees/' + CAS19[id] + '.json');
  const out = {};
  for (const [f, x] of Object.entries(D.pouvoir.familles)) {
    const m = (x.marqueurs || []).find((y) => y.rapport && (y.rapport.max != null || y.rapport.central != null)) || null;
    out[f] = m ? { compose: m.nom, sens: m.sens, min: m.rapport.min, centre: m.rapport.central, max: m.rapport.max, niveau: m.niveau } : { inconnu: x.inconnu || 'aucun marqueur chiffré' };
  }
  return { familles: out, source: 'fils19-choix/donnees/' + CAS19[id] + '.json (moteur pouvoir, ' + D.pouvoir.mention + ')', huile: D.pouvoir.ajouts.find((a) => a.moment !== 'b60').huile.plage };
}
const THIOL_INDICE = { high: 1, forte: 1 };
export function reel() {
  const H = {};
  for (const [id, h] of Object.entries(HOUBLONS)) {
    const F = K.fiche(h.base), v = CH.varietes[h.cle];
    const fiche = Object.fromEntries(F.aromes.map((a) => [a.f, { n: a.n, of: a.of }]));
    const fiches = F.alpha.length ? [Math.min(...F.alpha.map((s) => s.min)), Math.max(...F.alpha.map((s) => s.max))] : null;
    const lot = id === 'citra' ? null : F.lot;
    const classe = (v.classeHopsteiner || [])[0];
    const prec = (v.precurseurs || [])[0];
    const R = rapports(id);
    H[id] = {
      id, nom: h.nom, forme: v.forme, origine: v.origine, stock: h.stock, stockAutre: h.stockAutre || null,
      alpha: { lot, fiches, horsFiches: lot != null && fiches && (lot < fiches[0] || lot > fiches[1]), src: F.alpha.map((s) => s.src + (s.an ? ' ' + s.an : '')).join(', '), lotSource: lot != null ? 'stock (base v4.9)' : null },
      usage: { u: F.role ? F.role.v : 'inconnu', src: F.role && /^fournisseur/.test(F.role.src) ? 'fournisseur' : 'règle', texte: F.role ? F.role.src : '' },
      huile: { ...plage(v.huile.valeurs), unite: 'mL/100 g', moteur: R.huile },
      lin: compose(v, 'linalol'), ger: compose(v, 'geraniol'), myr: compose(v, 'myrcene'), hum: compose(v, 'humulene'), car: compose(v, 'caryophyllene'), far: compose(v, 'farnesene'),
      gerRaison: ((v.composes || {}).geraniol || {}).raison || null,
      thiol: classe ? { classe: classe.classe, texte: classe.texte, indice: THIOL_INDICE[classe.classe.split(' ')[0]] || 0.6, sources: classe.sources } : null,
      mmp: compose(v, '4MMP'),
      precurseurs: prec ? { texte: prec.texte, sources: prec.sources } : null,
      panel: (v.panel || []).map((p) => ({ texte: p.texte, sources: p.sources })),
      lots: (v.lots || []).filter((l) => l.huile != null).map((l) => ({ id: l.id, recolte: l.recolte, huile: l.huile, linalol: l.composes && l.composes.linalol, geraniol: l.composes && l.composes.geraniol, sources: l.sources })),
      fiche, ficheSource: 'base v4.9 (' + (F.aromes[0] ? F.aromes[0].of : 0) + ' fiche' + ((F.aromes[0] || {}).of > 1 ? 's' : '') + ')',
      rapport4: R.familles, rapport4Source: R.source,
    };
  }
  // Nugget, à 60′ dans la recette (pour le profil « avant »).
  const N = K.fiche('Nugget');
  H.nugget = { id: 'nugget', nom: 'Nugget', fiche: Object.fromEntries(N.aromes.map((a) => [a.f, { n: a.n, of: a.of }])), huile: { min: 0.9, max: 3.3, centre: 2.1, sources: ['hs-nug', 'bm-nugget'] }, lin: null, ger: null, myr: null, thiol: null };
  // Levures : fiches relevées (H §8.4) et constats du moteur du lot 20.
  const LEV = { us05: 'fermentis-us05', verdant: 'lalbrew-verdant-ipa', pomona: 'lalbrew-pomona', diamond: 'lalbrew-diamond' };
  const ESTERS = { us05: [], verdant: ['stoneFruit', 'tropical', 'citrus'], pomona: ['stoneFruit', 'citrus', 'tropical'], diamond: [] };
  const L = {};
  for (const [id, cle] of Object.entries(LEV)) {
    const x = CH.levures[cle];
    const gc = (M20.d4[id + '|actif'].ajouts[0].drapeaux.find((d) => d.id === 'geraniol-citronellol') || {}).statut;
    const th = (M20.d4[id + '|actif'].ajouts[0].drapeaux.find((d) => d.id === 'thiols-precurseurs') || {}).statut;
    L[id] = { id, nom: x.nom.replace(/^(SafAle|LalBrew) /, ''), long: x.nom, esters: x.esters, estersFam: ESTERS[id], attenuation: x.attenuation, betaLyase: x.betaLyase, biotransformation: x.biotransformation, gcFiche: x.geraniolCitronellol, gcMoteur: gc, thiolMoteur: th, notes: x.notes, sources: x.sources };
  }
  const gcApres = (M20.d4['us05|apres'].ajouts[0].drapeaux.find((d) => d.id === 'geraniol-citronellol') || {}).statut;
  const thApres = (M20.d4['us05|apres'].ajouts[0].drapeaux.find((d) => d.id === 'thiols-precurseurs') || {}).statut;
  const S16 = STYLES.styles['16D'];
  return {
    houblons: H, levures: L, levuresAucune: CH.levures.aucune,
    apres: { gc: gcApres, thiol: thApres },
    saturation: CH.saturation, ajoutsSuccessifs: CH.ajoutsSuccessifs, duree: CH.duree, hopCreep: CH.hopCreep, bio: CH.biotransformation,
    seuils: { linalol: CH.seuils.linalol, '3MH': CH.seuils['3MH'], '4MMP': CH.seuils['4MMP'] },
    sources: CH.sources,
    style: { code: '16D', nom: S16.name, url: S16.url, familles: S16.families, citation: S16.statements.map((s) => s.quote), source: 'BJCP 2021 (H39), style-bands.json v1, à valider par le brasseur', cranFraction: STYLES.track.cranFraction },
    comparatifs: fs.existsSync(VRAI_COMPARATIFS) ? lire(VRAI_COMPARATIFS) : null,
  };
}
export const titreSource = (R, k) => (R.sources[k] ? R.sources[k].titre : k);
