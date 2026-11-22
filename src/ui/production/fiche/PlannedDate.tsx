import React from 'react';
import { CalendarDays, ChevronRight, Ellipsis } from 'lucide-react';
import type { Batch } from '../../../types';
import { breweryDay, plannedBrewDate } from '../../../domain/batchSchedule';
import type { YeastPreparationPlan } from '../../../../functions/src/yeastSupplySchema';
import { titreDeDate, jourCourt, ecartJours, faisabilite, jourPropose } from './ficheModel';
import { Cible, Mono, Puce } from './ui';
import { ChoixDate } from '../../ChoixDate';
import { toIsoDate, toSwissDate } from '../../DateField';

/** Le plan de starter du brassin : celui de l'exécution, sinon celui de la recette figée. */
export const planDeStarter = (b: Batch): YeastPreparationPlan | undefined => b.yeastPreparation?.plan ?? b.recipeSnapshot?.yeast?.pitching?.preparation;

/**
 * e1a, le bloc de date d'un brassin planifié : la date en titre, trois façons de la poser (À définir, Aujourd'hui, Reporter),
 * trois jours rapides, et le geste Reporter : GESTE-DATE-PARTOUT (22.11), la frise partagée du Calendrier au jour (`ChoixDate`, la même que la fiche v02),
 * à la place de la réglette de 8 jours et de ses ‹ ›. Une ligne dit si le starter tient le jour tiré (m2).
 * `geste` = le jour tiré (`JJ.MM.AAAA`), `null` au repos.
 */
