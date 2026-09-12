import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  startBackupExport: vi.fn(), exportNextBackupVolume: vi.fn(), getPendingBackupExport: vi.fn(),
  inspectBackupFiles: vi.fn(), restoreInspectedBackup: vi.fn(),
  migrateLegacyOriginals: vi.fn(),
}));
vi.mock('../../src/services/backupTransfer', () => api);
vi.mock('../../src/services/financeDocumentMigration', () => ({ migrateLegacyOriginals: api.migrateLegacyOriginals }));
import { BackupPanel } from '../../src/ui/BackupPanel';
import { SettingsModal } from '../../src/components/SettingsModal';
import { defaultConfig } from '../../src/services/storage';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';

const checkedArchive = {
  exportedAt: '2026-09-09T12:00:00Z', volumeCount: 2, documentCount: 180, originalCount: 12,
  source: 'archive' as const, warnings: ['Les documents accessibles par un lien externe restent sur leur service d’origine.'],
};
const fileA = new File(['volume a'], 'sauvegarde-volume-1.zip', { type: 'application/zip' });
const fileB = new File(['volume b'], 'sauvegarde-volume-2.zip', { type: 'application/zip' });
const select = (files: File[]) => fireEvent.change(screen.getByLabelText('Fichiers de sauvegarde'), { target: { files } });

