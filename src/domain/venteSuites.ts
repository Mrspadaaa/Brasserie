// B5 + B6 (21.11) — ce qu'une vente réelle fait de ses suites : elle solde la vente promise et livre les fûts vendus.
// Pur : aucune écriture ici. La caisse propose (défaut oui, décochable), puis applique après l'enregistrement.
import type { KegItem } from '../types';
import type { FinancialPlan } from './finance/types';
import { livrer } from './stock/futsFiche';

const iso = (s?: string): string | undefined => {
  if (!s) return undefined;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim());
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined;
};

/**
 * La vente promise (un plan `in` actif, du même client, du même brassin si le plan le dit) que cette vente réelle solde. Sans client, rien :
 * on ne devine pas une promesse. Plusieurs : la plus proche de la date de la vente, puis la plus grosse (jamais deux soldées d'un coup).
 */
export function planSoldeParVente(plans: readonly FinancialPlan[], v: { clientId?: string | null; batchIds: readonly (string | undefined)[]; dateIso: string }): FinancialPlan | null {
  if (!v.clientId) return null;
  const jour = (d: string) => Date.parse(`${d}T12:00:00Z`);
  const candidats = plans
    .filter(p => p.direction === 'in' && p.status === 'active' && !p.recurrence && p.clientId === v.clientId && p.amountCents > 0 && (!p.batchId || v.batchIds.includes(p.batchId)))
    .sort((a, b) => Math.abs(jour(iso(a.date) ?? v.dateIso) - jour(v.dateIso)) - Math.abs(jour(iso(b.date) ?? v.dateIso) - jour(v.dateIso)) || b.amountCents - a.amountCents || a.id.localeCompare(b.id));
  return candidats[0] ?? null;
}

/** Les mots d'un nom de fournisseur, sans accents ni formes juridiques : « ZZ TEST Brouwland BVBA » → zz, test, brouwland. */
const FORMES = new Set(['sa', 'sarl', 'gmbh', 'ag', 'bvba', 'bv', 'srl', 'sas', 'ltd', 'inc', 'co', 'de', 'du', 'la', 'le', 'les', 'des', 'et', 'the']);
const mots = (s?: string): string[] => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !FORMES.has(t));
/** Le même fournisseur, écrit à peine autrement : tous les mots du plus court se retrouvent dans l'autre (« Brouwland » et « Brouwland BVBA »). Un nom vide ne ressemble à rien. */
const memesMots = (a?: string, b?: string): boolean => { const x = mots(a), y = mots(b); return x.length > 0 && x.length === y.length && x.every(m => y.includes(m)); };
export const memeFournisseur = (a?: string, b?: string): boolean => {
  const x = mots(a), y = mots(b);
  if (!x.length || !y.length) return false;
  const [court, long] = x.length <= y.length ? [x, y] : [y, x];
  return court.every(m => long.includes(m));
};
/**
 * PD-2 (21.11) : la dépense prévue qu'une pièce de dépense solde, par la règle de la caisse (`planSoldeParVente`) : le prévu `out` actif ou en projet (manuel ou
 * matériel, jamais récurrent ni dérivé d'un brassin) du même fournisseur (au plan, sinon la même catégorie), montant à ±10 %. Plusieurs : le plus proche de la date de la
 * pièce, puis du montant. Jamais deux soldés d'un coup. Proposé avec défaut oui, décochable ; le lien s'écrit `finance.planId`, la prévision retire alors le prévu et compte la pièce.
 */
export function planSoldeParDepense(plans: readonly FinancialPlan[], d: { vendor?: string; category?: string; amountCents: number; dateIso?: string }): FinancialPlan | null {
  if (!(d.amountCents > 0)) return null;
  const jour = (j: string) => Date.parse(`${j}T12:00:00Z`);
  const ref = d.dateIso ? jour(d.dateIso) : null;
  const ecartDate = (p: FinancialPlan) => (ref === null ? 0 : Math.abs(jour(iso(p.date) ?? d.dateIso!) - ref));
  // Fournisseur écrit pareil d'abord, puis un sous-ensemble de mots, puis un plan sans fournisseur (la catégorie seule).
  const rang = (p: FinancialPlan) => (!p.vendor ? 2 : memesMots(p.vendor, d.vendor) ? 0 : 1);
  const candidats = plans
    .filter(p => p.direction === 'out' && (p.status === 'active' || p.source === 'equipment' && p.status === 'draft') && (p.source === 'manual' || p.source === 'equipment') && !p.recurrence && p.amountCents > 0
      && Math.abs(p.amountCents - d.amountCents) <= p.amountCents * 0.1
      && (p.vendor ? memeFournisseur(p.vendor, d.vendor) : !!d.category && p.category === d.category))
    .sort((a, b) => rang(a) - rang(b) || (a.category === d.category ? 0 : 1) - (b.category === d.category ? 0 : 1) || ecartDate(a) - ecartDate(b) || Math.abs(a.amountCents - d.amountCents) - Math.abs(b.amountCents - d.amountCents) || a.id.localeCompare(b.id));
  return candidats[0] ?? null;
}

/** Le plan soldé par la vente : `completed` s'il est couvert en entier, sinon il reste actif (le reste à venir se lit dans la prévision, par `finance.planId`). */
export const planApresVente = (plan: FinancialPlan, totalCents: number, maintenant: string): FinancialPlan =>
  totalCents >= plan.amountCents ? { ...plan, status: 'completed', updatedAt: maintenant } : plan;

/** Les fûts pleins que la vente peut livrer pour une ligne « fût » : même brassin, même capacité (à 0,5 L), le plus ancien rempli d'abord. */
export function futsLivrables(kegs: readonly KegItem[], l: { batchId?: string; litresUnite: number }): KegItem[] {
  if (!l.batchId) return [];
  return kegs
    .filter(k => k.state === 'plein' && k.batchRef === l.batchId && Math.abs(k.capacityL - l.litresUnite) <= 0.5)
    .sort((a, b) => (iso(a.fillDate) ?? '9999').localeCompare(iso(b.fillDate) ?? '9999') || a.id.localeCompare(b.id, 'fr', { numeric: true }));
}

/** Les fûts proposés par défaut pour `quantite` fûts vendus : les plus anciens, sans dépasser ce qui est plein en cave. */
export const futsProposes = (livrables: readonly { id: string }[], quantite: number): string[] =>
  livrables.slice(0, Math.max(0, Math.floor(quantite))).map(k => k.id);

/** Les fûts devenus « livré » à ce client, le jour de la vente (`dateIso` AAAA-MM-JJ ; les fûts datent en JJ.MM.AAAA). */
export const livrerFuts = (kegs: readonly KegItem[], ids: readonly string[], client: { id?: string; name: string }, dateIso: string): KegItem[] =>
  kegs.filter(k => ids.includes(k.id) && k.state === 'plein').map(k => livrer(k, client, dateIso.split('-').reverse().join('.')));
