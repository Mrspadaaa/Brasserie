import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { BrewingScenarioAssumption, BrewingScenarioBranchResult, BrewingScenarioResult } from '../../domain/brewingScenario';
import './branch-assumptions-disclosure.css';

const ORIGIN_LABEL: Record<BrewingScenarioAssumption['origin'], string> = {
  userHypothesis: 'Hypothèse du brasseur',
  assistantHypothesis: 'Hypothèse d’assistant',
  modelHypothesis: 'Hypothèse du modèle',
  analogy: 'Analogie',
  sourceRange: 'Plage de source',
  catalogue: 'Catalogue',
  observation: 'Observation',
  calculation: 'Calcul'
};

function exactNumber(value: number): string {
  const raw = String(value);
  if (/[eE]/.test(raw)) return raw;
  const [integer, decimals] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

function valueText(value: number | string | boolean | null): string {
  if (value === null) return 'null explicite';
  if (typeof value === 'number') return exactNumber(value);
  if (typeof value === 'boolean') return value ? 'vrai' : 'faux';
  return value;
}

function sourceLabel(source: HopSource): string {
  return [source.author, source.title, source.year === null ? null : String(source.year), source.kind]
    .filter((part): part is string => part !== null && part.length > 0).join(' · ');
}

function applicationLabel(branch: BrewingScenarioBranchResult, assumption: BrewingScenarioAssumption): string {
  if (branch.usedAssumptionIds.includes(assumption.id)) return 'Utilisée par le calcul';
  if (branch.unappliedAssumptionIds.includes(assumption.id)) return 'Retenue, non utilisée par le calcul';
  if (branch.proposedAssumptionIds.includes(assumption.id)) return 'Proposée, non appliquée au calcul';
  return 'Application au calcul non indiquée';
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function AssumptionSource({ source }: { source?: HopSource }) {
  if (!source) return <p>Aucune source explicite rattachée à cette hypothèse.</p>;
  return (
    <p>
      Source : {sourceLabel(source)}{source.locator ? ` · ${source.locator}` : ''} · <code>{source.reference}</code>
    </p>
  );
}

function AssumptionRow({ branch, assumption }: { branch: BrewingScenarioBranchResult; assumption: BrewingScenarioAssumption }) {
  const hasValue = Object.prototype.hasOwnProperty.call(assumption, 'value') && assumption.value !== undefined;
  const hasDeclaredReading = hasValue || !!assumption.range || assumption.central !== undefined;
  return (
    <li className="hv55-branch-assumptions-row" data-assumption-id={assumption.id}>
      <strong>{assumption.label}</strong>
      <dl>
        <dt>Statut</dt><dd>{assumption.status === 'selected' ? 'Retenue dans cette branche' : 'Proposée'} · {ORIGIN_LABEL[assumption.origin]}</dd>
        <dt>Application</dt><dd>{applicationLabel(branch, assumption)}</dd>
        <dt>Champ</dt><dd><code>{assumption.path}</code></dd>
        {!hasDeclaredReading && <><dt>Valeur</dt><dd>Aucune valeur, plage ou centrale déclarée.</dd></>}
        {hasValue && <><dt>Valeur déclarée</dt><dd>{valueText(assumption.value!)}{assumption.unit ? ` ${assumption.unit}` : ''}</dd></>}
        {assumption.range && <><dt>Plage déclarée</dt><dd>{exactNumber(assumption.range.min)}–{exactNumber(assumption.range.max)}{assumption.unit ? ` ${assumption.unit}` : ''}</dd></>}
        {assumption.central !== undefined && <><dt>Centrale explicite</dt><dd>{exactNumber(assumption.central)}{assumption.unit ? ` ${assumption.unit}` : ''}</dd></>}
        {assumption.basis && <><dt>Base</dt><dd>{assumption.basis}</dd></>}
        <dt>Explication</dt><dd>{assumption.explanation}</dd>
      </dl>
      <AssumptionSource source={assumption.source} />
    </li>
  );
}

function AnalogyRow({ analogy }: { analogy: BrewingScenarioBranchResult['analogies'][number] }) {
  const kind = analogy.kind === 'hopDescriptions' ? 'Descriptions de houblon' : 'Profil de levure';
  const pair = analogy.kind === 'hopDescriptions'
    ? `${analogy.targetVarietyId} ↔ ${analogy.referenceVarietyId}`
    : `${analogy.targetYeastId} ↔ ${analogy.referenceYeastId}`;
  return (
    <li className="hv55-branch-assumptions-row">
      <strong>{kind}</strong>
      <p>Identifiants liés : <code>{pair}</code></p>
      <p>Hypothèse liée : <code>{analogy.assumptionId}</code></p>
      <p>{analogy.explanation}</p>
    </li>
  );
}

export function branchForCandidate(result: BrewingScenarioResult, candidateId: string): BrewingScenarioBranchResult | undefined {
  if (result.baseline.id === candidateId) return result.baseline;
  return result.branches.find(branch => branch.id === candidateId);
}

/** Read-only details from the exact result branch; this never changes the chosen branch or the forecast. */
export function BranchAssumptionsDisclosure({ branch, label }: { branch: BrewingScenarioBranchResult; label: string }) {
  const assumptions = branch.assumptions;
  const analogies = branch.analogies;
  const limitations = branch.limitations;
  const counts = [countLabel(assumptions.length, 'hypothèse', 'hypothèses'), countLabel(analogies.length, 'analogie', 'analogies'),
    countLabel(limitations.length, 'limite', 'limites')].join(' · ');
  return (
    <details className="hv55-branch-assumptions" data-assumptions-for-branch={branch.id}>
      <summary>Hypothèses, analogies et limites · {label} · {counts}</summary>
      <div className="hv55-branch-assumptions-content">
        <p>Résultat de branche : <code>{branch.reference}</code></p>
        {assumptions.length ? (
          <>
            <h4>Hypothèses · {assumptions.length}</h4>
            <ul>{assumptions.map(assumption => <AssumptionRow key={assumption.id} branch={branch} assumption={assumption} />)}</ul>
          </>
        ) : <p>Aucune hypothèse explicite enregistrée pour cette branche.</p>}
        {analogies.length ? (
          <>
            <h4>Analogies · {analogies.length}</h4>
            <ul>{analogies.map((analogy, index) => <AnalogyRow key={`${analogy.assumptionId}-${index}`} analogy={analogy} />)}</ul>
          </>
        ) : <p>Aucune analogie enregistrée pour cette branche.</p>}
        {limitations.length ? (
          <>
            <h4>Limites · {limitations.length}</h4>
            <ul>{limitations.map((limitation, index) => <li key={`${index}-${limitation}`}>{limitation}</li>)}</ul>
          </>
        ) : <p>Aucune limite de branche déclarée.</p>}
      </div>
    </details>
  );
}
