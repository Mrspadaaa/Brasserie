import type { Batch, CreativeItem, FenetreCalendrier } from '../types';
import type { ForecastItem } from './finance/forecast';
import type { FinancialPlan } from './finance/types';
import { isoDate } from './finance/ledger';
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
  // Le titre dit le poste entier (« Énergie et nettoyage · Porter fumé », CRITIQUE-3 n° 2 : l'énergie n'est pas une course, son nom reste entier).
  const court = categorie;
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
export function dateDeSemaine(jour: string): string {
  /* CRITIQUE-4 n° 14 : les vraies bornes lundi – dimanche de la semaine ISO, quel que soit le jour reçu (jamais 7 jours comptés depuis la date) */
  const lundi = lundiDe(jour);
  const fin = ajouterJours(lundi, 6);
  const m1 = Number(lundi.slice(5, 7)) - 1, m2 = Number(fin.slice(5, 7)) - 1;
  const plage = m1 === m2 ? `${Number(lundi.slice(8))} – ${Number(fin.slice(8))} ${MOIS_COURTS[m2]}` : `${Number(lundi.slice(8))} ${MOIS_COURTS[m1]} – ${Number(fin.slice(8))} ${MOIS_COURTS[m2]}`;
  return `S${numeroSemaine(lundi)}, ${plage}`;
}
/** La Liste (E40, CRITIQUE-4 n° 14) : la date de la chose et sa vraie semaine ISO, « 26 août · S34 ». */
export function etiquetteListe(jour: string): string {
  return `${jourLisible(jour)} · ${etiquetteS(jour)}`;
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
/**
 * L'année (c1-d, E13) : les mois de toutes les semaines de la courbe, chaque semaine rangée dans le mois de son jeudi (ISO 8601). Douze mois en
 * général, treize quand la dernière des `nombreSemaines` semaines tombe dans le treizième (CRITIQUE-5 n° 2 : le creux de S44 2027 y est).
 */
export function anneeEnMois(aujourdhui: string, nombreSemaines = NB_SEMAINES_COURBE): MoisCalendrier[] {
  const jeudi0 = ajouterJours(lundiDe(aujourdhui), 3);
  const jeudiN = ajouterJours(jeudi0, (Math.max(1, nombreSemaines) - 1) * 7);
  const a = Number(jeudi0.slice(0, 4)), m = Number(jeudi0.slice(5, 7)) - 1;
  const longueur = (Number(jeudiN.slice(0, 4)) - a) * 12 + Number(jeudiN.slice(5, 7)) - 1 - m + 1;
  return Array.from({ length: longueur }, (_, index) => {
    const premier = new Date(Date.UTC(a, m + index, 1)), dernier = new Date(Date.UTC(a, m + index + 1, 0));
    return { index, debut: versIso(premier.getTime()), fin: versIso(dernier.getTime()), annee: premier.getUTCFullYear(), mois: premier.getUTCMonth() + 1, court: MOIS_COURTS[premier.getUTCMonth()] };
  });
}
/** Le mois qui contient `jour` ; `null` hors des mois de l'année. */
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
  ecran: 'brassin' | 'piece' | 'plan' | 'finances' | 'agenda' | 'atelier' | 'materiel' | 'courses' | 'fournisseur' | 'solde' | 'carnets';
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
  /** Jalon « commander » : les articles qui manquent, lus dans les courses de l'app (`vueHorizon`), jamais inventés. Absent quand on ne les connaît pas. */
  articles?: string[];
  /** Jalon « commander » : son titre lisible, « Malt pilsner, Saaz · Blonde d’automne » (CRITIQUE-3 n° 19). */
  titre?: string;
}

/** Une ligne de prévision d'un brassin (`source: 'brew'`) : ses ingrédients (courses), ses frais (énergie, nettoyage, emballage) ou l'impôt. */
export type PosteBrassin = 'courses' | 'frais' | 'impot';

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
  /** Brassin conditionné : marqué à sa date de conditionnement, jamais une barre « J0 » (CRITIQUE-2 n° 2). */
  conditionne?: true;
  /** Les courses d'un brassin, regroupées dans Achats : l'id du brassin, relié par un trait (D-107, CRITIQUE-2 n° 11). */
  brassinLie?: string;
  /** Brassin : ses courses de la prévision (« malt le 20 nov. −120, énergie le 22 nov. (montant non renseigné) »), comptées dans son budget. */
  courses?: string;
  /** Le texte court montré à côté (« Malt, emballage ») ; le titre entier reste le nom accessible. */
  etiquette?: string;
  /** Brassin à venir dont le coût n'est pas encore calculable : la barre dit « coût à venir », sans `centimes` (E23, CRITIQUE-4 n° 2). */
  coutAVenir?: true;
  /** Brassin commencé : `centimes` est ce qui reste à sortir (l'emballage), pas son budget entier (CRITIQUE-4, doute IPA −45). */
  reste?: true;
  /** Brassin posé sans budget à lui : le budget de sa recette, d'où il vient (CRITIQUE-4 n° 2). */
  budgetRepris?: string;
  /** Pastille « lié à La Cigogne » et son aperçu sur place (E37, D-113). */
  lie?: { texte: string; apercu: string; client?: string };
  /**
   * Brassin : le texte de sa durée, rendu tel quel par `texteDuree` (CRITIQUE-3 n° 1). En cuve : « J7 / 28 · prête 7 déc. » (J = jours depuis le
   * brassage réel) ; planifié : « J0 / 28 · prête 5 janv. » ; planifié dont le jour est passé sans brassage : « pas brassée · prévue le 10 nov. ».
   */
  duree?: string;
  /** Brassin planifié dont le jour de brassage est passé sans brassage : ni « J », ni « prête le » (CRITIQUE-3 n° 1). */
  pasBrassee?: true;
  /**
   * Brassin pas brassé (`pasBrassee`) : le jour où il serait prêt, ISO = `finPrevue` écrite, sinon jour prévu + cycle de la recette (CRITIQUE-5
   * n° 1). C'est la base de « pas brassée · prête le … » quand on tire son bord ; absent quand la recette ne donne aucun jour.
   */
  pretePrevue?: string;
  /**
   * Brassin pas brassé (`pasBrassee`) : son jour de brassage prévu, passé, ISO (CRITIQUE-7 n° 2). Sa barre part d'aujourd'hui (`debut`) : c'est
   * ce champ, et non `debut`, qui dit « prévue le 10 nov. » (Liste, retards).
   */
  brassagePrevu?: string;
  /** Livraison attendue : le jour de la commande et le délai appris (CRITIQUE-7 n° 8 : la facture qui la règle se pose dessus). */
  livraison?: { commandeeLe: string; delaiJours: number };
  /** Facture en retard (CRITIQUE-5 n° 4) : sa vraie échéance, ISO. `debut` reste le jour où la prévision la compte (aujourd'hui). */
  echeance?: string;
  /** Facture dont l'échéance est passée sans paiement (CRITIQUE-5 n° 4, E40) : la Liste la met en tête de « En cours » avec « en retard ». */
  enRetard?: true;
  /** Brassin : ses frais de la prévision (« énergie et nettoyage le 23 nov. · montant non renseigné ; emballage le 7 déc. · −45 »), comptés dans son budget. */
  frais?: string;
  /** Ligne de prévision d'un brassin : son poste (courses, frais, impôt). */
  posteBrassin?: PosteBrassin;
  /** Ligne « courses » d'un brassin : les ingrédients à acheter, lus dans la prévision (`lines`), jamais inventés. */
  articles?: string[];
  /**
   * CRITIQUE-12 n° 2 (E23, E31, A2) : une fête ou une activité du carnet chiffrée, que `buildForecast` ne lit pas : son montant est une
   * estimation hors de la courbe et de Finances. La pastille de sa rangée la dit « estimé », jamais « confirmé », hors du solde.
   */
  horsCourbe?: true;
  /** CRITIQUE-12, doute Papiers en An : une série mensuelle posée en une barre (`seriesEnBarres`, Rangee.tsx) ; son montant se dit « / mois ». */
  parMois?: true;
}

