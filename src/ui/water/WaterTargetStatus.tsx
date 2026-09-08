import { Check, Info } from "lucide-react";
import type { calculateWaterTreatment, estimateMashPh, RaBand } from "../../domain/water";
import { ION_LABEL, MASH_PH_BAND } from "../../domain/water";
import type { StyleWater } from "../../domain/waterStyles";
import { formatDecimal } from "../numericInput";
import { WaterBicarbonateBalance } from "./WaterBicarbonateBalance";
import { assessWaterProfile, PROFILE_IONS } from "../../domain/water/profileAssessment";
import { diagnoseWaterProfile, type ProfileDiagnosis } from "../../domain/water/profileDiagnosis";

type Props = {
  style: StyleWater;
  treatment: ReturnType<typeof calculateWaterTreatment>;
  raBand: RaBand;
  beerEbc: number | null;
  customTarget?: boolean;
  mashWaterL: number;
  spargeWaterL: number;
  phEstimate?: ReturnType<typeof estimateMashPh>;
  targetPh?: number;
  diagnoses?: ProfileDiagnosis[];
};

const decimal = (value: number) => formatDecimal(Math.round(value * 10) / 10);

/** Separates the flavour profile from the mash alkalinity and the two acid additions. */
export function WaterTargetStatus({
  style,
  treatment,
  raBand,
  beerEbc,
  customTarget = false,
  mashWaterL,
  spargeWaterL,
  phEstimate,
  targetPh = MASH_PH_BAND.target,
  diagnoses,
}: Props) {
  if (!Number.isFinite(mashWaterL) || !Number.isFinite(spargeWaterL) ||
    mashWaterL < 0 || spargeWaterL < 0 || mashWaterL + spargeWaterL <= 0) return null;

  const minerals = PROFILE_IONS.filter((ion) => !style.untargetedIons?.includes(ion));
  const assessment = assessWaterProfile(treatment.treatedTotal, style.ions, minerals);
  const explanations = diagnoses ?? diagnoseWaterProfile({ actual: treatment,
    ranges: { ...style.ions, ...(customTarget && treatment.hco3Range ? { hco3: treatment.hco3Range } : {}) },
    targeted: minerals, totalWaterL: mashWaterL + spargeWaterL, spargeWaterL,
  });
  const outside = assessment.deviations.map(item => item.ion);
  if (treatment.hco3Target && !treatment.hco3Target.reached && !outside.includes('hco3')) outside.push('hco3');
  const reached = minerals.length - outside.length;
  const personal = customTarget || style.code === "~";
  const bicarbonate = treatment.treatedTotal.hco3;
  const bicarbonateRange = style.ions.hco3;
  const explainBicarbonate = !personal &&
    (bicarbonate < bicarbonateRange.min || bicarbonate > bicarbonateRange.max);
  const bicarbonateBelow = bicarbonate < bicarbonateRange.min;
  const bicarbonateGap = bicarbonateBelow ? bicarbonateRange.min - bicarbonate : bicarbonate - bicarbonateRange.max;
  const hasMash = mashWaterL > 0;
  const hasSparge = spargeWaterL > 0;
  const raInRange = treatment.raAfter >= raBand.min && treatment.raAfter <= raBand.max;
  const paleWithDarkProfile = beerEbc != null && Number.isFinite(beerEbc) &&
    beerEbc <= 12 && bicarbonateRange.min >= 100;

  return (
    <section aria-label="Bilan des objectifs de l’eau" className="space-y-3 text-sm leading-snug">
      {minerals.length > 0 && (
        <div className="space-y-1">
          <p className="flex items-start gap-2 font-semibold text-cave-50">
            {outside.length === 0
              ? <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-hop" />
              : <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ebc-straw" />}
            <span>
              {outside.length === 0 ? "Profil atteint" : "Profil non atteint"} : {reached}/{minerals.length} ions dans les plages{personal ? " personnelles" : ""}.
            </span>
          </p>
          {outside.length > 0 && (
            <p className="pl-6 text-cave-200">
              {outside.map((ion) => `${ION_LABEL[ion]} : ${decimal(treatment.treatedTotal[ion])} ppm pour ${decimal(style.ions[ion].min)}–${decimal(style.ions[ion].max)}`).join(" ; ")}.
            </p>
          )}
          {!personal && treatment.bicarbonatePreference?.reason === 'profile-conflict' && <p
            aria-label="Profil HCO₃ et besoins des malts" className="pl-6 text-ebc-straw">
            Le minimum HCO₃ du profil ({decimal(bicarbonateRange.min)} ppm) dépasse déjà le repère d’alcalinité de cet empâtage.
            Le dosage automatique vise ce minimum : aller plus haut augmenterait encore le pH estimé.
            Vérifie le profil choisi pour ces malts et mesure le pH au brassage.
          </p>}
          {explanations.length > 0 && <div aria-label="Pourquoi le profil n’est pas atteint" className="pl-6 text-cave-200 space-y-2">
            <p>{explanations[0].message}</p>
            {explanations.length > 1 && <details>
              <summary className="min-h-11 flex items-center cursor-pointer text-water underline underline-offset-2">Autres contraintes ({explanations.length - 1})</summary>
              <ul className="space-y-2 pb-1">{explanations.slice(1).map((item, index) => <li key={`${item.code}-${index}`}>{item.message}</li>)}</ul>
            </details>}
          </div>}
        </div>
      )}

      <WaterBicarbonateBalance treatment={treatment} mashWaterL={mashWaterL} spargeWaterL={spargeWaterL} />

      {phEstimate && hasMash && (
        <div aria-label="Bilan du pH estimé" className="space-y-1 text-cave-200">
          {phEstimate.known ? (
            <>
              <p>
                <strong className="text-cave-50">pH estimé : {phEstimate.phPredicted.toFixed(2).replace(".", ",")} ±{formatDecimal(phEstimate.uncertainty)}</strong>.
                {" "}Consigne : {formatDecimal(targetPh)}.
              </p>
              <p className={phEstimate.position === 0 ? "text-cave-200" : "text-ebc-straw"}>
                Estimation {phEstimate.position === 1 ? "au-dessus de" : phEstimate.position === -1 ? "sous" : "dans"} la plage {formatDecimal(MASH_PH_BAND.min)}–{formatDecimal(MASH_PH_BAND.max)}.
                {phEstimate.position === 0
                  ? " Le pH reste à mesurer au brassage."
                  : " L’acide calculé traite l’alcalinité ; la correction du pH se décide après mesure."}
              </p>
              {phEstimate.limited && <p className="text-ebc-straw">Limite du modèle atteinte : la valeur affichée est plafonnée, pas le pH réel. Mesure nécessaire avant une correction.</p>}
            </>
          ) : (
            <p>pH non estimé. Renseigne la couleur EBC des malts pour comparer à la consigne de {formatDecimal(targetPh)}.</p>
          )}
        </div>
      )}

      {explainBicarbonate && (
        <div aria-label="Comprendre le bicarbonate" className="space-y-1 border-l-2 border-water pl-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-cave-50">HCO₃ {bicarbonateBelow ? "sous la cible" : "au-dessus de la cible"}</h3>
            <p aria-label="Écart HCO₃ à la cible" className="text-cave-50">
              <strong className="tabular-nums">{decimal(bicarbonate)} ppm</strong> : {decimal(bicarbonateGap)} ppm {bicarbonateBelow ? "sous le minimum" : "au-dessus du maximum"} de {decimal(bicarbonateBelow ? bicarbonateRange.min : bicarbonateRange.max)} ppm.
            </p>
            <p className="text-cave-200">
              Le profil {style.name} indique {decimal(bicarbonateRange.min)}–{decimal(bicarbonateRange.max)} ppm.
              {hasMash && " Le dosage automatique cherche cette plage après les deux doses d’acide. Les doses manuelles restent conservées."}
              {" "}Le HCO₃ total inclut {hasMash && hasSparge ? "l’empâtage et le rinçage" : hasMash ? "uniquement l’empâtage" : "uniquement le rinçage"}.
            </p>
            {paleWithDarkProfile && (
              <p className="text-cave-200">
                Ta recette est estimée à {decimal(beerEbc)} EBC : elle est pâle malgré le profil {style.name}.
                Le profil d’eau choisi reste l’objectif ; le pH de cette recette est à vérifier séparément.
              </p>
            )}
          </div>

          {hasMash && <details>
            <summary className="min-h-touch cursor-pointer py-3 text-cave-200 underline decoration-cave-600 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-water focus-visible:outline-offset-2">
              Voir l’objectif d’empâtage
            </summary>
            <div className="space-y-3 pb-2">
              {hasMash && (
                <div className="space-y-1">
                  <p className="font-semibold text-cave-200">Objectif d’empâtage : alcalinité résiduelle</p>
                  <p className="text-cave-200">
                    Après acide : <strong className="tabular-nums text-cave-50">{Math.round(treatment.raAfter)} ppm CaCO₃</strong>.
                    {" "}Plage calculée pour la recette : {decimal(raBand.min)} à {decimal(raBand.max)} ppm CaCO₃.
                  </p>
                  <p className={raInRange ? "text-hop" : "text-ebc-straw"}>
                    {raInRange
                      ? "L’alcalinité de l’empâtage est dans cette plage."
                      : "L’alcalinité de l’empâtage est hors de cette plage ; vérifie les doses retenues et le pH au brassage."}
                  </p>
                </div>
              )}
            </div>
          </details>}
        </div>
      )}
    </section>
  );
}
