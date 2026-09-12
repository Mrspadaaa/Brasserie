import { describe, expect, it, vi } from 'vitest';
import { reviewBrewerAdvice } from '../../functions/src/brewerReview';

const response = (value: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
const approval = () => response({ approved: true, proposalApproved: true, issues: [] });
const body = () => ({
  systemInstruction: { parts: [{ text: 'Règles du maître brasseur.' }] },
  contents: [{ role: 'user', parts: [{ text: JSON.stringify({ question: 'Cascade 100 g', evidence: ['E1'] }) }] }],
  generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT' }, maxOutputTokens: 2500 }
});

describe('Relectures indépendantes du conseil brasseur', () => {
  it('lance les deux appels avant leur résolution et conserve le contexte sans partager les verdicts', async () => {
    const pending: Array<(value: unknown) => void> = [];
    const generate = vi.fn((_request: Record<string, any>) => new Promise<unknown>(resolve => pending.push(resolve)));
    const input = body();
    const original = structuredClone(input);
    const result = reviewBrewerAdvice(input, generate, { parallel: true });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[0][0]).toMatchObject({ contents: input.contents, systemInstruction: input.systemInstruction });
    expect(generate.mock.calls[1][0].contents).toEqual(input.contents);
    expect(generate.mock.calls[1][0].systemInstruction.parts[1].text).toContain('seconde relecture indépendante');
    expect(generate.mock.calls[1][0].systemInstruction.parts[1].text).toContain('sans ajouter de préférence');
    pending[1](approval());
    pending[0](approval());
    await expect(result).resolves.toMatchObject({ approved: true, proposalApproved: true, issues: [], reviewers: [{ role: 'technical' }, { role: 'practical' }] });
    expect(input).toEqual(original);
    expect(generate.mock.calls.every(([request]) => request.generationConfig.maxOutputTokens === 2000)).toBe(true);
  });

  it('conserve une relecture unique sur les demandes simples ou le mode Pro explicite', async () => {
    const generate = vi.fn().mockResolvedValue(approval());
    const result = await reviewBrewerAdvice(body(), generate, { parallel: false });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.reviewers).toHaveLength(1);
    expect(result.approved).toBe(true);
  });

  it('refuse quand un seul réviseur trouve une erreur et préserve une proposition approuvée', async () => {
    const generate = vi.fn().mockResolvedValueOnce(approval()).mockResolvedValueOnce(response({
      approved: false, proposalApproved: true, issues: ['Le sachet affiché contient 1 kg, pas 100 g.']
    }));
    const result = await reviewBrewerAdvice(body(), generate, { parallel: true });
    expect(result.approved).toBe(false);
    expect(result.proposalApproved).toBe(true);
    expect(result.issues).toEqual(['Le sachet affiché contient 1 kg, pas 100 g.']);
  });

  it('ne valide une proposition que si tous les réviseurs la valident explicitement', async () => {
    const missing = vi.fn().mockResolvedValueOnce(approval()).mockResolvedValueOnce(response({ approved: true, issues: [] }));
    const legacy = await reviewBrewerAdvice(body(), missing, { parallel: true });
    expect(legacy.approved).toBe(true);
    expect(legacy.proposalApproved).toBeUndefined();
    const rejected = vi.fn().mockResolvedValueOnce(approval()).mockResolvedValueOnce(response({ approved: true, proposalApproved: false, issues: ['Dose sans preuve.'] }));
    expect((await reviewBrewerAdvice(body(), rejected, { parallel: true })).proposalApproved).toBe(false);
  });

  it.each([
    { approved: 'true', proposalApproved: true, issues: [] },
    { approved: true, proposalApproved: 'true', issues: [] },
    { approved: true, proposalApproved: true, issues: 'aucun' },
    { approved: true, proposalApproved: true, issues: [42] },
    { approved: true, proposalApproved: true, issues: ['   '] },
    null,
    []
  ])('refuse un JSON de forme invalide sans coercition : %j', async invalid => {
    const generate = vi.fn().mockResolvedValueOnce(approval()).mockResolvedValueOnce(response(invalid));
    const result = await reviewBrewerAdvice(body(), generate, { parallel: true });
    expect(result.approved).toBe(false);
    expect(result.proposalApproved).toBe(false);
    expect(result.issues[0]).toContain('relecture pratique invalide');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('refuse une sortie manquante ou illisible et ne considère pas la pensée comme un verdict', async () => {
    for (const payload of [{}, { candidates: [{ content: { parts: [{ text: '{invalide' }] } }] }, { candidates: [{ content: { parts: [{ text: JSON.stringify({ approved: true, issues: [] }), thought: true }] } }] }]) {
      const result = await reviewBrewerAdvice(body(), vi.fn().mockResolvedValue(payload), { parallel: false });
      expect(result.approved).toBe(false);
      expect(result.issues[0]).toContain('technique invalide');
    }
  });

  it('accepte le JSON balisé et ignore les fragments de raisonnement', async () => {
    const payload = { candidates: [{ content: { parts: [
      { thought: true, text: 'Raisonnement privé.' },
      { text: '```json\n{"approved":true,"proposalApproved":true,"issues":[]}\n```' }
    ] } }] };
    expect((await reviewBrewerAdvice(body(), vi.fn().mockResolvedValue(payload), { parallel: false })).approved).toBe(true);
  });

  it('déduplique et borne les corrections sans approuver une réponse contradictoire', async () => {
    const generate = vi.fn().mockResolvedValueOnce(response({ approved: true, proposalApproved: true, issues: [' Prix   sans source. ', 'A'.repeat(900)] }))
      .mockResolvedValueOnce(response({ approved: false, proposalApproved: true, issues: ['prix sans source.', ...Array.from({ length: 10 }, (_, i) => `Erreur ${i}`)] }));
    const result = await reviewBrewerAdvice(body(), generate, { parallel: true });
    expect(result.approved).toBe(false);
    expect(result.issues).toHaveLength(8);
    expect(result.issues[0]).toBe('Prix sans source.');
    expect(result.issues[1]).toHaveLength(800);
    expect(result.issues.filter(issue => /prix/i.test(issue))).toHaveLength(1);
  });

  it('attend le second appel puis propage exactement l’erreur fournisseur ou budget sans retry', async () => {
    const failure = new Error('Plafond mensuel atteint');
    let finishSecond!: (value: unknown) => void;
    const generate = vi.fn().mockRejectedValueOnce(failure).mockImplementationOnce(() => new Promise(resolve => { finishSecond = resolve; }));
    let settled = false;
    const promise = reviewBrewerAdvice(body(), generate, { parallel: true });
    void promise.then(() => { settled = true; }, () => { settled = true; });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    finishSecond(approval());
    await expect(promise).rejects.toBe(failure);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('respecte une limite de sortie plus petite fournie par l’appelant', async () => {
    const request = body();
    request.generationConfig.maxOutputTokens = 700;
    const generate = vi.fn().mockResolvedValue(approval());
    await reviewBrewerAdvice(request, generate, { parallel: true });
    expect(generate.mock.calls.every(([sent]) => sent.generationConfig.maxOutputTokens === 700)).toBe(true);
  });
});
