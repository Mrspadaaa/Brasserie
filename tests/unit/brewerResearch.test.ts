import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrewerAdvice, BrewerEvidence, BrewerProduct } from '../../functions/src/companionTypes';
import { BrewerBudgetError } from '../../functions/src/brewerLimits';
import { researchBrewing, validateShoppingAdviceLinks } from '../../functions/src/brewerResearch';

const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('../../functions/src/brewerSuppliers', () => ({ verifySupplierPagesReport: verify }));
const first = 'https://www.brauundrauchshop.ch/cascade#stock-100';
const second = 'https://www.bierbrauzubehoer.ch/cascade?number=100g';
const third = 'https://www.sios.ch/cascade-100g';
const product = (url = first): BrewerProduct => ({
  name: 'Cascade pellets 100g', supplier: 'Fournisseur test', url, availability: 'unknown',
  availabilityText: 'Stock non confirmé', checkedAt: 1000, verifiedBy: 'product-page',
  stockEvidence: 'none', packageLabel: '100g', priceText: 'CHF 8.90'
});
const grounded = (text: string, url: string, thought = '') => ({
  candidates: [{ content: { parts: [{ text: thought, thought: true }, { text }] },
    groundingMetadata: { groundingChunks: [{ web: { uri: url, title: 'Source vendeur' } }] } }]
});
const signal = () => new AbortController().signal;
const evidence = (products = [product()]): BrewerEvidence[] => [{
  id: 'E1', name: 'find_brewing_suppliers', label: 'Fiches', facts: [], limits: [], data: {}, products
}];
const advice = (action = ''): BrewerAdvice => ({
  level: 'info', summary: 'Houblon pour le prochain brassin', action, why: '', watch: '', question: '', evidenceIds: ['E1']
});
beforeEach(() => {
  verify.mockReset();
  verify.mockResolvedValue({ products: [product()], checks: [{ requestedUrl: first, resolvedUrl: first, status: 'verified' }] });
});

