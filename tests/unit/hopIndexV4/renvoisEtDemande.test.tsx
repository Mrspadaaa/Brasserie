// @vitest-environment jsdom
// Voie t12d (25.10), retours du brasseur sur l'app déployée :
// - « Ébullition 60′ › » ouvre le champ Durée d'ébullition de l'étape Identité ; la ligne de la levure ouvre l'étape Levure, et
//   un appui long ouvre sa vue (couche Levure) ;
// - sans visée ni dégustation, aucune demande inventée (« + Floral 1/2 − Résineux inconnu » venait de la fixture S1 de la maquette).
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RECETTE_SAAZ } from '../../fixtures/recetteSaazReelle';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EtapeHoublons from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import { configurerDonnees } from '../../../src/ui/hopIndex/parcours/donnees';
import { demandeCourante, sensDe } from '../../../src/ui/hopIndex/parcours/visee';
import { demandeQ2B } from '../../../src/ui/hopIndex/suggerer/voies';
import { visees, scoreDefi } from '../../../src/ui/hopIndex/comparer/calcul';

afterEach(() => { cleanup(); configurerDonnees(); vi.useRealTimers(); });

describe('renvois de l\'étape Houblons vers le wizard', () => {
  it('le toucher sur « Ébullition » ouvre le champ Durée d\'ébullition de l\'étape Identité', () => {
    const onAller = vi.fn();
    const { container } = render(<EtapeHoublons recipe={RECETTE_SAAZ} boilOg={1.047} draftId={RECETTE_SAAZ.id} onChange={() => {}} onAller={onAller} />);
    const lien = container.querySelector<HTMLElement>('[data-action="renvoi-ebullition"]')!;
    expect(lien.textContent).toContain('120′');
    fireEvent.click(lien);
    expect(onAller).toHaveBeenCalledWith('duree-ebullition');
  });

  it('un toucher sur la ligne de la levure ouvre l\'étape Levure ; l\'appui long n\'y renvoie pas', () => {
    vi.useFakeTimers();
    const onAller = vi.fn();
    const { container } = render(<EtapeHoublons recipe={RECETTE_SAAZ} boilOg={1.047} draftId={RECETTE_SAAZ.id} onChange={() => {}} onAller={onAller} />);
    const levure = container.querySelector<HTMLElement>('[data-role="pont-etape-levure"]')!;
    fireEvent.pointerDown(levure); fireEvent.pointerUp(levure); fireEvent.click(levure);
    expect(onAller).toHaveBeenCalledWith('levure');
    onAller.mockClear();
    fireEvent.pointerDown(levure);
    vi.advanceTimersByTime(700);
    fireEvent.pointerUp(levure); fireEvent.click(levure);
    expect(onAller).not.toHaveBeenCalled();
  });
});

describe('aucune demande inventée dans l\'app', () => {
  it('la maquette garde S1 (floral +1, résineux −1) tant que rien n\'est configuré', () => {
    configurerDonnees();
    expect(demandeCourante()).toEqual({ floral: 1, resin: -1 });
    expect(sensDe({}, () => null)).toEqual({ floral: 1, resin: -1 });
  });
  it('configurée par l\'app, sans dégustation ni visée : aucune demande (écrans Fiche, Suggérer, Comparer)', () => {
    configurerDonnees({ degustation: null });
    expect(demandeCourante()).toEqual({});
    expect(sensDe({}, () => null)).toEqual({});
    expect(demandeQ2B()).toEqual({});
    expect(visees()).toEqual({});
    expect(scoreDefi({ cellules: {}, sorties: [] } as never)).toEqual({ points: 1, sur: 2 });
  });
  it('une visée posée par le brasseur reste prise en compte', () => {
    configurerDonnees({ degustation: null });
    expect(sensDe({ floral: 2.5 }, () => 10)).toEqual({ floral: 1 });
  });
});
