// @vitest-environment jsdom
// s2-sources-une-fois, D169 (26.10) : « cette vue doit se fermer quand on ouvre ou change de vue ». Une seule carte dépliée à la fois
// dans l'étape Houblons ; changer de vue (un autre écran de l'étape, ou un outil qui recouvre l'étape : l'app pose `aria-hidden` /
// `inert` sur elle) les ferme toutes ; la vue retrouvée est fermée. Le parcours réel (cartes de Ma bière, fiche, Substituer, dans
// Chrome) est joué par tests/integration/controle-sources-une-fois.mjs.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRef } from 'react';
import { FournisseurCartes, useCartesOuvertes, useEtatCartes } from '../../../src/ui/hopIndex/maBiere/carteOuverte';

function Carte({ id }: { id: string }) {
  const { etat, poser } = useEtatCartes();
  const moi = etat?.id === id ? etat : null;
  return (
    <div>
      <button type="button" data-testid={`bande-${id}`} onClick={() => poser({ id, bande: true, legende: false })}>bande</button>
      <button type="button" data-testid={`aide-${id}`} onClick={() => poser(moi?.legende ? null : { id, bande: !!moi?.bande, legende: true })}>?</button>
      {moi && <span data-testid={`ouverte-${id}`} data-legende={String(moi.legende)} />}
    </div>
  );
}
function Etape({ vue }: { vue: string }) {
  const racine = useRef<HTMLDivElement>(null);
  const cartes = useCartesOuvertes(vue, racine);
  return (
    <FournisseurCartes value={cartes}>
      <div ref={racine} data-testid="etape">
        <Carte id="lotus" /><Carte id="citra" /><Carte id="rapide:nugget" />
      </div>
    </FournisseurCartes>
  );
}
const ouvertes = (c: HTMLElement) => [...c.querySelectorAll('[data-testid^="ouverte-"]')].map((e) => e.getAttribute('data-testid')!.slice(8));
const toucher = (c: HTMLElement, id: string) => fireEvent.click(c.querySelector(`[data-testid="${id}"]`)!);

afterEach(cleanup);

describe('D169 : la carte dépliée se referme', () => {
  it('ouvrir une autre carte ferme la première (une seule à la fois, lignes d\'ajout rapide comprises)', () => {
    const { container } = render(<Etape vue="ma-biere" />);
    toucher(container, 'bande-lotus');
    expect(ouvertes(container)).toEqual(['lotus']);
    toucher(container, 'bande-citra');
    expect(ouvertes(container)).toEqual(['citra']);
    toucher(container, 'bande-rapide:nugget');
    expect(ouvertes(container)).toEqual(['rapide:nugget']);
    toucher(container, 'bande-lotus');
    expect(ouvertes(container)).toEqual(['lotus']);
  });

  it('le « ? » ouvre la ligne des icônes de sa carte et ferme l\'autre', () => {
    const { container } = render(<Etape vue="ma-biere" />);
    toucher(container, 'bande-lotus');
    toucher(container, 'aide-citra');
    expect(ouvertes(container)).toEqual(['citra']);
    expect(container.querySelector('[data-testid="ouverte-citra"]')!.getAttribute('data-legende')).toBe('true');
  });

  it('changer de vue de l\'étape (la fiche) ferme la carte, et la vue retrouvée est fermée', () => {
    const { container, rerender } = render(<Etape vue="ma-biere" />);
    toucher(container, 'bande-lotus');
    expect(ouvertes(container)).toEqual(['lotus']);
    rerender(<Etape vue="fiche" />);
    expect(ouvertes(container)).toEqual([]);
    rerender(<Etape vue="ma-biere" />);
    expect(ouvertes(container)).toEqual([]);
  });

  it("un outil qui recouvre l'étape (aria-hidden posé par la pile de l'app) ferme la carte ; elle reste fermée au retour", async () => {
    const { container } = render(<div data-testid="base"><Etape vue="ma-biere" /></div>);
    const base = container.querySelector('[data-testid="base"]')!;
    toucher(container, 'bande-lotus');
    expect(ouvertes(container)).toEqual(['lotus']);
    await act(async () => { base.setAttribute('aria-hidden', 'true'); await Promise.resolve(); });
    expect(ouvertes(container)).toEqual([]);
    await act(async () => { base.removeAttribute('aria-hidden'); await Promise.resolve(); });
    expect(ouvertes(container)).toEqual([]);
  });

  it('Échap referme la ligne des icônes du « ? »', () => {
    const { container } = render(<Etape vue="ma-biere" />);
    toucher(container, 'aide-lotus');
    expect(ouvertes(container)).toEqual(['lotus']);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(ouvertes(container)).toEqual([]);
  });
});
