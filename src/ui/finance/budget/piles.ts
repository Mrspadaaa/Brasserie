import type { BrewBudgetLine, BrewBudgetSnapshot, BrewCostKey } from '../../../domain/finance/brewBudget';
import type { CoutLitre, TroisNotions } from '../../../domain/finance/chaineLitre';
import { fluxDuBrassin, fr, frL, groupeIngredient, sourceIncomplete, type NoeudId, type SourceId } from '../CoutBrassinFlux';

/**
 * m4bb-a (choix du 15.11) : le coût d'un brassin en piles « quand tu paies » puis en rangées v6a.
 * Fonctions pures : tous les montants viennent du snapshot de `estimateBrewBudget` (dejaPaye, aPayer, annee, lignes, frais par poste) ;
 * rien n'est recalculé sauf une règle de trois pour la hauteur. L'inconnu est « ? », jamais 0 (une pile inconnue n'a pas de hauteur).
 */
export interface PileBudget { id: SourceId; nom: string; cents: number; incomplete: boolean; texte: string; ratio: number }
export interface LitreBudget { etat: 'complet' | 'minimum' | 'inconnu'; texte: string; division: string | null }
export interface BandeBudget { piles: PileBudget[]; litre: LitreBudget }

const NOMS: Record<SourceId, string> = { stock: 'déjà payé', now: 'à payer', an: "part de l'année" };
const cents = (v: number) => Math.round(v * 100);

export function bandeDuBudget(s: BrewBudgetSnapshot, notions: TroisNotions | null, litre: CoutLitre | null, litres: number | null): BandeBudget {
  const { sources, destinations } = fluxDuBrassin(s);
  const piles = (['stock', 'now', 'an'] as SourceId[]).map(id => {
    const incomplete = sourceIncomplete(id, destinations), c = cents(sources[id]);
    return { id, nom: NOMS[id], cents: c, incomplete, texte: incomplete && c === 0 ? '?' : fr(sources[id]), ratio: 0 };
  });
  const max = Math.max(...piles.map(p => p.cents), 1);
  piles.forEach(p => { p.ratio = p.cents > 0 ? Math.max(p.cents / max, 0.08) : 0; });
  const total = notions?.total ?? s.totalCost;
  if (!litres || !(litres > 0)) return { piles, litre: { etat: 'inconnu', texte: '—', division: null } };
  const division = `${fr(total)} ÷ ${frL(litres)} L`;
  if (litre) return { piles, litre: { etat: 'complet', texte: fr(litre.affiche.complet), division } };
  return { piles, litre: { etat: 'minimum', texte: fr(Math.round(total / litres * 100) / 100), division } };
}

export type EtatRangee = 'stock' | 'mixte' | 'acheter' | 'inconnu' | 'payer' | 'compris' | 'annee';
export interface RangeeBudget {
  cle: string; noeud: NoeudId; nom: string; detail?: string;
  /** null : inconnu. */
  montant: number | null; estime: boolean; etat: EtatRangee; partStock: number; partPayer: number;
}
export interface GroupeBudget { id: 'malt' | 'q' | 'autres' | 'frais' | 'annee'; titre: string; total: number | null; horsRecette?: boolean; rangees: RangeeBudget[] }

const TITRES = { malt: 'Malt', q: 'Houblon, levure', autres: 'Autres', frais: 'Frais', annee: "Part de l'année" } as const;
const FRAIS: Array<[BrewCostKey, NoeudId, string]> = [['energy', 'ener', 'Énergie'], ['cleaning', 'net', 'Nettoyage'], ['packaging', 'emb', 'Emballage'], ['beerTax', 'imp', 'Impôt bière']];
const somme = (valeurs: Array<number | null>): number | null => valeurs.some(v => v === null) ? null : Math.round(valeurs.reduce<number>((n, v) => n + (v ?? 0), 0) * 100) / 100;

function etatLigne(l: BrewBudgetLine): EtatRangee {
  if (l.consumedCost === null) return 'inconnu';
  const stock = (l.stockCost ?? 0) > 0, achat = (l.purchaseCost ?? 0) > 0;
  if (l.cashTreatment === 'included-in-recurring' && !stock) return 'compris';
  return stock && achat ? 'mixte' : achat ? 'acheter' : 'stock';
}

/** `quantite` met en forme « 5,2 kg » (Units, côté écran) ; `og` : densité de l'impôt, pour « · 1,048 ». */
export function groupesDuBudget(s: BrewBudgetSnapshot, estimes: Partial<Record<NoeudId, boolean>>, opts: { quantite: (l: BrewBudgetLine) => string; og?: number }): GroupeBudget[] {
  const { destinations } = fluxDuBrassin(s, estimes);
  const dest = (id: NoeudId) => destinations.find(d => d.id === id);
  const groupes: GroupeBudget[] = [];
  for (const id of ['malt', 'q', 'autres'] as const) {
    const lignes = s.lines.filter(l => groupeIngredient(l, s.recipeSnapshot) === id);
    const d = dest(id);
    if (!lignes.length) { if (id === 'q') groupes.push({ id, titre: TITRES[id], total: null, horsRecette: true, rangees: [] }); continue; }
    groupes.push({ id, titre: TITRES[id], total: d?.montant ?? null, rangees: lignes.map(l => ({
      cle: l.key, noeud: id, nom: l.name, detail: opts.quantite(l), montant: l.consumedCost, estime: false, etat: etatLigne(l), partStock: l.stockCost ?? 0, partPayer: l.purchaseCost ?? 0 })) });
  }
  const frais: RangeeBudget[] = [];
  for (const [key, noeud, nom] of FRAIS) {
    const p = s.fraisParPoste?.[key];
    if (!p) continue;
    frais.push({ cle: key, noeud, nom, ...(noeud === 'imp' && opts.og && opts.og > 1 ? { detail: opts.og.toFixed(3).replace('.', ',') } : {}),
      montant: p.cout, estime: estimes[noeud] ?? true, etat: p.cout === null ? 'inconnu' : p.cash === 0 && p.cout > 0 ? 'compris' : 'payer', partStock: 0, partPayer: p.cout ?? 0 });
  }
  if (frais.length) groupes.push({ id: 'frais', titre: TITRES.frais, total: somme(frais.map(f => f.montant)), rangees: frais });
  const annee: RangeeBudget[] = [];
  const an = (n: number | undefined) => Number.isFinite(n) ? `${fr(n!, 0)} / an` : undefined;
  const fix = dest('fix'), mat = dest('mat');
  if (fix) annee.push({ cle: 'fix', noeud: 'fix', nom: 'Charges fixes', detail: an(s.settings.annualFixedCHF), montant: fix.montant, estime: fix.estime, etat: fix.montant === null ? 'inconnu' : 'annee', partStock: 0, partPayer: 0 });
  if (mat) annee.push({ cle: 'mat', noeud: 'mat', nom: 'Usure du matériel', detail: an(s.settings.annualDepreciationCHF), montant: mat.montant, estime: mat.estime, etat: mat.montant === null ? 'inconnu' : 'annee', partStock: 0, partPayer: 0 });
  if (annee.length) groupes.push({ id: 'annee', titre: TITRES.annee, total: somme(annee.map(a => a.montant)), rangees: annee });
  return groupes;
}
