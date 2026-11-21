/**
 * Fiche d'identité d'un fût, remplir depuis un lot, ajout groupé (maquettes F2, R1 et ajout, 15.11) : fonctions pures.
 * Le parc, les règles de contenance et de livraison restent dans `futs.ts` ; ici l'âge, l'historique, les gestes et les numéros.
 */
import type { Batch, KegHistoryEntry, KegHistoryKind, KegItem, KegState } from '../../types';
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
  ajoute: 'Ajouté au parc', lave: 'Lavé', rempli: 'Rempli', livre: 'Livré', 'retour-vide': 'Revenu vide', 'retour-plein': 'Revenu plein', 'a-laver': 'Remis à laver'
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

/** N4 : les fûts livrés au même client que ce fût (lui d'abord, puis par numéro). Sans client connu : le nom fait foi. */
export function futsDuClient(keg: KegItem, kegs: KegItem[]): KegItem[] {
  if (keg.state !== 'livre') return [keg];
  const nom = (k: KegItem) => sansAccent(k.clientName ?? '').trim();
  const meme = (k: KegItem) => k.state === 'livre' && (keg.clientId ? k.clientId === keg.clientId : !k.clientId && nom(k) !== '' && nom(k) === nom(keg));
  const autres = kegs.filter((k) => k.id !== keg.id && meme(k)).sort((x, y) => nat.compare(x.id, y.id));
  return [keg, ...autres];
}

/** N4 : « Ses 3 fûts sont revenus » ; un toucher rentre les fûts cochés, vides, à laver, à la date du jour. */
export function libelleRetourTous(n: number, seul?: string): string {
  if (n === 0) return 'Aucun fût coché';
  if (n === 1) return seul ? `Retour vide · ${seul}` : 'Retour vide';
  return `Ses ${n} fûts sont revenus`;
}

/** Remettre à laver (Gestion du fût) : un fût propre, neuf ou sali, repasse à laver ; rien d'autre ne change. */
export function remettreALaver(keg: KegItem, date: string, detail?: string): KegItem {
  return { ...sansCles(keg, ...CONTENU, ...CLIENT), state: 'lavage', historique: avecEtape(keg.historique, { date, quoi: 'a-laver', ...(detail ? { detail } : {}) }) };
}

