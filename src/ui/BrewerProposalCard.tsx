import React, { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { BrewerProposal } from '../../functions/src/companionTypes';
import { sameField } from '../../functions/src/brewerFields';
import { SALTS, ACIDS } from '../domain/water';
import { barreAvantApres, nombreTexte } from './companion/derive';
import { Icone, M } from './companion/parts';
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
/** Une ligne est facultative quand la réponse le dit : champ `optional`, ou raison qui commence par « Facultatif ». */
export const estFacultatif = (ch: BrewerProposal['changes'][number]): boolean =>
  (ch as { optional?: unknown }).optional === true || /^\s*facultatif\b/i.test(ch.reason ?? '');

/** Libellé court d'une ligne (la colonne est étroite) : « Mosaic · contact J+9 » → « Contact Mosaic J+9 », « Température du dry hop » → « Temp. dry hop ». */
export function libelleCourt(label: string): string {
  const contact = /^(.+?)\s·\scontact\s(J\+\d+)$/i.exec(label);
  if (contact) return `Contact ${contact[1]} ${contact[2]}`;
  return label.replace(/^Température\s+(?:du |de la |de l['’]|des |de |d['’])?/i, 'Temp. ').replace(/\s·\s/g, ' ');
}

/** Écart de dose en grammes des changements de poids cochés (`unit` g, valeurs numériques) ; `null` si aucune dose ne change. */
export function ecartDoseG(changes: BrewerProposal['changes'], cochees: string[]): { ecartG: number; existe: boolean } {
  const doses = changes.filter((ch) => ch.unit === 'g' && typeof ch.before === 'number' && typeof ch.value === 'number' && /weight|dose/i.test(ch.path ?? ''));
  return {
    existe: doses.length > 0,
    ecartG: doses.filter((ch) => cochees.includes(ch.id)).reduce((s, ch) => s + (ch.value as number) - (ch.before as number), 0)
  };
}

/**
 * Proposition à valider (forme p2a) : une ligne par changement — case, libellé, barre, avant barré → après.
 * Contrat : { proposal, disabled, draft, onDecide(ids, decision) }. La sélection suit les groupes liés (eau).
 * Une ligne facultative démarre décochée. `dosesTotalesG` et `volumeL` (optionnels, du chat) donnent la dose totale en g/L ; sans eux,
 * la ligne ne dit que l'écart de dose en grammes.
 */
export function BrewerProposalCard({
  proposal,
  disabled,
  onDecide,
  draft,
  dosesTotalesG,
  volumeL
}: {
  proposal: BrewerProposal;
  disabled: boolean;
  draft: boolean;
  onDecide: (ids: string[], decision: 'apply' | 'dismiss') => Promise<void>;
  dosesTotalesG?: number;
  volumeL?: number;
}) {
  const [selected, setSelected] = useState(() => proposal.changes.filter((ch) => !estFacultatif(ch)).map((ch) => ch.id));
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
      <strong className="sr-only">{proposal.title}</strong>
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
                label={libelleCourt(ch.label)}
                facultatif={estFacultatif(ch)}
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
          {(() => {
            const { ecartG, existe } = ecartDoseG(proposal.changes, selected);
            if (!existe) return null;
            const connu = typeof dosesTotalesG === 'number' && typeof volumeL === 'number' && volumeL > 0;
            const gl = (g: number) => nombreTexte(Math.round((g / (volumeL as number)) * 10) / 10);
            const ecart = `${ecartG < 0 ? '−' : ecartG > 0 ? '+' : ''}${nombreTexte(Math.abs(ecartG))}`;
            return (
              <div className="cmp-total">
                <span>{connu ? 'Dose totale' : 'Écart de dose'}</span>
                <span>
                  {connu ? (
                    <>
                      <M n={gl(dosesTotalesG as number)} u="g/L" /> inchangée · <M n={gl((dosesTotalesG as number) + ecartG)} u="g/L" /> si cochée
                    </>
                  ) : (
                    <>
                      inchangé · <M n={ecart} u="g" /> si coché
                    </>
                  )}
                </span>
              </div>
            );
          })()}
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
