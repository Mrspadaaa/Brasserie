// @vitest-environment jsdom
/**
 * C68-13 (tour 68, voie c68-fix) : Stocks › Matériel › Réalisés compte et liste les problèmes résolus (« ira dans Réalisés »). Un problème fermé par l'achat d'un plan
 * lié n'est pas compté deux fois (le plan y va). Rien n'est inventé : sans retenue ni jour écrits, la ligne ne les dit pas.
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { resoudre, retenirOption, fermerParAchat } from '../../src/domain/carnets/suivi';
import { resolusRealises } from '../../src/domain/carnets/realises';
import { ResolusRealises } from '../../src/ui/carnets/ResolusRealises';

afterEach(() => cleanup());

type Item = Parameters<typeof appliquerEcritures>[0][number];
const carnet = (id: string, titre: string, facons: Array<{ id: string; nom: string }> = []): Item => ({
  id, type: 'carnet', title: titre, status: 'idea',
  carnet: { version: 1, creeLe: '2026-11-01T08:00:00.000Z', phrase: titre, criteres: [], articles: [], notes: [], photos: [], genre: { valeur: 'probleme', origine: 'ia' }, suivi: { etat: 'cherche', evenements: [] },
    facons: facons.map(f => ({ id: f.id, nom: f.nom, etat: 'ouverte', origine: 'vous', suivi: { etat: 'piste', historique: [] } })) }
}) as unknown as Item;
const ap = (items: Item[], r: { ok: boolean; ecritures?: unknown; raison?: string }): Item[] => {
  if (!r.ok) throw new Error(`refusé : ${r.raison}`);
  return appliquerEcritures(items as never, r.ecritures as never) as Item[];
};

describe('C68-13 : les résolus dans Réalisés', () => {
  it('six problèmes résolus : six comptés, le plus récent d\'abord ; un problème ouvert n\'y est pas', () => {
    let items: Item[] = [carnet('P0', 'ZZ TEST — ouvert')];
    for (let i = 1; i <= 6; i++) {
      items.push(carnet(`P${i}`, `ZZ TEST — résolu ${i}`));
      items = ap(items, resoudre(items as never, { carnetId: `P${i}`, le: `2026-11-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`, sorte: 'reparation' }) as never);
    }
    const r = resolusRealises(items as never);
    expect(r.map(x => x.id)).toEqual(['P6', 'P5', 'P4', 'P3', 'P2', 'P1']);
    expect(r.some(x => x.id === 'P0')).toBe(false);
  });

  it('la retenue se dit seulement si elle existe ; un problème sans retenue ni option : null, jamais une valeur inventée', () => {
    let items: Item[] = [carnet('A', 'ZZ TEST — avec hotte', [{ id: 'FH', nom: 'Hotte' }]), carnet('B', 'ZZ TEST — réparé seul')];
    items = ap(items, retenirOption(items as never, { carnetId: 'A', faconId: 'FH', le: '2026-11-12T10:00:00.000Z' }) as never);
    items = ap(items, resoudre(items as never, { carnetId: 'A', le: '2026-11-13T10:00:00.000Z', sorte: 'reparation' }) as never);
    items = ap(items, resoudre(items as never, { carnetId: 'B', le: '2026-11-14T10:00:00.000Z', sorte: 'reparation' }) as never);
    const r = resolusRealises(items as never);
    expect(r.find(x => x.id === 'A')?.retenue).toBe('Hotte');
    expect(r.find(x => x.id === 'B')?.retenue).toBeNull();
  });

  it('fermé par l\'achat d\'un plan lié : le plan y va, le problème n\'est pas compté une seconde fois ; sans plan lié, il l\'est', () => {
    let items: Item[] = [carnet('C', 'ZZ TEST — acheté avec plan', [{ id: 'FC', nom: 'Condenseur' }]), carnet('D', 'ZZ TEST — acheté sans plan', [{ id: 'FD', nom: 'Joint' }])];
    items = ap(items, fermerParAchat(items as never, { carnetId: 'C', optionId: 'FC', planId: 'PLAN-1', le: '2026-11-12T10:00:00.000Z' }) as never);
    items = ap(items, fermerParAchat(items as never, { carnetId: 'D', optionId: 'FD', le: '2026-11-13T10:00:00.000Z' }) as never);
    expect(resolusRealises(items as never).map(x => x.id)).toEqual(['D']);
  });

  it('la liste montre le titre, la retenue et le jour ; un toucher ouvre le problème ; sans résolu, rien', () => {
    const ouvrir = vi.fn();
    const { container, rerender } = render(<ResolusRealises resolus={[{ id: 'A', titre: 'ZZ TEST — avec hotte', le: '2026-11-13T10:00:00.000Z', retenue: 'Hotte' }, { id: 'B', titre: 'ZZ TEST — réparé seul', le: null, retenue: null }]} onOuvrir={ouvrir} />);
    const t = container.textContent ?? '';
    expect(t).toMatch(/Problèmes résolus\s*2/);
    expect(t).toMatch(/avec hotte/);
    expect(t).toMatch(/retenu : Hotte/);
    fireEvent.click(container.querySelector('button')!);
    expect(ouvrir).toHaveBeenCalledWith('A');
    rerender(<ResolusRealises resolus={[]} onOuvrir={ouvrir} />);
    expect(container.querySelector('[data-resolus-realises]')).toBeNull();
  });
});
