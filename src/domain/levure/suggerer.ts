/**
 * Suggérer (s7a) : pour chaque axe, combien de levures de bière sont en dessous (−) et au dessus (+) de celle de la recette,
 * et combien n'en disent rien ; puis les levures qui vont dans le sens demandé sur un ou deux axes.
 * Quand la levure de la recette n'est pas documentée sur un axe de niveau, « + » veut dire niveau élevé et « − » niveau faible
 * (la vue le dit par « ? chercher »). Sur un axe numérique sans valeur de départ, rien n'est compté.
 */
import type { Disponibilite, IdAxe, ChoixAxe, Suggestion, SourceCourte } from './contrat';
import type { YeastReference } from '../yeastReferences';
import { AXES, AXES_AROMES, axeParId } from './axes';
import type { Contexte } from './contexte';
import { RANG_ORDRE, enStockIci } from './disponibilite';
import { levierPour } from './doutes';
import type { Fiche } from './fiche';
import { MOT_DU_NIVEAU, niveauDuRang } from './lecture';
import { distance } from './proximite';
import { lire, position, type Lu } from './valeurs';

const MARGE_ATTENUATION = 2;
const ETENDUE: Partial<Record<IdAxe, number>> = { attenuation: 30, temperature: 25, tolerance: 12, rondeur: 25 };
const estNumerique = (axe: IdAxe) => ETENDUE[axe] != null;

/** Où se place `lu` par rapport à la base sur `axe` : 'plus', 'moins', ou `null` (égal, ou sans donnée). */
export function sens(axe: IdAxe, lu: Lu | null, base: Lu | null): 'plus' | 'moins' | null {
  const p = position(lu);
  if (p == null) return null;
  const b = position(base);
  if (b == null) {
    if (estNumerique(axe)) return null;
    return p >= 3 ? 'plus' : p <= 1 ? 'moins' : null;
  }
  const marge = axe === 'attenuation' ? MARGE_ATTENUATION : 0;
  return p > b + marge ? 'plus' : p < b - marge ? 'moins' : null;
}

export function comptesAxes(ctx: Contexte, baseRef: YeastReference) {
  const base = ctx.fiche(baseRef);
  const sortie = {} as Record<IdAxe, { moins: number; plus: number; sansDonnee: number; estime: boolean }>;
  for (const { id } of AXES) {
    const lb = lire(base, id);
    let moins = 0, plus = 0, sansDonnee = 0, estime = false;
    for (const f of ctx.biere()) {
      if (f === base) continue;
      const lu = lire(f, id);
      if (position(lu) == null) { sansDonnee++; continue; }
      const s = sens(id, lu, lb);
      if (s === 'plus') plus++; else if (s === 'moins') moins++;
      if (s && lu!.estime) estime = true;
    }
    sortie[id] = { moins, plus, sansDonnee, estime: estime || (AXES_AROMES as readonly string[]).includes(id) && !!lb?.estime };
  }
  return sortie;
}

/** La valeur d'un axe en mots, pour la raison d'une suggestion : « 71–75 % », « élevé », « banane · estimé ». */
export function texteValeur(axe: IdAxe, lu: Lu | null): string {
  if (!lu) return 'non documenté';
  const u = axeParId(axe).unite;
  const unite = u === '% vol' ? ' %' : u === 'g/L' ? ' g/L' : u ? ` ${u}` : '';
  if (lu.plage) return lu.plage.min === lu.plage.max ? `${lu.plage.min}${unite}` : `${lu.plage.min}–${lu.plage.max}${unite}`;
  if (lu.estime) return `${lu.mots.length ? lu.mots.join(' · ') : 'décrit'} (estimé)`;
  if (lu.rang != null) return MOT_DU_NIVEAU[niveauDuRang(lu.rang)];
  return lu.mots.join(' · ') || 'non documenté';
}

const signe = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±');
function ecartDe(axe: IdAxe, lu: Lu, base: Lu | null): { ecart: number; texte: string } {
  const p = position(lu)!, b = position(base);
  const u = axeParId(axe).unite;
  if (estNumerique(axe)) {
    const e = Math.round((p - (b ?? p)) * 10) / 10;
    const suffixe = axe === 'attenuation' ? ' pts' : u === '% vol' ? ' % vol' : u ? ` ${u}` : '';
    return { ecart: e, texte: `${signe(e)}${String(Math.abs(e)).replace('.', ',')}${suffixe}` };
  }
  if (b == null) { const e = p - 2; return { ecart: e, texte: `${texteValeur(axe, lu)} · base non documentée` }; }
  const e = Math.round((p - b) * 2) / 2;
  return { ecart: e, texte: `${signe(e)}${String(Math.abs(e)).replace('.', ',')} cran${Math.abs(e) > 1 ? 's' : ''}` };
}

const normalise = (axe: IdAxe, e: number) => Math.abs(e) / (ETENDUE[axe] ?? 2);

const rangDe = (t: { f: Fiche; d: Disponibilite }) => RANG_ORDRE[t.d.rang] * 2 + (t.d.rang === 'ici' && !enStockIci(t.f.id) ? 1 : 0);

export function suggerer(ctx: Contexte, baseRef: YeastReference, choix: ChoixAxe[], limite = 12): Suggestion[] {
  if (!choix.length) return [];
  const base = ctx.fiche(baseRef);
  const lbs = new Map(choix.map((c) => [c.axe, lire(base, c.axe)] as const));
  const trouvees: Array<{ f: Fiche; d: Disponibilite; score: number; prox: number; s: Suggestion }> = [];
  for (const f of ctx.biere()) {
    if (f === base) continue;
    const lus = choix.map((c) => lire(f, c.axe));
    if (!choix.every((c, i) => sens(c.axe, lus[i], lbs.get(c.axe)!) === (c.sens > 0 ? 'plus' : 'moins'))) continue;
    const ecarts = choix.map((c, i) => {
      const { ecart, texte } = ecartDe(c.axe, lus[i]!, lbs.get(c.axe)!);
      return { axe: c.axe, ecart, texte };
    });
    const leviers = choix.map((c) => levierPour(base.id, c.axe, c.sens));
    const premier = leviers.find((l) => !!l);
    const source: SourceCourte | undefined = lus.map((l) => l?.source).find((s) => !!s);
    const d = ctx.dispo(f);
    trouvees.push({
      f, d, score: ecarts.reduce((n, e) => n + normalise(e.axe, e.ecart), 0), prox: 0,
      s: {
        levure: f.ref, disponibilite: d, ecarts,
        raison: choix.map((c, i) => `${axeParId(c.axe).libelle} : ${texteValeur(c.axe, lus[i])} contre ${texteValeur(c.axe, lbs.get(c.axe)!)}`).join(' · '),
        ...(source ? { source } : {}),
        ...(premier ? { levier: premier.texte, levierDetail: { texte: premier.texte, ...(premier.axe ? { axe: premier.axe } : {}), ...(premier.plage ? { plage: premier.plage } : {}), source: premier.source } } : {})
      }
    });
  }
  // Vendues ici d'abord, puis Europe, puis rares ; dans chaque groupe, le plus grand écart, puis la plus proche par ailleurs.
  const top = trouvees.sort((a, b) => rangDe(a) - rangDe(b) || b.score - a.score).slice(0, Math.max(limite * 4, limite));
  for (const t of top) t.prox = distance(base, t.f);
  top.sort((a, b) => rangDe(a) - rangDe(b) || Math.round((b.score - a.score) * 1000) || a.prox - b.prox);
  return top.slice(0, limite).map((t) => t.s);
}
