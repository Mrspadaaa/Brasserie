/**
 * R98 (c75) : « Reclasser ce carnet ? » : un carnet écrit avant les correctifs de rangement garde l'erreur dans sa donnée (un article né d'une phrase, un critère né d'un
 * constat, « Commandé » rangé « à acheter », « Résolu » coupé en note). La carte DIT ce qui change, en phrases ; UN toucher (« Reclasser ») applique, le bandeau
 * « ✓ Carnet reclassé · Annuler » rend tout. Rien n'est écrit avant ce toucher ; « Laisser » la retire pour cette ouverture. Même gabarit que `FilAncienARanger` (R95).
 * Provenance : le picto du calcul local (Q19), jamais le ✻ de l'IA.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PropositionReclasser } from '../../domain/carnets/reclasser';
import { Provenance } from './EtatIA';

export function CarteReclasser({ proposition: p, onReclasser }: { proposition: PropositionReclasser; onReclasser: () => void }) {
  const [laisse, setLaisse] = useState(false);
  if (laisse) return null;
  return (
    <section className="cnp-options cnp-propose" aria-label="Reclasser ce carnet ?" data-reclasser>
      {/* C79-fix (EXA-4) : le titre et ce qui change sont dans un même bloc : la carte nomme la phrase qu'elle reclasse sous son titre */}
      <div className="cn-mut cnp-propose-tete cnp-propose-corps"><Provenance origine="locale" titre="calculé sur place, rien n’est écrit avant votre OK" /> <b>Reclasser ce carnet ?</b> <span>Rien n’est écrit avant votre OK.</span>
        {p.lignes.map(l => <p key={l} className="cnp-propose-ligne"><span>{l}</span></p>)}
      </div>
      <div className="cnp-propose-gestes">
        <button type="button" className="cn-action cn-action-vert" onClick={onReclasser}><Check size={16} aria-hidden /> Reclasser</button>
        <button type="button" className="cn-second" onClick={() => setLaisse(true)}>Laisser</button>
      </div>
    </section>
  );
}
