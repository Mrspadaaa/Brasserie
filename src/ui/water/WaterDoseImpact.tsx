import type { ManualWaterImpact } from '../../domain/water/manualImpact';
import { ION_SYMBOL_SHORT, SALTS } from '../../domain/water';
import { formatDecimal } from '../numericInput';

const decimal = (number: number, digits = 1) => formatDecimal(Number(number.toFixed(digits)));
const signed = (number: number) => `${number > 0 ? '+' : ''}${decimal(number)}`;
const sideName = { mash: 'Empâtage', sparge: 'Rinçage' };

/** Compact consequences stay beside the edited control; details expand in place. */
export function WaterDoseImpact({ impact }: { impact: ManualWaterImpact }) {
  const { edit } = impact;
  const name = edit.kind === 'salt' ? SALTS[edit.id].name : `Acide ${sideName[edit.side].toLowerCase()}`;
  return <section aria-label={`Conséquences du réglage de ${name}`} className="mt-2 border-t border-cave-700 pt-2 text-xs leading-snug text-cave-200">
    <p className="font-semibold text-cave-50">Ton réglage : {decimal(edit.from)} → {decimal(edit.to)} {impact.unit}</p>
    <div aria-live="polite" aria-atomic="true" className="mt-1 space-y-1">
      <p>{impact.ions.map(item => `${ION_SYMBOL_SHORT[item.ion]} ${signed(item.delta)}`).join(' · ') || 'Ions affichés inchangés'}{impact.ions.length > 0 && ' ppm'}{impact.untracked && ` · ${impact.untracked.label} ${signed(impact.untracked.delta)} ppm`}.</p>
      <p className={impact.afterProfile.reached ? 'text-hop' : 'text-ebc-straw'}>
        {impact.afterProfile.inRange}/{impact.afterProfile.count} ions dans les plages.
        {impact.newlyOutside.length > 0 && ` ${impact.newlyOutside.map(item => ION_SYMBOL_SHORT[item.ion]).join(', ')} sort de la cible.`}
        {impact.restored.length > 0 && ` ${impact.restored.map(item => ION_SYMBOL_SHORT[item.ion]).join(', ')} revient dans la cible.`}
      </p>
    </div>
    <details className="mt-1">
      <summary className="min-h-11 flex items-center cursor-pointer text-water underline underline-offset-2">Effet sur le brassage</summary>
      <div className="space-y-2 pb-1">
        <p>SO₄/Cl : {impact.ratio.from == null ? 'non défini' : decimal(impact.ratio.from, 2)} → {impact.ratio.to == null ? 'non défini' : decimal(impact.ratio.to, 2)}.
          {impact.direction !== 'unchanged' && ` Orientation plus ${impact.direction === 'drier' ? 'sèche' : 'ronde'}.`}
          {impact.weakBalance && ' SO₄ et Cl sont faibles : ce rapport seul décrit peu le goût.'}
        </p>
        {impact.ph && <p>pH estimé : {decimal(impact.ph.from, 2)} → {decimal(impact.ph.to, 2)}. À confirmer par mesure.</p>}
        {impact.ph?.limited && <p className="text-ebc-straw">Limite du modèle atteinte : ce chiffre ne signifie pas que le pH est stabilisé. Davantage d’acide peut encore le faire baisser.</p>}
        {impact.acids.filter(item => item.automatic).map(item => <p key={item.side}>Acide calculé, {sideName[item.side].toLowerCase()} : {decimal(item.from)} → {decimal(item.to)} {item.unit}.</p>)}
        {edit.kind === 'acid' && impact.stageHco3.filter(item => item.side === edit.side).map(item => <p key={item.side}>HCO₃ {sideName[item.side].toLowerCase()} : {decimal(item.from)} → {decimal(item.to)} ppm.</p>)}
        <p>Les écarts incluent les deux eaux et les doses d’acide retenues.</p>
      </div>
    </details>
  </section>;
}
