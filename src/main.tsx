import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DesignPreview } from './design/DesignPreview';
import { StockPreview } from './design/StockPreview';
import { BrewPreview } from './design/BrewPreview';
import { initAppCheck, connectEmulators } from './services/firebase';
import './index.css';

// App Check et les émulateurs doivent être branchés AVANT le premier rendu,
// donc avant la moindre lecture ou écriture Firestore.
connectEmulators();
initAppCheck();

/**
 * Bancs d'essai, en développement uniquement.
 *
 * `import.meta.env.DEV` est remplacé par `false` à la compilation : ces pages et
 * leurs imports disparaissent entièrement du bundle de production. Elles sont
 * purement présentationnelles — elles ne lisent aucune donnée et ne contournent
 * aucune authentification.
 *
 *   ?preview=design → palette, typographie, primitives
 *   ?preview=stock  → écran Stocks, jusqu'à 5 000 articles
 *   ?preview=brew   → fiche recette, assistant, jour de brassage minuté
 */
const previewMode = import.meta.env.DEV
  ? new URLSearchParams(location.search).get('preview')
  : null;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {previewMode === 'design' ? (
      <DesignPreview />
    ) : previewMode === 'stock' ? (
      <StockPreview />
    ) : previewMode === 'brew' ? (
      <BrewPreview />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
