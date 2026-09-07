import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewerActivity } from '../../src/ui/BrewerActivity';
import { BrewerChat } from '../../src/ui/BrewerChat';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { brewerJobs } from '../../src/services/brewerJobs';
import { brewerAppScreen } from '../../functions/src/brewerAppScreens';
import { BottomNav } from '../../src/components/BottomNav';
import type { BrewerJob } from '../../functions/src/companionTypes';

vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { userKey: vi.fn(), history: vi.fn(), activity: vi.fn(), reset: vi.fn(), submit: vi.fn(), status: vi.fn(), markRead: vi.fn() },
  brewerChatError: () => 'Erreur de connexion.'
}));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, subtitle, children, footer, onClose }: any) => open ? <div role="dialog" aria-label={title}>
    <span>{subtitle}</span>{children}{footer}<button onClick={onClose}>Fermer {title}</button>
  </div> : null
}));
const job = (id: string, recipe = 'REC-A'): BrewerJob => ({
  id: id.repeat(64), operationId: `operation-${id.repeat(20)}`, scope: { kind: 'recipe', id: recipe },
  generation: 0, question: `Question ${id}`, label: recipe, status: 'running', stage: 'analysis',
  createdAt: Number(id) || 1, updatedAt: 1, attempt: 1
});
beforeEach(() => {
  brewerJobs.stop();
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(api.userKey).mockResolvedValue('navigation-test');
  vi.mocked(api.history).mockResolvedValue([]);
  vi.mocked(api.activity).mockImplementation(async () => brewerJobs.snapshot().jobs);
  vi.mocked(api.markRead).mockResolvedValue(undefined);
  vi.mocked(api.status).mockResolvedValue({});
  vi.mocked(api.reset).mockResolvedValue({ generation: 1 });
  vi.mocked(api.submit).mockImplementation(async (input) => ({ job: {
    ...job('1'), scope: input.scope, operationId: input.operationId, question: input.question
  } }));
});
afterEach(() => { cleanup(); brewerJobs.stop(); });
async function plus() {
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le compagnon brasseur' }));
  await waitFor(() => expect(screen.queryByText('Chargement des échanges…')).not.toBeInTheDocument());
}
async function ask() {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Peux-tu vérifier ?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
  await waitFor(() => expect(api.submit).toHaveBeenCalled());
}
describe('Raccourci contextuel et gestion des conversations', () => {
  it('conserve toutes les actions du bouton + et sépare clairement le compagnon', async () => {
    const create = vi.fn(), quick = vi.fn();
    render(<><BrewerActivity context={brewerAppScreen('stocks', 'materiel')} />
      <BottomNav activeTab="stocks" onChangeTab={() => {}}
        action={{ intent: 'newEquipment', label: 'Nouveau matériel' }}
        onAction={create} onOpenQuickAction={quick} criticalStockCount={0} /></>);
    const add = screen.getByRole('button', { name: 'Nouveau matériel' });
    expect(add).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ouvrir le compagnon brasseur' })).toBeVisible();
    fireEvent.click(add);
    expect(create).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.contextMenu(add);
    expect(quick).toHaveBeenCalledOnce();
    await plus();
    expect(screen.getByRole('dialog')).toHaveTextContent('Matériel');
    expect(create).toHaveBeenCalledOnce();
  });
  it('ouvre le contexte de l’écran courant et le change après navigation', async () => {
    const view = render(<BrewerActivity context={brewerAppScreen('stocks', 'materiel')} />);
    await plus();
    expect(screen.getByRole('dialog')).toHaveTextContent('Matériel');
    await ask();
    expect(api.submit).toHaveBeenCalledWith(expect.objectContaining({ scope: { kind: 'app', id: 'stocks-materiel' }, editableTargets: [] }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer Compagnon brasseur' }));
    view.rerender(<BrewerActivity context={brewerAppScreen('finances')} />);
    await plus();
    expect(screen.getByRole('dialog')).toHaveTextContent('Finances');
    expect(api.history).toHaveBeenLastCalledWith({ kind: 'app', id: 'finances' });
  });
  it('garde le brouillon actuel et ses callbacks en ouvrant le chat de la page', async () => {
    const draftApply = vi.fn();
    const renderPage = (name: string) => <><BrewerActivity /><BrewerChat scope={{ kind: 'draft', id: 'REC-DRAFT' }} label={name}
      draft={{ name, volumeL: 24 }} phase="Eau et sels" onDraftApply={draftApply} /></>;
    const view = render(renderPage('Avant'));
    view.rerender(renderPage('Brouillon actuel'));
    await plus();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('Brouillon actuel');
    expect(screen.getByRole('dialog')).toHaveTextContent('Brouillon en cours');
    await ask();
    expect(api.submit).toHaveBeenCalledWith(expect.objectContaining({ draft: { name: 'Brouillon actuel', volumeL: 24 }, phase: 'Eau et sels', editableTargets: ['recipe'] }));
    expect(draftApply).not.toHaveBeenCalled();
  });
  it('prend la fiche la plus récente, puis retrouve le contexte dessous après fermeture', async () => {
    const renderPage = (overlay: boolean) => <><BrewerActivity />
      <BrewerChat scope={{ kind: 'recipe', id: 'REC-A' }} label="Recette ouverte" />
      {overlay && <BrewerChat scope={{ kind: 'batch', id: 'LOT-A' }} label="Brassin ouvert" localJournal={{ currentIndex: 2 }} />}
    </>;
    const view = render(renderPage(true));
    await plus();
    expect(api.history).toHaveBeenLastCalledWith({ kind: 'batch', id: 'LOT-A' });
    fireEvent.click(screen.getByRole('button', { name: 'Fermer Compagnon brasseur' }));
    view.rerender(renderPage(false));
    await plus();
    expect(api.history).toHaveBeenLastCalledWith({ kind: 'recipe', id: 'REC-A' });
  });
  it('regroupe les échanges et supprime seulement la conversation confirmée, y compris ses travaux en cours', async () => {
    const a = job('1'), b = job('2'), other = job('3', 'REC-B');
    b.scope = { kind: 'draft', id: a.scope.id };
    vi.mocked(api.activity).mockResolvedValue([a, b, other]);
    let resolve!: (value: { generation: number }) => void;
    vi.mocked(api.reset).mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<BrewerActivity />);
    fireEvent.click(await screen.findByRole('button', { name: /Compagnon : 3 questions/ }));
    expect(screen.getAllByRole('button', { name: /Supprimer la conversation/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la conversation REC-A' }));
    expect(api.reset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer les échanges' }));
    expect(brewerJobs.snapshot().jobs).toHaveLength(3);
    await act(async () => resolve({ generation: 1 }));
    expect(brewerJobs.snapshot().jobs).toEqual([expect.objectContaining({ scope: other.scope })]);
    await act(async () => { brewerJobs.merge([a, b]); });
    expect(screen.queryByRole('button', { name: 'Supprimer la conversation REC-A' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer la conversation REC-B' })).toBeVisible();
  });
  it('garde une suppression échouée visible et réutilise son opération lors de la reprise', async () => {
    vi.mocked(api.activity).mockResolvedValue([job('1')]);
    vi.mocked(api.reset).mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({ generation: 1 });
    render(<BrewerActivity />);
    fireEvent.click(await screen.findByRole('button', { name: /Compagnon : 1 question/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la conversation REC-A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer les échanges' }));
    await screen.findByText(/Suppression non confirmée/);
    expect(brewerJobs.snapshot().jobs).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer les échanges' }));
    await screen.findByText('Conversation supprimée.');
    expect(vi.mocked(api.reset).mock.calls[1]).toEqual(vi.mocked(api.reset).mock.calls[0]);
    expect(brewerJobs.snapshot().jobs).toHaveLength(0);
  });
  it('permet de gérer les conversations depuis le chat même après lecture des réponses', async () => {
    const done = { ...job('1'), status: 'done' as const, readAt: 1 };
    vi.mocked(api.activity).mockResolvedValue([done]);
    render(<BrewerActivity />);
    expect(await screen.findByRole('button', { name: 'Compagnon : Mes conversations' })).toBeVisible();
    await plus();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Mes conversations' })); });
    expect(screen.getByRole('dialog', { name: 'Mes conversations' })).toBeVisible();
  });
});
