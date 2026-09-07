import React from 'react';
import { createRoot } from 'react-dom/client';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { BrewerChat } from '../../src/services/brewerChat';

/** Loaded only by the headless local UI check, never imported into the app. */
export function mountBatchProbe() {
  if (!import.meta.env.DEV) throw Error('Development probe only');
  const app = document.getElementById('root');
  if (app) app.style.display = 'none';
  const host = document.createElement('div');
  document.body.appendChild(host);
  BrewerChat.history = async () => [];
  BrewerChat.userKey = async () => 'sheet-probe';
  createRoot(host).render(
    <BatchDetailSheet
      batch={{
        id: 'LOT-PROBE',
        name: 'Fermentation de contrôle',
        style: 'Pale Ale',
        brewDate: '2026-09-07',
        volumeL: 24,
        status: 'fermentation'
      }}
      onClose={() => host.setAttribute('data-closed', 'true')}
    />
  );
}
