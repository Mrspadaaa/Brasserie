// La loupe du justificatif (10.11, « On devrait pouvoir zoomer dans l'image de la facture, c'est illisible comme ça on peut pas contrôler »).
// L'app bloque le zoom du navigateur (`user-scalable=no`) : la photo s'ouvre en plein écran, pincer ou toucher deux fois pour agrandir,
// glisser pour se déplacer. Bibliothèque standard `react-zoom-pan-pinch` (L29), pas de geste écrit à la main.
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Minus, Plus, X } from 'lucide-react';

export function Loupe(p: { url: string; nom: string; onFermer: () => void }) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); p.onFermer(); } };
    window.addEventListener('keydown', touche, true);
    return () => window.removeEventListener('keydown', touche, true);
  }, [p]);
  const bouton = 'flex size-9 items-center justify-center rounded-control border border-cave-600 bg-cave-950/90 text-cave-50';
  return createPortal(<div data-dp="loupe" role="dialog" aria-modal="true" aria-label={`Justificatif agrandi : ${p.nom}`} className="fixed inset-0 z-[80] bg-cave-950">
    <TransformWrapper minScale={1} maxScale={8} doubleClick={{ mode: 'toggle', step: 2.5 }} wheel={{ step: 0.2 }} centerOnInit>
      {({ zoomIn, zoomOut }) => <>
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
          <img src={p.url} alt={`Justificatif source : ${p.nom}`} className="h-full w-full object-contain" draggable={false}/>
        </TransformComponent>
        <div className="absolute right-2 flex gap-1.5" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
          <button type="button" aria-label="Réduire" onClick={() => zoomOut()} className={bouton}><Minus size={18}/></button>
          <button type="button" aria-label="Agrandir" onClick={() => zoomIn()} className={bouton}><Plus size={18}/></button>
          <button type="button" aria-label="Fermer la loupe" onClick={p.onFermer} className={bouton}><X size={20}/></button>
        </div>
      </>}
    </TransformWrapper>
  </div>, document.body);
}
