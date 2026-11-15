/**
 * Fiche d'identité d'un fût, remplir depuis un lot, ajout groupé (maquettes F2, R1 et ajout, 15.11) : fonctions pures.
 * Le parc, les règles de contenance et de livraison restent dans `futs.ts` ; ici l'âge, l'historique, les gestes et les numéros.
 */
import type { Batch, KegHistoryEntry, KegHistoryKind, KegItem } from '../../types';
import { nextUniqueRef } from '../../services/refs';
import { nombreFr } from '../nombreAffiche';
import { litresDansLesAutresFuts, volumeProduit } from './futs';

/** Au-delà de ce nombre de jours chez un client, la jauge « dehors » passe en attention. Aucun réglage n'existe : c'est une constante. */
export const SEUIL_DEHORS_J = 30;
/** Une étape de plus chasse la plus ancienne : le journal d'audit garde le reste. */
export const HISTORIQUE_MAX = 30;

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Jours de fût après lesquels la bière est à boire, selon le style : NEIPA/IPA/DIPA 30, Pale Ale 45, le reste 90. */
export function reperePourStyle(style?: string): number {
  const s = sansAccent(style ?? '');
  if (/\b(neipa|ne ipa|ipa|dipa|tipa|new england|hazy|india pale)/.test(s)) return 30;
  if (/pale ale|\bapa\b/.test(s)) return 45;
  return 90;
}

const SWISS = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Minuit UTC d'une date `JJ.MM.AAAA` (ou `AAAA-MM-JJ`), `undefined` si elle est illisible ou n'existe pas. */
function jourUtc(date?: string): number | undefined {
  const d = (date ?? '').trim();
  const sw = SWISS.exec(d), iso = ISO.exec(d);
  const parts = sw ? [+sw[3], +sw[2], +sw[1]] : iso ? [+iso[1], +iso[2], +iso[3]] : undefined;
  if (!parts) return undefined;
  const [a, b, c] = parts;
  const t = Date.UTC(a, b - 1, c);
  const back = new Date(t);
  // 31.02 ne devient pas 03.03 en silence.
  return back.getUTCFullYear() === a && back.getUTCMonth() === b - 1 && back.getUTCDate() === c ? t : undefined;
}

