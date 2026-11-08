import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../src/components/Header';
import { StorageService } from '../../src/services/storage';
import { defaultConfig } from '../../src/services/storage';

// TE-61 : « Saisie au nom de Gaëtan » ne bascule plus d'un toucher. Il signe toutes les écritures suivantes :
// une confirmation d'abord, annulable.

const rendre = () => render(
  <Header
    config={defaultConfig}
    globalTimeFilter="all"
    onChangeGlobalTimeFilter={() => {}}
    onOpenSettings={() => {}}
    onOpenAuditLogs={() => {}}
    onNavigateToBrewAssistant={() => {}}
    onNavigateToCreativeLab={() => {}}
    onOpenSearch={() => {}}
    onGoHome={() => {}}
  />,
);

describe('Header : changer de signataire', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it('un toucher sur « Saisie au nom de » ne change pas de signataire sans confirmation', async () => {
    const user = userEvent.setup();
    rendre();
    expect(StorageService.getCurrentUser()).toBe('Gaëtan');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('button', { name: /Saisie au nom de/ }));
    expect(StorageService.getCurrentUser()).toBe('Gaëtan');
    expect(screen.getByText(/Saisir au nom de Aricia \?/)).toBeTruthy();
  });

  it('annuler garde le signataire', async () => {
    const user = userEvent.setup();
    rendre();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('button', { name: /Saisie au nom de/ }));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(StorageService.getCurrentUser()).toBe('Gaëtan');
  });

  it('confirmer passe à Aricia', async () => {
    const user = userEvent.setup();
    rendre();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('button', { name: /Saisie au nom de/ }));
    await user.click(screen.getByRole('button', { name: 'Saisir au nom de Aricia' }));
    expect(StorageService.getCurrentUser()).toBe('Aricia');
  });
});
