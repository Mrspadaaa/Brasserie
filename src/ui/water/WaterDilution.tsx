import { useState } from "react";
import { ChevronDown, Droplets } from "lucide-react";
import { NumberInput } from "../NumberInput";
import { formatDecimal, messageRefus } from "../numericInput";
import { formatWaterMessage } from "../waterReadings";
import { GradueSlider } from "./GradueSlider";
import { Neuf } from "./Neuf";

import type { WaterWorkshopModel } from "./useWaterWorkshop";

type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "onChange"
  | "set"
  | "totalWaterL"
  | "spargeDi"
  | "spargeLinked"
  | "justEnough"
  | "applyMinimum"
  | "hasSparge"
  | "totalOsmoseeL"
  | "totalReseauL"
>;

/** Arrondi au dixième de litre : on ne pèse pas l'eau au gramme. */
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Une part d'osmosée, en % (curseur gradué + nombre tapable) et en litres, sur la même valeur (voir DilutionField : mêmes bornes, mêmes refus).
 * `ligneLitres` : la ligne « 14,4 L osmosée + 14,3 L réseau » de l'empâtage ; absent : seul le curseur (rinçage à part).
 */
function OsmoseeLine({
  label, nom, value, onChange, volumeL, marker, hint, ligneLitres,
}: {
  label: string;
  nom: string;
  value: number;
  onChange: (pct: number) => void;
  volumeL: number;
  marker?: number | null;
  hint?: string;
  ligneLitres?: string;
}) {
  // BR-78 : une part hors de 0–100 % n'est jamais ramenée en silence : le champ garde ce qu'on tape, le calcul reçoit la valeur retenue, la phrase le dit.
  const [refused, setRefused] = useState<{ typed: number; kept: number } | null>(null);
  const [refusL, setRefusL] = useState<string | null>(null);
  const fr = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const typed = (v: number) => {
    if (!Number.isFinite(v)) return;
    const kept = Math.min(100, Math.max(0, v));
    setRefused(kept === v ? null : { typed: v, kept });
    onChange(kept);
  };
  const hasVolume = volumeL > 0;
  const osmoseeL = round1((volumeL * value) / 100);
  const reseauL = round1(volumeL - osmoseeL);
  return (
    <>
      <div className="ew-li" data-ew="osmosee">
        <span className="ew-nm">{nom}</span>
        <GradueSlider
          value={value}
          min={0}
          max={100}
          step={5}
          onChange={(v) => { setRefused(null); onChange(v); }}
          ariaLabel={`${label} — curseur`}
          major={25}
          minor={5}
          marker={marker}
          labels={[{ v: 0, text: "0" }, { v: 50, text: "50" }, { v: 100, text: "100 %" }]}
        />
        <span className="ew-num">
          <NumberInput
            aria-label={label}
            min={0}
            max={100}
            value={Number(value.toFixed(2))}
            onValue={typed}
            emptyValue={0}
            pad={false}
            className="ew-in ew-in-m"
          />
          <span className="ew-u">%</span>
        </span>
      </div>
      {refused && (
        <p role="status" data-role="borne-refusee" className="ew-refus">
          {fr(refused.typed)} % est hors bornes : de 0 à 100 %. {fr(refused.kept)} % retenu.
        </p>
      )}
      {hint && <p className="ew-ph">{hint}</p>}
      {ligneLitres && (
        <div className="ew-ligne">
          <span>{ligneLitres}</span>
          <span>
            <NumberInput
              aria-label={`Litres d’osmosée (${label})`}
              min={0}
              max={hasVolume ? volumeL : undefined}
              onRefus={(r) => setRefusL(r ? `${formatDecimal(r.saisi)} L est hors bornes : de 0 à ${formatDecimal(volumeL)} L. ${formatDecimal(r.retenu ?? 0)} L retenu.` : null)}
              value={osmoseeL}
              onValue={(litres: number) => {
                if (!hasVolume) return;
                onChange(Math.max(0, Math.min(100, (litres / volumeL) * 100)));
              }}
              disabled={!hasVolume}
              pad
              className="ew-in ew-lo"
            />{" "}
            L osmosée +{" "}
            {hasVolume ? <><Neuf v={reseauL}>{formatDecimal(reseauL)}</Neuf> L réseau</> : "— volume non posé"}
          </span>
        </div>
      )}
      {ligneLitres && refusL && <p role="status" data-role="refus" className="ew-refus">{refusL}</p>}
    </>
  );
}

