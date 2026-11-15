import React, { useEffect, useState } from 'react';
import { Archive, Check, ChevronRight, Pencil, Phone, Plus, UserCheck, Utensils, X } from 'lucide-react';
import type { CreativeItem } from '../../types';
import { ModalShell } from '../ModalShell';
import { ConfirmSheet } from '../Sheet';
import { estDemo } from './demo';
import './atelier.css';

/**
 * Contacts de l'atelier : kc1 (choisie le 15.11), la liste de l'app affinée.
 * Un geste par ligne au repos (l'appel, ou « + » si le numéro manque) ; « Convertir en client » vit dans la fiche.
 * Champs : lieu = title, personne = contactName, numéro = contactPhone, note = notes. Aucun champ neuf.
 * Un numéro absent reste « sans numéro » : jamais un faux, jamais 0.
 * Ajouter un numéro, Modifier : la même feuille que « Noter un contact », préremplie (jamais l'ancien formulaire à dix champs).
 * Les messages (converti, mis à jour, retiré) sont ici, au bas de l'écran : ils ne couvrent pas l'en-tête.
 */
export interface NouveauContact { lieu: string; personne: string; numero: string; note: string }

interface Props {
  items: CreativeItem[];
  adding: boolean;
  onAdding: (ouvert: boolean) => void;
  onCreate: (c: NouveauContact) => void;
  /** `true` quand une fiche Clients vient d'être créée ; `false` : rien n'a été fait (déjà converti, ou second toucher : verrou BE-22). */
  onConvert: (item: CreativeItem) => boolean;
  onUpdate: (item: CreativeItem, c: NouveauContact) => void;
  onRemove: (item: CreativeItem) => void;
}

const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
const premiereLigne = (note?: string) => (note ?? '').trim().split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, '');

