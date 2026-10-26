// Les vraies valeurs de Comparer (acquis v1, chimie, panel OSU), lues dans les données du moteur v4 et des lots,
// importées telles quelles (jamais recopiées) :
//  - α, β : catalogue du moteur (Beer Maverick) et fiche Hopsteiner reliée ; ton lot si sa fiche de stock le dit ;
//  - huile et composés : src/data/hopV4/composes-houblon.json (plages par source, « à confirmer »), complétés par le catalogue du moteur (BM, HS) ;
//  - linalol mesuré en bière : mesuresEnBiere du même fichier, et l'étude E03 (McCabe 2023) ;
//  - panel OSU : l'étude E04 (Lafontaine 2018, H22), Cascade seul.
// Une valeur absente reste absente (« inconnu »), jamais 0. Plage = du plus bas au plus haut des sources.
import composes from '../../../data/hopV4/composes-houblon.json';
import comparatifs from '../../../data/hopV4/comparatifs-dryhop.json'; // copie de work/…/fils21-choisir/donnees (src/data/hopV4/copies-de-work.mjs)
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { hopRef, nombreFr } from '../parcours/v4';

export interface ValeurReelle {
  lo: number; hi: number | null;
  /** Texte de la plage (« 4,5–9 », « < 10 »). */
  texte: string;
  /** Références courtes (BM, HS, H3…) et leurs titres. */
  refs: string[];
  aConfirmer: boolean;
  /** Ton lot (fiche de stock), sur la même échelle. */
  lot?: number;
  note?: string;
}
type Source = { titre?: string; annee?: number };
const SOURCES = (composes as unknown as { sources: Record<string, Source> }).sources;
type Val = { plage: [number | null, number | null]; sources: string[]; portee?: string; aConfirmer?: boolean };
type Variete = {
  huile?: { valeurs: Val[] | null };
  composes?: Record<string, { valeurs: Val[] | null; raison?: string }>;
  mesuresEnBiere?: { compose: string; plage: [number, number]; unite: string; doseGL: number; sources: string[]; texte: string }[];
};
const VARIETES = (composes as unknown as { varietes: Record<string, Variete> }).varietes;

// Formateur en cache (t2, optimisation 3 ; #164) : même texte que l'ancien appel par nombre.
const fr = (x: number, d = 2) => nombreFr(x, { maximumFractionDigits: d });
const court = (id: string) => (/^bm-/.test(id) ? 'BM' : /^hs-/.test(id) ? 'HS' : id);
/** Titre court d'une référence (« Lafontaine 2018 »). */
export function titreRef(id: string): string {
  if (id === 'BM') return 'Beer Maverick';
  if (id === 'HS') return 'Hopsteiner';
  if (id === 'E03') return 'McCabe 2023';
  if (id === 'E04') return 'Lafontaine 2018';
  const r = SOURCES[id];
  if (!r?.titre) return id;
  return r.titre.split(/[,:]/)[0].replace(/\s+et al\.?$/, '') + (r.annee ? ` ${r.annee}` : '');
}

function enveloppe(vals: Val[] | null | undefined): ValeurReelle | null {
  const vs = (vals ?? []).filter((v) => !v.portee || v.portee === 'variété');
  if (!vs.length) return null;
  const mins = vs.map((v) => v.plage[0]).filter((x): x is number => x != null);
  const maxs = vs.map((v) => v.plage[1]).filter((x): x is number => x != null);
  const ouvertH = vs.some((v) => v.plage[1] == null), ouvertB = vs.some((v) => v.plage[0] == null);
  const lo = mins.length ? Math.min(...mins) : null;
  const hi = maxs.length && !ouvertH ? Math.max(...maxs) : null;
  const texte = lo != null && hi != null ? (lo === hi ? fr(lo) : `${fr(lo)}–${fr(hi)}`) : lo != null ? `> ${fr(lo)}` : `< ${fr(Math.max(...maxs))}`;
  return {
    lo: ouvertB || lo == null ? 0 : lo, hi: hi ?? (ouvertH ? null : Math.max(...maxs)), texte,
    refs: [...new Set(vs.flatMap((v) => v.sources.map(court)))], aConfirmer: vs.some((v) => !!v.aConfirmer),
  };
}

/** α ou β : Beer Maverick (catalogue) et Hopsteiner (fiche reliée) ; ton lot si sa fiche de stock le donne. */
export function acides(cle: string, quoi: 'alpha' | 'beta'): ValeurReelle | null {
  const h = hopRef(cle);
  if (!h) return null;
  const vals: Val[] = [];
  const bm = h.catalogue[quoi];
  if (bm) vals.push({ plage: bm, sources: ['BM'] });
  const hs = h.catalogue.hs?.[quoi];
  if (hs) vals.push({ plage: hs, sources: ['HS'] });
  const e = enveloppe(vals);
  if (!e) return null;
  const lot = quoi === 'alpha' && h.stock?.alpha != null && h.stock.alphaFrom === 'fiche de stock' ? h.stock.alpha : undefined;
  return { ...e, ...(lot != null ? { lot } : {}) };
}

