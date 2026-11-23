// Lot 7 du Carnet (23.11) : L-44 Choisir hors budget, L-45 brouillon du champ, L-46 Renommer, L-47 focus après Ajouter.
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChampCarnet } from '../../../src/ui/carnets/ChampCarnet';
import { RenommerCarnet } from '../../../src/ui/carnets/RenommerCarnet';
import { Choisir } from '../../../src/ui/carnets/Choisir';

beforeEach(() => { localStorage.clear(); });
afterEach(cleanup);

function Hote(p: { initial?: string; titreCarnet?: string; libelleEnvoi?: string; envoyes?: string[] }) {
  const [t, setT] = useState(p.initial ?? '');
  return <ChampCarnet valeur={t} onChange={setT} titreCarnet={p.titreCarnet} libelleEnvoi={p.libelleEnvoi}
    onEnvoyer={() => { p.envoyes?.push(t); setT(''); }} />;
}

describe('L-45 : le brouillon du champ survit au rechargement', () => {
  it('le texte tapé revient à la réouverture du même carnet, et part après l’envoi', async () => {
    const u = userEvent.setup();
    const a = render(<Hote titreCarnet="Évier inox" />);
    await u.type(screen.getByRole('textbox'), 'demander un devis');
    a.unmount();
    render(<Hote titreCarnet="Évier inox" />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('demander un devis');
    await u.click(screen.getByRole('button', { name: 'Ajouter' }));
    cleanup();
    render(<Hote titreCarnet="Évier inox" />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
  });
  it('un autre carnet n’hérite pas du brouillon', async () => {
    const u = userEvent.setup();
    const a = render(<Hote titreCarnet="Évier inox" />);
    await u.type(screen.getByRole('textbox'), 'brouillon évier');
    a.unmount();
    render(<Hote titreCarnet="Ventilation" />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
  });
});

describe('L-47 : le focus reste dans le champ après Ajouter', () => {
  it('Ajouter au bouton puis frappe suivante possible', async () => {
    const u = userEvent.setup();
    const envoyes: string[] = [];
    render(<Hote titreCarnet="Évier inox" envoyes={envoyes} />);
    const champ = screen.getByRole('textbox');
    await u.type(champ, 'une note');
    await u.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(envoyes).toEqual(['une note']);
    expect(document.activeElement).toBe(champ);
  });
});

describe('L-46 : renommer', () => {
  it('le champ du bas dit « titre », pas « Ajouter à… »', () => {
    render(<Hote titreCarnet="Évier inox" libelleEnvoi="Renommer" />);
    const ph = (screen.getByRole('textbox') as HTMLTextAreaElement).placeholder;
    expect(ph).not.toMatch(/Ajouter/);
    expect(ph).toMatch(/titre/i);
  });
  it('un titre vide est refusé en mots', () => {
    const base = { titre: 'Évier inox', aides: {} as never, onRenommer: vi.fn(), onAnnuler: vi.fn() };
    const { container } = render(<RenommerCarnet {...base} champBas={{ valeur: '  ' }} />);
    expect(container.textContent).toMatch(/Écris un titre/);
    cleanup();
    const b = render(<RenommerCarnet {...base} champBas={{ valeur: 'Évier' }} />);
    expect(b.container.textContent).not.toMatch(/Écris un titre/);
  });
});

describe('L-44 : Choisir un article au-dessus du budget max', () => {
  const art = (prix: number) => ({ id: 'a1', nom: 'Frigo pro', vendeur: 'Frigoshop', prixCentimes: prix, devise: 'CHF', valeurs: {}, lecture: 'lue' });
  const carnet = (texte: string) => ({ criteres: [{ id: 'k1', texte, origine: 'vous' }], facons: [], articles: [art(249560)], choix: undefined });
  const rendre = (prix: number, texte: string) => render(<Choisir etape="choisir" titre="Frigo" onRetour={() => {}} carnet={carnet(texte) as never} article={art(prix) as never} sur={1} valeurs={[]} autres={[]} onChoisir={() => {}} onEcarter={() => {}} />);
  it('dit le dépassement avant le choix', () => {
    rendre(249560, 'Budget max 400 CHF');
    const n = screen.getByRole('note');
    expect(n.textContent).toMatch(/2 495,6 CHF/);
    expect(n.textContent).toMatch(/400 CHF/);
  });
  it('rien quand le prix tient dans le budget', () => {
    rendre(35000, 'Budget max 400 CHF');
    expect(screen.queryByRole('note')).toBeNull();
  });
});
