import React, { useMemo, useState } from 'react';
import type { HopIngredient } from '../types';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { hotBitterness, bitternessScience, type HotBitterness } from '../domain/hopBitterness';
import { dryHopBitterness } from '../../functions/src/hopBitternessCore';
import { NumberInput } from './NumberInput';
import { formatDecimal } from './numericInput';
import type { HopRange } from '../../functions/src/hopIndexSchema';

// Round outwards so small values and very narrow ranges are not erased.
const rangeText = (r: HopRange) => `${formatDecimal(Math.floor(r.min * 10) / 10)}–${formatDecimal(Math.ceil(r.max * 10) / 10)}`;
export function HopBitternessPanel({ hops, volumeL, og, boilMin, hot: supplied }: {
  hops: HopIngredient[]; volumeL: number; og: number | null; boilMin: number; hot?: HotBitterness;
}) {
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const science = useMemo(() => bitternessScience(knowledge), [knowledge]);
  const hot = supplied ?? hotBitterness(hops, volumeL, og, boilMin);
  const cold = hops.filter(h => h.stage === 'dryHop');
  const grams = cold.every(h => Number.isFinite(h.weightG) && h.weightG >= 0) ? cold.reduce((sum,h) => sum + h.weightG, 0) : null;
  const [simulate, setSimulate] = useState(false);
  const [hum, setHum] = useState<HopRange | null>(null);
  const assumed = hum ?? science?.humulinonesPct.range;
  const projection = simulate ? dryHopBitterness({ grams, volumeL, hotIbu: hot.total == null ? null : { min: hot.total, max: hot.total }, ...(hum ? {humulinonesPct:hum} : {}) }, science) : null;
  if (!hops.length) return null;
  return <section aria-label="Amertume des houblons" className="panel p-3 space-y-2 text-sm">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="font-semibold text-cave-50">IBU à chaud · Tinseth</span>
      <strong data-hot-ibu={hot.total ?? ''} className="reading text-ebc-straw">{hot.total == null ? 'À compléter' : formatDecimal(Math.round(hot.total * 10) / 10)}</strong>
    </div>
    {hot.missing.length > 0 && <p role="status" className="text-xs text-ebc-amber">{hot.missing.join(' · ')}.{hot.known > 0 && ` Part connue : ${formatDecimal(Math.round(hot.known*10)/10)} IBU.`}</p>}
    {cold.length > 0 && <>
      <label className="flex items-center gap-2 min-h-11 cursor-pointer text-cave-50"><input type="checkbox" aria-label="Simuler l’amertume à cru" checked={simulate} onChange={e=>setSimulate(e.target.checked)} className="accent-ebc-straw w-4 h-4"/>Simuler l’amertume à cru<span className="ml-auto text-xs reading text-cave-200">{grams != null && volumeL > 0 ? `${formatDecimal(Math.round(grams/volumeL*100)/100)} g/L` : 'dose à préciser'}</span></label>
      {!simulate && <p className="text-xs text-cave-200">Le dry hop peut modifier l’amertume. Il n’entre pas dans la formule Tinseth.</p>}
      {projection && <div className="space-y-2" aria-live="polite">
        {projection.finalEquivalent && <div className="rounded-control bg-cave-950 p-3 space-y-1" data-dry-bitterness-min={projection.finalEquivalent.min} data-dry-bitterness-max={projection.finalEquivalent.max}>
          <span className="text-xs text-water">Scénario pellets · 16 °C · 1–5 jours</span>
          <p className="reading text-lg text-cave-50">{rangeText(projection.finalEquivalent)} <span className="text-xs">mg/L éq. iso-α</span></p>
          <p className="text-xs text-cave-200">Confiance faible · plage de scénarios. Les IBU de laboratoire restent à mesurer.</p>
        </div>}
        {!projection.finalEquivalent && <p className="text-xs text-ebc-amber">{projection.reasons.join(' ')}</p>}
        <details><summary className="min-h-11 cursor-pointer flex items-center text-water">Hypothèses à cru et source</summary>
          <div className="space-y-3 text-xs text-cave-200">
            <p>Le calcul transpose des essais sur pellets Cascade et Centennial à 16 °C, pendant 1–5 jours. Les pertes d’iso-alpha et l’extraction restent liées au même essai. Un autre lot, une autre température, une fermentation active ou une bière NOLO peuvent sortir de cette plage.</p>
            <p>L’amertume à chaud sert ici de proxy d’iso-alpha initial. Ni le pH, ni les polyphénols, ni les autres composés du test IBU ne sont chiffrés. Cette projection n’est pas une analyse finale.</p>
            {assumed && <><p>Humulinones du houblon (% masse) · hypothèse de simulation</p><div className="grid grid-cols-2 gap-3">
              <label>Minimum<NumberInput aria-label="Humulinones minimales supposées en pourcent" className="block w-full mt-1 min-h-11 rounded-control bg-cave-950 border border-cave-700 px-2" value={assumed.min} min={0} max={100} onValue={value=>setHum({min:value,max:assumed.max})}/></label>
              <label>Maximum<NumberInput aria-label="Humulinones maximales supposées en pourcent" className="block w-full mt-1 min-h-11 rounded-control bg-cave-950 border border-cave-700 px-2" value={assumed.max} min={0} max={100} onValue={value=>setHum({min:assumed.min,max:value})}/></label>
            </div><p>{science?.humulinonesPct.limitation}</p>{hum && <button type="button" className="min-h-11 underline text-water" onClick={()=>setHum(null)}>Reprendre les deux lots de référence</button>}</>}
            <p>Les acides alpha du sachet ne sont pas convertis en humulinones. Diviser les ajouts en plusieurs lignes ne change pas la dose cumulée.</p>
            {science && <a className="inline-flex min-h-11 items-center underline text-water" href={science.source.reference} target="_blank" rel="noreferrer">Maye et al. · 2016 · essais et limites</a>}
          </div>
        </details>
      </div>}
    </>}
    {hops.some(h=>h.stage==='whirlpool'||h.stage==='firstWort') && <details><summary className="min-h-11 cursor-pointer flex items-center text-xs text-water">Modèle à chaud et limites</summary><p className="text-xs text-cave-200">Tinseth utilise le volume final de bière. Les facteurs de premier moût et de whirlpool sont les approximations historiques de l’application ; le refroidissement réel et les pertes de la brasserie peuvent modifier le résultat.</p></details>}
  </section>;
}
