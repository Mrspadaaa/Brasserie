import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Clock, Plus, Sparkles, WifiOff, X } from 'lucide-react';
import type { CreativeItem, PricingItem } from '../../types';
import {
  apresAnnuler, contexteModele, ecrire, envoi, estNote, lireReponse, lireSuisse, nbCochees, niveauAppel, proposer, statutEnvoi, versStockage,
  type Contexte, type ItemCarnet, type ModeIA, type NiveauIA, type Proposition
} from '../../domain/rangerNote';
import { AiClient } from '../../services/aiClient';
import { ConfirmSheet } from '../Sheet';
import { CarteAiguillage, CarteChose, FicheRangee, NoteRangee } from './NoteAiguillage';
import { reponseSimulee } from './rangerNoteSimule';
import './atelier.css';

/**
 * Le Carnet (ks4) : le fil des notes (ri4) et ses filtres Bières, Contacts, À faire, qui ouvrent les vues telles qu'en ligne ;
 * le compositeur au pouce. Une note envoyée est gardée brute tout de suite (jamais perdue), puis l'IA propose une carte ; rien
 * d'autre n'est écrit avant « Ranger ». Hors ligne : la note attend, brute, rangée au retour du réseau. IA éteinte (production,
 * tant que la tâche serveur n'est pas déployée) : la note reste brute dans le fil.
 */
export type FiltreCarnet = 'tout' | 'bieres' | 'contacts' | 'afaire';

interface Props {
  items: CreativeItem[];
  filtre: FiltreCarnet;
  onFiltre: (f: FiltreCarnet) => void;
  vues: Record<Exclude<FiltreCarnet, 'tout'>, React.ReactNode>;
  assistant: React.ReactNode;
  mode: ModeIA;
  tarifs: readonly PricingItem[];
  bieres: readonly string[];
  onAjouter: (item: CreativeItem) => void;
  onMaj: (item: CreativeItem) => void;
  onRetirer: (id: string) => void;
  onEdit: (item: CreativeItem) => void;
  onConvert: (item: CreativeItem) => boolean;
  /** Le « + » de la barre du bas, sous Tout : place le pouce dans le compositeur. */
  focusDemande?: number;
}

