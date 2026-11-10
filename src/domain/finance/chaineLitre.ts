import { DEPRECIATION_CATEGORIES } from './annual';
import type { BrewBudgetSnapshot } from './brewBudget';
import { isoDate } from './ledger';
import type { FinancialAsset } from './types';

/**
 * Une seule chaîne du litre au format (d1, 09.11) : litres nets → coût du litre → coût d'un format.
 * Fonctions pures. Montants en CHF à deux décimales, sommés en centimes entiers. L'inconnu est `null`, jamais 0.
 */
const cents = (n: number) => Math.round(n * 100);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const usable = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

export type SourceLitres = 'conditionne' | 'enregistre' | 'attendu';
/** Litres nets : le conditionné réel, sinon le net enregistré, sinon le net attendu. Aucun n'est inventé : rien d'exploitable → null. */
export function litresNets(input: { conditionneL?: number | null; netEnregistreL?: number | null; netAttenduL?: number | null }): { litres: number; source: SourceLitres } | null {
  if (usable(input.conditionneL)) return { litres: input.conditionneL, source: 'conditionne' };
  if (usable(input.netEnregistreL)) return { litres: input.netEnregistreL, source: 'enregistre' };
  if (usable(input.netAttenduL)) return { litres: input.netAttenduL, source: 'attendu' };
  return null;
}

/**
 * Les trois notions du coût d'un brassin, côté coût (pas côté caisse). `dejaPaye + aPayer + annee = total` au centime.
 * Quand un prix manque, les valeurs sont le connu, `complet` est faux et `manque` nomme les lignes : le coût du litre devient null.
 */
export interface TroisNotions {
  dejaPaye: number; aPayer: number; annee: number; total: number;
  emballage: number | null; impot: number | null;
  complet: boolean; manque: string[];
}
/** null pour un instantané enregistré avant ces champs (aucune migration, aucune valeur inventée). */
export function troisNotions(snapshot: BrewBudgetSnapshot): TroisNotions | null {
  if (snapshot.dejaPaye === undefined || snapshot.aPayer === undefined || snapshot.annee === undefined) return null;
  const manque = snapshot.lines.filter(line => line.consumedCost === null).map(line => line.name);
  // Les charges et l'usure sont réparties sur les litres nets : un net pris sur le volume à brasser rend tout le coût du litre faux (30 L au lieu de 27 L : 7,21 au lieu de 7,51).
  if (snapshot.netVolumeSource === 'volume-a-brasser') manque.push('litres nets');
  return { dejaPaye: snapshot.dejaPaye, aPayer: snapshot.aPayer, annee: snapshot.annee, total: snapshot.totalCost,
    emballage: snapshot.packagingCost ?? null, impot: snapshot.beerTaxCost ?? null, complet: snapshot.complete && manque.length === 0, manque };
}

export interface CoutLitre {
  /** Tout compris (emballage et impôt inclus) : le chiffre de c3a. Exact. */
  complet: number;
  /** Sans emballage ni impôt : la base d'un format, qui les ajoute à sa mesure. Exact ; null si l'un des deux est inconnu. */
  liquide: number | null;
  /** Pour l'écran, arrondi au centime. Jamais renvoyé à `coutFormat` : l'arrondi s'applique une seule fois, à la fin. */
  affiche: { complet: number; liquide: number | null };
}
export function coutLitre(input: { notions: TroisNotions | null; litres: number | null | undefined }): CoutLitre | null {
  const { notions, litres } = input;
  if (!notions || !notions.complet || !usable(litres)) return null;
  const complet = notions.total / litres;
  const liquide = notions.emballage === null || notions.impot === null ? null : (cents(notions.total) - cents(notions.emballage) - cents(notions.impot)) / 100 / litres;
  return { complet, liquide, affiche: { complet: round2(complet), liquide: liquide === null ? null : round2(liquide) } };
}

export interface FormatVente { id: string; label: string; volumeL: number; prixHT?: number }
export interface CoutFormat { liquide: number; emballage: number | null; impot: number | null; total: number | null; affiche: number | null }
/**
 * Coût d'un format : litre liquide exact × volume + emballage de l'unité + impôt de l'unité (`beerTaxPerFormat`).
 * `emballageUnite` est dans la même base que le coût du brassin (HT pour un assujetti). Aucun lien article de stock → format n'existe : l'appelant le donne.
 */
export function coutFormat(input: { litreLiquide: number | null; format: FormatVente; emballageUnite: number | null; impotUnite: number | null }): CoutFormat | null {
  const { litreLiquide, format, emballageUnite, impotUnite } = input;
  if (litreLiquide === null || !Number.isFinite(litreLiquide) || !usable(format.volumeL)) return null;
  const liquide = litreLiquide * format.volumeL;
  const total = emballageUnite === null || impotUnite === null ? null : liquide + emballageUnite + impotUnite;
  return { liquide, emballage: emballageUnite, impot: impotUnite, total, affiche: total === null ? null : round2(total) };
}

/**
 * Usure du litre : linéaire sur la durée d'utilité, par an, pour les actifs du registre (P2, 09.11).
 * Durée = 100 ÷ taux linéaire AFC de la catégorie (la catégorie « à confirmer » doit porter son propre taux linéaire). Jamais le dégressif :
 * l'Annuel garde l'AFC (`depreciationForYear`). Un projet futur n'entre pas ici : son usure estimée n'existe que dans `mesurerAchat`, et l'actif enregistré la remplace.
 * Rend `amountCHF` undefined (inconnu) sans actif ou si un actif est à corriger, jamais 0.
 */
export function usureLineaireAnnee(assets: FinancialAsset[], year: number): { amountCHF: number | undefined; warnings: string[] } {
  const warnings: string[] = [];
  if (!assets.length) return { amountCHF: undefined, warnings };
  let total = 0;
  for (const asset of assets) {
    const serviceYear = Number(isoDate(asset.inServiceDate)?.slice(0, 4));
    if (!Number.isFinite(serviceYear) || !Number.isSafeInteger(asset.acquisitionCents) || asset.acquisitionCents < 0) { warnings.push(`${asset.name} : dates ou coût à corriger`); continue; }
    const category = DEPRECIATION_CATEGORIES.find(item => item.id === asset.category);
    const rate = category && category.linearRate > 0 ? category.linearRate : asset.category === 'custom' && asset.method === 'linear' && asset.ratePct > 0 ? asset.ratePct : 0;
    if (!(rate > 0)) { warnings.push(`${asset.name} : durée d’usure à confirmer, classer le matériel`); continue; }
    const disposalYear = asset.disposedDate ? Number(isoDate(asset.disposedDate)?.slice(0, 4)) : null;
    if (year < serviceYear || (disposalYear !== null && Number.isFinite(disposalYear) && year > disposalYear)) continue;
    const cost = Math.round(asset.acquisitionCents * asset.businessUsePct / 100);
    const fraction = Number.isFinite(asset.firstYearFraction) && asset.firstYearFraction >= 0 && asset.firstYearFraction <= 1 ? asset.firstYearFraction : 1;
    let worn = 0, wear = 0;
    for (let current = serviceYear; current <= year; current++) {
      const yearly = Math.min(cost - worn, Math.round(cost * rate / 100 * (current === serviceYear ? fraction : 1)));
      worn += yearly;
      if (current === year) wear = yearly;
    }
    total += wear;
  }
  return { amountCHF: warnings.length ? undefined : total / 100, warnings };
}