describe('Recherche Flash indépendante et vérification des fournisseurs', () => {
  it('lance trois chercheurs complémentaires en parallèle avec seulement la question courte', async () => {
    let finishFirst!: (value: unknown) => void;
    let finishSecond!: (value: unknown) => void;
    let finishThird!: (value: unknown) => void;
    const call = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { finishSecond = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { finishThird = resolve; }));
    const promise = researchBrewing('find_brewing_suppliers', 'Cascade pellets 100g en Suisse', 3, call, signal());
    expect(call).toHaveBeenCalledTimes(3);
    const body1 = call.mock.calls[0][0];
    const body2 = call.mock.calls[1][0];
    const body3 = call.mock.calls[2][0];
    expect(body1.systemInstruction.parts[0].text).toContain('Produit exact et conditionnement demandé');
    expect(body2.systemInstruction.parts[0].text).toContain('Seconde boutique et contrôle des variantes');
    expect(body3.systemInstruction.parts[0].text).toContain('Conditionnement exact et disponibilité annoncée');
    expect(body3.systemInstruction.parts[0].text).toContain('Commence par sios.ch.');
    expect(body1.contents).toEqual([{ role: 'user', parts: [{ text: 'Cascade pellets 100g en Suisse' }] }]);
    expect(body2.contents).toEqual(body1.contents);
    expect(body3.contents).toEqual(body1.contents);
    for (const body of [body1, body2, body3]) {
      expect(body.systemInstruction.parts[0].text).toContain('Ne propose des alternatives que si la demande les autorise');
    }
    expect(body1.tools).toEqual([{ googleSearch: {} }]);
    finishThird(grounded(`[Cascade 100g](${third})`, third));
    finishSecond(grounded(`[Cascade 100g](${second})`, second));
    expect(verify).not.toHaveBeenCalled();
    finishFirst(grounded(`[Cascade 100g](${first})`, first));
    const result = await promise;
    expect(result.facts[0]).toContain('3 recherche(s) indépendante(s)');
    expect(verify).toHaveBeenCalledTimes(1);
    const candidates = verify.mock.calls[0][0];
    expect(candidates.slice(0, 3).map((v: { url: string }) => v.url)).toEqual([first, second, third]);
  });
  it('limite une vague à trois rôles même si le demandeur en indique davantage', async () => {
    const call = vi.fn().mockResolvedValue(grounded(`[Cascade](${first})`, first));
    await researchBrewing('find_brewing_suppliers', 'Cascade', 100, call, signal());
    expect(call).toHaveBeenCalledTimes(3);
  });
  it('conserve les liens et ancres vérifiés et élimine les URL inventées des sources publiées', async () => {
    const invented = 'https://www.brauundrauchshop.ch/invente-100g';
    const call = vi.fn().mockResolvedValue(grounded(`[Suggestion inventée](${invented})`, invented, 'https://evil.test/private-thought'));
    const result = await researchBrewing('find_brewing_suppliers', 'Cascade', 1, call, signal());
    expect(result.sources).toEqual([{ title: product().name, url: first }]);
    expect(result.products).toEqual([product()]);
    expect(JSON.stringify(result.facts)).not.toContain(invented);
    expect(JSON.stringify(verify.mock.calls[0][0])).not.toContain('private-thought');
    expect((result.data as any).checks).toEqual([{ requestedUrl: first, resolvedUrl: first, status: 'verified' }]);
  });
  it('garde les deux autres chercheurs si le premier échoue et signale la limite', async () => {
    const call = vi.fn().mockRejectedValueOnce(new Error('Timeout recherche'))
      .mockResolvedValueOnce(grounded(`[Cascade](${second})`, second))
      .mockResolvedValueOnce(grounded(`[Cascade](${third})`, third));
    const result = await researchBrewing('find_brewing_suppliers', 'Cascade', 3, call, signal());
    expect(result.products).toEqual([product()]);
    expect(result.limits).toContain('Une recherche a échoué : couverture partielle.');
    expect(result.facts[0]).toContain('2 recherche(s) indépendante(s)');
    expect(verify.mock.calls[0][0][0].url).toBe(second);
    expect(verify.mock.calls[0][0][1].url).toBe(third);
  });
  it('indique quand deux chercheurs échouent sans perdre le résultat du troisième', async () => {
    const call = vi.fn().mockRejectedValueOnce(new Error('Timeout recherche'))
      .mockRejectedValueOnce(new Error('Source indisponible'))
      .mockResolvedValueOnce(grounded(`[Cascade](${third})`, third));
    const result = await researchBrewing('find_brewing_suppliers', 'Cascade', 3, call, signal());
    expect(result.limits).toContain('2 recherches ont échoué : couverture partielle.');
    expect(result.facts[0]).toContain('1 recherche(s) indépendante(s)');
    expect(verify.mock.calls[0][0][0].url).toBe(third);
  });
  it('n’essaie pas de contourner un plafond même si un autre chercheur a réussi', async () => {
    const limit = new BrewerBudgetError('ai-monthly-limit', 'Budget atteint');
    const call = vi.fn().mockResolvedValueOnce(grounded(`[Cascade](${first})`, first))
      .mockRejectedValueOnce(limit)
      .mockResolvedValueOnce(grounded(`[Cascade](${third})`, third));
    await expect(researchBrewing('find_brewing_suppliers', 'Cascade', 3, call, signal())).rejects.toBe(limit);
    expect(call).toHaveBeenCalledTimes(3);
    expect(verify).not.toHaveBeenCalled();
  });
  it('ne transforme pas deux recherches échouées ou aucune fiche lue en achat confirmé', async () => {
    const call = vi.fn().mockRejectedValue(new Error('Source absente'));
    await expect(researchBrewing('find_brewing_suppliers', 'Cascade', 2, call, signal())).rejects.toThrow('aucune source');
    verify.mockResolvedValue({ products: [], checks: [{ requestedUrl: first, status: 'robots_blocked' }] });
    const partial = await researchBrewing('find_brewing_suppliers', 'Cascade', 1, vi.fn().mockResolvedValue(grounded(`[Cascade en stock](${first})`, first)), signal());
    expect(partial.sources).toEqual([]);
    expect(partial.products).toEqual([]);
    expect(partial.limits).toContain('Aucune fiche produit vérifiée : aucun lien d’achat confirmé.');
  });
  it('une demande annulée ne déclenche aucun appel IA et une annulation tardive interrompt la vérification', async () => {
    const controller = new AbortController(); controller.abort();
    const call = vi.fn();
    await expect(researchBrewing('find_brewing_suppliers', 'Cascade', 2, call, controller.signal)).rejects.toThrow();
    expect(call).not.toHaveBeenCalled();
    const later = new AbortController();
    const lateCall = vi.fn(async () => { later.abort(); return grounded('Source', first); });
    await expect(researchBrewing('find_brewing_suppliers', 'Cascade', 1, lateCall, later.signal)).rejects.toThrow();
    expect(verify).not.toHaveBeenCalled();
  });
  it('une référence technique utilise un chercheur et ne passe pas pour une fiche d’achat', async () => {
    const url = 'https://www.bjcp.org/style/';
    const call = vi.fn().mockResolvedValue(grounded('Référence fabricant, pas une mesure du brassin.', url));
    const result = await researchBrewing('lookup_brewing_reference', 'Plage de fermentation', 2, call, signal());
    expect(call).toHaveBeenCalledTimes(1);
    expect(verify).not.toHaveBeenCalled();
    expect(result.products).toBeUndefined();
    expect(result.sources).toEqual([{ title: 'Source vendeur', url }]);
  });
});

