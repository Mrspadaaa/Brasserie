import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { YeastDossier, YeastDossierMeasurement } from '../domain/yeastProjection';

const number = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 20 });

function measuredValue(value: YeastDossierMeasurement | undefined, unit: string) {
  if (!value) return 'Non documenté';
  const { min, max } = value.range;
  return `${value.qualifier === 'atLeast' ? '≥ ' : value.qualifier === 'upTo' ? '≤ ' : ''}${number(min)}${min === max ? '' : `–${number(max)}`} ${unit}`;
}

/** Separate product evidence from the recipe's temperature and calculated outcome. */
export function YeastEvidenceSummary({ dossier, recipe, onOpenDossier }: {
  dossier: YeastDossier; recipe: TrialRecipe; onOpenDossier: () => void;
}) {
  const temperature = dossier.temperature;
  const attenuation = dossier.documentedAttenuation ?? (recipe.yeast.attenuationBasis === 'declared' ? dossier.attenuation : undefined);
  const tolerance = dossier.alcoholTolerance;
  const setpoint = recipe.fermentation?.find(step => step.kind === 'primaire')?.tempC;
  const hasSetpoint = typeof setpoint === 'number' && Number.isFinite(setpoint);
  const inRange = hasSetpoint && temperature && (temperature.qualifier === 'atLeast' ? setpoint >= temperature.range.min
    : temperature.qualifier === 'upTo' ? setpoint <= temperature.range.max
      : setpoint >= temperature.range.min && setpoint <= temperature.range.max);
  const positionText = !temperature ? '' : temperature.qualifier === 'range' ? inRange ? 'dans la plage' : 'hors plage'
    : temperature.qualifier === 'atLeast' ? inRange ? 'au-dessus de la borne' : 'sous la borne'
      : temperature.qualifier === 'upTo' ? inRange ? 'sous la borne' : 'au-dessus de la borne'
        : inRange ? 'au repère publié' : 'écart au repère publié';
  const origin = (measurement: YeastDossierMeasurement | undefined) => measurement?.sources.some(source => source.kind === 'manufacturer') ? 'fiche' : measurement ? 'saisie' : 'souche';
  const availableSources = [...new Map([temperature, attenuation, tolerance].flatMap(measurement => measurement?.sources ?? [])
    .map(source => [source.reference, source])).values()];
  const firstSource = availableSources[0];
  const sourceIsLink = firstSource && /^https?:\/\//.test(firstSource.reference);
  const missing = !temperature || !attenuation;
  let track: { from: number; to: number; start: number; end: number; marker: number } | undefined;
  if (temperature && hasSetpoint) {
    const from = Math.floor(Math.min(temperature.range.min, setpoint!) - 2);
    const to = Math.ceil(Math.max(temperature.range.max, setpoint!) + 2);
    const fraction = (value: number) => (value - from) / (to - from) * 100;
    track = { from, to, start: temperature.qualifier === 'upTo' ? 0 : fraction(temperature.range.min),
      end: temperature.qualifier === 'atLeast' ? 100 : fraction(temperature.range.max), marker: fraction(setpoint!) };
  }
  return <section className="yc-evidence" aria-label="Repères documentés de la souche">
    <div className="yc-projection-title"><h4>Repères de la souche</h4><span className="yeast-small">Données, pas prévision</span></div>
    <dl className="yc-evidence-values">
      <div><dt>Fermentation · {origin(temperature)}</dt><dd>{measuredValue(temperature, '°C')}</dd></div>
      <div><dt>Atténuation · {origin(attenuation)}</dt><dd>{measuredValue(attenuation, '%')}</dd></div>
      {tolerance && <div><dt>Tolérance annoncée</dt><dd>{measuredValue(tolerance, '% vol')}</dd></div>}
    </dl>
    {track && <div className="yc-evidence-comparison" aria-label={`Consigne de recette ${number(setpoint!)} °C ; repère ${measuredValue(temperature, '°C')} ; ${positionText}`}>
      <div><strong>Consigne de recette</strong><span className={inRange ? 'yc-evidence-in' : 'yc-evidence-out'}>{number(setpoint!)} °C · {positionText}</span></div>
      <span className="yc-evidence-track" aria-hidden="true"><i style={{ left: `${track.start}%`, width: `${Math.max(track.end - track.start, 1)}%` }} /><b style={{ left: `${track.marker}%` }} /></span>
      <div className="yc-evidence-axis"><span>{number(track.from)} °C</span><span>{number(track.to)} °C</span></div>
    </div>}
    {!track && <p className="yeast-small">Consigne de recette : {hasSetpoint ? `${number(setpoint!)} °C` : 'à définir dans la conduite'}{!temperature ? ' · fenêtre de la souche inconnue' : ''}.</p>}
    {firstSource && <p className="yeast-small yc-evidence-source">Source des repères : {sourceIsLink ? <a href={firstSource.reference} target="_blank" rel="noreferrer">{firstSource.author} · {firstSource.title}</a> : `${firstSource.author} · ${firstSource.title}`}{availableSources.length > 1 ? ` · ${availableSources.length} sources dans la fiche` : ''}</p>}
    {missing && <button type="button" className="yeast-link" onClick={onOpenDossier}>Vérifier ou compléter les données</button>}
  </section>;
}
