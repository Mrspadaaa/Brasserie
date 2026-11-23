import React from 'react';
import type { Fragment } from './phrase';
import './volumes.css';

export interface SegmentCoque<T extends string> {
  value: T;
  /** Nom accessible, compteur compris (« Brassins (4) »). */
  label: string;
  court: string;
  /** Compteur en pastille ; absent : pas de pastille (jamais « 0 » pour un inconnu). */
  compteur?: number;
}

/** e11a : la barre segmentée des quatre sous-onglets, compteurs en pastilles (actif : aplat de l'app, pastille claire). */
export function SegmentsCoque<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: ReadonlyArray<SegmentCoque<T>>; onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="pv-segments" data-role="segments">
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={value === o.value} aria-label={o.label} onClick={() => onChange(o.value)}>
          {o.court}{o.compteur !== undefined && <span className="pv-n" aria-hidden="true">{o.compteur}</span>}
        </button>
      ))}
    </div>
  );
}

/** e11a : la phrase-réponse en grand (premier fragment en encre ordinaire, suite en couleur de ton). */
function PhraseReponse({ fragments }: { fragments: Fragment[] }) {
  if (!fragments.length) return null;
  const encre = (f: Fragment, i: number) => f.ton === 'hop' ? <i key={i}>{f.texte}</i> : f.ton === 'alerte' ? <u key={i}>{f.texte}</u> : <span key={i}>{f.texte}{f.fin && <> <u>{f.fin}</u></>}</span>;
  return (
    <h2 className="pv-display pv-phrase" data-role="phrase-reponse">
      {fragments.map((f, i) => <React.Fragment key={i}>{i > 0 && ', '}{encre(f, i)}</React.Fragment>)}
    </h2>
  );
}
