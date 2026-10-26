// Voie g2b-60-et-dryhop (#181, D88 B, D161, D165, D166) : la sortie JSON des mini maquettes de m7 (Suggérer à 60′ comme au dry hop).
// Lancement, depuis la racine : npx vite-node scripts/eval-hop/suggerer-m7.ts -- --sortie=<dossier>   (sortie : sortie-m7.json ; sha256 imprimé)
// Déterministe : ni durée, ni date, ni hasard ; deux lancements rendent le même fichier.
// Recette : la 21C de m6 (Nugget 20 g à 60′, Cascade 80 g en dry hop actif, 20 L). Visée : « plus d'agrumes » (un cran) et +10 IBU à 60′.
//  - groupe 60′ : les 5 premiers ajouts, avec α, usage, g, IBU avant → après, drapeau (règle D88 B : usage puis α) ;
//  - « remplacer Nugget à IBU égal » : les 5 premiers, même règle d'usage ;
//  - groupes dry hop actif et après : les 5 premiers de chacun, dose en g et en g/L (règle de dose de palier.ts), effet, clé de départage sous k1 et sous k3 ;
//  - les 5 houblons phares de L14 (Citra, Nelson Sauvin, Galaxy, Mosaic, Motueka) : leur rang dans chaque liste, ou la raison de leur absence.
// Deux jeux de données : le catalogue entier sans stock (comme g1 et g2a), et les fixtures de stock du prototype (ce que montre l'écran aujourd'hui).
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur, type Moteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie, VoieResult } from '../../src/domain/hopIndex/v4';
import { ETAPES, huileTotaleDe, type Departage } from '../../src/domain/hopIndex/v4/departage';
import { BORNES_DRYHOP_GL, RANKING_PALIER60, REGLE_DRYHOP, USAGE_FR } from '../../src/domain/hopIndex/v4/palier';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import { amertumeAFroid } from '../../src/domain/hopIndex/v4/froid';
import type { StyleScale } from '../../src/domain/hopIndex/v4/style/scale';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/g2b-60-et-dryhop');

const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const IBU_VISE = 10;
const VISEE = { citrus: 1 } as const;
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const PHARES = ['citra', 'nelson-sauvin', 'galaxy', 'mosaic', 'motueka'] as const;
const nomDe = (id: string) => CATALOGUE.find((h) => h.id === id)?.name ?? id;
const r1 = (x: number) => Math.round(x * 10) / 10;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const cleVarie = (a: Voie, b: Voie | undefined): string | null => {
  // L'étape où la clé de a se sépare de celle du suivant : la clé qui les a départagés ; null : ex æquo (ou dernier de la liste).
  if (!a.departage || !b?.departage) return null;
  const i = a.departage.cle.findIndex((x, k) => x !== b.departage!.cle[k]);
  return i < 0 ? null : ETAPES[a.departage.mode][i];
};
/** Le houblon d'une voie : la clé du stock ou l'id de la variété. */
const idVariete = (m: Moteur, v: Voie) => m.hopRef(v.actions[0].hopKey)?.varietyId ?? v.actions[0].hopKey;

