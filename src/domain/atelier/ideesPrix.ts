/**
 * Atelier › Tarifs › idées de prix (kb3) : la ligne ouverte. Une idée de prix est un `CreativeItem` « pricing-test » :
 *   prix visé = `targetPrice` (CHF HT) ; pour qui = `contactName` ; coût = `estimatedCost` ; format = `format` (champ neuf, voir plus bas).
 * Le prix « au litre » se calcule du prix et de la contenance du format ; sans prix ou sans format, il n'existe pas (jamais 0).
 * Le coût inconnu reste « à poser » : aucune marge n'est annoncée sans lui.
 *
 * Champ neuf : `format` (comme `noteId` de rangerNote.ts, `CreativeItem` n'étant pas ouvert à la voie). Les identifiants et les contenances
 * sont ceux de `nomFormat` (ventesAuLitre.ts) : fût 20 L, carton 12 × 33 cl (3,96 L), growler 2 L, verre 3 dl, bouteille 33 cl.
 */
import type { CreativeItem } from '../../types';

export type FormatPrixId = 'fut' | 'carton' | 'growler' | 'verre' | '33cl';
export interface FormatPrix { id: FormatPrixId; court: string; nom: string; litres: number; unite: string; pas: number }

/**
 * Le pas du − et du + suit l'ordre de grandeur du prix : 5 CHF pour un fût (maquette), 1 pour un carton, 0,50 pour un growler
 * et un verre, 0,10 pour une bouteille. Un prix tapé à la main n'est pas arrondi au pas.
 */
export const FORMATS_PRIX: readonly FormatPrix[] = [
  { id: 'fut', court: 'Fût', nom: 'Fût 20 L', litres: 20, unite: 'le fût', pas: 5 },
  { id: 'carton', court: 'Carton', nom: 'Carton 12 × 33 cl', litres: 3.96, unite: 'le carton', pas: 1 },
  { id: 'growler', court: 'Growler', nom: 'Growler 2 L', litres: 2, unite: 'le growler', pas: 0.5 },
  { id: 'verre', court: 'Verre', nom: 'Verre 3 dl', litres: 0.3, unite: 'le verre', pas: 0.5 },
  { id: '33cl', court: 'Bouteille', nom: 'Bouteille 33 cl', litres: 0.33, unite: 'la bouteille', pas: 0.1 }
];

/**
 * `prixParFormat` : le prix déjà posé pour chaque autre format de l'idée. Changer de format ne transporte jamais le prix d'un format dans un autre
 * (145 CHF le fût n'est pas 145 CHF le carton) : le prix du nouveau format est celui déjà noté pour lui, sinon « à poser ».
 * `archivedAt` : l'idée est rangée (ISO), pas supprimée.
 */
export type IdeePrix = CreativeItem & { format?: FormatPrixId; prixParFormat?: Partial<Record<FormatPrixId, number>>; archivedAt?: string };

export const formatDe = (i: CreativeItem): FormatPrix | undefined => FORMATS_PRIX.find((f) => f.id === (i as IdeePrix).format);
export const r2 = (n: number) => Math.round(n * 100 + 1e-9) / 100;
export const arrondiPas = (n: number, pas: number) => Math.round(n / pas + 1e-9) * pas;

/** Prix du litre (CHF HT) : le prix visé divisé par la contenance du format ; `null` sans prix ou sans format. */
export function auLitre(prix: number | undefined, f: FormatPrix | undefined): number | null {
  return prix !== undefined && Number.isFinite(prix) && prix > 0 && f ? r2(prix / f.litres) : null;
}

/** Le − et le + : un pas du format ; le prix ne descend jamais sous le pas, et un prix absent part de zéro (le premier « + » pose un pas). */
export function pousser(prix: number | undefined, f: FormatPrix | undefined, sens: 1 | -1): number | undefined {
  const pas = f?.pas ?? 1;
  const base = prix ?? 0;
  const suite = r2(sens === 1 ? arrondiPas(base, pas) + pas : arrondiPas(base, pas) - pas);
  return suite < pas ? (prix === undefined ? undefined : r2(pas)) : suite;
}

/** Le titre de la ligne : le format et, s'il est connu, pour qui. Une ancienne idée sans format garde son titre tel quel. */
export const titreIdee = (i: CreativeItem): string => {
  const f = formatDe(i);
  if (!f) return i.title;
  return i.contactName?.trim() ? `${f.nom} pour ${i.contactName.trim()}` : f.nom;
};

/** Ranger une idée de prix (réversible) ou la remettre. */
export const archiverPrix = (i: CreativeItem, quand: string): CreativeItem => ({ ...(i as IdeePrix), archivedAt: quand }) as CreativeItem;
export function restaurerPrix(i: CreativeItem): CreativeItem {
  const { archivedAt: _a, ...reste } = i as IdeePrix;
  void _a;
  return reste as CreativeItem;
}

/** Une idée de prix neuve, écrite sur place : le format suffit ; prix et client absents restent absents. */
export function nouvelleIdeePrix(format: FormatPrixId | undefined, prix: number | undefined, pourQui: string, id: string): CreativeItem | null {
  const f = FORMATS_PRIX.find((x) => x.id === format);
  if (!f && prix === undefined) return null;
  const qui = pourQui.trim();
  const idee: IdeePrix = { id, type: 'pricing-test', title: f ? (qui ? `${f.nom} pour ${qui}` : f.nom) : `Idée de prix${qui ? ` pour ${qui}` : ''}`, status: 'idea',
    ...(f ? { format: f.id } : {}), ...(prix !== undefined ? { targetPrice: prix } : {}), ...(qui ? { contactName: qui } : {}) };
  return idee as CreativeItem;
}

/** Réécrit un champ de l'idée ; le titre suit le format et le client tant qu'il a été fabriqué par eux (sinon il reste celui que tu as écrit). */
export function avecPrix(i: CreativeItem, patch: { format?: FormatPrixId; targetPrice?: number | undefined; contactName?: string; estimatedCost?: number | undefined }): CreativeItem {
  const suivait = formatDe(i) ? i.title === titreIdee(i) : /^Idée de prix/.test(i.title);
  const avant = formatDe(i);
  const next = { ...(i as IdeePrix), ...patch } as IdeePrix;
  if (patch.format && avant && patch.format !== avant.id) {
    // Le prix du format quitté est gardé ; le nouveau format repart de son propre prix, ou de rien.
    const memo = { ...(i as IdeePrix).prixParFormat };
    if (i.targetPrice !== undefined) memo[avant.id] = i.targetPrice; else delete memo[avant.id];
    next.targetPrice = memo[patch.format];
    delete memo[patch.format];
    if (Object.keys(memo).length) next.prixParFormat = memo; else delete next.prixParFormat;
  }
  for (const k of ['targetPrice', 'estimatedCost', 'contactName'] as const) if (next[k] === undefined || next[k] === '') delete next[k];
  if (suivait && formatDe(next)) next.title = titreIdee(next);
  return next as CreativeItem;
}