describe('Dernier contrôle des liens présents dans le conseil', () => {
  it('accepte uniquement le lien du conditionnement réellement consulté, avec son ancre ou sa query', () => {
    expect(() => validateShoppingAdviceLinks(advice(`[Acheter](${first})`), evidence())).not.toThrow();
    expect(() => validateShoppingAdviceLinks(advice(`${second}.`), evidence([product(second)]))).not.toThrow();
    expect(() => validateShoppingAdviceLinks(advice('[Acheter](https://www.brauundrauchshop.ch/cascade)'), evidence())).toThrow('Lien d’achat non vérifié');
    expect(() => validateShoppingAdviceLinks(advice('[Acheter](https://www.brauundrauchshop.ch/cascade#stock-5000)'), evidence())).toThrow('Lien d’achat non vérifié');
    expect(() => validateShoppingAdviceLinks(advice('[Acheter](https://www.bierbrauzubehoer.ch/cascade?number=5kg)'), evidence([product(second)]))).toThrow('Lien d’achat non vérifié');
  });
  it.each([
    '[Acheter](/produit-invente)', '[Acheter](//evil.test/buy)', '[Acheter](javascript:alert(1))',
    '[Acheter](<https://evil.test/buy>)', '[Acheter][a]\n[a]: https://evil.test/buy',
    'http://www.brauundrauchshop.ch/cascade', 'www.evil.test/buy'
  ])('refuse une destination non vérifiée dans toutes les formes de lien : %s', value => {
    expect(() => validateShoppingAdviceLinks(advice(value), evidence())).toThrow('Lien d’achat non vérifié');
  });
  it('contrôle les cinq champs de texte et exige la preuve de lecture produit', () => {
    for (const field of ['summary', 'action', 'why', 'watch', 'question'] as const) {
      expect(() => validateShoppingAdviceLinks({ ...advice(), [field]: 'https://evil.test/buy' }, evidence())).toThrow();
    }
    const indexed = { ...product(), verifiedBy: undefined };
    expect(() => validateShoppingAdviceLinks(advice(first), evidence([indexed]))).toThrow();
    expect(() => validateShoppingAdviceLinks(advice('Stock non confirmé. Consulte les fiches ci-dessous.'), evidence())).not.toThrow();
  });
  it('ne bloque pas les références documentaires en dehors d’une recherche fournisseur', () => {
    expect(() => validateShoppingAdviceLinks(advice('https://www.bjcp.org/'), [])).not.toThrow();
  });
});
