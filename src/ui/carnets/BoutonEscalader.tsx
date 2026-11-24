/**
 * ESCALADER-SUR-MANQUE (24.11) : « Escalader » la lecture d'un article lu dont un champ manque ou dont les deux lectures se contredisent : la page est relue par l'IA
 * forte (Neon, D449). Un geste du brasseur, comme « Relire » (une lecture coûte) ; le bouton se tait pendant la lecture.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';

export function BoutonEscalader({ onEscalader, raison, classe = '' }: { onEscalader: () => void | Promise<void>; raison?: string; classe?: string }) {
  const [occupe, setOccupe] = React.useState(false);
  const vivant = React.useRef(true);
  React.useEffect(() => () => { vivant.current = false; }, []);
  return (
    <button type="button" className={`cn-lien cn-escalader ${classe}`.trim()} data-booster="escalader" disabled={occupe}
      title={raison ? `Relire avec l'IA plus forte — ${raison}` : 'Relire avec l\'IA plus forte'}
      onClick={e => {
        e.stopPropagation();
        setOccupe(true);
        void Promise.resolve(onEscalader()).catch(() => undefined).finally(() => { if (vivant.current) setOccupe(false); });
      }}>
      <Sparkles size={14} aria-hidden /> {occupe ? 'Lecture…' : 'Escalader'}
    </button>
  );
}