/** La dernière étape qui a mis le fût à laver : retour vide, ou remis à laver depuis la fiche. */
export function etapeALaver(keg: KegItem): KegHistoryEntry | undefined {
  return etapesRecentes(keg).find((x) => x.quoi === 'retour-vide' || x.quoi === 'a-laver');
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
  const ailleurs = litresDansLesAutresFuts(batch.id, kegs, '');
  if (ailleurs >= volume)
    return `Ce lot est déjà tout en fût (${nombreFr(volume, 1)} L) : plus rien à remplir.`;
  if (ailleurs + pleins >= volume)
    return `Trop de fûts choisis : il reste ${nombreFr(volume - ailleurs, 1)} L à mettre en fût, un fût resterait vide. Retires-en un.`;
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

/* ── La liste (maquette G4, « L2 avec les lignes de L1 ») : états, jauge, résumé, sections, lignes ── */

export type EtatFut = KegState | 'unknown';
/** Ordre de la jauge-filtre, de gauche à droite. */
export const ORDRE_JAUGE: readonly EtatFut[] = ['lavage', 'propre', 'plein', 'livre', 'unknown'];
/** Ordre des sections : ce qui est dehors, ce qui est prêt à partir, ce qui attend un lavage, ce qui est prêt à remplir. */
export const ORDRE_SECTIONS: readonly EtatFut[] = ['livre', 'plein', 'lavage', 'propre', 'unknown'];

const ETATS_CONNUS: readonly string[] = ['lavage', 'propre', 'plein', 'livre'];
export const etatFut = (keg: Pick<KegItem, 'state'>): EtatFut => (typeof keg.state === 'string' && ETATS_CONNUS.includes(keg.state) ? keg.state : 'unknown');

export type ComptesEtats = Record<EtatFut, number>;
export function comptesParEtat(kegs: Array<Pick<KegItem, 'state'>>): ComptesEtats {
  const c: ComptesEtats = { lavage: 0, propre: 0, plein: 0, livre: 0, unknown: 0 };
  kegs.forEach((k) => { c[etatFut(k)] += 1; });
  return c;
}

const litres = (k: Pick<KegItem, 'capacityL'>) => (Number.isFinite(k.capacityL) ? k.capacityL : 0);

export interface ResumeParc { futs: number; litres: number; litresPleins: number; dehors: number }
/** « 8 fûts · 220 L » et « 50 L pleins en cave · 2 dehors » : tout est calculé sur le parc, rien n'est saisi. */
export function resumeParc(kegs: Array<Pick<KegItem, 'state' | 'capacityL'>>): ResumeParc {
  return {
    futs: kegs.length,
    litres: kegs.reduce((s, k) => s + litres(k), 0),
    litresPleins: kegs.filter((k) => k.state === 'plein').reduce((s, k) => s + litres(k), 0),
    dehors: kegs.filter((k) => k.state === 'livre').length
  };
}

export function phrasesResume(r: ResumeParc, litresArchivesPleins = 0): { gauche: string; droite: string } {
  // Un fût archivé plein garde sa bière en cave : elle compte dans les litres pleins, et le dit.
  const pleins = r.litresPleins + litresArchivesPleins;
  return {
    gauche: `${r.futs} ${r.futs > 1 ? 'fûts' : 'fût'} · ${nombreFr(r.litres, 1)} L`,
    droite: `${nombreFr(pleins, 1)} L pleins en cave${litresArchivesPleins > 0 ? ` (dont ${nombreFr(litresArchivesPleins, 1)} L en fût archivé)` : ''} · ${r.dehors === 0 ? 'aucun dehors' : `${r.dehors} dehors`}`
  };
}

/** Choix multiple : toucher un état l'ajoute, le retoucher le retire. L'ordre est celui de la jauge, jamais celui des touchers. */
export function basculerFiltre(filtre: readonly EtatFut[], etat: EtatFut): EtatFut[] {
  const present = filtre.includes(etat);
  return ORDRE_JAUGE.filter((e) => (e === etat ? !present : filtre.includes(e)));
}

/** La date qui range un fût dans sa section : livraison, remplissage, retour vide, lavage. */
export function dateDeRang(keg: KegItem): string | undefined {
  if (keg.state === 'livre') return keg.deliveryDate;
  if (keg.state === 'plein') return keg.fillDate;
  if (keg.state === 'lavage') return etapeALaver(keg)?.date;
  if (keg.state === 'propre') return derniereDate(keg, 'lave');
  return undefined;
}

const nat = new Intl.Collator('fr', { numeric: true });
/** Dans une section, le plus ancien d'abord (le plus longtemps dehors, en cave, à laver) ; sans date, à la fin, par numéro. */
export function trierSection(kegs: KegItem[], aujourdhui: string): KegItem[] {
  const age = new Map(kegs.map((k) => [k.id, joursEntre(dateDeRang(k), aujourdhui)] as const));
  return [...kegs].sort((a, b) => {
    const x = age.get(a.id), y = age.get(b.id);
    if (x !== y) return x === undefined ? 1 : y === undefined ? -1 : y - x;
    return nat.compare(a.id, b.id);
  });
}

/** Le parc rangé par sections (Livrés, Pleins, À laver, Propres, puis État inconnu), chacune triée. */
export function rangerParSections(kegs: KegItem[], aujourdhui: string): KegItem[] {
  return ORDRE_SECTIONS.flatMap((e) => trierSection(kegs.filter((k) => etatFut(k) === e), aujourdhui));
}

/** Livré depuis plus de `SEUIL_DEHORS_J` jours : la pastille « Livré » devient « À reprendre ». Date inconnue : jamais. */
export function aReprendre(keg: Pick<KegItem, 'state' | 'style' | 'fillDate' | 'deliveryDate'>, aujourdhui: string): boolean {
  return keg.state === 'livre' && Boolean(jaugeFut(keg, aujourdhui)?.depasse);
}

export interface LigneDate {
  texte: string;
  /** `13 j` ou `11 j dehors` ; absent pour un fût propre ou à laver. */
  age?: string;
  /** Au-delà du repère du style (en cave) ou du seuil (dehors) : âge en gras, couleur attention. */
  ancien: boolean;
}

/** Troisième ligne : « Rempli le 02.11 », « Livré le 04.11 », « Lavé le 12.11 », « Revenu le 13.11 · Café du Marché ». `undefined` quand l'historique ne le dit pas. */
export function ligneDate(keg: KegItem, aujourdhui: string): LigneDate | undefined {
  const lisible = (d?: string) => (jourUtc(d) === undefined ? undefined : dateCourte(d));
  const j = jaugeFut(keg, aujourdhui);
  if (keg.state === 'plein' && lisible(keg.fillDate) && j?.jours !== undefined) return { texte: `Rempli le ${lisible(keg.fillDate)}`, age: `${j.jours} j`, ancien: j.depasse };
  if (keg.state === 'livre' && lisible(keg.deliveryDate) && j?.jours !== undefined) return { texte: `Livré le ${lisible(keg.deliveryDate)}`, age: `${j.jours} j dehors`, ancien: j.depasse };
  if (keg.state === 'propre') {
    const d = lisible(derniereDate(keg, 'lave'));
    return d ? { texte: `Lavé le ${d}`, ancien: false } : undefined;
  }
  if (keg.state === 'lavage') {
    const e = etapeALaver(keg);
    const d = lisible(e?.date);
    if (!e || !d) return undefined;
    return { texte: e.quoi === 'a-laver' ? `Remis à laver le ${d}` : `Revenu le ${d}${e.detail ? ` · ${e.detail}` : ''}`, ancien: false };
  }
  return undefined;
}

/** `À laver + Propres`, dans l'ordre de la jauge. */
export function phraseFiltre(filtre: readonly EtatFut[], libelle: (e: EtatFut) => string): string {
  return ORDRE_JAUGE.filter((e) => filtre.includes(e)).map(libelle).join(' + ');
}

/** Libellé d'un segment de la jauge : le singulier quand il n'y a qu'un fût (« Propre 1 », « Propres 4 »). */
export function libelleSegment(etat: EtatFut, n: number): string {
  const [un, plusieurs] = ({ lavage: ['À laver', 'À laver'], propre: ['Propre', 'Propres'], plein: ['Plein', 'Pleins'], livre: ['Livré', 'Livrés'], unknown: ['État inconnu', 'État inconnu'] } as const)[etat];
  return n === 1 ? un : plusieurs;
}

export const titreConfirmation = (n: number) => `Marquer ${n} ${n > 1 ? 'fûts propres' : 'fût propre'} ?`;
export const phraseMarques = (n: number) => `${n} ${n > 1 ? 'fûts marqués propres' : 'fût marqué propre'}`;

/** Les fûts à laver, par numéro, marqués propres le même jour ; `avant` sert à rétablir. */
export function marquerTousPropres(kegs: KegItem[], date: string): { avant: KegItem[]; apres: KegItem[] } {
  const avant = kegs.filter((k) => k.state === 'lavage').sort((a, b) => nat.compare(a.id, b.id));
  return { avant, apres: avant.map((k) => marquerPropre(k, date)) };
}

/**
 * Rétablit l'état d'avant, mais seulement pour les fûts que personne n'a touchés depuis le geste : même état et même dernière
 * étape d'historique que juste après. Le stockage peut ajouter ses propres champs : on ne compare pas l'objet entier.
 */
export function futsARetablir(avant: KegItem[], apres: KegItem[], courants: KegItem[]): KegItem[] {
  const derniere = (k: KegItem) => JSON.stringify(k.historique?.at(-1) ?? null);
  return avant.filter((k, i) => {
    const now = courants.find((c) => c.id === k.id);
    return now !== undefined && now.state === apres[i].state && (now.historique?.length ?? 0) === (apres[i].historique?.length ?? 0) && derniere(now) === derniere(apres[i]);
  });
}
