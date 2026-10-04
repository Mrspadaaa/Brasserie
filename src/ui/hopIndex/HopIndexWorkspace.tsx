import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, FlaskConical, SlidersHorizontal } from 'lucide-react';
import type { HopIndexPanel } from './HopIndexPanel';
import { ViewNavigation } from '../ViewNavigation';

const HopIndexPanelView = lazy(() => import('./HopIndexPanel').then(({ HopIndexPanel: Panel }) => ({ default: Panel })));
const HopKnowledgePanelView = lazy(() => import('./HopKnowledgePanel').then(({ HopKnowledgePanel: Panel }) => ({ default: Panel })));
const HopTastingsPanelView = lazy(() => import('./HopTastingsPanel').then(({ HopTastingsPanel: Panel }) => ({ default: Panel })));
const WORKSPACE_VIEWS = [
  { id: 'index', name: 'Variétés et lots', shortLabel: 'Variétés', Icon: BookOpen },
  { id: 'tastings', name: 'Dégustations', shortLabel: 'Dégustations', Icon: FlaskConical },
  { id: 'knowledge', name: 'Sources et modèles', shortLabel: 'Sources', Icon: SlidersHorizontal }
] as const;
export function HopIndexWorkspace(props: React.ComponentProps<typeof HopIndexPanel>) {
  const [view, setView] = useState<'index' | 'tastings' | 'knowledge'>('index');
  useEffect(() => { if (props.createRequest?.kind === 'newHopVariety') setView('index'); }, [props.createRequest?.at]);
  return <div data-hop-scroll className="flex-1 min-h-0 overflow-y-auto space-y-2 sm:space-y-5 pb-24">
    <ViewNavigation<'index' | 'tastings' | 'knowledge'> label="Index du houblon" value={view} onChange={setView} options={WORKSPACE_VIEWS.map(({ id, name, shortLabel }) => ({ value: id, label: name, shortLabel }))}>
    <nav aria-label="Index houblon" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {WORKSPACE_VIEWS.map(({ id, name, Icon }) => <button key={id} onClick={() => setView(id)}
        className={`min-h-touch px-3 py-2 flex items-center gap-2 rounded-control border text-sm text-left ${view === id ? 'border-ebc-straw/60 bg-ebc-straw/10 text-ebc-straw' : 'border-cave-800 bg-cave-900 text-cave-200 hover:bg-cave-850'}`}
        aria-current={view === id ? 'page' : undefined}>
        <Icon size={17} className="shrink-0" aria-hidden="true" />{name}
      </button>)}
    </nav>
    </ViewNavigation>
    <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement de cet atelier…</div>}>
      {view === 'index' && <HopIndexPanelView {...props} />}{view === 'tastings' && <HopTastingsPanelView />}{view === 'knowledge' && <HopKnowledgePanelView />}
    </Suspense>
  </div>;
}