// ---------- Ce que chaque rangée apporte à sa dose (D165 précisé : « les rangées donnent l'α et les grammes, mais pas ce que chacune apporte ») ----------
// Tout vient du moteur ou de la fiche du houblon ; l'inconnu est null, jamais 0.
const mid = (r: [number, number] | null | undefined) => (r ? r1((r[0] + r[1]) / 2) : null);
const r2 = (x: number) => Math.round(x * 100) / 100;
/** L'effet de la rangée sur chaque famille, comme les barres de q2b : points et crans du style ; null : aucune fiche du houblon ne cite la famille (apport non établi). */
const effetsDe = (v: Voie, style: StyleScale) => Object.fromEntries(FAMILIES.map((f) => {
  const e = v.effect[f], cran = style.families[f].cran;
  return [f, e.established && e.central !== null ? { famille: FAMILY_NAMES[f], points: e.central, crans: cran > 0 ? r2(e.central / cran) : null, partiel: e.partial } : null];
})) as Record<FamilyId, { famille: string; points: number; crans: number | null; partiel: boolean } | null>;
/** Ce que la fiche du houblon dit, hors du rang (D88 : cohumulone et β en information). */
const fiche = (id: string) => {
  const h = CATALOGUE.find((x) => x.id === id);
  return { cohumulonePct: mid(h?.cohumulone), betaPct: mid(h?.beta), huileTotaleMlPar100g: h ? huileTotaleDe(h) : null, alphaPlagePct: h?.alpha ?? null };
};
const apport = (v: Voie, style: StyleScale, id: string) => ({ apporte: { effets: effetsDe(v, style), fiche: fiche(id) } });
const mots = (m: Moteur, id: string, f: FamilyId) => { const fw = m.familyWords(id); return { famille: [...new Set(fw.mots[f].flatMap((r) => r.mots.map((x) => x.toLowerCase())))], horsFamille: [...new Set(fw.sansFamille.map((x) => x.mot.toLowerCase()))] }; };
/** Les mots de la fiche que la rangée est seule à porter parmi les rangées montrées (« lui seul »), sinon null. */
function motsDistinctifs(m: Moteur, ids: string[], f: FamilyId) {
  const tous = ids.map((id) => mots(m, id, f));
  return ids.map((_, i) => {
    const seul = (cle: 'famille' | 'horsFamille') => tous[i][cle].filter((w) => tous.every((t, j) => j === i || !t[cle].includes(w)));
    const fam = seul('famille'), hors = seul('horsFamille');
    return { luiSeulFamille: fam.length ? fam.slice(0, 4) : null, luiSeulHorsFamille: hors.length ? hors.slice(0, 4) : null, motsDeLaFamille: tous[i].famille.length ? tous[i].famille.slice(0, 8) : null };
  });
}
/** Ce qui distingue les rangées d'un groupe : chaque grandeur, constante (sa valeur) ou variable (combien de valeurs, de laquelle à laquelle). */
function distinguer(vs: Voie[], style: StyleScale, grandeurs: Record<string, (v: Voie) => unknown>) {
  const constant: Record<string, unknown> = {}, varie: Record<string, unknown> = {};
  const toutes: Record<string, (v: Voie) => unknown> = { ...grandeurs };
  for (const f of FAMILIES) toutes[`effet ${FAMILY_NAMES[f]} (points)`] = (v) => effetsDe(v, style)[f]?.points ?? null;
  for (const [nom, lire] of Object.entries(toutes)) {
    const valeurs = vs.map((v) => lire(v));
    const distinctes = [...new Set(valeurs.map((x) => JSON.stringify(x)))].map((s) => JSON.parse(s) as unknown);
    if (distinctes.length === 1) constant[nom] = distinctes[0];
    else {
      const nombres = valeurs.filter((x): x is number => typeof x === 'number');
      varie[nom] = { valeursDistinctes: distinctes.length, inconnues: valeurs.filter((x) => x === null).length, ...(nombres.length ? { min: Math.min(...nombres), max: Math.max(...nombres) } : {}) };
    }
  }
  return { rangees: vs.length, constant, varie };
}
const grandeursHoublon = (m: Moteur) => ({
  'α (%)': (v: Voie) => v.palier?.alpha ?? mid(m.hopRef(v.actions[0].hopKey)?.catalogue.alpha ?? null),
  usage: (v: Voie) => m.hopRef(v.actions[0].hopKey)?.catalogue.purpose ?? null,
  'cohumulone (%)': (v: Voie) => fiche(idVariete(m, v)).cohumulonePct,
  'β (%)': (v: Voie) => fiche(idVariete(m, v)).betaPct,
  'huile totale (mL/100 g)': (v: Voie) => fiche(idVariete(m, v)).huileTotaleMlPar100g,
  grammes: (v: Voie) => v.actions[0].grams,
  'IBU ajouté': (v: Voie) => r1(v.ibu.after - v.ibu.before),
  'IBU après': (v: Voie) => v.ibu.after,
});

