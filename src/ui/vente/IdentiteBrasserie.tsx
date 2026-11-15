import React, { useState } from 'react';
import type { AdresseSaisie, AppConfig } from '../../types';
import { Input } from '../Input';
import { inputClass } from '../FormNav';
import { ModalShell } from '../ModalShell';
import { COMPANY_FALLBACK, adresseBrasserie, uidValide } from '../../domain/companyDefaults';
import { ibanCompact, ibanValide, MESSAGE_IBAN } from '../../domain/finance/iban';
import { StorageService } from '../../services/storage';
import { AdresseChamps, ADRESSE_VIDE } from './AdresseChamps';

type Company = AppConfig['company'];

/** L'adresse montrée : la saisie structurée, sinon la chaîne existante découpée (rien d'inventé), sinon vide. */
const adresseMontree = (c: Company): AdresseSaisie => {
  const a = adresseBrasserie(c);
  return c.adresse ?? (a ? { rue: a.rue, numero: a.numero, npa: a.npa, localite: a.localite, pays: a.pays } : ADRESSE_VIDE);
};

/**
 * L'identité de la brasserie (nom, UID, adresse structurée, IBAN) : un seul formulaire, CONTRÔLÉ. Il n'écrit rien lui-même :
 * dans Réglages c'est `SettingsModal` qui enregistre ; dans la caisse, `IdentiteBrasserieFeuille`.
 * Le champ IBAN garde l'étiquette, l'id et le nom d'avant (tests, gestionnaires de mots de passe).
 */
export function IdentiteBrasserie({ company, onChange, ibanErreur = '' }: { company: Company; onChange: (next: Company) => void; ibanErreur?: string }) {
  const uidErreur = company.uid?.trim() && !uidValide(company.uid) ? 'Le numéro UID a la forme CHE-123.456.789.' : '';
  return (
    <div className="p-2 bg-cave-850/40 rounded-control border border-cave-800 space-y-2">
      <h3 className="font-bold text-cave-200 text-xs">Identité de la brasserie</h3>
      <div>
        <label htmlFor="identite-nom" className="text-xs text-cave-400">Nom sur les factures</label>
        <Input id="identite-nom" name="identite_nom_label" autoComplete="off" value={company.name} onChange={e => onChange({ ...company, name: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label htmlFor="identite-uid" className="text-xs text-cave-400">Numéro UID (CHE-123.456.789)</label>
        <Input id="identite-uid" name="identite_uid_label" autoComplete="off" value={company.uid ?? ''} onChange={e => onChange({ ...company, uid: e.target.value })} aria-invalid={uidErreur ? true : undefined} className={`${inputClass} font-mono`} />
        {uidErreur && <p className="text-xs text-cave-400">{uidErreur}</p>}
      </div>
      <AdresseChamps legende="Adresse de la brasserie" value={adresseMontree(company)} onChange={adresse => onChange({ ...company, adresse })} />
      <div className="space-y-1">
        <label htmlFor="settings-company-iban" className="font-bold text-cave-200 text-xs">IBAN Brasserie (factures par virement)</label>
        <Input
          id="settings-company-iban" type="text" name="settings_company_qr_ref" autoComplete="off" autoCorrect="off" spellCheck={false}
          data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
          value={company.iban || COMPANY_FALLBACK.iban}
          aria-invalid={ibanErreur ? true : undefined} aria-describedby={ibanErreur ? 'settings-company-iban-erreur' : undefined}
          onChange={e => onChange({ ...company, iban: e.target.value })}
          className={`${inputClass} font-mono`}
        />
        {ibanErreur && <p id="settings-company-iban-erreur" role="alert" className="text-xs text-alert-strong">{ibanErreur}</p>}
      </div>
    </div>
  );
}

/**
 * La feuille de la caisse (bande « adresse ? ») : même formulaire, qui écrit SEULEMENT `company`, sur la configuration relue à l'enregistrement
 * (lecture-modification-écriture : jamais l'instantané d'un autre écran). L'IBAN de repli de l'app n'est écrit que s'il a été tapé.
 */
export function IdentiteBrasserieFeuille({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const depart = StorageService.getConfig().company;
  const [company, setCompany] = useState<Company>(depart);
  const ibanTouche = (company.iban ?? '') !== (depart.iban ?? '');
  const ibanErreur = ibanTouche && ibanCompact(company.iban) && !ibanValide(company.iban) ? MESSAGE_IBAN : '';
  const [erreur, setErreur] = useState('');
  const enregistrer = () => {
    if (ibanErreur) { setErreur(ibanErreur); return; }
    const config = StorageService.getConfig();
    const suivant: Company = { ...config.company, name: company.name, uid: company.uid, adresse: company.adresse ?? adresseMontree(company) };
    if (ibanTouche) suivant.iban = company.iban;
    StorageService.saveConfig({ ...config, company: suivant });
    onSaved(); onClose();
  };
  return (
    <ModalShell open onClose={onClose} size="md" abovePage labelledBy="identite-titre">
      <header className="client-form-header" style={{ padding: '8px 12px' }}><h3 id="identite-titre" className="font-semibold text-cave-50">Identité et adresse de la brasserie</h3></header>
      <div className="p-3 space-y-2 overflow-y-auto"><IdentiteBrasserie company={company} onChange={setCompany} ibanErreur={ibanErreur} />
        {erreur && <p role="alert" className="text-xs text-alert-strong">{erreur}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="clients-action" onClick={onClose}>Annuler</button><button type="button" className="clients-action clients-action-primary" onClick={enregistrer}>Enregistrer</button></div></div>
    </ModalShell>
  );
}
