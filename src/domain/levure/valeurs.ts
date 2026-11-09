/**
 * La valeur d'une levure sur un axe : lue dans les faits (catalogue + faits sourcés versés), la mieux sourcée montrée,
 * les autres notées. « Estimé » quand elle vient d'un descripteur (banane → esters ; girofle → phénols).
 * L'inconnu n'est jamais 0 : `null`.
 */
import type { IdAxe, SourceCourte, ValeurAxe } from './contrat';
import { auteurEstFabricant, type Fait, type Fiche } from './fiche';
import { AXES_AROMES } from './axes';
import {
  MOT_DU_NIVEAU, RANG_DU_NIVEAU, descripteurArome, rangDefaut, niveauDuRang, plageDuTexte, rangNiveau, statutPof
} from './lecture';

/** Lecture interne d'un axe. `rang` : niveau ordinal 0–4 ; `num` : position pour comparer (milieu, borne haute, g/L). */
export interface Lu {
  rang?: number;
  num?: number;
  plage?: { min: number; max: number };
  mots: string[];
  estime: boolean;
  source?: SourceCourte;
  prio: number;
  /** Valeurs d'autres sources qui contredisent la retenue : les deux restent, l'autre est notée. */
  autres: Lu[];
}

const plageDuFait = (f: Fait): [number, number] | null =>
  f.range ? [f.range.min, f.range.max] : plageDuTexte(f.reported);

const meilleur = (cands: Lu[], contredit: (a: Lu, b: Lu) => boolean): Lu | null => {
  if (!cands.length) return null;
  const tri = [...cands].sort((a, b) => b.prio - a.prio);
  const retenu = { ...tri[0], autres: [] as Lu[] };
  const fusion = new Set(tri[0].mots);
  for (const c of tri.slice(1)) {
    if (contredit(retenu, c)) retenu.autres.push(c);
    else for (const m of c.mots) fusion.add(m);
  }
  retenu.mots = [...fusion];
  return retenu;
};
const contrediRang = (a: Lu, b: Lu) => a.rang != null && b.rang != null && Math.abs(a.rang - b.rang) >= 1;
const contrediPlage = (a: Lu, b: Lu) => !!a.plage && !!b.plage && (a.plage.max < b.plage.min || b.plage.max < a.plage.min);

const rangDuFait = (f: Fait, champ?: 'thiols' | 'terpenes'): number | null => {
  if (f.cle === 'h2s' || f.cle === 'so2') return rangDefaut(f.reported);
  if (f.lecture) {
    const n = champ ? f.lecture[champ] : f.lecture.niveau;
    return n ? RANG_DU_NIVEAU[n] : null;
  }
  return rangNiveau(f.reported);
};

/** Candidats de niveau pour une clé de fait. */
function candidatsRang(fiche: Fiche, cle: string, champ?: 'thiols' | 'terpenes', filtre?: (f: Fait) => boolean): Lu[] {
  const out: Lu[] = [];
  for (const f of fiche.parCle.get(cle) ?? []) {
    if (filtre && !filtre(f)) continue;
    const rang = rangDuFait(f, champ);
    if (rang == null) continue;
    const spans = !f.lecture && rang % 1 !== 0;
    out.push({ rang, mots: [...(f.lecture?.mots ?? []), ...(spans ? [`${MOT_DU_NIVEAU[niveauDuRang(Math.floor(rang))]} à ${MOT_DU_NIVEAU[niveauDuRang(Math.ceil(rang))]}`] : [])],
      estime: false, source: f.source, prio: f.prio, autres: [] });
  }
  return out;
}

function candidatsPlage(fiche: Fiche, cle: string, valide: (r: [number, number]) => boolean, num: (r: [number, number]) => number, unite?: string): Lu[] {
  const out: Lu[] = [];
  for (const f of fiche.parCle.get(cle) ?? []) {
    if (f.lecture) continue;
    if (unite && f.unite && f.unite !== unite) continue;
    const r = plageDuFait(f);
    if (!r || !valide(r)) continue;
    out.push({ plage: { min: r[0], max: r[1] }, num: num(r), mots: [], estime: false, source: f.source, prio: f.prio, autres: [] });
  }
  return out;
}

