import React, { Suspense } from 'react';

/** Defer the first opening while preserving the original modal state afterward. */
export function DeferredSurface({ active, children, fallback }: {
  active: boolean;
  children: React.ReactNode;
  fallback: React.ReactElement<{ children?: React.ReactNode; title?: string }>;
}) {
  const [opened, setOpened] = React.useState(active);
  React.useEffect(() => { if (active) setOpened(true); }, [active]);
  if (!active && !opened) return null;
  return <LazySurface fallback={fallback}>{children}</LazySurface>;
}

/** A failed screen download keeps navigation and saved data available. */
export class LazySurface extends React.Component<{
  children: React.ReactNode;
  resetKey?: string;
  fallback?: React.ReactElement<{ children?: React.ReactNode; title?: string }>;
}, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: Readonly<{ resetKey?: string }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    const error = <div role="alert" className="p-3 text-sm text-cave-200">
      <p>Impossible de charger cet écran. Vérifie la connexion puis recharge l’application.</p>
      <button type="button" className="mt-2 min-h-touch rounded-control bg-ebc-straw px-2 text-cave-950"
        onClick={() => window.location.reload()}>Recharger l’application</button>
    </div>;
    if (this.state.failed) return this.props.fallback
      ? React.cloneElement(this.props.fallback, { title: 'Écran indisponible', children: error })
      : error;
    return <Suspense fallback={this.props.fallback ?? <p role="status" className="p-3 text-sm text-cave-400">Chargement de l’écran…</p>}>
      {this.props.children}
    </Suspense>;
  }
}
