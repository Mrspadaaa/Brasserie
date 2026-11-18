import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { SettingsModal } from '../../src/components/SettingsModal';
import { brewerJobs } from '../../src/services/brewerJobs';
import { ibanValide } from '../../src/domain/finance/iban';

// L'exemple officiel d'un IBAN suisse, et le même au dernier chiffre changé (clé de contrôle fausse). Aucun IBAN réel dans ce fichier.
const IBAN_JUSTE = 'CH93 0076 2011 6238 5295 7';
const IBAN_FAUX = 'CH93 0076 2011 6238 5295 8';

// RL-14 : l'IBAN de repli (VITE_COMPANY_IBAN) est celui du test, pas celui de la configuration réelle.
const repli = vi.hoisted(() => ({ iban: '' }));
vi.mock('../../src/domain/companyDefaults', async importOriginal => {
  const reel = await importOriginal<typeof import('../../src/domain/companyDefaults')>();
  return { ...reel, COMPANY_FALLBACK: new Proxy(reel.COMPANY_FALLBACK, { get: (cible, cle) => cle === 'iban' ? repli.iban : (cible as any)[cle] }) };
});

afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

const ouvrir = (iban: string) => {
  vi.spyOn(StorageService, 'confirmPendingWrites').mockResolvedValue();
  render(<SettingsModal isOpen onClose={vi.fn()} config={{ ...defaultConfig, company: { ...defaultConfig.company, iban } }} onConfigUpdated={vi.fn()} onOpenAuditLogs={vi.fn()} />);
};

describe('TE-63 : un seul nom pour l’écran', () => {
  it('le titre est « Réglages », comme le menu', () => {
    repli.iban = '';
    ouvrir(IBAN_JUSTE);
    expect(screen.getByRole('heading', { name: 'Réglages' })).toBeVisible();
    expect(screen.queryByText(/Paramètres & Évolutions/)).toBeNull();
  });
});

describe('RL-14 : l’alerte IBAN à l’ouverture des Réglages › Fiscalité', () => {
  it('le contrôle (modulo 97) n’est pas en cause : l’exemple officiel passe, sa variante non', () => {
    expect(ibanValide(IBAN_JUSTE)).toBe(true);
    expect(ibanValide(IBAN_FAUX)).toBe(false);
  });

  it('un IBAN enregistré valide ne lève aucune alerte', () => {
    repli.iban = '';
    ouvrir(IBAN_JUSTE);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sans IBAN enregistré, un IBAN de configuration faux se dit venir de la configuration', () => {
    repli.iban = IBAN_FAUX;
    ouvrir('');
    expect(screen.getByRole('alert')).toHaveTextContent(/Aucun IBAN n’est enregistré dans les Réglages/);
    expect(screen.getByRole('alert')).toHaveTextContent(/configuration de l’app/);
  });

  it('un IBAN enregistré faux garde le message simple (la valeur vient bien de lui)', () => {
    repli.iban = '';
    ouvrir(IBAN_FAUX);
    expect(screen.getByRole('alert')).toHaveTextContent(/IBAN n’est pas valide/);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/Aucun IBAN n’est enregistré/);
  });
});