function ligne60(m: Moteur, v: Voie, i: number, tous: Voie[], style: StyleScale) {
  const a = v.actions[0], p = v.palier!;
  return {
    ...apport(v, style, idVariete(m, v)),
    rang: v.rank, houblon: a.hopName, id: idVariete(m, v), alphaPct: p.alpha, usage: p.usage, usageFr: p.usage ? USAGE_FR[p.usage] : 'usage inconnu',
    grammes: a.grams, gParL: r3(a.gramsPerLitre), ibuAvant: v.ibu.before, ibuApres: v.ibu.after, ibuAjoute: r1(v.ibu.after - v.ibu.before),
    drapeau: p.drapeau, bande: p.bande, domaine: v.domain, stock: v.stock.status, enStockG: v.enStock ?? null, ibuInconnu: v.ibu.unknown, ex_aequo_avec_le_suivant: i + 1 < tous.length && tous[i + 1].rank === v.rank,
  };
}
function ligneRemplacer(m: Moteur, v: Voie, style: StyleScale) {
  const a = v.actions[0], p = v.palier!;
  return { ...apport(v, style, idVariete(m, v)), rang: v.rank, remplace: 'Nugget', par: a.hopName, id: idVariete(m, v), alphaPct: p.alpha, usage: p.usage, usageFr: p.usage ? USAGE_FR[p.usage] : 'usage inconnu',
    grammes: a.grams, avant: a.previousGrams, ibuAvant: v.ibu.before, ibuApres: v.ibu.after, drapeau: p.drapeau, conflits: v.conflicts, domaine: v.domain, stock: v.stock.status };
}
const arrondiPlage = (r: { min: number; max: number } | null) => (r ? { min: r1(r.min), max: r1(r.max) } : null);
function ligneDry(m: Moteur, v: Voie, i: number, tous: Voie[], cle: Departage, style: StyleScale, mot: ReturnType<typeof motsDistinctifs>[number]) {
  const a = v.actions[0], d = v.dose!;
  const suivant = tous[i + 1];
  // Amertume à cru (froid.ts) : un équivalent en mg/L éq. iso-α, jamais l'IBU du laboratoire ; son statut dit si le modèle la calcule.
  const f = m.dans(() => amertumeAFroid(R21C, { id: a.additionId, hopKey: a.hopKey, moment: a.moment, grams: a.grams }));
  return {
    ...apport(v, style, idVariete(m, v)),
    rang: v.rank, houblon: a.hopName, id: idVariete(m, v), moment: a.momentLabel, grammes: a.grams, gParL: d.gPerL, borne: d.borne,
    effetAgrumes: v.effect.citrus.central, ibuAvant: v.ibu.before, ibuApres: v.ibu.after,
    amertumeAFroid: { statut: f.statut, doseCumuleeGL: f.doseGL === null ? null : r1(f.doseGL), equivalentFinalMgL: arrondiPlage(f.equivalentFinal), ajouteMgL: arrondiPlage(f.delta), nature: f.nature, raisons: f.raisons },
    motDeLaFiche: mot, distance: v.distance.total, domaine: v.domain, stock: v.stock.status, enStockG: v.enStock ?? null,
    cle: v.departage ? { mode: cle, valeurs: v.departage.cle, origines: v.departage.origine } : null,
    departeDuSuivantPar: suivant ? (suivant.rank === v.rank ? 'ex æquo avec le suivant' : (cleVarie(v, suivant) ?? 'une clé hors du départage (stock, dérive d’IBU)')) : null,
    drapeaux: v.drapeaux ?? [],
  };
}
const tete = (vs: Voie[]) => vs.filter((v) => v.rank === 1).length;
const rangsDe = (m: Moteur, vs: Voie[]) => Object.fromEntries(PHARES.map((s) => {
  const id = `beermaverick-${s}`, i = vs.findIndex((v) => idVariete(m, v) === id);
  return [nomDe(id), i < 0 ? null : { rang: vs[i].rank, position: i + 1, sur: vs.length, grammes: vs[i].actions[0].grams }];
}));