const FILTRES: Array<[FiltreCarnet, string, string | null]> = [['tout', 'Tout', null], ['bieres', 'Bières', 'var(--a-prod)'], ['contacts', 'Contacts', 'var(--a-hop)'], ['afaire', 'À faire', 'var(--a-fin)']];
const horodatage = (id: string) => Number(/^CR-(\d+)/.exec(id)?.[1] ?? 0);
const useEnLigne = () => {
  const [en, setEn] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const on = () => setEn(true), off = () => setEn(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return en;
};

export const NoteCarnet: React.FC<Props> = ({ items: bruts, filtre, onFiltre, vues, assistant, mode, tarifs, bieres, onAjouter, onMaj, onRetirer, onEdit, onConvert, focusDemande }) => {
  const items = bruts as unknown as ItemCarnet[];
  const enLigne = useEnLigne();
  const [texte, setTexte] = useState('');
  const [geste, setGeste] = useState<{ note: ItemCarnet; props: Proposition[]; niveau: NiveauIA; info?: string } | null>(null);
  const [charge, setCharge] = useState<ItemCarnet | null>(null);
  const [niveauCharge, setNiveauCharge] = useState<NiveauIA>('fast');
  /** Les notes déjà relancées par le « + » (modèle plus précis) : une fois par note. */
  const [plusFait, setPlusFait] = useState<ReadonlySet<string>>(() => new Set());
  const [fiche, setFiche] = useState<{ note: ItemCarnet; creees: ItemCarnet[]; contactId?: string; reste: Array<'Bière' | 'Date' | 'Prix'>; props: Proposition[]; nb: number; converti: boolean; niveau: NiveauIA } | null>(null);
  /** `noteId` : le message vit dans la carte de cette note (brute) ; sans `noteId`, au-dessus de la proposition. */
  const [message, setMessage] = useState<{ texte: string; noteId?: string } | null>(null);
  const ancre = useRef<HTMLDivElement>(null);
  const [retirer, setRetirer] = useState<ItemCarnet | null>(null);
  const racine = useRef<HTMLElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);
  const [dock, setDock] = useState({ bas: 0, haut: 0 });

  useEffect(() => { if (focusDemande) champ.current?.focus(); }, [focusDemande]);
  useLayoutEffect(() => {
    const mesurer = () => {
      const barre = [...document.querySelectorAll<HTMLElement>('.fixed.bottom-0')].filter((e) => e.offsetHeight > 0 && e.getBoundingClientRect().top > innerHeight / 2);
      const bas = Math.max(0, ...barre.map((e) => e.offsetHeight));
      const haut = (racine.current?.getBoundingClientRect().top ?? 0) + scrollY;
      setDock({ bas, haut });
    };
    mesurer(); addEventListener('resize', mesurer); return () => removeEventListener('resize', mesurer);
  }, [filtre]);

  const contexte = (): Contexte => ({ saisie: new Date(), contacts: bruts.filter((i) => i.type === 'prospect'), tarifs, bieres });

  /** Le « + » est-il offert pour cette note ? (une fois par note, en ligne, IA allumée) */
  const plusOffert = (note: ItemCarnet) => niveauAppel(true, mode, enLigne, plusFait.has(note.id)) !== null;

  /**
   * La note part à l'IA : simulée au banc, réelle seulement si le drapeau le permet. `null` : rien d'utilisable, la note reste brute.
   * `plus` : le « + », la même note au modèle plus précis (Max) ; s'il ne rend rien, la proposition d'avant revient, sans perte.
   */
  const demander = async (note: ItemCarnet, plus = false) => {
    const niveau = niveauAppel(plus, mode, enLigne, plusFait.has(note.id));
    if (!niveau) return;
    const avant = geste?.note.id === note.id ? geste : null;
    const ctx = contexte();
    setCharge(note); setNiveauCharge(niveau); setGeste(null); setFiche(null); setMessage(null);
    if (niveau === 'max') setPlusFait((s) => new Set(s).add(note.id));
    let brut: unknown = null, panne = false;
    if (mode === 'simule') { await new Promise((r) => setTimeout(r, 500)); brut = reponseSimulee(note.title, ctx.saisie, ctx.contacts.map((c) => c.title)); }
    else if (mode === 'production') { const r = await AiClient.run({ task: 'rangerNote', tier: niveau, context: contexteModele(note.title, ctx) }); brut = r.ok ? r.data : null; panne = !r.ok; }
    setCharge(null);
    const effets = lireReponse(brut, note.title, ctx.saisie);
    const props = effets ? proposer(effets, ctx) : [];
    if (props.length === 0) {
      if (avant) { setGeste({ ...avant, info: panne ? 'Le modèle plus précis n’a pas répondu : la proposition reste.' : 'Le modèle plus précis n’a rien proposé d’autre : la proposition reste.' }); return; }
      const qui = niveau === 'max' ? 'Le modèle plus précis' : 'L’IA';
      setMessage({ texte: `${qui} ${panne ? 'n’a pas répondu' : 'n’a rien proposé'} : ta note reste telle quelle.`, noteId: note.id });
      return;
    }
    setGeste({ note, props, niveau });
  };

  /** Au retour du réseau, les notes en attente redeviennent brutes ; la première part à l'IA. */
  useEffect(() => {
    if (!enLigne || mode === 'eteint') return;
    const attente = items.filter((i) => estNote(i) && i.status === 'todo');
    if (attente.length === 0) return;
    attente.forEach((n) => onMaj(versStockage({ ...n, status: 'idea' })));
    if (!geste && !charge) void demander({ ...attente[0], status: 'idea' });
  }, [enLigne]);

  const envoyer = () => {
    const phrase = texte.trim();
    if (!phrase) return;
    const quoi = envoi(mode, enLigne);
    const note: ItemCarnet = { id: `CR-${Date.now()}`, type: 'note', title: phrase, status: statutEnvoi(quoi) };
    onAjouter(versStockage(note));
    setTexte(''); onFiltre('tout'); setFiche(null);
    if (quoi === 'ia') void demander(note);
  };

  const ranger = () => {
    if (!geste) return;
    const e = ecrire(geste.note, geste.props, { tarifs }, Date.now());
    if (!e) return;
    setMessage(null);
    e.creer.forEach((c) => onAjouter(versStockage(c)));
    onMaj(versStockage(e.note));
    const lien = geste.props.find((p): p is Extract<Proposition, { sorte: 'lier' }> => p.coche && p.sorte === 'lier');
    let contactId = lien?.contactId;
    contactId ??= e.creer.find((c) => c.type === 'prospect')?.id;
    let converti = false;
    if (e.convertir) { const cible = [...bruts, ...e.creer.map(versStockage)].find((c) => c.id === e.convertir); if (cible) converti = onConvert(cible); }
    setFiche({ note: e.note, creees: e.creer, contactId, reste: e.reste, props: geste.props, nb: nbCochees(geste.props), converti, niveau: geste.niveau });
    setGeste(null);
  };
  const annuler = () => {
    if (!fiche) return;
    fiche.creees.forEach((c) => onRetirer(c.id));
    onMaj(versStockage({ ...fiche.note, status: 'idea' }));
    // La proposition revient telle que corrigée ; une fiche Clients déjà créée n'est pas retirée d'ici, et le dit.
    setGeste({ note: { ...fiche.note, status: 'idea' }, props: apresAnnuler(fiche.props, fiche.converti), niveau: fiche.niveau });
    setMessage(fiche.converti ? { texte: `Annulé. « ${ficheContact?.title ?? 'Le contact'} » reste dans Clients : Annuler ne retire pas une fiche Clients.` } : null);
    setFiche(null);
  };

  // Le fil : les choses rangées sous leur note ; les tâches datées d'abord (par date), puis le reste, le plus récent en haut.
  const fil = useMemo(() => {
    const notes = items.filter((i) => estNote(i) && i.status !== 'todo' && i.id !== geste?.note.id && i.id !== charge?.id);
    const prises = new Set<string>();
    const enfants = new Map<string, CreativeItem[]>();
    for (const n of notes) {
      const siens = items.filter((i) => i.noteId === n.id);
      const lies = items.filter((p) => p.type === 'prospect' && !p.noteId && siens.some((s) => s.type === 'event' && s.contactName === p.title) && !prises.has(p.id));
      const tous = [...lies, ...siens.filter((s) => s.type === 'prospect'), ...siens.filter((s) => s.type !== 'prospect')] as unknown as CreativeItem[];
      tous.forEach((t) => prises.add(t.id));
      enfants.set(n.id, tous);
    }
    const libres = items.filter((i) => !estNote(i) && !prises.has(i.id) && ['event', 'prospect', 'recipe-idea'].includes(i.type) && !(i.type === 'event' && i.status === 'done'));
    const datees = libres.filter((i) => i.type === 'event' && lireSuisse(i.date)).sort((a, b) => lireSuisse(a.date)!.getTime() - lireSuisse(b.date)!.getTime());
    const reste = [...notes, ...libres.filter((i) => !datees.includes(i))].sort((a, b) => horodatage(b.id) - horodatage(a.id));
    return { entrees: [...datees, ...reste], enfants };
  }, [items, geste, charge]);
  const attente = items.filter((i) => estNote(i) && i.status === 'todo');
  useEffect(() => { if (geste) ancre.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [geste?.note.id]);
  useEffect(() => { if (message) document.querySelector('.nc-msg')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [message]);

  const ficheContact = fiche?.contactId ? bruts.find((i) => i.id === fiche.contactId) : undefined;
  const carte = (item: CreativeItem) => <CarteChose item={item} onOuvrir={(i) => (i.type === 'prospect' ? onFiltre('contacts') : onEdit(i))} onDate={onEdit} />;
  
  return (
    <section ref={racine} className="nc" aria-label="Carnet" style={{ display: 'flex', flexDirection: 'column', minHeight: dock.haut ? `calc(100dvh - ${dock.haut + dock.bas}px)` : undefined, ['--nc-dock' as string]: `${dock.bas}px` }}>
      {!enLigne && <div className="nc-off" role="status"><WifiOff size={18} aria-hidden="true" />Hors ligne</div>}
      <div className="nc-flt" role="group" aria-label="Filtrer le carnet">
        {FILTRES.map(([f, nom, c]) => <button key={f} type="button" className="nc-f" aria-pressed={filtre === f} onClick={() => { onFiltre(f); setFiche(null); }}>{c && <i style={{ background: c }} aria-hidden="true" />}{nom}</button>)}
      </div>
      {filtre !== 'tout' ? <div style={{ flex: 1, paddingTop: 6 }}>{vues[filtre]}{enLigne && <div className="nc-pied">{assistant}</div>}</div> : (
        <div className="nc-fil" style={{ flex: 1, justifyContent: geste || charge ? 'flex-end' : undefined }}>
          {fiche ? <FicheRangee note={fiche.note} creees={fiche.creees} items={items} contact={ficheContact} reste={fiche.reste} nb={fiche.nb} converti={fiche.converti} onAnnuler={annuler} onOuvrir={(v) => { setFiche(null); onFiltre(v); }} onPoser={onEdit} /> : <>
            {fil.entrees.length === 0 && !geste && !charge && <p className="nc-vide">Note une idée, un contact, une chose à faire : comme un message.</p>}
            {fil.entrees.filter((i) => !(geste || charge) || (i.type === 'event' && lireSuisse(i.date))).slice(0, geste || charge ? 1 : undefined).map((i) => {
              if (!estNote(i)) return <React.Fragment key={i.id}>{carte(i as unknown as CreativeItem)}</React.Fragment>;
              const enf = fil.enfants.get(i.id) ?? [];
              if (enf.length > 0) return <NoteRangee key={i.id} note={i} enfants={enf} carte={carte} />;
              return <div key={i.id} className="nc-ph nc-brute"><span><small>ta note</small>{i.title}{message?.noteId === i.id && <small className="nc-msg" role="status">{message.texte}</small>}
                {message?.noteId === i.id && plusOffert(i) && <button type="button" className="nc-add nc-plus-l" aria-label="Relancer avec le modèle plus précis" onClick={() => void demander(i, true)}><Plus size={16} aria-hidden="true" />modèle plus précis</button>}</span>
                {mode !== 'eteint' && enLigne && <button type="button" className="nc-add" onClick={() => void demander(i)}><Sparkles size={14} aria-hidden="true" />Ranger</button>}
                <button type="button" className="nc-x" aria-label={`Retirer la note « ${i.title} »`} onClick={() => setRetirer(i)}><X size={18} aria-hidden="true" /></button></div>;
            })}
            {charge && <div className="nc-big" role="status"><div className="nc-aih"><Sparkles size={14} aria-hidden="true" />{niveauCharge === 'max' ? 'Le modèle plus précis range ta note…' : 'L’IA range ta note…'}{mode === 'simule' && <em>exemple</em>}</div><div className="nc-ph">{charge.title}</div></div>}
            {message && !message.noteId && <p className="nc-msg" role="status">{message.texte}</p>}
            {geste && <div ref={ancre} className="nc-ancre"><CarteAiguillage note={geste.note} props={geste.props} simule={mode === 'simule'} tarifs={tarifs} bieres={bieres}
              niveau={geste.niveau} info={geste.info} onPlus={plusOffert(geste.note) ? () => void demander(geste.note, true) : undefined}
              onChange={(props) => setGeste({ ...geste, props })} onRanger={ranger} onGarder={() => setGeste(null)} /></div>}
          </>}
        </div>
      )}
      {filtre === 'tout' && <div className="nc-comp">
        {enLigne && !geste && !fiche && !charge && assistant}
        {attente.map((n) => <div key={n.id} className="nc-ph nc-att">{n.title}<span className="nc-wait"><Clock size={14} aria-hidden="true" />rangée au retour du réseau</span></div>)}
        <div className="nc-line">
          <textarea ref={champ} className="nc-field" rows={1} placeholder="Noter…" aria-label="Noter" value={texte} enterKeyHint="send"
            onChange={(e) => setTexte(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }} />
          <button type="button" className="nc-send" aria-label="Envoyer la note" disabled={!texte.trim()} onClick={envoyer}><ArrowUp size={20} aria-hidden="true" /></button>
        </div>
      </div>}
      <ConfirmSheet open={Boolean(retirer)} onClose={() => setRetirer(null)} title="Retirer cette note ?" what={retirer?.title ?? ''}
        consequence="Elle disparaît du carnet. La suppression est journalisée." confirmLabel="Retirer"
        onConfirm={() => { if (retirer) onRetirer(retirer.id); setRetirer(null); }} />
    </section>
  );
};
