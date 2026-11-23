// Ce que les fiches du dépôt disent d'un houblon, source par source, pour la fiche g1 (« la v1 est la meilleure ») :
// l'α et le β de chaque fiche (Beer Maverick, Hopsteiner) avec leur année, l'huile totale et ses composants, les styles
// d'emploi d'un fournisseur, l'origine, et les auteurs de chaque famille. Lu en direct dans le catalogue du moteur
// (hopRef(cle).catalogue, describeFamilies), comme hopSheet (src/domain/hopIndex/v4/fiches.ts) : aucune valeur recopiée ni inventée ;
// une donnée absente reste absente, avec sa raison (D14, D65).
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { BM_AXES, BM_CLASSES_HSI, bmLienId, estBeerMaverick, sourceDeLAdresse, sourceDesPlages, type BmAxe, type BmLien, type CatalogueHop, type SourceDesPlages } from '../../../domain/hopIndex/v4/data';
import { FAMILIES, describeFamilies, familyWords, hopRef } from '../parcours/v4';
import { CHAMPS_COMPLEMENTS, type ChampComplement, type Complements, type EnveloppeComplement, type ValeurSource } from '../../../domain/hopIndex/v4/complements';
import { nomCourt, texteUnite } from './complements-ui';

export interface PlageSource { source: string; annee: number | null; min: number; max: number; url: string | null }
/** Le reste de la page Beer Maverick (d2-import-bm, #180), en français, prêt à afficher. `ref` : la page, pour le lien de chaque ligne. */
export interface BmAffiche {
  ref: { nom: string; url: string | null };
  /** Date de modification publiée et date de relevé, « 08.03.2023 ». */
  modifiee: string | null; releve: string;
  usage: string | null; proprietaire: string | null; rapportAB: string | null;
  /** « 85 % perdus en 6 mois (médiocre), indice 0,85 ». */
  stockage: string | null;
  styles: string[];
  /** null : la page n'a pas de section ; [] : elle dit n'en avoir aucun. */
  substituts: LienBm[] | null;
  accords: (LienBm & { count: number })[] | null;
  /** Radar à 9 axes (0 à 5), dans l'ordre de la page ; null : la page ne publie aucune valeur. */
  arome: { axe: BmAxe; nom: string; valeur: number }[] | null;
}
/** Un houblon cité par la page : son nom (celui du catalogue quand il se résout, sinon celui de la page) et son id si le catalogue le connaît. */
export interface LienBm { id: string | null; name: string }
const USAGE_FR: Record<string, string> = { aroma: 'arôme', bittering: 'amertume', dual: 'mixte, arôme et amertume' };
const STOCKAGE_FR: Record<string, string> = { Poor: 'médiocre', Fair: 'moyenne', Good: 'bonne', Great: 'excellente' };
const AXES_FR: Record<BmAxe, string> = { citrus: 'agrumes', tropicalFruit: 'fruits tropicaux', stoneFruit: 'fruits à noyau', berry: 'petits fruits', floral: 'floral', grassy: 'herbe verte', herbal: 'herbacé', spice: 'épicé', resinPine: 'résine, pin' };
/** « 2023-03-08T22:45:36+00:00 » → « 08.03.2023 ». */
export const dateCourte = (iso: string | null | undefined): string | null => {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null;
};
const nb = (x: number) => String(x).replace('.', ',');
function lienBm(l: BmLien): LienBm {
  const id = bmLienId(l);
  return { id, name: typeof l === 'string' ? hopRef(`beermaverick-${l}`)?.name ?? l : l.name };
}
function bmAffiche(c: CatalogueHop): BmAffiche | null {
  const b = c.bm;
  if (!b) return null;
  return {
    ref: { nom: `Beer Maverick${c.bmYear ? ` ${c.bmYear}` : ''}`, url: c.url },
    modifiee: dateCourte(b.modifiee), releve: dateCourte(b.releve) ?? b.releve,
    usage: c.purpose ? USAGE_FR[c.purpose] : null, proprietaire: b.proprietaire, rapportAB: b.rapportAB,
    stockage: b.hsi ? `${nb(b.hsi[0])} % perdus en 6 mois (${STOCKAGE_FR[BM_CLASSES_HSI[b.hsi[1]]]}), indice ${b.hsi[2] === b.hsi[3] ? nb(b.hsi[2]) : `${nb(b.hsi[2])}–${nb(b.hsi[3])}`}` : null,
    styles: b.styles ?? [], substituts: b.substituts ? b.substituts.map(lienBm) : null,
    accords: b.accords ? b.accords.map(([l, count]) => ({ ...lienBm(l), count })) : null,
    arome: b.arome ? BM_AXES.map((axe, i) => ({ axe, nom: AXES_FR[axe], valeur: b.arome![i] })) : null,
  };
}
/** Une source citée : son nom complet et sa date ; l'adresse de sa page quand elle en a une (sinon, ni lien ni adresse inventée). */
export interface LienSource {
  /** Nom complet : « Beer Maverick · Lotus », « Hopsteiner — Fiche variétale Lotus ». */
  nom: string; auteur: string; annee: number | null; url: string | null;
  /** Ce que cette source apporte pour ce houblon (« α, β, huile », « descripteurs », « usages »). */
  sert: string[];
  /** Ce que la fiche précise de sa propre portée (« Agrégat de plages historiques… »), tel qu'écrit ; null : rien. */
  note: string | null;
  /** Dates de la page : modification publiée et relevé (« 08.03.2023 », « 08.09.2026 ») ; null : sans objet ou non publiée. */
  modifiee?: string | null; releve?: string | null;
}
export interface UsageSource { styles: string[]; source: string | null; url: string | null }
/** Un composant de l'huile ou un champ que le dépôt ne porte pas : « ? », jamais 0. */
export interface ChampInconnu { nom: string; raison: string }
export interface ComposantHuile { nom: string; plage: PlageSource | null; raison: string | null }
export interface SourcesFiche {
  alpha: PlageSource[];
  /** La fiche la plus récente (g1 : « α 11–14 % », Hopsteiner 2025 pour Nugget) ; la première à année égale. */
  alphaRecente: PlageSource | null;
  beta: PlageSource[];
  /** Cohumulone, en % des acides α (Beer Maverick) ; null : « Unknown » dans la page. */
  cohumulone: PlageSource | null;
  /** Ce que la page Beer Maverick publie en plus (usage, propriétaire, styles, substituts, accords, arôme) ; null : pas de bloc. */
  bm: BmAffiche | null;
  huileTotale: PlageSource[];
  composants: ComposantHuile[];
  styles: string[]; stylesSources: string[]; stylesRaison: string | null;
  /** Les usages de chaque fournisseur, avec l'adresse de la page. */
  usages: UsageSource[];
  origine: string | null;
  /** Nom du houblon dans le catalogue, identifiant Beer Maverick, identifiant Hopsteiner, forme, faits cités (identifiants). */
  nom: string; id: string; hopsteinerId: string | null; forme: string | null; faitsCites: string[];
  /** Les sources citées, la page Beer Maverick d'abord (champ `url` du catalogue), puis les fiches fournisseurs. */
  liens: LienSource[];
  /** Les champs que le catalogue ne porte pas : cohumulone, farnésène, géraniol, stockage (HSI), substituts publiés. */
  inconnus: ChampInconnu[];
  /** Les fiches qui citent chaque famille (auteurs), dans l'ordre du moteur. */
  auteurs: { famille: FamilyId; fiches: number; sur: number; auteurs: string[] }[];
  /** Une seule fiche décrit ce houblon : son auteur (« 1 seule fiche : Beer Maverick »), sinon null. */
  seuleFiche: string | null;
  /** Descripteurs de Beer Maverick, en français. */
  descripteurs: string[];
  /** Un produit cryo porte les plages de sa variété en pellets : sa propre fiche manque (#131). */
  cryo: boolean;
  /** b1 (D201) : vrai pour les 317 variétés de base, dont les plages sont celles de la page Beer Maverick ; faux pour un ajout (enveloppe des sources). */
  beerMaverick: boolean;
  /** Le nombre de sources d'un ajout, hors Brewer’s Friend (`nbSources` du catalogue) ; null pour une variété de base. */
  nbSources: number | null;
  /** Accord des deux fiches (règle de hopSheet) : identiques, recouvrantes, disjointes ; null à une seule fiche. */
  accord: { alpha: Accord; beta: Accord; huile: Accord };
  /** Codes et noms d'usage de la variété (« NSN, 85-03-06 »). */
  alias: string[];
  /** Classe « Thiol impact » de Hopsteiner (« forte »), un signal, jamais une intensité ; null : non publiée. */
  thiol: string | null;
  /** Mon stock : grammes au stock, articles, d'où vient l'α du lot ; null : pas au stock. */
  stock: { grammes: number; articles: string[]; alphaDe: string | null; forme: string } | null;
  /** Les textes des fiches autres que les étiquettes de Beer Maverick, tels qu'écrits (langue source). */
  textes: { auteur: string; texte: string }[];
  /** Par famille, les fiches qui la nomment en premier (« nommé en premier »). */
  premier: Partial<Record<FamilyId, string[]>>;
}
export type Accord = 'identiques' | 'recouvrantes' | 'disjointes' | null;
const accordDe = (l: PlageSource[]): Accord => {
  if (l.length < 2) return null;
  const [a, b] = l;
  if (a.min === b.min && a.max === b.max) return 'identiques';
  return Math.max(a.min, b.min) <= Math.min(a.max, b.max) ? 'recouvrantes' : 'disjointes';
};

