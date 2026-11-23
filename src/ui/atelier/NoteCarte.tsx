import React from 'react';
import { ArrowRight, Beer, Calendar, Check, Phone, Users, Wallet } from 'lucide-react';
import type { CreativeItem } from '../../types';
import { PastilleStyle } from './PastilleStyle';
import { chf, dateEcheance, genreDe, instantNote, jourMois, marge, rappelDe, styleDe, type Genre } from './atelierModel';

export const MARGE_GENRE: Record<Genre, string> = {
  biere: 'bg-ebc-amber', contact: 'bg-water', faire: 'bg-area-agenda', tarif: 'bg-hop'
};
export const FOND_TIROIR: Record<Genre, string> = {
  biere: 'bg-ebc-amber/20', contact: 'bg-water/15', faire: 'bg-area-agenda/15', tarif: 'bg-hop/15'
};

export const Tiroir: React.FC<{ genre: Genre; children: React.ReactNode }> = ({ genre, children }) => (
  <span className={`inline-flex min-h-6 items-center gap-1 rounded-full px-2 text-sm text-cave-50 ${FOND_TIROIR[genre]}`}>{children}</span>
);

const ICONE = 'h-3.5 w-3.5 shrink-0';
const BOUTON_ACTION = 'relative ml-auto inline-flex min-h-8 items-center gap-1 rounded-control border border-cave-700 bg-cave-850 px-3 text-sm text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']';

/** Une note du carnet (e9na) : une marge de couleur par genre, le texte, la date de saisie, puis ce qui la range et son geste. */
export const NoteCarte: React.FC<{
  item: CreativeItem; tva: number;
  onOuvrir: (i: CreativeItem) => void; onCocher: (i: CreativeItem) => void; onEnRecette: (i: CreativeItem) => void;
}> = ({ item, tva, onOuvrir, onCocher, onEnRecette }) => {
  const genre = genreDe(item);
  if (!genre) return null;
  const instant = instantNote(item);
  const date = instant != null ? jourMois(instant) : undefined;
  const fait = item.status === 'done';
  // Tarif : le titre est la note, la description n'est que le format (« 33 cl »). À faire : le titre est la tâche.
  const texte = genre === 'faire' || genre === 'tarif' ? item.title : item.description?.trim() || item.title;
  const detail = genre === 'faire' ? item.description?.trim() : undefined;
  const m = marge(item.targetPrice, item.estimatedCost, tva);
  const style = genre === 'biere' ? styleDe(item) : undefined;

  const corps = (
    <button type="button" aria-label={`Ouvrir : ${item.title}`} onClick={() => onOuvrir(item)} className="min-w-0 flex-1 text-left">
      {/* La date a sa colonne : le texte ne passe jamais dessous (« 2,10.06.11 » collé, q7). */}
      <span className={`flex items-start gap-3 text-base leading-snug ${fait ? 'text-cave-400 line-through' : 'text-cave-50'}`}>
        <span className="min-w-0 flex-1">{texte}</span>
        {date && <span className="shrink-0 pt-0.5 font-mono text-xs text-cave-400 no-underline">{date}</span>}
      </span>
      {detail && <span className="mt-0.5 block text-sm text-cave-400">{detail}</span>}
    </button>
  );

  return (
    <article data-genre={genre} className="relative overflow-hidden rounded-2xl border border-cave-800 bg-cave-900 py-2.5 pl-[18px] pr-3">
      <span className={`absolute inset-y-0 left-0 w-[5px] ${MARGE_GENRE[genre]}`} aria-hidden="true" />
      {genre === 'faire' ? (
        <div className="flex items-start gap-2.5">
          <button type="button" role="checkbox" aria-checked={fait} aria-label={fait ? 'Décocher' : 'Cocher'} onClick={() => onCocher(item)}
            className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-area-agenda after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] ${fait ? 'bg-area-agenda text-[rgb(var(--cave-950))]' : ''}`}>
            {fait && <Check className="h-4 w-4" aria-hidden="true" />}
          </button>
          {corps}
        </div>
      ) : corps}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {genre === 'biere' && (item.description?.trim() ? <Tiroir genre="biere"><Beer className={ICONE} aria-hidden="true" />{item.title}</Tiroir> : null)}
        {genre === 'biere' && style && <PastilleStyle style={style} />}
        {genre === 'biere' && (
          <button type="button" onClick={() => onEnRecette(item)} className={BOUTON_ACTION}>En recette <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        )}
        {genre === 'contact' && <>
          {item.description?.trim() || item.contactName
            ? <Tiroir genre="contact"><Users className={ICONE} aria-hidden="true" />{item.title}{item.contactName ? ` · ${item.contactName}` : ''}</Tiroir>
            : null}
          {rappelDe(item) && <span data-pastille="rappeler" className="inline-flex min-h-6 items-center rounded-full bg-area-agenda/20 px-2.5 text-sm text-cave-50">rappeler</span>}
          {item.contactPhone
            ? <a href={`tel:${item.contactPhone.replace(/\s+/g, '')}`} className={BOUTON_ACTION}><Phone className="h-4 w-4" aria-hidden="true" />Appeler</a>
            : <span className="text-xs text-cave-400">pas de numéro noté</span>}
        </>}
        {genre === 'faire' && (item.date
          ? <Tiroir genre="faire"><Calendar className={ICONE} aria-hidden="true" />{dateEcheance(item.date)}</Tiroir>
          : <span className="text-xs text-cave-400">sans date</span>)}
        {genre === 'tarif' && <>
          {item.targetPrice != null
            ? <Tiroir genre="tarif"><Wallet className={ICONE} aria-hidden="true" />{item.description?.trim() && item.description.length <= 16 ? `${item.description} · ` : ''}{chf(item.targetPrice)}</Tiroir>
            : <span className="text-xs text-cave-400">prix non saisi</span>}
          {item.targetPrice != null && <span className="text-xs text-cave-400">{m != null ? `marge ${chf(m)}` : 'coût non saisi'}</span>}
        </>}
      </div>
    </article>
  );
};
