// Lentilles (barres / radar, au style / absolu) : le SegmentedControl de l'app, en pilule compacte, balisé pour
// les contrôles (data-e="style" / "absolu", D75). Le composant de l'app n'accepte pas d'attribut par option :
// le balisage est posé après le rendu (voir NOTE, « Pour l'app »).
import { useEffect, useRef } from 'react';
import { SegmentedControl } from '../../commun';
import './ma-biere.css';

export function Lentille<T extends string>({ value, onChange, options, label, marques }: {
  value: T; onChange: (v: NoInfer<T>) => void; options: { value: NoInfer<T>; label: string }[]; label: string; marques: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelectorAll('[role="radio"]').forEach((b, k) => { if (options[k]) b.setAttribute(`data-${marques}`, options[k].value); });
  });
  return (
    <div ref={ref} data-lecture="" className="pq-ma-biere-lentille">
      <SegmentedControl value={value} onChange={onChange} options={options} label={label} />
    </div>
  );
}