// b1 (D201) : `etiq` est la source des plages du catalogue (Beer Maverick pour les 317 de base ; pour un ajout, sa source ou « enveloppe de n sources »).
const lignes = (bm: [number, number] | null, an: number | null, etiq: SourceDesPlages, hs: [number, number] | null, anHs: number | null, urlHs: string | null): PlageSource[] => [
  ...(bm ? [{ source: etiq.nom, annee: an, min: bm[0], max: bm[1], url: etiq.url }] : []),
  ...(hs ? [{ source: 'Hopsteiner', annee: anHs, min: hs[0], max: hs[1], url: urlHs }] : []),
];

/** Les sources citées d'un houblon, dans l'ordre demandé (25.10) : la page Beer Maverick d'abord, puis chaque fiche fournisseur
 * qui a une adresse (une fois par adresse), puis les sources sans adresse (nom complet et date, sans lien). */
export function liensDe(c: CatalogueHop): LienSource[] {
  const out: LienSource[] = [];
  const nomDe = (auteur: string, titre: string | null) => (!titre ? auteur : titre.toLowerCase().startsWith(auteur.toLowerCase()) ? titre : `${auteur} — ${titre}`);
  const poser = (auteur: string, titre: string | null, annee: number | null, url: string | null, sert: string, note: string | null = null) => {
    const adresse = url && /^https?:\/\//i.test(url) ? url : null;
    const nom = nomDe(auteur, titre);
    const deja = out.find((x) => (adresse ? x.url === adresse : x.url === null && x.nom === nom && x.annee === annee));
    if (deja) { if (!deja.sert.includes(sert)) deja.sert.push(sert); if (!deja.note && note) deja.note = note; if (!deja.annee && annee) deja.annee = annee; return; }
    out.push({ nom, auteur, annee, url: adresse, sert: [sert], note });
  };
  // 1. Beer Maverick : le champ `url` du catalogue. Un ajout (b1, D201) n'a pas de page Beer Maverick : `url` est la première des pages de ses sources,
  //    posée sous son vrai nom (Hopslist, Yakima Valley Hops…) et pour ce qu'il porte vraiment.
  if (estBeerMaverick(c)) {
    const bm = (c.descriptions ?? []).find((d) => d.source.author === 'Beer Maverick');
    poser('Beer Maverick', `Beer Maverick · ${c.name}`, c.bmYear ?? bm?.source.year ?? null, c.url,
      c.bm ? 'α, β, cohumulone, huile, composants, usage, styles, substituts, accords, arôme, descripteurs' : 'α, β, huile, composants, descripteurs', bm?.source.locator ?? null);
    if (c.bm) { const l = out[0]; l.modifiee = dateCourte(c.bm.modifiee); l.releve = dateCourte(c.bm.releve) ?? c.bm.releve; }
  } else {
    const nom = sourceDeLAdresse(c.url);
    // Source seule : tout ce que la plage porte vient d'elle. Plusieurs sources : on ignore laquelle donne quoi (les compléments le disent, quand ils sont là).
    const seule = !sourceDesPlages(c).enveloppe;
    const sert = [c.alpha && 'α', c.beta && 'β', c.cohumulone && 'cohumulone', c.oil && 'huile', Object.values(c.oils).some(Boolean) && 'composants'].filter((x): x is string => !!x);
    if (nom && c.url) poser(nom, `${nom} · ${c.name}`, null, c.url, seule && sert.length ? sert.join(', ') : 'fiche du houblon');
  }
  // 2. Hopsteiner, puis les autres fiches des descriptions.
  if (c.hs) poser('Hopsteiner', `Fiche variétale ${c.hs.name}`, c.hs.year, c.hs.reference, 'α, β, huile totale');
  if (c.hsLinalool) poser('Hopsteiner', `Fiche variétale ${c.name}`, c.hsLinalool.year, c.hsLinalool.reference, 'linalol');
  if (c.hsThiol) poser('Hopsteiner', `Fiche variétale ${c.name}`, null, c.hsThiol.reference, 'thiols');
  for (const d of c.descriptions ?? []) {
    if (d.source.author === 'Beer Maverick') continue;
    poser(d.source.author, d.source.title, d.source.year ?? null, d.source.reference, 'descripteurs', d.source.locator ?? null);
  }
  for (const u of c.usage ?? []) if (u.source) poser(u.source.split(',')[0].trim() || u.source, u.source, null, u.url, 'usages');
  // Les sources à adresse d'abord (Beer Maverick en tête), puis celles sans adresse.
  return [...out.filter((x) => x.url), ...out.filter((x) => !x.url)];
}

