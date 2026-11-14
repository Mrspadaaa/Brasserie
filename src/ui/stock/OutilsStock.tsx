// Barre d'outils du Stock, reprise de la maquette choisie sy/fA : bascule Étagère | Recompter, recherche, pastilles d'état,
// ligne de filtre « Filtre Houblons : 19 articles · Tout voir », ligne « Trié par … ▾ ». Les règles sont dans domain/stock.
import React, { useState } from 'react';
import { Search, X, Rows3, ClipboardCheck } from 'lucide-react';
import type { ComptesEtats, TriListe } from '../../domain/stock/liste';
import { ETATS, TRIS, phraseTri } from '../../domain/stock/liste';
import { motArticles, type FiltreListe, type TexteFiltre } from '../../domain/stock/listeFiltres';
import './jetons-outils.css';
import './outils.css';

export type VueStock = 'etagere' | 'recompter';

export function BasculeVue({ vue, onVue }: { vue: VueStock; onVue: (v: VueStock) => void }) {
  return (
    <div className="sz-seg" role="tablist" aria-label="Vue du stock" data-vue={vue}>
      <i className="sz-thumb" />
      <button type="button" role="tab" data-vue-btn="etagere" aria-selected={vue === 'etagere'} onClick={() => onVue('etagere')}><Rows3 size={18} aria-hidden="true" />Étagère</button>
      <button type="button" role="tab" data-vue-btn="recompter" aria-selected={vue === 'recompter'} onClick={() => onVue('recompter')}><ClipboardCheck size={18} aria-hidden="true" />Recompter</button>
    </div>
  );
}

/** La recherche : un champ de texte (jamais type="number"), l'action d'ajout à sa droite. */
export function Recherche({ q, onQ, action }: { q: string; onQ: (q: string) => void; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="sz-ch min-w-0 flex-1">
        <Search size={18} aria-hidden="true" />
        <input type="search" inputMode="search" name="stock_recherche" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true"
          value={q} onChange={(e) => onQ(e.target.value)} aria-label="Rechercher dans le stock" placeholder="Rechercher : nom, fournisseur, souche…" />
        {q && <button type="button" className="sz-xc" aria-label="Effacer la recherche" onClick={() => onQ('')}><X size={16} aria-hidden="true" /></button>}
      </label>
      {action}
    </div>
  );
}

/** « manque 3 + 1 ? » : trois manques connus et un plancher (« au moins »). Les autres pastilles : un seul nombre. */
const nombreEtat = (c: ComptesEtats, id: FiltreListe): string => {
  if (id === 'manque') return c.manquePlus > 0 ? `${c.manque} + ${c.manquePlus} ?` : String(c.manque);
  if (id === 'bas' || id === 'epuise' || id === 'compter' || id === 'ddm') return String(c[id]);
  return '0';
};

/** Les pastilles d'état : un seul filtre à la fois, re-toucher la pastille active l'ôte (✕). « Épinglés » reste en sixième, seulement s'il y en a. */
export function Pastilles({ comptes, filtre, onFiltre, nEpingles }: { comptes: ComptesEtats; filtre: FiltreListe | null; onFiltre: (f: FiltreListe | null) => void; nEpingles: number }) {
  const bascule = (f: FiltreListe) => onFiltre(filtre === f ? null : f);
  const un = (id: FiltreListe, mot: string, n: string) => (
    <button key={id} type="button" className={`sz-pu${filtre === id ? ' sz-on' : ''}`} data-f={id} aria-pressed={filtre === id} onClick={() => bascule(id)}>
      {mot} <b>{n}</b><span className="sz-pux" aria-hidden="true">✕</span>
    </button>
  );
  return (
    <div className="sz-puces" role="group" aria-label="Filtrer par état">
      {ETATS.map((e) => un(e.id, e.mot, nombreEtat(comptes, e.id)))}
      {(nEpingles > 0 || filtre === 'epingles') && un('epingles', '★ épinglés', String(nEpingles))}
    </div>
  );
}

/** « Filtre Houblons et recherche « cit » : 4 articles » + « Tout voir » (efface le filtre ET la recherche). */
export function LigneFiltre({ texte, onToutVoir }: { texte: TexteFiltre | null; onToutVoir: () => void }) {
  if (!texte) return null;
  return (
    <div className="sz-fli" role="status" aria-label="Filtre en cours">
      <span>
        {texte.filtre && <>Filtre <b>{texte.filtre}</b></>}
        {texte.filtre && texte.recherche && ' et '}
        {texte.recherche && <>{texte.filtre ? 'recherche' : 'Recherche'} <b>« {texte.recherche} »</b></>}
        {' : '}{motArticles(texte.n)}
      </span>
      <button type="button" className="sz-tv" onClick={onToutVoir}>Tout voir</button>
    </div>
  );
}

/** « Trié par couleur (malts), amertume (houblons), date (levures) ▾ » : le tri écrit en clair, et le menu des quatre tris. */
export function LigneTri({ tri, onTri }: { tri: TriListe; onTri: (t: TriListe) => void }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="px-[10px]">
      <div className="sz-tri">
        <button type="button" className="sz-tb text-left" aria-expanded={ouvert} aria-haspopup="menu" onClick={() => setOuvert((o) => !o)}>
          Trié par {phraseTri(tri)} ▾
        </button>
      </div>
      {ouvert && (
        <div role="menu" aria-label="Trier la liste" className="mb-1 rounded-[10px] border border-[var(--l1-strong)] bg-[var(--l1-page)]">
          {TRIS.map((t) => (
            <button key={t.id} type="button" role="menuitemradio" aria-checked={tri === t.id}
              className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-[14px] text-[var(--l1-t0)]"
              onClick={() => { onTri(t.id); setOuvert(false); }}>
              <span aria-hidden="true" className="w-4">{tri === t.id ? '●' : '○'}</span>{t.phrase}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
