import type { Batch, CreativeItem, FenetreCalendrier } from '../types';
import type { ForecastItem } from './finance/forecast';
import type { FinancialPlan } from './finance/types';
import { formatCHF, isoDate } from './finance/ledger';
import { actualBrewDate, hasBrewStarted, plannedBrewDate, plannedDateIsPast } from './batchSchedule';
import { delaiAppris, type ReglagesFournisseurs } from './fournisseurs';
import type { CourbeCaisse, Creux } from './calendrierCaisse';

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

/* =====================================================================================================================================
 * Port du calendrier retenu dans l'app (17.11) : sept rangées, une chose = un début et une fin, jalons de brassin, échelle partagée par la
 * courbe et la frise. Fonctions pures : le jour est toujours un paramètre. Les anciennes voies ci-dessus restent pour l'onglet v1 jusqu'à
 * son remplacement (lot C).
 * ===================================================================================================================================== */

export type Rangee = 'brassins' | 'fetes' | 'ventes' | 'achats' | 'travaux' | 'activites' | 'papiers';

/** Les sept rangées, dans l'ordre de la frise (E20). */
export const RANGEES: ReadonlyArray<{ id: Rangee; nom: string }> = [
  { id: 'brassins', nom: 'Brassins' },
  { id: 'fetes', nom: 'Fêtes' },
  { id: 'ventes', nom: 'Ventes' },
  { id: 'achats', nom: 'Achats' },
  { id: 'travaux', nom: 'Travaux' },
  { id: 'activites', nom: 'Activités' },
  { id: 'papiers', nom: 'Papiers' }
];
export const nomRangee = (id: Rangee): string => RANGEES.find(r => r.id === id)?.nom ?? id;
/** « Fêtes seules », « Brassins seuls » : l'accord suit le genre du nom. */
export const nomSeules = (id: Rangee): string => `${nomRangee(id)} ${id === 'fetes' || id === 'ventes' || id === 'activites' ? 'seules' : 'seuls'}`;

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;