beforeEach(() => {
  vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
  Object.values(api).forEach(mock => mock.mockReset());
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test-backup') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Sauvegardes : préparation et restauration explicites', () => {
  it('bloque sauvegarde et fermeture pendant une migration, sans confondre les deux états', async () => {
    let complete!: () => void;
    api.migrateLegacyOriginals.mockImplementation(() => new Promise<void>(resolve => { complete = resolve; }));
    vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-drive-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();
    render(<SettingsModal isOpen onClose={vi.fn()} config={defaultConfig} onConfigUpdated={vi.fn()} onOpenAuditLogs={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button', { name: /Sauvegardes/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer les anciens justificatifs' }));
    await waitFor(() => expect(api.migrateLegacyOriginals).toHaveBeenCalledOnce());
    expect(screen.getByRole('button', { name: 'Préparer ma sauvegarde' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choisir les fichiers de sauvegarde' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mettre en pause après ce fichier' })).toBeEnabled();
    await act(async () => complete());
    expect(screen.getByRole('button', { name: 'Préparer ma sauvegarde' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeEnabled();
  });
  it('propose une reconnexion explicite après expiration de Drive sans ouvrir de popup automatiquement', async () => {
    const reconnect = vi.spyOn(FirebaseAuthService, 'refreshDriveAccess').mockResolvedValue({ success: true });
    api.inspectBackupFiles.mockResolvedValue(checkedArchive);
    api.restoreInspectedBackup.mockRejectedValue(Object.assign(Error('Reconnecte Google Drive pour copier ce justificatif.'), { code: 'drive/auth-required' }));
    render(<BackupPanel/>);
    select([fileA, fileB]);
    await screen.findByRole('button', { name: 'Confirmer la restauration' });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la restauration' }));
    await screen.findByRole('alert');
    expect(reconnect).not.toHaveBeenCalled();
    const reconnectButton = screen.getByRole('button', { name: 'Reconnecter Google Drive' });
    await waitFor(() => expect(reconnectButton).toBeEnabled());
    fireEvent.click(reconnectButton);
    await screen.findByText(/Google Drive est reconnecté/);
    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(api.restoreInspectedBackup).toHaveBeenCalledTimes(1);
  });
  it('vérifie tous les volumes puis attend la confirmation finale avant de modifier les données', async () => {
    let validated!: (value: typeof checkedArchive) => void;
    api.inspectBackupFiles.mockReturnValue(new Promise(resolve => { validated = resolve; }));
    api.restoreInspectedBackup.mockResolvedValue({ changed: 173, journalsPreserved: 3, operationalPreserved: 7, complete: true });
    const busy = vi.fn(); render(<BackupPanel onBusyChange={busy}/>);
    select([fileB, fileA]);
    expect(api.inspectBackupFiles.mock.calls[0][0]).toEqual([fileB, fileA]);
    expect(screen.queryByRole('button', { name: 'Confirmer la restauration' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choisir les fichiers de sauvegarde' })).toBeDisabled();
    expect(api.restoreInspectedBackup).not.toHaveBeenCalled();
    await act(async () => validated(checkedArchive));
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(checkedArchive.warnings[0])).toBeInTheDocument();
    expect(api.restoreInspectedBackup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la restauration' }));
    await waitFor(() => expect(screen.getByText(/Restauration confirmée : 173 éléments/)).toBeInTheDocument());
    expect(screen.getByText(/7 fiches de stock et de production ont conservé leur état actuel/)).toBeInTheDocument();
    expect(api.restoreInspectedBackup.mock.calls[0][0]).toBe(checkedArchive);
    expect(busy).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('button', { name: 'Confirmer la restauration' })).not.toBeInTheDocument();
  });

  it('retire une ancienne sélection valide si les nouveaux fichiers sont incomplets ou corrompus', async () => {
    api.inspectBackupFiles.mockResolvedValueOnce(checkedArchive).mockRejectedValueOnce(new Error('Volume 2 manquant. Sélectionne les deux volumes de cette sauvegarde.'));
    render(<BackupPanel/>); select([fileA, fileB]);
    await screen.findByRole('button', { name: 'Confirmer la restauration' });
    select([fileA]);
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Volume 2 manquant');
    expect(screen.queryByRole('button', { name: 'Confirmer la restauration' })).not.toBeInTheDocument();
    expect(api.restoreInspectedBackup).not.toHaveBeenCalled();
  });

  it('accepte un ancien JSON, permet d’annuler et reprend une restauration interrompue avec la même inspection', async () => {
    const legacy = { ...checkedArchive, volumeCount: 1, source: 'legacy', warnings: [] };
    api.inspectBackupFiles.mockResolvedValue(legacy);
    api.restoreInspectedBackup.mockRejectedValueOnce(new Error('Connexion interrompue.')).mockResolvedValueOnce({ changed: 180, journalsPreserved: 0, complete: true });
    render(<BackupPanel/>);
    const file = new File(['{}'], 'ancienne-copie.json', { type: 'application/json' });
    select([file]); await screen.findByText('Ancienne sauvegarde JSON vérifiée');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(api.restoreInspectedBackup).not.toHaveBeenCalled();
    select([file]); await screen.findByText('Ancienne sauvegarde JSON vérifiée');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la restauration' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Reprends avec les mêmes fichiers');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre cette restauration' }));
    await screen.findByText(/Restauration confirmée : 180 éléments/);
    expect(api.restoreInspectedBackup.mock.calls[0][0]).toBe(legacy);
    expect(api.restoreInspectedBackup.mock.calls[1][0]).toBe(legacy);
  });

  it('garde la fenêtre ouverte pendant la vérification et distingue la sauvegarde des réglages', async () => {
    let validated!: (value: typeof checkedArchive) => void;
    api.inspectBackupFiles.mockReturnValue(new Promise(resolve => { validated = resolve; }));
    const close = vi.fn();
    render(<SettingsModal isOpen onClose={close} config={defaultConfig} onConfigUpdated={vi.fn()} onOpenAuditLogs={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button', { name: /Sauvegardes/ }));
    expect(screen.queryByRole('button', { name: 'Sauvegarder', exact: true })).not.toBeInTheDocument();
    select([fileA, fileB]);
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Fiscalité/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Déplacer les anciens justificatifs' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    await act(async () => validated(checkedArchive));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(api.restoreInspectedBackup).not.toHaveBeenCalled();
  });

  it('garde le volume courant à la réouverture et exige son enregistrement avant de préparer la suite', async () => {
    const session = { finished: false };
    api.startBackupExport.mockResolvedValue(session);
    const first = { blob: new Blob(['one']), fileName: 'brasserie-1.zip', volume: 1, final: false, documentCount: 100, totalDocuments: 100, exportedAt: checkedArchive.exportedAt };
    const last = { ...first, blob: new Blob(['two']), fileName: 'brasserie-2.zip', volume: 2, final: true, documentCount: 80, totalDocuments: 180 };
    api.exportNextBackupVolume.mockRejectedValueOnce(new Error('Cette copie serveur a expiré. Recommence une sauvegarde complète.')).mockResolvedValueOnce(first).mockResolvedValueOnce(last);
    const { unmount } = render(<BackupPanel/>);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer ma sauvegarde' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer avec une nouvelle copie' }));
    await screen.findByRole('link', { name: 'Enregistrer le volume 1' });
    expect(screen.getByText(/100 préparés jusqu’ici ; la suite reste à préparer/)).toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Préparer le volume suivant' });
    expect(next).toBeDisabled();
    expect(screen.queryByText(/Tu as confirmé avoir enregistré/)).not.toBeInTheDocument();
    unmount(); render(<BackupPanel/>);
    expect(screen.getByRole('link', { name: 'Enregistrer le volume 1' })).toHaveAttribute('download', 'brasserie-1.zip');
    expect(api.startBackupExport).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('checkbox', { name: /J’ai enregistré ce volume/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Préparer le volume suivant' }));
    await screen.findByRole('link', { name: 'Enregistrer le volume 2' });
    expect(screen.getByText(/180 éléments dans la sauvegarde complète/)).toBeInTheDocument();
    expect(api.exportNextBackupVolume.mock.calls[2][0]).toBe(session);
    expect(screen.queryByRole('link', { name: 'Enregistrer le volume 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /J’ai enregistré ce volume/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /J’ai enregistré ce volume/ }));
    expect(screen.getByText(/Tu as confirmé avoir enregistré les 2 volumes/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Préparer le volume suivant' })).not.toBeInTheDocument();
  });
});
