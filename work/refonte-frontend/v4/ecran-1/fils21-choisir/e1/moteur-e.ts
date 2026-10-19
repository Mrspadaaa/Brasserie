// Lot 21 · e1, e2, e3 · les sorties du moteur « pouvoir aromatique » (prototypes/houblons-v4/src/engine,
// lu sans modification) pour les ladders : chaque variété de data/composes-houblon.json à dose égale
// (2, 4 et 8 g/L) et à chaque moment (60′, 10′, whirlpool, dry hop actif, dry hop après), dans la stout
// 16D S1 ; ses drapeaux de levure (biotransformation) et de durée ; puis les scénarios K2, K3 et K5 du
// brief (dry hop seul, deux dry hops successifs, deux houblons ensemble), recette entière.
// Rien n'est inventé : le moteur calcule par plages depuis les valeurs publiées ; une valeur absente
// reste null avec sa raison. Le moteur n'a pas de courbe de durée : les jours ne changent que ses
// drapeaux, pas ses chiffres (on le dit à l'écran).
// Usage (depuis prototypes/houblons-v4) :
//   node_modules/.bin/vite-node --config vite.config.ts --root ../.. ../../work/refonte-frontend/v4/ecran-1/fils21-choisir/e1/moteur-e.ts
// Écrit e1/donnees/moteur-e.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, pouvoirAjout, pouvoirRecette, DONNEES_POUVOIR, MOMENTS_POUVOIR, type AjoutPouvoir, type RecettePouvoir, type Plage } from '../../../../../../prototypes/houblons-v4/src/engine';
import { s1Recipe } from '../../../../../../prototypes/houblons-v4/src/pack/buildPack';

const ici = path.dirname(fileURLToPath(import.meta.url));
const S1 = (yeastId = 'fermentis-us05'): RecettePouvoir => ({ ...s1Recipe(), yeastId });
const avec = (adds: AjoutPouvoir[], yeastId?: string): RecettePouvoir => ({ ...S1(yeastId), additions: [...s1Recipe().additions, ...adds] });
const froid = (m: string) => m === 'dryPost' || m === 'dryActive';
const aj = (id: string, hopKey: string, gL: number, moment: string, day = 7, dureeJours = 3): AjoutPouvoir => ({ id, hopKey, moment: moment as AjoutPouvoir['moment'], grams: gL * 20, ...(froid(moment) ? { day, dureeJours } : {}) });
const p4 = (x: number | null | undefined) => (x == null || !Number.isFinite(x) ? null : Number(x.toPrecision(3)));
// Une plage, en tableau court : [min, max, central, minAuMoins ? 1 : 0].
const pl = (p: Plage | null) => (p ? [p4(p.min), p4(p.max), p4(p.central), p.minAuMoins ? 1 : 0] : null);
const srcs = (l: { cle: string }[]) => [...new Set(l.map((s) => s.cle))];
const court = (t: string | null) => (t ? t.replace(/^aucun marqueur chiffré : /, '').split(' ; ')[0] : null);

// Par famille : [min, max, central, auMoins] du rapport au seuil du marqueur dominant, le marqueur, la base commune.
const fam = (familles: Record<string, any>) => Object.fromEntries(FAMILIES.map((f) => {
  const s = familles[f];
  return [f, s.signal ? { s: pl(s.signal), m: s.dominant, bc: pl(s.signalBaseCommune) } : { s: null, m: null, inc: s.marqueurs.length ? court(s.inconnu) : 'aucun composé marqueur relié à cette famille' }];
}));
const drap = (l: any[]) => l.map((d) => ({ id: d.id, titre: d.titre, statut: d.statut, pourquoi: d.pourquoi, sources: srcs(d.sources) }));

