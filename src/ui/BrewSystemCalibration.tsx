import { useId, useMemo, useState } from 'react';
import type { Batch, BrewhouseProfile } from '../types';
import type { SystemParameter } from '../types/brewSystem';
import { applySystemCalibration, brewSystemInsights, calibrationContextExclusion, calibrationEventStatus, SYSTEM_PARAMETER_LABELS, systemCalibrationProposals, systemParameterValue, type SystemCalibrationProposal } from '../domain/brewSystemInsights';
import { systemNumber } from './BrewSystemFeedback';
import './brew-system.css';

export interface BrewSystemCalibrationProps {
  profile: BrewhouseProfile;
  batches: Batch[];
  onChange: (profile: BrewhouseProfile) => void;
  onOpenBatch?: (batchId: string) => void;
}

export function BrewSystemCalibration({ profile, batches, onChange, onOpenBatch }: BrewSystemCalibrationProps) {
  const titleId = useId();
  const proposals = useMemo(() => systemCalibrationProposals(profile, batches), [profile, batches]);
  const [message, setMessage] = useState('');
  const history = profile.calibrationHistory ?? [];
  const historyStatuses = useMemo(() => new Map((profile.calibrationHistory ?? []).map(event => [event.id, calibrationEventStatus(event, batches)])), [profile.calibrationHistory, batches]);
  const changedCount = [...historyStatuses.values()].filter(status => status === 'changed').length;
  const apply = (proposal: SystemCalibrationProposal) => {
    const result = applySystemCalibration(profile, proposal, batches);
    if (result.ok === false) { setMessage(result.reason); return; }
    onChange(result.profile);
    setMessage(`${SYSTEM_PARAMETER_LABELS[proposal.parameter].label} : ${systemNumber(result.event.value, SYSTEM_PARAMETER_LABELS[proposal.parameter].unit)} ${SYSTEM_PARAMETER_LABELS[proposal.parameter].unit} retenu. Enregistre les réglages pour conserver ce choix.`);
  };
  const source = (id: string, label = id) => onOpenBatch
    ? <button type="button" className="brew-system-link" onClick={() => onOpenBatch(id)}>{label}</button>
    : <span>{label}</span>;
  return <section className="brew-system brew-system-calibration" aria-labelledby={titleId}>
    <div className="brew-system-heading"><h3 id={titleId}>Ce que tes brassins nous apprennent</h3></div>
    <p className="brew-system-intro">Un retour dès le premier brassin. Une proposition après 3 brassins comparables, sur les 5 derniers au maximum.</p>
    {changedCount > 0 && <p className="brew-system-warning" role="status">{changedCount} calibration{changedCount > 1 ? 's' : ''} à revoir après correction des mesures. La valeur retenue reste inchangée.</p>}
    {(Object.keys(SYSTEM_PARAMETER_LABELS) as SystemParameter[]).map(parameter => {
      const definition = SYSTEM_PARAMETER_LABELS[parameter];
      const groups = proposals.filter(p => p.parameter === parameter);
      return <div className="brew-system-calibration-row" key={parameter}>
        <div className="brew-system-calibration-title"><h4>{definition.label}</h4><span>{definition.unit}</span></div>
        {!groups.length ? <div className="brew-system-calibration-empty">
          <span>Utilisé <strong>{systemNumber(systemParameterValue(profile, parameter), definition.unit)} {definition.unit}</strong></span>
          <span>Aucun brassin admissible pour cette installation.</span>
        </div> : groups.map(proposal => <div className="brew-system-context" key={proposal.contextKey}>
          <p>{proposal.contextLabel}</p>
          <dl className="brew-system-comparison">
            <div><dt>Utilisé</dt><dd>{systemNumber(proposal.previousValue, definition.unit)}</dd></div>
            <div><dt>Médiane observée</dt><dd>{proposal.observations.some(o => o.approximate) && '≈'}{systemNumber(proposal.value, definition.unit)}</dd></div>
            <div><dt>Brassins</dt><dd>{proposal.count}<span> / 3 min.</span></dd></div>
          </dl>
          <div className="brew-system-calibration-action">
            <span>De {systemNumber(proposal.min, definition.unit)} à {systemNumber(proposal.max, definition.unit)} {definition.unit}</span>
            {proposal.eligible ? proposal.previousValue === proposal.value
              ? <span className="brew-system-applied">Valeur déjà utilisée</span>
              : <button type="button" className="brew-system-button" onClick={() => apply(proposal)} aria-label={`Appliquer ${definition.label} : ${systemNumber(proposal.value, definition.unit)} ${definition.unit}`}>Appliquer</button>
              : <span>Encore {3 - proposal.count} brassin{3 - proposal.count > 1 ? 's' : ''} comparable{3 - proposal.count > 1 ? 's' : ''}</span>}
          </div>
          <details className="brew-system-details"><summary>Voir les mesures sources</summary>
            <ul className="brew-system-sources">{proposal.observations.map(observation => <li key={observation.batchId}>
              {source(observation.batchId, `${observation.batchId} · ${observation.batchName}`)}
              <span>{systemNumber(observation.value, definition.unit)} {definition.unit}</span>
            </li>)}</ul>
            <p>Même installation et programme prévu, même volume cible et grain réellement ajouté. Les quantités d’eau confirmées sont distinguées ; leur absence reste signalée. Les procédés NOLO sont séparés. ≈ signale une conversion de volume.</p>
          </details>
        </div>)}
      </div>;
    })}
    {message && <p className="brew-system-message" role="status">{message}</p>}
    <details className="brew-system-details">
      <summary>Pourquoi un brassin peut manquer</summary>
      <p>Il faut des mesures au même stade, leur température de référence, les quantités réellement ajoutées et le profil matériel figé. Les sucres ou extraits ne calibrent pas le rendement des grains. L’absorption demande aussi le moût libre restant après filtration.</p>
      <p>Une perte totale au transfert ne devient pas un fond de cuve : les houblons seraient comptés deux fois.</p>
      <ul className="brew-system-sources">{batches.filter(b => b.status !== 'annule' && b.brewDay).map(batch => {
        const snapshot = batch.recipeSnapshot;
        const contextExclusion = calibrationContextExclusion(profile, batch);
        const missing = snapshot ? brewSystemInsights(snapshot, batch.brewDay!).metrics.filter(m =>
          ['fermenterYield', 'evaporation', 'absorption', 'heating'].includes(m.id) && !m.calibrationEligible,
        ) : [];
        return <li key={batch.id}><div>{source(batch.id, `${batch.id} · ${batch.name}`)}
          {contextExclusion ? <p>{contextExclusion}</p> : missing.map(m => <p key={m.id}><strong>{m.label} :</strong> {m.reason}</p>)}
        </div></li>;
      })}</ul>
    </details>
    <details className="brew-system-details">
      <summary>Historique des valeurs retenues · {history.length}</summary>
      {!history.length ? <p>Aucune calibration appliquée.</p> : <ol className="brew-system-history">{[...history].reverse().map(event => {
        const definition = SYSTEM_PARAMETER_LABELS[event.parameter];
        const status = historyStatuses.get(event.id);
        return <li key={event.id}>
          <div><strong>{definition.label}</strong><span>{new Date(event.appliedAt).toLocaleDateString('fr-CH')}</span></div>
          <p>{systemNumber(event.previousValue, definition.unit)} → {systemNumber(event.value, definition.unit)} {definition.unit}</p>
          {status !== 'current' && <p className="brew-system-warning">{status === 'changed' ? 'Mesures corrigées : calibration à revoir.' : 'Sources indisponibles : cette calibration ne peut pas être revérifiée.'}</p>}
          <div className="brew-system-source-links">{event.batchIds.map(id => <span key={id}>{source(id)}</span>)}</div>
        </li>;
      })}</ol>}
    </details>
  </section>;
}
