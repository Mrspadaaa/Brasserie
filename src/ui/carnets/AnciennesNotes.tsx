/**
 * h1, tour 2 (D2) : « Anciennes notes de l'Atelier · N », en bas de Carnet › Tout, fermé. Un toucher l'ouvre : titre, genre en mot,
 * date ; lecture seule (aucun bouton, aucune écriture). Absent si N = 0.
 */
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AncienneNote } from '../../domain/carnets/anciens';

const TITRE = 'Anciennes notes de l’Atelier';

export function AnciennesNotes({ notes }: { notes: readonly AncienneNote[] }) {
  const [ouvert, setOuvert] = useState(false);
  if (!notes.length) return null;
  return (
    <section className="cn-anciennes">
      <button type="button" className="cn-anciennes-tete" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}>
        <span className="cn-sp">{TITRE} <span className="cn-mut">·</span> <span className="cn-mono">{notes.length}</span></span>
        <ChevronDown size={18} aria-hidden className={ouvert ? 'cn-anciennes-chevron cn-ouvert' : 'cn-anciennes-chevron'} />
      </button>
      {ouvert && (
        <ul className="cn-anciennes-liste" aria-label={TITRE}>
          {notes.map(n => (
            <li key={n.id} className="cn-anciennes-ligne">
              <span className="cn-anciennes-titre">{n.titre}</span>
              <span className="cn-mut">{n.genre}{n.date ? ` · ${n.date}` : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
