import { describe, it, expect, vi } from 'vitest';
import { awaitBrewerReply } from '../../src/services/brewerRecovery';
import type { BrewerReply } from '../../functions/src/companionTypes';

const input = {
  scope: { kind: 'recipe' as const, id: 'REC-1' },
  question: 'Autre fournisseur ?',
  operationId: 'operation-123456789'
};
const turn = { id: 'answer', operationId: input.operationId } as any;
const running = {
  pending: { operationId: input.operationId, question: input.question, until: Date.now() + 60000 }
};
const options = { pollMs: 1, maxWaitMs: 1000 };
describe('Reprise des réponses du compagnon', () => {
  it('récupère le reçu enregistré même quand la requête HTTP originale ne revient pas', async () => {
    const transport = {
      send: vi.fn(() => new Promise<BrewerReply>(() => {})),
      status: vi.fn().mockResolvedValueOnce(running).mockResolvedValueOnce({ turn })
    };
    expect(await awaitBrewerReply(input, transport, options)).toEqual(turn);
    expect(transport.send).toHaveBeenCalledTimes(1);
  });
  it('rejoint le même traitement après une interruption réseau, sans régénération', async () => {
    const transport = {
      send: vi.fn().mockRejectedValue(new Error('network')),
      status: vi.fn().mockResolvedValueOnce(running).mockResolvedValueOnce({ turn })
    };
    expect(await awaitBrewerReply(input, transport, options)).toEqual(turn);
    expect(transport.send).toHaveBeenCalledTimes(1);
  });
  it('attend la réponse précédente puis lance la nouvelle question avec son identifiant initial', async () => {
    const pending = { pending: { ...running.pending, operationId: 'older-operation-12345' } };
    const transport = {
      send: vi.fn().mockResolvedValueOnce(pending).mockResolvedValueOnce({ turn }),
      status: vi.fn().mockResolvedValueOnce(pending).mockResolvedValueOnce({})
    };
    const progress = vi.fn();
    expect(await awaitBrewerReply(input, transport, { ...options, onProgress: progress })).toEqual(
      turn
    );
    expect(transport.send).toHaveBeenCalledTimes(2);
    expect(transport.send.mock.calls[1][0]).toBe(input);
    expect(progress).toHaveBeenCalledWith('waiting');
  });
  it('ne relance pas une erreur de validation ou une analyse qui a échoué', async () => {
    const failure = { code: 'functions/invalid-argument' };
    const transport = { send: vi.fn().mockRejectedValue(failure), status: vi.fn() };
    await expect(awaitBrewerReply(input, transport, options)).rejects.toBe(failure);
    expect(transport.status).not.toHaveBeenCalled();
    transport.send.mockRejectedValue(new Error('Le conseil n’a pas pu être vérifié'));
    transport.status.mockResolvedValue({});
    await expect(awaitBrewerReply(input, transport, options)).rejects.toThrow(/vérifié/);
    expect(transport.send).toHaveBeenCalledTimes(2);
  });
  it('arrête l’observation au démontage et garde le traitement serveur indépendant', async () => {
    const controller = new AbortController();
    const transport = {
      send: vi.fn(() => new Promise<BrewerReply>(() => {})),
      status: vi.fn().mockResolvedValue(running)
    };
    const answer = awaitBrewerReply(input, transport, { ...options, signal: controller.signal });
    controller.abort();
    await expect(answer).rejects.toHaveProperty('name', 'AbortError');
    expect(transport.send).toHaveBeenCalledTimes(1);
  });
});
