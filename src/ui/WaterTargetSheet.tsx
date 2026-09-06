import React, { useEffect, useState } from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_SYMBOL, parseWaterTarget } from '../domain/water';
import { styleFromTargetIons } from '../domain/waterStyles';
import { NumberInput } from './NumberInput';
import { Sheet } from './Sheet';
import { Field, inputClass } from './FormNav';
import { ClipboardPaste, Check, AlertTriangle } from 'lucide-react';

/**
 * Créer une cible d'eau à partir de ce que dit la recette.
 *
 * ⚠️ Ce qui manquait : une recette sur deux ne donne pas un style BJCP, elle
 * donne SON eau, en toutes lettres — « Target water profile: Ca 110, Mg 5,
 * Na 12, SO₄ 200, Cl 55, HCO₃ 0 ». L'atelier n'offrait que dix-neuf styles
 * figés : il fallait choisir le plus proche et accepter une cible qui n'était
 * pas celle de la recette, ou renoncer.
 *
 * Le collage est lu EN LOCAL, sans réseau. Une recette écrit son profil
 * toujours de la même façon ; un aller-retour IA serait plus lent, impossible
 * hors-ligne, et exposerait à une valeur inventée là où il n'y a rien à
 * inventer. Ce que le lecteur ne trouve pas reste VIDE et le dit — jamais une
 * valeur plausible.
 */

export interface CustomTarget {
  name: string;
  ions: Partial<WaterIons>;
}

interface WaterTargetSheetProps {
  open: boolean;
  onClose: () => void;
  /** La cible en cours d'édition, s'il y en a une. */
  value?: CustomTarget;
  onSave: (target: CustomTarget) => void;
  /** Revenir à un style de la liste. Absent = pas de cible personnalisée posée. */
  onRemove?: () => void;
}

const IONS: Array<keyof WaterIons> = ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'];
const ZERO: Partial<WaterIons> = {};

export const WaterTargetSheet: React.FC<WaterTargetSheetProps> = ({
  open,
  onClose,
  value,
  onSave,
  onRemove
}) => {
  const [name, setName] = useState(value?.name ?? '');
  const [ions, setIons] = useState<Partial<WaterIons>>(value?.ions ?? ZERO);
  const [colle, setColle] = useState('');
  const [lu, setLu] = useState<{ found: Array<keyof WaterIons>; unit: ReturnType<typeof parseWaterTarget>["alkalinityUnit"] } | null>(null);

  // Rouvrir la feuille sur une autre cible doit repartir de CETTE cible.
  useEffect(() => {
    if (!open) return;
    setName(value?.name ?? '');
    setIons(value?.ions ?? ZERO);
    setColle('');
    setLu(null);
  }, [open, value]);

  const lire = () => {
    const r = parseWaterTarget(colle);
    setLu({ found: r.found, unit: r.alkalinityUnit });
    if (r.found.length === 0) return;
    /*
     * ⚠️ On n'écrase QUE ce qui a été trouvé. Écraser les six champs mettrait à
     * zéro les ions que le texte ne mentionne pas — et zéro est une valeur, pas
     * une absence : le solveur la viserait.
     */
    setIons((prev) => {
      const next = { ...prev };
      r.found.forEach((ion) => {
        next[ion] = r.ions[ion];
      });
      return next;
    });
  };

  const apercu = styleFromTargetIons(ions, name.trim() || 'Cible de la recette');
  const vide = IONS.every((ion) => ions[ion] == null);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cible d’eau de la recette"
      subtitle="Le profil chiffré que donne la recette, plutôt qu’un style de la liste."
      footer={
        <div className="flex gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="min-h-touch px-4 rounded-control border border-cave-700 text-cave-300 text-sm"
            >
              Revenir à un style
            </button>
          )}
          <button
            type="button"
            disabled={vide}
            onClick={() => {
              onSave({ name: name.trim() || 'Cible de la recette', ions });
              onClose();
            }}
            className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950 font-bold
                       text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Viser cette eau
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Le collage — la façon dont la donnée arrive vraiment. */}
        <div className="space-y-1.5">
          <label htmlFor="wt-colle" className="text-2xs text-cave-400">
            Colle le profil d’eau de la recette
          </label>
          <textarea
            id="wt-colle"
            name="wt_recipe_water_text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={colle}
            onChange={(e) => setColle(e.target.value)}
            rows={3}
            placeholder="Target water: Ca 110, Mg 5, Na 12, SO4 200, Cl 55, HCO3 0 ppm"
            className={`${inputClass} min-h-[4.5rem] leading-snug`}
          />
          <button
            type="button"
            onClick={lire}
            disabled={colle.trim().length < 4}
            className="min-h-touch-sm w-full rounded-control border border-cave-700 text-cave-200
                       text-2xs flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <ClipboardPaste className="w-4 h-4 text-ebc-straw" />
            Remplir les champs depuis ce texte
          </button>

          {lu && lu.found.length === 0 && (
            <p className="flex items-start gap-1.5 text-2xs text-ebc-amber leading-snug">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Aucun ion reconnu dans ce texte. Saisis les valeurs à la main — rien n’a été
              rempli au hasard.
            </p>
          )}
          {lu && lu.found.length > 0 && (
            <p className="text-2xs text-hop leading-snug">
              Lu : {lu.found.map((ion) => ION_SYMBOL[ion]).join(' · ')}
              {lu.found.length < 6 && (
                <span className="text-cave-500">
                  {' '}
                  — les autres n’étaient pas dans le texte et n’ont pas été touchés.
                </span>
              )}
              {lu.unit !== "hco3" && (
                <span className="text-cave-400">
                  {' '}
                  · alcalinité donnée en {lu.unit === "fH" ? "°fH" : lu.unit === "dH" ? "°dH" : "CaCO₃"}, convertie en bicarbonate.
                </span>
              )}
            </p>
          )}
        </div>

        <Field label="Nom de la cible" htmlFor="wt-target-title">
          <input
            id="wt-target-title"
            name="wt_target_label"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eau de la recette BYO"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          {IONS.map((ion) => (
            <Field key={ion} label={`${ION_LABEL[ion]} (ppm)`} htmlFor={`wt-${ion}`}>
              <NumberInput
                id={`wt-${ion}`}
                min={0}
                value={ions[ion]}
                onValue={(v) => setIons({ ...ions, [ion]: v })}
                pad
                className={`${inputClass} reading text-center`}
              />
            </Field>
          ))}
        </div>

        {/*
          Ce que la cible va VRAIMENT devenir. Un point ne se vise pas au ppm
          près : l'atelier raisonne en fourchettes, et il vaut mieux le montrer
          avant que le brasseur ne s'étonne de voir des secteurs verts larges.
        */}
        {!vide && (
          <div className="rounded-control border border-cave-800 bg-cave-950/70 p-2.5 space-y-1">
            <p className="text-2xs text-cave-400">Fourchette qui en découle</p>
            <p className="text-2xs text-cave-300 leading-snug">
              {IONS.filter(ion => ions[ion] != null).map(
                (ion) => `${ION_SYMBOL[ion]} ${apercu.ions[ion].min}–${apercu.ions[ion].max}`
              ).join(' · ')}
            </p>
            <p className="text-2xs text-cave-500 leading-snug">
              ±20 %, avec un plancher de ±10 ppm — sous ce plancher, aucune balance ne sait
              viser. Rapport SO₄:Cl visé {apercu.ratio.min} à {apercu.ratio.max}.
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
};
