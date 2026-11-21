/**
 * CAL-PASSE (21.11, critique de vision n° 11) : le bouton de date de l'app dit l'année quand ce n'est pas l'année en cours
 * (« 05.07.27–14.11.27 »), sinon « 05.07–14.11 » se lit comme juillet de cette année.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PastillePeriode } from '../../src/components/periode/PastillePeriode';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const court = (du: string, au: string) => {
  const { container } = render(<PastillePeriode periode={{ genre: 'dates', du, au }} onChoisir={() => undefined} />);
  return container.querySelector('.pr-court')!.textContent;
};

describe('PastillePeriode : l’année dite hors de l’année en cours', () => {
  it('une plage de l’année suivante dit son année', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 21, 12));
    expect(court('2027-07-05', '2027-11-14')).toBe('05.07.27–14.11.27');
  });
  it('une plage de l’année en cours reste « 05.07–14.11 »', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 21, 12));
    expect(court('2026-07-05', '2026-11-14')).toBe('05.07–14.11');
  });
  it('une plage à cheval sur deux années dit ses deux années', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 21, 12));
    expect(court('2026-10-26', '2027-01-24')).toBe('26.10.26–24.01.27');
  });
  /* CRN-20 (21.11) : la pointe du « → » de la police s'effaçait en clair (« — » en clair, « → » en cave) : la flèche se dessine, le
     caractère reste dans le texte, non peint */
  it('la plage longue dessine sa flèche et garde « → » dans son texte', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 21, 12));
    const { container } = render(<PastillePeriode periode={{ genre: 'dates', du: '2026-10-26', au: '2027-01-24' }} onChoisir={() => undefined} />);
    const long = container.querySelector('.pr-long')!;
    expect(long.textContent).toBe('26 oct. 2026 → 24 janv. 2027');
    expect(long.querySelector('.pr-sep svg')).not.toBeNull();
    expect(long.querySelector('.pr-sep-t')!.textContent).toBe(' → ');
  });
});
