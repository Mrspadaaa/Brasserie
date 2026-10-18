import bandsFile from '../../data/style-bands.json';
import protoData from '../../data/proto-data.json';
import { FAMILIES, type FamilyId } from '../engine/families';

/** [H] Table et seuils « à valider par le brasseur » : data/style-bands.json. */
export type FamilyStatus = 'attendue' | 'neutre' | 'indésirable';
export type Range = { min: number; max: number };

export interface FamilyScale {
  family: FamilyId;
  status: FamilyStatus;
  /** Bande du style sur 0–100 ; null quand le style n'est pas documenté (échelle absolue). */
  band: [number, number] | null;
  /** Largeur effective (plancher TRACK.minWidth), en points 0–100 : l'« unité du style ». */
  width: number;
  /** Domaine de la piste zoomée : bande ± marge, borné à 0–100. */
  domain: [number, number];
  /** Pas d'une direction (« plus floral » = +1 cran), en points. */
  cran: number;
  /** Écart sensible entre deux valeurs, en points. En dessous : « ≈ ». */
  threshold: number;
  quotes: { field: string; quote: string }[];
}

export interface StyleScale {
  code: string;
  id: string | null;
  name: string;
  documented: boolean;
  /** Annonce à afficher quand l'échelle est absolue. */
  notice: string | null;
  ibu: [number, number] | null;
  /** Niveau général du houblon (au moins une famille attendue dans cette bande). */
  overall: [number, number] | null;
  families: Record<FamilyId, FamilyScale>;
  /** Ordre canonique et stable : attendues, puis indésirables, puis neutres (chacune dans l'ordre V5.5). */
  order: FamilyId[];
  url: string | null;
  table: { version: string; words: string; status: string };
}

type BandFile = typeof bandsFile;
type DocStyle = BandFile['styles'][keyof BandFile['styles']];
const TRACK = bandsFile.track;
export const SCALE_PARAMETERS = {
  minWidth: TRACK.minWidth, marginFraction: TRACK.marginFraction, cranFraction: TRACK.cranFraction,
  thresholdFraction: TRACK.thresholdFraction, overlapIndiscernable: TRACK.overlapIndiscernable,
  version: bandsFile.version, words: bandsFile.words.version, status: bandsFile.status,
};

function familyScale(family: FamilyId, status: FamilyStatus, band: [number, number] | null, quotes: FamilyScale['quotes']): FamilyScale {
  const raw = band ? band[1] - band[0] : 100;
  const width = Math.max(TRACK.minWidth, raw);
  const lo = band ? band[0] : 0, hi = band ? band[1] : 100;
  const margin = band ? width * TRACK.marginFraction : 0;
  let d0 = Math.max(0, lo - margin), d1 = Math.min(100, hi + margin);
  // La piste ne peut pas être plus fine que la largeur effective (pas de granularité inventée).
  if (d1 - d0 < width) { d1 = Math.min(100, d0 + width); d0 = Math.max(0, d1 - width); }
  return { family, status, band, width, domain: [d0, d1], cran: width * TRACK.cranFraction, threshold: width * TRACK.thresholdFraction, quotes };
}

function orderOf(families: Record<FamilyId, FamilyScale>): FamilyId[] {
  const rank: Record<FamilyStatus, number> = { attendue: 0, indésirable: 1, neutre: 2 };
  return [...FAMILIES].sort((a, b) => rank[families[a].status] - rank[families[b].status] || FAMILIES.indexOf(a) - FAMILIES.indexOf(b));
}

/** Témoin négatif de check:engine : V4_TEMOIN_NEGATIF=bande élargit la bande floral de 3A à 0–100. */
function negativeControl(code: string, f: FamilyId, band: [number, number]): [number, number] {
  return process.env.V4_TEMOIN_NEGATIF === 'bande' && code === '3A' && f === 'floral' ? [0, 100] : band;
}

const STATS = protoData.styles as unknown as { id: string; code: string; name: string; ibu: [number, number] | null; url: string | null }[];

/** Échelle d'un style (code BJCP « 16D » ou identifiant « foreign-extra-stout »).
 * Style non documenté : échelle absolue 0–100, annoncée, toutes familles neutres sans bande. */
export function getStyleScale(codeOrId: string): StyleScale {
  const stat = STATS.find((s) => s.code === codeOrId || s.id === codeOrId) ?? null;
  const code = stat?.code ?? codeOrId;
  const doc = (bandsFile.styles as Record<string, DocStyle>)[code];
  const table = { version: bandsFile.version, words: bandsFile.words.version, status: bandsFile.status };
  if (doc) {
    const families = Object.fromEntries(FAMILIES.map((f) => {
      const row = doc.families[f] as { status: FamilyStatus; band: number[]; from: string[] };
      const quotes = doc.statements.filter((s) => (s.families as string[]).includes(f) || ((s as { exclude?: string[] }).exclude ?? []).includes(f)).map((s) => ({ field: s.field, quote: s.quote }));
      return [f, familyScale(f, row.status, negativeControl(code, f, [row.band[0], row.band[1]]), quotes)];
    })) as Record<FamilyId, FamilyScale>;
    return { code, id: doc.id, name: doc.name, documented: true, notice: null, ibu: (doc.ibu as [number, number] | null) ?? stat?.ibu ?? null,
      overall: [doc.overall[0], doc.overall[1]], families, order: orderOf(families), url: doc.url, table };
  }
  const families = Object.fromEntries(FAMILIES.map((f) => [f, familyScale(f, 'neutre', null, [])])) as Record<FamilyId, FamilyScale>;
  return { code, id: stat?.id ?? null, name: stat?.name ?? codeOrId, documented: false,
    notice: 'Style sans bandes documentées : échelle absolue 0–100, aucune lecture au style.',
    ibu: stat?.ibu ?? null, overall: null, families, order: [...FAMILIES], url: stat?.url ?? null, table };
}

export const documentedStyleCodes = () => Object.keys(bandsFile.styles);
