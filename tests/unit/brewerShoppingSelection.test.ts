import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adviceSchema, runBrewerHarness, validateAdvice } from '../../functions/src/brewerHarness';
import type { BrewerAdvice, BrewerContext, BrewerEvidence, BrewerProduct } from '../../functions/src/companionTypes';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { practicalEquipment } from '../../src/domain/brewEquipment';

const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('../../functions/src/brewerSuppliers', () => ({ verifySupplierPagesReport: verify }));
const urls = {
  exact: 'https://www.sios.ch/Cascade-100g',
  duplicateLanguage: 'https://www.sios.ch/en/Cascade-100g',
  gram: 'https://www.brauundrauchshop.ch/cascade#stock-100',
  wood: 'https://www.bierbrauzubehoer.ch/copeaux-chene',
  sugar: 'https://brewstore.ch/sucre'
};
const product = (url: string, name: string): BrewerProduct => ({ name, url, supplier: 'Fournisseur', availability: 'in_stock', availabilityText: 'En stock', checkedAt: 1000, verifiedBy: 'product-page', packageLabel: '100g' });
const products = [
  product(urls.wood, 'Copeaux de chêne 100g'), product(urls.sugar, 'Sucre 100g'),
  product(urls.duplicateLanguage, 'Cascade hops 100g'), product(urls.exact, 'Cascade pellets 100g'),
  { ...product(urls.gram, 'Cascade pellets'), packageLabel: 'Vendu au gramme' }
];
const checks = products.map(p => ({ requestedUrl: p.url, resolvedUrl: p.url, status: 'verified' }));
const evidence: BrewerEvidence[] = [{ id: 'E1', name: 'find_brewing_suppliers', label: 'Fiches vérifiées', facts: [], limits: [], data: { checks }, products, sources: products.map(p => ({ title: p.name, url: p.url })) }];
const advice = (selection?: string[]): BrewerAdvice => ({ level: 'info', summary: 'Cascade pour le prochain brassin.', action: 'Le sachet Cascade de 100g correspond à ta demande.', why: 'Les autres ingrédients ne remplacent pas ce houblon.', watch: 'Confirme le stock à la commande.', question: '', evidenceIds: ['E1'], ...(selection === undefined ? {} : { productUrls: selection }) });
const context = (): BrewerContext => ({ recipe: recipe({ efficiencyPct: 75 }), journal: brewState(), now: Date.now(), phase: 'Empâtage', provenance: [], inventory: [], material: [], waterSources: [], equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment } });
const tool = (name: string, args: unknown) => ({ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name, args } }] } }] });
const grounded = { candidates: [{ content: { role: 'model', parts: [{ text: 'Produits trouvés chez les fournisseurs.' }] }, groundingMetadata: { groundingChunks: [] } }] };
const reviewed = { candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] };
function generateFor(finishes: BrewerAdvice[]) {
  let analysis = 0;
  return vi.fn(async (_model: string, body: any) => {
    if (body.tools?.some((tool: any) => tool.googleSearch)) return grounded;
    if (body.generationConfig?.responseMimeType === 'application/json') return reviewed;
    if (++analysis === 1) return tool('find_brewing_suppliers', { query: 'Cascade pellets 100g en Suisse' });
    return tool('finish_advice', finishes[Math.min(analysis - 2, finishes.length - 1)]);
  });
}
beforeEach(() => {
  verify.mockReset();
  verify.mockResolvedValue({ products, checks });
});