function jeu(m: Moteur, nom: string) {
  const sortie: Record<string, unknown> = { jeu: nom, stockArticles: m.stock.length };
  const base = m.proposeVoies(R21C, VISEE, { ...GRAND, palier60: { ibu: IBU_VISE }, dryHop: true });
  sortie.recette = { nom: R21C.name, style: R21C.styleCode, volumeL: R21C.volumeL, ibuAvant: base.ibu, bandeIbuStyle: base.style.ibu };
  sortie.visee = { famille: 'citrus', crans: 1, deltaPoints: base.direction[0].delta, cranPoints: base.direction[0].cran, ibuAjoute: IBU_VISE };
  const p = base.palier60!;
  const style = base.style, g = grandeursHoublon(m);
  sortie.palier60 = {
    regle: RANKING_PALIER60, notes: p.notes, nombreDeVoies: p.voies.length, premiers: p.voies.slice(0, 5).map((v, i) => ligne60(m, v, i, p.voies, style)),
    // Ce qui distingue les rangées entre elles : l'IBU ajouté est le même pour toutes par construction (la dose est celle de +n IBU) ; le reste, constant ou variable, est dit ici.
    cequiDistingue: {
      lesCinqPremieres: distinguer(p.voies.slice(0, 5), style, g),
      toutLeGroupe: distinguer(p.voies, style, g),
    },
    phares: Object.fromEntries(PHARES.map((s) => {
      const id = `beermaverick-${s}`, i = p.voies.findIndex((v) => idVariete(m, v) === id);
      return [nomDe(id), i < 0 ? 'absent (conflit de famille ou α inconnu)' : ligne60(m, p.voies[i], i, p.voies, style)];
    })),
  };
  const rempl = m.proposeVoies(R21C, VISEE, { ...GRAND, moments: ['b60'], palier60: { ibu: IBU_VISE } }).voies.filter((v) => v.type === 'remplacer à IBU égal' && v.conflicts.length === 0);
  sortie.remplacerNuggetAIbuEgal = { regle: 'même règle d’usage que le palier 60′ (un arôme à 60′ perd son arôme) : placée après la distance à la visée, avant le départage', nombreDeVoies: rempl.length,
    premiers: rempl.slice(0, 5).map((v) => ligneRemplacer(m, v, style)), cequiDistingue: { lesCinqPremieres: distinguer(rempl.slice(0, 5), style, g) } };
  const dry: Record<string, unknown> = { regleDose: REGLE_DRYHOP, bornesGL: BORNES_DRYHOP_GL, notes: base.dryHop!.notes };
  const gDry = { ...g, 'dose (g/L)': (v: Voie) => v.dose?.gPerL ?? null };
  for (const cle of ['aucun', 'k1', 'k3'] as const) {
    const r: VoieResult = cle === 'aucun' ? base : m.proposeVoies(R21C, VISEE, { ...GRAND, dryHop: true, departage: cle });
    const d = r.dryHop!;
    const groupe = (vs: Voie[]) => {
      const cinq = vs.slice(0, 5), mdist = motsDistinctifs(m, cinq.map((v) => idVariete(m, v)), 'citrus');
      return { nombreDeVoies: vs.length, premierGroupe: tete(vs), premiers: cinq.map((v, i) => ligneDry(m, v, i, vs, cle as Departage, style, mdist[i])),
        cequiDistingue: { lesCinqPremieres: distinguer(cinq, style, gDry), toutLeGroupe: distinguer(vs, style, gDry) }, phares: rangsDe(m, vs) };
    };
    dry[cle] = { actif: groupe(d.actif), apres: groupe(d.apres) };
  }
  sortie.dryHop = dry;
  return sortie;
}

const json = JSON.stringify({
  voie: 'g2b-60-et-dryhop', consommateur: 'm7 (mini maquettes : Suggérer à 60′ comme au dry hop)',
  etapesDeLaCle: ETAPES,
  jeux: [jeu(creerMoteur({ catalogue: CATALOGUE, stock: [] }), 'catalogue entier, sans stock'), jeu(creerMoteur(), 'stock des fixtures du prototype')],
}, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'sortie-m7.json'), json);
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')} (${json.length} octets)\n`);
