/**
 * D437 (23.11, variante A « Puces de domaines », filtres-domaine/page.html) : le picto de chaque domaine (sa couleur, a-puces.png), la rangée
 * de puces de la liste et la pastille « Brasserie ▾ » du carnet ouvert, qui ouvre les cinq domaines (carnet-domaine.png).
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { DOMAINE_LIBELLE, DOMAINES, type DomaineCarnet } from '../../domain/carnets/domaines';
import './domaines.css';

const TRACES: Record<DomaineCarnet, string[]> = {
  local: ['M3 10.5 12 3l9 7.5', 'M5 9v12h14V9', 'M10 21v-6h4v6'],
  brasserie: ['M6 5a6 2 0 0 1 12 0v7l-6 5.5L6 12z', 'M6 12v10M18 12v10', 'M12 17.5V21'],
  meuble: ['M6.5 2.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V4a1.5 1.5 0 0 1 1.5-1.5z', 'M12 2.5v17', 'M10 10v2.5M14 10v2.5', 'M6.5 19.5V22M17.5 19.5V22'],
  outils: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z'],
  papiers: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8M16 17H8M10 9H8']
};

export function PictoDomaine({ d, taille = 16 }: { d: DomaineCarnet; taille?: number }) {
  return (
    <svg className={`cnd-picto cnd-${d}`} width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {TRACES[d].map(t => <path key={t} d={t} />)}
    </svg>
  );
}

/**
 * La rangée de la liste : la loupe (un toucher ouvre le champ de recherche, Q-2 C), « Tous 20 », puis chaque domaine qui a un carnet, avec
 * son nombre. Un toucher sur un domaine le filtre ; sur le domaine actif ou sur Tous, tout revient.
 */
export function RangeeDomaines(p: {
  tous: number; domaines: { d: DomaineCarnet; n: number }[]; actif: DomaineCarnet | null; onDomaine: (d: DomaineCarnet | null) => void;
  q: string; onQ: (q: string) => void;
}) {
  const [ouvert, setOuvert] = useState(!!p.q);
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ouvert && !p.q) champ.current?.focus(); }, [ouvert]); // eslint-disable-line react-hooks/exhaustive-deps
  const recherche = ouvert || !!p.q;
  return (
    <div className="cn-filtre cnd-rangee" role="search">
      {recherche
        ? <input ref={champ} type="search" className="cn-recherche cnd-recherche" placeholder="Chercher un carnet" aria-label="Chercher un carnet" value={p.q}
            onChange={e => p.onQ(e.target.value)} onBlur={() => { if (!p.q.trim()) setOuvert(false); }} onKeyDown={e => { if (e.key === 'Escape') { p.onQ(''); setOuvert(false); } }} />
        : <button type="button" className="cnd-loupe" aria-label="Chercher un carnet" onClick={() => setOuvert(true)}><Search size={18} aria-hidden /></button>}
      <button type="button" className="cnd-puce" data-domaine="tous" aria-pressed={p.actif === null} onClick={() => p.onDomaine(null)}>
        Tous <span className="cnd-n">{p.tous}</span>
      </button>
      {p.domaines.map(({ d, n }) => (
        <button key={d} type="button" className="cnd-puce" data-domaine={d} aria-pressed={p.actif === d} onClick={() => p.onDomaine(p.actif === d ? null : d)}>
          <PictoDomaine d={d} /> {DOMAINE_LIBELLE[d]} <span className="cnd-n">{n}</span>
        </button>
      ))}
    </div>
  );
}

/** La pastille du carnet ouvert : son domaine et ▾ ; un toucher ouvre les cinq domaines, la coche sur le sien. Sans domaine : « Domaine ▾ ». */
export function PastilleDomaine({ domaine, onDomaine }: { domaine: DomaineCarnet | null; onDomaine?: (d: DomaineCarnet) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const hors = (e: PointerEvent) => { if (!boite.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('pointerdown', hors); document.addEventListener('keydown', echap);
    return () => { document.removeEventListener('pointerdown', hors); document.removeEventListener('keydown', echap); };
  }, [ouvert]);
  if (!onDomaine && !domaine) return null;
  return (
    <span className="cnd-pastille-boite" ref={boite}>
      <button type="button" className="cnd-pastille" data-domaine-carnet={domaine ?? ''} aria-haspopup="menu" aria-expanded={ouvert} disabled={!onDomaine}
        aria-label={`Domaine : ${domaine ? DOMAINE_LIBELLE[domaine] : 'aucun'}, changer`} onClick={() => setOuvert(v => !v)}>
        {domaine && <PictoDomaine d={domaine} />}<span>{domaine ? DOMAINE_LIBELLE[domaine] : 'Domaine'}</span>{onDomaine && <span className="cnd-fleche" aria-hidden>▾</span>}
      </button>
      {ouvert && onDomaine && (
        <span className="cnd-menu" role="menu" aria-label="Domaine du carnet">
          {DOMAINES.map(d => (
            <button key={d} type="button" role="menuitemradio" aria-checked={d === domaine} className="cnd-menu-item" onClick={() => { setOuvert(false); if (d !== domaine) onDomaine(d); }}>
              <PictoDomaine d={d} taille={20} /><span className="cn-sp">{DOMAINE_LIBELLE[d]}</span>{d === domaine && <Check size={18} aria-hidden />}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
