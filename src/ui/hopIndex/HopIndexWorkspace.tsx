import React, { useEffect, useState } from 'react';
import { BookOpen, FlaskConical, SlidersHorizontal, Target } from 'lucide-react';
import { HopIndexPanel } from './HopIndexPanel';
import { HopKnowledgePanel } from './HopKnowledgePanel';
import { HopSearchPanel } from './HopSearchPanel';
import { HopTastingsPanel } from './HopTastingsPanel';
export function HopIndexWorkspace(props: React.ComponentProps<typeof HopIndexPanel>) {
  const [view, setView] = useState('index');
  useEffect(() => { if (props.createRequest?.kind === 'newHopVariety') setView('index'); }, [props.createRequest?.at]);
  return <div data-hop-scroll className="flex-1 min-h-0 overflow-y-auto space-y-5 pb-24">
    <nav aria-label="Index houblon" className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[
        { id: 'index', name: 'Variétés et lots', Icon: BookOpen },
        { id: 'search', name: 'Atelier aromatique', Icon: Target },
        { id: 'tastings', name: 'Dégustations', Icon: FlaskConical },
        { id: 'knowledge', name: 'Sources et modèles', Icon: SlidersHorizontal }
      ].map(({ id, name, Icon }) => <button key={id} onClick={() => setView(id)}
        className={`min-h-touch px-3 py-2 flex items-center gap-2 rounded-control border text-sm text-left ${view === id ? 'border-ebc-straw/60 bg-ebc-straw/10 text-ebc-straw' : 'border-cave-800 bg-cave-900 text-cave-200 hover:bg-cave-850'}`}
        aria-current={view === id ? 'page' : undefined}>
        <Icon size={17} className="shrink-0" aria-hidden="true" />{name}
      </button>)}
    </nav>
    {view === 'index' && <HopIndexPanel {...props} />}{view === 'search' && <HopSearchPanel />}{view === 'tastings' && <HopTastingsPanel />}{view === 'knowledge' && <HopKnowledgePanel />}
  </div>;
}
