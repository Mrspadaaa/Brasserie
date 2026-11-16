import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../src/components/Header';
import { PagePlus } from '../../src/components/plus/PagePlus';
import { StorageService } from '../../src/services/storage';

// TE-61 : « Saisie au nom de Gaëtan » ne bascule plus d'un toucher. Il signe toutes les écritures suivantes :
// une confirmation d'abord, annulable.
// m3 : le menu ⋮ n'existe plus. L'en-tête porte le duo d'avatars (qui ouvre « Plus ») ; la bascule « Je saisis » vit dans la page Plus.

const rendreEntete = (onOpenPlus: () => void = () => {}) => render(
  <Header
    globalTimeFilter="all"
    onChangeGlobalTimeFilter={() => {}}
    onOpenPlus={onOpenPlus}
    onOpenSearch={() => {}}
    onGoHome={() => {}}
  />,
);

/** La page Plus branchée comme l'app : le signataire se change par StorageService, comme dans App. */
const Plus: React.FC = () => {
  const [, relire] = React.useReducer((n: number) => n + 1, 0);
  return (
    <PagePlus
      courant={StorageService.getCurrentUser()}
      onSigner={cible => { StorageService.setCurrentUser(cible); relire(); }}
      periode="all"
      onChoisirPeriode={() => {}}
      logs={[]}
      batches={[]}
      pendingTodosCount={0}
      horsConnexion={false}
      onBack={() => {}}
      onAssistant={() => {}}
      onAtelier={() => {}}
      onConversations={() => {}}
      onJournal={() => {}}
      onReglages={() => {}}
    />
  );
};
const rendre = () => render(<Plus />);
/** Toucher la personne qui ne signe pas : la carte « Aricia » quand Gaëtan signe. */
const toucherAricia = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^Aricia/ }));
};

describe('En-tête : le duo d’avatars remplace le menu ⋮', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it('le duo dit qui signe, ouvre Plus, et aucun bouton « Menu » ne reste', async () => {
    const user = userEvent.setup();
    const ouvrir = vi.fn();
    rendreEntete(ouvrir);
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    const duo = screen.getByRole('button', { name: 'Plus : saisie au nom de Gaëtan' });
    await user.click(duo);
    expect(ouvrir).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Rechercher (⌘K)' })).toBeInTheDocument();
  });
});

describe('Page Plus : changer de signataire', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it('un toucher sur « Je saisis » ne change pas de signataire sans confirmation', async () => {
    const user = userEvent.setup();
    rendre();
    expect(StorageService.getCurrentUser()).toBe('Gaëtan');
    await toucherAricia(user);
    expect(StorageService.getCurrentUser()).toBe('Gaëtan');
    expect(screen.getByText('Qui signe les écritures ?')).toBeTruthy();
  });

  // VI-12 (rejeu b47cd90b n° 12) : la boîte vivait dans l'en-tête, qui porte `backdrop-blur-md` (bloc conteneur de tout
  // `position: fixed`) ; elle se centrait dans les 48 px du bandeau. Elle doit vivre hors de la page Plus aussi, sous <body>,
  // pour que `fixed inset-0` mesure la fenêtre et non une section défilante.
  it('la boîte de confirmation est hors de la page Plus : sa position fixe mesure la fenêtre', async () => {
    const user = userEvent.setup();
    const { container } = rendre();
    await toucherAricia(user);
    const boite = screen.getByRole('dialog');
    expect(container.querySelector('[data-page-plus]')).not.toBeNull();
    expect(boite.closest('[data-page-plus]')).toBeNull();
    expect(boite.closest('header')).toBeNull();
    expect(boite.parentElement?.parentElement).toBe(document.body);
    // Le fond fixe couvre la fenêtre ; la question et les deux boutons sont dans la boîte.
    expect(boite).toHaveTextContent('Qui signe les écritures ?');
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('annuler garde le signataire', async () => {
    const user = userEvent.setup();
    rendre();
    await toucherAricia(user);
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(StorageService.getCurrentUser()).toBe('Gaëtan');
  });

  it('confirmer passe à Aricia', async () => {
    const user = userEvent.setup();
    rendre();
    await toucherAricia(user);
    await user.click(screen.getByRole('button', { name: 'Saisir au nom d’Aricia' }));
    expect(StorageService.getCurrentUser()).toBe('Aricia');
  });
});