/** CRITIQUE-12 n° 2 : l'effet en mots d'une chose chiffrée que la courbe ne compte pas (menu f5-a, E31). */
export const EFFET_HORS_COURBE = 'ne change pas la courbe (pas dans Finances)';

/**
 * CRITIQUE-12 n° 2 : la règle de `effetEnMots` (calendrierGestes), posée sur le modèle. Une chose du carnet (fête, activité) au montant connu
 * et non nul, sans mouvement ni mise de côté à elle dans la courbe (`comptees` : les `choseId` des mouvements et les ids des mises de côté),
 * est hors courbe. Un plan, une pièce, un brassin passent par la prévision : jamais hors courbe. Indépendant du solde de départ (connu ou non).
 */
export function choseHorsCourbe(c: Pick<ChoseCalendrier, 'id' | 'centimes' | 'source'>, comptees: ReadonlySet<string>): boolean {
  return c.source.genre === 'creative' && c.centimes !== undefined && c.centimes !== 0 && !comptees.has(c.id);
}

/**
 * L'id d'une ligne de la prévision sur la frise. Stable après un déplacement (contrat L4) : un plan unique (manuel, TVA, projet) garde
 * `argent-<planId>`, sans date ; seule l'occurrence d'un récurrent et une sortie dérivée gardent l'id daté de la prévision.
 */
export function idChoseArgent(item: Pick<ForecastItem, 'id' | 'source' | 'planId'>): string {
  return item.planId && (item.source === 'plan' || item.source === 'equipment') ? `argent-${item.planId}` : `argent-${item.id}`;
}

/**
 * La durée d'un brassin (E25, E29) : le champ `duree` posé par `choseBrassin` (« J7 / 28 · prête 7 déc. », « pas brassée · prévue le 10 nov. ») ;
 * à défaut (proposition, chose recalculée), « J0 / n · prête … » depuis son début. Jamais « J0 / 0 » ni une fin inventée (CRITIQUE-2 n° 2).
 */
export function texteDuree(c: ChoseCalendrier): string | null {
  const brassin = c.source.genre === 'batch' || c.proposition === 'brassin-habituel';
  if (!brassin || c.conditionne) return null;
  if (c.duree) return c.duree;
  if (c.finInconnue || c.pasBrassee || !c.preteLe || !c.debut) return null;
  const n = ecartJours(c.debut, c.preteLe);
  return n > 0 ? `J0 / ${n} · prête ${jourLisible(c.preteLe)}` : null;
}

/**
 * « J7 / 28 · prête 7 déc. » : J = jours depuis le brassage, borné à [0, n] ; `null` quand la fin n'est pas après le brassage (jamais « J0 / 0 »).
 * Pure : `aujourdhui` est un paramètre.
 */
export function dureeBrassin(brassage: string, prete: string, aujourdhui: string, brasse = true): string | null {
  const n = ecartJours(brassage, prete);
  if (!(n > 0)) return null;
  /* CRITIQUE-5 n° 1 : pas de « Jn » tant que le brassin n'est pas brassé (`brewDate`/`actualBrewDate` vides) : J reste 0 */
  const j = brasse ? Math.max(0, Math.min(n, ecartJours(brassage, aujourdhui))) : 0;
  return `J${j} / ${n} · prête ${jourLisible(prete)}`;
}

/** « pas brassée · prête le 1 déc. » : un brassin pas brassé dont on a tiré le bord (CRITIQUE-5 n° 1). Jamais de « J ». */
export const dureePasBrassee = (prete: string): string => `pas brassée · prête le ${jourLisible(prete)}`;

/**
 * La semaine dite avec son année quand elle n'est pas celle de la semaine de référence (CRITIQUE-5 n° 2) : « S44 2027 » vu de S47 2026,
 * « S50 » dans la même année ISO. L'année est celle du jeudi de la semaine (ISO 8601).
 */
export function semaineAvecAn(lundi: string, reference: string): string {
  const an = (iso: string) => ajouterJours(lundiDe(iso), 3).slice(0, 4);
  return an(lundi) === an(reference) ? etiquetteS(lundi) : `${etiquetteS(lundi)} ${an(lundi)}`;
}

/** Le poste d'une ligne de prévision d'un brassin, lu dans son id stable (`brew:<lot>:achats|frais|emballage|impot`, `brewForecast.ts`), sinon dans son libellé. */
export function posteBrassin(item: Pick<ForecastItem, 'id' | 'label'>): PosteBrassin {
  const suffixe = item.id.split(':').pop() ?? '';
  if (suffixe === 'impot') return 'impot';
  if (suffixe === 'achats') return 'courses';
  if (suffixe === 'frais' || suffixe === 'emballage') return 'frais';
  const l = item.label.toLocaleLowerCase('fr');
  if (/imp[oô]t/.test(l)) return 'impot';
  if (/[eé]nergie|nettoyage|emballage|conditionnement|co2|électricité|electricite|gaz/.test(l)) return 'frais';
  return 'courses';
}

