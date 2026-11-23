/** Read-only scenario. Every amount is supplied explicitly; zero must be intentional. */
export interface BreweryInvestmentAssumptions {
  purchaseCents: number;
  deliveryCents: number;
  installationCents: number;
  annualSavingsCents: number;
  annualMaintenanceCents: number;
  annualEnergyCents: number;
  annualOtherCostsCents: number;
  assumptionNote: string;
}
const amountKeys = ['purchaseCents', 'deliveryCents', 'installationCents', 'annualSavingsCents', 'annualMaintenanceCents', 'annualEnergyCents', 'annualOtherCostsCents'] as const;
export function simulateBreweryInvestment(raw: Record<string, unknown>, cash?: { cashCents: number | null; cashComplete: boolean }) {
  if (Object.keys(raw).some(key => ![...amountKeys, 'assumptionNote'].includes(key as any))) throw new Error('Champ de scénario inconnu. Le temps personnel, les ventes supposées et l’impôt ne sont pas chiffrés.');
  for (const key of amountKeys) if (!Number.isSafeInteger(raw[key]) || (raw[key] as number) < 0 || (raw[key] as number) > 100_000_000) throw new Error(`${key} : montant explicite requis, entier entre 0 et 100 000 000 centimes CHF.`);
  if (typeof raw.assumptionNote !== 'string' || raw.assumptionNote.trim().length < 3 || raw.assumptionNote.length > 600) throw new Error('Préciser la source ou l’hypothèse du scénario.');
  const assumptions = raw as unknown as BreweryInvestmentAssumptions;
  const initialCostCents = assumptions.purchaseCents + assumptions.deliveryCents + assumptions.installationCents;
  const annualAdditionalCostsCents = assumptions.annualMaintenanceCents + assumptions.annualEnergyCents + assumptions.annualOtherCostsCents;
  const annualNetSavingsCents = assumptions.annualSavingsCents - annualAdditionalCostsCents;
  const paybackMonths = annualNetSavingsCents > 0 ? Math.ceil(initialCostCents * 12 / annualNetSavingsCents) : null;
  return { kind: 'simulation', currency: 'CHF', amounts: 'integer-cents', assumptions: { ...assumptions, assumptionNote: assumptions.assumptionNote.trim() }, initialCostCents, annualAdditionalCostsCents, annualNetSavingsCents, paybackMonths,
    cashAfterImmediatePurchaseCents: cash?.cashComplete && Number.isSafeInteger(cash.cashCents) ? cash.cashCents! - initialCostCents : null,
    personalLaborIncluded: false, expectedSalesIncluded: false,
    limits: ['Hypothèses fournies, pas des économies observées ou garanties. Aucun achat ni paiement enregistré.',
      'Retour simple arrondi au mois supérieur : sans actualisation, financement, impôts, valeur de revente ni variation de production. L’amortissement fiscal n’est pas une économie de trésorerie.',
      'Impact immédiat = paiement comptant intégral du coût initial ; ne tient pas compte des échéances déjà prévues. Ce montant ne prouve pas la capacité de financement.',
      ...(annualNetSavingsCents <= 0 ? ['Aucun retour positif calculable avec ces hypothèses de gains nets annuels.'] : [])] };
}
