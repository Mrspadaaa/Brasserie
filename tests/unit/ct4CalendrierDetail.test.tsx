// @vitest-environment jsdom
/**
 * CT4-A-14 (critique tour 4) : à 390, la ligne du détail d'un brassin pas brassé (« pas brassée · brassage prévu le 10 nov. · prête le 18 déc.
 * au plus tôt ») se déchirait en quatre colonnes (chaque morceau de texte était un élément du `<p>` flex). Elle se coupe maintenant ENTRE les
 * groupes « · » ; la géométrie (un groupe sur une seule ligne) est mesurée au harnais (état CT4-14).
 */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { groupesInsecables } from '../../src/ui/calendrier/frise/DetailChose';

afterEach(cleanup);

describe('CT4-A-14 : la ligne du détail se coupe entre les groupes', () => {
  const LIGNE = 'pas brassée · brassage prévu le 10 nov. · prête le 18 déc. au plus tôt';
  it('trois groupes insécables, le « · » collé au groupe qui le précède, le texte entier inchangé', () => {
    const { container } = render(<p><span>{groupesInsecables(LIGNE)}</span></p>);
    const groupes = [...container.querySelectorAll('[data-groupe]')].map(g => (g.textContent || '').replace(/\s+/g, ' ').trim());
    expect(groupes).toEqual(['pas brassée ·', 'brassage prévu le 10 nov. ·', 'prête le 18 déc. au plus tôt']);
    expect((container.textContent || '').replace(/\s+/g, ' ').trim()).toBe(LIGNE);
  });
  it('un seul groupe : aucun bloc ajouté', () => {
    const { container } = render(<p><span>{groupesInsecables('le 20 nov. · ')}</span></p>);
    expect(container.querySelectorAll('[data-groupe]').length).toBe(0);
    const { container: c2 } = render(<p><span>{groupesInsecables('le 20 nov.')}</span></p>);
    expect(c2.querySelectorAll('[data-groupe]').length).toBe(0);
    expect((c2.textContent || '')).toBe('le 20 nov.');
  });
  it('les dates restent insécables dans leur groupe', () => {
    const { container } = render(<p><span>{groupesInsecables(LIGNE)}</span></p>);
    expect([...container.querySelectorAll('[data-date]')].map(d => d.textContent)).toEqual(['le 10 nov.', 'le 18 déc.']);
  });
});
