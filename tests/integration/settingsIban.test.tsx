import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { SettingsModal } from '../../src/components/SettingsModal';
import { brewerJobs } from '../../src/services/brewerJobs';

afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

// AM-66 (08.11) : un IBAN faux se voit toujours ; seul un IBAN TAPÉ faux bloque l'enregistrement. Un IBAN déjà là (enregistré, ou celui de la
// configuration de l'app) n'empêche jamais de sauver un autre réglage : sinon une clé de contrôle fausse dans la config bloquait toute la page.
const IBAN_FAUX = 'CH93 0076 2011 6238 5295 8'; // l'exemple officiel, dernier chiffre changé : reste modulo 97 ≠ 1
const IBAN_JUSTE = 'CH93 0076 2011 6238 5295 7';

const ouvrir = (iban: string) => {
  vi.spyOn(StorageService, 'confirmPendingWrites').mockResolvedValue();
  const saved = vi.spyOn(StorageService, 'saveConfig').mockImplementation(() => {});
  render(<SettingsModal isOpen onClose={vi.fn()} config={{ ...defaultConfig, company: { ...defaultConfig.company, iban } }} onConfigUpdated={vi.fn()} onOpenAuditLogs={vi.fn()} />);
  return saved;
};
const sauver = () => act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' })));

describe('Réglages : l’IBAN de la brasserie', () => {
  it('un IBAN faux DÉJÀ enregistré est signalé mais n’empêche pas de sauver', async () => {
    const saved = ouvrir(IBAN_FAUX);
    expect(screen.getByRole('alert')).toHaveTextContent(/IBAN n’est pas valide/);
    await sauver();
    expect(saved).toHaveBeenCalledTimes(1);
  });
  it('un IBAN faux TAPÉ bloque l’enregistrement, avec le message ; corrigé, il passe', async () => {
    const saved = ouvrir('');
    const champ = screen.getByLabelText('IBAN Brasserie (factures par virement)');
    fireEvent.change(champ, { target: { value: IBAN_FAUX } });
    await sauver();
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getAllByText(/IBAN n’est pas valide/).length).toBeGreaterThan(0);
    fireEvent.change(champ, { target: { value: IBAN_JUSTE } });
    await sauver();
    expect(saved).toHaveBeenCalledTimes(1);
  });
});
