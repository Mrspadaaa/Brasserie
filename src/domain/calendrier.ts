import type { Batch, CreativeItem } from '../types';
import type { ForecastItem } from './finance/forecast';
import { isoDate } from './finance/ledger';
import { actualBrewDate, plannedBrewDate } from './batchSchedule';

/**
 * Le calendrier (onglet choisi le 16.11, maquette onglet/v1 : « avoir un onglet calendrier en bas pour le global ») : six semaines
 * à partir du lundi de la semaine courante, quatre voies (Brassins, Événements, Ventes, Achats).
 *
 * Aucune donnée inventée : chaque barre vient d'un brassin, d'un événement de l'agenda ou d'une ligne de la prévision de Finances
 * (`buildForecast`). Une date inconnue ne pose rien : l'élément reste hors du calendrier, jamais placé à une date supposée. Aucun mois
 * ni aucune semaine ne passe par `Date` local (fuseau) : tout est calculé en jours UTC depuis le texte ISO.
 *
 * Numéro de semaine : ISO 8601 (jeudi de la semaine, 1er janvier = semaine du premier jeudi), le même que les « S49 » du reste de l'app.
 */

export type VoieCalendrier = 'brassins' | 'evenements' | 'ventes' | 'achats';

export const VOIES: ReadonlyArray<{ id: VoieCalendrier; nom: string }> = [
  { id: 'brassins', nom: 'Brassins' },
  { id: 'evenements', nom: 'Événements' },
  { id: 'ventes', nom: 'Ventes' },
  { id: 'achats', nom: 'Achats et charges' }
];

export interface SemaineCalendrier {
  index: number;
  /** Le lundi, en ISO (aaaa-mm-jj). */
  debut: string;
  numero: number;
  /** « 16.11 » */
  jourMois: string;
}

export interface EvenementCalendrier {
  id: string;
  voie: VoieCalendrier;
  titre: string;
  detail: string;
  /** Première et dernière semaine occupées (index dans `semaines`), bornes comprises. */
  a: number;
  b: number;
  /** Montant en centimes quand la source en donne un (positif = entrée, négatif = sortie). Absent = inconnu, jamais 0. */
  centimes?: number;
  /** Ce qui manque pour que le montant soit entier. */
  partiel?: boolean;
  /** Brassin à ouvrir au toucher. */
  batchId?: string;
}

const JOUR = 86400000;
const utc = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const versIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Le lundi de la semaine qui contient `iso`. */
export function lundiDe(iso: string): string {
  const ms = utc(iso);
  const jour = (new Date(ms).getUTCDay() + 6) % 7; // lundi = 0
  return versIso(ms - jour * JOUR);
}

/** Numéro ISO 8601 de la semaine qui contient `iso`. */
export function numeroSemaine(iso: string): number {
  const jeudi = utc(lundiDe(iso)) + 3 * JOUR;
  const debutAnnee = Date.UTC(new Date(jeudi).getUTCFullYear(), 0, 1);
  return Math.floor((jeudi - debutAnnee) / JOUR / 7) + 1;
}

export function semainesDe(aujourdhui: string, nombre = 6): SemaineCalendrier[] {
  const premier = utc(lundiDe(aujourdhui));
  return Array.from({ length: nombre }, (_, index) => {
    const debut = versIso(premier + index * 7 * JOUR);
    return { index, debut, numero: numeroSemaine(debut), jourMois: `${debut.slice(8, 10)}.${debut.slice(5, 7)}` };
  });
}

/** L'index de la semaine d'un jour ; `null` hors des semaines montrées. */
export function indexSemaine(semaines: readonly SemaineCalendrier[], jour: string | null | undefined): number | null {
  const iso = isoDate(jour ?? undefined);
  if (!iso || !semaines.length) return null;
  const ecart = Math.floor((utc(iso) - utc(semaines[0].debut)) / JOUR / 7);
  return ecart >= 0 && ecart < semaines.length ? ecart : null;
}

const jourCourt = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

/** Les jours que la recette prévoit à la fermentation et à la garde (somme des étapes) ; `null` quand la recette n'en dit rien (jamais 0). */
function joursPrevus(batch: Batch): number | null {
  const etapes = batch.recipeSnapshot?.fermentation ?? [];
  const total = etapes.reduce((s, e) => s + (Number.isFinite(e.days) && e.days > 0 ? e.days : 0), 0);
  return total > 0 ? total : null;
}

/** « Emballage · Triple d'automne » : le titre court d'une ligne de prévision de brassin ; le reste (« date estimée », « à compléter ») va dans le détail. */
function titreCourtArgent(item: ForecastItem): { titre: string; notes: string[] } {
  const parts = item.label.split(' · ').map(s => s.trim()).filter(Boolean);
  if (item.source !== 'brew' || parts.length < 2) return { titre: item.label, notes: [] };
  const [brassin, categorie, ...reste] = parts;
  // Le titre dit le premier mot de la catégorie (« Énergie · Porter fumé ») ; son nom entier passe au détail.
  const court = categorie.split(' ')[0];
  return {
    titre: `${court.charAt(0).toUpperCase()}${court.slice(1)} · ${brassin}`,
    notes: [...(court !== categorie ? [categorie] : []), ...reste.map(r => r.replace(/^partiel,?\s*/i, '')).filter(Boolean)]
  };
}

/**
 * Brassins : un brassin planifié pose une barre à sa semaine de brassage ; un brassin en cuve (fermentation, garde) occupe la semaine
 * courante avec son âge (« en cuve · J+4 ») — on ne sait pas quand il sera fini, aucune fin n'est inventée ; un brassin conditionné dans
 * les semaines montrées pose sa date de conditionnement.
 */
