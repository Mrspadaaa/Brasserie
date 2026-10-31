// Voie k1-substituer-60 (D196, K1) : mesure de Substituer à 60′ avant/après « un inconnu d'amertume passe après le connu ». MESURE seulement : rien n'est écrit dans src/.
//   npx vite-node scripts/eval-hop/k1-mesure.ts -- --etat=<avant|apres> [--sortie=<dossier>]
// Sortie : k1-<etat>.json, déterministe (ni date ni durée). Les chiffres viennent de `substitutes` (le moteur de l'app) avec les options de l'adaptateur
// (stockFirst, limit 8) ; la liste « montrée » est refaite comme substituer/donnees.ts composer (cinq hors stock au plus, trois du stock).
//  1. Nugget 46 g à 60′, stout S1 (16D) : la tête montrée, l'amertume de chaque rang.
//  2. Les 20 houblons courants de d60 posés à 60′ : combien ont un inconnu d'amertume parmi les 5 montrés.
//  3. Tout le catalogue plein comme original à 60′, jugé par moitiés (parité de l'indice parmi les ids triés : L20) : aucun réglage n'a été fait dessus.
//  4. Octet près à 10′, whirlpool et dry hop : empreinte de chaque (original, moment), `regle` (texte) exclu.
//  5. Palier : aucun candidat à amertume inconnue n'est « très proche » ; leur nombre par étiquette.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, STOCK, chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';

const args = process.argv.slice(2);
const opt = (nom: string) => args.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
const ETAT = opt('etat') ?? 'courant';
const SORTIE = resolve(opt('sortie') ?? 'work/missions/2026-10-25-integration-houblons/voies/k1-substituer-60/sorties');
const plein = await chargerCataloguePlein();
const M0 = creerMoteur({ catalogue: plein, stock: [] });
const MS = creerMoteur({ catalogue: plein, stock: STOCK });
const sha = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const CLE = (id: string) => `beermaverick-${id}`;

type R = any;
const recette = (style: string, key: string, moment: string, g = 30): R => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: key, moment, grams: g }] });
function montres(res: any) {
  const tous = res.remplacants;
  const catalogue = tous.filter((s: any) => s.stock.etat !== 'en stock').slice(0, 5);
  const enStock = tous.filter((s: any) => s.stock.etat === 'en stock');
  let stock = enStock.slice(0, 3);
  const suffit = enStock.find((s: any) => s.stock.suffisant !== false);
  if (suffit && !stock.includes(suffit)) stock = [...stock.slice(0, 2), suffit];
  return [...catalogue, ...stock];
}
const sansAmertume = (s: any) => s.composantes.amertume === null;
const opts = (m: any, r: R, moment: string) => ({ moment, grams: r.additions[0].grams, recipe: r, style: getStyleScale(r.styleCode), stockFirst: true });

// 1. Nugget, stout S1 : la tête, sans et avec le stock de la fixture.
const PHARES = ['columbus', 'magnum-us', 'warrior', 'chinook', 'zeus', 'cluster'];
function nugget(m: any) {
  const r = recette('16D', CLE('nugget'), 'b60', 46);
  const res = m.substitutes(CLE('nugget'), { ...opts(m, r, 'b60'), limit: 700 });
  const m8 = montres({ remplacants: res.remplacants.slice(0, 40) });
  const rangs = Object.fromEntries(PHARES.map((p) => [p, (res.remplacants.findIndex((s: any) => s.key === CLE(p)) + 1) || null]));
  return {
    candidats: res.candidats,
    teteMontree: montres({ remplacants: res.remplacants }).slice(0, 8).map((s: any) => `${s.name} ${s.score} ${s.palier}${sansAmertume(s) ? ' [amertume inconnue]' : ''}`),
    top5: res.remplacants.slice(0, 5).map((s: any) => `${s.name} ${s.score} ${s.palier} amertume=${s.composantes.amertume}`),
    inconnusDansTop5: res.remplacants.slice(0, 5).filter(sansAmertume).length,
    inconnusDansTop30: res.remplacants.slice(0, 30).filter(sansAmertume).length,
    montresAmertumeInconnue: montres({ remplacants: res.remplacants }).filter(sansAmertume).length,
    candidatsAmertumeInconnue: res.remplacants.filter(sansAmertume).length,
    rangDesPhares: rangs, _m8: m8.length,
  };
}
// 2. Les 20 houblons courants à 60′.
const POP: [string, string][] = [['nugget', '16D'], ['magnum-us', '18B'], ['warrior', '18B'], ['columbus', '22A'], ['chinook', '18B'], ['perle-us', '3B'], ['saaz-cz', '3B'], ['east-kent-goldings', '11C'],
  ['target', '11C'], ['fuggle', '11C'], ['cascade', '18B'], ['centennial', '18B'], ['citra', '21C'], ['simcoe', '21C'], ['mosaic', '21C'], ['lotus', '22A'], ['galaxy', '21C'], ['motueka', '21C'], ['nelson-sauvin', '21C'], ['hallertau-blanc', '21C']];
