// La liste des brassins et sa feuille de filtres (e6a, e6c : choix du brasseur du 15.11). Règles pures, sans React.
// Le modèle de filtre du catalogue (`CatalogFilters`) est mono-valeur ; la maquette pose plusieurs critères par groupe (OU dans un groupe,
// ET entre groupes) et compte à facettes. Ces critères vivent donc ici, en état d'UI local, par-dessus `filterCatalog` (période, statut,
// alcool et favoris du catalogue sont neutralisés : un seul juge par critère).
import type { Batch, KegItem } from '../../../types';
import {
  catalogText,
  filterCatalog,
  type CatalogEntry,
  type CatalogFilters
} from '../../../domain/productionCatalog';
import { inCatalogFolder } from '../../../domain/catalogOrganization';
import { statusOfBatch } from '../../../domain/batchStatus';
import { fermentationReadings } from '../../../domain/fermentationReadings';
import { hasBrewStarted } from '../../../domain/batchSchedule';
import {
  batchNextAction,
  isPackaged,
  joursDepuisBrassage,
  missingBatchMeasurements
} from '../../../domain/productionInsights';
import { dryHopDans, fgAConfirmer, retardDe } from '../volumes/phrase';
import { estEnCours } from '../volumes/periode';
import { brassinsVendables } from '../../vente/brassinsVendables';
import { dansPeriode as dansLaPeriodeCommune, enPeriode, type PeriodeEntree } from '../../../components/periode/periode';
import { modeleFiche } from '../fermentation/modele';

export type Avancement = 'cuve' | 'brasser' | 'conditionnes' | 'termines' | 'mesures' | 'favoris' | 'notes';
export const AVANCEMENTS: { id: Avancement; label: string; court: string }[] = [
  { id: 'cuve', label: 'En cuve', court: 'En cuve' },
  { id: 'brasser', label: 'À brasser', court: 'À brasser' },
  { id: 'conditionnes', label: 'Conditionnés', court: 'Conditionnés' },
  { id: 'termines', label: 'Terminés', court: 'Terminés' },
  { id: 'mesures', label: 'Mesures manquantes', court: 'Mesures manquantes' },
  { id: 'favoris', label: '★ Favoris', court: '★' },
  { id: 'notes', label: 'Notes à compléter', court: 'Notes à compléter' }
];
export const libelleAvancement = (id: Avancement) => AVANCEMENTS.find((a) => a.id === id)!.label;

export interface Criteres {
  avancement: Avancement[];
  styles: string[];
  houblons: string[];
  malts: string[];
  levures: string[];
  /** Plage d'alcool posée (% vol.) ; absente = pas de borne (les brassins sans valeur restent). */
  alcool?: [number, number];
  /** Une seule période dans l'app (m3r-a) : celle de l'en-tête, passée au `Contexte`. Ici seul reste le réglage « les en cours, toujours ». */
  periode: { enCours: boolean };
}
export const CRITERES_VIDES: Criteres = {
  avancement: [],
  styles: [],
  houblons: [],
  malts: [],
  levures: [],
  periode: { enCours: true }
};
export const restaurerCriteres = (v: unknown): Criteres => {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Criteres>;
  const tab = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
  const ids = AVANCEMENTS.map((a) => a.id);
  const alc = Array.isArray(o.alcool) && o.alcool.length === 2 && o.alcool.every((n) => Number.isFinite(n)) ? ([o.alcool[0], o.alcool[1]] as [number, number]) : undefined;
  const p = (o.periode ?? {}) as Partial<Criteres['periode']>; // un ancien état (mode, de, a) est ignoré : la période est celle de l'en-tête
  return {
    avancement: tab(o.avancement).filter((a): a is Avancement => (ids as string[]).includes(a)),
    styles: tab(o.styles),
    houblons: tab(o.houblons),
    malts: tab(o.malts),
    levures: tab(o.levures),
    ...(alc ? { alcool: alc } : {}),
    periode: { enCours: p.enCours !== false }
  };
};

