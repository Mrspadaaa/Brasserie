import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { BrewhouseProfile, BrewingEquipment } from '../types';
import { equipmentErrors, fermenterLimit, practicalEquipment, r1 } from '../domain/brewEquipment';
import { NumberInput } from './NumberInput';
import { inputClass } from './FormNav';
import './brew-equipment.css';

export function BrewhouseSettings({
  profile,
  onChange
}: {
  profile: BrewhouseProfile;
  onChange: (p: BrewhouseProfile) => void;
}) {
  const e = profile.equipment;
  const change = (patch: Partial<BrewingEquipment>) => {
    const next = { ...e, ...patch };
    const max = fermenterLimit(next);
    onChange({
      ...profile,
      equipment: next,
      volumeL: Math.min(profile.volumeL, max ?? profile.volumeL)
    });
  };
  const field = (
    key: keyof BrewingEquipment,
    label: string,
    min: number,
    max: number,
    hint?: string
  ) => (
    <label className="equipment-field" key={key}>
      <span>{label}</span>
      <NumberInput
        aria-label={label}
        value={e?.[key] as number}
        onValue={(v) => change({ [key]: v })}
        emptyValue={undefined}
        min={min}
        max={max}
        className={inputClass}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
  return (
    <details className="equipment-settings">
      <summary>
        <span>
          <SlidersHorizontal size={18} /> Matériel, capacités et eau
        </span>
        <ChevronDown size={18} />
      </summary>
      <div className="equipment-settings-body">
        {!e ? (
          <button
            type="button"
            className="equipment-button"
            onClick={() =>
              onChange({
                ...profile,
                name: 'Royal Catering · cuve 45 L',
                volumeL: 24,
                equipment: { ...practicalEquipment }
              })
            }
          >
            Configurer cuve 45 L, rinçage 18 L et fermenteur 30 L
          </button>
        ) : (
          <>
            <p className="equipment-target">
              <strong>{fermenterLimit(e) ?? '—'} L de moût par fermenteur</strong>
              <span>
                {r1((e.fermenterCapacityL * e.fermenterHeadspacePct) / 100)} L réservés à la mousse
                · capacité totale {e.fermenterCapacityL} L
              </span>
            </p>
            <div className="equipment-grid">
              {field('kettleCapacityL', 'Cuve · capacité totale (L)', 1, 10000)}
              {field(
                'kettleWorkingL',
                'Cuve · limite utile à chaud (L)',
                1,
                10000,
                'Eau + grains à l’empâtage ; marge pour mousse et circulation déjà réservée.'
              )}
              {field(
                'spargeCapacityL',
                'Sparger · capacité à chaud (L)',
                1,
                10000,
                'Le remplissage à froid est réduit pour la dilatation. Plusieurs chauffes si nécessaire.'
              )}
              {field('fermenterCapacityL', 'Fermenteur · capacité totale (L)', 1, 10000)}
              {field(
                'fermenterHeadspacePct',
                'Place pour la mousse (%)',
                10,
                50,
                'Part du volume total. 20 % est un point de départ ; augmente pour une levure très expansive.'
              )}
              {field(
                'roPackL',
                'Eau osmosée · volume du pack (L)',
                0.1,
                1000,
                'Le reste du pack est conservé, pas versé automatiquement.'
              )}
            </div>
            <label className="equipment-check">
              <input
                type="checkbox"
                checked={!!e.workingVolumeConfirmed}
                onChange={(ev) => change({ workingVolumeConfirmed: ev.target.checked })}
              />
              <span>J’ai vérifié la limite utile sur ma cuve</span>
            </label>
            {!e.workingVolumeConfirmed && (
              <p className="equipment-warning">
                Limite utile provisoire : calibre-la avec ton panier et respecte le repère MAX du
                matériel.
              </p>
            )}
            <details className="equipment-calibration">
              <summary>
                Calibrer les pertes et la chauffe <ChevronDown size={17} />
              </summary>
              <p>
                Repères de départ à remplacer par tes relevés. Le débit d’évaporation se mesure à
                ébullition, en L/h, indépendamment du volume de la recette.
              </p>
              <div className="equipment-grid">
                {field('boilOffLPerHour', 'Évaporation à chaud (L/h)', 0, 100)}
                <label className="equipment-field">
                  <span>Pertes en fond de cuve (L froids)</span>
                  <NumberInput
                    aria-label="Pertes en fond de cuve (L froids)"
                    value={profile.deadSpaceL}
                    onValue={(v) => onChange({ ...profile, deadSpaceL: v })}
                    min={0}
                    max={100}
                    className={inputClass}
                  />
                </label>
                {field('grainAbsorptionLPerKg', 'Absorption du grain (L/kg)', 0, 3)}
                {field('grainDisplacementLPerKg', 'Place occupée par le grain (L/kg)', 0.1, 2)}
                {field('coolingShrinkagePct', 'Rétraction au refroidissement (%)', 0, 10)}
                {field('heatingRateCPerMin', 'Vitesse de chauffe observée (°C/min)', 0.01, 10)}
              </div>
            </details>
            {equipmentErrors(e).length > 0 && (
              <p role="alert" className="equipment-warning">
                {equipmentErrors(e).join(' ')}
              </p>
            )}
          </>
        )}
      </div>
    </details>
  );
}
