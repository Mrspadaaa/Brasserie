import type { Batch } from '../../../types';
import { breweryDay } from '../../../domain/batchSchedule';
import { ecartJours, jourN, releves, titreDeDate } from '../fiche/ficheModel';
import { formatDecimal } from '../../numericInput';
import type { MorceauPropose } from './rangement';
import { cuveDansNotes, notesSansCuve } from '../fermentation/cuve';

/**
 * e3gb, le fil du carnet : le modèle sans champ neuf.
 *
 * Les notes du brassin vivent dans deux champs qui existent déjà, `notesTasting` et `notesBrewDay`. Le carnet y lit des entrées,
 * une par ligne de tête :
 *   `14.11.2026 · Cuve : Krausen retombé`            (une entrée posée sur son jour)
 *   `14.11.2026 07:40 · Vrac : jeudi krausen…`       (une note en vrac, avec l'heure où elle a été écrite)
 *   `Prochain essai : empâter à 67 °C`               (une ligne, sans jour)
 *   `Verdict : à refaire`                            (e2a, déjà en place ; jamais touchée ici)
 * Un texte sans ligne de tête (tout ce que le brasseur a écrit avant ce port) reste lisible : dans `notesTasting`, il compte comme une note en vrac
 * sans date ; dans `notesBrewDay`, comme une observation du jour du brassage. Rien n'est réécrit tant que le brasseur n'a pas posé un geste.
 */

export type TypeEntree = 'cuve' | 'degustation' | 'incident' | 'brassage' | 'vrac';
export const ETIQUETTE: Record<TypeEntree, string> = { cuve: 'Cuve', degustation: 'Dégustation', incident: 'Incident', brassage: 'Brassage', vrac: 'Vrac' };
const TYPE_DE: Record<string, TypeEntree> = Object.fromEntries((Object.keys(ETIQUETTE) as TypeEntree[]).map(t => [ETIQUETTE[t], t]));

export type Bloc =
  | { kind: 'entree'; type: TypeEntree; date: string; heure: string | null; texte: string }
  | { kind: 'libre'; texte: string }
  | { kind: 'essai'; texte: string }
  | { kind: 'verdict'; ligne: string };

const TETE = /^(\d{2}\.\d{2}\.\d{4})(?: (\d{2}:\d{2}))? · (Cuve|Dégustation|Incident|Brassage|Vrac) : ?(.*)$/;
const ESSAI = /^Prochain essai : ?(.*)$/;
const VERDICT = /^Verdict : (à refaire|à corriger|sans suite)\s*$/;

