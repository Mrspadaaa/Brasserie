import { useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { NumberInput } from '../NumberInput';
import { formatDecimal, messageRefus } from "../numericInput";
import { equipmentCheck, r1, MASH_WATER_EXPANSION } from "../../domain/brewEquipment";
import { waterBalance } from "../../domain/water/volumeBalance";
import { GradueSlider, type GradueLabel } from "./GradueSlider";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
import { nombreFr } from '../../domain/nombreAffiche';
type Props = Pick<
  WaterWorkshopModel,
  | "beerVolumeL"
  | "brew"
  | "onMashRatioChange"
  | "state"
  | "onNoSpargeChange"
  | "set"
  | "mashRatioLPerKg"
  | "vol"
  | "hasSparge"
>;

/** Écart des grands traits d'une échelle de litres : ~7 grands traits au plus. */
function graduation(max: number): { major: number; minor: number } {
  const major = max <= 8 ? 1 : max <= 16 ? 2 : max <= 40 ? 5 : 10;
  return { major, minor: major >= 5 ? major / 5 : major / 2 };
}

/** Une cuve dessinée : le niveau suit la valeur sur l'échelle de la cuve. */
function Cuve({ part, hors = false }: { part: number; hors?: boolean }) {
  const h = Math.max(0, Math.min(1, part)) * 26;
  return (
    <svg viewBox="0 0 24 32" width="20" height="28" aria-hidden="true">
      <path d="M3 3v24a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {h > 0 && <rect x="4" y={29 - h} width="16" height={h} fill={hors ? "rgb(var(--attention))" : "rgb(var(--water))"} />}
    </svg>
  );
}

export function WaterVolumes({
  beerVolumeL,
  brew,
  onMashRatioChange,
  state,
  onNoSpargeChange,
  set,
  mashRatioLPerKg,
  vol,
  hasSparge,
}: Props) {
  // BR-84 : « 2,5 » tapé revenait « 2,51 » (recalculé depuis le volume arrondi au dixième). Le nombre tapé reste affiché tant que
  // le volume qu'il donne (ratio × grain, au dixième) est celui du plan ; BR-85 : « −1 L/kg » est refusé et dit.
  const [ratioSaisi, setRatioSaisi] = useState<number | null>(null);
  const [refusRatio, setRefusRatio] = useState<string | null>(null);
  // RX-2 : un volume tapé hors bornes se dit, comme à l'étape d'avant (InlineNum).
  const [ditMash, setDitMash] = useState<string | null>(null);
  const [ditSparge, setDitSparge] = useState<string | null>(null);
  const litres = (n: number) => Number.isFinite(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—';
  const grainKg = brew?.totalGristKg ?? 0;
  const moreSparge = hasSparge && grainKg > 0 && state.spargeWaterL > state.mashWaterL;
  const check = equipmentCheck(brew?.equipment, {
    volumeL: beerVolumeL,
    grainKg,
    mashL: state.mashWaterL,
    spargeL: hasSparge ? state.spargeWaterL : 0,
    preBoilHotL: vol?.preBoilHotL,
    preferences: brew?.preferences,
  });
  // MV-31 : le moût collecté avec CES volumes d'eau, pas la cible du calcul.
  const balance = vol && vol.preBoilVolumeL > 0
    ? waterBalance({ mashWaterL: state.mashWaterL, spargeWaterL: hasSparge ? state.spargeWaterL : 0, preBoilVolumeL: vol.preBoilVolumeL, grainAbsorptionL: vol.grainAbsorptionL })
    : null;
  const physicalRatio = brew?.equipment && grainKg > 0 ? (brew.equipment.kettleWorkingL-grainKg*brew.equipment.grainDisplacementLPerKg)/1.03/grainKg : 6;
  const ratioAffiche = ratioSaisi !== null && Number.isFinite(state.mashWaterL) && grainKg > 0 && r1(ratioSaisi * grainKg) === r1(state.mashWaterL)
    ? ratioSaisi
    : Number(mashRatioLPerKg.toPrecision(15));
  const ratioMax = Math.max(6,Number.isFinite(physicalRatio)?physicalRatio:6,Number.isFinite(mashRatioLPerKg)?mashRatioLPerKg:6);

  // Les bornes des cuves viennent de l'équipement (brewEquipment.ts) : dessinées, jamais imposées (les champs n'ont pas de maximum).
  const eq = brew?.equipment;
  const mashMax = eq ? Math.max(eq.kettleWorkingL, Math.ceil(state.mashWaterL || 0)) : Math.max(35, Math.ceil(state.mashWaterL || 0));
  const mashZone = eq && grainKg > 0 && Number.isFinite(physicalRatio) ? r1(physicalRatio * grainKg) : undefined;
  const maxHot = brew?.preferences?.maximumSpargeHotL;
  const spargeMax = Math.max(
    maxHot != null ? Math.floor((maxHot / MASH_WATER_EXPANSION) * 10) / 10 : check?.spargeFillL != null ? Math.ceil(check.spargeFillL * 1.35) : 25,
    Math.ceil(state.spargeWaterL || 0),
  );
  const spargeZone = check?.spargeFillL;
  const gm = graduation(mashMax);
  const gs = graduation(spargeMax);
  const labelsDe = (max: number, zone?: number): GradueLabel[] => [
    { v: 0, text: "0" },
    ...(zone != null && zone > 0 && zone < max ? [{ v: zone, text: litres(zone), borne: true }] : []),
    { v: max, text: litres(max) },
  ];
  const forme = (saisi: number, retenu: number | undefined) =>
    `${formatDecimal(saisi)} L est hors bornes : au moins 0 L. ${retenu === undefined ? "Rien" : formatDecimal(retenu) + " L"} retenu.`;
  const mashOk = Number.isFinite(state.mashWaterL);
  const spargeOk = Number.isFinite(state.spargeWaterL);

  const messages = (
    <>
      {hasSparge && grainKg <= 0 && (
        <p className="text-2xs text-ebc-amber leading-snug">
          Aucun grain saisi : le partage empâtage / rinçage ne veut encore
          rien dire. Il se recalculera dès que la facture de grain sera posée.
        </p>
      )}
      {balance?.shortL ? (
        <p role="alert" data-role="eau-insuffisante">
          <strong>Il manque {litres(balance.shortL)} L d’eau.</strong> Avec {litres(r1(state.mashWaterL + (hasSparge ? state.spargeWaterL : 0)))} L et {litres(vol!.grainAbsorptionL)} L retenus par le grain, tu ne collectes que {litres(balance.collectedL)} L de moût pour {litres(balance.targetL)} L visés.
        </p>
      ) : null}
      {check?.spargeTooMuch && <p role="alert">Au-dessus des {nombreFr(check.spargeMaximumHotL, 1)} L exceptionnels à chaud. Augmente l’eau d’empâtage si la cuve le permet, ou réduis le brassin.</p>}
      {check?.spargeStatus === 'exception' && <p>Rinçage exceptionnel : confirme la bouilloire annexe dans les choix de cette recette.</p>}
      {check?.mashTooFull && (
        <p role="alert">
          <strong>Empâtage trop volumineux.</strong> Avec le grain, environ {litres(check.occupiedL)} L à chaud pour {litres(brew!.equipment!.kettleWorkingL)} L utiles. {hasSparge ? 'Reporte une partie de l’eau au rinçage ou réduis le volume du brassin.' : 'Prévois un rinçage ou réduis le volume du brassin.'}
        </p>
      )}
      {mashRatioLPerKg > 8 && onMashRatioChange && hasSparge && grainKg > 0 && <p>Au-delà de 8 L/kg, l’estimation de pH sort de son domaine. Mesure le pH ; aucun résultat chiffré fiable n’est déduit de ce ratio.</p>}
    </>
  );
  const aMessages = (hasSparge && grainKg <= 0) || !!balance?.shortL || !!check?.spargeTooMuch || check?.spargeStatus === 'exception' || !!check?.mashTooFull
    || (mashRatioLPerKg > 8 && !!onMashRatioChange && hasSparge && grainKg > 0);

  return (
    <>
      <section className="ew-cuves" aria-label="Les deux cuves">
        <article className="ew-cuve" aria-label="Cuve d’empâtage">
          <div className="ew-ch">
            <Cuve part={mashOk ? state.mashWaterL / mashMax : 0} hors={mashZone != null && state.mashWaterL > mashZone} />
            <b>Empâtage</b>
          </div>
          <label className="ew-vol">
            <NumberInput
              id="wz-mash-water"
              emptyValue={Number.NaN}
              required
              aria-invalid={!mashOk}
              aria-label="Volume d’eau d’empâtage, en litres"
              min={0}
              pad
              value={state.mashWaterL}
              onValue={(v) => set({ mashWaterL: v })}
              onRefus={(r) => setDitMash(r ? forme(r.saisi, r.retenu) : null)}
              className="ew-in ew-in-l"
            />
            <span className="ew-u">L</span>
          </label>
          {ditMash && <p role="status" data-role="borne-refusee" className="ew-refus">{ditMash}</p>}
          <GradueSlider
            value={state.mashWaterL}
            min={0}
            max={mashMax}
            step={0.1}
            onChange={(v) => set({ mashWaterL: v })}
            ariaLabel={mashZone != null ? `Eau d’empâtage, 0 à ${litres(mashMax)} litres utiles ; au-delà de ${litres(mashZone)} L, la maische déborde avec le grain` : `Eau d’empâtage, 0 à ${litres(mashMax)} litres`}
            zoneFrom={mashZone}
            major={gm.major}
            minor={gm.minor}
            labels={labelsDe(mashMax, mashZone)}
          />
        </article>

        <article className={`ew-cuve${hasSparge ? "" : " ew-off"}`} aria-label="Cuve de rinçage">
          <div className="ew-ch">
            <Cuve part={hasSparge && spargeOk ? state.spargeWaterL / spargeMax : 0} hors={spargeZone != null && state.spargeWaterL > spargeZone} />
            <b>Rinçage</b>
            <button
              type="button"
              role="switch"
              aria-checked={hasSparge}
              aria-label={`Eau de rinçage — ${hasSparge ? "utilisée" : "aucune"}`}
              onClick={() => onNoSpargeChange(hasSparge)}
              className="ew-swi"
            >
              <span className="ew-swi-z" aria-hidden="true" />
            </button>
          </div>
          {hasSparge ? (
            <>
              <label className="ew-vol">
                <NumberInput
                  id="wz-sparge-water"
                  emptyValue={Number.NaN}
                  required
                  aria-invalid={!spargeOk}
                  aria-label="Volume d’eau de rinçage, en litres"
                  min={0}
                  pad
                  value={state.spargeWaterL}
                  onValue={(v) => set({ spargeWaterL: v })}
                  onRefus={(r) => setDitSparge(r ? forme(r.saisi, r.retenu) : null)}
                  className="ew-in ew-in-l"
                />
                <span className="ew-u">L</span>
              </label>
              {ditSparge && <p role="status" data-role="borne-refusee" className="ew-refus">{ditSparge}</p>}
              <GradueSlider
                value={state.spargeWaterL}
                min={0}
                max={spargeMax}
                step={0.1}
                onChange={(v) => set({ spargeWaterL: v })}
                ariaLabel={spargeZone != null ? `Eau de rinçage, 0 à ${litres(spargeMax)} litres ; au-delà de ${litres(spargeZone)} L, la bouilloire annexe complète la cuve` : `Eau de rinçage, 0 à ${litres(spargeMax)} litres`}
                zoneFrom={spargeZone}
                major={gs.major}
                minor={gs.minor}
                labels={labelsDe(spargeMax, spargeZone)}
              />
            </>
          ) : (
            <p className="ew-offp">Sans rinçage — tout à l’empâtage.</p>
          )}
        </article>
      </section>

      {onMashRatioChange && hasSparge && grainKg > 0 && (
        <div className="ew-li">
          <label htmlFor="w-mash-ratio" className="ew-nm">Eau / grain</label>
          <GradueSlider
            id="w-mash-ratio"
            value={Math.max(2.5, Number.isFinite(mashRatioLPerKg) ? mashRatioLPerKg : 4.2)}
            min={2.5}
            max={ratioMax}
            step={0.1}
            onChange={(v) => { setRatioSaisi(null); onMashRatioChange(v); }}
            ariaLabel="Épaisseur de maische"
            zoneFrom={eq && Number.isFinite(physicalRatio) ? Number(physicalRatio.toFixed(1)) : undefined}
            major={0.5}
            minor={0.1}
            labels={[
              { v: 2.5, text: "2,5" },
              ...(eq && Number.isFinite(physicalRatio) && physicalRatio > 2.5 && physicalRatio < ratioMax ? [{ v: physicalRatio, text: litres(physicalRatio), borne: true }] : []),
              ...(ratioMax > 4.5 ? [{ v: 4.5, text: "4,5" }] : []),
              { v: ratioMax, text: litres(ratioMax) },
            ]}
          />
          <span className="ew-num">
            <NumberInput aria-label="Rapport eau grain exact en litres par kilogramme" value={ratioAffiche} fractionDigits={2} onValue={(v) => { setRatioSaisi(v); onMashRatioChange(v); }} min={0.1} rejeter onRefus={(r) => setRefusRatio(r ? messageRefus(r.saisi, r.retenu, { min: 0.1, unite: "L/kg" }) : null)} className="ew-in ew-in-m" />
            <span className="ew-u">L/kg</span>
          </span>
        </div>
      )}
      {refusRatio && <p role="alert" data-role="refus" className="ew-refus">{refusRatio}</p>}

      {vol && vol.preBoilVolumeL > 0 && (
        <div className="ew-faits">
          <span>{balance?.shortL ? "Moût collecté" : "Avant ébullition"} <b>{litres(balance?.shortL ? balance.collectedL : vol.preBoilVolumeL)}</b> L</span>
          {check && hasSparge && state.spargeWaterL > 0 && <span>Rinçage à chaud <b>{litres(check.spargeHotL)}</b> L</span>}
          <details className="ew-cv">
            <summary aria-label={moreSparge ? "Comprendre — pourquoi plus d’eau au rinçage ?" : "Comprendre les volumes"}>
              Comprendre<ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div>
              <p>
                Eau à préparer, à froid : {litres(r1(state.mashWaterL + state.spargeWaterL))} L. {balance?.shortL ? "Moût collecté avec cette eau, à froid" : "Moût avant ébullition, à froid"} : {litres(balance?.shortL ? balance.collectedL : vol.preBoilVolumeL)} L.
              </p>
              <p>
                Pour collecter {litres(vol.preBoilVolumeL)} L de moût, il faut environ {litres(r1(vol.preBoilVolumeL + vol.grainAbsorptionL))} L d’eau : {litres(vol.grainAbsorptionL)} L restent dans les drêches.
              </p>
              {moreSparge && <p>
                Avec {litres(grainKg)} kg de grain et {litres(mashRatioLPerKg)} L/kg, l’empâtage utilise {litres(state.mashWaterL)} L. Le rinçage complète la collecte ; il peut dépasser l’empâtage avec peu de grain ou une longue ébullition.
              </p>}
              <p>
                {brew?.boilMin != null ? `Ébullition de ${litres(brew.boilMin)} min` : 'Ébullition'} : {litres(vol.boilOffL)} L évaporés, en équivalent à froid. La collecte prévoit aussi les pertes pour atteindre {litres(beerVolumeL)} L en fermenteur.
                {vol.preBoilHotL != null && <> À ébullition, les {litres(vol.preBoilVolumeL)} L occupent environ {litres(vol.preBoilHotL)} L.</>}
              </p>
              {check && check.spargeAuxiliaryHotL > .01 && <p>
                Répartis l’eau osmosée, les sels et l’acide proportionnellement entre le récipient principal et la bouilloire annexe ; contrôle les températures avant de rincer. Le complément calculé n’est pas une capacité supposée de la bouilloire.
              </p>}
              {onMashRatioChange && hasSparge && grainKg > 0 && <p>
                Plus d’eau à l’empâtage réduit le rinçage, à volume total calculé identique. Après un changement, vérifie les doses de sels et d’acide.
              </p>}
            </div>
          </details>
        </div>
      )}
      {vol && vol.preBoilVolumeL > 0 && check && hasSparge && state.spargeWaterL > 0 && (
        <p role="status" className="ew-sr">
          {check.spargeAuxiliaryHotL > .01 ? (
            <><strong>Rinçage à chaud : {litres(check.spargeHotL)} L.</strong>{' '}
              {litres(check.spargeMainHotL)} L dans le récipient principal + {litres(check.spargeAuxiliaryHotL)} L avec la bouilloire annexe.</>
          ) : (
            <><strong>Rinçage à chaud : {litres(check.spargeHotL)} L</strong> dans le récipient principal.</>
          )}
        </p>
      )}
      {aMessages && (
        <div className="ew-msg" data-role="messages-volumes">
          <AlertTriangle size={16} aria-hidden="true" />
          <div>{messages}</div>
        </div>
      )}
    </>
  );
}