export const PlannedDate: React.FC<{
  batch: Batch; now: number; geste: string | null; onGeste: (jour: string | null) => void; onSave: (date: string) => void; erreur?: string;
}> = ({ batch, now, geste, onGeste, onSave, erreur }) => {
  const prevue = plannedBrewDate(batch) ?? null;
  const aujourdhui = breweryDay(now);
  const retard = prevue ? ecartJours(prevue, aujourdhui) : null;
  const enRetard = retard !== null && retard > 0;
  const plan = planDeStarter(batch);
  const choisi = geste;
  const tient = plan && choisi ? faisabilite(plan, choisi, now) : null;
  const mode = prevue === null ? 'definir' : prevue === aujourdhui ? 'aujourdhui' : 'reporter';
  const ton = enRetard ? 'border-attention/50 bg-attention/10' : 'border-cave-700 bg-cave-850';
  const demain = breweryDay(now, 1), plus7 = breweryDay(now, 7);
  /** Date dépassée et plan de starter : le premier jour où le starter tient, calculé. Sinon rien n'est proposé. */
  const propose = jourPropose(plan, prevue, now);
  const rapides = propose
    ? [{ j: demain, l: 'demain' }, ...(propose !== demain && propose !== plus7 ? [{ j: propose, l: jourCourt(propose).nom }] : []), { j: plus7, l: '+7 j' }]
    : [{ j: demain, l: 'demain' }, ...(prevue && prevue !== demain && prevue !== plus7 && (ecartJours(aujourdhui, prevue) ?? 0) > 0 ? [{ j: prevue, l: jourCourt(prevue).nom }] : []), { j: plus7, l: '+7 j' }];
  const jourActif = propose ?? prevue;
  const dansJ = choisi ? ecartJours(aujourdhui, choisi) : null;
  return (
    <section aria-label="Date de brassage" className={`rounded-2xl border px-3 pb-3 pt-2 ${ton}`}>
      <p className="flex items-center gap-1.5 text-sm text-attention">
        <CalendarDays size={16} aria-hidden="true" />
        {geste !== null
          ? <span>{prevue ? <>Était prévue le <Mono>{prevue.slice(0, 5)}</Mono></> : 'Pas de date prévue'}</span>
          : <span>{prevue ? <>Prévue le <Mono>{prevue.slice(0, 5)}</Mono>{enRetard && <> · <b>{retard} j de retard</b></>}</> : 'Date à définir'}</span>}
      </p>
      <h2 className="mt-0.5 text-2xl font-semibold leading-tight text-cave-50">{geste !== null && choisi ? titreDeDate(choisi) : propose ? titreDeDate(propose) : prevue ? titreDeDate(prevue) : 'À définir'}</h2>
      {geste === null ? (
        <>
          <div role="group" aria-label="Quand brasser ?" className="mt-2 flex gap-1 rounded-control border border-cave-700 bg-cave-950 p-0.5">
            {([['definir', 'À définir'], ['aujourdhui', 'Aujourd’hui'], ['reporter', 'Reporter']] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={mode === k}
                onClick={() => k === 'definir' ? onSave('') : k === 'aujourdhui' ? onSave(aujourdhui) : onGeste(jourActif ?? aujourdhui)}
                className={`relative flex-1 min-h-8 rounded-[8px] text-sm after:content-[''] after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 ${mode === k ? 'bg-ebc-straw font-semibold text-cave-950' : 'text-cave-400'}`}>{l}</button>
            ))}
          </div>
          <div data-jours-rapides className="mt-2 grid grid-cols-3 gap-1.5">
            {rapides.map(r => (
              <Puce key={r.j} actif={r.j === jourActif}className="justify-center" onClick={() => onSave(r.j)}>
                {r.l} <Mono className="font-semibold">{r.j.slice(0, 2)}</Mono>
              </Puce>
            ))}
          </div>
          {erreur && <p role="alert" className="mt-2 text-xs text-alert-strong">{erreur}</p>}
        </>
      ) : (
        <div className="mt-2" data-curseur-jours>
          <div className="mb-1 flex items-baseline gap-2">
            <Mono className="text-lg font-semibold text-cave-50">{choisi ? `${jourCourt(choisi).nom} ${choisi.slice(0, 5)}` : '—'}</Mono>
            {dansJ !== null && <span className="text-sm font-semibold text-hop">{dansJ === 0 ? 'aujourd’hui' : `dans ${dansJ} j`}</span>}
          </div>
          <ChoixDate ouvert label="Jour de brassage" valeur={toIsoDate(choisi ?? '')} depart={toIsoDate(aujourdhui)} onChange={iso => onGeste(toSwissDate(iso))} onBrouillon={iso => onGeste(toSwissDate(iso))} />
          {plan
            ? tient && <p data-starter-tient={tient} className={`mt-1 text-xs ${tient === 'non' ? 'text-alert-strong' : tient === 'court' ? 'text-attention' : 'text-hop'}`}>{tient === 'non' ? 'Le starter ne tient pas ce jour.' : tient === 'court' ? 'Le starter tient juste ce jour.' : 'Le starter tient ce jour.'}</p>
            : <p className="mt-1 text-xs text-cave-400">Pas de plan de starter : aucune faisabilité à montrer sur ces jours.</p>}
        </div>
      )}
    </section>
  );
};

/** Pied de la fiche planifiée : au repos « ⋯ » et « Commencer le brassage », au geste « Annuler » et « Enregistrer lu 16.11 ». */
export const PiedPlanifie: React.FC<{
  geste: string | null; now: number; plus: () => void; commencer?: () => void; annuler: () => void; enregistrer: () => void;
}> = ({ geste, now, plus, commencer, annuler, enregistrer }) => {
  const jour = geste;
  return geste === null ? (
    <div className="flex items-center gap-2">
      <Cible aria-label="Budget, compagnon, supprimer" onClick={plus} className="w-10 px-0 shrink-0"><Ellipsis size={18} aria-hidden="true" /></Cible>
      {commencer && <Cible ton="prim" className="flex-1" onClick={commencer}>Commencer le brassage <ChevronRight size={16} aria-hidden="true" /></Cible>}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Cible onClick={annuler}>Annuler</Cible>
      <Cible ton="prim" className="flex-1" onClick={enregistrer}>Enregistrer {jour ? `${jourCourt(jour).nom} ${jour.slice(0, 5)}` : ''}</Cible>
    </div>
  );
};