// ---------- 1. Les variétés : teneurs (vraies valeurs), puis signaux par dose et par moment ----------
const VARIETES = Object.keys(DONNEES_POUVOIR.varietes);
const DOSES = [2, 4, 8];
const LEVURES = ['fermentis-us05', 'lalbrew-verdant-ipa', 'lalbrew-pomona', 'lalbrew-diamond'];
const r16 = S1();
const varietes = Object.fromEntries(VARIETES.map((k) => {
  const v = (DONNEES_POUVOIR.varietes as any)[k];
  const a4 = pouvoirAjout(aj(k, k, 4, 'dryPost'), r16);
  const teneurs = Object.fromEntries(Object.values(a4.composes).map((c: any) => [c.compose, { nom: c.nom, type: c.type, plage: pl(c.teneur.plage), unite: c.teneur.unite, sources: srcs(c.teneur.sources), niveau: c.teneur.niveau, inconnu: court(c.teneur.inconnu), bc: c.baseCommune ? pl(c.baseCommune.teneur.plage) : null }]));
  const signaux: Record<string, unknown> = {};
  for (const d of DOSES) for (const m of MOMENTS_POUVOIR) {
    const a = pouvoirAjout(aj(k, k, d, m), r16);
    signaux[d + '|' + m] = { f: fam(a.familles), style: a.pouvoir.faceAuStyle?.statut ?? null, charge: pl(a.chargeHuile.plage) };
  }
  // Les drapeaux d'un ajout de 4 g/L, 3 j, selon le moment et la levure (biotransformation, durée, hop creep).
  const bio: Record<string, unknown> = {};
  for (const m of ['dryActive', 'dryPost']) for (const y of LEVURES) {
    const a = pouvoirAjout(aj(k, k, 4, m), S1(y));
    bio[m + '|' + y] = drap(a.drapeaux.filter((x: any) => ['geraniol-citronellol', 'thiols-precurseurs', 'hop-creep'].includes(x.id)));
  }
  const duree = Object.fromEntries([1, 3, 7].map((j) => [j, drap(pouvoirAjout(aj(k, k, 4, 'dryPost', 7, j), r16).drapeaux.filter((x: any) => x.id.startsWith('duree')))]));
  return [k, { nom: v.nom, forme: v.forme, huile: { plage: pl(a4.huile.plage), sources: srcs(a4.huile.sources), niveau: a4.huile.niveau }, teneurs,
    classeHopsteiner: (v.classeHopsteiner ?? []).map((c: any) => ({ classe: c.classe, texte: c.texte, sources: c.sources })), panel: v.panel ?? [],
    lots: (v.lots ?? []).map((l: any) => ({ id: l.id, recolte: l.recolte, huile: l.huile, composes: l.composes ?? null, sources: l.sources })),
    mesuresEnBiere: (v.mesuresEnBiere ?? []).map((x: any) => ({ id: x.id, compose: x.compose, plage: x.plage, unite: x.unite, doseGL: x.doseGL, moment: x.moment, texte: x.texte, sources: x.sources })),
    signaux, bio, duree }];
}));

// ---------- 2. Les scénarios du brief (recette entière : Nugget 60′ compris) ----------
const CITRA = 'beermaverick-citra', CASCADE = 'beermaverick-cascade', GALAXY = 'beermaverick-galaxy', IDAHO7 = 'beermaverick-idaho-7', CRYO = 'beermaverick-citra:cryo';
const NOMS: Record<string, string> = { [CITRA]: 'Citra', [CASCADE]: 'Cascade', [GALAXY]: 'Galaxy', [IDAHO7]: 'Idaho 7', [CRYO]: 'Citra cryo' };
const LEV: Record<string, string> = { 'fermentis-us05': 'US-05', 'lalbrew-pomona': 'Pomona', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-diamond': 'Diamond' };
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '');
type Sc = { id: string; type: 'aucun' | 'seul' | 'successifs' | 'ensemble'; cas: string; titre: string; recette: RecettePouvoir; ajouts: { houblon: string; cle: string; doseGL: number; jour: number; jours: number; moment: string }[]; levure: string; moment: string };
const S: Sc[] = [];
const ajoute = (id: string, type: Sc['type'], cas: string, titre: string, adds: AjoutPouvoir[], yeast: string, moment: string) => S.push({ id, type, cas, titre, recette: avec(adds, yeast), levure: LEV[yeast], moment,
  ajouts: adds.map((a) => ({ houblon: NOMS[a.hopKey], cle: a.hopKey, doseGL: a.grams / 20, jour: a.day!, jours: a.dureeJours!, moment: a.moment })) });
