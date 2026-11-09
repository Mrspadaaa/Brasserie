import { Input, Textarea, type InputElement } from '../ui/Input';
import React, { useEffect, useId, useRef, useState } from 'react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { X, Save, ChevronDown } from 'lucide-react';
import { Client, type AdresseSaisie } from '../types';
import { AdresseChamps, ADRESSE_VIDE, adresseComplete, adresseEnTexte } from '../ui/vente/AdresseChamps';
import { adresseDepuisTexte } from '../services/swissQrBill';
import { StorageService } from '../services/storage';
import { ModalShell } from '../ui/ModalShell';
import { TextInput, inputClass, noAutofillProps } from '../ui/FormNav';
import type { TextInputHandle } from '../ui/TextInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { lireTelephone } from '../services/clientPhone';
import '../ui/clients.css';

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (updated: Client) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, client, onClose, onSave }) => {
  const [draft, setDraft] = useSyncedDraft(isOpen ? client : null, client?.id);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const id = useId();
  const nameInput = useRef<TextInputHandle>(null);
  const emailInput = useRef<InputElement>(null);
  const phoneInput = useRef<InputElement>(null);
  /* L'adresse structurée : la saisie, sinon la chaîne existante découpée (rien d'inventé). Écrite seulement si le brasseur la touche et qu'elle est complète. */
  const adresseDepart = (c: Client | null): AdresseSaisie => c?.adresse ?? adresseDepuisTexte(c?.address ?? '') ?? ADRESSE_VIDE;
  const [adr, setAdr] = useState<AdresseSaisie>(() => adresseDepart(client));
  const adrDepart = useRef<AdresseSaisie>(adr);
  useEffect(() => { setErrors({}); const a = adresseDepart(client); setAdr(a); adrDepart.current = a; }, [isOpen, client?.id]);
  if (!isOpen || !client || !draft) return null;

  const { name, type, contact, phone, email, notes = '' } = draft;
  const field = <K extends keyof Client>(key: K, value: Client[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
    if (key === 'name' || key === 'email' || key === 'phone') setErrors(current => ({ ...current, [key]: undefined }));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : 'Indique le nom du client.',
      email: email.trim() && emailInput.current && !emailInput.current.validity.valid ? 'Vérifie l’adresse email, par exemple contact@restaurant.ch.' : undefined,
      /* TE-2 : « abc » n'est pas un numéro (la fiche en tirait `tel:abc` et un lien WhatsApp vide). */
      phone: phone.trim() ? (() => { const lu = lireTelephone(phone); return lu.ok === false ? lu.message : undefined; })() : undefined
    };
    setErrors(nextErrors);
    if (nextErrors.name) { nameInput.current?.focus(); return; }
    if (nextErrors.email) { emailInput.current?.focus(); return; }
    if (nextErrors.phone) { phoneInput.current?.focus(); return; }
    const updated: Client = {
      ...draft,
      name: name.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim()
    };
    /* REVUE-B 3 : `address` n'est réécrite que par une adresse touchée ET complète ; sinon la chaîne d'origine (« Case postale 123 ») reste intacte. */
    const touchee = JSON.stringify(adr) !== JSON.stringify(adrDepart.current);
    if (touchee && adresseComplete(adr)) { updated.adresse = { ...adr, pays: adr.pays || 'CH' }; updated.address = adresseEnTexte(adr); }
    StorageService.updateClient(updated);
    onSave(updated);
    onClose();
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg" labelledBy={`${id}-title`}>
      <header className="client-form-header">
        <h3 id={`${id}-title`}>{client.name.trim() ? 'Modifier le client' : 'Nouveau client'}</h3>
        <button type="button" onClick={onClose} aria-label="Fermer" className="clients-action"><X size={15} aria-hidden="true" /></button>
      </header>
      <form onSubmit={handleSave} noValidate autoComplete="off" className="client-form">
        <div className="client-form-body">
          <div className="client-form-field">
            <label htmlFor={`${id}-name`}>Nom / raison sociale <span aria-hidden="true">*</span></label>
            <TextInput ref={nameInput} id={`${id}-name`} name="cl_company_label" required value={name}
              onChange={value => field('name', value)} className={`${inputClass} font-semibold`} enterKeyHint="next"
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
            {errors.name && <p id={`${id}-name-error`} role="alert" className="mt-1 text-xs text-alert-strong">{errors.name}</p>}
          </div>
          <div className="client-form-field">
            <span>Type de client</span>
            <SegmentedControl label="Type de client" value={type} onChange={value => field('type', value)} className="clients-segments"
              options={[{ value: 'Pro', label: 'Professionnel' }, { value: 'Privé', label: 'Particulier' }]} />
          </div>
          <div className="client-form-grid">
            <div className="client-form-field">
              <label htmlFor={`${id}-contact`}>Nom du contact</label>
              <TextInput id={`${id}-contact`} name="cl_contact_person_label" value={contact}
                onChange={value => field('contact', value)} placeholder="Marie Dupont" enterKeyHint="next" />
            </div>
            <div className="client-form-field">
              <label htmlFor={`${id}-phone`}>Téléphone / mobile</label>
              <Input {...noAutofillProps} ref={phoneInput} id={`${id}-phone`} name="cl_contact_tel_digits" type="tel" inputMode="tel"
                value={phone} onChange={event => field('phone', event.target.value)} placeholder="026 408 33 33" className={inputClass} enterKeyHint="next"
                aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${id}-phone-error` : undefined} />
              {errors.phone && <p id={`${id}-phone-error`} role="alert" className="mt-1 text-xs text-alert-strong">{errors.phone}</p>}
            </div>
          </div>
          <div className="client-form-field">
            <label htmlFor={`${id}-email`}>Email de facturation</label>
            <Input {...noAutofillProps} ref={emailInput} id={`${id}-email`} name="cl_billing_mail" type="email" inputMode="email"
              value={email} onChange={event => field('email', event.target.value)} placeholder="contact@restaurant.ch" className={inputClass}
              aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined} />
            {errors.email && <p id={`${id}-email-error`} role="alert" className="mt-1 text-xs text-alert-strong">{errors.email}</p>}
          </div>
          <div className="client-form-field">
            {client.address?.trim() && !adresseComplete(client.adresse) && !adresseDepuisTexte(client.address) && <p className="text-xs text-cave-400">Adresse enregistrée : {client.address.trim()}</p>}
            <AdresseChamps legende="Adresse de facturation" value={adr} onChange={setAdr} />
          </div>
          <details key={client.id} className="clients-help">
            <summary>Notes et accès logistiques{notes.trim() ? ' · renseignés' : ''}<ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="client-form-field">
              <label htmlFor={`${id}-notes`}>Consignes de livraison</label>
              <Textarea {...noAutofillProps} id={`${id}-notes`} rows={2} name="cl_logistics_memo" value={notes}
                onChange={event => field('notes', event.target.value)} placeholder="Lieu de dépôt, horaires, accès…" className={inputClass} />
            </div>
          </details>
          <p className="text-xs leading-tight text-cave-400">Réf. {client.id} · statut calculé depuis les ventes.</p>
        </div>
        <footer className="client-form-actions">
          <button type="button" onClick={onClose} className="clients-action">Annuler</button>
          <button type="submit" className="clients-action clients-action-primary"><Save size={14} aria-hidden="true" />Enregistrer</button>
        </footer>
      </form>
    </ModalShell>
  );
};
