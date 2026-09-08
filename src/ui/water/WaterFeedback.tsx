import { formatDecimal } from "../numericInput";

import {
  SALTS,
  SALT_IDS,
  ACIDS,
  LACTATE_TASTE_THRESHOLD,
} from "../../domain/water";
import { WATER_PROFILE_SOURCES } from "../../domain/waterStyles";

import { AlertTriangle } from "lucide-react";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
import { SALT_SHORT } from "./constants";

type Props = Pick<
  WaterWorkshopModel,
  | "beerVolumeL"
  | "brew"
  | "state"
  | "set"
  | "activeSalt"
  | "style"
  | "recipeStyle"
  | "differentProfile"
  | "alkaliGoal"
  | "treatment"
  | "achievedMash"
  | "ratio"
  | "phEstimate"
  | "hopHint"
  | "rienAProposer"
  | "ionsAuPlafond"
  | "applyRatio"
  | "mashAcidCalcule"
  | "mashAcid"
  | "spargeAcid"
  | "mashAcidDiffers"
  | "messagesSolveur"
  | "achievedTotalApresAcide"
  | "lactate"
  | "cautions"
  | "seuilGoutProche"
  | "caShort"
  | "hasSparge"
>;
export function WaterFeedback({
  beerVolumeL,
  brew,
  state,
  set,
  activeSalt,
  style,
  recipeStyle,
  differentProfile,
  alkaliGoal,
  treatment,
  achievedMash,
  ratio,
  phEstimate,
  hopHint,
  rienAProposer,
  ionsAuPlafond,
  applyRatio,
  mashAcidCalcule,
  mashAcid,
  spargeAcid,
  mashAcidDiffers,
  messagesSolveur,
  achievedTotalApresAcide,
  lactate,
  cautions,
  seuilGoutProche,
  caShort,
  hasSparge,
}: Props) {
  return (
    <>
      {" "}
      {((mashAcid.amount > 0 && treatment.treated.mash.hco3 === 0) ||
        (hasSparge &&
          spargeAcid.amount > 0 &&
          treatment.treated.sparge.hco3 === 0)) && (
        <p className="px-1 text-2xs text-cave-200 leading-snug">
          {[
            mashAcid.amount > 0 && treatment.treated.mash.hco3 === 0
              ? "Empâtage"
              : "",
            hasSparge &&
            spargeAcid.amount > 0 &&
            treatment.treated.sparge.hco3 === 0
              ? "Rinçage"
              : "",
          ]
            .filter(Boolean)
            .join(" · ")}{" "}
          : HCO₃ estimé à 0. Ajouter de l’acide ne diminue plus le HCO₃ affiché
          ; le pH peut encore baisser. Vérifie-le avant tout ajout.
        </p>
      )}
      {treatment.hco3Target && (
        <p
          className={`px-1 text-sm leading-snug ${treatment.hco3Target.reached ? "text-hop" : "text-ebc-straw"}`}
          aria-label="Cible HCO₃ après traitement"
        >
          {treatment.hco3Target.reached
            ? `HCO₃ après acide : ${formatDecimal(treatment.hco3Target.achieved)} ppm, cible ${formatDecimal(treatment.hco3Target.requested)} ppm atteinte.`
            : treatment.hco3Target.message}
        </p>
      )}
      {hasSparge && state.acidOverride?.sparge != null && (
        <p
          role="status"
          aria-label="Acide manuel au rinçage"
          className="px-1 text-2xs text-cave-200 leading-snug"
        >
          Acide rinçage manuel : {formatDecimal(spargeAcid.amount)}{" "}
          {spargeAcid.unit} ; calcul :{" "}
          {formatDecimal(treatment.spargeAcidCalculated.amount)}{" "}
          {spargeAcid.unit}. HCO₃ du rinçage :{" "}
          {formatDecimal(treatment.raw.sparge.hco3)} →{" "}
          {formatDecimal(treatment.treated.sparge.hco3)} ppm.
        </p>
      )}
      {alkaliGoal.limitedByGrist && (
        <p
          className="px-1 text-2xs text-cave-200 leading-snug"
          aria-label="Objectif du bicarbonate"
        >
          HCO₃ : {formatDecimal(achievedTotalApresAcide.hco3)} ppm sur l’eau
          totale ;{" "}
          {formatDecimal(Math.round(treatment.treated.mash.hco3 * 10) / 10)} à
          l’empâtage. Le profil d’eau choisi commande les doses. Avec
          ces doses : pH estimé {phEstimate.phPredicted.toFixed(2)} ±
          {phEstimate.uncertainty}, à vérifier au brassage.
          {!state.customTarget &&
            " Le respect du profil ne garantit pas le pH d’empâtage."}
        </p>
      )}
      {achievedTotalApresAcide.mg === 0 &&
        style.ions.mg.min === 0 &&
        (brew?.totalGristKg ?? 0) > 0 && (
          <p className="px-1 text-2xs text-cave-400 leading-snug">
            Mg : 0 ppm dans l’eau. Ajout facultatif pour ce profil ; les malts
            en apportent au moût, hors de ce graphique.
          </p>
        )}
      {differentProfile && (
        <div className="px-1 text-2xs text-cave-200 leading-snug">
          Profil d’eau différent de la recette.{" "}
          <button
            type="button"
            onClick={() =>
              set({ styleCode: recipeStyle.code, ratioOverride: undefined })
            }
            className="text-ebc-straw underline underline-offset-2 py-1"
          >
            Utiliser {recipeStyle.name}
          </button>
        </div>
      )}
      {mashAcidDiffers && (
        <p
          role="status"
          aria-label="Acide manuel à l’empâtage"
          className="px-1 text-2xs text-cave-200 leading-snug"
        >
          Acide empâtage manuel : {formatDecimal(mashAcid.amount)}{" "}
          {mashAcid.unit} ; calcul : {formatDecimal(mashAcidCalcule.amount)}{" "}
          {mashAcidCalcule.unit}. HCO₃ de l’empâtage :{" "}
          {Math.round(achievedMash.hco3)} →{" "}
          {Math.round(treatment.treated.mash.hco3)} ppm.
        </p>
      )}
      {activeSalt && (
        <p className="text-2xs text-cave-200 leading-snug px-1">
          <span className="font-semibold text-ebc-straw">
            {activeSalt === "acide"
              ? ACIDS[state.acidId].name
              : SALTS[activeSalt].name}
          </span>{" "}
          —{" "}
          {activeSalt === "acide"
            ? "Neutralise le bicarbonate ; vérifier la correction sur l’alcalinité de l’empâtage."
            : SALTS[activeSalt].effect}
        </p>
      )}
      {rienAProposer && (
        <p className="text-2xs text-ebc-amber leading-snug px-1">
          {state.disabled.length >= SALT_IDS.length ? (
            "Rien à proposer : tous les sels sont écartés. Rallume ceux dont tu disposes."
          ) : ionsAuPlafond.length > 0 ? (
            <>
              Rien à proposer : {ionsAuPlafond.join(", ")} déjà au plafond du
              style dans l'eau de départ. Aucun sel ne peut entrer sans
              l'aggraver — coupe à l'osmosée pour faire de la place.
            </>
          ) : (
            "Aucun ajout proposé avec ces contraintes. Vérifie les écarts au profil et les sels autorisés."
          )}
        </p>
      )}
      {cautions.map((c) => (
        <p
          key={c.id}
          className={`text-2xs leading-snug px-1 ${c.franchi ? "text-ebc-amber" : "text-cave-400"}`}
        >
          {c.franchi ? "⚠️" : "ℹ️"} {SALT_SHORT[c.id]} — {c.text}
        </p>
      ))}
      <p className="text-2xs text-cave-400 leading-snug px-1">
        {ACIDS[state.acidId].note}
        {seuilGoutProche && ` ${ACIDS[state.acidId].taste!.text}`}
      </p>
      {!state.customTarget && (
        <details className="text-2xs text-cave-400 px-1">
          <summary className="cursor-pointer py-1">
            Repères du profil · sources
          </summary>
          <p className="pt-1">{style.note}</p>
          <p className="pt-1">
            Ces plages maison sont les objectifs du dosage, pour les six ions
            après sels et acides. Ce ne sont pas des normes BJCP. Le pH
            d’empâtage reste un objectif distinct à vérifier au brassage.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {WATER_PROFILE_SOURCES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="underline text-water"
              >
                {s.name}
              </a>
            ))}
          </div>
        </details>
      )}
      {hopHint?.note && (
        <p className="text-2xs text-cave-400 leading-snug px-1">
          {hopHint.note}
        </p>
      )}
      {hopHint &&
        state.ratioOverride !== undefined &&
        Math.abs(state.ratioOverride - hopHint.ratio) >= 0.1 && (
          <button
            type="button"
            onClick={() => applyRatio(hopHint.ratio)}
            className="text-2xs text-ebc-straw hover:text-ebc-gold underline underline-offset-2 px-1"
          >
            Revenir au {hopHint.ratio} que dit le houblonnage
          </button>
        )}
      {(messagesSolveur.length > 0 ||
        caShort ||
        lactate > LACTATE_TASTE_THRESHOLD ||
        spargeAcid.warning) && (
        <ul className="space-y-1.5 panel p-2.5 sm:p-3 bg-amber-950/20 border border-ebc-amber/40 rounded-control">
          {messagesSolveur.map((msg, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-ebc-amber leading-snug"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{msg}</span>
            </li>
          ))}

          {caShort && (
            <li className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Calcium à {Math.round(achievedTotalApresAcide.ca)} ppm sur l’eau
                totale, le profil en demande au moins {style.ions.ca.min}.
              </span>
            </li>
          )}

          {lactate > LACTATE_TASTE_THRESHOLD && (
            <li className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Acide lactique cumulé : {lactate} g par litre de bière (
                {mashAcid.amount} + {spargeAcid.amount} mL pour {beerVolumeL} L)
                — au-delà de {LACTATE_TASTE_THRESHOLD}, il commence à se goûter.
                Passe au phosphorique, ou coupe davantage à l’osmosée.
              </span>
            </li>
          )}

          {spargeAcid.warning && (
            <li className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{spargeAcid.warning}</span>
            </li>
          )}
        </ul>
      )}
    </>
  );
}
