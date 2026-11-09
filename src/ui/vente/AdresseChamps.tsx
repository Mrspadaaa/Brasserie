import React, { useId } from 'react';
import type { AdresseSaisie } from '../../types';
import { Input } from '../Input';
import { inputClass, noAutofillProps } from '../FormNav';

export const ADRESSE_VIDE: AdresseSaisie = { rue: '', numero: '', npa: '', localite: '', pays: 'CH' };

/** Une adresse est « complète » pour être écrite : nom de rue, NPA et localité (le numéro peut manquer : « Case postale »). */
export const adresseComplete = (a: Partial<AdresseSaisie> | undefined): a is AdresseSaisie =>
  Boolean(a?.rue?.trim() && a?.npa?.trim() && a?.localite?.trim());

/** « rue n°, NPA localité » : la chaîne dérivée pour les lecteurs qui ne lisent que `address`. */
export const adresseEnTexte = (a: AdresseSaisie): string =>
  `${`${a.rue.trim()} ${a.numero.trim()}`.trim()}, ${a.npa.trim()} ${a.localite.trim()}`;

/** Les champs d'une adresse structurée (rue, n°, NPA, localité), un seul formulaire pour la fiche client et l'identité de la brasserie. */
export function AdresseChamps({ value, onChange, legende = 'Adresse' }: { value: AdresseSaisie; onChange: (next: AdresseSaisie) => void; legende?: string }) {
  const id = useId();
  const set = (patch: Partial<AdresseSaisie>) => onChange({ ...value, ...patch });
  return (
    <fieldset className="cs-adresse" style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <legend className="text-xs text-cave-400">{legende}</legend>
      <div className="grid grid-cols-[1fr_72px] gap-2">
        <div><label htmlFor={`${id}-rue`} className="text-xs text-cave-400">Rue</label>
          <Input {...noAutofillProps} id={`${id}-rue`} name="adr_rue_label" value={value.rue} onChange={e => set({ rue: e.target.value })} className={inputClass} enterKeyHint="next" /></div>
        <div><label htmlFor={`${id}-no`} className="text-xs text-cave-400">N°</label>
          <Input {...noAutofillProps} id={`${id}-no`} name="adr_no_label" value={value.numero} onChange={e => set({ numero: e.target.value })} className={inputClass} enterKeyHint="next" /></div>
      </div>
      <div className="grid grid-cols-[88px_1fr] gap-2 mt-1">
        <div><label htmlFor={`${id}-npa`} className="text-xs text-cave-400">NPA</label>
          <Input {...noAutofillProps} id={`${id}-npa`} name="adr_npa_label" inputMode="numeric" value={value.npa} onChange={e => set({ npa: e.target.value })} className={inputClass} enterKeyHint="next" /></div>
        <div><label htmlFor={`${id}-loc`} className="text-xs text-cave-400">Localité</label>
          <Input {...noAutofillProps} id={`${id}-loc`} name="adr_loc_label" value={value.localite} onChange={e => set({ localite: e.target.value })} className={inputClass} enterKeyHint="done" /></div>
      </div>
    </fieldset>
  );
}
