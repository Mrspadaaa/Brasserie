// Ce que les fiches du dépôt disent d'un houblon, source par source, pour la fiche g1 (« la v1 est la meilleure ») :
// l'α et le β de chaque fiche (Beer Maverick, Hopsteiner) avec leur année, l'huile totale et ses composants, les styles
// d'emploi d'un fournisseur, l'origine, et les auteurs de chaque famille. Lu en direct dans le catalogue du moteur
// (hopRef(cle).catalogue, describeFamilies), comme hopSheet (src/domain/hopIndex/v4/fiches.ts) : aucune valeur recopiée ni inventée ;
// une donnée absente reste absente, avec sa raison (D14, D65).
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { BM_AXES, BM_CLASSES_HSI, bmLienId, type BmAxe, type BmLien, type CatalogueHop } from '../../../domain/hopIndex/v4/data';
import { FAMILIES, describeFamilies, familyWords, hopRef } from '../parcours/v4';

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

const lignes = (bm: [number, number] | null, an: number | null, urlBm: string | null, hs: [number, number] | null, anHs: number | null, urlHs: string | null): PlageSource[] => [
  ...(bm ? [{ source: 'Beer Maverick', annee: an, min: bm[0], max: bm[1], url: urlBm }] : []),
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
  // 1. Beer Maverick : le champ `url` du catalogue.
  const bm = (c.descriptions ?? []).find((d) => d.source.author === 'Beer Maverick');
  poser('Beer Maverick', `Beer Maverick · ${c.name}`, c.bmYear ?? bm?.source.year ?? null, c.url,
    c.bm ? 'α, β, cohumulone, huile, composants, usage, styles, substituts, accords, arôme, descripteurs' : 'α, β, huile, composants, descripteurs', bm?.source.locator ?? null);
  if (c.bm) { const l = out[0]; l.modifiee = dateCourte(c.bm.modifiee); l.releve = dateCourte(c.bm.releve) ?? c.bm.releve; }
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
  const alpha = lignes(c.alpha, c.bmYear, c.url, hs?.alpha ?? null, hs?.year ?? null, hs?.reference ?? null);
  const alphaRecente = alpha.reduce<PlageSource | null>((a, s) => (!a || (s.annee ?? 0) > (a.annee ?? 0) ? s : a), null);
  const comp = (nom: string, r: [number, number] | null): ComposantHuile =>
    ({ nom, plage: r ? { source: 'Beer Maverick', annee: c.bmYear, min: r[0], max: r[1], url: c.url } : null, raison: r ? null : 'non renseigné' });
  const d = describeFamilies(h.varietyId);
  const auteurs = FAMILIES.filter((f) => d[f].sources > 0).map((f) => ({ famille: f, fiches: d[f].sources, sur: d[f].of, auteurs: d[f].authors }));
  const sur = FAMILIES.map((f) => d[f].of).find((n) => n > 0) ?? 0;
  const beta = lignes(c.beta, c.bmYear, c.url, hs?.beta ?? null, hs?.year ?? null, hs?.reference ?? null);
  const huileTotale = lignes(c.oil, c.bmYear, c.url, hs?.totalOil ?? null, hs?.year ?? null, hs?.reference ?? null);
  const w = familyWords(h.varietyId, c);
  const st = h.stock;
  const r: SourcesFiche = {
    alpha, alphaRecente, beta, huileTotale,
    cohumulone: c.cohumulone ? { source: 'Beer Maverick', annee: c.bmYear, min: c.cohumulone[0], max: c.cohumulone[1], url: c.url } : null,
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
      ...(c.cohumulone ? [] : [{ nom: 'cohumulone', raison: 'Beer Maverick l’indique « Unknown », ou la fiche manque' }]),
      { nom: 'géraniol', raison: 'Beer Maverick le range dans « autres huiles » ; aucune fiche fournisseur chargée' },
      ...(c.bm?.hsi ? [] : [{ nom: 'stockage (HSI)', raison: 'non publié dans les fiches du dépôt' }]),
      ...(c.bm?.substituts?.length ? [] : [{ nom: 'substituts publiés', raison: c.bm?.substituts ? 'la page Beer Maverick dit n’en proposer aucun' : 'aucune fiche du dépôt' }]),
    ],
    auteurs,
    seuleFiche: sur === 1 ? auteurs.find((a) => a.auteurs.length)?.auteurs[0] ?? null : null,
    descripteurs: c.tagsFr ?? [],
    cryo: h.stock?.form === 'cryo' || /:cryo$/.test(cle),
  };
  CACHE.set(cle, r);
  return r;
}

/** « Beer Maverick 2023 ». */
export const nomSource = (s: PlageSource) => s.source + (s.annee ? ` ${s.annee}` : '');