const milieu = (r: [number, number]) => (r[0] + r[1]) / 2;
const haut = (r: [number, number]) => r[1];

/** Descripteur → lecture « estimée » (aucun niveau publié). */
function estimeDescripteur(fiche: Fiche, axe: 'esters' | 'phenols' | 'thiols' | 'terpenes'): Lu | null {
  const d = descripteurArome(axe, fiche.descripteur, fiche.passe4);
  if (!d.sens) return null;
  const source = (fiche.parCle.get('aroma') ?? fiche.parCle.get('esters') ?? fiche.parCle.get('styles') ?? [])[0]?.source;
  return { rang: d.sens === 'plus' ? 3 : 0, mots: d.mots, estime: true, prio: 0, ...(source ? { source } : {}), autres: [] };
}

/** Mots que la fiche écrit, sans classer (Nottingham « neutre à légèrement fruité ») : affichés, jamais comptés. */
const motsVerses = (fiche: Fiche, cles: string[]): string[] =>
  [...new Set(cles.flatMap((c) => (fiche.parCle.get(c) ?? []).flatMap((f) => f.lecture?.mots ?? [])))];

function lireArome(fiche: Fiche, axe: 'esters' | 'phenols' | 'thiols' | 'terpenes'): Lu | null {
  let cands: Lu[] = [];
  if (axe === 'esters') cands = candidatsRang(fiche, 'esters');
  if (axe === 'phenols') {
    for (const f of fiche.parCle.get('pof') ?? []) {
      const s = f.lecture ? (f.lecture.pof === 'positif' ? 1 : f.lecture.pof === 'negatif' ? 0 : null) : statutPof(f.reported);
      if (s == null) continue;
      cands.push({ rang: s === 1 ? 3 : 0, mots: f.lecture?.mots ?? [], estime: false, source: f.source, prio: f.prio - (f.lecture?.parAnalogie ? 0.2 : 0), autres: [] });
    }
  }
  if (axe === 'thiols' || axe === 'terpenes') {
    const champ = axe;
    cands = candidatsRang(fiche, 'biotransformation', champ, (f) => !!f.lecture || (axe === 'terpenes' ? /terpen/i.test(f.reported) : !/terpen/i.test(f.reported) || /thiol/i.test(f.reported)));
    if (axe === 'thiols') {
      for (const f of fiche.parCle.get('betaLyase') ?? []) if (f.lecture?.betaLyase === 'positif') cands.push({ rang: 3, mots: ['β-lyase'], estime: false, source: f.source, prio: f.prio - 0.5, autres: [] });
      // Le champ β-lyase de la fiche n'est affiché que si sa source est le fabricant (ou une étude), jamais une autre maison.
      const src = fiche.ref.source;
      if (fiche.ref.betaLyase === 'positive' && src && auteurEstFabricant(src.author, fiche.labo)) {
        cands.push({ rang: 3, mots: ['β-lyase'], estime: false, source: { libelle: `${src.author} · fiche`, url: src.reference }, prio: 1, autres: [] });
      }
    }
  }
  const retenu = meilleur(cands, contrediRang);
  if (retenu) {
    const d = descripteurArome(axe, fiche.descripteur, fiche.passe4);
    if (d.sens === 'plus' && (retenu.rang ?? 0) >= 2) for (const m of d.mots) if (!retenu.mots.includes(m)) retenu.mots.push(m);
    return retenu;
  }
  const est = estimeDescripteur(fiche, axe);
  if (est) return est;
  const mots = motsVerses(fiche, axe === 'esters' ? ['esters'] : axe === 'phenols' ? ['pof'] : ['biotransformation']);
  return mots.length ? { mots, estime: true, prio: 0, autres: [] } : null;
}

