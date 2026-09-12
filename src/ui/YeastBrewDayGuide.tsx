import React, { useMemo } from 'react';
import type { BrewDayState } from '../types';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { buildYeastBrewDay, type YeastBrewPhase } from '../domain/yeastBrewDay';
import { yeastReferences } from '../domain/yeastReferences';
import { StorageService } from '../services/storage';
import { useStorageValue } from '../hooks/useLiveData';
import { FermentationTemperatureChart } from './FermentationTemperatureChart';
import { YeastStrainDetails } from './YeastStrainDetails';
import './yeast-recipe.css';

const fmt = (n?: number, digits = 1) => Number.isFinite(n) ? n!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';
export function YeastBrewDayGuide({ recipe, state, phase, onMeasure }: {
  recipe: TrialRecipe; state: BrewDayState; phase: YeastBrewPhase; onMeasure?: (kind: 'temperature' | 'volume' | 'densite') => void;
}) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const guide = useMemo(() => buildYeastBrewDay(recipe, state, phase, refs), [recipe, state, phase, refs]);
  if (!guide || !guide.instructions.length) return null;
  return <aside className="yeast-workbench yeast-brew-guide" aria-label="Conduite de levure du brassin">
    <div><h3 className="font-semibold text-cave-50">Levure · {guide.goal ?? 'conduite prévue'}</h3><p className="yeast-small">{guide.name} · recette du brassin</p></div>
    {guide.stale && <p className="yeast-notice">L’objectif et les réglages actuels diffèrent. Suivre les consignes du brassin ci-dessous et vérifier l’écart.</p>}
    {guide.formWarning && <p className="yeast-notice">{guide.formWarning}</p>}
    <dl className="yeast-brew-instructions">{guide.instructions.map(item => <div key={item.id} data-instruction={item.id}>
      <dt className={item.warning ? 'yeast-notice' : 'font-medium text-cave-50'}>{item.title}</dt><dd>{item.detail}</dd>
    </div>)}</dl>
    {phase === 'finish' && <>
      <dl className="yeast-brew-readings" aria-label="Relevés du moût refroidi">
        {(['temperature', 'densite', 'volume'] as const).map(kind => {
          const reading = guide.measured[kind === 'densite' ? 'gravity' : kind];
          const label = kind === 'temperature' ? 'Température' : kind === 'densite' ? 'Densité' : 'Volume en cuve';
          return <div key={kind}><dt>{label}</dt><dd>{reading ? `${fmt(reading.value, kind === 'densite' ? 3 : 1)} ${reading.unit}` : 'Non relevé'}</dd>{onMeasure && <button type="button" onClick={() => onMeasure(kind)} aria-label={`Relever ${label.toLocaleLowerCase('fr')}`}>Relever</button>}</div>;
        })}
      </dl>
      {guide.observedDoseG && <p className="text-[13px]">Repère fabricant pour {fmt(guide.measured.volume?.value)} L relevés : {fmt(guide.observedDoseG.range.min)}–{fmt(guide.observedDoseG.range.max)} g. Quantité prévue : {guide.quantity}.</p>}
    </>}
    <details><summary>Programme, ajouts à cru et sources</summary><div>
      <FermentationTemperatureChart compact steps={recipe.fermentation ?? []} pitchTempC={recipe.yeast.pitchTempC} />
      {guide.hops.additions.length > 0 && <table className="yeast-contacts"><caption>Ajouts prévus dans le brassin</caption><thead><tr><th>Houblon</th><th>Phase</th><th>Contact</th></tr></thead><tbody>{guide.hops.additions.map((h, i) => <tr key={i}><th scope="row">{h.name}<span className="block yeast-small">{h.dayOffset == null ? 'Jour à préciser' : `J+${fmt(h.dayOffset)}`} · {fmt(h.weightG)} g</span></th><td>{h.phase === 'active' ? 'Active' : h.phase === 'post' ? 'Après fermentation' : 'À préciser'}</td><td>{fmt(h.contactHours)} h · {fmt(h.temperatureC)} °C</td></tr>)}</tbody></table>}
      <p className="yeast-small">Consignes prévues. Les relevés et les ajouts réels restent dans le journal.</p>
      {guide.sources.map((s, i) => <p key={i} className="yeast-small">{/^https?:\/\//.test(s.reference) ? <a className="yeast-source" href={s.reference} target="_blank" rel="noreferrer">{s.author} · {s.title}</a> : `${s.author} · ${s.title}`}</p>)}
    </div></details>
    {(phase === 'preparation' || phase === 'finish' || phase === 'recipe') && <YeastStrainDetails information={guide.strainInformation} />}
  </aside>;
}