/** Découpe un champ de notes en blocs ; `ecrireBlocs(lireBlocs(t)) === t` pour tout texte (aux fins de ligne près). */
export function lireBlocs(texte: string | undefined): Bloc[] {
  const blocs: Bloc[] = [];
  const reprendre = (ligne: string) => {
    const dernier = blocs[blocs.length - 1];
    if (dernier && (dernier.kind === 'libre' || dernier.kind === 'entree' || dernier.kind === 'essai')) dernier.texte += `\n${ligne}`;
    else blocs.push({ kind: 'libre', texte: ligne });
  };
  for (const ligne of (texte ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const t = TETE.exec(ligne);
    if (t) { blocs.push({ kind: 'entree', type: TYPE_DE[t[3]], date: t[1], heure: t[2] ?? null, texte: t[4] }); continue; }
    if (VERDICT.test(ligne)) { blocs.push({ kind: 'verdict', ligne }); continue; }
    const e = ESSAI.exec(ligne);
    if (e) { blocs.push({ kind: 'essai', texte: e[1] }); continue; }
    if (ligne.trim() === '' && !blocs.length) continue;
    reprendre(ligne);
  }
  return blocs;
}
export function ecrireBlocs(blocs: Bloc[]): string {
  return blocs.map(b => b.kind === 'entree' ? `${b.date}${b.heure ? ` ${b.heure}` : ''} · ${ETIQUETTE[b.type]} : ${b.texte}` : b.kind === 'libre' ? b.texte : b.kind === 'essai' ? `Prochain essai : ${b.texte}` : b.ligne).join('\n');
}
const sansVide = (blocs: Bloc[]) => blocs.filter(b => (b.kind === 'libre' || b.kind === 'entree' || b.kind === 'essai') ? b.texte.trim() !== '' : true);

/** Ajoute une entrée en fin de champ. */
export function avecEntree(texte: string | undefined, e: { type: TypeEntree; date: string; heure?: string | null; texte: string }): string {
  return ecrireBlocs([...lireBlocs(texte), { kind: 'entree', type: e.type, date: e.date, heure: e.heure ?? null, texte: e.texte.trim() }]);
}
/** La ligne « Prochain essai » : remplacée, posée en fin de champ, ou retirée si le texte est vide. */
export function avecEssai(texte: string | undefined, essai: string): string {
  const propre = essai.trim().replace(/\s*\n\s*/g, ' ');
  const blocs = lireBlocs(texte);
  const i = blocs.findIndex(b => b.kind === 'essai');
  if (i >= 0) { if (propre) blocs[i] = { kind: 'essai', texte: propre }; else blocs.splice(i, 1); }
  else if (propre) blocs.push({ kind: 'essai', texte: propre });
  return ecrireBlocs(blocs);
}
export const essaiDe = (texte: string | undefined): string | null => {
  const b = lireBlocs(texte).find((x): x is Extract<Bloc, { kind: 'essai' }> => x.kind === 'essai');
  return b && b.texte.trim() ? b.texte.trim() : null;
};
/** Retire les notes en vrac dont le texte est l'un de ceux donnés (la note rangée, une fois tous ses morceaux acceptés). */
export function sansVrac(texte: string | undefined, textes: string[]): string {
  const cibles = new Set(textes.map(t => t.trim()));
  return ecrireBlocs(sansVide(lireBlocs(texte).filter(b => !((b.kind === 'libre' || (b.kind === 'entree' && b.type === 'vrac')) && cibles.has(b.texte.trim())))));
}

export interface Vrac { texte: string; date: string | null; heure: string | null }
/** Les notes en vrac du brassin : les entrées « Vrac » et le texte libre de `notesTasting`. */
export function vracDe(batch: Pick<Batch, 'notesTasting'>): Vrac[] {
  return lireBlocs(batch.notesTasting).flatMap((b): Vrac[] => b.kind === 'libre' && b.texte.trim() ? [{ texte: b.texte.trim(), date: null, heure: null }]
    : b.kind === 'entree' && b.type === 'vrac' && b.texte.trim() ? [{ texte: b.texte.trim(), date: b.date, heure: b.heure }] : []);
}

/** « 14.11.2026 » et « 07:40 » d'un instant, au fuseau de la brasserie. */
export function instantSuisse(ms: number): { date: string; heure: string } {
  const heure = new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' }).format(ms);
  return { date: breweryDay(ms), heure };
}
export const decalerJour = (date: string, jours: number): string => {
  const [d, m, y] = date.split('.').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + jours));
  return `${String(t.getUTCDate()).padStart(2, '0')}.${String(t.getUTCMonth() + 1).padStart(2, '0')}.${t.getUTCFullYear()}`;
};
/** « sam. 14.11 » */
export const jourLong = (date: string): string => { const t = titreDeDate(date); const [nom, jm] = t.split(' '); return `${nom.slice(0, 3).toLowerCase()}. ${jm}`; };

// ---------------------------------------------------------------------------------------------------------------------------------
// Le fil

export interface Bulle { type: TypeEntree; texte: string; source: 'note' | 'releve' }
export interface Puce { label: string; valeur: string }
export interface JourFil {
  n: number; date: string; auj: boolean; futur: boolean;
  bulles: Bulle[]; puces: Puce[];
  vrac: Vrac[];
  /** Les morceaux proposés par le rangement, posés sur leur jour (pas encore écrits). */
  props: MorceauPropose[];
  /** Houblonnage à cru encore à faire ce jour-là : « Citra 100 g + Mosaic 80 g ». */
  dryHop: { lignes: { nom: string; g: number }[]; quand: 'demain' | 'aujourd’hui' | 'en retard' | string } | null;
}

/** Le houblonnage à cru qui reste à faire : les lignes `dryHop` du brassin figé, seulement tant que des ajouts attendent en stock. */
export function dryHopsAttendus(batch: Batch, enAttente: boolean) {
  if (!enAttente) return [];
  return (batch.recipeSnapshot?.hops ?? []).filter(h => h.stage === 'dryHop');
}

