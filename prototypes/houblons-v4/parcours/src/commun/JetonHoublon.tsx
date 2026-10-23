// Jeton d'un houblon, dans l'ordre du brasseur (L04) : nom, α (lot, puis plage des fiches, « ≠ » si le lot en
// sort), rôle en mot. Le stock n'est qu'une icône (D23 ter).
import { Package } from 'lucide-react';
import type { HoublonLu } from '../moteur';
import { nombre, plage } from './nombres';

export function Alpha({ h, court = false }: { h: HoublonLu; court?: boolean }) {
  if (!h.alpha) return <span data-role="alpha" className="font-mono text-cave-400">α ?</span>;
  const { valeur, plage: p, horsFiches } = h.alpha;
  return (
    <span data-role="alpha" data-houblon={h.cle} className="font-mono text-sm whitespace-nowrap">
      α {nombre(valeur, 1)}%
      {!court && p && <span className={horsFiches ? 'text-attention ml-1' : 'text-cave-400 ml-1'}>{horsFiches ? '≠ ' : ''}{plage(p[0], p[1])}</span>}
    </span>
  );
}

export function JetonHoublon({ h, couleur, court = false }: { h: HoublonLu; couleur?: string; court?: boolean }) {
  return (
    <span data-jeton-houblon={h.cle} className="inline-flex items-baseline gap-1.5 min-w-0">
      {couleur && <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full shrink-0 self-center" style={{ background: couleur }} />}
      <span className="font-semibold text-cave-50 truncate">{h.nom}</span>
      <Alpha h={h} court={court} />
      {h.role.mot && <span data-role="role" className="px-1.5 rounded-full bg-cave-800 text-xs text-cave-200">{h.role.mot}</span>}
      {h.stock != null && h.stock > 0 && <Package aria-label="en stock" role="img" className="w-3.5 h-3.5 text-cave-400 self-center shrink-0" />}
    </span>
  );
}
