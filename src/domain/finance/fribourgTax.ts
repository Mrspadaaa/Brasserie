import type { AnnualReport, FribourgTaxClosing, FribourgTaxReport, TaxReviewKey } from './types';

// Only the published 2025 instructions were verified. Never roll these codes forward silently.
export const FRIBOURG_TAX_SOURCE = { year: 2025, checkedOn: '2026-09-09', url: 'https://www.fr.ch/media/57721',
  independent: 'https://www.fr.ch/impots/personnes-physiques/activite-independante',
  attachments: 'https://www.fr.ch/impots/personnes-physiques/fritax/fritax-faq' } as const;
export const TAX_REVIEWS: Array<{ key: TaxReviewKey; label: string; help: string }> = [
  { key: 'journal', label: 'Ventes et dépenses de l’année complètes', help: 'Ventes directes, TWINT, espèces, factures, avoirs et impôt sur la bière réellement comptabilisé. Les projets d’achat restent hors des comptes.' },
  { key: 'privateUse', label: 'Usage privé vérifié', help: 'Bière prise pour toi, énergie ou local partagés, téléphone et véhicule. Une part privée déjà retirée d’une dépense ne se corrige pas une deuxième fois.' },
  { key: 'social', label: 'Cotisations sociales rapprochées du décompte', help: 'Vérifie l’AVS/AI/APG et les régularisations. Le pilier 3a et la part privée du 2e pilier se traitent dans la déclaration personnelle, sans double déduction.' },
  { key: 'assets', label: 'Stock et matériel vérifiés', help: 'Malt, houblon, emballages, bière en fermentation et conditionnée aux dates de clôture. Vérifie le coût du stock, les valeurs comptables et les cessions du matériel.' },
  { key: 'balance', label: 'Comptes, créances et dettes complets', help: 'Compare les soldes aux relevés du 31 décembre. Ajoute les prêts et autres éléments absents du journal, avec le nom et l’adresse des tiers.' },
  { key: 'specialCases', label: 'Situations particulières examinées', help: 'Exercice incomplet, pertes antérieures, immeuble professionnel, personnel, liquidation ou autres activités : documente leur traitement avant de cocher.' }
];
export function emptyTaxClosing(): FribourgTaxClosing {
  return { version: 1, reviews: {}, corrections: [], balances: [], counterparties: {}, attachments: [] };
}
/** A change detector, not a security hash. Reviews expire when the underlying books change. */
export function taxBasisKey(report: AnnualReport): string {
  const { generatedAt: _time, tax: _tax, notes: _notes, ...basis } = report;
  const text = JSON.stringify(basis);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `v1-${(hash >>> 0).toString(16)}-${text.length}`;
}
export function validateTaxClosing(tax: FribourgTaxClosing): void {
  const money = (n: number) => Number.isSafeInteger(n) && n >= 0;
  if (tax.version !== 1 || tax.activity && !['main', 'secondary'].includes(tax.activity)) throw Error('Profil fiscal invalide.');
  if (!tax.reviews || Object.values(tax.reviews).some(v => typeof v !== 'boolean')) throw Error('Contrôles fiscaux invalides.');
  if (!tax.counterparties || typeof tax.counterparties !== 'object' || Array.isArray(tax.counterparties) || Object.values(tax.counterparties).some(r => !r || typeof r.name !== 'string' || typeof r.address !== 'string')) throw Error('Identité des tiers invalide.');
  for (const rows of [tax.balances, tax.corrections, tax.attachments]) {
    if (!Array.isArray(rows) || rows.length > 300 || new Set(rows.map(r => r.id)).size !== rows.length) throw Error('Les lignes fiscales doivent avoir des références uniques (300 maximum par liste).');
  }
  if (tax.balances.some(r => !r.id || !r.label.trim() || !(r.kind === 'bank' ? Number.isSafeInteger(r.amountCents) : money(r.amountCents)) || !['bank', 'cash', 'other-asset', 'loan', 'other-liability'].includes(r.kind))) throw Error('Nomme chaque compte ou dette et vérifie son montant. Seul un compte bancaire peut être à découvert.');
  if (tax.corrections.some(r => !r.id || !r.label.trim() || !r.note.trim() || !money(r.amountCents) || !['social', 'private-use', 'non-deductible', 'other'].includes(r.kind) || !['included', 'add', 'deduct'].includes(r.treatment))) throw Error('Chaque correction doit avoir un montant, un motif, un traitement et une justification.');
  if (tax.corrections.some(r => r.kind === 'social' && r.treatment === 'add' || ['private-use', 'non-deductible'].includes(r.kind) && r.treatment === 'deduct')) throw Error('Sens de correction incohérent : cotisations à déduire, parts privées et charges non admises à ajouter au résultat.');
  if (tax.attachments.some(r => !r.label.trim() || !/^[A-Za-z0-9-]{8,100}$/.test(r.documentId) || !['bank', 'social', 'inventory', 'tax-form', 'asset', 'other'].includes(r.kind) || r.kind === 'asset' && !r.assetId)) throw Error('Une pièce complémentaire est incomplète. Relier les justificatifs de matériel à une immobilisation.');
  if (tax.movableWealth && (tax.movableWealth.amountCents != null && !money(tax.movableWealth.amountCents) || tax.movableWealth.confirmed && (tax.movableWealth.amountCents == null || !tax.movableWealth.note.trim()))) throw Error('Indique le montant et la provenance de la fortune reportée depuis l’annexe 05.');
}
export function buildFribourgTaxReport(report: AnnualReport, saved?: FribourgTaxClosing): FribourgTaxReport {
  let tax = saved ?? emptyTaxClosing();
  const missing = [...report.missing];
  try { validateTaxClosing(tax); } catch (e) { missing.push((e as Error).message); tax = emptyTaxClosing(); }
  const basisCurrent = tax.reviewedBasis === taxBasisKey(report);
  const reviews = basisCurrent ? tax.reviews : {};
  if (tax.reviewedBasis && !basisCurrent) missing.push('Les comptes ont changé depuis la dernière vérification. Reprendre les contrôles de clôture.');
  for (const review of TAX_REVIEWS) if (!reviews[review.key]) missing.push(review.label + ' : à confirmer.');
  if (!tax.activity) missing.push('Choisir si la brasserie est une activité principale ou accessoire.');
  if (report.resultCents == null) missing.push('Le résultat comptable attend des données de clôture.');
  const mappingVerified = report.year === FRIBOURG_TAX_SOURCE.year;
  if (!mappingVerified) missing.push(`Rubriques FriTax ${report.year} non vérifiées : seuls les codes de ${FRIBOURG_TAX_SOURCE.year} sont actuellement documentés dans l’app.`);
  if (report.generatedAt.slice(0, 10) <= `${report.year}-12-31`) missing.push('Exercice en cours : établir une nouvelle version après le 31 décembre.');
  const outstanding = (report.outstanding ?? []).map(row => ({ ...row, counterparty: tax.counterparties[row.id]?.name?.trim() || row.counterparty, address: tax.counterparties[row.id]?.address?.trim() || row.address }));
  if (outstanding.some(row => !row.counterparty || !row.address)) missing.push('Compléter le nom et l’adresse des clients ou fournisseurs encore ouverts au 31 décembre.');
  const bankCash = tax.balances.filter(r => r.kind === 'bank' || r.kind === 'cash').reduce((n, r) => n + r.amountCents, 0);
  const cashDifferenceCents = report.cashCents == null ? null : bankCash - report.cashCents;
  if (cashDifferenceCents == null) missing.push('Le rapprochement des soldes attend une trésorerie vérifiable.');
  else if (cashDifferenceCents !== 0) missing.push('Les comptes et la caisse ne correspondent pas à la trésorerie calculée. Corriger le journal ou les soldes.');
  if (tax.balances.some(r => r.kind !== 'cash' && !r.reference?.trim())) missing.push('Ajouter une référence aux comptes, prêts et autres éléments du patrimoine.');
  if (tax.balances.some(r => ['loan', 'other-liability'].includes(r.kind) && !r.address?.trim())) missing.push('Compléter l’adresse du créancier pour les dettes ajoutées.');
  if (tax.balances.some(r => r.kind === 'bank') && !tax.attachments.some(a => a.kind === 'bank')) missing.push('Joindre les relevés bancaires de fin d’année dans les pièces complémentaires.');
  if (tax.corrections.some(r => r.kind === 'social' && r.amountCents > 0) && !tax.attachments.some(a => a.kind === 'social')) missing.push('Joindre le décompte de cotisations sociales dans les pièces complémentaires.');
  for (const asset of report.assetEvidence ?? []) if (!asset.hasLinkedProof && !tax.attachments.some(a => a.kind === 'asset' && a.assetId === asset.id)) missing.push(`${asset.name} : relier la facture d’achat ou joindre un justificatif de valeur de reprise dans les pièces complémentaires.`);
  if (tax.corrections.some(r => r.treatment !== 'included' && r.sourceId && report.adjustments?.some(a => a.id === r.sourceId))) missing.push('Une correction reprend un ajustement déjà intégré au résultat : choisir « Déjà pris en compte ».');
  const correctionCents = tax.corrections.reduce((n, r) => n + (r.treatment === 'included' ? 0 : r.amountCents * (r.treatment === 'deduct' ? -1 : 1)), 0);
  const taxableResultCents = report.resultCents == null ? null : report.resultCents + correctionCents;
  const bankOverdraft = tax.balances.filter(r => r.kind === 'bank' && r.amountCents < 0).reduce((n, r) => n - r.amountCents, 0);
  const totalAssetsCents = report.inventoryChangeCents == null || report.cashCents == null ? null : bankCash + bankOverdraft + report.receivablesCents + report.closingInventory.reduce((n, r) => n + r.valueCents, 0) + report.depreciation.reduce((n, r) => n + r.closingCents, 0) + tax.balances.filter(r => r.kind === 'other-asset').reduce((n, r) => n + r.amountCents, 0);
  const totalLiabilitiesCents = report.payablesCents + bankOverdraft + tax.balances.filter(r => ['loan', 'other-liability'].includes(r.kind)).reduce((n, r) => n + r.amountCents, 0);
  const netAssetsCents = totalAssetsCents == null ? null : totalAssetsCents - totalLiabilitiesCents;
  // A net book value is not automatically the taxable movable wealth: avoid duplicate bank/debt declarations.
  const wealth = tax.movableWealth?.confirmed && tax.movableWealth.note.trim() ? tax.movableWealth.amountCents ?? null : null;
  if ([correctionCents, taxableResultCents, totalAssetsCents, totalLiabilitiesCents, netAssetsCents, bankCash].some(value => value != null && !Number.isSafeInteger(value))) missing.push('Un total dépasse la précision des montants CHF. Vérifier les valeurs saisies.');
  const incomeReady = missing.length === 0 && taxableResultCents != null;
  if (wealth == null) missing.push('Fortune mobilière : vérifier le montant dans l’annexe 05 avant de le reporter (comptes, titres et dettes sans double déclaration).');
  const fields: FribourgTaxReport['fields'] = [
    { id: 'income', label: tax.activity === 'secondary' ? 'Revenu de la brasserie · activité accessoire' : 'Revenu de la brasserie', destination: !tax.activity ? 'Choisir d’abord activité principale ou accessoire dans les vérifications.' : tax.activity === 'secondary' ? 'Déclaration principale · activité indépendante accessoire (annexe 03 au besoin)' : 'Déclaration principale · activité indépendante principale (annexe 05)', code: mappingVerified && tax.activity ? tax.activity === 'secondary' ? '1.220' : '1.210' : undefined,
      amountCents: taxableResultCents, explanation: 'Résultat comptable + corrections fiscales documentées. Les montants déjà pris en compte ont un effet nul. Un résultat négatif reste une perte.', ready: incomeReady },
    { id: 'wealth', label: 'Fortune mobilière de l’exploitation', destination: 'Déclaration principale · montant issu de l’annexe 05', code: mappingVerified ? '3.570' : undefined, amountCents: wealth,
      explanation: tax.movableWealth?.note || 'Compléter l’annexe 05 à l’aide de l’état des actifs et passifs. Confirmer ici le montant qui en résulte ; le patrimoine net comptable ne le remplace pas.', ready: incomeReady && wealth != null }
  ];
  return { version: 1, sourceYear: FRIBOURG_TAX_SOURCE.year, mappingVerified, sourceUrl: FRIBOURG_TAX_SOURCE.url, activity: tax.activity, reviews,
    corrections: structuredClone(tax.corrections), correctionCents, taxableResultCents, balances: structuredClone(tax.balances), outstanding, totalAssetsCents, totalLiabilitiesCents, netAssetsCents, cashDifferenceCents,
    fields, attachments: structuredClone(tax.attachments), specialCaseNote: tax.specialCaseNote, missing: [...new Set(missing)], ready: missing.length === 0 };
}
export function taxCopyValue(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw Error('Montant non disponible.');
  return (cents / 100).toFixed(2);
}
