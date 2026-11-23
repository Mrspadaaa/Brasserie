// L-28 (T10-28, M3-8 ; D412 : « CHE-2 (Supprimer) et CHE-5 (Modifier un brassin) entrent dans la fiche ») : la fiche d'un brassin n'avait pas Supprimer.
// Règle prudente : un brassin PRÉVU (pas encore brassé) se supprime, et se rend par Annuler (son statut passe à « annulé », le document reste) ;
// un brassin brassé (en cuve, conditionné) se gère dans Production.
import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { choseBrassin } from '../../src/domain/calendrier';
import { supprimer } from '../../src/domain/calendrierGestes';

const AUJOURDHUI = '2026-11-16';
const lot = (p: Partial<Batch> = {}) => ({ id: 'LOT-5', name: 'Blonde d’automne', style: 'Blonde', volumeL: 30, brewDate: '', plannedBrewDate: '08.12.2026', status: 'planifie', ...p }) as unknown as Batch;

describe('L-28 : Supprimer un brassin depuis sa fiche', () => {
  it('un brassin prévu se supprime (statut « annulé », rendu par Annuler)', () => {
    const r = supprimer(choseBrassin(lot(), AUJOURDHUI)!);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-5', patch: { status: 'annule' } }]);
    expect(r.message?.action).toBe('Annuler');
  });
  it('un brassin en cuve ne se supprime pas d’ici', () => {
    const r = supprimer(choseBrassin(lot({ status: 'fermentation', brewDate: '01.11.2026' }), AUJOURDHUI)!);
    expect(r.ok).toBe(false);
  });
});
