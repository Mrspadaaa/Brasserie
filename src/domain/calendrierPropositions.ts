import type { Batch } from '../types';
import type { ForecastItem } from './finance/forecast';
import { isoDate } from './finance/ledger';
import { actualBrewDate, hasBrewStarted, plannedBrewDate } from './batchSchedule';
import { ajouterJours, ecartJours, jourLisible, lundiDe, type ChoseCalendrier } from './calendrier';

/**
 * Propositions en pointillé, acceptées d'un toucher (E47, D-43, L5 « Tous »). Fonctions pures : le jour est un paramètre.
 *
 * Deux sources, toutes deux lues dans l'app :
 * - brassins habituels : une recette brassée au moins deux fois (`Batch.recipeRef`, brassin non archivé, jour de brassage réel) est proposée
 *   à l'intervalle MOYEN de ses brassages, compté depuis son dernier brassage ;
 * - échéances : les lignes récurrentes non payées de la prévision de Finances (`source: 'recurring'`).
 *
 * Non porté : la saison du frigo. Aucune saison ni aucun frigo daté n'existe dans l'app ; rien n'est inventé ici (D-43, MISSION § Données).
 */

/** Les jours de brassage réels d'une recette (ISO, distincts, croissants). */
function brassagesDe(batches: readonly Batch[], recipeRef: string): string[] {
  const jours = new Set<string>();
  for (const b of batches) {
    if (b.recipeRef !== recipeRef || b.archivedAt || b.status === 'annule' || !hasBrewStarted(b)) continue;
    const jour = isoDate(actualBrewDate(b));
    if (jour) jours.add(jour);
  }
  return [...jours].sort();
}

/**
 * Brassin habituel : le lundi de (dernier brassage + moyenne des écarts entre brassages consécutifs). Rien avant deux brassages (jamais un
 * intervalle de 0), rien si un brassin de la même recette est déjà planifié après le dernier brassage. Une date déjà passée se pose cette semaine.
 */
export function brassinsHabituels(batches: readonly Batch[], jour: string): ChoseCalendrier[] {
  const refs = [...new Set(batches.map(b => b.recipeRef).filter((r): r is string => !!r))].sort();
  const sortie: ChoseCalendrier[] = [];
  for (const ref of refs) {
    const jours = brassagesDe(batches, ref);
    if (jours.length < 2) continue;
    const ecarts = jours.slice(1).map((j, i) => ecartJours(jours[i], j));
    const moyen = Math.round(ecarts.reduce((s, e) => s + e, 0) / ecarts.length);
    if (!(moyen >= 1)) continue;
    const dernier = jours[jours.length - 1];
    const dejaPlanifie = batches.some(b => b.recipeRef === ref && !b.archivedAt && b.status !== 'annule' && !hasBrewStarted(b) && (isoDate(plannedBrewDate(b)) ?? '') > dernier);
    if (dejaPlanifie) continue;
    const propose = ajouterJours(dernier, moyen);
    const cetteSemaine = lundiDe(jour);
    const lundi = lundiDe(propose) < cetteSemaine ? cetteSemaine : lundiDe(propose);
    const recents = batches.filter(b => b.recipeRef === ref && !b.archivedAt && hasBrewStarted(b)).sort((a, b) => (isoDate(actualBrewDate(b)) ?? '').localeCompare(isoDate(actualBrewDate(a)) ?? ''));
    const nom = recents[0]?.name || ref;
    sortie.push({
      id: `proposition-brassin-${ref}`, rangee: 'brassins', titre: nom, debut: lundi, fin: lundi, probable: true, proposition: 'brassin-habituel', recipeRef: ref,
      detail: `proposé vers le ${jourLisible(propose)} · tous les ${moyen} j (${jours.length} brassages)`,
      source: { genre: 'proposition', id: ref }, ouvre: { ecran: 'brassin' },
      deplacable: { raison: 'Une proposition se pose d’abord : touche-la pour l’ajouter, puis déplace le brassin.' }
    });
  }
  return sortie;
}

export type ItemEcheance = ForecastItem & { proposition?: 'echeance' };

/**
 * Échéances (E47 c) : seules les lignes récurrentes de la prévision sont marquées. Une occurrence payée a quitté la prévision (il n'en reste que
 * le reste à payer), donc le pointillé s'en va avec elle. Une ligne `invoice` ou `plan` n'est jamais marquée.
 */
export function echeancesProposees(items: readonly ForecastItem[]): ItemEcheance[] {
  return items.map(item => (item.source === 'recurring' ? { ...item, proposition: 'echeance' as const } : { ...item }));
}