function populaires(m: any) {
  return POP.map(([id, style]) => {
    const r = recette(style, CLE(id), 'b60');
    const res = m.substitutes(CLE(id), { ...opts(m, r, 'b60'), limit: 8 });
    const m8 = montres(res).slice(0, 5);
    return { original: id, style, montres: m8.length, inconnus: m8.filter(sansAmertume).length, tete: m8.map((s: any) => `${s.name} ${s.score} ${s.palier}${sansAmertume(s) ? ' [inconnue]' : ''}`) };
  });
}
// 3. Tout le catalogue plein à 60′, deux moitiés.
function toutLeCatalogue(m: any) {
  const ids = plein.map((h) => h.id).sort();
  const demi = [{ n: 0, avec: 0, sans: 0, moins5: 0, tresProcheInconnu: 0 }, { n: 0, avec: 0, sans: 0, moins5: 0, tresProcheInconnu: 0 }];
  const pires: string[] = [];
  ids.forEach((id, i) => {
    const h = demi[i % 2];
    const r = recette('18B', id, 'b60');
    const res = m.substitutes(id, { ...opts(m, r, 'b60'), limit: 8 });
    const m5 = montres(res).slice(0, 5);
    const inc = m5.filter(sansAmertume).length;
    h.n++; if (inc > 0) h.avec++; else h.sans++;
    // Un original dont moins de 5 candidats ont une amertume connue : l'inconnu peut rester dans la tête, faute de connu.
    const connus = res.remplacants.filter((s: any) => !sansAmertume(s)).length;
    if (connus < 5) h.moins5++;
    h.tresProcheInconnu += res.remplacants.filter((s: any) => sansAmertume(s) && s.palier === 'très proche').length;
    if (inc > 0 && pires.length < 12) pires.push(`${id} (${inc}/5, ${connus} candidats à amertume connue)`);
  });
  return { moitiePaire: demi[0], moitieImpaire: demi[1], exemplesAvecInconnu: pires };
}
// 4. Empreintes à 10′, whirlpool, dry hop (et 60′ pour mémoire) : `regle` (le texte de la règle) exclu.
const SANS_REGLE = (res: any) => ({ ...res, regle: undefined });
function empreintes(m: any) {
  const out: Record<string, string> = {};
  for (const [id, style] of POP) for (const moment of ['b10', 'wp', 'dryActive', 'dryPost']) {
    const r = recette(style, CLE(id), moment);
    out[`${id}@${moment}`] = sha(SANS_REGLE(m.substitutes(CLE(id), { ...opts(m, r, moment), limit: 40 })));
  }
  for (const [id] of POP) out[`${id}@defaut`] = sha(SANS_REGLE(m.substitutes(CLE(id))));
  return out;
}
// 5. Paliers des candidats à amertume inconnue, à 60′ et à 10′ (Nugget), pour la règle « jamais très proche ».
function paliersInconnus(m: any) {
  const r = recette('16D', CLE('nugget'), 'b60', 46);
  const compte = (moment: string) => {
    const res = m.substitutes(CLE('nugget'), { ...opts(m, r, moment), moment, limit: 700 });
    const c: Record<string, number> = {};
    for (const s of res.remplacants) if (sansAmertume(s)) c[s.palier] = (c[s.palier] ?? 0) + 1;
    return c;
  };
  return { b60: compte('b60'), b10: compte('b10'), dryActive: compte('dryActive') };
}

// 6. L'empreinte de moteurInchange.test.ts (12 phares, contexte par défaut, catalogue Beer Maverick sans stock), avec et sans le texte de la règle.
function empreinteMoteurInchange() {
  const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
  const ph = ['citra', 'mosaic', 'nelson-sauvin', 'galaxy', 'motueka', 'idaho-7', 'cascade', 'saaz-cz', 'nugget', 'lotus', 'simcoe', 'east-kent-goldings'].map(CLE);
  return { avecRegle: sha(ph.map((k) => m.substitutes(k))), sansRegle: sha(ph.map((k) => SANS_REGLE(m.substitutes(k)))) };
}

const sortie = {
  etat: ETAT, moteurInchange: empreinteMoteurInchange(),
  nuggetStoutSansStock: nugget(M0), nuggetStoutAvecStock: nugget(MS),
  populaires: populaires(M0), catalogue: toutLeCatalogue(M0), paliersInconnus: paliersInconnus(M0), empreintes: empreintes(M0),
};
const pop = sortie.populaires;
const synth = { populairesAvecInconnu: pop.filter((p) => p.inconnus > 0).length, populaires: pop.length, moyenneInconnusMontres: pop.reduce((a, p) => a + p.inconnus, 0) / pop.length };
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, `k1-${ETAT}.json`), `${JSON.stringify({ ...sortie, synthese: synth }, null, 1)}\n`);
process.stdout.write(`[${ETAT}] Nugget 60′ stout : inconnus dans le top 5 ${sortie.nuggetStoutSansStock.inconnusDansTop5}, montrés ${sortie.nuggetStoutSansStock.montresAmertumeInconnue}, top 30 ${sortie.nuggetStoutSansStock.inconnusDansTop30}\n`);
process.stdout.write(`[${ETAT}] tête : ${sortie.nuggetStoutSansStock.top5.join(' | ')}\n`);
process.stdout.write(`[${ETAT}] 20 houblons à 60′ avec un inconnu parmi les 5 montrés : ${synth.populairesAvecInconnu}/${synth.populaires}\n`);
process.stdout.write(`[${ETAT}] catalogue (${plein.length}) moitié paire : ${JSON.stringify(sortie.catalogue.moitiePaire)}\n`);
process.stdout.write(`[${ETAT}] catalogue moitié impaire : ${JSON.stringify(sortie.catalogue.moitieImpaire)}\n`);
process.stdout.write(`[${ETAT}] moteurInchange : ${JSON.stringify(sortie.moteurInchange)}\n`);
process.stdout.write(`[${ETAT}] empreinte 10′/wp/dry (80) : ${sha(Object.entries(sortie.empreintes).filter(([k]) => !k.endsWith('@defaut')))}\n`);
process.stdout.write(`[${ETAT}] paliers des inconnus (Nugget) : ${JSON.stringify(sortie.paliersInconnus)}\n`);