export const ajouterJours = (iso: string, n: number): string => versIso(utc(iso) + n * JOUR);
export const dimancheDe = (iso: string): string => ajouterJours(lundiDe(iso), 6);
export const ecartJours = (de: string, a: string): number => Math.round((utc(a) - utc(de)) / JOUR);
/** Semaines entières entre le lundi de `de` et le lundi de `a` (négatif si `a` est avant). */
export const ecartSemaines = (de: string, a: string): number => Math.round((utc(lundiDe(a)) - utc(lundiDe(de))) / (7 * JOUR));
export const etiquetteS = (iso: string): string => `S${numeroSemaine(iso)}`;
/** « 14 déc. » */
export const jourLisible = (iso: string): string => `${Number(iso.slice(8, 10))} ${MOIS_COURTS[Number(iso.slice(5, 7)) - 1]}`;
/** E04, i3 : « S50, 7 – 13 déc. » */
export function dateDeSemaine(lundi: string): string {
  const fin = ajouterJours(lundi, 6);
  const m1 = Number(lundi.slice(5, 7)) - 1, m2 = Number(fin.slice(5, 7)) - 1;
  const plage = m1 === m2 ? `${Number(lundi.slice(8))} – ${Number(fin.slice(8))} ${MOIS_COURTS[m2]}` : `${Number(lundi.slice(8))} ${MOIS_COURTS[m1]} – ${Number(fin.slice(8))} ${MOIS_COURTS[m2]}`;
  return `S${numeroSemaine(lundi)}, ${plage}`;
}
/** Des francs entiers à la suisse, « 5 064 » ; le signe est un vrai moins. Jamais appelé sur un montant inconnu. */
export const francs = (centimes: number): string => {
  const n = Math.round(Math.abs(centimes) / 100);
  return `${centimes < 0 && n > 0 ? '−' : ''}${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
};
/** « +1 800 » ou « −1 800 » */
export const francsSignes = (centimes: number): string => `${centimes < 0 ? '' : '+'}${francs(centimes)}`;

/** La courbe porte 52 semaines à partir du lundi de la semaine courante (E02). */
export const NB_SEMAINES_COURBE = 52;

/** Un tronçon de n semaines à partir de l'index `debut` (la fenêtre réglable, E06) ; borné aux semaines connues. */
export function fenetreSemaines(semaines: readonly SemaineCalendrier[], debut: number, nombre: number): SemaineCalendrier[] {
  const d = Math.max(0, Math.min(Math.max(0, semaines.length - nombre), Math.floor(debut)));
  return semaines.slice(d, d + Math.max(1, Math.floor(nombre)));
}

export interface MoisCalendrier { index: number; debut: string; fin: string; annee: number; mois: number; court: string }
/** L'année en douze mois à partir du mois de `aujourdhui` (c1-d, E13). */
export function anneeEnMois(aujourdhui: string): MoisCalendrier[] {
  const a = Number(aujourdhui.slice(0, 4)), m = Number(aujourdhui.slice(5, 7)) - 1;
  return Array.from({ length: 12 }, (_, index) => {
    const premier = new Date(Date.UTC(a, m + index, 1)), dernier = new Date(Date.UTC(a, m + index + 1, 0));
    return { index, debut: versIso(premier.getTime()), fin: versIso(dernier.getTime()), annee: premier.getUTCFullYear(), mois: premier.getUTCMonth() + 1, court: MOIS_COURTS[premier.getUTCMonth()] };
  });
}
/** Le mois qui contient `jour` ; `null` hors des douze mois. */
export function indexMois(mois: readonly MoisCalendrier[], jour: string): number | null {
  const i = mois.findIndex(m => jour >= m.debut && jour <= m.fin);
  return i < 0 ? null : i;
}

export interface EchelleSemaines {
  nbColonnes: number; largeur: number; largeurColonne: number;
  /** Bord gauche de la colonne i, en px. */
  x: (i: number) => number;
  /** Centre de la colonne i, en px. */
  centre: (i: number) => number;
  /** La colonne sous un x en px, bornée aux colonnes existantes. */
  indexAuX: (px: number) => number;
}
/** Une seule échelle pour la courbe et la frise : l'alignement vient de la construction (MISSION.md, État de l'art). */
export function echelleSemaines(nbColonnes: number, largeur: number): EchelleSemaines {
  const n = Math.max(1, Math.floor(nbColonnes)), l = Math.max(0, largeur), c = l / n;
  return { nbColonnes: n, largeur: l, largeurColonne: c, x: i => i * c, centre: i => (i + 0.5) * c, indexAuX: px => (c > 0 ? Math.min(n - 1, Math.max(0, Math.floor(px / c))) : 0) };
}

/** E27 : en 3 mois, 6 mois et An, une chose de moins de 24 px de large devient la marque de sa rangée. */
export const LARGEUR_MARQUE_MIN_PX = 24;
export const estMarque = (largeurPx: number): boolean => largeurPx < LARGEUR_MARQUE_MIN_PX;

/* ---------- la chose : ce qui se pose sur la frise ---------- */

/** Où ouvrir la source au toucher (E37). */
export interface CibleOuverture {
  ecran: 'brassin' | 'piece' | 'plan' | 'finances' | 'agenda' | 'atelier' | 'materiel' | 'courses' | 'fournisseur' | 'solde';
  id?: string;
}

export type SourceChose =
  | { genre: 'batch'; id: string; statut: Batch['status'] }
  | { genre: 'creative'; id: string; type: CreativeItem['type'] }
  | { genre: 'plan'; id: string; origine: FinancialPlan['source']; statut: FinancialPlan['status'] }
  | { genre: 'facture'; id: string }
  | { genre: 'prevision-brassin'; id: string }
  | { genre: 'projet-materiel'; id: string }
  | { genre: 'livraison'; id: string }
  | { genre: 'proposition'; id: string };

export type PropositionGenre = 'vente' | 'brassin-habituel' | 'echeance';
export type JalonId = 'brassage' | 'fermentation' | 'dry-hop' | 'garde' | 'conditionnement' | 'commander';

/** Un jalon est un écart à la date de brassage : il suit la barre, jamais écrit seul (E25, D-103). */
export interface JalonBrassin {
  id: JalonId; libelle: string;
  /** ISO. */
  jour: string;
  /** Jours depuis le jour de brassage (négatif pour « commander avant »). */
  ecart: number;
  /** `'barre'` : se glisse avec la barre ; `'fin'` : écrit `finPrevue` ; `false` : suit la recette (voir `raison`). */
  glissable: 'barre' | 'fin' | false;
  raison?: string;
}

export interface ChoseCalendrier {
  id: string; rangee: Rangee; titre: string;
  /** ISO, bornes comprises. Vides (`''`) pour une chose de la poche « Sans date ». */
  debut: string; fin: string;
  /** Signé : entrée positive, sortie négative. Absent = inconnu (jamais 0). */
  centimes?: number;
  /** Ce qui manque pour que le montant soit entier. */
  partiel?: boolean;
  /** En pointillé tant qu'elle n'est pas acceptée (vente probable, E26). */
  probable?: boolean;
  proposition?: PropositionGenre;
  /** Inconnu = absent : aucun point dans la piste. */
  joursActifs?: number;
  jalons?: JalonBrassin[];
  source: SourceChose;
  ouvre: CibleOuverture;
  /** `true`, ou la raison, qui nomme l'écran où la régler (E28). */
  deplacable: true | { raison: string };
  detail?: string;
  /** Ids des mouvements de la courbe de caisse que cette chose porte. */
  mouvements?: string[];
  fenetre?: FenetreCalendrier;
  miseDeCote?: boolean;
  liens?: { batchId?: string; clientId?: string };
  /** Brassin habituel proposé : la recette. */
  recipeRef?: string;
  /** Brassin : « prête le » (fin du cycle) et sa provenance. */
  preteLe?: string;
  /** Brassin en cuve dont la fin n'est écrite nulle part : la barre court jusqu'à aujourd'hui, sans fin inventée. */
  finInconnue?: boolean;
  /** Poche « Sans date » (E46). */
  sansDate?: true;
  /** Fête ou activité faite : `status: 'done'` (jamais posée). */
  fait?: boolean;
}

/** Le jour de brassage : le prévu pour un brassin planifié, le réel dès que le brassage a commencé. */
function jourZero(batch: Batch): string | null {
  return isoDate(hasBrewStarted(batch) ? actualBrewDate(batch) : plannedBrewDate(batch));
}

/** La fin du cycle d'un brassin : `finPrevue` (écrite en tirant le bord), sinon jour de brassage + jours de la recette ; `null` quand rien ne la dit. */
export function finDeBrassin(batch: Batch): { jour: string; origine: 'finPrevue' | 'recette' } | null {
  const j0 = jourZero(batch);
  if (!j0) return null;
  const fin = isoDate(batch.finPrevue || undefined);
  if (fin && fin >= j0) return { jour: fin, origine: 'finPrevue' };
  const jours = joursPrevus(batch);
  return jours ? { jour: ajouterJours(j0, jours), origine: 'recette' } : null;
}

const raisonRecette = (libelle: string) => `${libelle} suit la recette du brassin`;

/**
 * Les jalons d'un brassin (E25), lus dans la recette figée : brassage, fermentation, dry hop (si la recette le date), garde, conditionnement.
 * Ce sont des écarts à la date de brassage ; « commander avant le … » s'y ajoute quand des courses manquent (`commanderLe`, ISO).
 * Aucune date n'est inventée : sans jours dans la recette, il ne reste que le brassage (et la fin, si `finPrevue` la dit).
 */
export function jalonsBrassin(batch: Batch, options: { commanderLe?: string | null } = {}): JalonBrassin[] {
  const j0 = jourZero(batch);
  if (!j0) return [];
  const demarre = hasBrewStarted(batch);
  const jalons: JalonBrassin[] = [{
    id: 'brassage', libelle: 'Brassage', jour: j0, ecart: 0, glissable: demarre ? false : 'barre',
    ...(demarre ? { raison: 'Brassin en cuve : le jour de brassage ne bouge pas' } : {})
  }];
  const etapes = batch.recipeSnapshot?.fermentation ?? [];
  const jours = (e: { days: number }) => (Number.isFinite(e.days) && e.days > 0 ? e.days : 0);
  const total = etapes.reduce((s, e) => s + jours(e), 0);
  const fin = finDeBrassin(batch);
  const ecartFin = fin ? ecartJours(j0, fin.jour) : null;
  const pose = (id: JalonId, libelle: string, ecart: number) => {
    if (ecartFin !== null && ecart >= ecartFin) return;
    jalons.push({ id, libelle, jour: ajouterJours(j0, ecart), ecart, glissable: false, raison: raisonRecette(libelle) });
  };
  if (total > 0) pose('fermentation', 'Fermentation', 1);
  const dry = (batch.recipeSnapshot?.hops ?? batch.hops ?? []).filter(h => h.stage === 'dryHop' && Number.isFinite(h.dayOffset) && (h.dayOffset ?? -1) >= 0).map(h => h.dayOffset as number);
  if (dry.length) pose('dry-hop', 'Dry hop', Math.min(...dry));
  let cumul = 0;
  for (const e of etapes) {
    if (e.kind === 'garde' && cumul > 0) { pose('garde', 'Garde', cumul); break; }
    cumul += jours(e);
  }
  if (ecartFin !== null && ecartFin > 0) jalons.push({ id: 'conditionnement', libelle: 'Conditionnement', jour: fin!.jour, ecart: ecartFin, glissable: 'fin' });
  if (options.commanderLe) {
    const ecart = ecartJours(j0, options.commanderLe);
    if (ecart < 0) jalons.push({ id: 'commander', libelle: 'Commander', jour: options.commanderLe, ecart, glissable: false, raison: 'Ce jalon se calcule des courses' });
  }
  return jalons.sort((a, b) => a.ecart - b.ecart);
}

/** Brassin : une barre de son jour de brassage à « prête le » (E25). `null` : annulé, archivé, ou sans date connue. */
export function choseBrassin(batch: Batch, aujourdhui: string, options: { commanderLe?: string | null } = {}): ChoseCalendrier | null {
  if (batch.status === 'annule' || batch.archivedAt) return null;
  const demarre = hasBrewStarted(batch);
  const base = { id: `brassin-${batch.id}`, rangee: 'brassins' as const, titre: batch.name || batch.id, source: { genre: 'batch' as const, id: batch.id, statut: batch.status }, ouvre: { ecran: 'brassin' as const, id: batch.id } };
  if (batch.status === 'conditionne' || batch.status === 'termine') {
    const mis = isoDate(batch.bottlingDate);
    if (!mis) return null;
    return { ...base, debut: mis, fin: mis, detail: 'conditionné', deplacable: { raison: 'Brassin conditionné : sa date est un fait, pas une prévision. Elle se corrige dans la fiche du brassin (Brassins).' } };
  }
  const j0 = jourZero(batch);
  if (!j0) return null;
  const fin = finDeBrassin(batch);
  if (batch.status === 'planifie' && !demarre) {
    return { ...base, debut: j0, fin: fin?.jour ?? j0, ...(fin ? { preteLe: fin.jour } : {}), detail: 'planifié', jalons: jalonsBrassin(batch, options), deplacable: true };
  }
  return {
    ...base, debut: j0, fin: fin?.jour ?? (aujourdhui > j0 ? aujourdhui : j0), ...(fin ? { preteLe: fin.jour } : { finInconnue: true as const }),
    detail: batch.status === 'garde' ? 'en garde' : 'en cuve', jalons: jalonsBrassin(batch, options),
    deplacable: { raison: 'Brassin en cuve : le jour de brassage ne bouge pas. Seul le jalon de fin se glisse.' }
  };
}

const valide = (n: number | undefined): number | undefined => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined);

/** La fenêtre lue d'une source : ses deux bords ISO, dans l'ordre, ou `null`. */
export function fenetreLue(f: FenetreCalendrier | undefined): { du: string; au: string; joursActifs?: number; miseDeCote: boolean } | null {
  const du = isoDate(f?.du), au = isoDate(f?.au);
  if (!f || !du || !au || au < du) return null;
  const jours = valide(f.joursActifs);
  return { du, au, ...(jours ? { joursActifs: jours } : {}), miseDeCote: f.miseDeCote === true };
}

/**
 * Fêtes (CreativeItem `event` daté, pas fait) et Activités (daté, pas un `event` ou marqué `activite`, pas fait). Une idée de recette est une
 * icône de la bande (`iconesIdees`), un projet de matériel arrive par son plan (Travaux). Sans date : `null`, jamais posée.
 */
export function choseCreative(item: CreativeItem): ChoseCalendrier | null {
  if (item.type === 'recipe-idea' || item.type === 'equipment' || item.status === 'done') return null;
  const jour = isoDate(item.date);
  if (!jour) return null;
  const f = fenetreLue(item.fenetre);
  const activite = item.type !== 'event' || item.activite === true;
  /* un montant écrit sur la chose : une dépense estimée (−), ou pour une fête la rentrée estimée (+) ; sinon inconnu, jamais 0 */
  const cout = activite
    ? (typeof item.estimatedCost === 'number' && item.estimatedCost > 0 ? -Math.round(item.estimatedCost * 100) : undefined)
    : typeof item.estimatedRevenue === 'number' && item.estimatedRevenue > 0 ? Math.round(item.estimatedRevenue * 100)
      : typeof item.estimatedCost === 'number' && item.estimatedCost > 0 ? -Math.round(item.estimatedCost * 100) : undefined;
  return {
    id: `creatif-${item.id}`, rangee: activite ? 'activites' : 'fetes', titre: item.title, debut: f?.du ?? jour, fin: f?.au ?? jour,
    ...(cout !== undefined ? { centimes: cout } : {}), ...(f?.joursActifs ? { joursActifs: f.joursActifs } : {}), ...(f?.miseDeCote ? { miseDeCote: true } : {}),
    ...(f ? { fenetre: item.fenetre } : {}), ...(item.liens ? { liens: item.liens } : {}),
    source: { genre: 'creative', id: item.id, type: item.type }, ouvre: item.type === 'event' ? { ecran: 'agenda', id: item.id } : { ecran: 'atelier', id: item.id },
    ...(item.description ? { detail: item.description } : {}), deplacable: true
  };
}

/** Poche « Sans date » (E46) : un `CreativeItem` sans date, ni idée de recette ni fait. Aucune position. */
export function choseSansDate(item: CreativeItem): ChoseCalendrier | null {
  if (item.type === 'recipe-idea' || item.status === 'done' || isoDate(item.date)) return null;
  const activite = item.type !== 'event' || item.activite === true;
  return {
    id: `creatif-${item.id}`, rangee: activite ? 'activites' : 'fetes', titre: item.title, debut: '', fin: '', sansDate: true,
    source: { genre: 'creative', id: item.id, type: item.type }, ouvre: item.type === 'event' ? { ecran: 'agenda', id: item.id } : { ecran: 'atelier', id: item.id },
    deplacable: true
  };
}

export interface IconeSemaine { id: string; lundi: string; numero: number; genre: 'idee' | 'retard'; titre: string; ouvre?: CibleOuverture }
/** E36, E05 : une idée du carnet (`recipe-idea` datée) est une petite icône de sa semaine, jamais une rangée. */
export function iconesIdees(items: readonly CreativeItem[]): IconeSemaine[] {
  const sortie: IconeSemaine[] = [];
  for (const item of items) {
    if (item.type !== 'recipe-idea' || item.status === 'done' || (item as { archivedAt?: string }).archivedAt) continue;
    const jour = isoDate(item.date);
    if (!jour) continue;
    const lundi = lundiDe(jour);
    sortie.push({ id: `idee-${item.id}`, lundi, numero: numeroSemaine(lundi), genre: 'idee', titre: item.title, ouvre: { ecran: 'atelier', id: item.id } });
  }
  return sortie.sort((a, b) => a.lundi.localeCompare(b.lundi) || a.id.localeCompare(b.id));
}

const CATEGORIES_TRAVAUX = ['materiel', 'renovation'];
const raisonFinances = (quoi: string, ou: string) => `${quoi} se règle dans ${ou}.`;

/**
 * Les lignes datées de la prévision de Finances (hors tendance) : Ventes (entrées), Achats (plan, brassin), Travaux (matériel, rénovation,
 * projets de matériel), Papiers (factures à payer, récurrentes, TVA et clôture). Une ligne à 0 CHF n'a pas de `centimes`.
 */
export function choseArgent(item: ForecastItem, plans: readonly FinancialPlan[] = []): ChoseCalendrier | null {
  if (item.source === 'trend') return null;
  const jour = isoDate(item.date);
  if (!jour) return null;
  const plan = item.planId ? plans.find(p => p.id === item.planId) : undefined;
  const entree = item.direction === 'in';
  const { titre, notes } = titreCourtArgent(item);
  let rangee: Rangee, source: SourceChose, ouvre: CibleOuverture, deplacable: ChoseCalendrier['deplacable'];
  if (item.source === 'invoice') {
    const tx = item.id.replace(/^invoice:/, '');
    rangee = entree ? 'ventes' : 'papiers'; source = { genre: 'facture', id: tx }; ouvre = { ecran: 'piece', id: tx };
    deplacable = { raison: raisonFinances('Une facture', 'la facture (Finances › Opérations)') };
  } else if (item.source === 'brew') {
    rangee = entree ? 'ventes' : CATEGORIES_TRAVAUX.includes(item.category) ? 'travaux' : 'achats'; source = { genre: 'prevision-brassin', id: item.batchId ?? item.planId ?? item.id };
    ouvre = item.batchId ? { ecran: 'brassin', id: item.batchId } : { ecran: 'finances' };
    deplacable = { raison: 'Cette sortie suit la date de son brassin : à régler dans Brassins.' };
  } else if (item.source === 'equipment') {
    rangee = 'travaux'; source = { genre: 'projet-materiel', id: item.planId ?? item.id }; ouvre = { ecran: 'materiel', id: item.planId };
    deplacable = { raison: 'Un projet de matériel se règle dans Matériel (Atelier).' };
  } else if (item.source === 'recurring') {
    rangee = entree ? 'ventes' : 'papiers'; source = { genre: 'plan', id: item.planId ?? item.id, origine: plan?.source ?? 'recurring', statut: plan?.status ?? 'active' }; ouvre = { ecran: 'plan', id: item.planId };
    deplacable = { raison: raisonFinances('Une charge fixe', 'Finances (le plan récurrent)') };
  } else if (plan?.source === 'tax') {
    rangee = 'papiers'; source = { genre: 'plan', id: plan.id, origine: 'tax', statut: plan.status }; ouvre = { ecran: 'plan', id: plan.id };
    deplacable = { raison: raisonFinances('Une échéance de TVA ou de clôture', 'Finances › Annuel') };
  } else {
    rangee = entree ? 'ventes' : CATEGORIES_TRAVAUX.includes(item.category) ? 'travaux' : item.category === 'chargesFixes' ? 'papiers' : 'achats';
    const manuel = plan?.source === 'manual';
    source = { genre: 'plan', id: item.planId ?? item.id, origine: plan?.source ?? 'manual', statut: plan?.status ?? 'active' }; ouvre = { ecran: 'plan', id: item.planId };
    deplacable = manuel ? true : { raison: raisonFinances('Cette prévision', 'Finances') };
  }
  const f = item.source === 'plan' ? fenetreLue(plan?.fenetre) : null;
  const montant = item.amountCents > 0 ? { centimes: entree ? item.amountCents : -item.amountCents, ...(item.partial?.length ? { partiel: true as const } : {}) } : {};
  const notesDit = notes.length ? ` · ${notes.join(' · ')}` : '';
  return {
    id: `argent-${item.id}`, rangee, titre, debut: f?.du ?? jour, fin: f?.au ?? jour, ...montant,
    ...(f?.joursActifs ? { joursActifs: f.joursActifs } : {}), ...(f?.miseDeCote ? { miseDeCote: true } : {}), ...(f ? { fenetre: plan?.fenetre } : {}),
    ...(plan?.batchId || plan?.clientId ? { liens: { ...(plan.batchId ? { batchId: plan.batchId } : {}), ...(plan.clientId ? { clientId: plan.clientId } : {}) } } : {}),
    detail: `le ${jourLisible(jour)}${!item.amountCents ? ' · montant non renseigné' : ''}${notesDit || (item.partial?.length ? ' · montant partiel' : '')}`,
    source, ouvre, deplacable, mouvements: [item.id]
  };
}

/** Vente probable : un `FinancialPlan` `in` en brouillon, en pointillé jusqu'à ce qu'on l'accepte (E26). Il n'est pas dans la prévision tant qu'il est brouillon. */
export function choseVenteProbable(plan: FinancialPlan): ChoseCalendrier | null {
  if (plan.direction !== 'in' || plan.status !== 'draft') return null;
  const jour = isoDate(plan.date);
  if (!jour) return null;
  const f = fenetreLue(plan.fenetre);
  return {
    id: `plan-${plan.id}`, rangee: 'ventes', titre: plan.title, debut: jour, fin: f?.au ?? jour, probable: true, proposition: 'vente',
    ...(plan.amountCents > 0 ? { centimes: plan.amountCents } : {}),
    ...(plan.batchId || plan.clientId ? { liens: { ...(plan.batchId ? { batchId: plan.batchId } : {}), ...(plan.clientId ? { clientId: plan.clientId } : {}) } } : {}),
    detail: `probable le ${jourLisible(jour)}`, source: { genre: 'plan', id: plan.id, origine: plan.source, statut: plan.status }, ouvre: { ecran: 'plan', id: plan.id }, deplacable: true
  };
}

/** Livraisons attendues : jour de la commande + délai appris, tant que `recue` est vide. Sans délai appris, rien n'est posé (jamais un délai supposé). */
export function livraisonsAttendues(reglages: ReglagesFournisseurs): ChoseCalendrier[] {
  const sortie: ChoseCalendrier[] = [];
  for (const [cle, commandes] of Object.entries(reglages.commandes)) {
    const delai = delaiAppris(commandes);
    if (!delai) continue;
    const nom = reglages.ajoutes.find(a => a.nom.trim().toLocaleLowerCase('fr') === cle)?.nom ?? `${cle.charAt(0).toLocaleUpperCase('fr')}${cle.slice(1)}`;
    commandes.forEach((c, i) => {
      const le = isoDate(c.le);
      if (!le || c.recue) return;
      const jour = ajouterJours(le, delai.jours);
      sortie.push({
        id: `livraison-${cle}-${i}`, rangee: 'achats', titre: `Livraison ${nom}`, debut: jour, fin: jour, detail: `commandée le ${jourLisible(le)} · délai appris ${delai.jours} j (${delai.sur} commande${delai.sur > 1 ? 's' : ''})`,
        source: { genre: 'livraison', id: `${cle}-${i}` }, ouvre: { ecran: 'fournisseur', id: cle }, deplacable: { raison: 'La livraison suit la commande : à régler dans Courses.' }
      });
    });
  }
  return sortie;
}

/** Où une chose se pose dans une fenêtre de semaines (index inclus) ; `null` si elle est entièrement dehors. */
export function positionChose(semaines: readonly SemaineCalendrier[], chose: { debut: string; fin: string }): { a: number; b: number; coupeAGauche: boolean; coupeADroite: boolean } | null {
  if (!semaines.length || !chose.debut) return null;
  const premier = semaines[0].debut, dernierJour = ajouterJours(semaines[semaines.length - 1].debut, 6);
  if (chose.fin < premier || chose.debut > dernierJour) return null;
  const a = Math.max(0, ecartSemaines(premier, chose.debut)), b = Math.min(semaines.length - 1, ecartSemaines(premier, chose.fin));
  return { a, b, coupeAGauche: chose.debut < premier, coupeADroite: chose.fin > dernierJour };
}

/* ---------- le modèle que lisent l'en-tête et la frise ---------- */

export type TypeRetard = 'facture' | 'brassin' | 'tache' | 'densite' | 'courses';
/** E08 : un retard se dit avec une date, jamais « en retard de 7 j ». `jour` est `null` quand la source n'en a pas (densité, courses). */
export interface Retard { id: string; genre: TypeRetard; titre: string; detail: string; jour: string | null; ouvre: CibleOuverture }

export interface HypotheseCaisse { id: 'depart' | 'tendance'; texte: string; source: string; ouvre: CibleOuverture }

export interface ModeleCalendrier {
  aujourdhui: string;
  /** 52 semaines à partir du lundi de la semaine courante. */
  semaines: SemaineCalendrier[];
  mois: MoisCalendrier[];
  /** Tout ce qui se pose sur la frise, propositions comprises (`proposition`, `probable`). */
  choses: ChoseCalendrier[];
  /** `null` quand le solde de départ est inconnu : jamais une courbe à 0 (E02). */
  courbe: CourbeCaisse | null;
  soldeDepartInconnu: boolean;
  /** « À dépenser sans passer sous 0 » : le minimum de la courbe libre dès la semaine courante, avec sa semaine. */
  creux: Creux | null;
  hypotheses: HypotheseCaisse[];
  retards: Retard[];
  /** Les choses de `choses` qui sont proposées (brassin habituel, échéance, vente probable). */
  propositions: ChoseCalendrier[];
  /** La poche « Sans date » (E46) : jamais posée, jamais « 0 ». */
  sansDate: ChoseCalendrier[];
  /** Idées datées du carnet, tâches en retard : les petites icônes de la bande ± (E05, E36). */
  icones: IconeSemaine[];
}

export interface EntreeRetards {
  aujourdhui: string;
  /** `periodeSynthese(...).aPayer` et `.aEncaisser` : seules celles qui sont `enRetard` comptent. */
  restes: ReadonlyArray<{ id: string; libelle: string; cents: number; echeance: string | null; enRetard: boolean }>;
  batches: readonly Batch[];
  items: readonly CreativeItem[];
  /** Brassins en fermentation sans densité relevée (le domaine de la fermentation les compte). */
  sansDensite?: readonly Batch[];
  /** `vueHorizon(...)` : « Commander pour X avant S49 ». */
  courses?: { nom: string; nombre: number; avant: string } | null;
}

/** E08 : ce qui est en retard, avec des dates (« échéance le 3 nov. »), jamais un compteur de jours. */
export function retardsDe(e: EntreeRetards): Retard[] {
  const sortie: Retard[] = [];
  for (const r of e.restes) {
    if (!r.enRetard || !r.echeance) continue;
    sortie.push({ id: `reste-${r.id}`, genre: 'facture', titre: r.libelle, detail: `échéance le ${jourLisible(r.echeance)} · ${formatCHF(r.cents)}`, jour: r.echeance, ouvre: { ecran: 'piece', id: r.id } });
  }
  for (const b of e.batches) {
    if (b.archivedAt || b.status !== 'planifie') continue;
    const prevu = isoDate(plannedBrewDate(b));
    if (!prevu || !plannedDateIsPast(b, Date.parse(`${e.aujourdhui}T12:00:00Z`))) continue;
    sortie.push({ id: `brassin-${b.id}`, genre: 'brassin', titre: b.name || b.id, detail: `brassage prévu le ${jourLisible(prevu)}`, jour: prevu, ouvre: { ecran: 'brassin', id: b.id } });
  }
  for (const t of e.items) {
    const jour = isoDate(t.date);
    if (t.type !== 'event' || t.status === 'done' || !jour || jour >= e.aujourdhui) continue;
    sortie.push({ id: `tache-${t.id}`, genre: 'tache', titre: t.title, detail: `prévue le ${jourLisible(jour)}`, jour, ouvre: { ecran: 'agenda', id: t.id } });
  }
  for (const b of e.sansDensite ?? []) sortie.push({ id: `densite-${b.id}`, genre: 'densite', titre: `Mesurer la densité de ${b.id}`, detail: `${b.name} · aucune densité relevée`, jour: null, ouvre: { ecran: 'brassin', id: b.id } });
  if (e.courses && e.courses.nombre > 0) sortie.push({ id: 'courses', genre: 'courses', titre: `Commander pour ${e.courses.nom}`, detail: `${e.courses.nombre} article${e.courses.nombre > 1 ? 's' : ''} avant ${e.courses.avant}`, jour: null, ouvre: { ecran: 'courses' } });
  // Les retards datés d'abord, du plus ancien ; ceux qui n'ont pas de date gardent leur ordre (densité, courses).
  return sortie.sort((a, b) => (a.jour ?? '9999').localeCompare(b.jour ?? '9999') || (a.jour ? a.id.localeCompare(b.id) : 0));
}