export function WaterDilution({
  state,
  set,
  totalWaterL,
  spargeDi,
  spargeLinked,
  justEnough,
  applyMinimum,
  hasSparge,
  totalOsmoseeL,
  totalReseauL,
}: Props) {
  // BR-80 : une borne (1000 L) appliquée pendant la frappe laissait « 10009 » dans le champ ; la saisie hors bornes est refusée et dite.
  const [refusRo, setRefusRo] = useState<string | null>(null);
  const minOk = !!justEnough?.feasible;
  const depasseLimite = !!justEnough && state.roLimitL != null && (totalWaterL * justEnough.pct) / 100 > state.roLimitL;
  const bloque = totalWaterL <= 0 || !minOk || depasseLimite;
  const applique = minOk && state.diRatioPct === justEnough!.pct;
  const marker = minOk ? justEnough!.pct : null;
  const enPlace = formatDecimal(Number(state.diRatioPct.toFixed(2)));
  return (
    <section className="ew-card" aria-label="Coupe à l’osmosée">
      <h3 className="ew-sr">Coupe à l’osmosée</h3>

      <OsmoseeLine
        label={hasSparge ? "Osmosée — empâtage" : "Part d’eau osmosée"}
        nom="Osmosée"
        value={state.diRatioPct}
        onChange={(v) => set({ diRatioPct: v })}
        volumeL={hasSparge ? state.mashWaterL : totalWaterL}
        marker={marker}
        ligneLitres={hasSparge ? "Empâtage" : "Eau"}
      />

      {/* Auto doser : un toucher pose le minimum (applyMinimum) ; jamais « Calcul… » figé (RC-1 : une valeur ou « — »). */}
      <button
        type="button"
        onClick={applyMinimum}
        disabled={bloque}
        data-ew="minimum"
        className={`ew-min${applique ? " ew-min-ok" : ""}`}
      >
        <Droplets size={18} aria-hidden="true" />
        <span aria-hidden="true">{applique ? "✓ Minimum appliqué" : "Minimum trouvé d’osmosée"}</span>
        <span className="ew-sr">{applique ? "✓ Minimum appliqué · " : ""}Minimum trouvé d’osmosée</span>
        <b>{minOk ? <><i aria-hidden="true" />{formatDecimal(justEnough!.pct)} %</> : "—"}</b>
      </button>

      {justEnough && state.roLimitL != null && depasseLimite && (
        <p className="ew-msg2">
          Ce repère demanderait{" "}
          {formatDecimal(Math.round((totalWaterL * justEnough.pct) / 10) / 10)}{" "}
          L d’osmosée. Ton plan reste limité à{" "}
          {formatDecimal(state.roLimitL)} L ; les écarts du profil restent
          visibles.
        </p>
      )}
      {justEnough && totalWaterL > 0 && !justEnough.feasible && (
        <p className="ew-ph" style={{ color: "var(--ew-attt)" }}>
          {formatWaterMessage(justEnough.reasons.join(" ; "))}
        </p>
      )}
      {justEnough && totalWaterL > 0 && justEnough.feasible && (
        justEnough.pct === 0 ? (
          <p className="ew-ph">Le réseau avec les sels et acides proposés suffit pour les plages ioniques.</p>
        ) : state.diRatioPct > justEnough.pct ? (
          <details className="ew-pq">
            <summary>
              Coupe en place {enPlace} %, minimum {formatDecimal(justEnough.pct)} % · pourquoi
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <p>descendre plus bas buterait sur : {formatWaterMessage(justEnough.reasons.join(" ; "))}.</p>
          </details>
        ) : state.diRatioPct === justEnough.pct ? (
          <p className="ew-ph">
            Minimum trouvé au pas de {formatDecimal(justEnough.stepPct ?? 5)} %. Les plages sont visées, pas leurs centres.
          </p>
        ) : (
          <p className="ew-ph">
            Sous le minimum de {formatDecimal(justEnough.pct)} % —{" "}
            {formatWaterMessage(justEnough.reasons.join(" ; "))}.
          </p>
        )
      )}

      {hasSparge && (
        <div className="ew-ligne">
          <span>Rinçage <Neuf v={round1((state.spargeWaterL * spargeDi) / 100)}>{formatDecimal(round1((state.spargeWaterL * spargeDi) / 100))}</Neuf> L osmosée</span>
          <div className="ew-seg" role="group" aria-label="Osmosée du rinçage">
            <button
              type="button"
              aria-pressed={spargeLinked}
              aria-label={spargeLinked ? `Rinçage identique · ${formatDecimal(state.spargeWaterL)} L` : `Rinçage identique — relier à ${enPlace} %`}
              onClick={() => { if (!spargeLinked) set({ spargeDiRatioPct: undefined }); }}
            >
              identique
            </button>
            <button
              type="button"
              aria-pressed={!spargeLinked}
              aria-label="Rinçage réglé à part"
              onClick={() => { if (spargeLinked) set({ spargeDiRatioPct: state.diRatioPct }); }}
            >
              à part
            </button>
          </div>
        </div>
      )}
      {hasSparge && !spargeLinked && (
        <OsmoseeLine
          label="Osmosée — rinçage"
          nom="Rinçage"
          value={spargeDi}
          onChange={(v) => set({ spargeDiRatioPct: v })}
          volumeL={state.spargeWaterL}
          hint="Très diluée à l’osmosée, l’eau de rinçage n’extrait pas de tanins."
        />
      )}

      <details className="ew-pli">
        <summary>
          <span>
            {state.roLimitL != null
              ? `Osmosée : ${formatDecimal(state.roLimitL)} L disponibles`
              : "Osmosée disponible · sans limite"}
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="ew-dispo">
          <label className="ew-fld">
            Osmosée disponible au total (L)
            <span className="ew-num">
              <NumberInput
                aria-label="Osmosée disponible au total (L)"
                value={state.roLimitL}
                min={0}
                max={1000}
                rejeter
                onRefus={(r) => setRefusRo(r ? messageRefus(r.saisi, r.retenu, { min: 0, max: 1000, unite: "L" }) : null)}
                emptyValue={undefined}
                placeholder="Sans limite"
                className="ew-in"
                onValue={(value) =>
                  set({
                    roLimitL: value == null ? undefined : Math.max(0, Math.min(1000, value)),
                    autoTreatment: true,
                  })
                }
              />
              <span className="ew-u">L</span>
            </span>
          </label>
          {refusRo && <p role="alert" data-role="refus" className="ew-refus">{refusRo}</p>}
          <p className="ew-ph">
            Empâtage et rinçage réunis. Le reste vient du réseau, les volumes
            de brassage sont conservés.
          </p>
          <p className="ew-ph">
            Les doses modifiées à la main restent prioritaires. Préparation de
            la recette uniquement.
          </p>
        </div>
      </details>

      {justEnough?.proposal && (
        <details className="ew-pli">
          <summary>Compromis de la proposition<ChevronDown size={16} aria-hidden="true" /></summary>
          <p>{formatDecimal(Math.round(justEnough.proposal.volumes.totalRoL * 10) / 10)} L osmosée · {formatDecimal(Math.round(justEnough.proposal.volumes.tapL * 10) / 10)} L réseau. Mg {formatDecimal(justEnough.proposal.treatment.treatedTotal.mg)} ppm · Na {formatDecimal(justEnough.proposal.treatment.treatedTotal.na)} ppm. Les sels autorisés peuvent apporter magnésium ou sodium pour économiser l’osmosée. Le pH d’empâtage est vérifié séparément.</p>
        </details>
      )}

      {/* Sels et acides suivent la recette : visible dans la carte (aujourd'hui caché sous « Disponibilité & recalcul »). */}
      <button
        type="button"
        role="switch"
        aria-checked={state.autoTreatment === true}
        aria-label="Sels et acides suivent la recette"
        className="ew-auto"
        onClick={() => set({ autoTreatment: !(state.autoTreatment === true) })}
      >
        <span>Sels et acides suivent la recette</span>
        <i className="ew-tg" aria-hidden="true" />
      </button>
      {(state.saltOverrides || state.acidOverride) && (
        <button
          type="button"
          className="ew-recalc"
          onClick={() =>
            set({
              saltOverrides: undefined,
              acidOverride: undefined,
              autoTreatment: true,
            })
          }
        >
          Recalculer aussi les doses manuelles
        </button>
      )}

      {totalWaterL > 0 && (
        <p className="ew-tot">
          <span>
            Osmosée <Neuf v={totalOsmoseeL} className="ew-o">{formatDecimal(totalOsmoseeL)} L</Neuf>
          </span>
          <span>
            Réseau <Neuf v={totalReseauL}>{formatDecimal(totalReseauL)} L</Neuf>
          </span>
          <span className="ew-sr">
            Total {formatDecimal(totalWaterL)} L
          </span>
        </p>
      )}
    </section>
  );
}
