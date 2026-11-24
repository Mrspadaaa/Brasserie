/**
 * C48-1 : « Relire » la page d'un article lu sans prix. Un geste du brasseur : rien ne part tout seul (une lecture coûte, et la page a pu
 * changer). Le bouton se tait pendant la lecture (« Lecture… ») ; le résultat, lui, s'écrit dans l'article.
 */
import React from 'react';
import { RefreshCw } from 'lucide-react';

export function BoutonRelire({ onRelire, classe = '' }: { onRelire: () => void | Promise<void>; classe?: string }) {
  const [occupe, setOccupe] = React.useState(false);
  const vivant = React.useRef(true);
  React.useEffect(() => () => { vivant.current = false; }, []);
  return (
    <button type="button" className={`cn-lien cn-relire ${classe}`.trim()} disabled={occupe} title="Relire la page de l'article"
      onClick={e => {
        e.stopPropagation();
        setOccupe(true);
        void Promise.resolve(onRelire()).catch(() => undefined).finally(() => { if (vivant.current) setOccupe(false); });
      }}>
      <RefreshCw size={14} aria-hidden /> {occupe ? 'Lecture…' : 'Relire'}
    </button>
  );
}
