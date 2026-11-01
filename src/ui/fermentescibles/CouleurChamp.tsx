import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../Input';
import { lit, teinte, texteSurTeinte, fr } from './modele';

/**
 * La couleur « ? » se tape sur la ligne (D211) : la pastille devient un champ, la teinte apparaît pendant la frappe (1 à 1500 EBC).
 * Entrée valide (et passe au « ? » suivant quand la saisie a été ouverte par « N couleurs à renseigner »), Échap ou un toucher ailleurs
 * l'arrêtent. Une valeur hors de 1 à 1500 n'est pas retenue. Le composant protégé `Input`, jamais `type="number"`.
 */
export const CouleurChamp: React.FC<{
  courante: number | null;
  libelle: string;
  className: string;
  marques: Record<string, string | number>;
  onFin: (mode: 'ok' | 'echap' | 'sortie', valeur: number | null) => void;
  mise?: boolean;
}> = ({ courante, libelle, className, marques, onFin, mise = true }) => {
  const [t, setT] = useState('');
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const fini = useRef(false);
  useEffect(() => { if (mise) ref.current?.focus(); }, [mise]);
  const v = lit(t);
  const ok = v !== null && v >= 1 && v <= 1500;
  const finir = (mode: 'ok' | 'echap' | 'sortie') => {
    if (fini.current) return;
    fini.current = true;
    onFin(mode, mode === 'echap' ? null : ok ? Math.round((v as number) * 10) / 10 : null);
  };
  return (
    <Input
      {...(marques as Record<string, string>)}
      ref={ref}
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      aria-label={libelle}
      placeholder={courante == null ? 'EBC' : fr(courante, 1).replace(',0', '')}
      className={className}
      style={ok ? { background: teinte(v as number), color: texteSurTeinte(v as number), borderStyle: 'solid', borderColor: 'rgb(var(--cave-50))' } : undefined}
      value={t}
      onChange={(e) => setT(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); finir('ok'); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finir('echap'); }
      }}
      onBlur={() => finir('sortie')}
    />
  );
};