export function construireFil(batch: Batch, now: number, opts: { vracEnPlace: boolean; enAttente: boolean; props?: MorceauPropose[] }): JourFil[] {
  const j = jourN(batch, now);
  if (!j) return [];
  const aujourdhui = breweryDay(now);
  const jours = new Map<number, JourFil>();
  const jourDe = (date: string): JourFil | null => {
    const n = ecartJours(j.date, date);
    if (n === null || n < 0) return null;
    let f = jours.get(n);
    if (!f) { f = { n, date, auj: date === aujourdhui, futur: (ecartJours(aujourdhui, date) ?? 0) > 0, bulles: [], puces: [], vrac: [], props: [], dryHop: null }; jours.set(n, f); }
    return f;
  };
  // J0 : l'OG mesurée et la température de levurage, si le brassin les connaît.
  const j0 = jourDe(j.date);
  if (j0) {
    if (batch.og?.trim()) j0.puces.push({ label: 'OG', valeur: batch.og.trim() });
    const t = batch.brewDay?.pitchTemperatureC;
    if (t != null) j0.puces.push({ label: 'levuré', valeur: `${formatDecimal(t, 1)} °C` });
  }
  // Les relevés de densité : puces, et leur note en bulle de cuve.
  for (const r of releves(batch)) {
    const f = jourDe(r.swiss);
    if (!f) continue;
    f.puces.push({ label: 'densité', valeur: formatDecimal(r.sg, 3) });
    // gfc n° 5 : `tempC` est la température de l'échantillon (« éch. »), la cuve est rangée dans la première ligne des notes.
    if (r.tempC != null) f.puces.push({ label: 'éch.', valeur: `${formatDecimal(r.tempC, 1)} °C` });
    const cuveC = cuveDansNotes(r.notes);
    if (cuveC != null) f.puces.push({ label: 'cuve', valeur: `${formatDecimal(cuveC, 1)} °C` });
    const note = notesSansCuve(r.notes).trim();
    if (note) f.bulles.push({ type: 'cuve', texte: note, source: 'releve' });
  }
  // Les entrées des deux champs de notes.
  for (const [champ, texte] of [['notesBrewDay', batch.notesBrewDay], ['notesTasting', batch.notesTasting]] as const) {
    for (const b of lireBlocs(texte)) {
      if (b.kind === 'entree' && b.type !== 'vrac') jourDe(b.date)?.bulles.push({ type: b.type, texte: b.texte, source: 'note' });
      else if (b.kind === 'libre' && champ === 'notesBrewDay' && b.texte.trim()) j0?.bulles.push({ type: 'brassage', texte: b.texte.trim(), source: 'note' });
    }
  }
  // Les notes en vrac : sur le jour où elles ont été écrites, à défaut aujourd'hui.
  if (opts.vracEnPlace) {
    for (const v of vracDe(batch)) (jourDe(v.date ?? aujourdhui) ?? jourDe(aujourdhui))?.vrac.push(v);
  }
  for (const p of opts.props ?? []) if (p.jour && !p.brassin && p.type !== 'prochain-essai') jourDe(p.jour)?.props.push(p);
  // Le houblonnage à cru encore attendu, sur son jour (J0 + dayOffset).
  const parJour = new Map<number, { nom: string; g: number }[]>();
  for (const h of dryHopsAttendus(batch, opts.enAttente)) {
    if (h.dayOffset == null) continue;
    parJour.set(h.dayOffset, [...(parJour.get(h.dayOffset) ?? []), { nom: h.name, g: h.weightG }]);
  }
  for (const [offset, lignes] of parJour) {
    const date = decalerJour(j.date, offset);
    const f = jourDe(date);
    if (!f) continue;
    const reste = ecartJours(aujourdhui, date) ?? 0;
    f.dryHop = { lignes, quand: reste === 1 ? 'demain' : reste === 0 ? 'aujourd’hui' : reste < 0 ? 'en retard' : `dans ${reste} j` };
  }
  return [...jours.values()].filter(f => f.bulles.length || f.puces.length || f.vrac.length || f.props.length || f.dryHop || f.auj).sort((a, b) => b.n - a.n);
}

/** « Citra 100 g + Mosaic 80 g » */
export const libelleDryHop = (lignes: { nom: string; g: number }[]): string => lignes.map(l => `${l.nom} ${formatDecimal(l.g, 0)} g`).join(' + ');
