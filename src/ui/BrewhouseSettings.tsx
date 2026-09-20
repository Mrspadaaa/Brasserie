import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { BrewhouseProfile, BrewingEquipment, EquipmentItem } from '../types';
import { equipmentErrors, fermenterLimit, practicalEquipment, r1 } from '../domain/brewEquipment';
import { personalBrewingPreferences, brewingPreferenceErrors } from '../domain/brewPreferences';
import { NumberInput } from './NumberInput';
import { inputClass } from './FormNav';
import './brew-equipment.css';

export function BrewhouseSettings({
  profile,
  onChange,
  inventory = []
}: {
  profile: BrewhouseProfile;
  onChange: (p: BrewhouseProfile) => void;
  inventory?: EquipmentItem[];
}) {
  const e = profile.equipment;
  const change = (patch: Partial<BrewingEquipment>) => {
    const next = { ...e, ...patch };
    onChange({
      ...profile,
      equipment: next
    });
  };
  const preferences = profile.preferences ?? personalBrewingPreferences;
  const preference = (key: 'preferredMashRatioLPerKg' | 'preferredSpargeHotL' | 'maximumSpargeHotL', label: string) => <label className="equipment-field">
    <span>{label}</span><NumberInput aria-label={label} value={preferences[key]} min={0} className={inputClass} onValue={value => onChange({ ...profile, preferences: { ...preferences, [key]: value } })} />
  </label>;
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
    <details className="equipment-settings" open>
      <summary>
        <span>
          <SlidersHorizontal size={18} /> Mon installation
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
                equipment: { ...practicalEquipment },
                preferences: { ...personalBrewingPreferences }
              })
            }
          >
            Configurer cuve 45 L, rinçage 18 L et fermenteur 30 L
          </button>
        ) : (
          <>
            <p className="equipment-target">
              <strong>Fermenteur {e.fermenterCapacityL} L · repère {fermenterLimit(e) ?? '—'} L de moût</strong>
              <span>
                Repère ajustable dans chaque recette selon la levure et le style.
              </span>
            </p>
            <div className="equipment-grid">
              <label className="equipment-field"><span>Volume habituel en fermenteur (L)</span><NumberInput aria-label="Volume habituel en fermenteur (L)" min={1} value={profile.volumeL} onValue={value => onChange({...profile,volumeL:value})} className={inputClass}/></label>
              {preference('preferredMashRatioLPerKg', 'Empâtage préféré (L/kg)')}
              {preference('preferredSpargeHotL', 'Rinçage habituel à chaud (L)')}
              {preference('maximumSpargeHotL', 'Rinçage exceptionnel maximum à chaud (L)')}
            </div>
            <label className="equipment-check"><input type="checkbox" checked={preferences.increaseMashToLimitSparge} onChange={e => onChange({...profile, preferences:{...preferences,increaseMashToLimitSparge:e.target.checked}})}/><span>Augmenter l’eau d’empâtage pour limiter le rinçage, si la cuve le permet</span></label>
            <p className="text-xs text-cave-400">Récipient principal puis bouilloire annexe si nécessaire. La capacité de l’auxiliaire reste à vérifier.</p>
            <label className="equipment-check"><input type="checkbox" checked={!!preferences.regulatedCoolingAvailable} onChange={e => onChange({...profile,preferences:{...preferences,regulatedCoolingAvailable:e.target.checked}})}/><span>Froid régulé disponible après le serpentin</span></label>
            <details className="equipment-calibration"><summary>Matériel déjà dans l’inventaire <ChevronDown size={17}/></summary>
              <div className="equipment-grid">{([['kettle','Cuve'],['sparger','Récipient de rinçage'],['fermenter','Fermenteur'],['auxiliary','Bouilloire annexe']] as const).map(([key,label])=><label className="equipment-field" key={key}><span>{label}</span><select className={inputClass} aria-label={`${label} dans l’inventaire`} value={profile.equipmentRefs?.[key] ?? ''} onChange={e=>onChange({...profile,equipmentRefs:{...profile.equipmentRefs,[key]:e.target.value||undefined}})}><option value="">Référence non liée</option>{inventory.map(item=><option key={item.id} value={item.id}>{item.name} · {item.ref}</option>)}</select></label>)}</div>
              <p className="text-xs text-cave-400">Ces liens réutilisent les fiches existantes. Les capacités chiffrées ci-dessous restent à renseigner ou confirmer.</p>
            </details>
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
                'Capacité du récipient principal à température de rinçage. Le complément vient de la bouilloire annexe.'
              )}
              {field('fermenterCapacityL', 'Fermenteur · capacité totale (L)', 1, 10000)}
              {field(
                'fermenterHeadspacePct',
                'Place pour la mousse (%)',
                0,
                99,
                'Repère provisoire, remplacé par le conseil de la levure ou ton choix dans la recette.'
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
                <label className="equipment-field"><span>Rendement d’extraction des grains (%)</span><NumberInput aria-label="Rendement d’extraction des grains (%)" value={profile.efficiencyPct} min={1} max={100} onValue={value=>onChange({...profile,efficiencyPct:value})} className={inputClass}/></label>
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
            {[...equipmentErrors(e), ...brewingPreferenceErrors(profile)].length > 0 && (
              <p role="alert" className="equipment-warning">
                {[...equipmentErrors(e), ...brewingPreferenceErrors(profile)].join(' ')}
              </p>
            )}
          </>
        )}
      </div>
    </details>
  );
}
