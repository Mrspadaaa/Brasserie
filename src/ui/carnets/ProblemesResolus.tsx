/**
 * R69 · C67-5 (maquette v01-resolu : « ira dans Réalisés ») : Stocks › Matériel › Réalisés liste aussi les PROBLÈMES RÉSOLUS des carnets, pas seulement les achats payés.
 * Un carnet résolu y arrive de lui-même (rien à cocher) ; chaque ligne dit son titre, le jour de la résolution quand il est connu (jamais inventé) et ouvre le carnet.
 * Un carnet dont l'achat est déjà une ligne de Réalisés (son plan payé) n'y est pas deux fois : `sansPlans` donne les ids de ces plans.
 */
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { jourAvecAnnee } from '../../domain/calendrier/dates';
import type { CarnetDoc } from '../../domain/carnets/modele';
import { jourLocal, suiviDe } from '../../domain/carnets/suivi';

/** Les carnets résolus (ou archivés, que le suivi range « résolu »), le plus récent d'abord ; sans ceux dont le plan est déjà une ligne de Réalisés. */
export function carnetsResolus(carnets: readonly CarnetDoc[], plansDeRealises: ReadonlySet<string> = new Set()): CarnetDoc[] {
  return carnets
    .filter(c => suiviDe(c).etat === 'resolu' && !(c.carnet.sortie && plansDeRealises.has(c.carnet.sortie.planId)))
    .sort((a, b) => (suiviDe(b).resolu?.le ?? '').localeCompare(suiviDe(a).resolu?.le ?? '') || a.title.localeCompare(b.title, 'fr'));
}

export function ProblemesResolus({ carnets, plansDeRealises, onOuvrir }: { carnets: readonly CarnetDoc[]; plansDeRealises?: ReadonlySet<string>; onOuvrir?: (carnetId: string) => void }) {
  const resolus = carnetsResolus(carnets, plansDeRealises);
  if (!resolus.length) return null;
  return (
    <section className="upgrade-stage" data-problemes-resolus aria-label={`Problèmes résolus, ${resolus.length}`}>
      <h3>Problèmes résolus <span className="finance-muted">· {resolus.length}</span></h3>
      {resolus.map(c => {
        const le = suiviDe(c).resolu?.le;
        const jour = le ? jourLocal(le) : null;
        return (
          <article className="upgrade-item" key={c.id}>
            <button type="button" className="upgrade-project" onClick={() => onOuvrir?.(c.id)}>
              <span className="shrink-0" aria-hidden><CheckCircle2 size={22} /></span>
              <span className="finance-row-main"><strong>{c.title.replace(/^ZZ TEST\s*[—–-]\s*/i, '')}</strong><span className="finance-muted">{jour ? `Résolu le ${jourAvecAnnee(jour)}` : 'Résolu'}</span></span>
              <span className="upgrade-price"><ChevronRight size={16} aria-hidden /></span>
            </button>
          </article>
        );
      })}
    </section>
  );
}