/** Une estimation enregistrée par `BrewBudgetSheet` (plan `brew` avec `brewEstimate`) : l'argent à sortir du brassin. */
export interface EstimationBudget { centimes: number; partiel: boolean }

/**
 * Le budget d'un brassin (E24, CRITIQUE-2 n° 9, CRITIQUE-3 n° 9) : la somme de ses courses et de ses frais dans la prévision, la même estimation que
 * `BrewBudgetSheet` (`estimateBrewBudget`, découpée par `brewForecast.ts`). L'impôt sur la bière n'en fait pas partie : il est dans Papiers. Quand
 * aucune ligne n'est chiffrée, l'estimation enregistrée de `BrewBudgetSheet` (`estimations`) la remplace. Rien de connu : `null`, jamais 0.
 */
export function budgetBrassin(batchId: string, choses: readonly ChoseCalendrier[], estimations?: ReadonlyMap<string, EstimationBudget>): { centimes: number; partiel: boolean } | null {
  const lignes = choses.filter(c => c.source.genre === 'prevision-brassin' && c.posteBrassin !== 'impot' && (c.source.id === batchId || (c.ouvre.ecran === 'brassin' && c.ouvre.id === batchId)));
  const chiffrees = lignes.filter(c => c.centimes !== undefined);
  if (!chiffrees.length) {
    const e = estimations?.get(batchId);
    return e && Number.isFinite(e.centimes) && e.centimes !== 0 ? { centimes: e.centimes, partiel: e.partiel || lignes.length > 0 } : null;
  }
  return { centimes: chiffrees.reduce((s, c) => s + (c.centimes as number), 0), partiel: chiffrees.length < lignes.length || chiffrees.some(c => c.partiel) };
}

/** Le mot d'un coût qu'on ne sait pas encore estimer (E23, D-22) : jamais rien, jamais 0. */
export const COUT_A_VENIR = 'coût à venir';

/**
 * Un brassin à venir dont le coût n'est pas estimable (aucune ligne chiffrée, aucune estimation de `BrewBudgetSheet`) : `partiel`, `coutAVenir`
 * et l'étiquette « Blonde · coût à venir », sans `centimes` (CRITIQUE-4 n° 2, CRITIQUE-5 n° 19). Un brassin commencé n'a rien à annoncer.
 */
export function choseCoutAVenir(c: ChoseCalendrier): ChoseCalendrier {
  const { centimes: _c, ...reste } = c;
  void _c;
  return { ...reste, coutAVenir: true, partiel: true, etiquette: `${c.titre} · ${COUT_A_VENIR}` };
}

/** « malt pilsner, Saaz le 16 nov. · −76 » : une ligne de prévision d'un brassin dite en clair, sans point ajouté après la date (CRITIQUE-3 n° 37). */
function texteLigneBrassin(l: ChoseCalendrier): string {
  const poste = (l.titre.split(' · ')[0] || 'frais').toLocaleLowerCase('fr');
  const quoi = l.articles?.length ? l.articles.join(', ') : poste === 'achats' ? 'ingrédients' : poste;
  return `${quoi} le ${jourLisible(l.debut)} · ${l.centimes !== undefined ? francsSignes(l.centimes) : 'montant non renseigné'}`;
}

/** Un nom (client, fournisseur) déjà écrit dans un titre, sans tenir compte de la casse ni des espaces : « 3 fûts La Cigogne » contient « La Cigogne ». */
export function contientNom(titre: string, nom: string): boolean {
  const n = (s: string) => s.normalize('NFC').toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();
  const t = n(titre), m = n(nom);
  return !!m && t.includes(m);
}

/**
 * Prépare les choses pour la frise (pure) :
 * - un brassin porte son budget (somme de ses lignes `brew`) ;
 * - les sorties d'un même brassin dans la même semaine, rangée Achats, deviennent UN caddie nommé (« Malt, emballage · Blonde d'automne »),
 *   relié à son brassin (`brassinLie`) : jamais une file de caddies anonymes (D-107) ;
 * - une chose liée (`liens`) porte sa pastille « lié à … » et son aperçu (D-113), avec les noms de l'app.
 */