const CACHE = new Map<string, SourcesFiche>();
export function sourcesFiche(cle: string): SourcesFiche | null {
  const vu = CACHE.get(cle);
  if (vu) return vu;
  const h = hopRef(cle);
  if (!h) return null;
  const c = h.catalogue, hs = c.hs;
  const etiq = sourceDesPlages(c), bmId = estBeerMaverick(c);
  const alpha = lignes(c.alpha, c.bmYear, etiq, hs?.alpha ?? null, hs?.year ?? null, hs?.reference ?? null);
  const alphaRecente = alpha.reduce<PlageSource | null>((a, s) => (!a || (s.annee ?? 0) > (a.annee ?? 0) ? s : a), null);
  const comp = (nom: string, r: [number, number] | null): ComposantHuile =>
    ({ nom, plage: r ? { source: etiq.nom, annee: c.bmYear, min: r[0], max: r[1], url: etiq.url } : null, raison: r ? null : 'non renseigné' });
  const d = describeFamilies(h.varietyId);
  const auteurs = FAMILIES.filter((f) => d[f].sources > 0).map((f) => ({ famille: f, fiches: d[f].sources, sur: d[f].of, auteurs: d[f].authors }));
  const sur = FAMILIES.map((f) => d[f].of).find((n) => n > 0) ?? 0;
  const beta = lignes(c.beta, c.bmYear, etiq, hs?.beta ?? null, hs?.year ?? null, hs?.reference ?? null);
  const huileTotale = lignes(c.oil, c.bmYear, etiq, hs?.totalOil ?? null, hs?.year ?? null, hs?.reference ?? null);
  const w = familyWords(h.varietyId, c);
  const st = h.stock;
  const r: SourcesFiche = {
    alpha, alphaRecente, beta, huileTotale,
    cohumulone: c.cohumulone ? { source: etiq.nom, annee: c.bmYear, min: c.cohumulone[0], max: c.cohumulone[1], url: etiq.url } : null,
    bm: bmAffiche(c),
    accord: { alpha: accordDe(alpha), beta: accordDe(beta), huile: accordDe(huileTotale) },
    alias: c.aliases ?? [],
    thiol: c.hsThiol?.class ?? null,
    stock: st ? { grammes: st.grams, articles: st.items ?? [], alphaDe: st.alphaFrom ?? null, forme: st.form } : null,
    textes: (c.descriptions ?? []).filter((d) => d.source.author !== 'Beer Maverick').map((d) => ({ auteur: d.source.author, texte: d.text })),
    premier: Object.fromEntries(FAMILIES.filter((f) => w.premier[f].length).map((f) => [f, w.premier[f]])),
    composants: [
      comp('myrcène', c.oils.myrcene), comp('humulène', c.oils.humulene), comp('caryophyllène', c.oils.caryophyllene),
      comp('farnésène', c.oils.farnesene ?? null),
      comp('autres huiles', c.oils.others ?? null),
      c.hsLinalool
        ? { nom: 'linalol', plage: { source: 'Hopsteiner', annee: c.hsLinalool.year, min: c.hsLinalool.range[0], max: c.hsLinalool.range[1], url: c.hsLinalool.reference }, raison: null }
        : { nom: 'linalol', plage: null, raison: 'non renseigné' },
    ],
    styles: (c.usage ?? []).flatMap((u) => u.styles),
    stylesSources: (c.usage ?? []).map((u) => u.source).filter((s): s is string => !!s),
    stylesRaison: c.usage?.length ? null : 'Aucun usage attesté dans le dépôt (usages fournisseurs connus pour les IPA seulement).',
    origine: c.origin,
    nom: c.name, id: c.id, hopsteinerId: c.hopsteinerId ?? null,
    forme: (c as unknown as { form?: string }).form ?? null,
    faitsCites: (c as unknown as { citedFacts?: string[] }).citedFacts ?? [],
    liens: liensDe(c),
    usages: (c.usage ?? []).map((u) => ({ styles: u.styles, source: u.source, url: u.url })),
    // Ce qu'aucune fiche du dépôt ne porte pour ce houblon : « ? », jamais 0. Une valeur que Beer Maverick publie n'y est plus.
    inconnus: [
      ...(c.cohumulone ? [] : [{ nom: 'cohumulone', raison: bmId ? 'Beer Maverick l’indique « Unknown », ou la fiche manque' : 'aucune des fiches de ce houblon ne la publie' }]),
      { nom: 'géraniol', raison: bmId ? 'Beer Maverick le range dans « autres huiles » ; aucune fiche fournisseur chargée' : 'aucune fiche chargée ne le sépare' },
      ...(c.bm?.hsi ? [] : [{ nom: 'stockage (HSI)', raison: 'non publié dans les fiches du dépôt' }]),
      ...(c.bm?.substituts?.length ? [] : [{ nom: 'substituts publiés', raison: c.bm?.substituts ? 'la page Beer Maverick dit n’en proposer aucun' : 'aucune fiche du dépôt' }]),
    ],
    auteurs,
    seuleFiche: sur === 1 ? auteurs.find((a) => a.auteurs.length)?.auteurs[0] ?? null : null,
    descripteurs: c.tagsFr ?? [],
    cryo: h.stock?.form === 'cryo' || /:cryo$/.test(cle),
    beerMaverick: bmId, nbSources: bmId ? null : c.nbSources ?? null,
  };
  CACHE.set(cle, r);
  return r;
}

