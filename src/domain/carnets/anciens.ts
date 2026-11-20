/**
 * h1, tour 2 (20.11, CPL-1, DEFAUTS CARNET-PLANNING). Lecture seule, aucune écriture, aucune migration.
 * D3 : un projet porté du Planning (`CARNET-PLANNING-…`) archivé comme fait reste dans Carnet › Tout, groupe « Faits ».
 * D2 : les éléments de l'ancien carnet de l'Atelier sans autre place (contact, idée de bière, note brute) restent lisibles en repli.
 */
import type { CreativeItem } from '../../types';
import type { CarnetDoc } from './modele';

export const PREFIXE_PLANNING = 'CARNET-PLANNING-';

/** Les projets du Planning archivés (faits), dans l'ordre du Planning (T-06, T-07…). */
export function faitsDuPlanning(tous: readonly CarnetDoc[]): CarnetDoc[] {
  return tous.filter(c => c.id.startsWith(PREFIXE_PLANNING) && !!c.carnet.archive)
    .sort((a, b) => a.id.localeCompare(b.id, 'fr', { numeric: true }));
}

export type GenreAncien = 'contact' | 'idée de bière' | 'note';
export interface AncienneNote { id: string; titre: string; genre: GenreAncien; date: string | null }

const GENRES: Record<string, GenreAncien> = { prospect: 'contact', 'recipe-idea': 'idée de bière', note: 'note' };
const jj = (n: number) => String(n).padStart(2, '0');
const enSuisse = (d: Date) => `${jj(d.getDate())}.${jj(d.getMonth() + 1)}.${d.getFullYear()}`;

/** La date de l'élément, au format de l'app (JJ.MM.AAAA) : sa date, sinon sa création, sinon l'horodatage de son id (`CR-<ms>`). */
export function dateAncienne(i: { id: string; date?: string; createdAt?: string }): string | null {
  const suisse = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(i.date?.trim() ?? '');
  if (suisse) return i.date!.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(i.date ?? i.createdAt ?? '');
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const ms = /^CR-(\d{12,14})$/.exec(i.id);
  return ms ? enSuisse(new Date(Number(ms[1]))) : null;
}

const cle = (d: string | null) => (d ? d.split('.').reverse().join('') : '');

/** Les anciennes notes sans place ailleurs (ni archivées), la plus récente en tête. Les autres types ont leur place (Matériel, Tarifs, Calendrier). */
export function anciennesNotes(items: readonly CreativeItem[]): AncienneNote[] {
  return items
    .filter(i => (i.type as string) in GENRES && !(i as { archivedAt?: string }).archivedAt && !!i.title?.trim())
    .map(i => ({ id: i.id, titre: i.title.trim(), genre: GENRES[i.type as string], date: dateAncienne(i as { id: string; date?: string; createdAt?: string }) }))
    .sort((a, b) => cle(b.date).localeCompare(cle(a.date)) || a.titre.localeCompare(b.titre, 'fr'));
}
