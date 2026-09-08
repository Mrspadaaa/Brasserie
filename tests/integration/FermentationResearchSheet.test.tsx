import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const api = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('../../src/services/fermentationResearch', () => ({ loadFermentationResearch: api.load }));
import { FermentationResearchSheet } from '../../src/ui/FermentationResearchSheet';

afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('fermentation research in the authenticated app', () => {
  it('shows an authorization error without a public fallback, and can retry', async () => {
    api.load.mockRejectedValueOnce({ code: 'functions/unauthenticated' }).mockResolvedValueOnce('# Rapport privé\nRecherche\n\nUne conclusion [sourcée](https://example.test/study).');
    render(<FermentationResearchSheet onClose={() => {}} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Connecte-toi avec le compte autorisé');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="/research/"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('heading', { name: 'Rapport privé' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'sourcée' })).toHaveAttribute('href', 'https://example.test/study');
  });
  it('renders report text safely and discards it when the sheet is closed', async () => {
    api.load.mockResolvedValue('# Rapport privé\nDate\n\n<script>unsafe()</script> [refusé](javascript:alert(1))');
    const close = vi.fn();
    const first = render(<FermentationResearchSheet onClose={close} />);
    await screen.findByRole('heading', { name: 'Rapport privé' });
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(close).toHaveBeenCalledOnce();
    first.unmount();
    api.load.mockRejectedValueOnce({ code: 'functions/permission-denied' });
    render(<FermentationResearchSheet onClose={close} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('compte autorisé');
    expect(screen.queryByRole('heading', { name: 'Rapport privé' })).not.toBeInTheDocument();
    expect(api.load).toHaveBeenCalledTimes(2);
  });
});
