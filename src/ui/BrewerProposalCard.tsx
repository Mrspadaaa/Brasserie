import React, { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { BrewerProposal } from '../../functions/src/companionTypes';
import { sameField } from '../../functions/src/brewerFields';
import { SALTS, ACIDS } from '../domain/water';
import { barreAvantApres } from './companion/derive';
import { Icone } from './companion/parts';
import { LigneChangement } from './companion/proposition';

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
  attenuationBasis: 'Base de l’atténuation',
  qty: 'Quantité',
  unit: 'Unité',
  form: 'Forme',
  lab: 'Laboratoire',
  strain: 'Souche',
  notes: 'Notes',
  fermentDays: 'Durée (j)'
};
const words: Record<string, string> = {
  declared: 'Valeur déclarée',
  recipe: 'Hypothèse de recette',
  measured: 'Mesure confirmée',
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
  ...Object.fromEntries(Object.entries(SALTS).map(([id, salt]) => [id, `${salt.name} (g)`])),
  mash: 'Empâtage', sparge: 'Rinçage', id: 'Produit',
  at: 'Date du relevé',
  kind: 'Type',
  value: 'Valeur',
  roomTemp: 'Échantillon refroidi'
});
Object.assign(words, Object.fromEntries(Object.entries(ACIDS).map(([id, acid]) => [id, `${acid.name} · ${acid.unit}`])));
const valueText = (v: any, label = '', unit = '') =>
  v == null
    ? 'Non renseigné'
    : typeof v === 'boolean'
      ? v
        ? 'Oui'
        : 'Non'
      : label.endsWith('Date du relevé')
        ? new Date(v).toLocaleString('fr-CH')
        : typeof v === 'number'
          ? v.toLocaleString('fr-CH', { maximumFractionDigits: unit === '%' ? 2 : 4 })
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
/**
 * Proposition à valider (forme p2a) : une ligne par changement — case, libellé, barre, avant barré → après.
 * Contrat inchangé : { proposal, disabled, draft, onDecide(ids, decision) }. La sélection suit les groupes liés (eau).
 */
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
  const toggle = (ch: BrewerProposal['changes'][number]) =>
    setSelected((ids) => {
      const linked = proposal.changes
        .filter((other) => (ch.group ? other.group === ch.group : other.id === ch.id))
        .map((other) => other.id);
      return ids.includes(ch.id) ? ids.filter((id) => !linked.includes(id)) : [...new Set([...ids, ...linked])];
    });
  const done = !!proposal.status;
  const valeur = (v: any, label: string, unit?: string) => valueText(v, label, unit);
  return (
    <section className={`cmp-carte cmp-prop ${done ? 'is-decided' : ''}`} aria-label="Modifications proposées">
      <div className="cmp-lbl">
        <span>
          {done
            ? proposal.status === 'applied'
              ? draft
                ? 'Champs appliqués au brouillon'
                : 'Modifications enregistrées'
              : 'Proposition écartée'
            : 'Proposition · rien n’est appliqué sans toi'}
        </span>
        {!done && <span className="cmp-n">{selected.length} cochée{selected.length > 1 ? 's' : ''}</span>}
      </div>
      <strong className="cmp-prop-titre">{proposal.title}</strong>
      {!done && (
        <>
          {proposal.changes.some((ch) => ch.group === 'water') && (
            <p className="cmp-note">
              Eau et traitement liés : une seule sélection pour garder les litres, les sels et l’acide cohérents.
            </p>
          )}
          {proposal.changes.map((ch) => {
            const diffs = differences(ch.before, ch.value);
            const scalaire = diffs.length === 1 && !diffs[0].label;
            const d = scalaire ? diffs[0] : undefined;
            const unite = ch.unit && d && typeof d.after === 'number' ? ch.unit : undefined;
            return (
              <LigneChangement
                key={ch.id}
                label={ch.label}
                coche={selected.includes(ch.id)}
                disabled={busy || disabled}
                onToggle={() => toggle(ch)}
                barre={d ? barreAvantApres(d.before, d.after, ch.unit) : { genre: 'texte' }}
                avant={d ? valeur(d.before, '', ch.unit) : undefined}
                apres={d ? valeur(d.after, '', ch.unit) : undefined}
                unite={unite}
                sousLignes={
                  scalaire
                    ? []
                    : diffs.map((diff) => ({
                        label: diff.label || ch.label,
                        avant: `${valeur(diff.before, diff.label, ch.unit)}${ch.unit && typeof diff.before === 'number' ? ` ${ch.unit}` : ''}`,
                        apres: `${valeur(diff.after, diff.label, ch.unit)}${ch.unit && typeof diff.after === 'number' ? ` ${ch.unit}` : ''}`
                      }))
                }
                raison={ch.reason}
              />
            );
          })}
          {draft && (
            <p className="cmp-note">
              Ces champs seront remplis dans le brouillon. Tu gardes le bouton habituel pour enregistrer la recette.
            </p>
          )}
          {error && (
            <p role="alert" className="cmp-note cmp-erreur">
              {error}
            </p>
          )}
          <div className="cmp-act">
            <button type="button" className="cmp-btn cmp-g" disabled={busy || disabled} onClick={() => void decide('dismiss')}>
              Écarter
            </button>
            <button
              type="button"
              className="cmp-btn cmp-p"
              disabled={busy || disabled || !selected.length}
              onClick={() => void decide('apply')}
            >
              {busy ? <LoaderCircle size={16} className="brewer-chat-spin" aria-hidden /> : <Icone nom="ok" />}
              Valider {selected.length} modification{selected.length > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
