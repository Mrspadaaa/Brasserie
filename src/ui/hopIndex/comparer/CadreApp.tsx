// Le cadre de Comparer dans l'app (T15b, #174) : PageShell de l'app (tête à onglets de la maquette, dock sous le pouce).
// Le même rôle que `CadreOutil` de la maquette (prototypes/houblons-v4/parcours/src/commun/Cadres.tsx), sans sa navigation :
// la croix et « Ma bière » ferment la couche (retour à l'étape Houblons, dessous) ; « Suggestions » ouvre sa couche.
import { createContext, useContext } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { Dock } from '../Pont';
import type { CadreComparerProps } from './hote';
import './cadre-app.css';

/** `fermer` : un niveau (l'onglet « Ma bière » y revient). `fermerTout` : la croix (D118), jusqu'à l'étape Houblons ; absent : `fermer`. */
export interface ActionsCadre { fermer: () => void; fermerTout?: () => void; suggerer: () => void; nbHoublons: number }
export const CadreCtx = createContext<ActionsCadre | null>(null);

function Croix({ fermer }: { fermer: () => void }) {
  return (
    <button type="button" data-role="retour" aria-label="Fermer" title="Fermer : retour à l’étape Houblons" onClick={fermer} className="pq-croix shrink-0">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="pq-croix-icone" fill="currentColor"><path d="M5.4 4 12 10.6 18.6 4 20 5.4 13.4 12 20 18.6 18.6 20 12 13.4 5.4 20 4 18.6 10.6 12 4 5.4Z" /></svg>
    </button>
  );
}

function Onglets({ a }: { a: ActionsCadre }) {
  const onglets = [
    { id: 'biere', nom: 'Ma bière', va: a.fermer },
    { id: 'suggerer', nom: 'Suggestions', va: a.suggerer },
    { id: 'comparer', nom: a.nbHoublons ? `Comparer (${a.nbHoublons})` : 'Comparer', va: () => {} },
  ];
  return (
    <div data-role="onglets" data-page-titlebar className="pq-tete flex items-center gap-1.5">
      <Croix fermer={a.fermerTout ?? a.fermer} />
      <div role="tablist" className="pq-onglets flex-1 grid grid-cols-3 gap-0.5 rounded-full bg-cave-850 p-0.5">
        {onglets.map((o) => (
          <button key={o.id} type="button" role="tab" aria-selected={o.id === 'comparer'} data-onglet={o.id} onClick={o.va}
            className={`pq-onglet rounded-full px-2 whitespace-nowrap ${o.id === 'comparer' ? 'bg-cave-950 text-cave-50 font-bold shadow-sm' : 'text-cave-200'}`}>
            {o.nom}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CadreApp({ ecran, question, questionVisible = true, elementTete, contexte, dock, etat, children }: CadreComparerProps) {
  const a = useContext(CadreCtx);
  if (!a) throw new Error('CadreApp hors de CadreCtx');
  return (
    <PageShell title={question} onClose={a.fermerTout ?? a.fermer} footer={dock ? <Dock>{dock}</Dock> : undefined}
      mobileHeader={<div {...(elementTete ? { 'data-element': elementTete } : {})}><Onglets a={a} /></div>}
      className={`pq-outil pq-outil-${ecran} pq-cadre-retour`}>
      <div data-ecran={ecran} {...(etat ? { 'data-etat': etat } : {})} className="space-y-2">
        {questionVisible && <h1 className="text-[0.9375rem] font-semibold text-cave-50 leading-tight px-1">{question}</h1>}
        {contexte}
        {children}
      </div>
    </PageShell>
  );
}
