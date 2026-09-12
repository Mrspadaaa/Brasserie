import { simulateBreweryInvestment } from './financeContext.js';
import type { BrewerContext, BrewerEvidence } from './companionTypes.js';

const amount = (description: string) => ({ type: 'INTEGER', minimum: 0, maximum: 100_000_000, description: `${description} ; centimes CHF, zéro explicitement confirmé, jamais un montant supposé.` });
export const investmentTool = {
  name: 'simulate_brewery_investment',
  description: 'Simuler en lecture seule un achat de matériel de brasserie avec hypothèses explicites : coût TTC initial, économies nettes annuelles, retour simple et paiement comptant hypothétique. Temps du propriétaire entièrement exclu. Ni action ni recommandation automatique d’achat.',
  parameters: { type: 'OBJECT', properties: {
    purchaseCents: amount('Prix TTC du matériel'), deliveryCents: amount('Livraison TTC'), installationCents: amount('Installation TTC'),
    annualSavingsCents: amount('Économies récurrentes annuelles attendues avant nouveaux frais ; exclure salaire/temps personnel et recettes commerciales non établies'),
    annualMaintenanceCents: amount('Entretien annuel supplémentaire'), annualEnergyCents: amount('Énergie annuelle supplémentaire'), annualOtherCostsCents: amount('Autres coûts récurrents supplémentaires annuels'),
    assumptionNote: { type: 'STRING', description: 'Source et hypothèses choisies par le brasseur, 3 à 600 caractères. Distinguer devis et hypothèse de comparaison.' }
  }, required: ['purchaseCents', 'deliveryCents', 'installationCents', 'annualSavingsCents', 'annualMaintenanceCents', 'annualEnergyCents', 'annualOtherCostsCents', 'assumptionNote'] }
};
export function runInvestmentTool(args: Record<string, unknown>, context: BrewerContext): Omit<BrewerEvidence, 'id'> {
  const data = simulateBreweryInvestment(args, context.workspace?.finance?.ledger);
  const money = (value: number) => new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(value / 100);
  const assumptions = data.assumptions;
  return { name: investmentTool.name, label: 'Matériel · scénario de coût et retour simple', data,
    facts: [
      `Coût initial TTC : ${money(data.initialCostCents)} (achat ${money(assumptions.purchaseCents)}, livraison ${money(assumptions.deliveryCents)}, installation ${money(assumptions.installationCents)}).`,
      `Économies annuelles supposées avant frais : ${money(assumptions.annualSavingsCents)}.`,
      `Frais annuels supplémentaires : entretien ${money(assumptions.annualMaintenanceCents)}, énergie ${money(assumptions.annualEnergyCents)}, autres ${money(assumptions.annualOtherCostsCents)}.`,
      `Économies nettes annuelles simulées : ${money(data.annualNetSavingsCents)}.`,
      data.paybackMonths == null ? 'Pas de retour positif avec ces hypothèses.' : `Retour simple estimé : ${data.paybackMonths} mois, arrondi au mois supérieur.`,
      `Hypothèses : ${assumptions.assumptionNote}`
    ], limits: data.limits };
}
