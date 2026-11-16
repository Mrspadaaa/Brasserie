import type { HopIngredient } from '../../types';
import { normalizeHop } from '../../domain/hopStage';

/**
 * Le tableau « variété × moment » de la fiche de recette (maquette r1) : une ligne par variété, une colonne par
 * moment réellement utilisé, dans l'ordre du procédé. Pure : elle ne lit que les ajouts de la recette.
 * Une cellule vide reste vide (jamais 0) ; plusieurs ajouts d'une variété au même moment s'additionnent.
 */
export type MomentKey = string;
export interface ColonneMoment { key: MomentKey; label: string; stage: HopIngredient['stage']; }
export type RoleDansLaRecette = 'amérisant' | 'aromatique' | 'double';
export interface LigneVariete {
  cle: string;
  nom: string;
  /** α de l'ajout (le premier renseigné) ; null = inconnu. */
  alpha: number | null;
  role: RoleDansLaRecette;
  doses: Record<MomentKey, number>;
}
export interface TableauMoments {
  colonnes: ColonneMoment[];
  lignes: LigneVariete[];
  /** Total à cru en g (null : aucun dry hop). */
  totalDryHop: number | null;
}

const cleDe = (nom: string) => nom.normalize('NFKC').toLocaleLowerCase('fr').replace(/[®™℠]/gu, '').replace(/\s+/gu, ' ').trim();
/** Moments d'amertume : 1er moût et ébullition d'au moins 15 minutes ; le reste est tardif. */
const amerisant = (h: HopIngredient) => h.stage === 'firstWort' || (h.stage === 'boil' && (h.timeMin ?? 0) >= 15);

export function momentDe(h: HopIngredient): MomentKey {
  if (h.stage === 'firstWort') return 'fwh';
  if (h.stage === 'whirlpool') return 'wp';
  if (h.stage === 'dryHop') return 'dh';
  return `b${h.timeMin ?? 0}`;
}

export function tableauMoments(hops: readonly HopIngredient[]): TableauMoments {
  const ajouts = hops.map(normalizeHop).filter((h) => h.name?.trim() && Number.isFinite(h.weightG));
  const boil = [...new Set(ajouts.filter((h) => h.stage === 'boil').map((h) => h.timeMin ?? 0))].sort((a, b) => b - a);
  const colonnes: ColonneMoment[] = [];
  if (ajouts.some((h) => h.stage === 'firstWort')) colonnes.push({ key: 'fwh', label: '1er moût', stage: 'firstWort' });
  for (const t of boil) colonnes.push({ key: `b${t}`, label: `${t}′`, stage: 'boil' });
  if (ajouts.some((h) => h.stage === 'whirlpool')) colonnes.push({ key: 'wp', label: 'whirlpool', stage: 'whirlpool' });
  if (ajouts.some((h) => h.stage === 'dryHop')) colonnes.push({ key: 'dh', label: 'dry hop', stage: 'dryHop' });

  const parCle = new Map<string, HopIngredient[]>();
  for (const h of ajouts) parCle.set(cleDe(h.name), [...(parCle.get(cleDe(h.name)) ?? []), h]);
  const lignes: LigneVariete[] = [...parCle].map(([cle, liste]) => {
    const doses: Record<MomentKey, number> = {};
    for (const h of liste) doses[momentDe(h)] = (doses[momentDe(h)] ?? 0) + h.weightG;
    const tot = liste.some(amerisant), tard = liste.some((h) => !amerisant(h));
    return {
      cle, nom: liste[0].name.trim(),
      alpha: liste.find((h) => h.alpha && h.alpha > 0)?.alpha ?? null,
      role: tot && tard ? 'double' : tot ? 'amérisant' : 'aromatique',
      doses
    };
  });
  // Dans l'ordre du procédé : la variété la plus tôt d'abord (colonne la plus à gauche), puis par nom.
  const rang = (l: LigneVariete) => { const i = colonnes.findIndex((c) => l.doses[c.key] != null); return i < 0 ? colonnes.length : i; };
  lignes.sort((a, b) => rang(a) - rang(b) || a.nom.localeCompare(b.nom, 'fr'));
  const dry = ajouts.filter((h) => h.stage === 'dryHop').reduce((s, h) => s + h.weightG, 0);
  return { colonnes, lignes, totalDryHop: colonnes.some((c) => c.key === 'dh') ? dry : null };
}
