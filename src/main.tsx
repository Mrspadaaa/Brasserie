import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

type ReusableRoot = ReturnType<typeof ReactDOM.createRoot>;
const rootHolder = window as Window & { __laffineeReactRoot__?: ReusableRoot };
const root = rootHolder.__laffineeReactRoot__ ?? (rootHolder.__laffineeReactRoot__ = ReactDOM.createRoot(document.getElementById('root')!));

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

type BootstrapFailureProps = {
  onRetry?: () => void;
};

export function BootstrapFailure({ onRetry = () => window.location.reload() }: BootstrapFailureProps) {
  return (
    <main className="min-h-screen bg-cave-950 px-4 py-6 text-cave-50 flex items-center justify-center">
      <section
        className="w-full max-w-md rounded-panel border border-alert/30 bg-cave-900/80 p-4"
        role="alert"
        aria-labelledby="bootstrap-error-title"
      >
        <h1 id="bootstrap-error-title" className="text-base font-semibold">
          Impossible de charger la brasserie
        </h1>
        <p className="mt-2 text-sm text-cave-200">
          Le démarrage a rencontré un problème. Recharge la page pour réessayer.
        </p>
        <button
          type="button"
          autoFocus
          onClick={onRetry}
          className="mt-4 min-h-8 rounded-control border border-ebc-straw bg-ebc-straw px-3 text-sm font-medium text-cave-950 transition-colors hover:bg-ebc-gold focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ebc-straw"
        >
          Recharger la page
        </button>
      </section>
    </main>
  );
}

root.render(
  <React.StrictMode>
    <div className="min-h-screen bg-cave-950 flex items-center justify-center px-4 text-sm text-cave-400" role="status">
      Chargement de la brasserie…
    </div>
  </React.StrictMode>,
);

async function bootstrap() {
  if (previewMode === 'design') {
    const { DesignPreview } = await import('./design/DesignPreview');
    root.render(<React.StrictMode><DesignPreview /></React.StrictMode>);
    return;
  }
  if (previewMode === 'stock') {
    const { StockPreview } = await import('./design/StockPreview');
    root.render(<React.StrictMode><StockPreview /></React.StrictMode>);
    return;
  }
  if (previewMode === 'brew') {
    const { BrewPreview } = await import('./design/BrewPreview');
    root.render(<React.StrictMode><BrewPreview /></React.StrictMode>);
    return;
  }

  const [{ App }, { connectEmulators, initAppCheck }] = await Promise.all([
    import('./App'),
    import('./services/firebase'),
  ]);
  // App Check et les émulateurs doivent être branchés avant le premier rendu
  // de l'application, donc avant toute lecture ou écriture Firestore.
  connectEmulators();
  initAppCheck();
  root.render(<React.StrictMode><App /></React.StrictMode>);
}

void bootstrap().catch((error: unknown) => {
  console.error('[L’Affinée] Échec du démarrage', error);
  root.render(
    <React.StrictMode>
      <BootstrapFailure />
    </React.StrictMode>,
  );
});
