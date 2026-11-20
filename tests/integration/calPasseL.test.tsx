import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { zonesPoignees } from '../../src/ui/calendrier/entete/Fenetre';
import { BandeSemaines } from '../../src/ui/calendrier/entete/BandeSemaines';

/** CAL-PASSE (voie L, 20.11) : le passé au doigt. Le test sert la correction ; la preuve est au doigt (controle-cal-passe.mjs). */
describe('CAL-PASSE L : poignée de début et semaine en cours', () => {
  it('la courbe commence avant aujourd’hui : la prise du début à l’index 0 reste entière dans l’écran (44 px)', () => {
    const avant = zonesPoignees(0, 23, 366);
    expect(avant.debut.l).toBeLessThan(0);
    const apres = zonesPoignees(0, 23, 366, true);
    expect(apres.debut.l).toBe(0);
    expect(apres.debut.w).toBe(44);
    /* plus loin dans le passé, rien ne change : la prise reste 34 px dehors, 10 dedans */
    expect(zonesPoignees(100, 200, 366, true).debut.l).toBe(zonesPoignees(100, 200, 366).debut.l);
  });

  it('data-courant suit le lundi de la semaine en cours, pas l’index 0 (la frise commence avant aujourd’hui)', () => {
    const semaines = [{ debut: '2026-11-02', numero: 45 }, { debut: '2026-11-09', numero: 46 }, { debut: '2026-11-16', numero: 47 }];
    const { container } = render(<BandeSemaines semaines={semaines} courbe={null} decalage={0} lundiCourant="2026-11-16" mouvements={false} idees={new Set()} retards={new Set()} onDate={() => undefined} />);
    const courants = [...container.querySelectorAll('[data-courant]')].map(e => e.getAttribute('data-lundi'));
    expect(courants).toEqual(['2026-11-16']);
  });
});
