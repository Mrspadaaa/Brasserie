// @vitest-environment jsdom
/**
 * TOUCHER-FANTOME (21.11, tour7) : toucher « La Cigogne, 3 fûts » a annulé la vente. Le toucher ouvre le détail au lâcher ; le `click` que le
 * navigateur émet ensuite au même point tombait sur « Annuler la vente », apparu sous le doigt. Ce clic-là est avalé ; un vrai toucher qui suit,
 * le clavier et la souris (dont le clic reste sur la pièce touchée) passent.
 */
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { usePointeur } from '../../src/ui/calendrier/frise/usePointeur';
import { useToucherNom } from '../../src/ui/calendrier/frise/zoneToucher';

afterEach(cleanup);

function Banc({ onAnnuler, parNom = false }: { onAnnuler: () => void; parNom?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const barre = usePointeur({ largeurColonne: 60, onToucher: () => setOuvert(true) });
  const nom = useToucherNom(() => setOuvert(true));
  return (
    <div>
      <div data-testid="piece" {...(parNom ? nom : barre)}>La Cigogne, 3 fûts</div>
      {ouvert && <button type="button" onClick={onAnnuler}>Annuler la vente</button>}
    </div>
  );
}

const toucher = (el: Element, id: number) => {
  fireEvent.pointerDown(el, { pointerId: id, pointerType: 'touch', clientX: 50, clientY: 50, button: 0 });
  fireEvent.pointerUp(el, { pointerId: id, pointerType: 'touch', clientX: 50, clientY: 50 });
};

describe('TOUCHER-FANTOME : un toucher qui ouvre un détail ne déclenche jamais ce qui y apparaît sous le doigt', () => {
  for (const parNom of [false, true]) {
    it(`${parNom ? 'le nom posé à côté' : 'la barre'} : le clic émis après le lâcher, tombé sur « Annuler la vente », est avalé ; le toucher suivant passe`, () => {
      const onAnnuler = vi.fn();
      render(<Banc onAnnuler={onAnnuler} parNom={parNom} />);
      toucher(screen.getByTestId('piece'), 1);
      const annuler = screen.getByRole('button', { name: 'Annuler la vente' });
      // le clic fabriqué du toucher (detail 1), au même point, sur le bouton apparu dessous
      fireEvent.click(annuler, { detail: 1 });
      expect(onAnnuler).not.toHaveBeenCalled();
      // un vrai toucher sur le bouton : son appui lève la garde, son clic passe
      fireEvent.pointerDown(annuler, { pointerId: 2, pointerType: 'touch', button: 0 });
      fireEvent.click(annuler, { detail: 1 });
      expect(onAnnuler).toHaveBeenCalledTimes(1);
    });
  }

  it('le clavier (detail 0) passe toujours', () => {
    const onAnnuler = vi.fn();
    render(<Banc onAnnuler={onAnnuler} />);
    toucher(screen.getByTestId('piece'), 3);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la vente' }), { detail: 0 });
    expect(onAnnuler).toHaveBeenCalledTimes(1);
  });
});