const SANS_ACCENT = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
/** Les styles à sigle usuel : « New England IPA » devient « NEIPA » (la maquette pose la pastille courte à côté du nom). Un autre style reste tel quel. */
const SIGLES: [RegExp, string][] = [
  [/^(new england (india pale ale|ipa)|neipa|hazy ipa|juicy ipa)$/, 'NEIPA'],
  [/^(american pale ale|apa)$/, 'APA'],
  [/^(double ipa|imperial ipa|dipa|double india pale ale)$/, 'DIPA'],
  [/^(american ipa|india pale ale|ipa)$/, 'IPA'],
  [/^(extra special bitter|esb)$/, 'ESB']
];
export const styleCourt = (style: string): string => {
  const n = SANS_ACCENT(style.replace(/\s+/g, ' '));
  return SIGLES.find(([re]) => re.test(n))?.[1] ?? style.trim();
};

/** L'alcool d'un brassin : celui de la fiche, sinon — brassin en cuve — la valeur provisoire de la fiche (même fonction : OG et dernier relevé). */
export function abvDe(e: CatalogEntry, now: number): { v: number; provisoire: boolean } | undefined {
  if (e.abv !== undefined) return { v: e.abv, provisoire: false };
  const b = e.batch;
  if (!b || (b.status !== 'fermentation' && b.status !== 'garde')) return undefined;
  const a = modeleFiche(b, now)?.alcool;
  return a != null && Number.isFinite(a) ? { v: a, provisoire: true } : undefined;
}

export type Groupe ='avancement' | 'style' | 'houblon' | 'malt' | 'levure' | 'alcool' | 'periode' | 'recherche';

export function correspondAvancement(e: CatalogEntry, a: Avancement): boolean {
  const b = e.batch;
  if (!b) return false;
  switch (a) {
    case 'cuve': return b.status === 'fermentation' || b.status === 'garde';
    case 'brasser': return b.status === 'planifie';
    case 'conditionnes': return b.status === 'conditionne';
    case 'termines': return b.status === 'termine';
    case 'mesures': return missingBatchMeasurements(b).length > 0;
    case 'favoris': return e.favorite;
    case 'notes': return isPackaged(b) && !b.notesTasting?.trim();
  }
}

const memeTexte = (a: string, b: string) => catalogText(a) === catalogText(b);

/** La période de l'en-tête juge la date d'un brassin (même règle que partout : `dansPeriode` de `periode.ts`) ; « les en cours et en vente, toujours » les garde hors période. */
function dansPeriode(e: CatalogEntry, enCours: boolean, periode: PeriodeEntree | undefined, now: number): boolean {
  const maintenant = new Date(now);
  if (!periode || enPeriode(periode, maintenant).genre === 'tout') return true;
  // B11 (WFV-5) : une bière que la caisse vend (conditionnée ou terminée, conditionnement noté) se montre quelle que soit la période.
  if (enCours && e.batch && (estEnCours(e.batch) || brassinsVendables([e.batch]).length > 0)) return true;
  if (e.timestamp === undefined) return false;
  return dansLaPeriodeCommune(e.date ?? '', periode, maintenant);
}

export interface Contexte {
  entries: CatalogEntry[];
  criteres: Criteres;
  filtres: CatalogFilters;
  /** La période de l'application (l'en-tête) ; absente = toutes. */
  periode?: PeriodeEntree;
  now?: number;
}

/** Les brassins qui passent tous les critères, sauf ceux des groupes ignorés (c'est ainsi qu'un compte se calcule : facettes). */
export function appliquer(ctx: Contexte, ignorer: Groupe[] = []): CatalogEntry[] {
  const { criteres: c, filtres: f } = ctx;
  const now = ctx.now ?? Date.now();
  const sans = (g: Groupe) => ignorer.includes(g);
  const base = filterCatalog(
    ctx.entries,
    {
      ...f,
      status: '', favoritesOnly: false, use: 'all', versions: 'all', period: 'all', style: '', hop: '', malt: '', yeast: '', abvMin: '', abvMax: '',
      search: sans('recherche') ? '' : f.search
    },
    'all',
    now
  );
  const retenus = base.filter((e) => {
    if (!sans('avancement') && c.avancement.length && !c.avancement.some((a) => correspondAvancement(e, a))) return false;
    if (!sans('style') && c.styles.length && !c.styles.some((s) => memeTexte(s, e.style))) return false;
    if (!sans('houblon') && c.houblons.length && !c.houblons.some((h) => e.hops.some((x) => memeTexte(h, x)))) return false;
    if (!sans('malt') && c.malts.length && !c.malts.some((h) => e.malts.some((x) => memeTexte(h, x)))) return false;
    if (!sans('levure') && c.levures.length && !c.levures.some((l) => memeTexte(l, e.yeast))) return false;
    if (!sans('alcool') && c.alcool) {
      const a = abvDe(e, now)?.v;
      if (a === undefined || a < c.alcool[0] - 1e-9 || a > c.alcool[1] + 1e-9) return false;
    }
    if (!sans('periode') && !dansPeriode(e, c.periode.enCours, ctx.periode, now)) return false;
    return true;
  });
  // « À suivre d'abord » : le retard passe avant la garde (maquette e6a : la Pale Ale en retard est 2e). Tri stable : le reste garde l'ordre du catalogue.
  if (f.sort === 'work') {
    const rang = (e: CatalogEntry) => (e.batch && retardDe(e.batch, now) !== undefined ? 0 : 1);
    return retenus.map((e, i) => ({ e, i })).sort((a, b) => rang(a.e) - rang(b.e) || a.i - b.i).map((x) => x.e);
  }
  return retenus;
}

