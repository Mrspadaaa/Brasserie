import React from 'react';
import type { AssistedColdContactEvidence } from '../../services/hopV55/assistedColdContactEvidence';
import './assisted-cold-contact-card.css';

export interface AssistedColdContactCardProps {
  evidence: AssistedColdContactEvidence;
}

type AvailableEvidence = Extract<AssistedColdContactEvidence, { status: 'ready' | 'missing' }>;

const numberFr = (value: number): string => new Intl.NumberFormat('fr-CH', { maximumSignificantDigits: 21 }).format(value);
const jsonText = (value: unknown): string => {
  try { return JSON.stringify(value, null, 2) ?? String(value); }
  catch { return String(value); }
};

function statusLabel(evidence: AvailableEvidence): { text: string; tone: 'ready' | 'missing' } {
  if (evidence.status === 'missing') return { text: evidence.reason === 'doseUnknown' ? 'Dose inconnue' : 'Dose hors domaine publié', tone: 'missing' };
  return { text: evidence.snapshot.status === 'publishedObservation' ? 'Observation publiée' : 'Interpolation de référence', tone: 'ready' };
}

function AvailableContactEvidence({ evidence }: { evidence: AvailableEvidence }) {
  const snapshot = evidence.snapshot;
  const status = statusLabel(evidence);
  const roundedDoseFact = evidence.facts.find(fact => fact.includes('La coordonnée exacte conservée dans la preuve gouverne le domaine;'));
  const referenceValue = snapshot.valueBU === null
    ? 'Aucune valeur BU disponible'
    : `${numberFr(snapshot.valueBU)} ${snapshot.calibrationSnapshot.output.unit}`;
  const doseValue = snapshot.doseInput.value === null
    ? `Inconnue · ${snapshot.doseInput.unit}`
    : `${numberFr(snapshot.doseInput.value)} ${snapshot.doseInput.unit}`;

  return <section className={`hv-assisted-cold-contact is-${status.tone}`} aria-label="Référence BU de contact à froid">
    <header className="hv-assisted-cold-contact__header">
      <div>
        <p className="hv-assisted-cold-contact__eyebrow">Contact à froid</p>
        <h3>Résultat du protocole de référence</h3>
      </div>
      <span className={`hv-assisted-cold-contact__status is-${status.tone}`}>{status.text}</span>
    </header>

    <div className="hv-assisted-cold-contact__result" aria-label="BU du protocole de référence">
      <span>BU du protocole de référence</span>
      <strong>{referenceValue}</strong>
      {snapshot.status === 'publishedObservation' ? <small>Valeur mesurée au point publié.</small> : null}
      {snapshot.status === 'interpolation' ? <small>Valeur d’interpolation signalée par la référence.</small> : null}
      {snapshot.status === 'doseUnknown' ? <small>Aucune valeur BU n’est attribuée à une dose inconnue.</small> : null}
      {snapshot.status === 'outOfDomain' ? <small>Aucune valeur BU n’est attribuée hors du domaine publié.</small> : null}
    </div>

    <dl className="hv-assisted-cold-contact__metrics">
      <div><dt>{roundedDoseFact ? 'Dose saisie · affichage arrondi' : 'Dose du contact'}</dt><dd>{doseValue}</dd></div>
      {snapshot.doseEffectiveGPerHL !== null
        ? <div><dt>Dose effective</dt><dd>{numberFr(snapshot.doseEffectiveGPerHL)} g/hL</dd></div> : null}
      <div><dt>Témoin publié · 0 g/hL</dt><dd>{numberFr(snapshot.controlBU)} {snapshot.calibrationSnapshot.output.unit}</dd></div>
      <div><dt>Contraste au témoin</dt><dd>{snapshot.contrastToControlBU === null
        ? 'Non calculé' : `${numberFr(snapshot.contrastToControlBU)} BU`}</dd></div>
      <div><dt>Domaine de la courbe</dt><dd>{numberFr(snapshot.domainGPerHL.min)}–{numberFr(snapshot.domainGPerHL.max)} g/hL</dd></div>
    </dl>
    {roundedDoseFact ? <p className="hv-assisted-cold-contact__rounding-note">{roundedDoseFact}</p> : null}

    {evidence.sources.length ? <section className="hv-assisted-cold-contact__sources" aria-label="Sources du protocole">
      <h4>Sources</h4>
      <ul>{evidence.sources.map((source) => <li key={`${source.title}-${source.url}`}>
        <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
      </li>)}</ul>
    </section> : null}

    <details className="hv-assisted-cold-contact__disclosure">
      <summary>Faits exacts du protocole ({evidence.facts.length})</summary>
      <ul>{evidence.facts.map((fact, index) => <li key={`${index}-${fact}`}>{fact}</li>)}</ul>
    </details>
    <details className="hv-assisted-cold-contact__disclosure">
      <summary>Limites de cette référence ({evidence.limits.length})</summary>
      <ul>{evidence.limits.map((limit, index) => <li key={`${index}-${limit}`}>{limit}</li>)}</ul>
    </details>
    <details className="hv-assisted-cold-contact__technical">
      <summary>Snapshot et références exactes</summary>
      <dl>
        <div><dt>Identité de la preuve</dt><dd><code>{evidence.evidenceId}</code></dd></div>
        <div><dt>Référence du résultat</dt><dd><code>{evidence.resultReference}</code></dd></div>
        <div><dt>Référence de calibration</dt><dd><code>{snapshot.calibrationReference}</code></dd></div>
      </dl>
      <pre>{jsonText(snapshot)}</pre>
    </details>
  </section>;
}

