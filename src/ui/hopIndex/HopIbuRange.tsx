/** A small shared readout; the scenario workshop itself stays lazy. */
const formatIbu = (value?: number | null, digits = 1) => value != null && Number.isFinite(value)
  ? value.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';

export function HopIbuRange({ current, proposed, range, currentDigits = 1 }: {
  current: number | null;
  proposed?: number | null;
  range?: { min: number; max: number };
  currentDigits?: number;
}) {
  const max = Math.max(1, (range?.max ?? 0) * 1.2, (current ?? 0) * 1.1, (proposed ?? 0) * 1.1);
  return <figure className="hop-ibu-range" aria-label="Amertume calculée et repère du style">
    <figcaption><span>IBU à chaud · Tinseth</span><strong>{formatIbu(current, currentDigits)}{proposed != null ? ` → ${formatIbu(proposed, currentDigits)}` : ''}</strong></figcaption>
    <div className="hop-ibu-track" aria-hidden="true">
      {range && <span className="hop-style-band" style={{ left: `${range.min / max * 100}%`, width: `${(range.max - range.min) / max * 100}%` }} />}
      {current != null && <i className="hop-current-mark" style={{ left: `${current / max * 100}%` }} />}
      {proposed != null && <i className="hop-proposed-mark" style={{ left: `${proposed / max * 100}%` }} />}
    </div>
    <div className="hop-scale"><span>0</span><span>{range ? `Repère du style : ${formatIbu(range.min)}–${formatIbu(range.max)} IBU` : 'Plage du style non identifiée'}</span><span>{formatIbu(max)}</span></div>
    {proposed != null && <p className="hop-small">Repère clair : actuel · jaune : scénario</p>}
  </figure>;
}