export const ContactsView: React.FC<Props> = ({ items, adding, onAdding, onCreate, onConvert, onUpdate, onRemove }) => {
  const [filtre, setFiltre] = useState<'tous' | 'appeler' | 'sans'>('tous');
  const [openId, setOpenId] = useState<string | null>(null);
  const [retirer, setRetirer] = useState<CreativeItem | null>(null);
  const [draft, setDraft] = useState<NouveauContact>({ lieu: '', personne: '', numero: '', note: '' });
  const [edit, setEdit] = useState<{ item: CreativeItem; surNumero: boolean } | null>(null);
  const [message, setMessage] = useState<{ texte: string; versClients?: boolean } | null>(null);
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 7000); return () => clearTimeout(t); }, [message]);
  const ouvert = items.find((i) => i.id === openId) ?? null;
  const avecNumero = items.filter((i) => i.contactPhone?.trim());
  const sansNumero = items.filter((i) => !i.contactPhone?.trim());
  const visibles = filtre === 'appeler' ? avecNumero : filtre === 'sans' ? sansNumero : items;
  const demo = items.some((i) => estDemo(i.id));

  const formOuvert = adding || edit !== null;
  const fermerAjout = () => { onAdding(false); setEdit(null); setDraft({ lieu: '', personne: '', numero: '', note: '' }); };
  const ouvrirEdition = (item: CreativeItem, surNumero: boolean) => {
    setDraft({ lieu: item.title, personne: item.contactName ?? '', numero: item.contactPhone ?? '', note: item.notes ?? '' });
    setEdit({ item, surNumero });
  };
  const garder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.lieu.trim()) return;
    if (edit) { onUpdate(edit.item, draft); setMessage({ texte: `« ${draft.lieu.trim()} » mis à jour.` }); } else onCreate(draft);
    fermerAjout();
  };
  const convertir = (item: CreativeItem) => {
    setOpenId(null);
    // `false` : un second toucher sur la même fiche (verrou BE-22) ; le message du premier reste.
    if (onConvert(item)) setMessage({ texte: `« ${item.title} » est dans Clients`, versClients: true });
  };
  const clients = () => {
    const pris = !window.dispatchEvent(new CustomEvent('affinee:ouvrir-clients', { cancelable: true }));
    if (!pris) setIndice(true);
  };
  const [indice, setIndice] = useState(false);

  return (
    <section className="ct" aria-label="Contacts">
      <div className="ct-bar">
        <h3>Contacts <span className="ct-c ct-num">{items.length}</span></h3>
        {demo && <span className="ct-pill">démo</span>}
        <span className="ct-sp" />
        {items.length > 0 && <button type="button" className="ct-new" onClick={() => onAdding(true)}><Plus size={18} aria-hidden="true" />Noter<span className="sr-only"> un contact</span></button>}
      </div>

      {items.length === 0 ? (
        <div className="ct-void">
          <Utensils size={32} aria-hidden="true" className="ct-prod" />
          <p>Les bistrots et épiceries qui pourraient servir ta bière, à appeler puis passer en clients.</p>
          <button type="button" className="ct-new ct-wide" onClick={() => onAdding(true)}><Plus size={18} aria-hidden="true" />Noter un contact</button>
          <div className="ct-row ct-ghost" aria-label="À quoi ressemblera une ligne">
            <span className="ct-av"><Utensils size={18} aria-hidden="true" /></span>
            <span className="ct-tx"><b>Un bistrot</b><span>qui · son numéro</span></span>
            <span className="ct-pill">exemple</span>
          </div>
        </div>
      ) : (
        <>
          <div className="ct-chips" role="group" aria-label="Filtrer les contacts">
            <button type="button" aria-pressed={filtre === 'tous'} className="ct-chip" onClick={() => setFiltre('tous')}>Tous</button>
            {avecNumero.length > 0 && <button type="button" aria-pressed={filtre === 'appeler'} className="ct-chip" onClick={() => setFiltre(filtre === 'appeler' ? 'tous' : 'appeler')}><Phone size={14} aria-hidden="true" /><span className="ct-num">{avecNumero.length}</span> à appeler</button>}
            {sansNumero.length > 0 && <button type="button" aria-pressed={filtre === 'sans'} className="ct-chip ct-warn" onClick={() => setFiltre(filtre === 'sans' ? 'tous' : 'sans')}><span className="ct-num">{sansNumero.length}</span> sans numéro</button>}
          </div>
          <div className="ct-list">
            {visibles.map((item) => {
              const tel = item.contactPhone?.trim();
              const note = premiereLigne(item.notes);
              return (
                <div key={item.id} className="ct-row">
                  <span className="ct-av"><Utensils size={18} aria-hidden="true" /></span>
                  <button type="button" className="ct-tx" onClick={() => setOpenId(item.id)} aria-label={`Ouvrir la fiche de ${item.title}`}>
                    <b>{item.title}</b>
                    {tel ? <span className="ct-num">{[item.contactName, tel].filter(Boolean).join(' · ')}</span> : <span className="ct-no">sans numéro</span>}
                    {tel ? null : item.contactName && <span>{item.contactName}</span>}
                    {note && <i>« {note} »</i>}
                  </button>
                  {tel
                    ? <a className="ct-call" href={telHref(tel)} aria-label={`Appeler ${item.contactName || item.title}`}><Phone size={18} aria-hidden="true" /></a>
                    : <button type="button" className="ct-call ct-add" onClick={() => ouvrirEdition(item, true)} aria-label={`Ajouter le numéro de ${item.title}`}><Plus size={18} aria-hidden="true" /></button>}
                </div>
              );
            })}
          </div>
          <button type="button" className="ct-go" onClick={clients}>
            <UserCheck size={18} aria-hidden="true" /><span>Mes clients</span><span className="ct-sp" />
            <span className="ct-m">{indice ? 'dans la barre du bas' : 'Clients'}</span><ChevronRight size={18} aria-hidden="true" />
          </button>
        </>
      )}

      {ouvert && (
        <ModalShell open onClose={() => setOpenId(null)} size="md">
          <div className="ct-sheet" role="group" aria-label={`Fiche de ${ouvert.title}`}>
            <div className="ct-sh"><h2>{ouvert.title}</h2><button type="button" className="ct-x" aria-label="Fermer" onClick={() => setOpenId(null)}><X size={18} aria-hidden="true" /></button></div>
            <div className="ct-who">
              {ouvert.contactName && <span className="ct-pill ct-ink">{ouvert.contactName}</span>}
              {ouvert.status === 'validated' && <span className="ct-pill ct-ink">client</span>}
              {estDemo(ouvert.id) && <span className="ct-pill">démo</span>}
            </div>
            {ouvert.contactPhone?.trim()
              ? <a className="ct-cta" href={telHref(ouvert.contactPhone)}><Phone size={18} aria-hidden="true" />Appeler <span className="ct-num">{ouvert.contactPhone}</span></a>
              : <button type="button" className="ct-cta" onClick={() => { setOpenId(null); ouvrirEdition(ouvert, true); }}><Plus size={18} aria-hidden="true" />Ajouter le numéro</button>}
            {ouvert.notes?.trim() && <><div className="ct-lbl">Note</div><div className="ct-note">{ouvert.notes}</div></>}
            {ouvert.status === 'validated'
              ? <p className="ct-sec ct-done"><UserCheck size={22} aria-hidden="true" /><span>Déjà dans Clients<small>Rien n’est recréé.</small></span></p>
              : <button type="button" className="ct-sec" onClick={() => convertir(ouvert)}>
                  <UserCheck size={22} aria-hidden="true" />
                  <span>Convertir en client<small>Une fiche dans Clients : nom{ouvert.contactName ? `, ${ouvert.contactName}` : ''}{ouvert.contactPhone?.trim() ? ', numéro' : ''}{ouvert.notes?.trim() ? ', note' : ''}. Jamais deux.</small></span>
                </button>}
            <div className="ct-ends">
              <button type="button" onClick={() => { setOpenId(null); ouvrirEdition(ouvert, false); }}><Pencil size={16} aria-hidden="true" />Modifier</button>
              <button type="button" onClick={() => setRetirer(ouvert)}><Archive size={16} aria-hidden="true" />Retirer des contacts</button>
            </div>
          </div>
        </ModalShell>
      )}

      {formOuvert && (
        <ModalShell open onClose={fermerAjout} size="md">
          <form className="ct-sheet" onSubmit={garder} autoComplete="off" aria-label={edit ? 'Modifier le contact' : 'Noter un contact'}>
            <div className="ct-sh"><h2>{edit ? 'Modifier le contact' : 'Noter un contact'}</h2><button type="button" className="ct-x" aria-label="Fermer" onClick={fermerAjout}><X size={18} aria-hidden="true" /></button></div>
            <div className="ct-f"><label htmlFor="ct-lieu">Lieu</label>
              <input id="ct-lieu" type="text" autoFocus={!edit?.surNumero} required placeholder="Bistrot, épicerie, cave…" value={draft.lieu} onChange={(e) => setDraft({ ...draft, lieu: e.target.value })} /></div>
            <div className="ct-f"><label htmlFor="ct-pers">Personne <em>· facultatif</em></label>
              <input id="ct-pers" type="text" placeholder="Prénom" value={draft.personne} onChange={(e) => setDraft({ ...draft, personne: e.target.value })} /></div>
            <div className="ct-f"><label htmlFor="ct-num">Numéro <em>· facultatif</em></label>
              <input id="ct-num" type="text" inputMode="tel" autoFocus={edit?.surNumero} placeholder="026 408 33 33" value={draft.numero} onChange={(e) => setDraft({ ...draft, numero: e.target.value })} />
              <span className="ct-hint">Laissé vide : « sans numéro », jamais un faux.</span></div>
            <div className="ct-f"><label htmlFor="ct-note">Note <em>· facultatif</em></label>
              <textarea id="ct-note" placeholder="Ce qu’il a goûté, ce qu’il cherche…" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></div>
            <div className="ct-two"><button type="button" className="a" onClick={fermerAjout}>Annuler</button><button type="submit" className="b">Garder le contact</button></div>
          </form>
        </ModalShell>
      )}

      <ConfirmSheet
        open={Boolean(retirer)}
        onClose={() => setRetirer(null)}
        title="Retirer ce contact ?"
        what={retirer?.title ?? ''}
        consequence="Il disparaît des contacts. La suppression est journalisée."
        confirmLabel="Retirer"
        onConfirm={() => { if (retirer) { onRemove(retirer); setMessage({ texte: `« ${retirer.title} » retiré des contacts.` }); } setRetirer(null); setOpenId(null); }}
      />

      {message && (
        <div className="ct-toast" role="status"><Check size={18} aria-hidden="true" /><span>{message.texte}</span><span className="ct-sp" />
          {message.versClients && <button type="button" onClick={clients}>Voir ›</button>}
          <button type="button" aria-label="Fermer le message" onClick={() => setMessage(null)}><X size={16} aria-hidden="true" /></button>
        </div>
      )}
    </section>
  );
};
