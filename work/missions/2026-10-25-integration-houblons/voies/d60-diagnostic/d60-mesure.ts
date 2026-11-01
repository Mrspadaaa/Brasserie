// Voie d60-diagnostic : MESURE seulement, au commit de production ae7c7a8d (copie propre). Rien n'est modifié dans src/.
// Lancement (depuis la copie propre, pour que la racine de vite soit celle du commit) :
//   node_modules/.bin/vite-node <ce fichier> -- --sortie=<dossier> [--styles]
// Ce que ça refait : l'écran Suggérer de l'app (adaptateur.ts voiesProposees + suggerer/voies.ts voiesDe, filtres compris) et
// l'écran Substituer (adaptateur.ts remplacants + substituer/donnees.ts composer), sur des recettes de fixture.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const args = process.argv.slice(2);
const SORTIE = args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? '.';
const AVEC_STYLES = args.includes('--styles');

const { chargerCataloguePlein, STOCK } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/data.ts`);
const { creerMoteur } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/moteur.ts`);
const { poserTypicite } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/typicite.ts`);
const { getStyleScale } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/style/scale.ts`);
const { compareVoies } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/voies.ts`);

// La production charge la table de typicité (parcours/donnees.ts : chargerTypicite).
poserTypicite(JSON.parse(readFileSync(join(COPIE, 'src/data/hopV4/typicite-styles.json'), 'utf8')));
const plein = await chargerCataloguePlein();
const M0 = creerMoteur({ catalogue: plein, stock: [] });
const MS = creerMoteur({ catalogue: plein, stock: STOCK });

type R = any;
const recettes: Record<string, R> = {
  'neipa v3 (22A)': { name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
    additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b30', grams: 84 }] }, // Lotus 84 g à 40′ : le moteur n'a pas 40′, le plus proche est b30 (f9-commun.ts)
  'stout S1 (16D)': { name: 'Stout export', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70,
    additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] }, // s1Recipe() de prototypes/houblons-v4/src/pack/buildPack.ts
  '21C hazy': { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8,
    additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] }, // R21C de g1 (suggerer-60.ts)
  'pale ale 18B (Magnum 60′)': { name: 'Pale ale (fixture d60)', styleCode: '18B', volumeL: 20, og: 1.052, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8,
    additions: [{ id: 'a1', hopKey: 'beermaverick-magnum-us', moment: 'b60', grams: 14 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'b10', grams: 20 }, { id: 'a3', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 40 }] },
};
type Demande = { nom: string; direction: Record<string, number>; bannis: string[] };
const demandes: Demande[] = [
  { nom: 'plus d’agrumes', direction: { citrus: 1 }, bannis: [] },
  { nom: 'plus de tropicaux', direction: { tropical: 1 }, bannis: [] },
  { nom: 'plus floral', direction: { floral: 1 }, bannis: [] },
  { nom: 'plus de résineux', direction: { resin: 1 }, bannis: [] },
  { nom: 'amertume (aucune famille)', direction: {}, bannis: [] },
  { nom: 'bannir résineux', direction: { resin: -1 }, bannis: ['resin'] },
  { nom: 'tropicaux + bannir résineux', direction: { tropical: 1, resin: -1 }, bannis: ['resin'] },
];

const ms = () => Number(process.hrtime.bigint() / 1000000n);
const BIG = { limit: 5000, buyLimit: 5000, perHop: 5000, maxBuy: 400, assemblages: false };

/** suggerer/voies.ts `exclue` : un houblon AJOUTÉ qui cite (au moins une fiche) une famille bannie n'est pas proposé. */
function exclueDe(m: any, keys: string[], bannis: string[]) {
  return keys.some((k) => { const ref = m.hopRef(k); if (!ref) return false; const d = m.describeFamilies(ref.varietyId); return bannis.some((f) => d[f].level !== 'non décrit'); });
}
const cles = (v: any) => [...new Set(v.actions.filter((a: any) => a.op !== 'retirer').map((a: any) => a.hopKey))] as string[];
const momentDe = (v: any) => v.actions[0].moment as string;
const nom = (v: any) => `${v.type} ${v.actions[0].hopName}${v.actions[0].previousHopKey ? ` ← ${v.actions[0].previousHopKey.replace('beermaverick-', '')}` : ''} @${momentDe(v)} ${v.actions[0].grams} g [${v.domain}]`;

/** L'écran Suggérer : ce que voiesDe garde (types, exclue, enleveBannie) et le groupe Dry hop des leviers. */
function ecranSuggerer(m: any, r: R, d: Demande) {
  const res = m.proposeVoies(r, d.direction, { assemblages: true });
  const lev = m.proposeVoies(r, d.direction, { assemblages: false, leviersLevure: true, remplacements: false, maxBuy: 0, moments: ['dryActive'] });
  const enleveBannie = (v: any) => d.bannis.some((f) => v.effect[f].established && (v.effect[f].central ?? 0) < 0);
  const types = res.voies.filter((v: any) => v.type === 'ajouter' || v.type === 'assemblage' || v.type === 'remplacer à IBU égal' || (v.type === 'remplacer à masse égale' && enleveBannie(v)));
  const montrees = types.filter((v: any) => !exclueDe(m, cles(v), d.bannis));
  const dh = lev.voies.filter((v: any) => v.type === 'levure' && !v.yeastChange && v.actions.length > 0 && v.actions.every((x: any) => x.op === 'ajouter' && x.moment === 'dryActive')).filter((v: any) => !exclueDe(m, cles(v), d.bannis)).slice(0, 4);
  const parMoment: Record<string, number> = {};
  const remplacer60: string[] = [];
  for (const v of montrees) {
    const k = (v.type === 'ajouter' ? 'ajouter' : v.type === 'assemblage' ? 'assemblage' : 'remplacer') + '@' + momentDe(v);
    parMoment[k] = (parMoment[k] ?? 0) + 1;
    if (v.type.startsWith('remplacer') && momentDe(v) === 'b60') remplacer60.push(nom(v));
  }
  if (dh.length) parMoment['dryhop(levier)@dryActive'] = dh.length;
  const a60 = montrees.filter((v: any) => momentDe(v) === 'b60').length + 0;
  return { res, montrees, parMoment, remplacer60, ajoutsB60: montrees.filter((v: any) => v.type === 'ajouter' && momentDe(v) === 'b60').length, voiesAu60: a60, evalues: res.evaluated, notes: res.notes.filter((n: string) => /aucun mouvement/.test(n)), sautees: res.skipped.length, tousMoments: dh.length + montrees.length };
}

/** L'entonnoir des remplacements à 60′ (ou au moment amertume de la recette) : combien à chaque filtre. */
function entonnoir(m: any, r: R, d: Demande, ecran: ReturnType<typeof ecranSuggerer>) {
  const amers = r.additions.filter((a: any) => ['b60', 'b30', 'b15', 'fwh'].includes(a.moment));
  if (!amers.length) return null;
  const sans = m.proposeVoies(r, d.direction, { ...BIG, remplacements: false, moments: [] });
  const avec = m.proposeVoies(r, d.direction, { ...BIG, moments: [] }); // seulement les remplacements (moments vides : aucun ajout), tous les pools, aucune coupe
  const avecPoolDefaut = m.proposeVoies(r, d.direction, { ...BIG, maxBuy: 80, moments: [] });
  const remp = (v: any) => v.type.startsWith('remplacer');
  const rAvec = avec.voies.filter(remp);
  const rPool80 = avecPoolDefaut.voies.filter(remp);
  const pour = (a: any) => (v: any) => v.actions[0].additionId === a.id;
  const lignes = amers.map((a: any) => {
    const exam = avec.evaluated - sans.evaluated;
    const aPlus = rAvec.filter(pour(a));
    const aPlus80 = rPool80.filter(pour(a));
    const typeVoie = a.moment === 'b60' || a.moment === 'b30' || a.moment === 'b15' || a.moment === 'fwh' ? 'remplacer à IBU égal' : 'remplacer à masse égale';
    const iBU = aPlus.filter((v: any) => v.type === typeVoie);
    const sansConflit = iBU.filter((v: any) => !v.conflicts.length);
    const apresExclue = iBU.filter((v: any) => !exclueDe(m, cles(v), d.bannis));
    // Dans la liste complète (ajouts compris, sans coupe) : où se classe le premier remplacement de cet ajout ?
    const tout = m.proposeVoies(r, d.direction, { ...BIG, assemblages: false });
    const triees = [...tout.voies].sort(compareVoies);
    const idx = triees.findIndex((v: any) => v.type === typeVoie && pour(a)(v));
    const avant = idx < 0 ? null : triees.slice(0, idx);
    const montreesDeCetAjout = ecran.montrees.filter((v: any) => v.type === typeVoie && pour(a)(v)).length;
    const parDomaine = (xs: any[]) => ({ stock: xs.filter((v) => v.domain === 'stock').length, acheter: xs.filter((v) => v.domain === 'à acheter').length });
    return {
      ajout: `${a.hopKey.replace('beermaverick-', '')} @${a.moment} ${a.grams} g`, typeVoie,
      candidatsExamines_toutPool: exam, apresProgres_pool400: iBU.length, apresProgres_pool80: aPlus80.filter((v: any) => v.type === typeVoie).length,
      domaine_pool400: parDomaine(iBU), sansConflit: sansConflit.length, apresExclue: apresExclue.length,
      rangDuPremierDansLaListeComplete: idx < 0 ? null : idx + 1, voiesAvantLui: avant ? { total: avant.length, ajouter: avant.filter((v: any) => v.type === 'ajouter').length, domaineStock: avant.filter((v: any) => v.domain === 'stock').length, domaineAcheter: avant.filter((v: any) => v.domain === 'à acheter').length } : null,
      montreesALEcran: montreesDeCetAjout,
    };
  });
  return lignes;
}

/** L'écran Substituer (adaptateur.remplacants + composer) : combien de candidats, dont reculés. */
function ecranSubstituer(m: any, r: R, a: any) {
  const res = m.substitutes(a.hopKey, { moment: a.moment, grams: a.grams, recipe: r, style: getStyleScale(r.styleCode), stockFirst: true, limit: 8 });
  const tous = res.remplacants;
  const catalogue = tous.filter((s: any) => s.stock.etat !== 'en stock').slice(0, 5);
  const enStock = tous.filter((s: any) => s.stock.etat === 'en stock');
  let stock = enStock.slice(0, 3);
  const suffit = enStock.find((s: any) => s.stock.suffisant !== false);
  if (suffit && !stock.includes(suffit)) stock = [...stock.slice(0, 2), suffit];
  const huit = [...catalogue, ...stock];
  return {
    ajout: `${a.hopKey.replace('beermaverick-', '')} @${a.moment} ${a.grams} g`, contexte: res.contexte, candidatsDuMoteur: res.candidats, rendusMoteur: tous.length, montresALEcran: huit.length,
    reculesParmiMontres: huit.filter((s: any) => s.amertumeDeconseillee).length, enStock: stock.length,
    scores: huit.map((s: any) => s.score), tete: huit.slice(0, 5).map((s: any) => `${s.name} ${s.score}${s.amertumeDeconseillee ? ' (reculé)' : ''}`),
  };
}

const sortie: any = { commit: 'ae7c7a8d', date: '2026-10-31', catalogue: plein.length, stockFixture: STOCK.filter((s: any) => s.grams > 0).length, recettes: {}, substituer: {}, styles: undefined };
const t0 = ms();
for (const [rn, r] of Object.entries(recettes)) {
  sortie.recettes[rn] = {};
  for (const [stk, m] of [['sans stock', M0], ['stock fixture', MS]] as const) {
    sortie.recettes[rn][stk] = {};
    for (const d of demandes) {
      const t = ms();
      const e = ecranSuggerer(m, r, d);
      const e60 = entonnoir(m, r, d, e);
      sortie.recettes[rn][stk][d.nom] = {
        voiesMontrees: e.montrees.length, parMoment: e.parMoment, ajoutsB60: e.ajoutsB60, remplacer60Montres: e.remplacer60,
        aucuneVoieDuTout: e.tousMoments === 0, evalues: e.evalues, sautees: e.sautees, entonnoirRemplacerAmertume: e60, ms: ms() - t,
      };
      process.stdout.write(`${rn} | ${stk} | ${d.nom} : ${e.montrees.length} voies, ajouts@60=${e.ajoutsB60}, remplacer@60=${e.remplacer60.length}\n`);
    }
  }
  sortie.substituer[rn] = {};
  for (const [stk, m] of [['sans stock', M0], ['stock fixture', MS]] as const) {
    sortie.substituer[rn][stk] = r.additions.map((a: any) => ecranSubstituer(m, r, a));
  }
}
// Substituer : un houblon d'arôme posé à 60′ (Citra) et un amérisant pur (Magnum) dans une recette sans amérisant, pour la comparaison.
const R22 = recettes['neipa v3 (22A)'];
sortie.substituerTemoins = ['beermaverick-citra', 'beermaverick-magnum-us', 'beermaverick-nugget', 'beermaverick-saaz-cz', 'beermaverick-galaxy'].flatMap((k) => ['b60', 'b10'].map((mo) => ecranSubstituer(M0, R22, { id: 'x', hopKey: k, moment: mo, grams: 30 })));

if (AVEC_STYLES) {
  const { PHARES_PAR_STYLE } = await import(/* @vite-ignore */ `${COPIE}/tests/unit/hopIndexV4/pharesParStyle.ts`);
  sortie.styles = {};
  const dem = demandes.filter((d) => ['plus d’agrumes', 'plus floral', 'plus de résineux', 'bannir résineux'].includes(d.nom));
  for (const style of Object.keys(PHARES_PAR_STYLE)) {
    const r: R = { name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] }; // la recette de a4-general.ts
    sortie.styles[style] = { substituerNuggetB60: ecranSubstituer(M0, r, r.additions[0]) };
    for (const d of dem) {
      const e = ecranSuggerer(M0, r, d);
      const f = entonnoir(M0, r, d, e)![0];
      sortie.styles[style][d.nom] = { voiesMontrees: e.montrees.length, remplacer60Montres: e.remplacer60.length, ajoutsB60: e.ajoutsB60, apresProgres: f.apresProgres_pool400, rangDuPremier: f.rangDuPremierDansLaListeComplete, avantLui: f.voiesAvantLui?.total ?? null, avantLuiAcheter: f.voiesAvantLui?.domaineAcheter ?? null };
    }
    process.stdout.write(`${style} fait (${ms() - t0} ms)\n`);
  }
}
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, AVEC_STYLES ? 'd60-styles.json' : 'd60-mesure.json'), `${JSON.stringify(sortie, null, 1)}\n`);
process.stdout.write(`écrit, ${ms() - t0} ms\n`);
poserTypicite(null);