export function evenementsBrassins(batches: readonly Batch[], semaines: readonly SemaineCalendrier[], aujourdhui: string, joursDepuis: (b: Batch) => number | undefined): EvenementCalendrier[] {
  const sortie: EvenementCalendrier[] = [];
  for (const batch of batches) {
    if (batch.status === 'annule' || batch.archivedAt) continue;
    const nom = `${batch.id} ${batch.name}`.trim();
    if (batch.status === 'planifie') {
      const prevu = isoDate(plannedBrewDate(batch));
      const i = indexSemaine(semaines, prevu);
      if (prevu && i !== null) sortie.push({ id: `brassin-${batch.id}`, voie: 'brassins', titre: nom, detail: `brassage prévu le ${jourCourt(prevu)}`, a: i, b: i, batchId: batch.id });
      continue;
    }
    if (batch.status === 'fermentation' || batch.status === 'garde') {
      const age = joursDepuis(batch);
      const brasse = isoDate(actualBrewDate(batch));
      const brasseDansLaSemaine = brasse && indexSemaine(semaines, brasse) === 0;
      // La barre court jusqu'à la fin prévue (jour brassé + jours de la recette) ; sans recette qui les dise, elle reste à la semaine courante.
      const jours = joursPrevus(batch);
      const fin = brasse && jours ? versIso(utc(brasse) + jours * JOUR) : null;
      const iFin = fin ? (fin > semaines[semaines.length - 1].debut && indexSemaine(semaines, fin) === null ? semaines.length - 1 : indexSemaine(semaines, fin)) : null;
      const b = iFin !== null && iFin > 0 ? iFin : 0;
      sortie.push({
        id: `brassin-${batch.id}`, voie: 'brassins', titre: nom, batchId: batch.id, a: 0, b,
        detail: `${batch.status === 'garde' ? 'en garde' : 'en cuve'}${age !== undefined ? ` · J+${age}` : ''}${brasseDansLaSemaine && brasse ? ` · brassé le ${jourCourt(brasse)}` : ''}${fin && b > 0 ? ` · fin prévue le ${jourCourt(fin)}` : ''}`
      });
      continue;
    }
    const mis = isoDate(batch.bottlingDate);
    const i = indexSemaine(semaines, mis);
    if (mis && i !== null && aujourdhui >= mis) sortie.push({ id: `brassin-${batch.id}`, voie: 'brassins', titre: nom, detail: `conditionné le ${jourCourt(mis)}`, a: i, b: i, batchId: batch.id });
  }
  return sortie;
}

/** Événements de l'agenda (fêtes, marchés) : seulement ceux qui ont une date, et qui ne sont pas faits. */
export function evenementsAgenda(items: readonly CreativeItem[], semaines: readonly SemaineCalendrier[]): EvenementCalendrier[] {
  const sortie: EvenementCalendrier[] = [];
  for (const item of items) {
    if (item.type !== 'event' || item.status === 'done') continue;
    const jour = isoDate(item.date);
    const i = indexSemaine(semaines, jour);
    if (!jour || i === null) continue;
    sortie.push({ id: `agenda-${item.id}`, voie: 'evenements', titre: item.title, detail: `le ${jourCourt(jour)}${item.description ? ` · ${item.description}` : ''}`, a: i, b: i });
  }
  return sortie;
}

/**
 * Ventes et achats : les lignes DATÉES de la prévision de Finances. La tendance (moyenne des mois passés) n'est pas un fait daté : elle
 * reste dans Finances. Un montant partiel (`partial`) est signalé, jamais complété.
 */
export function evenementsArgent(items: readonly ForecastItem[], semaines: readonly SemaineCalendrier[]): EvenementCalendrier[] {
  const sortie: EvenementCalendrier[] = [];
  for (const item of items) {
    if (item.source === 'trend') continue;
    const i = indexSemaine(semaines, item.date);
    if (i === null) continue;
    const entree = item.direction === 'in';
    const { titre, notes } = titreCourtArgent(item);
    const notesDit = notes.length ? ` · ${notes.join(' · ')}` : '';
    // Une ligne datée à 0 CHF est un coût que la fiche ne connaît pas encore : on ne l'écrit pas « +0,00 » (l'inconnu n'est jamais 0).
    if (!item.amountCents) {
      sortie.push({ id: `argent-${item.id}`, voie: entree ? 'ventes' : 'achats', titre, detail: `le ${jourCourt(item.date)} · montant non renseigné${notesDit}`, a: i, b: i });
      continue;
    }
    sortie.push({
      id: `argent-${item.id}`, voie: entree ? 'ventes' : 'achats', titre,
      detail: `le ${jourCourt(item.date)}${notesDit || (item.partial?.length ? ' · montant partiel' : '')}`, a: i, b: i,
      centimes: entree ? item.amountCents : -item.amountCents, ...(item.partial?.length ? { partiel: true } : {})
    });
  }
  return sortie;
}

/** Ce qui touche la semaine `i`. */
export const duneSemaine = (evenements: readonly EvenementCalendrier[], i: number) => evenements.filter(e => e.a <= i && e.b >= i);

/** Total connu d'une voie en centimes ; `null` quand aucune ligne n'a de montant (l'inconnu n'est pas 0). */
export function totalVoie(evenements: readonly EvenementCalendrier[], voie: VoieCalendrier): number | null {
  const lignes = evenements.filter(e => e.voie === voie && e.centimes !== undefined);
  return lignes.length ? lignes.reduce((s, e) => s + (e.centimes ?? 0), 0) : null;
}