function UnsupportedEvidence({ evidence }: { evidence: Exclude<AssistedColdContactEvidence, AvailableEvidence> }) {
  if (evidence.status === 'invalid') return <section className="hv-assisted-cold-contact is-invalid" aria-label="Preuve de contact à froid invalide">
    <header className="hv-assisted-cold-contact__header"><div><p className="hv-assisted-cold-contact__eyebrow">Contact à froid</p>
      <h3>Preuve non vérifiable</h3></div><span className="hv-assisted-cold-contact__status is-invalid">À vérifier</span></header>
    <p className="hv-assisted-cold-contact__message">{evidence.reason}</p>
    {evidence.evidenceId ? <details className="hv-assisted-cold-contact__technical"><summary>Identité de la preuve</summary><code>{evidence.evidenceId}</code></details> : null}
  </section>;

  if (evidence.status === 'unsupportedFormat') return <section className="hv-assisted-cold-contact is-unsupported" aria-label="Version de preuve non prise en charge">
    <header className="hv-assisted-cold-contact__header"><div><p className="hv-assisted-cold-contact__eyebrow">Contact à froid</p>
      <h3>Version de référence non prise en charge</h3></div><span className="hv-assisted-cold-contact__status is-unsupported">Lecture indisponible</span></header>
    <p className="hv-assisted-cold-contact__message">Le contenu est conservé tel qu’il a été reçu. Aucune valeur BU n’est affichée pour cette version.</p>
    <details className="hv-assisted-cold-contact__technical"><summary>Format, version et contenu reçus</summary>
      <p>Format · <code>{jsonText(evidence.format)}</code></p><p>Version · <code>{jsonText(evidence.version)}</code></p>
      <code>{evidence.evidenceId}</code><pre>{jsonText(evidence.raw)}</pre>
    </details>
  </section>;

  return <section className="hv-assisted-cold-contact is-unsupported" aria-label="Autre type de preuve">
    <header className="hv-assisted-cold-contact__header"><div><p className="hv-assisted-cold-contact__eyebrow">Contact à froid</p>
      <h3>Cette preuve ne porte pas une référence de contact à froid</h3></div><span className="hv-assisted-cold-contact__status is-unsupported">Non applicable</span></header>
    <details className="hv-assisted-cold-contact__technical"><summary>Identité de la preuve</summary>
      {evidence.evidenceId ? <code>{evidence.evidenceId}</code> : null}
      {evidence.toolName ? <p>Outil reçu · <code>{evidence.toolName}</code></p> : null}
    </details>
  </section>;
}

export function AssistedColdContactCard({ evidence }: AssistedColdContactCardProps) {
  return evidence.status === 'ready' || evidence.status === 'missing'
    ? <AvailableContactEvidence evidence={evidence} />
    : <UnsupportedEvidence evidence={evidence} />;
}
