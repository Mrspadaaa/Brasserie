import React, { useId, useMemo } from 'react';
import { Check } from 'lucide-react';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import { hopStyleGuidance } from '../../domain/hopIndex/styleSelection';
import { Combobox } from '../Combobox';

const chipClass = (selected: boolean) => `min-h-touch px-2 py-0.5 rounded-control border text-xs inline-flex items-center gap-1 ${selected
  ? 'border-ebc-straw text-ebc-straw bg-ebc-straw/10'
  : 'border-cave-700 text-cave-200 hover:border-cave-500'}`;

/** A multi-selection of candidate varieties, independent of the sensory target.
 * Empty means automatic ranking; selecting a hop limits the search domain. */
export function HopSolverVarietyPicker({ varieties, styleName, selected, onChange, disabled }: {
  varieties: HopVariety[]; styleName: string; selected: string[];
  onChange: (ids: string[]) => void; disabled: boolean;
}) {
  const hintId = useId();
  const guidance = useMemo(() => new Map(varieties.map(v => [v.id, hopStyleGuidance(v, styleName)])), [varieties, styleName]);
  const active = varieties.filter(v => !v.archived);
  const documented = active.filter(v => guidance.get(v.id)?.status === 'documented').length;
  const options = useMemo(() => {
    return varieties.filter(v => !v.archived && !selected.includes(v.id)).map(v => {
      const use = guidance.get(v.id)!;
      return { value: v.id, label: v.name, detail: !styleName ? v.origin : use.status === 'documented'
        ? [use.styleLabel, ...use.roles].join(' · ') : 'Usage pour ce style non documenté',
      keywords: v.aliases?.join(' '), group: !styleName ? 'Catalogue' : use.status === 'documented' ? 'Usages documentés pour ce style' : 'À explorer',
    }; }).sort((a, b) => Number(guidance.get(b.value)?.status === 'documented') - Number(guidance.get(a.value)?.status === 'documented') || a.label.localeCompare(b.label, 'fr'));
  }, [varieties, guidance, selected, styleName]);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  const catalogue = <Combobox value="" options={options} compact maxResults={20}
    placeholder="Nom du houblon…" ariaLabel="Ajouter un houblon à comparer"
    disabled={disabled} onChange={id => { if (id) toggle(id); }} />;

  return <fieldset disabled={disabled} aria-describedby={hintId} className="min-w-0 space-y-1.5">
    <legend className="font-semibold text-cave-50 mb-1">Houblons à comparer</legend>
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-cave-400">{styleName ? `${documented} / ${active.length} références avec un usage documenté pour ce style` : `${active.length} références à comparer`}</p>
      <button type="button" className={`${chipClass(!selected.length)} shrink-0`} aria-pressed={!selected.length} onClick={() => onChange([])}>Automatique</button>
    </div>
    {catalogue}
    {!!selected.length && <div className="flex flex-wrap gap-1">
      {selected.map(id => <button key={id} type="button" className={chipClass(true)}
        aria-pressed="true" onClick={() => toggle(id)}>
        <Check size={12} aria-hidden="true" />{varieties.find(v => v.id === id)?.name ?? 'Référence indisponible'}
      </button>)}
    </div>}
    <p id={hintId} className="text-xs text-cave-400">{selected.length
      ? `${selected.length} ${selected.length === 1 ? 'variété sélectionnée' : 'variétés sélectionnées'}. La recherche se limite à ce choix.`
      : 'Tout le catalogue reste accessible. Choisis des variétés pour limiter la comparaison.'}</p>
    <details>
      <summary className="cursor-pointer min-h-touch text-xs text-cave-200">Comment sont classés les houblons ?</summary>
      <p className="text-xs text-cave-400">Les fiches fabricant et recettes publiées documentent les usages par style. Les arômes recherchés affinent ensuite le classement. Sans référence pour ce style, un houblon reste une piste à explorer ; il n’est pas déclaré incompatible.</p>
    </details>
  </fieldset>;
}