for (const y of LEVURES) for (const m of ['dryPost', 'dryActive']) {
  const j0 = m === 'dryPost' ? 7 : 2, M = m === 'dryPost' ? 'après fermentation' : 'fermentation active', suf = `-${m === 'dryPost' ? 'apres' : 'actif'}-${slug(LEV[y])}`;
  ajoute('sans' + suf, 'aucun', 'biere', 'Ma bière, sans dry hop (Nugget 60′)', [], y, m);
  // K2 : un dry hop seul, 4 g/L, 3 j ; Cascade en témoin ; le Citra cryo du stock à 2 g/L.
  for (const k of [CITRA, GALAXY, IDAHO7, CASCADE]) ajoute('k2-' + slug(NOMS[k]) + suf, 'seul', 'K2', `${NOMS[k]} 4 g/L, 3 j, ${M}`, [aj('a', k, 4, m, j0, 3)], y, m);
  ajoute('k2-cryo' + suf, 'seul', 'K2', `Citra cryo du stock 2 g/L, 3 j, ${M}`, [aj('a', CRYO, 2, m, j0, 3)], y, m);
  // K3 : deux dry hops successifs, 2 g/L chacun (le second commence quand le premier sort).
  ajoute('k3-citra-galaxy' + suf, 'successifs', 'K3', `Citra 3 j puis Galaxy 7 j, 2 + 2 g/L, ${M}`, [aj('a', CITRA, 2, m, j0, 3), aj('b', GALAXY, 2, m, j0 + 3, 7)], y, m);
  ajoute('k3-citra-idaho7' + suf, 'successifs', 'K3', `Citra 3 j puis Idaho 7 5 j, 2 + 2 g/L, ${M}`, [aj('a', CITRA, 2, m, j0, 3), aj('b', IDAHO7, 2, m, j0 + 3, 5)], y, m);
  // K5 : deux houblons ensemble dans le même dry hop, 2 + 2 g/L, 3 j.
  for (const b of [GALAXY, IDAHO7, CASCADE]) ajoute(`k5-citra-${slug(NOMS[b])}${suf}`, 'ensemble', 'K5', `Citra + ${NOMS[b]} ensemble, 2 + 2 g/L, 3 j, ${M}`, [aj('a', CITRA, 2, m, j0, 3), aj('b', b, 2, m, j0, 3)], y, m);
}
const scenarios = S.map((s) => {
  const p = pouvoirRecette(s.recette);
  return { id: s.id, type: s.type, cas: s.cas, titre: s.titre, levure: s.levure, moment: s.moment, ajouts: s.ajouts, doseACruGL: p4(p.doseACruGL), contact: p.contact, f: fam(p.familles), style: p.pouvoir.faceAuStyle?.statut ?? null,
    drapeaux: drap(p.drapeaux.filter((d: any) => ['saturation', 'ordre', 'synergie', 'masquage', 'biere-noire', 'hop-creep'].includes(d.id))),
    drapeauxAjouts: p.ajouts.flatMap((a: any) => drap(a.drapeaux.filter((d: any) => ['geraniol-citronellol', 'thiols-precurseurs', 'duree', 'duree-longue', 'cryo'].includes(d.id))).map((d) => ({ ...d, houblon: a.nom }))) };
});

fs.mkdirSync(path.join(ici, 'donnees'), { recursive: true });
const used = new Set<string>();
const walk = (o: unknown) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'sources' && Array.isArray(v)) v.forEach((s) => used.add(String(s))); else walk(v); } };
walk(varietes); walk(scenarios);
const toutes = (DONNEES_POUVOIR as any).sources as Record<string, any>;
const sources = Object.fromEntries([...used].filter((k) => toutes[k]).map((k) => [k, { titre: toutes[k].titre, url: toutes[k].url, annee: toutes[k].annee, niveau: toutes[k].niveau }]));
fs.writeFileSync(path.join(ici, 'donnees', 'moteur-e.json'), JSON.stringify({
  titre: 'Moteur « pouvoir aromatique » rejoué pour les ladders du lot 21 (e1, e2, e3)',
  date: '2026-10-19', moteur: 'prototypes/houblons-v4/src/engine/pouvoir.ts (lu sans modification)', recette: 'S1 : stout export 16D, 20 L, Nugget 46 g à 60′, US-05',
  lecture: 'Plages [min, max, central, auMoins] ; min null = borne basse inconnue, max null = borne haute inconnue ; auMoins = la borne basse ignore un terme inconnu.',
  mention: 'Rapport au seuil du marqueur dominant, pas une intensité perçue. Plage = de la plus petite à la plus grande valeur publiée (seuils, transferts, teneurs).',
  doses: DOSES, moments: MOMENTS_POUVOIR, varietes, scenarios, sources,
}) + '\n');
console.log('MOTEUR-E', VARIETES.length, 'variétés ×', DOSES.length, 'doses ×', MOMENTS_POUVOIR.length, 'moments ;', scenarios.length, 'scénarios ;', Object.keys(sources).length, 'sources');