export function preparerChoses(
  choses: readonly ChoseCalendrier[],
  noms: { brassins?: ReadonlyMap<string, string>; clients?: ReadonlyMap<string, string> } = {},
  /** Les estimations enregistrées par `BrewBudgetSheet`, par brassin : le budget quand aucune ligne de la prévision n'est chiffrée (n° 9). */
  estimations?: ReadonlyMap<string, EstimationBudget>
): ChoseCalendrier[] {
  const brassins = new Map(choses.filter(c => c.source.genre === 'batch').map(c => [c.source.id, c]));
  const groupes = new Map<string, ChoseCalendrier[]>();
  const impots = new Map<string, ChoseCalendrier[]>();
  const sortie: ChoseCalendrier[] = [];
  for (const c of choses) {
    const batchId = c.source.genre === 'prevision-brassin' && c.ouvre.ecran === 'brassin' ? c.ouvre.id : undefined;
    /* CRITIQUE-3 n° 2 : l'impôt sur la bière se déclare par période, pour tous les brassins conditionnés : UNE échéance dans Papiers */
    if (c.source.genre === 'prevision-brassin' && c.posteBrassin === 'impot' && c.debut) {
      impots.set(c.debut, [...(impots.get(c.debut) ?? []), c]);
      continue;
    }
    if (c.rangee === 'achats' && batchId && c.debut) {
      const cle = batchId;
      groupes.set(cle, [...(groupes.get(cle) ?? []), c]);
      continue;
    }
    sortie.push(c);
  }
  const coursesDe = new Map<string, { courses?: string; frais?: string; mouvements: string[] }>();
  for (const [batchId, lignes] of groupes) {
    /* le brassin est sur la frise : ses courses (ingrédients) et ses frais (énergie, nettoyage, emballage) entrent dans son budget et son détail
       (as/p-repos : « Blonde d'automne −148 », sans file de caddies) ; leurs mouvements suivent sa barre quand on la glisse */
    if (brassins.has(batchId)) {
      const courses = lignes.filter(l => l.posteBrassin !== 'frais'), frais = lignes.filter(l => l.posteBrassin === 'frais');
      coursesDe.set(batchId, {
        ...(courses.length ? { courses: courses.map(texteLigneBrassin).join(' ; ') } : {}),
        ...(frais.length ? { frais: frais.map(texteLigneBrassin).join(' ; ') } : {}),
        mouvements: lignes.flatMap(l => l.mouvements ?? [])
      });
      continue;
    }
    const nomBrassin = noms.brassins?.get(batchId) ?? brassins.get(batchId)?.titre ?? lignes[0].titre.split(' · ').slice(1).join(' · ');
    const quoi = [...new Set(lignes.map(l => l.titre.split(' · ')[0]).filter(Boolean))];
    const etiquette = quoi.length ? `${quoi[0]}${quoi.length > 1 ? `, ${quoi.slice(1).map(q => q.toLocaleLowerCase('fr')).join(', ')}` : ''}` : 'Courses';
    const chiffrees = lignes.filter(l => l.centimes !== undefined);
    /* UN caddie par brassin, posé à sa première course ; chaque ligne et sa date restent dans le détail */
    const debut = lignes.map(l => l.debut).sort()[0];
    const fin = debut;
    const { centimes: _c, partiel: _p, ...reste } = lignes[0];
    void _c; void _p;
    /* sa maquette (as/p-repos) pose le caddie sous la barre de son brassin, relié par un trait : il vit dans la rangée Brassins ; son montant
       est déjà dans le budget du brassin, la pastille ne le recompte pas */
    sortie.push({
      ...reste,
      rangee: 'brassins',
      id: lignes.length === 1 ? lignes[0].id : `courses-${batchId}`,
      titre: nomBrassin ? `${etiquette} · ${nomBrassin}` : etiquette, etiquette, debut, fin,
      ...(chiffrees.length ? { centimes: chiffrees.reduce((s, l) => s + (l.centimes as number), 0) } : {}),
      ...(chiffrees.length && (chiffrees.length < lignes.length || chiffrees.some(l => l.partiel)) ? { partiel: true as const } : {}),
      detail: lignes.map(l => `${l.titre.split(' · ')[0]} le ${jourLisible(l.debut)}${l.centimes !== undefined ? ` ${francsSignes(l.centimes)}` : ' · montant non renseigné'}`).join(' ; '),
      mouvements: lignes.flatMap(l => l.mouvements ?? []), brassinLie: batchId
    });
  }
  for (const [jour, lignes] of impots) {
    const nomDe = (l: ChoseCalendrier) => (l.ouvre.id ? noms.brassins?.get(l.ouvre.id) ?? brassins.get(l.ouvre.id)?.titre : undefined) ?? l.titre.split(' · ').slice(1).join(' · ');
    const chiffrees = lignes.filter(l => l.centimes !== undefined);
    const seul = lignes.length === 1 ? lignes[0] : null;
    sortie.push({
      id: seul ? seul.id : `impot-${jour}`, rangee: 'papiers', posteBrassin: 'impot',
      titre: seul ? `Impôt sur la bière · ${nomDe(seul)}` : `Impôt sur la bière · ${lignes.length} brassins`,
      debut: jour, fin: jour,
      ...(chiffrees.length ? { centimes: chiffrees.reduce((s, l) => s + (l.centimes as number), 0) } : {}),
      ...(chiffrees.length && (chiffrees.length < lignes.length || chiffrees.some(l => l.partiel)) ? { partiel: true as const } : {}),
      detail: `échéance estimée le ${jourLisible(jour)} ; ${lignes.map(l => `${nomDe(l)} · ${l.centimes !== undefined ? francsSignes(l.centimes) : 'montant non renseigné'}`).join(' ; ')}`,
      source: { genre: 'prevision-brassin', id: seul ? seul.source.id : `impot-${jour}` },
      ouvre: seul ? seul.ouvre : { ecran: 'finances' },
      deplacable: { raison: 'L’impôt sur la bière suit le conditionnement de ses brassins : à régler dans le coût du brassin (Brassins).' },
      mouvements: lignes.flatMap(l => l.mouvements ?? [])
    });
  }
  return sortie.map(c => {
    let suivante = c;
    if (c.source.genre === 'batch' && !c.conditionne) {
      const b = budgetBrassin(c.source.id, choses, estimations);
      if (b) suivante = { ...suivante, centimes: b.centimes, ...(b.partiel ? { partiel: true as const } : {}) };
    }
    if (c.source.genre === 'batch') {
      const k = coursesDe.get(c.source.id);
      if (k) suivante = { ...suivante, ...(k.courses ? { courses: k.courses } : {}), ...(k.frais ? { frais: k.frais } : {}), mouvements: [...(suivante.mouvements ?? []), ...k.mouvements] };
    }
    if (c.liens && (c.liens.batchId || c.liens.clientId)) {
      const client = c.liens.clientId ? noms.clients?.get(c.liens.clientId) : undefined;
      const brassin = c.liens.batchId ? brassins.get(c.liens.batchId) : undefined;
      const nomBrassin = c.liens.batchId ? (noms.brassins?.get(c.liens.batchId) ?? brassin?.titre) : undefined;
      /* CRITIQUE-6 n° 15 : le client déjà dit dans le titre (« 3 fûts La Cigogne ») n'a pas de pastille qui le répète ; un lien vers un brassin reste */
      const clientDit = !!client && contientNom(c.titre, client);
      const cible = (clientDit ? undefined : client) ?? nomBrassin;
      if (cible) {
        const apercus = [
          ...(client ? [`${client} · client`] : []),
          ...(nomBrassin ? [`${nomBrassin}${brassin?.debut ? ` · brassage ${jourLisible(brassin.debut)}` : ''}${brassin?.preteLe ? ` · prête ${jourLisible(brassin.preteLe)}` : ''}`] : [])
        ];
        suivante = { ...suivante, lie: { texte: `lié à ${cible}`, apercu: apercus.join(' ; '), ...(client && !clientDit ? { client } : {}) } };
      }
    }
    return suivante;
  });
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

/**
 * CRITIQUE-6 n° 2 (D-161, E25, E29) : le jour où un brassin serait prêt. Brassé ou prévu dans le futur : sa fin (`finDeBrassin`). Planifié dont le
 * jour est passé sans brassage : il sera brassé au plus tôt aujourd'hui, donc prêt à max(jour prévu, aujourd'hui) + la durée du cycle (fin prévue
 * moins jour prévu ; `finPrevue` écrite garde ainsi son allongement). La barre part de la semaine courante : la date dit la même chose qu'elle.
 * `null` quand rien ne dit la durée du cycle (jamais une fin inventée). Pure : `aujourdhui` est un paramètre.
 */
export function preteAuPlusTot(batch: Batch, aujourdhui: string): string | null {
  const fin = finDeBrassin(batch);
  if (!fin) return null;
  const j0 = jourZero(batch);
  if (!j0 || hasBrewStarted(batch) || j0 >= aujourdhui) return fin.jour;
  return ajouterJours(aujourdhui, ecartJours(j0, fin.jour));
}

const ARTICLE: Record<string, string> = { Fermentation: 'La fermentation', 'Dry hop': 'Le dry hop', Garde: 'La garde' };
const raisonRecette = (libelle: string) => `${ARTICLE[libelle] ?? libelle} suit la recette du brassin`;

/**
 * Les jalons d'un brassin (E25), lus dans la recette figée : brassage, fermentation, dry hop (si la recette le date), garde, conditionnement.
 * Ce sont des écarts à la date de brassage ; « commander avant le … » s'y ajoute quand des courses manquent (`commanderLe`, ISO).
 * Aucune date n'est inventée : sans jours dans la recette, il ne reste que le brassage (et la fin, si `finPrevue` la dit).
 */
export function jalonsBrassin(batch: Batch, options: { commanderLe?: string | null; articles?: readonly string[] } = {}): JalonBrassin[] {
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
    const articles = [...new Set((options.articles ?? []).map(a => a.trim()).filter(Boolean))];
    const nom = batch.name || batch.id;
    if (ecart < 0) jalons.push({
      id: 'commander', libelle: 'Commander', jour: options.commanderLe, ecart, glissable: false, raison: 'Ce jalon se calcule des courses',
      titre: articles.length ? `${articles.join(', ')} · ${nom}` : `Courses · ${nom}`, ...(articles.length ? { articles } : {})
    });
  }
  return jalons.sort((a, b) => a.ecart - b.ecart);
}

