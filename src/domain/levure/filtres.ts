/**
 * Les 18 filtres de Chercher : pour chacun, la valeur d'une fiche (ou « non documentée »), les options et la façon de garder une fiche.
 * Aucune liste à la main par levure : tout est lu des axes et des champs de la fiche.
 */
import { YEAST_STYLE_FAMILIES } from '../../data/yeastRecipeProfiles';
import { yeastStyleEvidence } from '../yeastStyleEvidence';
import type { EtatFiltres, IdAxe, IdFiltre } from './contrat';
import type { Fiche } from './fiche';
import { AXES_AROMES, BOISSONS, FAMILLES, NIVEAUX, axeParId } from './axes';
import { niveauDuRang } from './lecture';
import { lire, position } from './valeurs';
import type { Contexte } from './contexte';

export interface OptionDef { valeur: string; libelle: string }
/** Valeur d'une fiche pour un filtre : des valeurs (choix), un nombre (plage), un booléen (bascule), `null` si non documentée. */
export type ValeurFiltre = string[] | number | boolean | null;

export const BORNES_PLAGE: Partial<Record<IdFiltre, number[]>> = {
  tolerance: [8, 10, 12], attenuation: [70, 75, 80, 85], temperature: [15, 18, 22, 26]
};
const TRANCHES = (bornes: number[]): OptionDef[] => [
  { valeur: `<${bornes[0]}`, libelle: `< ${bornes[0]}` },
  ...bornes.slice(1).map((b, i) => ({ valeur: `${bornes[i]}-${b}`, libelle: `${bornes[i]}–${b}` })),
  { valeur: `>=${bornes[bornes.length - 1]}`, libelle: `≥ ${bornes[bornes.length - 1]}` }
];
export function trancheDe(filtre: IdFiltre, v: number): string {
  const b = BORNES_PLAGE[filtre]!;
  if (v < b[0]) return `<${b[0]}`;
  for (let i = 1; i < b.length; i++) if (v < b[i]) return `${b[i - 1]}-${b[i]}`;
  return `>=${b[b.length - 1]}`;
}

const niveauDe = (f: Fiche, axe: IdAxe): string[] | null => {
  const lu = lire(f, axe);
  return lu?.rang != null && !lu.estime ? [niveauDuRang(lu.rang)] : null;
};
const OPTIONS_NIVEAU: OptionDef[] = NIVEAUX.map((n) => ({ valeur: n.valeur, libelle: n.libelle }));

/** Effets : « plus » = niveau élevé ou descripteur ; « moins » = niveau faible ou descripteur (estimé). */
export const OPTIONS_EFFETS: OptionDef[] = AXES_AROMES.flatMap((a) => [
  { valeur: `${a}:plus`, libelle: `${axeParId(a).libelle} +` }, { valeur: `${a}:moins`, libelle: `${axeParId(a).libelle} −` }
]);
const effetsDe = (f: Fiche): string[] | null => {
  const sortie: string[] = [];
  let doc = false;
  for (const a of AXES_AROMES) {
    const lu = lire(f, a);
    if (lu?.rang == null) continue;
    doc = true;
    if (lu.rang >= 3) sortie.push(`${a}:plus`);
    else if (lu.rang <= 1) sortie.push(`${a}:moins`);
  }
  return doc ? sortie : null;
};

export interface DefFiltreInterne {
  id: IdFiltre;
  options(ctx: Contexte): OptionDef[];
  valeur(f: Fiche, stock: ReadonlySet<string>, ctx: Contexte): ValeurFiltre;
  /** Plusieurs choix sont-ils cumulés (ET) ou alternatifs (OU) ? Les effets se cumulent : « fruité ET sans phénols ». */
  cumul?: boolean;
}

const stylesDe = (f: Fiche): string[] | null => {
  if (!f.stylesDocumentes) return null;
  const memo = f.lu.get('filtre:style') as string[] | undefined;
  if (memo) return memo;
  const v = yeastStyleEvidence(f.ref).styles.filter((s) => s !== 'unknown') as string[];
  f.lu.set('filtre:style', v);
  return v;
};