/** Jours entiers entre deux dates ; 0 si la seconde précède la première ; `undefined` si l'une est illisible (jamais 0 par défaut). */
export function joursEntre(depuis?: string, jusqua?: string): number | undefined {
  const a = jourUtc(depuis), b = jourUtc(jusqua);
  if (a === undefined || b === undefined) return undefined;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** `02.11.2026` ➔ `02.11`. Une date illisible reste telle quelle. */
export function dateCourte(date?: string): string {
  const m = SWISS.exec((date ?? '').trim());
  return m ? `${m[1]}.${m[2]}` : (date ?? '');
}

export interface JaugeFut {
  /** `cave` : jours depuis le remplissage sur le repère du style ; `dehors` : jours chez le client sur le seuil de 30 j. */
  sorte: 'cave' | 'dehors';
  /** `undefined` quand la date est inconnue : la barre est masquée, jamais tracée à 0. */
  jours?: number;
  repere: number;
  /** 0 à 100. */
  pct: number;
  depasse: boolean;
}

export function jaugeFut(keg: Pick<KegItem, 'state' | 'style' | 'fillDate' | 'deliveryDate'>, aujourdhui: string): JaugeFut | undefined {
  const faire = (sorte: JaugeFut['sorte'], jours: number | undefined, repere: number): JaugeFut =>
    ({ sorte, jours, repere, pct: jours === undefined ? 0 : Math.min(100, Math.round((jours / repere) * 100)), depasse: jours !== undefined && jours > repere });
  if (keg.state === 'plein') return faire('cave', joursEntre(keg.fillDate, aujourdhui), reperePourStyle(keg.style));
  if (keg.state === 'livre') return faire('dehors', joursEntre(keg.deliveryDate, aujourdhui), SEUIL_DEHORS_J);
  return undefined;
}

/** Couleur de la pastille d'une bière : la teinte courante de son style. Style inconnu = `undefined` (pastille neutre), jamais une couleur inventée. */
export function couleurPastille(style?: string): string | undefined {
  const s = sansAccent(style ?? '');
  if (!s) return undefined;
  if (/\b(neipa|ne ipa|ipa|dipa|hazy|new england)/.test(s)) return '#E8B84A';
  if (/pale ale|\bapa\b/.test(s)) return '#D18A2E';
  if (/ambre|amber|\bred\b/.test(s)) return '#A8552A';
  if (/stout|porter|noire/.test(s)) return '#3B2A20';
  if (/pils|lager|blonde|helles|blanche|wheat|weiss/.test(s)) return '#F0D060';
  return undefined;
}

export function statutLot(status: Batch['status']): string {
  return ({ fermentation: 'en fermentation', garde: 'en garde', conditionne: 'conditionné' } as Partial<Record<Batch['status'], string>>)[status] ?? String(status);
}

/* ── Historique ── */

const sansCles = <T extends object>(o: T, ...cles: Array<keyof T>): T => {
  const copie = { ...o };
  cles.forEach((c) => delete copie[c]);
  return copie;
};

/** Ajoute une étape à la fin et ne garde que les `HISTORIQUE_MAX` dernières. */
export function avecEtape(historique: KegHistoryEntry[] | undefined, etape: KegHistoryEntry): KegHistoryEntry[] {
  const e: KegHistoryEntry = etape.detail ? etape : { date: etape.date, quoi: etape.quoi };
  return [...(historique ?? []), e].slice(-HISTORIQUE_MAX);
}

/** Les `n` étapes les plus récentes, la plus récente en premier (toutes si `n` est omis). */
export function etapesRecentes(keg: Pick<KegItem, 'historique'>, n?: number): KegHistoryEntry[] {
  const toutes = [...(keg.historique ?? [])].reverse();
  return n === undefined ? toutes : toutes.slice(0, n);
}

const LIBELLE_ETAPE: Record<KegHistoryKind, string> = {
  ajoute: 'Ajouté au parc', lave: 'Lavé', rempli: 'Rempli', livre: 'Livré', 'retour-vide': 'Revenu vide', 'retour-plein': 'Revenu plein'
};

export function libelleEtape(e: KegHistoryEntry): string {
  const base = LIBELLE_ETAPE[e.quoi] ?? e.quoi;
  return e.detail ? `${base} · ${e.detail}` : base;
}

/** Date de la dernière étape d'un genre (« Revenu le 13.11 », « Lavé le 12.11 »). `undefined` sur un fût sans historique. */
export function derniereDate(keg: Pick<KegItem, 'historique'>, quoi: KegHistoryKind): string | undefined {
  return etapesRecentes(keg).find((e) => e.quoi === quoi)?.date;
}

/* ── Gestes : chaque transition rend un fût neuf, avec son étape. ── */

const CONTENU = ['batchRef', 'beerName', 'style', 'fillDate'] as const;
const CLIENT = ['clientId', 'clientName', 'deliveryDate'] as const;

export function livrer(keg: KegItem, client: { id?: string; name: string }, date: string): KegItem {
  return {
    ...keg, state: 'livre', clientName: client.name, deliveryDate: date,
    ...(client.id ? { clientId: client.id } : {}),
    historique: avecEtape(keg.historique, { date, quoi: 'livre', detail: client.name })
  };
}

/** Revenu plein : il repasse en cave avec sa bière, sans client. */
export function revenuPlein(keg: KegItem, date: string): KegItem {
  return { ...sansCles(keg, ...CLIENT), state: 'plein', historique: avecEtape(keg.historique, { date, quoi: 'retour-plein', detail: keg.clientName }) };
}

/** Retour vide : le fût passe à laver, vidé de sa bière et de son client. */
export function retourVide(keg: KegItem, date: string): KegItem {
  return { ...sansCles(keg, ...CONTENU, ...CLIENT), state: 'lavage', historique: avecEtape(keg.historique, { date, quoi: 'retour-vide', detail: keg.clientName }) };
}

export function marquerPropre(keg: KegItem, date: string): KegItem {
  return { ...sansCles(keg, ...CONTENU, ...CLIENT), state: 'propre', historique: avecEtape(keg.historique, { date, quoi: 'lave' }) };
}

export function remplirFut(keg: KegItem, batch: Pick<Batch, 'id' | 'name' | 'style'>, date: string): KegItem {
  return {
    ...sansCles(keg, ...CLIENT), state: 'plein', batchRef: batch.id, beerName: batch.name, style: batch.style, fillDate: date,
    historique: avecEtape(keg.historique, { date, quoi: 'rempli', detail: `${batch.name} ${batch.id}` })
  };
}

/* ── Remplir depuis un lot ── */

type VolumesLot = Pick<Batch, 'id' | 'volumePackagedL' | 'volumeBrewedL' | 'volumeL'>;

export interface BarreLitres {
  /** `undefined` quand le brassin n'a pas de volume connu. */
  produits?: number;
  dejaEnFut: number;
  choisis: number;
  restent?: number;
}

export function barreLitres(batch: VolumesLot, kegs: KegItem[], choisis: KegItem[]): BarreLitres {
  const produits = volumeProduit(batch);
  const dejaEnFut = litresDansLesAutresFuts(batch.id, kegs, '');
  const litresChoisis = choisis.reduce((s, k) => s + (Number.isFinite(k.capacityL) ? k.capacityL : 0), 0);
  return { produits, dejaEnFut, choisis: litresChoisis, restent: produits === undefined ? undefined : Math.max(0, produits - dejaEnFut - litresChoisis) };
}

/** « 60 L produits · aucun en fût · 50 L choisis · 10 L restent » */
export function phraseLitres(b: BarreLitres): string {
  const l = (n: number) => `${nombreFr(n, 1)} L`;
  return [
    b.produits === undefined ? 'volume produit inconnu' : `${l(b.produits)} produits`,
    b.dejaEnFut > 0 ? `${l(b.dejaEnFut)} déjà en fût` : 'aucun en fût',
    b.choisis > 0 ? `${l(b.choisis)} choisis` : 'aucun fût choisi',
    ...(b.restent === undefined ? [] : [b.restent === 0 ? 'plus rien ne reste' : `${l(b.restent)} restent`])
  ].join(' · ');
}

/**
 * Règle de `problemeRemplissage`, pour plusieurs fûts à la fois : un seul fût peut rester en partie vide (le plus petit),
 * les autres se remplissent entièrement. Si les fûts déjà pleins de ce brassin et les fûts choisis, moins ce fût partiel,
 * couvrent déjà tout le produit, un des fûts resterait vide : refusé. Un seul fût choisi : même verdict que `problemeRemplissage`.
 */
export function problemeRemplissageMultiple(batch: VolumesLot, choisis: KegItem[], kegs: KegItem[]): string | undefined {
  const volume = volumeProduit(batch);
  if (volume === undefined || choisis.length === 0) return undefined;
  const caps = choisis.map((k) => (Number.isFinite(k.capacityL) ? k.capacityL : 0));
  const pleins = caps.reduce((a, b) => a + b, 0) - Math.min(...caps);
  const couvert = litresDansLesAutresFuts(batch.id, kegs, '') + pleins;
  if (couvert >= volume)
    return `Les fûts déjà remplis et ceux choisis couvrent ${nombreFr(couvert, 1)} L pour ${nombreFr(volume, 1)} L produits : un fût resterait vide.`;
  return undefined;
}

/* ── Ajouter des fûts ── */

/** `n` numéros à la suite du parc, sans jamais réattribuer un numéro existant ou déjà donné. */
export function numerosSuivants(existants: string[], n: number): string[] {
  const donnes: string[] = [];
  for (let i = 0; i < n; i += 1) donnes.push(nextUniqueRef('F', [...existants, ...donnes]));
  return donnes;
}

export function creerFuts(opts: { capacityL: number; combien: number; existants: string[]; date: string; notes?: string }): KegItem[] {
  const note = opts.notes?.trim();
  return numerosSuivants(opts.existants, opts.combien).map((id) => ({
    id, capacityL: opts.capacityL, state: 'propre' as const, ...(note ? { notes: note } : {}),
    historique: [{ date: opts.date, quoi: 'ajoute' as const }]
  }));
}

/** « F-009, F-010, F-011 » ; au-delà de quatre, « F-009 à F-018 ». */
export function resumeNumeros(ids: string[]): string {
  return ids.length <= 4 ? ids.join(', ') : `${ids[0]} à ${ids[ids.length - 1]}`;
}

/** Une capacité saisie à la main : 1 à 200 L, virgule ou point. `undefined` sinon. */
export function lireCapacite(saisie: string): number | undefined {
  const t = saisie.trim().replace(',', '.');
  const n = /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 200 ? n : undefined;
}
