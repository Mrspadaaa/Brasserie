// Barre d'outils du Stock, reprise de la maquette choisie sy/fA : recherche, pastilles d'état,
// ligne de filtre « Filtre Houblons : 19 articles · Tout voir », ligne « Trié par … ▾ ». Les règles sont dans domain/stock.
import React, { useEffect, useState } from 'react';
import { Search, X, Star, ArrowUpDown } from 'lucide-react';
import type { ComptesEtats, TriListe } from '../../domain/stock/liste';
import { TRIS, phraseTri } from '../../domain/stock/liste';
import { JOURS_RECENTS, type Puce } from '../../domain/stock/filtresDynamiques';
import { motArticles, type FiltreListe, type TexteFiltre } from '../../domain/stock/listeFiltres';
import './jetons-outils.css';
import './outils.css';
import './paysageBas.css';

export type VueStock = 'etagere' | 'recompter';

/** Téléphone couché (même seuil que paysageBas.css) : la barre n'a de place que pour un mot. */
const PAYSAGE_BAS = '(orientation: landscape) and (max-height: 480px)';
export const PLACEHOLDER_RECHERCHE = 'Rechercher : nom, fournisseur, souche…';
export const PLACEHOLDER_RECHERCHE_COURT = 'Rechercher…';
function usePaysageBas(): boolean {
  const lire = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PAYSAGE_BAS).matches;
  const [bas, setBas] = useState(lire);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(PAYSAGE_BAS);
    const suivre = () => setBas(m.matches);
    suivre();
    m.addEventListener('change', suivre);
    return () => m.removeEventListener('change', suivre);
  }, []);
  return bas;
}

/** La recherche : un champ de texte (jamais type="number"), l'action d'ajout à sa droite. */
export function Recherche({ q, onQ, action }: { q: string; onQ: (q: string) => void; action?: React.ReactNode }) {
  const bas = usePaysageBas();
  return (
    <div className="flex items-center gap-2">
      <label className="sz-ch min-w-0 flex-1">
        <Search size={18} aria-hidden="true" />
        <input type="search" inputMode="search" name="stock_recherche" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true"
          value={q} onChange={(e) => onQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} aria-label="Rechercher dans le stock" placeholder={bas ? PLACEHOLDER_RECHERCHE_COURT : PLACEHOLDER_RECHERCHE} />
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

/** Lu à voix haute : « manque » et « bas » disent à quoi ils servent (les deux sont à commander ; « au moins » = quantité inconnue). */
export const libelleEtat = (id: FiltreListe, mot: string, n: string, c: ComptesEtats): string => {
  if (id === 'manque') return c.manquePlus > 0 ? `${mot} : ${c.manque} à commander, plus ${c.manquePlus} « au moins »` : `${mot} : ${n} à commander`;
  if (id === 'bas') return `${mot} : ${n} pile au seuil, déjà à commander`;
  return `${mot} : ${n}`;
};

/**
 * Les pastilles de filtre (D420, d1a et point 2) : seulement celles qui ont des articles aujourd'hui (puces), dans l'ordre de pertinence, sur une ligne ;
 * un seul filtre à la fois, re-toucher la pastille active l'ôte (✕). L'étoile des épinglés est un rond à droite de la rangée (maquette d1a), jamais une pastille.
 */
export function Pastilles({ puces, comptes, filtre, onFiltre, nEpingles }: { puces: ReadonlyArray<Puce>; comptes: ComptesEtats; filtre: FiltreListe | null; onFiltre: (f: FiltreListe | null) => void; nEpingles: number }) {
  const bascule = (f: FiltreListe) => onFiltre(filtre === f ? null : f);
  return (
    <div className="sz-puces" role="group" aria-label="Filtrer par état">
      {puces.map((p) => {
        const n = p.id === 'manque' ? nombreEtat(comptes, 'manque') : String(p.n);
        const aria = p.id === 'brassin' ? `Pour le prochain brassin : ${n} article${p.n > 1 ? 's' : ''}` : p.id === 'recents' ? `Récents : ${n} article${p.n > 1 ? 's' : ''} qui ont bougé ces ${JOURS_RECENTS} derniers jours` : libelleEtat(p.id, p.mot, n, comptes);
        return (
          <button key={p.id} type="button" className={`sz-pu${filtre === p.id ? ' sz-on' : ''}`} data-f={p.id} aria-pressed={filtre === p.id} aria-label={aria} onClick={() => bascule(p.id)}>
            {p.mot} <b>{n}</b><span className="sz-pux" aria-hidden="true">✕</span>
          </button>
        );
      })}
      <button type="button" className={`sz-etoile${filtre === 'epingles' ? ' sz-on' : ''}`} data-f="epingles" aria-pressed={filtre === 'epingles'} aria-label={nEpingles > 0 ? `Épinglés : ${nEpingles}` : 'Épinglés : aucun'} onClick={() => bascule('epingles')}>
        <Star size={18} aria-hidden="true" />
      </button>
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
const MOT_TRI: Record<string, string> = { Malts: 'couleur', Houblons: 'α', Levures: 'date' };
/** D2a : la puce de tri de la barre d'un rayon (« ↕ couleur »), sur la même ligne que le nom ; son menu garde les quatre tris. */
export function PuceTri({ tri, rayon, onTri }: { tri: TriListe; rayon: string; onTri: (t: TriListe) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const mot = tri === 'defaut' ? (MOT_TRI[rayon] ?? 'ordre') : tri === 'nom' ? 'nom' : tri === 'quantite' ? 'quantité' : 'manque';
  return (
    <span className="sz-puce-tri" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="sz-pt" aria-expanded={ouvert} aria-haspopup="menu" aria-label={`Trier ${rayon} : ${mot}`} onClick={() => setOuvert((o) => !o)}>
        <ArrowUpDown size={16} aria-hidden="true" /> {mot}
      </button>
      {ouvert && (
        <div role="menu" aria-label="Trier la liste" className="sz-pt-menu">
          {TRIS.map((t) => (
            <button key={t.id} type="button" role="menuitemradio" aria-checked={tri === t.id} onClick={() => { onTri(t.id); setOuvert(false); }}>
              <span aria-hidden="true">{tri === t.id ? '●' : '○'}</span> {t.phrase}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