export const dansLeDossier = (ctx: Contexte) => ctx.entries.filter((e) => inCatalogFolder(e, ctx.filtres.folder ?? 'current'));

/** Compte d'une puce d'avancement : les autres groupes posés, celui-ci ignoré. */
export function comptesAvancement(ctx: Contexte): Record<Avancement, number> {
  const base = appliquer(ctx, ['avancement']);
  return Object.fromEntries(AVANCEMENTS.map((a) => [a.id, base.filter((e) => correspondAvancement(e, a.id)).length])) as Record<Avancement, number>;
}

export interface OptionCompte { valeur: string; n: number }
/** Valeurs d'un champ (style, houblon, malt, levure) avec leur compte à facettes ; les plus nombreuses d'abord. */
export function comptesChamp(ctx: Contexte, champ: 'style' | 'houblon' | 'malt' | 'levure'): OptionCompte[] {
  const base = appliquer(ctx, [champ]);
  const valeurs = (e: CatalogEntry): string[] =>
    champ === 'style' ? [e.style] : champ === 'houblon' ? e.hops : champ === 'malt' ? e.malts : [e.yeast];
  const noms = new Map<string, string>();
  dansLeDossier(ctx).forEach((e) => valeurs(e).forEach((v) => { const k = catalogText(v); if (k && !noms.has(k)) noms.set(k, v.trim()); }));
  const choisis = champ === 'style' ? ctx.criteres.styles : champ === 'houblon' ? ctx.criteres.houblons : champ === 'malt' ? ctx.criteres.malts : ctx.criteres.levures;
  choisis.forEach((v) => noms.set(catalogText(v), noms.get(catalogText(v)) ?? v));
  return [...noms.entries()]
    .map(([k, valeur]) => ({ valeur, n: base.filter((e) => valeurs(e).some((v) => catalogText(v) === k)).length }))
    .sort((a, b) => b.n - a.n || a.valeur.localeCompare(b.valeur, 'fr'));
}

/**
 * Bornes de la plage d'alcool, l'étendue réelle des valeurs et le nombre de brassins sans valeur, sur les autres critères.
 * Les bornes sont élargies d'un cran (maquette : 5,8 à 6,1 → 4,0 et 7,0). Un brassin en cuve compte avec sa valeur provisoire (`abvDe`) : point en pointillé.
 */
export function bornesAlcool(ctx: Contexte): { min: number; max: number; etendue: [number, number]; points: { abv: number; id: string; provisoire: boolean }[]; sansValeur: number } | undefined {
  const base = appliquer(ctx, ['alcool']);
  const now = ctx.now ?? Date.now();
  const points = base.flatMap((e) => { const a = abvDe(e, now); return a ? [{ abv: a.v, id: e.id, provisoire: a.provisoire }] : []; });
  if (!points.length) return undefined;
  const vals = points.map((p) => p.abv);
  const vmin = Math.min(...vals), vmax = Math.max(...vals);
  return { min: Math.max(0, Math.floor(vmin) - 1), max: Math.ceil(vmax + 0.5), etendue: [vmin, vmax], points, sansValeur: base.length - points.length };
}

