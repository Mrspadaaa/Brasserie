import type { calculateWaterTreatment } from "../../domain/water";
import { formatDecimal } from "../numericInput";

type Props = {
  treatment: ReturnType<typeof calculateWaterTreatment>;
  mashWaterL: number;
  spargeWaterL: number;
};

const decimal = (value: number) => formatDecimal(Math.round(value * 10) / 10);

/** Displays the shared treatment result; dilution, acid and mixing stay in the domain. */
export function WaterBicarbonateBalance({ treatment, mashWaterL, spargeWaterL }: Props) {
  if (![mashWaterL, spargeWaterL].every((v) => Number.isFinite(v) && v >= 0) ||
    mashWaterL + spargeWaterL <= 0) return null;

  const waters = [
    { key: "mash" as const, name: "Empâtage", litres: mashWaterL, start: treatment.start, acid: treatment.mashAcid },
    { key: "sparge" as const, name: "Rinçage", litres: spargeWaterL, start: treatment.startSparge, acid: treatment.spargeAcid },
  ].filter((water) => water.litres > 0);

  return (
    <section aria-label="Bilan du bicarbonate des eaux" className="space-y-2 text-sm text-cave-200">
      <h3 className="font-semibold text-cave-50">HCO₃ après acide</h3>
      <dl className="space-y-1.5">
        {waters.map((water) => (
          <div key={water.key} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <dt>{water.name} ({decimal(water.litres)} L)</dt>
            <dd className="tabular-nums text-cave-50">{decimal(treatment.treated[water.key].hco3)} ppm</dd>
          </div>
        ))}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-cave-700 pt-2 font-semibold">
          <dt>Moyenne sur {decimal(mashWaterL + spargeWaterL)} L</dt>
          <dd className="tabular-nums text-water">{decimal(treatment.treatedTotal.hco3)} ppm</dd>
        </div>
      </dl>
      <p className="text-xs leading-snug">
        {waters.length > 1
          ? "Le graphique utilise cette moyenne, pondérée par les volumes des deux eaux."
          : "Le graphique utilise cette eau après traitement."}
      </p>
      <details>
        <summary className="min-h-touch cursor-pointer py-1 underline decoration-cave-600 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-water focus-visible:outline-offset-2">
          Départ, sels et acide
        </summary>
        <table className="w-full table-fixed text-xs leading-snug">
          <caption className="sr-only">Évolution du bicarbonate par eau</caption>
          <thead>
            <tr className="border-b border-cave-700">
              <th scope="col" className="w-[38%] pb-2 text-left font-normal">HCO₃ en ppm</th>
              {waters.map((water) => <th key={water.key} scope="col" className="pb-2 pl-1 text-right font-semibold">{water.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="py-2 text-left font-normal">Après dilution</th>
              {waters.map((water) => <td key={water.key} className="py-2 pl-1 text-right tabular-nums">{decimal(water.start.hco3)}</td>)}
            </tr>
            <tr>
              <th scope="row" className="py-2 text-left font-normal">Après sels</th>
              {waters.map((water) => <td key={water.key} className="py-2 pl-1 text-right tabular-nums">{decimal(treatment.raw[water.key].hco3)}</td>)}
            </tr>
            <tr>
              <th scope="row" className="py-2 text-left font-normal">Dose d’acide</th>
              {waters.map((water) => <td key={water.key} className="py-2 pl-1 text-right tabular-nums">{decimal(water.acid.amount)} {water.acid.unit}</td>)}
            </tr>
            <tr className="border-t border-cave-700 text-cave-50">
              <th scope="row" className="py-2 text-left font-semibold">Après acide</th>
              {waters.map((water) => <td key={water.key} className="py-2 pl-1 text-right font-semibold tabular-nums">{decimal(treatment.treated[water.key].hco3)}</td>)}
            </tr>
            <tr>
              <th scope="row" className="py-1 text-left font-normal">Acide pour HCO₃ = 0</th>
              {waters.map((water) => <td key={water.key} className="py-1 pl-1 text-right tabular-nums">
                {treatment.acidBalance[water.key]
                  ? `≈ ${decimal(treatment.acidBalance[water.key]!.neutralizationAmount)} ${water.acid.unit}` : '—'}
              </td>)}
            </tr>
            <tr>
              <th scope="row" className="py-1 text-left font-normal">Acide au-delà</th>
              {waters.map((water) => <td key={water.key} className="py-1 pl-1 text-right tabular-nums">
                {treatment.acidBalance[water.key]
                  ? `${decimal(treatment.acidBalance[water.key]!.beyondWaterAmount)} ${water.acid.unit}` : '—'}
              </td>)}
            </tr>
          </tbody>
        </table>
        <p className="pt-2 text-xs leading-snug">
          Chaque eau conserve sa dilution et sa dose d’acide. Cette moyenne ne calcule pas l’équilibre du moût après mélange avec les malts.
          L’acide au-delà du HCO₃ peut encore agir sur leurs tampons et abaisser le pH. Neutraliser tout le HCO₃ n’est pas une consigne de dosage.
        </p>
      </details>
    </section>
  );
}
