import React, { useState } from 'react';
import { Beer, Calendar, Check, ChevronDown, ChevronRight, Pencil, Phone, Sparkles, UserPlus, Users, Utensils } from 'lucide-react';
import type { CreativeItem, PricingItem } from '../../types';
import {
  chf, dateDeNote, jourComplet, jourMois, JOURS, lireSuisse, nbCochees, prixDevine, type ItemCarnet, type Proposition
} from '../../domain/rangerNote';
import './atelier.css';

/**
 * ks4 : l'aiguillage. La carte « Proposé par l'IA » (une case par chose, la carte entière est la cible de sa case) et la fiche
 * « Rangée · n choses » (fenêtres À faire et Contacts telles qu'en ligne, « Reste à poser »). Aucune écriture ici : le Carnet écrit
 * au toucher « Ranger », par `ecrire` (domain/rangerNote).
 */
const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
const choses = (n: number) => `${n} chose${n > 1 ? 's' : ''}`;
const couleur: Record<Proposition['sorte'], string> = { tache: 'var(--a-fin)', lier: 'var(--a-hop)', 'noter-contact': 'var(--a-hop)', client: 'var(--a-hop)', idee: 'var(--a-prod)' };

interface CarteProps {
  note: ItemCarnet;
  props: Proposition[];
  simule: boolean;
  tarifs: readonly PricingItem[];
  bieres: readonly string[];
  onChange: (props: Proposition[]) => void;
  onRanger: () => void;
  onGarder: () => void;
}