// ---- Les critères posés, lisibles, et ce que rendrait chacun retiré ----
export interface CriterePose { id: string; label: string; groupe: Groupe }
export function criteresPoses(c: Criteres, recherche: string): CriterePose[] {
  const sortie: CriterePose[] = [];
  if (recherche.trim()) sortie.push({ id: 'recherche', label: `« ${recherche.trim()} »`, groupe: 'recherche' });
  c.avancement.forEach((a) => sortie.push({ id: `av:${a}`, label: libelleAvancement(a), groupe: 'avancement' }));
  c.styles.forEach((s) => sortie.push({ id: `st:${s}`, label: s, groupe: 'style' }));
  c.houblons.forEach((s) => sortie.push({ id: `ho:${s}`, label: s, groupe: 'houblon' }));
  c.malts.forEach((s) => sortie.push({ id: `ml:${s}`, label: s, groupe: 'malt' }));
  c.levures.forEach((s) => sortie.push({ id: `lv:${s}`, label: s, groupe: 'levure' }));
  if (c.alcool) sortie.push({ id: 'alcool', label: `${fr(c.alcool[0])} – ${fr(c.alcool[1])} %`, groupe: 'alcool' });
  // La période est celle de l'en-tête, réglée là (ou dans la feuille, qui l'écrit là) : elle ne compte pas comme critère posé de la liste.
  return sortie;
}
const fr = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

export function retirerCritere(c: Criteres, recherche: string, id: string): { criteres: Criteres; recherche: string } {
  const [type, ...reste] = id.split(':');
  const val = reste.join(':');
  switch (type) {
    case 'recherche': return { criteres: c, recherche: '' };
    case 'av': return { criteres: { ...c, avancement: c.avancement.filter((a) => a !== val) }, recherche };
    case 'st': return { criteres: { ...c, styles: c.styles.filter((a) => a !== val) }, recherche };
    case 'ho': return { criteres: { ...c, houblons: c.houblons.filter((a) => a !== val) }, recherche };
    case 'ml': return { criteres: { ...c, malts: c.malts.filter((a) => a !== val) }, recherche };
    case 'lv': return { criteres: { ...c, levures: c.levures.filter((a) => a !== val) }, recherche };
    case 'alcool': return { criteres: { ...c, alcool: undefined }, recherche };
    default: return { criteres: c, recherche };
  }
}

/** « Retirer « Stout » → 2 » : ce que rendrait la liste sans ce critère. */
export function comptesSiRetire(ctx: Contexte): { critere: CriterePose; n: number }[] {
  return criteresPoses(ctx.criteres, ctx.filtres.search).map((critere, i) => {
    const r = retirerCritere(ctx.criteres, ctx.filtres.search, critere.id);
    return { critere, n: appliquer({ ...ctx, criteres: r.criteres, filtres: { ...ctx.filtres, search: r.recherche } }).length, i };
  }).sort((a, b) => b.n - a.n || a.i - b.i).map(({ critere, n }) => ({ critere, n }));
}

/** Le titre du panneau « Ces critères s'excluent » : la cause quand un style et un avancement s'excluent (« Le Stout est conditionné : retire un critère »). */
export function titreExclusion(ctx: Contexte): string {
  const { criteres: c } = ctx;
  if (c.styles.length === 1 && c.avancement.length >= 1) {
    const d = dansLeDossier(ctx).filter((e) => c.styles.some((s) => memeTexte(s, e.style)));
    const statuts = [...new Set(d.map((e) => e.batch?.status).filter((x): x is NonNullable<Batch['status']> => !!x))];
    const nom = styleCourt(c.styles[0]);
    if (d.length === 1 && statuts.length === 1) {
      const etat: Partial<Record<NonNullable<Batch['status']>, string>> = { fermentation: 'en fermentation', garde: 'en garde', planifie: 'à brasser', conditionne: 'conditionné', termine: 'terminé', annule: 'annulé' };
      const e = etat[statuts[0]];
      if (e) return `Le ${nom} est ${e} : retire un critère`;
    }
  }
  return 'Ces critères s’excluent : retire-en un';
}

export const nombreDeCriteres = (c: Criteres, recherche: string) => criteresPoses(c, recherche).length;

// ---- La phrase de tête (e6a) ----
export interface LignePhrase { texte: string; ton: 'neutre' | 'hop' | 'attention' }
export interface PhraseListe { lignes: LignePhrase[]; compteurN: string; compteurLabel: string }
const pluriel = (n: number, un: string, plus: string) => (n > 1 ? plus : un);
const PHASE_MINUSCULE: Record<string, string> = { fermentation: 'fermentation', garde: 'garde' };

