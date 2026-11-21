// @vitest-environment jsdom
/**
 * Voie v3, T3-2 : « Brassage 8 sept. · pas brassée » puis Fermentation 20 nov., Dry hop 22 nov. : un brassage passé non fait, ses étapes recalées
 * sur aujourd'hui sans le dire. Le détail dit « en retard » sur le brassage et pourquoi les étapes suivantes ne partent pas de sa date prévue.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { DetailChose } from '../../src/ui/calendrier/frise/DetailChose';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-20T10:00:00')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const brassin = (debut: string): ChoseCalendrier => ({
  id: 'brassin-LOT-T', rangee: 'brassins', titre: 'Ttt', debut, fin: '2026-12-21', pasBrassee: true, pretePrevue: '2026-12-21',
  source: { genre: 'batch', id: 'LOT-T' }, ouvre: { ecran: 'brassin', id: 'LOT-T' }, deplacable: true,
  jalons: [{ id: 'brassage', jour: debut, ecart: 0 }, { id: 'fermentation', jour: '2026-11-20', ecart: 1 }]
} as unknown as ChoseCalendrier);
/* D412 : les étapes sont dans le volet « dates » : un toucher sur la souche */
const rendre = (c: ChoseCalendrier) => { const r = render(<DetailChose chose={c} onFermer={() => {}} onOuvrir={() => {}} onCommander={() => {}} onBudget={() => {}} />); fireEvent.click(r.container.querySelector('[data-souche]')!); return r; };
const texte = (e: Element | null) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('T3-2 : brassage passé non fait', () => {
  it('le jour prévu est passé : « en retard » sur le brassage, et la raison des étapes suivantes', () => {
    const { container } = rendre(brassin('2026-09-08'));
    expect(texte(container.querySelector('[data-etape="brassage"]'))).toMatch(/pas brassée, en retard/);
    expect(texte(container.querySelector('[data-etapes-recalees]'))).toMatch(/comptées depuis aujourd’hui/);
  });
  it('le jour prévu est à venir : « pas brassée » seul, aucune note', () => {
    const { container } = rendre(brassin('2026-11-25'));
    expect(texte(container.querySelector('[data-etape="brassage"]'))).toMatch(/pas brassée$/);
    expect(container.querySelector('[data-etapes-recalees]')).toBeNull();
  });
});
