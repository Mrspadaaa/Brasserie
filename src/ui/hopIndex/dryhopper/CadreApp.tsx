// Le cadre des outils à brouillon dans l'app (T15c, #174) : PageShell de l'app, la tête des outils sans onglets (croix de 44 px,
// titre de 18 px : D109, D129), le dock sous le pouce. Le même rôle que `CadreOutil` de la maquette (prototypes/houblons-v4/
// parcours/src/commun/Cadres.tsx), sans sa navigation : la croix ferme la couche (retour à l'étape Houblons, dessous), elle
// abandonne donc le brouillon d'outil. Les classes de la tête (pq-croix, pq-tete…) sont celles de ../comparer/cadre-app.css.
import { createContext, useContext } from 'react';
import { PageShell } from '../../../pages/PageShell';
import { Dock } from '../Pont';
import type { CadreOutilProps } from './hote';
import '../comparer/cadre-app.css';
import './cadre-outil.css';

export const CadreOutilCtx = createContext<{ fermer: () => void } | null>(null);

function TeteOutil({ question, fermer }: { question: string; fermer: () => void }) {
  return (
    <div data-page-titlebar className="pq-tete flex items-center gap-1.5">
      <button type="button" data-role="retour" aria-label="Fermer" title="Fermer : retour à l’étape Houblons" onClick={fermer} className="pq-croix shrink-0">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pq-croix-icone" fill="currentColor"><path d="M5.4 4 12 10.6 18.6 4 20 5.4 13.4 12 20 18.6 18.6 20 12 13.4 5.4 20 4 18.6 10.6 12 4 5.4Z" /></svg>
      </button>
      <h1 data-role="titre-outil" className="pq-tete-titre min-w-0 flex-1 truncate text-cave-50">{question}</h1>
    </div>
  );
}

export function CadreApp({ ecran, question, contexte, dock, etat, children }: CadreOutilProps) {
  const a = useContext(CadreOutilCtx);
  if (!a) throw new Error('CadreApp (outils à brouillon) hors de CadreOutilCtx');
  return (
    <PageShell title={question} onClose={a.fermer} footer={dock ? <Dock>{dock}</Dock> : undefined}
      mobileHeader={<TeteOutil question={question} fermer={a.fermer} />}
      className={`pq-outil pq-outil-${ecran} pq-cadre-retour`}>
      <div data-ecran={ecran} {...(etat ? { 'data-etat': etat } : {})} className="space-y-2">
        {contexte}
        {children}
      </div>
    </PageShell>
  );
}