/** Geste : ta phrase, puis une case par chose qu'elle peut créer ; « Corriger » ouvre les titres et la date à la main. */
export const CarteAiguillage: React.FC<CarteProps> = ({ note, props, simule, tarifs, bieres, onChange, onRanger, onGarder }) => {
  const [corriger, setCorriger] = useState(false);
  const n = nbCochees(props);
  const maj = (cle: string, patch: Partial<Proposition>) => onChange(props.map((p) => (p.cle === cle ? ({ ...p, ...patch } as Proposition) : p)));
  const basculer = (p: Proposition) => maj(p.cle, { coche: !p.coche });

  const contenu = (p: Proposition) => {
    if (p.sorte === 'tache') {
      const d = lireSuisse(p.date);
      const prix = prixDevine(p.nombre, p.contenanceL, p.biere, tarifs);
      return <>
        <span className="nc-st" style={{ ['--c' as string]: 'var(--a-fin)' }}><Calendar size={13} aria-hidden="true" />À faire · {d ? jourComplet(d) : 'sans date'}</span>
        {corriger ? <>
          <input className="nc-in" aria-label="Titre de la tâche" value={p.titre} onChange={(e) => maj(p.cle, { titre: e.target.value })} />
          <input className="nc-in nc-num" aria-label="Date (JJ.MM.AAAA)" inputMode="numeric" placeholder="JJ.MM.AAAA" value={p.date ?? ''} onChange={(e) => maj(p.cle, { date: e.target.value.trim() || undefined })} />
        </> : <b>{p.titre}</b>}
        {prix !== undefined && <span className="nc-px">{chf(prix)} CHF HT<em>· deviné</em></span>}
      </>;
    }
    if (p.sorte === 'lier') return <><span className="nc-st" style={{ ['--c' as string]: 'var(--a-hop)' }}><Users size={13} aria-hidden="true" />Lier au contact <em>· deviné</em></span><b>{p.lieu}</b></>;
    if (p.sorte === 'noter-contact') return <>
      <span className="nc-st" style={{ ['--c' as string]: 'var(--a-hop)' }}><UserPlus size={13} aria-hidden="true" />Noter le contact <em>· lu dans ta note</em></span>
      {corriger ? <input className="nc-in" aria-label="Lieu du contact" value={p.lieu} onChange={(e) => maj(p.cle, { lieu: e.target.value })} /> : <b>{p.lieu}{p.personne ? ` · ${p.personne}` : ''}</b>}
    </>;
    if (p.sorte === 'client') return <><span className="nc-st" style={{ ['--c' as string]: 'var(--a-mut)' }}><UserPlus size={13} aria-hidden="true" />Idée de l'IA</span><b>Convertir en client</b></>;
    return <>
      <span className="nc-st" style={{ ['--c' as string]: 'var(--a-prod)' }}><Beer size={13} aria-hidden="true" />Idée de bière</span>
      {corriger ? <input className="nc-in" aria-label="Titre de l'idée" value={p.titre} onChange={(e) => maj(p.cle, { titre: e.target.value })} /> : <b>{p.titre}</b>}
    </>;
  };
  const etiquette = (p: Proposition) => p.sorte === 'tache' ? `Créer la tâche « ${p.titre} »` : p.sorte === 'lier' ? `Lier au contact ${p.lieu}` : p.sorte === 'noter-contact' ? `Noter le contact ${p.lieu}` : p.sorte === 'client' ? 'Convertir en client' : `Garder l'idée « ${p.titre} »`;
  const caseCochee = (p: Proposition) => <span className={`nc-cb${p.coche ? ' on' : ''}`} aria-hidden="true"><i>{p.coche && <Check size={16} strokeWidth={3} />}</i></span>;

  return (
    <div className="nc-big" role="group" aria-label="Proposé par l'IA">
      <div className="nc-aih"><Sparkles size={14} aria-hidden="true" />Proposé par l'IA{simule && <em>exemple</em>}</div>
      <div className="nc-ph">{note.title}</div>
      <div className="nc-sw">
        {props.map((p) => (
          <div key={p.cle} className={`nc-br${p.coche ? '' : ' off'}`} style={{ ['--c' as string]: couleur[p.sorte] }}>
            {corriger
              ? <div className="nc-ch"><div className="nc-tx">{contenu(p)}</div><button type="button" className={`nc-cb${p.coche ? ' on' : ''}`} role="checkbox" aria-checked={p.coche} aria-label={etiquette(p)} onClick={() => basculer(p)}><i>{p.coche && <Check size={16} strokeWidth={3} />}</i></button></div>
              : <button type="button" className="nc-ch" role="checkbox" aria-checked={p.coche} aria-label={etiquette(p)} onClick={() => basculer(p)}><span className="nc-tx">{contenu(p)}</span>{caseCochee(p)}</button>}
            {p.sorte === 'tache' && p.nombre !== undefined && bieres.length > 0 && (
              <div className="nc-fl">
                <label><Beer size={16} aria-hidden="true" />Bière<span>{p.biere ?? 'à choisir'}</span><ChevronDown size={14} aria-hidden="true" />
                  <select aria-label="Bière livrée" value={p.biere ?? ''} onChange={(e) => maj(p.cle, { biere: e.target.value || undefined })}>
                    <option value="">à choisir</option>
                    {bieres.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="nc-two">
        <button type="button" className="a" aria-pressed={corriger} onClick={() => setCorriger(!corriger)}><Pencil size={18} aria-hidden="true" />{corriger ? 'Fini' : 'Corriger'}</button>
        {n > 0
          ? <button type="button" className="b" onClick={onRanger}><Check size={18} aria-hidden="true" />Ranger · {choses(n)}</button>
          : <button type="button" className="b" onClick={onGarder}>Garder ta note telle quelle</button>}
      </div>
    </div>
  );
};

/** Une carte rangée du fil (bande de couleur). `branche` : au bout d'une branche de note (picto devant le titre). */
export const CarteChose: React.FC<{ item: CreativeItem; onOuvrir: (item: CreativeItem) => void; onDate: (item: CreativeItem) => void }> = ({ item, onOuvrir, onDate }) => {
  if (item.type === 'prospect') {
    const tel = item.contactPhone?.trim();
    return <div className="nc-car" style={{ ['--c' as string]: 'var(--a-hop)' }}>
      <button type="button" className="nc-tx" onClick={() => onOuvrir(item)}><b className="nc-ti"><Users size={18} aria-hidden="true" />{item.title}</b></button>
      {tel && <a className="nc-call" href={telHref(tel)} aria-label={`Appeler ${item.contactName || item.title}`}><Phone size={18} aria-hidden="true" /></a>}
    </div>;
  }
  if (item.type === 'event') {
    const d = lireSuisse(item.date);
    return <div className="nc-car" style={{ ['--c' as string]: 'var(--a-fin)' }}>
      <button type="button" className="nc-tx" onClick={() => onOuvrir(item)}>
        {d ? <><span className="nc-st"><Calendar size={13} aria-hidden="true" />{jourComplet(d)}</span><b>{item.title}</b></> : <b className="nc-ti"><Calendar size={18} aria-hidden="true" />{item.title}</b>}
      </button>
      {!d && <button type="button" className="nc-add" onClick={() => onDate(item)} aria-label={`Poser une date à ${item.title}`}><span aria-hidden="true">+</span> date</button>}
    </div>;
  }
  return <div className="nc-car" style={{ ['--c' as string]: 'var(--a-prod)' }}>
    <button type="button" className="nc-tx" onClick={() => onOuvrir(item)}><b className="nc-ti"><Beer size={18} aria-hidden="true" />{item.title}</b></button>
  </div>;
};

/** Ta note rangée : la phrase, puis ses branches vers ce qu'elle a créé ou lié. */
export const NoteRangee: React.FC<{ note: ItemCarnet; enfants: CreativeItem[]; carte: (item: CreativeItem) => React.ReactNode }> = ({ note, enfants, carte }) => (
  <div className="nc-note">
    <div className="nc-ph"><small>ta note</small>{note.title}</div>
    <div className="nc-sw">
      {enfants.map((e) => <div key={e.id} className="nc-br" style={{ ['--c' as string]: e.type === 'prospect' ? 'var(--a-hop)' : e.type === 'event' ? 'var(--a-fin)' : 'var(--a-prod)' }}>{carte(e)}</div>)}
    </div>
  </div>
);

interface FicheProps {
  note: ItemCarnet;
  creees: ItemCarnet[];
  /** Tous les items (pour la tâche suivante du fil et les « à faire » du contact). */
  items: readonly ItemCarnet[];
  contact?: CreativeItem;
  reste: Array<'Bière' | 'Date' | 'Prix'>;
  onAnnuler: () => void;
  onOuvrir: (vue: 'afaire' | 'contacts' | 'bieres') => void;
  onPoser: (item: CreativeItem) => void;
}

/** Fiche : « Rangée · n choses · Annuler », la note datée, ses fenêtres À faire (perle neuve, puis la suivante) et Contacts, « Reste à poser ». */
export const FicheRangee: React.FC<FicheProps> = ({ note, creees, items, contact, reste, onAnnuler, onOuvrir, onPoser }) => {
  const taches = creees.filter((c) => c.type === 'event');
  const idees = creees.filter((c) => c.type === 'recipe-idea');
  const saisie = dateDeNote(note.id);
  const nbChoses = creees.length + (contact && !creees.some((c) => c.id === contact.id) ? 1 : 0);
  const premiere = taches[0] ? lireSuisse(taches[0].date) : null;
  const suivante = premiere ? items
    .filter((i) => i.type === 'event' && i.status !== 'done' && !creees.some((c) => c.id === i.id))
    .map((i) => ({ i, d: lireSuisse(i.date) }))
    .filter((x): x is { i: ItemCarnet; d: Date } => x.d !== null && x.d >= premiere)
    .sort((a, b) => a.d.getTime() - b.d.getTime())[0] : undefined;
  const aFaire = contact ? items.filter((i) => i.type === 'event' && i.status !== 'done' && i.contactName === contact.title) : [];
  const avant = aFaire.map((i) => lireSuisse(i.date)).filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime())[0];
  const ligneDate = (d: Date | null) => <span className="nc-dd">{d ? <>{jourMois(d)}<small>{JOURS[d.getDay()]}</small></> : <small>sans date</small>}</span>;

  return <>
    <div className="nc-ok" role="status"><Check size={18} aria-hidden="true" />Rangée · {choses(nbChoses)}<button type="button" onClick={onAnnuler}>Annuler</button></div>
    <div className="nc-note">
      <div className="nc-ph nc-src"><small>ta note{saisie ? ` du ${jourComplet(saisie)}` : ''}</small></div>
      <div className="nc-sw">
        {taches.length > 0 && <div className="nc-br" style={{ ['--c' as string]: 'var(--a-fin)' }}><div className="nc-win" style={{ ['--c' as string]: 'var(--a-fin)' }}>
          <div className="nc-wh"><Calendar size={16} aria-hidden="true" />À faire<button type="button" onClick={() => onOuvrir('afaire')}>Ouvrir<ChevronRight size={14} aria-hidden="true" /></button></div>
          {taches.map((t) => <div key={t.id} className="nc-wb">{ligneDate(lireSuisse(t.date))}<span className="nc-bd n" aria-hidden="true" /><div>
            <b style={{ fontSize: 16 }}>{t.title}</b>
            {t.targetPrice !== undefined && <span className="nc-px">{chf(t.targetPrice)} CHF HT</span>}
            {t.contactName && <span className="nc-lk"><Users size={13} aria-hidden="true" />{t.contactName}</span>}
          </div></div>)}
          {suivante && <div className="nc-wb" style={{ paddingTop: 0 }}>{ligneDate(suivante.d)}<span className="nc-bd" aria-hidden="true" /><span style={{ fontSize: 15 }}>{suivante.i.title}</span></div>}
        </div></div>}
        {contact && <div className="nc-br" style={{ ['--c' as string]: 'var(--a-hop)' }}><div className="nc-win" style={{ ['--c' as string]: 'var(--a-hop)' }}>
          <div className="nc-wh"><Users size={16} aria-hidden="true" />Contacts<button type="button" onClick={() => onOuvrir('contacts')}>Ouvrir<ChevronRight size={14} aria-hidden="true" /></button></div>
          <div className="nc-wb"><span className="nc-av"><Utensils size={18} aria-hidden="true" /></span><div style={{ flex: 1 }}>
            <b style={{ fontSize: 16 }}>{contact.title}</b>
            {aFaire.length > 0 && <><br /><span className="nc-tc nc-num">{aFaire.length} à faire{avant ? ` · avant ${jourMois(avant)}` : ''}</span></>}
          </div>{contact.contactPhone?.trim() && <a className="nc-call" href={telHref(contact.contactPhone)} aria-label={`Appeler ${contact.contactName || contact.title}`}><Phone size={18} aria-hidden="true" /></a>}</div>
        </div></div>}
        {idees.length > 0 && <div className="nc-br" style={{ ['--c' as string]: 'var(--a-prod)' }}><div className="nc-win" style={{ ['--c' as string]: 'var(--a-prod)' }}>
          <div className="nc-wh"><Beer size={16} aria-hidden="true" />Bières<button type="button" onClick={() => onOuvrir('bieres')}>Ouvrir<ChevronRight size={14} aria-hidden="true" /></button></div>
          {idees.map((i) => <div key={i.id} className="nc-wb"><div><b style={{ fontSize: 16 }}>{i.title}</b>{i.description && <span className="nc-px">{i.description}</span>}</div></div>)}
        </div></div>}
      </div>
    </div>
    {reste.length > 0 && taches[0] && <div className="nc-rest">Reste à poser{reste.map((r) => <button key={r} type="button" className="nc-add" onClick={() => onPoser(taches[0] as unknown as CreativeItem)}>{r === 'Bière' ? <Beer size={14} aria-hidden="true" /> : r === 'Date' ? <Calendar size={14} aria-hidden="true" /> : null}{r}</button>)}</div>}
  </>;
};
