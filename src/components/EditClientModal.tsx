import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText } from 'lucide-react';
import { Client } from '../types';
import { StorageService } from '../services/storage';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { TextInput, inputClass } from '../ui/FormNav';

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (updated: Client) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave
}) => {
  if (!isOpen || !client) return null;

  const [name, setName] = useState(client.name);
  const [type, setType] = useState(client.type);
  const [contact, setContact] = useState(client.contact);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email);
  const [notes, setNotes] = useState(client.notes || '');

  useEffect(() => {
    if (client) {
      setName(client.name);
      setType(client.type);
      setContact(client.contact);
      setPhone(client.phone);
      setEmail(client.email);
      setNotes(client.notes || '');
    }
  }, [client]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Client = {
      ...client,
      name: name.trim(),
      type,
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim()
    };
    StorageService.updateClient(updated);
    onSave(updated);
    onClose();
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-cave-800 bg-cave-900/90 shrink-0">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-ebc-straw shrink-0" />
          <div>
            <h3 className="font-bold text-base text-cave-50">
              {client.id ? `Modifier : ${client.name || 'Nouveau client'}` : 'Nouveau client'}
            </h3>
            <span className="text-footnote font-mono text-cave-400">{client.id}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="p-2 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSave} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-sm overscroll-contain">
        <div>
          <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Nom / Raison Sociale</label>
          <TextInput
            name="cl_company_label"
            required
            value={name}
            onChange={setName}
            className={`${inputClass} font-bold`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Type de client</label>
            <select
              name="cl_category_sel"
              autoComplete="off"
              data-form-type="other"
              value={type}
              onChange={(e) => setType(e.target.value as 'Pro' | 'Privé')}
              className={inputClass}
            >
              <option value="Pro">Professionnel (Restaurant/Bar/Cave)</option>
              <option value="Privé">Particulier / Vente directe</option>
            </select>
          </div>

          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Statut</label>
            <div className="w-full bg-cave-950/60 border border-cave-800 rounded-control p-2 text-xs text-cave-400 leading-relaxed">
              Calculé d'après les ventes (Prospect ➔ Actif ➔ Fidèle).
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Nom du contact</label>
            <TextInput
              name="cl_contact_person_label"
              value={contact}
              onChange={setContact}
              placeholder="ex: M. Martin, Mme Dupont..."
            />
          </div>
          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Téléphone / Mobile</label>
            <input
              name="cl_contact_tel_digits"
              type="text"
              inputMode="tel"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="026 408 33 33"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Email pour facturation QR</label>
          <input
            name="cl_billing_mail"
            type="text"
            inputMode="email"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@restaurant.ch"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm flex items-center">
            <FileText className="w-3.5 h-3.5 text-ebc-straw mr-1" /> Notes & Accès logistiques
          </label>
          <textarea
            rows={2}
            name="cl_logistics_memo"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ex: Consignes de dépôt, créneaux horaires, jours de fermeture..."
            className={inputClass}
          />
        </div>

        {/* Sticky Actions */}
        <StickyActions>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-1 text-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            <span>Enregistrer</span>
          </button>
        </StickyActions>
      </form>
    </ModalShell>
  );
};

