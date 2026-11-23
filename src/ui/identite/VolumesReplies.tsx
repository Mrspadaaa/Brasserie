import React, { useId, useState } from 'react';

/**
 * « Volumes · 34,7 / 35 L avant ébullition ⌄ » : le résumé « Volumes et matériel » replié sur une ligne dans la tuile Matériel
 * (r4-a ne montre à son dépli que « Fermenteur [N] L » et « ↺ profil »). Le contenu reste dans la page, caché : ses alertes et
 * ses chiffres se lisent à un toucher, et ce que les contrôles lisent dans le DOM y reste.
 */
export function VolumesReplies({ resume, children }: { resume: string; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  return (
    <div className="idn-vol">
      <button type="button" className="idn-volpli" data-role="volumes-pli" aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert((o) => !o)}>
        <span>{resume}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div id={id} className="idn-volcorps" hidden={!ouvert}>{children}</div>
    </div>
  );
}
