import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/App', () => {
  throw new Error('bootstrap chunk unavailable');
});

vi.mock('../../src/services/firebase', () => ({
  connectEmulators: vi.fn(),
  initAppCheck: vi.fn(),
}));

describe('bootstrap failure state', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    delete (window as Window & { __laffineeReactRoot__?: unknown }).__laffineeReactRoot__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('explains a failed dynamic import and keeps retry reachable from the keyboard', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const main = await import('../../src/main');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger la brasserie');
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[L’Affinée] Échec du démarrage',
      expect.any(Error),
    );

    const retry = vi.fn();
    const rendered = render(<main.BootstrapFailure onRetry={retry} />);
    const button = within(rendered.container).getByRole('button', { name: 'Recharger la page' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('min-h-8', 'rounded-control', 'bg-ebc-straw', 'text-cave-950', 'focus-visible:outline-ebc-straw');

    button.focus();
    expect(button).toHaveFocus();
    const user = userEvent.setup();
    await user.keyboard('{Enter}');
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