/** « Beer Maverick 2023 ». */
export const nomSource = (s: PlageSource) => s.source + (s.annee ? ` ${s.annee}` : '');

// ---------- b1 (D201) : combien de sources portent chaque valeur ----------
/** « 1 source », « 3 sources ». */
export const texteSources = (n: number) => `${n} source${n > 1 ? 's' : ''}`;
export interface ConfianceChamp { champ: string; libelle: string; n: number }
/** Le nombre de sources de chaque valeur que la fiche porte (α, β, cohumulone, huile, composants, linalol), sources distinctes seulement :
 * la page Beer Maverick et la fiche Hopsteiner du catalogue, plus les sources des compléments dont la valeur est dans l'enveloppe (la fiche
 * Hopsteiner des compléments est celle du catalogue : une fois). Un ajout n'a pas de page Beer Maverick : ses sources sont celles des compléments ;
 * sans eux, une variété à une seule source dit « 1 source », une variété à plusieurs ne dit rien (le compte par valeur est inconnu, jamais inventé).
 * Une valeur absente n'a pas de compte (« ? », jamais 0). */
export function confianceSources(s: SourcesFiche, comp: ComplementsFiche | null): ConfianceChamp[] {
  const out: ConfianceChamp[] = [];
  const ligne = (champ: string, libelle: string, rangs: (PlageSource | null | undefined)[], cc: ChampComplement) => {
    const ids = new Set<string>();
    let enveloppe = false;
    for (const r of rangs) {
      if (!r) continue;
      if (r.source === 'Beer Maverick') ids.add('beermaverick');
      else if (r.source === 'Hopsteiner') ids.add('hopsteiner');
      else enveloppe = true;
    }
    for (const v of comp?.parChamp[cc]?.valeurs ?? []) if (!v.horsEnveloppe) ids.add(v.source.id);
    if (enveloppe && !ids.size) { if ((s.nbSources ?? 0) <= 1) ids.add('source-seule'); else return; }
    if (ids.size) out.push({ champ, libelle, n: ids.size });
  };
  const c = (nom: string) => s.composants.find((x) => x.nom === nom)?.plage;
  ligne('alpha', 'α', s.alpha, 'alpha');
  ligne('beta', 'β', s.beta, 'beta');
  ligne('cohumulone', 'cohumulone', [s.cohumulone], 'cohumulone');
  ligne('huile', 'huile totale', s.huileTotale, 'huile');
  ligne('myrcene', 'myrcène', [c('myrcène')], 'myrcene');
  ligne('humulene', 'humulène', [c('humulène')], 'humulene');
  ligne('caryophyllene', 'caryophyllène', [c('caryophyllène')], 'caryophyllene');
  ligne('farnesene', 'farnésène', [c('farnésène')], 'farnesene');
  ligne('linalol', 'linalol', [c('linalol')], 'linalol');
  return out;
}
/** Les valeurs de même compte réunies, « 1 source » d'abord : [{ n: 1, libelles: ['β', 'myrcène'] }, { n: 3, libelles: ['α'] }]. */
export function groupesConfiance(l: ConfianceChamp[]): { n: number; libelles: string[] }[] {
  const par = new Map<number, string[]>();
  for (const x of l) par.set(x.n, [...(par.get(x.n) ?? []), x.libelle]);
  return [...par.entries()].sort((a, b) => a[0] - b[0]).map(([n, libelles]) => ({ n, libelles }));
}

