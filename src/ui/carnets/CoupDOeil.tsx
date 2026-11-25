/**
 * Le coup d'œil de la liste (maquettes3/v01, `liste`) : quatre cases colorées, « 2 je cherche · 3 décidés · 4 notés · 4 résolus 2026 ». Chaque case
 * est un bouton qui filtre l'arbre sur cet état ; le même toucher retire le filtre. Un compte nul s'écrit 0 : c'est un compte, pas une valeur inconnue.
 */
import type { CoupDOeil as CoupDOeilDonnees } from '../../domain/carnets/arbre';
import type { FiltreOeil } from './listeRegles';

const CASES: readonly { cle: Exclude<FiltreOeil, null>; nombre: (c: CoupDOeilDonnees) => number; mot: (c: CoupDOeilDonnees) => string }[] = [
  { cle: 'cherche', nombre: c => c.cherche, mot: () => 'je cherche' },
  { cle: 'decide', nombre: c => c.decides, mot: () => 'décidés' },
  { cle: 'note', nombre: c => c.notes, mot: () => 'notés' },
  { cle: 'resolu', nombre: c => c.resolus, mot: c => `résolus ${c.annee}` }
];

export function CoupDOeil({ coup, filtre, onFiltre }: { coup: CoupDOeilDonnees; filtre: FiltreOeil; onFiltre: (f: FiltreOeil) => void }) {
  return (
    <div className="cnl-oeil" role="group" aria-label="Coup d’œil">
      {CASES.map(c => (
        <button key={c.cle} type="button" className="cnl-case" data-etat={c.cle} aria-pressed={filtre === c.cle} onClick={() => onFiltre(filtre === c.cle ? null : c.cle)}>
          <b className="cn-mono">{c.nombre(coup)}</b>
          <span>{c.mot(coup)}</span>
        </button>
      ))}
    </div>
  );
}