export function phraseListe(ctx: Contexte, resultats: CatalogEntry[]): PhraseListe {
  const total = dansLeDossier(ctx).length;
  const { criteres: c, filtres: f } = ctx;
  const poses = criteresPoses(c, f.search);
  if (!poses.length) {
    const cuve = ctx.entries.filter((e) => inCatalogFolder(e, f.folder) && correspondAvancement(e, 'cuve')).length;
    const brasser = ctx.entries.filter((e) => inCatalogFolder(e, f.folder) && correspondAvancement(e, 'brasser')).length;
    const lignes: LignePhrase[] = [];
    if (cuve) lignes.push({ texte: `${cuve} en cuve`, ton: 'hop' });
    if (brasser) lignes.push({ texte: `${brasser} à brasser`, ton: 'attention' });
    if (!lignes.length) lignes.push({ texte: total ? 'Rien en cours' : 'Aucun brassin', ton: 'neutre' });
    return { lignes, compteurN: String(total), compteurLabel: pluriel(total, 'brassin', 'brassins') };
  }
  const n = resultats.length;
  const crit = poses.map((p) => (p.groupe === 'recherche' ? p.label : p.label)).join(' ');
  const compteur = { compteurN: String(n), compteurLabel: `sur ${total}` };
  if (!n) return { lignes: [{ texte: 'Rien pour', ton: 'neutre' }, { texte: crit, ton: 'neutre' }], ...compteur };
  const seul = c.avancement.length === 1 && poses.length === 1 ? c.avancement[0] : undefined;
  const t1 =
    seul === 'cuve' ? `${n} en cuve`
    : seul === 'brasser' ? `${n} à brasser`
    : seul === 'conditionnes' ? `${n} ${pluriel(n, 'conditionné', 'conditionnés')}`
    : seul === 'termines' ? `${n} ${pluriel(n, 'terminé', 'terminés')}`
    : seul === 'mesures' ? `${n} à mesurer`
    : seul === 'favoris' ? `${n} ${pluriel(n, 'favori', 'favoris')}`
    : seul === 'notes' ? `${n} à noter`
    : `${n} ${pluriel(n, 'brassin', 'brassins')}`;
  const phases = [...new Set(resultats.map((e) => e.batch?.status).filter((s): s is NonNullable<Batch['status']> => !!s))]
    .filter((s) => PHASE_MINUSCULE[s]);
  const l2 = seul === 'cuve' && phases.length
    ? phases.map((s) => PHASE_MINUSCULE[s]).join(' et ')
    : crit;
  return { lignes: [{ texte: t1, ton: seul === 'brasser' ? 'attention' : 'hop' }, ...(l2 ? [{ texte: l2, ton: 'neutre' as const }] : [])], ...compteur };
}

// ---- La carte (e6a) ----
export type TonCarte = 'cuve' | 'garde' | 'brasser' | 'retard' | 'cond' | 'fin' | 'annule';
export interface ActionCarte { label: string; brew?: boolean; section?: 'measurements' | 'tasting' | 'overview' }
export interface CarteModel {
  ton: TonCarte;
  pastille: string;
  lot: string;
  ou: string;
  nom: string;
  style: string;
  cle: string;
  cleUnite: string;
  action: ActionCarte;
}
/** Alcool à une décimale fixe (« 6,0 % ») : chiffres à la virgule. */
export const abvFr = (v: number) => v.toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nbFr = (v: number | null | undefined, d = 1) => (v == null || !Number.isFinite(v) ? '—' : v.toLocaleString('fr-CH', { minimumFractionDigits: d === 3 ? 3 : 0, maximumFractionDigits: d }).replace(/[  ]/g, ' '));
export const jjmm = (v?: string | null): string => {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})/.exec(v) : null;
  if (m) return `${m[3]}.${m[2]}`;
  const d = v ? /^(\d{2})\.(\d{2})\.\d{4}$/.exec(v) : null;
  return d ? `${d[1]}.${d[2]}` : '';
};
const litres = (b: Batch): string => {
  const v = b.volumeBrewedL ?? undefined;
  return v != null && Number.isFinite(v) ? `${nbFr(v)} L` : '';
};

