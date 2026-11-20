// @vitest-environment jsdom
/**
 * Voie r3b — BK3-3 (partie Assistant) : la rangée « Retour / Suivant » ne couvre jamais le bas des cartes.
 * La réserve de place : à partir de 640 px de large (et 481 px de haut), la rangée est HORS de la zone qui défile (<main>), sœur de <main> ;
 * au téléphone elle suit le contenu (T12b), sauf l'étape Levure (`endActionsCollant`) qui la veut fixe.
 * Rouge avant : sur le code du 20.11 la rangée est toujours dans <main> (collante par-dessus les cartes).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PageShell } from '../../src/pages/PageShell';

function media(requetes: Record<string, boolean>) {
  window.matchMedia = ((q: string) => ({
    matches: Object.entries(requetes).some(([cle, v]) => v && q.includes(cle)),
    media: q, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined,
    onchange: null, dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia;
}
const rendre = (collant = false) => render(
  <PageShell title="Assistant" onClose={() => undefined} endActions={<button>Suivant</button>} endActionsCollant={collant}>
    <div>carte</div>
  </PageShell>
);
afterEach(() => { cleanup(); delete (window as { matchMedia?: unknown }).matchMedia; });

describe('BK3-3 : la rangée de fin ne passe sur aucune carte', () => {
  it('ordinateur (≥ 640 px, ≥ 481 px de haut) : la rangée est hors de <main>, après lui', () => {
    media({ 'min-width: 640px': true, 'min-height: 481px': true });
    const { container } = rendre();
    const barre = container.querySelector('[data-page-end-actions]')!;
    const main = container.querySelector('main')!;
    expect(barre).not.toBeNull();
    expect(main.contains(barre)).toBe(false);
    expect(barre.closest('[data-page-end-dock]')!.previousElementSibling).toBe(main);
    expect(barre.className).not.toMatch(/sticky/);
  });

  it('téléphone debout : la rangée suit le contenu, dans <main>', () => {
    media({ 'min-height: 481px': true });
    const { container } = rendre();
    expect(container.querySelector('main')!.contains(container.querySelector('[data-page-end-actions]'))).toBe(true);
  });

  it('étape Levure (rangée fixe) au téléphone debout : hors de <main>', () => {
    media({ 'min-height: 481px': true });
    const { container } = rendre(true);
    expect(container.querySelector('main')!.contains(container.querySelector('[data-page-end-actions]'))).toBe(false);
  });

  it('téléphone couché (< 481 px de haut) : la rangée suit le contenu, même large', () => {
    media({ 'min-width: 640px': true });
    const { container } = rendre(true);
    expect(container.querySelector('main')!.contains(container.querySelector('[data-page-end-actions]'))).toBe(true);
  });
});