export const DEFS: Record<IdFiltre, DefFiltreInterne> = {
  boisson: { id: 'boisson', options: () => BOISSONS.map((b) => ({ ...b })), valeur: (f) => [f.boisson] },
  famille: { id: 'famille', options: () => FAMILLES.map((b) => ({ ...b })), valeur: (f) => [f.famille] },
  style: {
    id: 'style',
    options: () => YEAST_STYLE_FAMILIES.filter((s) => s.id !== 'unknown').map((s) => ({ valeur: s.id, libelle: s.label })),
    valeur: (f) => stylesDe(f)
  },
  temperature: { id: 'temperature', options: () => TRANCHES(BORNES_PLAGE.temperature!), valeur: (f) => position(lire(f, 'temperature')) },
  attenuation: { id: 'attenuation', options: () => TRANCHES(BORNES_PLAGE.attenuation!), valeur: (f) => position(lire(f, 'attenuation')) },
  tolerance: { id: 'tolerance', options: () => TRANCHES(BORNES_PLAGE.tolerance!), valeur: (f) => position(lire(f, 'tolerance')) },
  effets: { id: 'effets', options: () => OPTIONS_EFFETS, valeur: effetsDe, cumul: true },
  clarte: { id: 'clarte', options: () => OPTIONS_NIVEAU, valeur: (f) => niveauDe(f, 'clarte') },
  forme: { id: 'forme', options: () => [{ valeur: 'seche', libelle: 'sèche' }, { valeur: 'liquide', libelle: 'liquide' }], valeur: (f) => (f.forme ? [f.forme] : null) },
  disponibilite: {
    id: 'disponibilite',
    options: () => [{ valeur: 'ici', libelle: 'vendue CH · FR · DE' }, { valeur: 'europe', libelle: 'fabricant présent en Europe' }, { valeur: 'rare', libelle: 'rare' }],
    valeur: (f, _s, ctx) => [ctx.dispo(f).rang]
  },
  stock: { id: 'stock', options: () => [{ valeur: 'oui', libelle: 'j’en ai' }], valeur: (f, stock) => stock.has(f.id) },
  sansSta1: { id: 'sansSta1', options: () => [{ valeur: 'oui', libelle: 'sans STA1' }], valeur: (f) => (f.sta1 ? f.sta1 === 'neg' : null) },
  labo: {
    id: 'labo',
    options: (ctx) => [...new Set(ctx.biere().map((f) => f.labo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')).map((l) => ({ valeur: l, libelle: l })),
    valeur: (f) => (f.labo ? [f.labo] : null)
  },
  vitesse: { id: 'vitesse', options: () => OPTIONS_NIVEAU, valeur: (f) => niveauDe(f, 'vitesse') },
  rondeur: {
    id: 'rondeur', options: () => OPTIONS_NIVEAU,
    valeur: (f) => { const g = position(lire(f, 'rondeur')); return g == null ? null : [g <= 5 ? 'faible' : g <= 15 ? 'moyen' : 'eleve']; }
  },
  soufre: { id: 'soufre', options: () => OPTIONS_NIVEAU, valeur: (f) => niveauDe(f, 'soufre') },
  nutriments: { id: 'nutriments', options: () => OPTIONS_NIVEAU, valeur: (f) => niveauDe(f, 'nutriments') },
  sansAlcool: { id: 'sansAlcool', options: () => [{ valeur: 'oui', libelle: 'sans alcool' }], valeur: (f) => f.sansAlcool }
};

/** Un filtre est posé s'il porte un choix, une plage ou une bascule allumée. La boisson vaut « bière » tant qu'on ne dit rien. */
export function etatEffectif(filtres: EtatFiltres, id: IdFiltre): string[] | { min: number; max: number } | true | null {
  const v = filtres[id];
  if (id === 'boisson' && v === undefined) return ['biere'];
  if (v === undefined || v === false || v === null) return null;
  if (v === true) return true;
  if (Array.isArray(v)) return v.length ? v : null;
  return v;
}

/** Une fiche passe-t-elle un filtre posé ? Une fiche non documentée ne passe pas : l'inconnu n'est jamais un accord. */
export function passe(def: DefFiltreInterne, etat: string[] | { min: number; max: number } | true, valeur: ValeurFiltre, ctx: Contexte, f: Fiche): boolean {
  if (valeur == null) return false;
  if (etat === true) return valeur === true;
  if (Array.isArray(etat)) {
    if (!Array.isArray(valeur)) return false;
    return def.cumul ? etat.every((e) => valeur.includes(e)) : etat.some((e) => valeur.includes(e));
  }
  if (typeof valeur !== 'number') return false;
  if (def.id === 'temperature' || def.id === 'attenuation') {
    // Plage demandée : on garde la fiche dont la plage la recoupe (règle de produit, doutes.json « regle-c-c5b »).
    const lu = lire(f, def.id);
    const p = lu?.plage;
    return p ? p.max >= etat.min && p.min <= etat.max : valeur >= etat.min && valeur <= etat.max;
  }
  void ctx;
  return valeur >= etat.min && valeur <= etat.max;
}
