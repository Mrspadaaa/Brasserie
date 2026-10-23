// D113 (« J'aime bien les petits icône et tout. Mais il manque à un endroit un bouton légende ») : un petit « ? » au
// coin de chaque groupe d'icônes de l'étape (la carte de l'ajout, les ajouts rapides), qui nomme chacune de ses icônes
// dans le même écran. Les icônes restent ; la légende s'ouvre sous le groupe, dans le flux (rien ne déborde de l'écran).
// Les familles du profil gardent la légende du socle (Legende). Classes préfixées pq-ma-biere- (L26).
import { useEffect, useState, type ReactNode } from 'react';
import { COULEURS, COURT } from '../../commun';
import { ROUE } from '../../commun/familles';
import type { FamilyId } from '../../../../src/engine';

/** L'état d'une légende de groupe : ouverte ou non ; Échap la referme (comme la légende du socle). */
export function useLegende(): [boolean, () => void] {
  const [ouverte, setOuverte] = useState(false);
  useEffect(() => {
    if (!ouverte) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOuverte(false); } };
    document.addEventListener('keydown', k, true);
    return () => document.removeEventListener('keydown', k, true);
  }, [ouverte]);
  return [ouverte, () => setOuverte((o) => !o)];
}

/** Le « ? » d'un groupe : 28 px dessinés, 44 px au doigt (touch-target). */
export function BoutonLegende({ ouverte, onBasculer, groupe, controle }: { ouverte: boolean; onBasculer: () => void; groupe: string; controle: string }) {
  return (
    <button type="button" data-role="legende-bouton" aria-expanded={ouverte} aria-controls={controle} aria-label={`Légende : ${groupe}`}
      onClick={(e) => { e.stopPropagation(); onBasculer(); }} onPointerDown={(e) => e.stopPropagation()}
      className="pq-ma-biere-legende-bouton touch-target shrink-0">
      <span aria-hidden="true">?</span>
    </button>
  );
}

export function PanneauLegende({ id, ouverte, children }: { id: string; ouverte: boolean; children: ReactNode }) {
  return (
    <div id={id} data-role="legende" hidden={!ouverte} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
      className="pq-ma-biere-legende rounded-lg px-2.5 py-2 space-y-1.5 text-sm text-cave-200">
      {children}
    </div>
  );
}

/** Les 12 couleurs de la bande des arômes, chacune nommée (le code couleur commun). */
export function CleFamilles({ ordre = ROUE }: { ordre?: readonly FamilyId[] }) {
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-0.5">
      {ordre.map((f) => (
        <li key={f} className="flex items-center gap-1.5 min-w-0">
          <i aria-hidden="true" className="block w-2.5 h-3 rounded-sm shrink-0" style={{ background: COULEURS[f].base }} />
          <span className="truncate">{COURT[f]}</span>
        </li>
      ))}
    </ul>
  );
}