export const huile = (cle: string) => enveloppe(VARIETES[cle]?.huile?.valeurs);

/** La chimie rangée par famille (r6a) : composé, famille, unité. */
export const CHIMIE: { cle: string; famille: FamilyId; nom: string; unite: string }[] = [
  { cle: 'myrcene', famille: 'resin', nom: 'myrcène', unite: '% huile' },
  { cle: 'linalol', famille: 'floral', nom: 'linalol', unite: '% huile' },
  { cle: 'geraniol', famille: 'floral', nom: 'géraniol', unite: '% huile' },
  { cle: 'humulene', famille: 'herbal', nom: 'humulène', unite: '% huile' },
  { cle: 'caryophyllene', famille: 'spice', nom: 'caryo­phyllène', unite: '% huile' },
  { cle: '4MMP', famille: 'tropical', nom: '4MMP', unite: 'µg/kg' },
];
/** Ce que le catalogue du moteur porte pour un composé de la chimie : l'huile de Beer Maverick (BM) et le linalol de
 * Hopsteiner (HS), chacun avec sa page source. Le géraniol et le 4MMP n'y sont pas : la liste reste vide, jamais 0. */
function duCatalogue(cle: string, c: string): Val[] {
  const cat = hopRef(cle)?.catalogue;
  if (!cat) return [];
  const bm = c === 'myrcene' || c === 'humulene' || c === 'caryophyllene' ? cat.oils?.[c] : null;
  if (bm) return [{ plage: bm, sources: ['BM'] }];
  const hs = c === 'linalol' ? cat.hsLinalool?.range : null;
  return hs ? [{ plage: hs, sources: ['HS'] }] : [];
}
/** Une ligne de la chimie : les fiches de composés, plus le catalogue du moteur quand il porte la valeur. La plage reste
 * l'enveloppe de toutes les sources ; « inconnu » seulement si aucune n'a la valeur (les houblons sans fiche de composés,
 * comme Mosaic, prennent alors Beer Maverick et Hopsteiner). */
export const compose = (cle: string, c: string) => enveloppe([...(VARIETES[cle]?.composes?.[c]?.valeurs ?? []), ...duCatalogue(cle, c)]);

// ---------- en bière, mesuré ----------
type Mesure = { variete?: string; compose?: string; valeur?: number; ecart?: number; unite?: string; dose_gL?: number; descripteur?: string };
type Etude = { id: string; mesures: Mesure[] };
const ETUDES = (comparatifs as unknown as { etudes: Etude[] }).etudes;
const nomEtude = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Linalol mesuré en bière (µg/L) : la mesure de Kishimoto (H12) dans les données du houblon, sinon l'étude E03
 * filtrée sur la variété exacte (L14 : Azacca et Idaho 7 sont dans la même table). */
export function linalolEnBiere(cle: string, nom: string): ValeurReelle | null {
  const m = VARIETES[cle]?.mesuresEnBiere?.find((x) => x.compose === 'linalol');
  if (m) return { lo: m.plage[0], hi: m.plage[1], texte: fr(m.plage[0], 1), refs: m.sources, aConfirmer: false, note: `${fr(m.doseGL, 0)} g/L, moût` };
  const e03 = ETUDES.find((e) => e.id === 'E03');
  const x = e03?.mesures.find((y) => y.compose === 'linalol' && nomEtude(y.variete ?? '') === nomEtude(nom));
  if (!x || x.valeur == null) return null;
  const k = x.unite === 'mg/L' ? 1000 : 1, v = x.valeur * k, d = (x.ecart ?? 0) * k;
  return { lo: v - d, hi: v + d, texte: `${fr(v, 0)}±${fr(d, 0)}`, refs: ['E03'], aConfirmer: true, note: 'au pitch' };
}

// ---------- panel OSU (E04, Cascade) ----------
export interface PanelOSU { doses: number[]; intensite: number[]; agrumes: number[]; herbace: number[]; refs: string[] }
export function panelOSU(): PanelOSU | null {
  const e = ETUDES.find((x) => x.id === 'E04');
  if (!e) return null;
  const serie = (re: RegExp) => e.mesures.filter((m) => m.variete === 'Cascade' && re.test(m.descripteur ?? '')).sort((a, b) => (a.dose_gL ?? 0) - (b.dose_gL ?? 0));
  const ohai = serie(/OHAI/), cit = serie(/^citrus/), her = serie(/^herbal/);
  if (ohai.length < 3 || cit.length !== ohai.length || her.length !== ohai.length) return null;
  return { doses: ohai.map((m) => m.dose_gL ?? 0), intensite: ohai.map((m) => m.valeur ?? 0), agrumes: cit.map((m) => m.valeur ?? 0), herbace: her.map((m) => m.valeur ?? 0), refs: ['H22'] };
}