/** « fût 20 L » quand le fût est connu du stock ; sinon « fût, taille non notée » (jamais une taille inventée). */
const futs = (ids: string[], kegs: KegItem[]): string => {
  const tailles = ids.map((id) => kegs.find((k) => k.id === id)?.capacityL);
  const connues = tailles.every((t) => typeof t === 'number' && t > 0);
  if (ids.length === 1) return connues ? `fût ${nbFr(tailles[0] as number)} L` : 'fût, taille non notée';
  return connues ? `${ids.length} fûts · ${nbFr((tailles as number[]).reduce((a, b) => a + b, 0))} L` : `${ids.length} fûts, taille non notée`;
};

export function carteModel(entry: CatalogEntry, now = Date.now(), kegs: KegItem[] = []): CarteModel {
  const b = entry.batch!;
  const retard = retardDe(b, now);
  const statut = statusOfBatch(b);
  const lecture = fermentationReadings(b);
  const jours = joursDepuisBrassage(b, now);
  const next = batchNextAction(b);
  const actif = b.status === 'fermentation' || b.status === 'garde';
  const ton: TonCarte = retard !== undefined ? 'retard' : b.status === 'fermentation' ? 'cuve' : b.status === 'garde' ? 'garde' : b.status === 'planifie' ? 'brasser' : b.status === 'conditionne' ? 'cond' : b.status === 'termine' ? 'fin' : 'annule';
  const pastille = retard !== undefined ? `En retard · ${retard} j` : statut.label;
  let ou = '', cle = '—', cleUnite = '', action: ActionCarte;
  if (b.status === 'planifie') {
    const prevue = jjmm(b.plannedBrewDate);
    ou = prevue ? `prévue le ${prevue}` : 'date à définir';
    cleUnite = hasBrewStarted(b) ? 'brassage en cours' : 'pas encore brassée';
    action = hasBrewStarted(b)
      ? { label: b.brewDay?.finishedAt != null ? 'Clôturer' : 'Reprendre', brew: true }
      : { label: 'Brasser', brew: true };
  } else if (actif) {
    ou = litres(b);
    if (lecture.latest !== undefined) { cle = nbFr(lecture.latest, 3); }
    const stable = fgAConfirmer(b);
    cleUnite = [jours !== undefined && jours >= 0 ? `J+${jours}` : '', lecture.latest === undefined ? 'aucun relevé' : '', stable ? 'stable' : ''].filter(Boolean).join(' · ');
    const dh = dryHopDans(b, now);
    action = dh !== undefined && dh <= 1
      ? { label: dh === 0 ? 'Dry hop aujourd’hui' : 'Dry hop demain', section: 'measurements' }
      : stable ? { label: 'Confirmer FG', section: 'measurements' }
      : missingBatchMeasurements(b).length ? { label: 'Compléter les mesures', section: 'measurements' }
      : { label: 'Voir les mesures', section: 'measurements' };
  } else if (b.status === 'conditionne' || b.status === 'termine') {
    ou = jjmm(b.bottlingDate);
    cle = entry.abv !== undefined ? `${abvFr(entry.abv)} %` : '—';
    const p = b.packaging;
    const emb = p && (p.bottles33 || p.bottles75 || p.kegIds?.length)
      ? [p.bottles33 ? `${p.bottles33} × 33 cl` : '', p.bottles75 ? `${p.bottles75} × 75 cl` : '', p.kegIds?.length ? futs(p.kegIds, kegs) : ''].filter(Boolean).join(' · ')
      : b.volumePackagedL != null ? `${nbFr(b.volumePackagedL)} L conditionnés` : '';
    cleUnite = emb;
    const sansNote = !b.notesTasting?.trim();
    action = missingBatchMeasurements(b).length && b.status === 'conditionne'
      ? { label: 'Compléter les mesures', section: 'measurements' }
      : { label: sansNote ? 'Déguster' : 'Relire', section: 'tasting' };
  } else {
    ou = jjmm(entry.date);
    cleUnite = 'abandonné';
    action = { label: 'Ouvrir', section: next.section ?? 'overview' };
  }
  return { ton, pastille, lot: entry.id, ou, nom: entry.name, style: entry.style, cle, cleUnite, action };
}

/** Une rangée mini (e6a, « hors du filtre ») : barre, nom, lot, phase. */
export const miniModel = (entry: CatalogEntry, now = Date.now()) => {
  const m = carteModel(entry, now);
  return { ton: m.ton, nom: m.nom, lot: m.lot, phase: m.pastille };
};
