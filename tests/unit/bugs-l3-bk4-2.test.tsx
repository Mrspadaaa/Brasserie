// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewLaunchManque } from '../../src/ui/BrewLaunchPanel';
import { manquesLancement } from '../../src/domain/brewLaunch';

afterEach(cleanup);

// BK4-2 : quand l'app ne sait pas (aucune ligne de stock à ce nom), le lancement dit « non relié », comme l'aperçu du Carnet (CT4-B-4), jamais « pas au stock ».
describe('BK4-2 · Lancement : un ingrédient sans ligne de stock se dit « non relié »', () => {
  it('Ce qui manque : la ligne d’un ingrédient absent du stock dit « non relié » et garde « manque »', () => {
    const manques = manquesLancement(
      [{ id: 'e1', titre: 'Ébullition', groupe: 'houblons', matiere: 'houblon', pastilles: [{ cle: 'c', nom: 'Citra', quantite: 80, unite: 'g' }] } as never],
      []
    );
    expect(manques).toHaveLength(1);
    expect(manques[0].enStock).toBeNull();
    render(<BrewLaunchManque volumeL={20} manques={manques} onCourses={vi.fn()} />);
    expect(screen.getByText('non relié')).toBeInTheDocument();
    expect(screen.queryByText('pas au stock')).not.toBeInTheDocument();
    expect(screen.getByText(/manque 80 g/)).toBeInTheDocument();
  });

  it('un ingrédient relié mais court garde « en stock N »', () => {
    render(<BrewLaunchManque volumeL={20} manques={[{ nom: 'Citra', dose: 80, unite: 'g', enStock: 30, manque: 50 }]} onCourses={vi.fn()} />);
    expect(screen.getByText(/en stock 30 g/)).toBeInTheDocument();
    expect(screen.queryByText('non relié')).not.toBeInTheDocument();
  });
});