/** Brassin : une barre de son jour de brassage à « prête le » (E25). `null` : annulé, archivé, ou sans date connue. */
export function choseBrassin(batch: Batch, aujourdhui: string, options: { commanderLe?: string | null; articles?: readonly string[] } = {}): ChoseCalendrier | null {
  if (batch.status === 'annule' || batch.archivedAt) return null;
  const demarre = hasBrewStarted(batch);
  const base = { id: `brassin-${batch.id}`, rangee: 'brassins' as const, titre: batch.name || batch.id, source: { genre: 'batch' as const, id: batch.id, statut: batch.status }, ouvre: { ecran: 'brassin' as const, id: batch.id } };
  if (batch.status === 'conditionne' || batch.status === 'termine') {
    const mis = isoDate(batch.bottlingDate);
    if (!mis) return null;
    return { ...base, debut: mis, fin: mis, conditionne: true, detail: `conditionné le ${jourLisible(mis)}`, deplacable: { raison: 'Brassin conditionné : sa date est un fait, pas une prévision. Elle se corrige dans la fiche du brassin (Brassins).' } };
  }
  const j0 = jourZero(batch);
  if (!j0) return null;
  const fin = finDeBrassin(batch);
  /* CRITIQUE-5 n° 1 : sans jour de brassage réel (`brewDate`/`actualBrewDate` vides), un brassin n'est pas en cuve, quel que soit son statut */
  if (!demarre) {
    /*
     * CRITIQUE-3 n° 1 : planifié, jour passé, pas brassé (la Saison prévue le 10 nov.). Il ne se dit ni « J0 » ni « Jn » : rien n'est en
     * cuve. Il reste visible cette semaine (de son jour prévu à aujourd'hui), avec son seul jalon de brassage, qui se glisse pour le replanifier.
     * CRITIQUE-5 n° 1 : son bord se tire. `finPrevue` écrite au-delà du cycle de la recette allonge sa barre d'autant (après aujourd'hui) et
     * sa durée dit « pas brassée · prête le … » ; sans `finPrevue`, « pas brassée · prévue le … ».
     */
    if (j0 < aujourdhui) {
      /* CRITIQUE-6 n° 2 : « prête le » se compte depuis aujourd'hui (brassée au plus tôt aujourd'hui), jamais depuis le jour prévu passé */
      const prete = preteAuPlusTot(batch, aujourdhui);
      /*
       * D385 (variante C, son pied par phases) : brassée au plus tôt aujourd'hui, ses étapes suivent la recette depuis ce jour-là : fermentation,
       * dry hop et garde recalés sur aujourd'hui (le même écart qu'à la recette), puis le conditionnement à « prête ». Ce sont des prévisions :
       * elles ne se glissent pas (le brassage replanifie ; le conditionnement, comme le bord, règle « prête »). Sans cycle connu, le brassage seul, comme avant : aucune date inventée.
       */
      const finRecalee = prete ? ecartJours(aujourdhui, prete) : null;
      const brassage: JalonBrassin[] = jalonsBrassin(batch).flatMap((j): JalonBrassin[] => {
        if (j.id === 'brassage') return [j];
        if (finRecalee === null || j.id === 'commander' || j.id === 'conditionnement' || j.ecart >= finRecalee) return [];
        return [{ id: j.id, libelle: j.libelle, jour: ajouterJours(aujourdhui, j.ecart), ecart: j.ecart, glissable: false, raison: 'Prévu d’après la recette' }];
      });
      if (prete && finRecalee !== null && finRecalee > 0) brassage.push({ id: 'conditionnement', libelle: 'Conditionnement', jour: prete, ecart: finRecalee, glissable: 'fin' });
      /*
       * CRITIQUE-7 n° 2 (D-47, D-190, E29) : la barre court de max(jour prévu, aujourd'hui) = aujourd'hui jusqu'à « prête » : le temps qu'elle
       * passera en cuve, comme un brassin planifié (J0 → prête). Tirer son bord déplace donc la date dite. Sans cycle connu : aujourd'hui seul,
       * « prévue le … », et le bord refuse avec sa raison (`allongerBrassin`).
       */
      return {
        /* sa durée dit « pas brassée · prête le … » : le titre n'a pas à le répéter (heurt t3-a / t3-c) */
        ...base, debut: aujourdhui, fin: prete ?? aujourdhui, pasBrassee: true, brassagePrevu: j0, ...(prete ? { pretePrevue: prete } : {}),
        duree: prete ? dureePasBrassee(prete) : `pas brassée · prévue le ${jourLisible(j0)}`,
        detail: `pas brassée · brassage prévu le ${jourLisible(j0)}${prete ? ` · prête le ${jourLisible(prete)} au plus tôt` : ''}`, jalons: brassage, deplacable: true
      };
    }
    const duree = fin ? dureeBrassin(j0, fin.jour, aujourdhui, false) : null;
    return { ...base, debut: j0, fin: fin?.jour ?? j0, ...(fin ? { preteLe: fin.jour } : {}), ...(duree ? { duree } : {}), detail: 'planifié', jalons: jalonsBrassin(batch, options), deplacable: true };
  }
  /* en cuve : J = jours depuis le brassage réel, borné à [0, n] (« J7 / 28 · prête 7 déc. ») ; fin inconnue : « J7 », sans fin inventée */
  const duree = fin ? dureeBrassin(j0, fin.jour, aujourdhui) : `J${Math.max(0, ecartJours(j0, aujourdhui))} · fin non renseignée`;
  return {
    ...base, debut: j0, fin: fin?.jour ?? (aujourdhui > j0 ? aujourdhui : j0), ...(fin ? { preteLe: fin.jour } : { finInconnue: true as const }), ...(duree ? { duree } : {}),
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

/** Carnet d'idées (R48) : une idée ou un message du fil ne sont jamais une rangée ni la poche « Sans date » ; l'idée datée est une icône (`iconesIdees`). */
const estDuCarnet = (item: CreativeItem): boolean => item.type === 'carnet' || item.type === 'carnet-message';

/**
 * Fêtes (CreativeItem `event` daté, pas fait) et Activités (daté, pas un `event` ou marqué `activite`, pas fait). Une idée de recette est une
 * icône de la bande (`iconesIdees`), un projet de matériel arrive par son plan (Travaux). Sans date : `null`, jamais posée.
 */
export function choseCreative(item: CreativeItem): ChoseCalendrier | null {
  if (item.type === 'recipe-idea' || item.type === 'equipment' || estDuCarnet(item) || item.status === 'done') return null;
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
  if (item.type === 'recipe-idea' || estDuCarnet(item) || item.status === 'done' || isoDate(item.date)) return null;
  const activite = item.type !== 'event' || item.activite === true;
  return {
    id: `creatif-${item.id}`, rangee: activite ? 'activites' : 'fetes', titre: item.title, debut: '', fin: '', sansDate: true,
    source: { genre: 'creative', id: item.id, type: item.type }, ouvre: item.type === 'event' ? { ecran: 'agenda', id: item.id } : { ecran: 'atelier', id: item.id },
    deplacable: true
  };
}

export interface IconeSemaine { id: string; lundi: string; numero: number; genre: 'idee' | 'retard'; titre: string; ouvre?: CibleOuverture }
/**
 * E36, E05 : une idée datée est une petite icône de sa semaine, jamais une rangée. R48 (17.11) : l'idée notée au calendrier est un `carnet`
 * (carnet d'idées, Stocks › Matériel › Carnets) et son icône ouvre ce carnet ; un carnet sans date, archivé ou fait n'en a pas. Les `recipe-idea`
 * datées déjà écrites gardent leur icône vers l'Atelier (aucune migration).
 */
export function iconesIdees(items: readonly CreativeItem[]): IconeSemaine[] {
  const sortie: IconeSemaine[] = [];
  for (const item of items) {
    const carnet = item.type === 'carnet';
    if (!(carnet || item.type === 'recipe-idea') || item.status === 'done' || (item as { archivedAt?: string }).archivedAt) continue;
    if (carnet && (item.carnet as { archive?: unknown } | undefined)?.archive) continue;
    const jour = isoDate(item.date);
    if (!jour) continue;
    const lundi = lundiDe(jour);
    sortie.push({ id: `idee-${item.id}`, lundi, numero: numeroSemaine(lundi), genre: 'idee', titre: item.title, ouvre: { ecran: carnet ? 'carnets' : 'atelier', id: item.id } });
  }
  return sortie.sort((a, b) => a.lundi.localeCompare(b.lundi) || a.id.localeCompare(b.id));
}

const CATEGORIES_TRAVAUX = ['materiel', 'renovation'];

/**
 * La catégorie de Finances des matières de brassage : `brassage` (`FinanceCategory`, catégories de charge de `src/domain/finance/ledger.ts` l. 32 ; `periodeSynthese.ts` l. 62 y range les
 * lignes `ingredient` et `packaging`). C'est celle que lit la rangée Achats pour une facture sans lignes (CRITIQUE-6 n° 3 et 7).
 */
export const CATEGORIE_MATIERES = 'brassage';
/** Les catégories de stock des matières (`StockItem.category`, `src/types/index.ts` : « 'Malt', 'Houblon', 'Levure', 'Sucre' … »). */
const STOCK_MATIERES = ['malt', 'houblon', 'levure', 'sucre', 'extrait'];
const cleNom = (s: string | undefined) => (s ?? '').normalize('NFC').trim().toLocaleLowerCase('fr');

/** Le fournisseur d'une pièce : `finance.vendor`, sinon le début de sa description (« Brouwland · malt » → « brouwland »). */
export function fournisseurDePiece(tx: { description?: string; finance?: { vendor?: string } }): string {
  return cleNom(tx.finance?.vendor || (tx.description ?? '').split(' · ')[0]);
}

/**
 * CRITIQUE-6 n° 7 (E20, E38) : une facture fournisseur est une facture de matières quand ses lignes le disent (`FinanceLine.kind` `ingredient`, ou
 * `FinanceLine.category` `brassage` : `src/domain/finance/types.ts`), quand elle a fait entrer des matières en stock (`stockImpact` `rawMaterials`,
 * `src/types/index.ts`), quand son fournisseur livre des matières au stock (`StockItem.supplier` d'un article Malt, Houblon, Levure, Sucre), ou, sans
 * ligne typée, quand sa catégorie de Finances est `brassage`. Une facture d'entrée n'en est jamais une.
 */
export function estFactureDeMatieres(
  tx: { category?: string; description?: string; stockImpact?: ReadonlyArray<{ itemType?: string }>; finance?: { kind?: string; vendor?: string; lines?: ReadonlyArray<{ kind?: string; category?: string }> } },
  stock: ReadonlyArray<{ category?: string; supplier?: string }> = []
): boolean {
  if (tx.finance?.kind === 'income') return false;
  const lignes = (tx.finance?.lines ?? []).filter(l => l.kind && l.kind !== 'discount' && l.kind !== 'shipping');
  if (lignes.some(l => l.kind === 'ingredient' || l.category === CATEGORIE_MATIERES)) return true;
  if ((tx.stockImpact ?? []).some(s => s.itemType === 'rawMaterials')) return true;
  const fournisseur = fournisseurDePiece(tx);
  if (fournisseur && stock.some(s => cleNom(s.supplier) === fournisseur && STOCK_MATIERES.includes(cleNom(s.category)))) return true;
  return !lignes.length && tx.category === CATEGORIE_MATIERES;
}

/** L'écart en jours entre un jour et une plage [du, au] : 0 dedans, sinon la distance au bord le plus proche. */
const ecartAPlage = (jour: string, du: string, au: string): number => (jour < du ? ecartJours(jour, du) : jour > au ? ecartJours(au, jour) : 0);

/**
 * CRITIQUE-7 n° 8 (E38, D-118) : la facture de matières d'un fournisseur se pose sur la livraison attendue qu'elle règle, même si elles ne tombent
 * pas la même semaine. UNE chose dans Achats : « Livraison Brouwland · malt », le montant et la pièce de la facture (« Payé » d'un toucher), ses
 * mouvements de caisse (l'argent sort toujours à l'échéance), à la date de la livraison ; le détail dit l'échéance.
 *
 * Rapprochement (dans le délai appris) : une livraison attendue du même fournisseur dont la plage [commande − délai appris, livraison + délai appris]
 * contient le jour d'émission de la pièce (`emises`) ou son échéance ; parmi elles, la plus proche (écart à la plage, puis écart entre l'échéance
 * et la livraison). Une livraison ne porte qu'une facture. Sans livraison correspondante, la facture reste seule dans Achats ; une livraison sans
 * facture reste sans montant (jamais 0). `fournisseurs` : id de la pièce → clé du fournisseur (`fournisseurDePiece`). Pure.
 */
export function fusionnerFacturesLivraisons(
  choses: readonly ChoseCalendrier[], fournisseurs: ReadonlyMap<string, string>,
  /** id de la pièce → jour où elle a été émise (`Transaction.date`, ISO) ; absent : l'échéance seule. */
  emises?: ReadonlyMap<string, string>
): ChoseCalendrier[] {
  const prises = new Set<string>();
  const fusion = new Map<string, ChoseCalendrier>();
  const factures = choses.filter(f => f.source.genre === 'facture' && f.rangee === 'achats' && f.debut)
    .sort((a, b) => (a.echeance ?? a.debut).localeCompare(b.echeance ?? b.debut) || a.id.localeCompare(b.id));
  for (const f of factures) {
    const cle = fournisseurs.get(f.source.id);
    if (!cle) continue;
    const echeance = f.echeance ?? f.debut;
    const emise = isoDate(emises?.get(f.source.id));
    const reperes = emise ? [emise, echeance] : [echeance];
    let meilleure: { liv: ChoseCalendrier; distance: number } | null = null;
    for (const l of choses) {
      if (l.source.genre !== 'livraison' || prises.has(l.id) || !l.source.id.startsWith(`${cle}-`) || !l.debut || !l.livraison) continue;
      const du = ajouterJours(l.livraison.commandeeLe, -l.livraison.delaiJours), au = ajouterJours(l.debut, l.livraison.delaiJours);
      if (!reperes.some(r => ecartAPlage(r, du, au) === 0)) continue;
      const distance = Math.abs(ecartJours(l.debut, echeance));
      if (!meilleure || distance < meilleure.distance || (distance === meilleure.distance && l.debut < meilleure.liv.debut)) meilleure = { liv: l, distance };
    }
    if (!meilleure) continue;
    const liv = meilleure.liv;
    prises.add(liv.id);
    /* le titre de la pièce (« Brouwland · malt ») : le fournisseur d'abord, court à 390 (CRITIQUE-7 n° 7) ; la livraison est dite dans le détail */
    const facture = f.enRetard ? `facture : ${f.detail ?? ''}` : `facture due le ${jourLisible(echeance)}${f.centimes === undefined ? ' · montant non renseigné' : ''}`;
    fusion.set(f.id, {
      ...f, debut: liv.debut, fin: liv.fin, livraison: liv.livraison,
      detail: `livraison le ${jourLisible(liv.debut)}${liv.detail ? ` · ${liv.detail}` : ''} · ${facture}`
    });
  }
  return choses.flatMap(c => (prises.has(c.id) ? [] : [fusion.get(c.id) ?? c]));
}
const raisonFinances = (quoi: string, ou: string) => `${quoi} se règle dans ${ou}.`;

/**
 * Les lignes datées de la prévision de Finances (hors tendance) : Ventes (entrées), Achats (plan, brassin), Travaux (matériel, rénovation,
 * projets de matériel), Papiers (factures à payer, récurrentes, TVA et clôture). Une ligne à 0 CHF n'a pas de `centimes`.
 */
export function choseArgent(
  item: ForecastItem, plans: readonly FinancialPlan[] = [], echeances?: ReadonlyMap<string, string>,
  /** CRITIQUE-6 n° 7 : les pièces (id de transaction) qui sont des factures de matières (`estFactureDeMatieres`) ; absent : la catégorie de la ligne. */
  matieres?: ReadonlySet<string>
): ChoseCalendrier | null {
  if (item.source === 'trend') return null;
  const jour = isoDate(item.date);
  if (!jour) return null;
  const plan = item.planId ? plans.find(p => p.id === item.planId) : undefined;
  const entree = item.direction === 'in';
  const { titre, notes } = titreCourtArgent(item);
  let rangee: Rangee, source: SourceChose, ouvre: CibleOuverture, deplacable: ChoseCalendrier['deplacable'];
  let retard: { echeance: string; enRetard: true } | null = null;
  if (item.source === 'invoice') {
    const tx = item.id.replace(/^invoice:/, '');
    /* CRITIQUE-5 n° 4 : la prévision compte une facture échue à aujourd'hui ; la chose garde sa vraie échéance (`echeances` : id de la pièce → ISO) */
    const due = isoDate(echeances?.get(tx));
    if (due && due < jour) retard = { echeance: due, enRetard: true };
    /* CRITIQUE-6 n° 7 (E20, E38) : une facture de matières (malt, houblon, levure) est un achat, pas un papier ; les autres restent dans Papiers */
    const deMatieres = matieres ? matieres.has(tx) : item.category === CATEGORIE_MATIERES;
    rangee = entree ? 'ventes' : deMatieres ? 'achats' : 'papiers'; source = { genre: 'facture', id: tx }; ouvre = { ecran: 'piece', id: tx };
    deplacable = { raison: raisonFinances('Une facture', 'la facture (Finances › Opérations)') };
  } else if (item.source === 'brew') {
    /* CRITIQUE-3 n° 2 : l'impôt sur la bière n'est ni une course ni un frais du brassin, il va dans Papiers (§ Données) */
    rangee = entree ? 'ventes' : posteBrassin(item) === 'impot' ? 'papiers' : CATEGORIES_TRAVAUX.includes(item.category) ? 'travaux' : 'achats'; source = { genre: 'prevision-brassin', id: item.batchId ?? item.planId ?? item.id };
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
  const poste = item.source === 'brew' && !entree ? posteBrassin(item) : undefined;
  /* les ingrédients à acheter, lus dans la prévision (une ligne par ingrédient chiffré) ; inconnus : rien, jamais inventés */
  const articles = poste === 'courses' ? [...new Set((item.lines ?? []).map(l => l.label.trim()).filter(Boolean))] : [];
  return {
    id: idChoseArgent(item), rangee, titre, debut: f?.du ?? jour, fin: f?.au ?? jour, ...montant,
    ...(poste ? { posteBrassin: poste } : {}), ...(articles.length ? { articles } : {}),
    ...(f?.joursActifs ? { joursActifs: f.joursActifs } : {}), ...(f?.miseDeCote ? { miseDeCote: true } : {}), ...(f ? { fenetre: plan?.fenetre } : {}),
    ...(plan?.batchId || plan?.clientId ? { liens: { ...(plan.batchId ? { batchId: plan.batchId } : {}), ...(plan.clientId ? { clientId: plan.clientId } : {}) } } : {}),
    ...(retard ?? {}),
    detail: `${retard ? `échéance le ${jourLisible(retard.echeance)} · en retard` : `le ${jourLisible(jour)}`}${!item.amountCents ? ' · montant non renseigné' : ''}${notesDit || (item.partial?.length ? ' · montant partiel' : '')}`,
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
        livraison: { commandeeLe: le, delaiJours: delai.jours },
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

export interface HypotheseCaisse { id: 'depart' | 'tendance' | `budget-repris-${string}`; texte: string; source: string; ouvre: CibleOuverture }

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
  /** `vueHorizon(...)` : « Commander pour X avant S49 ». Compté seulement quand `avantLe` (ISO) est passé : avant, ce n'est pas un retard. */
  courses?: { nom: string; nombre: number; avant: string; avantLe?: string } | null;
  /** Les courses qui manquent pour un brassin, avec le jour où il fallait commander (le jalon « commander ») et les articles. */
  commandes?: ReadonlyArray<{ batchId: string; nom: string; avantLe: string; articles?: readonly string[] }>;
}

/**
 * E08, CRITIQUE-3 n° 34 : ce qui est VRAIMENT en retard, chaque retard nommé et daté (« échéance le 3 nov. »), jamais un compteur de jours :
 * un dû non payé dont l'échéance est passée, un brassin planifié dont le jour est passé sans brassage, une tâche ou une activité datée passée et
 * pas faite (la fin de sa fenêtre passée, s'il en a une), une densité jamais relevée sur un brassin brassé avant aujourd'hui, des courses à
 * commander avant un jour passé. Rien de daté ni de passé : rien. Un calendrier vide rend 0 retard ; une chose posée dans le futur n'en crée aucun.
 */
export function retardsDe(e: EntreeRetards): Retard[] {
  const sortie: Retard[] = [];
  const passe = (jour: string | null | undefined): jour is string => !!jour && jour < e.aujourdhui;
  for (const r of e.restes) {
    const echeance = isoDate(r.echeance ?? undefined);
    if (!r.enRetard || !passe(echeance)) continue;
    sortie.push({ id: `reste-${r.id}`, genre: 'facture', titre: r.libelle || 'Pièce sans nom', detail: `échéance le ${jourLisible(echeance)} · ${francs(r.cents)} CHF`, jour: echeance, ouvre: { ecran: 'piece', id: r.id } });
  }
  for (const b of e.batches) {
    if (b.archivedAt || b.status !== 'planifie') continue;
    const prevu = isoDate(plannedBrewDate(b));
    if (!passe(prevu) || !plannedDateIsPast(b, Date.parse(`${e.aujourdhui}T12:00:00Z`))) continue;
    sortie.push({ id: `brassin-${b.id}`, genre: 'brassin', titre: b.name || b.id, detail: `pas brassée · brassage prévu le ${jourLisible(prevu)}`, jour: prevu, ouvre: { ecran: 'brassin', id: b.id } });
  }
  for (const t of e.items) {
    if (t.type !== 'event' || t.status === 'done' || (t as { archivedAt?: string | null }).archivedAt) continue;
    const jour = isoDate(t.date);
    const fin = fenetreLue(t.fenetre)?.au ?? jour;
    if (!jour || !passe(fin) || !t.title?.trim()) continue;
    sortie.push({ id: `tache-${t.id}`, genre: 'tache', titre: t.title, detail: fin !== jour ? `prévue du ${jourLisible(jour)} au ${jourLisible(fin)}` : `prévue le ${jourLisible(jour)}`, jour: fin, ouvre: { ecran: 'agenda', id: t.id } });
  }
  for (const b of e.sansDensite ?? []) {
    const brasse = isoDate(actualBrewDate(b));
    if (!passe(brasse)) continue;
    sortie.push({ id: `densite-${b.id}`, genre: 'densite', titre: `Mesurer la densité : ${b.name || b.id}`, detail: `brassé le ${jourLisible(brasse)} · aucune densité relevée`, jour: brasse, ouvre: { ecran: 'brassin', id: b.id } });
  }
  for (const c of e.commandes ?? []) {
    const avant = isoDate(c.avantLe);
    if (!passe(avant)) continue;
    const quoi = c.articles?.length ? ` · ${c.articles.join(', ')}` : '';
    sortie.push({ id: `courses-${c.batchId}`, genre: 'courses', titre: `Commander pour ${c.nom}`, detail: `à commander avant le ${jourLisible(avant)}${quoi}`, jour: avant, ouvre: { ecran: 'courses' } });
  }
  const avantLe = isoDate(e.courses?.avantLe);
  if (e.courses && e.courses.nombre > 0 && passe(avantLe) && !sortie.some(r => r.genre === 'courses')) {
    sortie.push({ id: 'courses', genre: 'courses', titre: `Commander pour ${e.courses.nom}`, detail: `${e.courses.nombre} article${e.courses.nombre > 1 ? 's' : ''} à commander avant le ${jourLisible(avantLe)}`, jour: avantLe, ouvre: { ecran: 'courses' } });
  }
  // Du plus ancien au plus récent ; à jour égal, l'ordre des ids.
  return sortie.sort((a, b) => (a.jour ?? '9999').localeCompare(b.jour ?? '9999') || a.id.localeCompare(b.id));
}
