/**
 * Contexte du brassin lu pour l'accueil, l'attente et la remise à zéro du compagnon (fx2b, maquette p2a).
 *
 * Tout vient de données déjà dans l'app, sans appel serveur : le brassin enregistré (`StorageService`, sa recette figée
 * `recipeSnapshot` : dry hops, doses, jour de repère `dayOffset`, volume), le journal local passé au chat (`pitchedAt`, relevés
 * de température). Une valeur absente reste absente : jamais 0 par défaut. Pas de pression (le journal n'en a pas).
 */
import { useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { nombreTexte } from './derive';

export interface Jalon {
  nom: string;
  /** Jour de repère J+n (`dayOffset` du dry hop). */
  jour: number;
  /** Dose en grammes (somme des lignes du même houblon, même jour). */
  g: number;
}

export interface ContexteBrassin {
  /** J+n d'aujourd'hui : jour du levurage du journal, sinon jour brassé du brassin. Absent si inconnu. */
  jour?: number;
  volumeL?: number;
  jalons: Jalon[];
  temperature?: { c: number; depuisH?: number };
  /** Numéro du brassin (« LOT-031 » → 31). */
  numero?: string;
  nomRecette?: string;
}

const JOUR_MS = 86400000;
const jourCivil = (t: number) => {
  const d = new Date(t);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

type HopLike = { name?: unknown; weightG?: unknown; stage?: unknown; dayOffset?: unknown };
type RecetteLike = { name?: unknown; volumeL?: unknown; hops?: unknown };

/** Dry hops datés d'une recette, triés par jour ; un houblon sans `dayOffset` n'a pas de jour : il n'est pas montré. */
export function jalonsDeRecette(recette: RecetteLike | undefined): Jalon[] {
  const hops = Array.isArray(recette?.hops) ? (recette!.hops as HopLike[]) : [];
  const parCle = new Map<string, Jalon>();
  for (const h of hops) {
    if (h?.stage !== 'dryHop' || typeof h.name !== 'string') continue;
    const jour = h.dayOffset;
    const g = h.weightG;
    if (typeof jour !== 'number' || !Number.isFinite(jour) || jour < 0) continue;
    if (typeof g !== 'number' || !Number.isFinite(g) || g <= 0) continue;
    const cle = `${h.name}|${jour}`;
    const dejà = parCle.get(cle);
    if (dejà) dejà.g += g;
    else parCle.set(cle, { nom: h.name, jour, g });
  }
  return [...parCle.values()].sort((a, b) => a.jour - b.jour);
}

type Releve = { kind?: unknown; at?: unknown; value?: unknown; medium?: unknown };
/**
 * Dernière température de fermentation relevée, et depuis combien d'heures elle tient (±0,5 °C) : seulement si au moins deux
 * relevés consécutifs la confirment. Un relevé seul ne dit pas « depuis ».
 */
export function temperatureDuJournal(journal: unknown, maintenant: number): ContexteBrassin['temperature'] {
  const lus = (journal as { readings?: unknown } | undefined)?.readings;
  if (!Array.isArray(lus)) return undefined;
  const releves = (lus as Releve[])
    .filter(
      (r) =>
        r?.kind === 'temperature' &&
        typeof r.at === 'number' &&
        typeof r.value === 'number' &&
        Number.isFinite(r.value) &&
        (r.medium === undefined || r.medium === 'wort' || r.medium === 'chamber')
    )
    .sort((a, b) => (a.at as number) - (b.at as number));
  const dernier = releves[releves.length - 1];
  if (!dernier) return undefined;
  const c = dernier.value as number;
  let debut = dernier.at as number;
  let n = 1;
  for (let i = releves.length - 2; i >= 0 && Math.abs((releves[i].value as number) - c) <= 0.5; i--) {
    debut = releves[i].at as number;
    n++;
  }
  const heures = Math.round((maintenant - debut) / 3600000);
  return { c, ...(n >= 2 && heures >= 1 ? { depuisH: heures } : {}) };
}

export function contexteBrassin(
  scope: { kind: string; id: string },
  batch: { brewDate?: unknown; volumeL?: unknown; recipeSnapshot?: unknown } | undefined,
  recette: RecetteLike | undefined,
  journal: unknown,
  maintenant: number = Date.now()
): ContexteBrassin {
  const numero = scope.kind === 'batch' ? /^LOT-0*(\d+)$/i.exec(scope.id)?.[1] : undefined;
  const leve = (journal as { pitchedAt?: unknown } | undefined)?.pitchedAt;
  let origine: number | undefined;
  if (typeof leve === 'number' && Number.isFinite(leve) && leve > 1e11) origine = leve;
  else if (typeof batch?.brewDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(batch.brewDate)) {
    const [a, m, j] = batch.brewDate.slice(0, 10).split('-').map(Number);
    origine = new Date(a, m - 1, j).getTime();
  }
  let jour: number | undefined;
  if (origine !== undefined) {
    const ecart = Math.round((jourCivil(maintenant) - jourCivil(origine)) / JOUR_MS);
    if (ecart >= 0) jour = ecart;
  }
  const volume = [recette?.volumeL, batch?.volumeL].find((v): v is number => typeof v === 'number' && v > 0);
  return {
    ...(jour !== undefined ? { jour } : {}),
    ...(volume !== undefined ? { volumeL: volume } : {}),
    jalons: scope.kind === 'batch' ? jalonsDeRecette(recette) : [],
    ...(scope.kind === 'batch' ? { temperature: temperatureDuJournal(journal, maintenant) } : {}),
    ...(numero ? { numero } : {}),
    ...(typeof recette?.name === 'string' ? { nomRecette: recette.name } : {})
  };
}

/** Prochain dry hop à venir (aujourd'hui compris), et l'écart en jours. */
export function prochainJalon(c: ContexteBrassin): (Jalon & { dans: number }) | undefined {
  if (c.jour === undefined) return undefined;
  const j = c.jalons.find((x) => x.jour >= c.jour!);
  return j ? { ...j, dans: j.jour - c.jour } : undefined;
}

export const doseTotale = (jalons: Jalon[]): number => jalons.reduce((s, j) => s + j.g, 0);
/** « 9,0 » : g/L avec une décimale, ou `undefined` si le volume est inconnu. */
export const gParLitre = (jalons: Jalon[], volumeL: number | undefined): string | undefined =>
  volumeL && volumeL > 0 && jalons.length ? (doseTotale(jalons) / volumeL).toFixed(1).replace('.', ',') : undefined;
export const grammes = (g: number): string => nombreTexte(Math.round(g * 10) / 10);

/** Quand : « demain », « aujourd'hui », « dans 3 j ». */
export const quand = (dans: number): string => (dans === 0 ? 'aujourd’hui' : dans === 1 ? 'demain' : `dans ${dans} j`);

const lireBatches = () => StorageService.getBatches();
const lireRecettes = () => StorageService.getRecipes();

/**
 * Lit le contexte du brassin pour la portée du chat : brassin enregistré, recette figée du brassin (ou brouillon, ou recette
 * enregistrée), journal local. Se met à jour avec le stockage local.
 */
export function useContexteBrassin(scope: { kind: string; id: string }, draft: unknown, journal: unknown): ContexteBrassin {
  const batches = useStorageValue(lireBatches);
  const recettes = useStorageValue(lireRecettes);
  return useMemo(() => {
    const batch = scope.kind === 'batch' ? batches.find((b) => b.id === scope.id) : undefined;
    const recette: RecetteLike | undefined =
      scope.kind === 'batch'
        ? (batch?.recipeSnapshot as RecetteLike | undefined)
        : scope.kind === 'recipe'
          ? (recettes.find((r) => r.id === scope.id) as RecetteLike | undefined)
          : scope.kind === 'draft' && draft && typeof draft === 'object'
            ? (draft as RecetteLike)
            : undefined;
    return contexteBrassin(scope, batch, recette, journal);
    // `Date.now()` dans le calcul : le jour ne change qu'à l'ouverture de la feuille ou à une donnée neuve.
  }, [scope.kind, scope.id, batches, recettes, draft, journal]);
}