describe('Sélection des seules fiches adaptées au besoin du brasseur', () => {
  it('expose une sélection explicite et refuse une URL inconnue ou l’absence de choix', () => {
    expect(adviceSchema.properties.productUrls.items.type).toBe('STRING');
    expect(adviceSchema.properties.productUrls.description).toContain('conditionnement');
    expect(validateAdvice(advice([urls.exact]), evidence).productUrls).toEqual([urls.exact]);
    expect(() => validateAdvice(advice(['https://evil.test/cascade']), evidence)).toThrow('Sélection produit inconnue');
    expect(validateAdvice({ ...advice([]), action: 'Aucune offre consultée ne convient à la demande.' }, evidence).productUrls).toEqual([]);
    expect(() => validateAdvice(advice(), evidence)).toThrow('Choisis les fiches pertinentes');
  });
  it('reprend les seuls liens explicites des anciennes réponses, avec paramètres et ancre exacts', () => {
    const old = { ...advice(), why: `Sachet : ${urls.exact}. Alternative vendue au gramme : ${urls.gram}.` };
    expect(validateAdvice(old, evidence).productUrls).toEqual([urls.exact, urls.gram]);
    expect(() => validateAdvice({ ...advice(), why: 'https://www.brauundrauchshop.ch/cascade' }, evidence)).toThrow('Choisis les fiches pertinentes');
  });
  it('ne permet pas de sélectionner une fiche puis de citer une autre fiche masquée', () => {
    expect(() => validateAdvice({ ...advice([urls.exact]), why: urls.gram }, evidence)).toThrow('manque dans productUrls');
  });
  it('les produits vérifiés mais hors sujet ne sont jamais affichés par défaut', async () => {
    const generate = generateFor([advice([urls.exact])]);
    const result = await runBrewerHarness(context(), 'Trouve du Cascade pellets en sachet de 100g.', [], generate, { mode: 'auto' });
    expect(result.advice.productUrls).toEqual([urls.exact]);
    const shopping = result.evidence.find(entry => entry.name === 'find_brewing_suppliers')!;
    expect(shopping.products?.map(p => p.url)).toEqual([urls.exact]);
    expect(shopping.sources?.map(s => s.url)).toEqual([urls.exact]);
    expect((shopping.data as any).checks).toEqual(checks);
    expect(shopping.products?.some(p => /chêne|sucre|hops/.test(p.name))).toBe(false);
    const reviewBody = generate.mock.calls.find(([, body]) => body.generationConfig?.responseMimeType === 'application/json')![1];
    const reviewInput = JSON.parse(reviewBody.contents[0].parts[0].text);
    expect(reviewInput.proposed.productUrls).toEqual([urls.exact]);
    expect(reviewInput.evidence[0].products).toHaveLength(5);
    expect(reviewBody.systemInstruction.parts[0].text).toContain('Contrôle explicitement proposed.productUrls');
  });
  it('demande au modèle de choisir au lieu de prendre automatiquement la première fiche ou langue', async () => {
    const generate = generateFor([advice(), advice([urls.duplicateLanguage])]);
    const result = await runBrewerHarness(context(), 'Trouve du Cascade pellets 100g.', [], generate, { mode: 'auto' });
    expect(result.trace.some(entry => entry.name === 'finish_advice' && entry.error?.includes('Choisis les fiches pertinentes'))).toBe(true);
    expect(result.evidence[0].products?.map(p => p.url)).toEqual([urls.duplicateLanguage]);
    expect(result.evidence[0].sources?.map(s => s.url)).toEqual([urls.duplicateLanguage]);
    expect(verify).toHaveBeenCalledTimes(1);
  });
  it('le vieux conseil avec liens directs filtre aussi les fiches et conserve plusieurs choix pertinents', async () => {
    verify.mockResolvedValue({ products: [...products].reverse(), checks });
    const old = { ...advice(), why: `Le sachet ${urls.exact} convient. Sinon ${urls.gram} vend au gramme ; commande 100 unités.` };
    const result = await runBrewerHarness(context(), 'Trouve du Cascade 100g.', [], generateFor([old]), { mode: 'auto' });
    expect(result.advice.productUrls).toEqual([urls.exact, urls.gram]);
    expect(result.evidence[0].products?.map(p => p.url)).toEqual([urls.exact, urls.gram]);
    expect(result.evidence[0].sources?.map(s => s.url)).toEqual([urls.exact, urls.gram]);
  });
  it('une sélection explicitement vide permet une réponse honnête sans afficher les produits hors sujet', async () => {
    const none = { ...advice([]), action: 'Aucune offre consultée ne correspond au sachet demandé.', why: 'Les fiches de copeaux et de sucre sont hors sujet.' };
    const result = await runBrewerHarness(context(), 'Trouve ce houblon indisponible.', [], generateFor([none]), { mode: 'auto' });
    expect(result.advice.productUrls).toEqual([]);
    expect(result.evidence[0].products).toEqual([]);
    expect(result.evidence[0].sources).toEqual([]);
    expect((result.evidence[0].data as any).checks).toEqual(checks);
  });
  it('accepte aucune sélection quand aucune fiche produit n’a été vérifiée', () => {
    const absent: BrewerEvidence[] = [{ ...evidence[0], products: [], sources: [] }];
    expect(validateAdvice(advice(), absent).productUrls).toBeUndefined();
    expect(validateAdvice(advice([]), absent).productUrls).toEqual([]);
  });
});