const NIVEAU_PAR_CLE: Partial<Record<IdAxe, string[]>> = {
  clarte: ['flocculation'], vitesse: ['fermentationRate'], nutriments: ['nutrientNeed']
};

/** Lecture d'un axe pour une fiche (mémoïsée sur la fiche). */
export function lire(fiche: Fiche, axe: IdAxe): Lu | null {
  const cache = fiche.lu as Map<string, Lu | null>;
  if (cache.has(axe)) return cache.get(axe)!;
  let lu: Lu | null = null;
  if ((AXES_AROMES as readonly string[]).includes(axe)) lu = lireArome(fiche, axe as 'esters');
  else if (axe === 'attenuation') lu = meilleur(candidatsPlage(fiche, 'attenuation', (r) => r[1] <= 100 && r[0] >= 40, milieu, '%'), contrediPlage);
  else if (axe === 'tolerance') lu = meilleur(candidatsPlage(fiche, 'alcoholTolerance', (r) => r[1] <= 25 && r[1] >= 3, haut, '%'), contrediPlage);
  else if (axe === 'temperature') lu = meilleur(candidatsPlage(fiche, 'temperature', (r) => r[1] < 45 && r[0] >= 0 && r[0] <= r[1], milieu, '°C'), contrediPlage);
  else if (axe === 'rondeur') {
    const cands: Lu[] = [];
    for (const f of fiche.parCle.get('residualSugar') ?? []) {
      if (f.lecture?.gL != null) cands.push({ plage: { min: f.lecture.gL, max: f.lecture.gL }, num: f.lecture.gL, mots: [], estime: false, source: f.source, prio: f.prio, autres: [] });
    }
    lu = meilleur(cands, (a, b) => a.num != null && b.num != null && Math.abs(a.num - b.num) > 3);
    const corps = motsVerses(fiche, ['body']);
    if (lu) lu.mots = [...new Set([...lu.mots, ...corps])];
    else {
      const g = meilleur(candidatsRang(fiche, 'glycerol'), contrediRang);
      if (g) lu = { ...g, mots: [...new Set([...g.mots, ...corps])] };
      else if (corps.length) lu = { mots: corps, estime: false, prio: 3, autres: [], source: (fiche.parCle.get('body') ?? [])[0]?.source };
    }
  } else if (axe === 'soufre') {
    lu = meilleur([...candidatsRang(fiche, 'h2s'), ...candidatsRang(fiche, 'so2')], contrediRang);
  } else {
    const cles = NIVEAU_PAR_CLE[axe] ?? [];
    lu = meilleur(cles.flatMap((c) => candidatsRang(fiche, c)), contrediRang);
  }
  cache.set(axe, lu);
  return lu;
}

/** La position à comparer : un nombre (milieu, g/L) ou un rang ; `null` quand l'axe n'est pas documenté ou n'est que des mots. */
export const position = (lu: Lu | null): number | null => (lu == null ? null : lu.num ?? lu.rang ?? null);

export function versValeurAxe(lu: Lu | null): ValeurAxe | null {
  if (!lu) return null;
  const v: ValeurAxe = {};
  if (lu.estime) { v.estime = true; if (lu.mots.length) v.mots = lu.mots; }
  else {
    if (lu.rang != null) v.niveau = niveauDuRang(lu.rang);
    if (lu.plage) v.plage = { ...lu.plage };
    if (lu.mots.length) v.mots = lu.mots;
  }
  if (lu.source) v.source = lu.source;
  return Object.keys(v).length ? v : null;
}

/** Ce que les autres sources disent de l'axe quand elles contredisent la retenue (la plus sourcée est montrée, l'autre notée). */
export const autresValeurs = (lu: Lu | null): ValeurAxe[] =>
  (lu?.autres ?? []).map((a) => versValeurAxe(a)).filter((v): v is ValeurAxe => !!v);
