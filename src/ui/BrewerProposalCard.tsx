import React, { useState } from 'react';
import { Check, ClipboardCheck, LoaderCircle } from 'lucide-react';
import type { BrewerProposal } from '../../functions/src/companionTypes';
import { sameField } from '../../functions/src/brewerProposals';

const names: Record<string, string> = {
  name: 'Nom',
  weightKg: 'Quantité (kg)',
  weightG: 'Quantité (g)',
  alpha: 'Alpha (%)',
  colorEbc: 'Couleur (EBC)',
  potentialPpg: 'Potentiel (PPG)',
  kind: 'Type',
  use: 'Ajout',
  stage: 'Ajout',
  timeMin: 'Contact (min)',
  tempC: 'Température (°C)',
  durationMin: 'Maintien (min)',
  days: 'Durée (j)',
  dayOffset: 'Jour',
  fermentabilityPct: 'Fermentescibilité (%)',
  fermTempMinC: 'Minimum (°C)',
  fermTempMaxC: 'Maximum (°C)',
  pitchTempC: 'Ensemencement (°C)',
  attenuationPct: 'Atténuation (%)',
  qty: 'Quantité',
  unit: 'Unité',
  form: 'Forme',
  lab: 'Laboratoire',
  strain: 'Souche',
  notes: 'Notes',
  fermentDays: 'Durée (j)'
};
const words: Record<string, string> = {
  temperature: 'Température',
  densite: 'Densité',
  ph: 'pH',
  volume: 'Volume',
  boil: 'Ébullition',
  firstWort: 'Premier moût',
  whirlpool: 'Whirlpool',
  dryHop: 'À cru',
  grain: 'Grain',
  sucre: 'Sucre',
  extrait: 'Extrait',
  fruit: 'Fruit',
  lactose: 'Lactose',
  empatage: 'Empâtage',
  ebullition: 'Ébullition',
  fermentation: 'Fermentation',
  primaire: 'Primaire',
  reposDiacetyle: 'Repos diacétyle',
  garde: 'Garde',
  refermentation: 'Refermentation',
  ajout: 'Ajout'
};
Object.assign(names, {
  at: 'Date du relevé',
  kind: 'Type',
  value: 'Valeur',
  roomTemp: 'Échantillon refroidi'
});
const valueText = (v: any, label = '') =>
  v == null
    ? 'Non renseigné'
    : typeof v === 'boolean'
      ? v
        ? 'Oui'
        : 'Non'
      : label.endsWith('Date du relevé')
        ? new Date(v).toLocaleString('fr-CH')
        : typeof v === 'number'
          ? v.toLocaleString('fr-CH', { maximumFractionDigits: 4 })
          : (words[v] ?? String(v));
function differences(
  before: any,
  after: any,
  prefix = ''
): Array<{ label: string; before: any; after: any }> {
  if (sameField(before, after)) return [];
  if ((before && typeof before === 'object') || (after && typeof after === 'object')) {
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    return [...keys]
      .filter((k) => k !== 'stepId')
      .flatMap((k) =>
        differences(
          before?.[k],
          after?.[k],
          [prefix, /^\d+$/.test(k) ? `Ligne ${Number(k) + 1}` : (names[k] ?? k)]
            .filter(Boolean)
            .join(' · ')
        )
      );
  }
  return [{ label: prefix, before, after }];
}
export function BrewerProposalCard({
  proposal,
  disabled,
  onDecide,
  draft
}: {
  proposal: BrewerProposal;
  disabled: boolean;
  draft: boolean;
  onDecide: (ids: string[], decision: 'apply' | 'dismiss') => Promise<void>;
}) {
  const [selected, setSelected] = useState(proposal.changes.map((ch) => ch.id));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const decide = async (decision: 'apply' | 'dismiss') => {
    setBusy(true);
    setError('');
    try {
      await onDecide(decision === 'apply' ? selected : [], decision);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement interrompu. Réessaie.');
    } finally {
      setBusy(false);
    }
  };
  const done = !!proposal.status;
  return (
    <section
      className={`brewer-proposal ${done ? 'is-decided' : ''}`}
      aria-label="Modifications proposées"
    >
      <header>
        <ClipboardCheck size={18} />
        <div>
          <strong>{proposal.title}</strong>
          <small>
            {done
              ? proposal.status === 'applied'
                ? draft
                  ? 'Champs appliqués au brouillon'
                  : 'Modifications enregistrées'
                : 'Proposition écartée'
              : 'À valider avant toute modification'}
          </small>
        </div>
      </header>
      {!done && (
        <>
          <div className="brewer-proposal-changes">
            {proposal.changes.map((ch) => (
              <div key={ch.id} className="brewer-proposal-change">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(ch.id)}
                    disabled={busy || disabled}
                    onChange={(e) =>
                      setSelected((ids) =>
                        e.target.checked ? [...ids, ch.id] : ids.filter((id) => id !== ch.id)
                      )
                    }
                  />
                  <strong>{ch.label}</strong>
                </label>
                <dl>
                  {differences(ch.before, ch.value).map((diff, i) => (
                    <div key={i}>
                      {diff.label && <dt>{diff.label}</dt>}
                      <dd>
                        <span>
                          <small>Actuel</small>
                          {valueText(diff.before, diff.label)}
                          {ch.unit && diff.before != null ? ` ${ch.unit}` : ''}
                        </span>
                        <span>
                          <small>Proposé</small>
                          {valueText(diff.after, diff.label)}
                          {ch.unit && diff.after != null ? ` ${ch.unit}` : ''}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                {ch.reason && <p>{ch.reason}</p>}
              </div>
            ))}
          </div>
          {draft && (
            <p className="brewer-proposal-note">
              Ces champs seront remplis dans le brouillon. Tu gardes le bouton habituel pour
              enregistrer la recette.
            </p>
          )}
          {error && (
            <p role="alert" className="brewer-proposal-error">
              {error}
            </p>
          )}
          <div className="brewer-proposal-actions">
            <button
              type="button"
              disabled={busy || disabled}
              onClick={() => void decide('dismiss')}
            >
              Écarter
            </button>
            <button
              type="button"
              disabled={busy || disabled || !selected.length}
              onClick={() => void decide('apply')}
            >
              {busy ? <LoaderCircle size={16} className="brewer-chat-spin" /> : <Check size={16} />}
              Valider {selected.length} modification{selected.length > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