// ---------- d3b (#180) : les compléments des 18 sources, champ par champ ----------
/** Un champ de complements.json pour un houblon : toutes les valeurs de toutes les sources, et l'enveloppe des valeurs valides
 * (null : aucune valeur valide, `?` ; les valeurs suspectes ou hors enveloppe restent dans `valeurs`, marquées). */
export interface ChampComp {
  champ: ChampComplement; libelle: string; unite: string; uniteCourte: string;
  enveloppe: EnveloppeComplement | null; valeurs: ValeurSource[];
}
export interface ComplementsFiche { champs: ChampComp[]; parChamp: Partial<Record<ChampComplement, ChampComp>>; liens: LienSource[] }
const ADRESSE = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
/** Ce que complements.json dit d'un houblon : null s'il n'a aucune valeur. Pur : les compléments sont passés (chargés par l'écran). */
export function complementsFiche(cle: string, c: Complements): ComplementsFiche | null {
  const id = hopRef(cle)?.catalogue.id ?? cle;
  const champs: ChampComp[] = [];
  for (const champ of CHAMPS_COMPLEMENTS) {
    const valeurs = c.valeursDe(id, champ);
    if (!valeurs.length) continue;
    const def = c.champs[champ];
    champs.push({ champ, libelle: def?.libelle ?? champ, unite: def ? texteUnite(def) : '', uniteCourte: def?.unite ?? '', enveloppe: c.enveloppeDe(id, champ), valeurs });
  }
  if (!champs.length) return null;
  // Les fiches citées (une par adresse), avec ce qu'elles apportent.
  const liens: LienSource[] = [];
  for (const k of champs) for (const v of k.valeurs) {
    const url = ADRESSE(v.url);
    const nom = nomCourt(v);
    const deja = liens.find((l) => (url ? l.url === url : l.url === null && l.nom === nom && l.annee === v.annee));
    const sert = k.champ.startsWith('arome_') ? 'arômes notés' : k.libelle;
    if (deja) { if (!deja.sert.includes(sert)) deja.sert.push(sert); if (!deja.annee && v.annee) deja.annee = v.annee; continue; }
    liens.push({ nom, auteur: nom, annee: v.annee, url, sert: [sert], note: null });
  }
  return { champs, parChamp: Object.fromEntries(champs.map((k) => [k.champ, k])) as ComplementsFiche['parChamp'], liens };
}
/** Les liens de la feuille Sources : la page Beer Maverick d'abord (ses mots, 25.10), puis les fiches fournisseurs qui ont une adresse
 * (celles du catalogue, puis celles des compléments, une fois par adresse), puis les sources sans adresse. */
export function liensAvecComplements(liens: LienSource[], comp: ComplementsFiche | null): LienSource[] {
  if (!comp) return liens;
  const sortie = liens.map((l) => ({ ...l, sert: [...l.sert] }));
  for (const n of comp.liens) {
    const deja = n.url ? sortie.find((l) => l.url === n.url) : sortie.find((l) => l.url === null && l.nom === n.nom && l.annee === n.annee);
    if (deja) {
      // Ce que la fiche apporte déjà (« α, β, huile totale ») n'est pas répété ; seul le nouveau s'ajoute.
      const connus = new Set(deja.sert.flatMap((x) => x.split(/[,;]/).map((y) => y.trim().toLowerCase())));
      for (const x of n.sert) if (!connus.has(x.toLowerCase())) deja.sert.push(x);
      if (!deja.annee && n.annee) deja.annee = n.annee;
    }
    else sortie.push({ ...n, sert: [...n.sert] });
  }
  const bm = sortie.filter((l) => l.auteur === 'Beer Maverick');
  const reste = sortie.filter((l) => l.auteur !== 'Beer Maverick');
  return [...bm, ...reste.filter((l) => l.url), ...reste.filter((l) => !l.url)];
}
